-- 008: 멀티 포트폴리오 — ISA / 연금저축 / 일반 계좌 구분
-- portfolio 테이블에 account_type 컬럼 추가

-- 1. account_type 컬럼 추가 (기본값 GENERAL → 기존 데이터 자동 설정)
ALTER TABLE portfolio
  ADD COLUMN account_type TEXT NOT NULL DEFAULT 'GENERAL';

-- 2. 기존 unique 제약 확장: (user_id, ticker) → (user_id, ticker, account_type)
--    활성 포트폴리오에만 적용 (is_deleted = FALSE)
CREATE UNIQUE INDEX idx_portfolio_user_ticker_account
  ON portfolio (user_id, ticker, account_type)
  WHERE is_deleted = FALSE;
