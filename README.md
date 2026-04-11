# 🌒 Remain — 당신의 이야기는

> 삶은 끝나도, 당신이 남긴 것들은 계속해서 누군가에게 전해집니다.

AI 기반 삶 기록 모바일 앱. Claude AI 아카이비스트와의 대화, 감각 기억 저장, Notion 자동 동기화.

---

## 스택

| 영역 | 기술 |
|------|------|
| Frontend | React 18 + Vite 5 |
| Backend | Node.js 22 + Express |
| AI | Anthropic Claude (`claude-sonnet-4-20250514`) |
| 외부 연동 | Notion MCP |
| 저장 | localStorage (클라이언트) |
| 배포 | Docker / Railway / Render |

---

## 시작하기

### 1. 클론 & 설치

```bash
git clone https://github.com/your-repo/remain-app.git
cd remain-app
npm run install:all
```

### 2. 환경변수 설정

```bash
cp server/.env.example server/.env
```

`server/.env` 파일을 열어 API 키를 입력하세요:

```env
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxx
HOST=0.0.0.0
PORT=3001
CLIENT_URLS=http://localhost:5173,http://<내_LAN_IP>:5173
```

**API 키 발급:** https://console.anthropic.com/

### 3. 개발 서버 실행

```bash
npm run dev
```

- 클라이언트: http://localhost:5173
- 서버: http://localhost:3001
- 헬스체크: http://localhost:3001/api/health

### 4. 로컬 네트워크(LAN)에서 접속하기

1. 개발 PC의 IP 확인
   - macOS/Linux: `ip a` 또는 `ifconfig`
   - Windows: `ipconfig`
2. `server/.env`에서 `HOST=0.0.0.0` 확인
3. `CLIENT_URLS`에 LAN URL 추가
   - 예: `CLIENT_URLS=http://localhost:5173,http://192.168.0.10:5173`
4. 루트 `.env`(선택)에 아래 값 설정

```env
VITE_HOST=0.0.0.0
VITE_PORT=5173
VITE_API_PROXY_TARGET=http://localhost:3001
```

5. 실행 후 다른 기기에서 접속
   - `http://<내_LAN_IP>:5173`

> 참고: 같은 Wi-Fi/로컬 네트워크에 있어야 하며, OS 방화벽에서 5173/3001 포트를 허용해야 합니다.

---

## 배포

### 방법 1 — Docker (권장)

```bash
# .env 파일에 ANTHROPIC_API_KEY 설정 후:
docker-compose up -d
```

앱이 http://localhost:3001 에서 실행됩니다.

---

### 방법 2 — Railway (클릭 한 번)

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template)

1. Railway 프로젝트 생성
2. 이 저장소 연결
3. 환경변수 추가: `ANTHROPIC_API_KEY`
4. 자동 배포 완료 ✓

---

### 방법 3 — Render

1. https://render.com → New Web Service
2. 저장소 연결
3. 설정:
   - **Build Command:** `cd client && npm ci && npm run build`
   - **Start Command:** `cd server && npm ci && node index.js`
   - **Root Directory:** (비워두기)
4. 환경변수: `ANTHROPIC_API_KEY`, `NODE_ENV=production`

---

### 방법 4 — 수동 빌드 & 배포

```bash
# 1. 클라이언트 빌드 (→ server/public/ 에 생성됨)
cd client && npm run build

# 2. 서버 실행
cd ../server
NODE_ENV=production node index.js
```

---

## 프로젝트 구조

```
remain-app/
├── client/                    # React 앱 (Vite)
│   ├── src/
│   │   ├── App.jsx            # 루트 컴포넌트
│   │   ├── components/
│   │   │   ├── Soul.jsx       # 영혼 캐릭터 SVG
│   │   │   ├── NavIcons.jsx   # 하단 내비게이션 아이콘
│   │   │   ├── Onboarding.jsx # 7단계 온보딩
│   │   │   ├── HomeTab.jsx    # 홈 화면
│   │   │   ├── WriteFlow.jsx  # 기억 기록 플로우
│   │   │   ├── ChatTab.jsx    # 아카이비스트 채팅
│   │   │   └── OtherTabs.jsx  # 아카이브 + 프리미엄
│   │   ├── utils/
│   │   │   ├── api.js         # Claude API 호출
│   │   │   ├── storage.js     # localStorage 추상화
│   │   │   └── constants.js   # 상수 (SOULS, QUESTIONS…)
│   │   └── styles/
│   │       └── global.css     # 전역 스타일
│   ├── public/
│   │   └── favicon.svg
│   ├── index.html
│   └── vite.config.js         # Vite 설정 (proxy + build outDir)
│
├── server/                    # Express API 서버
│   ├── index.js               # 서버 진입점
│   ├── package.json
│   └── .env.example
│
├── Dockerfile                 # 멀티스테이지 빌드
├── docker-compose.yml
├── railway.json               # Railway 배포 설정
└── package.json               # 루트 (concurrently)
```

---

## API 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| `POST` | `/api/chat` | Claude API 프록시 (아카이비스트 채팅 + Notion MCP) |
| `GET`  | `/api/health` | 서버 상태 확인 |

### POST /api/chat

```json
// Request body
{
  "messages": [{ "role": "user", "content": "..." }],
  "system": "optional system prompt",
  "model": "claude-sonnet-4-20250514",
  "max_tokens": 1000,
  "mcp_servers": [{ "type": "url", "url": "https://mcp.notion.com/mcp", "name": "notion" }]
}

// Response: Anthropic API response object
```

---

## 기능

| 기능 | 설명 |
|------|------|
| 온보딩 | 7단계: 목적 → 이름 → 영혼 → 첫 질문 → 알림 → 완료 |
| 홈 | 오늘의 질문, 주간 스트릭, 기억 칩 |
| 기록 | 글쓰기, 감각 태그, 힌트 카드, 깊이 측정기 |
| 채팅 | Claude AI 실시간 대화, 4가지 모드, 퀵 리플라이 |
| 아카이브 | 저장된 기억 목록, 감각 필터 |
| 프리미엄 | 구독 플랜 UI |
| 저장 | localStorage 자동 저장 + Notion MCP 동기화 |

---

## 환경변수

| 변수 | 필수 | 기본값 | 설명 |
|------|------|--------|------|
| `ANTHROPIC_API_KEY` | ✓ | — | Anthropic API 키 |
| `PORT` | | `3001` | 서버 포트 |
| `HOST` | | `127.0.0.1` | 서버 바인딩 호스트 (`0.0.0.0`이면 LAN 허용) |
| `CLIENT_URLS` | | `http://localhost:5173` | CORS 허용 URL 목록(쉼표 구분) |
| `NODE_ENV` | | `development` | `production` 설정 시 정적 파일 서빙 |

---

## 라이선스

MIT
