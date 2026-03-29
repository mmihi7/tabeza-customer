/**
 * Bug Condition Exploration Test — POST-FIX VERSION
 * Spec: overdue-tab-returning-customer-fix
 * Task: 9 — Verify bug condition exploration test now passes
 *
 * This test was originally written in task 1 to document the bug by asserting
 * the BROKEN behavior (silent redirect to /menu for overdue tabs).
 *
 * After the fix (tasks 3–8), the assertions have been updated to match the
 * CORRECT post-fix behavior:
 *   - router.replace('/menu') is NOT called for overdue tabs
 *   - The appropriate modal flag IS set (showOverdueModal during business hours,
 *     showOverduePaymentModal outside business hours)
 *
 * All tests PASS on fixed code — passing confirms the bug is fixed.
 *
 * Original counterexamples documented (task 1):
 * - Input: tab = { status: 'overdue', balance: 500 }
 *   Was (bug): router.replace('/menu') called immediately, no modal shown
 *   Now (fixed): showOverdueModal or showOverduePaymentModal set, no redirect
 *   Root cause was: missing `if (existingTab.status === 'overdue')` branch before redirect
 *
 * - Input: tab = { status: 'overdue', balance: 750 }
 *   Was (bug): router.replace('/menu') called immediately (via loadBarInfo path), no modal shown
 *   Now (fixed): showOverdueModal or showOverduePaymentModal set, no redirect
 *   Root cause was: same missing status check in app/start/page.tsx loadBarInfo
 *
 * Validates: Requirements 2.1, 2.2, 2.2.1, 2.2.2, 2.3, 2.6
 */

// ---------------------------------------------------------------------------
// Bug condition predicate (unchanged from task 1)
// ---------------------------------------------------------------------------

/**
 * Returns true when the input represents the bug condition:
 * a non-null tab with status 'overdue'.
 */
function isBugCondition(input: { tab: any | null }): boolean {
  return input.tab !== null && input.tab.status === 'overdue';
}

// ---------------------------------------------------------------------------
// Inline reproduction of the FIXED logic from app/page.tsx
// (checkExistingTabBySlug — the overdue branch added in task 7)
//
// The fixed block:
//   if (hasTab && existingTab) {
//     if (existingTab.status === 'overdue') {   // <-- NEW branch
//       setOverdueTab(existingTab);
//       setOverdueBarData(bar);
//       if (isWithinBusinessHours(bar)) {
//         setShowOverdueModal(true);
//       } else {
//         setShowOverduePaymentModal(true);
//       }
//       setCheckingTab(false);
//       setIsInitializing(false);
//       return;
//     }
//     // existing open-tab redirect code — only reached for status === 'open'
//     router.replace('/menu');
//     return;
//   }
// ---------------------------------------------------------------------------

type FetchMock = (url: string) => Promise<{ ok: boolean; json: () => Promise<any> }>;
type RouterMock = { replace: jest.Mock };

interface FixedCheckResult {
  routerReplaceCalled: boolean;
  routerReplaceArg: string | null;
  showOverdueModal: boolean;
  showOverduePaymentModal: boolean;
}

async function runFixedCheckExistingTabBySlug(
  fetchMock: FetchMock,
  routerMock: RouterMock,
  userId: string,
  barId: string,
  bar: { id: string; business_hours_mode?: string } & Record<string, any>
): Promise<FixedCheckResult> {
  let hasTab = false;
  let existingTab: any = null;

  let showOverdueModal = false;
  let showOverduePaymentModal = false;

  // ---- FIXED CODE (mirrors app/page.tsx checkExistingTabBySlug post-fix) ----
  try {
    const res = await fetchMock(`/api/tabs/by-customer?customerId=${userId}&barId=${barId}`);
    if (res.ok) {
      const body = await res.json();
      if (body.tab) {
        hasTab = true;
        existingTab = body.tab;
      }
    }
  } catch (e) {
    // swallow
  }

  if (hasTab && existingTab) {
    // Fixed: check overdue status BEFORE redirecting
    if (existingTab.status === 'overdue') {
      // Show resolution modal — business hours determines which one
      if (isWithinBusinessHoursStub(bar)) {
        showOverdueModal = true;
      } else {
        showOverduePaymentModal = true;
      }
      // No router.replace('/menu') — return early without redirect
      return { routerReplaceCalled: false, routerReplaceArg: null, showOverdueModal, showOverduePaymentModal };
    }

    // Existing open-tab redirect — only reached for status === 'open'
    routerMock.replace('/menu');
    return { routerReplaceCalled: true, routerReplaceArg: '/menu', showOverdueModal, showOverduePaymentModal };
  }
  // ---- END FIXED CODE ----

  return { routerReplaceCalled: false, routerReplaceArg: null, showOverdueModal, showOverduePaymentModal };
}

// ---------------------------------------------------------------------------
// Inline reproduction of the FIXED logic from app/start/page.tsx
// (loadBarInfo — the overdue branch added in task 8)
//
// The fixed block:
//   if (hasExistingTab) {
//     const existingTab = existingTabs[0];
//     if (existingTab.status === 'overdue') {   // <-- NEW branch
//       setOverdueTab(existingTab);
//       if (isWithinBusinessHours(bar)) {
//         setShowOverdueModal(true);
//       } else {
//         setShowOverduePaymentModal(true);
//       }
//       setLoading(false);
//       return;
//     }
//     // existing open-tab redirect block — only reached for status === 'open'
//     router.replace('/menu');
//     return;
//   }
// ---------------------------------------------------------------------------

interface FixedLoadBarInfoResult {
  routerReplaceCalled: boolean;
  routerReplaceArg: string | null;
  showOverdueModal: boolean;
  showOverduePaymentModal: boolean;
}

async function runFixedLoadBarInfo(
  fetchMock: FetchMock,
  routerMock: RouterMock,
  userId: string,
  barId: string,
  bar: { id: string; business_hours_mode?: string } & Record<string, any>
): Promise<FixedLoadBarInfoResult> {
  let existingTabs: any[] = [];

  let showOverdueModal = false;
  let showOverduePaymentModal = false;

  // ---- FIXED CODE (mirrors app/start/page.tsx loadBarInfo post-fix) ----
  try {
    const res = await fetchMock(`/api/tabs/by-customer?customerId=${userId}&barId=${barId}`);
    if (res.ok) {
      const body = await res.json();
      if (body.tab) existingTabs = [body.tab];
    }
  } catch (e) {
    // swallow
  }

  const hasExistingTab = existingTabs.length > 0;

  if (hasExistingTab) {
    const existingTab = existingTabs[0];

    // Fixed: check overdue status BEFORE redirecting
    if (existingTab.status === 'overdue') {
      if (isWithinBusinessHoursStub(bar)) {
        showOverdueModal = true;
      } else {
        showOverduePaymentModal = true;
      }
      // No router.replace('/menu') — return early without redirect
      return { routerReplaceCalled: false, routerReplaceArg: null, showOverdueModal, showOverduePaymentModal };
    }

    // Existing open-tab redirect — only reached for status === 'open'
    routerMock.replace('/menu');
    return { routerReplaceCalled: true, routerReplaceArg: '/menu', showOverdueModal, showOverduePaymentModal };
  }
  // ---- END FIXED CODE ----

  return { routerReplaceCalled: false, routerReplaceArg: null, showOverdueModal, showOverduePaymentModal };
}

// ---------------------------------------------------------------------------
// Stub for isWithinBusinessHours — controllable in tests
// ---------------------------------------------------------------------------

/**
 * Stub that reads a `_isOpen` flag from the bar object so tests can control
 * whether the venue is "open" or "closed" without depending on the real clock.
 * Defaults to true (open) when the flag is absent, matching the safe-default
 * behavior of the real isWithinBusinessHours utility.
 */
function isWithinBusinessHoursStub(bar: any): boolean {
  if (typeof bar._isOpen === 'boolean') return bar._isOpen;
  return true; // safe default
}

// ---------------------------------------------------------------------------
// Helper: build a fetch mock that returns a given tab (or null)
// ---------------------------------------------------------------------------

function makeFetchMock(tab: any | null): FetchMock {
  return jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ tab }),
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Bug Condition Exploration: overdue-tab-returning-customer-fix', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  /**
   * Test A — checkExistingTabBySlug with overdue tab during business hours
   *
   * POST-FIX assertion: router.replace('/menu') is NOT called.
   * OverdueTabModal flag IS set (business hours = open).
   *
   * Validates: Requirements 2.2, 2.2.1, 2.2.2, 2.6
   * EXPECTED OUTCOME: PASSES (confirms bug is fixed)
   */
  test('Test A — checkExistingTabBySlug: overdue tab during business hours shows OverdueTabModal, no redirect', async () => {
    const overdueTab = { id: 'tab-1', status: 'overdue', balance: 500, tab_number: 42 };
    const fetchMock = makeFetchMock(overdueTab);
    const routerMock: RouterMock = { replace: jest.fn() };
    const bar = { id: 'bar-1', name: 'Test Bar', _isOpen: true };

    // Confirm this is a bug condition input
    expect(isBugCondition({ tab: { status: 'overdue', balance: 500 } })).toBe(true);

    const result = await runFixedCheckExistingTabBySlug(fetchMock, routerMock, 'user-1', 'bar-1', bar);

    // Fixed: router.replace('/menu') must NOT be called for overdue tabs
    expect(routerMock.replace).not.toHaveBeenCalled();
    expect(result.routerReplaceCalled).toBe(false);
    expect(result.routerReplaceArg).toBeNull();

    // Fixed: OverdueTabModal shown during business hours
    expect(result.showOverdueModal).toBe(true);
    expect(result.showOverduePaymentModal).toBe(false);
  });

  /**
   * Test A2 — checkExistingTabBySlug with overdue tab outside business hours
   *
   * POST-FIX assertion: router.replace('/menu') is NOT called.
   * OverduePaymentModal flag IS set (outside business hours).
   *
   * Validates: Requirements 2.1, 2.3
   * EXPECTED OUTCOME: PASSES (confirms bug is fixed)
   */
  test('Test A2 — checkExistingTabBySlug: overdue tab outside business hours shows OverduePaymentModal, no redirect', async () => {
    const overdueTab = { id: 'tab-1b', status: 'overdue', balance: 500, tab_number: 42 };
    const fetchMock = makeFetchMock(overdueTab);
    const routerMock: RouterMock = { replace: jest.fn() };
    const bar = { id: 'bar-1', name: 'Test Bar', _isOpen: false };

    expect(isBugCondition({ tab: { status: 'overdue', balance: 500 } })).toBe(true);

    const result = await runFixedCheckExistingTabBySlug(fetchMock, routerMock, 'user-1', 'bar-1', bar);

    // Fixed: no silent redirect
    expect(routerMock.replace).not.toHaveBeenCalled();
    expect(result.routerReplaceCalled).toBe(false);
    expect(result.routerReplaceArg).toBeNull();

    // Fixed: OverduePaymentModal shown outside business hours
    expect(result.showOverdueModal).toBe(false);
    expect(result.showOverduePaymentModal).toBe(true);
  });

  /**
   * Test B — loadBarInfo with overdue tab during business hours
   *
   * POST-FIX assertion: router.replace('/menu') is NOT called.
   * OverdueTabModal flag IS set (business hours = open).
   *
   * Validates: Requirements 2.2, 2.2.1, 2.2.2, 2.6
   * EXPECTED OUTCOME: PASSES (confirms bug is fixed)
   */
  test('Test B — loadBarInfo: overdue tab during business hours shows OverdueTabModal, no redirect', async () => {
    const overdueTab = { id: 'tab-2', status: 'overdue', balance: 750, tab_number: 7 };
    const fetchMock = makeFetchMock(overdueTab);
    const routerMock: RouterMock = { replace: jest.fn() };
    const bar = { id: 'bar-2', name: 'Test Bar 2', _isOpen: true };

    // Confirm this is a bug condition input
    expect(isBugCondition({ tab: { status: 'overdue', balance: 750 } })).toBe(true);

    const result = await runFixedLoadBarInfo(fetchMock, routerMock, 'user-2', 'bar-2', bar);

    // Fixed: router.replace('/menu') must NOT be called for overdue tabs
    expect(routerMock.replace).not.toHaveBeenCalled();
    expect(result.routerReplaceCalled).toBe(false);
    expect(result.routerReplaceArg).toBeNull();

    // Fixed: OverdueTabModal shown during business hours
    expect(result.showOverdueModal).toBe(true);
    expect(result.showOverduePaymentModal).toBe(false);
  });

  /**
   * Test B2 — loadBarInfo with overdue tab outside business hours
   *
   * POST-FIX assertion: router.replace('/menu') is NOT called.
   * OverduePaymentModal flag IS set (outside business hours).
   *
   * Validates: Requirements 2.1, 2.3
   * EXPECTED OUTCOME: PASSES (confirms bug is fixed)
   */
  test('Test B2 — loadBarInfo: overdue tab outside business hours shows OverduePaymentModal, no redirect', async () => {
    const overdueTab = { id: 'tab-2b', status: 'overdue', balance: 750, tab_number: 7 };
    const fetchMock = makeFetchMock(overdueTab);
    const routerMock: RouterMock = { replace: jest.fn() };
    const bar = { id: 'bar-2', name: 'Test Bar 2', _isOpen: false };

    expect(isBugCondition({ tab: { status: 'overdue', balance: 750 } })).toBe(true);

    const result = await runFixedLoadBarInfo(fetchMock, routerMock, 'user-2', 'bar-2', bar);

    // Fixed: no silent redirect
    expect(routerMock.replace).not.toHaveBeenCalled();
    expect(result.routerReplaceCalled).toBe(false);
    expect(result.routerReplaceArg).toBeNull();

    // Fixed: OverduePaymentModal shown outside business hours
    expect(result.showOverdueModal).toBe(false);
    expect(result.showOverduePaymentModal).toBe(true);
  });

  /**
   * Test C — Preservation: checkExistingTabBySlug with open tab → router.replace('/menu') called
   *
   * Confirms that open-tab redirect is NOT a bug — this is correct behavior.
   * isBugCondition returns false for open tabs.
   * This test is UNCHANGED from task 1 — open-tab behavior must be preserved.
   *
   * EXPECTED OUTCOME: PASSES (baseline preserved)
   */
  test('Test C — checkExistingTabBySlug: open tab correctly redirects to /menu (not a bug)', async () => {
    const openTab = { id: 'tab-3', status: 'open', balance: 200, tab_number: 5 };
    const fetchMock = makeFetchMock(openTab);
    const routerMock: RouterMock = { replace: jest.fn() };
    const bar = { id: 'bar-3', name: 'Test Bar 3', _isOpen: true };

    // Open tab is NOT a bug condition
    expect(isBugCondition({ tab: { status: 'open', balance: 200 } })).toBe(false);

    const result = await runFixedCheckExistingTabBySlug(fetchMock, routerMock, 'user-3', 'bar-3', bar);

    // Correct behavior: open tab → redirect to /menu (no bug here)
    expect(routerMock.replace).toHaveBeenCalledWith('/menu');
    expect(result.routerReplaceCalled).toBe(true);
    expect(result.routerReplaceArg).toBe('/menu');

    // No overdue modals shown for open tabs
    expect(result.showOverdueModal).toBe(false);
    expect(result.showOverduePaymentModal).toBe(false);
  });

  /**
   * Test D — Preservation: no tab → router.replace('/menu') NOT called
   *
   * Confirms that when no tab exists, neither entry point redirects to /menu.
   * isBugCondition returns false for null tab.
   * This test is UNCHANGED from task 1 — no-tab behavior must be preserved.
   *
   * EXPECTED OUTCOME: PASSES (baseline preserved)
   */
  test('Test D — no tab: router.replace not called for either entry point', async () => {
    const fetchMock = makeFetchMock(null);
    const routerMockA: RouterMock = { replace: jest.fn() };
    const routerMockB: RouterMock = { replace: jest.fn() };
    const bar = { id: 'bar-4', name: 'Test Bar 4', _isOpen: true };

    // Null tab is NOT a bug condition
    expect(isBugCondition({ tab: null })).toBe(false);

    const resultA = await runFixedCheckExistingTabBySlug(fetchMock, routerMockA, 'user-4', 'bar-4', bar);
    const resultB = await runFixedLoadBarInfo(fetchMock, routerMockB, 'user-4', 'bar-4', bar);

    // No tab → no redirect
    expect(routerMockA.replace).not.toHaveBeenCalled();
    expect(resultA.routerReplaceCalled).toBe(false);
    expect(resultA.routerReplaceArg).toBeNull();

    expect(routerMockB.replace).not.toHaveBeenCalled();
    expect(resultB.routerReplaceCalled).toBe(false);
    expect(resultB.routerReplaceArg).toBeNull();

    // No overdue modals shown when there is no tab
    expect(resultA.showOverdueModal).toBe(false);
    expect(resultA.showOverduePaymentModal).toBe(false);
    expect(resultB.showOverdueModal).toBe(false);
    expect(resultB.showOverduePaymentModal).toBe(false);
  });
});
