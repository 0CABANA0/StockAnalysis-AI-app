// ============================================================
// Stock Intelligence Guide Platform — TypeScript 타입 정의
// PRD v2.0 기반 전체 타입 시스템 (24개 테이블)
// ============================================================

// ── ENUM 타입 ──

export type MarketType = "KOSPI" | "KOSDAQ" | "NYSE" | "NASDAQ";

export type UserRole = "USER" | "ADMIN" | "SUPER_ADMIN" | "SUSPENDED";

export type UserStatus = "ACTIVE" | "SUSPENDED" | "DEACTIVATED";

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

export type AccountType = "GENERAL" | "ISA" | "PENSION";

// v2.0 신규 ENUM

export type GuideAction = "BUY" | "SELL" | "HOLD" | "WATCH" | "AVOID";

export type GeoRiskLevel = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";

export type GeoRiskStatus = "ACTIVE" | "RESOLVED" | "DORMANT";

export type GeoRiskCategory =
  | "TRADE_WAR"
  | "TECH_HEGEMONY"
  | "MILITARY_TENSION"
  | "REGIONAL_CONFLICT"
  | "SUPPLY_CHAIN"
  | "SANCTIONS"
  | "ENERGY_CRISIS"
  | "POLITICAL_CHANGE"
  | "CYBER_THREAT"
  | "OTHER";

export type FearGreedLabel =
  | "EXTREME_FEAR"
  | "FEAR"
  | "NEUTRAL"
  | "GREED"
  | "EXTREME_GREED";

export type CalendarEventType = "ECONOMIC" | "GEOPOLITICAL" | "EARNINGS";

export type EventImportance = "HIGH" | "MEDIUM" | "LOW";

// ── v1 레거시 ENUM (하위 호환) ──

/** @deprecated v2.0 — transactions 제거 */
export type TransactionType = "BUY" | "SELL";
/** @deprecated v2.0 — price_alerts 제거 */
export type AlertType = "TARGET_PRICE" | "STOP_LOSS" | "DAILY_CHANGE";
/** @deprecated v2.0 — distributions 제거 */
export type DistributionType = "DIVIDEND" | "DISTRIBUTION" | "INTEREST";

// ── 유지 테이블 Row 인터페이스 (13개) ──

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

// ── v2.0 신규 테이블 Row 인터페이스 (11개) ──

export interface Watchlist {
  id: string;
  user_id: string;
  ticker: string;
  company_name: string;
  market: string;
  asset_type: string;
  added_at: string;
}

export interface GeopoliticalRisk {
  id: string;
  risk_id: string;
  title: string;
  description: string | null;
  risk_level: GeoRiskLevel;
  category: GeoRiskCategory;
  affected_tickers: string[];
  affected_sectors: string[];
  affected_etfs: string[];
  monitoring_keywords: string[];
  status: GeoRiskStatus;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

export interface GeopoliticalEvent {
  id: string;
  risk_id: string;
  event_title: string;
  event_description: string | null;
  source_url: string | null;
  impact_assessment: string | null;
  severity_change: string | null;
  analyzed_at: string | null;
  created_at: string;
}

export interface InvestmentGuide {
  id: string;
  ticker: string;
  guide_date: string;
  action: GuideAction;
  macro_reasoning: string | null;
  geo_reasoning: string | null;
  technical_reasoning: string | null;
  target_price: number | null;
  stop_loss: number | null;
  confidence: number | null;
  risk_tags: string[];
  fx_impact: string | null;
  full_report_text: string | null;
  created_at: string;
}

export interface DailyBriefing {
  id: string;
  briefing_date: string;
  market_summary: string | null;
  geo_summary: string | null;
  action_cards: ActionCard[];
  key_events: KeyEvent[];
  created_at: string;
}

export interface ActionCard {
  ticker: string;
  company_name: string;
  action: GuideAction;
  reason: string;
}

export interface KeyEvent {
  time: string;
  title: string;
  importance: EventImportance;
}

export interface WeeklyReport {
  id: string;
  week_start_date: string;
  macro_summary: string | null;
  geo_summary: string | null;
  next_week_outlook: string | null;
  strategy_guide: string | null;
  created_at: string;
}

export interface EconomicCalendarEvent {
  id: string;
  event_date: string;
  event_title: string;
  event_type: CalendarEventType;
  country: string | null;
  importance: EventImportance;
  affected_assets: string[];
  expected_impact: string | null;
  actual_result: string | null;
  created_at: string;
}

export interface ScenarioSimulation {
  id: string;
  user_id: string;
  scenario_type: string;
  scenario_params: Record<string, unknown>;
  result: Record<string, unknown>;
  created_at: string;
}

export interface GlossaryTerm {
  id: string;
  term: string;
  category: string;
  definition_short: string;
  definition_long: string | null;
  related_terms: string[];
  examples: string | null;
  created_at: string;
}

export interface AiConversation {
  id: string;
  user_id: string;
  question: string;
  answer: string;
  context_data: Record<string, unknown>;
  deeplinks: DeepLink[];
  created_at: string;
}

export interface DeepLink {
  label: string;
  url: string;
}

export interface FearGreedSnapshot {
  id: string;
  index_value: number;
  label: FearGreedLabel;
  components: Record<string, unknown>;
  snapshot_at: string;
  created_at: string;
}

// ── Insert / Update 타입 ──

// 유지 테이블

export type RecommendationInsert = Omit<
  Recommendation,
  "id" | "is_active" | "created_at"
>;
export type RecommendationUpdate = Partial<
  Omit<Recommendation, "id" | "created_at">
>;

export type MacroSnapshotInsert = Omit<MacroSnapshot, "id" | "created_at">;

export type SentimentResultInsert = Omit<SentimentResult, "id" | "created_at">;

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

export type RoleChangeLogInsert = Omit<RoleChangeLog, "id" | "created_at">;

export type ModelConfigInsert = Omit<
  ModelConfig,
  "id" | "is_active" | "created_at" | "updated_at"
>;
export type ModelConfigUpdate = Partial<
  Omit<ModelConfig, "id" | "config_key" | "created_at">
>;

export type ModelChangeLogInsert = Omit<ModelChangeLog, "id" | "created_at">;

// v2.0 신규 테이블

export type WatchlistInsert = Omit<Watchlist, "id" | "added_at">;

export type GeopoliticalRiskInsert = Omit<
  GeopoliticalRisk,
  "id" | "created_at" | "updated_at" | "resolved_at"
>;
export type GeopoliticalRiskUpdate = Partial<
  Omit<GeopoliticalRisk, "id" | "risk_id" | "created_at">
>;

export type GeopoliticalEventInsert = Omit<
  GeopoliticalEvent,
  "id" | "created_at"
>;

export type InvestmentGuideInsert = Omit<InvestmentGuide, "id" | "created_at">;

export type DailyBriefingInsert = Omit<DailyBriefing, "id" | "created_at">;

export type WeeklyReportInsert = Omit<WeeklyReport, "id" | "created_at">;

export type EconomicCalendarEventInsert = Omit<
  EconomicCalendarEvent,
  "id" | "created_at"
>;

export type ScenarioSimulationInsert = Omit<
  ScenarioSimulation,
  "id" | "created_at"
>;

export type GlossaryTermInsert = Omit<GlossaryTerm, "id" | "created_at">;

export type AiConversationInsert = Omit<AiConversation, "id" | "created_at">;

export type FearGreedSnapshotInsert = Omit<
  FearGreedSnapshot,
  "id" | "created_at"
>;

// ── Supabase Database 제네릭 인터페이스 ──

export interface Database {
  public: {
    Tables: {
      // 유지 테이블
      recommendations: {
        Row: Recommendation;
        Insert: RecommendationInsert;
        Update: RecommendationUpdate;
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
      // v2.0 신규 테이블
      watchlist: {
        Row: Watchlist;
        Insert: WatchlistInsert;
        Update: never;
        Relationships: [];
      };
      geopolitical_risks: {
        Row: GeopoliticalRisk;
        Insert: GeopoliticalRiskInsert;
        Update: GeopoliticalRiskUpdate;
        Relationships: [];
      };
      geopolitical_events: {
        Row: GeopoliticalEvent;
        Insert: GeopoliticalEventInsert;
        Update: never;
        Relationships: [];
      };
      investment_guides: {
        Row: InvestmentGuide;
        Insert: InvestmentGuideInsert;
        Update: never;
        Relationships: [];
      };
      daily_briefings: {
        Row: DailyBriefing;
        Insert: DailyBriefingInsert;
        Update: never;
        Relationships: [];
      };
      weekly_reports: {
        Row: WeeklyReport;
        Insert: WeeklyReportInsert;
        Update: never;
        Relationships: [];
      };
      economic_calendar: {
        Row: EconomicCalendarEvent;
        Insert: EconomicCalendarEventInsert;
        Update: never;
        Relationships: [];
      };
      scenario_simulations: {
        Row: ScenarioSimulation;
        Insert: ScenarioSimulationInsert;
        Update: never;
        Relationships: [];
      };
      glossary_terms: {
        Row: GlossaryTerm;
        Insert: GlossaryTermInsert;
        Update: never;
        Relationships: [];
      };
      ai_conversations: {
        Row: AiConversation;
        Insert: AiConversationInsert;
        Update: never;
        Relationships: [];
      };
      fear_greed_snapshots: {
        Row: FearGreedSnapshot;
        Insert: FearGreedSnapshotInsert;
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      market_type: MarketType;
      user_role: UserRole;
      user_status: UserStatus;
      event_type: EventType;
      sentiment_direction: SentimentDirection;
      risk_level: RiskLevel;
      notification_target_type: NotificationTargetType;
      asset_type: AssetType;
      account_type: AccountType;
      guide_action: GuideAction;
      geo_risk_level: GeoRiskLevel;
      geo_risk_status: GeoRiskStatus;
      geo_risk_category: GeoRiskCategory;
      fear_greed_label: FearGreedLabel;
      calendar_event_type: CalendarEventType;
      event_importance: EventImportance;
    };
    CompositeTypes: Record<string, never>;
  };
}
