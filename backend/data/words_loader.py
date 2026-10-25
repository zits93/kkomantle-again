"""
Word corpus and embedding builder for 꼬맨틀 한번더.
Supports: Nouns (명사), Verbs (동사), Adverbs (부사).
Generates high-quality normalized word vectors.
"""
import json
import os
import math
import numpy as np

WORDS_CORPUS = [
    # 명사 (Nouns)
    {"word": "인공지능", "pos": "명사", "category": "tech"},
    {"word": "컴퓨터", "pos": "명사", "category": "tech"},
    {"word": "스마트폰", "pos": "명사", "category": "tech"},
    {"word": "알고리즘", "pos": "명사", "category": "tech"},
    {"word": "데이터", "pos": "명사", "category": "tech"},
    {"word": "소프트웨어", "pos": "명사", "category": "tech"},
    {"word": "로봇", "pos": "명사", "category": "tech"},
    {"word": "개발자", "pos": "명사", "category": "tech"},
    {"word": "프로그래밍", "pos": "명사", "category": "tech"},
    {"word": "인터넷", "pos": "명사", "category": "tech"},
    {"word": "딥러닝", "pos": "명사", "category": "tech"},
    {"word": "머신러닝", "pos": "명사", "category": "tech"},
    {"word": "에이전트", "pos": "명사", "category": "tech"},
    {"word": "네트워크", "pos": "명사", "category": "tech"},
    {"word": "서버", "pos": "명사", "category": "tech"},
    {"word": "우주", "pos": "명사", "category": "nature"},
    {"word": "지구", "pos": "명사", "category": "nature"},
    {"word": "태양", "pos": "명사", "category": "nature"},
    {"word": "달빛", "pos": "명사", "category": "nature"},
    {"word": "별빛", "pos": "명사", "category": "nature"},
    {"word": "바다", "pos": "명사", "category": "nature"},
    {"word": "하늘", "pos": "명사", "category": "nature"},
    {"word": "바람", "pos": "명사", "category": "nature"},
    {"word": "빗방울", "pos": "명사", "category": "nature"},
    {"word": "구름", "pos": "명사", "category": "nature"},
    {"word": "겨울", "pos": "명사", "category": "nature"},
    {"word": "여름", "pos": "명사", "category": "nature"},
    {"word": "봄", "pos": "명사", "category": "nature"},
    {"word": "가을", "pos": "명사", "category": "nature"},
    {"word": "산", "pos": "명사", "category": "nature"},
    {"word": "강", "pos": "명사", "category": "nature"},
    {"word": "숲", "pos": "명사", "category": "nature"},
    {"word": "꽃", "pos": "명사", "category": "nature"},
    {"word": "나무", "pos": "명사", "category": "nature"},
    {"word": "고양이", "pos": "명사", "category": "life"},
    {"word": "강아지", "pos": "명사", "category": "life"},
    {"word": "새", "pos": "명사", "category": "life"},
    {"word": "사람", "pos": "명사", "category": "life"},
    {"word": "친구", "pos": "명사", "category": "life"},
    {"word": "가족", "pos": "명사", "category": "life"},
    {"word": "아이", "pos": "명사", "category": "life"},
    {"word": "행복", "pos": "명사", "category": "emotion"},
    {"word": "사랑", "pos": "명사", "category": "emotion"},
    {"word": "희망", "pos": "명사", "category": "emotion"},
    {"word": "기쁨", "pos": "명사", "category": "emotion"},
    {"word": "슬픔", "pos": "명사", "category": "emotion"},
    {"word": "분노", "pos": "명사", "category": "emotion"},
    {"word": "용기", "pos": "명사", "category": "emotion"},
    {"word": "열정", "pos": "명사", "category": "emotion"},
    {"word": "평화", "pos": "명사", "category": "emotion"},
    {"word": "커피", "pos": "명사", "category": "daily"},
    {"word": "차", "pos": "명사", "category": "daily"},
    {"word": "음식", "pos": "명사", "category": "daily"},
    {"word": "책", "pos": "명사", "category": "daily"},
    {"word": "도서관", "pos": "명사", "category": "daily"},
    {"word": "음악", "pos": "명사", "category": "art"},
    {"word": "노래", "pos": "명사", "category": "art"},
    {"word": "그림", "pos": "명사", "category": "art"},
    {"word": "영화", "pos": "명사", "category": "art"},
    {"word": "사진", "pos": "명사", "category": "art"},
    {"word": "시계", "pos": "명사", "category": "abstract"},
    {"word": "시간", "pos": "명사", "category": "abstract"},
    {"word": "공간", "pos": "명사", "category": "abstract"},
    {"word": "기억", "pos": "명사", "category": "abstract"},
    {"word": "미래", "pos": "명사", "category": "abstract"},
    {"word": "과거", "pos": "명사", "category": "abstract"},
    {"word": "현재", "pos": "명사", "category": "abstract"},
    {"word": "꿈", "pos": "명사", "category": "abstract"},
    {"word": "진실", "pos": "명사", "category": "abstract"},
    {"word": "비밀", "pos": "명사", "category": "abstract"},

    # 동사 (Verbs)
    {"word": "생각하다", "pos": "동사", "category": "cognition"},
    {"word": "배우다", "pos": "동사", "category": "cognition"},
    {"word": "이해하다", "pos": "동사", "category": "cognition"},
    {"word": "기억하다", "pos": "동사", "category": "cognition"},
    {"word": "만들다", "pos": "동사", "category": "action"},
    {"word": "개발하다", "pos": "동사", "category": "action"},
    {"word": "창조하다", "pos": "동사", "category": "action"},
    {"word": "달리다", "pos": "동사", "category": "action"},
    {"word": "걷다", "pos": "동사", "category": "action"},
    {"word": "날다", "pos": "동사", "category": "action"},
    {"word": "헤엄치다", "pos": "동사", "category": "action"},
    {"word": "노래하다", "pos": "동사", "category": "art"},
    {"word": "춤추다", "pos": "동사", "category": "art"},
    {"word": "그리다", "pos": "동사", "category": "art"},
    {"word": "사랑하다", "pos": "동사", "category": "emotion"},
    {"word": "좋아하다", "pos": "동사", "category": "emotion"},
    {"word": "바라보다", "pos": "동사", "category": "perception"},
    {"word": "듣다", "pos": "동사", "category": "perception"},
    {"word": "느끼다", "pos": "동사", "category": "perception"},
    {"word": "꿈꾸다", "pos": "동사", "category": "cognition"},
    {"word": "시작하다", "pos": "동사", "category": "state"},
    {"word": "끝나다", "pos": "동사", "category": "state"},
    {"word": "변하다", "pos": "동사", "category": "state"},
    {"word": "성장하다", "pos": "동사", "category": "state"},

    # 부사 (Adverbs)
    {"word": "빠르게", "pos": "부사", "category": "speed"},
    {"word": "천천히", "pos": "부사", "category": "speed"},
    {"word": "신속히", "pos": "부사", "category": "speed"},
    {"word": "조용히", "pos": "부사", "category": "manner"},
    {"word": "활짝", "pos": "부사", "category": "manner"},
    {"word": "반짝반짝", "pos": "부사", "category": "manner"},
    {"word": "다정하게", "pos": "부사", "category": "emotion"},
    {"word": "간절히", "pos": "부사", "category": "emotion"},
    {"word": "영원히", "pos": "부사", "category": "time"},
    {"word": "언제나", "pos": "부사", "category": "time"},
    {"word": "항상", "pos": "부사", "category": "time"},
    {"word": "문득", "pos": "부사", "category": "time"},
    {"word": "마침내", "pos": "부사", "category": "time"},
    {"word": "가득", "pos": "부사", "category": "degree"},
    {"word": "오롯이", "pos": "부사", "category": "degree"},
    {"word": "매우", "pos": "부사", "category": "degree"},
    {"word": "아주", "pos": "부사", "category": "degree"},
]

def generate_embeddings(words: list, dim: int = 64) -> dict:
    """Generate deterministic semantic vectors for words."""
    categories = {
        "tech": [0, 1, 2, 3, 4],
        "nature": [5, 6, 7, 8, 9],
        "life": [10, 11, 12, 13],
        "emotion": [14, 15, 16, 17],
        "daily": [18, 19, 20],
        "art": [21, 22, 23],
        "abstract": [24, 25, 26, 27],
        "cognition": [28, 29, 30],
        "action": [31, 32, 33, 34],
        "perception": [35, 36],
        "state": [37, 38],
        "speed": [39, 40],
        "manner": [41, 42],
        "time": [43, 44, 45],
        "degree": [46, 47],
    }

    result = {}
    for item in words:
        w = item["word"]
        cat = item["category"]
        pos = item["pos"]

        # Base vector from seed hash
        np.random.seed(int(abs(hash(w)) % 1000000))
        vec = np.random.normal(0, 0.1, dim)

        # Boost semantic cluster dimensions
        if cat in categories:
            for idx in categories[cat]:
                if idx < dim:
                    vec[idx] += 1.8

        # POS indicator
        pos_dim = 50 if pos == "명사" else (51 if pos == "동사" else 52)
        if pos_dim < dim:
            vec[pos_dim] += 0.8

        # Normalize to unit length
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm

        result[w] = {
            "pos": pos,
            "category": cat,
            "vector": vec.tolist()
        }

    return result

def build_words_file(output_path: str):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    dict_data = generate_embeddings(WORDS_CORPUS)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(dict_data, f, ensure_ascii=False, indent=2)
    print(f"Saved {len(dict_data)} words with vectors to {output_path}")

if __name__ == "__main__":
    out = os.path.join(os.path.dirname(__file__), "words.json")
    build_words_file(out)
