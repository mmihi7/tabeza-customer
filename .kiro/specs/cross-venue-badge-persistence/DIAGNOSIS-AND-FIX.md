# Cross-Venue Badge System - Diagnosis and Fix Guide

**Date**: 2026-04-07  
**Status**: 🔍 Investigating Issues

---

## 🎯 Core Problem

The badge system is not working as expected. Let's diagnose step by step.

---

## 📊 Current System Architecture

### Tables Involved:
1. **`customer_badges`** (NEW) - Persistent badge storage
   - Columns: `id`, `customer_id`, `badge_level`, `earned_at_bar_id`, `spend_amount_at_venue`, `is_active`, `awarded_at`
   - Purpose: Store permanent badges earned by customers

2. **`loyalty_analytics`** (OLD) - Analytics table
   - Columns: `customer_id`, `bar_id`, `visit_tier`, `spend_tier`, `overall_tier`, etc.
   - Purpose: Analytics and insights (NOT used for badge display in customer app)

3. **`tabs`** - Customer tabs
4. **`tab_orders`** - Orders on tabs
5. **`tab_payments`** - Payments on tabs

### Badge Flow:
```
Customer opens tab
  ↓
Orders items (staff accepts)
  ↓
Payment completed (HOW? Payment section removed!)
  ↓
loadLoyaltyData() called
  ↓
Fetch visits data → Calculate average spend
  ↓
Compare vs thresholds → Determine earned tier
  ↓
Compare vs global badge → Detect upgrade
  ↓
Call /api/loyalty/badge/award → Store in customer_badges
  ↓
Show notification + update UI
```

---

## 🐛 Issue 1: Customer Shows Bronze Before Ordering

### Diagnosis Steps:

**Step 1: Check if badge exists in database**
```sql
SELECT * FROM customer_badges 
WHERE customer_id = '146d955e-44fe-4e22-8c27-f412b5911c41';
```

**Possible Results:**
- **No rows**: Badge is coming from somewhere else (frontend default?)
- **Has bronze badge**: Check `spend_amount_at_venue` - should be >= 3000
- **Has badge with low spend**: Badge was created incorrectly

**Step 2: Check loyalty_analytics table**
```sql
SELECT * FROM loyalty_analytics 
WHERE customer_id = '146d955e-44fe-4e22-8c27-f412b5911c41';
```

**Step 3: Check browser console**
Open DevTools → Console and look for:
- `🏆 Global badge loaded:` - What badge_level is shown?
- `🏆 No global badge found` - Is this message appearing?

**Step 4: Check API response**
```bash
curl http://localhost:3002/api/loyalty/badge/146d955e-44fe-4e22-8c27-f412b5911c41
```

Expected if no badge:
```json
{
  "badge_level": null
}
```

### Possible Causes:

#### A. Test Setup Script Created Bronze Badge
The `test-setup-ready.sql` script creates a Silver badge. If you ran it, check:
```sql
SELECT * FROM customer_badges 
WHERE customer_id = '146d955e-44fe-4e22-8c27-f412b5911c41'
ORDER BY awarded_at DESC;
```

**Fix**: Delete test badges
```sql
DELETE FROM customer_badges
WHERE customer_id = '146d955e-44fe-4e22-8c27-f412b5911c41';
```

#### B. Frontend Shows Default Badge
Check `renderLoyaltyIcons()` function - does it show a badge when `globalBadge` is null?

Current code:
```typescript
if (!globalBadge && (!loyaltyData || loyaltyData.visitTier === 'new')) return null;
```

This should return null (no badge) if no globalBadge exists.

#### C. Old Loyalty System Still Active
Check if staff app or another system is creating badges in `loyalty_analytics` table.

---

## 🐛 Issue 2: No Tier Upgrade When Spending

### Root Cause: Payment Section Removed

The badge upgrade flow requires:
1. Payment completed
2. `loadLoyaltyData()` called
3. Badge upgrade detected
4. Badge award API called

**Problem**: Without payment section, step 1 never happens!

### Solutions:

#### Solution A: Add Payment Realtime Subscription (RECOMMENDED)

Add this to `menu/page.tsx`:

```typescript
// Add after other useEffect hooks
useEffect(() => {
  if (!tab?.id) return;
  
  console.log('💳 Setting up payment subscription for tab:', tab.id);
  
  const channel = supabase
    .channel(`tab-payments-${tab.id}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'tab_payments',
      filter: `tab_id=eq.${tab.id}`
    }, (payload) => {
      console.log('💳 Payment received:', payload);
      console.log('🔄 Recalculating badge...');
      loadLoyaltyData();
    })
    .subscribe();
    
  return () => {
    console.log('💳 Cleaning up payment subscription');
    supabase.removeChannel(channel);
  };
}, [tab?.id]);
```

#### Solution B: Add Manual Refresh Button (FOR TESTING)

Add this button to the menu page header:

```typescript
<button
  onClick={() => {
    console.log('🔄 Manual badge refresh triggered');
    loadLoyaltyData();
  }}
  className="px-3 py-1 bg-amber-500 text-white rounded text-sm"
>
  Refresh Badge
</button>
```

#### Solution C: Trigger Badge Check on Order Acceptance

Modify the order acceptance handler to also check badges:

```typescript
const handleOrderUpdate = useCallback((payload: any) => {
  // ... existing code ...
  
  if (payload.new.status === 'accepted') {
    console.log('✅ Order accepted, checking badge status');
    // Small delay to ensure tab_balances view is updated
    setTimeout(() => {
      loadLoyaltyData();
    }, 1000);
  }
}, []);
```

---

## 🐛 Issue 3: Staff/Customer Icons Don't Match

### Diagnosis:

**Step 1: Check what staff app shows**
- Open staff app
- View customer tab card
- Note the badge icon shown

**Step 2: Check what customer app shows**
- Open customer app
- View menu page header
- Note the badge icon shown

**Step 3: Compare badge sources**

Staff app might be using:
- `loyalty_analytics.overall_tier`
- Old badge calculation logic
- Different API endpoint

Customer app uses:
- `customer_badges.badge_level`
- `/api/loyalty/badge/[customer_id]`
- `renderLoyaltyIcons()` function

### Fix:

Update staff app to use same badge API:

```typescript
// In staff app, replace loyalty_analytics query with:
const fetchCustomerBadge = async (customerId: string) => {
  const response = await fetch(`/api/loyalty/badge/${customerId}`);
  const data = await response.json();
  return data.badge_level; // 'bronze' | 'silver' | 'gold' | 'platinum' | null
};

// Use same icon mapping as customer app
const getBadgeIcon = (badgeLevel: string | null) => {
  if (badgeLevel === 'platinum' || badgeLevel === 'gold') return Crown;
  if (badgeLevel === 'silver') return Shield;
  if (badgeLevel === 'bronze') return Circle;
  return null;
};
```

---

## 🛠️ Step-by-Step Fix Process

### Step 1: Clean Up Test Data

```sql
-- Remove any test badges
DELETE FROM customer_badges
WHERE customer_id = '146d955e-44fe-4e22-8c27-f412b5911c41';

-- Verify clean state
SELECT * FROM customer_badges 
WHERE customer_id = '146d955e-44fe-4e22-8c27-f412b5911c41';
-- Expected: 0 rows
```

### Step 2: Add Badge Rank Column

```sql
-- Run QUICK-FIXES.sql (Fix 2 only)
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

CREATE INDEX IF NOT EXISTS idx_customer_badges_rank 
ON customer_badges(customer_id, badge_rank DESC) 
WHERE is_active = true;
```

### Step 3: Add Payment Subscription (Choose One)

**Option A**: Add payment realtime subscription (see Solution A above)

**Option B**: Add manual refresh button (see Solution B above)

**Option C**: Trigger on order acceptance (see Solution C above)

### Step 4: Test the Flow

1. **Clean state**: Customer has no badge
   ```bash
   curl http://localhost:3002/api/loyalty/badge/146d955e-44fe-4e22-8c27-f412b5911c41
   # Expected: {"badge_level": null}
   ```

2. **Place order**: Add items totaling KES 3,500
   - Staff accepts order
   - Check browser console for logs

3. **Simulate payment**: Insert payment manually
   ```sql
   INSERT INTO tab_payments (
     id, tab_id, amount, payment_method, status, created_at
   )
   VALUES (
     gen_random_uuid(),
     '<tab_id>',
     3500.00,
     'mpesa',
     'completed',
     NOW()
   );
   ```

4. **Trigger badge check**:
   - If using payment subscription: Should trigger automatically
   - If using manual button: Click "Refresh Badge"
   - If using order acceptance: Wait for next order

5. **Verify badge awarded**:
   ```bash
   curl http://localhost:3002/api/loyalty/badge/146d955e-44fe-4e22-8c27-f412b5911c41
   # Expected: {"badge_level": "bronze", ...}
   ```

6. **Check UI**: Menu page should show bronze circle icon

7. **Test upgrade**: Repeat with KES 5,500 total → Should upgrade to silver

---

## 🧪 Testing Checklist

- [ ] Customer starts with NO badge (null)
- [ ] After spending 3,000+, bronze badge appears
- [ ] After spending 5,000+ (Popos), silver badge appears
- [ ] Badge persists across page refreshes
- [ ] Badge displays at different venues
- [ ] Staff app shows same badge as customer app
- [ ] Notification shows on upgrade
- [ ] Discount applies based on badge level

---

## 📝 Quick Reference

### Check Current Badge
```bash
curl http://localhost:3002/api/loyalty/badge/<customer_id>
```

### Check Visit Data
```bash
curl "http://localhost:3002/api/loyalty/visits/<customer_id>?bar_id=<bar_id>"
```

### Manually Award Badge (Testing)
```bash
curl -X POST http://localhost:3002/api/loyalty/badge/award \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "<customer_id>",
    "bar_id": "<bar_id>",
    "badge_level": "silver",
    "spend_amount": 5500
  }'
```

### Clean Up Test Data
```sql
DELETE FROM customer_badges WHERE customer_id = '<customer_id>';
DELETE FROM tab_payments WHERE tab_id = '<tab_id>';
DELETE FROM tab_orders WHERE tab_id = '<tab_id>';
DELETE FROM tabs WHERE id = '<tab_id>';
```

---

## 🎯 Success Criteria

After implementing fixes:

1. ✅ New customer shows NO badge
2. ✅ Bronze badge appears after 3,000 KES spend
3. ✅ Silver badge appears after 5,000 KES spend (Popos)
4. ✅ Badge persists across sessions
5. ✅ Badge displays at all venues
6. ✅ Staff and customer apps show same badge
7. ✅ Upgrade notification appears
8. ✅ Discount applies correctly

---

**Next Steps**: Choose a solution for Issue 2 (payment trigger) and implement it.
