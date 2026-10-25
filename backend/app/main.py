import json
import uuid
import os
import asyncio
from typing import Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.config import settings
from app.services.connection_manager import connection_manager
from app.services.game_state import game_state
from app.services.hall_of_fame import hall_of_fame_service
from app.services.chat_manager import chat_service
from app.services.word_service import word_service
from app.services.user_service import user_service
from app.services.embedding_service import embedding_service
from app.services.db_queue import db_queue

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
    # Warmup neural embedding engine proactive to eliminate initial latency
    embedding_service.warmup()

    if not game_state.has_active_round():
        recent_used = game_state.get_recent_target_words(100)
        initial_word = word_service.get_random_word(exclude=recent_used)
        game_state.set_target_word(initial_word)
        print(f"🚀 Kkomantle Again backend started with new round. Target word: {initial_word}")
    else:
        print(f"🚀 Kkomantle Again backend resumed active round [{game_state.round_id}] (Target word restored, {len(game_state.all_guesses)} guesses restored).")

@app.on_event("shutdown")
def shutdown_event():
    db_queue.flush_and_close()
    print("🛑 Kkomantle Again backend stopped cleanly. Database queue flushed.")

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

@app.get("/api/chat")
def get_chat_history():
    return chat_service.get_history()

@app.post("/api/chat")
async def api_send_chat(payload: dict):
    nickname = payload.get("nickname", "익명").strip() or "익명"
    text = payload.get("text", "").strip()
    if not text:
        return {"success": False, "error": "메시지를 입력해주세요."}
    msg = chat_service.add_message(sender=nickname, text=text, msg_type="chat")
    await connection_manager.broadcast({"type": "chat_message", "message": msg})
    return {"success": True, "message": msg}

@app.get("/api/users/check")
def check_user_nickname(nickname: str, request: Request):
    client_ip = request.client.host if request.client else "127.0.0.1"
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        client_ip = forwarded.split(",")[0].strip()
    return user_service.check_nickname(nickname, client_ip)

@app.post("/api/users/confirm")
async def confirm_user_nickname(payload: dict, request: Request):
    nickname = payload.get("nickname", "").strip()
    if not nickname:
        return {"error": "닉네임이 필요합니다."}
    client_ip = request.client.host if request.client else "127.0.0.1"
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        client_ip = forwarded.split(",")[0].strip()
    return user_service.confirm_user(nickname, client_ip)

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

async def handle_guess_submission(
    raw_word: str,
    nickname: str,
    client_ip: str,
    conn_id: Optional[str] = None
) -> dict:
    # 1. Non-blocking parallel morphological normalization
    norm_res = await asyncio.to_thread(word_service.normalize_and_validate, raw_word)
    if not norm_res["isValid"]:
        return {
            "success": False,
            "error": norm_res.get("message", "사전에 없는 단어입니다."),
            "word": raw_word
        }

    clean_word = norm_res["word"]
    notice = norm_res.get("notice")

    # 2. Non-blocking parallel vector evaluation with precomputed target vector and exact top 1000 ranks
    eval_result = await asyncio.to_thread(
        word_service.evaluate_guess_fast,
        clean_word,
        game_state.target_word,
        game_state.target_vector,
        notice,
        game_state.round_ranks,
        game_state.round_top_dots
    )
    guess_item = game_state.record_guess(
        user_id=conn_id or f"http_{uuid.uuid4().hex[:6]}",
        nickname=nickname,
        client_ip=client_ip,
        word=clean_word,
        similarity=eval_result["similarity"],
        rank=eval_result.get("rank"),
        notice=notice
    )

    if eval_result["isAnswer"]:
        # Winner event handling
        if conn_id:
            await connection_manager.send_personal(conn_id, {
                "type": "win_event",
                "winnerNickname": nickname,
                "answerWord": game_state.target_word,
                "guess": guess_item
            })

        for other_id in connection_manager.active_connections:
            if other_id != conn_id:
                await connection_manager.send_personal(other_id, {
                    "type": "win_event",
                    "winnerNickname": nickname,
                    "answerWord": None
                })

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
        # Regular guess: broadcast to all connected WebSocket clients
        await connection_manager.broadcast({
            "type": "new_guess",
            "guess": guess_item
        })

    return {
        "success": True,
        "guess": guess_item,
        "isAnswer": eval_result["isAnswer"],
        "answerWord": game_state.target_word if eval_result["isAnswer"] else None
    }

@app.post("/api/guess")
async def api_submit_guess(payload: dict, request: Request):
    raw_word = payload.get("word", "").strip()
    nickname = payload.get("nickname", "익명").strip() or "익명"
    if not raw_word:
        return {"success": False, "error": "단어를 입력해주세요."}

    client_ip = request.client.host if request.client else "127.0.0.1"
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        client_ip = forwarded.split(",")[0].strip()

    return await handle_guess_submission(raw_word, nickname, client_ip)

@app.post("/api/vote")
async def api_vote_once_more(payload: dict, request: Request):
    client_ip = request.client.host if request.client else "127.0.0.1"
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        client_ip = forwarded.split(",")[0].strip()
    pseudo_id = f"http_{client_ip}"
    total_users = max(1, len(connection_manager.active_connections))
    vote_result = game_state.vote_once_more(pseudo_id, total_users)

    if vote_result["should_reset"]:
        prev_word = game_state.target_word
        recent_used = game_state.get_recent_target_words(100)
        recent_used.add(prev_word)
        new_word = word_service.get_random_word(exclude=recent_used)
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
        await connection_manager.broadcast({
            "type": "vote_update",
            "voteState": {
                "activeUsers": total_users,
                "votes": vote_result["votes"],
                "requiredVotes": vote_result["requiredVotes"],
                "hasVoted": True
            }
        })
    return vote_result

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    conn_id = f"conn_{uuid.uuid4().hex[:8]}"
    forwarded = websocket.headers.get("x-forwarded-for")
    if forwarded:
        client_ip = forwarded.split(",")[0].strip()
    elif websocket.client:
        client_ip = websocket.client.host
    else:
        client_ip = "127.0.0.1"

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
                user_service.confirm_user(nickname, client_ip)

                top_dots = game_state.round_top_dots
                top10_c = round(embedding_service._scale_similarity(float(top_dots[9])), 1) if len(top_dots) >= 10 else 58.0
                top100_c = round(embedding_service._scale_similarity(float(top_dots[99])), 1) if len(top_dots) >= 100 else 45.0
                top1000_c = round(embedding_service._scale_similarity(float(top_dots[-1])), 1) if len(top_dots) >= 1000 else 24.0

                # Send initial snapshot to joining client
                init_data = {
                    "type": "init",
                    "roundId": game_state.round_id,
                    "activeUsers": connection_manager.get_user_list(),
                    "allGuesses": game_state.get_guesses_for_round(),
                    "chatHistory": chat_service.get_history(),
                    "hallOfFame": hall_of_fame_service.get_leaderboard(),
                    "totalWords": len(word_service.words_pool),
                    "rankCutoffs": {
                        "top10": top10_c,
                        "top100": top100_c,
                        "top1000": top1000_c
                    },
                    "solvedBy": game_state.solved_by
                }
                await connection_manager.send_personal(conn_id, init_data)
                await connection_manager.broadcast({
                    "type": "user_list",
                    "users": connection_manager.get_user_list()
                })

            elif msg_type == "check_nickname":
                target_nick = payload.get("nickname", "").strip()
                res = user_service.check_nickname(target_nick, client_ip)
                await connection_manager.send_personal(conn_id, {
                    "type": "check_nickname_result",
                    **res
                })

            elif msg_type == "confirm_nickname":
                target_nick = payload.get("nickname", "").strip()
                if target_nick:
                    user_info = user_service.confirm_user(target_nick, client_ip)
                    connection_manager.update_nickname(conn_id, target_nick)
                    await connection_manager.send_personal(conn_id, {
                        "type": "nickname_confirmed",
                        "nickname": target_nick,
                        "userInfo": user_info
                    })
                    await connection_manager.broadcast({
                        "type": "user_list",
                        "users": connection_manager.get_user_list()
                    })

            elif msg_type == "change_nickname":
                new_nick = payload.get("nickname")
                if new_nick:
                    user_service.confirm_user(new_nick, client_ip)
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

                res = await handle_guess_submission(raw_word, nickname, client_ip, conn_id)
                if not res.get("success"):
                    await connection_manager.send_personal(conn_id, {
                        "type": "guess_error",
                        "word": raw_word,
                        "message": res.get("error", "사전에 없는 단어입니다.")
                    })

            elif msg_type == "vote_once_more":
                total_users = len(connection_manager.active_connections)
                vote_result = game_state.vote_once_more(conn_id, total_users)

                if vote_result["should_reset"]:
                    prev_word = game_state.target_word
                    recent_used = game_state.get_recent_target_words(100)
                    recent_used.add(prev_word)
                    new_word = word_service.get_random_word(exclude=recent_used)
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
                if text:
                    msg = chat_service.add_message(sender=nickname, text=text, msg_type="chat")
                    await connection_manager.broadcast({"type": "chat_message", "message": msg})

    except WebSocketDisconnect:
        connection_manager.disconnect(conn_id)
        await connection_manager.broadcast({
            "type": "user_list",
            "users": connection_manager.get_user_list()
        })
    except Exception as e:
        print(f"WS error for {conn_id}: {e}")
        import traceback
        traceback.print_exc()
        connection_manager.disconnect(conn_id)

# Mount frontend/dist for direct corporate intranet LAN access
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))
if os.path.exists(frontend_dist):
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/kkomantle-again/assets", StaticFiles(directory=assets_dir), name="gh_assets")
        app.mount("/assets", StaticFiles(directory=assets_dir), name="root_assets")

    @app.get("/")
    @app.get("/kkomantle-again")
    @app.get("/kkomantle-again/")
    def serve_frontend_index():
        index_file = os.path.join(frontend_dist, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return {"status": "ok", "message": "Kkomantle Again Backend"}
