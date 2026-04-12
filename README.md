# LagosApps Admin Dashboard

Admin dashboard for managing the LagosApps multi-subsidiary platform. Built as a standalone React app with mock data, designed for easy backend integration later.

## Overview

LagosApps is a multi-portal platform serving Lagos with 7 service verticals: Solar, Transport, Groceries, Health, Events, Community, and Logistics. This admin dashboard gives the business team full control over users, orders, inventory, payments, memberships, referrals, broadcasts, analytics, and more.

## Tech Stack

- **React 19** + **TypeScript** (strict mode)
- **Tailwind CSS v4** via `@tailwindcss/vite`
- **Vite 8** for build tooling
- **React Router v7** for route-based navigation
- **Inter** font family

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | TypeScript check + production build |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build |

## Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Overview | Dashboard home with stat cards, recent orders, revenue charts, quick actions |
| `/users` | Users | Searchable/filterable user table with tier, wallet, order counts |
| `/users/:id` | User Detail | Profile, order history, wallet transactions, referrals |
| `/orders` | Orders | All orders with status/portal filters, create order on behalf of users |
| `/orders/create` | Create Order | 3-step wizard: select customer (WhatsApp/phone/walk-in), pick products, review & submit |
| `/orders/:id` | Order Detail | Admin actions (status change, refund, contact), payment breakdown, timeline |
| `/fulfillment` | Fulfillment | Order fulfillment tracking — unassigned orders, team assignments, risk indicators |
| `/fulfillment/:id` | Fulfillment Detail | SLA deadlines, progress tracking, timeline, notes, reassignment |
| `/inventory` | Inventory | Portal-tabbed product management with category filters |
| `/membership` | Membership | Active subscriptions table, stats, link to tier config |
| `/membership/tiers` | Tier Config | Bronze/Silver/Gold tier pricing and benefits CRUD |
| `/wallet` | Wallet | Transaction log, manual credit/debit adjustments, balance stats |
| `/referrals` | Referrals | Referral tracking table, admin-generated referral codes |
| `/broadcast` | Broadcast | Broadcast history with delivery analytics |
| `/broadcast/compose` | Compose | Rich compose page with recipient targeting, type selection, live preview |
| `/broadcast/:id` | Broadcast Detail | Full message content, read rates, audience breakdown |
| `/analytics` | Analytics | Revenue charts, signup trends, membership donut, portal breakdowns, top products |
| `/audit` | Audit Log | Admin action history with expandable details |
| `/settings` | Settings | Platform config, team member management, portal toggles, payment settings |

## Architecture

```
src/
  components/
    admin/           # All admin page components
      shared/        # Reusable: DataTable, StatCard, StatusBadge, FilterBar, EmptyState, NotificationPanel
    ui/              # Base UI: Button, Modal, ToastProvider, PaystackCheckout
  data/
    adminMockData.ts # 50 users, 100 orders, 200 transactions, 60+ products across 7 portals
  hooks/
    useToast.ts      # Toast notification hook
```

## Service Portals

| Portal | Display Name | Color |
|--------|-------------|-------|
| Solar | Solar, Renewables and More | #E65100 |
| Transport | Cars, Vans and Rides | #0D47A1 |
| Groceries | Food, Groceries and Household | #1B5E20 |
| Health | Health and Wellness | #B71C1C |
| Events | Events and Studios | #4A148C |
| Community | A Better You | #004D40 |
| Logistics | Receive & Deliver | #4A148C |

## Design System

- **Sidebar**: White with light grey border, green active state pills
- **Cards**: `rounded-2xl` with subtle shadow and `#E8ECF1` border
- **Tables**: `#F8FAFC` header, clean row dividers, responsive column hiding
- **Colors**: Slate palette (`#0F172A` headings, `#334155` body, `#64748B` muted, `#94A3B8` faint)
- **Primary**: `#057a55` (green)
- **Status badges**: Uppercase pills with semantic colors (green/orange/red/blue/purple)

## Mock Data

All data is generated client-side in `src/data/adminMockData.ts`. No backend required. Designed for easy API replacement — swap generator functions with fetch calls.

## Related

- **User-facing app**: [lagosapps](https://github.com/adexdams/lagosapps)
