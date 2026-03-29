# Bugfix Requirements Document

## Introduction

Returning customers with overdue tabs are being silently redirected to the menu page without any path to resolve their outstanding balance. This happens in two entry points: `app/page.tsx` (QR/slug connection flow) and `app/start/page.tsx` (consent/onboarding flow). Both detect an existing open-or-overdue tab and immediately redirect to `/menu`, treating overdue tabs identically to open tabs. The fix must give overdue-tab customers a clear resolution path — either a direct M-Pesa payment modal (outside business hours) or a choice between reopening the tab to continue ordering or paying via M-Pesa (during business hours) — so they are never blocked from clearing their balance.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a returning customer with an overdue tab scans a QR code or enters a bar slug THEN the system redirects them directly to `/menu` without detecting the overdue status

1.2 WHEN a returning customer with an overdue tab is redirected to `/menu` THEN the system displays the menu as if the tab were open, providing no payment prompt and no indication that the balance is overdue

1.3 WHEN a returning customer with an overdue tab arrives via the consent/start page THEN the system bypasses the business hours check and redirects to `/menu` without surfacing the overdue balance

1.4 WHEN a returning customer with an overdue tab is on the menu page THEN the system does not present an M-Pesa payment modal or reopen the tab, leaving the customer with no actionable path to clear their balance

### Expected Behavior (Correct)

2.1 WHEN a returning customer with an overdue tab connects to a venue outside business hours THEN the system SHALL detect the overdue status and present an M-Pesa payment modal so the customer can pay their outstanding balance directly

2.2 WHEN a returning customer with an overdue tab connects to a venue during business hours THEN the system SHALL detect the overdue status and present a resolution modal offering two options: (a) reopen the tab to "Open" status and continue to `/menu`, or (b) pay the outstanding balance via M-Pesa

2.2.1 WHEN the customer selects "Reopen Tab" from the resolution modal during business hours THEN the system SHALL update the tab status to "Open", store the updated tab data, and redirect the customer to `/menu`

2.2.2 WHEN the customer selects "Pay Now" from the resolution modal during business hours THEN the system SHALL present the M-Pesa payment modal with the outstanding balance amount

2.3 WHEN the M-Pesa payment modal is presented to an overdue-tab customer THEN the system SHALL display the outstanding balance amount and allow the customer to initiate an M-Pesa STK push payment

2.4 WHEN an overdue-tab customer successfully completes payment via the M-Pesa modal THEN the system SHALL update the tab status to "closed" and redirect the customer to a confirmation screen or home page

2.5 WHEN an overdue tab is reopened to "Open" status during business hours THEN the system SHALL store the updated tab data and redirect the customer to `/menu` as a normal open-tab customer

2.6 WHEN the resolution modal is presented during business hours THEN the system SHALL display the outstanding balance amount alongside both options so the customer can make an informed choice

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a returning customer with an open (non-overdue) tab connects to a venue THEN the system SHALL CONTINUE TO redirect them directly to `/menu` without interruption

3.2 WHEN a new customer (no existing tab) connects to a venue outside business hours THEN the system SHALL CONTINUE TO show the "Bar Closed" slide-in and block new tab creation

3.3 WHEN a new customer (no existing tab) connects to a venue during business hours THEN the system SHALL CONTINUE TO show the consent/onboarding form for new tab creation

3.4 WHEN a customer with an open tab is on the menu page THEN the system SHALL CONTINUE TO function normally with no payment modal or status change

3.5 WHEN an overdue-tab customer initiates payment and the M-Pesa STK push fails THEN the system SHALL CONTINUE TO display the payment modal with an appropriate error message, allowing retry

3.6 WHEN the business hours check fails due to an error THEN the system SHALL CONTINUE TO default to treating the venue as open (existing safe-default behavior)
