# CLAUDE.md — Admin Dashboard Agent Instructions

## Project Overview

LagosApps Admin Dashboard — a standalone React app for managing the LagosApps multi-subsidiary transaction platform. This is the **admin-facing interface** (separate from the user-facing app at `lagosapps-landing`).

The admin dashboard manages: users, orders, inventory (products/services across 7 portals), memberships, wallet transactions, referrals, notifications, analytics, and audit logs.

## Commands

- `npm run dev` — Start Vite dev server (port 5173 or next available)
- `npm run build` — TypeScript check + Vite production build
- `npm run lint` — ESLint
- `npm run preview` — Preview production build

Always run `npm run build` after making changes to verify there are no TypeScript errors.

## Tech Stack

- React 18 + TypeScript (strict)
- Tailwind CSS v4 via `@tailwindcss/vite` plugin — theme in `src/index.css` under `@theme`
- Vite 6+
- React Router DOM v7 — route-based navigation (unlike the main app which is state-driven)
- No state management library — React context + useState

## Architecture

### Routing

All routes are defined in `src/components/admin/AdminLayout.tsx`:
- `/` — AdminOverview (dashboard home)
- `/users` — UsersPage, `/users/:id` — UserDetail
- `/orders` — OrdersPage, `/orders/:id` — OrderDetailAdmin
- `/inventory` — InventoryPage (portal-tabbed)
- `/membership` — MembershipAdmin
- `/wallet` — WalletAdmin
- `/referrals` — ReferralsAdmin
- `/notifications` — NotificationsAdmin
- `/analytics` — AnalyticsPage
- `/audit` — AuditLog
- `/settings` — SettingsPage

### Layout

- **Desktop**: Fixed left sidebar (240px, dark navy #0A2540) + sticky topbar + scrolling content
- **Mobile**: Hamburger → slide-out sidebar from left, topbar collapses

### Shared UI Components (copied from main app)

- `src/components/ui/Button.tsx` — variants: primary, secondary, ghost, destructive, whatsapp
- `src/components/ui/Modal.tsx` — centered desktop / bottom sheet mobile
- `src/components/ui/ToastProvider.tsx` — toast notifications via `useToast()` hook
- `src/components/ui/PaystackCheckout.tsx` — payment simulation flow

### Theme & Styling

The `src/index.css` contains the full Tailwind theme from the main LagosApps app. Key conventions:
- Primary color: `#057a55` (green)
- Admin accent: `#0A2540` (dark navy for sidebar)
- Cards: `bg-white rounded-2xl border border-outline-variant/10`
- Inputs: `border-2 border-outline-variant/15 rounded-xl focus:border-primary`
- Icons: Material Symbols Outlined (`material-symbols-outlined` class)
- Font: Manrope (loaded in index.html)
- Mobile-first: `base` → `sm:` → `md:` → `lg:`

### Service Portal Colors

- Solar: #E65100 (orange)
- Transport: #0D47A1 (blue)
- Groceries: #1B5E20 (green)
- Health: #B71C1C (red)
- Events: #4A148C (purple)
- Community: #004D40 (teal)
- Logistics: #4A148C (purple)

## Design Documents

- `docs/ADMIN_INTERFACE_DESIGN.md` — Complete page-by-page UI design with layouts, columns, form fields, component specs
- `docs/ADMIN_DASHBOARD_AND_DATABASE_MIGRATION_PLAN.md` — Database schema, API endpoints, data migration plan

**Read both docs before implementing any page.** They contain exact column definitions, field structures, and mock data specs.

## Implementation Status

### Done
- [x] Project setup (Vite + React + TS + Tailwind + Router)
- [x] AdminLayout with sidebar, topbar, mobile menu
- [x] AdminOverview with stat cards, orders table, revenue chart, quick actions
- [x] Placeholder pages for all 11 routes

### Done (continued)
- [x] `src/components/admin/shared/DataTable.tsx` — Reusable sortable/paginated table
- [x] `src/components/admin/shared/StatCard.tsx` — Metric card component
- [x] `src/components/admin/shared/StatusBadge.tsx` — Colored status pill
- [x] `src/components/admin/shared/FilterBar.tsx` — Search + filter controls
- [x] `src/components/admin/shared/EmptyState.tsx` — Empty state component
- [x] `src/data/adminMockData.ts` — 50 users, 100 orders, 200 transactions, etc.
- [x] `src/components/admin/UsersPage.tsx` — Users table with search/filter
- [x] `src/components/admin/UserDetail.tsx` — Single user view
- [x] `src/components/admin/OrdersPage.tsx` — Orders management
- [x] `src/components/admin/OrderDetailAdmin.tsx` — Order detail with admin actions
- [x] `src/components/admin/InventoryPage.tsx` — Portal-tabbed product management
- [x] `src/components/admin/InventoryPortal.tsx` — Per-portal product grid
- [x] `src/components/admin/ProductForm.tsx` — Add/edit product modal
- [x] `src/components/admin/MembershipAdmin.tsx` — Tier config + subscriptions
- [x] `src/components/admin/WalletAdmin.tsx` — Transaction log + adjustments
- [x] `src/components/admin/ReferralsAdmin.tsx` — Referral tracking
- [x] `src/components/admin/NotificationsAdmin.tsx` — Broadcast + log
- [x] `src/components/admin/AnalyticsPage.tsx` — Charts + reports
- [x] `src/components/admin/AuditLog.tsx` — Admin action history
- [x] `src/components/admin/SettingsPage.tsx` — Platform config

## Important Patterns

- **Tables**: Use the DataTable shared component for all list views
- **Status badges**: Use StatusBadge for order/membership/referral statuses
- **Forms**: Follow the ProductForm pattern — Modal with inputs, validation via toast
- **Charts**: CSS-based only (no charting library). Use percentage-width divs for bars, conic-gradient for pie
- **Mock data**: All data comes from `src/data/adminMockData.ts` until backend is ready
- **No backend yet**: Everything is frontend-only with mock data. Design for easy API replacement later.

## Implementation Plan Tracking

`docs/IMPLEMENTATION_PLAN.md` is a **living monitoring document** the project owner reads to track progress across both repos (admin + user-facing). Keep it accurate.

**Update the plan immediately after any change that affects it** — do not batch updates or save them for the end of a session. Specifically:

- When you finish a step inside a milestone, flip its ⬜ to ✅ (or 🟡 for partial) in that milestone's step list **and** in the `Milestone Overview` rollup table at the top.
- When a milestone's status changes (not started → partial → complete), update the rollup row, the "What works after Milestone N" section, and the per-step checklist — all three should agree.
- When you add new infrastructure (migration, storage bucket, Edge Function, trigger, cron, secret, Netlify config) reflect it in the **Current State** section AND in the relevant milestone's Infrastructure table.
- When the shape of the plan itself needs to change (new step uncovered, dependency reordered, estimate revised), edit the plan structure — don't just leave old steps in place with new commentary on top.
- When the user-facing repo (`lagosapps`) lands work that affects milestone status here, pull latest from that repo if relevant, verify, and reflect it.

**Anchor claims to evidence.** If you write "✅ Done", cite the file path, migration name, commit SHA, table/bucket name, or Edge Function slug that proves it. If you can't verify programmatically (e.g., a Netlify env var, a Supabase dashboard SMTP setting, Resend domain verification) say so and mark it as "trusting user confirmation" rather than claiming it's verified.

**When to update** (non-exhaustive):

- Immediately after `git commit` if the commit advanced a plan step
- After a migration applied successfully (`supabase db push`)
- After an Edge Function deploy (`supabase functions deploy`)
- After the user confirms a manual action (SMTP config, env var set, DNS record added)
- After a failed deploy or rolled-back change — record what happened so the plan doesn't overstate status

**Do not** mark something complete based on intent to complete it; only after the code is written, pushed, and (when possible) verified.

## Related Repository

The user-facing app lives at: <https://github.com/adexdams/lagosapps>

### Shared Supabase Backend

Both repos connect to the same Supabase project:

- **Project ref**: `uhrlsvnmoemrakwfrjyf`
- **Region**: West EU (Ireland)
- **URL**: `https://uhrlsvnmoemrakwfrjyf.supabase.co`

**This admin repo owns the database schema.** All migrations live in `supabase/migrations/`. The user-facing repo must NOT create its own migrations — any schema change goes here and is applied via `supabase db push`, after which both apps see it immediately.

The user-facing repo's `supabase/migrations/001_profiles.sql` is marked superseded — its functionality is now part of this repo's migration `20260420120400_align_with_auth_users.sql`.

### Canonical User Table

Users are stored in the `profiles` table, which extends Supabase's built-in `auth.users`. A trigger (`handle_new_user`) auto-creates a `profiles` row whenever someone signs up via Supabase Auth. The `profiles.role` column is either `user`, `admin`, or `super_admin` — this is what the `AdminRoute` guard checks.

### Admin → User Flow

Admins in this dashboard control what customers see on the user-facing app:

| Action here | Effect on user app |
|---|---|
| Add/edit/disable product in Inventory | Product appears/updates/disappears in the relevant portal |
| Change product price | New price reflected at checkout |
| Toggle a portal off in Settings | That portal becomes unavailable on the user app |
| Edit membership tier pricing | New prices shown on the tier cards |
| Edit tier benefits | New benefits shown on membership pages |
| Send a Broadcast | User receives it in their notifications inbox + email via Resend |
| Update order status | User's order timeline updates (realtime) |
| Issue a refund | User's wallet is credited; transaction appears in their history |
| Adjust user wallet manually | Transaction logged and visible in user's wallet history |
| Extend/cancel a subscription | User's membership reflects the new status |
| Retract a broadcast | Unread users stop seeing it; read users see a retraction notice |
| Convert a service request to an order | Order appears in user's order history |

### User → Admin Flow

Every customer action creates records visible in this dashboard:

| User action (other repo) | Where it appears here |
|---|---|
| Signs up | `profiles` row → Users page |
| Adds items to cart | `carts` + `cart_items` → Live Carts page |
| Abandons cart | Abandoned Carts tab → admin can send reminder |
| Places order | `orders` row → Orders + Fulfillment queue |
| Submits Solar audit / Health visit / Event booking / etc. | `service_requests` → Fulfillment > Service Requests |
| Submits freeform grocery/logistics request | `custom_order_requests` → Fulfillment > Custom Orders |
| Tops up wallet | `wallet_transactions` → Wallet page |
| Subscribes to membership | `membership_subscriptions` → Membership page |
| Uses a membership benefit | `membership_benefit_usage` increments → Benefit Usage tab |
| Shares referral link, referred user joins | `referrals` → Referrals page |
| Reads a broadcast | `broadcast_recipients.read = true` → affects read rate shown on Broadcast Detail |

### Row-Level Security

Every table has RLS enabled. Users can only see their own rows (via `auth.uid() = user_id` policies). Admins get elevated access through the `is_admin()` helper function. This means API calls from either app are filtered at the database level — no frontend filtering bug can leak another user's data.

### Key Files for Cross-Repo Awareness

- `supabase/migrations/` — the canonical schema (5 migrations, 35 tables, RLS policies, seed data)
- `src/lib/supabase.ts` — Supabase client initialization
- `src/lib/api.ts` — typed wrapper functions for every database operation
- `src/components/AuthProvider.tsx` — loads profile + team privileges on login
- `src/components/admin/AdminRoute.tsx` — enforces `role IN ('admin', 'super_admin')`
- `docs/IMPLEMENTATION_PLAN.md` — 9-milestone rollout plan covering both repos
