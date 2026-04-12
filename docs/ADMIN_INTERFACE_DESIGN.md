# LagosApps Admin Interface — Detailed Design Document

## Context

This document describes the complete admin dashboard interface for LagosApps. The admin interface allows the business team to manage users, orders, inventory, payments, memberships, referrals, and analytics across all 7 service portals. It will be built as frontend components first (with mock data), then connected to real APIs when the backend is ready.

The admin dashboard reuses the same React + Tailwind stack, UI components (Button, Modal, Toast), and design conventions as the user-facing app. It lives at `/admin/*` routes using `react-router-dom`.

---

## 1. Architecture

### 1.1 Routing

```
/admin                  → AdminOverview
/admin/users            → UsersPage
/admin/users/:id        → UserDetail
/admin/orders           → OrdersPage
/admin/orders/:id       → OrderDetailAdmin
/admin/inventory        → InventoryPage
/admin/inventory/:portal → InventoryPortal (filtered by portal)
/admin/membership       → MembershipAdmin
/admin/wallet           → WalletAdmin
/admin/referrals        → ReferralsAdmin
/admin/notifications    → NotificationsAdmin
/admin/analytics        → AnalyticsPage
/admin/audit            → AuditLog
/admin/settings         → SettingsPage
```

### 1.2 Provider Stack

```
<BrowserRouter>
  <ToastProvider>
    <AuthProvider>
      <CartProvider>
        <AdminProvider>   ← NEW: mock data + admin CRUD operations
          <Routes>
            <Route path="/" element={<AppContent />} />
            <Route path="/admin/*" element={<AdminRoute><AdminLayout /></AdminRoute>} />
          </Routes>
        </AdminProvider>
      </CartProvider>
    </AuthProvider>
  </ToastProvider>
</BrowserRouter>
```

### 1.3 File Structure

```
src/
  components/
    admin/
      AdminLayout.tsx            ← Shell: sidebar + topbar + content
      AdminRoute.tsx             ← Auth guard (role check)
      AdminOverview.tsx          ← Dashboard home
      UsersPage.tsx              ← Users table
      UserDetail.tsx             ← Single user view
      OrdersPage.tsx             ← Orders table + management
      OrderDetailAdmin.tsx       ← Single order with admin actions
      InventoryPage.tsx          ← Portal-tabbed product management
      InventoryPortal.tsx        ← Per-portal product grid
      ProductForm.tsx            ← Add/edit product modal
      MembershipAdmin.tsx        ← Tiers + subscriptions
      WalletAdmin.tsx            ← All transactions
      ReferralsAdmin.tsx         ← Referral tracking
      NotificationsAdmin.tsx     ← Broadcast messaging
      AnalyticsPage.tsx          ← Charts + reports
      AuditLog.tsx               ← Admin action history
      SettingsPage.tsx           ← Platform settings
      shared/
        DataTable.tsx            ← Reusable table component
        StatCard.tsx             ← Metric display card
        AdminBreadcrumb.tsx      ← Breadcrumb navigation
        BarChart.tsx             ← CSS bar chart
        PieChart.tsx             ← CSS pie chart
        StatusBadge.tsx          ← Colored status pill
        FilterBar.tsx            ← Search + filters
        EmptyState.tsx           ← Reusable empty state
  data/
    adminMockData.ts             ← 50 users, 100 orders, etc.
  hooks/
    useAdmin.ts                  ← Admin context + hook
  components/
    AdminProvider.tsx             ← Admin state management
```

---

## 2. Admin Layout

### 2.1 Desktop Layout

```
┌──────────────────────────────────────────────────────┐
│  TOPBAR: Logo | Search | Admin name + avatar | Logout│
├────────────┬─────────────────────────────────────────┤
│            │                                         │
│  SIDEBAR   │         MAIN CONTENT                    │
│  240px     │         (scrollable)                    │
│            │                                         │
│  Overview  │   Breadcrumb: Admin > Users             │
│  Users     │                                         │
│  Orders    │   [Page content here]                   │
│  Inventory │                                         │
│  Membership│                                         │
│  Wallet    │                                         │
│  Referrals │                                         │
│  Notify    │                                         │
│  Analytics │                                         │
│  Audit Log │                                         │
│  Settings  │                                         │
│            │                                         │
├────────────┴─────────────────────────────────────────┤
```

**Topbar** (56px height):
- Left: LagosApps logo (`h-8 w-auto`) + "Admin" badge (small green pill)
- Center: Global search input (`max-w-md`, searches users/orders/products)
- Right: Admin name, avatar circle (32px), notification bell, logout icon

**Sidebar** (240px width):
- Background: `bg-[#0A2540]` (Paystack navy — distinguishes admin from user dashboard)
- Text: white/white-70 for labels
- Active item: `bg-white/10 text-white font-bold` with left 3px accent bar
- Hover: `bg-white/5`
- Icons: Material Symbols, 20px, `text-white/70`
- Sections separated by subtle `border-t border-white/10`
- Bottom: "Back to Site" link that returns to `/`

**Sidebar items:**

| Icon | Label | Route | Badge |
|------|-------|-------|-------|
| dashboard | Overview | /admin | — |
| group | Users | /admin/users | total count |
| receipt_long | Orders | /admin/orders | pending count |
| inventory_2 | Inventory | /admin/inventory | — |
| card_membership | Membership | /admin/membership | active count |
| account_balance_wallet | Wallet | /admin/wallet | — |
| group_add | Referrals | /admin/referrals | — |
| campaign | Notifications | /admin/notifications | — |
| analytics | Analytics | /admin/analytics | — |
| history | Audit Log | /admin/audit | — |
| settings | Settings | /admin/settings | — |

### 2.2 Mobile Layout

- Sidebar collapses to hamburger menu (slide-out from left, dark navy)
- Topbar shrinks: logo + hamburger + avatar only
- Search moves into a dedicated expandable row
- No bottom tab bar (admin is desktop-primary, mobile is secondary)

---

## 3. Page Designs

### 3.1 Admin Overview (`/admin`)

**Layout:** 3 rows

**Row 1: Stat Cards** (grid-cols-2 md:grid-cols-4)

| Card | Value | Icon | Color | Trend |
|------|-------|------|-------|-------|
| Total Users | 1,247 | group | #0D47A1 | +12 this week |
| Revenue (MTD) | ₦4.8M | payments | #1B5E20 | +₦320K today |
| Active Orders | 23 | receipt_long | #E65100 | 5 pending payment |
| Active Members | 412 | card_membership | #4A148C | 89% retention |

Card design:
- `bg-white rounded-2xl p-5 border border-outline-variant/10`
- Icon in 44px tinted container (color + "12")
- Value: `text-2xl font-extrabold text-on-surface`
- Label: `text-sm text-on-surface-variant`
- Trend: small text below, green (up) or red (down) with arrow icon

**Row 2: Recent Activity** (grid-cols-1 lg:grid-cols-2)

Left: **Recent Orders** (table, 5 rows)
- Columns: Order ID, User, Service, Amount, Status, Date
- Each row clickable → navigates to order detail
- "View All" link to /admin/orders

Right: **Revenue by Portal** (horizontal bar chart)
- 7 bars, one per service portal, colored by portal color
- Label + value on each bar
- Sorted by revenue descending

**Row 3: Quick Actions** (grid-cols-2 md:grid-cols-4)

| Button | Icon | Action |
|--------|------|--------|
| Add Product | add_circle | Opens product form modal |
| Broadcast | campaign | Opens notification form |
| Adjust Wallet | add_card | Opens wallet adjustment modal |
| Export Data | download | Downloads CSV of orders |

---

### 3.2 Users Page (`/admin/users`)

**FilterBar:**
- Search: text input (searches name, phone, email)
- Membership filter: dropdown (All, None, Bronze, Silver, Gold)
- Status filter: dropdown (All, Active, Inactive)
- Date range: from/to date pickers
- "Export" button (CSV download)

**DataTable columns:**

| Column | Width | Sortable | Content |
|--------|-------|----------|---------|
| User | 30% | Yes (name) | Avatar circle (32px) + name + phone below |
| Email | 20% | Yes | Email text, truncated |
| Membership | 12% | Yes | StatusBadge: Bronze/Silver/Gold/None, tier color |
| Wallet | 12% | Yes | ₦ formatted, right-aligned |
| Orders | 8% | Yes | Count number |
| Joined | 10% | Yes | Date formatted |
| Actions | 8% | No | 3-dot menu → View, Edit, Deactivate |

**Table styling:**
- Header: `bg-surface-container-low text-sm font-bold text-on-surface-variant uppercase tracking-wider`
- Rows: `bg-white hover:bg-surface-container/50`, border-bottom `border-outline-variant/8`
- Alternating row tint on even rows: `bg-surface-container-lowest`
- Pagination: "Showing 1-20 of 1,247" + prev/next buttons + page numbers

**Empty state:** Centered icon + "No users found matching your filters"

---

### 3.3 User Detail (`/admin/users/:id`)

**Layout:** Back button + 2-column on desktop

**Left column (60%):**

**Profile Card:**
- Large avatar (80px) or initials circle
- Name (h2), phone, email
- StatusBadge for membership tier
- "Since Mar 2026" join date
- Action buttons: "Edit Profile", "Adjust Wallet", "Deactivate"

**Order History:**
- Compact table: ID, Service, Amount, Status, Date (last 10)
- "View All Orders" link filtered to this user

**Wallet Transactions:**
- Compact table: Date, Description, Type badge (credit/debit), Amount
- Last 10 transactions
- Current balance displayed prominently

**Right column (40%):**

**Quick Stats Card:**
- Total orders: count
- Total spent: ₦ amount
- Wallet balance: ₦ amount
- Referrals made: count
- Member since: date

**Membership History:**
- Timeline of membership changes (subscribed, upgraded, downgraded)
- Current tier highlighted

**Referrals:**
- List of people referred: name, tier, status, date

---

### 3.4 Orders Page (`/admin/orders`)

**FilterBar:**
- Search: order ID or user name
- Status: All, Pending, Confirmed, Processing, Completed, Cancelled
- Service Portal: All, Solar, Transport, Groceries, Health, Events, Community, Logistics
- Date range: from/to
- "Export" button

**DataTable columns:**

| Column | Content |
|--------|---------|
| Order ID | ORD-XXX format, clickable |
| User | Name + avatar circle |
| Service | Portal name + colored dot |
| Items | Brief description or count |
| Amount | ₦ formatted |
| Status | StatusBadge (color-coded) |
| Date | Formatted date |
| Actions | View, Update Status, Cancel |

**Bulk Actions bar (appears when rows selected):**
- "X selected" count
- "Mark Completed", "Mark Processing", "Cancel" buttons

---

### 3.5 Order Detail Admin (`/admin/orders/:id`)

**Reuses OrderDetail.tsx pattern with admin additions:**

**Header card:** Same service-colored header with order info

**Admin actions bar** (below header):
- Status dropdown: change status (Pending → Confirmed → Processing → Completed or Cancelled)
- "Add Timeline Step" button → opens modal with label + date fields
- "Issue Refund" button → opens confirmation with amount input + reason
- "Contact User" button → opens notification compose pre-filled with user

**Order Items section:**
- Table of items: name, category, price, quantity, total, member-covered badge
- Editable: admin can adjust quantities or remove items

**Payment breakdown:**
- Subtotal, membership discount, wallet deduction, Paystack amount, reference

**Timeline section:** Same as user view, but admin can add steps

**User Info card:** Mini profile with name, phone, email, membership tier, link to full user detail

---

### 3.6 Inventory Page (`/admin/inventory`)

**Layout:** Portal tab bar at top + content below

**Portal Tab Bar:**
- Horizontal scrollable tabs: Solar | Transport | Groceries | Health | Events | Community | Logistics
- Each tab has portal color dot + name
- Active tab: solid color underline (3px)

**Content per portal:** Renders InventoryPortal component

---

### 3.7 Inventory Portal (per-portal view)

Each portal has its own inventory structure:

#### Solar Inventory
**Sub-tabs:** Products | Packages | Building Types

**Products tab:**
- Category filter: Panels, Inverters, Batteries, Controllers (as pills)
- Product grid: 2 md:3 lg:4 columns
- Each card: image (aspect-square), name, price, stock status badge, active toggle
- "Add Product" button → ProductForm modal
- Click card → ProductForm modal (edit mode)

**Packages tab:**
- Table: Name, Battery Type (Gel/Lithium badge), Capacity (KW), Price, Active toggle
- "Add Package" button
- Inline edit on price field (click to edit)

**Building Types tab:**
- Cards: Image, label, recommendation, Gel price, Lithium price
- Click to edit prices and recommendation text

#### Transport Inventory
**Vehicle Types section:**
- Cards for each vehicle: image, name, description, color dot, pickup hours
- Click to edit

**Pricing Matrix:**
- Grid/table: rows = vehicles, columns = zones
- Each cell = editable price input
- Save button per row or bulk save

#### Groceries Inventory
**Sub-tabs:** Drinks | Cereals | Snacks | Canned | Staples | Household

Each sub-tab:
- Product grid (same pattern as Solar products)
- Card: image, name, price, active toggle
- "Add Product" button

#### Health Inventory
**Sub-tabs:** Services | Medical Tests | Supplies

**Services tab:**
- List cards: icon, label, description, color, comingSoon toggle
- Click to edit

**Medical Tests tab:**
- Checklist: each test is a row with name + active toggle
- "Add Test" text input at bottom

**Supplies tab:**
- Product grid: image, name, price, active toggle

#### Events Inventory
**Sub-tabs:** Venues | Coverage Services | Event Types

**Venues tab:**
- Cards: image (large), name, location, capacity, price range, amenities list
- Click to edit all fields including amenities (tag input)

**Coverage tab:**
- List: name, icon, description, base price
- Inline editable price

**Event Types tab:**
- Tag list: each type is a pill with X to remove
- "Add Type" input at bottom

#### Community Inventory
**Sub-tabs:** Impact Areas | Courses | Sponsorships | Donations | Volunteer Areas

Each is a list of items that can be added/removed/reordered.

#### Logistics Inventory
- Supported Stores list: name, active toggle, add/remove

---

### 3.8 Product Form Modal

**Used for adding/editing products across all portals.**

**Modal size:** `md` (720px)

**Form fields:**

| Field | Type | Required |
|-------|------|----------|
| Name | text input | Yes |
| Description | textarea (3 rows) | No |
| Price | number input with ₦ prefix | Yes (if priced) |
| Image | File upload (preview + URL input) | No |
| Category | dropdown (portal-specific) | Yes |
| Portal | readonly (pre-filled) | Yes |
| Stock Status | radio: In Stock / Low Stock / Out of Stock | No |
| Active | toggle switch | Yes |
| Metadata | dynamic key-value fields (portal-specific) | No |

**Portal-specific metadata fields:**

| Portal | Extra Fields |
|--------|-------------|
| Solar | Wattage (W), Brand, Battery Type |
| Transport | Pickup Hours, Zone Pricing (5 fields), Note text |
| Groceries | Subcategory |
| Health | comingSoon toggle |
| Events | Capacity, Location, Amenities (tag input), Categories (tag input) |

**Image upload:**
- Drag-and-drop zone or click to select
- Preview thumbnail (100px)
- OR paste URL input
- Max 2MB, image files only (same validation as ProfilePanel avatar)

**Footer:** "Cancel" (secondary) + "Save" (primary) buttons

---

### 3.9 Membership Admin (`/admin/membership`)

**Layout:** 2 sections

**Section 1: Tier Configuration**

3 tier cards side by side (Bronze, Silver, Gold), each with:
- Tier icon + name (color-coded)
- Annual price: editable number input
- Quarterly price: editable number input
- Benefits list: each benefit is a row with:
  - Label (editable text)
  - Limit (number or "unlimited" toggle)
  - Period (dropdown: per month / per quarter / per year)
  - Remove button (X)
- "Add Benefit" button at bottom of each card
- "Save Changes" button per card

**Section 2: Active Subscriptions**

DataTable:

| Column | Content |
|--------|---------|
| User | Name + avatar |
| Tier | StatusBadge (colored) |
| Billing Cycle | Annual / Quarterly |
| Started | Date |
| Expires | Date |
| Status | Active / Expired / Cancelled |
| Actions | Extend, Cancel, View User |

FilterBar: tier dropdown, status dropdown, search by user name

---

### 3.10 Wallet Admin (`/admin/wallet`)

**Top Stats:** (grid-cols-3)
- Total Wallet Balance (all users): ₦XX
- Credits This Month: ₦XX
- Debits This Month: ₦XX

**Manual Adjustment Form** (collapsible):
- User search/select: type-ahead dropdown
- Amount: number input with ₦ prefix
- Type: Credit / Debit radio
- Reason: text input (required)
- "Process Adjustment" button → Confirmation modal

**Transaction Log:**
DataTable:

| Column | Content |
|--------|---------|
| Transaction ID | TXN-XXX format |
| User | Name + avatar |
| Description | Text |
| Type | Credit (green) / Debit (red) badge |
| Amount | ₦ formatted |
| Balance After | ₦ formatted |
| Date | Formatted |

FilterBar: type dropdown, date range, user search

---

### 3.11 Referrals Admin (`/admin/referrals`)

**Top Stats:** (grid-cols-3)
- Total Referrals: count
- Active: count
- Expired: count

**DataTable:**

| Column | Content |
|--------|---------|
| Referrer | Name + avatar |
| Referred | Name + avatar |
| Gifted Tier | StatusBadge (colored) |
| Created | Date |
| Expires | Date |
| Status | Active / Pending / Expired badge |

FilterBar: tier dropdown, status dropdown, date range

---

### 3.12 Notifications Admin (`/admin/notifications`)

**Layout:** 2 sections

**Section 1: Compose Notification**

Form:
- Recipients: radio (All Users / By Tier / Specific User)
  - If By Tier: tier multi-select checkboxes
  - If Specific User: user search/select
- Type: dropdown (order / wallet / membership / system)
- Title: text input
- Message: textarea (5 rows)
- "Send Notification" button → Confirmation modal showing recipient count

**Section 2: Sent Notifications Log**

DataTable:

| Column | Content |
|--------|---------|
| Title | Notification title |
| Type | Type badge (colored by type) |
| Recipients | "All Users" or "Gold Members" or "John D." |
| Sent By | Admin name |
| Date | Formatted |
| Read Rate | "124/412 (30%)" |

---

### 3.13 Analytics Page (`/admin/analytics`)

**Layout:** Dashboard grid

**Row 1: Revenue**
- **Line chart:** Revenue over last 12 months (CSS-based: bars at different heights with connecting lines implied)
- **Breakdown table:** Revenue by portal (name, amount, %, change from last month)

**Row 2: Users**
- **Bar chart:** New signups per month (last 6 months)
- **Pie chart:** Membership distribution (None / Bronze / Silver / Gold)

**Row 3: Orders**
- **Bar chart:** Orders by service portal (colored by portal)
- **Stats:** Avg order value, completion rate, most popular service

**Row 4: Engagement**
- **Cards:** Cart abandonment rate, avg items per cart, wallet top-up frequency
- **Table:** Top 10 most ordered products (name, portal, times ordered)

**Chart implementation:** CSS-based (no external library):
- Bar charts: `div` elements with percentage-width, colored backgrounds, labels
- Pie chart: CSS conic-gradient on a circle
- Values and labels rendered as HTML, not canvas

---

### 3.14 Audit Log (`/admin/audit`)

**DataTable:**

| Column | Content |
|--------|---------|
| Timestamp | Full date + time |
| Admin | Name who performed action |
| Action | "product.create", "order.status_change", etc. |
| Entity | "Product: Solar Panel 650W" or "Order: ORD-042" |
| Details | Expandable: shows old → new values |

FilterBar: admin user dropdown, action type dropdown, entity type dropdown, date range

**Action types:**
- product.create, product.update, product.delete
- order.status_change, order.cancel, order.refund
- user.deactivate, user.wallet_adjust, user.membership_change
- membership.tier_update, membership.benefit_update
- notification.broadcast
- settings.update

---

### 3.15 Settings Page (`/admin/settings`)

**Sections:**

**Platform Settings:**
- Site name (text)
- Support email (text)
- Support phone (text)
- WhatsApp number (text)

**Service Portal Toggles:**
- Each portal: name + active/inactive toggle
- Disabled portals hidden from user dashboard

**Payment Settings:**
- Paystack public key (masked text)
- Test mode toggle

---

## 4. Shared Components

### 4.1 DataTable

```tsx
interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchable?: boolean;
  searchPlaceholder?: string;
  paginated?: boolean;
  pageSize?: number;
  selectable?: boolean;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  actions?: (row: T) => ReactNode;
}

interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  render?: (value: unknown, row: T) => ReactNode;
  hideOnMobile?: boolean;
}
```

**Styling:**
- Container: `bg-white rounded-2xl border border-outline-variant/10 overflow-hidden`
- Header row: `bg-surface-container-low px-4 py-3`, sticky top
- Header cells: `text-xs font-bold text-on-surface-variant uppercase tracking-wider`
- Sort indicator: chevron icon beside sorted column
- Body rows: `px-4 py-3 border-b border-outline-variant/8 hover:bg-surface-container/30 cursor-pointer`
- Selected row: `bg-primary/5`
- Pagination bar: `px-4 py-3 flex justify-between items-center border-t`

### 4.2 StatCard

```tsx
interface StatCardProps {
  label: string;
  value: string;
  icon: string;
  color: string;
  trend?: { value: string; positive: boolean };
  onClick?: () => void;
}
```

### 4.3 StatusBadge

```tsx
interface StatusBadgeProps {
  status: string;
  variant?: "default" | "membership" | "order" | "referral";
}
```

Color mapping:
- completed/active/paid: `bg-primary/10 text-primary`
- pending/processing: `bg-[#E65100]/10 text-[#E65100]`
- cancelled/expired/inactive: `bg-error/10 text-error`
- bronze: `bg-[#8D6E63]/10 text-[#8D6E63]`
- silver: `bg-[#78909C]/10 text-[#78909C]`
- gold: `bg-[#F9A825]/10 text-[#F9A825]`

### 4.4 FilterBar

```tsx
interface FilterBarProps {
  onSearch: (query: string) => void;
  searchPlaceholder?: string;
  filters: FilterConfig[];
  onExport?: () => void;
}

interface FilterConfig {
  key: string;
  label: string;
  type: "select" | "date" | "daterange";
  options?: { label: string; value: string }[];
  onChange: (value: string) => void;
}
```

### 4.5 EmptyState

```tsx
interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}
```

---

## 5. Mock Data Requirements

File: `src/data/adminMockData.ts`

| Data | Count | Key Fields |
|------|-------|-----------|
| Users | 50 | Varied tiers, balances, join dates |
| Orders | 100 | All portals, all statuses, timelines |
| Wallet Transactions | 200 | Credits + debits, varied amounts |
| Referrals | 30 | All tiers, active/expired/pending |
| Notifications (sent) | 20 | All types, varied read rates |
| Audit Log entries | 50 | All action types |
| Membership Subscriptions | 40 | All tiers, billing cycles, statuses |

Generate functions follow the same pattern as `generateDemoOrders()` in `useAuth.ts`.

---

## 6. Implementation Order

| Phase | Files | Description |
|-------|-------|-------------|
| 1 | AdminLayout, AdminRoute, AdminProvider, adminMockData | Shell + data layer |
| 2 | DataTable, StatCard, StatusBadge, FilterBar, EmptyState | Shared components |
| 3 | AdminOverview | Dashboard home with stats + charts |
| 4 | UsersPage + UserDetail | User management |
| 5 | OrdersPage + OrderDetailAdmin | Order management |
| 6 | InventoryPage + InventoryPortal + ProductForm | Product CRUD (largest page) |
| 7 | MembershipAdmin | Tier config + subscriptions |
| 8 | WalletAdmin | Transaction log + adjustments |
| 9 | ReferralsAdmin | Referral tracking |
| 10 | NotificationsAdmin | Broadcast + log |
| 11 | AnalyticsPage | Charts + reports |
| 12 | AuditLog | Action history |
| 13 | SettingsPage | Platform config |

---

## 7. Verification

After implementation:

1. Navigate to `/admin` — verify overview renders with stats and charts
2. Click through every sidebar item — each page should render with mock data
3. DataTable: test sorting (click headers), searching, pagination, row click
4. Inventory: switch between portal tabs, open product form, save mock product
5. Orders: filter by status, click order, change status, add timeline step
6. Users: search, filter by tier, click user, view detail tabs
7. Membership: edit tier pricing, toggle benefits, view subscriptions
8. Wallet: view transactions, process manual adjustment
9. Notifications: compose and "send" a broadcast
10. Analytics: verify all charts render with mock data
11. Responsive: check mobile hamburger menu, stacked layouts, hidden columns
12. Run `npm run build` — zero TypeScript errors
