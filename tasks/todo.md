# TODO — Stock Intelligence Guide Platform

> 현재 진행 상황 및 남은 작업 추적.

## 완료

- [x] 프로젝트 초기 설정 (Next.js 16 + Tailwind v4 + shadcn/ui)
- [x] Supabase Auth + RBAC 4단계 구현
- [x] AppShell 레이아웃 (사이드바 + 탭바 + 헤더)
- [x] Dashboard 페이지 (거시경제 요약 + 감성 분석 + 공포/탐욕)
- [x] Guide 투자 가이드 페이지 (목록 + 상세)
- [x] Macro 거시경제 분석 페이지 (40+ 지표)
- [x] Geo 지정학 리스크 페이지 (목록 + 상세 + 영향분석)
- [x] Recommend 종목 추천 페이지 (카테고리별)
- [x] ETF 스크리너 페이지 (목록 + 상세 + 비교)
- [x] Watchlist 관심종목 페이지
- [x] Chart 차트 페이지 (TradingView Lightweight Charts)
- [x] Calendar 경제 캘린더 페이지
- [x] Simulator 시나리오 시뮬레이션 페이지
- [x] Fear-Greed 공포/탐욕 지수 페이지
- [x] Glossary 용어사전 페이지
- [x] Ask AI Q&A 페이지
- [x] Image 이미지 분석 페이지
- [x] More 더보기 페이지
- [x] Report 주간 종합 리포트 페이지 (목록 + 상세)
- [x] Prediction 예측 성과 페이지
- [x] Performance 포트폴리오 성과 페이지
- [x] Portfolio 포트폴리오 관리 페이지
- [x] Alert 가격 알림 페이지
- [x] Admin 관리자 대시보드 (회원관리, 알림, 감사로그, 설정, 모델관리)
- [x] 관리자 데이터 관리 UI (가격알림/리스크/ETF동기화/공포탐욕 수동 트리거)
- [x] 전 페이지 loading.tsx 스켈레톤 완비 (17개)
- [x] API 엔드포인트 100% 커버리지 (73/73)
- [x] CI/CD GitHub Actions (type-check → lint → format:check → build)
- [x] SEO 메타데이터 + OpenGraph 이미지 + sitemap + robots.txt

## 진행 중

_(현재 없음)_

## 남은 작업

### 우선순위 높음
- [ ] 백엔드 Railway 배포 후 E2E 통합 테스트
- [ ] Telegram Bot 딥링크 연동 테스트
- [ ] Vercel 프로덕션 배포 + 환경변수 설정

### 우선순위 보통
- [ ] 컴포넌트 단위 테스트 추가 (Vitest + RTL)
- [ ] 접근성(a11y) 개선 (ARIA 속성, 키보드 네비게이션)
- [ ] 다크 모드 세부 조정 (차트 색상 등)
- [ ] PWA 설정 (manifest.json, service worker)

### 우선순위 낮음
- [ ] Storybook 도입 (UI 컴포넌트 카탈로그)
- [ ] 성능 최적화 (이미지 최적화, 번들 사이즈 분석)
- [ ] i18n 다국어 지원 준비
