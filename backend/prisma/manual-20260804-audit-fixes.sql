-- ============================================================================
-- FAN Club — Audit-fix schema migration (manual apply)
-- ----------------------------------------------------------------------------
-- Applies the schema changes behind these findings:
--   CRIT 1   Order.expiresAt (stale PENDING order expiry) + index
--   CRIT 3   New Setting table (DB-backed store configuration)
--   MED 14   Order.idempotencyKey (idempotent order creation)
--
-- Your repo has no prisma/migrations/ folder, so schema is applied via
-- `prisma db push`. Recommended (simplest, keeps schema.sql in sync):
--
--     cd backend
--     npx prisma db push
--
-- Alternatively apply this file manually:
--
--     psql "$DATABASE_URL" -f backend/prisma/manual-20260804-audit-fixes.sql
--
-- All statements are idempotent (IF NOT EXISTS), safe to re-run.
-- ============================================================================

-- ── CRIT 3: Setting model ────────────────────────────────────────────────────
-- Prisma `value Json` maps to jsonb in PostgreSQL.
CREATE TABLE IF NOT EXISTS "settings" (
    "key"       TEXT        NOT NULL,
    "value"     JSONB       NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "settings_pkey" PRIMARY KEY ("key")
);

-- ── CRIT 1: Order.expiresAt ──────────────────────────────────────────────────
-- Prisma `@db.Timestamptz(6)` maps to `timestamp(6) with time zone`.
ALTER TABLE "orders"
    ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(6) WITH TIME ZONE;

-- Index matches Prisma's `@@index([expiresAt])` on the `orders` table.
CREATE INDEX IF NOT EXISTS "orders_expiresAt_idx" ON "orders"("expiresAt");

-- ── MED 14: Order.idempotencyKey (unique) ────────────────────────────────────
ALTER TABLE "orders"
    ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;

-- Unique index matches Prisma's `idempotencyKey String? @unique`.
CREATE UNIQUE INDEX IF NOT EXISTS "orders_idempotencyKey_key"
    ON "orders"("idempotencyKey");

-- ============================================================================
-- Optional but recommended after applying: backfill expiry for any online
-- orders currently stuck in PENDING (they would otherwise wait for the next
-- expiry-job scan, which runs every 60s):
--
--   UPDATE "orders"
--      SET "expiresAt" = NOW() + INTERVAL '15 minutes'
--    WHERE "status" = 'PENDING'
--      AND "paymentMethod" IN ('ONLINE', 'CARD', 'UPI', 'NETBANKING', 'WALLET')
--      AND "expiresAt" IS NULL;
-- ============================================================================
