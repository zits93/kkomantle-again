import os
import random
from typing import List, Dict, Any, Optional, Set
from app.services.embedding_service import embedding_service
from app.services.korean_normalizer import KoreanNormalizer

class WordService:
    def __init__(self):
        self.words_pool: List[str] = []
        self.valid_words_set: Set[str] = set()
        self.curated_target_words: List[str] = [
            "인공지능", "컴퓨터", "스마트폰", "알고리즘", "데이터", "소프트웨어", "로봇", "개발자",
            "프로그래밍", "인터넷", "딥러닝", "머신러닝", "에이전트", "네트워크", "서버", "클라우드",
            "지구", "태양", "달빛", "별빛", "은하", "바다", "하늘", "고양이", "강아지", "행복"
        ]
        self._load_target_words()
        self._load_dictionary()
        self.normalizer = KoreanNormalizer(self.valid_words_set, self.words_pool, self.curated_target_words)

    def _load_target_words(self):
        curated_path = os.path.join(os.path.dirname(__file__), "..", "..", "data", "curated_targets.json")
        if os.path.exists(curated_path):
            try:
                import json
                with open(curated_path, "r", encoding="utf-8") as f:
                    loaded = json.load(f)
                    if loaded:
                        self.curated_target_words = loaded
                        print(f"🎯 Loaded {len(self.curated_target_words)} curated target words from pool.")
            except Exception as e:
                print(f"Failed to load curated targets: {e}")

    def _load_dictionary(self):
        # Prefer 500k dictionary, fallback to 100k
        data_dir = os.path.join(os.path.dirname(__file__), "..", "..", "data")
        dict_500k = os.path.join(data_dir, "korean_words_500k.txt")
        dict_100k = os.path.join(data_dir, "korean_words_100k.txt")
        dict_path = dict_500k if os.path.exists(dict_500k) else dict_100k

        if os.path.exists(dict_path):
            try:
                with open(dict_path, "r", encoding="utf-8") as f:
                    words = [line.strip() for line in f if line.strip()]
                    self.words_pool = words
                    self.valid_words_set = set(words)
                    print(f"📖 Loaded {len(self.words_pool)} Korean words from {os.path.basename(dict_path)}.")
            except Exception as e:
                print(f"Failed to load dictionary: {e}")
                self.words_pool = self.curated_target_words
                self.valid_words_set = set(self.curated_target_words)
        else:
            self.words_pool = self.curated_target_words
            self.valid_words_set = set(self.curated_target_words)

    def is_valid_word(self, word: str) -> bool:
        return word.strip() in self.valid_words_set

    def normalize_and_validate(self, raw_input: str) -> Dict[str, Any]:
        """Normalize morphemes (조사/어미 복원) and auto-correct typos."""
        return self.normalizer.normalize_and_validate(raw_input)

    def get_random_word(self, exclude: Optional[Any] = None) -> str:
        exclude_set = set()
        if isinstance(exclude, (set, list, tuple)):
            exclude_set = set(exclude)
        elif isinstance(exclude, str):
            exclude_set = {exclude}

        candidates = [w for w in self.curated_target_words if w not in exclude_set]
        return random.choice(candidates if candidates else self.curated_target_words)

    def evaluate_guess_fast(
        self,
        guess: str,
        target: str,
        target_vector: Optional[Any] = None,
        notice: Optional[str] = None,
        round_ranks: Optional[Dict[str, int]] = None,
        round_top_dots: Optional[Any] = None
    ) -> Dict[str, Any]:
        """Parallel, vector-accelerated guess evaluation with exact 1-based monotonic ranking."""
        import numpy as np
        guess = guess.strip()
        translated = embedding_service.translate_to_korean(guess)
        is_answer = (guess.lower() == target.lower() or translated.lower() == target.lower())
        
        if is_answer:
            similarity = 100.0
            rank = 1
        else:
            if target_vector is not None:
                dot, similarity = embedding_service.calculate_dot_and_similarity_to_target_vector(guess, target_vector, target)
            else:
                dot, similarity = embedding_service.calculate_dot_and_similarity(guess, target)

            clean_key = translated if translated else guess
            if round_ranks and clean_key in round_ranks:
                rank = round_ranks[clean_key]
            elif round_top_dots is not None and len(round_top_dots) > 0 and dot >= round_top_dots[-1]:
                idx = int(np.searchsorted(-round_top_dots, -dot))
                rank = max(2, idx + 1)
            else:
                rank = None

        return {
            "word": guess,
            "similarity": similarity,
            "rank": rank,
            "isAnswer": is_answer,
            "inDictionary": True,
            "notice": notice
        }

    def evaluate_guess(self, guess: str, target: str, notice: Optional[str] = None) -> Dict[str, Any]:
        return self.evaluate_guess_fast(guess, target, None, notice)

word_service = WordService()
