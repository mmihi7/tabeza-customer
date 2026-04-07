# Bugfix Requirements Document

## Introduction

Customers at venues with custom badge thresholds (stored in the `bars` table) are not receiving badge notifications or discounted menu prices when they meet the venue-specific spend requirements. The system currently uses hardcoded system-wide thresholds (Bronze: 3,000 | Silver: 10,000 | Gold: 25,000) instead of reading venue-specific values from the database.

**Impact**: At Popos venue (bar_id: 438c80c1-fe11-4ac5-8a48-2fc45104ba31), which has a Silver threshold of KES 5,000 (not the default 10,000), customers who spend above 5,000 do not receive Silver badge status, notifications, or the corresponding discount percentages on menu items.

**Affected Components**:
- Badge tier calculation logic in `/app/menu/page.tsx`
- Loyalty API route `/api/loyalty/visits/[customer_id]/route.ts`
- Menu pricing display logic

---

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a customer completes a payment that exceeds the venue's custom Silver threshold (e.g., KES 5,480 at Popos where Silver = 5,000) THEN the system does not award Silver badge status because it checks against the hardcoded threshold of 10,000

1.2 WHEN the badge tier calculation runs in `loadLoyaltyData()` THEN the system uses hardcoded thresholds (`averageSpend >= 25000`, `averageSpend >= 10000`, `averageSpend >= 3000`) instead of reading `bronze_threshold`, `silver_threshold`, `gold_threshold` from the `bars` table

1.3 WHEN menu prices are displayed THEN the system does not apply the venue's Silver badge discount percentage because the customer's `spendTier` state remains at a lower tier or null

1.4 WHEN the loyalty API route `/api/loyalty/visits/[customer_id]` returns visit data THEN it does not include the venue-specific thresholds needed for accurate tier determination on the frontend

### Expected Behavior (Correct)

2.1 WHEN a customer completes a payment that exceeds the venue's custom Silver threshold THEN the system SHALL award Silver badge status by comparing `averageSpend` against the venue's `silver_threshold` column from the `bars` table

2.2 WHEN the badge tier calculation runs in `loadLoyaltyData()` THEN the system SHALL read venue-specific thresholds from the `bars` table and use those values to determine the customer's spend tier

2.3 WHEN menu prices are displayed THEN the system SHALL apply the venue's Silver badge discount percentage by correctly setting the customer's `spendTier` state based on venue-specific thresholds

2.4 WHEN the loyalty API route `/api/loyalty/visits/[customer_id]` returns visit data THEN it SHALL include the venue's `bronze_threshold`, `silver_threshold`, and `gold_threshold` values in the response payload

2.5 WHEN a customer's spend tier upgrades (e.g., from Bronze to Silver) THEN the system SHALL display a congratulatory notification: "Congratulations! You've earned [Tier] status at [Venue Name]"

2.6 WHEN menu items are rendered after a tier upgrade THEN the system SHALL recalculate and display prices using the formula: `displayPrice = basePrice × (1 - (badgePct + visitBonusPct) / 100)` where `badgePct` corresponds to the newly earned tier

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a venue does not have custom thresholds set (columns are NULL) THEN the system SHALL CONTINUE TO use the system-wide default thresholds (Bronze: 3,000 | Silver: 10,000 | Gold: 25,000)

3.2 WHEN a customer's spend does not meet any threshold (venue-specific or default) THEN the system SHALL CONTINUE TO display normal pricing with no discount applied

3.3 WHEN the visit frequency bonus calculation runs THEN the system SHALL CONTINUE TO use the `weeklyVisits` count from the past 7 days without modification

3.4 WHEN venue discount percentages are loaded from `venue_discount_settings` THEN the system SHALL CONTINUE TO use those values for the discount formula without change

3.5 WHEN a customer has already earned a badge tier at a venue THEN the system SHALL CONTINUE TO preserve that tier (badges are permanent and upgrade-only)

3.6 WHEN the `loadLoyaltyData()` function runs THEN the system SHALL CONTINUE TO fetch both visit data and venue discount settings in parallel using `Promise.all()`

---

## Bug Condition & Property Specification

### Bug Condition Function

```pascal
FUNCTION isBugCondition(X)
  INPUT: X of type { averageSpend: number, venueThresholds: { bronze: number, silver: number, gold: number } }
  OUTPUT: boolean
  
  // Returns true when customer spend meets venue-specific threshold but system uses hardcoded threshold
  RETURN (
    (X.averageSpend >= X.venueThresholds.silver AND X.averageSpend < 10000) OR
    (X.averageSpend >= X.venueThresholds.gold AND X.averageSpend < 25000) OR
    (X.averageSpend >= X.venueThresholds.bronze AND X.averageSpend < 3000)
  )
END FUNCTION
```

**Example**: At Popos, `averageSpend = 5480`, `venueThresholds.silver = 5000`, hardcoded threshold = 10000
- Condition: `5480 >= 5000 AND 5480 < 10000` → **TRUE** (bug triggered)

### Property: Fix Checking

```pascal
// Property: Correct Badge Tier Assignment Using Venue Thresholds
FOR ALL X WHERE isBugCondition(X) DO
  tier ← calculateBadgeTier'(X.averageSpend, X.venueThresholds)
  ASSERT tier = expectedTier(X.averageSpend, X.venueThresholds)
  ASSERT notification_shown(tier, venueName)
  ASSERT menu_prices_reflect_discount(tier)
END FOR
```

Where:
- `calculateBadgeTier'` = fixed function that reads venue-specific thresholds
- `expectedTier()` = correct tier based on venue thresholds (Silver for Popos example)

### Property: Preservation Checking

```pascal
// Property: Non-Buggy Inputs Behave Identically
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT calculateBadgeTier(X) = calculateBadgeTier'(X)
END FOR
```

This ensures customers at venues without custom thresholds, or whose spend doesn't fall in the gap between venue and system thresholds, continue to receive the same tier assignment as before.

---

## Counterexample (Concrete Bug Demonstration)

**Venue**: Popos (bar_id: 438c80c1-fe11-4ac5-8a48-2fc45104ba31)  
**Custom Thresholds**: Bronze: 3,000 | Silver: 5,000 | Gold: 15,000  
**Customer Spend**: KES 5,480

**Current System Behavior**:
```javascript
// Hardcoded check in menu/page.tsx line 521-523
if (averageSpend >= 25000)     earnedSpendTier = 'gold';
else if (averageSpend >= 10000) earnedSpendTier = 'silver';
else if (averageSpend >= 3000)  earnedSpendTier = 'bronze';

// Result: earnedSpendTier = 'bronze' (WRONG)
// Expected: earnedSpendTier = 'silver' (because 5480 >= 5000)
```

**Expected System Behavior**:
```javascript
// Fixed check using venue thresholds
if (averageSpend >= venueThresholds.gold)     earnedSpendTier = 'gold';
else if (averageSpend >= venueThresholds.silver) earnedSpendTier = 'silver';
else if (averageSpend >= venueThresholds.bronze)  earnedSpendTier = 'bronze';

// Result: earnedSpendTier = 'silver' (CORRECT)
// Notification: "Congratulations! You've earned Silver status at Popos"
// Menu prices: Apply Silver discount % + visit bonus %
```

---

## Technical Context

### Database Schema

The `bars` table contains venue-specific threshold columns:
- `bronze_threshold` (numeric, nullable)
- `silver_threshold` (numeric, nullable)
- `gold_threshold` (numeric, nullable)

**Example row (Popos)**:
```json
{
  "id": "438c80c1-fe11-4ac5-8a48-2fc45104ba31",
  "name": "Popos",
  "bronze_threshold": 3000,
  "silver_threshold": 5000,
  "gold_threshold": 15000
}
```

### Current Implementation Locations

1. **API Route**: `/app/api/loyalty/visits/[customer_id]/route.ts`
   - Returns: `{ completedVisits, averageSpend, weeklyVisits, customer_id }`
   - Missing: venue threshold values

2. **Frontend Logic**: `/app/menu/page.tsx` (lines 521-523)
   - Hardcoded thresholds in `loadLoyaltyData()` function
   - Needs to receive and use venue thresholds from API

3. **Discount Application**: `/app/menu/page.tsx` (pricing logic)
   - Uses `spendTier` state to calculate discounts
   - Will automatically work correctly once tier calculation is fixed

### Data Flow

```
Payment Completed
    ↓
loadLoyaltyData() called
    ↓
GET /api/loyalty/visits/[customer_id]?bar_id=X
    ↓
API queries tabs + tab_balances (calculates averageSpend)
    ↓
[MISSING] API should also query bars table for thresholds
    ↓
Frontend receives { averageSpend, thresholds }
    ↓
[BUG] Frontend uses hardcoded thresholds instead of venue thresholds
    ↓
Incorrect tier assigned → No notification → No discount
```

---

## Success Criteria

The bug is considered fixed when:

1. A customer at Popos who spends KES 5,480 receives Silver badge status
2. The customer sees a notification: "Congratulations! You've earned Silver status at Popos"
3. Menu prices reflect the Silver badge discount percentage configured in Loyalty Centre
4. The `/api/loyalty/visits/[customer_id]` route returns venue-specific thresholds
5. The `loadLoyaltyData()` function uses venue thresholds for tier calculation
6. Customers at venues without custom thresholds continue to use system defaults
7. All existing discount calculation logic remains unchanged
