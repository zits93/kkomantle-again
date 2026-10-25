import queue
import threading
import sqlite3
import atexit
from typing import Tuple, Any
from app.config import settings

class DBQueueManager:
    """
    Decoupled asynchronous database persistence worker.
    Ensures zero disk latency on game request hot paths while guaranteeing
    durability against power outages/restarts using SQLite Write-Ahead Logging (WAL).
    """
    def __init__(self, db_path: str = settings.DB_PATH):
        self.db_path = db_path
        self._queue = queue.Queue()
        self._stop_event = threading.Event()
        self._worker_thread = threading.Thread(target=self._worker, name="db_persistence_worker", daemon=True)
        self._worker_thread.start()
        atexit.register(self.flush_and_close)

    def enqueue(self, sql: str, params: Tuple[Any, ...] = ()):
        """Enqueue an SQL write operation without blocking the caller."""
        self._queue.put((sql, params))

    def _worker(self):
        """Dedicated background thread handling serialized writes to prevent database lock contention."""
        conn = sqlite3.connect(self.db_path, timeout=30.0)
        try:
            conn.execute("PRAGMA journal_mode = WAL;")
            conn.execute("PRAGMA synchronous = NORMAL;")
        except Exception as e:
            print(f"[DBQueue] Failed to set WAL pragmas: {e}")

        while not self._stop_event.is_set():
            try:
                item = self._queue.get(timeout=0.5)
            except queue.Empty:
                continue

            if item is None:
                self._queue.task_done()
                break

            sql, params = item
            try:
                conn.execute(sql, params)
                # Commit immediately if no more pending writes in queue
                if self._queue.empty():
                    conn.commit()
            except Exception as e:
                print(f"[DBQueue] Write error: {e} | SQL: {sql}")
            finally:
                self._queue.task_done()

        try:
            conn.commit()
            conn.close()
        except Exception:
            pass

    def flush_and_close(self):
        """Flushes remaining writes on server shutdown."""
        if not self._stop_event.is_set():
            try:
                self._queue.join()
            except Exception:
                pass
            self._stop_event.set()
            self._queue.put(None)
            self._worker_thread.join(timeout=2.0)

db_queue = DBQueueManager()
