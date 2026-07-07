# Tabeza Customer – Customer-Facing Tab Management Interface

## Project Overview

Tabeza Customer is a consumer web application that enables customers to connect with any restaurant or bar, open digital tabs, browse menus, place orders, and make payments — all through an intuitive, real-time interface. The app provides a seamless digital experience that replaces traditional paper-based tab management.

As a member of the Tabeza loyalty ecosystem, the app delivers a quietly personalised experience — showing guests prices tailored to them, without ever making them feel tracked or analysed. The experience feels like exceptional hospitality. The intelligence behind it is invisible.

**Dev server**: `pnpm dev` → http://localhost:3002  
**Production**: https://app.tabeza.co.ke  
**Staging / Preview**: https://tabz-mteja.vercel.app  
**Deployment**: Vercel

---

## Authentication & Onboarding Flow

### New User Signup (5 steps)
1. **Account** — Email + password creation with validation
2. **Profile** — First name (required), last name + mobile (optional, for M-Pesa)
3. **Verify** — Email confirmation link sent; page polls `email_confirmed_at` and auto-advances
4. **Consent** — Data usage disclosure; user agrees or skips; record persisted to `consent_records`
5. **Connect** — Scan QR code or enter venue code to open first tab

Email confirmation link → `/auth/callback` → exchanges token → redirects to `/signup?step=consent`

### Returning User Flow (4 steps via `/start`)
1. **Home** — Avatar + overall tier + recent venues list; tap venue or scan/enter code
2. **Identity** — Choose how to appear: as yourself / nickname / anonymous
3. **Confirm** — Venue card + spend tier matrix + identity summary + "Open my tab"
4. **Tab Open** — Success screen with tab ID, venue, identity, tier, payment method

### Auth Gate
- Home page (`/`) checks auth + consent record on load
- No auth → `/login`
- Auth but no consent → `/signup?step=consent`
- Auth + consent → home page loads normally

### Consent Records
- Table: `consent_records` (user_id, decision: agreed/skipped/withdrawn, app_version)
- `skipped` is allowed through; only `withdrawn` blocks access
- Managed via `lib/consent-records.ts`

---

## Loyalty & Discount System

### How Discounts Work

Customers earn a **badge** (Bronze / Silver / Gold) based on their spend at a single venue in one tab session. Badges are permanent once earned and upgrade-only.

**Spend thresholds** (system-wide, set by Tabeza system admin):
- Bronze: KES 1,000
- Silver: KES 3,000
- Gold: KES 5,000

**Discount formula applied to every menu item**:
```
displayPrice = basePrice × (1 - (badgePct + visitBonusPct) / 100)
```

Where:
- `badgePct` = venue-set % for the customer's badge tier (min: Bronze 1.5%, Silver 3%, Gold 5%)
- `visitBonusPct` = venue-set additional % based on visits this week (min: 1x=1%, 2x=2%, 3x+=3%)
- No badge = 0% — normal pricing

**Example**: Gold customer visiting 3x/week at a venue with Gold=6%, 3x=4% → 10% off every item.

### Badge Display in Menu Header
- Badge count (1/2/3 icons) = visit frequency at this venue this week
- Badge shape = spend tier (Circle=Bronze, Shield=Silver, Crown=Gold)
- No badge = no icons shown

### Spend Prompts
After an order is accepted by staff, a contextual prompt appears showing how much more to spend to reach the next tier.

### Data Sources
- Badge tier: `/api/loyalty/visits/[customer_id]?bar_id=` — returns `completedVisits`, `averageSpend`, `weeklyVisits`
- Venue discounts: `/api/loyalty/venue-discounts/[bar_id]` — returns `spend_tiers` and `visit_bonuses` from `venue_discount_settings` table

### Note on Token Economy
Token economy (Tabeza Tokens / Billo Beans) is implemented in the staff app backend (`tokens-service.ts`) but not yet integrated into the customer-facing experience. Currently, loyalty is based solely on badge tiers and percentage discounts.

---

## Key Pages & Routes

| Route | Purpose |
|---|---|
| `/` | Home — auth + consent gate, recent tabs, manual code entry |
| `/login` | Email/password sign in |
| `/signup` | 5-step onboarding wizard |
| `/auth/callback` | Email confirmation handler — exchanges token, routes by type |
| `/start` | Venue connection wizard (Home → Identity → Confirm → Tab Open) |
| `/menu` | Active tab menu, ordering, payments, messages |
| `/cart` | Cart review before order submission |
| `/payment` | Payment page |
| `/saved` | Saved restaurants |

---

## Architecture

### Auth
- Single `AuthProvider` context at root (`contexts/AuthContext.tsx`) — one `getSession()` call on mount, one `onAuthStateChange` subscription
- All pages use `useAuth()` from context, not the old `hooks/useAuth.ts`
- Device linking runs once per session via `useRef` guard

### Realtime Subscriptions (menu page)
Four separate channels — each must have a unique `channelName`:
- `tab-orders-{id}` — order inserts/updates/deletes
- `tab-status-{id}` — tab status changes
- `tab-payments-{id}` — payment events
- `tab-messages-{id}` — telegram messages

### Payments (RLS bypass)
All `tab_payments` reads use `/api/tabs/[id]/payments` (service role) — direct anon queries are blocked by RLS.

### API Routes (service role pattern)
All sensitive reads go through API routes using `createServiceRoleClient()`:
- `/api/tabs/[id]/orders` — tab orders
- `/api/tabs/[id]/payments` — tab payments
- `/api/tabs/[id]/messages` — telegram messages
- `/api/tabs/recent-venues` — recent venues for StepHome
- `/api/loyalty/visits/[customer_id]` — visit data + weekly count
- `/api/loyalty/venue-discounts/[bar_id]` — venue discount settings

---

## Database Tables Used

| Table | Purpose |
|---|---|
| `tabs` | Customer tabs |
| `tab_orders` | Orders on a tab |
| `tab_payments` | Payments on a tab |
| `tab_telegram_messages` | Staff-customer messages |
| `tab_balances` | View: computed balance per tab |
| `bars` | Venue info |
| `bar_products` | Menu items |
| `customers` | Customer profiles (loyalty) |
| `consent_records` | User consent decisions |
| `venue_discount_settings` | Per-venue badge % and visit bonus % |

---

## Design Principles for Loyalty UX

1. **The price is the price.** Never show a crossed-out original price. The guest's price is their price.
2. **"Your price" not "discount."** Labels affirm standing, never frame savings as a deal.
3. **Tier is identity, not score.** Bronze/Silver/Gold are shown as status, not numbers to optimise.
4. **Offers feel like hospitality.** Promotions arrive at natural moments, redeemed with one tap.
5. **No loyalty jargon.** Words like "points", "earn", "redeem", "tracked" never appear in the UI.
6. **New guests are welcomed, not empty.** No history = clean, inviting experience.

---

## Environment Variables

Key variables in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY` — service role key for API routes
- `NEXT_PUBLIC_APP_URL` — used for email redirect URLs

For Vercel deployment, set **Site URL** in Supabase Dashboard → Authentication → URL Configuration to `https://app.tabeza.co.ke`, and add the following to Redirect URLs:
- `https://app.tabeza.co.ke/auth/callback`
- `https://tabz-mteja.vercel.app/auth/callback`
- `http://localhost:3002/auth/callback`

---

*Built with ❤️ in Nairobi, Kenya.*
