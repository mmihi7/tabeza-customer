# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Ineligible Guest Shown Loyalty Tier
  - **CRITICAL**: This test MUST FAIL on unfixed code — failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior — it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists across all three root causes
  - **Scoped PBT Approach**: Scope the property to the concrete failing cases:
    - `completedVisits=0` (new customer, mock API returns `weeklyVisits: 2` → forces Silver)
    - `completedVisits=1` (one visit, `weeklyVisits >= 1` → forces Bronze)
    - `completedVisits=2, averageSpend=1500, bronzeThreshold=3000` (below threshold, no spend check)
    - `completedVisits=2, averageSpend=3500, bronzeThreshold=4000` (venue config ignored, hardcoded 3000 used)
  - Test file: `app/menu/__tests__/bug-condition-exploration.test.ts`
  - For each case, inline the buggy `loadLoyaltyData()` classification logic and mock API response, then assert `visitTier !== 'bronze'` and `visitTier !== 'silver'` and `visitTier !== 'gold'`
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct — it proves the bug exists)
  - Document counterexamples found (e.g., "new customer gets `visitTier='silver'` because mock API returns `weeklyVisits: 2`")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [x] 2. Fix the visits API route — replace mock data with real Supabase query
  - File: `app/api/loyalty/visits/[customer_id]/route.ts`
  - Replace the hardcoded mock response (`{ totalVisits: 2, weeklyVisits: 2, visitTier: 'bronze' }`) with a real Supabase query
  - Query completed (paid/closed) tabs for `customer_id` at the specific venue (pass `bar_id` as a query param)
  - Return `completedVisits` (count of closed tabs at the venue) and `averageSpend` (total spend ÷ completedVisits, or 0 if no visits)
  - Do NOT return a `visitTier` from the API — tier classification belongs in `loadLoyaltyData()`, not the route
  - _Bug_Condition: isBugCondition(X) where mock data fabricates completedVisits and visitTier for every customer_
  - _Requirements: 2.3_

- [x] 3. Fix `loadLoyaltyData()` classification logic
  - File: `app/menu/page.tsx`, function: `loadLoyaltyData()`
  - **Sub-tasks:**

  - [x] 3.1 Add 2-visit minimum gate
    - Before assigning any tier, check `completedVisits >= 2`
    - If `completedVisits < 2`, set `visitTier = 'new'` and return early — no tier assigned
    - _Bug_Condition: isBugCondition(X) where X.completedVisits < 2_
    - _Expected_Behavior: visitTier = 'new', renderLoyaltyIcons returns null_
    - _Requirements: 2.1, 2.2, 2.4_

  - [x] 3.2 Read thresholds from venue config (`bars` table)
    - Fetch `bronze_threshold`, `silver_threshold`, and `gold_threshold` from the `bars` table for `tab.bar_id`
    - Replace all hardcoded constants (`3000`, `5000`, `15000`) with the fetched venue config values
    - _Bug_Condition: isBugCondition(X) where hardcoded thresholds ignore venue configuration_
    - _Requirements: 2.7_

  - [x] 3.3 Add average spend check and update tier classification
    - Compute `averageSpend = totalSpend / completedVisits` (use 0 if completedVisits is 0)
    - Replace `weeklyVisits`-based classification with `averageSpend`-based classification against venue thresholds:
      - `averageSpend >= goldThreshold` → `'gold'`
      - `averageSpend >= silverThreshold` → `'silver'`
      - `averageSpend >= bronzeThreshold` → `'bronze'`
      - otherwise → `'new'`
    - _Bug_Condition: isBugCondition(X) where X.completedVisits >= 2 AND X.averageSpend < X.bronzeThreshold_
    - _Expected_Behavior: visitTier = 'new', renderLoyaltyIcons returns null_
    - _Preservation: customers with completedVisits >= 2 and averageSpend >= bronzeThreshold continue to see correct tier icons_
    - _Requirements: 2.4, 2.5, 2.6, 2.7, 3.1, 3.2, 3.3_

  - [x] 3.4 Do NOT touch the `spendTier` useEffect
    - The separate `useEffect` that loads `spendTier` for menu pricing must remain completely unchanged
    - _Preservation: spendTier pricing layer operates independently — Requirement 3.5_
    - _Requirements: 3.5, 3.7_

- [x] 4. Fix `renderLoyaltyIcons()` null guard
  - File: `app/menu/page.tsx`, function: `renderLoyaltyIcons()`
  - Add an explicit early return of `null` when `visitTier === 'new'`, in addition to the existing `!loyaltyData` guard
  - This ensures no icons are rendered for ineligible guests even if `loyaltyData` is set
  - _Bug_Condition: isBugCondition(X) — visitTier is 'new' but icons may still render without this guard_
  - _Expected_Behavior: renderLoyaltyIcons returns null for all inputs where isBugCondition(X) = true_
  - _Requirements: 2.8_

- [x] 5. Write fix-checking and preservation property-based tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Qualifying Guest Tier Display Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - Test file: `app/menu/__tests__/loyalty-tier-classification.test.ts`
  - **Fix-checking (Property 1 re-run):**
    - Re-run the exploration test from task 1 on FIXED code
    - **Property 1: Expected Behavior** — for all inputs where `isBugCondition(X) = true`, assert `renderLoyaltyIcons` returns `null`
    - Use fast-check to generate random `CustomerVenueContext` values where `completedVisits < 2` OR `(completedVisits >= 2 AND averageSpend < bronzeThreshold)`
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 2.1, 2.2, 2.4, 2.5, 2.6, 2.8_
  - **Preservation (Property 2):**
    - Observe correct icon output for qualifying guests on unfixed code (where mock data produces qualifying inputs)
    - Write property-based tests using fast-check:
      - Bronze: for all `completedVisits >= 2, bronzeThreshold <= averageSpend < silverThreshold` → Bronze icons rendered
      - Silver: for all `completedVisits >= 2, silverThreshold <= averageSpend < goldThreshold` → Silver icons rendered
      - Gold: for all `completedVisits >= 2, averageSpend >= goldThreshold` → Gold icons rendered
      - API error: visits API returns error → no tier icons (graceful degradation unchanged)
      - Venue config thresholds: classification uses fetched thresholds, not hardcoded constants
    - Verify preservation tests PASS on UNFIXED code before implementing the fix
    - **EXPECTED OUTCOME**: Preservation tests PASS on both unfixed and fixed code (confirms no regressions)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.6_

- [x] 6. Checkpoint — Ensure all tests pass
  - Re-run the bug condition exploration test from task 1 — **EXPECTED OUTCOME**: PASSES (bug is fixed)
  - Re-run the preservation property tests from task 5 — **EXPECTED OUTCOME**: PASSES (no regressions)
  - Confirm the `spendTier` pricing layer is unaffected (task 3.4 preserved)
  - Ensure all tests pass; ask the user if questions arise
