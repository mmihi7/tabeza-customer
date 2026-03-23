# Tabeza Customer – Customer-Facing Tab Management Interface

## Project Overview
Tabeza Customer is a consumer web application that enables customers to connect with any restaurant or bar, open digital tabs, browse menus, place orders, and make payments—all through an intuitive, real‑time interface. The app provides a seamless digital experience that replaces traditional paper‑based tab management.

## Goals and Objectives
- **Simplify Tab Management**: Allow customers to open, view, and close digital tabs instantly.
- **Streamline Ordering**: Provide a friction‑free ordering experience via chat or menu browsing.
- **Enable Secure Payments**: Integrate mobile‑money (MPESA) and card payments with real‑time confirmation.
- **Enhance Customer Engagement**: Deliver real‑time notifications, order updates, and personalized interactions.
- **Support Scalability**: Build a modular architecture that can be extended with additional features and integrations.

## Key Features
- **Digital Tab Management**: Open a tab with a QR code or manual entry, view active tabs, and close tabs with automated payment.
- **Interactive Menu**: Browse categorized items, filter by availability, and add items to cart.
- **Chat‑Based Ordering**: Natural‑language chat interface that understands common ordering phrases (e.g., “2 Tusker, 1 whiskey coke”).
- **Real‑Time Payment Processing**: Secure MPESA integration with instant callback verification and payment status updates.
- **Push Notifications & Alerts**: Notify customers about order confirmations, payment receipts, and tab status changes.
- **PWA (Progressive Web App)**: Installable app experience with offline capabilities and automatic updates.
- **Device‑Agnostic Design**: Fully responsive UI that works on mobile, tablet, and desktop.

## Intelligent Agents
The platform incorporates lightweight, rule‑based agents that enhance the user experience without requiring complex AI infrastructure.

### Chat Ordering Agent
- **Purpose**: Interprets customer messages in the chat interface, mapping natural‑language requests to menu items and quantities.
- **Technology**: Keyword matching and regular‑expression patterns; designed to be extended with more advanced NLP in the future.
- **Usage**: Embedded in the chat page (`app/chat/page.tsx`), the agent processes user input and automatically updates the cart.

### Notification Agent
- **Purpose**: Orchestrates real‑time push notifications and in‑app alerts based on customer actions (order placed, payment confirmed, tab closed).
- **Technology**: Web Push API, Supabase real‑time subscriptions, and a configurable rule engine.

### Payment Validation Agent
- **Purpose**: Monitors incoming MPESA payment callbacks, validates transaction integrity, and updates the payment status in the database.
- **Technology**: Secure webhook handling, checksum verification, and idempotent processing.

## Technical Stack
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes, Supabase (PostgreSQL, real‑time subscriptions, authentication)
- **Payments**: MPESA Daraja API, custom callback handlers
- **Real‑Time Communication**: Supabase real‑time, Web Push API
- **Testing**: Jest, fast‑check (property‑based testing), React Testing Library
- **Tooling**: Turborepo, pnpm, ESLint, Prettier
- **Deployment**: Vercel, Supabase Edge Functions

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

## Configuration
Environment variables are used for all sensitive configuration. Refer to `.env.example` for the complete list.

## Contributing
We welcome contributions that improve the customer experience, add new features, or enhance code quality. Please follow the project’s coding standards and ensure all tests pass before submitting a pull request.

## License
MIT License – see [LICENSE](LICENSE) for details.

---

*Documentation generated for the Tabeza Customer project.*