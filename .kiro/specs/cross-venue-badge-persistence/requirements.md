# Requirements Document

## Introduction

The Cross-Venue Badge Persistence & Display System enables customers to earn badges at individual venues (using venue-specific thresholds) while ensuring those badges persist and display across ALL venues in the Tabeza ecosystem. The system tracks the highest badge earned globally and displays it everywhere, with visual multipliers for frequent visitors at specific venues.

This feature transforms the current stateless, session-only badge calculation into a persistent, cross-venue recognition system that rewards customer loyalty across the entire Tabeza network while maintaining venue-specific earning criteria.

## Glossary

- **Badge_System**: The global badge persistence and display mechanism
- **Customer_Badges_Table**: Database table storing all earned badges with metadata
- **Badge_Level**: One of four tiers: bronze, silver, gold, platinum
- **Earned_At_Bar**: The venue where a specific badge was earned
- **Global_Badge**: The highest badge level earned across all venues
- **Badge_Duplication**: Visual display of multiple badge icons based on visit frequency
- **Visit_Frequency_Window**: 2-week period for tracking visit frequency bonuses
- **Venue_Threshold**: Venue-specific spend requirements from bars table
- **System_Default_Threshold**: Fallback thresholds (Bronze: 3,000 | Silver: 10,000 | Gold: 25,000)
- **Badge_Upgrade**: Transition from lower to higher badge level
- **Active_Badge**: Current valid badge record (is_active = true)

## Requirements

### Requirement 1: Badge Earning at Venue-Specific Thresholds

**User Story:** As a customer, I want to earn badges when I meet a venue's custom spend thresholds, so that I am recognized according to each venue's standards.

#### Acceptance Criteria

1. WHEN a customer completes a payment, THE Badge_System SHALL calculate the customer's average spend at that venue
2. THE Badge_System SHALL retrieve venue-specific thresholds from the bars table (bronze_threshold, silver_threshold, gold_threshold)
3. IF venue thresholds are NULL, THEN THE Badge_System SHALL use System_Default_Threshold values
4. WHEN average spend meets or exceeds a threshold, THE Badge_System SHALL determine the appropriate Badge_Level
5. THE Badge_System SHALL compare the earned Badge_Level against the customer's current Global_Badge
6. IF the earned Badge_Level is higher than Global_Badge, THEN THE Badge_System SHALL trigger a badge upgrade

### Requirement 2: Badge Persistence in Database

**User Story:** As a customer, I want my earned badges to be permanently stored, so that my achievements are never lost.

#### Acceptance Criteria

1. WHEN a badge is earned, THE Badge_System SHALL write a record to Customer_Badges_Table
2. THE Badge_System SHALL store customer_id, badge_level, earned_at_bar_id, spend_amount_at_venue, and awarded_at timestamp
3. THE Badge_System SHALL set is_active to true for the new badge record
4. THE Badge_System SHALL ensure each customer has exactly one Active_Badge at any time
5. WHEN a badge upgrade occurs, THE Badge_System SHALL set is_active to false on the previous badge record before creating the new one

### Requirement 3: Cross-Venue Badge Display

**User Story:** As a customer who earned Silver at Popos, I want to see my Silver badge at ALL other venues I visit, so I feel recognized everywhere.

#### Acceptance Criteria

1. WHEN a customer opens a tab at any venue, THE Badge_System SHALL query Customer_Badges_Table for the highest Active_Badge
2. THE Badge_System SHALL display the Global_Badge regardless of which venue the customer is currently at
3. THE Badge_System SHALL display the Global_Badge even if the customer has never visited the current venue before
4. THE Badge_System SHALL NOT display multiple badge levels simultaneously
5. IF no Active_Badge exists, THEN THE Badge_System SHALL display no badge

### Requirement 4: Badge Upgrade Logic

**User Story:** As a customer who earned Gold at a different venue, I want my old Silver badge to be replaced with Gold everywhere, so my status is always current.

#### Acceptance Criteria

1. WHEN a customer earns a higher Badge_Level at any venue, THE Badge_System SHALL deactivate the previous Active_Badge
2. THE Badge_System SHALL create a new badge record with the higher Badge_Level
3. THE Badge_System SHALL set the new badge as Active_Badge
4. THE Badge_System SHALL trigger a congratulatory notification with the new Badge_Level and venue name
5. THE Badge_System SHALL ensure badge levels never downgrade

### Requirement 5: Badge Duplication for Visit Frequency

**User Story:** As a frequent visitor (3+ times/week), I want to see multiple badge icons for 2 weeks, so I feel rewarded for my loyalty.

#### Acceptance Criteria

1. WHEN a customer visits a venue 3 or more times in one week, THE Badge_System SHALL display multiple badge icons
2. THE Badge_System SHALL calculate icon count based on visit frequency at the current venue
3. THE Badge_System SHALL maintain Badge_Duplication for 2 weeks from the date of the 3rd visit
4. IF the customer does not visit the venue at all during the Visit_Frequency_Window, THEN THE Badge_System SHALL reduce display to single icon
5. THE Badge_System SHALL apply Badge_Duplication as a visual effect only, not affecting discount calculation

### Requirement 6: Badge Upgrade Notifications

**User Story:** As a customer, I want to receive a congratulatory notification when I earn or upgrade my badge, so I know my achievement is recognized.

#### Acceptance Criteria

1. WHEN a badge upgrade occurs, THE Badge_System SHALL display a toast notification
2. THE notification SHALL include the new Badge_Level and the venue name where it was earned
3. THE notification SHALL use the format: "Congratulations! You've earned [Tier] status at [Venue Name]"
4. IF notification preferences include sound_enabled, THEN THE Badge_System SHALL play the acceptance sound
5. IF notification preferences include vibration_enabled, THEN THE Badge_System SHALL trigger vibration pattern [200, 100, 200, 100, 200]

### Requirement 7: Integration with Existing Discount System

**User Story:** As a customer, I want my badge tier to determine my discount percentage, so I receive the correct pricing.

#### Acceptance Criteria

1. THE Badge_System SHALL provide the Global_Badge level to the discount calculation system
2. THE discount system SHALL retrieve the discount percentage for the Global_Badge from venue_discount_settings
3. THE discount system SHALL calculate visit frequency bonus separately from badge tier
4. THE discount system SHALL apply the formula: displayPrice = basePrice × (1 - (badgePct + visitBonusPct) / 100)
5. THE Badge_System SHALL ensure discount calculation remains unchanged from current implementation

### Requirement 8: Badge Recalculation After Payment

**User Story:** As a customer, I want my badge tier to update immediately after payment, so I see my new status right away.

#### Acceptance Criteria

1. WHEN a payment is completed, THE Badge_System SHALL trigger badge recalculation
2. THE Badge_System SHALL fetch updated visit data and average spend
3. THE Badge_System SHALL compare new spend against venue thresholds
4. IF a badge upgrade is detected, THEN THE Badge_System SHALL persist the new badge and display notification
5. THE Badge_System SHALL refresh menu prices automatically via existing spendTier state update

### Requirement 9: Parser and Serializer Requirements

**User Story:** As a developer, I want to ensure badge data is correctly parsed and serialized, so data integrity is maintained.

#### Acceptance Criteria

1. THE Badge_System SHALL parse badge records from Customer_Badges_Table into Badge objects
2. THE Badge_System SHALL serialize Badge objects when writing to Customer_Badges_Table
3. THE Badge_System SHALL validate all required fields (customer_id, badge_level, earned_at_bar_id, spend_amount_at_venue) before writing
4. FOR ALL valid Badge objects, parsing then serializing then parsing SHALL produce an equivalent object (round-trip property)
5. WHEN invalid badge data is encountered, THE Badge_System SHALL return a descriptive error

### Requirement 10: Badge Query Performance

**User Story:** As a customer, I want badge lookups to be fast, so my experience is not delayed.

#### Acceptance Criteria

1. THE Badge_System SHALL query Customer_Badges_Table with an index on (customer_id, is_active)
2. THE Badge_System SHALL retrieve the highest Active_Badge in a single query
3. THE Badge_System SHALL cache badge data in React state to avoid redundant queries
4. THE Badge_System SHALL refresh badge data only after payment completion or tab opening
5. THE Badge_System SHALL complete badge lookup in under 100ms for 95% of requests
