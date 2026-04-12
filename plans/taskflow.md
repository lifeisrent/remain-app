# TaskFlow MVP Plan (Phase 1~5)

## Goal
Remain 앱의 기존 "기억 기록" 흐름에 **자기 전 상상 루틴**을 자연스럽게 통합해,
- 하루 마감 기록 진입률을 높이고
- 감각 중심 기록의 질을 개선한다.

---

## 1) Phase 1 — 데이터 모델/상태 정의 (MVP 기초)

### 1-1. User 설정 필드 확장
- `bedtimeEnabled: boolean` (기본 ON/OFF 정책 추후 확정)
- `bedtimeTime: string` (예: `"23:20"`)
- `bedtimeTone: "gentle" | "firm"` (문구 톤 옵션)

### 1-2. 일일 루틴 상태 필드
- `todayPrompt: string | null`
- `todayImagery: { sound?: string, temperature?: string, light?: string } | null`
- `todayOneLine: string | null`
- `todayCompletedAt: string | null` (ISO)

### 1-3. 누적/습관 지표
- `imaginationStreak: number`
- `lastImaginationDate: string | null` (`YYYY-MM-DD`)

### 1-4. 저장 정책
- 기존 memory 저장 구조를 재사용하고 `entryType: "bedtime_imagination"` 추가.
- 기존 기록 타입과 공존 가능하도록 확장형 스키마 사용.

---

## 2) Phase 2 — 홈 진입점/상태 카드 추가

### 2-1. HomeTab 카드 추가
- 카드명(가칭): `잠들기 전 상상 60초`
- 상태별 UI
  - 미시작: `지금 시작`
  - 진행중: `이어서 하기`
  - 완료: `오늘 완료 ✓`

### 2-2. 정보 표시
- 오늘 선택된 주제(있는 경우)
- streak 값
- 추천 문구(톤 기반)

### 2-3. CTA 동작
- 클릭 시 bedtime 루틴 플로우로 진입
- 기존 write flow와 충돌 없이 탭 상태만 전환

---

## 3) Phase 3 — Bedtime 루틴 플로우 구현

### 3-1. 단계 구성 (MVP)
1. `pick_prompt`: 오늘 상상 주제 선택 (3개 후보)
2. `guide_senses`: 소리/온도/빛 입력 유도
3. `imagine_timer`: 60~90초 집중 타이머
4. `capture_one_line`: 한 줄 기록
5. `done`: 완료 처리 + streak 반영

### 3-2. 완료 기준
- MVP 기준: **한 줄 기록 입력 시 완료**
- 감각 입력은 권장(선택)으로 시작

### 3-3. UX 원칙
- 5~7분 내 종료
- 문구는 짧고 감각 유도 중심
- 기존 감성 톤(아카이비스트 톤) 유지

---

## 4) Phase 4 — 시간 기반 리마인드 통합 (확정 규칙 반영)

### 4-1. notifyTime 해석 규칙
- 매핑 (확정):
  - `morn=07:00`
  - `noon=12:00`
  - `eve=18:00`
  - `night=21:00`
  - `late=23:30`
  - `none=비활성`
- 시간 기준: **로컬 디바이스 시간**
- 허용 오차 윈도우: **5분** (`target ±5min`)

### 4-2. 체크 루프 규칙
- 주기: **1분마다** 체크 (`setInterval 60s`)
- 앱 백그라운드 복귀 시: **즉시 1회 체크**
- 중복 노출 방지: 일별 키 사용
  - 예: `remain:notify:lastShown:YYYY-MM-DD`
  - 같은 날 동일 알림 1회 노출

### 4-3. 노출 UX 규칙 (MVP)
- 기본 노출: **A안(홈 카드 강조만)**
- 톤: **부드럽게**
  - 문구: `오늘의 이야기를 나누어볼까요?`
- 버튼: `지금 기록하기`, `나중에`
- 동작: `지금 기록하기` 클릭 시 `write` 탭 + `card` step으로 이동

### 4-4. 범위
- 이번 MVP는 **앱 실행 중 인앱 노출만** 지원 (푸시 알림 제외)
- 푸시 알림은 다음 단계(backlog)로 분리

### 4-5. 디버그/검증
- `?debugNotify=1`에서 아래 표시:
  - 마지막 체크 시간
  - 오늘 목표 시간
  - 오차 윈도우 판정 결과
  - 오늘 노출 여부(`lastShown`)
---

## 5) Phase 5 — 저장/아카이브/지표

### 5-1. 저장 구조
- 기존 저장 함수 재사용 + `entryType` 분기 저장
- bedtime 기록에는 `prompt/senses/oneLine/completedAt` 포함

### 5-2. 아카이브 확장
- 필터에 `상상 루틴` 추가
- 일반 기록과 함께 시간순 조회 가능

### 5-3. 지표 (MVP)
- 시작률(진입/노출)
- 완료율(완료/진입)
- streak 변화
- 1줄 기록 작성률

---

## MVP 구현 우선순위 (실행 순서)
1. Phase 1 스키마/상태 저장 확정
2. Phase 2 홈 카드 + 진입 버튼
3. Phase 3 루틴 5단계 플로우 연결
4. Phase 4 notifyTime 해석 + 1분 체크 루프 + 홈 카드 강조 트리거
5. Phase 5 저장/필터/기초 지표 반영

---

## 구현 파일 범위 (확정)
- `client/src/App.jsx`
  - 스케줄 체크 루프(1분)
  - 포그라운드 복귀 즉시 체크
  - `debugNotify` 상태 표시
- `client/src/components/HomeTab.jsx`
  - 시간 도달 시 카드 강조 상태/CTA
  - `지금 기록하기` / `나중에` 액션
- `client/src/utils/constants.js` 또는 `client/src/utils/time.js`
  - `notifyTime` → 시각 매핑 함수
  - 윈도우 판정 유틸 (`isWithinNotifyWindow`)
---

## 리스크 및 대응
- 기존 WriteFlow와 상태 충돌 가능 → `entryType`/`flowType` 명시 분리
- 모바일 레이아웃 회귀 가능 → 홈/채팅/프리미엄 기준 회귀 체크리스트 포함
- 초기 이탈 가능 → 첫 버전은 질문 수 최소화(한 줄 완료 우선)

---

## 실행 체크리스트 (1번)

### A. notifyTime = `night(21:00)` 기준 기본 검증
1. 온보딩(또는 저장된 user 설정)에서 `notifyTime=night` 확인
2. URL에 `?debugNotify=1` 붙여 접속
3. 디버그 박스에서 확인:
   - `notifyId: night`
   - `target: 21:00`
   - `last` 값이 1분마다 업데이트되는지
4. 로컬 시간을 목표 시간 ±5분으로 맞춘 뒤 확인:
   - `prompt:true`가 되는지
   - 홈 카드에 `오늘의 이야기를 나누어볼까요?` 표시되는지
5. `나중에` 클릭:
   - 카드 즉시 사라지는지
   - 같은 날 재노출 안 되는지
6. 날짜를 넘기거나 storage 키 삭제 후 재확인

### B. 앱 복귀 즉시 체크 검증
1. 앱 열어둔 상태에서 백그라운드로 전환(1~2분)
2. 다시 포그라운드 복귀
3. 디버그 `last`가 복귀 직후 갱신되는지 확인
4. 목표 시간대에 복귀했을 때 카드가 즉시 뜨는지 확인

### C. CTA 동작 검증
1. 홈 리마인드 카드 `지금 기록하기` 클릭
2. `write` 탭 + `card` step 진입 확인
3. 해당 액션 후 같은 날 재알림 차단 확인

---

## 다음 계획 백로그 (2번)

### Push 알림 확장 계획 (MVP 이후)
1. 인앱 체크 루프와 동일한 규칙을 푸시 스케줄러에 이관
2. 플랫폼별 권한 플로우 추가
   - Android: 알림 권한/채널 구성
   - iOS: 권한 요청 + 시간 민감 알림 정책 검토
3. 알림 payload 통일
   - title: `Remain`
   - body: `오늘의 이야기를 나누어볼까요?`
   - deep link: `app://write/card`
4. 중복 방지 정책 공유
   - 인앱/푸시 공통 `lastShown` 키 또는 서버 상태 동기화
5. 측정 지표 확장
   - push delivered/open rate
   - push→write 진입률
   - 시간대별 완료율

---

## 6) Whisper 음성 기록 도입 계획 (Write 탭)

### 6-1. 목표 (우선순위)
1. **Write 탭에서 음성 버튼 클릭 → 녹음 → 텍스트 변환 → 질문 답변칸 자동 입력**
2. Docker 배포 환경뿐 아니라 **`npm run dev`(client+server 로컬 개발)에서도 동일하게 동작**
3. 기존 텍스트 입력 흐름과 충돌 없이 점진 도입 (실패 시 텍스트 입력 유지)

### 6-2. 현재 전제
- 현 코드베이스에는 Whisper 서버 라우트가 명확히 남아있지 않음(우선 신규 경로로 재정의).
- 따라서 `POST /api/transcribe`를 단일 표준 엔드포인트로 신설해 환경별 구현만 분기.

### 6-3. 아키텍처 (환경별 공통 인터페이스)
- 공통 API: `POST /api/transcribe`
  - 입력: `multipart/form-data` (`audio` 파일)
  - 출력: `{ text: string, durationMs?: number, provider: "openai" | "local" }`

- Provider 분기 (서버 내부)
  - `WHISPER_PROVIDER=openai`:
    - OpenAI Whisper API로 전송
    - 로컬(dev) / Docker(prod) 모두 사용 가능
  - `WHISPER_PROVIDER=local`:
    - 로컬 whisper/faster-whisper 서비스(혹은 컨테이너)에 HTTP 전달
    - Docker에서는 sidecar 구성, dev에서는 선택적으로 로컬 프로세스 사용

### 6-4. 개발 환경(`npm run dev`) 보장 전략
1. 서버 `.env`에 아래를 지원
   - `WHISPER_PROVIDER=openai|local`
   - `OPENAI_API_KEY` (provider=openai일 때)
   - `WHISPER_LOCAL_URL` (provider=local일 때)
2. `npm run dev` 실행 시 서버가 provider 설정을 읽어 동일 라우트(`/api/transcribe`) 처리
3. 프론트는 환경에 무관하게 항상 `/api/transcribe`만 호출

### 6-5. UI/UX 플로우 (Write 탭)
1. 질문 카드에 `🎤 음성으로 답하기` 버튼 추가
2. 상태 머신
   - `idle` → `recording` → `uploading` → `transcribing` → `done|error`
3. 변환 완료 시
   - 현재 질문 입력칸에 결과 텍스트 append 또는 replace (정책 선택)
4. 실패 시
   - 토스트 + 텍스트 입력으로 자연스럽게 복귀

### 6-6. 기술 구현 단계
1. Server
   - `multer`(또는 busboy)로 오디오 업로드 수신
   - `/api/transcribe` 라우트 추가
   - provider adapter (`transcribeWithOpenAI`, `transcribeWithLocal`) 분리
2. Client
   - MediaRecorder 기반 녹음 유틸 추가
   - WriteFlow에서 음성 버튼/진행 상태 UI 추가
   - `client/src/utils/api.js`에 `transcribeAudio(blob)` 추가
3. 문서
   - README + `.env.example`에 dev/docker 공통 설정법 추가

### 6-7. 비기능 요구사항
- 파일 크기 제한(예: 10MB), 시간 제한(예: 90초)
- 서버 rate-limit 경로 분리(`/api/transcribe` 별도 제한)
- PII 주의 문구(음성 업로드 안내)
- 디버그 모드(`?debugAudio=1`)에서 상태/오류 코드 표시

### 6-8. 수용 기준(AC)
1. `npm run dev` 환경에서 음성 녹음 후 텍스트 변환 성공
2. Docker 환경에서 동일 UX/동일 API(`/api/transcribe`)로 동작
3. 변환 실패 시 앱이 멈추지 않고 텍스트 입력으로 즉시 전환 가능
4. 모바일(안드로이드 크롬)에서 최소 1회 성공 시나리오 통과

### 6-9. 구현 순서 제안
1. 서버 라우트 + local provider 우선 (현재 선택)
2. Write 탭 녹음/업로드 UI 연결
3. 수동 변환 버튼 UX(현재 선택) + 한국어 고정
4. dev 실측 테스트(모바일 포함)
5. docker sidecar/연결 정리 + 회귀 테스트 + 문서화

### 6-10. 확정값 (2026-04-12)
- Provider: `local` 우선
- 텍스트 반영: `append`
- 녹음 제한: `220초`
- 전송 방식: 녹음 후 `변환하기` 수동 버튼
- 언어: `ko` 고정
- 실패 UX: 토스트/에러 안내 후 텍스트 계속 작성
- 디버그: `?debugAudio=1` 지원

---

## 7) 계정/인증 영속화 계획 (Postgres + Prisma + Lucia)  ← Option C

### 7-1. 목표
- 서버 재시작/배포 후에도 로그인 유지
- 사용자 식별자를 DB 기반 `userId`로 표준화
- 기존 localStorage 중심 상태를 점진적으로 서버 사용자 상태와 결합

### 7-2. 기술 스택
- DB: PostgreSQL (Railway Postgres)
- ORM: Prisma
- Auth: Lucia (session + cookie)
- Password Hash: argon2
- Session 저장: DB(`sessions` 테이블) + HttpOnly cookie

### 7-3. 데이터 모델 (MVP)
1. `users`
   - `id` (cuid/uuid)
   - `email` (unique, nullable 허용 여부는 정책 결정)
   - `password_hash`
   - `display_name`
   - `created_at`, `updated_at`
2. `sessions`
   - `id` (session id)
   - `user_id` (FK)
   - `expires_at`
3. `user_profile` (기존 user 상태 이관)
   - `user_id` (PK/FK)
   - `purpose`, `soul_id`, `notify_time`, `notify_at_iso`, `notify_at_ms`
4. `memories` (2단계)
   - 기존 local 우선 유지 후 점진 이관

### 7-4. API 설계 (MVP)
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `PUT /api/user/profile` (onboarding/설정 저장)

응답 기본 규칙:
- 성공: 최소 `{ ok: true }` + 필요 데이터
- 실패: `{ error: string }`
- 인증 실패: 401

### 7-5. 프론트 연동 전략
1. 앱 시작 시 `/api/auth/me` 호출
2. 로그인 상태면 서버 profile 로딩 → 현재 `user` state hydration
3. 로그아웃 시 localStorage 사용자 상태/민감 세션 정보 정리
4. 기존 local memory는 MVP에서 유지, 이후 사용자별 서버 저장으로 확장

### 7-6. 쿠키/보안 정책
- Cookie: HttpOnly + SameSite=Lax + Secure(https)
- CORS: `credentials: true` 허용
- 브루트포스 방지: `/api/auth/*` 별도 rate-limit
- 비밀번호 정책: 최소 길이/복잡도(수치 확정 필요)

### 7-7. 마이그레이션 단계
1. Prisma 도입 + users/sessions/profile 테이블 생성
2. auth 라우트 구축 + `me` 엔드포인트
3. Onboarding 저장 경로를 `/api/user/profile`로 전환
4. 기존 local user에서 최초 로그인 시 profile 1회 마이그레이션
5. 메모리 서버 저장은 다음 phase로 분리

### 7-8. 수용 기준(AC)
1. 회원가입/로그인/로그아웃 성공
2. 서버 재시작 후에도 세션 유효 기간 내 자동 로그인 유지
3. Railway 재배포 후에도 사용자 세션 유지
4. 인증 없는 profile 업데이트 요청은 401

### 7-9. 구현 전 확인 질문 (결정 완료, 2026-04-12)
1. 로그인 식별자
   - 결정: **고유 식별 `id` + 로그인용 `username`**
   - 이메일은 이번 MVP 필수 아님 (향후 SNS 로그인 단계에서 활용)
2. 비밀번호 정책
   - 장기 정책: 최소 8자
   - 단기(MVP-0): **비밀번호 없이 username만으로 로그인**
3. 세션 만료 기간
   - 결정: **2일**
4. 회원가입 후 처리
   - 결정: **가입 즉시 로그인**
5. 소셜 로그인
   - 결정: **이번 범위 제외**
6. 기존 localStorage 데이터 이관
   - 결정: **로그인 후 자동 1회 이관**
7. 메모리 서버 저장 시점
   - 결정: **다음 phase로 분리**

### 7-10. 구현 스코프 조정 (결정 반영)
- MVP-0 (지금): `username-only auth`
  - `/api/auth/signup` (username 생성 + 즉시 세션)
  - `/api/auth/login` (username 기반 로그인)
  - `/api/auth/logout`, `/api/auth/me`
- MVP-1 (다음): 비밀번호/이메일/SNS 확장
  - password_hash 컬럼/검증 활성화
  - 이메일 + OAuth provider 확장

---

## 8) 기록 중 인라인 AI 후속질문 (Route A) 계획

### 8-1. 목표
- 사용자가 **텍스트 입력 또는 음성 변환 결과**를 남기면, Write 탭 안에서 AI가 맥락을 읽고
  - 감각/감정 중심의 후속 질문 1~2개를 제시
  - 기록 깊이를 자연스럽게 늘린다.

### 8-2. UX 위치/흐름
- 위치: WriteEditor 하단(힌트 박스 아래, 감각 태그 위)
- 상태:
  1) `idle` (숨김)
  2) `thinking` ("아카이비스트가 읽고 있어요…")
  3) `ready` (질문 1개 + quick reply 2~3개)
  4) `error` (재시도 버튼)
- 사용자 액션:
  - `질문 반영` (텍스트에 삽입)
  - quick reply 탭으로 즉시 확장 문장 추가
  - `이번엔 그만` (현재 세션 AI 질문 중단)

### 8-3. 호출 트리거 규칙 (MVP)
- 아래 중 하나 충족 시 후보
  - 텍스트 길이 >= 40자
  - 음성 변환 성공 직후
- 디바운스: 마지막 입력 후 1500ms
- 호출 제한:
  - 기록 1회 작성 세션당 최대 3회
  - 직전 호출 이후 텍스트 변화량 < 20자면 재호출 스킵
- 강제 호출: `더 물어봐` 버튼

### 8-4. API/프롬프트 구성
- 기존 `/api/chat` 재사용
- 전용 system prompt(후속질문 코치)
- 출력 포맷(JSON 강제):
```json
{"followup":"...","qr":["...","..."],"reason":"optional"}
```

### 8-5. 프롬프트 템플릿 (초안)

#### System Prompt (Route A)
당신은 Remain의 기록 코치입니다.
목표는 사용자가 이미 작성한 기록을 더 깊고 구체적으로 확장하도록 돕는 것입니다.

반드시 아래 JSON 형식으로만 응답하세요 (마크다운 금지):
{"followup":"질문 1개","qr":["짧은 후속 선택지1","짧은 후속 선택지2","짧은 후속 선택지3"]}

규칙:
- 한국어
- 질문은 1개만 (너무 길지 않게)
- 조언/판단/훈계 금지
- 감각(냄새/소리/빛/온도/감촉) 또는 감정 맥락을 파고드는 질문 우선
- 사용자가 이미 쓴 내용을 반복 요약하지 말고, 빈 부분을 찌르는 질문
- qr은 0~3개, 모두 짧고 이어쓰기 좋은 문장 조각

#### User Prompt Template
[질문]
{{question}}

[작성 중 텍스트]
{{text}}

[선택한 감각 태그]
{{sensesCsv}}

[요청]
이 기록을 한 단계 깊게 만들 수 있는 후속 질문 1개와 짧은 이어쓰기 선택지를 만들어주세요.

### 8-6. 클라이언트 상태 모델
- `aiPromptState`: `idle | thinking | ready | error | muted`
- `aiFollowup`: string
- `aiQuickReplies`: string[]
- `aiAskCount`: number
- `aiLastTextFingerprint`: string (길이+해시 간단값)

### 8-7. 안전장치/품질
- API 타임아웃: 8초
- 실패 시 토스트 + `다시 시도`
- 연속 실패 2회 시 자동 음소거(`muted`) + 수동 해제 버튼
- 민감 맥락에서 공격적 문구 금지(프롬프트 규칙)

### 8-8. 수용 기준(AC)
1. 텍스트 40자 이상 입력 시 1.5초 내 후속질문 카드가 뜬다.
2. 음성 변환 완료 직후에도 후속질문이 생성된다.
3. 질문 반영/quick reply 탭 시 텍스트 영역에 자연스럽게 삽입된다.
4. 기록 세션당 호출이 3회를 넘지 않는다.
5. 실패해도 기록 작성 자체는 막히지 않는다.

### 8-9. 구현 순서
1. `api.js`에 `askWriteFollowup()` 추가
2. `WriteFlow.jsx` 상태/디바운스/호출 제한 구현
3. 인라인 후속질문 카드 UI + 액션 버튼
4. 음성 변환 성공 콜백과 트리거 연결
5. 디버그(`?debugCoach=1`) 표시 추가

---

## 9) 자유 입력 기반 AI 대화(정해진 질문 고정 탈피) 계획

### 9-1. 목표
- 기존 고정 질문 중심 흐름에서 벗어나,
  - 사용자가 자유롭게 입력하면
  - AI가 그 맥락을 읽고 자연스럽게 답변하는 대화형 기록 경험 제공.

### 9-2. 제품 방향
- Write 탭: 기록 작성(문장/음성/사진) + 짧은 코치 응답
- Chat 탭: **완전 자유 대화 모드** (이번 계획 핵심)
- 두 탭은 역할 분리:
  - Write = 기록 생성
  - Chat = 대화 탐색/심화

### 9-3. MVP 범위 (Phase A)
1. 사용자 자유 입력 메시지 전송
2. AI가 해당 입력을 읽고 1회 답변 생성
3. 대화 히스토리 유지(세션 내)
4. quick reply는 선택사항으로 유지
5. 오류/재시도 처리

### 9-4. API 구조
- 기존 `/api/chat` 유지
- 요청 body:
  - `messages`: 대화 누적 배열
  - `system`: 아카이비스트 톤 지시
  - `model`: 환경변수/기본 모델
- 응답:
  - Anthropic 원본에서 텍스트 추출 후 UI 표준화

### 9-5. 프롬프트 정책
- 시스템 프롬프트를 “질문 고정형”이 아닌 “맥락 반응형”으로 변경:
  - 사용자의 마지막 메시지를 우선 반영
  - 감정/감각/상황 파악 후 짧은 응답
  - 필요시 1개 질문으로 확장
- 금지:
  - 단정/판단/훈계
  - 매번 같은 질문 템플릿 반복

### 9-6. 상태 모델 (ChatTab)
- `messages`: [{ role: user|assistant, content, at }]
- `pending`: boolean
- `error`: string|null
- `mode`: `free` (기본)

### 9-7. UX 상세
- 입력창 placeholder: “지금 떠오르는 이야기를 자유롭게 적어보세요.”
- 전송 후:
  - 사용자 버블 즉시 표시
  - AI typing 상태 표시
  - 응답 버블 append
- 실패 시:
  - 실패 버블 + 재시도 버튼

### 9-8. 단계별 실행 계획
1. ChatTab 메시지 구조를 자유 대화형으로 정리
2. `askClaude()`를 자유 입력 히스토리 기반 호출로 단순화
3. 응답 파서 강건화(JSON 강제 실패 시 plain text fallback)
4. 세션 내 히스토리 저장(Store) 연결
5. QA: 반복 질문, 장문 입력, 빈 응답, API 에러

### 9-9. 수용 기준(AC)
1. 사용자가 임의 문장을 보내면 AI가 맥락에 맞게 답변한다.
2. 이전 메시지 문맥을 최소 5턴 이상 유지한다.
3. API 실패 시 재시도 가능하고 UI가 멈추지 않는다.
4. 답변 톤이 아카이비스트 성격을 유지한다.

### 9-10. 구현 전 확인 질문
1. Chat 히스토리 저장 범위:
   - A) 세션 동안만
   - B) localStorage로 영구 저장
2. 1회 응답 길이:
   - A) 짧게(2~4문장)
   - B) 길게(최대 8문장)
3. quick reply 유지 여부:
   - A) 유지
   - B) 제거
4. 모델 우선순위:
   - A) Anthropic 기본
   - B) Coach처럼 provider 분리

