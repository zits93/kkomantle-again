import time
import uuid
import sqlite3
import os
from typing import Set, Dict, Any, List, Optional
from app.config import settings
from app.services.hall_of_fame import hall_of_fame_service

class GameState:
    def __init__(self, db_path: str = settings.DB_PATH):
        self.db_path = db_path
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        self._init_db()

        self.round_id: str = f"round_{int(time.time()*1000)}_{uuid.uuid4().hex[:6]}"
        self.target_word: str = "인공지능"
        self.round_start_time: float = time.time()
        self.solved_by: Optional[str] = None
        self.once_more_voters: Set[str] = set()
        self.all_guesses: List[Dict[str, Any]] = []
        self._is_restored: bool = False

        # Restore latest active round from database if available
        self._load_active_round()

    def has_active_round(self) -> bool:
        return self._is_restored and bool(self.target_word)

    def _get_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS game_rounds (
                    round_id TEXT PRIMARY KEY,
                    target_word TEXT NOT NULL,
                    is_active INTEGER DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS game_guesses (
                    id TEXT PRIMARY KEY,
                    round_id TEXT NOT NULL,
                    user_id TEXT,
                    nickname TEXT NOT NULL,
                    word TEXT NOT NULL,
                    similarity REAL NOT NULL,
                    rank INTEGER,
                    timestamp INTEGER NOT NULL,
                    is_answer INTEGER DEFAULT 0
                )
            """)
            conn.commit()

    def _load_active_round(self):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT round_id, target_word, created_at
                FROM game_rounds
                WHERE is_active = 1
                ORDER BY created_at DESC
                LIMIT 1
            """)
            row = cursor.fetchone()
            if row:
                self.round_id = row["round_id"]
                self.target_word = row["target_word"]
                self._is_restored = True
                # Load existing guesses for this active round
                cursor.execute("""
                    SELECT id, user_id as userId, nickname, word, similarity, rank, timestamp, is_answer as isAnswer
                    FROM game_guesses
                    WHERE round_id = ? AND is_answer = 0
                    ORDER BY timestamp DESC
                """, (self.round_id,))
                guess_rows = cursor.fetchall()
                self.all_guesses = [
                    {
                        "id": r["id"],
                        "userId": r["userId"],
                        "nickname": r["nickname"],
                        "word": r["word"],
                        "similarity": float(r["similarity"]),
                        "rank": r["rank"],
                        "timestamp": r["timestamp"],
                        "isAnswer": bool(r["isAnswer"])
                    }
                    for r in guess_rows
                ]
            else:
                # Initialize first round in DB
                cursor.execute("""
                    INSERT OR REPLACE INTO game_rounds (round_id, target_word, is_active)
                    VALUES (?, ?, 1)
                """, (self.round_id, self.target_word))
                conn.commit()

    def set_target_word(self, word: str):
        # Mark previous rounds inactive
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("UPDATE game_rounds SET is_active = 0 WHERE is_active = 1")
            self.round_id = f"round_{int(time.time()*1000)}_{uuid.uuid4().hex[:6]}"
            self.target_word = word.strip()
            self.round_start_time = time.time()
            self.solved_by = None
            self.once_more_voters.clear()
            self.all_guesses.clear()
            self._is_restored = True

            cursor.execute("""
                INSERT OR REPLACE INTO game_rounds (round_id, target_word, is_active)
                VALUES (?, ?, 1)
            """, (self.round_id, self.target_word))
            conn.commit()

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
        rank: Optional[int] = None,
        notice: Optional[str] = None
    ) -> Dict[str, Any]:
        is_answer = (word == self.target_word)
        guess_id = f"g_{int(time.time()*1000)}_{uuid.uuid4().hex[:4]}"
        now_ts = int(time.time() * 1000)

        guess_item = {
            "id": guess_id,
            "userId": user_id,
            "nickname": nickname,
            "word": word,
            "similarity": 100.0 if is_answer else similarity,
            "rank": 1 if is_answer else rank,
            "timestamp": now_ts,
            "isAnswer": is_answer,
            "notice": notice
        }

        # Persist to SQLite DB
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO game_guesses (id, round_id, user_id, nickname, word, similarity, rank, timestamp, is_answer)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                guess_id,
                self.round_id,
                user_id,
                nickname,
                word,
                guess_item["similarity"],
                guess_item["rank"],
                now_ts,
                1 if is_answer else 0
            ))
            conn.commit()

        # If it is NOT the secret answer, publish to all_guesses
        if not is_answer:
            self.all_guesses.insert(0, guess_item)
        else:
            if not self.solved_by:
                self.solved_by = nickname
            hall_of_fame_service.record_win(nickname, client_ip)

        return guess_item

    def get_guesses_for_round(self, round_id: Optional[str] = None) -> List[Dict[str, Any]]:
        target_round = round_id or self.round_id
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, user_id as userId, nickname, word, similarity, rank, timestamp, is_answer as isAnswer
                FROM game_guesses
                WHERE round_id = ? AND is_answer = 0
                ORDER BY timestamp DESC
            """, (target_round,))
            rows = cursor.fetchall()
            return [
                {
                    "id": r["id"],
                    "userId": r["userId"],
                    "nickname": r["nickname"],
                    "word": r["word"],
                    "similarity": float(r["similarity"]),
                    "rank": r["rank"],
                    "timestamp": r["timestamp"],
                    "isAnswer": bool(r["isAnswer"])
                }
                for r in rows
            ]

game_state = GameState()
