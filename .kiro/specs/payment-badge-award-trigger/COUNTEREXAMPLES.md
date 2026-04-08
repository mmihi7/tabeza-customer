# Bug Condition Exploration - Counterexamples Found

## Test Execution Date
2026-04-08

## Test Results Summary
- **Total Tests**: 3
- **Failed (Expected)**: 2
- **Passed**: 1

## Counterexamples Discovered

### Counterexample 1: Badge Award API Not Called
**Test**: Should award Bronze badge after KES 3,100 payment

**Expected Behavior**:
- Badge award API (`POST /api/loyalty/badge/award`) should be called after qualifying payment
- API should be called with correct parameters (customer_id, bar_id, badge_level='bronze', spend_amount=3100)

**Actual Behavior**:
- Badge award API was NOT called (0 calls detected)
- `expect(badgeAwardCalls.length).toBeGreaterThan(0)` failed
- Received: 0, Expected: > 0

**Root Cause Hypothesis**:
- Payment realtime subscription handler may not be calling `loadLoyaltyData()`
- OR `loadLoyaltyData()` is not executing the badge upgrade detection logic
- OR badge upgrade detection is not calling the badge award API

**Requirements Violated**: 2.1, 2.3

---

### Counterexample 2: Open Tab Payments Excluded from averageSpend
**Test**: Should include open tab payments in averageSpend calculation

**Expected Behavior**:
- `averageSpend` should include payments from current open tab
- For a customer with KES 3,100 payment on open tab, averageSpend should be >= 3000

**Actual Behavior**:
- `averageSpend` returned 0 (excludes open tab payment)
- `expect(visitsData.averageSpend).toBeGreaterThanOrEqual(3000)` failed
- Received: 0, Expected: >= 3000

**Root Cause Confirmed**:
- Visits API (`/api/loyalty/visits/[customer_id]`) calculates averageSpend from COMPLETED tabs only (`closed_at IS NOT NULL`)
- If tab is still open when payment completes, new payment is not included in spend calculation
- This causes badge upgrade check to use stale data, preventing badge award

**Requirements Violated**: 2.2

---

### Test Passed: Payment Status Recognition
**Test**: Should handle "completed" payment status

**Result**: PASSED

**Observation**:
- The test logic correctly recognizes both 'success' and 'completed' statuses
- However, this doesn't confirm the actual payment subscription handler in `app/menu/page.tsx` handles both statuses
- Need to verify the handler code directly

---

## Confirmed Root Causes

Based on the counterexamples, we have confirmed 2 of the 4 hypothesized root causes:

1. ✅ **CONFIRMED**: Timing issue with averageSpend calculation
   - Visits API excludes open tab payments
   - Badge upgrade check uses stale data
   - Fix: Include open tab payments in spend calculation

2. ✅ **CONFIRMED**: Badge award API not being called
   - Either subscription handler not calling loadLoyaltyData()
   - OR loadLoyaltyData() not executing badge upgrade logic
   - OR badge upgrade detection not calling API
   - Fix: Verify and fix the call chain

3. ⚠️ **NEEDS VERIFICATION**: Payment status mismatch
   - Test logic handles both statuses correctly
   - Need to verify actual handler code in `app/menu/page.tsx` line ~1262
   - Fix: Update handler to check for both 'success' and 'completed'

4. ⚠️ **NEEDS VERIFICATION**: Realtime subscription initialization
   - Cannot test subscription establishment in unit test
   - Need to add logging and verify in production
   - Fix: Add subscription initialization logging

---

## Next Steps

1. ✅ Task 1 Complete: Bug condition exploration test written and run
2. ⏭️ Task 2: Write preservation property tests (before implementing fix)
3. ⏭️ Task 3: Implement fixes for confirmed root causes
4. ⏭️ Task 3.7: Re-run exploration test to verify it passes after fix

---

## Test Output

```
FAIL  __tests__/payment-badge-award-trigger.test.ts
  Bug Condition: Badge Not Awarded After Qualifying Payment
    × EXPLORATION TEST: Should award Bronze badge after KES 3,100 payment (EXPECTED TO FAIL ON UNFIXED CODE) (3 ms)
    √ EXPLORATION TEST: Should handle "completed" payment status (EXPECTED TO FAIL ON UNFIXED CODE) (3 ms)
    × EXPLORATION TEST: Should include open tab payments in averageSpend calculation (EXPECTED TO FAIL ON UNFIXED CODE) (1 ms)

Test Suites: 1 failed, 1 total
Tests:       2 failed, 1 passed, 3 total
Time:        0.834 s
```

---

**Status**: Counterexamples documented, root causes confirmed, ready to proceed with preservation tests and implementation.
