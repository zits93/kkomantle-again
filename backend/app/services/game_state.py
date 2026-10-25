import time
import uuid
from typing import Set, Dict, Any, List, Optional
from app.services.hall_of_fame import hall_of_fame_service
from app.services.chat_manager import chat_service

class GameState:
    def __init__(self):
        self.round_id: str = f"round_{int(time.time())}"
        self.target_word: str = "인공지능"
        self.round_start_time: float = time.time()
        self.solved_by: Optional[str] = None
        self.once_more_voters: Set[str] = set()
        self.all_guesses: List[Dict[str, Any]] = []

    def set_target_word(self, word: str):
        self.round_id = f"round_{int(time.time())}"
        self.target_word = word.strip()
        self.round_start_time = time.time()
        self.solved_by = None
        self.once_more_voters.clear()
        self.all_guesses.clear()

    def vote_once_more(self, conn_id: str, total_active_users: int) -> Dict[str, Any]:
        self.once_more_voters.add(conn_id)
        current_votes = len(self.once_more_voters)
        required_votes = 1 if total_active_users <= 1 else 2

        should_reset = current_votes >= required_votes
        return {
            "should_reset": should_reset,
            "votes": current_votes,
            "requiredVotes": required_votes,
            "activeUsers": total_active_users
        }

    def record_guess(
        self,
        user_id: str,
        nickname: str,
        client_ip: str,
        word: str,
        similarity: float,
        rank: Optional[int] = None
    ) -> Dict[str, Any]:
        is_answer = (word == self.target_word)
        guess_item = {
            "id": f"g_{int(time.time()*1000)}_{uuid.uuid4().hex[:4]}",
            "userId": user_id,
            "nickname": nickname,
            "word": word,
            "similarity": 100.0 if is_answer else similarity,
            "rank": 1 if is_answer else rank,
            "timestamp": int(time.time() * 1000),
            "isAnswer": is_answer
        }

        # If it is NOT the secret answer, publish to all_guesses
        if not is_answer:
            self.all_guesses.insert(0, guess_item)
        else:
            # First person or someone solved it!
            if not self.solved_by:
                self.solved_by = nickname
            # Record in Hall of Fame
            hall_of_fame_service.record_win(nickname, client_ip)

        return guess_item

game_state = GameState()
