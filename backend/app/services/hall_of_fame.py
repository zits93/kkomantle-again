import sqlite3
import hashlib
import os
from datetime import datetime
from typing import List, Dict, Any
from app.config import settings

class HallOfFameManager:
    def __init__(self, db_path: str = settings.DB_PATH):
        self.db_path = db_path
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        self._init_db()

    def _get_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _hash_ip(self, ip: str) -> str:
        # Salted hash of IP for privacy & anti-cheat deduplication
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

    def record_win(self, nickname: str, client_ip: str) -> List[Dict[str, Any]]:
        ip_hash = self._hash_ip(client_ip)
        now = datetime.now().isoformat()

        with self._get_connection() as conn:
            cursor = conn.cursor()
            # Upsert winner count
            cursor.execute("""
                INSERT INTO winners (nickname, ip_hash, win_count, last_won_at)
                VALUES (?, ?, 1, ?)
                ON CONFLICT(nickname, ip_hash) DO UPDATE SET
                    win_count = win_count + 1,
                    last_won_at = ?
            """, (nickname, ip_hash, now, now))
            conn.commit()

        return self.get_leaderboard()

    def get_leaderboard(self, limit: int = 50) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            # Aggregate by nickname to display clean leaderboard
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
        return results

hall_of_fame_service = HallOfFameManager()
