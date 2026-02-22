-- ============================================================
-- 004_create_indexes.sql
-- Stock Intelligence Platform — 인덱스 (~25개)
-- Partial index 적극 활용
-- ============================================================

-- ── portfolio ──
CREATE INDEX idx_portfolio_user_id
  ON portfolio(user_id)
  WHERE is_deleted = FALSE;

CREATE INDEX idx_portfolio_ticker
  ON portfolio(ticker);

CREATE INDEX idx_portfolio_market
  ON portfolio(market);

-- ── transactions ──
CREATE INDEX idx_transactions_portfolio_id
  ON transactions(portfolio_id);

CREATE INDEX idx_transactions_user_id
  ON transactions(user_id);

CREATE INDEX idx_transactions_trade_date
  ON transactions(trade_date DESC);

CREATE INDEX idx_transactions_type
  ON transactions(type);

-- ── distributions ──
CREATE INDEX idx_distributions_portfolio_id
  ON distributions(portfolio_id);

CREATE INDEX idx_distributions_user_id
  ON distributions(user_id);

CREATE INDEX idx_distributions_record_date
  ON distributions(record_date DESC);

-- ── recommendations ──
CREATE INDEX idx_recommendations_ticker
  ON recommendations(ticker)
  WHERE is_active = TRUE;

CREATE INDEX idx_recommendations_expires_at
  ON recommendations(expires_at)
  WHERE is_active = TRUE;

CREATE INDEX idx_recommendations_confidence
  ON recommendations(confidence_score DESC)
  WHERE is_active = TRUE;

-- ── price_alerts ──
CREATE INDEX idx_price_alerts_user_id
  ON price_alerts(user_id)
  WHERE is_triggered = FALSE;

CREATE INDEX idx_price_alerts_ticker_price
  ON price_alerts(ticker, trigger_price)
  WHERE is_triggered = FALSE;

-- ── macro_snapshots ──
CREATE INDEX idx_macro_snapshots_collected_at
  ON macro_snapshots(collected_at DESC);

-- ── sentiment_results ──
CREATE INDEX idx_sentiment_results_direction
  ON sentiment_results(direction);

CREATE INDEX idx_sentiment_results_event_type
  ON sentiment_results(event_type);

CREATE INDEX idx_sentiment_results_analyzed_at
  ON sentiment_results(analyzed_at DESC);

-- ── prediction_scores ──
CREATE INDEX idx_prediction_scores_user_id
  ON prediction_scores(user_id);

CREATE INDEX idx_prediction_scores_ticker
  ON prediction_scores(ticker);

CREATE INDEX idx_prediction_scores_analyzed_at
  ON prediction_scores(analyzed_at DESC);

-- ── etf_fund_master ──
CREATE INDEX idx_etf_fund_master_asset_type
  ON etf_fund_master(asset_type)
  WHERE is_active = TRUE;

CREATE INDEX idx_etf_fund_master_category
  ON etf_fund_master(category)
  WHERE is_active = TRUE;

-- ── user_profiles ──
CREATE INDEX idx_user_profiles_role
  ON user_profiles(role);

CREATE INDEX idx_user_profiles_status
  ON user_profiles(status);

-- ── notification_targets ──
CREATE INDEX idx_notification_targets_user_id
  ON notification_targets(user_id);

CREATE INDEX idx_notification_targets_groups
  ON notification_targets USING GIN(groups);

CREATE INDEX idx_notification_targets_active
  ON notification_targets(is_active)
  WHERE is_active = TRUE;

-- ── notification_history ──
CREATE INDEX idx_notification_history_sent_at
  ON notification_history(sent_at DESC);

CREATE INDEX idx_notification_history_sender
  ON notification_history(sender_admin_id);

-- ── audit_logs ──
CREATE INDEX idx_audit_logs_admin_id
  ON audit_logs(admin_id);

CREATE INDEX idx_audit_logs_action_type
  ON audit_logs(action_type);

CREATE INDEX idx_audit_logs_created_at
  ON audit_logs(created_at DESC);

-- ── role_change_logs ──
CREATE INDEX idx_role_change_logs_target
  ON role_change_logs(target_user_id);

CREATE INDEX idx_role_change_logs_created_at
  ON role_change_logs(created_at DESC);

-- ── model_configs ──
CREATE INDEX idx_model_configs_active
  ON model_configs(config_key)
  WHERE is_active = TRUE;

-- ── model_change_logs ──
CREATE INDEX idx_model_change_logs_config_key
  ON model_change_logs(config_key);

CREATE INDEX idx_model_change_logs_created_at
  ON model_change_logs(created_at DESC);
