# Bugfix Requirements Document

## Introduction

The Tabeza Customer app is experiencing a runtime error during Supabase client initialization in the receipt capture page. The error "supabaseKey is required" occurs because the code references a legacy environment variable name (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) that does not exist in the current `.env.local` file, which uses the newer naming convention (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`). This prevents the receipt capture functionality from working.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the receipt capture page (`app/receipt-capture/page.tsx`) attempts to initialize the Supabase client THEN the system throws a runtime error "supabaseKey is required" at line 8:30

1.2 WHEN the code reads `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY` THEN the system receives `undefined` because this environment variable does not exist in `.env.local`

### Expected Behavior (Correct)

2.1 WHEN the receipt capture page attempts to initialize the Supabase client THEN the system SHALL successfully create a client instance using the correct environment variable `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

2.2 WHEN the code reads the Supabase publishable key THEN the system SHALL retrieve the value from `process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` which is defined in `.env.local`

### Unchanged Behavior (Regression Prevention)

3.1 WHEN other parts of the application that correctly use `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` initialize Supabase clients THEN the system SHALL CONTINUE TO work without any changes

3.2 WHEN the Supabase client is successfully initialized THEN the system SHALL CONTINUE TO provide all expected Supabase functionality (auth, database queries, etc.)

3.3 WHEN the receipt capture page renders after the fix THEN the system SHALL CONTINUE TO display the same UI and functionality as intended
