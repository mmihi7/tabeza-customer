# Implementation Plan: Unified Menu & Loyalty Pricing

## Overview

All changes are confined to `app/menu/page.tsx`. The plan adds the `spendTier` state and `fetchSpendTier` effect, introduces the `applyDiscount` helper and `TIER_DISCOUNTS` map, extends `addToCart` with an optional `priceOverride` parameter, replaces the FOOD/DRINKS carousel sections with a single 2-column `UnifiedGrid`, and adds a `sortedProducts` derived value. Existing state, helpers, subscriptions, and all other page sections are left intact.

## Tasks

- [x] 1. Add `spendTier` state and `TIER_DISCOUNTS` constant
  - Add `const [spendTier, setSpendTier] = useState<'low' | 'medium' | 'high' | null>(null)` alongside the existing `loyaltyData` state declaration.
  - Add the `TIER_DISCOUNTS` record constant (`low: 1.5`, `medium: 3`, `high: 5`) as a module-level constant above `MenuPage`.
  - Do NOT remove or modify `loyaltyData` state or `loadLoyaltyData` — they drive the loyalty icon display and must remain intact.
  - _Requirements: 2.6, 2.7_

- [x] 2. Implement `applyDiscount` helper and `sortedProducts` derived value
  - [x] 2.1 Add the `applyDiscount(price, tier)` pure function as a module-level function above `MenuPage`
    - Formula: `Math.round(price * (1 - TIER_DISCOUNTS[tier] / 100))`
    - Must not mutate the input price.
    - _Requirements: 3.4, 3.6_

  - [ ]* 2.2 Write property test for `applyDiscount` — Property 6
    - **Property 6: Discount calculation formula**
    - **Validates: Requirements 2.6, 3.4**
    - File: `__tests__/unified-menu-loyalty-pricing/applyDiscount.test.ts`
    - Use `fast-check` to generate arbitrary positive integer prices and arbitrary tiers.
    - Assert `applyDiscount(price, tier) === Math.round(price * (1 - TIER_DISCOUNTS[tier] / 100))`.
    - Tag: `// Feature: unified-menu-loyalty-pricing, Property 6: Discount calculation formula`

  - [x] 2.3 Add `sortedProducts` derived value inside `MenuPage`
    - `const sortedProducts = [...barProducts].sort((a, b) => (a.product?.name ?? '').localeCompare(b.product?.name ?? ''))`.
    - This is a new derived value; the existing `filteredProducts` sort must remain unchanged.
    - _Requirements: 1.10_

  - [ ]* 2.4 Write property test for `sortedProducts` ordering — Property 2
    - **Property 2: Products are sorted alphabetically**
    - **Validates: Requirements 1.10**
    - File: `__tests__/unified-menu-loyalty-pricing/sortedProducts.test.ts`
    - Generate random arrays of `BarProduct` with arbitrary names; assert rendered order matches `localeCompare` sort.
    - Tag: `// Feature: unified-menu-loyalty-pricing, Property 2: Products are sorted alphabetically`

- [x] 3. Extend `addToCart` with optional `priceOverride` parameter
  - Add `priceOverride?: number` as a second parameter to the existing `addToCart` function.
  - Change the `price` field in `newItem` from `barProduct.sale_price` to `priceOverride ?? barProduct.sale_price`.
  - All other lines of `addToCart` remain exactly as they are — this is the only change to the function body.
  - _Requirements: 3.7_

- [x] 4. Add `fetchSpendTier` effect
  - Add a new `useEffect` that fires once when `tab?.customer_id` becomes available.
  - Fetch `/api/loyalty/spend-tiers/${tab.customer_id}` (the existing customer-app endpoint).
  - On success: if `data.spendTier` is `'low'`, `'medium'`, or `'high'`, call `setSpendTier(data.spendTier)`; otherwise leave `spendTier` as `null`.
  - On any fetch error or non-2xx response: catch silently, leave `spendTier` as `null`.
  - Use a `cancelled` flag in the cleanup function to prevent state updates after unmount.
  - Dependency array: `[tab?.customer_id]` — fires exactly once per customer_id value.
  - Do NOT modify or replace the existing `loadLoyaltyData` effect or its `useEffect` dependency on `tab?.bar_id`.
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ]* 4.1 Write property test for fetch-fires-once — Property 7
    - **Property 7: Spend tier fetch fires exactly once**
    - **Validates: Requirements 2.2**
    - File: `__tests__/unified-menu-loyalty-pricing/fetchSpendTier.test.ts`
    - Mount component with a valid `customer_id`; trigger multiple re-renders; assert fetch called exactly once.
    - Tag: `// Feature: unified-menu-loyalty-pricing, Property 7: Spend tier fetch fires exactly once`

- [x] 5. Replace FOOD/DRINKS carousel sections with the Unified Grid
  - Locate the JSX blocks that render the separate FOOD section (horizontal scroll carousel + category filter tabs) and the DRINKS section (horizontal scroll carousel + category filter tabs).
  - Remove those two JSX blocks and replace them with the Unified Grid JSX in the same position.
  - Do NOT remove any other JSX sections (cart, payment, orders, messages, tab header, connection status).
  - Unified Grid structure:
    - If `loading` is true → render a loading state placeholder.
    - If `sortedProducts.length === 0` → render an empty-state message ("No products available").
    - Otherwise → `<div className="grid grid-cols-2 gap-3 px-4 pb-6">` mapping over `sortedProducts`.
  - Each product card is a `<button>` that calls `addToCart(bp, displayPrice)` on click.
  - `displayPrice = spendTier ? applyDiscount(bp.sale_price, spendTier) : bp.sale_price`
  - `showStrikethrough = spendTier !== null && displayPrice !== bp.sale_price`
  - Image area: if `getDisplayImage(bp.product)` returns a value → `<img>` with that src; otherwise → render the icon returned by `getCategoryIcon(bp.product?.category ?? '')`.
  - Price area: when `showStrikethrough` is true, render `bp.sale_price` with `line-through` styling before the `displayPrice`; otherwise render `displayPrice` only.
  - No "discount", "loyalty", "your price", "offer", "bronze", "silver", or "gold" labels anywhere in the card.
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.11, 1.12, 3.1, 3.2, 3.3, 3.5_

  - [ ]* 5.1 Write property test for all products appear exactly once — Property 1
    - **Property 1: All active products appear in the grid**
    - **Validates: Requirements 1.1, 1.2**
    - File: `__tests__/unified-menu-loyalty-pricing/unifiedGrid.test.tsx`
    - Generate random arrays of `BarProduct` with mixed categories; render grid; assert every product id appears exactly once.
    - Tag: `// Feature: unified-menu-loyalty-pricing, Property 1: All active products appear in the grid`

  - [ ]* 5.2 Write property test for product card image area — Property 3
    - **Property 3: Product card image area correctness**
    - **Validates: Requirements 1.6, 1.7**
    - File: `__tests__/unified-menu-loyalty-pricing/unifiedGrid.test.tsx`
    - Generate `BarProduct` with arbitrary `image_url` (string or null); assert `<img>` rendered when non-null, icon rendered when null.
    - Tag: `// Feature: unified-menu-loyalty-pricing, Property 3: Product card image area correctness`

  - [ ]* 5.3 Write property test for product name always rendered — Property 4
    - **Property 4: Product name is always rendered**
    - **Validates: Requirements 1.8**
    - File: `__tests__/unified-menu-loyalty-pricing/unifiedGrid.test.tsx`
    - Generate `BarProduct` with arbitrary name; assert name text is present in rendered card.
    - Tag: `// Feature: unified-menu-loyalty-pricing, Property 4: Product name is always rendered`

  - [ ]* 5.4 Write property test for tap invokes addToCart with displayed price — Property 5
    - **Property 5: Tap invokes addToCart with the displayed price**
    - **Validates: Requirements 1.9, 3.7**
    - File: `__tests__/unified-menu-loyalty-pricing/unifiedGrid.test.tsx`
    - Generate `BarProduct` + arbitrary tier (including null); simulate tap; assert `addToCart` called with `applyDiscount(sale_price, tier)` when tier present, or `sale_price` when null.
    - Tag: `// Feature: unified-menu-loyalty-pricing, Property 5: Tap invokes addToCart with the displayed price`

  - [ ]* 5.5 Write property test for no loyalty labels — Property 8
    - **Property 8: No loyalty labels in rendered output**
    - **Validates: Requirements 3.3**
    - File: `__tests__/unified-menu-loyalty-pricing/unifiedGrid.test.tsx`
    - Generate `BarProduct` + arbitrary tier state; render card; assert rendered text contains none of: "discount", "loyalty", "your price", "offer", "bronze", "silver", "gold".
    - Tag: `// Feature: unified-menu-loyalty-pricing, Property 8: No loyalty labels in rendered output`

  - [ ]* 5.6 Write property test for strikethrough shown iff condition met — Property 9
    - **Property 9: Strikethrough shown iff tier is non-null and price differs**
    - **Validates: Requirements 3.1, 3.5**
    - File: `__tests__/unified-menu-loyalty-pricing/unifiedGrid.test.tsx`
    - Generate `BarProduct` + tier (null or valid); render card; assert strikethrough element present iff `spendTier !== null && applyDiscount(sale_price, tier) !== sale_price`.
    - Tag: `// Feature: unified-menu-loyalty-pricing, Property 9: Strikethrough shown iff tier is non-null and price differs`

  - [ ]* 5.7 Write property test for sale_price not mutated — Property 10
    - **Property 10: sale_price is not mutated**
    - **Validates: Requirements 3.6**
    - File: `__tests__/unified-menu-loyalty-pricing/unifiedGrid.test.tsx`
    - Generate `BarProduct`; apply loyalty layer at render time; assert `sale_price` on the state object is unchanged after render.
    - Tag: `// Feature: unified-menu-loyalty-pricing, Property 10: sale_price is not mutated`

- [x] 6. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Write unit tests for edge cases
  - [ ]* 7.1 Write unit tests for loading and empty states
    - Test: `loading=true` renders loading placeholder, not the grid (Requirement 1.11).
    - Test: `barProducts=[]` renders empty-state message (Requirement 1.12).
    - File: `__tests__/unified-menu-loyalty-pricing/unifiedGrid.test.tsx`

  - [ ]* 7.2 Write unit tests for spend tier API failure paths
    - Test: API returns 500 → `spendTier` stays null, prices render without strikethrough (Requirement 2.3).
    - Test: API returns `{ spendTier: null }` → prices render without strikethrough (Requirement 2.4).
    - Test: `tab.customer_id` absent → fetch is never called (Requirement 2.1).
    - File: `__tests__/unified-menu-loyalty-pricing/fetchSpendTier.test.ts`

  - [ ]* 7.3 Write unit tests confirming FOOD/DRINKS sections are absent
    - Test: rendered output does not contain the FOOD section carousel element (Requirement 1.3).
    - Test: rendered output does not contain the DRINKS section carousel element (Requirement 1.4).
    - Test: rendered output does not contain a category filter bar (Requirement 1.5).
    - File: `__tests__/unified-menu-loyalty-pricing/unifiedGrid.test.tsx`

- [ ] 8. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP.
- Each task references specific requirements for traceability.
- `loadLoyaltyData`, `loyaltyData` state, and `renderLoyaltyIcons` are untouched throughout — they drive the tab header loyalty icon and must not be modified.
- The existing `filteredProducts` derived value and `selectedCategory` / `searchQuery` state are left in place; they are not used by the Unified Grid but may be referenced elsewhere on the page.
- Property tests use `fast-check` (already in the project) with a minimum of 100 iterations each.
