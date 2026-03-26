# Menu Orders Not Visible — Bugfix Design

## Overview

Staff-initiated orders inserted into `tab_orders` are invisible to the customer menu page because
`tabeza-customer/app/menu/page.tsx` queries `tab_orders` directly with the browser-side publishable
key, which is blocked by Row Level Security. The fix routes the initial order fetch through a new
server-side API route (`/api/tabs/[id]/orders`) that uses `createServiceRoleClient()`, mirroring
the existing pattern in `/api/tabs/[id]/route.ts`. Once the initial load succeeds, the existing
real-time subscription (`useRealtimeSubscription`) will receive INSERT/UPDATE/DELETE events
correctly. A secondary fix adds the `Database` generic to `tabeza-staff/lib/supabase.ts` for
type safety consistency.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug — the menu page fetches `tab_orders`
  directly via the browser Supabase client, which is blocked by RLS, returning an empty result set.
- **Property (P)**: The desired behavior — the menu page receives the correct list of orders for
  the active tab, including staff-initiated ones, and real-time updates are delivered thereafter.
- **Preservation**: All existing behaviors that must remain unchanged — customer-initiated order
  display, real-time event routing, tab data fetching via `/api/tabs/[id]`, order approval/rejection
  flows, and staff app database operations.
- **`loadMenuData`**: The async function in `tabeza-customer/app/menu/page.tsx` that initialises
  the menu page; it contains the direct `supabase.from('tab_orders').select(...)` call that is
  blocked by RLS.
- **`createServiceRoleClient`**: The factory exported from `tabeza-customer/lib/supabase.ts` that
  creates a Supabase client authenticated with `SUPABASE_SECRET_KEY`, bypassing RLS. Used in all
  existing API routes.
- **`handleOrderInsert` / `handleOrderUpdate` / `handleOrderDelete`**: The three real-time event
  handlers in `menu/page.tsx` that update local `orders` state. They are correct and must not be
  changed. Their fallback refetch paths also query `tab_orders` directly and must be updated to
  call the new API route.
- **`tab_orders`**: The Supabase table that stores all orders (both `initiated_by: 'customer'` and
  `initiated_by: 'staff'`). RLS blocks direct reads with the publishable key.
- **`Database`**: The TypeScript type exported from `tabeza-customer/types/supabase.ts` (and the
  equivalent in the staff app once generated). Used as the generic parameter to `createClient<Database>`.

## Bug Details

### Bug Condition

The bug manifests when `loadMenuData` in `tabeza-customer/app/menu/page.tsx` executes the direct
Supabase query on `tab_orders` using the browser-side publishable key. RLS denies the read,
returning an empty array. Because the initial state is empty, the real-time subscription has no
baseline and staff-initiated INSERT events appear to arrive for an order the customer has never
seen — but the subscription itself also fails to surface them because the channel cannot confirm
read access.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { client: SupabaseClient, table: string, key: string }
  OUTPUT: boolean

  RETURN input.table = 'tab_orders'
         AND input.key = NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY   -- browser/anon key
         AND rlsPolicyBlocksRead(input.client, input.table)     -- RLS denies the query
         AND NOT routedThroughServiceRoleApiRoute(input)        -- no server-side bypass
END FUNCTION
```

### Examples

- **Primary**: Menu page loads for tab `abc-123`. `loadMenuData` calls
  `supabase.from('tab_orders').select('*').eq('tab_id', 'abc-123')`. RLS returns `[]`. Customer
  sees no orders even though the waiter placed two items. Expected: fetch via
  `/api/tabs/abc-123/orders` returns both rows.
- **Real-time downstream**: Waiter places a third order. The INSERT event fires on the channel.
  `handleOrderInsert` adds it to state, but the customer still sees only one item because the
  initial load was empty and the state baseline is wrong. Expected: after the initial load fix,
  the INSERT event correctly appends to the pre-populated list.
- **Fallback refetch**: An error occurs inside `handleOrderUpdate`. The catch block calls
  `supabase.from('tab_orders').select(...)` directly — same RLS block. Expected: the fallback
  calls `fetch('/api/tabs/${tab.id}/orders')` instead.
- **Staff app type safety**: `createClient(url, key)` in `tabeza-staff/lib/supabase.ts` produces
  `SupabaseClient<any>`. TypeScript cannot catch schema mismatches. Expected: `createClient<Database>(url, key)`.

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Customer-initiated orders (`initiated_by: 'customer'`) must continue to display and receive
  real-time status updates (pending → confirmed → cancelled) exactly as before.
- The existing `/api/tabs/[id]` route must not be modified; tab data fetching is unaffected.
- `handleOrderUpdate`, `handleOrderInsert`, and `handleOrderDelete` logic must not change — only
  their fallback refetch paths are updated.
- The customer order approval/rejection flow (approve staff order, reject with reason) must
  continue to work correctly.
- Real-time event routing (`UPDATE` → `handleOrderUpdate`, `INSERT` → `handleOrderInsert`,
  `DELETE` → `handleOrderDelete`) must remain unchanged.
- The staff app must continue to function correctly after the `Database` generic is added — the
  change is type-only with no runtime behavior difference.

**Scope:**
All inputs that do NOT involve the initial `tab_orders` fetch on menu page load are completely
unaffected. This includes:
- All mouse/touch interactions with the menu UI
- Payment flows (M-Pesa, card, cash)
- Telegram messaging
- Tab status updates
- Bar product and category loading

## Hypothesized Root Cause

Based on the confirmed investigation:

1. **RLS blocks direct client-side fetch (PRIMARY)**: `loadMenuData` in `menu/page.tsx` calls
   `supabase.from('tab_orders').select(...)` using the singleton `supabase` client, which is
   initialised with `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. The `tab_orders` RLS policy does not
   grant read access to the anon/publishable role, so the query returns an empty result set with
   no error thrown (Supabase RLS silently returns empty, not a 403).

2. **Real-time subscription broken downstream**: `useRealtimeSubscription` sets up a channel for
   `tab_orders` filtered by `tab_id`. Supabase Realtime uses a separate channel-level access
   mechanism that can deliver events even when REST RLS blocks reads. However, because the initial
   state is `[]`, any UPDATE event for an order the client has never seen cannot be reconciled —
   `updateOrderInList` finds no matching row and the order remains invisible. Once the initial
   load is fixed, the subscription will work correctly.

3. **Fallback refetch paths use the same blocked client**: The `catch` blocks in
   `handleOrderUpdate`, `handleOrderInsert`, and `handleOrderDelete` each call
   `supabase.from('tab_orders').select(...)` directly. These will also be blocked by RLS and must
   be updated to call the new API route.

4. **Staff app missing `Database` generic (SECONDARY)**: `tabeza-staff/lib/supabase.ts` calls
   `createClient(url, key)` and `createClient(url, secretKey)` without the `Database` generic.
   The customer app correctly uses `createClient<Database>`. The staff app needs a `Database` type
   — either generated via `supabase gen types` or copied from the customer app's
   `types/supabase.ts` — and applied to both `createClient` calls.

## Correctness Properties

Property 1: Bug Condition — Orders Fetched via Service Role API Route

_For any_ tab ID where the menu page loads and `isBugCondition` holds (i.e., the direct
publishable-key query on `tab_orders` would be blocked by RLS), the fixed `loadMenuData`
function SHALL fetch orders via `GET /api/tabs/{tabId}/orders` using the service role client
server-side, returning the complete and correct list of orders for that tab, including all
`initiated_by: 'staff'` rows.

**Validates: Requirements 2.1, 2.2**

Property 2: Preservation — Non-Buggy Inputs Unchanged

_For any_ input where `isBugCondition` does NOT hold (all interactions other than the initial
`tab_orders` fetch — mouse clicks, real-time event handlers, payment flows, tab data fetching),
the fixed code SHALL produce exactly the same behavior as the original code, preserving all
existing functionality for customer orders, real-time updates, and UI interactions.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## Fix Implementation

### Changes Required

Assuming the root cause analysis is correct:

**File 1**: `tabeza-customer/app/api/tabs/[id]/orders/route.ts` _(new file)_

**Purpose**: Server-side GET handler that fetches all orders for a tab using the service role
client, bypassing RLS. Mirrors the pattern in `/api/tabs/[id]/route.ts` exactly.

**Implementation**:
```
GET /api/tabs/[id]/orders
  1. Extract tabId from params
  2. Validate tabId is a non-empty string
  3. Call createServiceRoleClient()
  4. Query: supabase.from('tab_orders').select('*').eq('tab_id', tabId).order('created_at', { ascending: false })
  5. Return NextResponse.json({ orders }) on success
  6. Return 400 for invalid tabId, 500 for query errors
```

**File 2**: `tabeza-customer/app/menu/page.tsx`

**Function**: `loadMenuData` — the direct `supabase.from('tab_orders')` call (around line 1428)

**Specific Change**:
- Replace the direct Supabase query block with a `fetch('/api/tabs/${currentTab.id}/orders')`
  call that parses `{ orders }` from the JSON response and calls `setOrders(orders || [])`.
- The original direct query block is NOT removed per global-rules.md — it is commented out with
  an explanatory note and the new fetch call is added immediately after.

**Function**: fallback refetch in `handleOrderUpdate` catch block

**Specific Change**:
- Add a new fetch-based refetch path alongside the existing direct query (non-destructive).
- The existing `supabase.from('tab_orders')...` call in the catch block is commented out and
  replaced with `fetch('/api/tabs/${tab.id}/orders')`.

**Function**: fallback refetch in `handleOrderInsert` catch block — same treatment as above.

**Function**: fallback refetch in `handleOrderDelete` catch block — same treatment as above.

**File 3**: `tabeza-staff/lib/supabase.ts`

**Specific Change**:
- Add `import { Database } from '@/types/supabase'` (once the types file exists in the staff app).
- Apply `<Database>` generic to both `createClient` calls: the singleton and the service role
  factory.
- Update the `supabaseInstance` type annotation to `ReturnType<typeof createClient<Database>>`.
- Note: if `tabeza-staff/types/supabase.ts` does not yet exist, it must be generated via
  `supabase gen types typescript --project-id <id> > types/supabase.ts` or copied from the
  customer app. The schema export name is `Database` (not `supabaseClient`).

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate
the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm
or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write tests that mock the Supabase client to simulate RLS-blocked responses
(returning `[]` with no error) and assert that the menu page's order state remains empty after
`loadMenuData` completes. Run these tests on the UNFIXED code to observe failures and confirm
the root cause.

**Test Cases**:
1. **RLS Empty Return Test**: Mock `supabase.from('tab_orders').select` to return `{ data: [], error: null }`.
   Assert `orders` state is `[]` after load. (confirms bug on unfixed code — will pass, showing the
   empty-return problem)
2. **Staff Order Invisible Test**: Mock the query to return `[]`, then fire a simulated INSERT
   real-time event for a staff order. Assert the order appears in state. (will fail on unfixed code
   because `updateOrderInList` cannot reconcile against empty baseline)
3. **API Route Bypass Test**: Mock `fetch('/api/tabs/test-id/orders')` to return
   `{ orders: [mockOrder] }`. Assert `orders` state contains `mockOrder` after load. (will fail on
   unfixed code because the fetch call does not exist yet)
4. **Fallback Refetch Test**: Trigger an error in `handleOrderUpdate`. Assert the fallback path
   calls the API route, not the direct Supabase client. (will fail on unfixed code)

**Expected Counterexamples**:
- `orders` state is `[]` after `loadMenuData` even when `tab_orders` contains rows for the tab.
- Possible causes: RLS silent empty return, wrong client key, missing API route bypass.

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces
the expected behavior.

**Pseudocode:**
```
FOR ALL tabId WHERE isBugCondition({ client: supabase, table: 'tab_orders', key: publishableKey }) DO
  result := loadMenuData_fixed(tabId)
  ASSERT result.orders.length > 0 OR tabHasNoOrders(tabId)
  ASSERT result.orders fetched via '/api/tabs/' + tabId + '/orders'
  ASSERT NOT result.orders fetched via supabase.from('tab_orders') directly
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function
produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT original_behavior(input) = fixed_behavior(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain (random tab IDs, order
  states, event payloads)
- It catches edge cases that manual unit tests might miss (e.g., orders with unusual statuses)
- It provides strong guarantees that real-time event routing is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for real-time handlers and UI interactions,
then write property-based tests capturing that behavior.

**Test Cases**:
1. **Real-time UPDATE Preservation**: Verify `handleOrderUpdate` correctly updates `orders` state
   for any valid UPDATE payload — behavior must be identical before and after the fix.
2. **Real-time INSERT Preservation**: Verify `handleOrderInsert` correctly adds orders to state
   for any valid INSERT payload — behavior must be identical before and after the fix.
3. **Real-time DELETE Preservation**: Verify `handleOrderDelete` correctly removes orders from
   state for any valid DELETE payload — behavior must be identical before and after the fix.
4. **Tab Fetch Preservation**: Verify `/api/tabs/[id]` route behavior is completely unchanged.

### Unit Tests

- Test `GET /api/tabs/[id]/orders` returns correct orders for a valid tab ID
- Test `GET /api/tabs/[id]/orders` returns 400 for missing/invalid tab ID
- Test `GET /api/tabs/[id]/orders` returns 500 when the service role query fails
- Test `loadMenuData` calls `/api/tabs/${tabId}/orders` and populates `orders` state
- Test fallback refetch in each handler catch block calls the API route

### Property-Based Tests

- Generate random arrays of `TabOrder` objects and verify `handleOrderInsert` always adds exactly
  one new order without duplicates (preservation of `addOrderToList` behavior)
- Generate random UPDATE payloads and verify `handleOrderUpdate` always produces a state where
  the updated order's fields match the payload (preservation of `updateOrderInList` behavior)
- Generate random DELETE payloads and verify `handleOrderDelete` always removes exactly the
  targeted order ID from state (preservation of `removeOrderFromList` behavior)
- Generate random tab IDs and verify the new API route always returns `{ orders: [] }` or a
  non-empty array — never throws an unhandled exception

### Integration Tests

- Test full menu page load flow: tab fetch → orders fetch via API route → orders rendered in UI
- Test staff order flow: staff inserts order → real-time INSERT event → order appears in customer UI
- Test order approval flow: customer approves staff order → UPDATE event → status changes in UI
- Test that switching between tabs (if applicable) re-fetches orders via the API route each time
