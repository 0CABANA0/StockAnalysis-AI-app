# Lessons Learned — Stock Intelligence Guide Platform

> 개발 중 발견한 교훈과 주의사항.

## 아키텍처

- **Server/Client 컴포넌트 분리**: `page.tsx`(서버, Metadata 내보내기) + `*-client.tsx`(클라이언트, 인터랙션)로 분리하면 SSR 메타데이터와 클라이언트 상태를 깔끔하게 공존시킬 수 있다.
- **API 클라이언트 중앙화**: `apiFetch<T>()` 단일 래퍼로 타입 안전성 + 에러 핸들링 + 인증 헤더를 한 곳에서 관리. 새 엔드포인트 추가가 매우 간단해진다.
- **Supabase SSR 3분할 패턴**: `client.ts` / `server.ts` / `middleware.ts` 분리는 Next.js App Router에서 쿠키 기반 세션을 안정적으로 유지하는 핵심.

## 코드 품질

- **`unknown` vs `any`**: 타입 안전성을 위해 `data: unknown` + 타입 단언(type assertion)이 `data: any`보다 낫다. ESLint `@typescript-eslint/no-explicit-any` 규칙과도 충돌하지 않는다.
- **loading.tsx 패턴 일관성**: 모든 라우트에 `loading.tsx`를 두면 페이지 전환 시 자동 Suspense 경계가 생겨 UX가 크게 개선된다. 빼먹기 쉬우니 새 페이지 생성 시 체크리스트에 포함할 것.
- **Skeleton 크기 맞추기**: `loading.tsx`의 Skeleton 크기는 실제 컨텐츠 레이아웃과 대략 일치해야 CLS(Cumulative Layout Shift)를 줄일 수 있다.

## 개발 프로세스

- **Gap Analysis 방법론**: 백엔드 라우터 목록 vs 프론트엔드 API 클라이언트/페이지를 교차 비교하면 누락된 기능을 체계적으로 발견할 수 있다. 100% 커버리지 달성에 효과적.
- **Config-driven UI**: 관리자 데이터 관리 섹션처럼 `DataJob[]` 배열로 작업을 정의하고 단일 렌더 루프로 그리면, 새 작업 추가가 배열 원소 추가만으로 끝난다.
- **커밋 단위**: 기능 단위 커밋 (API 추가 → UI 추가 → 품질 개선)을 유지하면 롤백과 코드 리뷰가 쉬워진다.

## 주의사항

- **Tailwind v4 문법**: `@apply` 대신 CSS 변수 기반 테마. `@import "tailwindcss"` 사용.
- **Next.js 16 + React 19**: `use()` 훅, `<form>` action 등 새 기능 사용 가능하지만, 라이브러리 호환성 확인 필요.
- **포트 충돌**: 프론트엔드(3000), 백엔드(8000) 동시 실행 시 문제없지만, 다른 프로젝트와 3000번 포트 충돌 주의.
