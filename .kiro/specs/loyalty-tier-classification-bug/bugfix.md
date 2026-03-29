# Bugfix Requirements Document

## Introduction

A new customer connecting to a restaurant (e.g., "Popos Bar") is incorrectly shown two Bronze tier stars before placing any order. The loyalty tier classification logic in the customer app assigns a tier prematurely — either because the visits API returns hardcoded mock data, or because the tier classification thresholds do not enforce the minimum visit count and average spend requirements. The fix must ensure that no tier is displayed until a guest has 2 or more completed visits with a qualifying average spend at that specific venue, and that tier thresholds are read from the venue's configuration rather than hardcoded.

---

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a new customer connects to a venue for the first time with zero completed orders, THEN the system displays Bronze tier stars (two stars) in the loyalty icon area.

1.2 WHEN the customer app calls `/api/loyalty/visits/[customer_id]`, THEN the system returns hardcoded mock data (`totalVisits: 2`, `visitTier: 'bronze'`) regardless of the customer's actual visit history.

1.3 WHEN `loadLoyaltyData()` receives visit data, THEN the system classifies `weeklyVisits >= 1` as Bronze tier, meaning a single visit (or mock visit count) immediately triggers a tier assignment.

1.4 WHEN `loadLoyaltyData()` calculates the visit tier, THEN the system does not check whether the customer's average spend per visit meets or exceeds the venue's configured Bronze threshold (e.g., KES 3,000).

1.5 WHEN the visit tier is `silver` (weeklyVisits >= 2), THEN the system renders two tier icons, which is what a new customer sees due to the mock data returning `totalVisits: 2`.

1.6 WHEN the tier classification runs, THEN the system uses hardcoded spend thresholds (KES 3,000 / KES 5,000 / KES 15,000) rather than reading the Bronze, Silver, and Gold thresholds from the venue's configuration.

### Expected Behavior (Correct)

2.1 WHEN a new customer connects to a venue with zero completed visits, THEN the system SHALL display no tier icons and no tier badge.

2.2 WHEN a customer has exactly one completed visit at a venue regardless of spend amount, THEN the system SHALL display no tier icons and no tier badge.

2.3 WHEN the customer app calls `/api/loyalty/visits/[customer_id]`, THEN the system SHALL return the customer's actual visit history from the database, not hardcoded mock data.

2.4 WHEN `loadLoyaltyData()` evaluates tier eligibility, THEN the system SHALL require the customer to have 2 or more completed visits at the specific venue before any tier can be assigned.

2.5 WHEN a customer has 2 or more completed visits at a venue AND their average spend per visit is greater than or equal to the venue's configured Bronze threshold, THEN the system SHALL assign Bronze tier.

2.6 WHEN a customer has 2 or more completed visits at a venue AND their average spend per visit is below the venue's configured Bronze threshold, THEN the system SHALL display no tier icons and no tier badge.

2.7 WHEN the tier classification runs, THEN the system SHALL read the Bronze, Silver, and Gold spend thresholds from the venue's configuration (e.g., `bars` table or a venue settings record), not from hardcoded constants.

2.8 WHEN `renderLoyaltyIcons()` is called and the customer has no qualifying tier, THEN the system SHALL return null and render nothing.

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a customer has 2 or more completed visits at a venue AND their average spend meets or exceeds the venue's Bronze threshold, THEN the system SHALL CONTINUE TO display the correct number of Bronze tier icons.

3.2 WHEN a customer has 2 or more completed visits at a venue AND their average spend meets or exceeds the venue's Silver threshold, THEN the system SHALL CONTINUE TO display the correct number of Silver tier icons.

3.3 WHEN a customer has 2 or more completed visits at a venue AND their average spend meets or exceeds the venue's Gold threshold, THEN the system SHALL CONTINUE TO display the correct number of Gold tier icons.

3.4 WHEN the loyalty tier API call fails or returns an error, THEN the system SHALL CONTINUE TO display no tier icons and treat the customer as having no tier (graceful degradation).

3.5 WHEN the spend tier pricing layer (`spendTier` state used for menu price discounts) is evaluated, THEN the system SHALL CONTINUE TO operate independently of the visit tier display logic — the pricing layer is not affected by this fix.

3.6 WHEN a customer with an established tier connects to a venue they have visited before, THEN the system SHALL CONTINUE TO display their correct tier icons based on their actual visit and spend history.

3.7 WHEN the menu page loads all other sections (cart, payment, orders, messages, tab header, real-time subscriptions), THEN the system SHALL CONTINUE TO function without modification.

---

## Bug Condition

```pascal
FUNCTION isBugCondition(X)
  INPUT: X of type CustomerVenueContext
         where X.completedVisits = number of completed visits at the venue
         and   X.averageSpend    = average spend per visit at the venue
         and   X.bronzeThreshold = venue's configured Bronze spend threshold
  OUTPUT: boolean

  // Bug triggers when a tier is shown despite insufficient visits or spend
  RETURN X.completedVisits < 2
      OR (X.completedVisits >= 2 AND X.averageSpend < X.bronzeThreshold)
END FUNCTION
```

```pascal
// Property: Fix Checking — No tier shown for buggy inputs
FOR ALL X WHERE isBugCondition(X) DO
  result ← renderLoyaltyIcons'(X)
  ASSERT result = null  // no icons rendered
END FOR
```

```pascal
// Property: Preservation Checking — Tier display unchanged for qualifying guests
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT renderLoyaltyIcons(X) = renderLoyaltyIcons'(X)
END FOR
```
