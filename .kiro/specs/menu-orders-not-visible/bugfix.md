# Bugfix Requirements Document

## Introduction

Staff-initiated orders placed via the Tabeza staff app are not appearing on the customer menu page (`tabeza-customer/app/menu/page.tsx`). When a waiter assigns a receipt or places an order on behalf of a customer, the order is inserted into `tab_orders` with `initiated_by: 'staff'`, but the customer never sees it. The root cause is twofold: the menu page queries `tab_orders` directly using the anon/publishable Supabase key, which is blocked by Row Level Security (RLS), and the real-time subscription for new orders cannot function because the initial data load fails. A secondary issue exists in the staff app: `tabeza-staff/lib/supabase.ts` creates its client without the `Database` generic type, causing type inconsistency with the rest of the ecosystem.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the customer menu page loads and attempts to fetch orders for the active tab THEN the system returns no data because the direct client-side Supabase query on `tab_orders` is blocked by Row Level Security using the anon/publishable key

1.2 WHEN a waiter assigns a receipt or places a staff-initiated order (`initiated_by: 'staff'`) THEN the system fails to display the new order on the customer menu page because the real-time subscription cannot deliver events without the initial read access that RLS denies

1.3 WHEN the staff Supabase client is instantiated in `tabeza-staff/lib/supabase.ts` THEN the system creates an untyped client (`createClient` without `Database` generic) causing type inconsistency and missing compile-time safety for database operations

### Expected Behavior (Correct)

2.1 WHEN the customer menu page loads THEN the system SHALL fetch all orders for the active tab via a server-side API route that uses the service role client to bypass RLS, returning the correct order list

2.2 WHEN a waiter assigns a receipt or places a staff-initiated order THEN the system SHALL display the new order on the customer menu page in real time, with the real-time subscription receiving INSERT and UPDATE events correctly after the initial load succeeds

2.3 WHEN the staff Supabase client is instantiated in `tabeza-staff/lib/supabase.ts` THEN the system SHALL use `createClient<Database>` with the correct `Database` generic (exported as `supabase` from the schema, not `supabaseClient`) to ensure full type safety consistent with the customer app

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a customer places their own order (`initiated_by: 'customer'`) THEN the system SHALL CONTINUE TO display that order on the menu page and process real-time status updates (pending → confirmed → cancelled) correctly

3.2 WHEN the tab data is fetched on menu page load THEN the system SHALL CONTINUE TO use the existing `/api/tabs/[id]` route with the service role client, with no changes to that route's behavior

3.3 WHEN the customer approves or rejects a staff-initiated order THEN the system SHALL CONTINUE TO update the order status and show the appropriate toast notification

3.4 WHEN the customer menu page receives a real-time UPDATE event for an existing order THEN the system SHALL CONTINUE TO route the event to `handleOrderUpdate`, `handleOrderInsert`, or `handleOrderDelete` as appropriate

3.5 WHEN the staff app performs any typed database operation using the Supabase client THEN the system SHALL CONTINUE TO function correctly after the `Database` generic is added, with no behavioral changes — only improved type safety
