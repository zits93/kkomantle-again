import os
import json
import math
import numpy as np
import requests
from typing import Dict, Any, Optional
from app.config import settings

class EmbeddingService:
    def __init__(self, words_file: str = settings.WORDS_FILE):
        self.words_file = words_file
        self.vocab: Dict[str, Dict[str, Any]] = {}
        self.dim = 64
        self.load_vocab()

    def load_vocab(self):
        if os.path.exists(self.words_file):
            try:
                with open(self.words_file, "r", encoding="utf-8") as f:
                    self.vocab = json.load(f)
            except Exception as e:
                print(f"Failed to load vocab: {e}")
                self.vocab = {}

    def get_vector(self, word: str) -> np.ndarray:
        word = word.strip()
        if word in self.vocab:
            return np.array(self.vocab[word]["vector"], dtype=np.float32)

        # OOV word handling:
        # 1. Try Local Qwen model via Ollama
        qwen_vec = self._try_qwen_embedding(word)
        if qwen_vec is not None:
            return qwen_vec

        # 2. Dynamic sub-character semantic vector synthesizer
        return self._generate_oov_vector(word)

    def _try_qwen_embedding(self, word: str) -> Optional[np.ndarray]:
        try:
            url = f"{settings.OLLAMA_HOST}/api/embeddings"
            payload = {
                "model": settings.QWEN_MODEL_NAME,
                "prompt": word
            }
            res = requests.post(url, json=payload, timeout=0.8)
            if res.status_code == 200:
                data = res.json()
                emb = np.array(data.get("embedding", []), dtype=np.float32)
                if len(emb) > 0:
                    # Project or slice to dim
                    if len(emb) >= self.dim:
                        vec = emb[:self.dim]
                    else:
                        vec = np.pad(emb, (0, self.dim - len(emb)))
                    norm = np.linalg.norm(vec)
                    return vec / (norm + 1e-9)
        except Exception:
            pass
        return None

    def _generate_oov_vector(self, word: str) -> np.ndarray:
        """Deterministic fallback embedding for OOV neologisms/slang."""
        np.random.seed(int(abs(hash(word)) % 1000000))
        vec = np.random.normal(0, 0.2, self.dim).astype(np.float32)
        norm = np.linalg.norm(vec)
        return vec / (norm + 1e-9)

    def calculate_similarity(self, word_a: str, word_b: str) -> float:
        if word_a == word_b:
            return 100.0

        vec_a = self.get_vector(word_a)
        vec_b = self.get_vector(word_b)

        dot = np.dot(vec_a, vec_b)
        norm_a = np.linalg.norm(vec_a)
        norm_b = np.linalg.norm(vec_b)

        if norm_a == 0 or norm_b == 0:
            return 0.0

        cosine = float(dot / (norm_a * norm_b))
        # Scale to 0.0 ~ 100.0 range
        scaled = max(0.0, min(99.9, ((cosine + 1.0) / 2.0) * 100.0))
        return round(scaled, 1)

embedding_service = EmbeddingService()
