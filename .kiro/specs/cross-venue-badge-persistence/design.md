# Cross-Venue Badge Persistence & Display — Design Document

## Overview

This feature transforms the Tabeza loyalty system from a stateless, session-only badge calculation into a persistent, cross-venue recognition system. Currently, badges are calculated on-the-fly based on average spend at the current venue and disappear when the session ends. With this implementation, badges will be permanently stored in the database when earned, persist across sessions, and display at ALL venues regardless of where they were earned.

The system maintains venue-specific earning criteria (each venue sets its own thresholds) while ensuring global badge visibility. A customer who earns Silver at Popos will see their Silver badge at every other venue they visit, even if they've never been there before. Badge duplication (multiple icons) provides visual recognition for frequent visitors at specific venues.

**Key Transformation:**
- **Before**: Badge calculated per session → lost on page refresh → venue-specific display
- **After**: Badge persisted to database → survives sessions → displays everywhere

**Foundation**: This design builds on the venue-specific-badge-threshold-fix implementation, which already fetches venue thresholds and calculates tiers correctly. We extend that foundation with database persistence and cross-venue display.

## Glossary

- **Badge Persistence**: Permanent storage of earned badges in `customer_badges` table
- **Cross-Venue Display**: Showing a customer's highest badge at ALL venues, not just where earned
- **Global Badge**: The highest badge level earned across all venues (Bronze < Silver < Gold < Platinum)
- **Badge Upgrade**: Transition from lower to higher badge level (one-way, never downgrades)
- **Active Badge**: Current valid badge record (`is_active = true`), one per customer
- **Badge Duplication**: Visual display of 2-3 badge icons based on visit frequency at current venue
- **Visit Frequency Window**: 2-week period for tracking visit frequency bonuses
- **Venue Threshold**: Venue-specific spend requirements from `bars` table columns
- **System Default Threshold**: Fallback thresholds (Bronze: 3,000 | Silver: 10,000 | Gold: 25,000)
- **Badge Award Trigger**: Payment completion event that triggers badge recalculation
- **Spend Tier**: Badge level determining discount percentage (Bronze/Silver/Gold)
- **Visit Tier**: Badge count (1/2/3 icons) based on weekly visits at current venue


## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                     Customer Menu Page                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Badge Display (Header)                                   │  │
│  │  • Global badge shape (Circle/Shield/Crown)              │  │
│  │  • Visit frequency count (1-3 icons)                     │  │
│  │  • Calculated from: customer_badges + weekly visits      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Menu Items with Discounted Prices                       │  │
│  │  • displayPrice = basePrice × (1 - totalDiscount/100)   │  │
│  │  • totalDiscount = badgePct + visitBonusPct             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Payment Completion Handler                              │  │
│  │  • Triggers badge recalculation                          │  │
│  │  • Calls loadLoyaltyData()                              │  │
│  │  • Detects upgrades → shows notification                │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    API Layer (Service Role)                     │
│                                                                  │
│  GET /api/loyalty/visits/[customer_id]?bar_id=X                │
│  • Returns: completedVisits, averageSpend, weeklyVisits        │
│  • Returns: venue thresholds (bronze/silver/gold)              │
│  • Source: tabs + tab_balances + bars tables                   │
│                                                                  │
│  GET /api/loyalty/badge/[customer_id]                          │
│  • Returns: highest active badge across all venues             │
│  • Source: customer_badges table                               │
│  • Query: WHERE customer_id = X AND is_active = true           │
│  • Order by: badge level rank DESC, LIMIT 1                    │
│                                                                  │
│  POST /api/loyalty/badge/award                                 │
│  • Input: customer_id, bar_id, badge_level, spend_amount       │
│  • Logic: Check if upgrade needed, deactivate old, insert new  │
│  • Returns: { upgraded: boolean, newBadge, oldBadge }          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Database Layer (Supabase)                    │
│                                                                  │
│  customer_badges                                                │
│  ├─ id (UUID, PK)                                              │
│  ├─ customer_id (UUID, FK → auth.users)                        │
│  ├─ badge_level (TEXT: bronze|silver|gold|platinum)            │
│  ├─ awarded_at (TIMESTAMPTZ)                                   │
│  ├─ earned_at_bar_id (UUID, FK → bars)                         │
│  ├─ spend_amount_at_venue (DECIMAL)                            │
│  ├─ is_active (BOOLEAN, default true)                          │
│  └─ UNIQUE(customer_id, badge_level)                           │
│                                                                  │
│  Indexes:                                                        │
│  • idx_customer_badges_customer_id (customer_id)               │
│  • idx_customer_badges_active (is_active) WHERE is_active      │
│  • idx_customer_badges_level (badge_level)                     │
│                                                                  │
│  customers (existing table)                                     │
│  ├─ id (UUID, PK)                                              │
│  ├─ email, first_name, last_name                               │
│  └─ (no schema changes needed)                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow: Badge Earning to Cross-Venue Display

**Step 1: Customer Completes Payment**
```
Customer pays → Payment inserted to tab_payments
                ↓
Payment realtime subscription fires
                ↓
loadLoyaltyData() called
```

**Step 2: Badge Calculation**
```
GET /api/loyalty/visits/[customer_id]?bar_id=X
                ↓
Returns: { completedVisits: 5, averageSpend: 5480, weeklyVisits: 2, 
           thresholds: { bronze: 3000, silver: 5000, gold: 15000 } }
                ↓
Frontend calculates: averageSpend (5480) >= thresholds.silver (5000)
                ↓
Earned tier: Silver
```

**Step 3: Badge Persistence Check**
```
GET /api/loyalty/badge/[customer_id]
                ↓
Returns: { badge_level: 'bronze', awarded_at: '2024-01-15', ... }
                ↓
Compare: Silver (new) > Bronze (current) → UPGRADE NEEDED
```

**Step 4: Badge Upgrade**
```
POST /api/loyalty/badge/award
Body: { customer_id, bar_id, badge_level: 'silver', spend_amount: 5480 }
                ↓
Database transaction:
  1. UPDATE customer_badges SET is_active = false 
     WHERE customer_id = X AND is_active = true
  2. INSERT INTO customer_badges (customer_id, badge_level, earned_at_bar_id, ...)
     VALUES (X, 'silver', bar_id, ...)
                ↓
Returns: { upgraded: true, newBadge: {...}, oldBadge: {...} }
```

**Step 5: UI Update & Notification**
```
Frontend receives upgrade response
                ↓
Update spendTier state: 'bronze' → 'silver'
                ↓
Show toast: "Congratulations! You've earned Silver status at Popos"
                ↓
Play sound + vibration (if enabled)
                ↓
Menu prices recalculate automatically (via spendTier state change)
```

**Step 6: Cross-Venue Display**
```
Customer opens tab at different venue (e.g., Kikao)
                ↓
GET /api/loyalty/badge/[customer_id]
                ↓
Returns: { badge_level: 'silver', earned_at_bar_id: 'popos-id', ... }
                ↓
Display: Silver shield icon in header
                ↓
Apply: Silver discount % from Kikao's venue_discount_settings
```


## Components and Interfaces

### Frontend Components

#### 1. Badge Display Component (Menu Header)

**Location**: `app/menu/page.tsx` (existing `renderLoyaltyIcons` function)

**Current Implementation**:
```typescript
const renderLoyaltyIcons = () => {
  if (!loyaltyData || loyaltyData.visitTier === 'new') return null;
  const { visitTier, spendTier } = loyaltyData;
  const iconCount = visitTier === 'gold' ? 3 : visitTier === 'silver' ? 2 : 1;
  const IconComponent = spendTier === 'gold' ? Crown : spendTier === 'silver' ? Shield : Circle;
  return (
    <div className="flex gap-0.5 items-center">
      {Array.from({ length: iconCount }).map((_, i) => (
        <IconComponent key={i} className="w-3.5 h-3.5 text-white drop-shadow" />
      ))}
    </div>
  );
};
```

**Required Changes**:
- Replace `spendTier` calculation with global badge from API
- Keep `visitTier` calculation (weekly visits at current venue)
- Badge shape = global badge level (from `customer_badges`)
- Badge count = visit frequency at current venue (from `tabs` query)

**New Implementation**:
```typescript
const renderLoyaltyIcons = () => {
  if (!globalBadge && loyaltyData?.visitTier === 'new') return null;
  
  // Badge shape from global badge (earned anywhere, works everywhere)
  const badgeLevel = globalBadge?.badge_level || loyaltyData?.spendTier;
  const IconComponent = badgeLevel === 'gold' ? Crown 
                      : badgeLevel === 'silver' ? Shield 
                      : badgeLevel === 'bronze' ? Circle 
                      : null;
  
  if (!IconComponent) return null;
  
  // Badge count from visit frequency at THIS venue
  const visitTier = loyaltyData?.visitTier || 'new';
  const iconCount = visitTier === 'gold' ? 3 : visitTier === 'silver' ? 2 : 1;
  
  return (
    <div className="flex gap-0.5 items-center">
      {Array.from({ length: iconCount }).map((_, i) => (
        <IconComponent key={i} className="w-3.5 h-3.5 text-white drop-shadow" />
      ))}
    </div>
  );
};
```

#### 2. Badge Upgrade Notification

**Location**: `app/menu/page.tsx` (inside `loadLoyaltyData` function)

**Current Implementation**:
```typescript
// Detect tier upgrade and show notification
if (earnedSpendTier && (!previousTier.current || tierRank(earnedSpendTier) > tierRank(previousTier.current))) {
  const tierName = earnedSpendTier.charAt(0).toUpperCase() + earnedSpendTier.slice(1);
  showToast({
    type: 'success',
    title: `Congratulations! You've earned ${tierName} status`,
    message: `at ${barName}`,
    duration: 8000
  });
  if (notificationPrefs.soundEnabled) playAcceptanceSound();
  if (notificationPrefs.vibrationEnabled) buzz([200, 100, 200, 100, 200]);
}
previousTier.current = earnedSpendTier;
```

**Required Changes**:
- Move notification logic to badge award API response handler
- Only show notification when API confirms upgrade (not just local calculation)
- Include venue name where badge was earned

**New Implementation**:
```typescript
// After calling badge award API
const awardResponse = await fetch('/api/loyalty/badge/award', {
  method: 'POST',
  body: JSON.stringify({ customer_id, bar_id, badge_level: earnedTier, spend_amount: averageSpend })
});
const { upgraded, newBadge } = await awardResponse.json();

if (upgraded && newBadge) {
  const tierName = newBadge.badge_level.charAt(0).toUpperCase() + newBadge.badge_level.slice(1);
  showToast({
    type: 'success',
    title: `Congratulations! You've earned ${tierName} status`,
    message: `at ${barName}`,
    duration: 8000
  });
  if (notificationPrefs.soundEnabled) playAcceptanceSound();
  if (notificationPrefs.vibrationEnabled) buzz([200, 100, 200, 100, 200]);
}
```

#### 3. Loyalty Data Loading

**Location**: `app/menu/page.tsx` (`loadLoyaltyData` function)

**Current Flow**:
1. Fetch visit data from `/api/loyalty/visits/[customer_id]`
2. Fetch venue discounts from `/api/loyalty/venue-discounts/[bar_id]`
3. Calculate spend tier locally
4. Update `spendTier` state

**New Flow**:
1. Fetch visit data (same)
2. Fetch venue discounts (same)
3. **Fetch global badge from `/api/loyalty/badge/[customer_id]`**
4. Calculate earned tier locally (for comparison)
5. **If earned tier > global badge, call `/api/loyalty/badge/award`**
6. Update `spendTier` state with global badge level
7. Show notification if upgrade occurred

### API Routes

#### 1. GET /api/loyalty/badge/[customer_id]

**Purpose**: Retrieve customer's highest active badge across all venues

**Request**:
```
GET /api/loyalty/badge/abc-123-def
```

**Response**:
```json
{
  "badge_level": "silver",
  "awarded_at": "2024-01-15T10:30:00Z",
  "earned_at_bar_id": "venue-uuid",
  "earned_at_bar_name": "Popos",
  "spend_amount_at_venue": 5480.00
}
```

**Response (No Badge)**:
```json
{
  "badge_level": null
}
```

**Implementation**:
```typescript
// app/api/loyalty/badge/[customer_id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customer_id: string }> }
) {
  try {
    const { customer_id } = await params;
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from('customer_badges')
      .select(`
        badge_level,
        awarded_at,
        earned_at_bar_id,
        spend_amount_at_venue,
        bars:earned_at_bar_id (name)
      `)
      .eq('customer_id', customer_id)
      .eq('is_active', true)
      .order('badge_level', { ascending: false }) // platinum > gold > silver > bronze
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching customer badge:', error);
      return NextResponse.json({ error: 'Failed to fetch badge' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ badge_level: null });
    }

    return NextResponse.json({
      badge_level: data.badge_level,
      awarded_at: data.awarded_at,
      earned_at_bar_id: data.earned_at_bar_id,
      earned_at_bar_name: data.bars?.name || 'Unknown Venue',
      spend_amount_at_venue: data.spend_amount_at_venue
    });
  } catch (error) {
    console.error('Error in badge GET route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```


#### 2. POST /api/loyalty/badge/award

**Purpose**: Award or upgrade a customer's badge

**Request**:
```json
{
  "customer_id": "abc-123-def",
  "bar_id": "venue-uuid",
  "badge_level": "silver",
  "spend_amount": 5480.00
}
```

**Response (Upgrade)**:
```json
{
  "upgraded": true,
  "newBadge": {
    "id": "badge-uuid",
    "badge_level": "silver",
    "awarded_at": "2024-01-20T14:30:00Z",
    "earned_at_bar_id": "venue-uuid"
  },
  "oldBadge": {
    "badge_level": "bronze"
  }
}
```

**Response (No Upgrade Needed)**:
```json
{
  "upgraded": false,
  "currentBadge": {
    "badge_level": "gold"
  },
  "message": "Customer already has gold or higher"
}
```

**Implementation**:
```typescript
// app/api/loyalty/badge/award/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase';

const BADGE_RANK = { bronze: 1, silver: 2, gold: 3, platinum: 4 };

export async function POST(request: NextRequest) {
  try {
    const { customer_id, bar_id, badge_level, spend_amount } = await request.json();

    // Validation
    if (!customer_id || !bar_id || !badge_level || !spend_amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!BADGE_RANK[badge_level]) {
      return NextResponse.json(
        { error: 'Invalid badge level' },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    // Get current active badge
    const { data: currentBadge } = await supabase
      .from('customer_badges')
      .select('badge_level')
      .eq('customer_id', customer_id)
      .eq('is_active', true)
      .maybeSingle();

    // Check if upgrade needed
    const currentRank = currentBadge ? BADGE_RANK[currentBadge.badge_level] : 0;
    const newRank = BADGE_RANK[badge_level];

    if (newRank <= currentRank) {
      return NextResponse.json({
        upgraded: false,
        currentBadge,
        message: `Customer already has ${currentBadge?.badge_level || 'no badge'}`
      });
    }

    // Perform upgrade in transaction
    // 1. Deactivate old badge
    if (currentBadge) {
      await supabase
        .from('customer_badges')
        .update({ is_active: false })
        .eq('customer_id', customer_id)
        .eq('is_active', true);
    }

    // 2. Insert new badge
    const { data: newBadge, error: insertError } = await supabase
      .from('customer_badges')
      .insert({
        customer_id,
        badge_level,
        earned_at_bar_id: bar_id,
        spend_amount_at_venue: spend_amount,
        is_active: true
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting new badge:', insertError);
      return NextResponse.json(
        { error: 'Failed to award badge' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      upgraded: true,
      newBadge,
      oldBadge: currentBadge
    });
  } catch (error) {
    console.error('Error in badge award route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### State Management

**New State Variables** (add to `app/menu/page.tsx`):

```typescript
// Global badge state (fetched from customer_badges table)
const [globalBadge, setGlobalBadge] = useState<{
  badge_level: 'bronze' | 'silver' | 'gold' | 'platinum' | null;
  awarded_at: string;
  earned_at_bar_id: string;
  earned_at_bar_name: string;
} | null>(null);

// Loading state for badge operations
const [badgeLoading, setBadgeLoading] = useState(false);
```

**Modified State Variables**:

```typescript
// spendTier now reflects global badge, not local calculation
const [spendTier, setSpendTier] = useState<SpendTierLabel | null>(null);

// loyaltyData still tracks local venue stats
const [loyaltyData, setLoyaltyData] = useState<{
  visitTier: 'new' | 'bronze' | 'silver' | 'gold';
  spendTier: SpendTierLabel | null; // DEPRECATED: use globalBadge instead
  totalVisits: number;
  totalSpend: number;
  weeklyVisits: number;
} | null>(null);
```


## Data Models

### Database Schema

#### customer_badges Table (Existing - No Changes)

**Table**: `customer_badges`

**Purpose**: Stores permanent badges earned by customers at specific venues

**Schema**:
```sql
CREATE TABLE IF NOT EXISTS public.customer_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_level TEXT NOT NULL CHECK (badge_level IN ('bronze', 'silver', 'gold', 'platinum')),
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  earned_at_bar_id UUID NOT NULL REFERENCES bars(id) ON DELETE CASCADE,
  spend_amount_at_venue DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT customer_badges_unique_level UNIQUE(customer_id, badge_level)
);
```

**Indexes** (Existing):
```sql
CREATE INDEX idx_customer_badges_customer_id ON customer_badges(customer_id);
CREATE INDEX idx_customer_badges_active ON customer_badges(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_customer_badges_level ON customer_badges(badge_level);
CREATE INDEX idx_customer_badges_earned_at_bar ON customer_badges(earned_at_bar_id);
```

**Key Constraints**:
- `UNIQUE(customer_id, badge_level)`: Prevents duplicate badge levels per customer
- `is_active = TRUE`: Only one active badge per customer at any time
- Badge levels never downgrade (enforced by application logic)

**Sample Data**:
```sql
-- Customer earned Bronze at Popos
INSERT INTO customer_badges (customer_id, badge_level, earned_at_bar_id, spend_amount_at_venue, is_active)
VALUES ('user-123', 'bronze', 'popos-id', 3500.00, false);

-- Later upgraded to Silver at Popos
INSERT INTO customer_badges (customer_id, badge_level, earned_at_bar_id, spend_amount_at_venue, is_active)
VALUES ('user-123', 'silver', 'popos-id', 5480.00, true);

-- Query: Get highest active badge
SELECT badge_level, awarded_at, earned_at_bar_id
FROM customer_badges
WHERE customer_id = 'user-123' AND is_active = true
ORDER BY CASE badge_level 
  WHEN 'platinum' THEN 4 
  WHEN 'gold' THEN 3 
  WHEN 'silver' THEN 2 
  WHEN 'bronze' THEN 1 
END DESC
LIMIT 1;
-- Returns: silver, 2024-01-20, popos-id
```

#### customers Table (Existing - No Changes)

**Table**: `customers`

**Purpose**: Stores customer profile information

**Schema** (relevant fields):
```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**No schema changes needed** - badge data is stored separately in `customer_badges`

#### bars Table (Existing - Used for Thresholds)

**Table**: `bars`

**Purpose**: Stores venue information including custom badge thresholds

**Schema** (relevant fields):
```sql
CREATE TABLE bars (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  bronze_threshold DECIMAL(10,2), -- NULL = use system default (3000)
  silver_threshold DECIMAL(10,2), -- NULL = use system default (10000)
  gold_threshold DECIMAL(10,2),   -- NULL = use system default (25000)
  ...
);
```

**Example Data**:
```sql
-- Popos with custom thresholds
UPDATE bars SET 
  bronze_threshold = 3000,
  silver_threshold = 5000,  -- Lower than system default
  gold_threshold = 15000    -- Lower than system default
WHERE id = 'popos-id';

-- Kikao with system defaults (NULL)
UPDATE bars SET 
  bronze_threshold = NULL,
  silver_threshold = NULL,
  gold_threshold = NULL
WHERE id = 'kikao-id';
```

### TypeScript Interfaces

```typescript
// Badge data from customer_badges table
interface CustomerBadge {
  id: string;
  customer_id: string;
  badge_level: 'bronze' | 'silver' | 'gold' | 'platinum';
  awarded_at: string; // ISO timestamp
  earned_at_bar_id: string;
  spend_amount_at_venue: number;
  is_active: boolean;
}

// Badge display data (with venue name)
interface BadgeDisplay {
  badge_level: 'bronze' | 'silver' | 'gold' | 'platinum' | null;
  awarded_at: string;
  earned_at_bar_id: string;
  earned_at_bar_name: string;
  spend_amount_at_venue: number;
}

// Badge award request
interface BadgeAwardRequest {
  customer_id: string;
  bar_id: string;
  badge_level: 'bronze' | 'silver' | 'gold' | 'platinum';
  spend_amount: number;
}

// Badge award response
interface BadgeAwardResponse {
  upgraded: boolean;
  newBadge?: CustomerBadge;
  oldBadge?: { badge_level: string };
  currentBadge?: { badge_level: string };
  message?: string;
}

// Visit data from loyalty API
interface LoyaltyVisitData {
  completedVisits: number;
  averageSpend: number;
  weeklyVisits: number;
  customer_id: string;
  thresholds: {
    bronze: number;
    silver: number;
    gold: number;
  };
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified the following redundancies:

**Redundant Properties**:
- 4.1 duplicates 2.5 (deactivation during upgrade)
- 4.3 duplicates 2.3 (new badges are active)
- 6.1 duplicates 4.4 (notification on upgrade)
- 8.3 duplicates 1.4 (tier calculation)
- 8.4 duplicates 2.1 + 4.4 (persistence + notification)

**Combined Properties**:
- 6.2 and 6.3 can be combined into one property about notification content format
- 6.4 and 6.5 can be combined into one property about notification preferences
- 1.5 and 1.6 can be combined into one property about upgrade detection and triggering

**Non-Testable**:
- 7.5 (preservation requirement, not a functional property)
- 10.1, 10.2, 10.3, 10.5 (performance/implementation details, not functional properties)

After eliminating redundancy, the following unique properties remain:

### Property 1: Average Spend Calculation

*For any* customer with completed visits at a venue, the calculated average spend SHALL equal the sum of all tab balances divided by the number of completed visits.

**Validates: Requirements 1.1**

### Property 2: Venue Threshold Retrieval

*For any* venue, the Badge_System SHALL retrieve threshold values from the bars table, using venue-specific values if present (bronze_threshold, silver_threshold, gold_threshold) or system defaults (3000, 10000, 25000) if NULL.

**Validates: Requirements 1.2, 1.3**

### Property 3: Badge Tier Determination

*For any* average spend amount and threshold configuration, the Badge_System SHALL determine the correct badge level by finding the highest threshold that the spend meets or exceeds (platinum > gold > silver > bronze > none).

**Validates: Requirements 1.4**

### Property 4: Badge Upgrade Detection and Triggering

*For any* customer with an earned badge level that ranks higher than their current global badge (or no current badge), the Badge_System SHALL trigger a badge upgrade operation.

**Validates: Requirements 1.5, 1.6**

### Property 5: Badge Persistence

*For any* badge award, the Badge_System SHALL write a record to customer_badges table containing customer_id, badge_level, earned_at_bar_id, spend_amount_at_venue, awarded_at timestamp, and is_active = true.

**Validates: Requirements 2.1, 2.2, 2.3**

### Property 6: Single Active Badge Invariant

*For any* customer at any point in time, the customer_badges table SHALL contain exactly zero or one record with is_active = true for that customer.

**Validates: Requirements 2.4**

### Property 7: Badge Upgrade Transaction

*For any* badge upgrade operation, the Badge_System SHALL first set is_active = false on the previous active badge, then insert the new badge record with is_active = true, ensuring atomicity.

**Validates: Requirements 2.5**

### Property 8: Highest Active Badge Retrieval

*For any* customer, querying for the highest active badge SHALL return the badge with the highest rank (platinum > gold > silver > bronze) where is_active = true, or null if no active badge exists.

**Validates: Requirements 3.1**

### Property 9: Cross-Venue Badge Display

*For any* customer with an active badge, the Badge_System SHALL display that badge at all venues, regardless of whether the customer has previously visited the current venue.

**Validates: Requirements 3.2, 3.3**

### Property 10: Single Badge Level Display

*For any* customer at any venue, the Badge_System SHALL display exactly one badge level (the global badge) or no badge, never multiple badge levels simultaneously.

**Validates: Requirements 3.4, 3.5**

### Property 11: Badge Upgrade Notification

*For any* badge upgrade, the Badge_System SHALL display a toast notification containing the new badge level and venue name in the format "Congratulations! You've earned [Tier] status at [Venue Name]".

**Validates: Requirements 4.4, 6.2, 6.3**

### Property 12: Badge Non-Downgrade Invariant

*For any* sequence of badge operations for a customer, the badge level SHALL never decrease in rank (bronze → silver → gold → platinum is allowed, reverse is not).

**Validates: Requirements 4.5**

### Property 13: Notification Preferences

*For any* badge upgrade notification, if sound_enabled is true, the acceptance sound SHALL play; if vibration_enabled is true, the vibration pattern [200, 100, 200, 100, 200] SHALL trigger.

**Validates: Requirements 6.4, 6.5**

### Property 14: Visit Frequency Icon Count

*For any* customer at a venue, the number of badge icons displayed SHALL equal 1 if weeklyVisits < 2, 2 if weeklyVisits = 2, or 3 if weeklyVisits >= 3.

**Validates: Requirements 5.1, 5.2**

### Property 15: Badge Duplication Visual-Only

*For any* customer, the number of badge icons displayed (1, 2, or 3) SHALL NOT affect the discount percentage calculation—only the badge level determines the discount.

**Validates: Requirements 5.5**

### Property 16: Global Badge Discount Integration

*For any* customer with an active badge at any venue, the discount calculation system SHALL use the global badge level to retrieve the discount percentage from venue_discount_settings.

**Validates: Requirements 7.1, 7.2**

### Property 17: Discount Formula Application

*For any* menu item with base price P, badge discount percentage B, and visit bonus percentage V, the displayed price SHALL equal P × (1 - (B + V) / 100), rounded to the nearest whole number.

**Validates: Requirements 7.4**

### Property 18: Payment Trigger Badge Recalculation

*For any* completed payment, the Badge_System SHALL trigger badge recalculation by fetching updated visit data, calculating the earned tier, and comparing against the current global badge.

**Validates: Requirements 8.1, 8.2**

### Property 19: Automatic Price Refresh on Upgrade

*For any* badge upgrade, the Badge_System SHALL automatically refresh all menu item prices by updating the spendTier state, without requiring a page refresh.

**Validates: Requirements 8.5**

### Property 20: Badge Serialization Round-Trip

*For any* valid Badge object, serializing to JSON then deserializing SHALL produce an equivalent object with all fields (customer_id, badge_level, earned_at_bar_id, spend_amount_at_venue) preserved.

**Validates: Requirements 9.4**

### Property 21: Badge Validation

*For any* badge write operation, the Badge_System SHALL validate that all required fields (customer_id, badge_level, earned_at_bar_id, spend_amount_at_venue) are present and valid before writing to the database, returning a descriptive error if validation fails.

**Validates: Requirements 9.3, 9.5**

### Property 22: Badge Refresh Triggers

*For any* badge data in React state, it SHALL only be refreshed when one of two events occurs: (1) payment completion, or (2) tab opening.

**Validates: Requirements 10.4**


## Error Handling

### Database Errors

**Scenario**: Badge query fails due to database connection issue

**Handling**:
```typescript
try {
  const { data, error } = await supabase
    .from('customer_badges')
    .select('*')
    .eq('customer_id', customerId)
    .eq('is_active', true);
    
  if (error) {
    console.error('Badge query failed:', error);
    // Fallback: continue without badge (no discount)
    return { badge_level: null };
  }
} catch (err) {
  console.error('Unexpected error fetching badge:', err);
  // Fallback: continue without badge
  return { badge_level: null };
}
```

**User Impact**: Customer sees normal prices (no discount) until connection restored

**Recovery**: Next payment or page refresh will retry badge fetch

### Badge Upgrade Race Condition

**Scenario**: Customer completes two payments simultaneously at different venues

**Handling**:
```typescript
// Use database UNIQUE constraint to prevent duplicate badge levels
// CONSTRAINT customer_badges_unique_level UNIQUE(customer_id, badge_level)

// If second upgrade tries to insert same level:
const { data, error } = await supabase
  .from('customer_badges')
  .insert({ customer_id, badge_level: 'silver', ... });

if (error?.code === '23505') { // Unique violation
  console.log('Badge level already awarded, skipping duplicate');
  return { upgraded: false, message: 'Badge already exists' };
}
```

**User Impact**: Only one upgrade notification shown, no duplicate badges

**Recovery**: Automatic via database constraint

### Missing Venue Thresholds

**Scenario**: Venue has no threshold configuration in bars table

**Handling**:
```typescript
const { data: venueData } = await supabase
  .from('bars')
  .select('bronze_threshold, silver_threshold, gold_threshold')
  .eq('id', bar_id)
  .single();

// Fallback to system defaults
const thresholds = {
  bronze: venueData?.bronze_threshold ?? 3000,
  silver: venueData?.silver_threshold ?? 10000,
  gold: venueData?.gold_threshold ?? 25000,
};
```

**User Impact**: System defaults used, customer experience unchanged

**Recovery**: Automatic fallback, no user action needed

### Invalid Badge Level

**Scenario**: API receives invalid badge level (e.g., 'diamond')

**Handling**:
```typescript
const VALID_LEVELS = ['bronze', 'silver', 'gold', 'platinum'];

if (!VALID_LEVELS.includes(badge_level)) {
  return NextResponse.json(
    { error: `Invalid badge level: ${badge_level}` },
    { status: 400 }
  );
}
```

**User Impact**: Badge not awarded, error logged

**Recovery**: Fix client code sending invalid level

### Concurrent Badge Updates

**Scenario**: Two API requests try to upgrade same customer's badge simultaneously

**Handling**:
```typescript
// Use database transaction with row locking
const { data: currentBadge } = await supabase
  .from('customer_badges')
  .select('badge_level')
  .eq('customer_id', customer_id)
  .eq('is_active', true)
  .single();

// Check if upgrade still needed (may have been done by concurrent request)
if (newRank <= currentRank) {
  return { upgraded: false, message: 'Already upgraded' };
}

// Proceed with upgrade
await supabase.from('customer_badges').update({ is_active: false })...
await supabase.from('customer_badges').insert(...)...
```

**User Impact**: Only one upgrade processed, no duplicate notifications

**Recovery**: Automatic via rank comparison

### First-Time User (No Badge)

**Scenario**: Customer has never earned a badge

**Handling**:
```typescript
const { data: badge } = await supabase
  .from('customer_badges')
  .select('*')
  .eq('customer_id', customer_id)
  .eq('is_active', true)
  .maybeSingle(); // Returns null if no badge, doesn't throw error

if (!badge) {
  // First badge award - no deactivation needed
  await supabase.from('customer_badges').insert({
    customer_id,
    badge_level,
    earned_at_bar_id: bar_id,
    spend_amount_at_venue: spend_amount,
    is_active: true
  });
}
```

**User Impact**: Smooth first badge award experience

**Recovery**: N/A (expected case)

### Badge Duplication Decay

**Scenario**: Customer hasn't visited venue in 2+ weeks

**Handling**:
```typescript
// Calculate visit frequency window
const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

const { data: recentTabs } = await supabase
  .from('tabs')
  .select('id')
  .eq('customer_id', customer_id)
  .eq('bar_id', bar_id)
  .gte('opened_at', twoWeeksAgo.toISOString());

const weeklyVisits = recentTabs?.length ?? 0;

// Icon count automatically adjusts based on recent visits
const iconCount = weeklyVisits >= 3 ? 3 : weeklyVisits >= 2 ? 2 : 1;
```

**User Impact**: Badge duplication naturally decays, single icon shown

**Recovery**: Automatic based on visit history

### Notification Preferences Missing

**Scenario**: Tab has no notification preferences set

**Handling**:
```typescript
const notificationPrefs = {
  notificationsEnabled: tab.notifications_enabled ?? true,
  soundEnabled: tab.sound_enabled ?? true,
  vibrationEnabled: tab.vibration_enabled ?? true
};

// Use defaults if preferences not set
if (notificationPrefs.soundEnabled) {
  playAcceptanceSound();
}
```

**User Impact**: Defaults to enabled (better UX than silent failure)

**Recovery**: User can disable in settings if unwanted


## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests**: Verify specific examples, edge cases, and error conditions
- First-time badge award (no previous badge)
- Badge upgrade from Bronze → Silver
- Badge upgrade from Silver → Gold
- Attempt to award lower badge (should be rejected)
- Venue with custom thresholds
- Venue with NULL thresholds (system defaults)
- Cross-venue badge display
- Notification content format
- Error handling (invalid badge level, missing fields)

**Property-Based Tests**: Verify universal properties across all inputs
- Badge tier calculation for random spend amounts and thresholds
- Single active badge invariant after random operation sequences
- Badge non-downgrade invariant across random upgrades
- Serialization round-trip for random badge objects
- Discount formula for random prices and percentages
- Visit frequency icon count for random visit counts

### Property-Based Testing Configuration

**Library**: `fast-check` (JavaScript/TypeScript property-based testing library)

**Configuration**:
```typescript
import fc from 'fast-check';

// Minimum 100 iterations per property test
fc.assert(
  fc.property(
    // generators here
    (input) => {
      // property assertion here
    }
  ),
  { numRuns: 100 } // Minimum iterations
);
```

**Tag Format**: Each property test must reference its design document property

```typescript
describe('Feature: cross-venue-badge-persistence, Property 3: Badge Tier Determination', () => {
  it('should determine correct badge level for any spend and threshold configuration', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 100000 }), // average spend
        fc.record({
          bronze: fc.float({ min: 1000, max: 5000 }),
          silver: fc.float({ min: 5000, max: 15000 }),
          gold: fc.float({ min: 15000, max: 30000 })
        }), // thresholds
        (averageSpend, thresholds) => {
          const tier = calculateBadgeTier(averageSpend, thresholds);
          
          if (averageSpend >= thresholds.gold) {
            expect(tier).toBe('gold');
          } else if (averageSpend >= thresholds.silver) {
            expect(tier).toBe('silver');
          } else if (averageSpend >= thresholds.bronze) {
            expect(tier).toBe('bronze');
          } else {
            expect(tier).toBeNull();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Unit Test Examples

#### Test 1: First Badge Award

```typescript
describe('Badge Award', () => {
  it('should award first badge to customer with no previous badge', async () => {
    const customerId = 'test-customer-1';
    const barId = 'test-bar-1';
    
    // Ensure no existing badge
    await supabase
      .from('customer_badges')
      .delete()
      .eq('customer_id', customerId);
    
    // Award bronze badge
    const response = await fetch('/api/loyalty/badge/award', {
      method: 'POST',
      body: JSON.stringify({
        customer_id: customerId,
        bar_id: barId,
        badge_level: 'bronze',
        spend_amount: 3500
      })
    });
    
    const result = await response.json();
    
    expect(result.upgraded).toBe(true);
    expect(result.newBadge.badge_level).toBe('bronze');
    expect(result.newBadge.is_active).toBe(true);
    expect(result.oldBadge).toBeUndefined();
    
    // Verify database state
    const { data: badges } = await supabase
      .from('customer_badges')
      .select('*')
      .eq('customer_id', customerId)
      .eq('is_active', true);
    
    expect(badges).toHaveLength(1);
    expect(badges[0].badge_level).toBe('bronze');
  });
});
```

#### Test 2: Badge Upgrade

```typescript
describe('Badge Upgrade', () => {
  it('should upgrade from bronze to silver and deactivate old badge', async () => {
    const customerId = 'test-customer-2';
    const barId = 'test-bar-1';
    
    // Setup: customer has bronze badge
    await supabase.from('customer_badges').insert({
      customer_id: customerId,
      badge_level: 'bronze',
      earned_at_bar_id: barId,
      spend_amount_at_venue: 3500,
      is_active: true
    });
    
    // Award silver badge
    const response = await fetch('/api/loyalty/badge/award', {
      method: 'POST',
      body: JSON.stringify({
        customer_id: customerId,
        bar_id: barId,
        badge_level: 'silver',
        spend_amount: 10500
      })
    });
    
    const result = await response.json();
    
    expect(result.upgraded).toBe(true);
    expect(result.newBadge.badge_level).toBe('silver');
    expect(result.oldBadge.badge_level).toBe('bronze');
    
    // Verify only one active badge
    const { data: activeBadges } = await supabase
      .from('customer_badges')
      .select('*')
      .eq('customer_id', customerId)
      .eq('is_active', true);
    
    expect(activeBadges).toHaveLength(1);
    expect(activeBadges[0].badge_level).toBe('silver');
    
    // Verify old badge is deactivated
    const { data: allBadges } = await supabase
      .from('customer_badges')
      .select('*')
      .eq('customer_id', customerId)
      .order('awarded_at', { ascending: true });
    
    expect(allBadges).toHaveLength(2);
    expect(allBadges[0].badge_level).toBe('bronze');
    expect(allBadges[0].is_active).toBe(false);
    expect(allBadges[1].badge_level).toBe('silver');
    expect(allBadges[1].is_active).toBe(true);
  });
});
```

#### Test 3: Reject Lower Badge

```typescript
describe('Badge Downgrade Prevention', () => {
  it('should reject attempt to award lower badge level', async () => {
    const customerId = 'test-customer-3';
    const barId = 'test-bar-1';
    
    // Setup: customer has gold badge
    await supabase.from('customer_badges').insert({
      customer_id: customerId,
      badge_level: 'gold',
      earned_at_bar_id: barId,
      spend_amount_at_venue: 25000,
      is_active: true
    });
    
    // Attempt to award silver badge
    const response = await fetch('/api/loyalty/badge/award', {
      method: 'POST',
      body: JSON.stringify({
        customer_id: customerId,
        bar_id: barId,
        badge_level: 'silver',
        spend_amount: 10500
      })
    });
    
    const result = await response.json();
    
    expect(result.upgraded).toBe(false);
    expect(result.currentBadge.badge_level).toBe('gold');
    expect(result.message).toContain('already has gold');
    
    // Verify badge unchanged
    const { data: badges } = await supabase
      .from('customer_badges')
      .select('*')
      .eq('customer_id', customerId)
      .eq('is_active', true);
    
    expect(badges).toHaveLength(1);
    expect(badges[0].badge_level).toBe('gold');
  });
});
```

#### Test 4: Cross-Venue Display

```typescript
describe('Cross-Venue Badge Display', () => {
  it('should display badge earned at Popos when visiting Kikao', async () => {
    const customerId = 'test-customer-4';
    const poposId = 'popos-bar-id';
    const kikaoId = 'kikao-bar-id';
    
    // Setup: customer earned silver at Popos
    await supabase.from('customer_badges').insert({
      customer_id: customerId,
      badge_level: 'silver',
      earned_at_bar_id: poposId,
      spend_amount_at_venue: 5480,
      is_active: true
    });
    
    // Fetch badge while at Kikao (different venue)
    const response = await fetch(`/api/loyalty/badge/${customerId}`);
    const badge = await response.json();
    
    expect(badge.badge_level).toBe('silver');
    expect(badge.earned_at_bar_id).toBe(poposId);
    expect(badge.earned_at_bar_name).toBe('Popos');
    
    // Badge should display at Kikao even though earned at Popos
    // (verified by badge_level being returned regardless of current venue)
  });
});
```

### Property-Based Test Examples

#### Property Test 1: Badge Tier Calculation

```typescript
describe('Feature: cross-venue-badge-persistence, Property 3: Badge Tier Determination', () => {
  it('should determine correct badge level for any spend and threshold configuration', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 100000 }),
        fc.record({
          bronze: fc.float({ min: 1000, max: 5000 }),
          silver: fc.float({ min: 5000, max: 15000 }),
          gold: fc.float({ min: 15000, max: 30000 })
        }),
        (averageSpend, thresholds) => {
          const tier = calculateBadgeTier(averageSpend, thresholds);
          
          // Verify correct tier based on spend
          if (averageSpend >= thresholds.gold) {
            expect(tier).toBe('gold');
          } else if (averageSpend >= thresholds.silver) {
            expect(tier).toBe('silver');
          } else if (averageSpend >= thresholds.bronze) {
            expect(tier).toBe('bronze');
          } else {
            expect(tier).toBeNull();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

#### Property Test 2: Single Active Badge Invariant

```typescript
describe('Feature: cross-venue-badge-persistence, Property 6: Single Active Badge Invariant', () => {
  it('should maintain exactly one active badge per customer after any operation sequence', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            badge_level: fc.constantFrom('bronze', 'silver', 'gold', 'platinum'),
            spend_amount: fc.float({ min: 1000, max: 50000 })
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (operations) => {
          const customerId = `test-customer-${Date.now()}`;
          const barId = 'test-bar-1';
          
          // Execute sequence of badge awards
          for (const op of operations) {
            await fetch('/api/loyalty/badge/award', {
              method: 'POST',
              body: JSON.stringify({
                customer_id: customerId,
                bar_id: barId,
                badge_level: op.badge_level,
                spend_amount: op.spend_amount
              })
            });
          }
          
          // Verify exactly one active badge
          const { data: activeBadges } = await supabase
            .from('customer_badges')
            .select('*')
            .eq('customer_id', customerId)
            .eq('is_active', true);
          
          expect(activeBadges.length).toBeLessThanOrEqual(1);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

#### Property Test 3: Badge Non-Downgrade Invariant

```typescript
describe('Feature: cross-venue-badge-persistence, Property 12: Badge Non-Downgrade Invariant', () => {
  it('should never downgrade badge level across any operation sequence', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.constantFrom('bronze', 'silver', 'gold', 'platinum'),
          { minLength: 2, maxLength: 10 }
        ),
        async (badgeLevels) => {
          const customerId = `test-customer-${Date.now()}`;
          const barId = 'test-bar-1';
          
          const RANK = { bronze: 1, silver: 2, gold: 3, platinum: 4 };
          let previousRank = 0;
          
          // Execute sequence of badge awards
          for (const level of badgeLevels) {
            await fetch('/api/loyalty/badge/award', {
              method: 'POST',
              body: JSON.stringify({
                customer_id: customerId,
                bar_id: barId,
                badge_level: level,
                spend_amount: RANK[level] * 10000
              })
            });
            
            // Check current badge
            const response = await fetch(`/api/loyalty/badge/${customerId}`);
            const badge = await response.json();
            
            if (badge.badge_level) {
              const currentRank = RANK[badge.badge_level];
              expect(currentRank).toBeGreaterThanOrEqual(previousRank);
              previousRank = currentRank;
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

#### Property Test 4: Discount Formula

```typescript
describe('Feature: cross-venue-badge-persistence, Property 17: Discount Formula Application', () => {
  it('should apply discount formula correctly for any price and percentages', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 100, max: 10000 }), // base price
        fc.float({ min: 0, max: 20 }), // badge discount %
        fc.float({ min: 0, max: 10 }), // visit bonus %
        (basePrice, badgePct, visitBonusPct) => {
          const displayPrice = applyDiscount(basePrice, badgePct + visitBonusPct);
          const expected = Math.round(basePrice * (1 - (badgePct + visitBonusPct) / 100));
          
          expect(displayPrice).toBe(expected);
          expect(displayPrice).toBeLessThanOrEqual(basePrice);
          expect(displayPrice).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Integration Tests

#### Integration Test 1: Full Badge Earning Flow

```typescript
describe('Full Badge Earning Flow', () => {
  it('should complete full flow from payment to badge display', async () => {
    const customerId = 'test-customer-integration-1';
    const barId = 'test-bar-1';
    const tabId = 'test-tab-1';
    
    // Step 1: Customer opens tab
    await supabase.from('tabs').insert({
      id: tabId,
      customer_id: customerId,
      bar_id: barId,
      status: 'open'
    });
    
    // Step 2: Customer places orders totaling 5500 KES
    await supabase.from('tab_orders').insert([
      { tab_id: tabId, product_id: 'prod-1', quantity: 2, unit_price: 1500 },
      { tab_id: tabId, product_id: 'prod-2', quantity: 1, unit_price: 2500 }
    ]);
    
    // Step 3: Customer completes payment
    await supabase.from('tab_payments').insert({
      tab_id: tabId,
      amount: 5500,
      payment_method: 'mpesa',
      status: 'completed'
    });
    
    // Step 4: Badge recalculation triggered (simulated)
    const visitsResponse = await fetch(`/api/loyalty/visits/${customerId}?bar_id=${barId}`);
    const visitsData = await visitsResponse.json();
    
    expect(visitsData.averageSpend).toBeGreaterThanOrEqual(5000);
    
    // Step 5: Badge awarded
    const awardResponse = await fetch('/api/loyalty/badge/award', {
      method: 'POST',
      body: JSON.stringify({
        customer_id: customerId,
        bar_id: barId,
        badge_level: 'silver',
        spend_amount: visitsData.averageSpend
      })
    });
    
    const awardResult = await awardResponse.json();
    expect(awardResult.upgraded).toBe(true);
    
    // Step 6: Badge displays at different venue
    const badgeResponse = await fetch(`/api/loyalty/badge/${customerId}`);
    const badge = await badgeResponse.json();
    
    expect(badge.badge_level).toBe('silver');
    expect(badge.earned_at_bar_id).toBe(barId);
    
    // Step 7: Discount applied at different venue
    const kikaoId = 'kikao-bar-id';
    const discountsResponse = await fetch(`/api/loyalty/venue-discounts/${kikaoId}`);
    const discounts = await discountsResponse.json();
    
    const silverDiscount = discounts.spend_tiers.silver;
    expect(silverDiscount).toBeGreaterThan(0);
    
    // Verify price calculation
    const basePrice = 1000;
    const displayPrice = applyDiscount(basePrice, silverDiscount);
    expect(displayPrice).toBeLessThan(basePrice);
  });
});
```

### Test Coverage Goals

- **Unit Tests**: 80%+ code coverage
- **Property Tests**: All 22 correctness properties implemented
- **Integration Tests**: All critical user flows covered
- **Edge Cases**: First-time users, badge upgrades, cross-venue display, error conditions


## Performance Considerations

### Database Query Optimization

#### Index Usage

**Existing Indexes** (already created in migration):
```sql
CREATE INDEX idx_customer_badges_customer_id ON customer_badges(customer_id);
CREATE INDEX idx_customer_badges_active ON customer_badges(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_customer_badges_level ON customer_badges(badge_level);
```

**Query Performance**:
- Badge lookup by customer_id: O(log n) with index
- Active badge filter: Partial index on `is_active = TRUE` reduces scan size
- Expected query time: <10ms for 95% of requests

**Query Plan Example**:
```sql
EXPLAIN ANALYZE
SELECT badge_level, awarded_at, earned_at_bar_id
FROM customer_badges
WHERE customer_id = 'abc-123' AND is_active = true
ORDER BY CASE badge_level 
  WHEN 'platinum' THEN 4 
  WHEN 'gold' THEN 3 
  WHEN 'silver' THEN 2 
  WHEN 'bronze' THEN 1 
END DESC
LIMIT 1;

-- Expected: Index Scan using idx_customer_badges_customer_id
-- Execution time: 2-5ms
```

#### Query Batching

**Problem**: Multiple API calls on page load (visits, discounts, badge)

**Solution**: Combine related queries in single API route

```typescript
// New route: GET /api/loyalty/customer-data/[customer_id]?bar_id=X
// Returns: { visits, discounts, badge } in one request

export async function GET(request, { params }) {
  const { customer_id } = await params;
  const { searchParams } = request.nextUrl;
  const bar_id = searchParams.get('bar_id');
  
  const [visitsData, discountsData, badgeData] = await Promise.all([
    fetchVisits(customer_id, bar_id),
    fetchDiscounts(bar_id),
    fetchBadge(customer_id)
  ]);
  
  return NextResponse.json({
    visits: visitsData,
    discounts: discountsData,
    badge: badgeData
  });
}
```

**Performance Gain**: 3 sequential requests → 1 parallel request
- Before: 3 × 50ms = 150ms total
- After: max(50ms, 50ms, 50ms) = 50ms total
- **Improvement: 66% faster**

### Caching Strategy

#### React State Caching

**Current Implementation**:
```typescript
const [globalBadge, setGlobalBadge] = useState(null);
const [loyaltyData, setLoyaltyData] = useState(null);
const [venueDiscounts, setVenueDiscounts] = useState(DEFAULT_TIER_DISCOUNTS);
```

**Cache Invalidation Triggers**:
1. Payment completion → refetch badge + visits
2. Tab opening → refetch all loyalty data
3. Page refresh → refetch all (no persistence)

**Cache Duration**: Session-only (no localStorage persistence)

**Rationale**: Badge data changes infrequently (only on upgrades), so session caching is sufficient

#### API Response Caching

**Badge Lookup Caching** (optional enhancement):
```typescript
// Cache badge data for 5 minutes (badge changes are rare)
export async function GET(request, { params }) {
  const { customer_id } = await params;
  
  const badge = await fetchBadge(customer_id);
  
  return NextResponse.json(badge, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
    }
  });
}
```

**Performance Gain**: Subsequent badge lookups served from CDN cache
- First request: 50ms (database query)
- Cached requests: 5-10ms (CDN response)
- **Improvement: 80-90% faster for cached requests**

### Database Connection Pooling

**Supabase Connection Pooling** (already configured):
- Supabase uses PgBouncer for connection pooling
- Max connections: 15 per project (free tier)
- Connection reuse: Automatic via Supabase client

**No additional configuration needed** - Supabase handles pooling automatically

### Badge Upgrade Transaction Performance

**Current Implementation** (2 queries):
```typescript
// 1. Deactivate old badge
await supabase
  .from('customer_badges')
  .update({ is_active: false })
  .eq('customer_id', customer_id)
  .eq('is_active', true);

// 2. Insert new badge
await supabase
  .from('customer_badges')
  .insert({ customer_id, badge_level, ... });
```

**Performance**: 2 × 10ms = 20ms total

**Optimization** (optional): Use database function for atomic upgrade
```sql
CREATE OR REPLACE FUNCTION upgrade_customer_badge(
  p_customer_id UUID,
  p_badge_level TEXT,
  p_bar_id UUID,
  p_spend_amount DECIMAL
) RETURNS customer_badges AS $
BEGIN
  -- Deactivate old badge
  UPDATE customer_badges
  SET is_active = false
  WHERE customer_id = p_customer_id AND is_active = true;
  
  -- Insert new badge
  INSERT INTO customer_badges (customer_id, badge_level, earned_at_bar_id, spend_amount_at_venue)
  VALUES (p_customer_id, p_badge_level, p_bar_id, p_spend_amount)
  RETURNING *;
END;
$ LANGUAGE plpgsql;
```

**Performance Gain**: 2 round-trips → 1 round-trip
- Before: 20ms (2 queries)
- After: 12ms (1 function call)
- **Improvement: 40% faster**

### Frontend Performance

#### Lazy Loading Badge Data

**Current**: Badge data loaded on every page load

**Optimization**: Only load badge data when needed (menu page, not login page)

```typescript
// Only load badge data on menu page
useEffect(() => {
  if (tab?.customer_id && tab?.bar_id) {
    loadLoyaltyData(); // Includes badge fetch
  }
}, [tab?.customer_id, tab?.bar_id]);
```

**Performance Gain**: Reduces unnecessary API calls on non-menu pages

#### Debounced Badge Recalculation

**Problem**: Multiple payments in quick succession trigger multiple badge recalculations

**Solution**: Debounce badge recalculation by 2 seconds

```typescript
const debouncedLoadLoyaltyData = useCallback(
  debounce(() => {
    loadLoyaltyData();
  }, 2000),
  [tab?.customer_id, tab?.bar_id]
);

// In payment handler
useEffect(() => {
  if (newPayment) {
    debouncedLoadLoyaltyData();
  }
}, [payments]);
```

**Performance Gain**: Multiple rapid payments → single badge recalculation
- Before: 3 payments × 50ms = 150ms API calls
- After: 1 × 50ms = 50ms API call
- **Improvement: 66% fewer API calls**

### Monitoring & Metrics

**Key Performance Indicators**:
- Badge lookup latency (p50, p95, p99)
- Badge upgrade transaction time
- Cache hit rate (if API caching implemented)
- Failed badge queries (error rate)

**Logging**:
```typescript
console.log('🏆 Badge lookup:', {
  customer_id,
  duration_ms: Date.now() - startTime,
  badge_level: badge?.badge_level || 'none',
  cached: false
});
```

**Alerting Thresholds**:
- p95 latency > 200ms → investigate slow queries
- Error rate > 1% → investigate database issues
- Cache hit rate < 80% → review cache strategy


## Integration Points

### Integration with Existing Discount System

**Current Discount Flow**:
```
1. loadLoyaltyData() fetches visit data
2. Calculate spend tier locally (bronze/silver/gold)
3. Fetch venue discounts from venue_discount_settings
4. Apply discount: displayPrice = basePrice × (1 - (badgePct + visitBonusPct) / 100)
5. Update spendTier state → triggers menu price recalculation
```

**New Discount Flow with Badge Persistence**:
```
1. loadLoyaltyData() fetches visit data + global badge
2. Compare local calculation vs global badge
3. If local > global, award new badge via API
4. Use global badge level for discount lookup
5. Fetch venue discounts (same as before)
6. Apply discount (same formula)
7. Update spendTier state → triggers menu price recalculation
```

**Key Changes**:
- `spendTier` now reflects global badge, not local calculation
- Discount formula unchanged: `displayPrice = basePrice × (1 - (badgePct + visitBonusPct) / 100)`
- Visit frequency bonus calculation unchanged

**Backward Compatibility**:
- Venues without custom thresholds continue using system defaults
- Discount percentages from `venue_discount_settings` unchanged
- Menu price calculation logic unchanged

### Integration with Menu Pricing

**Current Implementation** (`app/menu/page.tsx`):
```typescript
function applyDiscount(price: number, pct: number): number {
  return Math.round(price * (1 - pct / 100));
}

// In menu rendering
const badgePct = spendTier ? venueDiscounts[spendTier] : 0;
const visitBonusPct = calculateVisitBonus(loyaltyData?.weeklyVisits);
const totalDiscount = badgePct + visitBonusPct;
const displayPrice = applyDiscount(basePrice, totalDiscount);
```

**Required Changes**:
```typescript
// spendTier now comes from globalBadge, not local calculation
const badgePct = globalBadge?.badge_level ? venueDiscounts[globalBadge.badge_level] : 0;
const visitBonusPct = calculateVisitBonus(loyaltyData?.weeklyVisits);
const totalDiscount = badgePct + visitBonusPct;
const displayPrice = applyDiscount(basePrice, totalDiscount);
```

**No changes to**:
- `applyDiscount` function
- Visit bonus calculation
- Price display formatting
- Menu item rendering

### Integration with Payment System

**Current Payment Flow**:
```
1. Customer completes payment
2. Payment inserted to tab_payments
3. Realtime subscription fires
4. handlePaymentUpdate() called
5. (No badge recalculation)
```

**New Payment Flow with Badge Persistence**:
```
1. Customer completes payment
2. Payment inserted to tab_payments
3. Realtime subscription fires
4. handlePaymentUpdate() called
5. loadLoyaltyData() triggered
6. Badge recalculation + upgrade check
7. If upgrade: award badge + show notification
8. Menu prices refresh automatically
```

**Implementation**:
```typescript
const handlePaymentUpdate = useCallback((payload: any) => {
  console.log('💳 Payment update received:', payload);
  
  // Existing payment handling
  setPayments(prevPayments => updatePaymentInList(prevPayments, payload.new));
  
  // NEW: Trigger badge recalculation
  if (payload.new.status === 'completed') {
    loadLoyaltyData(); // Fetches visits, calculates tier, checks for upgrade
  }
}, [loadLoyaltyData]);
```

**Key Changes**:
- Add `loadLoyaltyData()` call after payment completion
- Badge upgrade notification shown automatically
- Menu prices update via `spendTier` state change

### Integration with Tab Opening Flow

**Current Tab Opening Flow**:
```
1. Customer scans QR code / enters venue code
2. Tab created in database
3. Menu page loads
4. loadLoyaltyData() called
5. Visit data fetched, tier calculated
6. Menu prices displayed with discount
```

**New Tab Opening Flow with Badge Persistence**:
```
1. Customer scans QR code / enters venue code
2. Tab created in database
3. Menu page loads
4. loadLoyaltyData() called
5. Visit data + global badge fetched
6. Badge displayed in header (even if earned elsewhere)
7. Menu prices displayed with global badge discount
```

**Implementation** (no changes needed):
```typescript
useEffect(() => {
  if (tab?.bar_id && tab?.customer_id) {
    loadLoyaltyData(); // Already includes badge fetch in new implementation
  }
}, [tab?.bar_id, tab?.customer_id]);
```

**Key Changes**:
- `loadLoyaltyData()` now fetches global badge
- Badge displays immediately on tab open
- Cross-venue badge recognition automatic

### Integration with Notification System

**Current Notification System**:
```typescript
const { showToast } = useToast();

// Used for order acceptance, payment confirmation, etc.
showToast({
  type: 'success',
  title: 'Order Accepted',
  message: 'Your order has been confirmed',
  duration: 5000
});
```

**New Badge Upgrade Notification**:
```typescript
// In loadLoyaltyData() after badge upgrade
if (upgraded && newBadge) {
  const tierName = newBadge.badge_level.charAt(0).toUpperCase() + newBadge.badge_level.slice(1);
  
  showToast({
    type: 'success',
    title: `Congratulations! You've earned ${tierName} status`,
    message: `at ${barName}`,
    duration: 8000 // Longer duration for badge upgrades
  });
  
  // Sound + vibration (if enabled)
  if (notificationPrefs.soundEnabled) {
    playAcceptanceSound();
  }
  if (notificationPrefs.vibrationEnabled) {
    buzz([200, 100, 200, 100, 200]); // Celebration pattern
  }
}
```

**Key Changes**:
- New notification type for badge upgrades
- Longer duration (8s vs 5s)
- Includes venue name where badge was earned
- Respects user notification preferences

### Integration with Realtime Subscriptions

**Current Realtime Subscriptions** (`app/menu/page.tsx`):
```typescript
// 4 separate channels
useRealtimeSubscription('tab-orders-{id}', ...);
useRealtimeSubscription('tab-status-{id}', ...);
useRealtimeSubscription('tab-payments-{id}', ...);
useRealtimeSubscription('tab-messages-{id}', ...);
```

**New Badge Subscription** (optional enhancement):
```typescript
// Subscribe to badge changes (for multi-device sync)
useRealtimeSubscription(
  `customer-badges-${tab?.customer_id}`,
  'customer_badges',
  {
    event: 'UPDATE',
    schema: 'public',
    filter: `customer_id=eq.${tab?.customer_id}`
  },
  (payload) => {
    console.log('🏆 Badge updated:', payload);
    // Refresh global badge state
    fetchBadge(tab.customer_id).then(setGlobalBadge);
  }
);
```

**Use Case**: Customer earns badge on mobile, badge updates on desktop automatically

**Priority**: Low (nice-to-have, not critical for MVP)

### Integration with Staff App

**Staff App Badge Display** (future enhancement):
```
Staff app shows customer's badge in tab detail view:
- Badge level (Bronze/Silver/Gold/Platinum)
- Earned at venue name
- Date awarded
- Current spend at this venue
```

**API Route** (already exists):
```
GET /api/loyalty/badge/[customer_id]
```

**Staff App Implementation**:
```typescript
// In staff app tab detail page
const { data: badge } = await fetch(`/api/loyalty/badge/${customer_id}`);

// Display badge in customer info section
<div className="customer-badge">
  <BadgeIcon level={badge.badge_level} />
  <span>{badge.badge_level} • Earned at {badge.earned_at_bar_name}</span>
</div>
```

**Priority**: Medium (useful for staff to see customer status)

### Integration with Analytics

**Badge Analytics** (future enhancement):
```
Track badge-related metrics:
- Badge distribution (% bronze/silver/gold/platinum)
- Badge upgrade rate (upgrades per week)
- Cross-venue badge usage (% customers using badge at multiple venues)
- Average time to first badge
- Badge impact on revenue (spend before vs after badge)
```

**Implementation**:
```sql
-- Badge distribution query
SELECT badge_level, COUNT(*) as count
FROM customer_badges
WHERE is_active = true
GROUP BY badge_level;

-- Cross-venue usage query
SELECT customer_id, COUNT(DISTINCT earned_at_bar_id) as venues_count
FROM customer_badges
WHERE is_active = true
GROUP BY customer_id
HAVING COUNT(DISTINCT earned_at_bar_id) > 1;
```

**Priority**: Low (analytics, not core functionality)


## Edge Cases and Special Scenarios

### Edge Case 1: First-Time User at Any Venue

**Scenario**: Customer has never visited any Tabeza venue before

**Expected Behavior**:
- No badge displayed in header
- Normal prices shown (no discount)
- After first payment meeting threshold, badge awarded
- Badge displays immediately after award

**Implementation**:
```typescript
// Badge query returns null for first-time users
const { data: badge } = await supabase
  .from('customer_badges')
  .select('*')
  .eq('customer_id', customer_id)
  .eq('is_active', true)
  .maybeSingle();

if (!badge) {
  // First-time user - no badge to display
  return { badge_level: null };
}
```

**Test Case**:
```typescript
it('should handle first-time user with no badge', async () => {
  const newCustomerId = 'new-customer-123';
  
  const response = await fetch(`/api/loyalty/badge/${newCustomerId}`);
  const badge = await response.json();
  
  expect(badge.badge_level).toBeNull();
});
```

### Edge Case 2: Customer Visits New Venue for First Time

**Scenario**: Customer has Silver badge from Popos, visits Kikao for first time

**Expected Behavior**:
- Silver badge displays at Kikao (cross-venue recognition)
- Silver discount applied using Kikao's discount percentages
- Visit frequency shows 1 icon (first visit at Kikao)
- Badge shape = Silver shield, icon count = 1

**Implementation**:
```typescript
// Global badge from any venue
const globalBadge = await fetchBadge(customer_id); // Returns Silver from Popos

// Visit frequency at current venue
const { weeklyVisits } = await fetchVisits(customer_id, kikao_bar_id); // Returns 0 (first visit)

// Display: Silver shield × 1 icon
const badgeShape = globalBadge.badge_level; // 'silver'
const iconCount = weeklyVisits >= 3 ? 3 : weeklyVisits >= 2 ? 2 : 1; // 1
```

**Test Case**:
```typescript
it('should display badge from other venue on first visit', async () => {
  const customerId = 'customer-with-badge';
  const poposId = 'popos-id';
  const kikaoId = 'kikao-id';
  
  // Setup: customer has Silver at Popos
  await supabase.from('customer_badges').insert({
    customer_id: customerId,
    badge_level: 'silver',
    earned_at_bar_id: poposId,
    is_active: true
  });
  
  // Visit Kikao for first time
  const badge = await fetch(`/api/loyalty/badge/${customerId}`);
  const visits = await fetch(`/api/loyalty/visits/${customerId}?bar_id=${kikaoId}`);
  
  expect(badge.badge_level).toBe('silver');
  expect(visits.completedVisits).toBe(0); // First visit
});
```

### Edge Case 3: Concurrent Badge Upgrades at Different Venues

**Scenario**: Customer completes payments at two venues simultaneously, both triggering badge upgrades

**Expected Behavior**:
- Only one upgrade succeeds (higher badge wins)
- Database constraint prevents duplicate badge levels
- Both API calls return success, but only one creates new badge

**Implementation**:
```typescript
// Database constraint prevents duplicates
CONSTRAINT customer_badges_unique_level UNIQUE(customer_id, badge_level)

// API handles duplicate gracefully
const { error } = await supabase
  .from('customer_badges')
  .insert({ customer_id, badge_level: 'silver', ... });

if (error?.code === '23505') { // Unique violation
  console.log('Badge already awarded by concurrent request');
  return { upgraded: false, message: 'Badge already exists' };
}
```

**Test Case**:
```typescript
it('should handle concurrent badge upgrades gracefully', async () => {
  const customerId = 'customer-concurrent';
  
  // Simulate two simultaneous upgrade requests
  const [result1, result2] = await Promise.all([
    fetch('/api/loyalty/badge/award', {
      method: 'POST',
      body: JSON.stringify({ customer_id: customerId, badge_level: 'silver', ... })
    }),
    fetch('/api/loyalty/badge/award', {
      method: 'POST',
      body: JSON.stringify({ customer_id: customerId, badge_level: 'silver', ... })
    })
  ]);
  
  // One succeeds, one fails gracefully
  const results = await Promise.all([result1.json(), result2.json()]);
  const successCount = results.filter(r => r.upgraded).length;
  
  expect(successCount).toBe(1); // Only one upgrade succeeds
});
```

### Edge Case 4: Badge Upgrade from Bronze to Gold (Skipping Silver)

**Scenario**: Customer has Bronze badge, spends enough to reach Gold threshold in one payment

**Expected Behavior**:
- Bronze badge deactivated
- Gold badge awarded (Silver skipped)
- Notification shows "Gold status" (not Silver)
- Customer never sees Silver badge

**Implementation**:
```typescript
// Badge upgrade logic compares ranks, not sequential levels
const BADGE_RANK = { bronze: 1, silver: 2, gold: 3, platinum: 4 };

const currentRank = currentBadge ? BADGE_RANK[currentBadge.badge_level] : 0; // 1 (bronze)
const newRank = BADGE_RANK[badge_level]; // 3 (gold)

if (newRank > currentRank) {
  // Upgrade from bronze directly to gold
  await deactivateBadge(customer_id);
  await insertBadge({ customer_id, badge_level: 'gold', ... });
}
```

**Test Case**:
```typescript
it('should allow skipping badge levels (bronze to gold)', async () => {
  const customerId = 'customer-skip-level';
  
  // Setup: customer has bronze
  await supabase.from('customer_badges').insert({
    customer_id: customerId,
    badge_level: 'bronze',
    is_active: true
  });
  
  // Award gold directly
  const response = await fetch('/api/loyalty/badge/award', {
    method: 'POST',
    body: JSON.stringify({
      customer_id: customerId,
      badge_level: 'gold',
      spend_amount: 25000
    })
  });
  
  const result = await response.json();
  
  expect(result.upgraded).toBe(true);
  expect(result.newBadge.badge_level).toBe('gold');
  expect(result.oldBadge.badge_level).toBe('bronze');
  
  // Verify no silver badge exists
  const { data: badges } = await supabase
    .from('customer_badges')
    .select('*')
    .eq('customer_id', customerId);
  
  expect(badges.find(b => b.badge_level === 'silver')).toBeUndefined();
});
```

### Edge Case 5: Badge Duplication Decay After 2 Weeks

**Scenario**: Customer visited venue 3x/week, then stopped visiting for 2+ weeks

**Expected Behavior**:
- Badge duplication (3 icons) shown during active period
- After 2 weeks of no visits, display reverts to 1 icon
- Badge level unchanged (still Silver/Gold/etc.)

**Implementation**:
```typescript
// Visit frequency window: 2 weeks
const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

const { data: recentTabs } = await supabase
  .from('tabs')
  .select('id')
  .eq('customer_id', customer_id)
  .eq('bar_id', bar_id)
  .gte('opened_at', twoWeeksAgo.toISOString());

const weeklyVisits = recentTabs?.length ?? 0;

// Icon count based on recent visits only
const iconCount = weeklyVisits >= 3 ? 3 : weeklyVisits >= 2 ? 2 : 1;
```

**Test Case**:
```typescript
it('should decay badge duplication after 2 weeks of no visits', async () => {
  const customerId = 'customer-decay';
  const barId = 'test-bar';
  
  // Setup: customer visited 3x three weeks ago
  const threeWeeksAgo = new Date(Date.now() - 21 * 24 * 60 * 60 * 1000);
  
  await supabase.from('tabs').insert([
    { customer_id: customerId, bar_id: barId, opened_at: threeWeeksAgo },
    { customer_id: customerId, bar_id: barId, opened_at: threeWeeksAgo },
    { customer_id: customerId, bar_id: barId, opened_at: threeWeeksAgo }
  ]);
  
  // Fetch visit data
  const response = await fetch(`/api/loyalty/visits/${customerId}?bar_id=${barId}`);
  const data = await response.json();
  
  // Weekly visits should be 0 (outside 2-week window)
  expect(data.weeklyVisits).toBe(0);
  
  // Icon count should be 1 (no recent visits)
  const iconCount = data.weeklyVisits >= 3 ? 3 : data.weeklyVisits >= 2 ? 2 : 1;
  expect(iconCount).toBe(1);
});
```

### Edge Case 6: Venue Changes Thresholds After Badge Awarded

**Scenario**: Customer earned Silver at 5,000 KES threshold, venue later raises threshold to 8,000 KES

**Expected Behavior**:
- Customer keeps Silver badge (badges never downgrade)
- New customers must meet new 8,000 KES threshold
- Existing badge remains valid indefinitely

**Implementation**:
```typescript
// Badge award is permanent - threshold changes don't affect existing badges
// Only new badge awards use updated thresholds

// Customer's existing badge
const existingBadge = { badge_level: 'silver', spend_amount_at_venue: 5000 };

// Venue updates threshold
await supabase.from('bars').update({ silver_threshold: 8000 });

// Customer's badge unchanged
const { data: badge } = await supabase
  .from('customer_badges')
  .select('*')
  .eq('customer_id', customer_id)
  .eq('is_active', true);

expect(badge.badge_level).toBe('silver'); // Still Silver
expect(badge.spend_amount_at_venue).toBe(5000); // Historical spend preserved
```

**Test Case**:
```typescript
it('should preserve existing badges when venue changes thresholds', async () => {
  const customerId = 'customer-threshold-change';
  const barId = 'test-bar';
  
  // Setup: customer earned Silver at old threshold (5000)
  await supabase.from('customer_badges').insert({
    customer_id: customerId,
    badge_level: 'silver',
    earned_at_bar_id: barId,
    spend_amount_at_venue: 5000,
    is_active: true
  });
  
  // Venue raises threshold
  await supabase.from('bars').update({ silver_threshold: 8000 }).eq('id', barId);
  
  // Customer's badge unchanged
  const response = await fetch(`/api/loyalty/badge/${customerId}`);
  const badge = await response.json();
  
  expect(badge.badge_level).toBe('silver');
  expect(badge.spend_amount_at_venue).toBe(5000);
});
```

### Edge Case 7: Customer Deletes Account

**Scenario**: Customer deletes their account, has active badges

**Expected Behavior**:
- All badges deleted via CASCADE constraint
- No orphaned badge records
- Clean database state

**Implementation**:
```sql
-- Database constraint handles cleanup
customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE

-- When user deleted from auth.users, all badges automatically deleted
```

**Test Case**:
```typescript
it('should delete all badges when customer account deleted', async () => {
  const customerId = 'customer-to-delete';
  
  // Setup: customer has badges
  await supabase.from('customer_badges').insert([
    { customer_id: customerId, badge_level: 'bronze', is_active: false },
    { customer_id: customerId, badge_level: 'silver', is_active: true }
  ]);
  
  // Delete customer account
  await supabase.auth.admin.deleteUser(customerId);
  
  // Verify badges deleted
  const { data: badges } = await supabase
    .from('customer_badges')
    .select('*')
    .eq('customer_id', customerId);
  
  expect(badges).toHaveLength(0);
});
```

### Edge Case 8: Badge Display with No Visit History at Current Venue

**Scenario**: Customer has Gold badge from Popos, visits Kikao for first time (no completed visits yet)

**Expected Behavior**:
- Gold badge displays (cross-venue recognition)
- Gold discount applied
- Visit frequency shows 1 icon (current visit counts)
- No error from zero completed visits

**Implementation**:
```typescript
// Global badge (from any venue)
const globalBadge = await fetchBadge(customer_id); // Gold from Popos

// Visit data at current venue
const { completedVisits, weeklyVisits } = await fetchVisits(customer_id, kikao_id);
// completedVisits = 0 (no completed visits yet)
// weeklyVisits = 1 (current open tab counts)

// Display: Gold crown × 1 icon
const badgeLevel = globalBadge.badge_level; // 'gold'
const iconCount = weeklyVisits >= 3 ? 3 : weeklyVisits >= 2 ? 2 : 1; // 1
```

**Test Case**:
```typescript
it('should display badge with no completed visits at current venue', async () => {
  const customerId = 'customer-no-history';
  const poposId = 'popos-id';
  const kikaoId = 'kikao-id';
  
  // Setup: customer has Gold at Popos
  await supabase.from('customer_badges').insert({
    customer_id: customerId,
    badge_level: 'gold',
    earned_at_bar_id: poposId,
    is_active: true
  });
  
  // Open tab at Kikao (no completed visits)
  await supabase.from('tabs').insert({
    customer_id: customerId,
    bar_id: kikaoId,
    status: 'open'
  });
  
  // Fetch badge and visits
  const badge = await fetch(`/api/loyalty/badge/${customerId}`);
  const visits = await fetch(`/api/loyalty/visits/${customerId}?bar_id=${kikaoId}`);
  
  const badgeData = await badge.json();
  const visitsData = await visits.json();
  
  expect(badgeData.badge_level).toBe('gold');
  expect(visitsData.completedVisits).toBe(0);
  expect(visitsData.weeklyVisits).toBeGreaterThanOrEqual(1); // Current tab counts
});
```


## Implementation Roadmap

### Phase 1: Database & API Foundation (Week 1)

**Goal**: Set up badge persistence infrastructure

**Tasks**:
1. Verify `customer_badges` table exists (already created in migration)
2. Create API route: `GET /api/loyalty/badge/[customer_id]`
3. Create API route: `POST /api/loyalty/badge/award`
4. Write unit tests for API routes
5. Test badge CRUD operations manually

**Deliverables**:
- Working badge API routes
- Unit tests passing
- API documentation

**Success Criteria**:
- Badge can be queried by customer_id
- Badge can be awarded via API
- Single active badge invariant maintained

### Phase 2: Frontend Integration (Week 2)

**Goal**: Integrate badge persistence with menu page

**Tasks**:
1. Add `globalBadge` state to menu page
2. Modify `loadLoyaltyData()` to fetch global badge
3. Update `renderLoyaltyIcons()` to use global badge
4. Implement badge upgrade detection logic
5. Add badge upgrade notification
6. Update menu price calculation to use global badge

**Deliverables**:
- Badge displays in menu header
- Badge upgrades trigger notifications
- Menu prices reflect global badge discount

**Success Criteria**:
- Badge displays at all venues (cross-venue recognition)
- Badge upgrades show notification
- Prices update automatically after upgrade

### Phase 3: Payment Integration (Week 3)

**Goal**: Trigger badge recalculation on payment completion

**Tasks**:
1. Modify payment handler to call `loadLoyaltyData()`
2. Implement badge upgrade check after payment
3. Test payment → badge upgrade flow
4. Add error handling for failed badge awards
5. Test concurrent payment scenarios

**Deliverables**:
- Payment completion triggers badge recalculation
- Badge upgrades happen automatically
- Error handling for edge cases

**Success Criteria**:
- Badge awarded immediately after qualifying payment
- Notification shown on upgrade
- No duplicate badges created

### Phase 4: Testing & Optimization (Week 4)

**Goal**: Comprehensive testing and performance optimization

**Tasks**:
1. Write property-based tests (22 properties)
2. Write integration tests (full user flows)
3. Test edge cases (first-time users, concurrent upgrades, etc.)
4. Implement caching strategy
5. Add performance monitoring
6. Load testing (100+ concurrent users)

**Deliverables**:
- 100+ property-based test cases
- Integration tests covering all flows
- Performance benchmarks
- Load test results

**Success Criteria**:
- All property tests passing (100 iterations each)
- p95 latency < 100ms for badge lookups
- No race conditions in concurrent scenarios
- 80%+ code coverage

### Phase 5: Documentation & Deployment (Week 5)

**Goal**: Production deployment and documentation

**Tasks**:
1. Update API documentation
2. Write user-facing documentation
3. Create staff training materials
4. Deploy to staging environment
5. Staging testing (full QA)
6. Deploy to production
7. Monitor production metrics

**Deliverables**:
- Complete API documentation
- User guide for badge system
- Staff training materials
- Production deployment

**Success Criteria**:
- Zero critical bugs in staging
- All tests passing in production
- Monitoring dashboards active
- Staff trained on new system

## Migration Strategy

### Existing Customer Data

**Scenario**: Customers who already have visit history but no badges

**Strategy**: Backfill badges based on historical spend

**Implementation**:
```sql
-- Backfill script: Award badges to existing customers based on historical spend
INSERT INTO customer_badges (customer_id, badge_level, earned_at_bar_id, spend_amount_at_venue, is_active)
SELECT 
  t.customer_id,
  CASE 
    WHEN AVG(tb.balance) >= 25000 THEN 'gold'
    WHEN AVG(tb.balance) >= 10000 THEN 'silver'
    WHEN AVG(tb.balance) >= 3000 THEN 'bronze'
  END as badge_level,
  t.bar_id as earned_at_bar_id,
  AVG(tb.balance) as spend_amount_at_venue,
  true as is_active
FROM tabs t
JOIN tab_balances tb ON tb.tab_id = t.id
WHERE t.closed_at IS NOT NULL
  AND t.customer_id IS NOT NULL
GROUP BY t.customer_id, t.bar_id
HAVING AVG(tb.balance) >= 3000
ON CONFLICT (customer_id, badge_level) DO NOTHING;
```

**Execution Plan**:
1. Run backfill script in staging
2. Verify badge counts match expectations
3. Test badge display for backfilled customers
4. Run backfill in production during low-traffic window
5. Monitor for errors

**Rollback Plan**:
```sql
-- Rollback: Delete all badges created by backfill
DELETE FROM customer_badges
WHERE awarded_at >= '2024-01-20 00:00:00' -- Backfill timestamp
  AND awarded_at <= '2024-01-20 01:00:00';
```

### Gradual Rollout

**Phase 1: Internal Testing** (Week 1)
- Enable for test accounts only
- Staff testing at 2-3 venues
- Monitor for bugs

**Phase 2: Beta Venues** (Week 2)
- Enable for 5-10 beta venues
- Monitor badge awards and upgrades
- Collect feedback from venue owners

**Phase 3: Full Rollout** (Week 3)
- Enable for all venues
- Monitor system performance
- Support team ready for customer questions

**Feature Flag**:
```typescript
// Environment variable to control rollout
const BADGE_PERSISTENCE_ENABLED = process.env.NEXT_PUBLIC_BADGE_PERSISTENCE_ENABLED === 'true';

// In loadLoyaltyData()
if (BADGE_PERSISTENCE_ENABLED) {
  // New badge persistence logic
  const globalBadge = await fetchBadge(customer_id);
  // ...
} else {
  // Old stateless logic
  const earnedTier = calculateTierLocally(averageSpend, thresholds);
  // ...
}
```

## Monitoring & Observability

### Key Metrics

**Badge System Health**:
- Badge lookups per minute
- Badge awards per hour
- Badge upgrade rate
- Failed badge queries (error rate)
- Average badge lookup latency (p50, p95, p99)

**Business Metrics**:
- Total active badges by level (bronze/silver/gold/platinum)
- Badge distribution across venues
- Cross-venue badge usage rate
- Average time to first badge
- Badge impact on customer retention

**Performance Metrics**:
- API response time (badge lookup, badge award)
- Database query time
- Cache hit rate (if implemented)
- Concurrent request handling

### Logging

**Badge Lookup**:
```typescript
console.log('🏆 Badge lookup:', {
  customer_id,
  badge_level: badge?.badge_level || 'none',
  earned_at: badge?.earned_at_bar_name,
  duration_ms: Date.now() - startTime
});
```

**Badge Award**:
```typescript
console.log('🎖️ Badge awarded:', {
  customer_id,
  badge_level: newBadge.badge_level,
  earned_at_bar: barName,
  spend_amount: spend_amount,
  upgraded_from: oldBadge?.badge_level || 'none'
});
```

**Badge Upgrade**:
```typescript
console.log('⬆️ Badge upgraded:', {
  customer_id,
  old_level: oldBadge.badge_level,
  new_level: newBadge.badge_level,
  earned_at_bar: barName,
  notification_shown: true
});
```

### Alerting

**Critical Alerts** (PagerDuty):
- Badge query error rate > 5% (5 min window)
- Badge award failures > 10% (5 min window)
- p99 latency > 500ms (5 min window)

**Warning Alerts** (Slack):
- Badge query error rate > 1% (15 min window)
- p95 latency > 200ms (15 min window)
- Unusual badge award spike (>2x normal rate)

**Info Alerts** (Dashboard):
- Badge distribution changes
- New badge milestones (10k, 50k, 100k total badges)
- Cross-venue usage trends

### Dashboards

**Badge System Dashboard** (Grafana):
- Badge lookups per minute (line chart)
- Badge awards per hour (line chart)
- Badge distribution pie chart (bronze/silver/gold/platinum)
- Average lookup latency (line chart)
- Error rate (line chart)

**Business Metrics Dashboard**:
- Total active badges (counter)
- Badge growth rate (line chart)
- Cross-venue usage rate (gauge)
- Top venues by badge awards (bar chart)
- Badge impact on retention (cohort analysis)

## Security Considerations

### Row Level Security (RLS)

**Current RLS Policies** (already implemented):
```sql
-- Staff can view badges for customers at their venue
CREATE POLICY customer_badges_staff_view ON customer_badges
  FOR SELECT USING (
    earned_at_bar_id IN (
      SELECT bar_id FROM user_bars 
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'owner', 'manager', 'supervisor', 'waiter', 'bartender')
    )
  );

-- Admins can manage badges for their venue
CREATE POLICY customer_badges_admin_manage ON customer_badges
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_bars 
      WHERE user_id = auth.uid()
        AND bar_id = earned_at_bar_id
        AND role IN ('admin', 'owner', 'manager')
    )
  );
```

**Customer App Access**:
- Customer app uses service role client (bypasses RLS)
- API routes validate customer_id matches authenticated user
- No direct database access from customer frontend

### API Security

**Authentication**:
```typescript
// Verify customer_id matches authenticated user
export async function GET(request, { params }) {
  const { customer_id } = await params;
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user || user.id !== customer_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Proceed with badge lookup
}
```

**Input Validation**:
```typescript
// Validate badge level
const VALID_LEVELS = ['bronze', 'silver', 'gold', 'platinum'];
if (!VALID_LEVELS.includes(badge_level)) {
  return NextResponse.json({ error: 'Invalid badge level' }, { status: 400 });
}

// Validate spend amount
if (spend_amount <= 0 || spend_amount > 1000000) {
  return NextResponse.json({ error: 'Invalid spend amount' }, { status: 400 });
}
```

**Rate Limiting** (optional enhancement):
```typescript
// Limit badge award requests to prevent abuse
const RATE_LIMIT = 10; // Max 10 badge awards per customer per hour

const recentAwards = await supabase
  .from('customer_badges')
  .select('id')
  .eq('customer_id', customer_id)
  .gte('awarded_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());

if (recentAwards.length >= RATE_LIMIT) {
  return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
}
```

### Data Privacy

**PII Handling**:
- Badge data contains customer_id (UUID) - not directly identifiable
- No customer names, emails, or phone numbers in badge records
- Venue names are public information (not PII)

**GDPR Compliance**:
- Customer account deletion cascades to badges (ON DELETE CASCADE)
- Badge data included in data export requests
- Badge data deleted on account deletion

**Data Retention**:
- Active badges: Retained indefinitely
- Inactive badges: Retained for historical analysis
- No automatic deletion of old badges

