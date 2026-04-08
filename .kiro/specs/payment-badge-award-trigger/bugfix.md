# Bugfix Requirements Document

## Introduction

After a customer completes a payment that qualifies them for a badge upgrade (e.g., KES 3,100 payment qualifying for Bronze badge with KES 3,000 threshold), the badge is not being awarded automatically. The payment completes successfully and is recorded in the database, but the badge recalculation and award flow is not triggered as expected.

**Affected Payment:**
- Payment ID: f30e2df8-adac-4863-a56c-50072069b466
- Tab ID: 0b4d72c6-9cbc-4e66-9d90-0c4358818f38
- Amount: KES 3,100 (cash)
- Qualifies for: Bronze badge (threshold: KES 3,000)
- Result: Badge NOT awarded

**Expected Flow:**
1. Payment INSERT event detected via realtime subscription
2. `loadLoyaltyData()` called to recalculate badge eligibility
3. Badge upgrade detected (earned tier > current badge)
4. Badge award API called (`POST /api/loyalty/badge/award`)
5. Badge awarded and notification shown to customer

**Current State:**
The implementation exists in `app/menu/page.tsx`:
- Payment realtime subscription handler is set up (lines ~1000-1100)
- Handler calls `loadLoyaltyData()` after successful payment (line ~1095)
- `loadLoyaltyData()` includes badge upgrade detection and award logic (lines ~600-750)

However, the badge award is not occurring in production, suggesting the implementation is incomplete or not functioning correctly.

---

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a customer completes a payment that qualifies them for a badge upgrade THEN the payment realtime subscription handler does not trigger badge recalculation

1.2 WHEN `loadLoyaltyData()` is called after payment completion THEN the badge upgrade detection logic does not execute or fails silently

1.3 WHEN badge upgrade is detected in `loadLoyaltyData()` THEN the badge award API call (`POST /api/loyalty/badge/award`) is not made or fails without proper error handling

1.4 WHEN the badge award flow fails THEN no error is logged or shown to the customer, making the issue invisible

### Expected Behavior (Correct)

2.1 WHEN a customer completes a payment that qualifies them for a badge upgrade THEN the payment realtime subscription handler SHALL call `loadLoyaltyData()` immediately after detecting the successful payment INSERT event

2.2 WHEN `loadLoyaltyData()` is called after payment completion THEN the function SHALL fetch current badge status, calculate earned tier based on updated spend, and detect if an upgrade is warranted

2.3 WHEN badge upgrade is detected (earned tier rank > current badge rank) THEN the system SHALL call `POST /api/loyalty/badge/award` with correct parameters (customer_id, bar_id, badge_level, spend_amount)

2.4 WHEN the badge award API returns success with `upgraded: true` THEN the system SHALL update global badge state, show congratulations notification, and trigger sound/vibration if enabled

2.5 WHEN the badge award flow encounters an error THEN the system SHALL log the error with full context and show a user-friendly error message while continuing gracefully

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a customer completes a payment that does NOT qualify for a badge upgrade THEN the system SHALL CONTINUE TO process the payment normally without attempting badge award

3.2 WHEN `loadLoyaltyData()` is called from other contexts (tab load, manual refresh) THEN the function SHALL CONTINUE TO work as expected with badge upgrade detection

3.3 WHEN a customer already has the highest badge tier (Gold) THEN the system SHALL CONTINUE TO skip badge upgrade checks and not make unnecessary API calls

3.4 WHEN the badge award API returns `upgraded: false` (customer already has equal or higher badge) THEN the system SHALL CONTINUE TO handle this gracefully without showing upgrade notifications

3.5 WHEN payment realtime subscription receives non-success payment events (pending, failed, cancelled) THEN the system SHALL CONTINUE TO handle these appropriately without triggering badge recalculation
