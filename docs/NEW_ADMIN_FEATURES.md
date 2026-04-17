# New Admin Features — Scope & Implementation Plan

This document covers 5 new feature groups being added to the admin dashboard. These features give the admin full visibility and control over user-side activities that currently have no admin counterpart.

---

## Table of Contents

- [1. Service Requests](#1-service-requests)
- [2. Custom Orders](#2-custom-orders)
- [3. Cart Visibility](#3-cart-visibility)
- [4. Membership Benefit Usage](#4-membership-benefit-usage)
- [5. Notification Management](#5-notification-management)
- [Implementation Order](#implementation-order)
- [Summary of Changes](#summary-of-changes)

---

## 1. Service Requests

**What it solves:** Users submit service requests across multiple portals (Solar audits, Health home visits, Event venue bookings, etc.) but the admin dashboard has no way to see, manage, or respond to these submissions. This is the biggest visibility gap.

### New Page: Service Requests (`/requests`)

A new sidebar item and page that acts as a unified queue for all non-order service submissions.

### What the admin sees

- **4 stat cards**: Total Requests, New (unreviewed), Scheduled, Overdue
- **Filterable table** of all service requests with columns:
  - Request ID (REQ-XXX)
  - Customer name
  - Portal (color-coded badge)
  - Request type (e.g., Solar Audit, Home Visit, Venue Booking)
  - Submitted date
  - Assigned team member
  - Status badge
- **Filters**: portal, request type, status, assigned team member, date range
- **Search**: by customer name or request ID

### Request types by portal

| Portal | Request Types |
|--------|--------------|
| **Solar** | Free Audit, Installation, Maintenance |
| **Transport** | Vehicle Booking (already handled as orders — no change needed) |
| **Groceries** | Custom Request ("tell us what you need") — handled in Custom Orders below |
| **Health** | Home Visit, Free Health Check Booking, Wellness Consultation |
| **Events** | Venue Booking, Training Room Booking, Event Coverage Request |
| **Community** | Volunteer Application, Sponsorship Submission, Donation (with tracking) |
| **Logistics** | Forwarding Request (store + tracking number + delivery address) |

### Status workflow

```
New → Reviewing → Scheduled → In Progress → Completed
                → Declined (with reason)
```

### What the admin can do

- View all incoming service requests in one place
- Filter and search across all portals or drill into one
- Click any request to open its detail view
- Assign a request to a team member
- Change request status through the workflow
- Decline a request with a reason (visible to user)
- Add internal notes to a request
- View customer profile from the request
- Contact the customer (pre-fills a notification)

### Request Detail Page (`/requests/:id`)

- **Request summary card**: request ID, portal badge, type, submitted date, customer info
- **Request details section**: all fields the user submitted (varies by type):
  - Solar Audit: building type, address, preferred date
  - Health Home Visit: address, date, number of people, symptoms
  - Event Venue Booking: venue name, event date, expected guests, event type
  - Volunteer: area of interest, availability, details
  - Sponsorship: type, amount, frequency
  - Logistics Forwarding: store, item description, tracking number, Lagos address
- **Assignment dropdown**: assign to a team member
- **Status dropdown**: advance through the workflow
- **Internal notes section**: add/view notes between team members
- **Timeline**: status history (who changed what, when)
- **Actions**: Decline (with reason), Contact Customer, Convert to Order (where applicable)

---

## 2. Custom Orders

**What it solves:** Users can submit freeform requests in Groceries ("Or tell us what you need") and Logistics (item descriptions). These are not standard product orders — they need admin review before becoming real orders. Currently they go nowhere.

### New Tab: Custom Requests (added to existing Orders page)

A new tab on the Orders page alongside the existing orders table. This keeps all order-related activity in one place.

### What the admin sees

- **Tab bar** at the top of Orders page: **All Orders** | **Custom Requests**
- **3 stat cards** on the Custom Requests tab: Total Requests, Awaiting Review, Converted to Orders
- **Table** with columns:
  - Request ID (CRQ-XXX)
  - Customer name
  - Portal (Groceries or Logistics badge)
  - Description (truncated, expandable)
  - Submitted date
  - Status badge

### Status workflow

```
New → Under Review → Converted to Order → Declined (with reason)
```

### What the admin can do

- View all freeform/custom submissions
- Filter by portal (Groceries, Logistics) and status
- Click to view full request details
- Review the customer's freeform description
- **Convert to Order**: opens the Create Order page pre-filled with the customer and admin notes from the request
- Decline with a reason (customer gets notified)
- Contact the customer for clarification
- Add internal notes

### Custom Request Detail

- Customer info card with link to profile
- Full freeform description as submitted
- Submission date and portal
- Status controls
- "Convert to Order" button (navigates to Create Order with customer pre-selected)
- "Decline" button with reason input
- Internal notes section

---

## 3. Cart Visibility

**What it solves:** Users have active shopping carts that the admin cannot see. There is no way to identify abandoned carts, understand what users are interested in, or follow up on incomplete purchases.

### New Page: Live Carts (`/carts`)

A new sidebar item and page dedicated to cart visibility and abandoned cart tracking.

### What the admin sees

- **4 stat cards**: Active Carts, Abandoned (idle 24h+), Avg Cart Value, Cart-to-Order Conversion Rate
- **Two tabs**: **Active Carts** | **Abandoned Carts**
- **Active Carts table** with columns:
  - Customer name
  - Items count
  - Cart value (₦)
  - Portals represented (color dots for each portal in cart)
  - Last updated (relative time, e.g., "2 hours ago")
- **Abandoned Carts table** (same columns plus):
  - Abandoned since (date/time when cart went idle)
  - Action: Send Reminder (pre-fills a notification to the user)

### What the admin can do

- View all active user carts in real time
- See which carts are abandoned (idle for 24+ hours)
- Click any cart to see full item breakdown (products, quantities, prices, portals)
- Send a reminder notification to users with abandoned carts
- View the customer's profile from the cart
- See aggregate stats on cart behavior (average value, conversion rate)
- Filter by portal, cart value range, last activity

### Cart Detail (expandable row or modal)

- Customer info (name, email, tier, link to profile)
- Items grouped by portal with product name, quantity, unit price, line total
- Cart subtotal
- Membership discount (if applicable)
- Cart created date and last updated date
- "Send Reminder" button
- "View Customer" link

### User Detail Extension

Add a **Current Cart** section to the existing User Detail page:
- Show what the user currently has in their cart (if anything)
- Display items, quantities, total value
- Show when the cart was last updated
- "Empty" state if cart is empty

---

## 4. Membership Benefit Usage

**What it solves:** Users track their own benefit consumption (e.g., "3 of 5 free consultations used this month") with progress bars, but the admin cannot see any individual user's benefit usage or understand which benefits are being consumed across the platform.

### Extension to Existing Pages

This feature adds to two existing pages rather than creating a new one.

### Membership Page — New "Usage" Tab

Add a third tab to the Membership page: **Subscriptions** | **Tier Config** | **Benefit Usage**

The Benefit Usage tab shows:

- **Aggregate stat cards**: Most Used Benefit, Least Used Benefit, Users at Limit (count of users who've maxed out any benefit this period)
- **Benefit usage table** with columns:
  - Benefit name (e.g., "Free Solar Consultations")
  - Tier(s) it applies to
  - Limit (e.g., "5 per month" or "Unlimited")
  - Total usage across all members this period
  - % of members who used it
  - % of members at limit
- Click any benefit row to see which users consumed it and how much

### User Detail — New "Benefit Usage" Section

Add a **Benefit Usage** section below the existing Membership info in User Detail:

- Show only if the user has an active membership
- Display each benefit as a segmented progress bar (matching what the user sees on their dashboard):
  - Benefit name
  - Usage: "3 of 5 used" or "Unlimited"
  - Visual progress bar (green when under limit, orange when near limit, red when at limit)
  - Period label (per month / per quarter / per year)
- "Reset Usage" button per benefit (admin override for special cases, logged to audit)

### Membership Subscriptions Table — Column Addition

Add a **Usage** column to the existing subscriptions table:
- Shows a mini summary like "4/7 benefits active" or a small usage indicator
- Clickable to expand and see the full breakdown inline

---

## 5. Notification Management

**What it solves:** Admin can send broadcasts but cannot retract a mistaken notification, cannot delete drafts, cannot resend, and cannot see what a specific user's notification inbox looks like.

### Extension to Existing Broadcast Pages

### Broadcast Detail — New Actions

Add these action buttons to the existing Broadcast Detail page:

- **Retract Broadcast**: Marks the notification as retracted. Users who haven't read it will no longer see it. Users who already read it see a "This notification was retracted" note. Requires confirmation modal.
- **Resend Broadcast**: Creates a copy of the broadcast and sends it again to the same recipients. Opens Broadcast Compose pre-filled with the original content.
- **Delete Broadcast**: Removes the broadcast from the admin's sent log. Only available for retracted broadcasts. Requires confirmation.

### Broadcast List — Status Updates

Update the broadcast list table to show new statuses:
- **Sent** (existing, green)
- **Retracted** (new, orange) — with visual distinction
- **Draft** (new, grey) — for broadcasts saved but not yet sent

### Broadcast Compose — Save as Draft

- Add a "Save Draft" button alongside the existing "Send" button
- Drafts appear in the broadcast list with "Draft" status
- Clicking a draft opens Broadcast Compose pre-filled for editing

### User Detail — New "Notifications" Section

Add a **Notifications** section to the existing User Detail page:

- Show the specific user's notification inbox as the admin sees it
- Table with columns: title, type badge, sent date, read/unread status
- Shows both broadcast notifications and system-generated notifications (order confirmations, wallet receipts, membership reminders)
- Admin can mark individual notifications as read/unread
- Admin can delete a notification from a specific user's inbox
- Filter by type (Order, Wallet, Membership, System, Broadcast)

---

## Implementation Order

Each step builds on patterns from the previous, and they're ordered by impact (biggest gap first).

| Step | Feature | Type | Why This Order |
|------|---------|------|----------------|
| **1** | Service Requests | New page + detail page | Biggest gap — half the portal flows are invisible to admin. Establishes the request queue pattern. |
| **2** | Custom Orders | New tab on Orders page | Reuses the request queue pattern from Step 1. Small scope, tightly related to existing Orders page. |
| **3** | Cart Visibility | New page + User Detail extension | Independent of Steps 1–2. New page with its own mock data. |
| **4** | Membership Benefit Usage | Extensions to Membership + User Detail | Smaller scope. Adds to existing pages. No new routing. |
| **5** | Notification Management | Extensions to Broadcast + User Detail | Smallest scope. Adds buttons and sections to existing pages. |

### Per-Step Implementation Pattern

Each step follows the same process:

1. **Mock data** — Add mock entries to `src/data/adminMockData.ts`
2. **Build the UI** — Create new components or extend existing ones
3. **Update routing** — Add new routes to `AdminLayout.tsx` (Steps 1 and 3 only)
4. **Update sidebar** — Add new nav items to `AdminLayout.tsx` (Steps 1 and 3 only)
5. **Verify** — Run `npm run build` to confirm no TypeScript errors

### New Sidebar Items (after implementation)

The sidebar will grow from 14 to 16 items:

```
Overview
Users
Orders          ← Custom Requests tab added here (Step 2)
Fulfillment
Requests        ← NEW (Step 1)
Inventory
Membership      ← Benefit Usage tab added here (Step 4)
Wallet
Referrals
Broadcast       ← Draft/Retract/Resend added here (Step 5)
Carts           ← NEW (Step 3)
Finance
Analytics
Team
Audit Log
Settings
```

### User Detail Additions (across steps)

The User Detail page gets 3 new sections:

- **Current Cart** (Step 3) — what the user has in their cart right now
- **Benefit Usage** (Step 4) — segmented progress bars per membership benefit
- **Notifications** (Step 5) — the user's notification inbox as seen by admin

---

## Summary of Changes

### New Pages

| Page | Route | Sidebar Label | Step |
|------|-------|---------------|------|
| Service Requests | `/requests` | Requests | 1 |
| Request Detail | `/requests/:id` | — (sub-page) | 1 |
| Live Carts | `/carts` | Carts | 3 |

### Extended Pages

| Page | What's Added | Step |
|------|-------------|------|
| Orders | "Custom Requests" tab | 2 |
| Membership | "Benefit Usage" tab | 4 |
| User Detail | Current Cart section | 3 |
| User Detail | Benefit Usage section | 4 |
| User Detail | Notifications section | 5 |
| Broadcast Detail | Retract, Resend, Delete buttons | 5 |
| Broadcast List | Retracted and Draft status badges | 5 |
| Broadcast Compose | Save as Draft button | 5 |

### New Mock Data Needed

| Data | File | Step |
|------|------|------|
| Service requests (30–50 entries across all portals) | `adminMockData.ts` | 1 |
| Custom order requests (10–15 entries) | `adminMockData.ts` | 2 |
| Active user carts (15–20 carts with items) | `adminMockData.ts` | 3 |
| Benefit usage records per member (40 members × benefits) | `adminMockData.ts` | 4 |
| User-level notification inboxes (10–20 entries per user) | `adminMockData.ts` | 5 |

### New Team Privileges Needed

| Privilege | Group | Step |
|-----------|-------|------|
| `requests.view` — View service requests | Users & Orders | 1 |
| `requests.manage` — Assign, schedule, decline requests | Users & Orders | 1 |
| `orders.custom` — Manage custom order requests | Users & Orders | 2 |
| `carts.view` — View live and abandoned carts | Users & Orders | 3 |
| `membership.usage` — View benefit usage data | Communication & System | 4 |
| `broadcast.retract` — Retract sent broadcasts | Communication & System | 5 |
