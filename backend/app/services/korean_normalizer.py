import re
import difflib
from typing import List, Dict, Optional, Any, Set
from kiwipiepy import Kiwi

CHO_LIST = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ']
JUNG_LIST = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ']
JONG_LIST = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ']

def decompose_hangul(text: str) -> str:
    """Decompose Hangul syllables into Jamo (Cho, Jung, Jong) for fine-grained edit distance."""
    res = []
    for ch in text:
        code = ord(ch)
        if 0xAC00 <= code <= 0xD7A3:
            idx = code - 0xAC00
            res.append(CHO_LIST[idx // 588])
            res.append(JUNG_LIST[(idx % 588) // 28])
            if idx % 28 > 0:
                res.append(JONG_LIST[idx % 28])
        else:
            res.append(ch)
    return ''.join(res)

class KoreanNormalizer:
    def __init__(self, words_set: Set[str], words_list: List[str]):
        self.words_set = words_set
        self.words_list = words_list
        self.kiwi = Kiwi()
        
        # Build first-character inverted index for ultra-fast Levenshtein candidate search (<3ms)
        self.by_first_char: Dict[str, List[str]] = {}
        for w in self.words_list:
            if w:
                self.by_first_char.setdefault(w[0], []).append(w)

    def find_typo_correction(self, word: str, threshold: float = 0.82) -> Optional[str]:
        if not word:
            return None
        candidates = self.by_first_char.get(word[0], [])
        if not candidates:
            # Fallback to similar length words
            candidates = [w for w in self.words_list if abs(len(w) - len(word)) <= 1][:2000]

        word_jamo = decompose_hangul(word)
        best_word = None
        best_score = 0.0

        for c in candidates:
            if abs(len(c) - len(word)) > 1:
                continue
            c_jamo = decompose_hangul(c)
            score = difflib.SequenceMatcher(None, word_jamo, c_jamo).ratio()
            if score > best_score:
                best_score = score
                best_word = c
                if score == 1.0:
                    break

        if best_word and best_score >= threshold:
            return best_word
        return None

    def normalize_and_validate(self, raw_input: str) -> Dict[str, Any]:
        """
        Main pipeline:
        1. Sanitize & clean special chars
        2. Exact dictionary check
        3. Kiwi morphological lemmatization (restore base forms & strip particles)
        4. Jamo-level typo auto-correction
        """
        raw = raw_input.strip()
        clean = re.sub(r'[^가-힣a-zA-Z0-9]', '', raw)
        if not clean:
            return {
                "isValid": False,
                "word": "",
                "originalWord": raw,
                "message": "단어를 입력해주세요."
            }

        # 1. Exact match in dictionary
        if clean in self.words_set:
            return {
                "isValid": True,
                "word": clean,
                "originalWord": raw,
                "notice": None
            }

        # 2. Kiwi morphological lemmatization
        tokens = self.kiwi.tokenize(clean)
        if not tokens:
            return {
                "isValid": False,
                "word": clean,
                "originalWord": raw,
                "message": "올바른 한국어 단어가 아닙니다."
            }

        # 2-A. Verb / Adjective conjugation restoration
        # e.g. 달렸다 -> 달리다, 먹었어 -> 먹다, 행복했다/행복햇다 -> 행복하다, 사랑스러워 -> 사랑스럽다
        for i, t in enumerate(tokens):
            if t.tag.startswith(('XSA', 'XSV')):
                prefix = ''.join(tok.form for tok in tokens[:i] if tok.tag.startswith('N'))
                cand = prefix + t.form + '다'
                return {
                    "isValid": True,
                    "word": cand,
                    "originalWord": raw,
                    "notice": f"{raw} ➔ {cand}" if raw != cand else None
                }
            if t.tag in ('VV', 'VA'):
                cand = t.form + '다'
                return {
                    "isValid": True,
                    "word": cand,
                    "originalWord": raw,
                    "notice": f"{raw} ➔ {cand}" if raw != cand else None
                }

        # 2-B. Noun particle stripping
        # e.g. 사과를 -> 사과, 컴퓨터는 -> 컴퓨터, 인공지능으로 -> 인공지능
        if any(t.tag.startswith(('J', 'E')) for t in tokens):
            noun_parts = [t.form for t in tokens if t.tag.startswith('N') or t.tag in ('SN', 'SL')]
            if noun_parts:
                cand = ''.join(noun_parts)
                return {
                    "isValid": True,
                    "word": cand,
                    "originalWord": raw,
                    "notice": f"{raw} ➔ {cand}" if raw != cand else None
                }

        # 3. Typo auto-correction if not found yet
        if clean not in self.words_set:
            corrected = self.find_typo_correction(clean)
            if corrected and corrected != clean:
                return {
                    "isValid": True,
                    "word": corrected,
                    "originalWord": raw,
                    "notice": f"{raw} ➔ {corrected} (오타 교정)"
                }

        # 4. Filter non-Hangul or gibberish
        if not re.search(r'[가-힣]', clean):
            return {
                "isValid": False,
                "word": clean,
                "originalWord": raw,
                "message": "한글 단어를 입력해주세요."
            }

        if any(t.tag in ('UNK', 'SW', 'NA', 'SL') for t in tokens):
            return {
                "isValid": False,
                "word": clean,
                "originalWord": raw,
                "message": "사전에 없는 단어입니다."
            }

        # Standard accepted word
        return {
            "isValid": True,
            "word": clean,
            "originalWord": raw,
            "notice": None
        }
