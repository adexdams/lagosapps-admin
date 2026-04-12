# LagosApps Admin Dashboard & Database Migration Plan

## Context

LagosApps is a multi-subsidiary transaction platform with 7 service portals (Solar, Transport, Groceries, Health, Events, Community, Logistics). The current frontend has **350+ hardcoded data items** (products, prices, services) scattered across portal component files, and all user state is persisted via **localStorage**. There is no backend, no database, and no admin interface.

This plan covers two things:
1. **Building an admin dashboard UI** (frontend-only with mock data, implementable now)
2. **Documenting every piece of data that must migrate to a database**, so when the backend is integrated, nothing is missed

---

## 1. Database Schema

### 1.1 Core User Tables

**users**
- id (UUID PK), name, phone (UNIQUE), email, password_hash, addresses (JSONB), membership_tier (ENUM: none/bronze/silver/gold), wallet_balance (DECIMAL), referral_code (VARCHAR UNIQUE), referred_by (FK -> users), avatar_url (TEXT), role (ENUM: user/admin/super_admin), is_active (BOOLEAN), created_at, updated_at

**membership_subscriptions**
- id (UUID PK), user_id (FK), tier, billing_cycle (annual/quarterly), amount_paid, starts_at, expires_at, status (active/expired/cancelled), payment_reference

**membership_benefit_usage**
- id (UUID PK), subscription_id (FK), user_id (FK), benefit_key (VARCHAR), used_count (INT), period_start (DATE), period_end (DATE)

### 1.2 Transaction Tables

**orders**
- id (VARCHAR PK, "ORD-" prefix), user_id (FK), portal_id (FK), description, total_amount, discount_amount, wallet_deduction, payment_amount, payment_reference, status (ENUM: pending/confirmed/processing/completed/cancelled), delivery_address, notes, created_at, updated_at

**order_items**
- id (UUID PK), order_id (FK), product_id (FK, nullable), name (snapshot), description, price (snapshot), quantity, member_covered (BOOLEAN)

**order_timeline**
- id (UUID PK), order_id (FK), label, occurred_at (nullable TIMESTAMPTZ), completed (BOOLEAN), sort_order

**wallet_transactions**
- id (VARCHAR PK, "TXN-" prefix), user_id (FK), description, amount (DECIMAL, always positive), type (credit/debit), running_balance, reference, created_at

**carts** / **cart_items**
- cart: id (UUID PK), user_id (FK), created_at, updated_at
- items: id (UUID PK), cart_id (FK), service, category, name, description, image, price, quantity, member_covered

**notifications**
- id (UUID PK), user_id (FK), type (order/wallet/membership/system), title, message, read (BOOLEAN), created_at

**referrals**
- id (UUID PK), referrer_id (FK), referred_id (FK), gifted_tier, expires_at, status (active/expired/pending), created_at

### 1.3 Product Catalog Tables

**service_portals**
- id (VARCHAR PK: solar/transport/groceries/health/events/community/logistics), name, description, icon, color, image_url, cta_text, sort_order, is_active

**product_categories**
- id (UUID PK), portal_id (FK), name, slug, description, icon, image_url, parent_category_id (FK -> self, nullable), sort_order, is_active

**products**
- id (UUID PK), category_id (FK), portal_id (FK), name, description, price (DECIMAL), image_url, metadata (JSONB for portal-specific fields like wattage, capacity, pickup hours, etc.), stock_status (in_stock/low_stock/out_of_stock), is_active, created_at, updated_at

**Specialized tables:**
- **solar_packages**: id, name, battery_type (gel/lithium), capacity_kw, price, is_active
- **building_types**: id, label, recommendation, gel_price, lithium_price, image_url
- **pricing_zones**: id, portal_id (FK), name, slug, sort_order
- **transport_pricing**: id, vehicle_type_id (FK -> products), zone_id (FK), price
- **venues**: id, name, location, description, capacity, price_range, image_url, amenities (TEXT[]), categories (TEXT[]), is_active
- **membership_tiers**: id (bronze/silver/gold), name, annual_price, quarterly_price, color, sort_order, is_active
- **membership_tier_benefits**: id, tier_id (FK), label, benefit_key, limit_count (nullable = unlimited), limit_period (month/quarter/year/null), sort_order

### 1.4 Admin Table

**admin_audit_log**
- id (UUID PK), admin_user_id (FK), action, entity_type, entity_id, old_values (JSONB), new_values (JSONB), created_at

---

## 2. Hardcoded Data Inventory (What Must Migrate)

Every item below is currently a `const` array/object defined at the top of a component file. Each must become a database table seeded from these values, and the component must fetch from an API instead.

### 2.1 Solar Portal (`src/components/portals/SolarAuditPortal.tsx`)

| Data | Line Range | Count | Fields |
|------|-----------|-------|--------|
| `mainPaths` | ~10-15 | 4 | label, value, icon, desc, color |
| `auditPurposes` | ~17-22 | 4 | label, value, icon, img |
| `buildingTypes` | ~24-30 | 5 | label, value, rec, gelPrice, lithiumPrice, img |
| `solarPackages` | ~32-43 | 10 | name, price, type (gel/lithium) |
| `productCategories` | ~47-52 | 4 | label, value, icon, img |
| `solarProducts.panels` | ~54-65 | 12 | name, price, img |
| `solarProducts.inverters` | ~66-84 | 16 | name, price, img |
| `solarProducts.batteries` | ~85-89 | 3 | name, price, img |
| `solarProducts.controllers` | ~90-96 | 3 | name, price, img |

### 2.2 Transport Portal (`src/components/portals/TransportPortal.tsx`)

| Data | Line Range | Count | Fields |
|------|-----------|-------|--------|
| `locationPricing` | ~6-12 | 5 | label, value |
| `vehicleTypes` | ~14-44 | 5 | label, value, icon, desc, img, pricing (per zone), pickupHours, color, note |

### 2.3 Groceries Portal (`src/components/portals/GroceriesPortal.tsx`)

| Data | Line Range | Count | Fields |
|------|-----------|-------|--------|
| `orderTypes` | ~9-13 | 3 | label, value, icon, desc, img |
| `grocerySubcats` | ~15-21 | 5 | label, value, icon |
| `groceryProducts.drinks` | ~23-45 | 23 | name, price, img |
| `groceryProducts.cereals` | ~46-62 | 16 | name, price, img |
| `groceryProducts.snacks` | ~63-90 | 22 | name, price, img |
| `groceryProducts.canned` | ~91-101 | 9 | name, price, img |
| `groceryProducts.staples` | ~102-105 | 2 | name, price, img |
| `householdProducts` | ~108-122 | 13 | name, price, img |

### 2.4 Health Portal (`src/components/portals/HealthPortal.tsx`)

| Data | Line Range | Count | Fields |
|------|-----------|-------|--------|
| `services` | ~6-12 | 5 | label, value, icon, desc, color, img, comingSoon |
| `medicalTests` | ~14-20 | 14 | name (string array) |
| `medicalSupplies` | ~22-31 | 8 | name, price, img |

### 2.5 Events Portal (`src/components/portals/EventsPortal.tsx`)

| Data | Line Range | Count | Fields |
|------|-----------|-------|--------|
| `mainServices` | ~8-14 | 5 | label, value, icon, desc, color, img |
| `venues` | ~16-38 | 3 | name, location, priceRange, capacity, desc, img, amenities[], categories[] |
| `coverageServices` | ~40-45 | 4 | name, icon, desc, price |
| Event types (inline JSX) | ~161-174 | 12 | name, icon |

### 2.6 Community Portal (`src/components/portals/CommunityPortal.tsx`)

| Data | Line Range | Count | Fields |
|------|-----------|-------|--------|
| `mainServices` | ~8-14 | 5 | label, value, icon, desc, color, img |
| `impactAreas` | ~16-21 | 4 | name, icon, desc, color |
| Sponsorship types (inline) | ~175-185 | 9 | value, label |
| Donation categories (inline) | ~244-253 | 8 | value, label |
| TEPLEARN courses (inline) | ~317-330 | 12 | name, icon |
| Volunteer areas (inline) | ~388-397 | 9 | value, label |
| Availability options (inline) | ~404-409 | 5 | value, label |

### 2.7 Logistics Portal (`src/components/portals/LogisticsPortal.tsx`)

| Data | Line Range | Count | Fields |
|------|-----------|-------|--------|
| Supported stores (inline) | ~65-71 | 6 | value, label |

### 2.8 Membership (duplicated in 2 files)

**`src/components/MembershipLedger.tsx`** (lines 13-53) — Homepage pricing: 3 tiers with annualPrice, quarterlyPrice, features[]

**`src/components/dashboard/MembershipPanel.tsx`** (lines 10-47) — Dashboard: 3 tiers with annualPrice, quarterlyPrice, color, benefits[] (with used/limit/unit tracking)

### 2.9 Service Catalogs

**`src/components/ServiceCategories.tsx`** (lines 5-60) — 6 landing page cards: name, icon, image, cta, description, portalId

**`src/components/dashboard/NewOrderPanel.tsx`** (lines 11-25) — 7 dashboard services: id, name, icon, description, color

### 2.10 localStorage Keys

| Key | File | What It Stores |
|-----|------|---------------|
| `lagosapps_user` | `AuthProvider.tsx` | Full User object (profile, tier, wallet, referral code) |
| `lagosapps_cart` | `CartProvider.tsx` | CartItem[] array |

### 2.11 Demo Data Generators (`src/hooks/useAuth.ts`)

| Function | Line Range | Generates |
|----------|-----------|-----------|
| `seedDemoUser()` | AuthProvider.tsx ~38-53 | 1 demo user with silver tier, ₦187,500 wallet |
| `generateDemoOrders()` | useAuth.ts ~110-170 | 5 orders with timelines |
| `generateDemoWallet()` | useAuth.ts ~172-182 | 6 wallet transactions |
| `generateDemoNotifications()` | useAuth.ts ~152-168 | 6 notifications |
| `generateDemoReferrals()` | useAuth.ts ~184-190 | 3 referrals |

---

## 3. Admin Dashboard Pages

### 3.1 Architecture: Same App, Route-Based

Add `react-router-dom`. Admin lives at `/admin/*` with its own layout. User dashboard stays as a full-screen overlay (no route change needed — preserves existing behavior).

### 3.2 Admin Pages to Build

**Admin Overview** (`/admin`)
- Stat cards: total users, total revenue, active orders, active memberships
- Recent orders table (5 most recent)
- Revenue by service portal (bar chart)
- Quick actions: "View Pending Orders", "Low Stock Items"

**Users Management** (`/admin/users`, `/admin/users/:id`)
- Searchable/filterable table: name, phone, email, tier, wallet balance, status
- User detail: profile info, order history, wallet transactions, referrals, membership
- Actions: activate/deactivate, adjust wallet, set membership, view activity

**Orders Management** (`/admin/orders`)
- Filterable table: order ID, user, service, amount, status, date
- Filters: status, service portal, date range
- Order detail: items, timeline, payment breakdown
- Actions: update status, add timeline step, cancel, refund to wallet

**Inventory Management** (`/admin/inventory`)
- Portal tab selector at top (Solar | Transport | Groceries | Health | Events | Community | Logistics)
- Category tree view for selected portal
- Product list: name, price, image thumbnail, stock status, active toggle
- Add/Edit product modal: name, description, price, image upload, category, portal-specific fields
- Bulk actions: activate/deactivate, price updates

**Membership Admin** (`/admin/membership`)
- Tier cards with pricing (editable)
- Benefit list per tier (editable: label, limit, period)
- Active subscriptions table: user, tier, billing cycle, dates, status
- Actions: activate/deactivate subscription, extend expiry

**Wallet & Payments** (`/admin/wallet`)
- All wallet transactions across users with search/filter
- Filter by type, date range, user
- Manual wallet adjustment (amount + reason, logged to audit)

**Referrals** (`/admin/referrals`)
- All referrals: referrer, referred user, tier, expiry, status
- Filter by status, tier

**Notifications Broadcast** (`/admin/notifications`)
- Send to: all users, specific tier, specific user
- Message form: type, title, body
- Sent notifications log

**Analytics** (`/admin/analytics`)
- Revenue by portal over time
- User growth chart
- Membership distribution
- Top products/services
- Cart abandonment rate

**Audit Log** (`/admin/audit`)
- Chronological log of all admin actions
- Filter by admin user, action type, entity type, date range

---

## 4. API Endpoints

### Public
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/verify-otp
GET    /api/portals
GET    /api/portals/:id/categories
GET    /api/portals/:id/products?category=X&page=1
GET    /api/membership/tiers
GET    /api/solar/packages
GET    /api/solar/building-types
GET    /api/transport/pricing
GET    /api/events/venues
```

### Authenticated User
```
GET    /api/auth/me
PATCH  /api/users/profile
POST   /api/users/avatar
GET    /api/users/orders
GET    /api/users/wallet/transactions
POST   /api/users/wallet/topup
GET    /api/users/notifications
PATCH  /api/users/notifications/:id/read
POST   /api/users/notifications/read-all
GET    /api/users/referrals
POST   /api/users/membership/subscribe
GET/POST/PATCH/DELETE /api/cart (+ /api/cart/items/:id)
POST   /api/orders (checkout)
```

### Admin (requires role=admin)
```
GET    /api/admin/users
GET    /api/admin/users/:id
PATCH  /api/admin/users/:id
POST   /api/admin/users/:id/wallet-adjust
GET    /api/admin/orders
PATCH  /api/admin/orders/:id/status
POST   /api/admin/orders/:id/timeline
CRUD   /api/admin/products
CRUD   /api/admin/categories
CRUD   /api/admin/solar/packages
PATCH  /api/admin/transport/pricing/:id
CRUD   /api/admin/events/venues
PATCH  /api/admin/membership/tiers/:id
GET    /api/admin/membership/subscriptions
POST   /api/admin/notifications/broadcast
GET    /api/admin/analytics/*
GET    /api/admin/audit-log
```

---

## 5. Implementation Order

### Phase 1: Admin UI (Build Now, Frontend Only)

**Step 1 — Routing setup**
- Install `react-router-dom`
- Update `src/App.tsx`: wrap in `BrowserRouter`, add `/admin/*` route
- Keep user dashboard as overlay (no route change)

**Step 2 — Admin data layer** (3 new files)
- `src/hooks/useAdmin.ts` — context interface and hook
- `src/components/AdminProvider.tsx` — provider with mock data
- `src/data/adminMockData.ts` — mock users, orders, products, transactions

**Step 3 — Admin shell** (2 new files)
- `src/components/admin/AdminLayout.tsx` — sidebar + topbar + content
- `src/components/admin/AdminRoute.tsx` — role guard

**Step 4 — Shared admin components** (4 new files)
- `src/components/admin/DataTable.tsx` — reusable sortable/paginated table
- `src/components/admin/StatCard.tsx` — stat display card
- `src/components/admin/AdminBreadcrumb.tsx` — breadcrumb nav
- `src/components/admin/SimpleChart.tsx` — CSS-based bar/pie charts

**Step 5 — Admin pages** (10 new files, in this order)
1. `AdminOverview.tsx` — dashboard home
2. `UsersPage.tsx` + `UserDetail.tsx` — user management
3. `OrdersPage.tsx` — order management
4. `InventoryPage.tsx` + `ProductEditor.tsx` — product/inventory CRUD
5. `MembershipAdmin.tsx` — tier and subscription management
6. `WalletAdmin.tsx` — transaction log
7. `ReferralsAdmin.tsx` — referral tracking
8. `AnalyticsPage.tsx` — charts and reports
9. `NotificationsAdmin.tsx` — broadcast messaging
10. `AuditLog.tsx` — admin action log

**Step 6 — Add `role` field to User interface**
- Update `src/hooks/useAuth.ts`: add `role: "user" | "admin" | "super_admin"` to User interface
- Update `src/components/AuthProvider.tsx`: set `role: "admin"` on demo user
- Update default context value

### Phase 2: Data Extraction (Prep for Backend)

**Step 7 — Extract hardcoded data** (7 new files in `src/data/`)
- `solarData.ts`, `transportData.ts`, `groceriesData.ts`, `healthData.ts`, `eventsData.ts`, `communityData.ts`, `membershipData.ts`
- Each file exports the same arrays currently defined inline in portal components

**Step 8 — Update portals to import from data modules**
- Each portal file: replace inline `const products = [...]` with `import { products } from '../../data/...'`
- Pure refactor, no behavior change

### Phase 3: API Layer (When Backend is Ready)

**Step 9 — API client** (`src/lib/api.ts`)
**Step 10 — Data fetching hooks** (`src/hooks/useApi.ts`)
**Step 11 — Replace data imports with API fetches in each portal**
**Step 12 — Replace AuthProvider localStorage with API auth**
**Step 13 — Replace CartProvider localStorage with API cart**
**Step 14 — Replace AdminProvider mock data with API calls**

---

## 6. Key Files to Modify

| File | What Changes |
|------|-------------|
| `src/App.tsx` | Add react-router-dom, admin routes, AdminProvider |
| `src/hooks/useAuth.ts` | Add `role` to User interface |
| `src/components/AuthProvider.tsx` | Set role on demo user; later replace localStorage with API |
| `src/components/CartProvider.tsx` | Later replace localStorage with API |
| `src/components/portals/SolarAuditPortal.tsx` | Extract 9 data arrays (52 products + 10 packages) |
| `src/components/portals/TransportPortal.tsx` | Extract 2 data arrays (5 vehicles + 5 zones) |
| `src/components/portals/GroceriesPortal.tsx` | Extract 4 data arrays (85 products) |
| `src/components/portals/HealthPortal.tsx` | Extract 3 data arrays (27 items) |
| `src/components/portals/EventsPortal.tsx` | Extract 4 data arrays + 1 inline (24 items) |
| `src/components/portals/CommunityPortal.tsx` | Extract 2 data arrays + 5 inline lists (52 options) |
| `src/components/portals/LogisticsPortal.tsx` | Extract 1 inline list (6 stores) |
| `src/components/MembershipLedger.tsx` | Extract tiers array (deduplicate with MembershipPanel) |
| `src/components/dashboard/MembershipPanel.tsx` | Extract tiers array (authoritative with usage tracking) |
| `src/components/ServiceCategories.tsx` | Extract categories array (6 items) |
| `src/components/dashboard/NewOrderPanel.tsx` | Extract services array (7 items) |

---

## 7. Verification

After each phase:

1. **Phase 1 (Admin UI)**: Navigate to `/admin` in browser. Verify all 10 admin pages render with mock data. Verify DataTable sorting/filtering works. Verify product add/edit modal opens and saves to mock state. Verify the user dashboard still works unchanged at the root URL.

2. **Phase 2 (Data Extraction)**: Run `npm run build` — zero TypeScript errors. Verify all 7 portals render identically (no visual change). Verify all product prices, images, and names match before/after.

3. **Phase 3 (API Integration)**: Test each portal loads data from API. Test cart operations persist server-side. Test admin CRUD operations work end-to-end. Test auth flow with real OTP.
