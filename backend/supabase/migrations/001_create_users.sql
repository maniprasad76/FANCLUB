-- ============================================================
-- 001_create_users.sql
-- Users table for TFI ecommerce platform
-- ============================================================
-- Design decisions:
--   • phone is the PRIMARY login credential (Indian market, MSG91 OTP).
--   • E.164 format (+91XXXXXXXXXX) enforced via CHECK constraint.
--   • email is optional but unique when provided (for receipts / marketing).
--   • Soft delete via deleted_at — we never hard-delete user rows because
--     orders, sessions, and notification logs reference them.
--   • updated_at is auto-managed by a trigger so the app layer can't forget.
-- ============================================================

-- Idempotent teardown
DROP TRIGGER IF EXISTS set_updated_at_users ON users;
DROP FUNCTION IF EXISTS trigger_set_updated_at() CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================
-- Reusable updated_at trigger function (used by every table)
-- ============================================================
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION trigger_set_updated_at()
  IS 'Auto-sets updated_at to current timestamp on every UPDATE. Shared across all tables.';

-- ============================================================
-- Users table
-- ============================================================
CREATE TABLE users (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Phone is the login identity. E.164 enforced.
  phone       VARCHAR(15) NOT NULL UNIQUE,

  name        VARCHAR(100),

  -- Email is optional; unique when present.
  email       VARCHAR(255) UNIQUE,

  -- Set to true after first successful OTP verification.
  is_verified BOOLEAN     NOT NULL DEFAULT FALSE,

  -- Admin can deactivate without deleting.
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,

  -- Soft delete: NULL = active, timestamped = soft-deleted.
  deleted_at  TIMESTAMPTZ,

  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- E.164: must start with '+' followed by 1-14 digits.
  CONSTRAINT chk_phone_e164 CHECK (phone ~ '^\+[1-9]\d{1,13}$')
);

-- ============================================================
-- Indexes
-- ============================================================
-- Phone lookups happen on every login attempt.
-- The UNIQUE constraint already creates an index, but we add a partial
-- index for active-only users to speed up auth queries.
CREATE INDEX idx_users_phone_active
  ON users (phone)
  WHERE deleted_at IS NULL AND is_active = TRUE;

-- Email lookup for profile / receipt queries.
CREATE INDEX idx_users_email
  ON users (email)
  WHERE email IS NOT NULL;

-- ============================================================
-- Auto-update trigger
-- ============================================================
CREATE TRIGGER set_updated_at_users
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- Table & column comments
-- ============================================================
COMMENT ON TABLE users IS 'Registered platform users. Auth via phone OTP (MSG91). Soft-deletable.';
COMMENT ON COLUMN users.phone IS 'E.164 formatted phone number (+91XXXXXXXXXX for India).';
COMMENT ON COLUMN users.is_verified IS 'TRUE after first successful OTP verification.';
COMMENT ON COLUMN users.deleted_at IS 'Non-NULL = soft-deleted. Excluded from active queries via partial indexes.';
