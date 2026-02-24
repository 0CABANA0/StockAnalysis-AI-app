# 배포 가이드 — Stock Intelligence Guide Platform

## 아키텍처

```
[Vercel] ── Next.js 16 (프론트엔드)
    │
    └── HTTPS ──→ [Railway] ── FastAPI (백엔드)
                      │
                      ├── [Supabase] ── PostgreSQL + Auth
                      ├── [OpenRouter] ── AI API
                      └── [Telegram] ── 봇 알림
```

---

## 1단계: Supabase 설정

### 프로젝트 생성
1. [supabase.com](https://supabase.com) → New Project
2. Region: `Northeast Asia (Seoul)` 권장
3. 생성 후 **Project Settings → API**에서 키 복사:
   - `Project URL` → SUPABASE_URL
   - `anon public` → NEXT_PUBLIC_SUPABASE_ANON_KEY
   - `service_role` → SUPABASE_SERVICE_KEY (백엔드 전용)

### 마이그레이션 실행
Supabase Dashboard → SQL Editor에서 아래 파일을 **순서대로** 실행:

```
supabase/migrations/001_create_enums.sql
supabase/migrations/002_create_business_tables.sql
supabase/migrations/003_create_admin_tables.sql
supabase/migrations/004_create_indexes.sql
supabase/migrations/005_create_rls_policies.sql
supabase/migrations/006_create_triggers.sql
supabase/migrations/007_seed_data.sql
supabase/migrations/008_add_account_type.sql
supabase/migrations/009_v2_schema_changes.sql
supabase/migrations/010_seed_v2_data.sql
supabase/migrations/011_news_categories.sql
```

### Auth 설정
- **Authentication → Providers**: Email 활성화
- **Authentication → URL Configuration**:
  - Site URL: `https://your-app.vercel.app`
  - Redirect URLs: `https://your-app.vercel.app/auth/callback`

---

## 2단계: Railway 배포 (백엔드)

### 프로젝트 생성
1. [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Repository 연결 후 **Root Directory**: `backend`
3. Railway가 `Procfile` + `runtime.txt`를 자동 감지

### 환경변수 설정

| 변수 | 필수 | 설명 |
|------|------|------|
| `SUPABASE_URL` | 필수 | Supabase Project URL |
| `SUPABASE_SERVICE_KEY` | 필수 | service_role 키 |
| `CORS_ORIGINS` | 필수 | Vercel 도메인 (예: `https://your-app.vercel.app`) |
| `SCHEDULER_ENABLED` | 필수 | `true` (데이터 자동 수집) |
| `OPENROUTER_API_KEY` | 권장 | AI 분석 기능 전체에 필요 |
| `FRED_API_KEY` | 선택 | FRED 경제 데이터 (품질 향상) |
| `ECOS_API_KEY` | 선택 | 한국은행 데이터 |
| `TELEGRAM_BOT_TOKEN` | 선택 | 텔레그램 알림 |
| `TELEGRAM_CHAT_ID` | 선택 | 텔레그램 수신 채팅 |
| `TELEGRAM_BOT_ENABLED` | 선택 | `true`로 봇 활성화 |
| `APP_DOMAIN` | 선택 | 프론트엔드 URL (딥링크용) |

### 배포 확인
```
GET https://your-railway-app.up.railway.app/api/health
→ {"status": "ok", "timestamp": "..."}
```

### 헬스체크
`railway.toml`에 헬스체크가 설정되어 있음:
- Path: `/api/health`
- Timeout: 30초
- 실패 시 자동 재시작 (최대 3회)

---

## 3단계: Vercel 배포 (프론트엔드)

### 프로젝트 연결
1. [vercel.com](https://vercel.com) → Import Git Repository
2. Root Directory: 프로젝트 루트 (StockAnalysis-AI-app)
3. Framework: Next.js (자동 감지)

### 환경변수 설정

| 변수 | 필수 | 설명 |
|------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | 필수 | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 필수 | anon public 키 |
| `NEXT_PUBLIC_APP_URL` | 필수 | Vercel 도메인 (예: `https://your-app.vercel.app`) |
| `NEXT_PUBLIC_API_URL` | 필수 | Railway 백엔드 URL + `/api` |

### 배포 확인
```
https://your-app.vercel.app → 로그인 페이지 표시
```

---

## 4단계: GitHub Secrets 설정 (CI용)

Repository → Settings → Secrets and variables → Actions:

| Secret | 값 |
|--------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public 키 |
| `NEXT_PUBLIC_API_URL` | Railway 백엔드 URL + `/api` |

---

## 5단계: 배포 후 검증 체크리스트

### 인프라
- [ ] Railway `/api/health` → `{"status": "ok"}`
- [ ] Vercel 메인 페이지 로딩
- [ ] CORS: 프론트엔드에서 백엔드 API 호출 성공

### 인증
- [ ] 회원가입 → 이메일 확인 → 로그인 성공
- [ ] 로그아웃 → 리다이렉트 정상
- [ ] 미인증 시 `/auth/login`으로 리다이렉트

### 데이터
- [ ] 대시보드 → 거시경제 데이터 표시 (스케줄러 실행 후)
- [ ] 용어사전 → 50건 시드 데이터 표시
- [ ] 지정학 → 8개 리스크 표시
- [ ] 경제 캘린더 → 20건 이벤트 표시

### 관리자
- [ ] SUPER_ADMIN 계정으로 `/admin` 접근
- [ ] 회원 관리 → 목록 표시
- [ ] AI 모델 설정 → 5개 설정 표시

### 스케줄러
- [ ] Railway 로그에서 스케줄 작업 실행 확인
- [ ] `macro_snapshots` 테이블에 데이터 생성 확인

---

## SUPER_ADMIN 계정 생성

최초 배포 후 SUPER_ADMIN을 설정하려면:

1. 일반 회원가입으로 계정 생성
2. Supabase Dashboard → Table Editor → `user_profiles`
3. 해당 사용자의 `role`을 `SUPER_ADMIN`으로 변경

---

## 트러블슈팅

### CORS 오류
- `CORS_ORIGINS`에 Vercel 도메인이 정확히 포함되어 있는지 확인
- 프로토콜(`https://`) 포함, 뒤에 `/` 없이 입력

### 스케줄러가 실행되지 않음
- `SCHEDULER_ENABLED=true` 확인
- Railway 로그에서 `Starting scheduler...` 메시지 확인

### AI 기능 비활성
- `OPENROUTER_API_KEY`가 설정되어 있는지 확인
- OpenRouter 대시보드에서 크레딧 잔액 확인

### 텔레그램 봇
- `TELEGRAM_BOT_ENABLED=true` 필수
- BotFather에서 봇 생성 후 토큰 입력
- `/start` 명령으로 chat_id 확인
