-- ============================================================
-- 002_create_otp_requests.sql
-- OTP request tracking for phone-based authentication
-- ============================================================
-- Design decisions:
--   • otp_hash stores a bcrypt hash — raw OTP is NEVER persisted.
--   • purpose is an enum so we can extend later (e.g. 'password_reset').
--   • attempt_count is capped at 5 via CHECK constraint to prevent brute
--     force at the DB level (app layer should also enforce this).
--   • expires_at is mandatory — every OTP MUST have a TTL.
--   • Composite index on (phone, is_used, expires_at) covers the hot query:
--       "find the latest unused, unexpired OTP for this phone".
--   • No updated_at — OTP rows are append-only; once used they're immutable.
-- ============================================================

-- Idempotent teardown
DROP TABLE IF EXISTS otp_requests CASCADE;
DROP TYPE IF EXISTS otp_purpose CASCADE;

-- ============================================================
-- Enum: OTP purpose
-- ============================================================
CREATE TYPE otp_purpose AS ENUM ('login', 'signup');

COMMENT ON TYPE otp_purpose IS 'Allowed purposes for OTP requests.';

-- ============================================================
-- OTP Requests table
-- ============================================================
CREATE TABLE otp_requests (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Phone receiving the OTP. Not a FK to users because signup OTPs
  -- arrive BEFORE the user row exists.
  phone         VARCHAR(15)  NOT NULL,

  -- bcrypt hash of the 6-digit OTP.
  otp_hash      VARCHAR(255) NOT NULL,

  purpose       otp_purpose  NOT NULL,

  -- Flipped to TRUE after successful verification.
  is_used       BOOLEAN      NOT NULL DEFAULT FALSE,

  -- How many times the user tried to verify this OTP.
  attempt_count INT          NOT NULL DEFAULT 0,

  -- Hard expiry. App should set this to NOW() + 5 minutes (configurable).
  expires_at    TIMESTAMPTZ  NOT NULL,

  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  -- DB-level brute-force cap: max 5 attempts per OTP.
  CONSTRAINT chk_max_attempts CHECK (attempt_count <= 5),

  -- E.164 format validation (same rule as users table).
  CONSTRAINT chk_otp_phone_e164 CHECK (phone ~ '^\+[1-9]\d{1,13}$')
);

-- ============================================================
-- Indexes
-- ============================================================
-- Hot path: find the latest valid OTP for a phone number.
--   WHERE phone = $1 AND is_used = FALSE AND expires_at > NOW()
--   ORDER BY created_at DESC LIMIT 1
CREATE INDEX idx_otp_phone_unused_expires
  ON otp_requests (phone, is_used, expires_at DESC);

-- Cleanup job: delete old used/expired OTPs.
CREATE INDEX idx_otp_created_at
  ON otp_requests (created_at);

-- ============================================================
-- Table & column comments
-- ============================================================
COMMENT ON TABLE otp_requests IS 'Tracks every OTP sent via MSG91. OTP value is bcrypt-hashed; never stored in plain text.';
COMMENT ON COLUMN otp_requests.otp_hash IS 'bcrypt hash of the 6-digit OTP code.';
COMMENT ON COLUMN otp_requests.attempt_count IS 'Incremented on each verify attempt. Capped at 5 by CHECK constraint.';
COMMENT ON COLUMN otp_requests.expires_at IS 'Absolute expiry timestamp. Typically created_at + 5 minutes.';
