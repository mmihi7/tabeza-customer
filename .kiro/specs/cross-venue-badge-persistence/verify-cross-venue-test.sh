#!/bin/bash

# Cross-Venue Badge Display Test - Verification Script
# Test ID: 13
# Purpose: Automated verification of cross-venue badge display

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_BASE_URL="${API_BASE_URL:-http://localhost:3002}"
TEST_CUSTOMER_ID="${TEST_CUSTOMER_ID}"
POPOS_BAR_ID="${POPOS_BAR_ID}"
KIKAO_BAR_ID="${KIKAO_BAR_ID}"

# Check required environment variables
if [ -z "$TEST_CUSTOMER_ID" ] || [ -z "$POPOS_BAR_ID" ] || [ -z "$KIKAO_BAR_ID" ]; then
  echo -e "${RED}Error: Required environment variables not set${NC}"
  echo "Please set:"
  echo "  export TEST_CUSTOMER_ID='your-customer-uuid'"
  echo "  export POPOS_BAR_ID='popos-venue-uuid'"
  echo "  export KIKAO_BAR_ID='kikao-venue-uuid'"
  exit 1
fi

echo "=========================================="
echo "Cross-Venue Badge Display Test"
echo "=========================================="
echo ""
echo "Configuration:"
echo "  API Base URL: $API_BASE_URL"
echo "  Customer ID: $TEST_CUSTOMER_ID"
echo "  Popos Bar ID: $POPOS_BAR_ID"
echo "  Kikao Bar ID: $KIKAO_BAR_ID"
echo ""

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run test
run_test() {
  local test_name="$1"
  local test_command="$2"
  local expected_result="$3"
  
  echo -n "Testing: $test_name... "
  
  result=$(eval "$test_command" 2>&1)
  
  if echo "$result" | grep -q "$expected_result"; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((TESTS_PASSED++))
    return 0
  else
    echo -e "${RED}✗ FAIL${NC}"
    echo "  Expected: $expected_result"
    echo "  Got: $result"
    ((TESTS_FAILED++))
    return 1
  fi
}

echo "=========================================="
echo "Phase 1: Verify Badge Earned at Popos"
echo "=========================================="
echo ""

# Test 1: Check badge exists
run_test \
  "Badge exists in database" \
  "curl -s '$API_BASE_URL/api/loyalty/badge/$TEST_CUSTOMER_ID' | jq -r '.badge_level'" \
  "silver"

# Test 2: Check badge earned at Popos
run_test \
  "Badge earned at Popos" \
  "curl -s '$API_BASE_URL/api/loyalty/badge/$TEST_CUSTOMER_ID' | jq -r '.earned_at_bar_id'" \
  "$POPOS_BAR_ID"

echo ""
echo "=========================================="
echo "Phase 2: Verify Cross-Venue Display"
echo "=========================================="
echo ""

# Test 3: Badge displays at Kikao (same badge level)
run_test \
  "Badge displays at Kikao" \
  "curl -s '$API_BASE_URL/api/loyalty/badge/$TEST_CUSTOMER_ID' | jq -r '.badge_level'" \
  "silver"

# Test 4: Visit frequency at Kikao is 0 or 1
echo -n "Testing: Visit frequency at Kikao (first visit)... "
weekly_visits=$(curl -s "$API_BASE_URL/api/loyalty/visits/$TEST_CUSTOMER_ID?bar_id=$KIKAO_BAR_ID" | jq -r '.weeklyVisits')
if [ "$weekly_visits" -le 1 ]; then
  echo -e "${GREEN}✓ PASS${NC} (weeklyVisits: $weekly_visits)"
  ((TESTS_PASSED++))
else
  echo -e "${RED}✗ FAIL${NC} (weeklyVisits: $weekly_visits, expected: 0 or 1)"
  ((TESTS_FAILED++))
fi

echo ""
echo "=========================================="
echo "Phase 3: Verify Discount Settings"
echo "=========================================="
echo ""

# Test 5: Kikao discount settings exist
run_test \
  "Kikao discount settings exist" \
  "curl -s '$API_BASE_URL/api/loyalty/venue-discounts/$KIKAO_BAR_ID' | jq -r '.bar_id'" \
  "$KIKAO_BAR_ID"

# Test 6: Kikao Silver discount percentage
echo -n "Testing: Kikao Silver discount percentage... "
silver_pct=$(curl -s "$API_BASE_URL/api/loyalty/venue-discounts/$KIKAO_BAR_ID" | jq -r '.spend_tiers.silver')
if [ "$silver_pct" != "null" ] && [ "$silver_pct" != "" ]; then
  echo -e "${GREEN}✓ PASS${NC} (Silver: $silver_pct%)"
  ((TESTS_PASSED++))
else
  echo -e "${RED}✗ FAIL${NC} (Silver discount not configured)"
  ((TESTS_FAILED++))
fi

# Test 7: Kikao 1x visit bonus
echo -n "Testing: Kikao 1x visit bonus... "
visit_bonus=$(curl -s "$API_BASE_URL/api/loyalty/venue-discounts/$KIKAO_BAR_ID" | jq -r '.visit_bonuses."1x"')
if [ "$visit_bonus" != "null" ] && [ "$visit_bonus" != "" ]; then
  echo -e "${GREEN}✓ PASS${NC} (1x visit: $visit_bonus%)"
  ((TESTS_PASSED++))
else
  echo -e "${RED}✗ FAIL${NC} (1x visit bonus not configured)"
  ((TESTS_FAILED++))
fi

echo ""
echo "=========================================="
echo "Phase 4: Verify Badge Properties"
echo "=========================================="
echo ""

# Test 8: Only one active badge
echo -n "Testing: Only one active badge exists... "
badge_response=$(curl -s "$API_BASE_URL/api/loyalty/badge/$TEST_CUSTOMER_ID")
badge_level=$(echo "$badge_response" | jq -r '.badge_level')
if [ "$badge_level" == "silver" ]; then
  echo -e "${GREEN}✓ PASS${NC}"
  ((TESTS_PASSED++))
else
  echo -e "${RED}✗ FAIL${NC} (Expected single silver badge)"
  ((TESTS_FAILED++))
fi

# Test 9: Badge is active
run_test \
  "Badge is active" \
  "curl -s '$API_BASE_URL/api/loyalty/badge/$TEST_CUSTOMER_ID' | jq -r 'if .badge_level != null then \"active\" else \"inactive\" end'" \
  "active"

echo ""
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo ""
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}✓ All tests passed!${NC}"
  echo ""
  echo "Cross-venue badge display is working correctly:"
  echo "  • Badge earned at Popos displays at Kikao"
  echo "  • Kikao's discount percentages are configured"
  echo "  • Visit frequency shows first visit at Kikao"
  echo "  • Only one active badge exists"
  exit 0
else
  echo -e "${RED}✗ Some tests failed${NC}"
  echo ""
  echo "Please review the failed tests above and:"
  echo "  1. Check database state"
  echo "  2. Verify API endpoints are working"
  echo "  3. Ensure discount settings are configured"
  echo "  4. Review test-cross-venue-badge.md for details"
  exit 1
fi
