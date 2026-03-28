# Bugfix Requirements Document

## Introduction

The `tabeza-customer` Next.js app fails to build (`pnpm run build`) due to multiple TypeScript type errors across API route files and components. The errors span six distinct categories: missing tables in the generated Supabase types, a `Json` metadata spread, null/undefined mismatches, a broken Google Sign-In component reference, stale token service imports, and type errors in excluded example files. The goal is a clean build with zero TypeScript errors.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN `.from('customers')`, `.from('push_subscriptions')`, `.from('user_profiles')`, `.from('user_devices')`, or `.from('slideshow_images')` is called on the typed Supabase client THEN the system produces a TypeScript error because those table names are absent from `types/supabase.ts`

1.2 WHEN `payment.metadata` (typed as `Json | null`) is spread with `...payment.metadata` THEN the system produces a TypeScript error because `Json` is not guaranteed to be an object type

1.3 WHEN a field typed as `string | null` (e.g. `tab.status`) is assigned to a response property typed as `string | undefined` THEN the system produces a TypeScript error due to `null` not being assignable to `undefined`

1.4 WHEN `GoogleSignInButton.tsx` is compiled THEN the system produces a TypeScript error because it references `supabaseClient` which is not defined in that file

1.5 WHEN files that import `TokensService` or related token service symbols are compiled THEN the system may produce TypeScript errors if any such imports remain active

1.6 WHEN TypeScript compiles files under `lib/code-guardrails` THEN the system produces type errors from example/demo files in that directory

### Expected Behavior (Correct)

2.1 WHEN `.from()` is called on tables not present in `types/supabase.ts` THEN the system SHALL compile without error by casting the Supabase client with `as any` on the `.from()` call

2.2 WHEN `payment.metadata` is spread into an object THEN the system SHALL compile without error by casting `metadata` to `Record<string, unknown>` before spreading

2.3 WHEN a `string | null` field is assigned to a `string | undefined` property THEN the system SHALL compile without error by applying `?? undefined` to convert `null` to `undefined`

2.4 WHEN `GoogleSignInButton.tsx` is compiled THEN the system SHALL compile without error by stubbing the component to return `null` (Google Sign-In is not in use)

2.5 WHEN files that previously imported `TokensService` are compiled THEN the system SHALL compile without error because all token service imports and usages are commented out or removed

2.6 WHEN TypeScript compiles the project THEN the system SHALL skip `lib/code-guardrails` entirely because it is listed in the `exclude` array of `tsconfig.json`

### Unchanged Behavior (Regression Prevention)

3.1 WHEN valid Supabase table queries are made against tables that ARE present in `types/supabase.ts` THEN the system SHALL CONTINUE TO enforce full type safety on those queries

3.2 WHEN `payment.metadata` is a valid object at runtime THEN the system SHALL CONTINUE TO spread its properties correctly into the response payload

3.3 WHEN `tab.status` or similar fields hold a non-null string value THEN the system SHALL CONTINUE TO pass that value through to the response correctly

3.4 WHEN authentication flows other than Google Sign-In are used THEN the system SHALL CONTINUE TO function without any regression

3.5 WHEN the build runs THEN the system SHALL CONTINUE TO include all API routes and components that were working prior to these fixes
