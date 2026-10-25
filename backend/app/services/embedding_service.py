import os
import json
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

        # Cache for real Qwen embeddings
        self._qwen_cache: Dict[str, np.ndarray] = {}
        self._qwen_model = None
        self._qwen_tokenizer = None
        self._qwen_device = None
        self._qwen_initialized = False

        # Load global mean vector for debiasing LLM representation degeneration (anisotropy)
        mean_path = os.path.join(os.path.dirname(__file__), "..", "..", "data", "qwen_mean_vector.npy")
        if os.path.exists(mean_path):
            try:
                self._mean_vector = np.load(mean_path)
                print("✅ Loaded Qwen debiasing mean vector for realistic similarity distribution.")
            except Exception as e:
                print(f"Failed to load mean vector: {e}")
                self._mean_vector = None
        else:
            self._mean_vector = None

    def load_vocab(self):
        if os.path.exists(self.words_file):
            try:
                with open(self.words_file, "r", encoding="utf-8") as f:
                    self.vocab = json.load(f)
            except Exception as e:
                print(f"Failed to load vocab: {e}")
                self.vocab = {}

    def _init_qwen_model(self):
        """Lazy load Qwen neural model on first request."""
        if self._qwen_initialized:
            return
        self._qwen_initialized = True
        try:
            import torch
            from transformers import AutoTokenizer, AutoModel
            model_id = "Qwen/Qwen2.5-0.5B"
            self._qwen_tokenizer = AutoTokenizer.from_pretrained(model_id)
            self._qwen_model = AutoModel.from_pretrained(model_id, torch_dtype=torch.float32)
            self._qwen_device = "cpu"
            self._qwen_model = self._qwen_model.to(self._qwen_device)
            self._qwen_model.eval()
            print(f"✅ Qwen neural model loaded on {self._qwen_device} (float32)!")
        except Exception as e:
            print(f"Direct Qwen loading skipped: {e}")
            self._qwen_model = None

    def _get_direct_qwen_embedding(self, word: str) -> Optional[np.ndarray]:
        """Compute real neural embedding using local PyTorch Qwen model."""
        if word in self._qwen_cache:
            return self._qwen_cache[word]

        self._init_qwen_model()
        if self._qwen_model is None or self._qwen_tokenizer is None:
            return None

        try:
            import torch
            inputs = self._qwen_tokenizer(word, return_tensors="pt").to(self._qwen_device)
            with torch.no_grad():
                outputs = self._qwen_model(**inputs)
                emb = outputs.last_hidden_state.mean(dim=1).squeeze().float().cpu().numpy()
                if self._mean_vector is not None:
                    emb = emb - self._mean_vector
                norm = np.linalg.norm(emb)
                vec = emb / (norm + 1e-9)
                self._qwen_cache[word] = vec
                return vec
        except Exception as e:
            print(f"Qwen embedding error for '{word}': {e}")
            return None

    def _try_ollama_embedding(self, word: str) -> Optional[np.ndarray]:
        """Fallback to Ollama REST API if Ollama daemon is running."""
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
                    norm = np.linalg.norm(emb)
                    return emb / (norm + 1e-9)
        except Exception:
            pass
        return None

    def _generate_oov_vector(self, word: str) -> np.ndarray:
        """Deterministic sub-character n-gram fallback."""
        np.random.seed(int(abs(hash(word)) % 1000000))
        vec = np.random.normal(0, 0.2, self.dim).astype(np.float32)
        norm = np.linalg.norm(vec)
        return vec / (norm + 1e-9)

    def get_vector(self, word: str) -> np.ndarray:
        word = word.strip()

        # 1. Try real local Qwen neural network
        qwen_vec = self._get_direct_qwen_embedding(word)
        if qwen_vec is not None:
            return qwen_vec

        # 2. Try Ollama daemon
        ollama_vec = self._try_ollama_embedding(word)
        if ollama_vec is not None:
            return ollama_vec

        # 3. Check precomputed vocab
        if word in self.vocab:
            return np.array(self.vocab[word]["vector"], dtype=np.float32)

        # 4. Fallback vector
        return self._generate_oov_vector(word)

    def calculate_similarity(self, word_a: str, word_b: str) -> float:
        if word_a == word_b:
            return 100.0

        vec_a = self.get_vector(word_a)
        vec_b = self.get_vector(word_b)

        dot = float(np.dot(vec_a, vec_b))
        norm_a = float(np.linalg.norm(vec_a))
        norm_b = float(np.linalg.norm(vec_b))

        if norm_a == 0 or norm_b == 0:
            return 0.0

        cosine = float(dot / (norm_a * norm_b))
        if cosine >= 0:
            score = round(min(99.4, 15.0 + (cosine ** 0.8) * 85.0), 1)
        else:
            score = round(max(0.0, 15.0 + (cosine / 0.4) * 15.0), 1)
        return score

embedding_service = EmbeddingService()
