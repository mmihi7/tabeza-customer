# Requirements Document

## Introduction

The onboarding consent flow covers two distinct journeys in the Tabeza Customer app:

**Flow A — New User Signup (5 steps):** A first-time user creates an account, verifies their
email, gives one-time consent to Tabeza's data practices, and then connects to their first
venue. Consent is collected exactly once during account creation and is never re-asked on
subsequent venue connections.

**Flow B — Returning User Connecting (4 steps):** An authenticated user opens the app, sees
their home screen, chooses how to appear at a venue, reviews a confirm screen (which includes
a privacy promise strip but does NOT re-ask for consent), and lands on an active tab screen.

Both flows use the existing Tabeza dark/amber design system (`globals.css`, `tailwind.config.js`)
and the real Tabeza SVG logo from `public/logo.svg`. The `Logo` component at
`components/Logo.tsx` must be updated to render the SVG mark rather than the current plain
orange box with a "T".

---

## Glossary

- **Signup_Flow**: The 5-step sequence (Account → Profile → Verify → Consent → Connect) that
  a new user completes to create an account and connect to their first venue.
- **Connect_Flow**: The 4-step sequence (Home → Identity → Confirm → Tab_Open) that a
  returning authenticated user follows to open a tab at a venue.
- **Account_Step**: Step 1 of the Signup_Flow — email and password entry with social sign-up
  options.
- **Profile_Step**: Step 2 of the Signup_Flow — first name, optional last name, optional
  mobile number.
- **Verify_Step**: Step 3 of the Signup_Flow — email verification gate.
- **Consent_Step**: Step 4 of the Signup_Flow — one-time data consent screen shown only
  during account creation.
- **Connect_Step**: Step 5 of the Signup_Flow — venue connection via QR scan or code entry.
- **Home_Screen**: Step 1 of the Connect_Flow — the authenticated user's home view showing
  their avatar, tier badge, recent venues, and a motivational message.
- **Identity_Step**: Step 2 of the Connect_Flow — the user chooses how to appear at the
  selected venue (named, nickname, or anonymous).
- **Confirm_Step**: Step 3 of the Connect_Flow — a summary screen showing venue details,
  spend tier breakdown, identity selection, and a privacy promise strip.
- **Tab_Open_Screen**: Step 4 of the Connect_Flow — confirmation that the tab is active,
  showing tab ID, venue, identity, spend tier, and payment method.
- **Privacy_Promise_Strip**: The amber-tinted banner stating "Your data is never sold",
  shown on the Confirm_Step.
- **Consent_Record**: A persisted database record capturing the user's one-time consent
  decision, timestamp, and app version.
- **Tier_Badge**: A visual indicator showing the user's loyalty tier (Bronze, Silver, Gold)
  for a given venue.
- **Visit_Frequency_Dots**: A row of dots representing the user's recent visit cadence at a
  venue (e.g., one dot per visit in the past week).
- **Spend_Tier_Breakdown**: A visual display of the Bronze/Silver/Gold spend thresholds with
  a "You are here" marker at the user's current tier.
- **Design_System**: The amber/dark token set defined in `globals.css` and `tailwind.config.js`
  (`--amber`, `--ink`, `--cream`, `--success`, Cormorant Garamond, DM Mono, Lato, etc.).
- **Logo_Component**: The React component at `components/Logo.tsx` that renders the Tabeza
  brand mark.
- **SVG_Logo**: The real Tabeza SVG brand mark located at `public/logo.svg`.

---

## Requirements

### Requirement 1: Logo Component — Use Real SVG Mark

**User Story:** As a user, I want to see the real Tabeza logo throughout the app, so that the
brand identity is consistent and professional.

#### Acceptance Criteria

1. THE Logo_Component SHALL render the SVG_Logo from `public/logo.svg` as an `<Image>` or
   inline `<svg>` element instead of the current plain orange box with a "T".
2. THE Logo_Component SHALL accept a `size` prop (`sm` | `md` | `lg`) that scales the
   SVG_Logo proportionally.
3. THE Logo_Component SHALL accept a `className` prop for layout overrides.
4. IF the SVG_Logo fails to load, THEN THE Logo_Component SHALL render a fallback that
   preserves the layout space without breaking the page.
5. THE Logo_Component SHALL NOT render the plain orange box or the letter "T" as the primary
   brand mark.

---

### Requirement 2: Signup Flow — Step 1 (Account)

**User Story:** As a new user, I want to create an account with my email and password, so that
I can access Tabeza's loyalty features.

#### Acceptance Criteria

1. THE Account_Step SHALL display an email input field and a password input field.
2. THE Account_Step SHALL display a section labelled "or sign up with" containing buttons for
   Phone, Google, and Apple sign-up, each marked as "coming soon" and rendered in a disabled
   state.
3. WHEN the user submits the Account_Step form, THE Signup_Flow SHALL validate that the email
   is a valid format and the password meets the minimum length requirement of 6 characters.
4. IF the email is already registered, THEN THE Account_Step SHALL display an inline error
   message directing the user to sign in instead.
5. WHEN the Account_Step form is successfully submitted, THE Signup_Flow SHALL advance to the
   Profile_Step.
6. THE Account_Step SHALL use the Design_System tokens: `--ink` background, `--cream` text,
   `--amber` focus states, and Lato for all form labels and inputs.

---

### Requirement 3: Signup Flow — Step 2 (Profile)

**User Story:** As a new user, I want to provide my name and optional mobile number, so that
Tabeza can personalise my experience and enable M-Pesa payments.

#### Acceptance Criteria

1. THE Profile_Step SHALL display a first name input field marked as required.
2. THE Profile_Step SHALL display a last name input field marked as optional.
3. THE Profile_Step SHALL display a mobile number input field marked as optional, with a
   label indicating it is used for M-Pesa payments.
4. WHEN the user submits the Profile_Step without a first name, THE Profile_Step SHALL display
   an inline validation error and SHALL NOT advance to the next step.
5. WHEN the Profile_Step form is successfully submitted, THE Signup_Flow SHALL advance to the
   Verify_Step.

---

### Requirement 4: Signup Flow — Step 3 (Verify)

**User Story:** As a new user, I want to verify my email address, so that my account is
secured and confirmed.

#### Acceptance Criteria

1. WHEN the Verify_Step is displayed, THE Signup_Flow SHALL show a message confirming that a
   verification link has been sent to the user's email address.
2. THE Verify_Step SHALL display the user's email address (partially masked) so the user can
   confirm the correct address was used.
3. THE Verify_Step SHALL display a "Resend email" action that the user can activate if the
   email does not arrive.
4. WHEN the user clicks the verification link in their email, THE Signup_Flow SHALL advance
   to the Consent_Step.
5. WHILE the Verify_Step is displayed, THE Signup_Flow SHALL NOT advance to the Consent_Step
   without a confirmed email verification.

---

### Requirement 5: Signup Flow — Step 4 (Consent) — One-Time Only

**User Story:** As a new user, I want to understand what data Tabeza collects and give my
informed consent once during account creation, so that I am in control of my data before
using the loyalty features.

#### Acceptance Criteria

1. THE Consent_Step SHALL be displayed exactly once per user account, during the Signup_Flow,
   after email verification is confirmed.
2. THE Consent_Step SHALL NOT be shown to returning authenticated users during the
   Connect_Flow or on any subsequent venue connection.
3. THE Consent_Step SHALL display a list of what Tabeza collects, covering exactly three
   categories: visits, spend, and orders/payments — each with a plain-language description
   of the benefit to the user.
4. THE Consent_Step SHALL display the Privacy_Promise_Strip with the statement "Your data is
   never sold to third parties".
5. THE Consent_Step SHALL display a tappable link to `/terms` labelled "Terms of Service" and
   a tappable link to `/privacy` labelled "Privacy Policy", each opening in a new browser tab.
6. THE Consent_Step SHALL display a primary CTA labelled "I agree — let's go →".
7. THE Consent_Step SHALL display a secondary CTA labelled "Not now".
8. WHEN the user taps "I agree — let's go →", THE Signup_Flow SHALL persist a Consent_Record
   with `decision = 'agreed'`, the current ISO 8601 timestamp, and the app version, then
   advance to the Connect_Step.
9. WHEN the user taps "Not now", THE Signup_Flow SHALL persist a Consent_Record with
   `decision = 'skipped'` and advance to the Connect_Step, creating the account but
   disabling loyalty features until consent is later granted.
10. THE Consent_Step SHALL NOT use the words "track", "monitor", "surveillance", "points",
    or "earn" in any visible label or description.
11. THE secondary CTA SHALL be visually subordinate to the primary CTA (smaller, lower
    contrast) so that it does not compete for attention.

---

### Requirement 6: Signup Flow — Step 5 (Connect)

**User Story:** As a new user who has completed consent, I want to connect to my first venue,
so that I can open a tab and start using Tabeza.

#### Acceptance Criteria

1. THE Connect_Step SHALL display two options for connecting to a venue: "Scan QR code" and
   "Enter venue code".
2. WHEN the user selects "Scan QR code", THE Connect_Step SHALL activate the device camera
   to scan a venue QR code.
3. WHEN the user selects "Enter venue code", THE Connect_Step SHALL display a text input for
   manual code entry.
4. WHEN a valid venue code or QR scan is processed, THE Connect_Step SHALL transition the
   user into the Connect_Flow at the Identity_Step for that venue.
5. IF an invalid or unrecognised code is entered, THEN THE Connect_Step SHALL display an
   inline error message and SHALL NOT navigate away.

---

### Requirement 7: Connect Flow — Step 1 (Home Screen)

**User Story:** As a returning user, I want to see my loyalty status and recent venues when I
open the app, so that I can quickly connect to a venue.

#### Acceptance Criteria

1. THE Home_Screen SHALL display the user's avatar using their initials if no profile photo
   is set.
2. THE Home_Screen SHALL display the user's overall Tier_Badge (Bronze, Silver, or Gold).
3. THE Home_Screen SHALL display a list of recently visited venues, each showing the venue
   name, the user's Tier_Badge for that venue, and Visit_Frequency_Dots.
4. EACH venue in the recent venues list SHALL be tappable. WHEN the user taps a recent venue,
   THE Connect_Flow SHALL advance directly to the Identity_Step for that venue, bypassing QR
   scanning or code entry entirely.
5. THE Home_Screen SHALL display a motivational message in place of any spend amount. The
   message SHALL be a short, encouraging copy such as "Visit and spend more to pay less and
   get freebies." THE Home_Screen SHALL NOT display a specific spend figure (e.g., "KES 4,200
   this week").
6. THE Home_Screen SHALL display a primary CTA labelled "Scan QR / enter code →" for
   connecting to a venue not in the recent list.
7. WHEN the user taps "Scan QR / enter code →", THE Connect_Flow SHALL advance to the
   Identity_Step after a venue is identified via scan or manual code entry.

---

### Requirement 8: Connect Flow — Step 2 (Identity)

**User Story:** As a returning user connecting to a venue, I want to choose how I appear to
the venue, so that I can control my privacy at each visit.

#### Acceptance Criteria

1. THE Identity_Step SHALL display the heading "How do you want to appear?" followed by the
   venue name.
2. THE Identity_Step SHALL present exactly three identity options: "As yourself" (using the
   user's registered name), "Use a nickname" (with a text input for the nickname), and "Stay
   anonymous".
3. WHEN the user selects "Stay anonymous", THE Identity_Step SHALL display a warning that
   anonymous visits do not count toward their loyalty tier.
4. WHEN the user selects "Use a nickname", THE Identity_Step SHALL display a text input
   field for entering the nickname, with a maximum length of 30 characters.
5. WHEN the user confirms their identity selection, THE Connect_Flow SHALL advance to the
   Confirm_Step, carrying the selected identity forward.

---

### Requirement 9: Connect Flow — Step 3 (Confirm)

**User Story:** As a returning user, I want to review my venue connection details before
opening my tab, so that I can confirm everything is correct.

#### Acceptance Criteria

1. THE Confirm_Step SHALL display a venue card showing the venue name and category.
2. THE Confirm_Step SHALL display the Spend_Tier_Breakdown showing Bronze, Silver, and Gold
   thresholds with a "You are here" marker at the user's current tier for that venue.
3. THE Confirm_Step SHALL display the Visit_Frequency_Dots for the user's recent visit
   cadence at that venue.
4. THE Confirm_Step SHALL display the identity selection made in the Identity_Step.
5. THE Confirm_Step SHALL display the Privacy_Promise_Strip with the statement "Your data is
   never sold to third parties".
6. THE Confirm_Step SHALL NOT re-display the consent form or ask the user to agree to terms
   again.
7. THE Confirm_Step SHALL display a primary CTA labelled "Open my tab".
8. THE Confirm_Step SHALL display a secondary CTA labelled "Choose a different venue" that
   navigates the user back to the Home_Screen (step 1 of the Connect_Flow).
9. THE Confirm_Step SHALL NOT display a "pay at the bar" option or any CTA that bypasses tab
   creation.
10. WHEN the user taps "Open my tab", THE Connect_Flow SHALL create the tab and advance to
    the Tab_Open_Screen.

---

### Requirement 10: Connect Flow — Step 4 (Tab Open)

**User Story:** As a returning user who has confirmed their connection, I want immediate
confirmation that my tab is open, so that I can start ordering.

#### Acceptance Criteria

1. THE Tab_Open_Screen SHALL display a confirmation that the tab is active, including the
   tab ID, venue name, the identity the user is appearing as, their current spend tier, and
   the payment method on file.
2. THE Tab_Open_Screen SHALL display a "View menu" button that navigates the user to the
   venue's menu.
3. WHEN the Tab_Open_Screen is displayed, THE Connect_Flow SHALL use a `fadeIn` entrance
   animation consistent with the Design_System animation tokens.
4. THE Tab_Open_Screen SHALL use the `--success` colour token for the confirmation indicator.

---

### Requirement 11: Design System Compliance

**User Story:** As a designer, I want all onboarding and connect screens to use the existing
Tabeza dark/amber design tokens, so that the experience is visually consistent with the rest
of the app.

#### Acceptance Criteria

1. ALL screens in the Signup_Flow and Connect_Flow SHALL use `--ink` (`#0C0907`) as the
   primary background colour.
2. ALL screens SHALL use `--amber` (`#C8861A`) and `--amber-soft` (`#E8A840`) for interactive
   elements, focus states, and accent borders.
3. ALL screens SHALL use `--cream` (`#F0E8D8`) for primary body text.
4. ALL screens SHALL use `--muted` (`#7A6A54`) for secondary and descriptive text.
5. ALL screens SHALL use Cormorant Garamond for main headings.
6. ALL screens SHALL use DM Mono for section labels, step indicators, and tag-style elements.
7. ALL screens SHALL use Lato for body copy, form labels, and CTA labels.
8. THE Privacy_Promise_Strip SHALL use the `--amber-pale` background and `--amber-border`
   tokens to remain visually distinct from surrounding content.
9. WHERE the user has enabled `prefers-reduced-motion`, ALL screens SHALL suppress all
   non-essential animations per the existing `globals.css` rule.
10. THE Tier_Badge SHALL use the `badge-bronze`, `badge-silver`, or `badge-gold` CSS classes
    defined in the Design_System.

---

### Requirement 12: Consent Persistence and Idempotency

**User Story:** As a product owner, I want every consent decision to be stored with a
timestamp, so that we have an auditable record for compliance purposes.

#### Acceptance Criteria

1. THE Consent_Step SHALL persist a Consent_Record to the database before advancing to the
   Connect_Step.
2. EACH Consent_Record SHALL include: `user_id`, `decision` ('agreed' | 'skipped'),
   `consented_at` (ISO 8601 timestamp), and `app_version`.
3. IF persisting the Consent_Record fails, THEN THE Consent_Step SHALL display an inline
   error and SHALL NOT advance to the Connect_Step.
4. THE Consent_Step SHALL be idempotent: if a Consent_Record for the same `user_id` already
   exists, THE Consent_Step SHALL update the existing record rather than inserting a
   duplicate.
5. THE Signup_Flow SHALL check for an existing Consent_Record on load; if one exists for the
   current `user_id`, THE Signup_Flow SHALL skip the Consent_Step entirely and proceed
   directly to the Connect_Step.

---

### Requirement 13: Consent Withdrawal

**User Story:** As a customer, I want to be able to withdraw my consent at any time from my
account settings, so that I remain in control of my data.

#### Acceptance Criteria

1. THE Withdrawal_UI SHALL be accessible from the account settings screen.
2. WHEN a user activates the Withdrawal_UI, THE Withdrawal_UI SHALL display a plain-language
   explanation of what withdrawing consent means (e.g., personalised pricing and offers will
   no longer apply).
3. WHEN a user confirms withdrawal, THE Withdrawal_UI SHALL update the Consent_Record for
   that user to `decision = 'withdrawn'` and record a `withdrawn_at` timestamp.
4. WHEN consent is withdrawn, THE Signup_Flow SHALL present the Consent_Step again on the
   user's next app session, treating it as a first-time consent.
5. THE Withdrawal_UI SHALL NOT delete any historical visit or spend data; it SHALL only
   affect future personalisation and loyalty feature access.
