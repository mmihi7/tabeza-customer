# Venue-Specific Badge Threshold Bug Condition Exploration Test

## Overview

This directory contains the bug condition exploration test for the venue-specific badge threshold fix (Task 1 of the bugfix spec).

## Test File

`venue-badge-threshold.test.ts` - Property-based test that demonstrates the bug exists on unfixed code.

## Purpose

**CRITICAL**: This test MUST FAIL on unfixed code. Failure confirms the bug exists.

The test encodes the **expected behavior** - it will validate the fix when it passes after implementation.

## Bug Description

Customers at venues with custom badge thresholds are not receiving correct badge tiers when their spend meets venue-specific thresholds but falls below system-wide thresholds.

### Concrete Failing Case

- **Venue**: Popos (bar_id: `438c80c1-fe11-4ac5-8a48-2fc45104ba31`)
- **Customer Average Spend**: KES 5,480
- **Venue Silver Threshold**: KES 5,000 (custom, lower than system default)
- **System Silver Threshold**: KES 10,000 (hardcoded in current code)
- **Expected Behavior**: Customer should receive **Silver** badge (5,480 >= 5,000)
- **Actual Behavior on Unfixed Code**: Customer receives **Bronze** badge (5,480 < 10,000)

## Running the Test

### Option 1: Using npm/pnpm scripts

```bash
cd tabeza-customer
pnpm test __tests__/loyalty/venue-badge-threshold.test.ts
```

### Option 2: Using the provided scripts

**On Unix/Linux/Mac:**
```bash
./run-venue-badge-test.sh
```

**On Windows:**
```cmd
run-venue-badge-test.bat
```

### Option 3: Using Jest directly

```bash
cd tabeza-customer
npx jest __tests__/loyalty/venue-badge-threshold.test.ts
```

## Expected Test Results

### On UNFIXED Code (Current State)

The test **MUST FAIL** with output similar to:

```
🐛 BUG COUNTEREXAMPLE FOUND:
   Venue: Popos (438c80c1-fe11-4ac5-8a48-2fc45104ba31)
   Customer Average Spend: KES 5,480
   Venue Silver Threshold: KES 5,000
   System Silver Threshold: KES 10,000
   Expected Badge Tier: silver
   Actual Badge Tier: bronze
   ❌ Customer should receive Silver but gets Bronze

FAIL __tests__/loyalty/venue-badge-threshold.test.ts
  Property 1: Bug Condition - Venue-Specific Badge Tier Assignment
    Concrete Failing Case - Popos Venue
      ✕ should award Silver badge for customer spending 5,480 at Popos
      ✕ should demonstrate the bug: customer receives wrong tier
    Property-Based Test - Bug Condition Across Multiple Scenarios
      ✕ should correctly assign badge tier for ANY customer whose spend meets venue threshold
      ✕ should correctly assign Gold badge for spend meeting venue Gold threshold
    Edge Cases - Bug Condition Boundary Testing
      ✕ should handle exact threshold boundary
      ✕ should handle spend just below system threshold but above venue threshold
```

### After Fix Implementation (Task 3)

The test **MUST PASS** with output similar to:

```
PASS __tests__/loyalty/venue-badge-threshold.test.ts
  Property 1: Bug Condition - Venue-Specific Badge Tier Assignment
    Concrete Failing Case - Popos Venue
      ✓ should award Silver badge for customer spending 5,480 at Popos
      ✓ should demonstrate the bug: customer receives wrong tier
    Property-Based Test - Bug Condition Across Multiple Scenarios
      ✓ should correctly assign badge tier for ANY customer whose spend meets venue threshold (100 runs)
      ✓ should correctly assign Gold badge for spend meeting venue Gold threshold (50 runs)
    Edge Cases - Bug Condition Boundary Testing
      ✓ should handle exact threshold boundary
      ✓ should handle spend just below system threshold but above venue threshold
```

## Test Structure

### 1. Concrete Failing Cases

Tests the specific Popos scenario reported in the bug:
- Customer spending KES 5,480
- Venue Silver threshold of KES 5,000
- Demonstrates the gap between expected (Silver) and actual (Bronze) behavior

### 2. Property-Based Tests

Uses `fast-check` to generate 100+ test cases covering:
- Various spend amounts between venue and system thresholds
- Silver tier gaps (5,000 - 9,999)
- Gold tier gaps (15,000 - 24,999)
- Boundary conditions

### 3. Edge Cases

Tests boundary conditions:
- Spend exactly at venue threshold (5,000)
- Spend just below system threshold (9,999)
- Spend at various points in the gap

## Bug Condition Function

The test implements the formal bug condition from the design document:

```typescript
function isBugCondition(input: BugConditionInput): boolean {
  const SYSTEM_THRESHOLDS = { bronze: 3000, silver: 10000, gold: 25000 };
  
  return (
    (input.averageSpend >= input.venueThresholds.silver && 
     input.averageSpend < SYSTEM_THRESHOLDS.silver) ||
    (input.averageSpend >= input.venueThresholds.gold && 
     input.averageSpend < SYSTEM_THRESHOLDS.gold) ||
    (input.averageSpend >= input.venueThresholds.bronze && 
     input.averageSpend < SYSTEM_THRESHOLDS.bronze)
  );
}
```

## Counterexamples

When run on unfixed code, the test will surface counterexamples like:

```
🐛 Counterexample: spend=5480, expected=silver, actual=bronze
🐛 Counterexample: spend=7250, expected=silver, actual=bronze
🐛 Counterexample: spend=9999, expected=silver, actual=bronze
🐛 Gold tier bug: spend=18000, expected=gold, actual=silver
🐛 Gold tier bug: spend=22500, expected=gold, actual=silver
```

These counterexamples demonstrate:
1. The bug exists across a range of spend amounts
2. The bug affects both Silver and Gold tiers
3. The bug is deterministic and reproducible

## Requirements Validated

This test validates the following requirements from `bugfix.md`:

- **1.1**: System uses hardcoded thresholds instead of venue-specific values
- **1.2**: Badge tier calculation in `loadLoyaltyData()` uses hardcoded comparisons
- **2.1**: Expected behavior - system should use venue-specific thresholds
- **2.2**: Expected behavior - badge tier calculation should read from `bars` table

## Next Steps

1. **DO NOT fix the code yet** - the test is supposed to fail
2. Document the counterexamples found (this confirms the bug exists)
3. Proceed to Task 2: Write preservation property tests
4. After Tasks 1 and 2 are complete, implement the fix (Task 3)
5. Re-run this test after the fix - it should pass

## Notes

- This is a **bug condition exploration test** - it's designed to fail on unfixed code
- The test encodes the **correct expected behavior**
- When the fix is implemented, this same test will validate the fix works correctly
- The test uses property-based testing to generate many test cases automatically
- Counterexamples are logged to help understand the bug's scope and impact
