from collections import deque
import time
import uuid
from typing import List, Dict, Any
from app.config import settings

class ChatManager:
    def __init__(self, max_size: int = settings.MAX_CHAT_HISTORY):
        self.messages: deque = deque(maxlen=max_size)

    def add_message(self, sender: str, text: str, msg_type: str = "chat") -> Dict[str, Any]:
        msg_id = f"msg_{int(time.time()*1000)}_{uuid.uuid4().hex[:6]}"
        message = {
            "id": msg_id,
            "type": msg_type,
            "sender": sender,
            "text": text,
            "timestamp": int(time.time() * 1000)
        }
        self.messages.append(message)
        return message

    def get_history(self) -> List[Dict[str, Any]]:
        return list(self.messages)

    def clear(self):
        self.messages.clear()

chat_service = ChatManager()
