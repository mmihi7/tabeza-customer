# Bugfix Requirements Document

## Introduction

The Tabeza loyalty system fails to award badges and apply discounts to customers after payment completion. When a customer pays their tab in full (e.g., KES 5,480 exceeding the Bronze threshold of KES 3,000), the system does not:
1. Send a badge upgrade notification to the customer
2. Update the customer's badge tier in real-time
3. Apply the venue's configured discount percentages to menu prices

This breaks the core loyalty value proposition — customers earn badges through spend but receive no recognition or benefit. The issue affects both the customer app (menu pricing and notifications) and potentially the backend badge calculation logic.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a customer completes payment that brings their total spend at a venue to KES 3,000 or more in a single tab session THEN the system does not send a badge upgrade notification to the customer app

1.2 WHEN a customer's spend crosses a badge threshold (Bronze: KES 3,000, Silver: KES 10,000, Gold: KES 25,000) THEN the customer app menu does not refresh to show discounted prices based on the newly earned badge

1.3 WHEN the customer app loads the menu page after payment completion THEN menu prices display at full base price without applying the venue's configured badge discount percentage

1.4 WHEN the badge tier calculation endpoint `/api/loyalty/visits/[customer_id]?bar_id=` is called after payment THEN it may not reflect the updated spend total from the completed payment

1.5 WHEN venue discount settings exist in `venue_discount_settings` table THEN the customer app may not fetch or apply these settings to the discount formula `displayPrice = basePrice × (1 - (badgePct + visitBonusPct) / 100)`

### Expected Behavior (Correct)

2.1 WHEN a customer completes payment that brings their total spend at a venue to KES 3,000 or more in a single tab session THEN the system SHALL send a real-time notification to the customer app indicating the badge tier earned (e.g., "Congratulations! You've earned Bronze status at [Venue Name]")

2.2 WHEN a customer's spend crosses a badge threshold THEN the customer app SHALL immediately refresh the loyalty data and recalculate menu prices with the appropriate discount percentage

2.3 WHEN the customer app loads the menu page after payment completion THEN menu prices SHALL display the discounted price calculated as `displayPrice = basePrice × (1 - (badgePct + visitBonusPct) / 100)` where badgePct is the venue's configured percentage for the customer's badge tier

2.4 WHEN the badge tier calculation endpoint `/api/loyalty/visits/[customer_id]?bar_id=` is called after payment THEN it SHALL return the updated `averageSpend` value that includes the completed payment amount

2.5 WHEN venue discount settings exist in `venue_discount_settings` table for a bar THEN the customer app SHALL fetch these settings via `/api/loyalty/venue-discounts/[bar_id]` and apply them to all menu item prices

2.6 WHEN a payment is recorded in the `tab_payments` table with status 'completed' THEN the system SHALL trigger a badge tier recalculation for that customer at that venue

2.7 WHEN the menu header renders loyalty icons THEN it SHALL display the correct badge count (visit frequency) and badge shape (spend tier) based on the customer's current tier at that venue

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a customer has not yet reached the Bronze threshold (spend < KES 3,000) THEN the system SHALL CONTINUE TO display menu prices at full base price with no discount applied

3.2 WHEN a customer views the menu at a venue where they have not previously visited THEN the system SHALL CONTINUE TO show no badge icons in the menu header

3.3 WHEN venue discount settings do not exist in `venue_discount_settings` for a bar THEN the system SHALL CONTINUE TO fall back to default discount percentages (Bronze: 1.5%, Silver: 3%, Gold: 5%)

3.4 WHEN a customer makes a partial payment that does not complete the tab THEN the system SHALL CONTINUE TO not award a badge until the tab is fully paid

3.5 WHEN the customer app displays the spend prompt after an order is accepted THEN the system SHALL CONTINUE TO show contextual messaging about how much more to spend to reach the next tier

3.6 WHEN a customer already has a Gold badge at a venue THEN the system SHALL CONTINUE TO not send upgrade notifications (already at maximum tier)

3.7 WHEN the badge tier calculation runs for a customer with multiple completed tabs at a venue THEN the system SHALL CONTINUE TO calculate `averageSpend` correctly across all completed tabs

3.8 WHEN the discount formula is applied to menu items THEN the system SHALL CONTINUE TO round the final price to the nearest whole KES value using `Math.round()`
