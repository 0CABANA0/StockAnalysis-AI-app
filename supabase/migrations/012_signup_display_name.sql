-- ============================================================
-- 012_signup_display_name.sql
-- 회원가입 시 display_name을 user_profiles에 자동 반영
-- raw_user_meta_data->>'display_name' 에서 추출
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO user_profiles (user_id, email, display_name, role, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', ''),
    'USER',
    'ACTIVE'
  );
  RETURN NEW;
END;
$$;
