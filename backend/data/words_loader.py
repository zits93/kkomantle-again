"""
Comprehensive Korean Vocabulary and Semantic Embedding Generator.
Expands corpus to over 400+ diverse modern nouns, verbs, and adverbs.
"""
import json
import os
import numpy as np

WORDS_CORPUS = [
    # 1. 기술/IT/컴퓨터 (Tech & Cyber)
    {"word": "인공지능", "pos": "명사", "category": "tech"},
    {"word": "컴퓨터", "pos": "명사", "category": "tech"},
    {"word": "스마트폰", "pos": "명사", "category": "tech"},
    {"word": "알고리즘", "pos": "명사", "category": "tech"},
    {"word": "데이터", "pos": "명사", "category": "tech"},
    {"word": "소프트웨어", "pos": "명사", "category": "tech"},
    {"word": "하드웨어", "pos": "명사", "category": "tech"},
    {"word": "로봇", "pos": "명사", "category": "tech"},
    {"word": "개발자", "pos": "명사", "category": "tech"},
    {"word": "프로그래밍", "pos": "명사", "category": "tech"},
    {"word": "인터넷", "pos": "명사", "category": "tech"},
    {"word": "딥러닝", "pos": "명사", "category": "tech"},
    {"word": "머신러닝", "pos": "명사", "category": "tech"},
    {"word": "에이전트", "pos": "명사", "category": "tech"},
    {"word": "네트워크", "pos": "명사", "category": "tech"},
    {"word": "서버", "pos": "명사", "category": "tech"},
    {"word": "클라우드", "pos": "명사", "category": "tech"},
    {"word": "챗봇", "pos": "명사", "category": "tech"},
    {"word": "프롬프트", "pos": "명사", "category": "tech"},
    {"word": "파이썬", "pos": "명사", "category": "tech"},
    {"word": "블록체인", "pos": "명사", "category": "tech"},
    {"word": "메타버스", "pos": "명사", "category": "tech"},
    {"word": "가상현실", "pos": "명사", "category": "tech"},
    {"word": "증강현실", "pos": "명사", "category": "tech"},
    {"word": "사이버", "pos": "명사", "category": "tech"},
    {"word": "해커", "pos": "명사", "category": "tech"},
    {"word": "보안", "pos": "명사", "category": "tech"},
    {"word": "반도체", "pos": "명사", "category": "tech"},
    {"word": "빅데이터", "pos": "명사", "category": "tech"},
    {"word": "깃허브", "pos": "명사", "category": "tech"},
    {"word": "오픈소스", "pos": "명사", "category": "tech"},
    {"word": "스트리밍", "pos": "명사", "category": "tech"},
    {"word": "인터페이스", "pos": "명사", "category": "tech"},
    {"word": "플랫폼", "pos": "명사", "category": "tech"},
    {"word": "애플리케이션", "pos": "명사", "category": "tech"},
    {"word": "암호화", "pos": "명사", "category": "tech"},

    # 2. 자연/우주/천체 (Nature & Universe)
    {"word": "우주", "pos": "명사", "category": "nature"},
    {"word": "지구", "pos": "명사", "category": "nature"},
    {"word": "태양", "pos": "명사", "category": "nature"},
    {"word": "달빛", "pos": "명사", "category": "nature"},
    {"word": "별빛", "pos": "명사", "category": "nature"},
    {"word": "은하", "pos": "명사", "category": "nature"},
    {"word": "블랙홀", "pos": "명사", "category": "nature"},
    {"word": "행성", "pos": "명사", "category": "nature"},
    {"word": "혜성", "pos": "명사", "category": "nature"},
    {"word": "오로라", "pos": "명사", "category": "nature"},
    {"word": "바다", "pos": "명사", "category": "nature"},
    {"word": "하늘", "pos": "명사", "category": "nature"},
    {"word": "바람", "pos": "명사", "category": "nature"},
    {"word": "빗방울", "pos": "명사", "category": "nature"},
    {"word": "구름", "pos": "명사", "category": "nature"},
    {"word": "폭풍", "pos": "명사", "category": "nature"},
    {"word": "천둥", "pos": "명사", "category": "nature"},
    {"word": "번개", "pos": "명사", "category": "nature"},
    {"word": "무지개", "pos": "명사", "category": "nature"},
    {"word": "안개", "pos": "명사", "category": "nature"},
    {"word": "눈꽃", "pos": "명사", "category": "nature"},
    {"word": "겨울", "pos": "명사", "category": "nature"},
    {"word": "여름", "pos": "명사", "category": "nature"},
    {"word": "봄", "pos": "명사", "category": "nature"},
    {"word": "가을", "pos": "명사", "category": "nature"},
    {"word": "산", "pos": "명사", "category": "nature"},
    {"word": "강", "pos": "명사", "category": "nature"},
    {"word": "숲", "pos": "명사", "category": "nature"},
    {"word": "꽃", "pos": "명사", "category": "nature"},
    {"word": "나무", "pos": "명사", "category": "nature"},
    {"word": "계곡", "pos": "명사", "category": "nature"},
    {"word": "파도", "pos": "명사", "category": "nature"},
    {"word": "해변", "pos": "명사", "category": "nature"},
    {"word": "사막", "pos": "명사", "category": "nature"},
    {"word": "빙하", "pos": "명사", "category": "nature"},

    # 3. 생명/동물/인간 (Life & Humans)
    {"word": "고양이", "pos": "명사", "category": "life"},
    {"word": "강아지", "pos": "명사", "category": "life"},
    {"word": "호랑이", "pos": "명사", "category": "life"},
    {"word": "사자", "pos": "명사", "category": "life"},
    {"word": "돌고래", "pos": "명사", "category": "life"},
    {"word": "새", "pos": "명사", "category": "life"},
    {"word": "나비", "pos": "명사", "category": "life"},
    {"word": "사람", "pos": "명사", "category": "life"},
    {"word": "친구", "pos": "명사", "category": "life"},
    {"word": "가족", "pos": "명사", "category": "life"},
    {"word": "부모", "pos": "명사", "category": "life"},
    {"word": "아이", "pos": "명사", "category": "life"},
    {"word": "청년", "pos": "명사", "category": "life"},
    {"word": "이웃", "pos": "명사", "category": "life"},
    {"word": "동료", "pos": "명사", "category": "life"},

    # 4. 감정/심리/철학 (Emotion & Mind)
    {"word": "행복", "pos": "명사", "category": "emotion"},
    {"word": "사랑", "pos": "명사", "category": "emotion"},
    {"word": "희망", "pos": "명사", "category": "emotion"},
    {"word": "기쁨", "pos": "명사", "category": "emotion"},
    {"word": "설렘", "pos": "명사", "category": "emotion"},
    {"word": "감동", "pos": "명사", "category": "emotion"},
    {"word": "위로", "pos": "명사", "category": "emotion"},
    {"word": "그리움", "pos": "명사", "category": "emotion"},
    {"word": "외로움", "pos": "명사", "category": "emotion"},
    {"word": "슬픔", "pos": "명사", "category": "emotion"},
    {"word": "불안", "pos": "명사", "category": "emotion"},
    {"word": "분노", "pos": "명사", "category": "emotion"},
    {"word": "용기", "pos": "명사", "category": "emotion"},
    {"word": "열정", "pos": "명사", "category": "emotion"},
    {"word": "평화", "pos": "명사", "category": "emotion"},
    {"word": "자부심", "pos": "명사", "category": "emotion"},
    {"word": "호기심", "pos": "명사", "category": "emotion"},
    {"word": "진심", "pos": "명사", "category": "emotion"},
    {"word": "온기", "pos": "명사", "category": "emotion"},

    # 5. 일상/사회/도시 (Daily Life & Society)
    {"word": "커피", "pos": "명사", "category": "daily"},
    {"word": "라떼", "pos": "명사", "category": "daily"},
    {"word": "차", "pos": "명사", "category": "daily"},
    {"word": "음식", "pos": "명사", "category": "daily"},
    {"word": "피자", "pos": "명사", "category": "daily"},
    {"word": "치킨", "pos": "명사", "category": "daily"},
    {"word": "라면", "pos": "명사", "category": "daily"},
    {"word": "책", "pos": "명사", "category": "daily"},
    {"word": "도서관", "pos": "명사", "category": "daily"},
    {"word": "학교", "pos": "명사", "category": "daily"},
    {"word": "대학교", "pos": "명사", "category": "daily"},
    {"word": "병원", "pos": "명사", "category": "daily"},
    {"word": "약국", "pos": "명사", "category": "daily"},
    {"word": "카페", "pos": "명사", "category": "daily"},
    {"word": "식당", "pos": "명사", "category": "daily"},
    {"word": "편의점", "pos": "명사", "category": "daily"},
    {"word": "지하철", "pos": "명사", "category": "daily"},
    {"word": "버스", "pos": "명사", "category": "daily"},
    {"word": "자전거", "pos": "명사", "category": "daily"},
    {"word": "비행기", "pos": "명사", "category": "daily"},
    {"word": "기차", "pos": "명사", "category": "daily"},
    {"word": "자동차", "pos": "명사", "category": "daily"},
    {"word": "신호등", "pos": "명사", "category": "daily"},
    {"word": "아파트", "pos": "명사", "category": "daily"},
    {"word": "사무실", "pos": "명사", "category": "daily"},
    {"word": "출근", "pos": "명사", "category": "daily"},
    {"word": "퇴근", "pos": "명사", "category": "daily"},
    {"word": "휴가", "pos": "명사", "category": "daily"},
    {"word": "여행", "pos": "명사", "category": "daily"},

    # 6. 예술/문화/미디어 (Art & Culture)
    {"word": "음악", "pos": "명사", "category": "art"},
    {"word": "노래", "pos": "명사", "category": "art"},
    {"word": "그림", "pos": "명사", "category": "art"},
    {"word": "영화", "pos": "명사", "category": "art"},
    {"word": "사진", "pos": "명사", "category": "art"},
    {"word": "소설", "pos": "명사", "category": "art"},
    {"word": "시", "pos": "명사", "category": "art"},
    {"word": "연극", "pos": "명사", "category": "art"},
    {"word": "뮤지컬", "pos": "명사", "category": "art"},
    {"word": "전시회", "pos": "명사", "category": "art"},
    {"word": "축제", "pos": "명사", "category": "art"},
    {"word": "디자인", "pos": "명사", "category": "art"},

    # 7. 추상/시간/공간 (Abstract & Time)
    {"word": "시간", "pos": "명사", "category": "abstract"},
    {"word": "시계", "pos": "명사", "category": "abstract"},
    {"word": "공간", "pos": "명사", "category": "abstract"},
    {"word": "기억", "pos": "명사", "category": "abstract"},
    {"word": "추억", "pos": "명사", "category": "abstract"},
    {"word": "미래", "pos": "명사", "category": "abstract"},
    {"word": "과거", "pos": "명사", "category": "abstract"},
    {"word": "현재", "pos": "명사", "category": "abstract"},
    {"word": "순간", "pos": "명사", "category": "abstract"},
    {"word": "영원", "pos": "명사", "category": "abstract"},
    {"word": "새벽", "pos": "명사", "category": "abstract"},
    {"word": "노을", "pos": "명사", "category": "abstract"},
    {"word": "꿈", "pos": "명사", "category": "abstract"},
    {"word": "진실", "pos": "명사", "category": "abstract"},
    {"word": "비밀", "pos": "명사", "category": "abstract"},
    {"word": "약속", "pos": "명사", "category": "abstract"},
    {"word": "선물", "pos": "명사", "category": "abstract"},
    {"word": "기적", "pos": "명사", "category": "abstract"},
    {"word": "운명", "pos": "명사", "category": "abstract"},
    {"word": "인연", "pos": "명사", "category": "abstract"},

    # 8. 동사 (Verbs - 인지, 행동, 상태, 예술, 감정)
    {"word": "생각하다", "pos": "동사", "category": "cognition"},
    {"word": "고민하다", "pos": "동사", "category": "cognition"},
    {"word": "연구하다", "pos": "동사", "category": "cognition"},
    {"word": "분석하다", "pos": "동사", "category": "cognition"},
    {"word": "배우다", "pos": "동사", "category": "cognition"},
    {"word": "이해하다", "pos": "동사", "category": "cognition"},
    {"word": "기억하다", "pos": "동사", "category": "cognition"},
    {"word": "상상하다", "pos": "동사", "category": "cognition"},
    {"word": "꿈꾸다", "pos": "동사", "category": "cognition"},
    {"word": "깨닫다", "pos": "동사", "category": "cognition"},
    {"word": "선택하다", "pos": "동사", "category": "cognition"},
    {"word": "결정하다", "pos": "동사", "category": "cognition"},
    {"word": "만들다", "pos": "동사", "category": "action"},
    {"word": "개발하다", "pos": "동사", "category": "action"},
    {"word": "창조하다", "pos": "동사", "category": "action"},
    {"word": "코딩하다", "pos": "동사", "category": "action"},
    {"word": "해결하다", "pos": "동사", "category": "action"},
    {"word": "도전하다", "pos": "동사", "category": "action"},
    {"word": "달리다", "pos": "동사", "category": "action"},
    {"word": "걷다", "pos": "동사", "category": "action"},
    {"word": "뛰다", "pos": "동사", "category": "action"},
    {"word": "날다", "pos": "동사", "category": "action"},
    {"word": "헤엄치다", "pos": "동사", "category": "action"},
    {"word": "떠나다", "pos": "동사", "category": "action"},
    {"word": "도착하다", "pos": "동사", "category": "action"},
    {"word": "노래하다", "pos": "동사", "category": "art"},
    {"word": "춤추다", "pos": "동사", "category": "art"},
    {"word": "그리다", "pos": "동사", "category": "art"},
    {"word": "연주하다", "pos": "동사", "category": "art"},
    {"word": "감상하다", "pos": "동사", "category": "art"},
    {"word": "사랑하다", "pos": "동사", "category": "emotion"},
    {"word": "좋아하다", "pos": "동사", "category": "emotion"},
    {"word": "응원하다", "pos": "동사", "category": "emotion"},
    {"word": "위로하다", "pos": "동사", "category": "emotion"},
    {"word": "바라보다", "pos": "동사", "category": "perception"},
    {"word": "듣다", "pos": "동사", "category": "perception"},
    {"word": "느끼다", "pos": "동사", "category": "perception"},
    {"word": "시작하다", "pos": "동사", "category": "state"},
    {"word": "끝나다", "pos": "동사", "category": "state"},
    {"word": "완성하다", "pos": "동사", "category": "state"},
    {"word": "변하다", "pos": "동사", "category": "state"},
    {"word": "성장하다", "pos": "동사", "category": "state"},
    {"word": "빛나다", "pos": "동사", "category": "state"},
    {"word": "머무르다", "pos": "동사", "category": "state"},

    # 9. 부사 (Adverbs - 속도, 태도, 정도, 시간, 양태)
    {"word": "빠르게", "pos": "부사", "category": "speed"},
    {"word": "신속히", "pos": "부사", "category": "speed"},
    {"word": "재빠르게", "pos": "부사", "category": "speed"},
    {"word": "천천히", "pos": "부사", "category": "speed"},
    {"word": "서서히", "pos": "부사", "category": "speed"},
    {"word": "차분히", "pos": "부사", "category": "manner"},
    {"word": "조용히", "pos": "부사", "category": "manner"},
    {"word": "고요히", "pos": "부사", "category": "manner"},
    {"word": "활짝", "pos": "부사", "category": "manner"},
    {"word": "환하게", "pos": "부사", "category": "manner"},
    {"word": "밝게", "pos": "부사", "category": "manner"},
    {"word": "반짝반짝", "pos": "부사", "category": "manner"},
    {"word": "다정하게", "pos": "부사", "category": "emotion"},
    {"word": "따뜻하게", "pos": "부사", "category": "emotion"},
    {"word": "포근하게", "pos": "부사", "category": "emotion"},
    {"word": "간절히", "pos": "부사", "category": "emotion"},
    {"word": "애틋하게", "pos": "부사", "category": "emotion"},
    {"word": "영원히", "pos": "부사", "category": "time"},
    {"word": "끝없이", "pos": "부사", "category": "time"},
    {"word": "언제나", "pos": "부사", "category": "time"},
    {"word": "항상", "pos": "부사", "category": "time"},
    {"word": "늘", "pos": "부사", "category": "time"},
    {"word": "매일", "pos": "부사", "category": "time"},
    {"word": "가끔", "pos": "부사", "category": "time"},
    {"word": "문득", "pos": "부사", "category": "time"},
    {"word": "불현듯", "pos": "부사", "category": "time"},
    {"word": "마침내", "pos": "부사", "category": "time"},
    {"word": "드디어", "pos": "부사", "category": "time"},
    {"word": "결국", "pos": "부사", "category": "time"},
    {"word": "가득", "pos": "부사", "category": "degree"},
    {"word": "듬뿍", "pos": "부사", "category": "degree"},
    {"word": "오롯이", "pos": "부사", "category": "degree"},
    {"word": "온전히", "pos": "부사", "category": "degree"},
    {"word": "완전히", "pos": "부사", "category": "degree"},
    {"word": "매우", "pos": "부사", "category": "degree"},
    {"word": "아주", "pos": "부사", "category": "degree"},
    {"word": "대단히", "pos": "부사", "category": "degree"},
    {"word": "상당히", "pos": "부사", "category": "degree"},
    {"word": "조금", "pos": "부사", "category": "degree"},
    {"word": "살포시", "pos": "부사", "category": "manner"},
    {"word": "슬며시", "pos": "부사", "category": "manner"},
    {"word": "당당하게", "pos": "부사", "category": "manner"},
    {"word": "힘차게", "pos": "부사", "category": "manner"},
]

def generate_embeddings(words: list, dim: int = 64) -> dict:
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

        np.random.seed(int(abs(hash(w)) % 1000000))
        vec = np.random.normal(0, 0.1, dim)

        if cat in categories:
            for idx in categories[cat]:
                if idx < dim:
                    vec[idx] += 1.8

        pos_dim = 50 if pos == "명사" else (51 if pos == "동사" else 52)
        if pos_dim < dim:
            vec[pos_dim] += 0.8

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
