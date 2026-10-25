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
        self.dim = 384
        self.load_vocab()

        # In-memory LRU cache for normalized unit vectors
        self._cache: Dict[str, np.ndarray] = {}
        self._max_cache_size = 100000
        self._model = None
        self._tokenizer = None
        self._device = None
        self._initialized = False

    def load_vocab(self):
        if os.path.exists(self.words_file):
            try:
                with open(self.words_file, "r", encoding="utf-8") as f:
                    self.vocab = json.load(f)
            except Exception as e:
                print(f"Failed to load vocab: {e}")
                self.vocab = {}

    def _init_neural_model(self):
        """Lazy load multilingual cross-lingual embedding model with optimal CPU threading."""
        if self._initialized:
            return
        self._initialized = True
        try:
            import torch
            from transformers import AutoTokenizer, AutoModel

            # Optimize CPU threads for parallel inference without lock contention
            threads = min(4, os.cpu_count() or 4)
            torch.set_num_threads(threads)

            model_id = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
            self._tokenizer = AutoTokenizer.from_pretrained(model_id)
            self._model = AutoModel.from_pretrained(model_id)
            self._device = "cpu"
            self._model = self._model.to(self._device)
            self._model.eval()

            # Warmup model graph
            warmup_inp = self._tokenizer("warmup", return_tensors="pt").to(self._device)
            with torch.inference_mode():
                self._model(**warmup_inp)

            print(f"✅ Multilingual neural embedding engine initialized on {self._device} ({threads} threads, warm)!")
        except Exception as e:
            print(f"Direct multilingual model loading failed: {e}")
            self._model = None

    def warmup(self):
        """Proactively initialize model on server startup to eliminate cold-start lag."""
        self._init_neural_model()

    def _get_direct_neural_embedding(self, word: str) -> Optional[np.ndarray]:
        """Compute semantic embedding with fast inference_mode and mean-pooling."""
        word_key = word.strip().lower()
        if word_key in self._cache:
            return self._cache[word_key]

        self._init_neural_model()
        if self._model is None or self._tokenizer is None:
            return None

        try:
            import torch
            inputs = self._tokenizer(word, return_tensors="pt", padding=True, truncation=True).to(self._device)
            with torch.inference_mode():
                outputs = self._model(**inputs)
                mask = inputs["attention_mask"].unsqueeze(-1).expand(outputs.last_hidden_state.size()).float()
                sum_emb = torch.sum(outputs.last_hidden_state * mask, 1)
                sum_mask = torch.clamp(mask.sum(1), min=1e-9)
                vec = (sum_emb / sum_mask).squeeze().float().cpu().numpy()
                norm = np.linalg.norm(vec)
                norm_vec = vec / (norm + 1e-9)

                # Cache eviction safeguard
                if len(self._cache) >= self._max_cache_size:
                    # Prune first 20%
                    keys_to_remove = list(self._cache.keys())[:20000]
                    for k in keys_to_remove:
                        self._cache.pop(k, None)

                self._cache[word_key] = norm_vec
                return norm_vec
        except Exception as e:
            print(f"Multilingual embedding error for '{word}': {e}")
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
        """Deterministic sub-character fallback."""
        np.random.seed(int(abs(hash(word)) % 1000000))
        vec = np.random.normal(0, 0.2, self.dim).astype(np.float32)
        norm = np.linalg.norm(vec)
        return vec / (norm + 1e-9)

    def get_vector(self, word: str) -> np.ndarray:
        word = word.strip()
        word_key = word.lower()
        if word_key in self._cache:
            return self._cache[word_key]

        # 1. Primary: Real multilingual neural embedding
        vec = self._get_direct_neural_embedding(word)
        if vec is not None:
            return vec

        # 2. Secondary: Ollama daemon
        ollama_vec = self._try_ollama_embedding(word)
        if ollama_vec is not None:
            return ollama_vec

        # 3. Check precomputed vocab
        if word in self.vocab:
            return np.array(self.vocab[word]["vector"], dtype=np.float32)

        # 4. Fallback vector
        return self._generate_oov_vector(word)

    def calculate_similarity_to_target_vector(self, word: str, target_vector: np.ndarray, target_word: str) -> float:
        """Ultra-fast O(1) similarity calculation using pre-normalized target vector."""
        if word.strip().lower() == target_word.strip().lower():
            return 100.0

        vec_a = self.get_vector(word)
        # Both vectors are L2-normalized unit vectors -> dot product is exactly cosine!
        dot = float(np.dot(vec_a, target_vector))
        if dot >= 0:
            return round(min(99.4, (dot ** 0.85) * 100.0), 1)
        return 0.0

    def calculate_similarity(self, word_a: str, word_b: str) -> float:
        if word_a.strip().lower() == word_b.strip().lower():
            return 100.0

        vec_a = self.get_vector(word_a)
        vec_b = self.get_vector(word_b)

        dot = float(np.dot(vec_a, vec_b))
        if dot >= 0:
            return round(min(99.4, (dot ** 0.85) * 100.0), 1)
        return 0.0

embedding_service = EmbeddingService()
