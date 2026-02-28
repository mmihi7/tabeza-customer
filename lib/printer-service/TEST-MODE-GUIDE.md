# Receipt Parser Test Mode Guide

## Overview

The Receipt Parser Test Mode allows you to validate parsing templates with actual POS receipts before deployment. It provides detailed parsing analysis, field extraction details, and parsing statistics.

## Features

- **Single or Batch Testing**: Test one receipt or multiple receipts at once
- **Detailed Field Extraction**: See exactly which fields were extracted and their values
- **Confidence Levels**: Understand parsing quality (high, medium, low)
- **Statistics**: Get success rates and confidence distribution across multiple receipts
- **Custom Templates**: Test with custom parsing templates from config.json

## Usage

### Command Line Script

Test a single receipt:
```bash
node test-parser-mode.js test-receipts/tusker-test-receipt.txt
```

Test all sample receipts:
```bash
node test-parser-mode.js
```

### Programmatic Usage

```javascript
const { testMode } = require('./lib/receiptParser');

// Test a single receipt
const singleResult = testMode(receiptText, null, { 
  verbose: true,
  showRawText: false 
});

// Test multiple receipts
const batchResult = testMode([receipt1, receipt2, receipt3], null, {
  verbose: true,
  showRawText: false
});

console.log('Success Rate:', batchResult.statistics.successRate);
console.log('High Confidence:', batchResult.statistics.high);
```

## Options

### `verbose` (default: true)
Enable detailed console logging with field extraction details and statistics.

```javascript
testMode(receiptText, null, { verbose: true });
```

### `showRawText` (default: false)
Include the raw receipt text in the results object.

```javascript
testMode(receiptText, null, { showRawText: true });
```

## Output Format

### Console Output

When `verbose: true`, the test mode displays:

```
============================================================
Testing Receipt 1 of 1
============================================================

📊 Parsing Results:
   Confidence Level: HIGH

📝 Fields Extracted:
   Receipt Number: ✓ RCP-2024-001234
   Timestamp:      ✓ 12/15/2024 8:45:30 PM
   Items:          ✓ 5 item(s) found
   Subtotal:       ✓ 2210.00
   Tax:            ✓ 353.60
   Total:          ✓ 2563.60

🛒 Items Details:
   1. Tusker Lager 500ml
      Quantity: 2, Price: 500.00
   2. Nyama Choma (Half Kg)
      Quantity: 1, Price: 800.00
   ...

============================================================
📈 PARSING STATISTICS
============================================================
Total Receipts Tested: 1

Confidence Distribution:
   High:   1 (100.0%)
   Medium: 0 (0.0%)
   Low:    0 (0.0%)

Success Rate: 100.0%
Template Used: default
============================================================
```

### JSON Output

Results are automatically saved to `test-parser-results.json`:

```json
{
  "totalReceipts": 1,
  "parsedReceipts": [
    {
      "index": 1,
      "confidence": "high",
      "fieldsExtracted": {
        "receiptNumber": true,
        "timestamp": true,
        "items": 5,
        "subtotal": true,
        "tax": true,
        "total": true
      },
      "parsedData": {
        "receiptNumber": "RCP-2024-001234",
        "timestamp": "12/15/2024 8:45:30 PM",
        "items": [...],
        "subtotal": 2210.00,
        "tax": 353.60,
        "total": 2563.60
      }
    }
  ],
  "statistics": {
    "high": 1,
    "medium": 0,
    "low": 0,
    "successRate": "100.0%",
    "confidenceDistribution": {
      "high": "100.0%",
      "medium": "0.0%",
      "low": "0.0%"
    }
  },
  "templateUsed": "default"
}
```

## Confidence Levels

### High Confidence
All major fields extracted:
- Receipt number
- Timestamp
- Items (with quantities and prices)
- Subtotal
- Tax
- Total

### Medium Confidence
Partial extraction:
- Items + Total, OR
- Total + (Receipt number OR Timestamp)

### Low Confidence
Minimal or failed extraction:
- Only total, OR
- No fields extracted

## Custom Templates

To test with a custom template, add it to `config.json`:

```json
{
  "parsingTemplate": {
    "receiptNumber": "Receipt\\s*#?:?\\s*(\\S+)",
    "timestamp": "(\\d{1,2}/\\d{1,2}/\\d{4}\\s+\\d{1,2}:\\d{2}(?::\\d{2})?(?:\\s*[AP]M)?)",
    "items": {
      "pattern": "^(\\d+)\\s+(.+?)\\s{2,}(\\d+(?:,\\d{3})*\\.\\d{2})$",
      "multiline": true,
      "startMarker": "QTY\\s+ITEM\\s+AMOUNT",
      "endMarker": "^-{3,}|Subtotal|Total"
    },
    "subtotal": "Subtotal:?\\s*(\\d+(?:,\\d{3})*\\.\\d{2})",
    "tax": "(?:VAT|Tax)(?:\\s*\\(\\d+%\\))?:?\\s*(\\d+(?:,\\d{3})*\\.\\d{2})",
    "total": "^\\s*TOTAL:?\\s*(\\d+(?:,\\d{3})*\\.\\d{2})"
  }
}
```

The test script will automatically load and use the custom template.

## Sample Receipts

The `test-receipts/` directory contains sample receipts for testing:

- `tusker-test-receipt.txt` - Full receipt with all fields (default template format)
- `captain-orders-receipt.txt` - Alternative POS format
- `minimal-receipt.txt` - Only total, no items
- `malformed-receipt.txt` - Invalid format
- `empty-receipt.txt` - Empty file

## Interpreting Results

### Success Rate
- **80-100%**: Excellent - Template works well for your receipts
- **50-79%**: Moderate - Template may need adjustment
- **0-49%**: Poor - Template needs significant adjustment

### Common Issues

**No items extracted**:
- Check `items.pattern` regex matches your receipt format
- Verify `startMarker` and `endMarker` are correct
- Ensure at least 2 spaces separate item name from price

**Wrong total extracted**:
- Check `total` pattern matches your receipt format
- Verify the pattern is anchored to start of line (`^`)
- Check for case sensitivity

**No receipt number/timestamp**:
- These are optional fields
- Verify the patterns match your receipt format
- Check for variations in formatting

## Requirements Validated

This test mode validates:
- **Requirement 8.1**: Accept sample receipt text for testing
- **Requirement 8.2**: Log parsing results with field extraction details
- **Requirement 8.6**: Provide parsing statistics (success rate, confidence distribution)

## Exit Codes

The test script exits with:
- `0`: Success (any success rate)
- The script always exits successfully to allow for iterative testing

## Next Steps

After testing:
1. Review the parsing statistics
2. Adjust your template if needed
3. Re-test with the updated template
4. Deploy to production once success rate is satisfactory
