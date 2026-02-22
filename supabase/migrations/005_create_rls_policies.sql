-- ============================================================
-- 005_create_rls_policies.sql
-- Stock Intelligence Platform — RLS 정책 + 헬퍼 함수
-- 핵심 원칙: 투자 데이터는 ADMIN도 접근 불가 (No bypass RLS)
-- ============================================================

-- ── 헬퍼 함수: 현재 사용자의 역할 조회 ──
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM user_profiles WHERE user_id = auth.uid();
$$;

-- ── 헬퍼 함수: ADMIN 이상인지 확인 ──
CREATE OR REPLACE FUNCTION is_admin_or_above()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
      AND role IN ('ADMIN', 'SUPER_ADMIN')
      AND status = 'ACTIVE'
  );
$$;

-- ── 헬퍼 함수: SUPER_ADMIN인지 확인 ──
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
      AND role = 'SUPER_ADMIN'
      AND status = 'ACTIVE'
  );
$$;


-- ================================================================
-- 투자 데이터 테이블 — 본인만 접근 (ADMIN 우회 없음)
-- ================================================================

-- ── portfolio ──
ALTER TABLE portfolio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "portfolio_select_own"
  ON portfolio FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "portfolio_insert_own"
  ON portfolio FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "portfolio_update_own"
  ON portfolio FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "portfolio_delete_own"
  ON portfolio FOR DELETE
  USING (user_id = auth.uid());

-- ── transactions ──
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transactions_select_own"
  ON transactions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "transactions_insert_own"
  ON transactions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "transactions_update_own"
  ON transactions FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "transactions_delete_own"
  ON transactions FOR DELETE
  USING (user_id = auth.uid());

-- ── distributions ──
ALTER TABLE distributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "distributions_select_own"
  ON distributions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "distributions_insert_own"
  ON distributions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "distributions_update_own"
  ON distributions FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "distributions_delete_own"
  ON distributions FOR DELETE
  USING (user_id = auth.uid());

-- ── prediction_scores ──
ALTER TABLE prediction_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prediction_scores_select_own"
  ON prediction_scores FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "prediction_scores_insert_own"
  ON prediction_scores FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- prediction_scores는 UPDATE/DELETE 불필요 (분석 결과는 불변)

-- ── price_alerts ──
ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "price_alerts_select_own"
  ON price_alerts FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "price_alerts_insert_own"
  ON price_alerts FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "price_alerts_update_own"
  ON price_alerts FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "price_alerts_delete_own"
  ON price_alerts FOR DELETE
  USING (user_id = auth.uid());


-- ================================================================
-- 공개/읽기 전용 데이터 — 인증된 사용자 전체 읽기
-- ================================================================

-- ── recommendations ──
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recommendations_select_authenticated"
  ON recommendations FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "recommendations_insert_admin"
  ON recommendations FOR INSERT
  WITH CHECK (is_admin_or_above());

CREATE POLICY "recommendations_update_admin"
  ON recommendations FOR UPDATE
  USING (is_admin_or_above())
  WITH CHECK (is_admin_or_above());

CREATE POLICY "recommendations_delete_admin"
  ON recommendations FOR DELETE
  USING (is_admin_or_above());

-- ── macro_snapshots ──
ALTER TABLE macro_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "macro_snapshots_select_authenticated"
  ON macro_snapshots FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "macro_snapshots_insert_admin"
  ON macro_snapshots FOR INSERT
  WITH CHECK (is_admin_or_above());

-- ── sentiment_results ──
ALTER TABLE sentiment_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sentiment_results_select_authenticated"
  ON sentiment_results FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "sentiment_results_insert_admin"
  ON sentiment_results FOR INSERT
  WITH CHECK (is_admin_or_above());

-- ── etf_fund_master ──
ALTER TABLE etf_fund_master ENABLE ROW LEVEL SECURITY;

CREATE POLICY "etf_fund_master_select_authenticated"
  ON etf_fund_master FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "etf_fund_master_insert_admin"
  ON etf_fund_master FOR INSERT
  WITH CHECK (is_admin_or_above());

CREATE POLICY "etf_fund_master_update_admin"
  ON etf_fund_master FOR UPDATE
  USING (is_admin_or_above())
  WITH CHECK (is_admin_or_above());

-- ── etf_macro_mapping ──
ALTER TABLE etf_macro_mapping ENABLE ROW LEVEL SECURITY;

CREATE POLICY "etf_macro_mapping_select_authenticated"
  ON etf_macro_mapping FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "etf_macro_mapping_insert_admin"
  ON etf_macro_mapping FOR INSERT
  WITH CHECK (is_admin_or_above());

CREATE POLICY "etf_macro_mapping_update_admin"
  ON etf_macro_mapping FOR UPDATE
  USING (is_admin_or_above())
  WITH CHECK (is_admin_or_above());


-- ================================================================
-- 관리자 테이블
-- ================================================================

-- ── user_profiles ──
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 본인 프로필 조회
CREATE POLICY "user_profiles_select_own"
  ON user_profiles FOR SELECT
  USING (user_id = auth.uid());

-- ADMIN+ 전체 프로필 조회
CREATE POLICY "user_profiles_select_admin"
  ON user_profiles FOR SELECT
  USING (is_admin_or_above());

-- 본인 프로필 일부 업데이트 (display_name, telegram_chat_id)
CREATE POLICY "user_profiles_update_own"
  ON user_profiles FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ADMIN+ 역할/상태 변경
CREATE POLICY "user_profiles_update_admin"
  ON user_profiles FOR UPDATE
  USING (is_admin_or_above())
  WITH CHECK (is_admin_or_above());

-- ── notification_groups ──
ALTER TABLE notification_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notification_groups_select_admin"
  ON notification_groups FOR SELECT
  USING (is_admin_or_above());

CREATE POLICY "notification_groups_insert_admin"
  ON notification_groups FOR INSERT
  WITH CHECK (is_admin_or_above());

CREATE POLICY "notification_groups_update_admin"
  ON notification_groups FOR UPDATE
  USING (is_admin_or_above())
  WITH CHECK (is_admin_or_above());

-- ── notification_targets ──
ALTER TABLE notification_targets ENABLE ROW LEVEL SECURITY;

-- 본인 알림 설정 조회
CREATE POLICY "notification_targets_select_own"
  ON notification_targets FOR SELECT
  USING (user_id = auth.uid());

-- ADMIN+ 전체 조회
CREATE POLICY "notification_targets_select_admin"
  ON notification_targets FOR SELECT
  USING (is_admin_or_above());

CREATE POLICY "notification_targets_insert_admin"
  ON notification_targets FOR INSERT
  WITH CHECK (is_admin_or_above());

CREATE POLICY "notification_targets_update_admin"
  ON notification_targets FOR UPDATE
  USING (is_admin_or_above())
  WITH CHECK (is_admin_or_above());

-- ── notification_history ──
ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notification_history_select_admin"
  ON notification_history FOR SELECT
  USING (is_admin_or_above());

CREATE POLICY "notification_history_insert_admin"
  ON notification_history FOR INSERT
  WITH CHECK (is_admin_or_above());

-- ── audit_logs (append-only) ──
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- SUPER_ADMIN만 조회
CREATE POLICY "audit_logs_select_super_admin"
  ON audit_logs FOR SELECT
  USING (is_super_admin());

-- ADMIN+ 삽입 가능
CREATE POLICY "audit_logs_insert_admin"
  ON audit_logs FOR INSERT
  WITH CHECK (is_admin_or_above());

-- audit_logs: UPDATE/DELETE 차단 규칙
CREATE RULE audit_logs_no_update AS ON UPDATE TO audit_logs DO INSTEAD NOTHING;
CREATE RULE audit_logs_no_delete AS ON DELETE TO audit_logs DO INSTEAD NOTHING;

-- ── role_change_logs ──
ALTER TABLE role_change_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "role_change_logs_select_super_admin"
  ON role_change_logs FOR SELECT
  USING (is_super_admin());

CREATE POLICY "role_change_logs_insert_admin"
  ON role_change_logs FOR INSERT
  WITH CHECK (is_admin_or_above());

-- role_change_logs: append-only
CREATE RULE role_change_logs_no_update AS ON UPDATE TO role_change_logs DO INSTEAD NOTHING;
CREATE RULE role_change_logs_no_delete AS ON DELETE TO role_change_logs DO INSTEAD NOTHING;

-- ── model_configs ──
ALTER TABLE model_configs ENABLE ROW LEVEL SECURITY;

-- ADMIN+ 조회
CREATE POLICY "model_configs_select_admin"
  ON model_configs FOR SELECT
  USING (is_admin_or_above());

-- ADMIN+ 변경
CREATE POLICY "model_configs_update_admin"
  ON model_configs FOR UPDATE
  USING (is_admin_or_above())
  WITH CHECK (is_admin_or_above());

-- SUPER_ADMIN만 삽입/삭제
CREATE POLICY "model_configs_insert_super_admin"
  ON model_configs FOR INSERT
  WITH CHECK (is_super_admin());

CREATE POLICY "model_configs_delete_super_admin"
  ON model_configs FOR DELETE
  USING (is_super_admin());

-- ── model_change_logs ──
ALTER TABLE model_change_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "model_change_logs_select_admin"
  ON model_change_logs FOR SELECT
  USING (is_admin_or_above());

CREATE POLICY "model_change_logs_insert_admin"
  ON model_change_logs FOR INSERT
  WITH CHECK (is_admin_or_above());

-- model_change_logs: append-only
CREATE RULE model_change_logs_no_update AS ON UPDATE TO model_change_logs DO INSTEAD NOTHING;
CREATE RULE model_change_logs_no_delete AS ON DELETE TO model_change_logs DO INSTEAD NOTHING;
