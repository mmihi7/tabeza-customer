# Template Validation Guide

## Overview

The Template Validation Script helps you test custom parsing templates against sample receipts before deploying to production. It validates template structure, tests parsing accuracy, and provides actionable feedback for improvement.

## Quick Start

```bash
# Test template from config.json against all sample receipts
node validate-template.js

# Test custom template file against specific receipt
node validate-template.js my-template.json test-receipts/tusker-test-receipt.txt

# Test with round-trip validation
node validate-template.js --round-trip

# Quiet mode (only show summary)
node validate-template.js --quiet
```

## Features

### 1. Template Structure Validation

Validates your template before testing:
- ✅ Required fields (total pattern)
- ✅ Optional fields (receiptNumber, timestamp, subtotal, tax)
- ✅ Items configuration (pattern, startMarker, endMarker)
- ✅ Regex pattern validity
- ⚠️ Warnings for potential issues

### 2. Parsing Accuracy Testing

Tests your template against real receipts:
- **Confidence Levels**: High, Medium, Low
- **Field Extraction**: Shows which fields were found
- **Item Details**: Lists all extracted items with quantities and prices
- **Success Rate**: Overall parsing effectiveness

### 3. Round-Trip Validation

Tests consistency of parsing and formatting:
- Parse receipt → Format to text → Parse again
- Compares original and reparsed data
- Identifies discrepancies in field preservation
- Validates data integrity through transformation

### 4. Detailed Reporting

Provides comprehensive feedback:
- Per-receipt parsing results
- Overall statistics and success rate
- Common issues and recommendations
- JSON output for programmatic analysis

## Usage

### Command Line Options

```
node validate-template.js [options] [template-file] [receipt-file]

OPTIONS:
  --config <file>    Load template from config file (default: config.json)
  --help, -h         Show help message
  --verbose, -v      Show detailed parsing output
  --quiet, -q        Minimal output (only errors and summary)
  --round-trip       Test round-trip consistency
```

### Examples

#### Test Default Template

```bash
# Uses template from config.json or default template
node validate-template.js
```

Output:
```
╔═══════════════════════════════════════════════════════════╗
║         Template Validation Script                       ║
╚═══════════════════════════════════════════════════════════╝

✓ Template loaded from: config.json

Template Structure Validation
────────────────────────────────────────────────────────────
✓ Template structure is valid

✓ Loaded 5 sample receipt(s)

Receipt 1/5: tusker-test-receipt.txt
────────────────────────────────────────────────────────────
Confidence: HIGH

Fields Extracted:
  Receipt Number: ✓ RCP-2024-001234
  Timestamp:      ✓ 12/15/2024 8:45:30 PM
  Items:          ✓ 5 item(s)
  Subtotal:       ✓ 2210.00
  Tax:            ✓ 353.60
  Total:          ✓ 2563.60

...

═══════════════════════════════════════════════════════════
                    VALIDATION SUMMARY
═══════════════════════════════════════════════════════════

Parsing Results:
  Total Receipts:  5
  High Confidence: 3 (60.0%)
  Medium Confidence: 1 (20.0%)
  Low Confidence: 1 (20.0%)
  Success Rate: 80.0%

Recommendations:
  ✓ Excellent! Template works well for your receipts.
    Ready for production deployment.

✓ Results saved to: template-validation-results.json
```

#### Test Custom Template File

```bash
node validate-template.js my-custom-template.json
```

#### Test Specific Receipt

```bash
node validate-template.js my-template.json test-receipts/captain-orders-receipt.txt
```

#### Verbose Mode

```bash
node validate-template.js --verbose
```

Shows detailed item extraction:
```
Items:
  1. Tusker Lager 500ml
     Qty: 2, Price: 250.00
  2. Nyama Choma Platter
     Qty: 1, Price: 1200.00
  3. Chips
     Qty: 3, Price: 170.00
```

#### Round-Trip Testing

```bash
node validate-template.js --round-trip
```

Tests parse → format → parse consistency:
```
Round-Trip Test: tusker-test-receipt.txt
────────────────────────────────────────────────────────────
✓ Round-trip test passed

Round-Trip Tests:
  Passed: 4
  Failed: 0
  Skipped: 1
```

#### Quiet Mode

```bash
node validate-template.js --quiet
```

Only shows summary statistics and errors.

## Template File Format

### Basic Template

```json
{
  "receiptNumber": "Receipt\\s*#?:?\\s*(\\S+)",
  "timestamp": "(\\d{1,2}/\\d{1,2}/\\d{4}\\s+\\d{1,2}:\\d{2})",
  "items": {
    "pattern": "^(\\d+)\\s+(.+?)\\s{2,}(\\d+\\.\\d{2})$",
    "multiline": true,
    "startMarker": "QTY\\s+ITEM\\s+AMOUNT",
    "endMarker": "^-{3,}|Subtotal|Total"
  },
  "subtotal": "Subtotal:?\\s*(\\d+\\.\\d{2})",
  "tax": "(?:VAT|Tax):?\\s*(\\d+\\.\\d{2})",
  "total": "^\\s*TOTAL:?\\s*(\\d+\\.\\d{2})"
}
```

### Field Descriptions

#### Required Fields

- **total**: Regex pattern to extract total amount (REQUIRED)
  - Must match the total line in your receipts
  - Use `^` to anchor to start of line
  - Capture group `(\\d+\\.\\d{2})` extracts the number

#### Optional Fields

- **receiptNumber**: Pattern to extract receipt/order number
- **timestamp**: Pattern to extract date/time
- **subtotal**: Pattern to extract subtotal before tax
- **tax**: Pattern to extract tax/VAT amount

#### Items Configuration

- **pattern**: Regex with 3 capture groups:
  1. Quantity (digits)
  2. Item name (text)
  3. Price (decimal number)
- **multiline**: Set to `true` for multi-line item extraction
- **startMarker**: Regex to detect items section start (e.g., header line)
- **endMarker**: Regex to detect items section end (e.g., separator or totals)

### Pattern Tips

#### Matching Numbers

```json
// Integer
"\\d+"

// Decimal with 2 places
"\\d+\\.\\d{2}"

// Decimal with optional commas (1,234.56)
"\\d+(?:,\\d{3})*\\.\\d{2}"

// Optional decimal places
"\\d+(?:\\.\\d{1,2})?"
```

#### Matching Dates/Times

```json
// MM/DD/YYYY HH:MM:SS AM/PM
"(\\d{1,2}/\\d{1,2}/\\d{4}\\s+\\d{1,2}:\\d{2}(?::\\d{2})?(?:\\s*[AP]M)?)"

// YYYY-MM-DD HH:MM:SS
"(\\d{4}-\\d{2}-\\d{2}\\s+\\d{2}:\\d{2}:\\d{2})"

// DD/MM/YYYY
"(\\d{1,2}/\\d{1,2}/\\d{4})"
```

#### Matching Receipt Numbers

```json
// Receipt #: 12345 or Receipt: 12345
"Receipt\\s*#?:?\\s*(\\S+)"

// Order #: 12345
"Order\\s*#:?\\s*(\\d+)"

// Any alphanumeric ID
"(?:Receipt|Order|Invoice)\\s*#?:?\\s*([A-Z0-9-]+)"
```

#### Matching Items

```json
// Format: "2    Tusker Lager 500ml         500.00"
// Requires at least 2 spaces before price
"^(\\d+)\\s+(.+?)\\s{2,}(\\d+\\.\\d{2})$"

// Format: "Tusker Lager 500ml x2 @ 250.00"
"^(.+?)\\s+x(\\d+)\\s+@\\s+(\\d+\\.\\d{2})$"

// Format: "2 x Tusker Lager 500ml - 500.00"
"^(\\d+)\\s+x\\s+(.+?)\\s+-\\s+(\\d+\\.\\d{2})$"
```

## Understanding Results

### Confidence Levels

#### High Confidence ✅
All major fields extracted:
- Receipt number ✓
- Timestamp ✓
- Items (with quantities and prices) ✓
- Subtotal ✓
- Tax ✓
- Total ✓

**Action**: Template is working perfectly for this receipt format.

#### Medium Confidence ⚠️
Partial extraction:
- Items + Total, OR
- Total + (Receipt number OR Timestamp)

**Action**: Template works but could be improved. Review missing fields.

#### Low Confidence ❌
Minimal or failed extraction:
- Only total, OR
- No fields extracted

**Action**: Template needs adjustment. Check patterns match your receipt format.

### Success Rate

- **80-100%**: Excellent - Ready for production
- **50-79%**: Moderate - Needs adjustment
- **0-49%**: Poor - Significant changes needed

### Common Issues

#### No Items Extracted

**Problem**: Items pattern doesn't match your receipt format

**Solutions**:
1. Check `items.pattern` matches your item line format
2. Verify `startMarker` detects the items section header
3. Ensure `endMarker` correctly identifies section end
4. Confirm at least 2 spaces separate item name from price

**Example Fix**:
```json
// Before (not working)
"items": {
  "pattern": "^(\\d+)\\s+(.+?)\\s+(\\d+\\.\\d{2})$"
}

// After (working)
"items": {
  "pattern": "^(\\d+)\\s+(.+?)\\s{2,}(\\d+\\.\\d{2})$",
  "startMarker": "QTY\\s+ITEM\\s+AMOUNT",
  "endMarker": "^-{3,}|Subtotal"
}
```

#### Wrong Total Extracted

**Problem**: Total pattern matches wrong line or format

**Solutions**:
1. Anchor pattern to start of line with `^`
2. Make pattern case-insensitive or match exact case
3. Check for extra whitespace or formatting
4. Verify decimal format (2 places vs variable)

**Example Fix**:
```json
// Before (matches any "TOTAL" in text)
"total": "TOTAL:?\\s*(\\d+\\.\\d{2})"

// After (matches only at line start)
"total": "^\\s*TOTAL:?\\s*(\\d+\\.\\d{2})"
```

#### No Receipt Number/Timestamp

**Problem**: Pattern doesn't match your format

**Solutions**:
1. Check actual format in your receipts
2. Adjust pattern to match variations
3. Make optional parts truly optional with `?`
4. Test pattern in isolation

**Example Fix**:
```json
// Before (requires "Receipt #:")
"receiptNumber": "Receipt\\s*#:\\s*(\\S+)"

// After (flexible format)
"receiptNumber": "Receipt\\s*#?:?\\s*(\\S+)"
```

## Output Files

### template-validation-results.json

Detailed JSON output for programmatic analysis:

```json
{
  "timestamp": "2024-12-15T20:45:30.123Z",
  "totalReceipts": 5,
  "receipts": [
    {
      "name": "tusker-test-receipt.txt",
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
  "roundTripTests": [...],
  "statistics": {
    "high": 3,
    "medium": 1,
    "low": 1,
    "successRate": "80.0%"
  }
}
```

## Workflow

### 1. Initial Template Creation

```bash
# Create template file
cat > my-template.json << 'EOF'
{
  "total": "TOTAL:?\\s*(\\d+\\.\\d{2})",
  "items": {
    "pattern": "^(\\d+)\\s+(.+?)\\s{2,}(\\d+\\.\\d{2})$",
    "multiline": true
  }
}
EOF

# Test against sample receipt
node validate-template.js my-template.json test-receipts/tusker-test-receipt.txt
```

### 2. Iterative Refinement

```bash
# Test against all samples
node validate-template.js my-template.json

# Review results
cat template-validation-results.json

# Adjust template based on feedback
# ... edit my-template.json ...

# Re-test
node validate-template.js my-template.json
```

### 3. Production Deployment

```bash
# Final validation with round-trip testing
node validate-template.js my-template.json --round-trip

# If success rate >= 80%, deploy to config.json
cp my-template.json config-template-backup.json
# Add template to config.json under "parsingTemplate" key
```

## Integration with Config

### Add Template to config.json

```json
{
  "barId": "your-bar-id",
  "apiUrl": "https://...",
  "driverId": "driver-...",
  "watchFolder": "C:\\Users\\...\\TabezaPrints",
  "parsingTemplate": {
    "receiptNumber": "Receipt\\s*#?:?\\s*(\\S+)",
    "timestamp": "(\\d{1,2}/\\d{1,2}/\\d{4}\\s+\\d{1,2}:\\d{2})",
    "items": {
      "pattern": "^(\\d+)\\s+(.+?)\\s{2,}(\\d+\\.\\d{2})$",
      "multiline": true,
      "startMarker": "QTY\\s+ITEM\\s+AMOUNT",
      "endMarker": "^-{3,}|Subtotal|Total"
    },
    "subtotal": "Subtotal:?\\s*(\\d+\\.\\d{2})",
    "tax": "(?:VAT|Tax):?\\s*(\\d+\\.\\d{2})",
    "total": "^\\s*TOTAL:?\\s*(\\d+\\.\\d{2})"
  }
}
```

### Test Config Template

```bash
# Test template from config.json
node validate-template.js --config config.json

# Or simply (uses config.json by default)
node validate-template.js
```

## Exit Codes

- `0`: Success (validation passed or completed)
- `1`: Template validation failed (structural errors)
- `2`: File not found or read error
- `3`: Invalid command line arguments

## Requirements Validated

This script validates:
- **Requirement 8.7**: Script to test custom templates against sample receipts
- **Requirement 8.1**: Accept sample receipt text for testing
- **Requirement 8.2**: Log parsing results with field extraction details
- **Requirement 8.4**: Validate regex patterns before applying them
- **Requirement 8.5**: Log errors for invalid patterns
- **Requirement 8.6**: Provide parsing statistics

## Troubleshooting

### Script Won't Run

```bash
# Make script executable (Linux/Mac)
chmod +x validate-template.js

# Run with node explicitly
node validate-template.js
```

### Template File Not Found

```bash
# Use absolute path
node validate-template.js /full/path/to/template.json

# Or relative to current directory
node validate-template.js ./templates/my-template.json
```

### No Sample Receipts Found

```bash
# Check test-receipts directory exists
ls test-receipts/

# Add your own receipt files
cp my-receipt.txt test-receipts/
```

### Invalid JSON in Template

```bash
# Validate JSON syntax
node -e "console.log(JSON.parse(require('fs').readFileSync('my-template.json')))"

# Use online JSON validator
# https://jsonlint.com/
```

## Next Steps

1. **Create Your Template**: Start with the default template and adjust patterns
2. **Test Iteratively**: Run validation, review results, adjust, repeat
3. **Achieve 80%+ Success Rate**: Aim for high confidence on most receipts
4. **Deploy to Production**: Add template to config.json
5. **Monitor Results**: Check parsing confidence in production logs

## Related Documentation

- [TEST-MODE-GUIDE.md](./TEST-MODE-GUIDE.md) - Interactive testing mode
- [TEMPLATE-CONFIGURATION.md](./TEMPLATE-CONFIGURATION.md) - Template format reference
- [Design Document](../../.kiro/specs/local-receipt-parsing/design.md) - Full feature design

## Support

For issues or questions:
1. Review this guide and examples
2. Check sample receipts in test-receipts/
3. Test with verbose mode for detailed output
4. Review template-validation-results.json for insights
