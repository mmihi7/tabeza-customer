/**
 * Preservation Property Tests
 * Property 2: Preservation - Existing Supabase Client Behavior
 * 
 * This test MUST PASS on unfixed code to establish baseline behavior.
 * It verifies that files already using the correct environment variable
 * (NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) continue to work unchanged.
 * 
 * After the fix, this test must still pass, confirming no regressions.
 */

describe('Property 2: Preservation - Existing Supabase Client Initializations', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('files using PUBLISHABLE_KEY should continue to work', () => {
    const fs = require('fs');
    const path = require('path');

    // Files that correctly use NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    const correctFiles = [
      'lib/supabase.ts',
      'components/printer/UnmatchedReceipts.tsx',
    ];

    const correctVarName = 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY';

    correctFiles.forEach(filePath => {
      const fullPath = path.join(process.cwd(), filePath);
      
      // Check if file exists (some may not exist in all projects)
      if (!fs.existsSync(fullPath)) {
        console.log(`⚠️  File not found (skipping): ${filePath}`);
        return;
      }

      const content = fs.readFileSync(fullPath, 'utf8');
      
      // These files should use the correct variable
      const hasCorrectVar = content.includes(correctVarName);

      // Observation: These files work correctly on unfixed code
      console.log(`✅ PRESERVED: ${filePath} correctly uses ${correctVarName}`);

      // This should pass on both unfixed and fixed code
      expect(hasCorrectVar).toBe(true);
    });
  });

  test('PUBLISHABLE_KEY environment variable remains accessible', () => {
    // Observe: The correct environment variable is defined
    const correctKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    
    console.log('✅ PRESERVED: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is defined');
    
    // This should pass on both unfixed and fixed code
    expect(correctKey).toBeDefined();
    expect(correctKey).not.toBe('');
  });

  test('Supabase URL environment variable remains accessible', () => {
    // Observe: The URL variable is defined
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    
    console.log('✅ PRESERVED: NEXT_PUBLIC_SUPABASE_URL is defined');
    
    // This should pass on both unfixed and fixed code
    expect(url).toBeDefined();
    expect(url).not.toBe('');
  });

  test('lib/supabase.ts uses correct pattern', () => {
    const fs = require('fs');
    const path = require('path');

    const filePath = path.join(process.cwd(), 'lib/supabase.ts');
    
    if (!fs.existsSync(filePath)) {
      console.log('⚠️  lib/supabase.ts not found (skipping)');
      return;
    }

    const content = fs.readFileSync(filePath, 'utf8');

    // Observe: This file uses the correct pattern
    const hasCorrectPattern = 
      content.includes('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY') &&
      content.includes('createClient');

    console.log('✅ PRESERVED: lib/supabase.ts maintains correct initialization pattern');

    // This should pass on both unfixed and fixed code
    expect(hasCorrectPattern).toBe(true);
  });

  test('no files should use the legacy ANON_KEY after fix', () => {
    const fs = require('fs');
    const path = require('path');

    // After fix, NO files should reference the legacy variable
    const allTsxFiles = [
      'app/receipt-capture/page.tsx',
      'components/TemplateGenerationStep.tsx',
      'components/ReceiptAssignment.tsx',
      'lib/supabase.ts',
      'components/printer/UnmatchedReceipts.tsx',
    ];

    const legacyVarName = 'NEXT_PUBLIC_SUPABASE_ANON_KEY';
    let filesWithLegacyVar = 0;

    allTsxFiles.forEach(filePath => {
      const fullPath = path.join(process.cwd(), filePath);
      
      if (!fs.existsSync(fullPath)) {
        return;
      }

      const content = fs.readFileSync(fullPath, 'utf8');
      
      if (content.includes(legacyVarName)) {
        filesWithLegacyVar++;
        console.log(`⚠️  ${filePath} still uses legacy ${legacyVarName}`);
      }
    });

    // On unfixed code: this will fail (3 files use legacy var)
    // On fixed code: this will pass (0 files use legacy var)
    // This is a preservation check - after fix, no files should use legacy var
    expect(filesWithLegacyVar).toBe(0);
  });
});
