-- ============================================================
-- 008_cleanup_phone_auth.sql
-- Remove phone/OTP authentication infrastructure
-- ============================================================
-- This migration drops all phone-based authentication tables and
-- related objects that are no longer needed after switching to
-- Supabase Auth email/password + OAuth authentication.
--
-- Tables dropped:
--   • otp_requests — phone OTP tracking (replaced by Supabase Auth)
--   • sessions     — custom JWT sessions (replaced by Supabase Auth)
--
-- Also cleans up:
--   • otp_purpose enum type
--   • RLS policies for dropped tables
--   • Notification infrastructure (unused in codebase)
-- ============================================================

-- ============================================================
-- 1. Drop RLS policies for tables being removed
-- ============================================================
DROP POLICY IF EXISTS otp_requests_deny_all ON otp_requests;
DROP POLICY IF EXISTS sessions_select_own ON sessions;
DROP POLICY IF EXISTS notif_logs_deny_all ON notification_logs;

-- ============================================================
-- 2. Drop tables
-- ============================================================
-- Drop triggers first
DROP TRIGGER IF EXISTS set_updated_at_sessions ON sessions;
DROP TRIGGER IF EXISTS set_updated_at_notification_logs ON notification_logs;
DROP TRIGGER IF EXISTS set_updated_at_whatsapp_templates ON whatsapp_templates;

-- Drop notification tables (unused in backend code)
DROP TABLE IF EXISTS notification_logs CASCADE;
DROP TABLE IF EXISTS whatsapp_templates CASCADE;

-- Drop auth tables
DROP TABLE IF EXISTS otp_requests CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;

-- ============================================================
-- 3. Drop enum types
-- ============================================================
DROP TYPE IF EXISTS otp_purpose CASCADE;
DROP TYPE IF EXISTS notification_channel CASCADE;
DROP TYPE IF EXISTS notification_status CASCADE;

-- ============================================================
-- 4. Update users table — make phone optional, add auth_id
-- ============================================================
-- Check if auth_id column exists before adding
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'auth_id'
  ) THEN
    ALTER TABLE users ADD COLUMN auth_id UUID UNIQUE;
  END IF;
END $$;

-- Make phone optional (if it's currently NOT NULL)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users'
      AND column_name = 'phone'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE users ALTER COLUMN phone DROP NOT NULL;
  END IF;
END $$;

-- Remove E.164 phone constraint (if exists)
ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_phone_e164;

-- Remove is_verified column (Supabase Auth handles verification)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'is_verified'
  ) THEN
    ALTER TABLE users DROP COLUMN is_verified;
  END IF;
END $$;

-- Add avatar column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'avatar'
  ) THEN
    ALTER TABLE users ADD COLUMN avatar TEXT;
  END IF;
END $$;

-- ============================================================
-- 5. Update RLS policies for users table
-- ============================================================
-- Update current_user_id() to use Supabase Auth's auth.uid()
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS UUID AS $$
BEGIN
  RETURN auth.uid();
EXCEPTION
  WHEN OTHERS THEN
    -- Fall back to JWT claim extraction for service-role calls
    RETURN (
      current_setting('request.jwt.claims', TRUE)::JSON ->>'sub'
    )::UUID;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION current_user_id()
  IS 'Returns the authenticated user UUID. Uses Supabase auth.uid() with fallback to JWT claim "sub".';

-- ============================================================
-- Comments
-- ============================================================
COMMENT ON TABLE users IS 'Registered platform users. Auth via Supabase (email/password + OAuth). Soft-deletable.';
