-- ============================================================
-- 005_create_notification_logs.sql
-- Notification logs + WhatsApp template registry
-- ============================================================
-- Design decisions:
--   • notification_logs is an append-mostly audit table. Every WhatsApp /
--     SMS sent via MSG91 is recorded here with the full payload and
--     provider response for debugging and compliance.
--   • channel enum supports 'whatsapp' and 'sms'. Easily extendable to
--     'email' or 'push' later.
--   • retry_count tracks MSG91 retry attempts. The app layer uses this
--     to implement exponential backoff.
--   • whatsapp_templates is a registry of MSG91 templates mapped to
--     order status transitions. The app looks up the template by
--     trigger_status to decide which message to send on status change.
--   • variables is JSONB listing the dynamic fields the template expects
--     (e.g. ["customer_name", "order_number", "delivery_date"]).
-- ============================================================

-- Idempotent teardown
DROP TRIGGER IF EXISTS set_updated_at_notification_logs ON notification_logs;
DROP TRIGGER IF EXISTS set_updated_at_whatsapp_templates ON whatsapp_templates;
DROP TABLE IF EXISTS notification_logs CASCADE;
DROP TABLE IF EXISTS whatsapp_templates CASCADE;
DROP TYPE IF EXISTS notification_channel CASCADE;
DROP TYPE IF EXISTS notification_status CASCADE;

-- ============================================================
-- Enums
-- ============================================================
CREATE TYPE notification_channel AS ENUM ('whatsapp', 'sms');

COMMENT ON TYPE notification_channel IS 'Delivery channels for customer notifications.';

CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'failed', 'retrying');

COMMENT ON TYPE notification_status IS 'Lifecycle statuses for notification delivery attempts.';

-- ============================================================
-- WhatsApp Templates table (created first — referenced conceptually
-- by notification_logs.template_name)
-- ============================================================
CREATE TABLE whatsapp_templates (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Unique logical name, e.g. 'order_placed', 'order_shipped'.
  name           VARCHAR(100) NOT NULL UNIQUE,

  -- The order_status value that triggers this template.
  trigger_status VARCHAR(50)  NOT NULL,

  -- MSG91 template ID used in the API call.
  template_id    VARCHAR(100) NOT NULL,

  -- List of variable names the template expects.
  -- Example: ["customer_name", "order_number", "tracking_url"]
  variables      JSONB,

  is_active      BOOLEAN      NOT NULL DEFAULT TRUE,

  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Notification Logs table
-- ============================================================
CREATE TABLE notification_logs (
  id                UUID                PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id           UUID                NOT NULL
                                        REFERENCES users(id)
                                        ON DELETE RESTRICT,

  -- Nullable: not all notifications are order-related.
  order_id          UUID
                                        REFERENCES orders(id)
                                        ON DELETE SET NULL,

  channel           notification_channel NOT NULL,

  -- Logical template name (matches whatsapp_templates.name).
  template_name     VARCHAR(100),

  status            notification_status  NOT NULL DEFAULT 'pending',

  -- Full request payload sent to MSG91.
  payload           JSONB,

  -- Raw response from MSG91 (for debugging).
  provider_response JSONB,

  -- Number of retry attempts so far.
  retry_count       INT                  NOT NULL DEFAULT 0,

  -- Timestamp when the notification was actually delivered.
  sent_at           TIMESTAMPTZ,

  created_at        TIMESTAMPTZ          NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ          NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Indexes
-- ============================================================
-- Notification history for a user (profile / support screens).
CREATE INDEX idx_notif_user_id
  ON notification_logs (user_id, created_at DESC);

-- Notifications tied to a specific order.
CREATE INDEX idx_notif_order_id
  ON notification_logs (order_id)
  WHERE order_id IS NOT NULL;

-- Retry queue: find notifications that need retrying.
CREATE INDEX idx_notif_retry_queue
  ON notification_logs (status, retry_count)
  WHERE status IN ('pending', 'retrying', 'failed');

-- Template lookup by trigger status (app layer).
CREATE INDEX idx_wa_templates_trigger
  ON whatsapp_templates (trigger_status)
  WHERE is_active = TRUE;

-- ============================================================
-- Auto-update triggers
-- ============================================================
CREATE TRIGGER set_updated_at_notification_logs
  BEFORE UPDATE ON notification_logs
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_whatsapp_templates
  BEFORE UPDATE ON whatsapp_templates
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- Table & column comments
-- ============================================================
COMMENT ON TABLE notification_logs IS 'Audit log of every notification (WhatsApp / SMS) sent via MSG91. Includes full payload and provider response.';
COMMENT ON COLUMN notification_logs.payload IS 'Full request body sent to MSG91 API.';
COMMENT ON COLUMN notification_logs.provider_response IS 'Raw JSON response from MSG91 for debugging.';
COMMENT ON COLUMN notification_logs.retry_count IS 'Incremented on each retry. App layer uses this for exponential backoff.';

COMMENT ON TABLE whatsapp_templates IS 'Registry of MSG91 WhatsApp templates mapped to order status transitions.';
COMMENT ON COLUMN whatsapp_templates.trigger_status IS 'Order status value that triggers sending this template.';
COMMENT ON COLUMN whatsapp_templates.template_id IS 'MSG91 template ID used in the API call.';
COMMENT ON COLUMN whatsapp_templates.variables IS 'JSONB array of dynamic variable names the template expects.';
