# 꼬맨틀 한번더 (Kkomantle Again) 🎯

> **집단 지성 한국어 단어 유사도 추리 게임**
> AI Slop 느낌 없는 감각적인 UI와 업무 위장 엑셀 테마, 실시간 멀티플레이어를 지원하는 차세대 단어 맞추기 게임.

---

## ✨ 핵심 기능 (Features)

### 1. 듀얼 테마 시스템 (Anti-AI Slop Taste)
* **Liquid Glass (기본)**: iOS/Glassmorphism 스타일의 심미적 디자인. 섬세한 `backdrop-blur`, 유려한 그라디언트 메쉬 배경 및 스프링 애니메이션.
* **Excel 위장 모드 (스텔스 테마)**: 사무실에서 당당하게 딴짓할 수 있는 완벽한 Microsoft Excel 인터페이스.
  * 단축키: `Alt + X` 또는 `Esc` 2회 연속 입력.
  * 초록색 리본 탭, 수식 입력줄(`fx: [단어 입력]`), 셀 그리드 데이터 시트 제공.

### 2. 게이미피케이션 & 인터랙션 FX
* **VSCode Power Mode 타이핑 효과**: 타자를 칠 때마다 커서 주변에 스파크와 콤보 카운터, 화면 미세 진동(Screen Shake) 발동.
* **유사도별 시각/청각 피드백**:
  * `< 45%` (차가움): 푸른색 잔물결
  * `45% ~ 70%` (따뜻함): 호박색 스파크
  * `> 70%` (매우 뜨거움): 화염 이펙트 및 고음 멜로디
  * `100%` (정답): 슈퍼노바 폭죽(`canvas-confetti`) 및 팡파레!
* **정답자 분기 시스템**:
  * 내가 맞췄을 때: 대형 폭죽 + 명예의 전당 점수 상승 + 메달 순위 변동 애니메이션 + 정답 공개.
  * 다른 사람이 맞췄을 때: 미니 폭죽 및 알림 토스트만 발사되며, **모두의 단어 목록에 정답을 올리지 않아 다른 플레이어가 직접 맞출 재미를 보존**합니다.

### 3. 상단 헤더 & 멀티플레이어
* **실시간 접속자**: 접속자 수 배지에 마우스를 올리면 접속자들의 닉네임과 마스킹된 IP 목록 팝오버 확인.
* **명예의 전당**:
  * 1, 2, 3위 금·은·동 메달(🥇, 🥈, 🥉) 시상대 렌더링.
  * 닉네임 + 클라이언트 IP 해시를 교차 검증하여 동일 사용자 다중 계정 어뷰징 방지.
* **한번더 (시트 재설정) 투표**:
  * 접속자가 1명일 때는 즉시 새로운 문제로 변경.
  * 접속자가 2명 이상일 때는 2명 이상 동의 시 단어가 변경되어 게임의 공정성 유지.

### 4. 우측 하단 실시간 채팅 & 정답 공개
* **최근 300개 메시지 링버퍼**: 백엔드 메모리에 최근 300개 대화만 유지.
* **안 읽은 메시지 뱃지**: 브라우저 `localStorage`에 마지막으로 읽은 메시지 ID를 저장하여 확인하지 않은 메시지 개수(+N) 배지 표시.
* **정답 공개 기능**: 진행이 너무 어려울 경우 채팅창 헤더의 '정답 공개' 버튼을 통해 라운드 해답 확인 가능.

### 5. 풍부한 어휘 & 로컬 Qwen Fallback
* **품사 지원**: 명사, 동사, 부사 전방위 지원 (예: `인공지능`, `생각하다`, `빠르게`).
* **임베딩 2-Tier**:
  1. 초고속 코사인 유사도 연산 (< 1ms).
  2. 사전에 없는 신조어/오타의 경우 로컬 Qwen 모델(Ollama / Qwen2.5)을 통한 실시간 임베딩 추출 지원.

---

## 🛠️ 기술 스택 (Tech Stack)

* **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Framer Motion, Canvas Confetti, Web Audio API
* **Backend**: Python 3.11, FastAPI, WebSockets, SQLite, NumPy, Uvicorn
* **Deployment**: GitHub Pages (Frontend), Cloud/Docker (Backend)

---

## 🚀 로컬 실행 방법 (Getting Started)

### 프론트엔드 (Frontend)
```bash
cd frontend
npm install
npm run dev
# 브라우저에서 http://localhost:3000 접속
```

### 백엔드 (FastAPI)
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 📦 배포 (Deployment)

* **Frontend (GitHub Pages)**: `.github/workflows/deploy.yml` 설정으로 `main` 브랜치 푸시 시 자동 배포됩니다.
* **Backend**: Fly.io, Render, Railway, Hugging Face Spaces 또는 전용 VPS에 배포 후 프론트엔드의 WebSocket 주소를 환경변수 `VITE_WS_URL`로 연결합니다.
