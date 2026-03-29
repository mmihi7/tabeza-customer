# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Overdue Tab Silent Redirect
  - **CRITICAL**: This test MUST FAIL on unfixed code — failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior — it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: Scope the property to the concrete failing case — overdue tab returned by `/api/tabs/by-customer`
  - Test file: `app/start/__tests__/bug-condition-exploration.test.ts`
  - Mock `/api/tabs/by-customer` to return `{ tab: { status: 'overdue', balance: 500, ... } }`
  - Assert that `router.replace('/menu')` IS called (confirms bug — silent redirect fires)
  - Assert that no resolution modal (`OverdueTabModal` or `OverduePaymentModal`) is rendered
  - Cover both entry points: `app/start/page.tsx` (`loadBarInfo`) and `app/page.tsx` (`checkExistingTabBySlug`)
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test PASSES (this is correct — it proves the bug exists by confirming the silent redirect fires)
  - Document counterexamples found: e.g., `router.replace('/menu')` called immediately for `status: 'overdue'` with no modal shown
  - Mark task complete when test is written, run, and the silent-redirect behavior is documented
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Open Tab and New Customer Behavior Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - Test file: `app/start/__tests__/overdue-tab-resolution.test.ts` (preservation section)
  - Observe on UNFIXED code: `status: 'open'` tab → `router.replace('/menu')` called, no modal shown
  - Observe on UNFIXED code: no tab (null) + open bar → consent form rendered, no modal
  - Observe on UNFIXED code: no tab (null) + closed bar → `BarClosedSlideIn` rendered, no modal
  - Write property-based tests using fast-check: for all inputs where `isBugCondition` returns false (`tab === null` OR `tab.status === 'open'`), assert behavior matches observed baseline
  - Property: for all `status: 'open'` tab inputs, `router.replace('/menu')` is called and no overdue modal is rendered
  - Property: for all null-tab inputs with open bar, consent form is shown and no overdue modal is rendered
  - Property: for all null-tab inputs with closed bar, `BarClosedSlideIn` is shown and no overdue modal is rendered
  - Verify all tests PASS on UNFIXED code before proceeding
  - **EXPECTED OUTCOME**: Tests PASS (confirms baseline behavior to preserve)
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 3. Extract isWithinBusinessHours to shared utility
  - New file: `lib/business-hours.ts`
  - Export `isWithinBusinessHours(barData: any): boolean` — exact logic extracted from `app/start/page.tsx` (the inline function inside `loadBarInfo`, lines ~370–430)
  - Handle all three modes: `business_24_hours`, `simple`, `advanced`
  - Handle overnight hours (`closeNextDay` flag and `closeTotalMinutes < openTotalMinutes`)
  - Default to `true` (open) on error or missing config — preserving existing safe-default behavior
  - Leave the original inline function in `app/start/page.tsx` intact; add a comment above it: `// Shared version extracted to lib/business-hours.ts — this inline copy is preserved per non-destructive rule`
  - _Requirements: 2.1, 2.2_

- [x] 4. Create PATCH /api/tabs/[id]/reopen route
  - New file: `app/api/tabs/[id]/reopen/route.ts`
  - `PATCH /api/tabs/[id]/reopen`
  - Use service-role Supabase client (same pattern as other API routes in the project)
  - Fetch the tab by `id`; if `status !== 'overdue'`, return `400` with `{ error: 'Tab is not overdue' }` (idempotency guard)
  - Update `status` from `'overdue'` to `'open'`
  - Return the updated tab record as `{ tab: updatedTab }`
  - Return `404` if tab not found
  - _Requirements: 2.2.1_

- [x] 5. Build OverdueTabModal component
  - New file: `components/OverdueTabModal.tsx`
  - Props: `tab: any`, `barName: string`, `onReopen: () => void`, `onPayNow: () => void`, `onClose: () => void`
  - Display outstanding balance (`tab.balance`) prominently
  - Display `barName`
  - "Reopen Tab" button → calls `onReopen`
  - "Pay Now" button → calls `onPayNow`
  - "Close" / dismiss button → calls `onClose`
  - Shown only during business hours (caller is responsible for the hours check)
  - _Requirements: 2.2, 2.2.1, 2.2.2, 2.6_

- [x] 6. Build OverduePaymentModal component
  - New file: `components/OverduePaymentModal.tsx`
  - Props: `tab: any`, `barName: string`, `onSuccess: () => void`, `onClose: () => void`
  - Display outstanding balance (`tab.balance`) prominently
  - M-Pesa STK push flow — reuse `/api/mpesa/stkpush` endpoint pattern from `MpesaPaymentTab`
  - On success: call `onSuccess` (caller handles tab close and redirect to home)
  - On failure: show inline error message, allow retry without closing the modal
  - "Close" / dismiss button → calls `onClose`
  - Shown outside business hours OR when "Pay Now" is selected from `OverdueTabModal`
  - _Requirements: 2.1, 2.3, 2.4, 3.5_

- [x] 7. Fix app/page.tsx — add overdue status branch in checkExistingTabBySlug
  - File: `app/page.tsx`
  - Add state variables: `showOverdueModal`, `showOverduePaymentModal`, `overdueTab`, `overdueBarData`
  - Import `isWithinBusinessHours` from `lib/business-hours.ts`
  - Import `OverdueTabModal` and `OverduePaymentModal`
  - In `checkExistingTabBySlug`, after `if (hasTab && existingTab)`, add status branch BEFORE the existing redirect block:
    ```
    if (existingTab.status === 'overdue') {
      // intercept — show resolution modal instead of redirecting
      setOverdueTab(existingTab);
      setOverdueBarData(bar);
      if (isWithinBusinessHours(bar)) {
        setShowOverdueModal(true);
      } else {
        setShowOverduePaymentModal(true);
      }
      setCheckingTab(false);
      setIsInitializing(false);
      return;
    }
    // existing open-tab redirect code unchanged below
    ```
  - The existing `if (hasTab && existingTab) { ... router.replace('/menu') }` block is preserved intact and only reached when `status === 'open'`
  - Render `<OverdueTabModal>` and `<OverduePaymentModal>` conditionally in JSX
  - `onReopen` handler: call `PATCH /api/tabs/[id]/reopen`, store updated tab, redirect to `/menu`
  - `onSuccess` handler: redirect to home (`/`)
  - _Bug_Condition: isBugCondition(input) where input.tab.status === 'overdue'_
  - _Expected_Behavior: show OverdueTabModal (business hours) or OverduePaymentModal (outside hours); never call router.replace('/menu') silently_
  - _Preservation: status === 'open' path and all null-tab paths unchanged_
  - _Requirements: 2.1, 2.2, 2.2.1, 2.2.2, 2.3, 2.6, 3.1, 3.2, 3.3_

- [x] 8. Fix app/start/page.tsx — add overdue status branch in loadBarInfo
  - File: `app/start/page.tsx`
  - Add state variables: `showOverdueModal`, `showOverduePaymentModal`, `overdueTab`
  - Import `isWithinBusinessHours` from `lib/business-hours.ts`
  - Import `OverdueTabModal` and `OverduePaymentModal`
  - In `loadBarInfo`, after `if (hasExistingTab)`, add status branch BEFORE the existing redirect block:
    ```
    if (existingTab.status === 'overdue') {
      setOverdueTab(existingTab);
      if (isWithinBusinessHours(bar)) {
        setShowOverdueModal(true);
      } else {
        setShowOverduePaymentModal(true);
      }
      setLoading(false);
      return;
    }
    // existing open-tab redirect block preserved intact below
    ```
  - The existing `if (hasExistingTab) { ... router.replace('/menu') }` block is preserved intact and only reached when `status === 'open'`
  - Render `<OverdueTabModal>` and `<OverduePaymentModal>` conditionally in JSX
  - `onReopen` handler: call `PATCH /api/tabs/[id]/reopen`, store updated tab, redirect to `/menu`
  - `onSuccess` handler: redirect to home (`/`)
  - _Bug_Condition: isBugCondition(input) where input.tab.status === 'overdue'_
  - _Expected_Behavior: show OverdueTabModal (business hours) or OverduePaymentModal (outside hours); never call router.replace('/menu') silently_
  - _Preservation: status === 'open' path and all null-tab paths unchanged_
  - _Requirements: 2.1, 2.2, 2.2.1, 2.2.2, 2.3, 2.6, 3.1, 3.2, 3.3_

- [x] 9. Verify bug condition exploration test now passes
  - **Property 1: Expected Behavior** - Overdue Tab Always Intercepted
  - **IMPORTANT**: Re-run the SAME test from task 1 — do NOT write a new test
  - The test from task 1 asserts `router.replace('/menu')` IS called (confirming the bug)
  - After the fix, this assertion should FAIL — meaning the test itself now FAILS (the silent redirect no longer fires)
  - Rewrite the assertion in the task-1 test to match the expected post-fix behavior: `router.replace('/menu')` is NOT called, and the appropriate modal IS rendered
  - Re-run the updated test against the fixed code
  - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed — no silent redirect, modal shown)
  - _Requirements: 2.1, 2.2, 2.2.1, 2.2.2, 2.3, 2.6_

- [x] 10. Verify preservation tests still pass
  - **Property 2: Preservation** - Open Tab and New Customer Behavior Unchanged
  - **IMPORTANT**: Re-run the SAME tests from task 2 — do NOT write new tests
  - Run preservation property tests from `app/start/__tests__/overdue-tab-resolution.test.ts`
  - **EXPECTED OUTCOME**: All tests PASS (confirms no regressions — open-tab redirect, bar-closed slide-in, and consent form flows are all unchanged)
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 11. Checkpoint — Ensure all tests pass
  - Run the full test suite: `pnpm test --run` (or `jest --testPathPattern=overdue`)
  - Ensure all tests pass; ask the user if any questions arise
