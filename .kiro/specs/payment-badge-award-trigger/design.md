# Payment Badge Award Trigger Bugfix Design

## Overview

The badge award system is not triggering after payment completion in production. While the implementation exists (payment realtime subscription handler → `loadLoyaltyData()` → badge upgrade detection → badge award API call), the badge is not being awarded when a customer completes a qualifying payment. This design analyzes the root causes and outlines a fix strategy to ensure badges are awarded reliably after every qualifying payment.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when a customer completes a payment that qualifies them for a badge upgrade (spend >= threshold), but the badge is not awarded
- **Property (P)**: The desired behavior when a qualifying payment completes - badge upgrade detection runs, API is called, badge is awarded, and notification is shown
- **Preservation**: Existing payment processing, order handling, and non-qualifying payment flows that must remain unchanged by the fix
- **loadLoyaltyData()**: The function in `app/menu/page.tsx` (lines ~600-750) that fetches badge status, calculates earned tier, detects upgrades, and calls the badge award API
- **Payment Realtime Subscription**: The Supabase realtime channel (`tab-payments-{id}`) that listens for payment INSERT/UPDATE events and triggers badge recalculation
- **averageSpend**: The average spend per completed visit at a venue, calculated by the `/api/loyalty/visits/[customer_id]` endpoint as `totalSpend / completedVisits`
- **earnedSpendTier**: The locally calculated badge tier based on averageSpend vs venue thresholds (bronze: 3000, silver: 10000, gold: 25000)
- **globalBadgeLevel**: The customer's current active badge from the `customer_badges` table, fetched via `/api/loyalty/badge/[customer_id]`

## Bug Details

### Bug Condition

The bug manifests when a customer completes a payment that qualifies them for a badge upgrade (e.g., KES 3,100 payment qualifying for Bronze badge with KES 3,000 threshold). The payment realtime subscription handler is either not detecting the payment INSERT event, not calling `loadLoyaltyData()`, or `loadLoyaltyData()` is failing to execute the badge upgrade detection and award logic.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type PaymentEvent (realtime subscription payload)
  OUTPUT: boolean
  
  RETURN input.eventType === 'INSERT'
         AND input.new.status === 'success'
         AND customerQualifiesForBadgeUpgrade(input.new.tab_id, input.new.customer_id)
         AND badgeNotAwarded(input.new.customer_id, expectedBadgeLevel)
END FUNCTION
```

### Examples

- **Example 1**: Customer completes KES 3,100 cash payment (Payment ID: f30e2df8-adac-4863-a56c-50072069b466) on Tab ID: 0b4d72c6-9cbc-4e66-9d90-0c4358818f38. Expected: Bronze badge awarded (threshold: KES 3,000). Actual: Badge NOT awarded.
- **Example 2**: Customer completes KES 10,500 M-Pesa payment qualifying for Silver badge. Expected: Silver badge awarded and notification shown. Actual: Badge NOT awarded, no notification.
- **Example 3**: Customer with Bronze badge completes KES 7,000 payment, bringing average spend to KES 10,200. Expected: Upgrade to Silver badge. Actual: Badge remains Bronze.
- **Edge Case**: Customer completes payment while offline, payment INSERT event arrives when app reconnects. Expected: Badge recalculation triggers on reconnect. Actual: May not trigger if subscription is not properly re-established.

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Payment processing for non-qualifying payments (below threshold, no upgrade) must continue to work exactly as before
- Payment notifications and balance updates must remain unchanged
- Order acceptance, rejection, and status updates must remain unchanged
- Badge display in menu header must continue to work for existing badges
- Discount application based on existing badges must remain unchanged

**Scope:**
All inputs that do NOT involve a qualifying payment completion (payment INSERT with status='success' that triggers badge upgrade) should be completely unaffected by this fix. This includes:
- Failed, pending, or cancelled payments
- Payments that do not qualify for badge upgrade (customer already has equal or higher badge)
- Order-related realtime events
- Tab status changes
- Message notifications

## Hypothesized Root Cause

Based on the bug description and code analysis, the most likely issues are:

1. **Payment Status Mismatch**: The payment realtime subscription handler checks for `payment.status === 'success'`, but the actual payment status in production may be `'completed'` instead of `'success'`. The visits API queries for `status = 'completed'` payments (line 47 of visits route), suggesting a schema inconsistency.

2. **Timing Issue - averageSpend Calculation**: The `loadLoyaltyData()` function is called immediately after payment INSERT, but the visits API calculates `averageSpend` based on COMPLETED tabs only (`closed_at IS NOT NULL`). If the tab is still open when the payment completes, the new payment is not included in the spend calculation, causing the badge upgrade check to use stale data.

3. **Realtime Subscription Not Established**: The payment realtime subscription may not be properly established on page load, or may be torn down and not re-established after navigation/reconnection. The subscription depends on `tab?.id` being available, which may not be set immediately on mount.

4. **Silent API Failure**: The badge award API call (`POST /api/loyalty/badge/award`) may be failing due to validation errors (invalid spend_amount, missing fields) or database errors, but the error handling in `loadLoyaltyData()` catches and logs the error without retrying or alerting the user prominently.

## Correctness Properties

Property 1: Bug Condition - Badge Award After Qualifying Payment

_For any_ payment INSERT event where the payment status is 'success' or 'completed' and the customer's updated spend qualifies them for a badge upgrade (earned tier rank > current badge rank), the system SHALL call the badge award API with correct parameters (customer_id, bar_id, badge_level, spend_amount), award the badge, update global badge state, and show a congratulations notification with sound/vibration if enabled.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

Property 2: Preservation - Non-Qualifying Payment Behavior

_For any_ payment event that does NOT qualify for a badge upgrade (payment status is not success/completed, customer already has equal or higher badge, or spend is below threshold), the system SHALL process the payment normally without attempting badge award, preserving all existing payment notification and balance update behavior.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `app/menu/page.tsx`

**Function**: Payment realtime subscription handler (lines ~1247-1350)

**Specific Changes**:
1. **Fix Payment Status Check**: Update the payment status check to handle both `'success'` AND `'completed'` statuses, since the database schema and visits API use `'completed'` while the handler checks for `'success'`.
   - Change: `payment?.status === 'success'` → `(payment?.status === 'success' || payment?.status === 'completed')`
   - Location: Line ~1262

2. **Add Timing Delay for averageSpend Calculation**: Add a 2-second delay before calling `loadLoyaltyData()` to allow the database to process the payment and update aggregated spend calculations. This ensures the visits API returns up-to-date spend data.
   - Change: `loadLoyaltyData();` → `setTimeout(() => loadLoyaltyData(), 2000);`
   - Location: Line ~1345

3. **Add Subscription Initialization Guard**: Verify that the payment realtime subscription is properly established by adding debug logging and a connection status check before relying on payment events.
   - Change: Add `console.log('💳 Payment subscription established:', { tabId: tab?.id, channelName: 'tab-payments-${tab?.id}' });` after subscription setup
   - Location: After line ~1250

4. **Enhance Error Logging in loadLoyaltyData()**: Add more detailed logging at each step of the badge upgrade flow to identify exactly where the process is failing in production.
   - Change: Add `console.log` statements before and after each API call (badge fetch, visits fetch, badge award)
   - Location: Lines ~600-750 in `loadLoyaltyData()`

5. **Add Retry Logic for Badge Award API**: If the badge award API call fails, retry once after 3 seconds before showing the error toast. This handles transient network or database errors.
   - Change: Wrap badge award API call in a retry function with exponential backoff
   - Location: Lines ~680-720 in `loadLoyaltyData()`

**File**: `app/api/loyalty/visits/[customer_id]/route.ts`

**Function**: GET handler

**Specific Changes**:
6. **Include Open Tab Payments in Spend Calculation**: Modify the visits API to include payments from the CURRENT open tab (even if not closed) when calculating `averageSpend`. This ensures the badge upgrade check uses the most recent payment data.
   - Change: Add a second query for open tabs with payments, combine with completed tabs for spend calculation
   - Location: Lines ~30-60

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write tests that simulate payment INSERT events with qualifying spend amounts and assert that the badge award API is called and the badge is awarded. Run these tests on the UNFIXED code to observe failures and understand the root cause.

**Test Cases**:
1. **Bronze Qualification Test**: Simulate KES 3,100 payment INSERT event for customer with no badge (will fail on unfixed code - badge not awarded)
2. **Silver Upgrade Test**: Simulate KES 7,000 payment for customer with Bronze badge, bringing average to KES 10,200 (will fail on unfixed code - no upgrade)
3. **Payment Status Mismatch Test**: Simulate payment INSERT with status='completed' instead of 'success' (will fail on unfixed code - handler doesn't recognize 'completed')
4. **Timing Issue Test**: Call loadLoyaltyData() immediately after payment INSERT and verify averageSpend includes new payment (will fail on unfixed code - stale data)

**Expected Counterexamples**:
- Badge award API is not called when qualifying payment completes
- Possible causes: payment status mismatch ('completed' vs 'success'), timing issue (averageSpend not updated), subscription not established, API call failing silently

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL paymentEvent WHERE isBugCondition(paymentEvent) DO
  result := handlePaymentInsert_fixed(paymentEvent)
  ASSERT badgeAwardAPICalled(result)
  ASSERT badgeAwarded(result.customer_id, result.expectedBadgeLevel)
  ASSERT notificationShown(result)
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL paymentEvent WHERE NOT isBugCondition(paymentEvent) DO
  ASSERT handlePaymentInsert_original(paymentEvent) = handlePaymentInsert_fixed(paymentEvent)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for non-qualifying payments (failed, pending, below threshold), then write property-based tests capturing that behavior.

**Test Cases**:
1. **Failed Payment Preservation**: Observe that failed payment events show error notification on unfixed code, then write test to verify this continues after fix
2. **Below Threshold Preservation**: Observe that payments below badge threshold process normally without badge award attempt on unfixed code, then write test to verify this continues after fix
3. **Existing Badge Preservation**: Observe that payments for customers who already have the earned badge level process normally without duplicate award on unfixed code, then write test to verify this continues after fix
4. **Balance Update Preservation**: Observe that payment INSERT events trigger balance updates correctly on unfixed code, then write test to verify this continues after fix

### Unit Tests

- Test payment status check handles both 'success' and 'completed' statuses
- Test timing delay allows averageSpend to update before badge check
- Test badge award API retry logic handles transient failures
- Test error logging captures all failure points in badge upgrade flow

### Property-Based Tests

- Generate random payment amounts and customer badge states to verify badge upgrade logic works correctly across all qualifying scenarios
- Generate random payment statuses (failed, pending, cancelled) to verify preservation of non-qualifying payment handling
- Test that all payment events trigger appropriate notifications (success, failure, upgrade) across many scenarios

### Integration Tests

- Test full payment flow from INSERT event → loadLoyaltyData() → badge award API → notification display
- Test payment completion while offline, verify badge award triggers on reconnection
- Test rapid successive payments, verify each triggers badge recalculation correctly
- Test payment completion with concurrent order updates, verify no race conditions
