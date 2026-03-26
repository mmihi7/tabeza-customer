# Tabeza Customer – Customer-Facing Tab Management Interface

## Project Overview
Tabeza Customer is a consumer web application that enables customers to connect with any restaurant or bar, open digital tabs, browse menus, place orders, and make payments—all through an intuitive, real‑time interface. The app provides a seamless digital experience that replaces traditional paper‑based tab management.

As a member of the Tabeza loyalty ecosystem, the app also delivers a quietly personalised experience — showing guests prices and offers tailored to them, without ever making them feel tracked or analysed. The experience feels like exceptional hospitality. The intelligence behind it is invisible.

---

## Goals and Objectives
- **Simplify Tab Management**: Allow customers to open, view, and close digital tabs instantly.
- **Streamline Ordering**: Provide a friction‑free ordering experience via chat or menu browsing.
- **Enable Secure Payments**: Integrate mobile‑money (MPESA) and card payments with real‑time confirmation.
- **Enhance Customer Engagement**: Deliver real‑time notifications, order updates, and personalized interactions.
- **Make Every Guest Feel Like a Regular**: Surface loyalty tier status, personalised pricing, and exclusive offers in a way that feels warm and natural — never transactional or surveillance-like.
- **Support Scalability**: Build a modular architecture that can be extended with additional features and integrations.

---

## Key Features

### Digital Tab Management
- **Tab Connection**: Open a tab with a QR code or manual entry, view active tabs, and close tabs with automated payment.
- **Interactive Menu**: Browse categorized items, filter by availability, and add items to cart.
- **Chat‑Based Ordering**: Natural‑language chat interface that understands common ordering phrases (e.g., "2 Tusker, 1 whiskey coke").
- **Real‑Time Payment Processing**: Secure MPESA integration with instant callback verification and payment status updates.
- **Push Notifications & Alerts**: Notify customers about order confirmations, payment receipts, and tab status changes.
- **PWA (Progressive Web App)**: Installable app experience with offline capabilities and automatic updates.
- **Device‑Agnostic Design**: Fully responsive UI that works on mobile, tablet, and desktop.

### Loyalty & Personalisation (Customer Experience)

The loyalty features in Tabeza Customer are designed around one principle: **the guest should feel special, not studied**. Tier status and personalised pricing appear naturally across the app — embedded into the menu, the tab, and the ordering experience — rather than presented as a loyalty dashboard.

#### Tier Status Display
- **Ambient Tier Indicator** – A subtle badge appears in the guest's profile and at the top of any connected venue screen, showing their current tier (Bronze, Silver, Gold) for that establishment. The indicator is warm and understated — a small acknowledgement, not a leaderboard position.
- **Cross-Venue Recognition** – When a guest connects to a new Tabeza-enabled venue they have visited before, the app greets them with a contextual welcome that reflects their history there. New venues where the guest has no history show a clean, welcoming first-time experience.
- **Tier-Specific Welcome** – Gold and Silver guests connecting to a venue receive a quietly elevated welcome message that acknowledges their loyalty without being verbose.

#### Personalised Pricing on the Menu
- **Silent Price Personalisation** – When a loyalty pricing rule is active for a menu item and the guest qualifies, the menu displays their personalised price directly — no original price crossed out, no "discount" label. The price simply *is* their price.
- **"Your Price" Indicator** – Where a guest's tier entitles them to a different price, a subtle "Your price" label appears next to the item. The message is personal and affirming: it signals that this price is exclusive to them without explaining why or referencing their data.
- **Category-Level Personalisation** – Pricing overrides can apply across full categories (e.g., all spirits, all premium bottles), so the tailored experience is consistent throughout the menu, not isolated to individual items.
- **No Confusion at Checkout** – The price the guest sees on the menu is the price on their tab. There are no adjustments, no codes to enter, and no surprises at payment.

#### Promotions & Offers
- **In-App Offer Delivery** – Personalised promotions from the venue (manual, auto, or AI-generated) arrive as in-app notifications or as a banner within the venue's connected experience. They are written in the venue's voice, not as generic marketing copy.
- **Contextual Timing** – Offers are surfaced at the right moment: when the guest connects to a tab, when they are browsing a relevant menu category, or when they haven't visited in a while and the Auto Promotion Agent has fired an offer for them.
- **One-Tap Redemption** – Accepting an offer adds it to the guest's active tab instantly. No codes, no screenshots, no awkward conversations with staff.
- **Offer History** – Guests can view their received and redeemed offers in their profile, giving them a sense of the value they've accumulated over time without the app presenting it as a points balance.

#### Profile & Loyalty Summary
- **Guest Profile Screen** – Shows the guest's name, member status, and a soft summary of their loyalty standing across all Tabeza-connected venues they have visited. Framed as "your places" rather than "your data."
- **Venue-Specific Status** – When viewing a specific venue's profile within the app, guests see their tier for that venue, how long they have been a guest there, and any active offers available to them.
- **Privacy-First Framing** – All loyalty-related copy in the app is written to emphasise the guest's experience and benefits, not data collection. The word "track" never appears in the customer-facing interface.

---

## Intelligent Agents

### Chat Ordering Agent
- **Purpose**: Interprets customer messages in the chat interface, mapping natural‑language requests to menu items and quantities.
- **Technology**: Keyword matching and regular‑expression patterns; designed to be extended with more advanced NLP in the future.
- **Usage**: Embedded in the chat page (`app/chat/page.tsx`), the agent processes user input and automatically updates the cart. When a loyalty pricing rule applies to an ordered item, the agent resolves the guest's personalised price silently before adding to the cart.

### Notification Agent
- **Purpose**: Orchestrates real‑time push notifications and in‑app alerts based on customer actions (order placed, payment confirmed, tab closed) and loyalty events (tier upgrade, new personalised offer received).
- **Technology**: Web Push API, Supabase real‑time subscriptions, and a configurable rule engine.
- **Loyalty Extensions**:
  - Fires a warm, non-intrusive notification when a guest's tier is upgraded (e.g., "You're now a Gold guest at Forty Thieves — enjoy your next visit.").
  - Delivers incoming venue promotions as in-app banners or push notifications, respecting the guest's notification preferences.

### Payment Validation Agent
- **Purpose**: Monitors incoming MPESA payment callbacks, validates transaction integrity, and updates the payment status in the database.
- **Technology**: Secure webhook handling, checksum verification, and idempotent processing.

### Loyalty Price Resolution Agent
- **Purpose**: Resolves the correct price for each menu item at the point of display and at the point of ordering, based on the guest's current tier and any active pricing rules set by the venue.
- **Technology**: Reads from `@tabeza/loyalty-engine` pricing rule schema; applies overrides as a non-destructive layer over the base menu price.
- **Usage**: Called when a guest loads a menu and when an item is added to the cart. Ensures the price the guest sees is always the price they pay — no reconciliation at checkout.
- **Behaviour**: Operates silently. No debug labels, no "loyalty discount applied" banners unless the venue has explicitly configured promotional messaging. The default experience is that the price simply reflects who the guest is.

---

## Technical Stack
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes, Supabase (PostgreSQL, real‑time subscriptions, authentication)
- **Payments**: MPESA Daraja API, custom callback handlers
- **Real‑Time Communication**: Supabase real‑time, Web Push API
- **Loyalty Engine**: `@tabeza/loyalty-engine` shared package — tier resolution, pricing override logic, promotion delivery schema
- **Testing**: Jest, fast‑check (property‑based testing), React Testing Library
- **Tooling**: Turborepo, pnpm, ESLint, Prettier
- **Deployment**: Vercel, Supabase Edge Functions

---

## Setup and Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/billoapp/tabeza‑customer.git
   cd tabeza‑customer
   ```
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Copy `.env.example` to `.env` and fill in your Supabase and MPESA credentials.
4. Run the development server:
   ```bash
   pnpm dev
   ```
5. Open [http://localhost:3002](http://localhost:3002) in your browser.

---

## Configuration
Environment variables are used for all sensitive configuration. Refer to `.env.example` for the complete list.

---

## Design Principles for Loyalty UX

These principles govern how loyalty features are presented throughout the customer app. All engineers and designers working on loyalty-related screens should treat these as non-negotiable:

1. **The price is the price.** Never show a crossed-out "original" price next to a personalised one. The guest's price is their price — full stop.
2. **"Your price" not "discount."** When a label is needed, it affirms the guest's standing. It is never framed as a saving or a deal.
3. **Tier is identity, not score.** Bronze, Silver, Gold are shown as a status — like being a regular at your favourite bar — not as a number to optimise.
4. **Offers feel like hospitality.** Promotions are written in the venue's voice, arrive at natural moments, and are redeemed with one tap. They should feel like a personal gesture, not a campaign.
5. **No loyalty jargon.** Words like "points," "earn," "redeem," "tier threshold," "data," and "tracked" do not appear in the customer-facing interface.
6. **New guests are welcomed, not empty.** A guest with no history sees a clean, inviting experience — not blank loyalty cards or zero-state dashboards.

---

## Contributing
We welcome contributions that improve the customer experience, add new features, or enhance code quality. Please follow the project's coding standards and ensure all tests pass before submitting a pull request.

---

## License
MIT License – see [LICENSE](LICENSE) for details.

---

*Documentation generated for the Tabeza Customer project.*
