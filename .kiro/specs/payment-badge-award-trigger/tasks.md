# Implementation Plan

## Overview

This bugfix addresses 4 root causes preventing badge awards after qualifying payments:
1. Payment status mismatch ('success' vs 'completed')
2. Timing issue with averageSpend calculation (excludes open tab payments)
3. Realtime subscription initialization issues
4. Silent API failures

**Files to Modify:**
- `app/menu/page.tsx` - Payment subscription handler and loadLoyaltyData()
- `app/api/loyalty/visits/[customer_id]/route.ts` - Include open tab payments in spend calculation

---

## Tasks

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Badge Not Awarded After Qualifying Payment
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: For deterministic bugs, scope the property to the concrete failing case(s) to ensure reproducibility
  - Test implementation details from Bug Condition in design:
    - Simulate payment INSERT event with status='success' and qualifying spend (KES 3,100 for Bronze)
    - Verify payment realtime subscription handler is called
    - Verify loadLoyaltyData() is called after payment INSERT
    - Verify badge award API is called with correct parameters (customer_id, bar_id, badge_level='bronze', spend_amount)
    - Verify badge is awarded and notification is shown
  - The test assertions should match the Expected Behavior Properties from design:
    - Badge award API called: `POST /api/loyalty/badge/award`
    - Badge awarded: customer_badges table updated
    - Notification shown: congratulations toast with sound/vibration
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found to understand root cause:
    - Payment status mismatch: handler checks 'success' but DB uses 'completed'
    - Timing issue: averageSpend not updated when loadLoyaltyData() called immediately
    - Subscription not established: payment events not detected
    - API call failing: badge award API returns error but caught silently
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 2.1, 2.2, 2.3, 2.4_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Non-Qualifying Payment Behavior
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-buggy inputs:
    - Failed payment events (status='failed') show error notification
    - Pending payment events (status='pending') show pending notification
    - Payments below badge threshold process normally without badge award attempt
    - Payments for customers who already have equal or higher badge process normally without duplicate award
    - Balance updates trigger correctly for all payment events
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements:
    - For all payment events where status != 'success' AND status != 'completed', no badge award API call is made
    - For all payment events where customer already has badge >= earned tier, no badge award API call is made
    - For all payment events where spend < threshold, no badge award API call is made
    - For all payment events, balance update notification is shown
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 3. Fix for badge not awarded after qualifying payment

  - [x] 3.1 Fix payment status check in subscription handler
    - Update payment status check to handle both 'success' AND 'completed' statuses
    - Location: `app/menu/page.tsx` line ~1262
    - Change: `payment?.status === 'success'` → `(payment?.status === 'success' || payment?.status === 'completed')`
    - Rationale: Database schema and visits API use 'completed' while handler checks for 'success'
    - _Bug_Condition: isBugCondition(input) where input.eventType === 'INSERT' AND (input.new.status === 'success' OR input.new.status === 'completed') AND customerQualifiesForBadgeUpgrade(input.new.tab_id, input.new.customer_id)_
    - _Expected_Behavior: Payment subscription handler detects both 'success' and 'completed' payment events and triggers badge recalculation_
    - _Preservation: Failed, pending, and cancelled payment events continue to be handled appropriately without triggering badge recalculation_
    - _Requirements: 1.1, 2.1, 3.5_

  - [x] 3.2 Add timing delay for averageSpend calculation
    - Add 2-second delay before calling loadLoyaltyData() to allow database to process payment and update aggregated spend calculations
    - Location: `app/menu/page.tsx` line ~1345
    - Change: `loadLoyaltyData();` → `setTimeout(() => loadLoyaltyData(), 2000);`
    - Rationale: Visits API calculates averageSpend based on COMPLETED tabs only (closed_at IS NOT NULL). If tab is still open when payment completes, new payment is not included in spend calculation
    - _Bug_Condition: isBugCondition(input) where loadLoyaltyData() is called immediately after payment INSERT and averageSpend does not include new payment_
    - _Expected_Behavior: loadLoyaltyData() is called after 2-second delay, ensuring visits API returns up-to-date spend data including new payment_
    - _Preservation: Badge upgrade detection from other contexts (tab load, manual refresh) continues to work as expected_
    - _Requirements: 1.2, 2.2, 3.2_

  - [x] 3.3 Include open tab payments in spend calculation
    - Modify visits API to include payments from CURRENT open tab (even if not closed) when calculating averageSpend
    - Location: `app/api/loyalty/visits/[customer_id]/route.ts` lines ~30-60
    - Implementation:
      - Query for current open tab: `tabs.select('id').eq('customer_id', customer_id).eq('bar_id', bar_id).is('closed_at', null).single()`
      - If open tab exists, query payments: `tab_payments.select('amount').eq('tab_id', openTab.id).eq('status', 'completed')`
      - Add open tab payments to totalSpend calculation
      - Recalculate averageSpend: `(totalSpend + openTabSpend) / (completedVisits + (openTabSpend > 0 ? 1 : 0))`
    - Rationale: Badge upgrade check uses most recent payment data, even if tab is still open
    - _Bug_Condition: isBugCondition(input) where averageSpend calculation excludes payments from current open tab_
    - _Expected_Behavior: averageSpend includes all payments from completed tabs AND current open tab, ensuring badge upgrade check uses most recent data_
    - _Preservation: Completed tab spend calculations remain unchanged; only open tab payments are added to calculation_
    - _Requirements: 1.2, 2.2, 3.1_

  - [x] 3.4 Add subscription initialization logging
    - Add debug logging to verify payment realtime subscription is properly established
    - Location: `app/menu/page.tsx` after line ~1250
    - Add: `console.log('💳 Payment subscription established:', { tabId: tab?.id, channelName: 'tab-payments-${tab?.id}' });`
    - Rationale: Helps diagnose if subscription is not established on page load or torn down after navigation/reconnection
    - _Bug_Condition: isBugCondition(input) where payment realtime subscription is not established or torn down_
    - _Expected_Behavior: Payment subscription is established on page load and remains active; debug logging confirms subscription status_
    - _Preservation: Existing subscription behavior unchanged; only adds logging for diagnostics_
    - _Requirements: 1.3, 2.1_

  - [x] 3.5 Enhance error logging in loadLoyaltyData()
    - Add detailed logging at each step of badge upgrade flow to identify exactly where process is failing in production
    - Location: `app/menu/page.tsx` lines ~600-750 in loadLoyaltyData()
    - Add console.log statements:
      - Before badge fetch: `console.log('🏆 Fetching global badge for customer:', customer_id);`
      - After badge fetch: `console.log('🏆 Global badge fetched:', badgeData);`
      - Before visits fetch: `console.log('📊 Fetching visits data for customer:', customer_id, 'at bar:', bar_id);`
      - After visits fetch: `console.log('📊 Visits data fetched:', visitsData);`
      - Before badge upgrade check: `console.log('🎉 Checking for badge upgrade:', { current: globalBadgeLevel, earned: earnedSpendTier });`
      - Before badge award API call: `console.log('🎉 Calling badge award API:', { customer_id, bar_id, badge_level: earnedSpendTier, spend_amount: averageSpend });`
      - After badge award API call: `console.log('✅ Badge award API response:', awardResult);`
    - Rationale: Detailed logging helps identify exactly where badge upgrade flow is failing in production
    - _Bug_Condition: isBugCondition(input) where badge upgrade flow fails silently without proper error context_
    - _Expected_Behavior: Each step of badge upgrade flow is logged with full context, making failures visible and debuggable_
    - _Preservation: Existing badge upgrade logic unchanged; only adds logging for diagnostics_
    - _Requirements: 1.4, 2.5_

  - [x] 3.6 Add retry logic for badge award API
    - If badge award API call fails, retry once after 3 seconds before showing error toast
    - Location: `app/menu/page.tsx` lines ~680-720 in loadLoyaltyData()
    - Implementation:
      - Wrap badge award API call in try/catch
      - On failure, log error and wait 3 seconds
      - Retry API call once
      - On second failure, show error toast and continue gracefully
    - Rationale: Handles transient network or database errors without blocking badge upgrade flow
    - _Bug_Condition: isBugCondition(input) where badge award API call fails due to transient error_
    - _Expected_Behavior: Badge award API call retries once after 3 seconds on failure; second failure shows error toast but continues gracefully_
    - _Preservation: Successful badge award API calls unchanged; only adds retry logic for failures_
    - _Requirements: 1.4, 2.4, 2.5_

  - [x] 3.7 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Badge Awarded After Qualifying Payment
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - Verify all assertions pass:
      - Payment subscription handler detects payment INSERT event
      - loadLoyaltyData() is called after payment INSERT
      - Badge award API is called with correct parameters
      - Badge is awarded (customer_badges table updated)
      - Notification is shown (congratulations toast with sound/vibration)
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [ ] 3.8 Verify preservation tests still pass
    - **Property 2: Preservation** - Non-Qualifying Payment Behavior
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Verify all preservation tests pass:
      - Failed payment events show error notification (no badge award attempt)
      - Pending payment events show pending notification (no badge award attempt)
      - Payments below threshold process normally (no badge award attempt)
      - Payments for customers with equal/higher badge process normally (no duplicate award)
      - Balance updates trigger correctly for all payment events
    - Confirm all tests still pass after fix (no regressions)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 4. Checkpoint - Ensure all tests pass
  - Run all tests (exploration + preservation)
  - Verify bug condition test passes (badge awarded after qualifying payment)
  - Verify preservation tests pass (non-qualifying payments unchanged)
  - Test in production with real payment flow:
    - Complete KES 3,100 payment (Bronze threshold)
    - Verify badge award notification appears
    - Verify badge is visible in menu header
    - Verify discount is applied to menu prices
  - Ask user if questions arise or additional testing is needed
