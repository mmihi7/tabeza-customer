# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Environment Variable Mismatch Causes Supabase Client Initialization Failure
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: For this deterministic bug, scope the property to the concrete failing cases (the three files using the wrong env var name)
  - Test that attempting to initialize Supabase client with `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY` results in undefined/error
  - Test that `process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is defined in the environment
  - The test assertions should match the Expected Behavior Properties from design
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found to understand root cause
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Existing Supabase Client Initializations Continue Working
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for files that correctly use `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 3. Fix environment variable name mismatch in three files

  - [x] 3.1 Update app/receipt-capture/page.tsx
    - Change line 10: `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!` to `process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!`
    - _Bug_Condition: isBugCondition(input) where input.envVarName == 'NEXT_PUBLIC_SUPABASE_ANON_KEY' AND input.filePath == 'app/receipt-capture/page.tsx'_
    - _Expected_Behavior: Supabase client initializes successfully using the correct environment variable_
    - _Preservation: All other Supabase client initializations continue working unchanged_
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 3.2, 3.3_

  - [x] 3.2 Update components/TemplateGenerationStep.tsx
    - Change line 13: `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY` to `process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
    - _Bug_Condition: isBugCondition(input) where input.envVarName == 'NEXT_PUBLIC_SUPABASE_ANON_KEY' AND input.filePath == 'components/TemplateGenerationStep.tsx'_
    - _Expected_Behavior: Supabase client initializes successfully using the correct environment variable_
    - _Preservation: All other Supabase client initializations continue working unchanged_
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 3.2, 3.3_

  - [x] 3.3 Update components/ReceiptAssignment.tsx
    - Change line 16: `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY` to `process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
    - _Bug_Condition: isBugCondition(input) where input.envVarName == 'NEXT_PUBLIC_SUPABASE_ANON_KEY' AND input.filePath == 'components/ReceiptAssignment.tsx'_
    - _Expected_Behavior: Supabase client initializes successfully using the correct environment variable_
    - _Preservation: All other Supabase client initializations continue working unchanged_
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 3.2, 3.3_

  - [x] 3.4 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Supabase Client Initialization Succeeds
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: Expected Behavior Properties from design (2.1, 2.2)_

  - [x] 3.5 Verify preservation tests still pass
    - **Property 2: Preservation** - Existing Supabase Clients Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions)

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
