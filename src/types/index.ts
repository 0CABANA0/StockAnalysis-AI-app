// ============================================================
// Stock Intelligence Platform — TypeScript 타입 정의
// Supabase 스키마 기반 전체 타입 시스템
// ============================================================

// ── ENUM 타입 11개 ──

export type MarketType = "KOSPI" | "KOSDAQ" | "NYSE" | "NASDAQ";

export type TransactionType = "BUY" | "SELL";

export type UserRole = "USER" | "ADMIN" | "SUPER_ADMIN" | "SUSPENDED";

export type UserStatus = "ACTIVE" | "SUSPENDED" | "DEACTIVATED";

export type AlertType = "TARGET_PRICE" | "STOP_LOSS" | "DAILY_CHANGE";

export type EventType =
  | "GEOPOLITICAL"
  | "ECONOMIC"
  | "CURRENCY"
  | "REGULATORY"
  | "NATURAL";

export type SentimentDirection = "BULLISH" | "BEARISH" | "NEUTRAL";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export type NotificationTargetType = "INDIVIDUAL" | "GROUP" | "BROADCAST";

export type AssetType = "DOMESTIC_ETF" | "FOREIGN_ETF" | "DOMESTIC_FUND";

export type DistributionType = "DIVIDEND" | "DISTRIBUTION" | "INTEREST";

// ── 테이블 Row 인터페이스 18개 ──

export interface Portfolio {
  id: string;
  user_id: string;
  ticker: string;
  company_name: string;
  market: MarketType;
  sector: string | null;
  industry: string | null;
  memo: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  portfolio_id: string;
  user_id: string;
  type: TransactionType;
  quantity: number;
  price: number;
  fee: number;
  tax: number;
  trade_date: string;
  memo: string | null;
  created_at: string;
}

export interface Distribution {
  id: string;
  portfolio_id: string;
  user_id: string;
  amount: number;
  distribution_type: DistributionType;
  record_date: string;
  payment_date: string | null;
  memo: string | null;
  created_at: string;
}

export interface Recommendation {
  id: string;
  ticker: string;
  company_name: string;
  market: MarketType;
  reason: string;
  target_price: number | null;
  stop_loss: number | null;
  confidence_score: number | null;
  strategy: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface PriceAlert {
  id: string;
  user_id: string;
  ticker: string;
  company_name: string | null;
  alert_type: AlertType;
  trigger_price: number;
  current_price: number | null;
  is_triggered: boolean;
  triggered_at: string | null;
  memo: string | null;
  created_at: string;
}

export interface MacroSnapshot {
  id: string;
  snapshot_data: Record<string, unknown>;
  usd_krw: number | null;
  vix: number | null;
  us_10y_yield: number | null;
  wti: number | null;
  gold: number | null;
  collected_at: string;
  created_at: string;
}

export interface SentimentResult {
  id: string;
  source_url: string | null;
  source_title: string | null;
  score: number;
  direction: SentimentDirection;
  confidence: number | null;
  event_type: EventType | null;
  urgency: RiskLevel;
  reasoning: string | null;
  affected_sectors: string[] | null;
  affected_countries: string[] | null;
  short_term_impact: string | null;
  medium_term_impact: string | null;
  analyzed_at: string;
  created_at: string;
}

export interface PredictionScore {
  id: string;
  user_id: string;
  ticker: string;
  company_name: string | null;
  technical_score: number | null;
  macro_score: number | null;
  sentiment_score: number | null;
  currency_score: number | null;
  geopolitical_score: number | null;
  short_term_score: number;
  medium_term_score: number | null;
  direction: SentimentDirection;
  risk_level: RiskLevel;
  opinion: string | null;
  report_text: string | null;
  scenario_bull: Record<string, unknown> | null;
  scenario_base: Record<string, unknown> | null;
  scenario_bear: Record<string, unknown> | null;
  analyzed_at: string;
  created_at: string;
}

export interface EtfFundMaster {
  id: string;
  ticker: string;
  name: string;
  asset_type: AssetType;
  category: string | null;
  ter: number | null;
  benchmark: string | null;
  fund_code: string | null;
  aum: number | null;
  nav: number | null;
  is_active: boolean;
  updated_at: string;
  created_at: string;
}

export interface EtfMacroMapping {
  id: string;
  event_scenario: string;
  etf_tickers: string[];
  rationale: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  email: string | null;
  display_name: string | null;
  role: UserRole;
  status: UserStatus;
  telegram_chat_id: string | null;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationGroup {
  id: string;
  group_code: string;
  description: string;
  auto_condition: Record<string, unknown> | null;
  is_active: boolean;
  created_at: string;
}

export interface NotificationTarget {
  id: string;
  user_id: string;
  telegram_chat_id: string | null;
  groups: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationHistory {
  id: string;
  sender_admin_id: string | null;
  target_type: NotificationTargetType;
  target_group: string | null;
  target_user_ids: string[] | null;
  message: string;
  message_format: string;
  success_count: number;
  fail_count: number;
  sent_at: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  admin_id: string | null;
  action_type: string;
  target_user_id: string | null;
  detail: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

export interface RoleChangeLog {
  id: string;
  target_user_id: string;
  old_role: UserRole;
  new_role: UserRole;
  changed_by: string;
  reason: string | null;
  created_at: string;
}

export interface ModelConfig {
  id: string;
  config_key: string;
  display_name: string;
  primary_model: string;
  fallback_model: string | null;
  max_tokens: number;
  temperature: number;
  is_active: boolean;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ModelChangeLog {
  id: string;
  config_key: string;
  old_primary: string | null;
  new_primary: string;
  old_fallback: string | null;
  new_fallback: string | null;
  changed_by: string;
  reason: string | null;
  created_at: string;
}

// ── Insert / Update 타입 ──

export type PortfolioInsert = Omit<
  Portfolio,
  "id" | "is_deleted" | "deleted_at" | "created_at" | "updated_at"
>;
export type PortfolioUpdate = Partial<
  Omit<Portfolio, "id" | "user_id" | "created_at">
>;

export type TransactionInsert = Omit<Transaction, "id" | "created_at">;
export type TransactionUpdate = Partial<
  Omit<Transaction, "id" | "user_id" | "created_at">
>;

export type DistributionInsert = Omit<Distribution, "id" | "created_at">;
export type DistributionUpdate = Partial<
  Omit<Distribution, "id" | "user_id" | "created_at">
>;

export type RecommendationInsert = Omit<
  Recommendation,
  "id" | "is_active" | "created_at"
>;
export type RecommendationUpdate = Partial<
  Omit<Recommendation, "id" | "created_at">
>;

export type PriceAlertInsert = Omit<
  PriceAlert,
  "id" | "is_triggered" | "triggered_at" | "created_at"
>;
export type PriceAlertUpdate = Partial<
  Omit<PriceAlert, "id" | "user_id" | "created_at">
>;

export type MacroSnapshotInsert = Omit<MacroSnapshot, "id" | "created_at">;

export type SentimentResultInsert = Omit<SentimentResult, "id" | "created_at">;

export type PredictionScoreInsert = Omit<PredictionScore, "id" | "created_at">;
// prediction_scores는 불변 — Update 없음

export type EtfFundMasterInsert = Omit<
  EtfFundMaster,
  "id" | "is_active" | "updated_at" | "created_at"
>;
export type EtfFundMasterUpdate = Partial<
  Omit<EtfFundMaster, "id" | "created_at">
>;

export type EtfMacroMappingInsert = Omit<EtfMacroMapping, "id" | "created_at">;
export type EtfMacroMappingUpdate = Partial<
  Omit<EtfMacroMapping, "id" | "created_at">
>;

export type UserProfileInsert = Omit<UserProfile, "created_at" | "updated_at">;

export type UserProfileUpdate = Partial<
  Pick<
    UserProfile,
    "display_name" | "telegram_chat_id" | "role" | "status" | "last_login"
  >
>;

export type NotificationGroupInsert = Omit<
  NotificationGroup,
  "id" | "is_active" | "created_at"
>;

export type NotificationTargetInsert = Omit<
  NotificationTarget,
  "id" | "is_active" | "created_at" | "updated_at"
>;

export type NotificationHistoryInsert = Omit<
  NotificationHistory,
  "id" | "success_count" | "fail_count" | "sent_at" | "created_at"
>;

export type AuditLogInsert = Omit<AuditLog, "id" | "created_at">;
// audit_logs: append-only — Update = never

export type RoleChangeLogInsert = Omit<RoleChangeLog, "id" | "created_at">;
// role_change_logs: append-only — Update = never

export type ModelConfigInsert = Omit<
  ModelConfig,
  "id" | "is_active" | "created_at" | "updated_at"
>;
export type ModelConfigUpdate = Partial<
  Omit<ModelConfig, "id" | "config_key" | "created_at">
>;

export type ModelChangeLogInsert = Omit<ModelChangeLog, "id" | "created_at">;
// model_change_logs: append-only — Update = never

// ── Supabase Database 제네릭 인터페이스 ──

export interface Database {
  public: {
    Tables: {
      portfolio: {
        Row: Portfolio;
        Insert: PortfolioInsert;
        Update: PortfolioUpdate;
        Relationships: [];
      };
      transactions: {
        Row: Transaction;
        Insert: TransactionInsert;
        Update: TransactionUpdate;
        Relationships: [];
      };
      distributions: {
        Row: Distribution;
        Insert: DistributionInsert;
        Update: DistributionUpdate;
        Relationships: [];
      };
      recommendations: {
        Row: Recommendation;
        Insert: RecommendationInsert;
        Update: RecommendationUpdate;
        Relationships: [];
      };
      price_alerts: {
        Row: PriceAlert;
        Insert: PriceAlertInsert;
        Update: PriceAlertUpdate;
        Relationships: [];
      };
      macro_snapshots: {
        Row: MacroSnapshot;
        Insert: MacroSnapshotInsert;
        Update: never;
        Relationships: [];
      };
      sentiment_results: {
        Row: SentimentResult;
        Insert: SentimentResultInsert;
        Update: never;
        Relationships: [];
      };
      prediction_scores: {
        Row: PredictionScore;
        Insert: PredictionScoreInsert;
        Update: never;
        Relationships: [];
      };
      etf_fund_master: {
        Row: EtfFundMaster;
        Insert: EtfFundMasterInsert;
        Update: EtfFundMasterUpdate;
        Relationships: [];
      };
      etf_macro_mapping: {
        Row: EtfMacroMapping;
        Insert: EtfMacroMappingInsert;
        Update: EtfMacroMappingUpdate;
        Relationships: [];
      };
      user_profiles: {
        Row: UserProfile;
        Insert: UserProfileInsert;
        Update: UserProfileUpdate;
        Relationships: [];
      };
      notification_groups: {
        Row: NotificationGroup;
        Insert: NotificationGroupInsert;
        Update: Partial<Omit<NotificationGroup, "id" | "created_at">>;
        Relationships: [];
      };
      notification_targets: {
        Row: NotificationTarget;
        Insert: NotificationTargetInsert;
        Update: Partial<Omit<NotificationTarget, "id" | "created_at">>;
        Relationships: [];
      };
      notification_history: {
        Row: NotificationHistory;
        Insert: NotificationHistoryInsert;
        Update: never;
        Relationships: [];
      };
      audit_logs: {
        Row: AuditLog;
        Insert: AuditLogInsert;
        Update: never;
        Relationships: [];
      };
      role_change_logs: {
        Row: RoleChangeLog;
        Insert: RoleChangeLogInsert;
        Update: never;
        Relationships: [];
      };
      model_configs: {
        Row: ModelConfig;
        Insert: ModelConfigInsert;
        Update: ModelConfigUpdate;
        Relationships: [];
      };
      model_change_logs: {
        Row: ModelChangeLog;
        Insert: ModelChangeLogInsert;
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      market_type: MarketType;
      transaction_type: TransactionType;
      user_role: UserRole;
      user_status: UserStatus;
      alert_type: AlertType;
      event_type: EventType;
      sentiment_direction: SentimentDirection;
      risk_level: RiskLevel;
      notification_target_type: NotificationTargetType;
      asset_type: AssetType;
      distribution_type: DistributionType;
    };
    CompositeTypes: Record<string, never>;
  };
}
