from fastapi import WebSocket
from typing import Dict, Any, List
import json

class ConnectionManager:
    def __init__(self):
        # connection_id -> (WebSocket, nickname, client_ip, masked_ip)
        self.active_connections: Dict[str, Dict[str, Any]] = {}

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

    def get_user_list(self) -> List[Dict[str, Any]]:
        return [
            {
                "id": cid,
                "nickname": data["nickname"],
                "ipMasked": data["masked_ip"]
            }
            for cid, data in self.active_connections.items()
        ]

    async def send_personal(self, conn_id: str, message: dict):
        if conn_id in self.active_connections:
            ws = self.active_connections[conn_id]["ws"]
            await ws.send_text(json.dumps(message, ensure_ascii=False))

    async def broadcast(self, message: dict):
        text = json.dumps(message, ensure_ascii=False)
        disconnected = []
        for cid, data in self.active_connections.items():
            try:
                await data["ws"].send_text(text)
            except Exception:
                disconnected.append(cid)
        for cid in disconnected:
            self.disconnect(cid)

connection_manager = ConnectionManager()
