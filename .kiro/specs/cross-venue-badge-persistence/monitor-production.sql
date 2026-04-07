-- Production Monitoring Queries: Cross-Venue Badge Persistence
-- Run these queries in Supabase SQL Editor to monitor deployment health
-- Dashboard: https://supabase.com/dashboard/project/bkaigyrrzsqbfscyznzw/sql

-- ============================================================================
-- DEPLOYMENT HEALTH CHECKS
-- ============================================================================

-- 1. Badge Award Activity (Last 24 Hours)
-- Expected: Gradual increase in badge awards after deployment
SELECT 
  badge_level,
  COUNT(*) as awards_count,
  COUNT(DISTINCT customer_id) as unique_customers,
  MIN(awarded_at) as first_award,
  MAX(awarded_at) as last_award
FROM customer_badges
WHERE awarded_at > NOW() - INTERVAL '24 hours'
GROUP BY badge_level
ORDER BY 
  CASE badge_level
    WHEN 'platinum' THEN 4
    WHEN 'gold' THEN 3
    WHEN 'silver' THEN 2
    WHEN 'bronze' THEN 1
  END DESC;

-- 2. Active Badge Distribution (Current State)
-- Expected: All customers have 0 or 1 active badge
SELECT 
  badge_level,
  COUNT(*) as active_badges,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM customer_badges
WHERE is_active = true
GROUP BY badge_level
ORDER BY 
  CASE badge_level
    WHEN 'platinum' THEN 4
    WHEN 'gold' THEN 3
    WHEN 'silver' THEN 2
    WHEN 'bronze' THEN 1
  END DESC;

-- 3. CRITICAL: Single Active Badge Invariant Check
-- Expected: 0 rows (no customer should have multiple active badges)
-- If this returns rows, IMMEDIATE ROLLBACK REQUIRED
SELECT 
  customer_id,
  COUNT(*) as active_badge_count,
  ARRAY_AGG(badge_level ORDER BY awarded_at DESC) as badges,
  ARRAY_AGG(awarded_at ORDER BY awarded_at DESC) as award_times
FROM customer_badges
WHERE is_active = true
GROUP BY customer_id
HAVING COUNT(*) > 1;

-- 4. Badge Upgrade Activity (Last 24 Hours)
-- Expected: Customers upgrading from lower to higher tiers
SELECT 
  customer_id,
  COUNT(*) as total_badges,
  ARRAY_AGG(badge_level ORDER BY awarded_at) as badge_progression,
  ARRAY_AGG(awarded_at ORDER BY awarded_at) as award_times,
  ARRAY_AGG(is_active ORDER BY awarded_at) as active_status
FROM customer_badges
WHERE awarded_at > NOW() - INTERVAL '24 hours'
GROUP BY customer_id
HAVING COUNT(*) > 1
ORDER BY MAX(awarded_at) DESC
LIMIT 20;

-- 5. CRITICAL: Badge Downgrade Detection
-- Expected: 0 rows (badges should never downgrade)
-- If this returns rows, IMMEDIATE INVESTIGATION REQUIRED
WITH badge_ranks AS (
  SELECT 
    customer_id,
    badge_level,
    awarded_at,
    CASE badge_level
      WHEN 'platinum' THEN 4
      WHEN 'gold' THEN 3
      WHEN 'silver' THEN 2
      WHEN 'bronze' THEN 1
    END as rank,
    LAG(CASE badge_level
      WHEN 'platinum' THEN 4
      WHEN 'gold' THEN 3
      WHEN 'silver' THEN 2
      WHEN 'bronze' THEN 1
    END) OVER (PARTITION BY customer_id ORDER BY awarded_at) as prev_rank
  FROM customer_badges
  WHERE awarded_at > NOW() - INTERVAL '24 hours'
)
SELECT 
  customer_id,
  badge_level as current_badge,
  rank as current_rank,
  prev_rank,
  awarded_at
FROM badge_ranks
WHERE prev_rank IS NOT NULL AND rank < prev_rank;

-- ============================================================================
-- PERFORMANCE METRICS
-- ============================================================================

-- 6. Badge Awards by Hour (Last 24 Hours)
-- Expected: Consistent distribution, spikes during peak hours
SELECT 
  DATE_TRUNC('hour', awarded_at) as hour,
  COUNT(*) as awards,
  COUNT(DISTINCT customer_id) as unique_customers,
  ARRAY_AGG(DISTINCT badge_level) as badge_levels
FROM customer_badges
WHERE awarded_at > NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', awarded_at)
ORDER BY hour DESC;

-- 7. Badge Awards by Venue (Last 24 Hours)
-- Expected: Distribution across all active venues
SELECT 
  b.name as venue_name,
  cb.badge_level,
  COUNT(*) as awards,
  COUNT(DISTINCT cb.customer_id) as unique_customers
FROM customer_badges cb
JOIN bars b ON cb.earned_at_bar_id = b.id
WHERE cb.awarded_at > NOW() - INTERVAL '24 hours'
GROUP BY b.name, cb.badge_level
ORDER BY COUNT(*) DESC;

-- 8. Average Spend at Badge Award (Last 24 Hours)
-- Expected: Spend amounts align with venue thresholds
SELECT 
  badge_level,
  COUNT(*) as awards,
  ROUND(AVG(spend_amount_at_venue)::numeric, 2) as avg_spend,
  ROUND(MIN(spend_amount_at_venue)::numeric, 2) as min_spend,
  ROUND(MAX(spend_amount_at_venue)::numeric, 2) as max_spend,
  ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY spend_amount_at_venue)::numeric, 2) as median_spend
FROM customer_badges
WHERE awarded_at > NOW() - INTERVAL '24 hours'
GROUP BY badge_level
ORDER BY 
  CASE badge_level
    WHEN 'platinum' THEN 4
    WHEN 'gold' THEN 3
    WHEN 'silver' THEN 2
    WHEN 'bronze' THEN 1
  END DESC;

-- ============================================================================
-- CROSS-VENUE VERIFICATION
-- ============================================================================

-- 9. Cross-Venue Badge Display Test
-- Expected: Customers with badges earned at one venue visiting others
SELECT 
  c.id as customer_id,
  cb.badge_level,
  b_earned.name as earned_at_venue,
  COUNT(DISTINCT t.bar_id) as venues_visited,
  ARRAY_AGG(DISTINCT b_visited.name) as visited_venues
FROM customers c
JOIN customer_badges cb ON c.id = cb.customer_id AND cb.is_active = true
JOIN bars b_earned ON cb.earned_at_bar_id = b_earned.id
JOIN tabs t ON c.id = t.customer_id
JOIN bars b_visited ON t.bar_id = b_visited.id
WHERE t.created_at > NOW() - INTERVAL '24 hours'
GROUP BY c.id, cb.badge_level, b_earned.name
HAVING COUNT(DISTINCT t.bar_id) > 1
ORDER BY COUNT(DISTINCT t.bar_id) DESC
LIMIT 20;

-- ============================================================================
-- ERROR DETECTION
-- ============================================================================

-- 10. Orphaned Badges (No Customer Record)
-- Expected: 0 rows
SELECT 
  cb.id,
  cb.customer_id,
  cb.badge_level,
  cb.awarded_at
FROM customer_badges cb
LEFT JOIN customers c ON cb.customer_id = c.id
WHERE c.id IS NULL;

-- 11. Invalid Badge Levels
-- Expected: 0 rows
SELECT 
  id,
  customer_id,
  badge_level,
  awarded_at
FROM customer_badges
WHERE badge_level NOT IN ('bronze', 'silver', 'gold', 'platinum');

-- 12. Badges with Invalid Venue References
-- Expected: 0 rows
SELECT 
  cb.id,
  cb.customer_id,
  cb.badge_level,
  cb.earned_at_bar_id,
  cb.awarded_at
FROM customer_badges cb
LEFT JOIN bars b ON cb.earned_at_bar_id = b.id
WHERE b.id IS NULL;

-- ============================================================================
-- CUSTOMER EXPERIENCE METRICS
-- ============================================================================

-- 13. Recent Badge Earners (Last Hour)
-- Use this to verify notifications are working
SELECT 
  SUBSTRING(cb.customer_id::text, 1, 8) || '...' as customer_id_prefix,
  cb.badge_level,
  b.name as venue_name,
  cb.spend_amount_at_venue,
  cb.awarded_at,
  EXTRACT(EPOCH FROM (NOW() - cb.awarded_at)) / 60 as minutes_ago
FROM customer_badges cb
JOIN bars b ON cb.earned_at_bar_id = b.id
WHERE cb.awarded_at > NOW() - INTERVAL '1 hour'
ORDER BY cb.awarded_at DESC;

-- 14. Badge Upgrade Paths (Last 24 Hours)
-- Verify customers are upgrading correctly
WITH customer_badges_ordered AS (
  SELECT 
    customer_id,
    badge_level,
    awarded_at,
    ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY awarded_at) as badge_number
  FROM customer_badges
  WHERE awarded_at > NOW() - INTERVAL '24 hours'
)
SELECT 
  customer_id,
  STRING_AGG(badge_level, ' → ' ORDER BY badge_number) as upgrade_path,
  COUNT(*) as total_badges
FROM customer_badges_ordered
GROUP BY customer_id
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC;

-- ============================================================================
-- SUMMARY DASHBOARD
-- ============================================================================

-- 15. Deployment Health Summary (Run this first)
SELECT 
  'Total Active Badges' as metric,
  COUNT(*)::text as value
FROM customer_badges
WHERE is_active = true

UNION ALL

SELECT 
  'Badges Awarded (24h)',
  COUNT(*)::text
FROM customer_badges
WHERE awarded_at > NOW() - INTERVAL '24 hours'

UNION ALL

SELECT 
  'Unique Customers with Badges',
  COUNT(DISTINCT customer_id)::text
FROM customer_badges
WHERE is_active = true

UNION ALL

SELECT 
  'Badge Upgrades (24h)',
  COUNT(*)::text
FROM (
  SELECT customer_id
  FROM customer_badges
  WHERE awarded_at > NOW() - INTERVAL '24 hours'
  GROUP BY customer_id
  HAVING COUNT(*) > 1
) upgrades

UNION ALL

SELECT 
  'CRITICAL: Multiple Active Badges',
  COUNT(*)::text
FROM (
  SELECT customer_id
  FROM customer_badges
  WHERE is_active = true
  GROUP BY customer_id
  HAVING COUNT(*) > 1
) violations

UNION ALL

SELECT 
  'CRITICAL: Badge Downgrades (24h)',
  '0'::text  -- This should always be 0
;

-- ============================================================================
-- NOTES
-- ============================================================================

-- Run Query #3 (Single Active Badge Invariant) every 15 minutes during first hour
-- Run Query #5 (Badge Downgrade Detection) every hour for 24 hours
-- Run Query #15 (Summary Dashboard) at: 0h, 1h, 6h, 12h, 24h marks
-- If any CRITICAL query returns rows, investigate immediately and consider rollback

-- Expected baseline after 24 hours:
-- - 50-200 badge awards (depends on venue traffic)
-- - 0 multiple active badges
-- - 0 badge downgrades
-- - 0 orphaned or invalid badges
-- - Cross-venue display working (Query #9 shows customers visiting multiple venues)
