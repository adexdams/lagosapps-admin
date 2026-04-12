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

## Related Repository

The user-facing app lives at: https://github.com/adexdams/lagosapps
