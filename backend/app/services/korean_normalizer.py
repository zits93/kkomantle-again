import re
import difflib
from typing import List, Dict, Optional, Any, Set
from kiwipiepy import Kiwi

CHO_LIST = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ']
JUNG_LIST = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ']
JONG_LIST = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ']

def decompose_hangul(text: str) -> str:
    """Decompose Hangul syllables into Jamo for precise typo distance calculation."""
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
    def __init__(self, words_set: Set[str], words_list: List[str], target_words: Optional[List[str]] = None):
        self.words_set = words_set
        self.words_list = words_list
        self.target_words = target_words or []
        self.kiwi = Kiwi()

        # Seed target words into dictionary set
        for tw in self.target_words:
            self.words_set.add(tw)

        # Build candidate pool for typo correction: target words + common short words
        self.typo_pool = list(set(self.target_words + [w for w in self.words_list[:12000] if len(w) <= 6]))

    def find_typo_correction(self, word: str, threshold: float = 0.85) -> Optional[str]:
        """
        Only called when Kiwi flags the input as OOV (actual typo / non-existent word).
        Searches target & common vocabulary for obvious 1-character/jamo slip typos (e.g. 컾퓨터 -> 컴퓨터).
        """
        if not word or len(word) < 2:
            return None

        word_jamo = decompose_hangul(word)
        best_cand = None
        best_score = 0.0

        for cand in self.typo_pool:
            if abs(len(cand) - len(word)) > 1:
                continue
            c_jamo = decompose_hangul(cand)
            score = difflib.SequenceMatcher(None, word_jamo, c_jamo).ratio()
            if score > best_score:
                best_score = score
                best_cand = cand
                if score >= 0.99:
                    break

        if best_cand and best_score >= threshold:
            return best_cand
        return None

    def normalize_and_validate(self, raw_input: str) -> Dict[str, Any]:
        """
        Disciplined normalization pipeline:
        1. Clean special characters & check non-Hangul
        2. Exact dictionary check
        3. Kiwi morphological analysis:
           - If NO OOV morphemes:
             * Verb/Adjective conjugate: restore citation base form (~다)
             * Noun with particles: strip particles
             * Standard nouns/adverbs (선물, 책상, 불고기, 콜라 등): ACCEPT AS-IS! (NEVER typo correct valid words)
           - If CONTAINS OOV morphemes (actual typo):
             * Attempt close typo correction against target words
             * Otherwise reject as invalid: "사전에 없는 단어입니다."
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

        # Filter out standalone consonants/vowels (e.g. ㅁㄴㅇㄹ, ㅋㅋ) or non-Hangul
        if not re.search(r'[가-힣]', clean):
            return {
                "isValid": False,
                "word": clean,
                "originalWord": raw,
                "message": "한글 완성형 단어를 입력해주세요."
            }

        # 1. Exact match in dictionary set
        if clean in self.words_set:
            return {
                "isValid": True,
                "word": clean,
                "originalWord": raw,
                "notice": None
            }

        # 2. Kiwi morphological analysis
        res = self.kiwi.analyze(clean)
        if not res:
            return {
                "isValid": False,
                "word": clean,
                "originalWord": raw,
                "message": "사전에 없는 단어입니다."
            }

        tokens, score = res[0]

        # Filter out pure symbols / foreign tags
        if any(t.tag in ('SW', 'NA', 'SL', 'SN') for t in tokens):
            return {
                "isValid": False,
                "word": clean,
                "originalWord": raw,
                "message": "사전에 없는 단어입니다."
            }

        has_oov = any(getattr(t, 'oov', False) for t in tokens)

        # 3. Valid Korean morphemes (NO OOV) -> NEVER arbitrary typo correct!
        if not has_oov:
            # 3-A. Verb / Adjective conjugated form restoration (달렸다 -> 달리다, 먹었어 -> 먹다)
            for i, t in enumerate(tokens):
                if t.tag.startswith(('XSA', 'XSV')):
                    prefix = ''.join(tok.form for tok in tokens[:i] if tok.tag.startswith('N'))
                    cand = prefix + t.form + '다'
                    self.words_set.add(cand)
                    return {
                        "isValid": True,
                        "word": cand,
                        "originalWord": raw,
                        "notice": f"{raw} ➔ {cand}" if raw != cand else None
                    }
                if t.tag in ('VV', 'VA'):
                    cand = t.form + '다'
                    self.words_set.add(cand)
                    return {
                        "isValid": True,
                        "word": cand,
                        "originalWord": raw,
                        "notice": f"{raw} ➔ {cand}" if raw != cand else None
                    }

            # 3-B. Noun particle stripping (사과를 -> 사과, 컴퓨터는 -> 컴퓨터)
            if any(t.tag.startswith(('J', 'E')) for t in tokens):
                noun_parts = [t.form for t in tokens if t.tag.startswith('N')]
                if noun_parts:
                    cand = ''.join(noun_parts)
                    self.words_set.add(cand)
                    return {
                        "isValid": True,
                        "word": cand,
                        "originalWord": raw,
                        "notice": f"{raw} ➔ {cand}" if raw != cand else None
                    }

            # 3-C. Standard nouns, noun compounds, adverbs (선물, 책상, 불고기, 콜라, 사이다, 아메리카노 등)
            self.words_set.add(clean)
            return {
                "isValid": True,
                "word": clean,
                "originalWord": raw,
                "notice": None
            }

        # 4. Has OOV -> Try high-confidence typo correction (컾퓨터 -> 컴퓨터, 알골리즘 -> 알고리즘)
        corrected = self.find_typo_correction(clean, threshold=0.85)
        if corrected and corrected != clean:
            return {
                "isValid": True,
                "word": corrected,
                "originalWord": raw,
                "notice": f"{raw} ➔ {corrected} (오타 교정)"
            }

        return {
            "isValid": False,
            "word": clean,
            "originalWord": raw,
            "message": "사전에 없는 단어입니다."
        }
