-- ============================================================
-- 002_create_business_tables.sql
-- Stock Intelligence Platform — 비즈니스 테이블 10개
-- FK 의존성 순서대로 생성
-- ============================================================

-- 1. portfolio — 보유 종목 마스터
CREATE TABLE portfolio (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ticker      TEXT NOT NULL,
  company_name TEXT NOT NULL,
  market      market_type NOT NULL,
  sector      TEXT,
  industry    TEXT,
  memo        TEXT,
  is_deleted  BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(user_id, ticker)
);

-- 2. transactions — 매수/매도 거래 이력
CREATE TABLE transactions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id  UUID NOT NULL REFERENCES portfolio(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type          transaction_type NOT NULL,
  quantity      NUMERIC(18, 4) NOT NULL CHECK (quantity > 0),
  price         NUMERIC(18, 4) NOT NULL CHECK (price > 0),
  fee           NUMERIC(18, 4) NOT NULL DEFAULT 0 CHECK (fee >= 0),
  tax           NUMERIC(18, 4) NOT NULL DEFAULT 0 CHECK (tax >= 0),
  trade_date    DATE NOT NULL,
  memo          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. distributions — 분배금/배당금 이력
CREATE TABLE distributions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id      UUID NOT NULL REFERENCES portfolio(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount            NUMERIC(18, 4) NOT NULL CHECK (amount > 0),
  distribution_type distribution_type NOT NULL DEFAULT 'DIVIDEND',
  record_date       DATE NOT NULL,
  payment_date      DATE,
  memo              TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. recommendations — AI 추천 종목
CREATE TABLE recommendations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker           TEXT NOT NULL,
  company_name     TEXT NOT NULL,
  market           market_type NOT NULL,
  reason           TEXT NOT NULL,
  target_price     NUMERIC(18, 4),
  stop_loss        NUMERIC(18, 4),
  confidence_score NUMERIC(5, 2) CHECK (confidence_score BETWEEN 0 AND 100),
  strategy         TEXT,
  expires_at       TIMESTAMPTZ,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. price_alerts — 가격 알림 설정
CREATE TABLE price_alerts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ticker         TEXT NOT NULL,
  company_name   TEXT,
  alert_type     alert_type NOT NULL,
  trigger_price  NUMERIC(18, 4) NOT NULL,
  current_price  NUMERIC(18, 4),
  is_triggered   BOOLEAN NOT NULL DEFAULT FALSE,
  triggered_at   TIMESTAMPTZ,
  memo           TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. macro_snapshots — 거시 지표 스냅샷
CREATE TABLE macro_snapshots (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_data  JSONB NOT NULL,
  usd_krw        NUMERIC(12, 4),
  vix            NUMERIC(8, 4),
  us_10y_yield   NUMERIC(8, 4),
  wti            NUMERIC(12, 4),
  gold           NUMERIC(12, 4),
  collected_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. sentiment_results — 뉴스 감성 분석 결과
CREATE TABLE sentiment_results (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_url      TEXT,
  source_title    TEXT,
  score           NUMERIC(5, 4) NOT NULL CHECK (score BETWEEN -1.0 AND 1.0),
  direction       sentiment_direction NOT NULL,
  confidence      NUMERIC(5, 4) CHECK (confidence BETWEEN 0 AND 1.0),
  event_type      event_type,
  urgency         risk_level DEFAULT 'LOW',
  reasoning       TEXT,
  affected_sectors TEXT[],
  affected_countries TEXT[],
  short_term_impact TEXT,
  medium_term_impact TEXT,
  analyzed_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. prediction_scores — 통합 예측 + AI 리포트
CREATE TABLE prediction_scores (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ticker            TEXT NOT NULL,
  company_name      TEXT,
  technical_score   NUMERIC(7, 4),
  macro_score       NUMERIC(7, 4),
  sentiment_score   NUMERIC(7, 4),
  currency_score    NUMERIC(7, 4),
  geopolitical_score NUMERIC(7, 4),
  short_term_score  NUMERIC(7, 4) NOT NULL,
  medium_term_score NUMERIC(7, 4),
  direction         sentiment_direction NOT NULL,
  risk_level        risk_level NOT NULL DEFAULT 'MEDIUM',
  opinion           TEXT,
  report_text       TEXT,
  scenario_bull     JSONB,
  scenario_base     JSONB,
  scenario_bear     JSONB,
  analyzed_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. etf_fund_master — ETF/펀드 마스터
CREATE TABLE etf_fund_master (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker      TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  asset_type  asset_type NOT NULL,
  category    TEXT,
  ter         NUMERIC(6, 4),
  benchmark   TEXT,
  fund_code   TEXT,
  aum         NUMERIC(18, 2),
  nav         NUMERIC(18, 4),
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. etf_macro_mapping — 거시 이벤트 → 수혜 ETF 매핑
CREATE TABLE etf_macro_mapping (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_scenario   TEXT NOT NULL UNIQUE,
  etf_tickers      JSONB NOT NULL,
  rationale        TEXT NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
