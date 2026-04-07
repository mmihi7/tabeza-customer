-- Cross-Venue Badge Persistence - Quick Fixes
-- Purpose: Fix critical issues preventing badge system from working
-- Run these in order in Supabase SQL Editor

-- ============================================================================
-- FIX 1: Check loyalty_analytics Table Structure
-- ============================================================================

-- First, let's see what columns actually exist
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'loyalty_analytics'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Note: The loyalty_analytics table may have different columns than expected
-- Skip this fix if the table doesn't have a default tier issue

-- ============================================================================
-- FIX 2: Add Badge Rank Column for Proper Ordering
-- ============================================================================

-- Add computed column for badge ranking
ALTER TABLE customer_badges 
ADD COLUMN IF NOT EXISTS badge_rank INTEGER GENERATED ALWAYS AS (
  CASE badge_level
    WHEN 'bronze' THEN 1
    WHEN 'silver' THEN 2
    WHEN 'gold' THEN 3
    WHEN 'platinum' THEN 4
    ELSE 0
  END
) STORED;

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_customer_badges_rank 
ON customer_badges(customer_id, badge_rank DESC) 
WHERE is_active = true;

-- Verify fix
SELECT 
  customer_id,
  badge_level,
  badge_rank,
  is_active
FROM customer_badges
ORDER BY badge_rank DESC;

-- Expected: Platinum=4, Gold=3, Silver=2, Bronze=1

-- ============================================================================
-- FIX 3: Clean Up Test Data (Optional - Run if needed)
-- ============================================================================

-- Remove any test badges that were created incorrectly
-- UNCOMMENT AND MODIFY customer_id if you need to reset a test customer

/*
DELETE FROM customer_badges
WHERE customer_id = '146d955e-44fe-4e22-8c27-f412b5911c41';

DELETE FROM loyalty_analytics
WHERE customer_id = '146d955e-44fe-4e22-8c27-f412b5911c41';
*/

-- ============================================================================
-- FIX 4: Verify Venue Thresholds Are Set
-- ============================================================================

-- Check Popos thresholds (should be custom: 3000, 5000, 15000)
SELECT 
  id,
  name,
  bronze_threshold,
  silver_threshold,
  gold_threshold
FROM bars
WHERE id = '438c80c1-fe11-4ac5-8a48-2fc45104ba31'; -- Popos

-- Expected: bronze=3000, silver=5000, gold=15000

-- If thresholds are NULL, set them:
/*
UPDATE bars
SET 
  bronze_threshold = 3000,
  silver_threshold = 5000,
  gold_threshold = 15000
WHERE id = '438c80c1-fe11-4ac5-8a48-2fc45104ba31';
*/

-- ============================================================================
-- FIX 5: Verify Venue Discount Settings Exist
-- ============================================================================

-- Check if venue_discount_settings exist for Popos and Bar
SELECT 
  vds.bar_id,
  b.name,
  vds.spend_tiers,
  vds.visit_bonuses
FROM venue_discount_settings vds
LEFT JOIN bars b ON vds.bar_id = b.id
WHERE vds.bar_id IN (
  '438c80c1-fe11-4ac5-8a48-2fc45104ba31', -- Popos
  '94044336-927f-42ec-9d11-2026ed8a1bc9'  -- Bar
);

-- If missing, run the discount settings setup from test-setup-ready.sql

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Query 1: Check no customers have unearned badges
SELECT 
  cb.customer_id,
  cb.badge_level,
  cb.spend_amount_at_venue,
  cb.is_active
FROM customer_badges cb
WHERE cb.is_active = true
AND cb.spend_amount_at_venue < 3000;

-- Expected: 0 rows (no badges with spend < 3000)

-- Query 2: Check no customers have default bronze in loyalty_analytics
SELECT 
  customer_id,
  overall_tier,
  avg_spend_per_visit
FROM loyalty_analytics
WHERE overall_tier = 'bronze'
AND avg_spend_per_visit < 3000;

-- Expected: 0 rows (no bronze tier with spend < 3000)

-- Query 3: Verify badge rank ordering works
SELECT 
  customer_id,
  badge_level,
  badge_rank,
  is_active,
  awarded_at
FROM customer_badges
WHERE is_active = true
ORDER BY badge_rank DESC;

-- Expected: Badges ordered by rank (4, 3, 2, 1)

-- ============================================================================
-- NOTES
-- ============================================================================

-- After running these fixes:
-- 1. Restart your development server
-- 2. Clear browser cache and localStorage
-- 3. Re-test the badge system
-- 4. Check browser console for badge-related logs
-- 5. Verify APIs return correct data

-- If issues persist:
-- 1. Check ISSUES-FOUND.md for detailed diagnostics
-- 2. Test APIs manually with curl commands
-- 3. Check database state with verification queries above
-- 4. Review browser console logs for errors

-- ============================================================================
-- SUCCESS CRITERIA
-- ============================================================================

-- After these fixes, the following should be true:
-- ✅ New customers show NO badge until they spend 3000+
-- ✅ Badge rank ordering works correctly (platinum > gold > silver > bronze)
-- ✅ Venue thresholds are set correctly
-- ✅ Venue discount settings exist
-- ✅ No unearned badges in database

-- ============================================================================
-- ROLLBACK (If needed)
-- ============================================================================

/*
-- Rollback Fix 1: Restore default bronze
ALTER TABLE loyalty_analytics 
ALTER COLUMN loyalty_tier SET DEFAULT 'bronze';

-- Rollback Fix 2: Remove badge rank column
ALTER TABLE customer_badges 
DROP COLUMN IF EXISTS badge_rank;

DROP INDEX IF EXISTS idx_customer_badges_rank;
*/
