#!/usr/bin/env python3
"""
Build 500k Korean vocabulary and 5,000 curated secret target words.
"""
import os
import csv
import re
import json
import urllib.request
from kiwipiepy import Kiwi

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "backend", "data")

OUTPUT_VOCAB_PATH = os.path.join(DATA_DIR, "korean_words_500k.txt")
OUTPUT_TARGETS_PATH = os.path.join(DATA_DIR, "curated_targets.json")

print("🚀 Step 1: Building ~500,000 Korean Vocabulary...")

vocab_set = set()
bad_pos = {"어미", "조사", "접사"}

def clean_word(raw):
    if not raw:
        return None
    raw = raw.strip().lstrip('\ufeff')
    if raw.startswith('-') or raw.endswith('-'):
        return None
    w = raw.replace('-', '').replace(' ', '').replace('^', '')
    if re.fullmatch(r'[가-힣]{1,8}', w):
        return w
    return None

# 1. kr_korean.csv
kr_path = os.path.join(DATA_DIR, "temp_extracted", "kr_korean.csv")
if os.path.exists(kr_path):
    print("Loading kr_korean.csv...")
    with open(kr_path, "r", encoding="utf-8") as f:
        for row in csv.reader(f):
            if not row: continue
            pos = row[1].strip() if len(row) > 1 else ""
            if pos in bad_pos: continue
            w = clean_word(row[0])
            if w: vocab_set.add(w)
    print(f"  After kr_korean: {len(vocab_set):,} words")

# 2. acidsound
acidsound_path = os.path.join(DATA_DIR, "temp_acidsound.txt")
if os.path.exists(acidsound_path):
    print("Loading temp_acidsound.txt...")
    with open(acidsound_path, "r", encoding="utf-8") as f:
        for line in f:
            w = clean_word(line)
            if w: vocab_set.add(w)
    print(f"  After acidsound: {len(vocab_set):,} words")

# 3. korean_words_100k
k100_path = os.path.join(DATA_DIR, "korean_words_100k.txt")
if os.path.exists(k100_path):
    print("Loading korean_words_100k.txt...")
    with open(k100_path, "r", encoding="utf-8") as f:
        for line in f:
            w = clean_word(line)
            if w: vocab_set.add(w)
    print(f"  After 100k: {len(vocab_set):,} words")

# 4. kp_korean
kp_path = os.path.join(DATA_DIR, "temp_extracted_kp", "kp_korean.csv")
if os.path.exists(kp_path):
    print("Loading kp_korean.csv...")
    with open(kp_path, "r", encoding="utf-8") as f:
        for row in csv.reader(f):
            if not row: continue
            pos = row[1].strip() if len(row) > 1 else ""
            if pos in bad_pos: continue
            w = clean_word(row[0])
            if w: vocab_set.add(w)
    print(f"  After kp_korean: {len(vocab_set):,} words")

# 5. Opendict files if needed to exceed 500,000
opendict_files = ["0050000.xml", "0100000.xml", "0150000.xml", "0200000.xml"]
pattern = re.compile(r'<word><!\[CDATA\[(.*?)\]\]></word>')

for fname in opendict_files:
    if len(vocab_set) >= 505000:
        break
    print(f"Fetching opendict {fname}...")
    try:
        url = f"https://raw.githubusercontent.com/spellcheck-ko/korean-dict-nikl/master/opendict/{fname}"
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        resp = urllib.request.urlopen(req)
        for line in resp:
            m = pattern.search(line.decode("utf-8", errors="ignore"))
            if m:
                w = clean_word(m.group(1))
                if w: vocab_set.add(w)
        print(f"  After {fname}: {len(vocab_set):,} words")
    except Exception as e:
        print(f"  Failed to fetch {fname}: {e}")

# Convert to sorted list and limit to ~500,000 words
vocab_list = sorted(list(vocab_set))
if len(vocab_list) > 500000:
    vocab_list = vocab_list[:500000]

print(f"💾 Saving {len(vocab_list):,} words to {OUTPUT_VOCAB_PATH}...")
with open(OUTPUT_VOCAB_PATH, "w", encoding="utf-8") as f:
    for w in vocab_list:
        f.write(f"{w}\n")
print("✅ Vocabulary file created!")

print("\n🎯 Step 2: Building 5,000 Curated Target Pool...")

# Valid standard dictionary nouns from kr_korean
kr_nouns = set()
if os.path.exists(kr_path):
    with open(kr_path, "r", encoding="utf-8") as f:
        for row in csv.reader(f):
            if len(row) > 1 and row[1].strip() == "명사":
                w = clean_word(row[0])
                if w and 2 <= len(w) <= 4:
                    kr_nouns.add(w)
print(f"Found {len(kr_nouns):,} standard 2-4 syllable nouns in kr_korean.")

# Load existing curated targets
existing_targets = []
if os.path.exists(OUTPUT_TARGETS_PATH):
    with open(OUTPUT_TARGETS_PATH, "r", encoding="utf-8") as f:
        existing_targets = json.load(f)
print(f"Existing curated targets: {len(existing_targets):,}")

# Common subtitle words (FrequencyWords)
print("Fetching subtitle frequency words...")
sub_url = "https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/ko/ko_50k.txt"
req = urllib.request.Request(sub_url, headers={"User-Agent": "Mozilla/5.0"})
raw_lines = urllib.request.urlopen(req).read().decode("utf-8").split("\n")

freq_candidates = []
for line in raw_lines:
    if not line.strip(): continue
    parts = line.strip().split()
    w = parts[0]
    freq = int(parts[1]) if len(parts) > 1 else 0
    if re.fullmatch(r"[가-힣]{2,4}", w):
        freq_candidates.append(w)

kiwi = Kiwi()
final_targets = []
seen = set()

# First add existing targets that are clean Hangul 2-4 chars
for w in existing_targets:
    if re.fullmatch(r"[가-힣]{2,4}", w) and w not in seen:
        final_targets.append(w)
        seen.add(w)

print(f"Valid existing targets retained: {len(final_targets)}")

# Ban / exclusion set (vulgarities, pronouns, grammatical words, sensitive terms)
ban_words = {
    "닥터", "만약", "당장", "대체", "다음", "내일", "이상", "동안", "이번", "그때", "대신",
    "처음", "마지막", "미안", "누구", "어디", "언제", "무엇", "자신", "우리", "너희", "여기",
    "저기", "거기", "얼마", "하나", "둘", "셋", "넷", "다섯", "여섯", "일곱", "여덟", "아홉", "열",
    "정도", "때문", "사실", "경우", "생각", "필요", "새끼", "자식", "바보", "거짓말", "거지",
    "오지", "건지", "오랫동안", "그동안", "눈깔", "창씨개명", "새끼손가락", "지랄", "병신", "미친",
    "새키", "존나", "조낸", "씨발", "개새끼", "쌍놈", "호로", "염병", "똥물", "사형수", "시체"
}

# Add high frequency standard common nouns
print("Filtering high-frequency common nouns with Kiwi...")
for w in freq_candidates:
    if len(final_targets) >= 5000:
        break
    if w in seen or w in ban_words:
        continue
    if w not in kr_nouns:
        continue
    
    # Kiwi analysis: pure NNG (일반명사) only
    res = kiwi.analyze(w)[0]
    tokens, score = res
    if all(t.tag == "NNG" for t in tokens) and not any(t.tag.startswith("X") for t in tokens):
        form = "".join(t.form for t in tokens)
        if form == w and 2 <= len(w) <= 4:
            final_targets.append(w)
            seen.add(w)

# If still under 5,000, supplement with clean high-score nouns from kr_nouns
if len(final_targets) < 5000:
    print(f"Supplementing remaining {5000 - len(final_targets)} nouns from standard dictionary...")
    for w in sorted(list(kr_nouns)):
        if len(final_targets) >= 5000:
            break
        if w in seen or w in ban_words:
            continue
        res = kiwi.analyze(w)[0]
        tokens, score = res
        if all(t.tag == "NNG" for t in tokens) and score > -18.0 and not any(t.tag.startswith("X") for t in tokens):
            form = "".join(t.form for t in tokens)
            if form == w and 2 <= len(w) <= 3:
                final_targets.append(w)
                seen.add(w)

print(f"🎯 Total Final Targets: {len(final_targets):,}")

# Make sure all final targets are in vocab_list
for w in final_targets:
    vocab_set.add(w)

print(f"💾 Saving {len(final_targets):,} target words to {OUTPUT_TARGETS_PATH}...")
with open(OUTPUT_TARGETS_PATH, "w", encoding="utf-8") as f:
    json.dump(final_targets, f, ensure_ascii=False, indent=2)

print("🎉 Complete!")
