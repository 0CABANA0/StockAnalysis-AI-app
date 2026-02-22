-- ============================================================
-- 006_create_triggers.sql
-- Stock Intelligence Platform — 트리거 & 함수 4개
-- ============================================================

-- ── 1. updated_at 자동 갱신 ──

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_portfolio_updated_at
  BEFORE UPDATE ON portfolio
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_model_configs_updated_at
  BEFORE UPDATE ON model_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_notification_targets_updated_at
  BEFORE UPDATE ON notification_targets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_etf_fund_master_updated_at
  BEFORE UPDATE ON etf_fund_master
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ── 2. 회원가입 시 user_profiles 자동 생성 ──

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO user_profiles (user_id, email, role, status)
  VALUES (
    NEW.id,
    NEW.email,
    'USER',
    'ACTIVE'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ── 3. portfolio soft delete 시 deleted_at 자동 설정 ──

CREATE OR REPLACE FUNCTION handle_soft_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.is_deleted = TRUE AND OLD.is_deleted = FALSE THEN
    NEW.deleted_at = now();
  END IF;
  IF NEW.is_deleted = FALSE AND OLD.is_deleted = TRUE THEN
    NEW.deleted_at = NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_portfolio_soft_delete
  BEFORE UPDATE ON portfolio
  FOR EACH ROW
  WHEN (OLD.is_deleted IS DISTINCT FROM NEW.is_deleted)
  EXECUTE FUNCTION handle_soft_delete();


-- ── 4. price_alerts 트리거 시 triggered_at 자동 설정 ──

CREATE OR REPLACE FUNCTION handle_alert_triggered()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.is_triggered = TRUE AND OLD.is_triggered = FALSE THEN
    NEW.triggered_at = now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_price_alerts_triggered
  BEFORE UPDATE ON price_alerts
  FOR EACH ROW
  WHEN (OLD.is_triggered = FALSE AND NEW.is_triggered = TRUE)
  EXECUTE FUNCTION handle_alert_triggered();
