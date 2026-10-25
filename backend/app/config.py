import os

class Settings:
    PROJECT_NAME: str = "꼬맨틀 한번더 Backend"
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    CORS_ORIGINS: list[str] = ["*"]
    DB_PATH: str = os.getenv("DB_PATH", os.path.join(os.path.dirname(__file__), "..", "data", "hall_of_fame.db"))
    WORDS_FILE: str = os.getenv("WORDS_FILE", os.path.join(os.path.dirname(__file__), "..", "data", "words.json"))
    MAX_CHAT_HISTORY: int = 300
    OLLAMA_HOST: str = os.getenv("OLLAMA_HOST", "http://localhost:11434")
    QWEN_MODEL_NAME: str = os.getenv("QWEN_MODEL_NAME", "qwen2.5:1.5b")

settings = Settings()
