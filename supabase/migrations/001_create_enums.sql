-- ============================================================
-- 001_create_enums.sql
-- Stock Intelligence Platform — ENUM 타입 11개
-- ============================================================

-- 시장 구분
CREATE TYPE market_type AS ENUM (
  'KOSPI',
  'KOSDAQ',
  'NYSE',
  'NASDAQ'
);

-- 거래 유형
CREATE TYPE transaction_type AS ENUM (
  'BUY',
  'SELL'
);

-- 사용자 역할 (RBAC 4단계)
CREATE TYPE user_role AS ENUM (
  'USER',
  'ADMIN',
  'SUPER_ADMIN',
  'SUSPENDED'
);

-- 사용자 상태
CREATE TYPE user_status AS ENUM (
  'ACTIVE',
  'SUSPENDED',
  'DEACTIVATED'
);

-- 가격 알림 유형
CREATE TYPE alert_type AS ENUM (
  'TARGET_PRICE',
  'STOP_LOSS',
  'DAILY_CHANGE'
);

-- 이벤트 유형 (뉴스/지정학)
CREATE TYPE event_type AS ENUM (
  'GEOPOLITICAL',
  'ECONOMIC',
  'CURRENCY',
  'REGULATORY',
  'NATURAL'
);

-- 감성 분석 방향
CREATE TYPE sentiment_direction AS ENUM (
  'BULLISH',
  'BEARISH',
  'NEUTRAL'
);

-- 리스크 레벨
CREATE TYPE risk_level AS ENUM (
  'LOW',
  'MEDIUM',
  'HIGH'
);

-- 알림 대상 유형
CREATE TYPE notification_target_type AS ENUM (
  'INDIVIDUAL',
  'GROUP',
  'BROADCAST'
);

-- 자산 유형 (ETF/펀드)
CREATE TYPE asset_type AS ENUM (
  'DOMESTIC_ETF',
  'FOREIGN_ETF',
  'DOMESTIC_FUND'
);

-- 분배금/배당 유형
CREATE TYPE distribution_type AS ENUM (
  'DIVIDEND',
  'DISTRIBUTION',
  'INTEREST'
);
