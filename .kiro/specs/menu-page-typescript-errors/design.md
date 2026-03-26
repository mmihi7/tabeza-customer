# menu-page-typescript-errors Bugfix Design

## Overview

Two TypeScript errors prevent `app/menu/page.tsx` from compiling cleanly:

1. **PDFViewer import** — the file imports `PDFViewer` from an invalid path (`../../../../components/PDFViewer`). Since the image viewer is sufficient, the fix is to remove the import and all usages entirely rather than correct the path.
2. **Untyped Supabase client** — `lib/supabase.ts` calls `createClient(url, key)` without the `Database` generic type parameter. This causes every `.from()`, `.insert()`, `.update()`, and `.rpc()` call to resolve its argument and return types as `never`, producing cascading type errors throughout `app/menu/page.tsx`.

Both fixes are purely structural — no runtime logic changes.

## Glossary

- **Bug_Condition (C)**: The set of conditions that trigger the TypeScript errors — either the presence of the `PDFViewer` import in `app/menu/page.tsx`, or the absence of the `Database` generic on the Supabase client in `lib/supabase.ts`
- **Property (P)**: The desired post-fix state — zero TypeScript errors related to these two root causes when running `tsc --noEmit`
- **Preservation**: All existing runtime behaviour (menu loading, ordering, payments, realtime, notifications, Telegram messaging) must remain identical after the fix
- **`createClient<Database>`**: The correctly-typed Supabase client factory call that resolves all table/RPC types from `types/supabase.ts`
- **`Database`**: The generated type exported from `types/supabase.ts` that describes all Supabase tables, views, and RPC functions
- **`staticMenuType`**: State variable in `MenuPage` that can be `'pdf' | 'image' | 'slideshow' | null`; the `'pdf'` branch already renders a "temporarily disabled" placeholder — no PDFViewer component is needed

## Bug Details

### Bug Condition

The bug manifests in two independent conditions, both detectable at compile time.

**Formal Specification:**

```
FUNCTION isBugCondition(file, supabaseClient)
  INPUT:
    file           — source text of app/menu/page.tsx
    supabaseClient — the exported supabase singleton from lib/supabase.ts
  OUTPUT: boolean

  hasPDFViewerImport  := file CONTAINS "import PDFViewer"
  missingDatabaseType := supabaseClient WAS CREATED WITHOUT Database generic

  RETURN hasPDFViewerImport OR missingDatabaseType
END FUNCTION
```

### Examples

- **PDFViewer import**: `import PDFViewer from '../../../../components/PDFViewer'` on line 28 of `app/menu/page.tsx` — TypeScript reports "Cannot find module" at compile time
- **Untyped insert**: `supabase.from('tab_orders').insert({ tab_id, ... })` — TypeScript reports "tab_id does not exist in type 'never[]'" because the client has no `Database` generic
- **Untyped update**: `supabase.from('tabs').update({ status: 'closed' })` — TypeScript reports "Argument of type '{ status: string }' is not assignable to parameter of type 'never'"
- **Untyped RPC**: `supabase.rpc('get_active_tab_for_bar', { p_bar_id: id })` — TypeScript reports "Argument of type '{ p_bar_id: string }' is not assignable to parameter of type 'undefined'"

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Menu page loads bar products, categories, and tab data exactly as before
- Order submission to `tab_orders` continues to work at runtime
- Real-time subscriptions (INSERT/UPDATE/DELETE on `tab_orders`) continue to fire and update state
- Static menu image display continues to render via the existing `<img>` tag path
- PDF-type static menus continue to show the existing "PDF Viewer Temporarily Disabled" placeholder
- Notification preference loading/saving via `tabs` table continues unchanged
- Telegram message insert and query via `tab_telegram_messages` continues unchanged
- All other pages and API routes are unaffected (changes are scoped to two files)

**Scope:**
All inputs that do NOT involve the `PDFViewer` import or untyped Supabase calls are completely unaffected. This includes:
- All runtime user interactions (tapping menu items, placing orders, making payments)
- All other components that import from `lib/supabase.ts` — they gain correct types as a side-effect but no behaviour changes
- All API routes using `createServiceRoleClient()` — that function is unchanged

## Hypothesized Root Cause

1. **Missing `Database` generic on `createClient`**: `lib/supabase.ts` uses `createClient(url, key)` without `createClient<Database>(url, key)`. The `Database` type exists in `types/supabase.ts` but was never imported or applied to the client. Without it, `@supabase/supabase-js` defaults all schema types to `unknown`/`never`.

2. **Stale PDFViewer import**: The import `import PDFViewer from '../../../../components/PDFViewer'` was added when a PDF viewer component existed at that path. The component was removed or moved, and the import was never cleaned up. The JSX already has a "temporarily disabled" fallback for `staticMenuType === 'pdf'`, so the component reference is dead code.

## Correctness Properties

Property 1: Bug Condition — No PDFViewer References

_For any_ compilation of `app/menu/page.tsx` after the fix, the TypeScript compiler SHALL report zero errors of the form "Cannot find module" related to `PDFViewer`, and the source file SHALL contain no `import` statement or JSX usage of `PDFViewer`.

**Validates: Requirements 1.1, 2.1**

Property 2: Bug Condition — Supabase Client Fully Typed

_For any_ Supabase operation (`.from()`, `.insert()`, `.update()`, `.rpc()`) called on the singleton client after the fix, the TypeScript compiler SHALL resolve argument and return types from the `Database` schema rather than `never`, producing zero type errors of the form "not assignable to parameter of type 'never'" or "does not exist on type 'never'".

**Validates: Requirements 1.2, 1.3, 1.4, 1.5, 2.2, 2.3, 2.4, 2.5**

Property 3: Preservation — Runtime Behaviour Unchanged

_For any_ input where the bug condition does NOT hold (i.e. inputs that don't exercise the removed import or the previously-untyped Supabase calls), the fixed code SHALL produce exactly the same runtime behaviour as the original code — all menu loading, ordering, payment, realtime, and messaging flows are unaffected.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**

## Fix Implementation

### Changes Required

**File 1**: `lib/supabase.ts`

**Change**: Import `Database` from `types/supabase.ts` and apply it as the generic type parameter to both `createClient` calls.

```typescript
// Before
import { createClient } from '@supabase/supabase-js'
// ...
supabaseInstance = createClient(supabaseUrl, supabaseKey, { ... })
// ...
return createClient(supabaseUrl, secretKey, { ... })

// After
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'
// ...
supabaseInstance = createClient<Database>(supabaseUrl, supabaseKey, { ... })
// ...
return createClient<Database>(supabaseUrl, secretKey, { ... })
```

**File 2**: `app/menu/page.tsx`

**Change**: Remove the `PDFViewer` import line. No JSX changes are needed — the existing `staticMenuType === 'pdf'` branch already renders a placeholder div without using `PDFViewer`.

```typescript
// Remove this line entirely:
import PDFViewer from '../../../../components/PDFViewer';
```

No other changes to `app/menu/page.tsx` are required. The `staticMenuType` state, the `'pdf' | 'image' | 'slideshow' | null` union, and the existing PDF placeholder JSX all remain intact.

## Testing Strategy

### Validation Approach

Both fixes are type-level only. The primary validation mechanism is TypeScript compilation (`tsc --noEmit`). The two-phase approach: first confirm the errors exist on unfixed code, then confirm they are absent after the fix.

### Exploratory Bug Condition Checking

**Goal**: Surface the exact TypeScript errors on unfixed code to confirm root cause analysis.

**Test Plan**: Run `tsc --noEmit` on the unfixed codebase and capture the error output. Confirm errors match the hypothesized root causes.

**Expected Counterexamples**:
- `error TS2307: Cannot find module '../../../../components/PDFViewer'` in `app/menu/page.tsx`
- `error TS2345: Argument of type '...' is not assignable to parameter of type 'never'` on `.insert()`, `.update()`, `.rpc()` calls
- `error TS2339: Property '...' does not exist on type 'never'` on `.select()` result access

### Fix Checking

**Goal**: Verify that after the fix, the bug condition no longer holds.

**Pseudocode:**
```
FOR ALL compilation of app/menu/page.tsx DO
  errors := tsc --noEmit output
  ASSERT errors DOES NOT CONTAIN "Cannot find module" related to PDFViewer
  ASSERT errors DOES NOT CONTAIN "not assignable to parameter of type 'never'"
  ASSERT errors DOES NOT CONTAIN "does not exist on type 'never'"
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, behaviour is unchanged.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(file, supabaseClient) DO
  ASSERT runtime_behaviour(original_code, input) = runtime_behaviour(fixed_code, input)
END FOR
```

**Testing Approach**: Since both changes are purely structural (import removal + type generic addition), no runtime logic paths change. Preservation is verified by:
1. Confirming the removed import (`PDFViewer`) has zero JSX usages in the file
2. Confirming `createClient<Database>` is a drop-in replacement — the generic only affects type checking, not the emitted JavaScript

### Unit Tests

- Verify `app/menu/page.tsx` has no remaining `PDFViewer` references after the fix
- Verify `lib/supabase.ts` exports a client typed with `Database`
- Verify the `staticMenuType === 'pdf'` branch renders the placeholder without referencing `PDFViewer`

### Property-Based Tests

- For any table name in `Database['public']['Tables']`, assert that `supabase.from(tableName)` does not produce a `never`-typed result (verified via TypeScript compilation, not runtime)
- For any source text of `app/menu/page.tsx`, assert that no line matches `import PDFViewer`

### Integration Tests

- Run `tsc --noEmit` on the full project and assert zero errors attributable to these two root causes
- Verify the menu page renders correctly in a browser with a valid tab (smoke test for preservation)
