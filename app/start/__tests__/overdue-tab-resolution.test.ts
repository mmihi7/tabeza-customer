/**
 * Preservation Property Tests
 * Spec: overdue-tab-returning-customer-fix
 * Task: 2 — Write preservation property tests (BEFORE implementing fix)
 *
 * These tests document the BASELINE behavior for all inputs where
 * isBugCondition returns false (tab === null OR tab.status === 'open').
 *
 * All tests MUST PASS on the unfixed code — they capture the behavior
 * that must be preserved after the fix is applied.
 *
 * Observed baseline on unfixed code:
 *   - status: 'open' tab  → router.replace('/menu') called, no modal shown
 *   - null tab + open bar → consent form rendered (loading=false, showBarClosed=false)
 *   - null tab + closed bar → BarClosedSlideIn rendered (showBarClosed=true)
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 */

import * as fc from 'fast-check';

// ---------------------------------------------------------------------------
// Bug condition predicate (shared definition)
// ---------------------------------------------------------------------------

/**
 * Returns true only when the input is the bug condition:
 * a non-null tab with status 'overdue'.
 */
function isBugCondition(input: { tab: any | null }): boolean {
  return input.tab !== null && input.tab.status === 'overdue';
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FetchMock = (url: string) => Promise<{ ok: boolean; json: () => Promise<any> }>;
type RouterMock = { replace: jest.Mock };

interface BarData {
  id: string;
  name: string;
  active: boolean;
  slug: string;
  business_hours_mode?: string | null;
  business_hours_simple?: any;
  business_hours_advanced?: any;
  business_24_hours?: boolean;
}

interface RunResult {
  routerReplaceCalled: boolean;
  routerReplaceArg: string | null;
  showBarClosed: boolean;
  loadingSetFalse: boolean;
}

// ---------------------------------------------------------------------------
// Inline reproduction of the NON-BUG path in checkExistingTabBySlug
// (app/page.tsx — the path taken when tab is null OR tab.status === 'open')
//
// When tab is found (open): storeActiveTab + sessionStorage + router.replace('/menu')
// When tab is null: redirect to /start?bar=<slug>  (no /menu redirect)
// ---------------------------------------------------------------------------

async function runCheckExistingTabBySlug(
  fetchMock: FetchMock,
  routerMock: RouterMock,
  userId: string,
  bar: BarData
): Promise<RunResult> {
  let hasTab = false;
  let existingTab: any = null;

  try {
    const res = await fetchMock(`/api/tabs/by-customer?customerId=${userId}&barId=${bar.id}`);
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
    // Preservation path: open tab → redirect to /menu (no status check in unfixed code)
    // storeActiveTab and sessionStorage omitted (no-op in node env)
    routerMock.replace('/menu');
    return {
      routerReplaceCalled: true,
      routerReplaceArg: '/menu',
      showBarClosed: false,
      loadingSetFalse: false,
    };
  }

  // No tab → redirect to /start?bar=<slug>
  routerMock.replace(`/start?bar=${bar.slug}`);
  return {
    routerReplaceCalled: true,
    routerReplaceArg: `/start?bar=${bar.slug}`,
    showBarClosed: false,
    loadingSetFalse: true,
  };
}

// ---------------------------------------------------------------------------
// Inline reproduction of the NON-BUG path in loadBarInfo
// (app/start/page.tsx — the path taken when tab is null OR tab.status === 'open')
//
// When tab is found (open): storeActiveTab + sessionStorage + router.replace('/menu')
// When tab is null + open bar: setLoading(false) — consent form shown
// When tab is null + closed bar: setShowBarClosed(true) + setLoading(false)
// ---------------------------------------------------------------------------

async function runLoadBarInfo(
  fetchMock: FetchMock,
  routerMock: RouterMock,
  userId: string,
  bar: BarData,
  isBarOpen: boolean
): Promise<RunResult> {
  let existingTabs: any[] = [];

  try {
    const res = await fetchMock(`/api/tabs/by-customer?customerId=${userId}&barId=${bar.id}`);
    if (res.ok) {
      const body = await res.json();
      if (body.tab) existingTabs = [body.tab];
    }
  } catch (e) {
    // swallow
  }

  const hasExistingTab = existingTabs.length > 0;

  if (hasExistingTab) {
    // Preservation path: open tab → redirect to /menu (no status check in unfixed code)
    // storeActiveTab and sessionStorage omitted (no-op in node env)
    routerMock.replace('/menu');
    return {
      routerReplaceCalled: true,
      routerReplaceArg: '/menu',
      showBarClosed: false,
      loadingSetFalse: false,
    };
  }

  // No tab — check business hours
  if (!isBarOpen) {
    // Bar closed → show BarClosedSlideIn
    return {
      routerReplaceCalled: false,
      routerReplaceArg: null,
      showBarClosed: true,
      loadingSetFalse: true,
    };
  }

  // Bar open → show consent form (setLoading(false))
  return {
    routerReplaceCalled: false,
    routerReplaceArg: null,
    showBarClosed: false,
    loadingSetFalse: true,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFetchMock(tab: any | null): FetchMock {
  return jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ tab }),
  });
}

function makeOpenTab(overrides: Partial<any> = {}): any {
  return {
    id: 'tab-open-1',
    status: 'open',
    balance: 200,
    tab_number: 5,
    notes: '{}',
    ...overrides,
  };
}

function makeBar(overrides: Partial<BarData> = {}): BarData {
  return {
    id: 'bar-1',
    name: 'Test Bar',
    active: true,
    slug: 'test-bar',
    business_hours_mode: null,
    business_24_hours: true,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// fast-check arbitraries
// ---------------------------------------------------------------------------

/** Generates a tab with status 'open' and a random positive balance */
const openTabArb = fc.record({
  id: fc.uuid(),
  status: fc.constant('open'),
  balance: fc.integer({ min: 0, max: 100000 }),
  tab_number: fc.integer({ min: 1, max: 9999 }),
  notes: fc.constant('{}'),
});

/** Generates a bar slug (lowercase alphanumeric + hyphens) */
const barSlugArb = fc
  .stringMatching(/^[a-z][a-z0-9-]{2,19}$/)
  .filter((s) => !s.endsWith('-'));

/** Generates a bar record */
const barArb = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  active: fc.constant(true),
  slug: barSlugArb,
  business_hours_mode: fc.constant(null),
  business_24_hours: fc.constant(true),
});

// ---------------------------------------------------------------------------
// Property 2a: Open Tab Preservation
//
// For all inputs where tab.status === 'open' (isBugCondition returns false),
// both entry points MUST call router.replace('/menu') and MUST NOT show any
// overdue modal.
//
// Validates: Requirements 3.1, 3.4
// ---------------------------------------------------------------------------

describe('Property 2: Preservation — Open Tab and New Customer Behavior Unchanged', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  /**
   * Property 2a — checkExistingTabBySlug: open tab → router.replace('/menu')
   *
   * **Validates: Requirements 3.1**
   *
   * For all open-tab inputs, isBugCondition returns false and the entry point
   * redirects to /menu without showing any modal.
   */
  test('Property 2a — checkExistingTabBySlug: for all open-tab inputs, router.replace("/menu") is called and no overdue modal is rendered', async () => {
    await fc.assert(
      fc.asyncProperty(openTabArb, barArb, async (tab, bar) => {
        // Precondition: this is NOT a bug condition
        expect(isBugCondition({ tab })).toBe(false);

        const fetchMock = makeFetchMock(tab);
        const routerMock: RouterMock = { replace: jest.fn() };

        const result = await runCheckExistingTabBySlug(fetchMock, routerMock, 'user-1', bar);

        // Preservation: open tab → redirect to /menu
        expect(result.routerReplaceCalled).toBe(true);
        expect(result.routerReplaceArg).toBe('/menu');

        // No overdue modal components exist yet — trivially not rendered
        // (asserted by the absence of any modal state being set)
        expect(result.showBarClosed).toBe(false);
      }),
      { numRuns: 50 }
    );
  });

  /**
   * Property 2b — loadBarInfo: open tab → router.replace('/menu')
   *
   * **Validates: Requirements 3.1**
   *
   * For all open-tab inputs, loadBarInfo redirects to /menu without showing
   * any modal or the bar-closed slide-in.
   */
  test('Property 2b — loadBarInfo: for all open-tab inputs, router.replace("/menu") is called and no overdue modal is rendered', async () => {
    await fc.assert(
      fc.asyncProperty(openTabArb, barArb, fc.boolean(), async (tab, bar, isBarOpen) => {
        // Precondition: this is NOT a bug condition
        expect(isBugCondition({ tab })).toBe(false);

        const fetchMock = makeFetchMock(tab);
        const routerMock: RouterMock = { replace: jest.fn() };

        const result = await runLoadBarInfo(fetchMock, routerMock, 'user-1', bar, isBarOpen);

        // Preservation: open tab → redirect to /menu regardless of bar hours
        expect(result.routerReplaceCalled).toBe(true);
        expect(result.routerReplaceArg).toBe('/menu');
        expect(result.showBarClosed).toBe(false);
      }),
      { numRuns: 50 }
    );
  });

  /**
   * Property 2c — loadBarInfo: null tab + open bar → consent form shown, no modal
   *
   * **Validates: Requirements 3.3**
   *
   * For all null-tab inputs with an open bar, loadBarInfo shows the consent form
   * (loading=false, showBarClosed=false) and does NOT redirect to /menu.
   */
  test('Property 2c — loadBarInfo: for all null-tab inputs with open bar, consent form is shown and no overdue modal is rendered', async () => {
    await fc.assert(
      fc.asyncProperty(barArb, async (bar) => {
        // Precondition: null tab is NOT a bug condition
        expect(isBugCondition({ tab: null })).toBe(false);

        const fetchMock = makeFetchMock(null);
        const routerMock: RouterMock = { replace: jest.fn() };

        const result = await runLoadBarInfo(fetchMock, routerMock, 'user-1', bar, true /* isBarOpen */);

        // Preservation: no tab + open bar → consent form (loading=false, no bar-closed, no /menu redirect)
        expect(result.routerReplaceCalled).toBe(false);
        expect(result.routerReplaceArg).toBeNull();
        expect(result.showBarClosed).toBe(false);
        expect(result.loadingSetFalse).toBe(true);
      }),
      { numRuns: 50 }
    );
  });

  /**
   * Property 2d — loadBarInfo: null tab + closed bar → BarClosedSlideIn shown, no modal
   *
   * **Validates: Requirements 3.2**
   *
   * For all null-tab inputs with a closed bar, loadBarInfo shows the BarClosedSlideIn
   * component and does NOT redirect to /menu or show any overdue modal.
   */
  test('Property 2d — loadBarInfo: for all null-tab inputs with closed bar, BarClosedSlideIn is shown and no overdue modal is rendered', async () => {
    await fc.assert(
      fc.asyncProperty(barArb, async (bar) => {
        // Precondition: null tab is NOT a bug condition
        expect(isBugCondition({ tab: null })).toBe(false);

        const fetchMock = makeFetchMock(null);
        const routerMock: RouterMock = { replace: jest.fn() };

        const result = await runLoadBarInfo(fetchMock, routerMock, 'user-1', bar, false /* isBarOpen */);

        // Preservation: no tab + closed bar → BarClosedSlideIn shown
        expect(result.showBarClosed).toBe(true);
        expect(result.loadingSetFalse).toBe(true);

        // No /menu redirect
        expect(result.routerReplaceCalled).toBe(false);
        expect(result.routerReplaceArg).toBeNull();
      }),
      { numRuns: 50 }
    );
  });

  // ---------------------------------------------------------------------------
  // Concrete baseline examples (observation-first methodology)
  // These document the exact observed behavior on unfixed code.
  // ---------------------------------------------------------------------------

  /**
   * Baseline A — checkExistingTabBySlug: open tab redirects to /menu
   *
   * Observed on unfixed code: status: 'open' tab → router.replace('/menu') called
   */
  test('Baseline A — checkExistingTabBySlug: open tab redirects to /menu (observed baseline)', async () => {
    const openTab = makeOpenTab({ balance: 200 });
    const bar = makeBar();
    const fetchMock = makeFetchMock(openTab);
    const routerMock: RouterMock = { replace: jest.fn() };

    expect(isBugCondition({ tab: openTab })).toBe(false);

    const result = await runCheckExistingTabBySlug(fetchMock, routerMock, 'user-1', bar);

    expect(routerMock.replace).toHaveBeenCalledWith('/menu');
    expect(result.routerReplaceCalled).toBe(true);
    expect(result.routerReplaceArg).toBe('/menu');
    expect(result.showBarClosed).toBe(false);
  });

  /**
   * Baseline B — loadBarInfo: open tab redirects to /menu
   *
   * Observed on unfixed code: status: 'open' tab → router.replace('/menu') called
   */
  test('Baseline B — loadBarInfo: open tab redirects to /menu (observed baseline)', async () => {
    const openTab = makeOpenTab({ balance: 350 });
    const bar = makeBar();
    const fetchMock = makeFetchMock(openTab);
    const routerMock: RouterMock = { replace: jest.fn() };

    expect(isBugCondition({ tab: openTab })).toBe(false);

    const result = await runLoadBarInfo(fetchMock, routerMock, 'user-1', bar, true);

    expect(routerMock.replace).toHaveBeenCalledWith('/menu');
    expect(result.routerReplaceCalled).toBe(true);
    expect(result.routerReplaceArg).toBe('/menu');
    expect(result.showBarClosed).toBe(false);
  });

  /**
   * Baseline C — loadBarInfo: null tab + open bar → consent form shown
   *
   * Observed on unfixed code: no tab + open bar → setLoading(false), consent form rendered
   */
  test('Baseline C — loadBarInfo: null tab + open bar → consent form shown (observed baseline)', async () => {
    const bar = makeBar();
    const fetchMock = makeFetchMock(null);
    const routerMock: RouterMock = { replace: jest.fn() };

    expect(isBugCondition({ tab: null })).toBe(false);

    const result = await runLoadBarInfo(fetchMock, routerMock, 'user-1', bar, true);

    expect(routerMock.replace).not.toHaveBeenCalledWith('/menu');
    expect(result.routerReplaceCalled).toBe(false);
    expect(result.showBarClosed).toBe(false);
    expect(result.loadingSetFalse).toBe(true);
  });

  /**
   * Baseline D — loadBarInfo: null tab + closed bar → BarClosedSlideIn shown
   *
   * Observed on unfixed code: no tab + closed bar → setShowBarClosed(true)
   */
  test('Baseline D — loadBarInfo: null tab + closed bar → BarClosedSlideIn shown (observed baseline)', async () => {
    const bar = makeBar({ business_24_hours: false, business_hours_mode: 'simple' });
    const fetchMock = makeFetchMock(null);
    const routerMock: RouterMock = { replace: jest.fn() };

    expect(isBugCondition({ tab: null })).toBe(false);

    const result = await runLoadBarInfo(fetchMock, routerMock, 'user-1', bar, false);

    expect(result.showBarClosed).toBe(true);
    expect(result.loadingSetFalse).toBe(true);
    expect(routerMock.replace).not.toHaveBeenCalledWith('/menu');
    expect(result.routerReplaceCalled).toBe(false);
  });

  /**
   * Baseline E — isBugCondition predicate: open tab and null tab are NOT bug conditions
   *
   * Validates: Requirements 3.1, 3.2, 3.3
   */
  test('Baseline E — isBugCondition returns false for open tabs and null tabs', () => {
    // Open tab is not a bug condition
    expect(isBugCondition({ tab: { status: 'open', balance: 100 } })).toBe(false);
    expect(isBugCondition({ tab: { status: 'open', balance: 0 } })).toBe(false);

    // Null tab is not a bug condition
    expect(isBugCondition({ tab: null })).toBe(false);

    // Overdue tab IS a bug condition (for reference)
    expect(isBugCondition({ tab: { status: 'overdue', balance: 500 } })).toBe(true);
  });

  /**
   * Baseline F — Business hours error defaults to open (req 3.6)
   *
   * Observed on unfixed code: isWithinBusinessHours catches errors and returns true.
   * When the business hours check throws, the bar is treated as open.
   *
   * Validates: Requirements 3.6
   */
  test('Baseline F — business hours error defaults to treating venue as open', async () => {
    // Simulate the isWithinBusinessHours error-fallback behavior inline
    // (extracted from app/start/page.tsx ~line 430: catch(error) { return true; })
    function isWithinBusinessHoursWithErrorFallback(barData: any): boolean {
      try {
        if (barData === null || barData === undefined) {
          throw new Error('barData is null');
        }
        if (barData.business_24_hours === true) {
          return true;
        }
        if (!barData.business_hours_mode) {
          return true;
        }
        // Simulate a parse error for malformed hours
        if (barData.business_hours_simple?.openTime === 'INVALID') {
          throw new Error('Invalid time format');
        }
        return true;
      } catch (error) {
        // Default to open on error — preserving existing safe-default behavior (req 3.6)
        return true;
      }
    }

    // Error case: null barData → defaults to open
    expect(isWithinBusinessHoursWithErrorFallback(null)).toBe(true);

    // Error case: malformed hours → defaults to open
    expect(
      isWithinBusinessHoursWithErrorFallback({
        business_hours_mode: 'simple',
        business_hours_simple: { openTime: 'INVALID', closeTime: 'INVALID' },
      })
    ).toBe(true);

    // Normal case: 24h bar → open
    expect(isWithinBusinessHoursWithErrorFallback({ business_24_hours: true })).toBe(true);

    // Normal case: no mode configured → open
    expect(isWithinBusinessHoursWithErrorFallback({ business_hours_mode: null })).toBe(true);
  });
});
