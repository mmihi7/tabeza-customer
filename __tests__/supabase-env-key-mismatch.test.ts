/**
 * Bug Condition Exploration Test
 * Property 1: Bug Condition - Environment Variable Mismatch
 * 
 * This test MUST FAIL on unfixed code to confirm the bug exists.
 * It verifies that:
 * 1. NEXT_PUBLIC_SUPABASE_ANON_KEY is undefined (the bug condition)
 * 2. NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is defined (the correct variable)
 * 3. Attempting to use the wrong variable would cause initialization failure
 * 
 * After the fix, this test will pass, confirming the bug is resolved.
 */

describe('Property 1: Bug Condition - Supabase Environment Variable Mismatch', () => {
  // Store original env
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset modules to ensure fresh imports
    jest.resetModules();
    // Restore original env
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('NEXT_PUBLIC_SUPABASE_ANON_KEY should be undefined (bug condition)', () => {
    // This confirms the bug condition exists
    expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBeUndefined();
  });

  test('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY should be defined (correct variable)', () => {
    // This confirms the correct variable exists in .env.local
    expect(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).toBeDefined();
    expect(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).not.toBe('');
  });

  test('files using ANON_KEY would fail to initialize Supabase client', () => {
    // Simulate what happens in the three affected files
    const wrongKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const correctKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

    // Bug condition: wrong key is undefined
    expect(wrongKey).toBeUndefined();
    
    // Expected behavior: correct key is defined
    expect(correctKey).toBeDefined();
    expect(url).toBeDefined();

    // This would cause createClient to throw "supabaseKey is required"
    // We can't actually call createClient here without importing it,
    // but we've confirmed the bug condition exists
  });

  test('affected files reference the wrong environment variable', () => {
    const fs = require('fs');
    const path = require('path');

    const affectedFiles = [
      'app/receipt-capture/page.tsx',
      'components/TemplateGenerationStep.tsx',
      'components/ReceiptAssignment.tsx'
    ];

    const wrongVarName = 'NEXT_PUBLIC_SUPABASE_ANON_KEY';
    const correctVarName = 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY';

    affectedFiles.forEach(filePath => {
      const fullPath = path.join(process.cwd(), filePath);
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // On unfixed code, these files should contain the wrong variable name
      const hasWrongVar = content.includes(wrongVarName);
      const hasCorrectVar = content.includes(correctVarName);

      // Document the counterexample
      if (hasWrongVar) {
        console.log(`❌ COUNTEREXAMPLE FOUND: ${filePath} uses ${wrongVarName} (undefined)`);
        console.log(`   Expected: Should use ${correctVarName} instead`);
      }

      // This assertion will FAIL on unfixed code (expected)
      // After fix, it will PASS
      expect(hasWrongVar).toBe(false); // Should NOT have wrong var
      expect(hasCorrectVar).toBe(true); // Should have correct var
    });
  });
});
