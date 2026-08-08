-- Additive migration: customer review photos.
-- Purely additive — existing rows are unaffected (defaults to empty array).
ALTER TABLE "reviews"
  ADD COLUMN IF NOT EXISTS "photos" TEXT[] NOT NULL DEFAULT '{}';
