from fastapi import WebSocket
from typing import Dict, Any, List
import json
import asyncio
import time

class ConnectionManager:
    def __init__(self):
        # connection_id -> (WebSocket, nickname, client_ip, masked_ip)
        self.active_connections: Dict[str, Dict[str, Any]] = {}
        # HTTP polling fallback active users: key -> { id, nickname, ipMasked, last_seen }
        self.http_active_users: Dict[str, Dict[str, Any]] = {}

    def mask_ip(self, ip: str) -> str:
        if not ip or ip in ("127.0.0.1", "localhost", "::1", "testclient"):
            return "127.0.0.1"
        parts = ip.split(".")
        if len(parts) == 4:
            return f"{parts[0]}.{parts[1]}.*.*"
        return ip[:8] + "..."

    async def connect(self, websocket: WebSocket, conn_id: str, client_ip: str, nickname: str = ""):
        await websocket.accept()
        masked = self.mask_ip(client_ip)
        self.active_connections[conn_id] = {
            "ws": websocket,
            "nickname": nickname or f"유저_{conn_id[:4]}",
            "ip": client_ip,
            "masked_ip": masked
        }

    def update_nickname(self, conn_id: str, new_nickname: str):
        if conn_id in self.active_connections:
            self.active_connections[conn_id]["nickname"] = new_nickname

    def disconnect(self, conn_id: str):
        if conn_id in self.active_connections:
            del self.active_connections[conn_id]

    def touch_http_user(self, nickname: str, client_ip: str):
        """Keep track of active users polling via HTTP fallback (e.g. corporate intranet)."""
        masked = self.mask_ip(client_ip)
        key = f"{nickname}_{masked}"
        self.http_active_users[key] = {
            "id": f"http_{key}",
            "nickname": nickname,
            "ipMasked": masked,
            "last_seen": time.time()
        }

    def _cleanup_http_users(self):
        now = time.time()
        expired = [k for k, v in self.http_active_users.items() if now - v["last_seen"] > 15.0]
        for k in expired:
            del self.http_active_users[k]

    def get_user_list(self) -> List[Dict[str, Any]]:
        self._cleanup_http_users()
        users = [
            {
                "id": cid,
                "nickname": data["nickname"],
                "ipMasked": data["masked_ip"]
            }
            for cid, data in self.active_connections.items()
        ]
        # Include HTTP fallback users who aren't already connected via WebSocket
        ws_nicks = {u["nickname"] for u in users}
        for u in self.http_active_users.values():
            if u["nickname"] not in ws_nicks:
                users.append({
                    "id": u["id"],
                    "nickname": u["nickname"],
                    "ipMasked": u["ipMasked"]
                })
        return users

    def get_total_users_count(self) -> int:
        return len(self.get_user_list())

    async def send_personal(self, conn_id: str, message: dict):
        if conn_id in self.active_connections:
            ws = self.active_connections[conn_id]["ws"]
            await ws.send_text(json.dumps(message, ensure_ascii=False))

    async def broadcast(self, message: dict):
        if not self.active_connections:
            return
        text = json.dumps(message, ensure_ascii=False)

        async def _safe_send(cid: str, ws: WebSocket):
            try:
                await ws.send_text(text)
                return None
            except Exception:
                return cid

        # Concurrent parallel broadcast to all active clients
        tasks = [_safe_send(cid, data["ws"]) for cid, data in list(self.active_connections.items())]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        for res in results:
            if isinstance(res, str):
                self.disconnect(res)

connection_manager = ConnectionManager()
