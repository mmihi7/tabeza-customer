-- Cross-Venue Badge Display Test - READY TO USE Setup Script
-- Test ID: 13
-- Purpose: Set up test data for cross-venue badge display testing
-- 
-- ACTUAL IDs FROM YOUR SYSTEM:
-- Customer: 146d955e-44fe-4e22-8c27-f412b5911c41 (or choose another from list)
-- Popos: 438c80c1-fe11-4ac5-8a48-2fc45104ba31
-- Bar (second venue): 94044336-927f-42ec-9d11-2026ed8a1bc9

-- ============================================================================
-- CONFIGURATION - Choose your test customer
-- ============================================================================

-- Available test customers from your system:
-- 1. 146d955e-44fe-4e22-8c27-f412b5911c41 (first_visit: 2026-04-03)
-- 2. 59a655d1-4e14-4601-b461-239cdb795526 (first_visit: 2026-03-29)
-- 3. 65e49d6d-43b1-434d-be03-dfe6585db18b (first_visit: 2026-04-02)
-- 4. 67025251-0e42-4339-9125-c094d726e489 (first_visit: 2026-04-03)

-- Choose one customer ID for testing:
DO $$
DECLARE
  test_customer_id UUID := '146d955e-44fe-4e22-8c27-f412b5911c41'; -- CHANGE THIS IF NEEDED
  popos_bar_id UUID := '438c80c1-fe11-4ac5-8a48-2fc45104ba31';
  bar_venue_id UUID := '94044336-927f-42ec-9d11-2026ed8a1bc9';
BEGIN
  RAISE NOTICE 'Test Configuration:';
  RAISE NOTICE '  Customer ID: %', test_customer_id;
  RAISE NOTICE '  Popos ID: %', popos_bar_id;
  RAISE NOTICE '  Bar ID: %', bar_venue_id;
END $$;

-- ============================================================================
-- STEP 1: Verify Venues Exist
-- ============================================================================

SELECT 
  id, 
  name, 
  bronze_threshold, 
  silver_threshold, 
  gold_threshold
FROM bars
WHERE id IN (
  '438c80c1-fe11-4ac5-8a48-2fc45104ba31', -- Popos
  '94044336-927f-42ec-9d11-2026ed8a1bc9'  -- Bar
)
ORDER BY name;

-- Expected output:
-- Popos: bronze=3000, silver=5000, gold=15000
-- Bar: bronze=3000, silver=5000, gold=15000

-- ============================================================================
-- STEP 2: Configure Venue Discount Settings
-- ============================================================================

-- Popos discount settings (Silver = 4%, 1x visit = 1.5%)
INSERT INTO venue_discount_settings (bar_id, spend_tiers, visit_bonuses, updated_at)
VALUES (
  '438c80c1-fe11-4ac5-8a48-2fc45104ba31', -- Popos
  '{"bronze": 2.0, "silver": 4.0, "gold": 6.0}'::jsonb,
  '{"1x": 1.5, "2x": 2.5, "3x": 4.0}'::jsonb,
  NOW()
)
ON CONFLICT (bar_id) 
DO UPDATE SET
  spend_tiers = EXCLUDED.spend_tiers,
  visit_bonuses = EXCLUDED.visit_bonuses,
  updated_at = NOW();

-- Bar discount settings (Silver = 5%, 1x visit = 2%)
INSERT INTO venue_discount_settings (bar_id, spend_tiers, visit_bonuses, updated_at)
VALUES (
  '94044336-927f-42ec-9d11-2026ed8a1bc9', -- Bar
  '{"bronze": 2.5, "silver": 5.0, "gold": 7.0}'::jsonb,
  '{"1x": 2.0, "2x": 3.0, "3x": 5.0}'::jsonb,
  NOW()
)
ON CONFLICT (bar_id) 
DO UPDATE SET
  spend_tiers = EXCLUDED.spend_tiers,
  visit_bonuses = EXCLUDED.visit_bonuses,
  updated_at = NOW();

-- Verify discount settings
SELECT 
  b.name as venue_name,
  vds.spend_tiers,
  vds.visit_bonuses
FROM venue_discount_settings vds
LEFT JOIN bars b ON vds.bar_id = b.id
WHERE vds.bar_id IN (
  '438c80c1-fe11-4ac5-8a48-2fc45104ba31',
  '94044336-927f-42ec-9d11-2026ed8a1bc9'
);

-- ============================================================================
-- STEP 3: Clean Up Any Existing Test Data
-- ============================================================================

-- IMPORTANT: Change the customer_id below to match your chosen test customer
DO $$
DECLARE
  test_customer_id UUID := '146d955e-44fe-4e22-8c27-f412b5911c41'; -- CHANGE THIS IF NEEDED
BEGIN
  -- Remove any existing badges for test customer
  DELETE FROM customer_badges
  WHERE customer_id = test_customer_id;
  
  RAISE NOTICE 'Cleaned up existing badges for customer %', test_customer_id;
  
  -- Remove any existing tabs for test customer at both venues
  DELETE FROM tab_orders
  WHERE tab_id IN (
    SELECT id FROM tabs 
    WHERE customer_id = test_customer_id 
    AND bar_id IN (
      '438c80c1-fe11-4ac5-8a48-2fc45104ba31',
      '94044336-927f-42ec-9d11-2026ed8a1bc9'
    )
  );
  
  DELETE FROM tab_payments
  WHERE tab_id IN (
    SELECT id FROM tabs 
    WHERE customer_id = test_customer_id 
    AND bar_id IN (
      '438c80c1-fe11-4ac5-8a48-2fc45104ba31',
      '94044336-927f-42ec-9d11-2026ed8a1bc9'
    )
  );
  
  DELETE FROM tabs
  WHERE customer_id = test_customer_id
  AND bar_id IN (
    '438c80c1-fe11-4ac5-8a48-2fc45104ba31',
    '94044336-927f-42ec-9d11-2026ed8a1bc9'
  );
  
  RAISE NOTICE 'Cleaned up existing tabs for customer %', test_customer_id;
END $$;

-- ============================================================================
-- STEP 4: Award Silver Badge at Popos
-- ============================================================================

-- This simulates earning a Silver badge at Popos
-- In production, this happens automatically after payment via API

DO $$
DECLARE
  test_customer_id UUID := '146d955e-44fe-4e22-8c27-f412b5911c41'; -- CHANGE THIS IF NEEDED
  popos_bar_id UUID := '438c80c1-fe11-4ac5-8a48-2fc45104ba31';
  new_badge_id UUID;
BEGIN
  INSERT INTO customer_badges (
    id,
    customer_id,
    badge_level,
    earned_at_bar_id,
    spend_amount_at_venue,
    is_active,
    awarded_at,
    created_at
  )
  VALUES (
    gen_random_uuid(),
    test_customer_id,
    'silver',
    popos_bar_id,
    10500.00,
    true,
    NOW(),
    NOW()
  )
  RETURNING id INTO new_badge_id;
  
  RAISE NOTICE 'Created Silver badge % for customer % at Popos', new_badge_id, test_customer_id;
END $$;

-- ============================================================================
-- STEP 5: Verify Setup Complete
-- ============================================================================

-- Check customer has Silver badge
SELECT 
  cb.id as badge_id,
  cb.customer_id,
  cb.badge_level,
  cb.awarded_at,
  b.name as earned_at_venue,
  cb.spend_amount_at_venue,
  cb.is_active
FROM customer_badges cb
LEFT JOIN bars b ON cb.earned_at_bar_id = b.id
WHERE cb.customer_id = '146d955e-44fe-4e22-8c27-f412b5911c41' -- CHANGE THIS IF NEEDED
AND cb.is_active = true;

-- Expected: One row with badge_level = 'silver', earned_at_venue = 'Popos'

-- Check no visits at Bar venue yet
SELECT COUNT(*) as bar_visits
FROM tabs
WHERE customer_id = '146d955e-44fe-4e22-8c27-f412b5911c41' -- CHANGE THIS IF NEEDED
AND bar_id = '94044336-927f-42ec-9d11-2026ed8a1bc9';

-- Expected: 0 visits

-- ============================================================================
-- STEP 6: Test Summary
-- ============================================================================

-- Simple verification without DO block
SELECT 
  '========================================' as message
UNION ALL
SELECT 'Setup Complete!' as message
UNION ALL
SELECT '========================================' as message
UNION ALL
SELECT 'Customer ID: 146d955e-44fe-4e22-8c27-f412b5911c41' as message
UNION ALL
SELECT CONCAT('Active Badges: ', COUNT(*)::text) as message
FROM customer_badges
WHERE customer_id = '146d955e-44fe-4e22-8c27-f412b5911c41'
AND is_active = true
UNION ALL
SELECT CONCAT('Badge Level: ', COALESCE(MAX(badge_level), 'none')::text) as message
FROM customer_badges
WHERE customer_id = '146d955e-44fe-4e22-8c27-f412b5911c41'
AND is_active = true
UNION ALL
SELECT '' as message
UNION ALL
SELECT 'Next Steps:' as message
UNION ALL
SELECT '1. Open customer app at http://localhost:3002' as message
UNION ALL
SELECT '2. Log in as customer: 146d955e-44fe-4e22-8c27-f412b5911c41' as message
UNION ALL
SELECT '3. Navigate to /start' as message
UNION ALL
SELECT '4. Select "Bar" venue (NOT Popos)' as message
UNION ALL
SELECT '5. Open a tab' as message
UNION ALL
SELECT '6. Navigate to /menu' as message
UNION ALL
SELECT '7. Verify Silver badge displays with 1 icon' as message
UNION ALL
SELECT '8. Verify 7% discount (5% Silver + 2% 1x visit)' as message
UNION ALL
SELECT '========================================' as message;

-- ============================================================================
-- QUICK VERIFICATION QUERIES
-- ============================================================================

-- Query 1: Check badge API response (simulate GET /api/loyalty/badge/[customer_id])
SELECT 
  cb.badge_level,
  cb.awarded_at,
  cb.earned_at_bar_id,
  b.name as earned_at_bar_name,
  cb.spend_amount_at_venue
FROM customer_badges cb
LEFT JOIN bars b ON cb.earned_at_bar_id = b.id
WHERE cb.customer_id = '146d955e-44fe-4e22-8c27-f412b5911c41' -- CHANGE THIS IF NEEDED
AND cb.is_active = true
ORDER BY 
  CASE cb.badge_level 
    WHEN 'platinum' THEN 4 
    WHEN 'gold' THEN 3 
    WHEN 'silver' THEN 2 
    WHEN 'bronze' THEN 1 
  END DESC
LIMIT 1;

-- Expected: badge_level='silver', earned_at_bar_name='Popos'

-- Query 2: Check visit data at Bar venue (simulate GET /api/loyalty/visits/[customer_id]?bar_id=...)
SELECT 
  COUNT(CASE WHEN t.status = 'closed' THEN 1 END) as completed_visits,
  COALESCE(AVG(CASE WHEN t.status = 'closed' THEN tb.balance END), 0) as average_spend,
  COUNT(CASE 
    WHEN t.created_at >= NOW() - INTERVAL '7 days' 
    AND t.status = 'closed' 
    THEN 1 
  END) as weekly_visits
FROM tabs t
LEFT JOIN tab_balances tb ON t.id = tb.tab_id
WHERE t.customer_id = '146d955e-44fe-4e22-8c27-f412b5911c41' -- CHANGE THIS IF NEEDED
AND t.bar_id = '94044336-927f-42ec-9d11-2026ed8a1bc9'; -- Bar venue

-- Expected: completed_visits=0, average_spend=0, weekly_visits=0

-- Query 3: Check discount settings at Bar venue
SELECT 
  spend_tiers->>'silver' as silver_discount_pct,
  visit_bonuses->>'1x' as one_visit_bonus_pct
FROM venue_discount_settings
WHERE bar_id = '94044336-927f-42ec-9d11-2026ed8a1bc9';

-- Expected: silver_discount_pct='5.0', one_visit_bonus_pct='2.0'

-- ============================================================================
-- CLEANUP SCRIPT (Run after test to reset)
-- ============================================================================

/*
-- Uncomment and run this block to clean up after testing

DO $$
DECLARE
  test_customer_id UUID := '146d955e-44fe-4e22-8c27-f412b5911c41'; -- CHANGE THIS IF NEEDED
BEGIN
  -- Remove test badge
  DELETE FROM customer_badges
  WHERE customer_id = test_customer_id;
  
  -- Remove test tabs
  DELETE FROM tab_orders
  WHERE tab_id IN (
    SELECT id FROM tabs WHERE customer_id = test_customer_id
  );
  
  DELETE FROM tab_payments
  WHERE tab_id IN (
    SELECT id FROM tabs WHERE customer_id = test_customer_id
  );
  
  DELETE FROM tabs
  WHERE customer_id = test_customer_id;
  
  RAISE NOTICE 'Cleanup complete for customer %', test_customer_id;
END $$;
*/

-- ============================================================================
-- NOTES
-- ============================================================================

-- 1. This script uses ACTUAL IDs from your system
-- 2. Default test customer: 146d955e-44fe-4e22-8c27-f412b5911c41
-- 3. Popos venue: 438c80c1-fe11-4ac5-8a48-2fc45104ba31
-- 4. Bar venue: 94044336-927f-42ec-9d11-2026ed8a1bc9
-- 5. Change test_customer_id in each DO block if using different customer
-- 6. Run in Supabase SQL Editor
-- 7. Check RAISE NOTICE output for confirmation messages
