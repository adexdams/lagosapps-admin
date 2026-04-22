# LagosApps — Implementation Plan

A step-by-step plan to take both the admin dashboard and user-facing app from frontend mock data to a fully functional production platform. Each milestone lists what gets built, what infrastructure is needed, and what becomes usable at the end.

---

## Current State (as of 2026-04-22)

**What's live and working:**

- **Supabase project** (`uhrlsvnmoemrakwfrjyf`, West EU Ireland) — linked, 36 tables + RLS + seed data
- **Admin dashboard** — auth + role-guarded routes, real profile loading from `profiles` table, login supports email/password + magic link + password reset
- **Netlify deployment** — auto-deploys from `main` branch, SPA fallback via `_redirects` + `netlify.toml`, secret-scan whitelist configured for public Supabase anon key, security headers + long-cache on `/assets/*`. Blank-page-on-refresh bug resolved. `ErrorBoundary` + `ConfigError` screens catch runtime failures.
- **Product catalog seeded + fully wired on admin side** — 74 products (all mapped to correct categories via backfill migration), 29 categories, 10 solar packages, 3 venues, 5 building types, 3 membership tiers + 15 benefits, 7 portals, 5 pricing zones. `InventoryPortal` + `ProductForm` do full CRUD with portal-specific metadata (solar/transport/health/events/logistics fields), audit logging, and `products` bucket image upload via shared `ImageUpload` component.
- **Admin avatars** — upload to `avatars` bucket, stored on `profiles.avatar_url`; rendered in topbar and User Detail
- **Resend integration** — domain `lagosapps.com` verified, sending from `hello@lagosapps.com`, Edge Function `send-email` deployed, 6 email templates seeded and editable from `/emails` admin page with banner/logo upload
- **Welcome email trigger** — fires automatically on every new `profiles` row via `pg_net` + Edge Function (covers both user-app signup and admin-created users)
- **Email preview system** — dry-run endpoint returns rendered HTML; reusable `EmailPreviewModal` with desktop/mobile views; preview works for both email templates and broadcasts
- **Storage buckets** — `email-assets` (admin-only write), `products` (admin-only write), `avatars` (users manage own via `{user_id}/...` path convention)
- **User-facing app** — schema-aligned (reads from `profiles` extending `auth.users`), docs cross-linked with admin repo

**What's still on mock data / still needs wiring:**

- **Admin pages** — still render from `adminMockData.ts` (fallback hook in place; pages migrate incrementally as real data flows in)
- **User-facing app** — still uses localStorage auth + hardcoded product arrays; Supabase client installed but not yet wired to DB
- **Paystack** — not integrated yet (Milestone 3)
- **Broadcasts + transactional emails** — welcome email is live end-to-end; order confirmation / wallet topup / membership renewal triggers wait on Paystack webhook + cron jobs
- **WhatsApp** — deferred to Milestone 9

---

## Milestone Overview

| # | Milestone | Status | What becomes usable | Infrastructure |
|---|-----------|--------|--------------------|---|
| 1 | Foundation | ✅ Complete | Auth, user accounts, DB schema, API layer | Supabase (Auth + DB) |
| 2 | Product Catalog | 🟡 Partial (admin side complete, user-app portal migration pending) | Real inventory, admin CRUD, user browsing | Supabase Storage |
| 3 | Orders & Cart | ⬜ Not started | Real checkout, order management, fulfillment | Paystack |
| 4 | Wallet & Membership | ⬜ Not started | Payments, subscriptions, wallet top-ups, benefits | Paystack (subscriptions) |
| 5 | Communication | 🟡 Partial (email infra done, triggers pending) | Broadcasts to users, internal admin notifications | Resend |
| 6 | Operations | ⬜ Not started | Service requests, custom orders, fulfillment tracking | — |
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

**1.4 — Auth integration (user-facing app)** — deferred to when working on user repo

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

**2.3 — User-facing portal migration**
- ⬜ Replace hardcoded product arrays in all 7 portal components with Supabase queries
- ⬜ Extract data files (Step 7-8 from migration plan) as an interim step if needed
- ⬜ Ensure product images load from Supabase Storage

**2.4 — Admin profile avatars** ✅ COMPLETE
- ✅ `SettingsPage.tsx` avatar upload wired to `avatars` bucket using `{user_id}/avatar.{ext}` path convention; saves public URL to `profiles.avatar_url`; cache-busting query param so new uploads show immediately; audit logged as `profile.avatar_update`
- ✅ `AdminLayout.tsx` topbar avatar displays `profile.avatar_url` image when present, initials fallback otherwise
- ✅ `UserDetail.tsx` fetches `profiles.avatar_url` for the viewed user on mount and renders image (initials fallback if none or mock ID)

### What works after Milestone 2

- Admin can add, edit, and remove products with images across all 7 portals
- Users see real products with real images when browsing portals
- Product changes are instant (no deploy needed)

---

## Milestone 3: Orders & Cart

**Goal**: Users can add items to cart and complete real checkout. Admin can manage orders through the full lifecycle.

### Infrastructure

| Service | What to set up | Cost |
|---------|---------------|------|
| **Paystack** | Create merchant account, get test API keys, configure webhook URL | Free (1.5% + ₦100 per txn) |
| **Supabase Edge Functions** | Deploy Paystack webhook handler | Free |

### Steps

**3.1 — Cart system (user app)**
- Replace `CartProvider.tsx` localStorage with Supabase `carts` + `cart_items` tables
- Cart persists server-side, syncs across devices
- Admin can view user carts via Live Carts page (already built)

**3.2 — Checkout flow (user app)**
- Replace simulated `PaystackCheckout.tsx` with real Paystack Inline JS
- Implement checkout: create order → initiate Paystack payment → await webhook → update order status
- Handle payment methods: card, bank transfer, USSD
- Handle wallet deduction as partial payment

**3.3 — Paystack webhook handler**
- Create Supabase Edge Function to receive Paystack webhooks
- On payment success: update order status to "confirmed", record payment reference, deduct wallet if applicable
- On payment failure: update order to "pending", notify user
- Verify webhook signatures for security

**3.4 — Order management (admin app)**
- Connect Orders page to real order data
- Wire up status transitions (pending → confirmed → processing → completed/cancelled)
- Implement refund flow: admin triggers refund → Paystack refund API → credit user wallet
- Connect Create Order (admin) to create real orders on behalf of customers
- Connect Order Detail timeline to real `order_timeline` table

**3.5 — Live Carts (admin app)**
- Connect Live Carts page to real `carts` table
- Implement abandoned cart detection based on `updated_at` timestamp
- Wire up "Send Reminder" to create a notification for the user

### What works after Milestone 3

- Users can browse products, add to cart, and pay with real money (in test mode)
- Admin can see all orders, update statuses, issue refunds
- Admin can create orders for walk-in/phone/WhatsApp customers
- Admin can monitor active and abandoned carts

---

## Milestone 4: Wallet & Membership

**Goal**: Wallet top-ups, membership subscriptions with real billing, referral rewards, and benefit usage tracking all work end-to-end.

### Infrastructure

| Service | What to set up | Cost |
|---------|---------------|------|
| **Paystack** (already set up) | Configure subscription plans for Bronze/Silver/Gold (annual + quarterly) | — |
| **Supabase Edge Functions** | Cron jobs for membership expiry, referral expiry, benefit usage period resets | Free |

### Steps

**4.1 — Wallet system**
- Connect Wallet top-up flow to Paystack (user adds money → Paystack payment → credit wallet via webhook)
- Connect admin manual wallet adjustments to real `wallet_transactions` table
- Implement wallet deduction during checkout (partial or full)
- Display real transaction history on user dashboard and admin Wallet page

**4.2 — Membership subscriptions**
- Create Paystack subscription plans matching tier pricing
- Implement subscribe flow: user selects tier → Paystack payment → create subscription record
- Implement upgrade/downgrade: calculate prorated amount or wallet refund
- Connect admin Membership page to real subscription data
- Connect Membership Tier Config to real `membership_tiers` + `membership_tier_benefits` tables

**4.3 — Benefit usage tracking**
- Track per-user benefit consumption in `membership_benefit_usage` table
- Increment usage when a benefit is used (e.g., free delivery applied to order)
- Display progress bars on user dashboard and admin User Detail
- Connect admin Membership Benefit Usage tab to real aggregate data

**4.4 — Referral system**
- Generate real referral codes stored in DB
- On referred user signup: create referral record, grant membership
- Implement expiry logic (Supabase cron: mark expired after 6 months)
- Connect admin Referrals page to real referral data

**4.5 — Cron jobs**
- Deploy Edge Functions for scheduled tasks:
  - Daily: check and expire memberships past `expires_at`
  - Daily: check and expire referrals past duration
  - Monthly: reset benefit usage counters for new period
  - Daily: flag overdue orders for fulfillment alerts

### What works after Milestone 4

- Users can top up wallets, subscribe to membership tiers, and use benefits
- Referral links generate real memberships for referred users
- Admin can manage all financial data with real numbers
- Automated expiry and usage resets run without manual intervention

---

## Milestone 5: Communication — 🟡 PARTIAL (infrastructure complete, wiring to app events pending)

**Goal**: Admin can broadcast messages to users via email. Internal system notifications alert admin team members about events that need attention.

### Infrastructure

| Service | Status |
|---------|--------|
| **Resend** | ✅ Account created, domain `lagosapps.com` verified (DKIM + SPF + MX + DMARC), API key stored in Edge Function secrets, sending from `hello@lagosapps.com` |
| **Supabase Realtime** | ⬜ Not yet enabled on `system_notifications` (deferred until UI is wired) |

### Steps

**5.1 — Broadcast system (admin → users)** 🟡 Partial

- ✅ `broadcasts` + `broadcast_recipients` tables created
- ✅ Broadcast template seeded in `email_templates` with `{{title}}` + `{{message}}` interpolation
- ✅ Broadcast Compose UI has working "Preview Email" button (uses real rendering pipeline)
- ✅ Save as Draft button wired (UI only, not persisting to DB yet)
- ⬜ Wire Broadcast Compose send button to create `broadcasts` row + fan-out `broadcast_recipients`
- ⬜ Trigger Resend send for each recipient via the `send-email` Edge Function
- ⬜ Connect Broadcast list and Broadcast Detail pages to real DB data (read rates from `broadcast_recipients`)
- ⬜ Implement retract: update broadcast status, mark `retracted: true` on unread recipient rows

**5.2 — Transactional emails (system → users)** 🟡 Infrastructure complete

- ✅ `send-email` Edge Function deployed and tested (welcome + order_confirmation emails sent successfully to test inbox)
- ✅ All 6 email templates seeded and editable from `/emails` admin page: welcome, password_reset, order_confirmation, wallet_topup, membership_renewal, broadcast
- ✅ Template variable interpolation working (`{{name}}`, `{{orderId}}`, etc.)
- ✅ Shared layout with logo header, optional per-template banner, content, branded footer (`hello@lagosapps.com`)
- ✅ Dry-run preview endpoint and `EmailPreviewModal` with desktop/mobile views
- ✅ Typed helpers in `src/lib/email.ts`: `sendWelcomeEmail`, `sendPasswordResetEmail`, `sendOrderConfirmationEmail`, `sendWalletTopupEmail`, `sendMembershipRenewalEmail`, `sendBroadcastEmail`, `sendCustomEmail`, `previewEmail`
- 🟡 Wire triggers from app events:
  - ✅ New user signup → welcome email (DB trigger `on_profile_created_send_welcome` fires `send-email` Edge Function via `pg_net` whenever a row is inserted into `profiles`; works for both user-facing signup and admin-created users)
  - ⬜ Paystack webhook success → order confirmation + wallet topup email
  - ⬜ Cron job → membership renewal reminder (3 days before expiry)
  - ⬜ Referral confirmed → referral bonus email
- ⬜ Optionally route Supabase Auth emails (confirm signup, password reset) through Resend SMTP — requires one-time SMTP config in Supabase Dashboard

**5.3 — Internal system notifications (admin-to-admin)** 🟡 Schema ready

- ✅ `system_notifications` table created with all 20+ notification types as CHECK constraint
- ✅ RLS policies: admin reads own, update own, system can insert
- ⬜ Build notification generation logic (Supabase database triggers or Edge Functions):
  - When service request is assigned → notify assigned team member
  - When order is pending > X hours → notify operations team
  - When stock drops below threshold → notify operations team
  - When large wallet transaction occurs → notify finance team
  - When team member role/privileges change → notify the member
  - When membership expires → notify support team
  - When fulfillment SLA is at risk → notify assigned team member
  - When custom order request arrives → notify operations team
- ⬜ Rebuild topbar Notification Panel to fetch from `system_notifications` (currently shows broadcasts from mock data)
- ⬜ Add "View all" link to new Notifications page

**5.4 — Notifications page (new admin page)** ⬜

- ⬜ Create `/notifications` page in sidebar
- ⬜ Show all system notifications for the logged-in admin
- ⬜ Read/unread management with mark individual and mark all
- ⬜ Filter by notification type

**5.5 — Alert preferences and thresholds** 🟡 Schema ready

- ✅ `notification_preferences` table created with all 8 categories + threshold columns (low_stock, large_transaction, overdue_hours, sla_risk_hours)
- ✅ RLS policy: admin manages own preferences
- ⬜ Build Alert Settings UI section in Notifications page or Settings page
- ⬜ Wire threshold values into notification-generation triggers
- ⬜ Enable Supabase Realtime on `system_notifications` for live topbar updates

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

## Milestone 6: Operations

**Goal**: Service requests, custom orders, and fulfillment tracking work with real data and real team assignment.

### Infrastructure

No new infrastructure — uses Supabase tables and Edge Functions from previous milestones.

### Steps

**6.1 — Service request pipeline (user → admin)**
- Create submission forms in user-facing app for each request type:
  - Solar: audit booking, installation request, maintenance request
  - Health: home visit booking, health check booking, consultation
  - Events: venue booking, training room booking, coverage request
  - Community: volunteer application, sponsorship, donation
  - Logistics: forwarding request
- Each form writes to `service_requests` table
- Connect admin Fulfillment > Service Requests tab to real data

**6.2 — Custom order pipeline (user → admin)**
- Add freeform request option in Groceries portal ("tell us what you need")
- Add freeform description in Logistics portal
- Write to `custom_order_requests` table
- Connect admin Fulfillment > Custom Orders tab to real data
- Implement "Convert to Order" flow: pre-fill Create Order with customer data

**6.3 — Fulfillment tracking**
- Connect Order Fulfillment tab to real orders with `processing`/`confirmed` status
- Implement team assignment: write `assigned_to` field on orders and requests
- Track SLA deadlines and progress in database
- Generate system notifications when tasks are assigned or SLA is at risk

**6.4 — Audit log**
- Implement real audit logging: every admin action writes to `admin_audit_log`
- Use Supabase database triggers to capture old/new values automatically
- Connect Audit Log page to real data with filtering

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
