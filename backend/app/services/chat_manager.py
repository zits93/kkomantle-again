from collections import deque
import time
import uuid
import sqlite3
import os
from typing import List, Dict, Any
from app.config import settings
from app.services.db_queue import db_queue

class ChatManager:
    """
    Chat manager with in-memory zero-latency reads and decoupled async persistence
    guaranteeing survival across server restarts / crashes.
    """
    def __init__(self, db_path: str = settings.DB_PATH, max_size: int = settings.MAX_CHAT_HISTORY):
        self.db_path = db_path
        self.max_size = max_size
        self.messages: deque = deque(maxlen=max_size)
        self._init_db()
        self._load_recent_messages()

    def _get_connection(self):
        conn = sqlite3.connect(self.db_path, timeout=10.0)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("PRAGMA journal_mode = WAL;")
            cursor.execute("PRAGMA synchronous = NORMAL;")
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS chat_messages (
                    id TEXT PRIMARY KEY,
                    sender TEXT NOT NULL,
                    text TEXT NOT NULL,
                    msg_type TEXT NOT NULL,
                    timestamp INTEGER NOT NULL
                )
            """)
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_chat_timestamp ON chat_messages(timestamp DESC)")
            conn.commit()

    def _load_recent_messages(self):
        """Restore recent chat messages from database on server startup."""
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT id, sender, text, msg_type, timestamp
                    FROM chat_messages
                    ORDER BY timestamp DESC
                    LIMIT ?
                """, (self.max_size,))
                rows = cursor.fetchall()
                # Reverse to preserve chronological order in deque
                for r in reversed(rows):
                    self.messages.append({
                        "id": r["id"],
                        "type": r["msg_type"],
                        "sender": r["sender"],
                        "text": r["text"],
                        "timestamp": r["timestamp"]
                    })
        except Exception as e:
            print(f"[ChatManager] Failed to rehydrate chat messages: {e}")

    def add_message(self, sender: str, text: str, msg_type: str = "chat") -> Dict[str, Any]:
        msg_id = f"msg_{int(time.time()*1000)}_{uuid.uuid4().hex[:6]}"
        now_ts = int(time.time() * 1000)
        message = {
            "id": msg_id,
            "type": msg_type,
            "sender": sender,
            "text": text,
            "timestamp": now_ts
        }
        # 1. Update in-memory deque instantly for zero-latency reads
        self.messages.append(message)

        # 2. Asynchronously persist to SQLite via non-blocking worker queue
        db_queue.enqueue("""
            INSERT INTO chat_messages (id, sender, text, msg_type, timestamp)
            VALUES (?, ?, ?, ?, ?)
        """, (msg_id, sender, text, msg_type, now_ts))

        return message

    def get_history(self) -> List[Dict[str, Any]]:
        """Instant zero-latency read directly from in-memory deque."""
        return list(self.messages)

    def clear(self):
        self.messages.clear()

chat_service = ChatManager()
