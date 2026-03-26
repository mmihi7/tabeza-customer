# Implementation Tasks

## Tasks

- [x] 1. Exploratory: confirm TypeScript errors on unfixed code
  - [x] 1.1 Run `tsc --noEmit` and capture errors matching "Cannot find module" for PDFViewer and "never" type errors on Supabase operations
  - [x] 1.2 Confirm the PDFViewer import line in `app/menu/page.tsx` has no corresponding JSX usage (dead import)

- [x] 2. Fix PDFViewer — remove import from `app/menu/page.tsx`
  - [x] 2.1 Delete the line `import PDFViewer from '../../../../components/PDFViewer';` from `app/menu/page.tsx`
  - [x] 2.2 Verify no remaining references to `PDFViewer` exist anywhere in `app/menu/page.tsx`

- [x] 3. Fix Supabase client — add `Database` generic to `lib/supabase.ts`
  - [x] 3.1 Add `import { Database } from '@/types/supabase'` to `lib/supabase.ts`
  - [x] 3.2 Change `createClient(supabaseUrl, supabaseKey, ...)` to `createClient<Database>(supabaseUrl, supabaseKey, ...)` for the singleton instance
  - [x] 3.3 Change `createClient(supabaseUrl, secretKey, ...)` to `createClient<Database>(supabaseUrl, secretKey, ...)` in `createServiceRoleClient`

- [x] 4. Fix checking: verify errors are resolved
  - [x] 4.1 Run `tsc --noEmit` and assert zero errors of the form "Cannot find module" related to PDFViewer
  - [x] 4.2 Run `tsc --noEmit` and assert zero errors of the form "not assignable to parameter of type 'never'" on Supabase operations

- [x] 5. Preservation checking: verify no regressions
  - [x] 5.1 Confirm the `staticMenuType === 'pdf'` placeholder JSX in `app/menu/page.tsx` is intact and renders without referencing `PDFViewer`
  - [x] 5.2 Confirm all other files that import from `lib/supabase.ts` still compile without errors (the generic is additive, not breaking)
