import os
import csv
import re
import numpy as np
from typing import Dict, Any, Optional
from app.config import settings

class EmbeddingService:
    def __init__(
        self,
        fasttext_path: str = settings.FASTTEXT_MODEL_PATH,
        kengdic_path: str = settings.KENGDIC_PATH,
        words_file: str = settings.WORDS_FILE
    ):
        self.fasttext_path = fasttext_path
        self.kengdic_path = kengdic_path
        self.words_file = words_file
        self.dim = 200

        self._model = None
        self._initialized = False
        self.en_to_ko: Dict[str, str] = {}
        self._cache: Dict[str, np.ndarray] = {}
        self._max_cache_size = 100000

        self._load_dictionary()

    def _load_dictionary(self):
        """Load kengdic offline English-to-Korean mapping for zero-latency bilingual input."""
        if not os.path.exists(self.kengdic_path):
            return

        try:
            candidates: Dict[str, list] = {}
            with open(self.kengdic_path, "r", encoding="utf-8") as f:
                reader = csv.reader(f, delimiter="\t")
                _ = next(reader, None)
                for row in reader:
                    if len(row) >= 5:
                        ko = row[1].strip()
                        gloss = row[3].strip()
                        level = row[4].strip()
                        for part in gloss.split(","):
                            clean_part = re.sub(r'^(a|an|the)\s+', '', part.split(';')[0], flags=re.IGNORECASE)
                            clean_part = re.sub(r'\(.*?\)', '', clean_part).strip().lower()
                            if clean_part and len(clean_part) < 30:
                                candidates.setdefault(clean_part, []).append((ko, level))

            level_priority = {'A': 4, 'B': 3, 'C': 2, '': 1}
            for eng, ko_list in candidates.items():
                ko_list.sort(key=lambda x: (level_priority.get(x[1], 0), -len(x[0])), reverse=True)
                self.en_to_ko[eng] = ko_list[0][0]

            # High-priority accurate overrides for common gameplay words
            overrides = {
                'cat': '고양이',
                'cats': '고양이',
                'space': '우주',
                'dog': '개',
                'dogs': '개',
                'water': '물',
                'apple': '사과',
                'apples': '사과',
                'book': '책',
                'books': '책',
                'star': '별',
                'stars': '별',
                'universe': '우주',
                'love': '사랑',
                'cement': '시멘트',
                'sock': '양말',
                'socks': '양말',
                'computer': '컴퓨터',
                'computers': '컴퓨터',
                'rocket': '로켓',
                'banana': '바나나',
                'airplane': '비행기',
                'plane': '비행기',
                'squid': '오징어',
                'democracy': '민주주의',
                'philosophy': '철학'
            }
            self.en_to_ko.update(overrides)
            print(f"📖 Loaded {len(self.en_to_ko)} English-Korean translation pairs.")
        except Exception as e:
            print(f"Failed to load kengdic: {e}")

    def _init_fasttext(self):
        """Lazy load FastText binary model."""
        if self._initialized:
            return
        self._initialized = True

        if os.path.exists(self.fasttext_path):
            try:
                from gensim.models.fasttext import load_facebook_model
                print(f"Loading FastText model from {self.fasttext_path}...")
                self._model = load_facebook_model(self.fasttext_path)
                print(f"✅ FastText model successfully loaded (dim=200)!")
            except Exception as e:
                print(f"Failed to load FastText: {e}")
                self._model = None
        else:
            print(f"⚠️ FastText model not found at {self.fasttext_path}")
            self._model = None

    def warmup(self):
        """Proactively initialize FastText on server startup to eliminate cold-start lag."""
        self._init_fasttext()

    def translate_to_korean(self, word: str) -> str:
        """Map foreign / English input to Korean equivalent if applicable."""
        w = word.strip().lower()
        if w in self.en_to_ko:
            return self.en_to_ko[w]
        if w.endswith('s') and w[:-1] in self.en_to_ko:
            return self.en_to_ko[w[:-1]]
        if w.endswith('es') and w[:-2] in self.en_to_ko:
            return self.en_to_ko[w[:-2]]
        return word.strip()

    def _generate_oov_vector(self, word: str) -> np.ndarray:
        """Deterministic sub-character fallback for unknown symbols."""
        np.random.seed(int(abs(hash(word)) % 1000000))
        vec = np.random.normal(0, 0.2, self.dim).astype(np.float32)
        norm = np.linalg.norm(vec)
        return vec / (norm + 1e-9)

    def get_vector(self, word: str) -> np.ndarray:
        word = word.strip()
        word_key = word.lower()
        if word_key in self._cache:
            return self._cache[word_key]

        self._init_fasttext()

        # If foreign / English, resolve to Korean first
        ko_word = self.translate_to_korean(word)
        if ko_word in self._cache:
            return self._cache[ko_word]

        if self._model is not None:
            try:
                raw_vec = self._model.wv[ko_word]
                norm = np.linalg.norm(raw_vec)
                if norm > 0.05:
                    unit_vec = (raw_vec / (norm + 1e-9)).astype(np.float32)
                else:
                    unit_vec = self._generate_oov_vector(ko_word)

                if len(self._cache) >= self._max_cache_size:
                    for k in list(self._cache.keys())[:20000]:
                        self._cache.pop(k, None)

                self._cache[word_key] = unit_vec
                self._cache[ko_word] = unit_vec
                return unit_vec
            except Exception as e:
                print(f"FastText vector error for '{word}': {e}")

        vec = self._generate_oov_vector(word)
        self._cache[word_key] = vec
        return vec

    def _scale_similarity(self, dot: float) -> float:
        """Authentic Semantle progressive scaling curve from raw cosine to [0, 100] % score."""
        if dot <= 0:
            return 0.0
        if dot <= 0.05:
            return round(max(0.0, dot * 40.0), 1)
        if dot <= 0.20:
            return round(2.0 + (dot - 0.05) / 0.15 * 18.0, 1)
        if dot <= 0.50:
            t = (dot - 0.20) / 0.30
            return round(20.0 + (t ** 0.85) * 40.0, 1)
        # dot > 0.50
        t = min(1.0, (dot - 0.50) / 0.50)
        return round(min(99.4, 60.0 + (t ** 0.8) * 39.4), 1)

    def precompute_top_ranks(self, target_word: str) -> tuple[Dict[str, int], np.ndarray]:
        """Precompute exact 1-based ranks (1 to 1000) and top dot products for target word."""
        self._init_fasttext()
        if self._model is None:
            return {}, np.array([], dtype=np.float32)

        target_ko = self.translate_to_korean(target_word)
        target_vec = self.get_vector(target_ko)

        if not hasattr(self, '_unit_matrix') or self._unit_matrix is None:
            vecs = self._model.wv.vectors
            norms = np.linalg.norm(vecs, axis=1, keepdims=True)
            self._unit_matrix = (vecs / (norms + 1e-9)).astype(np.float32)
            self._vocab_words = self._model.wv.index_to_key

        dots = np.dot(self._unit_matrix, target_vec)
        top_count = min(1000, len(self._vocab_words))
        top_indices = np.argsort(-dots)[:top_count]

        ranks: Dict[str, int] = {}
        for rank, idx in enumerate(top_indices, start=1):
            ranks[self._vocab_words[idx]] = rank

        ranks[target_ko] = 1
        ranks[target_word] = 1

        top_dots = dots[top_indices].astype(np.float32)
        return ranks, top_dots

    def calculate_dot_and_similarity_to_target_vector(self, word: str, target_vector: np.ndarray, target_word: str) -> tuple[float, float]:
        """Returns (raw_dot, scaled_similarity)."""
        w1 = word.strip().lower()
        w2 = target_word.strip().lower()
        t1 = self.translate_to_korean(w1)
        t2 = self.translate_to_korean(w2)

        if w1 == w2 or t1 == t2 or t1 == w2:
            return 1.0, 100.0

        vec_a = self.get_vector(word)
        dot = float(np.dot(vec_a, target_vector))
        return dot, self._scale_similarity(dot)

    def calculate_dot_and_similarity(self, word_a: str, word_b: str) -> tuple[float, float]:
        """Returns (raw_dot, scaled_similarity)."""
        w1 = word_a.strip().lower()
        w2 = word_b.strip().lower()
        t1 = self.translate_to_korean(w1)
        t2 = self.translate_to_korean(w2)

        if w1 == w2 or t1 == t2 or t1 == w2:
            return 1.0, 100.0

        vec_a = self.get_vector(word_a)
        vec_b = self.get_vector(word_b)
        dot = float(np.dot(vec_a, vec_b))
        return dot, self._scale_similarity(dot)

    def calculate_similarity_to_target_vector(self, word: str, target_vector: np.ndarray, target_word: str) -> float:
        """Ultra-fast O(1) similarity calculation using pre-normalized target vector."""
        _, sim = self.calculate_dot_and_similarity_to_target_vector(word, target_vector, target_word)
        return sim

    def calculate_similarity(self, word_a: str, word_b: str) -> float:
        _, sim = self.calculate_dot_and_similarity(word_a, word_b)
        return sim

embedding_service = EmbeddingService()
