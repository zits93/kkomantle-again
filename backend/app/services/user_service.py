import sqlite3
import os
from datetime import datetime
from typing import Dict, Any, Optional
from app.config import settings
from app.services.connection_manager import connection_manager

class UserService:
    def __init__(self, db_path: str = settings.DB_PATH):
        self.db_path = db_path
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        self._init_db()

    def _get_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    nickname TEXT PRIMARY KEY,
                    last_ip TEXT NOT NULL,
                    masked_ip TEXT NOT NULL,
                    total_wins INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            # Sync existing winners from winners table if any exist
            cursor.execute("""
                INSERT OR IGNORE INTO users (nickname, last_ip, masked_ip, total_wins, last_seen_at)
                SELECT nickname, '127.0.0.1', '127.0.0.1', SUM(win_count), MAX(last_won_at)
                FROM winners
                GROUP BY nickname
            """)
            conn.commit()

    def check_nickname(self, nickname: str, client_ip: str) -> Dict[str, Any]:
        nickname = nickname.strip()
        current_masked = connection_manager.mask_ip(client_ip)

        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT nickname, last_ip, masked_ip, total_wins, last_seen_at
                FROM users
                WHERE nickname = ?
            """, (nickname,))
            row = cursor.fetchone()

            if row:
                return {
                    "nickname": row["nickname"],
                    "exists": True,
                    "lastMaskedIp": row["masked_ip"],
                    "currentClientIp": current_masked,
                    "isSameIp": (row["masked_ip"] == current_masked),
                    "totalWins": row["total_wins"],
                    "lastSeenAt": row["last_seen_at"]
                }
            else:
                return {
                    "nickname": nickname,
                    "exists": False,
                    "currentClientIp": current_masked
                }

    def confirm_user(self, nickname: str, client_ip: str) -> Dict[str, Any]:
        nickname = nickname.strip()
        masked = connection_manager.mask_ip(client_ip)
        now = datetime.now().isoformat()

        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO users (nickname, last_ip, masked_ip, total_wins, created_at, last_seen_at)
                VALUES (?, ?, ?, 0, ?, ?)
                ON CONFLICT(nickname) DO UPDATE SET
                    last_ip = excluded.last_ip,
                    masked_ip = excluded.masked_ip,
                    last_seen_at = excluded.last_seen_at
            """, (nickname, client_ip, masked, now, now))
            conn.commit()

            cursor.execute("SELECT nickname, masked_ip, total_wins, last_seen_at FROM users WHERE nickname = ?", (nickname,))
            row = cursor.fetchone()

        return {
            "nickname": row["nickname"],
            "maskedIp": row["masked_ip"],
            "totalWins": row["total_wins"],
            "lastSeenAt": row["last_seen_at"]
        }

    def record_win(self, nickname: str):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE users
                SET total_wins = total_wins + 1,
                    last_seen_at = ?
                WHERE nickname = ?
            """, (datetime.now().isoformat(), nickname))
            conn.commit()

user_service = UserService()
