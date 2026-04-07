# Bug Condition Exploration - Counterexamples Found

**Test Date**: 2025-01-XX  
**Test Status**: ✅ PASSED (test failed as expected, confirming bug exists)  
**Spec**: venue-specific-badge-threshold-fix  
**Task**: Task 1 - Write bug condition exploration test

---

## Summary

The bug condition exploration test successfully demonstrated that the venue-specific badge threshold bug exists in the unfixed code. All 6 test cases failed as expected, surfacing multiple counterexamples that prove customers are receiving incorrect badge tiers.

---

## Root Cause Confirmed

The test confirms the hypothesized root cause from the design document:

**Current (Buggy) Code:**
```typescript
// Hardcoded system-wide thresholds in loadLoyaltyData()
if (averageSpend >= 25000)     earnedSpendTier = 'gold';
else if (averageSpend >= 10000) earnedSpendTier = 'silver';
else if (averageSpend >= 3000)  earnedSpendTier = 'bronze';
```

**Expected (Fixed) Code:**
```typescript
// Should use venue-specific thresholds from API response
if (averageSpend >= thresholds.gold)     earnedSpendTier = 'gold';
else if (averageSpend >= thresholds.silver) earnedSpendTier = 'silver';
else if (averageSpend >= thresholds.bronze)  earnedSpendTier = 'bronze';
```

---

## Counterexamples Found

### 1. Concrete Popos Case (Reported Bug)

**Test Case**: Customer at Popos venue spending KES 5,480

```
Venue: Popos (438c80c1-fe11-4ac5-8a48-2fc45104ba31)
Customer Average Spend: KES 5,480
Venue Silver Threshold: KES 5,000
System Silver Threshold: KES 10,000
Expected Badge Tier: silver
Actual Badge Tier: bronze
❌ Customer should receive Silver but gets Bronze
```

**Analysis**: Customer's spend (5,480) meets the venue's Silver threshold (5,000) but falls below the hardcoded system threshold (10,000), resulting in incorrect Bronze badge assignment.

---

### 2. Silver Tier Counterexamples

#### Example A: Spend = 6,806
```
🐛 Counterexample: spend=6,806, expected=silver, actual=bronze
```

**Analysis**: Customer spending KES 6,806 at Popos should receive Silver badge (6,806 >= 5,000 venue threshold) but receives Bronze (6,806 < 10,000 system threshold).

#### Example B: Exact Boundary - Spend = 5,000
```
🐛 Counterexample: spend=5,000, expected=silver, actual=bronze
```

**Analysis**: Customer spending exactly at the venue Silver threshold (5,000) should receive Silver badge but receives Bronze. This is a critical boundary case.

#### Property-Based Test Shrunk Counterexample
```
Counterexample: [{
  "barId": "438c80c1-fe11-4ac5-8a48-2fc45104ba31",
  "customerId": "00000000-0000-1000-8000-000000000000",
  "averageSpend": 5000,
  "venueThresholds": {
    "bronze": 3000,
    "silver": 5000,
    "gold": 15000
  }
}]
Shrunk 5 time(s)
```

**Analysis**: fast-check's shrinking algorithm identified the minimal failing case: spend exactly at venue threshold (5,000). This is the simplest counterexample that demonstrates the bug.

---

### 3. Gold Tier Counterexamples

#### Example A: Spend = 18,245
```
🐛 Gold tier bug: spend=18,245, expected=gold, actual=silver
```

**Analysis**: Customer spending KES 18,245 at Popos should receive Gold badge (18,245 >= 15,000 venue threshold) but receives Silver (18,245 < 25,000 system threshold).

#### Example B: Exact Boundary - Spend = 15,000
```
🐛 Gold tier bug: spend=15,000, expected=gold, actual=silver
```

**Analysis**: Customer spending exactly at the venue Gold threshold (15,000) should receive Gold badge but receives Silver. Another critical boundary case.

#### Property-Based Test Shrunk Counterexample
```
Counterexample: [{
  "barId": "438c80c1-fe11-4ac5-8a48-2fc45104ba31",
  "customerId": "00000000-0000-1000-8000-000000000000",
  "averageSpend": 15000,
  "venueThresholds": {
    "bronze": 3000,
    "silver": 5000,
    "gold": 15000
  }
}]
Shrunk 5 time(s)
```

**Analysis**: Minimal failing case for Gold tier: spend exactly at venue threshold (15,000).

---

## Test Results Summary

### All Tests Failed (As Expected)

```
FAIL  __tests__/loyalty/venue-badge-threshold.test.ts

Property 1: Bug Condition - Venue-Specific Badge Tier Assignment
  Concrete Failing Case - Popos Venue
    ✕ should award Silver badge for customer spending 5,480 at Popos (6 ms)
    ✕ should demonstrate the bug: customer receives wrong tier (43 ms)
  Property-Based Test - Bug Condition Across Multiple Scenarios
    ✕ should correctly assign badge tier for ANY customer (31 ms)
    ✕ should correctly assign Gold badge (18 ms)
  Edge Cases - Bug Condition Boundary Testing
    ✕ should handle exact threshold boundary (1 ms)
    ✕ should handle spend just below system threshold (5 ms)

Test Suites: 1 failed, 1 total
Tests:       6 failed, 6 total
Time:        1.527 s
```

---

## Bug Impact Analysis

### Affected Customers

Any customer at a venue with custom thresholds lower than system defaults:

1. **Silver Tier Gap**: Customers spending between venue Silver (e.g., 5,000) and system Silver (10,000)
   - Receive Bronze instead of Silver
   - Miss out on Silver discount percentage (min 3%)
   - Do not see Silver badge notification

2. **Gold Tier Gap**: Customers spending between venue Gold (e.g., 15,000) and system Gold (25,000)
   - Receive Silver instead of Gold
   - Miss out on Gold discount percentage (min 5%)
   - Do not see Gold badge notification

### Business Impact

- **Revenue Loss**: Customers not receiving earned discounts may feel undervalued
- **Customer Experience**: No badge upgrade notifications reduce engagement
- **Venue Autonomy**: Venues cannot effectively use custom thresholds to reward loyalty
- **Trust**: Customers may notice incorrect pricing compared to venue's advertised thresholds

---

## Validation Criteria

### When Fix is Implemented

This same test must PASS after the fix, with all assertions succeeding:

```
PASS  __tests__/loyalty/venue-badge-threshold.test.ts

Property 1: Bug Condition - Venue-Specific Badge Tier Assignment
  Concrete Failing Case - Popos Venue
    ✓ should award Silver badge for customer spending 5,480 at Popos
    ✓ should demonstrate the bug: customer receives wrong tier
  Property-Based Test - Bug Condition Across Multiple Scenarios
    ✓ should correctly assign badge tier for ANY customer (100 runs)
    ✓ should correctly assign Gold badge (50 runs)
  Edge Cases - Bug Condition Boundary Testing
    ✓ should handle exact threshold boundary
    ✓ should handle spend just below system threshold

Test Suites: 1 passed, 1 total
Tests:       6 passed, 6 total
```

---

## Next Steps

1. ✅ **Task 1 Complete**: Bug condition exploration test written and run
2. ✅ **Counterexamples Documented**: Multiple failing cases identified
3. ⏭️ **Task 2**: Write preservation property tests (before implementing fix)
4. ⏭️ **Task 3**: Implement the fix
   - Update API route to return venue thresholds
   - Update frontend to use venue thresholds
   - Add tier upgrade notifications
   - Trigger recalculation after payment
5. ⏭️ **Task 3.5**: Re-run this test - should PASS
6. ⏭️ **Task 3.6**: Verify preservation tests still pass

---

## Technical Notes

- Test uses `fast-check` property-based testing library
- Shrinking algorithm successfully identified minimal counterexamples
- Test is deterministic and reproducible
- All counterexamples are logged for debugging
- Test encodes expected behavior, will validate fix when implemented

---

**Status**: ✅ Task 1 Complete - Bug confirmed, counterexamples documented
