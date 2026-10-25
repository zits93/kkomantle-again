#!/usr/bin/env python3
"""
Build Authentic Korean Vocabulary from Real Dictionaries & Modern Wiki
- 국립국어원 표준국어대사전 (Standard Korean Dictionary)
- 국립국어원 우리말샘 (Open Dictionary: neologisms, everyday words)
- 한국어 위키백과 (Korean Wikipedia: modern culture, tech, internet, media)
- 현대 일상 고빈도어 (Media & Subtitle Corpus)
- 5,000 Curated Secret Target Words (Clean 2-4 syllable common nouns)
"""
import os
import csv
import re
import json
import gzip
import urllib.request
from kiwipiepy import Kiwi

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "backend", "data")

OUTPUT_VOCAB_PATH = os.path.join(DATA_DIR, "korean_words_500k.txt")
OUTPUT_TARGETS_PATH = os.path.join(DATA_DIR, "curated_targets.json")

print("🚀 Building Authentic Vocabulary from Authoritative Sources...")

vocab_set = set()
bad_pos = {"어미", "조사", "접사"}

def clean_word(raw):
    if not raw:
        return None
    raw = raw.strip().lstrip('\ufeff')
    raw = re.sub(r'_\(.*?\)', '', raw)
    raw = re.sub(r'\(.*?\)', '', raw)
    if raw.startswith('-') or raw.endswith('-'):
        return None
    w = raw.replace('-', '').replace(' ', '').replace('^', '').replace('_', '')
    if re.fullmatch(r'[가-힣]{1,7}', w):
        return w
    return None

# 1. Base dictionary (existing validated words)
if os.path.exists(OUTPUT_VOCAB_PATH):
    print("Loading existing dictionary base...")
    with open(OUTPUT_VOCAB_PATH, "r", encoding="utf-8") as f:
        for line in f:
            w = clean_word(line)
            if w: vocab_set.add(w)
    print(f"  Current base: {len(vocab_set):,} words")

# 2. Korean Wikipedia Titles Dump (Modern neologisms, culture, tech, pop culture)
print("Fetching and filtering Korean Wikipedia titles...")
wiki_url = "https://dumps.wikimedia.org/kowiki/latest/kowiki-latest-all-titles-in-ns0.gz"
req = urllib.request.Request(wiki_url, headers={"User-Agent": "Mozilla/5.0"})
resp = urllib.request.urlopen(req)

wiki_added = 0
with gzip.GzipFile(fileobj=resp) as gz:
    for line in gz:
        try:
            t = line.decode("utf-8").strip()
        except:
            continue
        if any(c in t for c in [':', '!', '?', '"', '/', '\\', '#', '@', '%', '&', '*']):
            continue
        w = clean_word(t)
        if not w or len(w) < 2 or len(w) > 6:
            continue
        if w.endswith('년대') or w.endswith('년도'):
            continue
        if w not in vocab_set:
            vocab_set.add(w)
            wiki_added += 1

print(f"  Added {wiki_added:,} modern words/entities from Korean Wikipedia.")
print(f"  Total vocabulary now: {len(vocab_set):,} words.")

# 3. Add modern internet neologisms, foods, pop-culture keywords
popular_modern_terms = [
    "유튜브", "넷플릭스", "뉴진스", "웹툰", "카카오톡", "인스타그램", "당근마켓", "배달의민족",
    "페이커", "에스파", "비트코인", "메타버스", "혼밥", "혼술", "혼영", "인생샷", "가심비",
    "뇌피셜", "소확행", "워라밸", "인싸", "아싸", "꿀잼", "노잼", "마라탕", "탕후루",
    "먹방", "치맥", "방탄소년단", "손흥민", "블랙핑크", "스타벅스", "아이브", "쿠팡",
    "아이유", "임영웅", "차은우", "로제", "엽떡", "불닭", "포토이즘", "인생네컷", "스우파",
    "환승연애", "솔로지옥", "슬램덩크", "원피스", "나루토", "귀멸의칼날", "주술회전", "포켓몬",
    "디지몬", "닌텐도", "플레이스테이션", "알고리즘", "딥러닝", "머신러닝", "챗봇", "프롬프트",
    "생성형", "스마트워치", "무선이어폰", "에어팟", "갤럭시", "아이폰", "아이패드", "맥북"
]
for term in popular_modern_terms:
    vocab_set.add(term)

vocab_list = sorted(list(vocab_set))
print(f"💾 Saving {len(vocab_list):,} natural words to {OUTPUT_VOCAB_PATH}...")
with open(OUTPUT_VOCAB_PATH, "w", encoding="utf-8") as f:
    for w in vocab_list:
        f.write(f"{w}\n")
print("✅ Vocabulary file updated successfully!")

print("\n🎯 Verifying Target Pool (5,000 Clean Common Nouns)...")
if os.path.exists(OUTPUT_TARGETS_PATH):
    with open(OUTPUT_TARGETS_PATH, "r", encoding="utf-8") as f:
        targets = json.load(f)
    print(f"Current target pool: {len(targets):,} curated words.")
    
    missing = [t for t in targets if t not in vocab_set]
    if missing:
        print(f"Re-adding {len(missing)} targets to vocab...")
        for m in missing:
            vocab_set.add(m)
        vocab_list = sorted(list(vocab_set))
        with open(OUTPUT_VOCAB_PATH, "w", encoding="utf-8") as f:
            for w in vocab_list:
                f.write(f"{w}\n")

print("\n--- Modern Terms Status ---")
sample_test = ["유튜브", "넷플릭스", "뉴진스", "웹툰", "카카오톡", "인스타그램", "당근마켓", "배달의민족", "페이커", "탕후루", "마라탕", "혼밥", "치맥", "뇌피셜", "비트코인"]
for t in sample_test:
    print(f"{t}: {'✅' if t in vocab_set else '❌'}")

print("\n🎉 Complete!")
