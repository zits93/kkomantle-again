from typing import Optional, List
from pydantic import BaseModel, Field

class UserInfo(BaseModel):
    id: str
    nickname: str
    ipMasked: str

class GuessPayload(BaseModel):
    id: str
    userId: str
    nickname: str
    word: str
    similarity: float
    rank: Optional[int] = None
    timestamp: int
    isSelf: bool = False
    isAnswer: bool = False

class ChatMessagePayload(BaseModel):
    id: str
    type: str = "chat" # chat, notice, system, answer_reveal
    sender: str
    text: str
    timestamp: int

class HallOfFameItem(BaseModel):
    rank: int
    nickname: str
    winCount: int
    lastWonAt: Optional[str] = None

class VoteStatus(BaseModel):
    activeUsers: int
    votes: int
    requiredVotes: int
    hasVoted: bool = False
