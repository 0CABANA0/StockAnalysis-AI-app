-- ============================================================
-- 007_seed_data.sql
-- Stock Intelligence Platform — 초기 데이터
-- service_role로 실행 (RLS 우회)
-- ============================================================

-- ── 알림 그룹 5개 ──

INSERT INTO notification_groups (group_code, description, auto_condition) VALUES
  ('ALL_USERS', '전체 알림 대상 — VIX 30 돌파, 지정학 URGENT', '{"trigger": "vix_above_30"}'),
  ('KOSPI_HOLDERS', 'KOSPI 종목 1개 이상 보유자 — 서킷브레이커, 외국인 순매도 급증', '{"market": "KOSPI", "min_holdings": 1}'),
  ('US_STOCK_HOLDERS', '미국 주식/ETF 1개 이상 보유자 — FOMC, CPI, S&P 500 급락', '{"market": ["NYSE", "NASDAQ"], "min_holdings": 1}'),
  ('ETF_FUND_HOLDERS', 'ETF/펀드 1개 이상 보유자 — 괴리율 급등, 분배금 기준일 안내', '{"asset_type": ["DOMESTIC_ETF", "FOREIGN_ETF", "DOMESTIC_FUND"], "min_holdings": 1}'),
  ('HIGH_RISK_PORTFOLIO', '리스크 HIGH인 회원 — 리스크 경보, 손절가 경고', '{"risk_level": "HIGH"}');


-- ── AI 모델 설정 5개 ──

INSERT INTO model_configs (config_key, display_name, primary_model, fallback_model, max_tokens, temperature) VALUES
  ('IMAGE_ANALYSIS', '이미지 분석 (Vision OCR)', 'claude-opus-4-6', 'claude-sonnet-4-6', 4096, 0.3),
  ('DEEP_REPORT', '복잡한 AI 분석 리포트', 'claude-opus-4-6', 'gpt-5.2', 4096, 0.7),
  ('SENTIMENT_BATCH', '뉴스 감성 분석 (배치)', 'gemini-3-flash-preview', 'claude-sonnet-4-6', 2048, 0.3),
  ('TELEGRAM_SUMMARY', '텔레그램 봇 리포트 요약', 'claude-sonnet-4-6', 'deepseek-v3.2', 1024, 0.5),
  ('SCREENING_BULK', '종목 스크리닝 요약', 'deepseek-v3.2', 'mimo-v2-flash:free', 2048, 0.3);


-- ── 거시 이벤트 → 수혜 ETF 매핑 6개 ──

INSERT INTO etf_macro_mapping (event_scenario, etf_tickers, rationale) VALUES
  (
    '미국 금리 인상',
    '["TLT", "KBSTAR 달러단기채"]',
    '금리 상승 → 성장주 부정, 단기채/달러 강세'
  ),
  (
    '미중 무역 갈등 심화',
    '["KODEX 방산", "TIGER 방산", "ITA"]',
    '지정학 긴장 → 방위산업 수요 증가'
  ),
  (
    'WTI 유가 급등',
    '["KODEX WTI원유선물", "GLD", "XLE"]',
    '원자재 가격 상승 → 에너지 ETF 수혜'
  ),
  (
    '원화 약세 (USD/KRW 상승)',
    '["TIGER 미국S&P500", "SPY", "QQQ"]',
    '달러 자산 ETF 원화 기준 수익 증가'
  ),
  (
    'VIX 급등 (30 이상)',
    '["KODEX 인버스", "SQQQ", "TLT"]',
    '시장 공포 → 안전자산/인버스 수혜'
  ),
  (
    'AI/반도체 테마 강세',
    '["KODEX AI반도체핵심장비", "SOXX", "SMH"]',
    '산업 테마 모멘텀'
  );
