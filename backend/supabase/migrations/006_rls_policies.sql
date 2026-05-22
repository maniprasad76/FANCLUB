-- ============================================================
-- 006_rls_policies.sql
-- Row Level Security policies for all tables
-- ============================================================
-- Design decisions:
--   • Since this project uses CUSTOM JWT auth (NOT Supabase Auth),
--     auth.uid() won't work out of the box. We create a helper function
--     current_user_id() that reads the user ID from the JWT claim
--     set by the NestJS backend via Supabase's request.jwt.claims.
--   • The NestJS backend connects as the 'service_role' key for admin
--     operations (INSERT users, create sessions, send notifications).
--     Service role bypasses RLS automatically in Supabase.
--   • Authenticated users (via 'anon' key + JWT) get row-level access
--     restricted to their own data.
--   • otp_requests and notification_logs are service-role-only — end
--     users should NEVER query these directly.
--   • whatsapp_templates is not RLS-protected (admin-managed config).
-- ============================================================

-- ============================================================
-- Helper: extract current user ID from JWT claims
-- ============================================================
-- The NestJS backend sets a custom claim 'sub' (or 'user_id') in the
-- JWT. Supabase makes this available via current_setting('request.jwt.claims').
-- This function extracts it safely, returning NULL for unauthenticated requests.
-- ============================================================
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    current_setting('request.jwt.claims', TRUE)::JSON ->> 'sub'
  )::UUID;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION current_user_id()
  IS 'Extracts the authenticated user UUID from the custom JWT claim "sub". Returns NULL if unauthenticated.';

-- ============================================================
-- Enable RLS on all tables
-- ============================================================
ALTER TABLE users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_requests       ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders             ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs  ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Force RLS even for table owners (safety net)
-- ============================================================
ALTER TABLE users              FORCE ROW LEVEL SECURITY;
ALTER TABLE otp_requests       FORCE ROW LEVEL SECURITY;
ALTER TABLE sessions           FORCE ROW LEVEL SECURITY;
ALTER TABLE orders             FORCE ROW LEVEL SECURITY;
ALTER TABLE order_items        FORCE ROW LEVEL SECURITY;
ALTER TABLE notification_logs  FORCE ROW LEVEL SECURITY;

-- ============================================================
-- 1. USERS — users can read and update their own row
-- ============================================================
-- Drop existing policies (idempotent)
DROP POLICY IF EXISTS users_select_own ON users;
DROP POLICY IF EXISTS users_update_own ON users;

-- Users can read their own profile.
CREATE POLICY users_select_own ON users
  FOR SELECT
  TO authenticated
  USING (id = current_user_id());

-- Users can update their own profile (name, email, etc.).
-- They cannot change: id, phone, is_verified, is_active, deleted_at.
CREATE POLICY users_update_own ON users
  FOR UPDATE
  TO authenticated
  USING (id = current_user_id())
  WITH CHECK (id = current_user_id());

-- ============================================================
-- 2. OTP_REQUESTS — service role only (no user access)
-- ============================================================
-- No policies for 'authenticated' role means all access is denied.
-- Service role bypasses RLS automatically.
DROP POLICY IF EXISTS otp_requests_deny_all ON otp_requests;

-- Explicit deny-all for documentation clarity.
-- (RLS enabled + no policies = implicit deny, but this is self-documenting.)
CREATE POLICY otp_requests_deny_all ON otp_requests
  FOR ALL
  TO authenticated
  USING (FALSE)
  WITH CHECK (FALSE);

-- ============================================================
-- 3. SESSIONS — users can read own sessions; mutations are service-role only
-- ============================================================
DROP POLICY IF EXISTS sessions_select_own ON sessions;

-- Users can see their active sessions (e.g. "my devices" screen).
CREATE POLICY sessions_select_own ON sessions
  FOR SELECT
  TO authenticated
  USING (user_id = current_user_id());

-- INSERT / UPDATE / DELETE on sessions is service-role only.
-- (Login, logout, revocation are all backend operations.)

-- ============================================================
-- 4. ORDERS — users can read their own orders
-- ============================================================
DROP POLICY IF EXISTS orders_select_own ON orders;

-- Users can see their own orders (non-deleted).
CREATE POLICY orders_select_own ON orders
  FOR SELECT
  TO authenticated
  USING (
    user_id = current_user_id()
    AND deleted_at IS NULL
  );

-- Order creation, status updates, and cancellation are service-role only.

-- ============================================================
-- 5. ORDER_ITEMS — users can read items of their own orders
-- ============================================================
DROP POLICY IF EXISTS order_items_select_own ON order_items;

-- Users can see line items for orders they own.
CREATE POLICY order_items_select_own ON order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = current_user_id()
        AND orders.deleted_at IS NULL
    )
  );

-- ============================================================
-- 6. NOTIFICATION_LOGS — service role only (no user access)
-- ============================================================
DROP POLICY IF EXISTS notif_logs_deny_all ON notification_logs;

-- Explicit deny-all. Service role handles all notification operations.
CREATE POLICY notif_logs_deny_all ON notification_logs
  FOR ALL
  TO authenticated
  USING (FALSE)
  WITH CHECK (FALSE);

-- ============================================================
-- Comments
-- ============================================================
COMMENT ON POLICY users_select_own ON users
  IS 'Authenticated users can SELECT their own row only.';
COMMENT ON POLICY users_update_own ON users
  IS 'Authenticated users can UPDATE their own row only.';
COMMENT ON POLICY sessions_select_own ON sessions
  IS 'Authenticated users can SELECT their own sessions.';
COMMENT ON POLICY orders_select_own ON orders
  IS 'Authenticated users can SELECT their own non-deleted orders.';
COMMENT ON POLICY order_items_select_own ON order_items
  IS 'Authenticated users can SELECT items belonging to their own orders.';
COMMENT ON POLICY otp_requests_deny_all ON otp_requests
  IS 'All authenticated access denied. Service role only.';
COMMENT ON POLICY notif_logs_deny_all ON notification_logs
  IS 'All authenticated access denied. Service role only.';
