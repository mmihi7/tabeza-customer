# Supabase Environment Key Mismatch Bugfix Design

## Overview

The Tabeza Staff application has three files that reference a legacy environment variable name (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) which does not exist in the current `.env.local` configuration. The correct variable name is `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. This causes runtime errors when these components attempt to initialize Supabase clients, preventing the receipt capture functionality from working.

This is a straightforward environment variable name mismatch. The fix involves updating three files to use the correct variable name that exists in `.env.local`.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when code references `NEXT_PUBLIC_SUPABASE_ANON_KEY` which is undefined
- **Property (P)**: The desired behavior - Supabase clients should initialize successfully using `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- **Preservation**: All other Supabase client initializations that already use the correct variable name must continue working unchanged
- **createClient**: The Supabase function from `@supabase/supabase-js` that initializes a client instance
- **NEXT_PUBLIC_SUPABASE_ANON_KEY**: Legacy environment variable name (no longer exists in `.env.local`)
- **NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY**: Current environment variable name (defined in `.env.local`)

## Bug Details

### Bug Condition

The bug manifests when any of the three affected files attempts to create a Supabase client using `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY`. The `createClient` function receives `undefined` as the second parameter, causing it to throw a runtime error "supabaseKey is required".

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { filePath: string, envVarName: string }
  OUTPUT: boolean
  
  RETURN input.envVarName == 'NEXT_PUBLIC_SUPABASE_ANON_KEY'
         AND input.filePath IN [
           'app/receipt-capture/page.tsx',
           'components/TemplateGenerationStep.tsx',
           'components/ReceiptAssignment.tsx'
         ]
         AND process.env[input.envVarName] === undefined
END FUNCTION
```

### Examples

- **app/receipt-capture/page.tsx line 10**: `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!` evaluates to `undefined`, causing "supabaseKey is required" error
- **components/TemplateGenerationStep.tsx line 13**: `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY` evaluates to `undefined`, causing client initialization failure
- **components/ReceiptAssignment.tsx line 16**: `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY` evaluates to `undefined`, causing client initialization failure
- **Edge case - correct usage**: `lib/supabase.ts` uses `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and works correctly

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- All files that currently use `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` must continue to work exactly as before
- Supabase client functionality (auth, database queries, storage) must remain unchanged
- The receipt capture page UI and functionality must remain unchanged after successful client initialization
- All other components using Supabase clients must continue working

**Scope:**
All code that does NOT reference `NEXT_PUBLIC_SUPABASE_ANON_KEY` should be completely unaffected by this fix. This includes:
- All files in `lib/` that correctly use `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- All API routes that use service role clients
- All other components that correctly initialize Supabase clients
- The actual Supabase client behavior and API surface

## Hypothesized Root Cause

Based on the bug description and code analysis, the root cause is clear:

1. **Legacy Variable Name**: The three affected files were written when the environment variable was named `NEXT_PUBLIC_SUPABASE_ANON_KEY`

2. **Environment Configuration Update**: At some point, the `.env.local` file was updated to use the newer naming convention `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, but these three files were not updated

3. **Inconsistent Codebase**: Most of the codebase (15+ files) correctly uses `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, but these three files were missed during the migration

4. **No TypeScript Protection**: The non-null assertion operator (`!`) in `page.tsx` and the lack of runtime validation in the components prevented early detection of this issue

## Correctness Properties

Property 1: Bug Condition - Supabase Client Initialization

_For any_ file that attempts to create a Supabase client using `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY`, the fixed code SHALL use `process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` instead, causing the client to initialize successfully with the correct API key from `.env.local`.

**Validates: Requirements 2.1, 2.2**

Property 2: Preservation - Existing Supabase Client Behavior

_For any_ file that already uses `process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to initialize Supabase clients, the fixed code SHALL produce exactly the same behavior as before, preserving all existing Supabase functionality across the application.

**Validates: Requirements 3.1, 3.2, 3.3**

## Fix Implementation

### Changes Required

The fix is straightforward - replace the legacy variable name with the current one in three files.

**Files to Modify**:

1. **app/receipt-capture/page.tsx**
   - Line 10: Change `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!` to `process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!`

2. **components/TemplateGenerationStep.tsx**
   - Line 13: Change `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY` to `process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

3. **components/ReceiptAssignment.tsx**
   - Line 16: Change `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY` to `process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

**No other changes required**:
- No logic changes
- No function signature changes
- No import changes
- No type changes
- No `.env.local` changes (the correct variable already exists)

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, verify the bug exists on unfixed code by attempting to use the affected components, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Confirm the bug exists BEFORE implementing the fix by attempting to load the receipt capture page and observing the runtime error.

**Test Plan**: Navigate to the receipt capture page in the browser and observe the console error. Inspect the three affected files to confirm they reference the undefined environment variable.

**Test Cases**:
1. **Receipt Capture Page Load**: Navigate to `/receipt-capture` (will fail with "supabaseKey is required" error on unfixed code)
2. **Template Generation Component**: Attempt to use the template generation step (will fail on unfixed code)
3. **Receipt Assignment Component**: Attempt to use the receipt assignment component (will fail on unfixed code)
4. **Environment Variable Check**: Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` is undefined and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is defined in `.env.local`

**Expected Counterexamples**:
- Console error: "supabaseKey is required" when loading `/receipt-capture`
- Supabase client is `undefined` or throws initialization error
- Components fail to render or show error boundaries

### Fix Checking

**Goal**: Verify that after the fix, all three affected files successfully initialize Supabase clients using the correct environment variable.

**Pseudocode:**
```
FOR ALL file IN ['page.tsx', 'TemplateGenerationStep.tsx', 'ReceiptAssignment.tsx'] DO
  supabaseClient := createClient(URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
  ASSERT supabaseClient is defined
  ASSERT supabaseClient can perform auth operations
  ASSERT supabaseClient can perform database queries
END FOR
```

### Preservation Checking

**Goal**: Verify that all files that already use the correct environment variable continue to work exactly as before.

**Pseudocode:**
```
FOR ALL file WHERE file uses NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY DO
  ASSERT file behavior after fix === file behavior before fix
END FOR
```

**Testing Approach**: Manual testing is sufficient for this fix because:
- The change is a simple string replacement with no logic changes
- The scope is limited to three files
- The correct behavior is already demonstrated by 15+ other files in the codebase
- Property-based testing would be overkill for a variable name fix

**Test Plan**: After applying the fix, verify that existing functionality continues to work by testing representative pages and components.

**Test Cases**:
1. **Existing Supabase Clients**: Verify that pages using `lib/supabase.ts` continue to work (dashboard, menu, tabs)
2. **API Routes**: Verify that API routes using service role clients continue to work
3. **Authentication**: Verify that login/logout continues to work
4. **Database Queries**: Verify that data fetching continues to work across the app

### Unit Tests

- Test that the receipt capture page loads without errors
- Test that the template generation component renders successfully
- Test that the receipt assignment component renders successfully
- Test that Supabase client initialization succeeds in all three files

### Property-Based Tests

Not applicable for this fix. The change is a simple variable name replacement with deterministic behavior.

### Integration Tests

- Test the full receipt capture workflow: navigate to page → generate template → assign receipt
- Test that the receipt capture page can fetch data from Supabase
- Test that staff can interact with unmatched receipts
- Test that the template generation wizard completes successfully
