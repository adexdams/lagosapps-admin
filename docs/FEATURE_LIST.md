# LagosApps Admin Dashboard — Complete Feature List

A comprehensive list of every feature and action available in the admin dashboard, organized by page.

---

## Table of Contents

- [Overview / Dashboard Home](#overview--dashboard-home)
- [Users](#users)
- [User Detail](#user-detail)
- [Orders](#orders)
- [Order Detail](#order-detail)
- [Create Order (Admin)](#create-order-admin)
- [Fulfillment](#fulfillment)
- [Fulfillment Detail — Order](#fulfillment-detail--order)
- [Fulfillment Detail — Service Request](#fulfillment-detail--service-request)
- [Inventory](#inventory)
- [Inventory — Per Portal](#inventory--per-portal)
- [Product Form (Add/Edit)](#product-form-addedit-modal)
- [Membership](#membership)
- [Membership Tier Configuration](#membership-tier-configuration)
- [Wallet](#wallet)
- [Finance](#finance)
- [Referrals](#referrals)
- [Broadcast (Notification List)](#broadcast-notification-list)
- [Broadcast Compose](#broadcast-compose)
- [Broadcast Detail](#broadcast-detail)
- [Live Carts](#live-carts)
- [Analytics](#analytics)
- [Team](#team)
- [Audit Log](#audit-log)
- [Settings](#settings)
- [Cross-Cutting Features](#cross-cutting-features)

---

## Overview / Dashboard Home

- View total users count with weekly trend
- View month-to-date revenue with daily trend
- View active orders count with pending payment count
- View active members count with retention rate
- View 5 most recent orders (order ID, user, service, amount, status)
- "View Analytics" link card directing to the Analytics page for revenue breakdowns and trends
- Quick action: Add Product
- Quick action: Send Broadcast
- Quick action: Adjust Wallet
- Quick action: Export Data

---

## Users

- View all users in a searchable, sortable, paginated table
- Search users by name, email, or phone
- Filter users by membership tier (None, Bronze, Silver, Gold)
- Filter users by status (Active, Inactive)
- View user avatar, email, tier, wallet balance, order count, join date
- Click any user to open their detail page

---

## User Detail

- View full profile (avatar, name, phone, email, tier badge, join date)
- View quick stats: wallet balance, total orders, total spent, referral code, last active date
- View order history (last 10 orders with ID, service, amount, status, date)
- View wallet transaction history (last 10 with description, type, amount)
- View referrals made by this user
- Adjust user's wallet balance (credit or debit)
- Change user's membership tier
- Suspend or reactivate user account
- View user's current cart contents, quantities, and total value
- View user's membership benefit usage with progress bars per benefit
- Reset individual benefit usage counters (admin override, logged to audit)
- View user's notification inbox with read/unread status
- Mark individual notifications as read/unread for the user
- Delete a notification from the user's inbox
- Filter user's notifications by type (Order, Wallet, Membership, System, Broadcast)

---

## Orders

- View all orders in a searchable, sortable, paginated table
- Search orders by order ID or customer name
- Filter by status (Pending, Confirmed, Processing, Completed, Cancelled)
- Filter by portal (Solar, Transport, Groceries, Health, Events, Community, Logistics)
- Select multiple orders for bulk actions
- Bulk mark orders as Completed
- Bulk mark orders as Processing
- Bulk cancel orders
- Click any order to open its detail page
- Navigate to Create Order page

---

## Order Detail

- View order header (order ID, portal, date, amount, status)
- Change order status via dropdown (Pending → Confirmed → Processing → Completed / Cancelled)
- View order items (product name, category, unit price, quantity, total)
- View payment breakdown (subtotal, membership discount, wallet deduction, Paystack amount, reference)
- View order timeline (Order Placed → Confirmed → Processing → Completed)
- Add custom timeline steps
- Issue a refund (enter amount and reason)
- Contact customer (pre-fills a notification)
- View customer info card with link to their profile

---

## Create Order (Admin)

- Step 1 — Select order channel (WhatsApp, Phone, Walk-in)
- Step 1 — Search and select customer by name or phone
- Step 2 — Browse products by portal tab (all 7 portals)
- Step 2 — Add products to cart
- Step 2 — Adjust item quantities (increase, decrease, remove)
- Step 2 — View running subtotal
- Step 3 — Review order summary (customer, items, totals)
- Step 3 — Select payment method (Wallet, Card, Bank Transfer)
- Step 3 — Add admin notes
- Step 3 — Submit order

---

## Fulfillment

A unified work management page with 3 tabs for all assigned tasks.

### Order Fulfillment Tab

- View 4 stat cards: Total Active, On Track, At Risk, Behind
- View unassigned orders as horizontal scrollable card list
- Assign unassigned orders to team members via dropdown
- View fulfillment table (order ID, customer, portal, assigned team member, status, due date)
- Status indicators: green (on track), orange (at risk), red (behind)
- Click any order to open fulfillment detail

### Service Requests Tab

- View 4 stat cards: Total Requests, New (awaiting review), Scheduled, Overdue
- View all service requests in a searchable, filterable table (request ID, customer, portal, type, assigned, date, status)
- Search by customer name, request ID, or type
- Filter by portal (Solar, Health, Events, Community, Logistics) and status (New, Reviewing, Scheduled, In Progress, Completed, Declined)
- Request types by portal:
  - Solar: Free Audit, Installation, Maintenance
  - Health: Home Visit, Free Health Check Booking, Wellness Consultation
  - Events: Venue Booking, Training Room Booking, Event Coverage Request
  - Community: Volunteer Application, Sponsorship Submission, Donation
  - Logistics: Forwarding Request
- Click any request to open its detail view

### Custom Orders Tab

- View 3 stat cards: Total Requests, Awaiting Review, Converted to Orders
- View all freeform/custom submissions as expandable cards (ID, customer, portal, date, status)
- Filter by status (New, Under Review, Converted, Declined)
- Expand to see full customer description, internal notes, decline reason
- Convert a custom request to a real order (navigates to Create Order)
- Decline a request with a reason
- View customer profile

---

## Fulfillment Detail — Order

- View order summary card (order ID, portal, product, amount, customer, status)
- View order timeline (Order Placed → Confirmed → In Fulfillment → Completed)
- View internal notes from team members
- Add new internal notes
- Reassign order to a different team member
- Set response deadline
- Set fulfillment deadline
- Set priority level (Low, Medium, High)
- View risk level indicator (on track / at risk / behind)
- Update fulfillment progress (0–100% slider)

---

## Fulfillment Detail — Service Request

- View request summary card (request ID, portal badge, type, submitted date, status)
- View all fields the user submitted (varies by request type):
  - Solar Audit: building type, address, preferred date
  - Health Home Visit: address, date, number of people, symptoms
  - Event Venue Booking: venue name, event date, expected guests, event type
  - Volunteer: area of interest, availability, details
  - Sponsorship: type, amount, frequency
  - Logistics Forwarding: store, item description, tracking number, Lagos address
- View customer card with link to profile
- Assign or reassign to a team member
- Change status through workflow (New → Reviewing → Scheduled → In Progress → Completed)
- Add internal notes between team members
- View status timeline
- Decline with a reason
- Convert to order (navigates to Create Order)

---

## Inventory

- Tab bar to switch between 7 service portals
- Each portal loads its own product grid

---

## Inventory — Per Portal

- View products as grid cards (image, name, price, stock status, active/inactive)
- Filter products by category (categories vary per portal)
- Add a new product
- Click any product to edit
- Per-portal sub-structures:
  - **Solar**: Products, Packages (pre-built kits), Building Types (with Gel vs Lithium pricing)
  - **Transport**: Vehicle types with zone-based pricing matrix (Mainland, Island, Outskirts, Abeokuta, Ibadan)
  - **Groceries**: Sub-categories (Drinks, Cereals, Snacks, Canned, Staples, Household)
  - **Health**: Services, Medical Tests (14+ test types), Supplies
  - **Events**: Venues (with capacity, amenities), Coverage Services (Photography, DJ, MC, Catering, Decoration), Event Types
  - **Community**: Impact Areas, Courses, Sponsorships, Donations, Volunteer Areas
  - **Logistics**: Supported stores list

---

## Product Form (Add/Edit Modal)

- Upload product image (drag-and-drop + URL input with preview)
- Enter product name
- Enter product description
- Set price (in Naira)
- Select category from dropdown
- Set stock quantity
- Set low stock threshold
- View computed stock status (In Stock / Low Stock / Out of Stock)
- Toggle product active/inactive
- Portal-specific fields:
  - Solar: Wattage, Brand, Battery Type
  - Transport: Pickup hours, 5 zone prices, note
  - Groceries: Subcategory
  - Health: Coming Soon toggle
  - Events: Capacity, Location, Amenities, Categories

---

## Membership

### Subscriptions Tab

- View 3 stat cards: Active Subscriptions, Total Revenue, Retention Rate
- View all subscriptions in a filterable table (user, tier, billing amount, start date, expiration, status)
- Filter by tier (Bronze, Silver, Gold)
- Filter by status (Active, Expired, Cancelled)
- Extend a subscription
- Cancel a subscription
- View linked user profile
- Navigate to Tier Configuration page

### Benefit Usage Tab

- View 3 aggregate stat cards: Most Used Benefit, Least Used Benefit, Users at Limit
- View benefit usage table (benefit name, tier(s), limit, total usage this period, % of members who used it, % at limit)
- Click any benefit row to see which users consumed it and how much

---

## Membership Tier Configuration

- View 3 tier cards side by side (Bronze, Silver, Gold)
- Edit annual price per tier
- Edit quarterly price per tier
- View benefits list per tier
- Edit benefit name, measurement type, value, and period
- Add new benefits to a tier
- Remove benefits from a tier
- Save changes per tier

---

## Wallet

- View 3 stat cards: Total Balance (all users), Total Credits, Total Debits
- Expand/collapse manual wallet adjustment form
- Search and select a user for adjustment
- Enter adjustment amount
- Select Credit or Debit
- Enter reason for adjustment (required)
- Process adjustment (with confirmation)
- View all wallet transactions in a filterable table (ID, user, description, type, amount, balance after, date)
- Filter by transaction type (Credit, Debit)

---

## Finance

### Overview Tab

- View 4 stat cards: Total Revenue, Net Income, Success Rate, Avg Transaction Value
- View revenue trend chart (last 14 days)
- View payment channel breakdown (Card, Bank Transfer, USSD, Wallet) with percentages
- View wallet activity summary (credits, debits, net flow, fee rate)

### Transactions Tab

- View all Paystack transactions in a searchable/filterable table
- Columns: reference, customer, amount, fee, channel, status, date
- Filter by transaction status (Success, Failed, Pending, Reversed)
- Filter by payment channel (Card, Bank Transfer, USSD, Wallet)

### Settlements Tab

- View 3 stat cards: Total Settled, Pending Payout, Total Fees Paid
- View settlement batches table (ID, transaction count, gross, fees, net, status, date)

### Reports Tab

- Select report type and date range
- Generate custom reports
- 6 quick report cards: Monthly Revenue, Transaction Audit, Fee Analysis, Failed Payments, Wallet Report, Settlement History

---

## Referrals

- View 3 stat cards: Total Referrals, Active/Completed, Expired
- Generate referral code by tier
- Copy generated referral code
- View all referrals in a searchable/filterable table (referrer, referred person, reward, dates, status)
- Filter by referral status (Pending, Confirmed, Paid, Expired)

---

## Broadcast (Notification List)

- View all sent broadcasts in a searchable table (title, type badge, read status, date)
- Filter by notification type (Order, Wallet, Membership, System)
- Filter by status: Sent, Retracted, Draft
- Navigate to compose a new broadcast
- Click any broadcast to view its detail

---

## Broadcast Compose

- Select recipients: All Users, By Tier (Bronze/Silver/Gold checkboxes), or Specific User (search dropdown)
- Select notification type: Info, Promo, Alert, Update (color-coded pills)
- Enter notification title
- Enter message body (max 500 characters)
- Upload optional image attachment with preview
- View live preview of how notification will appear
- Send broadcast
- Save broadcast as draft

---

## Broadcast Detail

- View broadcast content (title, type badge, full message)
- View delivery stats (read rate progress bar with percentages)
- View configuration (recipients, sent by, date, type)
- View audience breakdown (delivered, bounced, pending counts)
- Retract a sent broadcast (hides from unread inboxes, marks as retracted)
- Resend a broadcast (opens Broadcast Compose pre-filled with original content)
- Delete a retracted broadcast from the sent log

---

## Live Carts

- View 4 stat cards: Active Carts, Abandoned (idle 24h+), Avg Cart Value, Total Carts
- Two tabs: Active Carts | Abandoned Carts
- **Active Carts table**: customer name, items count, cart value (₦), portals represented (color dots), last updated (relative time)
- **Abandoned Carts table**: same columns plus abandoned-since date and "Send Reminder" action
- Click any cart to expand full item breakdown (products, quantities, prices, grouped by portal)
- Send a reminder notification to users with abandoned carts
- View the customer's profile from the cart
- Cart detail shows: customer info, items grouped by portal, subtotal, created date, last updated date

---

## Analytics

- View 4 stat cards: Total Revenue, Total Users, Active Members, Average Order Value
- View revenue by portal breakdown (horizontal bar chart with percentages)
- View monthly revenue trend (last 6 months bar chart)
- View orders by status breakdown (horizontal bar chart with percentages)
- View transaction volume split (credit vs debit donut/pie chart)

---

## Team

- View 4 role overview cards: Super Admin, Operations, Support, Finance (with descriptions)
- Expand/collapse new team member form
- Add team member: name, email, phone, role
- View team table (name, role, status, last active, privilege count)
- Change a member's role via dropdown
- Toggle member status (Active / Inactive)
- Open privileges modal for any member
- **Privileges modal (22 permissions across 4 groups)**:
  - Users & Orders (7): view users, edit users, deactivate users, view orders, create orders, update order status, issue refunds
  - Inventory & Products (4): view inventory, add/edit products, remove products, manage stock levels
  - Finance & Wallet (4): view transactions, manual wallet adjustments, view analytics/reports, export data
  - Communication & System (7): view broadcasts, send broadcasts, view memberships, configure tiers, view settings, edit platform settings, manage team members
- Save or cancel privilege changes

---

## Audit Log

- View all admin actions in a searchable, filterable table (timestamp, admin name, action type, entity/target)
- Filter by action category (User, Order, Product, Wallet, Membership, Notification, Settings, Inventory, Portal, Referral, Export, Team, Subscription)
- Expand any row to see full details: description, IP address, entry ID, old → new values
- 20+ tracked action types with distinct color coding

---

## Settings

- **Your Profile**: Upload avatar (with camera overlay), edit display name, view email
- **Platform Settings**: Edit site name, support email, support phone, WhatsApp number
- **Service Portal Toggles**: Enable/disable each of the 7 portals (Solar, Transport, Groceries, Health, Events, Community, Logistics) with colored indicators
- **Payment Settings**: Edit Paystack public key (masked input), toggle Test Mode on/off

---

## Cross-Cutting Features

These span multiple pages throughout the dashboard:

- Sidebar navigation with 15 sections + mobile hamburger menu
- Top bar with page title, global search, and notification panel
- Toast notifications for all admin actions (success/error feedback)
- Responsive design — all pages work on desktop and mobile
- Data tables with sorting, pagination (10 items per page), and row click navigation
- Status badges with color coding across all entity types
- Export buttons on most table views
- Audit trail — every admin action is logged automatically

---

**Total: ~200+ distinct features and actions across 15 main pages and their sub-views.**
