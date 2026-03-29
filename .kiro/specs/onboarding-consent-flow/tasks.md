# Implementation Plan: Onboarding & Consent Flow

## Overview

Implement two multi-step wizards using the existing dark/amber design system. Flow A refactors
`app/signup/page.tsx` into a 5-step wizard (Account → Profile → Verify → Consent → Connect).
Flow B extends `app/start/page.tsx` with a step state machine around the existing
`ConsentContent` logic (Home → Identity → Confirm → Tab Open). All existing functions in
`app/start/page.tsx` are preserved intact.

---

## Tasks

- [x] 1. Foundation — Logo, shared sub-components, DB migration
  - [x] 1.1 Update `components/Logo.tsx` to render `public/logo.svg` via `next/image`
    - Replace the orange-box-with-T with `<Image src="/logo.svg" alt="Tabeza" width={px} height={px} priority />`
    - Size map: `sm` → 24 px, `md` → 32 px, `lg` → 48 px
    - Forward `className` to the wrapping `<span>`
    - Add `onError` handler that swaps `src` to a transparent 1×1 GIF data URI
    - Keep the existing `LogoProps` interface (`size`, `className`) — do not change the public API
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ]* 1.2 Write property tests for Logo component
    - **Property 1: Logo renders SVG, not the orange box** — for each size in `{sm, md, lg}`, rendered output contains `<img src="/logo.svg">` and no orange-box class or "T" text
    - **Property 2: Logo size prop scales proportionally** — for each size, `width` and `height` attributes equal the size-map values (24, 32, 48)
    - **Validates: Requirements 1.1, 1.2, 1.5**
    - Test file: `__tests__/components/Logo.test.tsx`

  - [x] 1.3 Create shared sub-components in `components/onboarding/`
    - `PrivacyPromiseStrip.tsx` — amber-tinted banner using `--amber-pale` bg and `--amber-border` border; copy: "Your data is never sold to third parties"
    - `TierBadge.tsx` — renders `badge-bronze`, `badge-silver`, or `badge-gold` CSS class based on a `tier: 'bronze' | 'silver' | 'gold'` prop
    - `VisitFrequencyDots.tsx` — row of dots; filled dots for visits in the past 7 days, empty dots for remaining slots up to a `max` prop
    - `SpendTierBreakdown.tsx` — three-column Bronze/Silver/Gold display with KES thresholds and a "You are here" marker at the user's current tier
    - `StepDots.tsx` — row of `total` dots; active dot uses `--amber`, completed dots use `--amber-border`, future dots use `--muted2`; used by SignupWizard only
    - All components use Design_System tokens exclusively — no plain white, no orange gradient
    - _Requirements: 7.2, 7.3, 9.2, 9.3, 11.1–11.10_

  - [ ]* 1.4 Write unit tests for shared sub-components
    - `PrivacyPromiseStrip`: renders correct copy, has `--amber-pale` background class
    - `TierBadge`: renders correct CSS class for each tier value
    - `StepDots`: active dot has amber class, completed dots have amber-border class
    - Test file: `__tests__/components/onboarding/PrivacyPromiseStrip.test.tsx`, `TierBadge.test.tsx`

  - [x] 1.5 Create Supabase migration for `consent_records` table
    - File: `supabase/migrations/<timestamp>_create_consent_records.sql`
    - Schema: `id uuid pk`, `user_id uuid references auth.users on delete cascade`, `decision text check (in ('agreed','skipped','withdrawn'))`, `consented_at timestamptz not null`, `withdrawn_at timestamptz`, `app_version text not null`, `unique(user_id)`
    - _Requirements: 12.1, 12.2, 12.4_

  - [x] 1.6 Create `lib/consent-records.ts` helper module
    - Export `persistConsentRecord({ userId, decision, appVersion })` — upserts with `onConflict: 'user_id'`
    - Export `getConsentRecord(userId)` — returns the row or null
    - Export `withdrawConsent(userId)` — updates `decision = 'withdrawn'`, sets `withdrawn_at`
    - Export `APP_VERSION` constant sourced from `process.env.NEXT_PUBLIC_APP_VERSION ?? '1.0.0'`
    - _Requirements: 5.8, 5.9, 12.1–12.4, 13.3_

  - [ ]* 1.7 Write property and unit tests for `lib/consent-records.ts`
    - **Property 9: Consent record contains all required fields for any decision** — for any `userId` (fc.uuid) and `decision` (fc.constantFrom('agreed','skipped')), the upserted row has non-null `user_id`, correct `decision`, valid ISO 8601 `consented_at`, non-empty `app_version`
    - **Property 10: Consent upsert is idempotent** — calling upsert twice with different decisions yields exactly one row with the second call's values
    - Unit: `withdrawConsent` sets `decision = 'withdrawn'` and non-null `withdrawn_at` without deleting the row
    - Test file: `__tests__/lib/consent-records.test.ts`

- [x] 2. Checkpoint — Foundation complete
  - Ensure migration runs cleanly, Logo renders SVG in the browser, and all shared sub-components render without errors. Ask the user if questions arise.

- [x] 3. Signup Flow — `app/signup/page.tsx` refactor
  - [x] 3.1 Scaffold the `SignupWizard` state machine
    - Add `step: 0 | 1 | 2 | 3 | 4` state to the wizard root
    - Add state slices: `email`, `password`, `firstName`, `lastName`, `mobile`, `consentDecision`
    - On mount, call `getConsentRecord(user.id)` — if a record exists, set `step = 4` (skip Consent)
    - Render `StepDots` above each step with `total={5}` and `current={step}`
    - Wrap the whole page in `--ink` background; remove the orange gradient and white card
    - _Requirements: 5.1, 12.5, 11.1_

  - [x] 3.2 Implement `StepAccount` (step 0)
    - Email input + password input; preserve existing `supabase.auth.signUp` call from the current `handleSubmit`
    - Inline validation: valid email format and password ≥ 6 chars before calling Supabase
    - On `User already registered` error: inline message "An account with this email already exists. Sign in instead." — do not auto-sign-in
    - "or sign up with" section with Phone, Google, Apple buttons in disabled/"coming soon" state
    - On success: advance `step` to 1
    - Use `--ink` bg, `--cream` text, `--amber` focus states, Lato for labels/inputs
    - _Requirements: 2.1–2.6, 11.1–11.7_

  - [ ]* 3.3 Write property and unit tests for `StepAccount`
    - **Property 3: Email and password validation rejects invalid inputs** — for any non-RFC-5322 email or password shorter than 6 chars, `validateAccountStep` returns a non-null error and does not call `supabase.auth.signUp`
    - **Property 4: Valid account submission advances to Profile step** — for any valid email + password (len ≥ 6), successful submit advances wizard step from 0 to 1
    - Unit: email field, password field, and "or sign up with" section are present; disabled social buttons render
    - Test file: `__tests__/flows/signup-wizard.test.tsx`

  - [x] 3.4 Implement `StepProfile` (step 1)
    - First name (required), last name (optional), mobile (optional, labelled "Used for M-Pesa payments")
    - Inline validation: block advance if `firstName.trim()` is empty
    - On success: advance `step` to 2
    - _Requirements: 3.1–3.5, 11.1–11.7_

  - [ ]* 3.5 Write property tests for `StepProfile`
    - **Property 5: Empty or whitespace first name blocks Profile step advance** — for any `fc.stringMatching(/^\s*$/)`, `validateProfileStep` returns `valid: false` with a `firstName` error
    - **Property 6: Valid profile submission advances to Verify step** — for any non-empty, non-whitespace `firstName`, submit advances step from 1 to 2
    - Test file: `__tests__/flows/signup-wizard.test.tsx`

  - [x] 3.6 Implement `StepVerify` (step 2)
    - Display confirmation message that a verification link was sent
    - Show partially masked email (e.g., `j***@example.com`)
    - "Resend email" action calls `supabase.auth.resend`
    - Poll or listen for `email_confirmed_at` on the Supabase session; advance to step 3 only when confirmed
    - Do not advance without confirmed email
    - _Requirements: 4.1–4.5_

  - [ ]* 3.7 Write property test for `StepVerify`
    - **Property 7: Verify step cannot be bypassed without email confirmation** — for any session object where `email_confirmed_at` is null/undefined, calling the advance function leaves `step` at 2
    - Test file: `__tests__/flows/signup-wizard.test.tsx`

  - [x] 3.8 Implement `StepConsent` (step 3)
    - Three data categories (visits, spend, orders/payments) each with a plain-language benefit description — no words "track", "monitor", "surveillance", "points", or "earn"
    - `PrivacyPromiseStrip` component
    - Links to `/terms` and `/privacy` each with `target="_blank" rel="noopener noreferrer"`
    - Primary CTA: "I agree — let's go →"; secondary CTA: "Not now" (visually subordinate — smaller, lower contrast)
    - On "I agree": call `persistConsentRecord({ userId, decision: 'agreed', appVersion })`, on success advance to step 4; on DB error show inline error using `--danger` token, do not advance
    - On "Not now": call `persistConsentRecord({ userId, decision: 'skipped', appVersion })`, advance to step 4
    - _Requirements: 5.1–5.11, 12.1–12.3, 11.1–11.8_

  - [ ]* 3.9 Write property and unit tests for `StepConsent`
    - **Property 8: Consent step is skipped when a record already exists** — for any `userId` with an existing `consent_records` row, wizard initialises with `step = 4`
    - **Property 11: Consent persistence failure blocks step advance** — for any simulated DB error, `step` remains at 3 and an inline error is visible
    - Unit: "I agree" CTA present; "Not now" CTA has lower visual weight; privacy links open in new tab; forbidden words absent from rendered text
    - Test file: `__tests__/flows/signup-wizard.test.tsx`

  - [x] 3.10 Implement `StepConnect` (step 4 of Signup)
    - Two options: "Scan QR code" (activates camera) and "Enter venue code" (text input)
    - On valid venue code/scan: call `loadBarInfo(slug)` to validate, then `router.push('/start?bar=<slug>')`
    - On invalid/unrecognised code: inline error, do not navigate
    - Reuse the existing `extractSlugFromQRCode` logic from `app/start/page.tsx` (import or duplicate)
    - _Requirements: 6.1–6.5_

  - [ ]* 3.11 Write property tests for `StepConnect`
    - **Property 12: Valid venue code advances to Identity step with venue populated** — for any slug resolving to an active bar, processing it advances the wizard and populates `selectedVenue`
    - **Property 13: Invalid venue code shows error and does not navigate** — for any string not matching an active bar slug, inline error is shown and step is unchanged
    - Test file: `__tests__/flows/signup-wizard.test.tsx`

- [x] 4. Checkpoint — Signup flow complete
  - Ensure all 5 steps render correctly, step transitions work, consent record is persisted, and the flow ends at `/start?bar=<slug>`. Ask the user if questions arise.

- [ ] 5. Connect Flow — `app/start/page.tsx` step state machine
  - [x] 5.1 Add `wizardStep: 0 | 1 | 2 | 3` state to `ConsentContent`
    - Add `selectedVenue`, `identityMode: 'named' | 'nickname' | 'anonymous'`, `nickname` state
    - All existing state variables (`loading`, `redirecting`, `error`, `barSlug`, `barId`, `barName`, `termsAccepted`, `nickname`, `isScannerMode`, `qrScanner`, `showBarClosed`, `showOverdueModal`, `showOverduePaymentModal`, `overdueTab`) are preserved unchanged
    - All existing functions (`handleStartTab`, `loadBarInfo`, `extractSlugFromQRCode`, `startQRScanner`, `stopScanner`, `handleQRCodeDetected`, `initializeConsent`, `handleOverdueReopen`, `handleOverduePaymentSuccess`) are preserved unchanged
    - When `wizardStep === 0`, existing `loading`, `error`, `showBarClosed`, and overdue modal gates continue to control rendering exactly as before
    - When a venue is identified (QR scan, code entry, or recent-venue tap), set `selectedVenue` and advance `wizardStep` to 1
    - _Requirements: 7.1–7.7, 11.1_

  - [x] 5.2 Implement `StepHome` (wizardStep 0)
    - Avatar using user initials (no profile photo path needed yet)
    - Overall `TierBadge` for the user
    - Recent venues list: query `tabs` joined to `bars`, limit 5, ordered by `opened_at desc`; each card shows venue name, per-venue `TierBadge`, `VisitFrequencyDots`
    - Tapping a recent venue sets `selectedVenue` and advances `wizardStep` to 1 — no QR scan or code entry
    - Motivational message (e.g., "Visit and spend more to pay less and get freebies.") — no numeric spend figure
    - Primary CTA: "Scan QR / enter code →" — triggers existing QR scanner / code-entry path, then advances to `wizardStep` 1 after venue is identified
    - If recent venues query fails, render only the CTA (silent failure, log to console)
    - _Requirements: 7.1–7.7, 11.1–11.10_

  - [ ]* 5.3 Write property tests for `StepHome`
    - **Property 14: Recent venues list renders all required fields** — for any list of venue records, each card contains venue name, a tier badge element, and visit-frequency dots
    - **Property 15: Tapping a recent venue advances directly to Identity step** — for any venue in the list, tap sets `selectedVenue` and advances `wizardStep` from 0 to 1
    - **Property 16: Home screen never renders a numeric spend figure** — for any user data, rendered output does not match `/KES\s*[\d,]+/` or `/[\d,]+\s*KES/`
    - Test file: `__tests__/flows/connect-wizard.test.tsx`

  - [-] 5.4 Implement `StepIdentity` (wizardStep 1)
    - Heading: "How do you want to appear?" followed by venue name
    - Three options: "As yourself" (user's registered name), "Use a nickname" (text input, maxLength 30), "Stay anonymous"
    - When "Stay anonymous" selected: show warning that anonymous visits do not count toward loyalty tier
    - When "Use a nickname" selected: show text input
    - On confirm: advance `wizardStep` to 2, carry `identityMode` and `nickname` forward
    - _Requirements: 8.1–8.5, 11.1–11.7_

  - [ ]* 5.5 Write property tests for `StepIdentity`
    - **Property 17: Identity selection is carried forward to Confirm step** — for any `identityMode` and `nickname`, confirming advances `wizardStep` from 1 to 2 and Confirm step receives the same values
    - Unit: anonymous warning shown when anonymous selected; nickname input shown with `maxLength=30` when nickname selected
    - Test file: `__tests__/flows/connect-wizard.test.tsx`

  - [~] 5.6 Implement `StepConfirm` (wizardStep 2)
    - Venue card: venue name and category
    - `SpendTierBreakdown` with Bronze/Silver/Gold thresholds and "You are here" marker
    - `VisitFrequencyDots` for this venue
    - Identity selection display (from `identityMode` / `nickname`)
    - `PrivacyPromiseStrip`
    - No consent form, no terms re-ask
    - Primary CTA: "Open my tab" — calls existing `handleStartTab`; on success advance `wizardStep` to 3; on failure keep `wizardStep` at 2
    - Secondary CTA: "Choose a different venue" — sets `wizardStep` to 0
    - No "pay at the bar" option
    - _Requirements: 9.1–9.10, 11.1–11.10_

  - [ ]* 5.7 Write property tests for `StepConfirm`
    - **Property 18: Opening a tab advances to Tab Open screen** — for any valid `selectedVenue` and `identityMode`, tapping "Open my tab" invokes `handleStartTab` and on success advances `wizardStep` from 2 to 3
    - Unit: no consent form present; "Choose a different venue" CTA present; no "pay at the bar" CTA; `PrivacyPromiseStrip` present
    - Test file: `__tests__/flows/connect-wizard.test.tsx`

  - [~] 5.8 Implement `StepTabOpen` (wizardStep 3)
    - Display tab ID, venue name, identity the user is appearing as, current spend tier, payment method on file
    - "View menu" button navigating to `/menu`
    - `fadeIn` entrance animation (`animate-fade-in` class from `globals.css`)
    - Confirmation indicator uses `--success` colour token
    - _Requirements: 10.1–10.4, 11.1–11.10_

- [~] 6. Checkpoint — Connect flow complete
  - Ensure all 4 steps render, existing `handleStartTab` / `loadBarInfo` / QR scanner / overdue modals / `BarClosedSlideIn` all still work, and the tab-open screen shows correct data. Ask the user if questions arise.

- [ ] 7. Consent withdrawal UI
  - [~] 7.1 Add withdrawal UI to the account settings screen
    - Locate or create the account settings page; add a "Withdraw data consent" section
    - Plain-language explanation of what withdrawal means (personalised pricing and offers will no longer apply)
    - Confirm button calls `withdrawConsent(userId)` from `lib/consent-records.ts`
    - On success: show confirmation; on next session load, `getConsentRecord` will return `decision = 'withdrawn'`, causing the Signup wizard to present `StepConsent` again
    - Does not delete visit or spend data
    - _Requirements: 13.1–13.5_

  - [ ]* 7.2 Write property test for consent withdrawal
    - **Property 19: Consent withdrawal updates record to withdrawn** — for any `userId` with an existing row, `withdrawConsent` updates `decision` to `'withdrawn'` and sets a non-null ISO 8601 `withdrawn_at`, without deleting the row
    - Test file: `__tests__/lib/consent-records.test.ts`

- [~] 8. Final checkpoint — Full integration
  - Ensure all tests pass, both flows are navigable end-to-end, design tokens are consistent across all screens, and no existing functionality in `app/start/page.tsx` has been broken. Ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- All existing logic in `app/start/page.tsx` (`handleStartTab`, `loadBarInfo`, QR scanner, overdue modals, `BarClosedSlideIn`, business-hours check) must be preserved intact — the wizard step state is additive
- Property tests use fast-check (`fc.assert`, `fc.property`) with `{ numRuns: 100 }`; each test is tagged with `// Feature: onboarding-consent-flow, Property N: <text>`
- No plain white cards, no orange gradient backgrounds — all screens use `--ink` / `--amber` / `--cream` tokens from `globals.css`
- `prefers-reduced-motion` suppression is already handled globally in `globals.css` — no per-component work needed
