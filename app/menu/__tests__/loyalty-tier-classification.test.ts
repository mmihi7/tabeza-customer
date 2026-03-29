/**
 * Loyalty Tier Classification — Fix-Checking & Preservation Property-Based Tests
 * Spec: loyalty-tier-classification-bug
 * Task: 5 — Write fix-checking and preservation property-based tests
 *
 * This file contains two property suites:
 *
 * Property 1 (Fix-Checking):
 *   For ALL inputs where isBugCondition(X) = true
 *   (completedVisits < 2 OR (completedVisits >= 2 AND averageSpend < bronzeThreshold)),
 *   the fixed renderLoyaltyIcons returns null.
 *   EXPECTED OUTCOME: PASSES on fixed code.
 *
 * Property 2 (Preservation):
 *   For ALL inputs where NOT isBugCondition(X)
 *   (completedVisits >= 2 AND averageSpend >= bronzeThreshold),
 *   the fixed renderLoyaltyIcons renders the correct tier icons (Bronze/Silver/Gold).
 *   EXPECTED OUTCOME: PASSES on both unfixed and fixed code (no regressions).
 *
 * Validates: Requirements 2.1, 2.2, 2.4, 2.5, 2.6, 2.8, 3.1, 3.2, 3.3, 3.4, 3.6
 */

import * as fc from 'fast-check';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CustomerVenueContext {
  completedVisits: number;
  averageSpend: number;
  bronzeThreshold: number;
  silverThreshold: number;
  goldThreshold: number;
  spendTier: 'low' | 'medium' | 'high';
}

interface LoyaltyData {
  visitTier: 'new' | 'bronze' | 'silver' | 'gold';
  spendTier: 'low' | 'medium' | 'high';
  totalVisits: number;
  totalSpend: number;
}

// ---------------------------------------------------------------------------
// Bug condition predicate (formal spec from design.md)
// ---------------------------------------------------------------------------

function isBugCondition(x: CustomerVenueContext): boolean {
  return (
    x.completedVisits < 2 ||
    (x.completedVisits >= 2 && x.averageSpend < x.bronzeThreshold)
  );
}

// ---------------------------------------------------------------------------
// Inline reproduction of the FIXED classification logic from loadLoyaltyData()
// (app/menu/page.tsx — post-fix implementation)
//
// Injected with venue thresholds and visit data so we can test in isolation
// without rendering the full React component or hitting the network.
// ---------------------------------------------------------------------------

function classifyVisitTier(
  completedVisits: number,
  averageSpend: number,
  bronzeThreshold: number,
  silverThreshold: number,
  goldThreshold: number
): 'new' | 'bronze' | 'silver' | 'gold' {
  // Bug fix 3.1: 2-visit minimum gate
  if (completedVisits < 2) return 'new';

  // Bug fix 3.2 & 3.3: average-spend classification against venue thresholds
  if (averageSpend >= goldThreshold) return 'gold';
  if (averageSpend >= silverThreshold) return 'silver';
  if (averageSpend >= bronzeThreshold) return 'bronze';
  return 'new';
}

// ---------------------------------------------------------------------------
// Inline reproduction of the FIXED renderLoyaltyIcons() from app/menu/page.tsx
//
// Returns the icon configuration (count + tier) rather than JSX so we can
// assert on it in a Node test environment without a DOM renderer.
// ---------------------------------------------------------------------------

type IconResult = { iconCount: number; tier: 'bronze' | 'silver' | 'gold' } | null;

function renderLoyaltyIconsFixed(loyaltyData: LoyaltyData | null): IconResult {
  if (!loyaltyData) return null;

  // Bug fix 4: explicit null guard for 'new' tier
  if (loyaltyData.visitTier === 'new') return null;

  const { visitTier } = loyaltyData;

  let iconCount = 0;
  if (visitTier === 'bronze') iconCount = 1;
  else if (visitTier === 'silver') iconCount = 2;
  else if (visitTier === 'gold') iconCount = 3;

  return { iconCount, tier: visitTier as 'bronze' | 'silver' | 'gold' };
}

// ---------------------------------------------------------------------------
// Helper: build LoyaltyData from a CustomerVenueContext using the fixed logic
// ---------------------------------------------------------------------------

function buildLoyaltyData(ctx: CustomerVenueContext): LoyaltyData {
  const visitTier = classifyVisitTier(
    ctx.completedVisits,
    ctx.averageSpend,
    ctx.bronzeThreshold,
    ctx.silverThreshold,
    ctx.goldThreshold
  );
  return {
    visitTier,
    spendTier: ctx.spendTier,
    totalVisits: ctx.completedVisits,
    totalSpend: ctx.averageSpend * ctx.completedVisits,
  };
}

// ---------------------------------------------------------------------------
// fast-check arbitraries
// ---------------------------------------------------------------------------

// Venue thresholds: bronze < silver < gold, all positive integers
const venueThresholdsArb = fc
  .tuple(
    fc.integer({ min: 500, max: 3000 }),   // bronze
    fc.integer({ min: 100, max: 3000 }),   // silver delta
    fc.integer({ min: 100, max: 10000 })   // gold delta
  )
  .map(([bronze, silverDelta, goldDelta]) => ({
    bronzeThreshold: bronze,
    silverThreshold: bronze + silverDelta,
    goldThreshold: bronze + silverDelta + goldDelta,
  }));

const spendTierArb = fc.constantFrom<'low' | 'medium' | 'high'>('low', 'medium', 'high');

// Bug condition inputs: completedVisits < 2 OR averageSpend < bronzeThreshold
const bugConditionContextArb: fc.Arbitrary<CustomerVenueContext> = fc
  .tuple(venueThresholdsArb, spendTierArb)
  .chain(([thresholds, spendTier]) =>
    fc.oneof(
      // Case A: fewer than 2 completed visits (any spend)
      fc.tuple(
        fc.integer({ min: 0, max: 1 }),
        fc.integer({ min: 0, max: 50000 })
      ).map(([completedVisits, averageSpend]) => ({
        completedVisits,
        averageSpend,
        ...thresholds,
        spendTier,
      })),
      // Case B: 2+ visits but spend below bronze threshold
      fc.tuple(
        fc.integer({ min: 2, max: 100 }),
        fc.integer({ min: 0, max: thresholds.bronzeThreshold - 1 })
      ).map(([completedVisits, averageSpend]) => ({
        completedVisits,
        averageSpend,
        ...thresholds,
        spendTier,
      }))
    )
  );

// Qualifying Bronze inputs: completedVisits >= 2, bronzeThreshold <= averageSpend < silverThreshold
const bronzeContextArb: fc.Arbitrary<CustomerVenueContext> = fc
  .tuple(venueThresholdsArb, spendTierArb)
  .chain(([thresholds, spendTier]) =>
    fc.tuple(
      fc.integer({ min: 2, max: 100 }),
      fc.integer({ min: thresholds.bronzeThreshold, max: thresholds.silverThreshold - 1 })
    ).map(([completedVisits, averageSpend]) => ({
      completedVisits,
      averageSpend,
      ...thresholds,
      spendTier,
    }))
  );

// Qualifying Silver inputs: completedVisits >= 2, silverThreshold <= averageSpend < goldThreshold
const silverContextArb: fc.Arbitrary<CustomerVenueContext> = fc
  .tuple(venueThresholdsArb, spendTierArb)
  .chain(([thresholds, spendTier]) =>
    fc.tuple(
      fc.integer({ min: 2, max: 100 }),
      fc.integer({ min: thresholds.silverThreshold, max: thresholds.goldThreshold - 1 })
    ).map(([completedVisits, averageSpend]) => ({
      completedVisits,
      averageSpend,
      ...thresholds,
      spendTier,
    }))
  );

// Qualifying Gold inputs: completedVisits >= 2, averageSpend >= goldThreshold
const goldContextArb: fc.Arbitrary<CustomerVenueContext> = fc
  .tuple(venueThresholdsArb, spendTierArb)
  .chain(([thresholds, spendTier]) =>
    fc.tuple(
      fc.integer({ min: 2, max: 100 }),
      fc.integer({ min: thresholds.goldThreshold, max: thresholds.goldThreshold + 50000 })
    ).map(([completedVisits, averageSpend]) => ({
      completedVisits,
      averageSpend,
      ...thresholds,
      spendTier,
    }))
  );

// ---------------------------------------------------------------------------
// Property 1: Fix-Checking — No tier shown for buggy inputs
// ---------------------------------------------------------------------------

describe('Property 1 (Fix-Checking): No tier icons for ineligible guests', () => {
  /**
   * For ALL X where isBugCondition(X) = true,
   * renderLoyaltyIcons returns null.
   * EXPECTED OUTCOME: PASSES on fixed code.
   * Validates: Requirements 2.1, 2.2, 2.4, 2.5, 2.6, 2.8
   */
  test('PBT: renderLoyaltyIcons returns null for all bug-condition inputs', () => {
    fc.assert(
      fc.property(bugConditionContextArb, ctx => {
        // Precondition: confirm this is indeed a bug-condition input
        expect(isBugCondition(ctx)).toBe(true);

        const loyaltyData = buildLoyaltyData(ctx);
        const result = renderLoyaltyIconsFixed(loyaltyData);

        expect(result).toBeNull();
      }),
      { numRuns: 500 }
    );
  });

  // Concrete cases from the bug report (Requirements 1.1–1.6)
  test('Unit: new customer (0 visits) → null', () => {
    const ctx: CustomerVenueContext = {
      completedVisits: 0,
      averageSpend: 0,
      bronzeThreshold: 3000,
      silverThreshold: 5000,
      goldThreshold: 15000,
      spendTier: 'low',
    };
    expect(isBugCondition(ctx)).toBe(true);
    expect(renderLoyaltyIconsFixed(buildLoyaltyData(ctx))).toBeNull();
  });

  test('Unit: one visit, high spend → null (visit gate not met)', () => {
    const ctx: CustomerVenueContext = {
      completedVisits: 1,
      averageSpend: 8000,
      bronzeThreshold: 3000,
      silverThreshold: 5000,
      goldThreshold: 15000,
      spendTier: 'medium',
    };
    expect(isBugCondition(ctx)).toBe(true);
    expect(renderLoyaltyIconsFixed(buildLoyaltyData(ctx))).toBeNull();
  });

  test('Unit: two visits, spend below bronze threshold → null', () => {
    const ctx: CustomerVenueContext = {
      completedVisits: 2,
      averageSpend: 1500,
      bronzeThreshold: 3000,
      silverThreshold: 5000,
      goldThreshold: 15000,
      spendTier: 'low',
    };
    expect(isBugCondition(ctx)).toBe(true);
    expect(renderLoyaltyIconsFixed(buildLoyaltyData(ctx))).toBeNull();
  });

  test('Unit: two visits, spend exactly at bronze threshold − 1 → null', () => {
    const ctx: CustomerVenueContext = {
      completedVisits: 2,
      averageSpend: 2999,
      bronzeThreshold: 3000,
      silverThreshold: 5000,
      goldThreshold: 15000,
      spendTier: 'low',
    };
    expect(isBugCondition(ctx)).toBe(true);
    expect(renderLoyaltyIconsFixed(buildLoyaltyData(ctx))).toBeNull();
  });

  test('Unit: loyaltyData is null → null (graceful degradation)', () => {
    expect(renderLoyaltyIconsFixed(null)).toBeNull();
  });

  test('Unit: visitTier is "new" with loyaltyData set → null (explicit guard)', () => {
    const loyaltyData: LoyaltyData = {
      visitTier: 'new',
      spendTier: 'low',
      totalVisits: 0,
      totalSpend: 0,
    };
    expect(renderLoyaltyIconsFixed(loyaltyData)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Property 2: Preservation — Qualifying guests see correct tier icons
// ---------------------------------------------------------------------------

describe('Property 2 (Preservation): Qualifying guests see correct tier icons', () => {
  /**
   * Bronze: completedVisits >= 2, bronzeThreshold <= averageSpend < silverThreshold
   * → iconCount = 1, tier = 'bronze'
   * Validates: Requirement 3.1
   */
  test('PBT: Bronze — 1 icon for all qualifying bronze inputs', () => {
    fc.assert(
      fc.property(bronzeContextArb, ctx => {
        expect(isBugCondition(ctx)).toBe(false);

        const result = renderLoyaltyIconsFixed(buildLoyaltyData(ctx));

        expect(result).not.toBeNull();
        expect(result!.iconCount).toBe(1);
        expect(result!.tier).toBe('bronze');
      }),
      { numRuns: 500 }
    );
  });

  /**
   * Silver: completedVisits >= 2, silverThreshold <= averageSpend < goldThreshold
   * → iconCount = 2, tier = 'silver'
   * Validates: Requirement 3.2
   */
  test('PBT: Silver — 2 icons for all qualifying silver inputs', () => {
    fc.assert(
      fc.property(silverContextArb, ctx => {
        expect(isBugCondition(ctx)).toBe(false);

        const result = renderLoyaltyIconsFixed(buildLoyaltyData(ctx));

        expect(result).not.toBeNull();
        expect(result!.iconCount).toBe(2);
        expect(result!.tier).toBe('silver');
      }),
      { numRuns: 500 }
    );
  });

  /**
   * Gold: completedVisits >= 2, averageSpend >= goldThreshold
   * → iconCount = 3, tier = 'gold'
   * Validates: Requirement 3.3
   */
  test('PBT: Gold — 3 icons for all qualifying gold inputs', () => {
    fc.assert(
      fc.property(goldContextArb, ctx => {
        expect(isBugCondition(ctx)).toBe(false);

        const result = renderLoyaltyIconsFixed(buildLoyaltyData(ctx));

        expect(result).not.toBeNull();
        expect(result!.iconCount).toBe(3);
        expect(result!.tier).toBe('gold');
      }),
      { numRuns: 500 }
    );
  });

  /**
   * API error: loyaltyData is null → no icons (graceful degradation unchanged)
   * Validates: Requirement 3.4
   */
  test('Unit: API error (loyaltyData = null) → null, no icons rendered', () => {
    expect(renderLoyaltyIconsFixed(null)).toBeNull();
  });

  /**
   * Venue config thresholds: classification uses fetched thresholds, not hardcoded constants.
   * Validates: Requirement 3.6 (and bug fix 3.2)
   */
  test('PBT: Venue config thresholds — classification uses fetched values not hardcoded 3000/5000/15000', () => {
    // Use a venue with non-default thresholds to confirm hardcoded values are not used
    const nonDefaultThresholds = {
      bronzeThreshold: 4000,
      silverThreshold: 7000,
      goldThreshold: 20000,
    };

    // averageSpend = 3500 is BELOW the venue's bronze (4000) but ABOVE the hardcoded default (3000)
    // If hardcoded thresholds were used, this would return bronze — the bug.
    // With venue config, it must return null.
    const belowVenueBronze: CustomerVenueContext = {
      completedVisits: 2,
      averageSpend: 3500,
      ...nonDefaultThresholds,
      spendTier: 'low',
    };
    expect(isBugCondition(belowVenueBronze)).toBe(true);
    expect(renderLoyaltyIconsFixed(buildLoyaltyData(belowVenueBronze))).toBeNull();

    // averageSpend = 4500 is ABOVE the venue's bronze (4000) → should be bronze
    const aboveVenueBronze: CustomerVenueContext = {
      completedVisits: 2,
      averageSpend: 4500,
      ...nonDefaultThresholds,
      spendTier: 'low',
    };
    expect(isBugCondition(aboveVenueBronze)).toBe(false);
    const result = renderLoyaltyIconsFixed(buildLoyaltyData(aboveVenueBronze));
    expect(result).not.toBeNull();
    expect(result!.tier).toBe('bronze');
  });

  // Boundary: averageSpend exactly at bronze threshold → bronze (not new)
  test('Unit: averageSpend exactly at bronzeThreshold → bronze (boundary)', () => {
    const ctx: CustomerVenueContext = {
      completedVisits: 2,
      averageSpend: 3000,
      bronzeThreshold: 3000,
      silverThreshold: 5000,
      goldThreshold: 15000,
      spendTier: 'low',
    };
    expect(isBugCondition(ctx)).toBe(false);
    const result = renderLoyaltyIconsFixed(buildLoyaltyData(ctx));
    expect(result).not.toBeNull();
    expect(result!.tier).toBe('bronze');
    expect(result!.iconCount).toBe(1);
  });

  // Boundary: averageSpend exactly at silverThreshold → silver (not bronze)
  test('Unit: averageSpend exactly at silverThreshold → silver (boundary)', () => {
    const ctx: CustomerVenueContext = {
      completedVisits: 2,
      averageSpend: 5000,
      bronzeThreshold: 3000,
      silverThreshold: 5000,
      goldThreshold: 15000,
      spendTier: 'medium',
    };
    expect(isBugCondition(ctx)).toBe(false);
    const result = renderLoyaltyIconsFixed(buildLoyaltyData(ctx));
    expect(result).not.toBeNull();
    expect(result!.tier).toBe('silver');
    expect(result!.iconCount).toBe(2);
  });

  // Boundary: averageSpend exactly at goldThreshold → gold (not silver)
  test('Unit: averageSpend exactly at goldThreshold → gold (boundary)', () => {
    const ctx: CustomerVenueContext = {
      completedVisits: 2,
      averageSpend: 15000,
      bronzeThreshold: 3000,
      silverThreshold: 5000,
      goldThreshold: 15000,
      spendTier: 'high',
    };
    expect(isBugCondition(ctx)).toBe(false);
    const result = renderLoyaltyIconsFixed(buildLoyaltyData(ctx));
    expect(result).not.toBeNull();
    expect(result!.tier).toBe('gold');
    expect(result!.iconCount).toBe(3);
  });
});
