/**
 * Test script for badge awarding logic
 * This script tests the badge awarding functionality
 */

import { awardBadgeForTabPayment } from '../lib/badge-awarding';

// Test cases for badge awarding
const testCases = [
  {
    name: 'Low amount - no badge',
    tabId: 'test-tab-1',
    customerId: 'test-customer-1',
    tabTotal: 500,
    expectedBadge: null
  },
  {
    name: 'Bronze threshold',
    tabId: 'test-tab-2',
    customerId: 'test-customer-2',
    tabTotal: 1500,
    expectedBadge: 'bronze'
  },
  {
    name: 'Silver threshold',
    tabId: 'test-tab-3',
    customerId: 'test-customer-3',
    tabTotal: 3500,
    expectedBadge: 'silver'
  },
  {
    name: 'Gold threshold',
    tabId: 'test-tab-4',
    customerId: 'test-customer-4',
    tabTotal: 6000,
    expectedBadge: 'gold'
  }
];

async function runBadgeTests() {
  console.log('🏆 Testing Badge Awarding Logic\n');
  
  for (const testCase of testCases) {
    console.log(`📝 Testing: ${testCase.name}`);
    console.log(`   Tab Total: KES ${testCase.tabTotal}`);
    
    try {
      // Mock the database calls for testing
      const originalCreateClient = require('@supabase/supabase-js').createClient;
      
      // Mock Supabase client
      require('@supabase/supabase-js').createClient = () => ({
        from: (table: string) => ({
          select: (columns: string) => ({
            eq: (column: string, value: string) => ({
              single: () => {
                if (table === 'customer_profiles') {
                  // Mock no existing badge
                  return Promise.resolve({
                    data: { current_badge: null },
                    error: null
                  });
                }
                return Promise.resolve({ data: null, error: 'Table not found' });
              }
            })
          }),
          update: (data: any) => ({
            eq: (column: string, value: string) => ({
              single: () => Promise.resolve({ error: null })
            })
          })
        })
      });
      
      const result = await awardBadgeForTabPayment(
        testCase.tabId,
        testCase.customerId,
        testCase.tabTotal
      );
      
      if (result.success) {
        if (result.awardedBadge === testCase.expectedBadge) {
          console.log(`   ✅ PASS: Awarded ${result.awardedBadge || 'no badge'}`);
        } else {
          console.log(`   ❌ FAIL: Expected ${testCase.expectedBadge}, got ${result.awardedBadge}`);
        }
      } else {
        console.log(`   ❌ FAIL: ${result.error}`);
      }
      
      // Restore original function
      require('@supabase/supabase-js').createClient = originalCreateClient;
      
    } catch (error) {
      console.log(`   ❌ ERROR: ${error}`);
    }
    
    console.log('');
  }
  
  console.log('🎯 Badge Awarding Logic Test Complete');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runBadgeTests().catch(console.error);
}

export { runBadgeTests };
