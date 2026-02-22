# StockAnalysis AI

AI 기반 주식 분석 대시보드 애플리케이션

## 기술 스택

- **프레임워크**: Next.js 16 (App Router + Turbopack)
- **언어**: TypeScript (strict mode)
- **스타일링**: Tailwind CSS v4 + shadcn/ui
- **인증/DB**: Supabase (PostgreSQL + Auth)
- **배포**: Vercel
- **CI/CD**: GitHub Actions

## 시작하기

### 사전 요구사항

- Node.js 22+
- npm 10+
- Supabase 프로젝트 (https://supabase.com)

### 설치

```bash
# 저장소 클론
git clone https://github.com/your-username/StockAnalysis-AI-app.git
cd StockAnalysis-AI-app

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env.local
# .env.local 파일에 Supabase 크레덴셜 입력

# 개발 서버 실행
npm run dev
```

### 사용 가능한 스크립트

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 실행 (Turbopack) |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 프로덕션 서버 실행 |
| `npm run lint` | ESLint 검사 |
| `npm run format` | Prettier 포맷팅 |
| `npm run format:check` | 포맷팅 확인 |
| `npm run type-check` | TypeScript 타입 검사 |

## 프로젝트 구조

```
src/
├── app/                  # App Router 페이지
│   ├── auth/             # 인증 (로그인/회원가입)
│   ├── dashboard/        # 대시보드
│   ├── admin/            # 관리자 패널
│   ├── layout.tsx        # 루트 레이아웃
│   ├── page.tsx          # 홈페이지
│   ├── error.tsx         # 에러 바운더리
│   ├── not-found.tsx     # 404 페이지
│   └── loading.tsx       # 로딩 UI
├── components/
│   ├── ui/               # shadcn/ui 컴포넌트
│   ├── layout/           # 레이아웃 컴포넌트
│   ├── auth/             # 인증 컴포넌트
│   └── dashboard/        # 대시보드 컴포넌트
├── lib/
│   ├── supabase/         # Supabase 클라이언트 (client/server/middleware)
│   └── utils.ts          # 유틸리티 함수
├── hooks/                # 커스텀 React 훅
├── types/                # TypeScript 타입 정의
└── styles/               # 추가 스타일
```

## 환경 변수

| 변수 | 설명 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 익명 키 |
| `NEXT_PUBLIC_APP_URL` | 앱 URL (기본: http://localhost:3000) |

## 배포

Vercel에 자동 배포됩니다. `main` 브랜치에 push하면 프로덕션 배포가 트리거됩니다.

## 라이선스

MIT
