# Requirements Document

## Introduction

This feature redesigns the customer-facing menu page (`app/menu/page.tsx`) in the Tabeza Customer app with two focused changes:

1. **Unified 2-column product grid** — replaces the separate FOOD and DRINKS sections (each with horizontal scroll carousels and category filter tabs) with a single scrollable 2-column grid showing all bar products together.
2. **Loyalty tier pricing** — silently applies a spend-tier-based percentage discount to each product's displayed price, showing the original price crossed out alongside the discounted price. New customers with no tier data see normal prices only.

All other page sections (cart, payment, orders, messages, tab header, connection status) remain unchanged.

---

## Glossary

- **Menu_Page**: The customer-facing page at `app/menu/page.tsx` that displays bar products and manages the customer's tab session.
- **Unified_Grid**: The single 2-column product grid that replaces the separate FOOD and DRINKS carousel sections.
- **Bar_Product**: A record from `bar_products` joined with product metadata (name, category, image_url, sale_price).
- **Product_Card**: The UI tile for a single bar product showing image/icon, name, and price(s).
- **Spend_Tier**: The customer's cross-venue spend classification — `low`, `medium`, or `high` — returned by `/api/loyalty/tier/[customerId]?barId=...`.
- **Tier_Discount**: The percentage discount applied to a product's sale price based on the customer's spend tier: low → 1.5% (bronze), medium → 3% (silver), high → 5% (gold).
- **Discounted_Price**: The sale price after applying the Tier_Discount, rounded to the nearest whole number.
- **Original_Price**: The unmodified `sale_price` from the Bar_Product record.
- **Loyalty_Price_Layer**: The non-destructive pricing override applied at display time; it does not mutate the source menu data.
- **New_Customer**: A customer for whom the spend tier API returns no tier data, an error, or a null/undefined spend_tier.
- **Cart**: The in-session list of items the customer intends to order, persisted in `sessionStorage`.

---

## Requirements

### Requirement 1: Unified 2-Column Product Grid

**User Story:** As a customer, I want to see all bar products in a single scrollable grid, so that I can browse drinks and food together without switching between sections.

#### Acceptance Criteria

1. THE Menu_Page SHALL render all active Bar_Products in a single Unified_Grid with exactly 2 columns.
2. WHEN the Menu_Page loads and Bar_Products are available, THE Unified_Grid SHALL display all products regardless of category (drinks and food together, unseparated).
3. THE Menu_Page SHALL NOT render the separate FOOD section with its horizontal scroll carousel and category filter tabs.
4. THE Menu_Page SHALL NOT render the separate DRINKS section with its horizontal scroll carousel and category filter tabs.
5. THE Menu_Page SHALL NOT render a category filter bar above or within the Unified_Grid.
6. WHEN a Bar_Product has an `image_url`, THE Product_Card SHALL display that image filling the card's image area.
7. WHEN a Bar_Product has no `image_url`, THE Product_Card SHALL display the category icon in the image area using the existing `getCategoryIcon` helper.
8. THE Product_Card SHALL display the product name below the image area.
9. WHEN a customer taps a Product_Card, THE Menu_Page SHALL invoke the existing `addToCart` function with that Bar_Product, preserving all existing cart behaviour.
10. THE Unified_Grid SHALL sort products alphabetically by product name within the grid.
11. WHILE Bar_Products are loading, THE Menu_Page SHALL display a loading state in place of the Unified_Grid.
12. IF no active Bar_Products exist for the bar, THEN THE Unified_Grid SHALL display an empty-state message indicating no products are available.

---

### Requirement 2: Loyalty Tier Price Fetching

**User Story:** As a customer, I want the app to silently determine my loyalty discount tier, so that I see prices personalised to my spend history without any manual action.

#### Acceptance Criteria

1. WHEN the Menu_Page loads and `tab.customer_id` is available, THE Menu_Page SHALL fetch the customer's spend tier from `/api/loyalty/tier/[customerId]?barId=[tab.bar_id]`.
2. THE Menu_Page SHALL fetch the spend tier once per page load, not on every render.
3. IF the spend tier API call fails or returns a non-2xx response, THEN THE Menu_Page SHALL treat the customer as a New_Customer and display Original_Prices only, with no error shown to the user.
4. IF the spend tier API response contains a null or undefined `spend_tier`, THEN THE Menu_Page SHALL treat the customer as a New_Customer.
5. THE Menu_Page SHALL NOT display any loading indicator, error message, or loyalty-related label to the customer during or after the tier fetch.
6. THE Menu_Page SHALL apply the following hardcoded Tier_Discount defaults: `low` → 1.5%, `medium` → 3%, `high` → 5%.
7. THE Menu_Page SHALL map spend tiers to discounts as follows: `low` → bronze (1.5%), `medium` → silver (3%), `high` → gold (5%).

---

### Requirement 3: Loyalty Tier Price Display

**User Story:** As a customer with a spend tier, I want to see my discounted price alongside the original price, so that I can see the benefit of my loyalty status without any explicit loyalty framing.

#### Acceptance Criteria

1. WHEN a customer has a Spend_Tier and a Bar_Product's Discounted_Price differs from its Original_Price, THE Product_Card SHALL display the Original_Price with a strikethrough style above or before the Discounted_Price.
2. WHEN a customer has a Spend_Tier, THE Product_Card SHALL display the Discounted_Price as the primary price (visually prominent).
3. THE Product_Card SHALL NOT display any label such as "discount", "loyalty", "your price", "offer", or any tier name alongside the prices.
4. THE Discounted_Price SHALL be calculated as: `Original_Price × (1 − Tier_Discount / 100)`, rounded to the nearest whole KES.
5. WHEN a customer is a New_Customer, THE Product_Card SHALL display only the Original_Price with no strikethrough and no secondary price.
6. THE Loyalty_Price_Layer SHALL NOT mutate the `sale_price` field on any Bar_Product object in state; the discount is applied only at display time.
7. WHEN a customer adds a product to the Cart, THE Cart SHALL record the price that was displayed to the customer (Discounted_Price if applicable, Original_Price otherwise), preserving the existing `addToCart` behaviour.

---

### Requirement 4: Preservation of Existing Functionality

**User Story:** As a customer, I want all non-menu sections of the page to continue working exactly as before, so that my ordering, payment, and messaging experience is unaffected by the menu redesign.

#### Acceptance Criteria

1. THE Menu_Page SHALL preserve the Cart section, including add-to-cart, quantity adjustment, item removal, and order submission, without modification.
2. THE Menu_Page SHALL preserve the Payment section (M-Pesa, card, cash flows) without modification.
3. THE Menu_Page SHALL preserve the Orders section (pending, confirmed, cancelled order display) without modification.
4. THE Menu_Page SHALL preserve the Messages section and MessagePanel without modification.
5. THE Menu_Page SHALL preserve the tab header, bar name display, loyalty icon rendering, and connection status indicator without modification.
6. THE Menu_Page SHALL preserve all real-time Supabase subscriptions (orders, payments, messages, tab status) without modification.
7. THE Menu_Page SHALL preserve the existing `notColdPreferences` toggle for drink items in the Cart section without modification.
8. WHEN the tab status changes to `closed` via real-time subscription, THE Menu_Page SHALL redirect the customer to the home page, as before.
