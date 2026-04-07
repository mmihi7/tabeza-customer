# Venue-Specific Badge Threshold Fix — Bugfix Design

## Overview

Customers at venues with custom badge thresholds are not receiving badge notifications or discounted menu prices when they meet venue-specific spend requirements. The system currently uses hardcoded system-wide thresholds (Bronze: 3,000 | Silver: 10,000 | Gold: 25,000) instead of reading venue-specific values from the `bars` table columns (`bronze_threshold`, `silver_threshold`, `gold_threshold`).

This fix will modify the loyalty API route to return venue thresholds and update the frontend tier calculation logic to use those values. The fix also ensures badge upgrade notifications are displayed and menu prices are recalculated after payment completion.

**Critical Update**: The customer has not been awarded ANY badge at all (not even Bronze). This means the badge calculation/award system may not be triggering at all after payment completion, not just using wrong thresholds.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug — when a customer's spend meets venue-specific thresholds but the system checks against hardcoded system-wide thresholds
- **Property (P)**: The desired behavior — customers receive correct badge tier based on venue-specific thresholds, see upgrade notifications, and get discounted prices
- **Preservation**: Existing behavior for venues without custom thresholds (NULL columns) must continue using system defaults
- **loadLoyaltyData**: The function in `app/menu/page.tsx` (line ~490) that fetches visit data and calculates badge tier
- **averageSpend**: The average spend per completed visit at a venue, calculated from `tab_balances`
- **spendTier**: React state variable that determines which discount percentage applies to menu prices
- **venueThresholds**: The venue-specific threshold values from `bars` table: `bronze_threshold`, `silver_threshold`, `gold_threshold`

## Bug Details

### Bug Condition

The bug manifests when a customer completes a payment that brings their average spend above a venue's custom threshold but below the corresponding system-wide threshold. The `loadLoyaltyData()` function uses hardcoded comparisons (`averageSpend >= 25000`, `averageSpend >= 10000`, `averageSpend >= 3000`) instead of comparing against venue-specific thresholds from the database.

**Additionally**, the badge tier recalculation may not be triggering at all after payment completion, as evidenced by the customer receiving NO badge whatsoever despite spending KES 5,480.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { averageSpend: number, venueThresholds: { bronze: number, silver: number, gold: number } }
  OUTPUT: boolean
  
  RETURN (
    (input.averageSpend >= input.venueThresholds.silver AND input.averageSpend < 10000) OR
    (input.averageSpend >= input.venueThresholds.gold AND input.averageSpend < 25000) OR
    (input.averageSpend >= input.venueThresholds.bronze AND input.averageSpend < 3000)
  ) OR (
    input.averageSpend >= input.venueThresholds.bronze AND badgeTierNotCalculated()
  )
END FUNCTION
```

### Examples

- **Popos venue (bar_id: 438c80c1-fe11-4ac5-8a48-2fc45104ba31)**: Customer spends KES 5,480, venue Silver threshold is 5,000, system threshold is 10,000
  - Expected: Silver badge awarded, notification shown, Silver discount applied
  - Actual: NO badge awarded at all, no notification, full price displayed

- **Venue with default thresholds (NULL columns)**: Customer spends KES 12,000
  - Expected: Silver badge (12,000 >= 10,000 system default)
  - Actual: Silver badge correctly awarded (this case works)

- **Venue with custom Gold threshold of 15,000**: Customer spends KES 18,000
  - Expected: Gold badge (18,000 >= 15,000 custom threshold)
  - Actual: Bronze or Silver badge (18,000 < 25,000 system threshold)

- **Edge case — no badge calculation trigger**: Customer completes payment but `loadLoyaltyData()` is never called
  - Expected: Badge tier recalculated automatically after payment
  - Actual: Badge tier remains stale or null

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Venues without custom thresholds (NULL columns) must continue using system-wide defaults (Bronze: 3,000 | Silver: 10,000 | Gold: 25,000)
- Visit frequency bonus calculation based on `weeklyVisits` must remain unchanged
- Venue discount percentages from `venue_discount_settings` must continue to be used in the discount formula
- Badge permanence and upgrade-only logic must remain unchanged
- Parallel fetching of visit data and venue discounts using `Promise.all()` must remain unchanged
- Menu price calculation formula `displayPrice = basePrice × (1 - (badgePct + visitBonusPct) / 100)` must remain unchanged

**Scope:**
All inputs where the customer's spend does NOT fall in the gap between venue-specific and system-wide thresholds should be completely unaffected by this fix. This includes:
- Customers at venues without custom thresholds
- Customers whose spend is below all thresholds (no badge)
- Customers whose spend is above both venue and system thresholds (same tier either way)

## Hypothesized Root Cause

Based on the bug description and code analysis, the most likely issues are:

1. **Hardcoded Threshold Comparisons**: The `loadLoyaltyData()` function in `app/menu/page.tsx` (lines 521-523) uses hardcoded values instead of venue-specific thresholds
   - Current: `if (averageSpend >= 25000) ... else if (averageSpend >= 10000) ... else if (averageSpend >= 3000)`
   - The API route does not return venue thresholds, so the frontend has no access to them

2. **Missing API Response Fields**: The `/api/loyalty/visits/[customer_id]` route returns only `{ completedVisits, averageSpend, weeklyVisits, customer_id }` without venue threshold values
   - The route queries `tabs` and `tab_balances` but does not join with `bars` table to fetch threshold columns

3. **No Badge Recalculation After Payment**: The `loadLoyaltyData()` function is only called in a `useEffect` that depends on `tab?.bar_id` and `tab?.customer_id`
   - When a payment completes, these dependencies don't change, so the effect doesn't re-run
   - The badge tier remains stale until the page is refreshed

4. **Missing Upgrade Notification Logic**: There is no code to detect when a customer's tier upgrades and show a congratulatory notification
   - The `isStaffAcceptance` handler (line ~768) shows a spend prompt but does not check for tier upgrades

## Correctness Properties

Property 1: Bug Condition - Venue-Specific Badge Tier Assignment

_For any_ customer whose average spend meets a venue's custom threshold (as defined in the `bars` table columns `bronze_threshold`, `silver_threshold`, `gold_threshold`), the fixed `loadLoyaltyData` function SHALL calculate the correct badge tier by comparing `averageSpend` against venue-specific thresholds (or system defaults if venue thresholds are NULL), SHALL update the `spendTier` state to reflect the earned tier, and SHALL trigger menu price recalculation using the correct discount percentage.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

Property 2: Preservation - Default Threshold Behavior

_For any_ venue where custom thresholds are NULL (not configured), the fixed code SHALL produce exactly the same badge tier assignment as the original code, using system-wide default thresholds (Bronze: 3,000 | Silver: 10,000 | Gold: 25,000), preserving all existing behavior for venues that have not customized their thresholds.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**

Property 3: Badge Upgrade Notification

_For any_ customer whose badge tier upgrades after a payment is completed (e.g., from Bronze to Silver, or from no badge to Bronze), the fixed code SHALL display a congratulatory notification with the format "Congratulations! You've earned [Tier] status at [Venue Name]" and SHALL trigger the configured notification preferences (sound, vibration).

**Validates: Requirements 2.5**

Property 4: Menu Price Refresh After Tier Upgrade

_For any_ customer whose badge tier upgrades, the fixed code SHALL immediately recalculate all menu item prices using the new tier's discount percentage, ensuring the updated prices are displayed without requiring a page refresh.

**Validates: Requirements 2.6**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File 1**: `app/api/loyalty/visits/[customer_id]/route.ts`

**Function**: `GET` handler

**Specific Changes**:
1. **Add bars table join**: After querying `tabs` and `tab_balances`, add a query to fetch the venue's threshold columns
   - Query: `SELECT bronze_threshold, silver_threshold, gold_threshold FROM bars WHERE id = bar_id`
   - Handle NULL values by falling back to system defaults

2. **Include thresholds in response**: Add a `thresholds` object to the JSON response
   - Format: `{ bronze: number, silver: number, gold: number }`
   - Use venue values if present, otherwise use defaults: `{ bronze: 3000, silver: 10000, gold: 25000 }`

3. **Response payload update**:
   ```typescript
   return NextResponse.json({
     completedVisits,
     averageSpend,
     weeklyVisits,
     customer_id,
     thresholds: {
       bronze: venueThresholds?.bronze_threshold ?? 3000,
       silver: venueThresholds?.silver_threshold ?? 10000,
       gold: venueThresholds?.gold_threshold ?? 25000
     }
   });
   ```

**File 2**: `app/menu/page.tsx`

**Function**: `loadLoyaltyData` (line ~490)

**Specific Changes**:
1. **Extract thresholds from API response**: After fetching visit data, extract the `thresholds` object
   - Add: `const thresholds = visitsData.thresholds ?? { bronze: 3000, silver: 10000, gold: 25000 };`

2. **Replace hardcoded comparisons**: Update the spend tier calculation to use venue thresholds
   - Replace lines 521-523:
   ```typescript
   // OLD (hardcoded):
   if (averageSpend >= 25000)     earnedSpendTier = 'gold';
   else if (averageSpend >= 10000) earnedSpendTier = 'silver';
   else if (averageSpend >= 3000)  earnedSpendTier = 'bronze';
   
   // NEW (venue-specific):
   if (averageSpend >= thresholds.gold)     earnedSpendTier = 'gold';
   else if (averageSpend >= thresholds.silver) earnedSpendTier = 'silver';
   else if (averageSpend >= thresholds.bronze)  earnedSpendTier = 'bronze';
   ```

3. **Update buildSpendPrompt helper**: Replace hardcoded thresholds in the `buildSpendPrompt` function (line ~545)
   - Add `thresholds` parameter to function signature
   - Replace `const THRESHOLDS: Record<SpendTierLabel, number> = { bronze: 3000, silver: 10000, gold: 25000 };` with the passed-in thresholds

4. **Add tier upgrade detection**: After calculating the new tier, compare with previous tier to detect upgrades
   - Store previous tier in a `useRef` to persist across renders
   - If `earnedSpendTier` is higher than previous tier, show notification

5. **Add upgrade notification logic**: When a tier upgrade is detected, show a toast notification
   ```typescript
   if (earnedSpendTier && (!previousTier.current || tierRank(earnedSpendTier) > tierRank(previousTier.current))) {
     showToast({
       type: 'success',
       title: `Congratulations! You've earned ${earnedSpendTier.charAt(0).toUpperCase() + earnedSpendTier.slice(1)} status`,
       message: `at ${barName}`,
       duration: 8000
     });
     if (notificationPrefs.soundEnabled) playAcceptanceSound();
     if (notificationPrefs.vibrationEnabled) buzz([200, 100, 200, 100, 200]);
   }
   previousTier.current = earnedSpendTier;
   ```

6. **Trigger recalculation after payment**: Add payment completion as a dependency to the loyalty data loading effect
   - Option A: Add `payments` array to the `useEffect` dependency array (line ~590)
   - Option B: Call `loadLoyaltyData()` explicitly in the payment success handler

**File 3**: `app/menu/page.tsx` (payment handling)

**Function**: Payment realtime subscription handler or payment success callback

**Specific Changes**:
1. **Detect payment completion**: In the payment realtime subscription handler, detect when a new payment is inserted
2. **Trigger loyalty recalculation**: Call `loadLoyaltyData()` after a payment is successfully recorded
3. **Ensure menu prices refresh**: The existing `spendTier` state update will automatically trigger price recalculation via the `applyDiscount()` function

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write tests that simulate a customer spending above a venue's custom threshold but below the system threshold. Run these tests on the UNFIXED code to observe failures and understand the root cause.

**Test Cases**:
1. **Popos Silver Threshold Test**: Customer spends KES 5,480 at Popos (Silver threshold: 5,000) — verify badge tier is incorrectly calculated as Bronze or null (will fail on unfixed code)
2. **Custom Gold Threshold Test**: Customer spends KES 18,000 at venue with Gold threshold of 15,000 — verify badge tier is incorrectly calculated as Silver (will fail on unfixed code)
3. **API Response Test**: Call `/api/loyalty/visits/[customer_id]?bar_id=popos` — verify response does NOT include `thresholds` field (will fail on unfixed code)
4. **Payment Completion Test**: Complete a payment and observe that `loadLoyaltyData()` is not called — verify badge tier remains stale (will fail on unfixed code)

**Expected Counterexamples**:
- Badge tier calculated as Bronze when it should be Silver (Popos case)
- No badge awarded at all despite meeting Bronze threshold
- API response missing `thresholds` field
- Badge tier not recalculated after payment completion
- No upgrade notification shown when tier changes

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  // API route returns venue thresholds
  apiResponse := GET /api/loyalty/visits/[customer_id]?bar_id=input.barId
  ASSERT apiResponse.thresholds.silver = input.venueThresholds.silver
  
  // Frontend calculates correct tier
  tier := loadLoyaltyData_fixed(input.averageSpend, apiResponse.thresholds)
  ASSERT tier = expectedTier(input.averageSpend, input.venueThresholds)
  
  // Notification shown for upgrade
  IF tier > previousTier THEN
    ASSERT notificationShown(tier, venueName)
  END IF
  
  // Menu prices reflect correct discount
  ASSERT menuPricesUseDiscount(tier)
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT loadLoyaltyData_original(input) = loadLoyaltyData_fixed(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for venues without custom thresholds, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Default Threshold Preservation**: Observe that venues with NULL threshold columns use system defaults (3,000 / 10,000 / 25,000) on unfixed code, then write test to verify this continues after fix
2. **Below-Threshold Preservation**: Observe that customers with spend below all thresholds receive no badge on unfixed code, then write test to verify this continues after fix
3. **Visit Frequency Preservation**: Observe that visit frequency bonus calculation is unaffected on unfixed code, then write test to verify this continues after fix
4. **Discount Formula Preservation**: Observe that the discount formula `displayPrice = basePrice × (1 - (badgePct + visitBonusPct) / 100)` works correctly on unfixed code, then write test to verify this continues after fix

### Unit Tests

- Test API route returns correct thresholds for venue with custom values
- Test API route returns system defaults for venue with NULL thresholds
- Test frontend tier calculation with venue-specific thresholds
- Test frontend tier calculation with system default thresholds
- Test tier upgrade detection logic (previous tier vs new tier)
- Test notification display when tier upgrades
- Test menu price recalculation after tier change

### Property-Based Tests

- Generate random venue threshold configurations (NULL or custom values) and verify correct tier assignment
- Generate random customer spend amounts and verify tier is calculated correctly for both custom and default thresholds
- Generate random payment sequences and verify badge tier is recalculated after each payment
- Test that all venues without custom thresholds continue to behave identically to the original code

### Integration Tests

- Test full flow: customer opens tab → places order → payment completes → badge tier recalculates → notification shown → menu prices update
- Test tier upgrade flow: customer starts with no badge → spends to Bronze threshold → notification shown → spends to Silver threshold → notification shown
- Test venue switching: customer has Silver at Venue A → opens tab at Venue B with different thresholds → correct tier calculated for Venue B
- Test payment completion triggers loyalty recalculation in real-time subscription handler
