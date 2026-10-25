import time
import uuid
import sqlite3
import os
import numpy as np
from typing import Set, Dict, Any, List, Optional
from app.config import settings
from app.services.hall_of_fame import hall_of_fame_service
from app.services.user_service import user_service
from app.services.embedding_service import embedding_service
from app.services.db_queue import db_queue

class GameState:
    """
    Game state manager with zero-latency in-memory hot path and
    asynchronous background SQLite persistence for crash/power-outage durability.
    """
    def __init__(self, db_path: str = settings.DB_PATH):
        self.db_path = db_path
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        self._init_db()

        self.round_id: str = f"round_{int(time.time()*1000)}_{uuid.uuid4().hex[:6]}"
        self.target_word: str = "인공지능"
        self.target_vector: Optional[np.ndarray] = None
        self.round_ranks: Dict[str, int] = {}
        self.round_top_dots: np.ndarray = np.array([], dtype=np.float32)
        self.round_start_time: float = time.time()
        self.solved_by: Optional[str] = None
        self.once_more_voters: Set[str] = set()
        self.all_guesses: List[Dict[str, Any]] = []
        self._is_restored: bool = False

        # Restore latest active round and its guesses from database if available
        self._load_active_round()
        self._sync_target_vector()

    def has_active_round(self) -> bool:
        return self._is_restored and bool(self.target_word)

    def get_recent_target_words(self, limit: int = 100) -> Set[str]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT target_word
                FROM game_rounds
                ORDER BY created_at DESC
                LIMIT ?
            """, (limit,))
            return {row["target_word"] for row in cursor.fetchall()}

    def _get_connection(self):
        conn = sqlite3.connect(self.db_path, timeout=10.0)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("PRAGMA journal_mode = WAL;")
            cursor.execute("PRAGMA synchronous = NORMAL;")
            cursor.execute("PRAGMA temp_store = MEMORY;")
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS game_rounds (
                    round_id TEXT PRIMARY KEY,
                    target_word TEXT NOT NULL,
                    is_active INTEGER DEFAULT 1,
                    solved_by TEXT,
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
                    is_answer INTEGER DEFAULT 0,
                    notice TEXT
                )
            """)
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_guesses_round ON game_guesses(round_id, timestamp DESC)")
            conn.commit()

            # Ensure columns exist in case table was created with older schema
            try:
                cursor.execute("ALTER TABLE game_rounds ADD COLUMN solved_by TEXT;")
                conn.commit()
            except Exception:
                pass
            try:
                cursor.execute("ALTER TABLE game_guesses ADD COLUMN notice TEXT;")
                conn.commit()
            except Exception:
                pass

    def _sync_target_vector(self):
        """Precompute and cache target vector, top 1000 ranks, and dot cutoffs for ultra-fast exact ranking."""
        if self.target_word:
            try:
                self.target_vector = embedding_service.get_vector(self.target_word)
                self.round_ranks, self.round_top_dots = embedding_service.precompute_top_ranks(self.target_word)
            except Exception as e:
                print(f"Failed to sync target vector and ranks: {e}")
                self.target_vector = None
                self.round_ranks = {}
                self.round_top_dots = np.array([], dtype=np.float32)

    def _load_active_round(self):
        """Restore active round and its guesses from database on startup (Crash / Blackout recovery)."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT round_id, target_word, solved_by, created_at
                FROM game_rounds
                WHERE is_active = 1
                ORDER BY created_at DESC
                LIMIT 1
            """)
            row = cursor.fetchone()
            if row:
                self.round_id = row["round_id"]
                self.target_word = row["target_word"]
                self.solved_by = row["solved_by"]
                self._is_restored = True

                # Load existing guesses for this active round into memory
                cursor.execute("""
                    SELECT id, user_id as userId, nickname, word, similarity, rank, timestamp, is_answer as isAnswer, notice
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
                        "isAnswer": bool(r["isAnswer"]),
                        "notice": r["notice"]
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
        self.round_id = f"round_{int(time.time()*1000)}_{uuid.uuid4().hex[:6]}"
        self.target_word = word.strip()
        self.round_start_time = time.time()
        self.solved_by = None
        self.once_more_voters.clear()
        self.all_guesses.clear()
        self._is_restored = True

        # Non-blocking async queue write for DB persistence
        db_queue.enqueue("UPDATE game_rounds SET is_active = 0 WHERE is_active = 1")
        db_queue.enqueue("""
            INSERT OR REPLACE INTO game_rounds (round_id, target_word, is_active)
            VALUES (?, ?, 1)
        """, (self.round_id, self.target_word))

        self._sync_target_vector()

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

        # 1. Update in-memory state instantly (0.001ms hot path)
        if not is_answer:
            self.all_guesses.insert(0, guess_item)
        else:
            if not self.solved_by:
                self.solved_by = nickname
                db_queue.enqueue("UPDATE game_rounds SET solved_by = ? WHERE round_id = ?", (nickname, self.round_id))
            hall_of_fame_service.record_win(nickname, client_ip)
            user_service.record_win(nickname)

        # 2. Asynchronously persist to SQLite via non-blocking worker queue
        db_queue.enqueue("""
            INSERT INTO game_guesses (id, round_id, user_id, nickname, word, similarity, rank, timestamp, is_answer, notice)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            guess_id,
            self.round_id,
            user_id,
            nickname,
            word,
            guess_item["similarity"],
            guess_item["rank"],
            now_ts,
            1 if is_answer else 0,
            notice
        ))

        return guess_item

    def get_guesses_for_round(self, round_id: Optional[str] = None) -> List[Dict[str, Any]]:
        target_round = round_id or self.round_id
        # Zero-latency in-memory read for active round
        if target_round == self.round_id:
            return list(self.all_guesses)

        # Fallback to DB query only for historical completed rounds
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, user_id as userId, nickname, word, similarity, rank, timestamp, is_answer as isAnswer, notice
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
                    "isAnswer": bool(r["isAnswer"]),
                    "notice": r["notice"]
                }
                for r in rows
            ]

game_state = GameState()
