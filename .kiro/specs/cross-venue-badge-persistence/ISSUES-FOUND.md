# Cross-Venue Badge Persistence - Issues Found During Testing

**Date**: 2026-04-07  
**Test ID**: 13  
**Status**: ❌ FAILED - Multiple Issues Identified

---

## 🐛 Issues Identified

### Issue 1: Customer Shows Bronze Badge Before Ordering
**Severity**: HIGH  
**Status**: ❌ BLOCKING

**Problem**:
- Customer shows bronze badge immediately upon opening tab
- No orders or spending has occurred yet
- Badge appears before any qualification

**Root Cause**:
The old `loyalty_analytics` table has a DEFAULT value:
```sql
loyalty_tier TEXT NOT NULL DEFAULT 'bronze'
```

This creates a bronze record automatically when a customer first visits, even with zero spend.

**Impact**:
- Breaks the new badge system logic
- Customers get unearned badges
- Confuses the tier upgrade detection

**Fix Required**:
1. Remove DEFAULT 'bronze' from `loyalty_analytics` table
2. OR: Ignore `loyalty_analytics` table entirely in new badge system
3. Only use `customer_badges` table for badge display
4. Ensure no badge shows until customer meets threshold

**SQL Fix**:
```sql
-- Remove default bronze tier
ALTER TABLE loyalty_analytics 
ALTER COLUMN loyalty_tier DROP DEFAULT;

-- Update existing records with zero spend to NULL
UPDATE loyalty_analytics 
SET loyalty_tier = NULL 
WHERE total_spent < 3000;
```

---

### Issue 2: No Tier Upgrade When Spending 3000+ or 8000+
**Severity**: HIGH  
**Status**: ❌ BLOCKING

**Problem**:
- Customer spends KES 3,000+ (bronze threshold)
- Customer spends KES 8,000+ (should trigger silver at 5,000 threshold for Popos)
- No badge upgrade occurs
- No notification shown

**Possible Root Causes**:

#### A. Payment Completion Not Triggering Badge Recalculation
The `loadLoyaltyData()` function should be called after payment, but:
- Payment section was removed from customer app
- No payment realtime subscription exists
- Badge recalculation never triggers

**Check**:
```typescript
// In menu page, search for payment realtime subscription
// Should have something like:
useEffect(() => {
  if (!tab?.id) return;
  
  const channel = supabase
    .channel(`tab-payments-${tab.id}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'tab_payments',
      filter: `tab_id=eq.${tab.id}`
    }, (payload) => {
      console.log('💳 Payment received, recalculating badge');
      loadLoyaltyData(); // THIS SHOULD TRIGGER
    })
    .subscribe();
    
  return () => { supabase.removeChannel(channel); };
}, [tab?.id]);
```

#### B. Badge Award API Not Being Called
The logic in `loadLoyaltyData()` compares earned tier vs global badge:
```typescript
if (earnedSpendTier && earnedTierRank > currentBadgeRank) {
  // Call /api/loyalty/badge/award
}
```

**Debug Steps**:
1. Check browser console for "🎉 Badge upgrade detected" log
2. Check if API call is made to `/api/loyalty/badge/award`
3. Check API response - is `upgraded: true`?
4. Check database - is new badge inserted?

#### C. Average Spend Calculation Incorrect
The visits API returns `averageSpend` which is used for tier calculation:
```typescript
const averageSpend: number = visitsData.averageSpend ?? 0;
```

**Check**:
```bash
# Test the visits API
curl "http://localhost:3002/api/loyalty/visits/<customer_id>?bar_id=<bar_id>"

# Expected response:
{
  "completedVisits": 1,
  "averageSpend": 8500,  # Should be >= 5000 for silver
  "weeklyVisits": 1
}
```

#### D. Venue Thresholds Not Loaded Correctly
Popos has custom thresholds:
- Bronze: 3,000
- Silver: 5,000 (lower than system default 10,000)
- Gold: 15,000

**Check**:
```bash
# Test venue discounts API
curl "http://localhost:3002/api/loyalty/venue-discounts/<popos_bar_id>"

# Should return Popos thresholds from bars table
```

---

### Issue 3: Staff Customer Tab Card Shows Different Icons
**Severity**: MEDIUM  
**Status**: ❌ INCONSISTENT

**Problem**:
- Customer app shows one badge icon
- Staff app shows different badge icon for same customer
- Icons don't match between apps

**Root Cause**:
Staff app and customer app use different badge display logic:
- Customer app: Uses `globalBadge` from `customer_badges` table
- Staff app: Might be using old `loyalty_analytics` table

**Fix Required**:
1. Update staff app to use same `customer_badges` table
2. Ensure both apps call same API: `GET /api/loyalty/badge/[customer_id]`
3. Use same icon mapping logic in both apps

**Icon Mapping (Should Be Consistent)**:
```typescript
const IconComponent = badgeLevel === 'platinum'
  ? Crown
  : badgeLevel === 'gold'
  ? Crown
  : badgeLevel === 'silver'
  ? Shield
  : badgeLevel === 'bronze'
  ? Circle
  : null;
```

---

### Issue 4: Payment Section Missing in Customer App
**Severity**: HIGH  
**Status**: ❌ BLOCKING TEST

**Problem**:
- Payment section was removed from customer app
- Cannot complete payment to trigger badge upgrade
- Cannot test full flow: order → payment → badge upgrade

**Impact on Testing**:
- Cannot test badge upgrade after payment
- Cannot verify notification shows
- Cannot test cross-venue display after earning badge

**Workaround for Testing**:
1. Manually insert payment via SQL:
```sql
INSERT INTO tab_payments (
  id, tab_id, amount, payment_method, status, created_at
)
VALUES (
  gen_random_uuid(),
  '<tab_id>',
  8500.00,
  'mpesa',
  'completed',
  NOW()
);
```

2. Manually trigger badge award via API:
```bash
curl -X POST http://localhost:3002/api/loyalty/badge/award \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "<customer_id>",
    "bar_id": "<bar_id>",
    "badge_level": "silver",
    "spend_amount": 8500
  }'
```

3. Refresh menu page to see updated badge

**Long-term Fix**:
- Re-implement payment section in customer app
- OR: Provide alternative way to trigger badge recalculation
- OR: Add manual "Refresh Badge" button for testing

---

## 🔍 Diagnostic Steps

### Step 1: Check Current Badge State
```sql
-- Check customer_badges table
SELECT * FROM customer_badges 
WHERE customer_id = '<test_customer_id>';

-- Check loyalty_analytics table (old system)
SELECT * FROM loyalty_analytics 
WHERE user_id = '<test_customer_id>';
```

### Step 2: Check Tab and Orders
```sql
-- Check tab status
SELECT id, status, customer_id, bar_id 
FROM tabs 
WHERE customer_id = '<test_customer_id>' 
ORDER BY created_at DESC 
LIMIT 1;

-- Check orders on tab
SELECT id, tab_id, product_id, quantity, unit_price, status 
FROM tab_orders 
WHERE tab_id = '<tab_id>';

-- Check payments on tab
SELECT id, tab_id, amount, payment_method, status 
FROM tab_payments 
WHERE tab_id = '<tab_id>';
```

### Step 3: Test APIs Manually
```bash
# 1. Test badge lookup
curl http://localhost:3002/api/loyalty/badge/<customer_id>

# 2. Test visits data
curl "http://localhost:3002/api/loyalty/visits/<customer_id>?bar_id=<bar_id>"

# 3. Test venue discounts
curl http://localhost:3002/api/loyalty/venue-discounts/<bar_id>

# 4. Test badge award (manual trigger)
curl -X POST http://localhost:3002/api/loyalty/badge/award \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "<customer_id>",
    "bar_id": "<bar_id>",
    "badge_level": "silver",
    "spend_amount": 8500
  }'
```

### Step 4: Check Browser Console
Open DevTools → Console and look for:
- `🏆 Global badge loaded:` - Badge fetch successful
- `🎉 Badge upgrade detected:` - Upgrade logic triggered
- `✅ Badge upgrade successful:` - API call succeeded
- `❌ Badge award API failed:` - API call failed
- `💳 Using global badge for discount:` - Badge applied to pricing

---

## 🛠️ Recommended Fixes

### Priority 1: Fix Default Bronze Issue
```sql
-- Migration: Remove default bronze tier
ALTER TABLE loyalty_analytics 
ALTER COLUMN loyalty_tier DROP DEFAULT;

-- Clean up existing unearned bronze tiers
UPDATE loyalty_analytics 
SET loyalty_tier = NULL 
WHERE total_spent < 3000;
```

### Priority 2: Fix Badge Upgrade Detection
**Option A**: Re-implement payment section in customer app

**Option B**: Add payment realtime subscription:
```typescript
// In menu page, add this useEffect
useEffect(() => {
  if (!tab?.id) return;
  
  const channel = supabase
    .channel(`tab-payments-${tab.id}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'tab_payments',
      filter: `tab_id=eq.${tab.id}`
    }, (payload) => {
      console.log('💳 Payment received, recalculating badge');
      loadLoyaltyData();
    })
    .subscribe();
    
  return () => { supabase.removeChannel(channel); };
}, [tab?.id]);
```

**Option C**: Add manual refresh button:
```typescript
<button onClick={() => loadLoyaltyData()}>
  Refresh Badge Status
</button>
```

### Priority 3: Fix Badge Lookup API Ordering
The current ORDER BY uses text ordering which is incorrect:
```typescript
// WRONG: Text ordering (bronze > gold > platinum > silver)
.order('badge_level', { ascending: false })

// CORRECT: Use CASE statement for proper ranking
.order('badge_rank', { ascending: false })
```

**Fix**:
```typescript
// In app/api/loyalty/badge/[customer_id]/route.ts
const { data, error } = await supabase
  .from('customer_badges')
  .select(`
    badge_level,
    awarded_at,
    earned_at_bar_id,
    spend_amount_at_venue,
    bars:earned_at_bar_id (name)
  `)
  .eq('customer_id', customer_id)
  .eq('is_active', true)
  .limit(1)
  .maybeSingle();

// Then sort in JavaScript
if (data) {
  const BADGE_RANK = { bronze: 1, silver: 2, gold: 3, platinum: 4 };
  // If multiple badges, sort by rank
  // (Currently only returns 1 due to LIMIT 1, but good practice)
}
```

OR add a computed column to the database:
```sql
ALTER TABLE customer_badges 
ADD COLUMN badge_rank INTEGER GENERATED ALWAYS AS (
  CASE badge_level
    WHEN 'bronze' THEN 1
    WHEN 'silver' THEN 2
    WHEN 'gold' THEN 3
    WHEN 'platinum' THEN 4
    ELSE 0
  END
) STORED;

CREATE INDEX idx_customer_badges_rank ON customer_badges(customer_id, badge_rank DESC) WHERE is_active = true;
```

### Priority 4: Sync Staff and Customer Badge Display
Update staff app to use same badge API and icon mapping:
```typescript
// In staff app, replace loyalty_analytics query with:
const badgeResponse = await fetch(`/api/loyalty/badge/${customer_id}`);
const badgeData = await badgeResponse.json();

// Use same icon mapping as customer app
const IconComponent = badgeData.badge_level === 'platinum'
  ? Crown
  : badgeData.badge_level === 'gold'
  ? Crown
  : badgeData.badge_level === 'silver'
  ? Shield
  : badgeData.badge_level === 'bronze'
  ? Circle
  : null;
```

---

## 📋 Test Status

| Test Criteria | Status | Notes |
|---------------|--------|-------|
| No badge before spending | ❌ FAIL | Shows bronze immediately |
| Bronze at 3,000 KES | ❌ FAIL | No upgrade triggered |
| Silver at 5,000 KES (Popos) | ❌ FAIL | No upgrade triggered |
| Cross-venue display | ⏸️ BLOCKED | Cannot test without badge |
| Staff/customer icon match | ❌ FAIL | Different icons shown |
| Notification on upgrade | ⏸️ BLOCKED | No upgrade occurring |
| Discount application | ⏸️ BLOCKED | Cannot verify without badge |

---

## 🎯 Next Steps

1. **Immediate**: Fix default bronze issue in `loyalty_analytics` table
2. **Immediate**: Add payment realtime subscription OR manual refresh button
3. **Short-term**: Fix badge lookup API ordering
4. **Short-term**: Sync staff and customer badge display
5. **Long-term**: Deprecate `loyalty_analytics` table entirely
6. **Long-term**: Re-implement payment section in customer app

---

## 📞 Support

For questions or assistance:
1. Review this document
2. Check browser console logs
3. Test APIs manually with curl
4. Check database state with SQL queries
5. Review `test-cross-venue-badge.md` for expected behavior

---

**Document Created**: 2026-04-07  
**Last Updated**: 2026-04-07  
**Status**: Issues Documented - Fixes Required
