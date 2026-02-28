#!/usr/bin/env node

/**
 * Test Script for Receipt Parser Test Mode
 * 
 * This script demonstrates the test mode functionality of the Receipt_Parser.
 * It loads sample receipts and runs them through the parser with detailed logging.
 * 
 * Usage:
 *   node test-parser-mode.js [receipt-file-path]
 * 
 * If no file path is provided, it will test all sample receipts in test-receipts/
 */

const fs = require('fs');
const path = require('path');
const { testMode, loadTemplateFromConfig } = require('./lib/receiptParser');

// ANSI color codes for better output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

/**
 * Load a receipt file
 */
function loadReceiptFile(filePath) {
  try {
    const fullPath = path.resolve(filePath);
    if (!fs.existsSync(fullPath)) {
      console.error(`❌ File not found: ${fullPath}`);
      return null;
    }
    return fs.readFileSync(fullPath, 'utf8');
  } catch (error) {
    console.error(`❌ Error loading file ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Load all sample receipts from test-receipts directory
 */
function loadAllSampleReceipts() {
  const receiptsDir = path.join(__dirname, 'test-receipts');
  
  if (!fs.existsSync(receiptsDir)) {
    console.error(`❌ test-receipts directory not found: ${receiptsDir}`);
    return [];
  }

  const files = fs.readdirSync(receiptsDir).filter(f => f.endsWith('.txt'));
  const receipts = [];

  for (const file of files) {
    const filePath = path.join(receiptsDir, file);
    const content = loadReceiptFile(filePath);
    if (content) {
      receipts.push({
        name: file,
        content
      });
    }
  }

  return receipts;
}

/**
 * Load custom template from config.json if available
 */
function loadCustomTemplate() {
  try {
    const configPath = path.join(__dirname, 'config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      return loadTemplateFromConfig(config);
    }
  } catch (error) {
    console.log('ℹ️  No custom template found, using default');
  }
  return null;
}

/**
 * Main test function
 */
function main() {
  console.log(`${colors.bright}${colors.cyan}`);
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         Receipt Parser Test Mode                          ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(colors.reset);

  // Check if a specific file was provided
  const args = process.argv.slice(2);
  let receipts = [];

  if (args.length > 0) {
    // Test specific file
    const filePath = args[0];
    console.log(`\n📄 Testing single receipt: ${filePath}\n`);
    const content = loadReceiptFile(filePath);
    if (content) {
      receipts = [{ name: path.basename(filePath), content }];
    } else {
      process.exit(1);
    }
  } else {
    // Test all sample receipts
    console.log('\n📁 Testing all sample receipts from test-receipts/\n');
    receipts = loadAllSampleReceipts();
    
    if (receipts.length === 0) {
      console.error('❌ No sample receipts found');
      process.exit(1);
    }
  }

  // Load template
  const template = loadCustomTemplate();

  // Run test mode
  console.log(`${colors.blue}Starting parser test mode...${colors.reset}\n`);
  
  const results = testMode(
    receipts.map(r => r.content),
    template,
    { verbose: true, showRawText: false }
  );

  // Display receipt names mapping
  if (receipts.length > 1) {
    console.log(`${colors.bright}Receipt Files Tested:${colors.reset}`);
    receipts.forEach((r, i) => {
      const result = results.parsedReceipts[i];
      const confidenceColor = 
        result.confidence === 'high' ? colors.green :
        result.confidence === 'medium' ? colors.yellow :
        colors.reset;
      console.log(`   ${i + 1}. ${r.name} ${confidenceColor}[${result.confidence}]${colors.reset}`);
    });
    console.log('');
  }

  // Save results to JSON file
  const outputPath = path.join(__dirname, 'test-parser-results.json');
  try {
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`${colors.green}✓ Results saved to: ${outputPath}${colors.reset}\n`);
  } catch (error) {
    console.error(`⚠️  Could not save results: ${error.message}`);
  }

  // Exit with appropriate code
  const successRate = parseFloat(results.statistics.successRate);
  if (successRate >= 80) {
    console.log(`${colors.green}${colors.bright}✓ Test passed! Success rate: ${results.statistics.successRate}${colors.reset}\n`);
    process.exit(0);
  } else if (successRate >= 50) {
    console.log(`${colors.yellow}⚠️  Moderate success rate: ${results.statistics.successRate}${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.yellow}⚠️  Low success rate: ${results.statistics.successRate}${colors.reset}\n`);
    console.log('Consider adjusting the parsing template for better results.\n');
    process.exit(0);
  }
}

// Run main function
if (require.main === module) {
  main();
}

module.exports = { loadReceiptFile, loadAllSampleReceipts };
