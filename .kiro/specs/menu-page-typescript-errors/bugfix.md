# Bugfix Requirements Document

## Introduction

The menu page (`app/menu/page.tsx`) contains multiple TypeScript errors that prevent the app from creating new tabs and performing database operations. The root cause is twofold: (1) the `PDFViewer` component is imported and referenced in `app/menu/page.tsx` but is no longer needed — the image viewer is sufficient and PDFViewer should be removed entirely; and (2) the Supabase client in `lib/supabase.ts` is instantiated without a `Database` generic type parameter, causing all table and RPC function types to resolve to `never`. This makes every database operation — including tab creation, order insertion, status updates, and Telegram message inserts — type-unsafe and non-functional at compile time.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN `app/menu/page.tsx` is compiled THEN the system reports "Cannot find module '../../../../components/PDFViewer'" because the import path is invalid and the PDFViewer component is not needed (image viewer suffices)

1.2 WHEN any Supabase table query (e.g. `tab_orders`, `tabs`, `tab_telegram_messages`) is executed in `app/menu/page.tsx` THEN the system reports type errors such as "Property 'status' does not exist on type 'never'" because the Supabase client has no `Database` type parameter

1.3 WHEN `.insert()` is called on `tab_orders` or `tab_telegram_messages` THEN the system reports "No overload matches this call" and "tab_id does not exist in type 'never[]'" because insert argument types resolve to `never`

1.4 WHEN `.update({ status, confirmed_at })` or `.update({ status, cancelled_at })` is called on a Supabase table THEN the system reports "Argument of type '{ status: string; ... }' is not assignable to parameter of type 'never'" for the same reason

1.5 WHEN an RPC function such as `get_active_tab_for_bar` or `send_tab_notification` is called THEN the system reports "Argument of type '{ p_bar_id: string; }' is not assignable to parameter of type 'undefined'" because RPC argument types also resolve to `never`

### Expected Behavior (Correct)

2.1 WHEN `app/menu/page.tsx` is compiled THEN the system SHALL have no import or usage of `PDFViewer` — all static menu display SHALL use the image viewer instead

2.2 WHEN any Supabase table query is executed in `app/menu/page.tsx` THEN the system SHALL correctly type all table rows, insert payloads, and update payloads according to the generated `Database` type definitions

2.3 WHEN `.insert()` is called on `tab_orders` or `tab_telegram_messages` THEN the system SHALL accept the correct typed payload and perform the insert without type errors

2.4 WHEN `.update({ status, confirmed_at })` or `.update({ status, cancelled_at })` is called on a Supabase table THEN the system SHALL accept the typed update object without errors

2.5 WHEN an RPC function is called with its required arguments THEN the system SHALL accept the typed argument object and execute the function without type errors

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a customer opens the menu page with a valid tab THEN the system SHALL CONTINUE TO load bar products, categories, and tab data as before

3.2 WHEN a customer places an order THEN the system SHALL CONTINUE TO submit the order to the database and display confirmation

3.3 WHEN real-time subscriptions are active THEN the system SHALL CONTINUE TO receive and process order updates, inserts, and deletes via Supabase realtime

3.4 WHEN the static menu is displayed THEN the system SHALL CONTINUE TO render image content using the image viewer; PDF-type menus SHALL fall back to the existing "PDF Viewer Temporarily Disabled" placeholder already present in the JSX

3.5 WHEN notification preferences are loaded or saved THEN the system SHALL CONTINUE TO read and write the correct tab columns without errors

3.6 WHEN Telegram messages are sent or received THEN the system SHALL CONTINUE TO insert and query `tab_telegram_messages` correctly
