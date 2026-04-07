# Bugfix Requirements Document

## Introduction

The settings page (`tabeza-staff/app/settings/page.tsx`) has styling inconsistencies that make it difficult to read and use. Input fields display white text on light backgrounds, creating poor contrast. The page does not follow the established design system defined in `staff-ui-design-system.md`, with the Loyalty Centre page (`app/loyalty-centre/page.tsx`) serving as the canonical reference implementation.

This bugfix ensures all settings tabs (General, Venue, Payments, Notifications, Operations, Roles) follow the same design patterns as the Loyalty Centre, providing consistent, readable styling across the entire staff application.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN viewing input fields across all settings tabs THEN the system displays white text on light backgrounds creating unreadable contrast

1.2 WHEN viewing the settings page THEN the system uses inconsistent color values instead of design system tokens (hardcoded colors like `bg-white`, `text-gray-800`, `bg-gray-50`)

1.3 WHEN viewing cards and panels THEN the system uses incorrect background colors (`bg-white`) instead of the design system card pattern (`rgba(255,255,255,0.04)` with `rgba(255,255,255,0.08)` border)

1.4 WHEN viewing text labels THEN the system uses gray colors (`text-gray-700`, `text-gray-500`) instead of design system tokens (`var(--amber)` for labels, `var(--muted)` for helper text)

1.5 WHEN viewing input fields THEN the system uses incorrect styling (`bg-gray-50`, hardcoded borders) instead of design system input pattern (`rgba(255,255,255,0.07)` background, `rgba(255,255,255,0.15)` border, `var(--cream)` text)

1.6 WHEN viewing buttons THEN the system uses inconsistent button styles (`bg-green-500`, `bg-gray-200`) instead of design system button patterns

1.7 WHEN viewing the page background THEN the system uses `bg-gray-50` instead of `var(--ink)` (#1a1a2e)

1.8 WHEN viewing section headings THEN the system uses regular text styling instead of design system section heading pattern (uppercase, `var(--amber)`, letter-spacing 0.06em)

1.9 WHEN viewing the tab navigation THEN the system uses hardcoded colors and inconsistent styling instead of the design system tab navigation pattern

1.10 WHEN viewing form elements across tabs THEN the system displays inconsistent styling that doesn't match the Loyalty Centre reference implementation

### Expected Behavior (Correct)

2.1 WHEN viewing input fields across all settings tabs THEN the system SHALL display cream-colored text (`var(--cream)`) on dark semi-transparent backgrounds (`rgba(255,255,255,0.07)`) with proper contrast

2.2 WHEN viewing the settings page THEN the system SHALL use design system color tokens exclusively via `var()` syntax, never hardcoded hex or Tailwind color classes

2.3 WHEN viewing cards and panels THEN the system SHALL use the standard card pattern: `background-color: rgba(255,255,255,0.04)`, `border: 1px solid rgba(255,255,255,0.08)`, `border-radius: 0.75rem`, `padding: 1.25rem`

2.4 WHEN viewing text labels THEN the system SHALL use `var(--amber)` for field labels (uppercase, 0.75rem, font-weight 600) and `var(--muted)` for helper text

2.5 WHEN viewing input fields THEN the system SHALL use the design system input pattern: `background-color: rgba(255,255,255,0.07)`, `border: 1px solid rgba(255,255,255,0.15)`, `color: var(--cream)`, `border-radius: 0.5rem`

2.6 WHEN viewing buttons THEN the system SHALL use design system button patterns: primary buttons with `var(--amber)` background and `var(--ink)` text, secondary buttons with `rgba(255,255,255,0.07)` background

2.7 WHEN viewing the page background THEN the system SHALL use `var(--ink)` for the page wrapper background

2.8 WHEN viewing section headings THEN the system SHALL use the design system section heading pattern: `font-size: 0.8rem`, `font-weight: 600`, `text-transform: uppercase`, `letter-spacing: 0.06em`, `color: var(--amber)`

2.9 WHEN viewing the tab navigation THEN the system SHALL use the design system tab navigation pattern with `var(--border)` bottom border, `var(--amber)` for active tabs, and `var(--muted)` for inactive tabs

2.10 WHEN viewing form elements across all tabs (General, Venue, Payments, Notifications, Operations, Roles) THEN the system SHALL display consistent styling matching the Loyalty Centre reference implementation

### Unchanged Behavior (Regression Prevention)

3.1 WHEN interacting with form inputs THEN the system SHALL CONTINUE TO save and load data correctly without any functional changes

3.2 WHEN navigating between tabs THEN the system SHALL CONTINUE TO maintain tab state and display the correct content

3.3 WHEN submitting forms THEN the system SHALL CONTINUE TO validate and process data as before

3.4 WHEN viewing the settings page on different screen sizes THEN the system SHALL CONTINUE TO be responsive and maintain layout structure

3.5 WHEN using edit mode for restaurant information THEN the system SHALL CONTINUE TO toggle between view and edit states correctly

3.6 WHEN viewing QR codes THEN the system SHALL CONTINUE TO generate and display QR codes correctly

3.7 WHEN configuring M-Pesa settings THEN the system SHALL CONTINUE TO save encrypted credentials and test connections

3.8 WHEN managing roles and permissions (admin only) THEN the system SHALL CONTINUE TO load and display role data correctly

3.9 WHEN using the printer status section THEN the system SHALL CONTINUE TO check and display printer service status

3.10 WHEN saving any settings THEN the system SHALL CONTINUE TO persist changes to the database and show appropriate success/error messages
