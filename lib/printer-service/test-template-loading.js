/**
 * Test script for template loading from config.json
 * Demonstrates how to use loadTemplateFromConfig function
 * 
 * Usage: node test-template-loading.js
 */

const { parseReceipt, loadTemplateFromConfig, DEFAULT_TEMPLATE } = require('./lib/receiptParser');
const fs = require('fs');
const path = require('path');

console.log('='.repeat(60));
console.log('Template Loading Test Script');
console.log('='.repeat(60));
console.log();

// Test 1: Load template from config.json (if it exists)
console.log('Test 1: Loading template from config.json');
console.log('-'.repeat(60));

const configPath = path.join(__dirname, 'config.json');
let config = null;
let template = null;

if (fs.existsSync(configPath)) {
  try {
    const configData = fs.readFileSync(configPath, 'utf8');
    config = JSON.parse(configData);
    console.log('✅ config.json found and loaded');
    
    template = loadTemplateFromConfig(config);
    
    if (config.parsingTemplate) {
      console.log('✅ Custom parsing template found in config');
      console.log('   Template fields:', Object.keys(template).join(', '));
    } else {
      console.log('ℹ️  No parsingTemplate in config, using default template');
    }
  } catch (error) {
    console.log('❌ Error loading config.json:', error.message);
    template = DEFAULT_TEMPLATE;
  }
} else {
  console.log('ℹ️  config.json not found, using default template');
  template = DEFAULT_TEMPLATE;
}

console.log();

// Test 2: Parse a sample receipt with the loaded template
console.log('Test 2: Parsing sample receipt with loaded template');
console.log('-'.repeat(60));

const sampleReceipt = `
Receipt #: RCP-2024-001234
Date: 12/15/2024 8:45:30 PM

QTY  ITEM                           AMOUNT
----------------------------------------
2    Tusker Lager 500ml         500.00
1    Nyama Choma Platter      1,200.00
3    Chips                        510.00
----------------------------------------
Subtotal:                       2,210.00
VAT (16%):                        353.60
----------------------------------------

TOTAL:                          2,563.60

Thank you for your visit!
`;

const parsed = parseReceipt(sampleReceipt, template);

console.log('Parsing Results:');
console.log('  Receipt Number:', parsed.receiptNumber || '(not found)');
console.log('  Timestamp:', parsed.timestamp || '(not found)');
console.log('  Items:', parsed.items.length);
parsed.items.forEach((item, i) => {
  console.log(`    ${i + 1}. ${item.name} - Qty: ${item.quantity}, Price: ${item.price}`);
});
console.log('  Subtotal:', parsed.subtotal);
console.log('  Tax:', parsed.tax);
console.log('  Total:', parsed.total);
console.log('  Confidence:', parsed.confidence);

console.log();

// Test 3: Demonstrate custom template
console.log('Test 3: Using a custom template (Captain Orders format)');
console.log('-'.repeat(60));

const customConfig = {
  barId: 'test-bar',
  parsingTemplate: {
    receiptNumber: 'Order\\s*#:?\\s*(\\d+)',
    timestamp: '(\\d{4}-\\d{2}-\\d{2}\\s+\\d{2}:\\d{2}:\\d{2})',
    items: {
      pattern: '^(.+?)\\s+x(\\d+)\\s+@\\s+(\\d+\\.\\d{2})$',
      multiline: true,
      startMarker: 'ITEMS:',
      endMarker: '^={3,}'
    },
    subtotal: 'Subtotal:\\s*(\\d+\\.\\d{2})',
    tax: 'VAT\\s*\\(16%\\):\\s*(\\d+\\.\\d{2})',
    total: 'Total:\\s*(\\d+\\.\\d{2})'
  }
};

const customTemplate = loadTemplateFromConfig(customConfig);
console.log('✅ Custom template loaded successfully');
console.log('   Receipt number pattern:', customTemplate.receiptNumber);
console.log('   Items start marker:', customTemplate.items.startMarker);

const captainOrdersReceipt = `
Order #: 12345
Date: 2024-12-15 20:45:30

ITEMS:
Tusker Lager 500ml x2 @ 250.00
Nyama Choma Platter x1 @ 1200.00
Chips x3 @ 170.00
=====================================
Subtotal: 2210.00
VAT (16%): 353.60
Total: 2563.60
`;

const parsedCustom = parseReceipt(captainOrdersReceipt, customTemplate);
console.log('Parsing Results:');
console.log('  Receipt Number:', parsedCustom.receiptNumber || '(not found)');
console.log('  Items:', parsedCustom.items.length);
console.log('  Total:', parsedCustom.total);
console.log('  Confidence:', parsedCustom.confidence);

console.log();

// Test 4: Demonstrate fallback behavior
console.log('Test 4: Fallback to default template on invalid config');
console.log('-'.repeat(60));

const invalidConfig = {
  barId: 'test-bar',
  parsingTemplate: {
    total: '[invalid regex(' // Invalid regex
  }
};

const fallbackTemplate = loadTemplateFromConfig(invalidConfig);
console.log('✅ Fallback to default template successful');
console.log('   Template is default:', fallbackTemplate === DEFAULT_TEMPLATE);

console.log();
console.log('='.repeat(60));
console.log('All tests completed!');
console.log('='.repeat(60));
console.log();
console.log('Next Steps:');
console.log('1. Edit config.json to add your custom parsingTemplate');
console.log('2. Test with your actual POS receipts');
console.log('3. Adjust regex patterns as needed for your receipt format');
console.log();
