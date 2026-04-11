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
