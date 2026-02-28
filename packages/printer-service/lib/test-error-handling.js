/**
 * Test script to verify never-reject guarantee
 * Tests all error scenarios to ensure parseReceipt never throws exceptions
 */

const { parseReceipt, formatReceipt, validatePattern } = require('./receiptParser.js');

console.log('='.repeat(60));
console.log('Testing Never-Reject Guarantee');
console.log('='.repeat(60));

let testsPassed = 0;
let testsFailed = 0;

function runTest(testName, testFn) {
  try {
    console.log(`\n[TEST] ${testName}`);
    testFn();
    testsPassed++;
    console.log('✓ PASSED');
  } catch (error) {
    testsFailed++;
    console.log('✗ FAILED:', error.message);
  }
}

// Test 1: Valid receipt text
runTest('Valid receipt with total', () => {
  const result = parseReceipt('TOTAL: 100.00');
  if (result.total !== 100) throw new Error('Expected total to be 100');
  if (result.confidence !== 'low') throw new Error('Expected low confidence');
});

// Test 2: Null input
runTest('Null input returns low confidence', () => {
  const result = parseReceipt(null);
  if (result.confidence !== 'low') throw new Error('Expected low confidence');
  if (!result.error) throw new Error('Expected error field');
});

// Test 3: Undefined input
runTest('Undefined input returns low confidence', () => {
  const result = parseReceipt(undefined);
  if (result.confidence !== 'low') throw new Error('Expected low confidence');
});

// Test 4: Number input
runTest('Number input returns low confidence', () => {
  const result = parseReceipt(123);
  if (result.confidence !== 'low') throw new Error('Expected low confidence');
});

// Test 5: Object input
runTest('Object input returns low confidence', () => {
  const result = parseReceipt({ foo: 'bar' });
  if (result.confidence !== 'low') throw new Error('Expected low confidence');
});

// Test 6: Array input
runTest('Array input returns low confidence', () => {
  const result = parseReceipt(['test']);
  if (result.confidence !== 'low') throw new Error('Expected low confidence');
});

// Test 7: Empty string
runTest('Empty string returns low confidence', () => {
  const result = parseReceipt('');
  if (result.confidence !== 'low') throw new Error('Expected low confidence');
});

// Test 8: Invalid template
runTest('Invalid template falls back to default', () => {
  const result = parseReceipt('TOTAL: 50.00', null);
  if (result.total !== 50) throw new Error('Expected total to be 50');
});

// Test 9: Template with invalid regex
runTest('Template with invalid regex returns low confidence', () => {
  const badTemplate = {
    total: '[invalid(regex'
  };
  const result = parseReceipt('TOTAL: 75.00', badTemplate);
  // Should not throw, should return low confidence
  if (result.confidence !== 'low') throw new Error('Expected low confidence');
});

// Test 10: Very long text
runTest('Very long text does not crash', () => {
  const longText = 'A'.repeat(100000) + '\nTOTAL: 200.00';
  const result = parseReceipt(longText);
  if (result.total !== 200) throw new Error('Expected total to be 200');
});

// Test 11: Special characters
runTest('Special characters do not crash', () => {
  const specialText = '!@#$%^&*()_+{}|:"<>?~`\nTOTAL: 300.00';
  const result = parseReceipt(specialText);
  if (result.total !== 300) throw new Error('Expected total to be 300');
});

// Test 12: Unicode characters
runTest('Unicode characters do not crash', () => {
  const unicodeText = '你好世界\nTOTAL: 400.00';
  const result = parseReceipt(unicodeText);
  if (result.total !== 400) throw new Error('Expected total to be 400');
});

// Test 13: Null bytes (PostgreSQL issue)
runTest('Null bytes do not crash', () => {
  const nullByteText = 'Test\x00Receipt\nTOTAL: 500.00';
  const result = parseReceipt(nullByteText);
  // Should not throw
  if (!result) throw new Error('Expected result object');
});

// Test 14: validatePattern with invalid input
runTest('validatePattern handles invalid input', () => {
  if (validatePattern(null) !== false) throw new Error('Expected false for null');
  if (validatePattern(undefined) !== false) throw new Error('Expected false for undefined');
  if (validatePattern(123) !== false) throw new Error('Expected false for number');
  if (validatePattern('[invalid') !== false) throw new Error('Expected false for invalid regex');
});

// Test 15: validatePattern with valid input
runTest('validatePattern accepts valid regex', () => {
  if (validatePattern('\\d+') !== true) throw new Error('Expected true for valid regex');
  if (validatePattern('test') !== true) throw new Error('Expected true for simple string');
});

// Test 16: formatReceipt with null input
runTest('formatReceipt handles null input', () => {
  const result = formatReceipt(null);
  if (typeof result !== 'string') throw new Error('Expected string result');
});

// Test 17: formatReceipt with valid data
runTest('formatReceipt produces readable output', () => {
  const data = {
    receiptNumber: 'R123',
    timestamp: '12/25/2024 10:30 AM',
    items: [
      { name: 'Item 1', quantity: 2, price: 10.00 },
      { name: 'Item 2', quantity: 1, price: 15.00 }
    ],
    subtotal: 35.00,
    tax: 3.50,
    total: 38.50
  };
  const result = formatReceipt(data);
  if (!result.includes('R123')) throw new Error('Expected receipt number in output');
  if (!result.includes('Item 1')) throw new Error('Expected item name in output');
  if (!result.includes('38.50')) throw new Error('Expected total in output');
});

// Test 18: formatReceipt with missing fields
runTest('formatReceipt handles missing fields', () => {
  const data = {
    items: [],
    total: 0
  };
  const result = formatReceipt(data);
  if (typeof result !== 'string') throw new Error('Expected string result');
});

// Test 19: Complex receipt does not crash
runTest('Complex receipt does not crash', () => {
  const complexReceipt = `
Receipt #: ABC123
Date: 12/25/2024 10:30 AM

QTY  ITEM                           AMOUNT
----------------------------------------
2 Tusker Lager 10.00
1 Chicken Wings 15.00
----------------------------------------
Subtotal: 25.00
Tax (16%): 4.00
TOTAL: 29.00
`;
  const result = parseReceipt(complexReceipt);
  // Should not throw - verify we got a valid result
  if (!result) throw new Error('Expected result object');
  if (result.receiptNumber !== 'ABC123') throw new Error('Expected receipt number ABC123');
  if (!['high', 'medium', 'low'].includes(result.confidence)) throw new Error('Expected valid confidence level');
});

// Test 20: Malformed items section
runTest('Malformed items section does not crash', () => {
  const malformedReceipt = `
QTY  ITEM                           AMOUNT
----------------------------------------
This is not a valid item line
2    Missing price
----------------------------------------
TOTAL: 100.00
`;
  const result = parseReceipt(malformedReceipt);
  // Should not throw, items array may be empty
  if (!Array.isArray(result.items)) throw new Error('Expected items array');
});

console.log('\n' + '='.repeat(60));
console.log(`Tests Passed: ${testsPassed}`);
console.log(`Tests Failed: ${testsFailed}`);
console.log('='.repeat(60));

if (testsFailed > 0) {
  console.log('\n❌ Some tests failed!');
  process.exit(1);
} else {
  console.log('\n✅ All tests passed! Never-reject guarantee verified.');
  process.exit(0);
}
