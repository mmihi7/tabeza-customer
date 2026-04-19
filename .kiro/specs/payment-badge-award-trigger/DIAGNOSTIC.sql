-- Diagnostic Queries for Badge Not Appearing Issue
-- Run these in Supabase SQL Editor to diagnose the problem

-- 1. Check the payment that should have triggered the badge
SELECT 
  id,
  tab_id,
  amount,
  method,
  status,
  created_at,
  updated_at
FROM tab_payments
WHERE id = 'f30e2df8-adac-4863-a56c-50072069b466';

-- Expected: status should be 'success' or 'completed'
-- If status is something else, that's why the badge wasn't awarded

-- 2. Check the tab details
SELECT 
  id,
  customer_id,
  bar_id,
  status,
  opened_at,
  closed_at
FROM tabs
WHERE id = '0b4d72c6-9cbc-4e66-9d90-0c4358818f38';

-- 3. Check if customer has any badges
SELECT 
  id,
  customer_id,
  badge_level,
  earned_at_bar_id,
  spend_amount_at_venue,
  is_active,
  awarded_at
FROM customer_badges
WHERE customer_id = (
  SELECT customer_id 
  FROM tabs 
  WHERE id = '0b4d72c6-9cbc-4e66-9d90-0c4358818f38'
);

-- Expected: Should have a Bronze badge with is_active = true
-- If no badge exists, the award logic didn't run

-- 4. Check customer's total spend at this venue
SELECT 
  t.customer_id,
  t.bar_id,
  COUNT(DISTINCT t.id) as total_tabs,
  SUM(p.amount::numeric) as total_spend,
  AVG(p.amount::numeric) as average_spend_per_payment
FROM tabs t
LEFT JOIN tab_payments p ON p.tab_id = t.id AND p.status IN ('success', 'completed')
WHERE t.id = '0b4d72c6-9cbc-4e66-9d90-0c4358818f38'
GROUP BY t.customer_id, t.bar_id;

-- Expected: total_spend should be >= 3000 for Bronze badge

-- 5. Check venue thresholds
SELECT 
  id,
  name,
  bronze_threshold,
  silver_threshold,
  gold_threshold
FROM bars
WHERE id = (
  SELECT bar_id 
  FROM tabs 
  WHERE id = '0b4d72c6-9cbc-4e66-9d90-0c4358818f38'
);

-- Expected: bronze_threshold should be 3000 or NULL (defaults to 3000)

-- 6. Check if visits API would return correct data
WITH customer_data AS (
  SELECT customer_id, bar_id
  FROM tabs
  WHERE id = '0b4d72c6-9cbc-4e66-9d90-0c4358818f38'
),
completed_tabs AS (
  SELECT t.id, t.closed_at
  FROM tabs t
  INNER JOIN customer_data cd ON t.customer_id = cd.customer_id AND t.bar_id = cd.bar_id
  WHERE t.closed_at IS NOT NULL
),
completed_payments AS (
  SELECT SUM(p.amount::numeric) as total_spend
  FROM tab_payments p
  INNER JOIN completed_tabs ct ON p.tab_id = ct.id
  WHERE p.status = 'completed'
),
open_tab AS (
  SELECT t.id
  FROM tabs t
  INNER JOIN customer_data cd ON t.customer_id = cd.customer_id AND t.bar_id = cd.bar_id
  WHERE t.closed_at IS NULL
  LIMIT 1
),
open_tab_payments AS (
  SELECT SUM(p.amount::numeric) as open_spend
  FROM tab_payments p
  INNER JOIN open_tab ot ON p.tab_id = ot.id
  WHERE p.status = 'completed'
)
SELECT 
  (SELECT COUNT(*) FROM completed_tabs) as completed_visits,
  COALESCE((SELECT total_spend FROM completed_payments), 0) as completed_spend,
  COALESCE((SELECT open_spend FROM open_tab_payments), 0) as open_tab_spend,
  CASE 
    WHEN (SELECT COUNT(*) FROM completed_tabs) > 0 
    THEN (COALESCE((SELECT total_spend FROM completed_payments), 0) + COALESCE((SELECT open_spend FROM open_tab_payments), 0)) / 
         ((SELECT COUNT(*) FROM completed_tabs) + CASE WHEN COALESCE((SELECT open_spend FROM open_tab_payments), 0) > 0 THEN 1 ELSE 0 END)
    ELSE COALESCE((SELECT open_spend FROM open_tab_payments), 0)
  END as average_spend;

-- Expected: average_spend should be >= 3000 for Bronze badge
-- If average_spend < 3000, the customer doesn't qualify yet

-- NEXT STEPS BASED ON RESULTS:
-- If payment status is NOT 'success' or 'completed' → Payment status mismatch issue
-- If no badge exists in customer_badges → Badge award logic didn't run
-- If average_spend < 3000 → Customer doesn't qualify yet (need more spend)
-- If tab is still open (closed_at IS NULL) → May need to wait for tab to close OR our fix to include open tab payments
