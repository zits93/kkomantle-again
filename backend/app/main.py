import json
import uuid
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.services.connection_manager import connection_manager
from app.services.game_state import game_state
from app.services.hall_of_fame import hall_of_fame_service
from app.services.chat_manager import chat_service
from app.services.word_service import word_service

app = FastAPI(title=settings.PROJECT_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup: initialize first secret target word or restore active round
@app.on_event("startup")
def startup_event():
    if not game_state.has_active_round():
        initial_word = word_service.get_random_word()
        game_state.set_target_word(initial_word)
        print(f"🚀 Kkomantle Again backend started with new round. Target word: {initial_word}")
    else:
        print(f"🚀 Kkomantle Again backend resumed active round [{game_state.round_id}]. Target word: {game_state.target_word}")

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "roundId": game_state.round_id,
        "activeUsers": len(connection_manager.active_connections)
    }

@app.get("/api/hall-of-fame")
def get_hall_of_fame():
    return hall_of_fame_service.get_leaderboard()

@app.get("/api/game-state")
def get_current_game_state():
    return {
        "roundId": game_state.round_id,
        "totalWords": len(word_service.words_pool),
        "rankCutoffs": {
            "top10": 58.0,
            "top100": 45.0,
            "top1000": 24.0
        },
        "allGuesses": game_state.get_guesses_for_round(),
        "activeUsers": len(connection_manager.active_connections),
        "solvedBy": game_state.solved_by
    }

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    conn_id = f"conn_{uuid.uuid4().hex[:8]}"
    client_ip = websocket.client.host if websocket.client else "127.0.0.1"

    await connection_manager.connect(websocket, conn_id, client_ip)

    try:
        while True:
            raw_data = await websocket.receive_text()
            try:
                payload = json.loads(raw_data)
            except Exception:
                continue

            msg_type = payload.get("type")

            if msg_type == "join":
                nickname = payload.get("nickname", f"탐험가_{conn_id[:4]}")
                connection_manager.update_nickname(conn_id, nickname)

                # Send initial snapshot to joining client
                init_data = {
                    "type": "init",
                    "roundId": game_state.round_id,
                    "totalWords": len(word_service.words_pool),
                    "rankCutoffs": {
                        "top10": 58.0,
                        "top100": 45.0,
                        "top1000": 24.0
                    },
                    "activeUsers": connection_manager.get_user_list(),
                    "voteState": {
                        "activeUsers": len(connection_manager.active_connections),
                        "votes": len(game_state.once_more_voters),
                        "requiredVotes": 1 if len(connection_manager.active_connections) <= 1 else 2,
                        "hasVoted": conn_id in game_state.once_more_voters,
                    },
                    "hallOfFame": hall_of_fame_service.get_leaderboard(),
                    "chatHistory": chat_service.get_history(),
                    "allGuesses": game_state.get_guesses_for_round()
                }
                await connection_manager.send_personal(conn_id, init_data)

                # Broadcast updated user list to everyone
                await connection_manager.broadcast({
                    "type": "user_list",
                    "users": connection_manager.get_user_list()
                })

            elif msg_type == "change_nickname":
                new_nick = payload.get("nickname")
                if new_nick:
                    connection_manager.update_nickname(conn_id, new_nick)
                    await connection_manager.broadcast({
                        "type": "user_list",
                        "users": connection_manager.get_user_list()
                    })

            elif msg_type == "submit_guess":
                raw_word = payload.get("word", "").strip()
                nickname = payload.get("nickname", "익명")
                if not raw_word:
                    continue

                # 1. Morphological normalization & typo auto-correction
                norm_res = word_service.normalize_and_validate(raw_word)
                if not norm_res["isValid"]:
                    await connection_manager.send_personal(conn_id, {
                        "type": "guess_error",
                        "word": raw_word,
                        "message": norm_res.get("message", "사전에 없는 단어입니다.")
                    })
                    continue

                clean_word = norm_res["word"]
                notice = norm_res.get("notice")

                eval_result = word_service.evaluate_guess(clean_word, game_state.target_word, notice=notice)
                guess_item = game_state.record_guess(
                    user_id=conn_id,
                    nickname=nickname,
                    client_ip=client_ip,
                    word=clean_word,
                    similarity=eval_result["similarity"],
                    rank=eval_result.get("rank"),
                    notice=notice
                )

                if eval_result["isAnswer"]:
                    # Winner event handling
                    # 1. To the winner: reveal answer and celebrate
                    await connection_manager.send_personal(conn_id, {
                        "type": "win_event",
                        "winnerNickname": nickname,
                        "answerWord": game_state.target_word,
                        "guess": guess_item
                    })

                    # 2. To everyone else: notify winner without revealing word in guess list!
                    for other_id, other_data in connection_manager.active_connections.items():
                        if other_id != conn_id:
                            await connection_manager.send_personal(other_id, {
                                "type": "win_event",
                                "winnerNickname": nickname,
                                "answerWord": None
                            })

                    # 3. Broadcast system chat announcement & updated hall of fame
                    announcement = chat_service.add_message(
                        sender="시스템",
                        text=f"🎉 {nickname} 님이 정답을 맞추셨습니다! 축하합니다!",
                        msg_type="notice"
                    )
                    await connection_manager.broadcast({"type": "chat_message", "message": announcement})
                    await connection_manager.broadcast({
                        "type": "hall_of_fame_update",
                        "hallOfFame": hall_of_fame_service.get_leaderboard()
                    })
                else:
                    # Regular guess: broadcast to all
                    await connection_manager.broadcast({
                        "type": "new_guess",
                        "guess": guess_item
                    })

            elif msg_type == "vote_once_more":
                total_users = len(connection_manager.active_connections)
                vote_result = game_state.vote_once_more(conn_id, total_users)

                if vote_result["should_reset"]:
                    # Reveal previous answer to everyone and start new round
                    prev_word = game_state.target_word
                    new_word = word_service.get_random_word(exclude=prev_word)
                    game_state.set_target_word(new_word)

                    reset_msg = chat_service.add_message(
                        sender="시스템",
                        text=f"🔄 투표 완료! 이전 정답은 [{prev_word}] 였습니다. 새로운 단어로 라운드가 시작됩니다!",
                        msg_type="notice"
                    )
                    await connection_manager.broadcast({"type": "chat_message", "message": reset_msg})
                    await connection_manager.broadcast({
                        "type": "round_reset",
                        "roundId": game_state.round_id,
                        "previousAnswer": prev_word
                    })
                else:
                    # Broadcast vote progress
                    await connection_manager.broadcast({
                        "type": "vote_update",
                        "voteState": {
                            "activeUsers": total_users,
                            "votes": vote_result["votes"],
                            "requiredVotes": vote_result["requiredVotes"],
                            "hasVoted": False
                        }
                    })

            elif msg_type == "chat":
                text = payload.get("text", "").strip()
                nickname = payload.get("nickname", "익명")
                sub_type = payload.get("msgType", "chat")

                if sub_type == "answer_reveal":
                    prev_word = game_state.target_word
                    new_word = word_service.get_random_word(exclude=prev_word)
                    game_state.set_target_word(new_word)

                    reveal_msg = chat_service.add_message(
                        sender="시스템",
                        text=f"📢 {nickname}님의 요청으로 정답이 공개되었습니다: [{prev_word}] (새로운 단어로 교체됩니다)",
                        msg_type="notice"
                    )
                    await connection_manager.broadcast({"type": "chat_message", "message": reveal_msg})
                    await connection_manager.broadcast({
                        "type": "round_reset",
                        "roundId": game_state.round_id,
                        "previousAnswer": prev_word
                    })
                elif text:
                    msg = chat_service.add_message(sender=nickname, text=text, msg_type="chat")
                    await connection_manager.broadcast({"type": "chat_message", "message": msg})

    except WebSocketDisconnect:
        connection_manager.disconnect(conn_id)
        await connection_manager.broadcast({
            "type": "user_list",
            "users": connection_manager.get_user_list()
        })
    except Exception as e:
        connection_manager.disconnect(conn_id)
