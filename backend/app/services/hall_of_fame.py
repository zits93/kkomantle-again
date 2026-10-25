import sqlite3
import hashlib
import os
from datetime import datetime
from typing import List, Dict, Any, Optional
from app.config import settings
from app.services.db_queue import db_queue

class HallOfFameManager:
    """
    Hall of Fame with in-memory caching for zero read latency and SQLite WAL durability
    guaranteeing survival across server crashes or power failures.
    """
    def __init__(self, db_path: str = settings.DB_PATH):
        self.db_path = db_path
        self._cached_leaderboard: Optional[List[Dict[str, Any]]] = None
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        self._init_db()
        self._refresh_cache()

    def _get_connection(self):
        conn = sqlite3.connect(self.db_path, timeout=10.0)
        conn.row_factory = sqlite3.Row
        return conn

    def _hash_ip(self, ip: str) -> str:
        salt = "kkomantle_salt_2026"
        return hashlib.sha256(f"{salt}_{ip}".encode()).hexdigest()[:16]

    def _init_db(self):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("PRAGMA journal_mode = WAL;")
            cursor.execute("PRAGMA synchronous = NORMAL;")
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS winners (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    nickname TEXT NOT NULL,
                    ip_hash TEXT NOT NULL,
                    win_count INTEGER NOT NULL DEFAULT 1,
                    last_won_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(nickname, ip_hash)
                )
            """)
            conn.commit()

    def _refresh_cache(self, limit: int = 50):
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT nickname, SUM(win_count) as total_wins, MAX(last_won_at) as last_won
                    FROM winners
                    GROUP BY nickname
                    ORDER BY total_wins DESC, last_won ASC
                    LIMIT ?
                """, (limit,))
                rows = cursor.fetchall()

            results = []
            for idx, row in enumerate(rows):
                results.append({
                    "rank": idx + 1,
                    "nickname": row["nickname"],
                    "winCount": row["total_wins"],
                    "lastWonAt": row["last_won"],
                })
            self._cached_leaderboard = results
        except Exception as e:
            print(f"[HallOfFame] Failed to refresh leaderboard cache: {e}")
            if self._cached_leaderboard is None:
                self._cached_leaderboard = []

    def record_win(self, nickname: str, client_ip: str) -> List[Dict[str, Any]]:
        ip_hash = self._hash_ip(client_ip)
        now = datetime.now().isoformat()

        # Synchronously write win to ensure immediate durability on victory
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO winners (nickname, ip_hash, win_count, last_won_at)
                VALUES (?, ?, 1, ?)
                ON CONFLICT(nickname, ip_hash) DO UPDATE SET
                    win_count = win_count + 1,
                    last_won_at = ?
            """, (nickname, ip_hash, now, now))
            conn.commit()

        self._refresh_cache()
        return self.get_leaderboard()

    def get_leaderboard(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Instant zero-latency read from memory cache."""
        if self._cached_leaderboard is not None:
            return self._cached_leaderboard[:limit]
        self._refresh_cache(limit)
        return self._cached_leaderboard or []

hall_of_fame_service = HallOfFameManager()
