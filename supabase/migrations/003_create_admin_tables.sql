-- ============================================================
-- 003_create_admin_tables.sql
-- Stock Intelligence Platform — 관리자 테이블 8개
-- FK 의존성 순서대로 생성
-- ============================================================

-- 1. user_profiles — 회원 역할/상태 관리
CREATE TABLE user_profiles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email            TEXT,
  display_name     TEXT,
  role             user_role NOT NULL DEFAULT 'USER',
  status           user_status NOT NULL DEFAULT 'ACTIVE',
  telegram_chat_id TEXT,
  last_login       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. notification_groups — 알림 그룹 정의
CREATE TABLE notification_groups (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_code     TEXT NOT NULL UNIQUE,
  description    TEXT NOT NULL,
  auto_condition JSONB,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. notification_targets — 알림 수신 대상
CREATE TABLE notification_targets (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  telegram_chat_id TEXT,
  groups           TEXT[] NOT NULL DEFAULT '{}',
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. notification_history — 알림 발송 이력
CREATE TABLE notification_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  target_type     notification_target_type NOT NULL,
  target_group    TEXT,
  target_user_ids UUID[],
  message         TEXT NOT NULL,
  message_format  TEXT DEFAULT 'HTML',
  success_count   INTEGER NOT NULL DEFAULT 0,
  fail_count      INTEGER NOT NULL DEFAULT 0,
  sent_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. audit_logs — 감사 로그 (append-only)
CREATE TABLE audit_logs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type    TEXT NOT NULL,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  detail         JSONB,
  ip_address     INET,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. role_change_logs — 역할 변경 이력
CREATE TABLE role_change_logs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  old_role       user_role NOT NULL,
  new_role       user_role NOT NULL,
  changed_by     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason         TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. model_configs — AI 모델 설정 (ADMIN+ 전용)
CREATE TABLE model_configs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key      TEXT NOT NULL UNIQUE,
  display_name    TEXT NOT NULL,
  primary_model   TEXT NOT NULL,
  fallback_model  TEXT,
  max_tokens      INTEGER DEFAULT 4096,
  temperature     NUMERIC(3, 2) DEFAULT 0.7,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  updated_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. model_change_logs — AI 모델 변경 이력 (append-only)
CREATE TABLE model_change_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key    TEXT NOT NULL,
  old_primary   TEXT,
  new_primary   TEXT NOT NULL,
  old_fallback  TEXT,
  new_fallback  TEXT,
  changed_by    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason        TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
