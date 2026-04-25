# LagosApps — Implementation Plan

A step-by-step plan to take both the admin dashboard and user-facing app from frontend mock data to a fully functional production platform. Each milestone lists what gets built, what infrastructure is needed, and what becomes usable at the end.

---

## Current State (as of 2026-04-24)

**What's live and working:**

- **Supabase project** (`uhrlsvnmoemrakwfrjyf`, West EU Ireland) — linked, 36 tables + RLS + seed data
- **Admin dashboard** — auth + role-guarded routes, real profile loading from `profiles` table, login supports email/password + magic link + password reset
- **Netlify deployment** — auto-deploys from `main` branch, SPA fallback via `_redirects` + `netlify.toml`, secret-scan whitelist configured for public Supabase anon key, security headers + long-cache on `/assets/*`. Blank-page-on-refresh bug resolved. `ErrorBoundary` + `ConfigError` screens catch runtime failures.
- **Product catalog seeded + fully wired on admin side** — 74 products (all mapped to correct categories via backfill migration), 29 categories, 10 solar packages, 3 venues, 5 building types, 3 membership tiers + 15 benefits, 7 portals, 5 pricing zones. `InventoryPortal` + `ProductForm` do full CRUD with portal-specific metadata (solar/transport/health/events/logistics fields), audit logging, and `products` bucket image upload via shared `ImageUpload` component.
- **Admin avatars** — upload to `avatars` bucket, stored on `profiles.avatar_url`; rendered in topbar and User Detail
- **Resend integration** — domain `lagosapps.com` verified, sending from `hello@lagosapps.com`, Edge Function `send-email` deployed, 6 email templates seeded and editable from `/emails` admin page with banner/logo upload
- **Welcome email trigger** — fires automatically on every new `profiles` row via `pg_net` + Edge Function (covers both user-app signup and admin-created users)
- **Broadcast system end-to-end** — admin Compose creates `broadcasts` + fans out to `broadcast_recipients` + `user_notifications` + fires Resend emails; list page + detail page show live read rates; retract flow marks unread inboxes as retracted
- **Internal system notifications** — 7 DB triggers fire into `system_notifications` (service requests created/assigned, custom orders created, orders cancelled, inventory low/out of stock, team role changes, broadcasts sent); topbar panel and `/notifications` page both subscribe to Supabase Realtime so new alerts appear without refresh
- **Alert preferences** — per-admin `notification_preferences` with per-category toggles + thresholds (low stock units, large transaction ₦, overdue hours, SLA risk hours), editable from Settings page, auto-persisted
- **Service Portal Toggles wired to DB** — Settings page loads `service_portals.is_active` on mount, each toggle now calls `updatePortal(portal, { is_active })` with optimistic update + audit logging + success toast. Disabled portals show a "HIDDEN" badge. Takes effect immediately on the user-facing app (which filters by `is_active=true` in `getActivePortals`)
- **Admin Orders / Fulfillment / Live Carts wired to DB** — Orders list + Order Detail (with refund-to-wallet flow + audit), Create Order admin wizard (debounced customer search, per-portal product picker, order + items + timeline insert), Live Carts (real `carts` + `cart_items`, abandoned detection via `updated_at`, Send Reminder email via Resend), Fulfillment page all 3 tabs (Order Fulfillment, Service Requests, Custom Orders) with real DB fetches + team-member assignment via `upsertFulfillmentTracking`, Fulfillment Detail supports both order SLA/progress editing (writes to `fulfillment_tracking`) and service-request status transitions + decline flow (writes to `service_requests`), with shared internal-notes stream backed by `fulfillment_notes` / `service_request_notes`
- **Email preview system** — dry-run endpoint returns rendered HTML; reusable `EmailPreviewModal` with desktop/mobile views; preview works for both email templates and broadcasts
- **Storage buckets** — `email-assets` (admin-only write), `products` (admin-only write), `avatars` (users manage own via `{user_id}/...` path convention)
- **User-facing app (M1 + M2 complete)** — real Supabase auth (email/password + magic link + password reset + session persistence); all 7 portals read live from Supabase, no hardcoded product arrays; portals react in real-time to admin toggles (`is_active`), price changes, and product edits

**M3 complete (as of 2026-04-25):**

- **User cart** — `CartProvider` fully wired to `carts` + `cart_items`; all CRUD ops (add, update quantity, remove, clear) write to DB; cart persists across sessions and devices
- **User checkout** — real Paystack Inline JS (`PaystackPop.setup()`) with `VITE_PAYSTACK_PUBLIC_KEY`; order created in DB before payment opens; on success calls `updateOrderPayment()`; supports wallet-only, card-only, and hybrid (wallet + card) splits
- **User orders** — persisted to `orders` + `order_items` + `order_timeline`; visible on admin Orders page immediately; real-time subscription in `AuthProvider` keeps user's order list live
- **User wallet** — real balance from `profiles.wallet_balance`; top-up creates `wallet_transactions` row + updates balance; deduction at checkout also creates row; transaction history rendered from DB
- **User notifications inbox** — reads from `user_notifications` table; real-time subscription; mark read/mark all read; admin broadcasts arrive instantly
- **Paystack webhook** — `supabase/functions/paystack-webhook/index.ts` deployed; handles `charge.success`; signature verification via HMAC-SHA512; updates order to "confirmed" (ORD- references) and credits wallet as safety-net (TXN- references) with idempotency guard

**M4 complete (as of 2026-04-25):**

- **Wallet admin wired** — WalletAdmin fetches real `wallet_transactions` (with profiles join); manual adjustment creates real rows, updates `profiles.wallet_balance`, logs audit
- **Membership admin wired** — MembershipAdmin loads real subscriptions + benefit usage + tiers in parallel; aggregates benefit stats in JS
- **Membership Tier Config wired** — edits real `membership_tiers` (prices) + full benefit CRUD on `membership_tier_benefits`
- **Referrals admin wired** — fetches real referrals with referrer/referred profile joins; removed per-user code generation UI
- **User membership panel wired** — MembershipPanel fetches tiers + benefits from DB; billing cycle toggle (annual/quarterly) passes to subscribeMembership; creates real `membership_subscriptions` rows
- **User referral flow wired** — register() looks up referrer via code, creates `referrals` row + 6-month free bronze `membership_subscriptions` row; loadUserData() fetches real referrals
- **Cron SQL migration** — `20260425000000_m4_cron_jobs.sql` created and applied; SQL functions for membership expiry, referral expiry, monthly benefit reset, overdue fulfillment flagging; pg_cron schedule lines pending extension enablement in Supabase Dashboard

**M5 complete (as of 2026-04-25):**

- **Transactional emails wired** — Paystack webhook fires order confirmation (ORD-) and wallet top-up (TXN-) emails; membership renewal reminder cron runs daily at 08:00 UTC
- **Membership + wallet system notifications** — `on_membership_event` trigger (new subscription + cancellation) and `on_large_wallet_txn` trigger (≥ ₦50K, respects per-admin threshold preference) added via `20260425000002_m5_notification_triggers.sql`

**What's still pending:**

- **Service request submission forms** (user app) — user-facing forms for Solar, Health, Events, Community, Logistics portals (M6)
- **WhatsApp** — deferred to Milestone 9

---

## Milestone Overview

| # | Milestone | Status | What becomes usable | Infrastructure |
|---|-----------|--------|--------------------|---|
| 1 | Foundation | ✅ Complete | Auth, user accounts, DB schema, API layer | Supabase (Auth + DB) |
| 2 | Product Catalog | ✅ Complete (admin CRUD + user portals live from DB) | Real inventory, admin CRUD, user browsing | Supabase Storage |
| 3 | Orders & Cart | ✅ Complete | Real checkout, order management, fulfillment | Paystack |
| 4 | Wallet & Membership | ✅ Complete | Payments, subscriptions, wallet top-ups, benefits | Paystack (subscriptions) |
| 5 | Communication | ✅ Complete | Broadcasts to users, transactional emails, internal admin notifications | Resend |
| 6 | Operations | ✅ Complete | Service requests, custom orders, fulfillment tracking, audit log | — |
| 7 | Analytics & Monitoring | ⬜ Not started | Real dashboards, error tracking, product analytics | Sentry, PostHog |
| 8 | Deployment & Security | ⬜ Not started | Live on custom domain with SSL, DDoS protection | Netlify, Cloudflare |
| 9 | Messaging & Support | ⬜ Not started | WhatsApp order updates, customer support | WhatsApp Business API |

**Legend**: ✅ Complete · 🟡 Partial · ⬜ Not started

---

## Milestone 1: Foundation ✅ COMPLETE

**Goal**: Replace localStorage with real authentication and a real database. Every page loads data from Supabase instead of mock arrays.

### Infrastructure

| Service | What to set up | Status |
|---------|---------------|--------|
| **Supabase** | Project created (ref: `uhrlsvnmoemrakwfrjyf`, West EU Ireland) | ✅ Done |
| **GitHub Actions** | Basic CI pipeline: lint + type check + build on every push | Deferred to Milestone 8 |

### Steps

**1.1 — Supabase project setup** ✅
- Supabase project linked to admin repo via CLI
- Auth configured (email+password enabled by default)
- Environment variables set: `.env` with `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`
- `.env` added to `.gitignore`

**1.2 — Database schema creation** ✅
- 35 tables created via 4 migrations in `supabase/migrations/`:
  - `20260420120000_initial_schema.sql` — all tables, 17 custom ENUMs, indexes, `updated_at` triggers
  - `20260420120100_rls_policies.sql` — RLS enabled on all 35 tables, `is_admin()` helper function, user-own-data + admin-full-access policies
  - `20260420120200_seed_data.sql` — 7 portals, 3 tiers, 15 benefits, 5 pricing zones, 6 platform settings
  - `20260420120300_seed_products.sql` — 29 categories, 74 products, 10 solar packages, 3 venues, 5 building types
- Tables include all original plan tables PLUS: `service_requests`, `service_request_notes`, `custom_order_requests`, `custom_request_notes`, `system_notifications`, `notification_preferences`, `broadcasts`, `broadcast_recipients`, `user_notifications`, `fulfillment_tracking`, `fulfillment_notes`, `platform_settings`

**1.3 — API client layer (admin repo)** ✅
- `@supabase/supabase-js` installed
- `src/lib/supabase.ts` — client initialization with env var validation
- `src/lib/api.ts` — typed wrapper functions for all entities (users, orders, products, portals, categories, wallet, membership, referrals, service requests, custom orders, fulfillment, carts, broadcasts, system notifications, notification preferences, user notifications, team, audit log, settings, storage)
- `src/hooks/useSupabaseQuery.ts` — generic data-fetching hook with mock data fallback (allows incremental migration from mock → real data)

**1.4 — Auth integration (user-facing app)** ✅ COMPLETE
- Real Supabase auth (email/password + magic link + session persistence + password reset)
- `profiles` row auto-created via `handle_new_user` trigger on signup
- Auth state persists across sessions via Supabase

**1.5 — Auth integration (admin app)** ✅
- `src/components/AuthProvider.tsx` — wraps app, manages Supabase session, loads admin profile + team privileges on login
- `src/components/admin/LoginPage.tsx` — email+password login with error handling, loading state, password visibility toggle
- `src/components/admin/AdminRoute.tsx` — route guard: redirects to `/login` if unauthenticated, shows "Access Denied" if user is not admin role
- `AdminLayout.tsx` updated to show real admin name/role from auth context, sign-out button in topbar
- `App.tsx` updated: `/login` route + `AdminRoute` wrapping `AdminLayout`

**1.6 — Seed database** ✅
- 7 service portals seeded
- 3 membership tiers + 15 tier benefits seeded
- 5 transport pricing zones seeded
- 6 platform settings seeded
- 29 product categories across all 7 portals seeded
- 74 products seeded (16 solar, 6 transport, 13 groceries, 13 health, 8 events, 12 community, 6 logistics)
- 10 solar packages (gel + lithium) seeded
- 3 venues with amenities seeded
- 5 building types with pricing seeded

**1.7 — Replace mock data in admin** ✅ (infrastructure ready, incremental migration)
- `useSupabaseQuery` hook created with automatic mock data fallback — pages try Supabase first, fall back to mock data when table is empty
- All API functions ready in `src/lib/api.ts` — pages can be migrated one at a time by swapping `mockXxx` imports for `useSupabaseQuery` calls
- Mock data (`adminMockData.ts`) retained as fallback until all tables are populated with real data

### What works after Milestone 1

- ✅ Admin must log in to access the dashboard (route-protected)
- ✅ Auth state persists across sessions via Supabase
- ✅ Database has 35 tables with full schema, RLS, indexes, and seed data
- ✅ 74 products + categories + tiers + portals seeded and queryable
- ✅ API layer ready for all entities — pages can migrate to real data incrementally
- ✅ Mock data still works as fallback during transition

---

## Milestone 2: Product Catalog — 🟡 PARTIAL

**Goal**: Admin can manage the full product catalog (CRUD), and users browse real products from the database.

### Infrastructure

| Service | What to set up | Status |
|---------|---------------|--------|
| **Supabase Storage** | Public buckets for product images, avatars, email banners/logo | ✅ `email-assets` bucket live; `products` + `avatars` buckets still to create |

### Steps

**2.1 — Image upload pipeline** 🟡 Partial
- ✅ `email-assets` bucket created (public, admin-only write, 5MB image limit)
- ✅ `products` bucket created (public read, admin-only write, 5MB image limit)
- ✅ `avatars` bucket created (public read, user can manage own, 2MB image limit, path convention `{user_id}/avatar.{ext}`)
- ✅ Admin-UI image upload working end-to-end (used for email logo + banners)
- ⬜ Build reusable image upload component (generalize the logic already in `EmailTemplatesPage`)
- ⬜ Configure Supabase image transformations for thumbnails

**2.2 — Admin inventory CRUD** ✅ COMPLETE
- ✅ `ProductForm.tsx` wired to Supabase: create/update/delete via `src/lib/api.ts`, image upload via shared `ImageUpload` component to `products` bucket, category dropdown fetches from `product_categories`, stock status auto-computed, Delete button on edit
- ✅ `InventoryPortal.tsx` fetches real products from Supabase per portal, category filter pills built from joined `product_categories`, loading skeletons, empty state, live image rendering
- ✅ Stock level management (quantity + low-stock threshold → stock_status enum)
- ✅ Active/inactive toggle
- ✅ **Portal-specific metadata fields** — Solar (wattage/brand/battery_type), Transport (vehicle_type + pickup_hours + 5 zone prices + note), Health (coming_soon toggle), Events (capacity/location + amenities tag input + event_categories tag input), Logistics (store), stored in `products.metadata` JSONB. Groceries + Community use category alone.
- ✅ **Audit logging** — all product.create / product.update / product.delete actions write to `admin_audit_log` via `logAudit()` helper in `src/lib/api.ts` (non-blocking — never blocks real work on audit failure)
- ✅ **Category backfill** — migration `20260422110000_backfill_product_categories.sql` maps all 74 seeded products to their correct categories (no more Uncategorized bucket by default)

**2.3 — User-facing portal migration** ✅ COMPLETE
- ✅ All 7 portal components query Supabase live — no hardcoded product arrays remain
- ✅ Portals react in real-time to admin `is_active` toggles, price changes, and product edits
- ✅ Product images load from Supabase Storage

**2.4 — Admin profile avatars** ✅ COMPLETE
- ✅ `SettingsPage.tsx` avatar upload wired to `avatars` bucket using `{user_id}/avatar.{ext}` path convention; saves public URL to `profiles.avatar_url`; cache-busting query param so new uploads show immediately; audit logged as `profile.avatar_update`
- ✅ `AdminLayout.tsx` topbar avatar displays `profile.avatar_url` image when present, initials fallback otherwise
- ✅ `UserDetail.tsx` fetches `profiles.avatar_url` for the viewed user on mount and renders image (initials fallback if none or mock ID)

### What works after Milestone 2

- ✅ Admin can add, edit, and remove products with images across all 7 portals
- ✅ Users see real products with real images when browsing portals
- ✅ Portal enable/disable, price changes, and stock updates are instant (no deploy needed)
- ✅ User auth fully wired to Supabase (email/password, magic link, password reset, session persistence)

---

## Milestone 3: Orders & Cart

**Goal**: Users can add items to cart and complete real checkout. Admin can manage orders through the full lifecycle.

### Infrastructure

| Service | What to set up | Cost |
|---------|---------------|------|
| **Paystack** | Create merchant account, get test API keys, configure webhook URL | Free (1.5% + ₦100 per txn) |
| **Supabase Edge Functions** | Deploy Paystack webhook handler | Free |

### Steps

**3.1 — Cart system (user app)** ✅ COMPLETE
- ✅ `CartProvider.tsx` fully wired to `carts` + `cart_items` tables
- ✅ All CRUD ops (add, update quantity, remove, clear) write to DB; temp IDs replaced with real DB IDs after insert
- ✅ Cart persists server-side, syncs across devices and sessions
- ✅ Admin Live Carts page reads real cart data with abandoned detection

**3.2 — Checkout flow (user app)** ✅ COMPLETE
- ✅ `PaystackCheckout.tsx` uses real Paystack Inline JS (`window.PaystackPop.setup()`)
- ✅ Paystack script loaded in `index.html`; `VITE_PAYSTACK_PUBLIC_KEY` set in `.env.local`
- ✅ Checkout creates order in DB first (status: "pending"), then opens Paystack modal
- ✅ On success: calls `updateOrderPayment()` to confirm order + record payment reference
- ✅ Wallet deduction as partial or full payment; hybrid wallet + card splits supported
- ✅ Wallet-only orders (no Paystack needed) skip modal and confirm immediately

**3.3 — Paystack webhook handler** ✅ COMPLETE
- ✅ `supabase/functions/paystack-webhook/index.ts` deployed (ACTIVE, version 2) at `https://uhrlsvnmoemrakwfrjyf.supabase.co/functions/v1/paystack-webhook`
- ✅ `PAYSTACK_SECRET_KEY` set in Supabase Edge Function secrets (verified via `supabase secrets list`)
- ✅ Verifies Paystack HMAC-SHA512 signatures — returns `401` on unsigned/tampered requests (verified by probe)
- ✅ Handles `charge.success`: confirms orders (ORD- references), credits wallet as safety-net (TXN- references) with idempotency guard (unique constraint + 23505 handler)
- ✅ Test webhook URL configured in Paystack dashboard

**3.4 — Order management (admin app)** ✅ COMPLETE (admin-side)

- ✅ Orders page reads from `orders` with profile join, search/filter by status/portal, real avatar rendering, loading + empty states with "Create first order" CTA
- ✅ Order Detail reads real `order_items` + `order_timeline` + profile, supports status transitions + refund-to-wallet flow (cancels order, credits customer wallet, inserts `wallet_transactions` row, logs audit)
- ✅ Create Order 3-step wizard: debounced customer search via profiles, per-portal product picker via `getProducts(portalId)`, on submit generates ORD-XXXX id, inserts order + items + first timeline step, logs audit
- ⬜ Paystack refund API integration (currently wallet-credit-only refund) — blocked on M3 Paystack setup

**3.5 — Live Carts (admin app)** ✅ COMPLETE

- ✅ Live Carts reads from `carts` + `cart_items` + profiles (filters empty carts, uses `updated_at` for abandoned detection > 24h)
- ✅ Send Reminder flow uses `sendBroadcastEmail` with cart total + item count

### What works after Milestone 3

- ✅ Users can browse products, add to cart (persists across sessions), and pay with real Paystack (test mode)
- ✅ Wallet-only, card-only, and hybrid (wallet + card) checkout all supported
- ✅ Orders persisted to DB and visible on admin Orders page in real-time
- ✅ Wallet top-up flow end-to-end: client-side + webhook safety-net with idempotency
- ✅ Admin can create orders for walk-in/phone/WhatsApp customers
- ✅ Admin can monitor active and abandoned carts, send reminders via email
- ✅ User notifications inbox reads admin broadcasts in real-time

---

## Milestone 4: Wallet & Membership

**Goal**: Wallet top-ups, membership subscriptions with real billing, referral rewards, and benefit usage tracking all work end-to-end.

### Infrastructure

| Service | What to set up | Cost |
|---------|---------------|------|
| **Paystack** (already set up) | Configure subscription plans for Bronze/Silver/Gold (annual + quarterly) | — |
| **Supabase Edge Functions** | Cron jobs for membership expiry, referral expiry, benefit usage period resets | Free |

### Steps

**4.1 — Wallet system** ✅ COMPLETE

- ✅ Admin `WalletAdmin.tsx` fetches real `wallet_transactions` with profiles join (`src/components/admin/WalletAdmin.tsx`)
- ✅ Manual adjustment creates real `wallet_transactions` row + updates `profiles.wallet_balance` + audit log
- ✅ Wallet deduction during checkout handled (M3 — via `AuthProvider` + checkout flow)
- ✅ Real transaction history on user dashboard (M3) and admin Wallet page

**4.2 — Membership subscriptions** ✅ COMPLETE

- ✅ Subscribe flow: user selects tier + billing cycle → Paystack payment → `createMembershipSubscription()` creates `membership_subscriptions` row (`src/components/dashboard/MembershipPanel.tsx`)
- ✅ `subscribeMembership()` in AuthProvider accepts `tier`, `billingCycle`, `amountPaid`, `paymentReference` (`src/components/AuthProvider.tsx`)
- ✅ Admin `MembershipAdmin.tsx` loads real subscriptions + tiers (`src/components/admin/MembershipAdmin.tsx`)
- ✅ `MembershipTierConfig.tsx` edits real `membership_tiers` (prices) + full benefit CRUD (`src/components/admin/MembershipTierConfig.tsx`)

**4.3 — Benefit usage tracking** ✅ COMPLETE

- ✅ `MembershipAdmin.tsx` fetches `getBenefitUsage()` and aggregates by `benefit_key` in JS
- ✅ Benefit Usage tab shows usage count, unique users, at-limit count per benefit
- ⬜ Per-user progress bars on user dashboard (deferred — low priority until benefit consumption is wired to orders)

**4.4 — Referral system** ✅ COMPLETE

- ✅ Referral codes stored in `profiles.referral_code` (seeded via trigger on signup)
- ✅ `register()` in AuthProvider looks up referrer by code, creates `referrals` row + 6-month free bronze subscription (`src/components/AuthProvider.tsx`)
- ✅ `loadUserData()` fetches real referrals via `getMyReferrals()` with profile join
- ✅ Admin `ReferralsAdmin.tsx` fetches real referrals with referrer/referred joins (`src/components/admin/ReferralsAdmin.tsx`)

**4.5 — Cron jobs** ✅ COMPLETE

- ✅ `supabase/migrations/20260425000000_m4_cron_jobs.sql` — SQL helper functions applied to production DB
- ✅ `supabase/migrations/20260425000001_m4_cron_schedules.sql` — all 4 jobs registered via `cron.schedule()`
- ✅ Jobs active: `expire-memberships` (01:00 UTC daily), `expire-referrals` (01:00 UTC daily), `reset-benefit-usage` (02:00 UTC monthly), `flag-overdue-orders` (hourly)

### What works after Milestone 4

- Users can top up wallets, subscribe to membership tiers, and use benefits
- Referral links generate real memberships for referred users
- Admin can manage all financial data with real numbers
- Automated expiry and usage resets run without manual intervention

---

## Milestone 5: Communication — ✅ COMPLETE

**Goal**: Admin can broadcast messages to users via email. Internal system notifications alert admin team members about events that need attention.

### Infrastructure

| Service | Status |
|---------|--------|
| **Resend** | ✅ Account created, domain `lagosapps.com` verified (DKIM + SPF + MX + DMARC), API key stored in Edge Function secrets, sending from `hello@lagosapps.com` |
| **Supabase Realtime** | ⬜ Not yet enabled on `system_notifications` (deferred until UI is wired) |

### Steps

**5.1 — Broadcast system (admin → users)** ✅ COMPLETE

- ✅ `broadcasts` + `broadcast_recipients` tables created
- ✅ Broadcast template seeded in `email_templates` with `{{title}}` + `{{message}}` interpolation
- ✅ Broadcast Compose UI has working "Preview Email" button (uses real rendering pipeline)
- ✅ **Save as Draft** persists to DB with `status='draft'`
- ✅ **Send broadcast** → creates `broadcasts` row (status='sent'), resolves recipients via `resolveBroadcastRecipients` (all / by tier / specific user), fans out to `broadcast_recipients` + `user_notifications` in one batch, fires Resend emails via `sendBroadcastEmail` (fire-and-forget), logs audit entry
- ✅ **Broadcast list** (`NotificationsAdmin.tsx`) reads real data from `broadcasts` table, shows live read rate per row (read_count / recipient_count), status filter (Sent/Draft/Retracted), type filter
- ✅ **Broadcast Detail** (`BroadcastDetail.tsx`) reads real broadcast + recipient stats + author name, shows total/delivered/read counts, displays banner image if present, shows recipients label (All Users / Gold tier / Specific User)
- ✅ **Retract** updates broadcast.status='retracted' + retracted_at=now(), also marks `user_notifications.retracted=true` for unread recipients so message disappears from unread inboxes (read ones still see it with a retracted note)
- ✅ **Delete** option for draft and retracted broadcasts (not sent ones)

**5.2 — Transactional emails (system → users)** ✅ COMPLETE

- ✅ `send-email` Edge Function deployed and tested
- ✅ All 6 email templates seeded and editable from `/emails` admin page: welcome, password_reset, order_confirmation, wallet_topup, membership_renewal, broadcast
- ✅ Template variable interpolation working (`{{name}}`, `{{orderId}}`, etc.)
- ✅ Shared layout with logo header, optional per-template banner, content, branded footer
- ✅ Dry-run preview endpoint and `EmailPreviewModal` with desktop/mobile views
- ✅ Typed helpers in `src/lib/email.ts`
- ✅ New user signup → welcome email (DB trigger `on_profile_created_send_welcome` via `pg_net`)
- ✅ Paystack webhook `charge.success` (ORD-) → order confirmation email (`supabase/functions/paystack-webhook/index.ts`)
- ✅ Paystack webhook `charge.success` (TXN-) → wallet top-up email (`supabase/functions/paystack-webhook/index.ts`)
- ✅ Membership renewal reminder → cron job `membership-renewal-reminders` (08:00 UTC daily) fires `send-email` via `pg_net` for subscriptions expiring in 3 days (`20260425000002_m5_notification_triggers.sql`)
- ✅ Supabase Auth emails (confirm signup, magic link, password reset) via Resend SMTP — configured 2026-04-25, confirmed delivering from `hello@lagosapps.com` (trusting user confirmation)
- ✅ Branded HTML Auth email templates for all 6 Supabase Auth flows — `supabase/templates/{confirm_signup,magic_link,reset_password,invite,change_email,email_otp}.html`; wired in `supabase/config.toml` `[auth.email.template.*]` blocks (2026-04-25); apply to production by pasting HTML into Dashboard → Auth → Email → Templates

**5.3 — Internal system notifications (admin-to-admin)** ✅ COMPLETE

- ✅ `system_notifications` table with all 22 notification types
- ✅ RLS policies: admin reads own, update own, system can insert
- ✅ `20260422120000_system_notification_triggers.sql` — 7 DB triggers: service_request new/assigned, custom_order new, order_cancelled, product stock change, team_role_changed, broadcast_sent
- ✅ `20260425000002_m5_notification_triggers.sql` — 2 more triggers: `on_membership_event` (new subscription + cancellation → ops team), `on_large_wallet_txn` (amount ≥ ₦50K → ops team, respects per-admin `notification_preferences.large_txn_threshold`)
- ✅ Helper SQL functions `admins_with_roles(variadic)` + `insert_system_notification(...)` — non-blocking
- ✅ Topbar `NotificationPanel` — Supabase Realtime, unread badge, mark read, deep links

**5.4 — Notifications page** ✅ COMPLETE

- ✅ `/notifications` route + sidebar entry "Notifications"
- ✅ `NotificationsInboxPage.tsx` lists all the logged-in admin's system notifications
- ✅ Category filter pills (all, orders, fulfillment, requests, inventory, wallet, membership, team, system) with per-category counts
- ✅ Unread-only toggle
- ✅ Mark individual as read/unread; Mark all read
- ✅ Click notification → deep link to related entity + auto-mark read
- ✅ Supabase Realtime subscription — new notifications appear without refresh
- ✅ Empty state ("You're all caught up")

**5.5 — Alert preferences and thresholds** ✅ COMPLETE

- ✅ `notification_preferences` table with all 8 categories + threshold columns
- ✅ RLS policy: admin manages own preferences
- ✅ **Alert Preferences card** added to Settings page
  - Per-category toggle: orders, fulfillment, requests, inventory, wallet, membership, team, system
  - Category-specific threshold inputs where relevant:
    - Orders — overdue-hours threshold
    - Fulfillment — SLA-risk hours
    - Inventory — low-stock units
    - Wallet — large-transaction ₦ amount
  - Upserts to DB on every change (no explicit Save button — auto-persist)
- ✅ Supabase Realtime subscriptions enabled in both `NotificationsInboxPage` and `NotificationPanel` — new system notifications push into both places without refresh
- ⬜ Wire threshold values into the server-side notification-generation triggers (triggers currently use hardcoded/default thresholds; need to JOIN `notification_preferences` before firing)

**5.6 — Login UX** ✅ COMPLETE (bonus)

- ✅ Magic link sign-in option added to admin login page (uses `supabase.auth.signInWithOtp`)
- ✅ Password/Magic Link tab toggle
- ✅ "Forgot password?" flow using `supabase.auth.resetPasswordForEmail`

**5.7 — Admin email template management** ✅ COMPLETE (bonus — not originally scoped)

- ✅ `email_templates` table with admin-editable subject, heading, body HTML, banner per template
- ✅ `email-assets` storage bucket (public read, admin write)
- ✅ `/emails` admin page: template list, editor, banner upload per template, global logo upload
- ✅ Live preview modal with desktop/mobile views — renders unsaved edits via inline template payload
- ✅ Variable reference panel shows available placeholders per template

### What works after Milestone 5

- Admin can broadcast messages to users (by email and in-app)
- Users receive transactional emails for orders, payments, membership events
- Admin team members receive real-time internal notifications for events relevant to their role
- Each admin can configure which alerts they receive and at what thresholds
- Topbar notification bell shows real system alerts, not broadcasts

### What works today (partial progress)

- Any code in either repo can call `sendEmail(...)` or `sendWelcomeEmail(...)` to email a user through Resend — the full pipeline (DB template fetch, variable interpolation, logo/banner, branded layout, Resend send) is live
- Admin can preview any email template (and broadcast) in full HTML before sending, with unsaved edits rendered
- Admin can edit email content, heading, subject, and upload banner images without a code deploy

---

## Milestone 6: Operations — ✅ COMPLETE

**Goal**: Service requests, custom orders, and fulfillment tracking work with real data and real team assignment.

### Infrastructure

No new infrastructure — uses Supabase tables and Edge Functions from previous milestones.

### Steps

**6.1 — Service request pipeline (user → admin)** ✅ COMPLETE

- ✅ Admin Fulfillment > Service Requests tab reads real `service_requests` with profile join, filters, team-member assignment
- ✅ Fulfillment Detail supports status workflow transitions, decline, internal notes, audit logging
- ✅ User-facing portal forms wired to real DB — all 4 service portals (Solar, Health, Events, Logistics) now properly `await addServiceRequest()` instead of wrapping in fake `setTimeout`; `addServiceRequest` in `AuthProvider` returns `Promise<boolean>` so portals show error toast on failure (`src/components/portals/SolarAuditPortal.tsx`, `HealthPortal.tsx`, `EventsPortal.tsx`, `LogisticsPortal.tsx`)

**6.2 — Custom order pipeline (user → admin)** ✅ COMPLETE

- ✅ Admin Fulfillment > Custom Orders tab reads real `custom_order_requests` with profile join
- ✅ "Convert to Order" navigates to Create Order wizard; "View Customer" deep-links to user detail
- ✅ Groceries portal freeform custom order form (`addCustomRequest`) wired to real DB (`src/components/portals/GroceriesPortal.tsx`)
- ✅ Logistics portal submission wired to real DB via `addServiceRequest`

**6.3 — Fulfillment tracking** ✅ COMPLETE

- ✅ Order Fulfillment, Service Requests, Custom Orders tabs all read real DB with profile joins
- ✅ Team assignment, SLA deadlines, priority, risk level, progress % all persisted to `fulfillment_tracking`
- ✅ Internal notes persisted to `fulfillment_notes` / `service_request_notes`

**6.4 — Audit log** ✅ COMPLETE

- ✅ `admin_audit_log` table in DB; `logAudit()` called from every admin action (orders, wallet, membership, products, portals, broadcasts, fulfillment)
- ✅ `AuditLog.tsx` now reads real data from `admin_audit_log` via `getAuditLog()` — removed all `mockAuditLog` references; shows admin name (profile join), action badge, entity type/id, new/old values in expandable row; action-prefix filter built dynamically from real data (`src/components/admin/AuditLog.tsx`)

### What works after Milestone 6

- Users can submit service requests and custom orders from the portals
- Admin sees all requests in the Fulfillment page, assigns to team, tracks through completion
- Every admin action is recorded in an auditable log
- Team members get notified when work is assigned to them

---

## Milestone 7: Analytics & Monitoring

**Goal**: Real analytics computed from actual data. Error tracking and product analytics from day one of production.

### Infrastructure

| Service | What to set up | Cost |
|---------|---------------|------|
| **Sentry** | Create project, install SDK in both repos, configure source maps | Free (5K errors/month) |
| **PostHog** | Create project, install SDK in both repos, configure events | Free (1M events/month) |
| **Supabase Edge Functions** | Daily analytics aggregation cron job | Free |

### Steps

**7.1 — Sentry integration**
- Install `@sentry/react` in both repos
- Configure error boundaries
- Set up source map uploads in build pipeline
- Configure alert rules for critical errors (payment failures, auth errors)

**7.2 — PostHog integration**
- Install `posthog-js` in both repos
- Track key events:
  - User app: page views, portal visits, add to cart, checkout start/complete, membership subscribe, referral link share
  - Admin app: page views, order status changes, product edits, wallet adjustments, broadcast sends
- Configure funnels: signup → browse → add to cart → checkout → complete
- Configure dashboards: cart abandonment, membership conversion, portal usage

**7.3 — Admin Analytics page (real data)**
- Replace mock computations with real Supabase queries
- User growth: query `users` table grouped by `created_at` month
- Fulfillment performance: query `orders` by status, `service_requests` by status
- Staff workload: query assignments grouped by team member
- Orders by portal: query `orders` grouped by `portal_id`
- Cart metrics: query `carts` table for active/abandoned counts

**7.4 — Admin Finance page (real data)**
- Pull transaction data from Paystack API (or from webhook-stored records)
- Calculate real revenue, fees, net income, success rates
- Real settlement data from Paystack settlements API
- Generate downloadable reports (CSV via papaparse, PDF via jspdf)

**7.5 — Daily aggregation cron**
- Edge Function that runs daily to pre-compute:
  - Revenue totals by portal and period
  - User signup counts by period
  - Order completion rates
  - Benefit usage summaries
- Store in an `analytics_snapshots` table for fast dashboard loading

### What works after Milestone 7

- Errors are caught and reported automatically in production
- Product analytics track real user behavior
- Admin Analytics and Finance pages show real computed data
- Downloadable CSV/PDF reports work

---

## Milestone 8: Deployment & Security

**Goal**: Both apps live on custom domains with HTTPS, CDN, DDoS protection, and proper environment configuration.

### Infrastructure

| Service | What to set up | Cost |
|---------|---------------|------|
| **Netlify** | Connect both repos, configure build settings, set environment variables | Free |
| **Cloudflare** | Register/transfer domain, configure DNS, enable CDN and WAF | Free |
| **GitHub Actions** | Add deployment pipeline: test → build → deploy | Free |

### Steps

**8.1 — Domain and DNS**
- Register or configure `lagosapps.com` domain
- Set up Cloudflare DNS:
  - `lagosapps.com` → Netlify (user app)
  - `admin.lagosapps.com` → Netlify (admin app)
- Enable Cloudflare proxy (CDN + DDoS protection)
- Configure SSL/TLS (Full Strict mode)

**8.2 — Netlify deployment**
- Connect `lagosapps` repo → auto-deploy to `lagosapps.com`
- Connect `lagosapps-admin` repo → auto-deploy to `admin.lagosapps.com`
- Set environment variables: Supabase URL/key, Paystack public key, Sentry DSN, PostHog key
- Configure build command (`npm run build`) and publish directory (`dist`)
- Set up deploy previews for pull requests

**8.3 — CI/CD pipeline**
- GitHub Actions workflow for both repos:
  - On push: lint → type check → build → run tests (when tests exist)
  - On push to main: auto-deploy via Netlify
- Add build status badges to READMEs

**8.4 — Security hardening**
- Review all Supabase RLS policies
- Ensure admin endpoints check team privileges server-side (not just frontend)
- Validate Paystack webhook signatures
- Ensure no secrets in client-side code (only SUPABASE_ANON_KEY and PAYSTACK_PUBLIC_KEY)
- Set secure cookie options for auth tokens
- Configure Cloudflare WAF rules for bot protection
- Rate limiting on auth endpoints (Supabase handles this)

**8.5 — Switch Paystack to live mode**
- Complete Paystack business verification
- Switch API keys from test to live
- Update webhook URL to production
- Toggle test mode off in admin Settings

### What works after Milestone 8

- Both apps live on custom domains with HTTPS
- Auto-deploy on every push to main
- DDoS protection and CDN for global performance
- Production-ready security

---

## Milestone 9: Messaging & Support

**Goal**: WhatsApp integration for order updates and customer support.

### Infrastructure

| Service | What to set up | Cost |
|---------|---------------|------|
| **WhatsApp Business API** (Meta direct) | Apply for WhatsApp Business account, get API access, configure webhook | Per-conversation (~₦30-50) |

### Steps

**9.1 — WhatsApp Business setup**
- Apply for Meta WhatsApp Business API access
- Create message templates (order confirmation, delivery update, booking confirmation)
- Get templates approved by Meta
- Configure webhook endpoint (Supabase Edge Function)

**9.2 — Outbound messaging**
- Send WhatsApp messages on key events:
  - Order confirmed
  - Order shipped/out for delivery
  - Order delivered
  - Service request status update
  - Booking confirmation
- Trigger from Supabase database triggers or Edge Functions

**9.3 — Inbound support**
- Receive WhatsApp messages from customers
- Route to admin dashboard (future: integrate with support queue)
- Admin can reply via WhatsApp from order/user detail pages

**9.4 — Admin-created orders via WhatsApp channel**
- When admin creates an order with channel = "WhatsApp", link the WhatsApp conversation
- Send order confirmation back through WhatsApp

### What works after Milestone 9

- Users receive WhatsApp updates for orders and bookings
- Admin can communicate with customers via WhatsApp
- Orders placed via WhatsApp are tracked in the system

---

## Features Not Yet Built (to implement during milestones)

These are features discussed but not yet coded. They should be built during the relevant milestone:

| Feature | Build during | Notes |
|---------|-------------|-------|
| **System Notifications page** (`/notifications`) | Milestone 5 | New sidebar page for internal admin alerts |
| **Alert preferences & thresholds** | Milestone 5 | Per-admin settings for which notifications to receive |
| **Topbar panel rebuild** | Milestone 5 | Currently shows broadcast data; must switch to system notifications |
| **Service request submission forms** (user app) | Milestone 6 | 13 request types across 5 portals |
| **Custom order freeform forms** (user app) | Milestone 6 | Groceries + Logistics freeform text |
| **CSV/PDF export** | Milestone 7 | Install papaparse + jspdf, wire up Export buttons |
| **Admin login page** | Milestone 1 | Currently no login gate on admin app |
| **Password reset flow** | Milestone 1 | Email-based via Supabase Auth + Resend |
| **Role guard enforcement** | Milestone 1 | Check team privileges before showing pages/actions |

---

## Infrastructure Summary by Milestone

| Milestone | New infrastructure | Running cost added |
|-----------|-------------------|-------------------|
| 1. Foundation | Supabase, GitHub Actions | Free |
| 2. Product Catalog | Supabase Storage | Free |
| 3. Orders & Cart | Paystack (test mode), Supabase Edge Functions | Free (test) |
| 4. Wallet & Membership | Paystack subscriptions, more Edge Functions | Free (test) |
| 5. Communication | Resend, Supabase Realtime | Free |
| 6. Operations | — (uses existing) | Free |
| 7. Analytics & Monitoring | Sentry, PostHog | Free |
| 8. Deployment | Netlify, Cloudflare, Paystack live | ₦0 fixed + Paystack fees |
| 9. Messaging | WhatsApp Business API | Per-conversation |

**Total fixed cost through Milestone 8: ₦0/month** (all services on free tiers)

**Variable costs in production**: Paystack transaction fees (1.5% + ₦100) + WhatsApp conversations (~₦30-50 each)

---

## Recommended Work Order

Milestones 1-4 are sequential — each depends on the previous. Milestones 5-7 can run in parallel after Milestone 4. Milestone 8 should happen before going live. Milestone 9 can happen any time after Milestone 3.

```
Milestone 1 (Foundation)
    ↓
Milestone 2 (Product Catalog)
    ↓
Milestone 3 (Orders & Cart)
    ↓
Milestone 4 (Wallet & Membership)
    ↓
    ├── Milestone 5 (Communication)     ← can run in parallel
    ├── Milestone 6 (Operations)        ← can run in parallel
    └── Milestone 7 (Analytics)         ← can run in parallel
         ↓
    Milestone 8 (Deployment & Security) ← before go-live
         ↓
    Milestone 9 (Messaging & Support)   ← post-launch
```

---

## Go-Live Checklist

Before launching to real users:

- [ ] Supabase RLS policies reviewed and tested
- [ ] Paystack switched from test to live mode
- [ ] All environment variables set in Netlify
- [ ] Cloudflare DNS configured and proxy enabled
- [ ] Sentry configured with alert rules
- [ ] PostHog tracking verified
- [ ] Admin team members created with correct roles and privileges
- [ ] Initial product catalog seeded and verified
- [ ] Membership tiers configured with correct pricing
- [ ] Resend domain verified and email templates tested
- [ ] Paystack webhook endpoint verified with test events
- [ ] Manual end-to-end test: signup → browse → cart → checkout → order confirmation
- [ ] Manual admin test: login → view order → update status → refund → check audit log
- [ ] Mobile testing on iOS Safari and Android Chrome
- [ ] Backup strategy confirmed (Supabase automatic backups on paid plan, or manual pg_dump schedule)
