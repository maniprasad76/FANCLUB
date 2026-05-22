-- ============================================================
-- 003_create_sessions.sql
-- JWT session tracking for custom auth (no Supabase Auth)
-- ============================================================
-- Design decisions:
--   • token_hash stores a SHA-256 hash of the JWT — the raw token is
--     NEVER persisted. This lets us validate / revoke tokens server-side
--     without exposing secrets if the DB is compromised.
--   • device_info is JSONB so the frontend can send whatever the browser
--     or app provides (user-agent, OS, app version, etc.).
--   • ip_address uses PostgreSQL's native INET type for compact storage
--     and built-in validation of IPv4 / IPv6.
--   • is_active allows instant token revocation without waiting for expiry.
--   • updated_at auto-managed by the shared trigger_set_updated_at().
-- ============================================================

-- Idempotent teardown
DROP TRIGGER IF EXISTS set_updated_at_sessions ON sessions;
DROP TABLE IF EXISTS sessions CASCADE;

-- ============================================================
-- Sessions table
-- ============================================================
CREATE TABLE sessions (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Owner of the session.
  user_id     UUID         NOT NULL
                           REFERENCES users(id)
                           ON DELETE CASCADE,

  -- SHA-256 hash of the issued JWT.
  token_hash  VARCHAR(255) NOT NULL,

  -- Freeform device metadata from client.
  device_info JSONB,

  -- Client IP at login time.
  ip_address  INET,

  -- FALSE = revoked / logged out. Checked on every request.
  is_active   BOOLEAN      NOT NULL DEFAULT TRUE,

  -- JWT expiry mirrored here for DB-level cleanup queries.
  expires_at  TIMESTAMPTZ,

  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Indexes
-- ============================================================
-- Hot path: look up active sessions for a user (e.g. "my devices" screen).
CREATE INDEX idx_sessions_user_id_active
  ON sessions (user_id)
  WHERE is_active = TRUE;

-- Auth middleware: find session by token hash.
CREATE INDEX idx_sessions_token_hash
  ON sessions (token_hash)
  WHERE is_active = TRUE;

-- Cleanup job: find expired sessions to deactivate.
CREATE INDEX idx_sessions_expires_at
  ON sessions (expires_at)
  WHERE is_active = TRUE;

-- ============================================================
-- Auto-update trigger
-- ============================================================
CREATE TRIGGER set_updated_at_sessions
  BEFORE UPDATE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- Table & column comments
-- ============================================================
COMMENT ON TABLE sessions IS 'Custom JWT sessions. Token is SHA-256 hashed. Supports multi-device login and server-side revocation.';
COMMENT ON COLUMN sessions.token_hash IS 'SHA-256 hash of the JWT. Raw token never stored.';
COMMENT ON COLUMN sessions.device_info IS 'Client-provided device metadata (user-agent, OS, app version).';
COMMENT ON COLUMN sessions.ip_address IS 'Client IP at session creation. Stored as PostgreSQL INET.';
COMMENT ON COLUMN sessions.is_active IS 'Set to FALSE on logout or admin revocation.';
