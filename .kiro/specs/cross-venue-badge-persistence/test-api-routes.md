# API Routes Testing Guide

This guide provides manual testing procedures for the badge persistence API routes.

## Prerequisites

1. **Development server running**: `pnpm dev` (http://localhost:3002)
2. **Valid test data**:
   - Customer ID (UUID from `auth.users` or `customers` table)
   - Bar ID (UUID from `bars` table)
3. **Tool**: Use curl (command line) or Postman/Insomnia (GUI)

## Test Data Setup

Before testing, you'll need valid UUIDs from your database. Run these queries in Supabase SQL Editor:

```sql
-- Get a test customer ID
SELECT id, email FROM auth.users LIMIT 1;

-- Get a test bar ID
SELECT id, name FROM bars LIMIT 1;

-- Check if customer_badges table exists and is empty
SELECT * FROM customer_badges LIMIT 5;
```

## Test 1: Badge Lookup - No Badge (First-time User)

**Endpoint**: `GET /api/loyalty/badge/[customer_id]`

### curl Command:
```bash
curl http://localhost:3002/api/loyalty/badge/YOUR_CUSTOMER_ID
```

### Expected Response:
```json
{
  "badge_level": null
}
```

### Verification:
- Status code: 200
- Response contains `badge_level: null`

---

## Test 2: Badge Award - First Badge (Bronze)

**Endpoint**: `POST /api/loyalty/badge/award`

### curl Command:
```bash
curl -X POST http://localhost:3002/api/loyalty/badge/award \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "YOUR_CUSTOMER_ID",
    "bar_id": "YOUR_BAR_ID",
    "badge_level": "bronze",
    "spend_amount": 3500.00
  }'
```

### Expected Response:
```json
{
  "upgraded": true,
  "newBadge": {
    "id": "...",
    "customer_id": "...",
    "badge_level": "bronze",
    "earned_at_bar_id": "...",
    "spend_amount_at_venue": 3500,
    "is_active": true,
    "awarded_at": "2026-04-07T...",
    "created_at": "...",
    "updated_at": "..."
  },
  "oldBadge": null
}
```

### Verification:
- Status code: 200
- `upgraded: true`
- `newBadge.badge_level` is "bronze"
- `oldBadge` is null (first badge)

### Database Check:
```sql
SELECT * FROM customer_badges 
WHERE customer_id = 'YOUR_CUSTOMER_ID' 
ORDER BY awarded_at DESC;
```

Expected: 1 row with `is_active = true`, `badge_level = 'bronze'`

---

## Test 3: Badge Lookup - With Active Badge

**Endpoint**: `GET /api/loyalty/badge/[customer_id]`

### curl Command:
```bash
curl http://localhost:3002/api/loyalty/badge/YOUR_CUSTOMER_ID
```

### Expected Response:
```json
{
  "badge_level": "bronze",
  "awarded_at": "2026-04-07T...",
  "earned_at_bar_id": "YOUR_BAR_ID",
  "earned_at_bar_name": "Venue Name",
  "spend_amount_at_venue": 3500
}
```

### Verification:
- Status code: 200
- `badge_level` is "bronze"
- `earned_at_bar_name` matches the venue name from `bars` table

---

## Test 4: Badge Upgrade - Bronze to Silver

**Endpoint**: `POST /api/loyalty/badge/award`

### curl Command:
```bash
curl -X POST http://localhost:3002/api/loyalty/badge/award \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "YOUR_CUSTOMER_ID",
    "bar_id": "YOUR_BAR_ID",
    "badge_level": "silver",
    "spend_amount": 10500.00
  }'
```

### Expected Response:
```json
{
  "upgraded": true,
  "newBadge": {
    "badge_level": "silver",
    "is_active": true,
    ...
  },
  "oldBadge": {
    "badge_level": "bronze"
  }
}
```

### Verification:
- Status code: 200
- `upgraded: true`
- `newBadge.badge_level` is "silver"
- `oldBadge.badge_level` is "bronze"

### Database Check:
```sql
SELECT badge_level, is_active, awarded_at 
FROM customer_badges 
WHERE customer_id = 'YOUR_CUSTOMER_ID' 
ORDER BY awarded_at DESC;
```

Expected: 2 rows
- Row 1: `badge_level = 'silver'`, `is_active = true` (newest)
- Row 2: `badge_level = 'bronze'`, `is_active = false` (deactivated)

---

## Test 5: Badge Award - No Upgrade (Silver request when already Silver)

**Endpoint**: `POST /api/loyalty/badge/award`

### curl Command:
```bash
curl -X POST http://localhost:3002/api/loyalty/badge/award \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "YOUR_CUSTOMER_ID",
    "bar_id": "YOUR_BAR_ID",
    "badge_level": "silver",
    "spend_amount": 11000.00
  }'
```

### Expected Response:
```json
{
  "upgraded": false,
  "currentBadge": {
    "badge_level": "silver"
  },
  "message": "Customer already has silver"
}
```

### Verification:
- Status code: 200
- `upgraded: false`
- `message` indicates customer already has this badge

### Database Check:
```sql
SELECT COUNT(*) as active_badges 
FROM customer_badges 
WHERE customer_id = 'YOUR_CUSTOMER_ID' 
AND is_active = true;
```

Expected: `active_badges = 1` (still only one active badge)

---

## Test 6: Badge Award - Reject Lower Badge (Bronze request when already Silver)

**Endpoint**: `POST /api/loyalty/badge/award`

### curl Command:
```bash
curl -X POST http://localhost:3002/api/loyalty/badge/award \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "YOUR_CUSTOMER_ID",
    "bar_id": "YOUR_BAR_ID",
    "badge_level": "bronze",
    "spend_amount": 3500.00
  }'
```

### Expected Response:
```json
{
  "upgraded": false,
  "currentBadge": {
    "badge_level": "silver"
  },
  "message": "Customer already has silver"
}
```

### Verification:
- Status code: 200
- `upgraded: false`
- No new badge created (downgrade prevented)

---

## Test 7: Badge Upgrade Skip - Bronze to Gold (skipping Silver)

**Endpoint**: `POST /api/loyalty/badge/award`

### Setup: Reset customer to Bronze first
```sql
-- Delete all badges for clean test
DELETE FROM customer_badges WHERE customer_id = 'YOUR_CUSTOMER_ID';

-- Insert Bronze badge
INSERT INTO customer_badges (customer_id, badge_level, earned_at_bar_id, spend_amount_at_venue, is_active)
VALUES ('YOUR_CUSTOMER_ID', 'bronze', 'YOUR_BAR_ID', 3500, true);
```

### curl Command:
```bash
curl -X POST http://localhost:3002/api/loyalty/badge/award \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "YOUR_CUSTOMER_ID",
    "bar_id": "YOUR_BAR_ID",
    "badge_level": "gold",
    "spend_amount": 25500.00
  }'
```

### Expected Response:
```json
{
  "upgraded": true,
  "newBadge": {
    "badge_level": "gold",
    "is_active": true,
    ...
  },
  "oldBadge": {
    "badge_level": "bronze"
  }
}
```

### Verification:
- Status code: 200
- `upgraded: true`
- Badge jumped from Bronze to Gold (Silver skipped)

---

## Test 8: Validation - Missing Required Fields

**Endpoint**: `POST /api/loyalty/badge/award`

### curl Command:
```bash
curl -X POST http://localhost:3002/api/loyalty/badge/award \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "YOUR_CUSTOMER_ID",
    "badge_level": "silver"
  }'
```

### Expected Response:
```json
{
  "error": "Missing required fields: customer_id, bar_id, badge_level, spend_amount"
}
```

### Verification:
- Status code: 400
- Error message indicates missing fields

---

## Test 9: Validation - Invalid Badge Level

**Endpoint**: `POST /api/loyalty/badge/award`

### curl Command:
```bash
curl -X POST http://localhost:3002/api/loyalty/badge/award \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "YOUR_CUSTOMER_ID",
    "bar_id": "YOUR_BAR_ID",
    "badge_level": "diamond",
    "spend_amount": 50000.00
  }'
```

### Expected Response:
```json
{
  "error": "Invalid badge level. Must be one of: bronze, silver, gold, platinum"
}
```

### Verification:
- Status code: 400
- Error message indicates invalid badge level

---

## Test 10: Validation - Invalid Spend Amount

**Endpoint**: `POST /api/loyalty/badge/award`

### curl Command (negative amount):
```bash
curl -X POST http://localhost:3002/api/loyalty/badge/award \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "YOUR_CUSTOMER_ID",
    "bar_id": "YOUR_BAR_ID",
    "badge_level": "silver",
    "spend_amount": -100.00
  }'
```

### Expected Response:
```json
{
  "error": "Invalid spend amount. Must be positive and less than 1,000,000"
}
```

### Verification:
- Status code: 400
- Error message indicates invalid spend amount

---

## Test 11: Single Active Badge Invariant

**Purpose**: Verify that only one badge is active at any time

### Database Check:
```sql
-- This should always return 0 or 1
SELECT customer_id, COUNT(*) as active_count
FROM customer_badges
WHERE is_active = true
GROUP BY customer_id
HAVING COUNT(*) > 1;
```

Expected: No rows (empty result = invariant holds)

If any rows appear, the single active badge invariant is violated.

---

## Test 12: Cross-Venue Badge Display

**Purpose**: Verify badge earned at one venue displays at another

### Setup:
1. Award Silver badge at Venue A
2. Query badge from context of Venue B (different bar_id)

### curl Command:
```bash
# Award badge at Venue A
curl -X POST http://localhost:3002/api/loyalty/badge/award \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "YOUR_CUSTOMER_ID",
    "bar_id": "VENUE_A_BAR_ID",
    "badge_level": "silver",
    "spend_amount": 10500.00
  }'

# Lookup badge (no bar_id filter - returns global badge)
curl http://localhost:3002/api/loyalty/badge/YOUR_CUSTOMER_ID
```

### Expected Response:
```json
{
  "badge_level": "silver",
  "earned_at_bar_id": "VENUE_A_BAR_ID",
  "earned_at_bar_name": "Venue A Name",
  ...
}
```

### Verification:
- Badge lookup returns Silver badge regardless of which venue queries it
- `earned_at_bar_name` shows where badge was earned (Venue A)

---

## Postman Collection (Alternative to curl)

If you prefer using Postman, import this collection:

```json
{
  "info": {
    "name": "Badge Persistence API Tests",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Get Badge - No Badge",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "http://localhost:3002/api/loyalty/badge/{{customer_id}}",
          "host": ["http://localhost:3002"],
          "path": ["api", "loyalty", "badge", "{{customer_id}}"]
        }
      }
    },
    {
      "name": "Award Badge - Bronze",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"customer_id\": \"{{customer_id}}\",\n  \"bar_id\": \"{{bar_id}}\",\n  \"badge_level\": \"bronze\",\n  \"spend_amount\": 3500.00\n}"
        },
        "url": {
          "raw": "http://localhost:3002/api/loyalty/badge/award",
          "host": ["http://localhost:3002"],
          "path": ["api", "loyalty", "badge", "award"]
        }
      }
    },
    {
      "name": "Award Badge - Silver Upgrade",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"customer_id\": \"{{customer_id}}\",\n  \"bar_id\": \"{{bar_id}}\",\n  \"badge_level\": \"silver\",\n  \"spend_amount\": 10500.00\n}"
        },
        "url": {
          "raw": "http://localhost:3002/api/loyalty/badge/award",
          "host": ["http://localhost:3002"],
          "path": ["api", "loyalty", "badge", "award"]
        }
      }
    }
  ],
  "variable": [
    {
      "key": "customer_id",
      "value": "YOUR_CUSTOMER_ID"
    },
    {
      "key": "bar_id",
      "value": "YOUR_BAR_ID"
    }
  ]
}
```

---

## Summary Checklist

After completing all tests, verify:

- [ ] Badge lookup returns null for first-time users
- [ ] Badge award creates first badge successfully
- [ ] Badge lookup returns active badge with venue name
- [ ] Badge upgrade deactivates old badge and creates new one
- [ ] No upgrade occurs when requesting same or lower badge
- [ ] Badge can skip tiers (bronze → gold)
- [ ] Validation rejects missing fields
- [ ] Validation rejects invalid badge levels
- [ ] Validation rejects invalid spend amounts
- [ ] Only one active badge exists per customer at any time
- [ ] Badge earned at one venue is visible globally

---

## Troubleshooting

### Issue: "Failed to fetch badge" error
- Check Supabase connection in `.env.local`
- Verify `SUPABASE_SECRET_KEY` is set correctly
- Check `customer_badges` table exists in database

### Issue: "Failed to award badge" error
- Check database constraints (UNIQUE on customer_id + badge_level)
- Verify bar_id exists in `bars` table
- Check RLS policies on `customer_badges` table

### Issue: Multiple active badges for one customer
- Run cleanup query:
```sql
-- Deactivate all but the highest badge
UPDATE customer_badges
SET is_active = false
WHERE customer_id = 'YOUR_CUSTOMER_ID'
AND badge_level != (
  SELECT badge_level 
  FROM customer_badges 
  WHERE customer_id = 'YOUR_CUSTOMER_ID' 
  ORDER BY CASE badge_level 
    WHEN 'platinum' THEN 4 
    WHEN 'gold' THEN 3 
    WHEN 'silver' THEN 2 
    WHEN 'bronze' THEN 1 
  END DESC 
  LIMIT 1
);
```

---

**Testing completed?** Report results and any issues to proceed with Phase 2 (Frontend Integration).
