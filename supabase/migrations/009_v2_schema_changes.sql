-- ============================================================
-- Migration 009: PRD v2.0 — Stock Intelligence Guide Platform
-- 포트폴리오 중심 → 거시경제 투자 가이드 플랫폼 전환
-- ============================================================

-- ── 신규 ENUM 타입 ──

DO $$ BEGIN
  CREATE TYPE guide_action AS ENUM ('BUY', 'SELL', 'HOLD', 'WATCH', 'AVOID');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE geo_risk_level AS ENUM ('LOW', 'MODERATE', 'HIGH', 'CRITICAL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE geo_risk_status AS ENUM ('ACTIVE', 'RESOLVED', 'DORMANT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE geo_risk_category AS ENUM (
    'TRADE_WAR', 'TECH_HEGEMONY', 'MILITARY_TENSION',
    'REGIONAL_CONFLICT', 'SUPPLY_CHAIN', 'SANCTIONS',
    'ENERGY_CRISIS', 'POLITICAL_CHANGE', 'CYBER_THREAT', 'OTHER'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE fear_greed_label AS ENUM (
    'EXTREME_FEAR', 'FEAR', 'NEUTRAL', 'GREED', 'EXTREME_GREED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE calendar_event_type AS ENUM ('ECONOMIC', 'GEOPOLITICAL', 'EARNINGS');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE event_importance AS ENUM ('HIGH', 'MEDIUM', 'LOW');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 신규 테이블 11개 ──

-- 1. watchlist (관심종목 — portfolio 대체)
CREATE TABLE IF NOT EXISTS watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ticker TEXT NOT NULL,
  company_name TEXT NOT NULL,
  market TEXT NOT NULL,
  asset_type TEXT NOT NULL DEFAULT 'STOCK',
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, ticker)
);

-- 2. geopolitical_risks (지정학 리스크)
CREATE TABLE IF NOT EXISTS geopolitical_risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  risk_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  risk_level geo_risk_level NOT NULL DEFAULT 'LOW',
  category geo_risk_category NOT NULL DEFAULT 'OTHER',
  affected_tickers TEXT[] DEFAULT '{}',
  affected_sectors TEXT[] DEFAULT '{}',
  affected_etfs TEXT[] DEFAULT '{}',
  monitoring_keywords TEXT[] DEFAULT '{}',
  status geo_risk_status NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- 3. geopolitical_events (지정학 이벤트 로그)
CREATE TABLE IF NOT EXISTS geopolitical_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  risk_id TEXT NOT NULL REFERENCES geopolitical_risks(risk_id) ON DELETE CASCADE,
  event_title TEXT NOT NULL,
  event_description TEXT,
  source_url TEXT,
  impact_assessment TEXT,
  severity_change TEXT,
  analyzed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. investment_guides (투자 가이드)
CREATE TABLE IF NOT EXISTS investment_guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker TEXT NOT NULL,
  guide_date DATE NOT NULL,
  action guide_action NOT NULL DEFAULT 'WATCH',
  macro_reasoning TEXT,
  geo_reasoning TEXT,
  technical_reasoning TEXT,
  target_price DOUBLE PRECISION,
  stop_loss DOUBLE PRECISION,
  confidence DOUBLE PRECISION,
  risk_tags TEXT[] DEFAULT '{}',
  fx_impact TEXT,
  full_report_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(ticker, guide_date)
);

-- 5. daily_briefings (일간 브리핑)
CREATE TABLE IF NOT EXISTS daily_briefings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  briefing_date DATE UNIQUE NOT NULL,
  market_summary TEXT,
  geo_summary TEXT,
  action_cards JSONB DEFAULT '[]'::jsonb,
  key_events JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. weekly_reports (주간 리포트)
CREATE TABLE IF NOT EXISTS weekly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start_date DATE UNIQUE NOT NULL,
  macro_summary TEXT,
  geo_summary TEXT,
  next_week_outlook TEXT,
  strategy_guide TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. economic_calendar (통합 캘린더)
CREATE TABLE IF NOT EXISTS economic_calendar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_date DATE NOT NULL,
  event_title TEXT NOT NULL,
  event_type calendar_event_type NOT NULL DEFAULT 'ECONOMIC',
  country TEXT,
  importance event_importance NOT NULL DEFAULT 'MEDIUM',
  affected_assets TEXT[] DEFAULT '{}',
  expected_impact TEXT,
  actual_result TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. scenario_simulations (시나리오 결과)
CREATE TABLE IF NOT EXISTS scenario_simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scenario_type TEXT NOT NULL,
  scenario_params JSONB NOT NULL DEFAULT '{}'::jsonb,
  result JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. glossary_terms (용어 사전)
CREATE TABLE IF NOT EXISTS glossary_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  term TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  definition_short TEXT NOT NULL,
  definition_long TEXT,
  related_terms TEXT[] DEFAULT '{}',
  examples TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. ai_conversations (AI Q&A 이력)
CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  context_data JSONB DEFAULT '{}'::jsonb,
  deeplinks JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. fear_greed_snapshots (공포/탐욕 지수)
CREATE TABLE IF NOT EXISTS fear_greed_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  index_value INT NOT NULL CHECK (index_value BETWEEN 0 AND 100),
  label fear_greed_label NOT NULL,
  components JSONB DEFAULT '{}'::jsonb,
  snapshot_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 인덱스 ──

CREATE INDEX IF NOT EXISTS idx_watchlist_user ON watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_ticker ON watchlist(ticker);
CREATE INDEX IF NOT EXISTS idx_geo_risks_status ON geopolitical_risks(status);
CREATE INDEX IF NOT EXISTS idx_geo_risks_level ON geopolitical_risks(risk_level);
CREATE INDEX IF NOT EXISTS idx_geo_events_risk ON geopolitical_events(risk_id);
CREATE INDEX IF NOT EXISTS idx_geo_events_date ON geopolitical_events(created_at);
CREATE INDEX IF NOT EXISTS idx_guides_ticker_date ON investment_guides(ticker, guide_date);
CREATE INDEX IF NOT EXISTS idx_guides_date ON investment_guides(guide_date);
CREATE INDEX IF NOT EXISTS idx_briefings_date ON daily_briefings(briefing_date);
CREATE INDEX IF NOT EXISTS idx_weekly_date ON weekly_reports(week_start_date);
CREATE INDEX IF NOT EXISTS idx_calendar_date ON economic_calendar(event_date);
CREATE INDEX IF NOT EXISTS idx_calendar_type ON economic_calendar(event_type);
CREATE INDEX IF NOT EXISTS idx_simulations_user ON scenario_simulations(user_id);
CREATE INDEX IF NOT EXISTS idx_glossary_term ON glossary_terms(term);
CREATE INDEX IF NOT EXISTS idx_glossary_category ON glossary_terms(category);
CREATE INDEX IF NOT EXISTS idx_ai_conv_user ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conv_date ON ai_conversations(created_at);
CREATE INDEX IF NOT EXISTS idx_fear_greed_date ON fear_greed_snapshots(snapshot_at);

-- ── RLS 정책 ──

ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

-- watchlist: 본인만 CRUD
CREATE POLICY watchlist_select ON watchlist FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY watchlist_insert ON watchlist FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY watchlist_delete ON watchlist FOR DELETE USING (auth.uid() = user_id);

-- scenario_simulations: 본인만 조회/생성
CREATE POLICY simulations_select ON scenario_simulations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY simulations_insert ON scenario_simulations FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ai_conversations: 본인만 조회/생성
CREATE POLICY ai_conv_select ON ai_conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY ai_conv_insert ON ai_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 공개 읽기 테이블 (서비스 키로 쓰기)
ALTER TABLE geopolitical_risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE geopolitical_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_briefings ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE economic_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE glossary_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE fear_greed_snapshots ENABLE ROW LEVEL SECURITY;

-- 인증된 사용자 읽기 허용
CREATE POLICY geo_risks_read ON geopolitical_risks FOR SELECT TO authenticated USING (true);
CREATE POLICY geo_events_read ON geopolitical_events FOR SELECT TO authenticated USING (true);
CREATE POLICY guides_read ON investment_guides FOR SELECT TO authenticated USING (true);
CREATE POLICY briefings_read ON daily_briefings FOR SELECT TO authenticated USING (true);
CREATE POLICY weekly_read ON weekly_reports FOR SELECT TO authenticated USING (true);
CREATE POLICY calendar_read ON economic_calendar FOR SELECT TO authenticated USING (true);
CREATE POLICY glossary_read ON glossary_terms FOR SELECT TO authenticated USING (true);
CREATE POLICY fear_greed_read ON fear_greed_snapshots FOR SELECT TO authenticated USING (true);

-- ── updated_at 트리거 ──

CREATE OR REPLACE TRIGGER set_updated_at_geopolitical_risks
  BEFORE UPDATE ON geopolitical_risks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── 기존 테이블 비활성 표시 (데이터 보존, 삭제 안 함) ──
COMMENT ON TABLE portfolio IS 'DEPRECATED v2.0 — watchlist로 대체. 데이터 보존용.';
COMMENT ON TABLE transactions IS 'DEPRECATED v2.0 — 제거됨. 데이터 보존용.';
COMMENT ON TABLE distributions IS 'DEPRECATED v2.0 — 제거됨. 데이터 보존용.';
COMMENT ON TABLE prediction_scores IS 'DEPRECATED v2.0 — investment_guides로 대체. 데이터 보존용.';
COMMENT ON TABLE price_alerts IS 'DEPRECATED v2.0 — 텔레그램 중심으로 이동. 데이터 보존용.';
