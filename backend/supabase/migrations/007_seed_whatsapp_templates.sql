-- ============================================================
-- 007_seed_whatsapp_templates.sql
-- Seed default WhatsApp templates for order status transitions
-- ============================================================
-- Design decisions:
--   • One template per meaningful order status transition.
--   • template_id uses placeholder values (TEMPLATE_*) — replace with
--     actual MSG91 template IDs after configuring them in the MSG91
--     dashboard.
--   • variables lists the dynamic fields each template expects. The
--     NestJS backend will populate these from the order + user data.
--   • trigger_status maps directly to the order_status enum values so
--     the backend can do a simple lookup:
--       SELECT * FROM whatsapp_templates
--       WHERE trigger_status = NEW.status AND is_active = TRUE;
-- ============================================================

-- Idempotent: clear existing seed data and re-insert.
-- Using ON CONFLICT DO UPDATE so re-running is safe.
INSERT INTO whatsapp_templates (name, trigger_status, template_id, variables, is_active)
VALUES
  -- ============================================================
  -- Order placed → customer gets confirmation
  -- ============================================================
  (
    'order_placed',
    'pending',
    'TEMPLATE_ORDER_PLACED',
    '["customer_name", "order_number", "total_amount", "currency"]'::JSONB,
    TRUE
  ),

  -- ============================================================
  -- Payment pending → reminder to complete payment
  -- ============================================================
  (
    'payment_pending',
    'payment_pending',
    'TEMPLATE_PAYMENT_PENDING',
    '["customer_name", "order_number", "total_amount", "payment_link"]'::JSONB,
    TRUE
  ),

  -- ============================================================
  -- Payment confirmed → receipt / thank you
  -- ============================================================
  (
    'payment_confirmed',
    'payment_confirmed',
    'TEMPLATE_PAYMENT_CONFIRMED',
    '["customer_name", "order_number", "total_amount", "payment_method"]'::JSONB,
    TRUE
  ),

  -- ============================================================
  -- Payment failed → retry prompt
  -- ============================================================
  (
    'payment_failed',
    'payment_failed',
    'TEMPLATE_PAYMENT_FAILED',
    '["customer_name", "order_number", "total_amount", "retry_link"]'::JSONB,
    TRUE
  ),

  -- ============================================================
  -- Processing → order is being prepared
  -- ============================================================
  (
    'order_processing',
    'processing',
    'TEMPLATE_ORDER_PROCESSING',
    '["customer_name", "order_number", "estimated_date"]'::JSONB,
    TRUE
  ),

  -- ============================================================
  -- Shipped → tracking info sent
  -- ============================================================
  (
    'order_shipped',
    'shipped',
    'TEMPLATE_ORDER_SHIPPED',
    '["customer_name", "order_number", "tracking_id", "tracking_url", "carrier_name"]'::JSONB,
    TRUE
  ),

  -- ============================================================
  -- Out for delivery → last-mile notification
  -- ============================================================
  (
    'order_out_for_delivery',
    'out_for_delivery',
    'TEMPLATE_OUT_FOR_DELIVERY',
    '["customer_name", "order_number", "delivery_slot"]'::JSONB,
    TRUE
  ),

  -- ============================================================
  -- Delivered → confirmation + review prompt
  -- ============================================================
  (
    'order_delivered',
    'delivered',
    'TEMPLATE_ORDER_DELIVERED',
    '["customer_name", "order_number", "review_link"]'::JSONB,
    TRUE
  ),

  -- ============================================================
  -- Cancelled → cancellation confirmation
  -- ============================================================
  (
    'order_cancelled',
    'cancelled',
    'TEMPLATE_ORDER_CANCELLED',
    '["customer_name", "order_number", "refund_amount", "refund_timeline"]'::JSONB,
    TRUE
  )

ON CONFLICT (name) DO UPDATE SET
  trigger_status = EXCLUDED.trigger_status,
  template_id    = EXCLUDED.template_id,
  variables      = EXCLUDED.variables,
  is_active      = EXCLUDED.is_active,
  updated_at     = NOW();

-- ============================================================
-- Verification: show what was seeded
-- ============================================================
-- Uncomment the line below to verify seed data after running:
-- SELECT name, trigger_status, template_id, variables FROM whatsapp_templates ORDER BY created_at;
