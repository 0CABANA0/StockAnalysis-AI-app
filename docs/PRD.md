# Stock Intelligence Platform — PRD v1.6.0

> **문서 버전**: v1.6.0
> **작성일**: 2026-02-22
> **작성자**: JG (J.A.R.V.I.S. AI Assistant 협업)
> **상태**: Draft — 내부 검토 중

---

## 1. 제품 개요

### 1.1 비전

거시경제 지표, 지정학적 리스크, 환율 변동 등 다층적 외부 신호를 실시간으로 분석하여 개인 투자자에게 AI 기반 종목 추천과 포트폴리오 트렌드 관리 기능을 제공하는 인텔리전트 주식 관리 플랫폼을 구축한다.

### 1.2 목표

- 개인 투자자의 정보 비대칭(Information Asymmetry) 해소
- 기술적 지표 + 거시 경제 + AI Sentiment Analysis의 통합 예측 제공
- 매수/매도 이력 추적 및 손익 시각화를 통한 투자 의사결정 지원
- 지정학 리스크 및 환율 변동을 자동 감지하여 포트폴리오 리스크 알림

### 1.3 범위

**IN-SCOPE:**
- 한국 주식(KOSPI/KOSDAQ), 미국 주식(NYSE/NASDAQ), 환율 연동
- 국내외 ETF (KODEX/TIGER/KBSTAR/SPY/QQQ 등), 국내 공모펀드 수익률 조회
- 뉴스 RSS 수집 + Claude API 감성 분석, 기술적 지표 스크리닝
- 포트폴리오 CRUD, 거래 이력, 손익 계산, 가격 알림

**OUT-OF-SCOPE (v1):**
- 실시간 주문 체결, 자동 매매 (HTS/MTS 연동)
- 선물/옵션 전용 분석, 세금 계산서 출력

---

## 2. 사용자 및 이해관계자

### 2.1 타겟 사용자

| 사용자 유형 | 특징 | 핵심 니즈 |
|------------|------|----------|
| 개인 투자자 | 주식 경험 1~5년, 앱 사용 편의성 중시 | 복잡한 거시 정보를 쉽게 해석하여 매수/매도 타이밍 파악 |
| 전문 투자자 | 다수 종목 관리, 빠른 정보 처리 요구 | 실시간 리스크 알림, 멀티 포트폴리오 통합 관리 |
| 리서치 관심자 | 학습 목적, 데이터 분석 관심 | 지정학 이벤트와 주가 상관관계 분석 데이터 접근 |

### 2.2 이해관계자

- **Product Owner (JG)**: 요구사항 정의, 우선순위 결정
- **Developer (JG + Claude Code)**: 설계, 구현, 배포
- **End Users**: 베타 테스터 피드백 제공

---

## 3. 기능 요구사항

시스템은 7개의 독립적인 기능 모듈로 구성되며, 각 모듈은 단독 또는 통합으로 동작한다.

### 3.1 모듈 A — 포트폴리오 관리 (Portfolio Management)

**FR-A01: 종목 등록 및 관리**
- 종목 코드(Ticker), 종목명, 시장 구분(KOSPI/KOSDAQ/NYSE/NASDAQ) 등록
- 보유 종목 목록 조회, 수정, 삭제 (soft delete 방식)
- 섹터(Sector) 및 산업군(Industry) 자동 분류

**FR-A02: 거래 이력 관리 (Transaction History)**
- 매수(BUY) / 매도(SELL) 거래 입력: 수량, 가격, 수수료, 날짜, 메모
- 평균 매수가(Average Buy Price) 자동 계산
- 실현 손익(Realized P&L) 및 미실현 손익(Unrealized P&L) 분리 표시
- 거래세(0.20%) 및 증권사 수수료 자동 반영

**FR-A03: 손익 시각화 (P&L Visualization)**
- 종목별 / 전체 포트폴리오 손익률 차트 (일/주/월)
- 섹터별 비중 Pie Chart
- 투자 원금 vs 평가 금액 누적 Area Chart
- TradingView Lightweight Charts 기반 캔들스틱 차트

### 3.2 모듈 B — 주식 추천 엔진 (Recommendation Engine)

**FR-B01: 기술적 지표 스크리닝 (Technical Screening)**
- RSI(14일) 과매도 구간 감지 (임계값: 30 이하 → BUY 신호)
- MACD 골든크로스 / 데드크로스 감지
- 볼린저 밴드(Bollinger Bands, 20일) 상/하단 이탈 감지
- PER(P/E Ratio) 저평가 기준 필터 (기본값: 15 이하)
- 종합 스크리닝 점수(0~100) 산출 후 임계값 이상 종목만 추천

**FR-B02: 추천 결과 관리**
- 추천 근거, 목표가(Target Price), 손절가(Stop Loss), 신뢰도 점수 저장
- 추천 유효 기간(Expires At) 설정 및 만료 처리
- 사용자별 추천 이력 추적 및 적중률 통계

### 3.3 모듈 C — 거시 경제 & 지정학 리스크 분석

**FR-C01: 거시 데이터 자동 수집**
- 환율: USD/KRW, USD/JPY, EUR/USD, CNY/KRW (yfinance)
- 원자재: WTI 원유, 금(Gold), 구리(Copper), LNG
- 금리: 미국 10년 국채(^TNX), 공포지수 VIX(^VIX)
- 글로벌 지수: S&P 500, NASDAQ, KOSPI, NIKKEI, 상해종합

**FR-C02: 뉴스 & 지정학 이벤트 수집**
- RSS 피드 자동 수집: Reuters, Bloomberg, 한국경제, 매일경제, BBC World
- 수집 주기: 1시간 단위 자동 갱신
- 이벤트 유형 자동 분류: GEOPOLITICAL / ECONOMIC / CURRENCY / REGULATORY / NATURAL

**FR-C03: Claude API 감성 분석 (Sentiment Analysis)**
- 뉴스 배치(최대 20건)를 Claude Sonnet에 전달하여 구조화 분석
- 감성 점수(-1.0 ~ +1.0), 방향성(BULLISH/BEARISH/NEUTRAL), 신뢰도 반환
- 영향 섹터, 영향 국가, 핵심 이벤트 목록 자동 추출
- 단기(1~3일) / 중기(1~4주) 시장 영향 예측 요약 생성

**FR-C04: 지정학 이벤트 섹터 영향도 매핑**
- 이벤트 유형별 섹터 영향도 룩업 테이블 (미중 무역분쟁, 중동 분쟁, 러-우 전쟁, 북한 리스크, 미국 금리 변동 등)
- 종목 섹터에 따른 환율 영향 방향 자동 계산 (수출주 vs 수입주)

### 3.4 모듈 D — 통합 예측 스코어링 (Composite Prediction Engine)

**FR-D01: 가중 합산 스코어링**

| 신호 요소 | 가중치 | 데이터 소스 | 비고 |
|----------|--------|-----------|------|
| 기술적 지표 (Technical) | 30% | yfinance / FinanceDataReader | RSI, MACD, BB |
| 글로벌 거시 지표 (Macro) | 25% | yfinance | VIX, 금리, 지수 |
| 뉴스 감성 (Sentiment) | 20% | RSS + Claude API | 방향성, 신뢰도 |
| 환율 영향 (Currency) | 15% | yfinance | 수출/수입주 구분 |
| 지정학 리스크 (Geopolitical) | 10% | 뉴스 분류 + 매핑 테이블 | 섹터별 영향도 |

**FR-D02: 투자 의견 산출**
- STRONG BUY (60 이상) / BUY (25~59) / HOLD (-24~24) / SELL (-25~-59) / STRONG SELL (-60 이하)
- 리스크 레벨 산출: HIGH / MEDIUM / LOW (VIX + 지정학 복합 산식)
- 낙관 / 기본 / 비관 3가지 시나리오 및 목표가 범위 제시

**FR-D03: AI 분석 리포트 자동 생성**
- 종합 진단, 주요 리스크, 기회 요인, 시나리오, 투자 의견 포함 리포트
- Claude API로 한국어 리포트 자동 생성 (500토큰 이내)
- 종목별 / 포트폴리오 전체 리포트 각각 생성

### 3.5 모듈 E — 알림 시스템 (Alert System)

**FR-E01: 가격 알림**
- 목표가(Target Price) 도달 알림
- 손절가(Stop Loss) 도달 알림
- 일일 등락률 임계값 초과 알림 (기본: ±5%)

**FR-E02: 리스크 알림**
- VIX 30 돌파 시 포트폴리오 전체 HIGH RISK 경보
- 주요 지정학 이벤트 감지 시 관련 보유 종목 즉시 알림
- 환율 급변(±2% 이상 일일 변동) 시 수출입 섹터 보유자 알림

**FR-E03: 텔레그램 봇 알림 (Push)**
- python-telegram-bot 기반 단방향 Push 알림
- 가격 알림: 종목명, 설정가, 현재가, 시각 포함 메시지 즉시 발송
- 리스크 경보: VIX 30 돌파 또는 Urgency HIGH 시 핵심 이벤트 요약 발송
- AI 리포트 완료 알림: STRONG BUY/SELL 또는 HIGH RISK 종목 요약 발송
- 메시지 형식: HTML 마크업 (볼드, 코드블록, 이탤릭)
- BOT_TOKEN, CHAT_ID는 Railway 환경변수 — 코드 내 하드코딩 금지

**FR-E04: 텔레그램 봇 양방향 명령어**
- `/portfolio` — 보유 종목 전체 손익 요약 조회
- `/macro` — 거시 지표 스냅샷 (환율, VIX, 주요 지수) 조회
- `/report [ticker]` — 특정 종목 AI 분석 리포트 생성 요청
- `/alert [ticker] [price]` — 가격 알림 즉시 등록
- `/risk` — 포트폴리오 리스크 레벨 및 주의 종목 목록 조회
- Webhook 방식으로 Railway 백엔드에서 수신 처리

### 3.6 모듈 F — 펀드 & ETF 관리

**FR-F01: ETF 전용 데이터 수집**
- 국내 ETF: FinanceDataReader로 KODEX/TIGER/KBSTAR 전 종목 수집. NAV, 괴리율, TER, 분배금 이력 추적.
- 해외 ETF: yfinance 기반 SPY/QQQ/TLT/GLD 등. AUM, 수익률, 배당수익률. 원화 환산 손익 자동 계산.
- 국내 공모펀드: KOFIA OpenAPI — 펀드 코드 기반 NAV 조회. 펀드 유형 분류, 환매 소요일 표시.

**FR-F02: 펀드 & ETF 포트폴리오 관리**
- 기존 포트폴리오 모듈(A)과 통합 — 자산 유형별 탭 분리 (주식 / ETF / 펀드)
- 추가 매수(적립식) 거래 유형 지원
- TER 보유 기간 자동 반영, 분배금 수령 이력 기록
- ETF/펀드 vs 직접 주식 투자 수익률 비교 차트

**FR-F03: ETF 추천 스크리닝**
- 테마 필터: 반도체 / AI / 2차전지 / 방산 / 리츠 / 배당주 / 채권
- 수익률 기준: 3/6/12개월 수익률 상위 ETF 자동 추출
- 거시 감성 연계: BEARISH → 채권 ETF(TLT), BULLISH → 성장 ETF(QQQ) 자동 추천
- 괴리율 경보: NAV 대비 시장가 ±1% 초과 시 매수 주의

**FR-F04: 거시 지표 연계 ETF 자동 매핑**

| 이벤트 시나리오 | 수혜 예상 ETF | 근거 |
|---------------|-------------|------|
| 미국 금리 인상 | TLT, KBSTAR 달러단기채 | 금리 상승 → 성장주 부정, 단기채/달러 강세 |
| 미중 무역 갈등 심화 | KODEX 방산, TIGER 방산, ITA | 지정학 긴장 → 방위산업 수요 증가 |
| WTI 유가 급등 | KODEX WTI원유선물, GLD, XLE | 원자재 가격 상승 → 에너지 ETF 수혜 |
| 원화 약세 (USD/KRW 상승) | TIGER 미국S&P500, SPY, QQQ | 달러 자산 ETF 원화 기준 수익 증가 |
| VIX 급등 (30 이상) | KODEX 인버스, SQQQ, TLT | 시장 공포 → 안전자산/인버스 수혜 |
| AI/반도체 테마 강세 | KODEX AI반도체핵심장비, SOXX, SMH | 산업 테마 모멘텀 |

**FR-F05: 펀드 & ETF 성과 분석**
- 벤치마크 비교: 선택 ETF vs KOSPI/S&P 500/코스닥 수익률 비교 차트
- 리스크 조정 수익률: 샤프 지수(Sharpe Ratio), 최대 낙폭(MDD) 자동 계산
- 롤링 수익률: 1/3/6/12개월 구간별 히트맵 시각화
- 상관관계 매트릭스: 보유 ETF 간 분산 투자 효과 분석

### 3.7 모듈 G — 이미지 기반 포트폴리오 분석

**FR-H01: 이미지 업로드 및 인식**
- 지원 포맷: JPG / PNG / WEBP / HEIC
- 업로드 방식: 파일 선택, 드래그 앤 드롭, 모바일 카메라 직접 촬영
- 최대 10MB / 1회 최대 5장
- 인식 대상: 종목명/코드, 보유 수량, 평균 매수가, 현재가/평가금액, 수익률, ETF/펀드명

**FR-H02: Claude Vision API 분석 파이프라인**
1. **이미지 전처리**: base64 인코딩 → Claude API document/image 타입 전달
2. **OCR + 구조화**: Claude Vision이 JSON 구조로 종목 정보 추출
3. **데이터 검증**: yfinance/FinanceDataReader로 종목 코드 검증, 매칭 실패 시 수동 확인 요청
4. **거시 분석 연계**: 인식된 보유 종목에 대해 모듈 C/D 즉시 실행
5. **투자 가이드 생성**: 종합 투자 가이드 리포트 생성

**FR-H03: AI 투자 가이드 생성**
- 포트폴리오 전체 진단: 섹터 집중도, 분산 투자 점수, 리스크 레벨
- 종목별 개별 의견: STRONG BUY / BUY / HOLD / SELL / STRONG SELL
- 리밸런싱 제안: 비중 과대 종목 축소 + 편입 검토 종목 제안
- 손절/목표가 가이드: 보유 종목별 자동 제안
- 3단계 액션 플랜: '이번 주', '이번 달', '3개월 내' 투자 행동 가이드
- 출력: 화면 내 리포트 + PDF 다운로드 + 텔레그램 알림(선택)

**FR-H04: 개인정보 보호 — 이미지 처리 원칙**
- 분석 후 즉시 서버에서 삭제 — 영구 저장 안 함
- 개인 식별 정보(계좌번호, 이름 등) 감지 시 자동 마스킹
- Anthropic API로만 전송, 제3자 미공유
- 추출된 데이터는 해당 회원 DB에만 암호화 저장
- 이미지 처리 로그: 파일명, 처리 시각, 인식 성공 여부만 기록

---

## 4. 기술 아키텍처

### 4.1 기술 스택

| 레이어 | 기술 / 도구 | 버전/플랜 | 배포 |
|-------|-----------|---------|------|
| Frontend | Next.js (React) + TypeScript | Next.js 16+ | Vercel (Free/Hobby) |
| Backend API | Python FastAPI + APScheduler | Python 3.11+ | Railway (Hobby $5/mo) |
| Database | Supabase (PostgreSQL + Auth + Realtime) | Free Tier | Supabase Cloud |
| 주가 데이터 | yfinance, FinanceDataReader | 무료 | API Call (백엔드) |
| 한국 주식 | KIS Developers API (한국투자증권) | 무료 Open API | API Call (백엔드) |
| AI 분석 | OpenRouter API (500+ 모델 통합) | Pay-as-you-go | openrouter.ai |
| 차트 | TradingView Lightweight Charts | v4 (무료) | CDN / npm |
| 알림 봇 | python-telegram-bot + Telegram Bot API | v21+ (무료) | Railway (통합) |
| 펀드 데이터 | KOFIA OpenAPI (금융투자협회) | 무료 | API Call (백엔드) |
| 성과 분석 | scipy + numpy | 최신 안정 버전 | Railway (백엔드) |

### 4.2 OpenRouter API — 모델 전략

OpenRouter는 단일 API 키로 500+ AI 모델에 접근하는 통합 게이트웨이.

**채택 이유:**
- 단일 엔드포인트 — 개별 API 관리 불필요
- 자동 폴백 — 장애 시 동급 모델 자동 전환
- Auto-Router — 요청 복잡도에 따라 최적 모델 자동 선택
- 컨텍스트 캐싱 — Gemini 3 캐시 90% 할인
- 통합 과금

**기능별 추천 모델 (2026년 2월 기준):**

| 사용 기능 | 추천 모델 | 선택 이유 | 비용 (1M tokens) |
|----------|----------|----------|-----------------|
| 이미지 분석 (Vision OCR) | claude-opus-4-6 | 최고 Vision 정확도 | $5 / $25 |
| 복잡한 AI 분석 리포트 | claude-opus-4-6 | 최고 추론력 | $5 / $25 |
| 뉴스 감성 분석 (배치) | gemini-3-flash-preview | 1M 컨텍스트, 대량 처리 | $0.50 / $3 |
| 텔레그램 봇 리포트 요약 | claude-sonnet-4-6 | 속도/비용/품질 균형 | $3 / $15 |
| 거시 지표 빠른 해석 | deepseek-v3.2 | GPT급 성능, 비용 1/50 | $0.25 / $0.38 |
| 종목 스크리닝 요약 | deepseek-v3.2 | 대량 처리 저비용 | $0.25 / $0.38 |
| 개발/테스트 환경 | mimo-v2-flash:free | 무료 | 무료 |

**기능별 모델 전환 설정:**

| Config Key | Primary 모델 | Fallback 모델 |
|-----------|-------------|--------------|
| IMAGE_ANALYSIS | claude-opus-4-6 | claude-sonnet-4-6 |
| DEEP_REPORT | claude-opus-4-6 | gpt-5.2 |
| SENTIMENT_BATCH | gemini-3-flash-preview | claude-sonnet-4-6 |
| TELEGRAM_SUMMARY | claude-sonnet-4-6 | deepseek-v3.2 |
| SCREENING_BULK | deepseek-v3.2 | mimo-v2-flash:free |

**연동 구조:**
- Base URL: `https://openrouter.ai/api/v1` (OpenAI 호환)
- 환경변수: `OPENROUTER_API_KEY` (Railway Env Var)
- 모델 전환: `model_configs` DB 테이블로 중앙 관리 — ADMIN/SUPER_ADMIN 전용
- 자동 폴백: primary 장애 시 fallback 자동 전환

### 4.3 시스템 아키텍처 다이어그램

```
[ 사용자 브라우저 / 모바일 ]
│  HTTPS
▼
[ Vercel ] Next.js Frontend  ──────────────────────────────
│  REST API / JSON                                  │
▼                                                   │
[ Railway ] Python FastAPI Backend                   [ Supabase ]
│                                            PostgreSQL
├── yfinance / FinanceDataReader             Auth (JWT)
├── RSS Feedparser (뉴스 수집)               Realtime
├── KIS Developers API (한국 주식)
├── KOFIA API (펀드 데이터)
├── APScheduler (07:00 / 13:00 / 18:00 KST)
└── OpenRouter API
    ├── claude-opus-4-6      → 이미지 분석 / 정밀 리포트
    ├── gemini-3-flash       → 뉴스 감성 분석 (1M ctx)
    ├── claude-sonnet-4-6    → 텔레그램 요약
    ├── deepseek-v3.2        → 대량 스크리닝 (저비용)
    └── mimo-v2-flash:free   → 개발/테스트 환경
```

### 4.4 데이터베이스 스키마

**핵심 비즈니스 테이블:**

| 테이블명 | 주요 컬럼 | 설명 |
|---------|---------|------|
| `portfolio` | id, user_id, ticker, company_name, market, sector | 보유 종목 마스터 |
| `transactions` | id, portfolio_id, type(BUY/SELL), quantity, price, fee, trade_date | 매수/매도 거래 이력 |
| `recommendations` | id, ticker, reason, target_price, stop_loss, confidence_score, strategy | AI 추천 종목 |
| `price_alerts` | id, user_id, ticker, alert_type, trigger_price, is_triggered | 가격 알림 설정 |
| `macro_snapshots` | id, snapshot_data(JSONB), collected_at | 거시 지표 스냅샷 |
| `sentiment_results` | id, score, direction, confidence, event_type, urgency, reasoning | 뉴스 감성 분석 결과 |
| `prediction_scores` | id, ticker, short_term_score, medium_term_score, direction, risk_level, report_text | 통합 예측 + AI 리포트 |
| `etf_fund_master` | id, ticker, name, asset_type, category, ter, benchmark, fund_code | ETF/펀드 마스터 |
| `distributions` | id, portfolio_id, amount, record_date, payment_date, distribution_type | 분배금/배당금 이력 |
| `etf_macro_mapping` | id, event_scenario, etf_tickers(JSONB), rationale | 거시 이벤트 → 수혜 ETF 매핑 |

**관리자 모드 테이블:**

| 테이블명 | 주요 컬럼 | 설명 |
|---------|---------|------|
| `user_profiles` | id, user_id, role(ENUM), status(ENUM), telegram_chat_id, last_login | 회원 역할/상태 관리 |
| `notification_targets` | id, user_id, telegram_chat_id, groups(ARRAY), is_active | 알림 수신 대상 |
| `notification_groups` | id, group_code, description, auto_condition(JSONB) | 알림 그룹 정의 |
| `notification_history` | id, sender_admin_id, target_type, message, sent_at, success/fail_count | 알림 발송 이력 |
| `audit_logs` | id, admin_id, action_type, target_user_id, detail(JSONB) | 감사 로그 (append-only) |
| `role_change_logs` | id, target_user_id, old_role, new_role, changed_by, reason | 역할 변경 이력 |
| `model_configs` | id, config_key, primary_model, fallback_model, is_active, updated_by | AI 모델 설정 (ADMIN+ 전용) |
| `model_change_logs` | id, config_key, old_primary, new_primary, changed_by, reason | AI 모델 변경 이력 (append-only) |

---

## 5. 비기능 요구사항

### 5.1 성능
- API 응답 시간: 일반 조회 500ms 이내, 분석 파이프라인 30초 이내
- 뉴스 수집 주기: 1시간 단위 (장중 30분, 장 마감 후 1시간)
- 자동 분석 스케줄: 하루 3회 (07:00 / 13:00 / 18:00 KST)

### 5.2 보안
- Supabase Auth JWT 인증, RLS 전면 적용
- API Key, BOT_TOKEN, CHAT_ID — Railway 환경변수 관리, 코드 내 하드코딩 금지
- 모든 API 통신 HTTPS 강제, CORS 화이트리스트 설정

### 5.3 개인정보 보호

**수집하지 않는 정보:**
- 실명 / 생년월일 / 주민번호 — 이메일과 닉네임만 사용
- 계좌번호 / 금융 인증 정보 — 모든 거래 데이터는 사용자 수동 입력
- 전화번호 / 주소 — IP는 세션 로그 임시 기록 후 24시간 내 삭제
- 업로드 이미지 원본 — 분석 완료 즉시 영구 삭제
- 투자 성향 / 재무 정보

**저장되는 정보:**
- 이메일: 인증/비밀번호 재설정 목적만. 마케팅 발송 없음
- 포트폴리오/거래 이력: 회원 본인만 접근 가능한 암호화 공간
- 텔레그램 Chat ID: 알림 목적, 동의 시에만 저장
- 분석 결과/AI 리포트: 본인 계정 귀속, 탈퇴 시 즉시 삭제

**데이터 보존 기간:**
- 탈퇴 신청: 7영업일 내 완전 삭제
- 관리자 퇴출: soft delete → 30일 후 완전 삭제
- 비활성(12개월 미로그인): 사전 고지 후 삭제

### 5.4 관리자 데이터 접근 제한

> 관리자는 회원의 투자 데이터를 열람할 수 없습니다.

**관리자 접근 가능:** 계정 상태 정보, 시스템 운영 정보, 알림 대상 지정
**관리자 접근 불가 (기술적 차단):**
- 포트폴리오/보유 종목: RLS `user_id = auth.uid()` — ADMIN 예외 없음
- 거래 이력: transactions RLS 본인만 SELECT
- AI 리포트/예측 점수: prediction_scores RLS 소유자 외 조회 불가
- 이미지 업로드: 분석 즉시 삭제, DB 저장 자체 없음
- 손익 금액: DB 미저장, 프론트엔드 실시간 계산

**기술적 구현:**
- Supabase RLS: ADMIN/SUPER_ADMIN도 투자 테이블 접근 차단 (No bypass RLS)
- FastAPI 미들웨어: ADMIN의 투자 데이터 엔드포인트 접근 시 403 Forbidden
- 관리자 UI: 투자 데이터 섹션 렌더링 차단
- 감사 로그: 투자 데이터 접근 시도 시 BLOCKED 자동 기록

### 5.5 확장성
- 추천 엔진 가중치: DB 설정 테이블 관리 — ADMIN 이상만 수정
- AI 모델 설정: DB `model_configs` 테이블 — ADMIN 이상만 변경
- 지정학 매핑 테이블: JSON 파일 분리 관리
- 모듈별 독립 배포 가능 구조

### 5.6 법적 준수사항
- 개인 투자 참고 도구 — 금융투자업 인가 서비스 아님
- 타인 유료 제공 시 자본시장법 제7조 위반 가능
- 예측 정확도: 방향성 약 55~65% — 절대적 매매 신호로 활용 불가
- 모든 화면에 면책 문구 표시 의무화
- 개인정보 처리방침 회원가입/설정 페이지에서 항상 접근 가능

---

## 6. 화면 구성

### 6.1 페이지 구조

| 페이지 | 라우트 | 주요 컴포넌트 |
|-------|------|-------------|
| 대시보드 | `/` (index) | 포트폴리오 요약, 거시 지표 게이지, 리스크 신호등 |
| 포트폴리오 | `/portfolio` | 보유 종목 목록, 손익 테이블, 섹터 비중 차트 |
| 거래 입력 | `/trade/[id]` | 매수/매도 폼, 수수료 자동 계산, 이력 리스트 |
| 추천 종목 | `/recommend` | 스크리닝 결과 리스트, 점수별 정렬, AI 분석 요약 |
| 종목 차트 | `/chart/[ticker]` | TradingView 캔들스틱, RSI/MACD 서브차트, AI 리포트 |
| 거시 분석 | `/macro` | 환율/원자재 대시보드, 뉴스 감성 타임라인, 지정학 맵 |
| 예측 리포트 | `/report/[ticker]` | 통합 점수 게이지, 3가지 시나리오 카드, AI 리포트 |
| 알림 설정 | `/alerts` | 목표가/손절가 설정, 지정학 알림 토글, 텔레그램 연동 |
| ETF 탐색 | `/etf` | 테마별 ETF 목록, 수익률 스크리닝, 거시 연계 추천 |
| 펀드 관리 | `/fund` | 보유 펀드, NAV 조회, 환매 예정일, 적립식 이력 |
| 성과 분석 | `/performance` | Sharpe Ratio, MDD, 롤링 수익률, 상관관계 매트릭스 |
| 이미지 분석 | `/analyze` | 이미지 업로드, 인식 결과, AI 투자 가이드, DB 반영 |

**관리자 페이지:**

| 페이지 | 라우트 | 주요 기능 |
|-------|------|---------|
| 관리자 대시보드 | `/admin` | 전체 회원 수, 알림 발송 수, 리스크 요약, 감사 로그 |
| 회원 관리 | `/admin/members` | 회원 목록, 검색/필터, 정지/복구/퇴출 |
| 알림 대상 관리 | `/admin/notifications` | 수신 대상, Chat ID, 그룹, 직접 메시지 |
| 발송 이력 | `/admin/notifications/history` | 발송 시각, 대상, 메시지, 성공/실패 |
| 감사 로그 | `/admin/audit` | 관리자 행위 이력, 필터, CSV 내보내기 |
| AI 모델 설정 | `/admin/settings/models` | Primary/Fallback 모델, 비용 미리보기, 변경 이력 |
| 시스템 설정 | `/admin/settings` | 분석 스케줄, 알림 임계값, 가중치 수정 |

### 6.2 대시보드 핵심 UI 요소

- **RiskGauge**: 신호등 방식 VIX 기반 리스크 게이지 (녹/주황/빨)
- **MacroTicker**: 환율, 주요 지수 실시간 스크롤 배너
- **SentimentBadge**: BULLISH / BEARISH / NEUTRAL 감성 배지 + 신뢰도 %
- **ScenarioCard**: 낙관/기본/비관 시나리오 + 확률 + 목표가 카드 3종
- **PnLSummary**: 총 투자금, 평가 금액, 손익금액, 손익률 요약 카드
- **AssetTypeTabs**: 주식 / ETF / 펀드 탭 전환
- **ETFMacroSuggest**: 현재 거시 시나리오 기반 수혜 ETF 자동 제안 배너
- **PerformanceHeatmap**: 롤링 수익률 히트맵 (월별 색상 시각화)

---

## 7. 개발 로드맵

### 7.1 11일 스프린트 계획

| Day | 주요 작업 | 세부 내용 | 완료 기준 |
|-----|---------|---------|---------|
| 1 | Supabase 설정 | 프로젝트 생성, 스키마 적용, Auth, RLS 정책 | 테이블 전체 생성 완료 |
| 2 | FastAPI 기본 구조 | 라우터, yfinance 연동, 거시 데이터 API, Railway 배포 | 거시 스냅샷 API 응답 확인 |
| 3 | Next.js + Supabase 연동 | Auth 페이지, 클라이언트 설정, 환경 변수 | 로그인/회원가입 동작 |
| 4 | 포트폴리오 CRUD | 종목 등록/수정/삭제, 거래 입력 UI, 손익 계산 | P&L 계산 정확도 검증 |
| 5 | 차트 + 기술적 지표 | TradingView 차트, RSI/MACD/BB, 추천 엔진 MVP | 종목 차트 + 지표 표시 |
| 6 | AI 분석 파이프라인 | RSS 수집, Claude API 감성 분석, 통합 스코어링, AI 리포트 | 종목 1개 전체 예측 리포트 |
| 7 | 텔레그램 봇 + 배포 | 봇 생성/연동, 알림, 양방향 명령어, APScheduler, 전체 배포 | 텔레그램 E2E 수신 확인 |
| 8 | ETF 모듈 | etf_fund_master, FinanceDataReader ETF 수집, 국내/해외 ETF, 괴리율 | ETF 포트폴리오 손익 표시 |
| 9 | 펀드 모듈 + 거시 연계 | KOFIA API, 공모펀드 NAV, 분배금, 거시 이벤트 → ETF 매핑 | 펀드 NAV + 매핑 동작 |
| 10 | 성과 분석 + 통합 테스트 | Sharpe/MDD 계산, 롤링 수익률 히트맵, 상관관계, E2E 테스트 | 전체 자산 유형 E2E 통과 |
| 11 | 이미지 분석 모듈 | Claude Vision 연동, 업로드 UI, OCR 검증, 투자 가이드, 이미지 삭제 | 이미지 → 가이드 E2E 확인 |

### 7.2 Phase 2 (v1.1) 예정 기능

- KIS Developers API 실시간 체결가 연동
- 백테스팅 엔진: 과거 데이터로 추천 전략 성과 검증
- 멀티 포트폴리오 지원 (ISA / 연금저축 / 일반 계좌 구분)
- 카카오 알림톡 연동 (사업자 등록 후)
- DART 공시 정보 자동 수집/분석
- ETF 자동 리밸런싱 알림 (목표 비중 ±5% 이탈 시)

---

## 8. 위험 관리

| 위험 항목 | 등급 | 원인 | 대응 방안 |
|----------|------|------|---------|
| yfinance API 수집 실패 | HIGH | 무료 API 정책 변경/차단 | FinanceDataReader, Alpha Vantage 백업 |
| Claude API 비용 초과 | MEDIUM | 분석 호출 과다 | 일일 한도 설정, 캐싱(24시간) |
| 감성 분석 허위 신호 | HIGH | 모델 한계, 블랙스완 | 신뢰도 임계값, 면책 문구 |
| Railway 서버 다운 | MEDIUM | 무료/Hobby 한계 | Supabase Edge Functions 백업 |
| 개인정보/투자 데이터 유출 | HIGH | RLS 미적용, API Key 노출 | RLS 전면 적용, 환경변수, 정기 점검 |
| 법적 리스크 (자본시장법) | LOW | 개인 외 사용 확대 | 개인 사용 유지, 면책 문구 |
| Claude Vision 인식 오류 | MEDIUM | 이미지 화질, 레이아웃 다양성 | confidence 임계값, 수동 입력 유도 |
| 이미지 내 개인정보 노출 | HIGH | 계좌번호 등 포함 이미지 | 주의 안내, 자동 마스킹, 즉시 삭제 |
| 관리자 데이터 오접근 | MEDIUM | RLS 미설정/우회 시도 | No bypass RLS, audit_logs BLOCKED |

---

## 9. 관리자 & 사용자 모드

### 9.1 역할 체계 (RBAC)

| 역할 | 코드값 | 주요 권한 | 접근 불가 |
|------|-------|---------|---------|
| 슈퍼 관리자 | SUPER_ADMIN | 전체 권한 + 관리자 계정 생성/삭제 | 없음 |
| 관리자 | ADMIN | 회원 관리, 알림, 시스템 설정 | 다른 관리자 수정 |
| 일반 사용자 | USER | 본인 포트폴리오, 분석, 알림 | 관리자 페이지, 타 회원 데이터 |
| 정지 사용자 | SUSPENDED | 로그인 불가, 데이터 보존 | 모든 기능 |

### 9.2 인증 및 권한 제어

- 가입 시 기본 역할 USER 자동 설정
- ADMIN/SUPER_ADMIN 부여는 SUPER_ADMIN만 가능
- 모든 API에 JWT role 클레임 검증 미들웨어
- `/admin/*` 경로는 ADMIN 이상만 접근, 미인증 시 403
- `user_profiles` 테이블로 role, status, last_login, telegram_chat_id 관리
- `role_change_logs` 테이블로 감사 로그

### 9.3 관리자 대시보드 기능

**회원 관리:**
- 전체 회원 목록 (이메일, 역할, 가입일, 마지막 로그인, 상태)
- 회원 검색/필터 (이메일, 역할별, 상태별)
- 회원 정지: 사유 입력 → 감사 로그 기록 → 정지 해제 가능
- 회원 퇴출: 2단계 확인 → Auth 비활성화, 데이터 soft delete, 텔레그램 제거 → 동일 이메일 재가입 시 관리자 승인 필요
- SUPER_ADMIN 계정은 퇴출 불가

**알림 대상 관리:**
- 개별 지정/해제, Chat ID 등록, 일괄 활성/비활성
- 발송 방식: 개별, 그룹(Tag 기반), 브로드캐스트, 직접 메시지

**알림 그룹:**

| 그룹명 | 조건 | 자동 발송 예시 |
|-------|------|-------------|
| ALL_USERS | 전체 알림 대상 | VIX 30 돌파, 지정학 URGENT |
| KOSPI_HOLDERS | KOSPI 종목 1개+ 보유 | 서킷브레이커, 외국인 순매도 급증 |
| US_STOCK_HOLDERS | 미국 주식/ETF 1개+ 보유 | FOMC, CPI, S&P 500 급락 |
| ETF_FUND_HOLDERS | ETF/펀드 1개+ 보유 | 괴리율 급등, 분배금 기준일 안내 |
| HIGH_RISK_PORTFOLIO | 리스크 HIGH인 회원 | 리스크 경보, 손절가 경고 |

### 9.4 AI 모델 변경 권한 관리

| 기능 | USER | ADMIN+ |
|------|------|--------|
| 현재 모델명 확인 | 불가 | 가능 |
| Primary 모델 변경 | 불가 | 가능 |
| Fallback 모델 설정 | 불가 | 가능 |
| 비용/사용량 통계 | 불가 | 가능 |
| 가중치(Weight) 변경 | 불가 | 가능 |
| 분석 스케줄 조정 | 불가 | 가능 |

**관리자 UI 흐름 (`/admin/settings/models`):**
1. 기능 선택 (IMAGE_ANALYSIS / DEEP_REPORT / SENTIMENT_BATCH 등)
2. 모델 선택 (OpenRouter 모델 목록 실시간 조회)
3. 비용 미리보기 (전월 사용량 기준 예상 비용)
4. 변경 사유 입력 (감사 로그용)
5. 확인 모달 → 저장 → 즉시 적용

### 9.5 감사 로그

- 기록 대상: 역할 변경, 정지/복구, 퇴출, 알림 지정/해제, 직접 메시지, AI 모델 변경
- append-only, 삭제 불가, SUPER_ADMIN만 전체 조회
- 30일 보존, 90일 후 아카이브 (Supabase Storage)

---

## 10. 용어 정의

| 용어 | 정의 |
|------|------|
| RSI | 상대강도지수. 14일 기준 과매수(70+)/과매도(30-) 판단 |
| MACD | 단기(12일)/장기(26일) 이동평균 차이. Signal선(9일 EMA) 교차 시 매매 신호 |
| Bollinger Bands | 20일 이평선 ± 표준편차 2배. 하단 터치 시 반등 신호 |
| VIX | CBOE 공포지수. 20 이하 안정, 30 이상 고위험 |
| Composite Score | 기술적+거시+감성+환율+지정학 가중 합산. -100~+100 |
| P&L | 손익. Realized(실현) vs Unrealized(미실현) |
| RLS | Row Level Security. 행 단위 접근 제어 |
| NAV | 순자산가치. 펀드/ETF 1주당 실질 가치 |
| TER | 총보수. ETF/펀드 연간 비용 비율 |
| Tracking Difference | ETF 시장가와 NAV 간 괴리율 |
| Sharpe Ratio | 리스크 대비 초과 수익률 |
| MDD | Maximum DrawDown. 최고점 대비 최대 손실률 |
| RBAC | 역할 기반 접근 제어 |
| OpenRouter | 500+ AI 모델 단일 API 통합 게이트웨이 |
| Auto Fallback | Primary 모델 장애 시 Fallback 자동 전환 |
| No Bypass RLS | ADMIN도 RLS 우회 불가 강제 설정 |
| Claude Vision API | Anthropic 멀티모달 기능. 이미지 텍스트 추출/분석 |
| OCR | 이미지/사진 속 텍스트를 디지털 텍스트로 변환 |

---

> **면책 조항**: 본 시스템은 투자 참고용 정보이며, 투자 책임은 본인에게 있습니다.
> &copy; 2026 JG — Stock Intelligence Platform PRD v1.6.0
