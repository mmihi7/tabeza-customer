# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - RLS Blocks Direct `tab_orders` Query with Publishable Key
  - **CRITICAL**: This test MUST FAIL on unfixed code — failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior — it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: Scope the property to the concrete failing case — any tab ID where `loadMenuData` calls `supabase.from('tab_orders')` directly with the publishable key
  - Mock `supabase.from('tab_orders').select` to return `{ data: [], error: null }` (simulating RLS silent empty return)
  - Assert that `orders` state is empty after `loadMenuData` completes — this confirms the bug (orders exist in DB but are invisible)
  - Also test: mock `fetch('/api/tabs/test-id/orders')` to return `{ orders: [mockOrder] }` and assert `orders` state contains `mockOrder` — this FAILS on unfixed code because the fetch call does not exist yet
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct — it proves the bug exists)
  - Document counterexamples found: e.g., `loadMenuData('abc-123')` returns `orders = []` even when `tab_orders` contains rows for that tab
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Real-Time Event Handlers Unchanged for Non-Buggy Inputs
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for real-time handlers (these do NOT involve the initial `tab_orders` fetch and are not blocked by RLS):
    - Observe: `handleOrderUpdate` with a valid UPDATE payload correctly calls `updateOrderInList` and updates state
    - Observe: `handleOrderInsert` with a valid INSERT payload correctly calls `addOrderToList` and appends to state
    - Observe: `handleOrderDelete` with a valid DELETE payload correctly calls `removeOrderFromList` and removes from state
  - Write property-based tests using fast-check:
    - For all valid UPDATE payloads (random `TabOrder` objects), `handleOrderUpdate` produces a state where the updated order's fields match the payload
    - For all valid INSERT payloads (random `TabOrder` objects), `handleOrderInsert` adds exactly one new order without duplicates
    - For all valid DELETE payloads (random order IDs), `handleOrderDelete` removes exactly the targeted order ID from state
  - Verify tests PASS on UNFIXED code (confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.4_

- [x] 3. Fix: Route `tab_orders` fetch through service role API route

  - [x] 3.1 Create `tabeza-customer/app/api/tabs/[id]/orders/route.ts`
    - Mirror the pattern in `/api/tabs/[id]/route.ts` exactly
    - Extract `tabId` from `params.id`
    - Validate `tabId` is a non-empty string; return 400 if invalid
    - Call `createServiceRoleClient()` from `@/lib/supabase`
    - Query: `supabase.from('tab_orders').select('*').eq('tab_id', tabId).order('created_at', { ascending: false })`
    - Return `NextResponse.json({ orders })` on success
    - Return 500 with error message if query fails
    - _Bug_Condition: isBugCondition({ client: supabase, table: 'tab_orders', key: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY }) — direct client-side query blocked by RLS_
    - _Expected_Behavior: GET /api/tabs/{tabId}/orders returns complete order list including initiated_by: 'staff' rows_
    - _Requirements: 2.1_

  - [x] 3.2 Update `loadMenuData` in `tabeza-customer/app/menu/page.tsx`
    - Locate the direct `supabase.from('tab_orders').select('*').eq('tab_id', ...)` call (around line 1428)
    - Comment out the original direct query block with an explanatory note (NON-DESTRUCTIVE — do not delete)
    - Add new fetch call immediately after: `fetch('/api/tabs/${currentTab.id}/orders')` that parses `{ orders }` from JSON response
    - Call `setOrders(orders || [])` with the fetched result
    - _Bug_Condition: loadMenuData uses publishable-key client directly on tab_orders — RLS returns []_
    - _Expected_Behavior: loadMenuData fetches via /api/tabs/${tabId}/orders using service role client server-side_
    - _Preservation: Tab data fetch via /api/tabs/[id] is unchanged; real-time handlers are unchanged_
    - _Requirements: 2.1, 2.2, 3.2_

  - [x] 3.3 Update fallback refetch paths in `handleOrderUpdate`, `handleOrderInsert`, `handleOrderDelete` catch blocks
    - In each of the three catch blocks, locate the direct `supabase.from('tab_orders').select(...)` fallback call
    - Comment out each direct query (NON-DESTRUCTIVE — do not delete)
    - Add new fetch-based fallback immediately after each: `fetch('/api/tabs/${tab.id}/orders')` that parses `{ orders }` and calls `setOrders`
    - Apply the same non-destructive pattern to all three handlers
    - _Bug_Condition: fallback refetch paths use the same publishable-key client — also blocked by RLS_
    - _Expected_Behavior: fallback paths call /api/tabs/${tab.id}/orders instead of direct Supabase query_
    - _Preservation: handleOrderUpdate, handleOrderInsert, handleOrderDelete logic is unchanged — only catch block refetch paths are updated_
    - _Requirements: 2.1, 3.4_

  - [x] 3.4 Add `Database` generic to `tabeza-staff/lib/supabase.ts`
    - Add `import { Database } from '@/types/supabase'` (verify `tabeza-staff/types/supabase.ts` exists; if not, copy from `tabeza-customer/types/supabase.ts` or generate via `supabase gen types typescript`)
    - Apply `<Database>` generic to the singleton `createClient` call
    - Apply `<Database>` generic to the `createClient` call inside `createServiceRoleClient`
    - Update `supabaseInstance` type annotation to `ReturnType<typeof createClient<Database>> | null`
    - This is a type-only change — no runtime behavior difference
    - _Bug_Condition: createClient(url, key) without Database generic produces SupabaseClient<any>_
    - _Expected_Behavior: createClient<Database>(url, key) provides full compile-time type safety_
    - _Preservation: Staff app continues to function correctly — change is type-only_
    - _Requirements: 2.3, 3.5_

  - [x] 3.5 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Orders Fetched via Service Role API Route
    - **IMPORTANT**: Re-run the SAME test from task 1 — do NOT write a new test
    - The test from task 1 encodes the expected behavior (fetch via API route returns correct orders)
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed — `loadMenuData` now calls `/api/tabs/${tabId}/orders` and populates orders state correctly)
    - _Requirements: 2.1, 2.2_

  - [x] 3.6 Verify preservation tests still pass
    - **Property 2: Preservation** - Real-Time Event Handlers Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 — do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions — real-time handlers behave identically before and after the fix)
    - Confirm all tests still pass after fix (no regressions)

- [ ] 4. Checkpoint — Ensure all tests pass
  - Run the full test suite: `pnpm test --run` from `tabeza-customer/`
  - Verify unit tests for `GET /api/tabs/[id]/orders` pass (valid tab ID, invalid tab ID, query error)
  - Verify `loadMenuData` test passes (calls API route, populates orders state)
  - Verify fallback refetch tests pass (each catch block calls API route)
  - Verify property-based preservation tests pass (real-time handlers unchanged)
  - Ensure all tests pass; ask the user if questions arise
