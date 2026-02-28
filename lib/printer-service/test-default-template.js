/**
 * Test script for validating the default parsing template
 * Tests the DEFAULT_TEMPLATE against the Tusker test receipt
 */

const fs = require('fs');
const path = require('path');
const { parseReceipt, formatReceipt, DEFAULT_TEMPLATE } = require('./lib/receiptParser');

console.log('='.repeat(60));
console.log('DEFAULT TEMPLATE VALIDATION TEST');
console.log('='.repeat(60));
console.log();

// Load the Tusker test receipt
const receiptPath = path.join(__dirname, 'test-receipts', 'tusker-test-receipt.txt');
let receiptText;

try {
  receiptText = fs.readFileSync(receiptPath, 'utf8');
  console.log('✓ Loaded test receipt from:', receiptPath);
  console.log();
} catch (error) {
  console.error('✗ Failed to load test receipt:', error.message);
  process.exit(1);
}

// Display the template being used
console.log('DEFAULT TEMPLATE:');
console.log(JSON.stringify(DEFAULT_TEMPLATE, null, 2));
console.log();
console.log('='.repeat(60));
console.log();

// Parse the receipt
console.log('PARSING RECEIPT...');
console.log();

const parsed = parseReceipt(receiptText);

// Display results
console.log('PARSED RESULTS:');
console.log('-'.repeat(60));
console.log('Receipt Number:', parsed.receiptNumber || '(not found)');
console.log('Timestamp:', parsed.timestamp || '(not found)');
console.log('Confidence:', parsed.confidence);
console.log();

console.log('Items:', parsed.items.length);
if (parsed.items.length > 0) {
  parsed.items.forEach((item, index) => {
    console.log(`  ${index + 1}. ${item.quantity}x ${item.name} - ${item.price.toFixed(2)}`);
  });
} else {
  console.log('  (no items found)');
}
console.log();

console.log('Financial Totals:');
console.log('  Subtotal:', parsed.subtotal ? parsed.subtotal.toFixed(2) : '(not found)');
console.log('  Tax:', parsed.tax ? parsed.tax.toFixed(2) : '(not found)');
console.log('  Total:', parsed.total ? parsed.total.toFixed(2) : '(not found)');
console.log();

// Validate expected values
console.log('='.repeat(60));
console.log('VALIDATION:');
console.log('-'.repeat(60));

const validations = [
  { name: 'Receipt Number', expected: 'RCP-2024-001234', actual: parsed.receiptNumber },
  { name: 'Timestamp', expected: '12/15/2024 8:45:30 PM', actual: parsed.timestamp },
  { name: 'Item Count', expected: 5, actual: parsed.items.length },
  { name: 'Subtotal', expected: 2210.00, actual: parsed.subtotal },
  { name: 'Tax', expected: 353.60, actual: parsed.tax },
  { name: 'Total', expected: 2563.60, actual: parsed.total },
  { name: 'Confidence', expected: 'high', actual: parsed.confidence }
];

let passCount = 0;
let failCount = 0;

validations.forEach(({ name, expected, actual }) => {
  const matches = JSON.stringify(expected) === JSON.stringify(actual);
  const status = matches ? '✓ PASS' : '✗ FAIL';
  
  if (matches) {
    passCount++;
    console.log(`${status} ${name}: ${JSON.stringify(actual)}`);
  } else {
    failCount++;
    console.log(`${status} ${name}`);
    console.log(`       Expected: ${JSON.stringify(expected)}`);
    console.log(`       Actual:   ${JSON.stringify(actual)}`);
  }
});

console.log();
console.log('='.repeat(60));
console.log(`RESULTS: ${passCount} passed, ${failCount} failed`);
console.log('='.repeat(60));
console.log();

// Test formatReceipt function
console.log('TESTING FORMAT FUNCTION:');
console.log('-'.repeat(60));
const formatted = formatReceipt(parsed);
console.log(formatted);
console.log();
console.log('='.repeat(60));

// Exit with appropriate code
process.exit(failCount > 0 ? 1 : 0);
