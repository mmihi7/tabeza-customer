# Overdue Tab Returning Customer Fix — Bugfix Design

## Overview

Returning customers with overdue tabs are silently redirected to `/menu` because both entry
points (`app/page.tsx` and `app/start/page.tsx`) check for an existing tab but never inspect
`existingTab.status`. The fix adds a status branch immediately after the tab is fetched:
`open` tabs continue unchanged; `overdue` tabs are intercepted and routed to a resolution
flow that depends on business hours. No existing code paths are removed — only new branches
are added.

---

## Glossary

- **Bug_Condition (C)**: `existingTab.status === 'overdue'` — the condition that causes the
  silent redirect to `/menu` instead of showing a resolution flow.
- **Property (P)**: When C holds, the customer SHALL always see a resolution modal (either
  `OverdueTabModal` during business hours or `OverduePaymentModal` outside hours) and SHALL
  NEVER be silently redirected to `/menu`.
- **Preservation**: All behaviour for `status === 'open'` tabs, new customers, business-hours
  blocking, and non-keyboard interactions must remain byte-for-byte identical to the original.
- **isBugCondition(X)**: `X.tab !== null && X.tab.status === 'overdue'`
- **isWithinBusinessHours(barData)**: The existing function in `app/start/page.tsx` (lines
  ~370–430) that returns `true` when the venue is currently open. Will be extracted to a
  shared utility so both entry points can reuse it.
- **OverdueTabModal**: New component — resolution modal shown during business hours with
  "Reopen Tab" and "Pay Now" options.
- **OverduePaymentModal**: New component — M-Pesa STK push modal shown outside business
  hours or when "Pay Now" is selected.
- **PATCH /api/tabs/[id]/reopen**: New API route that updates `status` from `'overdue'` to
  `'open'` using the service-role client.

---

## Bug Details

### Bug Condition

The bug manifests in both entry points when a returning customer has an overdue tab. After
fetching the tab via `/api/tabs/by-customer`, both `checkExistingTabBySlug` (page.tsx ~L155)
and `loadBarInfo` (start/page.tsx ~L340) check only `if (hasTab && existingTab)` and
immediately store the tab and redirect to `/menu`, without ever reading `existingTab.status`.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input = { tab: TabRecord | null, barData: BarRecord }
  OUTPUT: boolean

  IF input.tab IS NULL THEN RETURN false
  RETURN input.tab.status === 'overdue'
END FUNCTION
```

### Examples

- Customer scans QR code → `checkExistingTabBySlug` finds tab with `status: 'overdue'` →
  stores tab in sessionStorage → redirects to `/menu`. **Expected**: show resolution modal.
- Customer arrives via `/start?bar=sunset-lounge` → `loadBarInfo` finds tab with
  `status: 'overdue'` → redirects to `/menu` after 500 ms. **Expected**: show resolution modal.
- Customer has `status: 'open'` tab → redirects to `/menu`. **Expected**: unchanged (no bug).
- Customer has no tab → proceeds to consent form or bar-closed slide-in. **Expected**: unchanged.

---

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- `status === 'open'` returning customers are redirected to `/menu` without interruption (req 3.1)
- New customers outside business hours see the `BarClosedSlideIn` component (req 3.2)
- New customers during business hours see the consent/onboarding form (req 3.3)
- Menu page behaviour for open-tab customers is completely unaffected (req 3.4)
- M-Pesa STK push failure keeps the payment modal open with an error message (req 3.5)
- Business hours check errors default to treating the venue as open (req 3.6)

**Scope:**
All inputs where `isBugCondition` returns `false` must produce exactly the same result as
the original code. This includes open tabs, new customers, and all non-tab-status-related
flows.

---

## Hypothesized Root Cause

1. **Missing status branch**: Both `checkExistingTabBySlug` and `loadBarInfo` treat any
   non-null tab as an open tab. The `existingTab.status` field is fetched (the API returns
   it) but never read. A single `if (existingTab.status === 'overdue')` branch is all that
   is missing.

2. **No overdue-specific UI components**: There are no `OverdueTabModal` or
   `OverduePaymentModal` components yet. The existing `MpesaPaymentTab` component handles
   the STK push mechanics but is embedded in a larger payment flow — a standalone modal
   wrapper is needed.

3. **`isWithinBusinessHours` is not shared**: The function is defined inline inside
   `loadBarInfo` in `start/page.tsx`. `page.tsx` has no access to it, so the business-hours
   check cannot be applied at the QR entry point without extracting it first.

4. **No reopen API route**: There is no `PATCH /api/tabs/[id]/reopen` endpoint. The existing
   `GET /api/tabs/[id]/route.ts` only handles reads. A new route file is needed.

---

## Correctness Properties

Property 1: Bug Condition — Overdue Tab Always Intercepted

_For any_ input where `isBugCondition(input)` returns `true` (i.e., the fetched tab has
`status === 'overdue'`), the fixed code SHALL display a resolution modal to the customer
and SHALL NOT redirect them to `/menu` without their explicit action.

**Validates: Requirements 2.1, 2.2, 2.2.1, 2.2.2, 2.3, 2.6**

Property 2: Preservation — Open Tab Behavior Unchanged

_For any_ input where `isBugCondition(input)` returns `false` (i.e., `tab` is `null` or
`tab.status === 'open'`), the fixed code SHALL produce exactly the same result as the
original code — including the same redirect timing, sessionStorage writes, and toast
messages — preserving all existing functionality.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**

---

## Fix Implementation

### Changes Required

**New file: `lib/business-hours.ts`**
- Extract `isWithinBusinessHours(barData)` from `app/start/page.tsx` into a shared utility.
- The original inline function in `start/page.tsx` is left intact with a comment pointing
  to the shared version (non-destructive rule compliance).

**New file: `app/api/tabs/[id]/reopen/route.ts`**
- `PATCH /api/tabs/[id]/reopen`
- Uses service-role client to update `status` from `'overdue'` to `'open'`.
- Returns the updated tab record.
- Validates that the tab is currently `'overdue'` before updating (idempotency guard).

**New file: `components/OverdueTabModal.tsx`**
- Props: `tab`, `barName`, `onReopen`, `onPayNow`, `onClose`
- Displays outstanding balance (`tab.balance`).
- "Reopen Tab" button calls `onReopen`.
- "Pay Now" button calls `onPayNow`.
- Shown only during business hours.

**New file: `components/OverduePaymentModal.tsx`**
- Props: `tab`, `barName`, `onSuccess`, `onClose`
- Wraps the M-Pesa STK push flow (reuses `/api/mpesa/stkpush` endpoint pattern from
  `MpesaPaymentTab`).
- Displays outstanding balance.
- On success: calls `onSuccess` which closes the tab and redirects to home.
- On failure: shows error inline, allows retry.
- Shown outside business hours OR when "Pay Now" is selected from `OverdueTabModal`.

**Modified: `app/page.tsx` — `checkExistingTabBySlug`**
- After `if (hasTab && existingTab)`, add:
  ```
  if (existingTab.status === 'overdue') {
    // intercept — show resolution modal instead of redirecting
  }
  // existing open-tab redirect code unchanged below
  ```
- Add state variables: `showOverdueModal`, `showOverduePaymentModal`, `overdueTab`,
  `overdueBarData`.

**Modified: `app/start/page.tsx` — `loadBarInfo`**
- After `if (hasExistingTab)`, add the same status branch before the existing redirect.
- The existing `if (hasExistingTab) { ... router.replace('/menu') }` block is preserved
  and only reached when `status === 'open'`.

---

## Testing Strategy

### Validation Approach

Two-phase approach: first run exploratory tests against the **unfixed** code to surface
counterexamples and confirm the root cause; then run fix-checking and preservation tests
against the **fixed** code.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug on unfixed code. Confirm that
`checkExistingTabBySlug` and `loadBarInfo` redirect to `/menu` when `status === 'overdue'`.

**Test Plan**: Mock `/api/tabs/by-customer` to return a tab with `status: 'overdue'`. Assert
that `router.replace('/menu')` is called and no modal is shown. These tests WILL PASS on
unfixed code (confirming the bug) and MUST FAIL after the fix is applied.

**Test Cases**:
1. **QR entry — overdue tab, during hours**: `checkExistingTabBySlug` with overdue tab +
   open bar → assert redirect to `/menu` fires (will pass on unfixed code, fail after fix)
2. **QR entry — overdue tab, outside hours**: same as above with closed bar hours
3. **Start page — overdue tab, during hours**: `loadBarInfo` with overdue tab + open bar →
   assert redirect to `/menu` fires
4. **Start page — overdue tab, outside hours**: same with closed bar hours

**Expected Counterexamples**:
- `router.replace('/menu')` is called immediately for overdue tabs — no modal rendered.
- Root cause confirmed: missing `status` check before the redirect.

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed code shows a
resolution modal and does NOT redirect to `/menu`.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := fixedEntryPoint(input)
  ASSERT router.replace('/menu') NOT called
  IF isWithinBusinessHours(input.barData) THEN
    ASSERT OverdueTabModal IS rendered
    ASSERT OverdueTabModal shows input.tab.balance
  ELSE
    ASSERT OverduePaymentModal IS rendered
    ASSERT OverduePaymentModal shows input.tab.balance
  END IF
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed code
produces the same result as the original.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT fixedEntryPoint(input) === originalEntryPoint(input)
END FOR
```

**Testing Approach**: Property-based testing with fast-check generates many tab/bar
combinations where `status !== 'overdue'` and asserts identical outcomes.

**Test Cases**:
1. **Open tab preservation**: `status: 'open'` → `router.replace('/menu')` called, no modal
2. **New customer, open hours**: no tab → consent form shown, no modal
3. **New customer, closed hours**: no tab + closed bar → `BarClosedSlideIn` shown, no modal
4. **Business hours error default**: `isWithinBusinessHours` throws → defaults to open

### Unit Tests

- `isWithinBusinessHours` extracted utility: simple mode, advanced mode, 24h mode, overnight
  hours, error fallback
- `PATCH /api/tabs/[id]/reopen`: updates status, rejects non-overdue tabs, returns updated tab
- `OverdueTabModal`: renders balance, fires `onReopen` and `onPayNow` callbacks
- `OverduePaymentModal`: renders balance, initiates STK push, handles success and failure

### Property-Based Tests

- Generate random `{ tab: { status: 'overdue', balance: number }, barData }` inputs and
  assert Property 1 holds (no silent redirect, modal shown)
- Generate random `{ tab: { status: 'open' } | null, barData }` inputs and assert Property 2
  holds (behaviour identical to original)
- Generate random business-hours configurations and assert `isWithinBusinessHours` is
  deterministic and never throws

### Integration Tests

- Full QR scan flow with overdue tab during business hours → `OverdueTabModal` → "Reopen Tab"
  → PATCH succeeds → redirect to `/menu`
- Full QR scan flow with overdue tab outside business hours → `OverduePaymentModal` → STK
  push → success → redirect to home
- Full start-page flow with overdue tab → same two scenarios as above
- Open-tab customer end-to-end: no modal, direct redirect to `/menu` (regression guard)
