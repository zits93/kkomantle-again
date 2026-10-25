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
            "챗봇", "프롬프트", "파이썬", "블록체인", "메타버스", "가상현실", "사이버", "우주",
            "지구", "태양", "달빛", "별빛", "은하", "블랙홀", "오로라", "바다", "하늘", "바람",
            "빗방울", "구름", "겨울", "여름", "봄", "가을", "고양이", "강아지", "사람", "친구",
            "가족", "행복", "사랑", "희망", "기쁨", "설렘", "감동", "위로", "커피", "음식",
            "책", "도서관", "음악", "노래", "영화", "사진", "시간", "기억", "미래", "꿈",
            "비밀", "약속", "선물", "기적", "생각하다", "배우다", "만들다", "달리다", "노래하다",
            "사랑하다", "빠르게", "천천히", "조용히", "반짝반짝", "다정하게", "영원히", "마침내"
        ]
        self._load_100k_dictionary()
        self.normalizer = KoreanNormalizer(self.valid_words_set, self.words_pool, self.curated_target_words)

    def _load_100k_dictionary(self):
        dict_path = os.path.join(os.path.dirname(__file__), "..", "..", "data", "korean_words_100k.txt")
        if os.path.exists(dict_path):
            try:
                with open(dict_path, "r", encoding="utf-8") as f:
                    words = [line.strip() for line in f if line.strip()]
                    self.words_pool = words
                    self.valid_words_set = set(words)
                    print(f"📖 Loaded {len(self.words_pool)} Korean words from dictionary.")
            except Exception as e:
                print(f"Failed to load 100k dict: {e}")
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

    def get_random_word(self, exclude: Optional[str] = None) -> str:
        candidates = [w for w in self.curated_target_words if w != exclude]
        return random.choice(candidates if candidates else self.curated_target_words)

    def evaluate_guess(self, guess: str, target: str, notice: Optional[str] = None) -> Dict[str, Any]:
        guess = guess.strip()
        similarity = embedding_service.calculate_similarity(guess, target)
        is_answer = (guess == target)

        rank: Optional[int] = None
        if is_answer:
            rank = 1
        elif similarity >= 58.0:
            rank = max(2, min(10, int((100.0 - similarity) / 4.2 * 8) + 2))
        elif similarity >= 45.0:
            rank = 11 + int(((58.0 - similarity) / 13.0) * 89)
        elif similarity >= 35.0:
            rank = 101 + int(((45.0 - similarity) / 10.0) * 199)
        elif similarity >= 24.0:
            rank = 301 + int(((35.0 - similarity) / 11.0) * 699)
        else:
            rank = None

        return {
            "word": guess,
            "similarity": 100.0 if is_answer else similarity,
            "rank": 1 if is_answer else rank,
            "isAnswer": is_answer,
            "inDictionary": True,
            "notice": notice
        }

word_service = WordService()
