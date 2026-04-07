# Cross-Venue Badge Display Test

## Test ID: 13
**Status**: In Progress  
**Requirements**: 3.2, 3.3, 7.1, 7.2  
**Design Reference**: Edge Cases → Customer Visits New Venue for First Time

---

## Test Objective

Verify that a customer who earns a badge at one venue (Popos) will see that badge displayed at a different venue (Kikao), with the correct discount applied using the new venue's discount percentages, and visit frequency showing 1 icon for the first visit.

---

## Prerequisites

### Database Setup
1. Two venues configured in `bars` table:
   - **Popos** (venue A)
   - **Kikao** (venue B)

2. Venue discount settings configured in `venue_discount_settings`:
   - **Popos**: Silver = 4%, 1x visit = 1.5%
   - **Kikao**: Silver = 5%, 1x visit = 2%

3. Test customer account created

### API Endpoints Required
- `GET /api/loyalty/badge/[customer_id]`
- `GET /api/loyalty/visits/[customer_id]?bar_id=X`
- `GET /api/loyalty/venue-discounts/[bar_id]`
- `POST /api/loyalty/badge/award`

---

## Test Scenario

### Phase 1: Earn Silver Badge at Popos

**Step 1.1**: Open tab at Popos
- Navigate to `/start`
- Select Popos venue
- Complete identity selection
- Confirm tab opening

**Step 1.2**: Place orders totaling KES 10,500
- Add items to cart totaling at least KES 10,500
- Submit order
- Wait for staff acceptance

**Step 1.3**: Complete payment
- Navigate to payment page
- Complete M-Pesa payment for KES 10,500
- Wait for payment confirmation

**Step 1.4**: Verify Silver badge earned
- Check menu header for Silver shield icon
- Verify notification: "Congratulations! You've earned Silver status at Popos"
- Verify menu prices show Silver discount (4% + 1.5% = 5.5% off)

**Expected Database State After Phase 1**:
```sql
-- customer_badges table
SELECT * FROM customer_badges 
WHERE customer_id = '<test_customer_id>' 
AND is_active = true;

-- Expected result:
-- badge_level: 'silver'
-- earned_at_bar_id: '<popos_id>'
-- spend_amount_at_venue: 10500.00
-- is_active: true
```

---

### Phase 2: Visit Kikao (Different Venue)

**Step 2.1**: Open new tab at Kikao
- Navigate to `/start`
- Select Kikao venue (different from Popos)
- Complete identity selection
- Confirm tab opening

**Step 2.2**: Verify badge display on menu page
- Navigate to `/menu`
- Check loyalty icons in header

**Expected Badge Display**:
- ✅ Badge shape: **Silver shield** (not bronze circle)
- ✅ Icon count: **1 icon** (first visit at Kikao)
- ✅ Badge earned at: Popos (from database)

**Step 2.3**: Verify discount calculation
- Check menu item prices
- Calculate expected discount: Silver (5%) + 1x visit (2%) = 7% total
- Example: Item with base price KES 1,000 should display KES 930

**Expected Price Calculation**:
```
Base price: 1,000 KES
Badge discount (Kikao Silver): 5%
Visit bonus (1x at Kikao): 2%
Total discount: 7%
Display price: 1,000 × (1 - 0.07) = 930 KES
```

**Step 2.4**: Verify visit frequency
- Check `weeklyVisits` value from API
- Should be 0 or 1 (first visit at Kikao this week)
- Icon count should be 1

---

## Verification Checklist

### ✅ Cross-Venue Badge Display (Req 3.2, 3.3)
- [ ] Silver badge displays at Kikao (earned at Popos)
- [ ] Badge shape matches global badge level (Silver shield)
- [ ] Badge displays even though customer never visited Kikao before
- [ ] Only one badge level shown (not multiple)

### ✅ Discount Application (Req 7.1, 7.2)
- [ ] Silver discount percentage from Kikao's settings applied (not Popos)
- [ ] Visit frequency bonus from Kikao's settings applied
- [ ] Total discount = badge % + visit bonus %
- [ ] All menu items show discounted prices

### ✅ Visit Frequency Display
- [ ] Icon count = 1 (first visit at Kikao)
- [ ] Badge shape = Silver shield (from global badge)
- [ ] Visit frequency calculated for current venue only

---

## API Response Validation

### GET /api/loyalty/badge/[customer_id]
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

### GET /api/loyalty/visits/[customer_id]?bar_id=<kikao_id>
**Expected Response**:
```json
{
  "completedVisits": 0,
  "averageSpend": 0,
  "weeklyVisits": 0,
  "customer_id": "<test_customer_id>",
  "thresholds": {
    "bronze": 3000,
    "silver": 10000,
    "gold": 25000
  }
}
```

### GET /api/loyalty/venue-discounts/<kikao_id>
**Expected Response**:
```json
{
  "bar_id": "<kikao_id>",
  "spend_tiers": {
    "bronze": 2.0,
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

---

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

### Check Visit History at Kikao
```sql
SELECT 
  COUNT(*) as total_visits,
  SUM(tb.balance) as total_spend
FROM tabs t
LEFT JOIN tab_balances tb ON t.id = tb.tab_id
WHERE t.customer_id = '<test_customer_id>'
AND t.bar_id = '<kikao_id>'
AND t.status = 'closed';
```

### Check Venue Discount Settings
```sql
SELECT 
  bar_id,
  spend_tiers,
  visit_bonuses
FROM venue_discount_settings
WHERE bar_id IN ('<popos_id>', '<kikao_id>');
```

---

## Edge Cases to Test

### Edge Case 1: No Previous Visits at New Venue
- ✅ weeklyVisits = 0 at Kikao
- ✅ Icon count = 1 (minimum display)
- ✅ Badge shape = Silver (from global badge)

### Edge Case 2: Different Discount Percentages
- ✅ Popos Silver = 4%, Kikao Silver = 5%
- ✅ Correct venue's percentage applied at each location

### Edge Case 3: Badge Earned Location Displayed
- ✅ API returns earned_at_bar_name = "Popos"
- ✅ Badge displays at Kikao regardless

---

## Success Criteria

All of the following must be true:

1. ✅ **Cross-venue recognition**: Silver badge earned at Popos displays at Kikao
2. ✅ **Correct badge shape**: Silver shield icon shown (not bronze circle)
3. ✅ **Correct icon count**: 1 icon shown (first visit at Kikao)
4. ✅ **Venue-specific discount**: Kikao's Silver percentage (5%) applied, not Popos (4%)
5. ✅ **Visit bonus**: Kikao's 1x visit bonus (2%) applied
6. ✅ **Total discount**: 7% total discount on all menu items
7. ✅ **No duplicate badges**: Only one badge level shown
8. ✅ **Database consistency**: Only one active badge in customer_badges table

---

## Test Execution Log

### Test Run: [Date/Time]
**Tester**: [Name]  
**Environment**: [Dev/Staging/Production]

| Step | Expected | Actual | Status | Notes |
|------|----------|--------|--------|-------|
| 1.1 | Tab opened at Popos | | ⏳ | |
| 1.2 | Orders total KES 10,500 | | ⏳ | |
| 1.3 | Payment completed | | ⏳ | |
| 1.4 | Silver badge earned | | ⏳ | |
| 2.1 | Tab opened at Kikao | | ⏳ | |
| 2.2 | Silver shield × 1 icon | | ⏳ | |
| 2.3 | 7% discount applied | | ⏳ | |
| 2.4 | weeklyVisits = 0 or 1 | | ⏳ | |

**Overall Result**: ⏳ Pending

---

## Troubleshooting

### Issue: Badge not displaying at Kikao
**Check**:
1. Verify badge exists in database: `SELECT * FROM customer_badges WHERE customer_id = '...' AND is_active = true`
2. Check API response: `GET /api/loyalty/badge/[customer_id]`
3. Verify frontend state: Check React DevTools for `globalBadge` state
4. Check browser console for errors

### Issue: Wrong discount percentage applied
**Check**:
1. Verify venue discount settings: `SELECT * FROM venue_discount_settings WHERE bar_id = '<kikao_id>'`
2. Check API response: `GET /api/loyalty/venue-discounts/<kikao_id>`
3. Verify discount calculation in menu page code
4. Check that `spendTier` state reflects global badge

### Issue: Wrong icon count
**Check**:
1. Verify visit frequency: `GET /api/loyalty/visits/[customer_id]?bar_id=<kikao_id>`
2. Check `weeklyVisits` value in response
3. Verify icon count logic in `renderLoyaltyIcons()` function
4. Ensure visit frequency calculated for current venue only

---

## Notes

- This test validates the core cross-venue badge persistence feature
- Badge earned at one venue must display everywhere
- Discount percentages are venue-specific, not badge-specific
- Visit frequency is venue-specific, badge level is global
- First visit at new venue always shows 1 icon minimum

---

**Test Created**: 2026-04-07  
**Last Updated**: 2026-04-07  
**Status**: Ready for execution
