import random
from typing import List, Dict, Any, Optional
from app.services.embedding_service import embedding_service

class WordService:
    def __init__(self):
        self.words_pool = list(embedding_service.vocab.keys())
        if not self.words_pool:
            self.words_pool = ["인공지능", "우주", "사랑", "컴퓨터", "바다", "행복", "고양이", "개발자", "노래하다", "빠르게"]

    def get_random_word(self, exclude: Optional[str] = None) -> str:
        candidates = [w for w in self.words_pool if w != exclude]
        return random.choice(candidates if candidates else self.words_pool)

    def evaluate_guess(self, guess: str, target: str) -> Dict[str, Any]:
        guess = guess.strip()
        similarity = embedding_service.calculate_similarity(guess, target)
        is_answer = (guess == target)

        rank: Optional[int] = None
        if not is_answer and len(self.words_pool) > 0:
            # Estimate rank against vocab
            higher_count = 0
            for w in self.words_pool:
                if w != target:
                    w_sim = embedding_service.calculate_similarity(w, target)
                    if w_sim > similarity:
                        higher_count += 1
            rank = higher_count + 1

        return {
            "word": guess,
            "similarity": 100.0 if is_answer else similarity,
            "rank": 1 if is_answer else rank,
            "isAnswer": is_answer
        }

word_service = WordService()
