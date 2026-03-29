# Loyalty Tier Classification Bug — Bugfix Design

## Overview

A new customer connecting to a venue (e.g., "Popos Bar") is incorrectly shown two Bronze tier
stars before placing any order. Three independent defects combine to produce this symptom:

1. `/api/loyalty/visits/[customer_id]` returns hardcoded mock data (`totalVisits: 2`,
   `visitTier: 'bronze'`) for every customer regardless of their actual history.
2. `loadLoyaltyData()` in `app/menu/page.tsx` classifies `weeklyVisits >= 1` as Bronze with
   no minimum-visit gate and no average-spend check.
3. Spend thresholds are hardcoded (`KES 3,000 / 5,000 / 15,000`) instead of being read from
   the venue's configuration in the `bars` table.

The fix replaces the mock API with a real Supabase query, rewrites the tier-classification
logic to enforce the 2-visit minimum and average-spend gate, and reads thresholds from venue
config. The `spendTier` pricing layer (separate `useEffect`) is explicitly out of scope and
must not be touched.

---

## Glossary

- **Bug_Condition (C)**: The condition that triggers the incorrect tier display — a
  `CustomerVenueContext` where `completedVisits < 2`, OR where `completedVisits >= 2` but
  `averageSpend < bronzeThreshold`.
- **Property (P)**: The desired behavior for buggy inputs — `renderLoyaltyIcons` returns
  `null` (no icons rendered).
- **Preservation**: All inputs where `NOT isBugCondition(X)` — qualifying guests must
  continue to see the correct tier icons unchanged.
- **`loadLoyaltyData()`**: The async function in `app/menu/page.tsx` that fetches visit/spend
  data and sets `loyaltyData` state, which drives `renderLoyaltyIcons()`.
- **`renderLoyaltyIcons()`**: The function in `app/menu/page.tsx` that reads `loyaltyData`
  and returns JSX tier icons (or `null`).
- **`/api/loyalty/visits/[customer_id]`**: The Next.js API route in
  `app/api/loyalty/visits/[customer_id]/route.ts` that currently returns hardcoded mock data.
- **`completedVisits`**: The count of completed (paid/closed) tab visits by the customer at
  the specific venue — the gating criterion for any tier assignment.
- **`averageSpend`**: The customer's average spend per completed visit at the venue, compared
  against the venue's configured Bronze threshold.
- **`bronzeThreshold`**: The minimum average spend (KES) required for Bronze tier, read from
  the `bars` table for the connected venue.

---

## Bug Details

### Bug Condition

The bug manifests when a customer is shown a loyalty tier despite not meeting the minimum
visit count or average spend requirements. The `loadLoyaltyData()` function either receives
fabricated visit data from the mock API, or applies a classification rule that assigns Bronze
at `weeklyVisits >= 1` without checking completed visit count or average spend against the
venue's configured threshold.

**Formal Specification:**
```
FUNCTION isBugCondition(X)
  INPUT: X of type CustomerVenueContext
         where X.completedVisits = number of completed visits at the venue
         and   X.averageSpend    = average spend per completed visit at the venue (KES)
         and   X.bronzeThreshold = venue's configured Bronze spend threshold (KES)
  OUTPUT: boolean

  // Bug triggers when a tier is shown despite insufficient visits or spend
  RETURN X.completedVisits < 2
      OR (X.completedVisits >= 2 AND X.averageSpend < X.bronzeThreshold)
END FUNCTION
```

### Examples

- **New customer, 0 visits**: `completedVisits=0, averageSpend=0, bronzeThreshold=3000`
  → `isBugCondition = true`. Current code shows 2 Bronze stars. Expected: no icons.

- **One visit, high spend**: `completedVisits=1, averageSpend=8000, bronzeThreshold=3000`
  → `isBugCondition = true`. Current code shows Bronze (via mock data). Expected: no icons.

- **Two visits, spend below threshold**: `completedVisits=2, averageSpend=1500, bronzeThreshold=3000`
  → `isBugCondition = true`. Expected: no icons.

- **Two visits, spend meets threshold**: `completedVisits=2, averageSpend=3500, bronzeThreshold=3000`
  → `isBugCondition = false`. Expected: Bronze tier icons (preserved behavior).

---

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- A customer with 2+ completed visits and `averageSpend >= bronzeThreshold` must continue to
  see the correct Bronze tier icons.
- A customer with 2+ completed visits and `averageSpend >= silverThreshold` must continue to
  see the correct Silver tier icons.
- A customer with 2+ completed visits and `averageSpend >= goldThreshold` must continue to
  see the correct Gold tier icons.
- When the loyalty API call fails or returns an error, the app must continue to show no tier
  icons (graceful degradation — unchanged).
- The `spendTier` state used for menu price discounts must continue to be loaded and applied
  independently via its own `useEffect`; this fix must not touch that code path.

**Scope:**
All inputs where `NOT isBugCondition(X)` — i.e., customers with 2+ completed visits whose
average spend meets or exceeds the venue's Bronze threshold — are completely unaffected by
this fix. The fix only changes what happens for buggy inputs (insufficient visits or spend).

---

## Hypothesized Root Cause

Based on code inspection, the three root causes are confirmed (not hypothetical):

1. **Hardcoded Mock Data in API Route** (`app/api/loyalty/visits/[customer_id]/route.ts`):
   The route unconditionally returns `{ totalVisits: 2, weeklyVisits: 2, visitTier: 'bronze' }`
   for every `customer_id`. No Supabase query is made. This is the primary injection point
   for the fabricated data.

2. **Missing Minimum-Visit Gate in `loadLoyaltyData()`** (`app/menu/page.tsx`):
   The classification logic uses `weeklyVisits >= 1` for Bronze with no guard requiring
   `completedVisits >= 2`. Even if the API returned real data showing 1 visit, the code
   would still assign Bronze.

3. **Hardcoded Spend Thresholds** (`app/menu/page.tsx`):
   The `loadLoyaltyData()` function uses hardcoded values (`3000`, `5000`, `15000`) for
   spend tier classification instead of reading from the venue's `bars` table configuration.
   This means the tier logic cannot be configured per venue.

4. **No Average Spend Check Before Tier Assignment**:
   Even with real visit data, `loadLoyaltyData()` never computes `averageSpend` (total spend
   ÷ completed visits) and never compares it against a Bronze threshold. The spend tier
   (`spendTier`) is computed separately for pricing but is not used as a gate for the visit
   tier display.

---

## Correctness Properties

Property 1: Bug Condition — No Tier Shown for Ineligible Guests

_For any_ `CustomerVenueContext` where `isBugCondition(X)` returns `true` (i.e.,
`completedVisits < 2`, OR `completedVisits >= 2` AND `averageSpend < bronzeThreshold`),
the fixed `renderLoyaltyIcons` function SHALL return `null`, rendering no tier icons.

**Validates: Requirements 2.1, 2.2, 2.4, 2.5, 2.6, 2.8**

Property 2: Preservation — Qualifying Guests See Correct Tier Icons

_For any_ `CustomerVenueContext` where `isBugCondition(X)` returns `false` (i.e.,
`completedVisits >= 2` AND `averageSpend >= bronzeThreshold`), the fixed
`renderLoyaltyIcons` function SHALL produce the same tier icon output as the original
correct behavior, preserving Bronze, Silver, and Gold icon display for qualifying guests.

**Validates: Requirements 3.1, 3.2, 3.3, 3.6**

---

## Fix Implementation

### Changes Required

Assuming the root cause analysis above is correct:

**File 1**: `app/api/loyalty/visits/[customer_id]/route.ts`

**Function**: `GET`

**Specific Changes**:
1. **Replace mock data with real Supabase query**: Query the `tab_orders` or `tabs` table
   (joined with `bars`) to count completed visits for `customer_id` at the specific venue.
   The venue context must be passed (e.g., via query param `?bar_id=...`) or derived from
   the customer's active tab.
2. **Return actual `completedVisits` and `averageSpend`**: The response shape must include
   `completedVisits` (count of closed/paid tabs at the venue) and `averageSpend` (total
   spend ÷ completedVisits, or 0 if no visits).
3. **Return `null` tier from API**: The API should return raw data only; tier classification
   belongs in `loadLoyaltyData()`, not the API route.

---

**File 2**: `app/menu/page.tsx`

**Function**: `loadLoyaltyData()`

**Specific Changes**:
1. **Add 2-visit minimum gate**: Before assigning any tier, check
   `completedVisits >= 2`. If not met, set `visitTier = 'new'` and return early (no tier).
2. **Add average spend check**: Compute `averageSpend = totalSpend / completedVisits`.
   Compare against the venue's configured `bronzeThreshold` (read from venue config).
   If `averageSpend < bronzeThreshold`, set `visitTier = 'new'`.
3. **Read thresholds from venue config**: Fetch `bronze_threshold`, `silver_threshold`, and
   `gold_threshold` from the `bars` table for `tab.bar_id`. Use these values instead of the
   hardcoded `3000 / 5000 / 15000` constants.
4. **Update tier classification logic**: Replace the `weeklyVisits`-based classification
   with an `averageSpend`-based classification against venue thresholds:
   - `averageSpend >= goldThreshold` → `'gold'`
   - `averageSpend >= silverThreshold` → `'silver'`
   - `averageSpend >= bronzeThreshold` → `'bronze'`
   - otherwise → `'new'`
5. **Do not touch `spendTier` useEffect**: The separate `useEffect` that loads `spendTier`
   for pricing must remain completely unchanged.

---

**File 3**: `app/menu/page.tsx`

**Function**: `renderLoyaltyIcons()`

**Specific Changes**:
1. **Guard on `visitTier === 'new'`**: Add an explicit early return of `null` when
   `visitTier === 'new'`, in addition to the existing `!loyaltyData` guard. This ensures
   no icons are rendered for ineligible guests even if `loyaltyData` is set.

---

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that
demonstrate the bug on unfixed code, then verify the fix works correctly and preserves
existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix.
Confirm the root cause analysis. If refuted, re-hypothesize.

**Test Plan**: Write tests that inline the exact buggy code from `loadLoyaltyData()` and
the mock API response, then assert that a new customer (0 visits) receives no tier. Run
these tests on the UNFIXED code to observe failures and confirm the root cause.

**Test Cases**:
1. **New Customer Test**: Simulate `loadLoyaltyData()` receiving the mock API response
   (`totalVisits: 2, weeklyVisits: 2`) for a customer with 0 real visits. Assert
   `visitTier !== 'bronze'` and `visitTier !== 'silver'`. (Will FAIL on unfixed code —
   mock data forces `weeklyVisits=2` → `silver`.)
2. **One Visit Test**: Simulate `loadLoyaltyData()` with `weeklyVisits=1`. Assert
   `visitTier === 'new'`. (Will FAIL on unfixed code — `weeklyVisits >= 1` → `bronze`.)
3. **Two Visits, Low Spend Test**: Simulate `completedVisits=2, averageSpend=1500,
   bronzeThreshold=3000`. Assert `visitTier === 'new'`. (Will FAIL on unfixed code —
   no spend check exists.)
4. **Hardcoded Threshold Test**: Simulate venue config with `bronzeThreshold=4000`.
   Assert classification uses `4000` not `3000`. (Will FAIL on unfixed code — hardcoded.)

**Expected Counterexamples**:
- `loadLoyaltyData()` assigns `visitTier = 'silver'` for a new customer because the mock
  API returns `weeklyVisits: 2` and the classification has no visit-count gate.
- Root cause confirmed: mock API + missing gate + hardcoded thresholds.

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function
produces the expected behavior (no tier icons).

**Pseudocode:**
```
FOR ALL X WHERE isBugCondition(X) DO
  result := renderLoyaltyIcons_fixed(X)
  ASSERT result = null
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed
function produces the same result as the original correct behavior.

**Pseudocode:**
```
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT renderLoyaltyIcons_original(X) = renderLoyaltyIcons_fixed(X)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking
because:
- It generates many `CustomerVenueContext` values automatically across the qualifying input
  domain (completedVisits >= 2, averageSpend >= bronzeThreshold).
- It catches edge cases (e.g., averageSpend exactly equal to threshold, very high spend,
  large visit counts) that manual unit tests might miss.
- It provides strong guarantees that qualifying guests are unaffected across all scenarios.

**Test Plan**: Observe the correct icon output for qualifying guests on unfixed code (where
the mock data happens to produce qualifying inputs), then write property-based tests that
assert the same output after the fix.

**Test Cases**:
1. **Bronze Preservation**: For `completedVisits >= 2, bronzeThreshold <= averageSpend < silverThreshold`,
   verify Bronze icons are still rendered after fix.
2. **Silver Preservation**: For `completedVisits >= 2, silverThreshold <= averageSpend < goldThreshold`,
   verify Silver icons are still rendered after fix.
3. **Gold Preservation**: For `completedVisits >= 2, averageSpend >= goldThreshold`,
   verify Gold icons are still rendered after fix.
4. **API Error Preservation**: Verify that when the visits API returns an error, no tier
   icons are shown (graceful degradation unchanged).
5. **spendTier Pricing Preservation**: Verify the `spendTier` state used for menu pricing
   is unaffected by the fix.

### Unit Tests

- Test `loadLoyaltyData()` classification logic in isolation with injected visit/spend data
  and venue config thresholds.
- Test `renderLoyaltyIcons()` returns `null` when `visitTier === 'new'`.
- Test the fixed `/api/loyalty/visits/[customer_id]` route returns real data (not mock).
- Test edge cases: `completedVisits=0`, `completedVisits=1`, `averageSpend` exactly equal
  to threshold, `averageSpend=0`.

### Property-Based Tests

- Generate random `CustomerVenueContext` values where `isBugCondition(X) = true` and assert
  `renderLoyaltyIcons` returns `null` (fix checking).
- Generate random qualifying contexts where `NOT isBugCondition(X)` and assert the correct
  tier icon count and type are rendered (preservation checking).
- Generate random venue configs with varying thresholds and assert classification uses the
  config values, not hardcoded constants.

### Integration Tests

- Test full flow: new customer connects to venue → no tier icons displayed.
- Test full flow: customer with 2+ qualifying visits connects → correct tier icons displayed.
- Test that switching venues resets tier display correctly.
- Test that the menu pricing layer (`spendTier`) continues to apply discounts correctly
  after the fix.
