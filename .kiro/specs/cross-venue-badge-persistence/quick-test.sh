#!/bin/bash

# Quick API Testing Script for Badge Persistence
# Usage: ./quick-test.sh <customer_id> <bar_id>

if [ -z "$1" ] || [ -z "$2" ]; then
  echo "Usage: ./quick-test.sh <customer_id> <bar_id>"
  echo ""
  echo "Get test IDs from Supabase:"
  echo "  Customer ID: SELECT id FROM auth.users LIMIT 1;"
  echo "  Bar ID: SELECT id FROM bars LIMIT 1;"
  exit 1
fi

CUSTOMER_ID=$1
BAR_ID=$2
BASE_URL="http://localhost:3002"

echo "=========================================="
echo "Badge Persistence API Quick Test"
echo "=========================================="
echo "Customer ID: $CUSTOMER_ID"
echo "Bar ID: $BAR_ID"
echo ""

# Test 1: Badge Lookup - No Badge
echo "Test 1: Badge Lookup (should return null for first-time user)"
echo "GET $BASE_URL/api/loyalty/badge/$CUSTOMER_ID"
curl -s "$BASE_URL/api/loyalty/badge/$CUSTOMER_ID" | jq '.'
echo ""
echo "Press Enter to continue..."
read

# Test 2: Award Bronze Badge
echo "Test 2: Award Bronze Badge"
echo "POST $BASE_URL/api/loyalty/badge/award"
curl -s -X POST "$BASE_URL/api/loyalty/badge/award" \
  -H "Content-Type: application/json" \
  -d "{
    \"customer_id\": \"$CUSTOMER_ID\",
    \"bar_id\": \"$BAR_ID\",
    \"badge_level\": \"bronze\",
    \"spend_amount\": 3500.00
  }" | jq '.'
echo ""
echo "Press Enter to continue..."
read

# Test 3: Badge Lookup - With Badge
echo "Test 3: Badge Lookup (should return bronze badge)"
echo "GET $BASE_URL/api/loyalty/badge/$CUSTOMER_ID"
curl -s "$BASE_URL/api/loyalty/badge/$CUSTOMER_ID" | jq '.'
echo ""
echo "Press Enter to continue..."
read

# Test 4: Upgrade to Silver
echo "Test 4: Upgrade Bronze to Silver"
echo "POST $BASE_URL/api/loyalty/badge/award"
curl -s -X POST "$BASE_URL/api/loyalty/badge/award" \
  -H "Content-Type: application/json" \
  -d "{
    \"customer_id\": \"$CUSTOMER_ID\",
    \"bar_id\": \"$BAR_ID\",
    \"badge_level\": \"silver\",
    \"spend_amount\": 10500.00
  }" | jq '.'
echo ""
echo "Press Enter to continue..."
read

# Test 5: Try to Award Bronze (should reject)
echo "Test 5: Try to Award Bronze (should reject - already has silver)"
echo "POST $BASE_URL/api/loyalty/badge/award"
curl -s -X POST "$BASE_URL/api/loyalty/badge/award" \
  -H "Content-Type: application/json" \
  -d "{
    \"customer_id\": \"$CUSTOMER_ID\",
    \"bar_id\": \"$BAR_ID\",
    \"badge_level\": \"bronze\",
    \"spend_amount\": 3500.00
  }" | jq '.'
echo ""
echo "Press Enter to continue..."
read

# Test 6: Validation - Invalid Badge Level
echo "Test 6: Validation - Invalid Badge Level"
echo "POST $BASE_URL/api/loyalty/badge/award"
curl -s -X POST "$BASE_URL/api/loyalty/badge/award" \
  -H "Content-Type: application/json" \
  -d "{
    \"customer_id\": \"$CUSTOMER_ID\",
    \"bar_id\": \"$BAR_ID\",
    \"badge_level\": \"diamond\",
    \"spend_amount\": 50000.00
  }" | jq '.'
echo ""
echo "Press Enter to continue..."
read

# Test 7: Final Badge Lookup
echo "Test 7: Final Badge Lookup (should show silver)"
echo "GET $BASE_URL/api/loyalty/badge/$CUSTOMER_ID"
curl -s "$BASE_URL/api/loyalty/badge/$CUSTOMER_ID" | jq '.'
echo ""

echo "=========================================="
echo "Testing Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Check database state:"
echo "   SELECT * FROM customer_badges WHERE customer_id = '$CUSTOMER_ID' ORDER BY awarded_at DESC;"
echo ""
echo "2. Verify single active badge:"
echo "   SELECT COUNT(*) FROM customer_badges WHERE customer_id = '$CUSTOMER_ID' AND is_active = true;"
echo "   (Should return 1)"
echo ""
echo "3. Review full test guide: .kiro/specs/cross-venue-badge-persistence/test-api-routes.md"
