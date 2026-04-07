-- Cross-Venue Badge Display Test - Database Setup Script
-- Test ID: 13
-- Purpose: Set up test data for cross-venue badge display testing

-- ============================================================================
-- STEP 1: Create Test Customer
-- ============================================================================

-- Insert test customer (replace with actual customer_id from your test account)
-- This assumes you already have a customer account created via signup flow
-- If not, create one through the app first, then note the customer_id

-- Example customer_id: '12345678-1234-1234-1234-123456789abc'
-- Replace this with your actual test customer_id throughout this script

-- ============================================================================
-- STEP 2: Verify Venues Exist
-- ============================================================================

-- Check if Popos and Kikao exist in bars table
SELECT id, name, bronze_threshold, silver_threshold, gold_threshold
FROM bars
WHERE name IN ('Popos', 'Kikao')
ORDER BY name;

-- Expected: Two rows returned with venue IDs
-- Note the bar_id values for Popos and Kikao

-- If venues don't exist, you'll need to create them or use existing venue IDs

-- ============================================================================
-- STEP 3: Configure Venue Discount Settings
-- ============================================================================

-- Popos discount settings (Silver = 4%, 1x visit = 1.5%)
INSERT INTO venue_discount_settings (bar_id, spend_tiers, visit_bonuses, updated_at)
VALUES (
  '<popos_bar_id>', -- Replace with actual Popos bar_id
  '{"bronze": 2.0, "silver": 4.0, "gold": 6.0}'::jsonb,
  '{"1x": 1.5, "2x": 2.5, "3x": 4.0}'::jsonb,
  NOW()
)
ON CONFLICT (bar_id) 
DO UPDATE SET
  spend_tiers = EXCLUDED.spend_tiers,
  visit_bonuses = EXCLUDED.visit_bonuses,
  updated_at = NOW();

-- Kikao discount settings (Silver = 5%, 1x visit = 2%)
INSERT INTO venue_discount_settings (bar_id, spend_tiers, visit_bonuses, updated_at)
VALUES (
  '<kikao_bar_id>', -- Replace with actual Kikao bar_id
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
  bar_id,
  spend_tiers,
  visit_bonuses
FROM venue_discount_settings
WHERE bar_id IN ('<popos_bar_id>', '<kikao_bar_id>');

-- ============================================================================
-- STEP 4: Clean Up Any Existing Test Data
-- ============================================================================

-- Remove any existing badges for test customer
DELETE FROM customer_badges
WHERE customer_id = '<test_customer_id>';

-- Remove any existing tabs for test customer at both venues
DELETE FROM tab_orders
WHERE tab_id IN (
  SELECT id FROM tabs 
  WHERE customer_id = '<test_customer_id>' 
  AND bar_id IN ('<popos_bar_id>', '<kikao_bar_id>')
);

DELETE FROM tab_payments
WHERE tab_id IN (
  SELECT id FROM tabs 
  WHERE customer_id = '<test_customer_id>' 
  AND bar_id IN ('<popos_bar_id>', '<kikao_bar_id>')
);

DELETE FROM tabs
WHERE customer_id = '<test_customer_id>'
AND bar_id IN ('<popos_bar_id>', '<kikao_bar_id>');

-- ============================================================================
-- STEP 5: Create Initial Tab at Popos (for earning Silver badge)
-- ============================================================================

-- Create tab at Popos
INSERT INTO tabs (
  id,
  customer_id,
  bar_id,
  status,
  identity_mode,
  created_at
)
VALUES (
  gen_random_uuid(),
  '<test_customer_id>',
  '<popos_bar_id>',
  'open',
  'named',
  NOW()
)
RETURNING id;

-- Note the returned tab_id for next steps

-- ============================================================================
-- STEP 6: Simulate Orders at Popos (Total: KES 10,500)
-- ============================================================================

-- You'll need to add actual orders through the app UI
-- Or manually insert orders here (requires product IDs from bar_products table)

-- Example manual order insertion (replace with actual product_id and tab_id):
/*
INSERT INTO tab_orders (
  id,
  tab_id,
  product_id,
  quantity,
  unit_price,
  status,
  created_at
)
VALUES (
  gen_random_uuid(),
  '<tab_id_from_step_5>',
  '<product_id>',
  10,
  1050.00,
  'accepted',
  NOW()
);
*/

-- ============================================================================
-- STEP 7: Simulate Payment at Popos
-- ============================================================================

-- Insert payment record (this would normally be done via M-Pesa callback)
/*
INSERT INTO tab_payments (
  id,
  tab_id,
  amount,
  payment_method,
  status,
  created_at
)
VALUES (
  gen_random_uuid(),
  '<tab_id_from_step_5>',
  10500.00,
  'mpesa',
  'completed',
  NOW()
);
*/

-- Close the tab
/*
UPDATE tabs
SET status = 'closed', closed_at = NOW()
WHERE id = '<tab_id_from_step_5>';
*/

-- ============================================================================
-- STEP 8: Manually Award Silver Badge at Popos
-- ============================================================================

-- This simulates the badge award that would happen after payment
-- In production, this is done via POST /api/loyalty/badge/award

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
  '<test_customer_id>',
  'silver',
  '<popos_bar_id>',
  10500.00,
  true,
  NOW(),
  NOW()
);

-- ============================================================================
-- STEP 9: Verify Setup Complete
-- ============================================================================

-- Check customer has Silver badge
SELECT 
  cb.badge_level,
  cb.awarded_at,
  b.name as earned_at_venue,
  cb.spend_amount_at_venue,
  cb.is_active
FROM customer_badges cb
LEFT JOIN bars b ON cb.earned_at_bar_id = b.id
WHERE cb.customer_id = '<test_customer_id>'
AND cb.is_active = true;

-- Expected: One row with badge_level = 'silver', earned_at_venue = 'Popos'

-- Check visit history at Popos
SELECT 
  t.id,
  t.status,
  t.created_at,
  t.closed_at,
  tb.balance
FROM tabs t
LEFT JOIN tab_balances tb ON t.id = tb.tab_id
WHERE t.customer_id = '<test_customer_id>'
AND t.bar_id = '<popos_bar_id>'
ORDER BY t.created_at DESC;

-- Expected: One closed tab with balance = 10500.00

-- Check no visits at Kikao yet
SELECT COUNT(*) as kikao_visits
FROM tabs
WHERE customer_id = '<test_customer_id>'
AND bar_id = '<kikao_bar_id>';

-- Expected: 0 visits

-- ============================================================================
-- STEP 10: Ready for Cross-Venue Test
-- ============================================================================

-- Setup complete! Now you can:
-- 1. Open the customer app
-- 2. Navigate to /start
-- 3. Select Kikao venue
-- 4. Open a tab
-- 5. Navigate to /menu
-- 6. Verify Silver badge displays with 1 icon
-- 7. Verify 7% discount applied (5% Silver + 2% 1x visit)

-- ============================================================================
-- CLEANUP SCRIPT (Run after test to reset)
-- ============================================================================

/*
-- Remove test badge
DELETE FROM customer_badges
WHERE customer_id = '<test_customer_id>';

-- Remove test tabs
DELETE FROM tab_orders
WHERE tab_id IN (
  SELECT id FROM tabs WHERE customer_id = '<test_customer_id>'
);

DELETE FROM tab_payments
WHERE tab_id IN (
  SELECT id FROM tabs WHERE customer_id = '<test_customer_id>'
);

DELETE FROM tabs
WHERE customer_id = '<test_customer_id>';
*/

-- ============================================================================
-- NOTES
-- ============================================================================

-- 1. Replace all '<test_customer_id>' with your actual customer UUID
-- 2. Replace all '<popos_bar_id>' with actual Popos venue UUID
-- 3. Replace all '<kikao_bar_id>' with actual Kikao venue UUID
-- 4. Run each section sequentially, noting returned IDs
-- 5. For production testing, use the app UI for orders/payments instead of manual SQL
-- 6. This script is for development/staging environments only
