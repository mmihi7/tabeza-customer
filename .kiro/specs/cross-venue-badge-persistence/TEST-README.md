# Cross-Venue Badge Display Test - Execution Guide

## Overview

This directory contains all materials needed to execute Test #13: Cross-Venue Badge Display. This test verifies that badges earned at one venue (Popos) display correctly at a different venue (Kikao) with proper discount application.

## Test Files

| File | Purpose |
|------|---------|
| `test-cross-venue-badge.md` | Detailed test plan with step-by-step instructions |
| `test-setup.sql` | SQL script to set up test data in database |
| `verify-cross-venue-test.sh` | Automated verification script (Linux/Mac) |
| `verify-cross-venue-test.bat` | Automated verification script (Windows) |
| `TEST-README.md` | This file - execution guide |

## Prerequisites

### 1. Environment Setup
- Development server running on `http://localhost:3002`
- Access to Supabase database
- Two venues configured: Popos and Kikao
- Test customer account created

### 2. Required Information
You'll need the following UUIDs:
- **Test Customer ID**: UUID of your test customer account
- **Popos Bar ID**: UUID of Popos venue
- **Kikao Bar ID**: UUID of Kikao venue

### 3. Tools Required
- `curl` (for API testing)
- `jq` (for JSON parsing) - optional but recommended
- Database client (Supabase dashboard or psql)

## Quick Start

### Option 1: Manual Testing (Recommended for First Run)

1. **Set up test data**:
   ```bash
   # Edit test-setup.sql and replace placeholder UUIDs
   # Then run in Supabase SQL editor
   ```

2. **Follow test plan**:
   - Open `test-cross-venue-badge.md`
   - Execute Phase 1: Earn Silver badge at Popos
   - Execute Phase 2: Visit Kikao and verify display

3. **Verify results**:
   - Check badge display in menu header
   - Verify discount calculation
   - Confirm visit frequency shows 1 icon

### Option 2: Automated Verification (After Manual Setup)

**Linux/Mac**:
```bash
# Set environment variables
export TEST_CUSTOMER_ID="your-customer-uuid"
export POPOS_BAR_ID="popos-venue-uuid"
export KIKAO_BAR_ID="kikao-venue-uuid"
export API_BASE_URL="http://localhost:3002"  # Optional, defaults to localhost:3002

# Run verification script
chmod +x verify-cross-venue-test.sh
./verify-cross-venue-test.sh
```

**Windows**:
```cmd
REM Set environment variables
set TEST_CUSTOMER_ID=your-customer-uuid
set POPOS_BAR_ID=popos-venue-uuid
set KIKAO_BAR_ID=kikao-venue-uuid
set API_BASE_URL=http://localhost:3002

REM Run verification script
verify-cross-venue-test.bat
```

## Detailed Test Execution

### Phase 1: Earn Silver Badge at Popos

1. **Open the customer app** at `http://localhost:3002`

2. **Log in** with your test customer account

3. **Navigate to** `/start` to open a new tab

4. **Select Popos** venue from the list

5. **Complete identity selection** (choose "As yourself" or any option)

6. **Confirm tab opening**

7. **Add items to cart** totaling at least **KES 10,500**
   - This meets the Silver threshold (KES 10,000)
   - Add a bit extra to ensure threshold is exceeded

8. **Submit order** and wait for staff acceptance
   - In dev, you may need to manually accept via staff app
   - Or use SQL: `UPDATE tab_orders SET status = 'accepted' WHERE tab_id = '...'`

9. **Complete payment**
   - Navigate to payment page
   - Complete M-Pesa payment (or simulate in dev)
   - Wait for payment confirmation

10. **Verify Silver badge earned**:
    - Check menu header for Silver shield icon
    - Look for notification: "Congratulations! You've earned Silver status at Popos"
    - Verify menu prices show discount

### Phase 2: Visit Kikao (Cross-Venue Test)

1. **Navigate to** `/start` to open a new tab

2. **Select Kikao** venue (different from Popos)

3. **Complete identity selection**

4. **Confirm tab opening**

5. **Navigate to** `/menu` page

6. **Verify badge display**:
   - ✅ Badge shape: **Silver shield** (not bronze circle)
   - ✅ Icon count: **1 icon** (first visit at Kikao)
   - ✅ Badge earned at: Popos (check API response)

7. **Verify discount calculation**:
   - Check menu item prices
   - Calculate expected discount: Silver % + 1x visit %
   - Example: If Kikao has Silver=5%, 1x=2%, total discount = 7%
   - Item with base price KES 1,000 should show KES 930

8. **Verify visit frequency**:
   - Should show 1 icon (first visit at Kikao)
   - Even though badge is Silver (earned at Popos)

## Verification Checklist

Use this checklist to confirm all test criteria are met:

### ✅ Cross-Venue Badge Display
- [ ] Silver badge displays at Kikao (earned at Popos)
- [ ] Badge shape matches global badge level (Silver shield)
- [ ] Badge displays even though customer never visited Kikao before
- [ ] Only one badge level shown (not multiple)

### ✅ Discount Application
- [ ] Silver discount percentage from Kikao's settings applied (not Popos)
- [ ] Visit frequency bonus from Kikao's settings applied
- [ ] Total discount = badge % + visit bonus %
- [ ] All menu items show discounted prices

### ✅ Visit Frequency Display
- [ ] Icon count = 1 (first visit at Kikao)
- [ ] Badge shape = Silver shield (from global badge)
- [ ] Visit frequency calculated for current venue only

### ✅ Database Consistency
- [ ] Only one active badge in `customer_badges` table
- [ ] Badge `earned_at_bar_id` = Popos ID
- [ ] Badge `is_active` = true
- [ ] No visits at Kikao before this test

## API Endpoints to Test

### 1. Get Customer Badge
```bash
curl http://localhost:3002/api/loyalty/badge/{customer_id}
```

**Expected Response**:
```json
{
  "badge_level": "silver",
  "awarded_at": "2026-04-07T...",
  "earned_at_bar_id": "<popos_id>",
  "earned_at_bar_name": "Popos",
  "spend_amount_at_venue": 10500.00
}
```

### 2. Get Visit Data at Kikao
```bash
curl "http://localhost:3002/api/loyalty/visits/{customer_id}?bar_id={kikao_id}"
```

**Expected Response**:
```json
{
  "completedVisits": 0,
  "averageSpend": 0,
  "weeklyVisits": 0,
  "customer_id": "<customer_id>",
  "thresholds": {
    "bronze": 3000,
    "silver": 10000,
    "gold": 25000
  }
}
```

### 3. Get Kikao Discount Settings
```bash
curl http://localhost:3002/api/loyalty/venue-discounts/{kikao_id}
```

**Expected Response**:
```json
{
  "bar_id": "<kikao_id>",
  "spend_tiers": {
    "bronze": 2.5,
    "silver": 5.0,
    "gold": 7.0
  },
  "visit_bonuses": {
    "1x": 2.0,
    "2x": 3.0,
    "3x": 5.0
  }
}
```

## Database Queries for Verification

### Check Active Badge
```sql
SELECT 
  cb.badge_level,
  cb.awarded_at,
  cb.earned_at_bar_id,
  b.name as earned_at_venue,
  cb.spend_amount_at_venue,
  cb.is_active
FROM customer_badges cb
LEFT JOIN bars b ON cb.earned_at_bar_id = b.id
WHERE cb.customer_id = '<test_customer_id>'
AND cb.is_active = true;
```

### Check Visit History
```sql
-- Visits at Popos (should have 1+ closed tabs)
SELECT COUNT(*) as popos_visits
FROM tabs
WHERE customer_id = '<test_customer_id>'
AND bar_id = '<popos_id>'
AND status = 'closed';

-- Visits at Kikao (should be 0 before test, 1 after)
SELECT COUNT(*) as kikao_visits
FROM tabs
WHERE customer_id = '<test_customer_id>'
AND bar_id = '<kikao_id>';
```

### Check Discount Settings
```sql
SELECT 
  b.name as venue_name,
  vds.spend_tiers,
  vds.visit_bonuses
FROM venue_discount_settings vds
LEFT JOIN bars b ON vds.bar_id = b.id
WHERE vds.bar_id IN ('<popos_id>', '<kikao_id>');
```

## Troubleshooting

### Issue: Badge not displaying at Kikao

**Possible Causes**:
1. Badge not in database
2. Badge `is_active` = false
3. API endpoint not working
4. Frontend not fetching badge

**Debug Steps**:
```bash
# 1. Check database
SELECT * FROM customer_badges 
WHERE customer_id = '<test_customer_id>' 
AND is_active = true;

# 2. Test API endpoint
curl http://localhost:3002/api/loyalty/badge/<test_customer_id>

# 3. Check browser console for errors
# Open DevTools → Console tab

# 4. Check React state
# Open DevTools → React DevTools → Components → find menu page → check globalBadge state
```

### Issue: Wrong discount percentage applied

**Possible Causes**:
1. Venue discount settings not configured
2. Wrong venue's settings being used
3. Discount calculation error

**Debug Steps**:
```bash
# 1. Check Kikao discount settings
curl http://localhost:3002/api/loyalty/venue-discounts/<kikao_id>

# 2. Verify discount calculation
# Expected: displayPrice = basePrice × (1 - (badgePct + visitBonusPct) / 100)
# Example: 1000 × (1 - (5 + 2) / 100) = 1000 × 0.93 = 930

# 3. Check menu page code
# Verify spendTier state reflects global badge
```

### Issue: Wrong icon count

**Possible Causes**:
1. Visit frequency calculated incorrectly
2. Icon count logic error
3. Wrong venue's visits being counted

**Debug Steps**:
```bash
# 1. Check visit frequency at Kikao
curl "http://localhost:3002/api/loyalty/visits/<test_customer_id>?bar_id=<kikao_id>"

# 2. Verify weeklyVisits value
# Should be 0 or 1 for first visit

# 3. Check icon count logic
# weeklyVisits < 2 → 1 icon
# weeklyVisits = 2 → 2 icons
# weeklyVisits >= 3 → 3 icons
```

## Success Criteria

The test is considered **PASSED** when all of the following are true:

1. ✅ Silver badge earned at Popos displays at Kikao
2. ✅ Badge shape is Silver shield (not bronze circle)
3. ✅ Icon count is 1 (first visit at Kikao)
4. ✅ Kikao's Silver discount percentage applied (not Popos)
5. ✅ Kikao's 1x visit bonus applied
6. ✅ Total discount correctly calculated and applied to all menu items
7. ✅ Only one active badge exists in database
8. ✅ Badge `earned_at_bar_id` points to Popos

## Cleanup After Test

To reset the test environment:

```sql
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
```

## Notes

- This test validates the core cross-venue badge persistence feature
- Badge earned at one venue must display everywhere
- Discount percentages are venue-specific, not badge-specific
- Visit frequency is venue-specific, badge level is global
- First visit at new venue always shows 1 icon minimum

## Support

If you encounter issues:
1. Review `test-cross-venue-badge.md` for detailed test plan
2. Check database state with provided SQL queries
3. Test API endpoints with curl commands
4. Review browser console for frontend errors
5. Check React DevTools for state values

---

**Test Created**: 2026-04-07  
**Last Updated**: 2026-04-07  
**Status**: Ready for execution
