-- Add per-venue loyalty spend thresholds to the bars table.
-- These replace the hardcoded constants (3000 / 5000 / 15000) in loadLoyaltyData().
-- Defaults match the previous hardcoded values so existing venues are unaffected.

ALTER TABLE bars
  ADD COLUMN IF NOT EXISTS bronze_threshold INTEGER NOT NULL DEFAULT 3000,
  ADD COLUMN IF NOT EXISTS silver_threshold INTEGER NOT NULL DEFAULT 5000,
  ADD COLUMN IF NOT EXISTS gold_threshold   INTEGER NOT NULL DEFAULT 15000;

-- Enforce minimum configurable values per tier
ALTER TABLE bars
  ADD CONSTRAINT bars_bronze_threshold_min CHECK (bronze_threshold >= 1500),
  ADD CONSTRAINT bars_silver_threshold_min CHECK (silver_threshold >= 3000),
  ADD CONSTRAINT bars_gold_threshold_min   CHECK (gold_threshold   >= 5000);
