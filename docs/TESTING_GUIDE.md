# LagosApps — Testing Guide

End-to-end checklist for verifying every feature on both the **admin dashboard** and **user-facing app**, via browser and API/CLI. Work through each section in order — many checks are dependencies for later ones.

> **Last browser test: 2026-04-26. All admin portal browser tests confirmed complete (S1–S15, S1C referral signup re-tested and verified, S13 team invite + privilege management verified). S16 (User App: Portals), S17 (User App: Cart & Checkout), S18 (User App: Wallet), S19 (User App: Membership), S20 (User App: Notifications), S21 (Paystack Webhook), S24 (Cross-App Integration) confirmed 2026-04-26. Admin Dashboard Testing Sequence (Phases 1–13) fully re-verified 2026-04-26. Additional fixes applied and re-verified 2026-04-26: order timeline now shows date + time; product deactivation fixed (missing `member_covered` column added via migration); benefit limit enforcement fixed (`limitCount` was always null — now loaded from `membership_tier_benefits`); wallet now auto-applied at checkout (no toggle) so Paystack is only charged the minimum. S10 (email templates UI) and S11 (fulfillment page) removed — both features removed from admin nav. S8 test steps updated to reflect correct routes: broadcast list/compose/detail at `/broadcast`, admin inbox at `/notifications`.** Bugs found and fixed during 2026-04-25 run: `flag_overdue_fulfillment()` used wrong enum value (`delivered` → `completed`); `send-email` Edge Function logo pointed to GitHub raw instead of Supabase Storage; `config.toml` template paths resolved from wrong directory; referral Bronze membership not showing after signup (race condition — setTimeout fired before email confirmation, moved to `loadProfile`). Bugs fixed 2026-04-26 (S3 browser test): refund txn ID exceeded `varchar(20)` (base-36 timestamp fix); create order blocked by single-portal guard (removed); duplicate status dropdowns in Order Detail (consolidated — progress now derived from status automatically); internal notes Add button silently failed (race on `currentUserId` state — replaced with `useAuth`); Risk Level in Order Detail was a manual dropdown (now auto-computed from SLA settings in Platform Settings); Fulfillment removed from sidebar nav. Bugs fixed 2026-04-26 (S5 work): membership notification trigger silently failed — `billing_cycle` enum and UUID id needed explicit `::TEXT` casts in `notify_membership_event()`; cancel subscription added to admin Membership page and user Membership panel; referral processing gate in `loadProfile` was blocking users who already had a paid membership tier from having referral row recorded; "Apply referral code" UI added to user Referrals panel. Built 2026-04-26 (S5C verified + promo codes): admin promo code system — `admin_referral_codes` + `admin_code_redemptions` tables, `redeem_admin_code()` RPC, Promo Codes tab in admin Referrals page, user-side fallback redemption in ReferralsPanel. Fixed 2026-04-26 (S6 verified): wallet transactions table was empty due to ambiguous FK embed (`wallet_transactions` has two FKs to `profiles`); fixed with explicit FK hint `profiles!wallet_transactions_user_id_fkey`. Also fixed benefit usage tracking — `doctor_consultations`, `car_rental_days`, `solar_product`, `event_venue_discount` were never tracked; added `PORTAL_BENEFIT` map in CartPanel so the correct benefit key is recorded when an order is confirmed for each portal.

---

## Progress Summary

**Legend:** ✅ Verified · 🟡 Partial · ⬜ Pending · — Not applicable

| # | Section | CLI / API | Browser |
| --- | --- | --- | --- |
| **Setup** | | | |
| — | DB connection + project link | ✅ PostgreSQL 17.6 · linked | — |
| — | Admin account exists | ✅ `mainlandtech24@gmail.com` promoted to `super_admin` | ✅ Signed in via Magic Link |
| — | Edge Functions deployed | ✅ `send-email` + `paystack-webhook` | — |
| **S1** | **Authentication** | | |
| 1A | Admin login | — | ✅ Magic link login · session persistence confirmed · verified 2026-04-26 |
| 1B | User signup | ✅ `profiles` trigger confirmed · 1 user in DB | ✅ Sign up confirmed · welcome email arrived |
| 1C | Referral signup | ✅ `referrals` schema confirmed | ✅ verified 2026-04-26 — referral code applied · Bronze subscription created · membership tier shows immediately after login |
| **S2** | **Admin: Users** | | |
| 2A–2B | Users list + User detail | ✅ Profiles table — 2 users confirmed after tests | ✅ Admin loads new users correctly · user detail page confirmed |
| **S3** | **Admin: Orders** | | |
| 3A–3C | Orders list · detail · create | ✅ `orders` table empty (no test orders yet) | ✅ Verified 2026-04-26 — create order · status change · refund flow · SLA risk badges · fulfillment assignee + notes |
| **S4** | **Admin: Inventory** | | |
| 4A–4C | Product CRUD · portal tabs | ✅ 74 products across 7 portals confirmed | ✅ Verified 2026-04-26 — add/edit/toggle product · category filters · portal-specific metadata. Re-verified 2026-04-26 — deactivate product confirmed after adding missing `member_covered` column via migration |
| **S5** | **Admin: Membership** | | |
| 5A–5D | Tier config · subscriptions · benefits | ✅ 3 tiers · 15 benefits · prices confirmed | ✅ 5A ✅ verified 2026-04-26 · 5C ✅ verified 2026-04-26 · 5D ✅ verified 2026-04-26 |
| **S6** | **Admin: Wallet** | | |
| 6A–6B | Transaction log · manual adjustment | ✅ Schema confirmed · 2 transactions in DB | ✅ Verified 2026-04-26 — transactions load with user names · manual adjustment works |
| **S7** | **Admin: Referrals** | | |
| 7A | Referrals list | ✅ Schema confirmed · table empty | ✅ verified 2026-04-26 |
| 7B | Promo codes | ✅ `admin_referral_codes` table + `redeem_admin_code()` RPC confirmed | ✅ verified 2026-04-26 |
| **S8** | **Admin: Notifications** | | |
| 8A–8D | Broadcasts · system panel · inbox | ✅ Realtime publications confirmed | ✅ verified 2026-04-26 — compose · send · retract · bell panel · email delivery confirmed |
| **S9** | **Admin: Settings** | | |
| 9A–9C | Portal toggles · alert prefs · profile | ✅ 7 portals — all `is_active = true` | ✅ verified 2026-04-26 — toggle portal off/on · portal disappears on user app · alert prefs save |
| ~~**S10**~~ | ~~**Admin: Email Templates**~~ | ~~Page removed — templates managed via Supabase Dashboard / `supabase/templates/`~~ | — |
| ~~**S11**~~ | ~~**Admin: Fulfillment**~~ | ~~Page removed — fulfillment tracking now embedded in Order Detail sidebar~~ | — |
| **S12** | **Admin: Audit Log** | | |
| 12A | Audit log table | ✅ Schema confirmed · table empty (populates after admin actions) | ✅ verified 2026-04-26 — entries appear · search + filter work · row expand shows diff |
| **S13** | **Admin: Team** | | |
| 13A | Team list · invite | ✅ `admin_team_members` seeded with super_admin | ✅ verified 2026-04-26 — entry visible · invite flow works · privilege management modal verified |
| **S14** | **Admin: Analytics & Finance** | | |
| 14A | Analytics charts | ✅ Wired to real DB | ✅ verified 2026-04-26 — charts populate with real orders/users/transactions |
| 14B | Finance overview | ✅ Wired to real DB | ✅ verified 2026-04-26 — revenue figures and wallet activity appear |
| **S15** | **Admin: Live Carts** | | |
| 15A | Live carts page | ✅ Schema confirmed | ✅ verified 2026-04-26 — page loads · empty state correct · populates with user carts |
| **S16** | **User App: Portals** | | |
| 16A | Portal display + toggle | ✅ All 7 active · 74 products seeded | ✅ verified 2026-04-26 |
| 16B | Solar portal | ✅ Solar packages + products seeded | ✅ verified 2026-04-26 |
| 16C | Health portal | ✅ Health products seeded | ✅ verified 2026-04-26 |
| 16D | Events portal | ✅ 3 venues seeded | ✅ verified 2026-04-26 |
| 16E | Logistics portal | — | ✅ verified 2026-04-26 |
| 16F | Groceries portal | ✅ 13 grocery products seeded | ✅ verified 2026-04-26 |
| 16G | Community portal | — | ✅ verified 2026-04-26 |
| 16H | Transport portal | ✅ 6 transport products seeded | ✅ verified 2026-04-26 |
| **S17** | **User App: Cart & Checkout** | | |
| 17A | Cart operations | ✅ `carts` + `cart_items` schema ready | ✅ verified 2026-04-26 |
| 17B | Card payment | ✅ `orders` schema + payment fields confirmed | ✅ verified 2026-04-26; re-verified 2026-04-26 — wallet auto-applied, Paystack charged minimum |
| 17C | Wallet-only payment | ✅ Schema confirmed | ✅ verified 2026-04-26 |
| 17D | Hybrid (wallet + card) | ✅ `wallet_deduction` + `payment_amount` fields confirmed | ✅ re-verified 2026-04-26 — wallet auto-covers benefit-exhausted items; Paystack handles remainder |
| 17E | Failed payment | ✅ Schema confirmed | ✅ verified 2026-04-26 |
| **S18** | **User App: Wallet** | | |
| 18A–18B | Top-up · history | ✅ `wallet_transactions` schema ready | ✅ verified 2026-04-26 |
| **S19** | **User App: Membership** | | |
| 19A–19B | Subscribe · admin view | ✅ 3 tiers + 15 benefits · `membership_subscriptions` ready | ✅ verified 2026-04-26; re-verified 2026-04-26 — benefit limits now enforced at checkout (limit_count loaded from tier benefits); usage counters update correctly per order |
| **S20** | **User App: Notifications** | | |
| 20A–20B | Broadcast inbox · order status | ✅ `user_notifications` in realtime publication | ✅ verified 2026-04-26 |
| **S21** | **Paystack Webhook** | | |
| 21A | Signature check (401) | ✅ Returns `401` on unsigned request | — |
| 21B–21C | End-to-end + idempotency replay | — | ✅ verified 2026-04-26 |
| **S22** | **Cron Jobs** | | |
| 22A | Schedules registered | ✅ 5 jobs — all `active = true` | — |
| 22B | Manual function calls | ✅ All 4 functions execute cleanly | — |
| 22C | Renewal reminder e2e | ✅ verified 2026-04-26 — test subscription created · function fires cleanly · subscription cleaned up | ✅ verified 2026-04-26 — email received in inbox · in-app notification appeared in user app |
| **S23** | **RLS Security** | | |
| 23A | Anon blocked from orders/wallet | ✅ Returns `[]` on both tables · products return 74 (public) | — |
| 23B | User JWT sees only own rows | ✅ policies confirmed — `auth.uid() = user_id` on orders + wallet_transactions | ⬜ REST API cross-user curl test (see Section 20B) |
| **S24** | **Cross-App Integration** | | |
| 24A–24C | Admin action → user · User action → admin | — | ✅ verified 2026-04-26 |
| **S25** | **DB Health Checks** | | |
| 25 | Orphans · balance drift · row counts | ✅ 0 orphaned items · 0 balance drift · 36 tables healthy | — |

---

## Environment Reference

| Item | Value |
|------|-------|
| Supabase project | `uhrlsvnmoemrakwfrjyf` |
| Supabase URL | `https://uhrlsvnmoemrakwfrjyf.supabase.co` |
| Admin app (local) | `http://localhost:5173` (run `npm run dev` in `lagosapps-admin`) |
| User app (local) | `http://localhost:5174` (run `npm run dev` in `Lagosapps`) |
| Edge Function: send-email | `https://uhrlsvnmoemrakwfrjyf.supabase.co/functions/v1/send-email` |
| Edge Function: paystack-webhook | `https://uhrlsvnmoemrakwfrjyf.supabase.co/functions/v1/paystack-webhook` |
| Paystack test dashboard | `https://dashboard.paystack.com/#/test` |
| Paystack test card (success) | `4084 0840 8408 4081`, expiry any future, CVV `408`, PIN `0000`, OTP `123456` |
| Paystack test card (fail) | `4084 0840 8408 4087`, CVV `408` |

### CLI prerequisites

```bash
# Supabase CLI (already installed — confirmed v2.90.0)
supabase --version

# Link to project (run once from admin repo)
cd lagosapps-admin
supabase link --project-ref uhrlsvnmoemrakwfrjyf
```

> **Important:** All `supabase db query` commands require `--linked` to run against the remote project (Docker is not required). Running without `--linked` will try to connect to a local Docker container and fail.

```bash
supabase db query --linked "SELECT 1;"
```

### Edge Function deployment

After any change to `supabase/functions/`, redeploy before testing — Netlify does **not** deploy Edge Functions:

```bash
supabase functions deploy send-email --project-ref uhrlsvnmoemrakwfrjyf
supabase functions deploy paystack-webhook --project-ref uhrlsvnmoemrakwfrjyf
```

### Admin account setup

> **First-time setup only.** The DB starts with no admin users. Before browser testing:
>
> 1. Go to Supabase Dashboard → Auth → Users → **Invite user** (or sign up via the user-facing app)
> 2. Promote the account to `super_admin` via CLI (see command below)
> 3. Navigate to the admin login page → enter the email → click **Email Me a Magic Link** → click the link in your inbox
>
> There is no password login on the admin dashboard. All team members sign in via magic link. Additional team members are invited from **Admin → Team → Invite Member** — this sends a magic link directly and grants role access automatically if the account already exists.

```bash
supabase db query --linked "UPDATE profiles SET role = 'super_admin' WHERE email = 'YOUR_EMAIL';"
```

---

## Section 1 — Authentication

### 1A · Admin login (browser) ✅ verified 2026-04-26

- [x] Navigate to admin app → `/`
- [x] Unauthenticated → redirected to `/login`
- [x] Enter email → click **Email Me a Magic Link** → "Check your inbox" confirmation shown
- [x] Click link in email → redirected to dashboard `/`
- [x] Refresh page → session persists, still logged in

### 1B · User signup (browser) ✅ verified 2026-04-25

- [x] Open user app → click **Sign Up**
- [x] Submit valid credentials → account created, user lands on dashboard
- [x] Verify welcome email arrives in inbox from `hello@lagosapps.com`
- [x] Verify `profiles` row created in DB:

```bash
supabase db query --linked "SELECT id, name, email, referral_code, role FROM profiles ORDER BY created_at DESC LIMIT 3;"
```

### 1C · Referral signup (browser) ✅ verified 2026-04-26

> **Bug fixed 2026-04-25**: referral code was provided at signup but membership was not applied. Root cause: `setTimeout(2000)` in `register()` called `auth.getUser()` before email confirmation so `authUser` was null → processing silently skipped. Fixed by moving the referral processing into `loadProfile()`, which runs after the SIGNED_IN event (guaranteed live session).

- [x] Copied referral code from Account page
- [x] Signed up in incognito with referral code
- [x] New user sees Bronze membership immediately after confirming email and logging in
- [x] Verify `referrals` row + `membership_subscriptions` row created:
  - `referrals`: `referrer_id` = original user, `gifted_tier = 'bronze'`, `status = 'confirmed'`
  - New user's `profiles.membership_tier = 'bronze'`
  - New user's `membership_subscriptions` has active Bronze row

```bash
supabase db query --linked "SELECT id, referrer_id, referred_id, gifted_tier, status FROM referrals ORDER BY created_at DESC LIMIT 3;"
```

---

## Section 2 — Admin Dashboard: Users

### 2A · Users list (browser) ✅ verified 2026-04-25

- [x] Navigate to `/users`
- [x] Table loads with real user rows (not mock data)
- [ ] Search by name → results filter live
- [ ] Filter by role (`user` / `admin`) → list updates
- [ ] Filter by membership tier → list updates
- [ ] Sort by "Joined" column

### 2B · User detail (browser) ✅ verified 2026-04-25

- [x] Click any user row → `/users/:id` loads
- [x] Profile section shows name, email, avatar, wallet balance, membership tier
- [ ] Orders tab shows that user's orders
- [ ] Wallet tab shows that user's transactions
- [ ] Suspend / Activate user → toast confirmation

### 2C · CLI verification ✅ verified 2026-04-25

```bash
# Count users by role
supabase db query --linked "SELECT role, COUNT(*) FROM profiles GROUP BY role;"

# Check user wallet balances
supabase db query --linked "SELECT name, email, wallet_balance, membership_tier FROM profiles WHERE role = 'user' LIMIT 5;"
```

---

## Section 3 — Admin Dashboard: Orders ✅ verified 2026-04-26

### 3A · Orders list (browser) ✅

- [x] Navigate to `/orders`
- [x] Real orders load (status badges, portal labels, amounts)
- [x] SLA stat cards visible at top — Total, Pending, At Risk, Behind SLA (values computed from order age vs SLA settings)
- [x] Search by order ID → finds correct row
- [x] Filter by status → list filters
- [x] Filter by portal → list filters

### 3B · Order detail (browser) ✅

- [x] Click any order → `/orders/:id` loads
- [x] Order timeline shows steps
- [x] Change order status via dropdown → status updates, timeline step added, fulfillment progress syncs automatically
- [x] Risk Level badge in header is read-only, auto-computed from order age vs SLA settings (configure in Settings → Platform → Fulfillment SLA)
- [x] Fulfillment section in sidebar: assign team member → saves; Add Note → note appears in thread
- [x] **Refund to Wallet** flow: click Refund → confirm modal → wallet credited, order cancelled

```bash
supabase db query --linked "SELECT user_id, description, amount, type, running_balance FROM wallet_transactions ORDER BY created_at DESC LIMIT 5;"
```

### 3C · Create Order (browser) ✅

- [x] Navigate to `/orders` → **+ Create Order** button → full-screen wizard
- [x] Step 1: select channel (WhatsApp / Phone / Walk-in) · search customer by name → select from dropdown
- [x] Step 2: switch portal tabs freely — products load per portal; items from multiple portals allowed
- [x] Step 3 Review: select payment method → Admin Notes → Submit
- [x] Order appears in orders list with status `pending`

```bash
supabase db query --linked "SELECT id, status, total_amount, created_at FROM orders ORDER BY created_at DESC LIMIT 3;"
```

---

## Section 4 — Admin Dashboard: Inventory ✅ verified 2026-04-26

### 4A · Product CRUD (browser) ✅

- [x] Navigate to `/inventory` → portal tabs load (Solar, Transport, Groceries, Health, Events, Community, Logistics)
- [x] Select any portal tab → products load from DB
- [x] Click **+ Add Product** → form opens
- [x] Fill fields, upload image → save → product appears in grid
- [x] Click edit on existing product → change price → save → price reflected
- [x] Toggle product active/inactive → `is_active` updates ✅ re-verified 2026-04-26 (fixed: `member_covered` column was missing from live DB)

### 4B · Portal-specific metadata ✅

- [x] Add a **Solar** product → solar-specific fields visible (capacity, voltage, warranty)
- [x] Add a **Health** product → health-specific fields visible

### 4C · CLI verification ✅ verified 2026-04-25

```bash
# Count products per portal — expected: 74 total across 7 portals
supabase db query --linked "SELECT sp.name, COUNT(p.id) as products FROM products p JOIN service_portals sp ON sp.id = p.portal_id GROUP BY sp.name ORDER BY sp.name;"

# Check recent products
supabase db query --linked "SELECT id, name, price, is_active, portal_id FROM products ORDER BY updated_at DESC LIMIT 5;"
```

---

## Section 5 — Admin Dashboard: Membership

### 5A · Tier configuration (browser) ✅ verified 2026-04-26

- [x] Navigate to `/membership` → **Configure Tiers** button → `/membership/tiers`
- [x] Annual and quarterly prices load from DB for each tier
- [x] Click **Edit Benefits** → add a new benefit → save → benefit appears
- [x] Change a tier price → save → price visible on user-facing membership panel

### 5B · CLI verification ✅ verified 2026-04-25

```bash
# Expected: Bronze (₦24k/yr, 4 benefits), Silver (₦42k/yr, 5), Gold (₦60k/yr, 6)
supabase db query --linked "SELECT t.name, t.annual_price, t.quarterly_price, COUNT(b.id) as benefits FROM membership_tiers t LEFT JOIN membership_tier_benefits b ON b.tier_id = t.id GROUP BY t.id, t.name, t.annual_price, t.quarterly_price ORDER BY t.annual_price;"
```

### 5C · Subscriptions tab (browser) — ✅ verified 2026-04-26

- [x] Active subscriptions listed with tier, billing cycle, expiry
- [x] Click **Cancel** on an active subscription → confirmation modal → **Yes, Cancel** → status changes to `cancelled`
- [x] Verify system notification `membership_cancelled` fired to ops team (check notification bell)
- [x] On user app: active membership → **Cancel** button → confirm → tier resets to `none`

### 5D · Benefit usage tab (browser) — ✅ verified 2026-04-26

- [x] Usage counts display and increment when users complete orders through portals (health, transport, solar, events)

---

## Section 6 — Admin Dashboard: Wallet

### 6A · Transaction log (browser) — ✅ verified 2026-04-26

- [x] Navigate to `/wallet`
- [x] Real transactions load with user names (profile join)
- [x] Search by user name → filters results
- [x] Filter by type (credit / debit) → filters results

### 6B · Manual adjustment (browser) — ✅ verified 2026-04-26

- [x] Click **Manual Adjustment** → form expands
- [x] Select user → amount → type (credit) → reason → **Submit Adjustment**
- [x] Transaction appears in the list immediately
- [x] User's wallet balance updated in DB

```bash
supabase db query --linked "SELECT description, amount, type, running_balance FROM wallet_transactions ORDER BY created_at DESC LIMIT 5;"
supabase db query --linked "SELECT name, wallet_balance FROM profiles WHERE role = 'user' ORDER BY wallet_balance DESC LIMIT 5;"
```

---

## Section 7 — Admin Dashboard: Referrals

### 7A · Referrals list (browser) — ✅ verified 2026-04-26

- [x] Navigate to `/referrals`
- [x] Referrer and referred names show (from profile join)
- [x] Rows with no referred user show "Pending sign-up"
- [x] Filter by status (pending / confirmed / expired)

```bash
supabase db query --linked "SELECT r.id, rp.name as referrer, ep.name as referred, r.gifted_tier, r.status FROM referrals r JOIN profiles rp ON rp.id = r.referrer_id LEFT JOIN profiles ep ON ep.id = r.referred_id ORDER BY r.created_at DESC LIMIT 10;"
```

### 7B · Promo codes tab (browser) — ✅ verified 2026-04-26

- [x] Navigate to `/referrals` → **Promo Codes** tab
- [x] Stat cards show Active Codes / Total Codes / Total Uses
- [x] Click **Create Code** → modal opens
- [x] Auto-generate code (click generate icon) → `LA` + 6 alphanumeric chars populates
- [x] Select tier (Bronze / Silver / Gold) → coloured button highlights
- [x] Toggle usage type: **Single** (max_uses=1) · **Limited** (number input appears) · **Unlimited** (max_uses=null)
- [x] Set optional expiry date and description → **Create Code** → row appears in table
- [x] Copy button copies code to clipboard
- [x] Deactivate button → confirmation modal → code status changes to Inactive
- [x] On user app: Referrals panel → enter promo code → membership tier activates matching the code's gifted tier
- [x] Single-use code auto-deactivates after redemption; table shows all codes by default (active + inactive)
- [x] Re-using the same code (single-use) → "This code has reached its usage limit"
- [x] Entering an expired code → "This code has expired"

```bash
supabase db query --linked "SELECT code, gifted_tier, max_uses, used_count, is_active, expires_at FROM admin_referral_codes ORDER BY created_at DESC LIMIT 10;"
supabase db query --linked "SELECT acr.user_id, p.name, arc.code, arc.gifted_tier FROM admin_code_redemptions acr JOIN admin_referral_codes arc ON arc.id = acr.code_id JOIN profiles p ON p.id = acr.user_id ORDER BY acr.redeemed_at DESC LIMIT 10;"
```

---

## Section 8 — Admin Dashboard: Broadcast & Notifications ✅ verified 2026-04-26

### 8A · Broadcast list (browser) ✅ verified 2026-04-26

- [x] Navigate to `/broadcast` → broadcast list loads (not stuck in loading loop)
- [x] Stat summary shows total / sent / draft counts
- [x] Search by title filters rows
- [x] Filter by type and status work

### 8B · Broadcast compose (browser) ✅ verified 2026-04-26

- [x] Click **New Broadcast** → navigates to `/broadcast/compose`
- [x] Fill title, message, select audience (All Users / tier / specific user)
- [x] **Save Draft** → redirects to list; row appears with Draft badge
- [x] **Send** → status changes to Sent; notification appears in user app inbox; email delivered via Resend

### 8C · Broadcast detail (browser) ✅ verified 2026-04-26

- [x] Click a sent broadcast row → navigates to `/broadcast/:id`
- [x] Read rate counter shown (updates as users read it)
- [x] **Retract** → status changes to Retracted; unread users no longer see it in inbox

### 8D · Admin notifications inbox (browser) ✅ verified 2026-04-26

- [x] Navigate to `/notifications` → admin inbox loads
- [x] System notifications listed (order updates, membership events, etc.)
- [x] Bell icon in topbar → panel opens; notifications appear without page refresh (Realtime)
- [x] Click notification → marks as read

---

## Section 9 — Admin Dashboard: Settings

### 9A · Portal toggles (browser) ✅ verified 2026-04-26

- [x] Navigate to `/settings`
- [x] Toggle a portal off → HIDDEN badge appears
- [x] Open user app → that portal should not appear (filtered by `is_active = true`)
- [x] Toggle back on → portal reappears on user app

### 9B · CLI verification ✅ verified 2026-04-25

```bash
# Expected: 7 portals, all is_active = true
supabase db query --linked "SELECT id, name, is_active FROM service_portals ORDER BY sort_order;"
```

### 9C · Alert preferences (browser) ✅ verified 2026-04-26

- [x] Alert Preferences card visible in Settings
- [x] Toggle individual category (e.g. Membership) off → notification no longer fires when membership is cancelled
- [x] Change Low Stock threshold → saves immediately (no Submit button)

```bash
supabase db query --linked "SELECT user_id, inventory_enabled, low_stock_threshold, wallet_enabled, large_txn_threshold FROM notification_preferences LIMIT 5;"
```

---

## ~~Section 10 — Email Templates~~ *(removed)*

> The `/emails` admin page has been removed. Email templates are managed directly in **Supabase Dashboard → Edge Functions → `send-email`** source, or via the `supabase/templates/` directory. Redeploy the function after any template change.

---

## ~~Section 11 — Admin Dashboard: Fulfillment~~ *(removed)*

> The standalone `/fulfillment` page was removed from the sidebar nav (2026-04-26). Fulfillment tracking (assignee, progress, risk level badge, internal notes) now lives in the right sidebar of each **Order Detail** page. See Section 3C for the verified Order Detail tests.

---

## Section 12 — Admin Dashboard: Audit Log ✅ verified 2026-04-26

### 12A · Browser ✅ verified 2026-04-26

- [x] Navigate to `/audit`
- [x] Real entries load (not mock data) — check that entries from previous test steps appear
- [x] Search by admin name → filters
- [x] Filter by action type (e.g. `order`) → only order-related actions shown
- [x] Expand a row → shows `new_values` / `old_values` JSON diff

```bash
supabase db query --linked "SELECT action, entity_type, entity_id, created_at FROM admin_audit_log ORDER BY created_at DESC LIMIT 10;"
```

---

## Section 13 — Admin Dashboard: Team ✅ verified 2026-04-26

### 13A · Team list · invite (browser) ✅ verified 2026-04-26

- [x] Navigate to `/team`
- [x] Own entry visible with role **Super Admin** and status Active
- [x] Click **Invite Member** → enter email, select role → **Send Invite** → toast confirms → magic link email received
- [x] Invited member logs in → account gets admin access correctly (trigger sets `profiles.role = 'admin'`)
- [x] **Privileges button** (per-row, super admin only) → modal opens with 15 page toggles
- [x] Toggle pages off/on → save → team member's nav reflects changes immediately

---

## Section 13 (User App) — User App: Portals & Products ✅ verified 2026-04-26

### 13A · Portal display (browser) ✅

- [x] All 7 portals visible on user dashboard (Solar, Transport, Groceries, Health, Events, Community, Logistics)
- [x] Toggle a portal off in admin Settings → refresh user app → portal disappears
- [x] Toggle back on → portal reappears

### 13B · Solar portal (browser) ✅

- [x] Open Solar portal → 4 paths visible (Free Audit, Shop, Installation, Maintenance)
- [x] **Free Audit** path → select purpose → select building → system estimate loads
- [x] Complete booking form → submit → request appears in admin Orders (custom request)
- [x] **Shop** path → categories load from DB → products load from DB → add to cart

### 13C · Health portal (browser) ✅

- [x] Open Health portal → services listed
- [x] **Home Medical Tests** → fill form (address, date, people, symptoms) → submit → request in admin Orders
- [x] **Medical Supplies** → grid loads from DB → select items → **Add to Cart**

### 13D · Events portal (browser) ✅

- [x] Open Events portal → venue list loads from DB
- [x] **Book a Venue** → select venue → fill date/duration/details → submit → request in admin Orders
- [x] **Event Coverage** → select services → submit

### 13E · Logistics portal (browser) ✅

- [x] Fill source, item links, delivery address → **Submit Now** → request in admin Orders > Custom Requests
- [x] **Add to Cart** alternative path also works

### 13F · Groceries portal (browser) ✅

- [x] Products load from DB in categories
- [x] Add standard product → appears in cart
- [x] **Can't find what you need?** freeform path → describe items → submit → appears in admin Orders > Custom Requests tab

### 13G · Community portal (browser) ✅

- [x] All 5 sections load (Impact, Sponsor, Donate, TEPLEARN, Volunteer)
- [x] Donation → enters amount → **Add to Cart** → checkout works

### 13H · Transport portal (browser) ✅

- [x] Products and routes load from DB
- [x] Add transport item → cart works

---

## Section 14 — User App: Cart & Checkout ✅ verified 2026-04-26 · re-verified 2026-04-26

### 14A · Cart operations (browser) ✅

- [x] Add item from any portal → cart badge increments
- [x] Open cart → item listed with correct price
- [x] Change quantity → total updates
- [x] Remove item → item disappears
- [x] **Clear Cart** → all items removed
- [x] Close app and reopen (or refresh) → cart persists (DB-backed)

```bash
supabase db query --linked "SELECT c.id, p.name as user, COUNT(ci.id) as items FROM carts c JOIN profiles p ON p.id = c.user_id JOIN cart_items ci ON ci.cart_id = c.id GROUP BY c.id, p.name ORDER BY c.updated_at DESC LIMIT 5;"
```

### 14B · Checkout — card payment (browser) ✅

- [x] Add item(s) to cart → proceed to checkout
- [x] Select **Pay by Card** → Paystack popup opens
- [x] Enter test card: `4084 0840 8408 4081`, any future expiry, CVV `408`
- [x] Enter PIN `0000`, OTP `123456`
- [x] Payment succeeds → order created with status `confirmed`
- [x] Order confirmation email arrives in inbox (check within ~30 seconds)
- [x] Order appears in admin `/orders`

```bash
supabase db query --linked "SELECT id, status, payment_method, total_amount FROM orders ORDER BY created_at DESC LIMIT 3;"
```

### 14C · Checkout — wallet payment (browser) ✅

- [x] Top up wallet first (see Section 15A)
- [x] Add item cheaper than wallet balance → checkout → select **Pay with Wallet**
- [x] Wallet balance deducted → `wallet_transactions` debit row created
- [x] Order confirmed

### 14D · Checkout — hybrid (wallet + card) (browser) ✅

- [x] Add item more expensive than wallet balance
- [x] Checkout → wallet balance auto-applied as partial; Paystack opens for remainder
- [x] Complete payment → order confirmed; wallet debited; card charged for difference

### 14E · Failed payment (browser) ✅

- [x] Cart → Pay → enter failing card `4084 0840 8408 4087`
- [x] Paystack shows error → user closes popup → cart is still intact
- [x] Order stays `pending` in DB (pre-created but never confirmed)

```bash
supabase db query --linked "SELECT id, status FROM orders ORDER BY created_at DESC LIMIT 1;"
```

---

## Section 15 — User App: Wallet ✅ verified 2026-04-26

### 15A · Top-up (browser)

- [x] Go to user dashboard → Wallet panel → **Top Up**
- [x] Enter amount (e.g. ₦5,000) → Paystack opens
- [x] Complete test card payment
- [x] Wallet balance increases immediately
- [x] Wallet top-up email arrives in inbox
- [x] Transaction appears in wallet history

```bash
supabase db query --linked "SELECT description, amount, type, running_balance FROM wallet_transactions ORDER BY created_at DESC LIMIT 5;"
```

### 15B · Transaction history (browser)

- [x] Wallet history shows all credits and debits with correct timestamps
- [x] Admin `/wallet` page also shows the same transactions (with user name)

---

## Section 16 — User App: Membership ✅ verified 2026-04-26 · re-verified 2026-04-26

### 16A · Subscribe (browser)

- [x] Go to user dashboard → Membership panel
- [x] Tiers and prices load from DB (not hardcoded)
- [x] Benefits listed under each tier (from `membership_tier_benefits`)
- [x] Toggle between Annual and Quarterly → prices update
- [x] Click **Subscribe** on Bronze → Paystack opens
- [x] Complete test payment
- [x] Membership tier on profile updates to `bronze`
- [x] `membership_subscriptions` row created with correct expiry

```bash
supabase db query --linked "SELECT user_id, tier, billing_cycle, amount_paid, starts_at, expires_at, status FROM membership_subscriptions ORDER BY created_at DESC LIMIT 3;"
```

### 16B · Admin view (browser)

- [x] Admin `/membership` → Subscriptions tab shows new subscription
- [x] Tier Config shows prices as set in DB

---

## Section 17 — User App: Notifications ✅ verified 2026-04-26

### 17A · Receive broadcast (browser)

- [x] In admin: compose and send a broadcast to All Users
- [x] In user app (same user is logged in): notification bell badge increments (Realtime)
- [x] Click notification → broadcast content visible
- [x] Mark as read → badge decrements

### 17B · Order status notification (browser)

- [x] In admin: change an order's status
- [x] User's order timeline updates (check Order Detail on user app)

---

## Section 18 — Paystack Webhook ✅ verified 2026-04-26

### 18A · Signature verification (CLI) ✅ verified 2026-04-25 — returns 401

```bash
# Unsigned request should return 401
curl -s -o /dev/null -w "%{http_code}" \
  -X POST https://uhrlsvnmoemrakwfrjyf.supabase.co/functions/v1/paystack-webhook \
  -H "Content-Type: application/json" \
  -d '{"event":"charge.success","data":{"reference":"TEST"}}'
```

Expected: `401`

### 18B · End-to-end via Paystack dashboard

- [x] Go to Paystack test dashboard → Logs → find a successful test charge
- [x] Verify the webhook was delivered (green checkmark)
- [x] Verify the order/wallet record was updated in DB

### 18C · Webhook replay (Paystack dashboard)

- [x] In Paystack Logs → find any successful event → click **Resend**
- [x] Verify DB stays consistent (idempotency guard prevents double-credit)

---

## Section 19 — Cron Jobs

### 19A · Verify schedules registered ✅ verified 2026-04-25

```bash
supabase db query --linked "SELECT jobname, schedule, command, active FROM cron.job ORDER BY jobname;"
```

Expected: 5 rows — all `active = true`

| jobname | schedule |
| --- | --- |
| `expire-memberships` | `0 1 * * *` |
| `expire-referrals` | `0 1 * * *` |
| `flag-overdue-orders` | `0 * * * *` |
| `membership-renewal-reminders` | `0 8 * * *` |
| `reset-benefit-usage` | `0 2 1 * *` |

### 19B · Manual trigger (CLI) ✅ all pass as of 2026-04-25

```bash
supabase db query --linked "SELECT expire_memberships();"
supabase db query --linked "SELECT expire_referrals();"
supabase db query --linked "SELECT flag_overdue_fulfillment();"
supabase db query --linked "SELECT send_membership_renewal_reminders();"
```

All should return without SQL errors.

### 19C · Trigger renewal reminder manually ✅ verified 2026-04-26 — email + in-app notification both confirmed

```bash
# Create a test subscription expiring in 3 days
supabase db query --linked "
  INSERT INTO membership_subscriptions (id, user_id, tier, billing_cycle, amount_paid, starts_at, expires_at, status)
  SELECT gen_random_uuid(), id, 'silver', 'annual', 50000,
         now() - interval '362 days',
         now() + interval '3 days',
         'active'
  FROM profiles WHERE role = 'user' LIMIT 1
  RETURNING id, user_id, expires_at;
"
supabase db query --linked "SELECT send_membership_renewal_reminders();"
# Clean up test subscription:
supabase db query --linked "DELETE FROM membership_subscriptions WHERE expires_at BETWEEN now() + interval '2 days' AND now() + interval '4 days' AND tier = 'silver';"
```

Function executes without error. No browser trigger — CLI only. Confirmed 2026-04-26: renewal email received in inbox and in-app notification visible in user app notifications panel.

---

## Section 20 — RLS (Row-Level Security)

### 20A · Unauthenticated access blocked ✅ verified 2026-04-25

```bash
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVocmxzdm5tb2VtcmFrd2ZyanlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2ODY2ODQsImV4cCI6MjA5MjI2MjY4NH0.VN59kY6Mb5_n2cjejx-wyiTcz_G_VmYjhq5w8P4A0lI"

# Unauthenticated anon → orders should return []
curl -s "https://uhrlsvnmoemrakwfrjyf.supabase.co/rest/v1/orders?select=id,user_id" \
  -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY"

# Unauthenticated anon → wallet_transactions should return []
curl -s "https://uhrlsvnmoemrakwfrjyf.supabase.co/rest/v1/wallet_transactions?select=id" \
  -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY"

# Products are public — should return 74 items
curl -s "https://uhrlsvnmoemrakwfrjyf.supabase.co/rest/v1/products?select=id" \
  -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY" \
  | python3 -c "import sys,json; print(len(json.load(sys.stdin)))"
```

Expected: `[]`, `[]`, `74`

### 20B · User JWT only sees own rows (CLI — REST API)

> `supabase db query` connects as the postgres superuser and bypasses RLS by design. The correct test is the Supabase REST API (PostgREST) with a real user JWT.

**Step 1 — Confirm policies exist (CLI)** ✅ verified 2026-04-26

```bash
supabase db query --linked "SELECT tablename, policyname, cmd, qual FROM pg_policies WHERE tablename IN ('orders', 'wallet_transactions') ORDER BY tablename, policyname;"
```

Expected: `Users read own orders` → `(auth.uid() = user_id) OR is_admin()` and `Users read own wallet` → same.

#### Step 2 — Get a real user JWT

`supabase db query` can't generate user JWTs. Get one from the browser instead (no app search button needed):

1. Open the user app in Chrome/Firefox
2. Open DevTools → **Application** tab → **Local Storage** → `https://uhrlsvnmoemrakwfrjyf.supabase.co`... or just **Session Storage**
3. Find the key `sb-uhrlsvnmoemrakwfrjyf-auth-token` → copy the `access_token` value

#### Step 3 — Run the cross-user REST test

```bash
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVocmxzdm5tb2VtcmFrd2ZyanlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2ODY2ODQsImV4cCI6MjA5MjI2MjY4NH0.VN59kY6Mb5_n2cjejx-wyiTcz_G_VmYjhq5w8P4A0lI"
USER_A_JWT="<paste access_token from DevTools>"

# User A sees only their own orders
curl -s "https://uhrlsvnmoemrakwfrjyf.supabase.co/rest/v1/orders?select=id,user_id" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $USER_A_JWT"
# Expected: array containing only User A's orders

# User A cannot read another user's specific order row
OTHER_USER_ORDER_ID="<an order_id that belongs to a different user_id>"
curl -s "https://uhrlsvnmoemrakwfrjyf.supabase.co/rest/v1/orders?select=id,user_id&id=eq.$OTHER_USER_ORDER_ID" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $USER_A_JWT"
# Expected: []

# User A cannot read another user's wallet transactions
curl -s "https://uhrlsvnmoemrakwfrjyf.supabase.co/rest/v1/wallet_transactions?select=id,user_id" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $USER_A_JWT"
# Expected: only User A's transactions
```

---

## Section 21 — Cross-App Integration ✅ verified 2026-04-26

### 21A · Admin action → user sees it (browser — two windows)

- [x] Open admin app and user app side by side
- [x] Admin changes order status → user's order detail updates (Realtime — no refresh)
- [x] Admin sends broadcast → user's notification badge increments (Realtime)
- [x] Admin toggles a portal off → user app portal disappears on next load

### 21B · User action → admin sees it (browser — two windows)

- [x] User submits a service request → admin Fulfillment > Service Requests shows it
- [x] User places an order → admin Orders list shows it
- [x] User tops up wallet → admin Wallet shows the credit transaction
- [x] User subscribes to membership → admin Membership subscriptions tab shows it

### 21C · Admin manual wallet adjustment → user sees it (browser)

- [x] Admin credits ₦10,000 to a user's wallet
- [x] User opens Wallet panel → balance increased, transaction in history

---

## Section 22 — Database Health Checks (CLI)

Run after testing to verify data integrity:

```bash
# Orphaned order items — expected: 0
supabase db query --linked "SELECT COUNT(*) as orphaned FROM order_items oi LEFT JOIN orders o ON o.id = oi.order_id WHERE o.id IS NULL;"

# Wallet running balance drift — expected: 0 rows
supabase db query --linked "
  SELECT p.name, p.wallet_balance, wt.running_balance as last_txn_balance
  FROM profiles p
  JOIN wallet_transactions wt ON wt.id = (
    SELECT id FROM wallet_transactions WHERE user_id = p.id ORDER BY created_at DESC LIMIT 1
  )
  WHERE ABS(p.wallet_balance - wt.running_balance) > 1
  LIMIT 5;
"

# Orphaned subscriptions — expected: 0
supabase db query --linked "SELECT COUNT(*) FROM membership_subscriptions ms LEFT JOIN profiles p ON p.id = ms.user_id WHERE p.id IS NULL;"

# Row counts by table (baseline after full test run)
supabase db query --linked "SELECT relname, n_live_tup FROM pg_stat_user_tables WHERE schemaname = 'public' ORDER BY n_live_tup DESC;"

# Recent audit log
supabase db query --linked "SELECT action, entity_type, entity_id, created_at FROM admin_audit_log ORDER BY created_at DESC LIMIT 10;"
```

---

## Admin Dashboard Testing Sequence

Work through these steps in order — each phase builds on the previous one (e.g. you need an order before testing Fulfillment, and a user before creating an order). Tick each checkbox as you go. After completing all phases, check the Audit Log to confirm every action was captured.

---

### Phase 1 — Settings & Profile ✅ verified 2026-04-26

**Goal:** Confirm your name saves and appears in the top nav; platform settings round-trip to DB; alert prefs save.

1. [x] Navigate to `/settings`
2. [x] **Profile section** → type your name in the Name field → click **Save Profile** → toast "Profile updated" appears
3. [x] Refresh the page → top nav shows your name and "Super Admin" role (not "Support" or blank)
4. [x] **Platform section** → note the current Support Email → change it → click **Save** → toast appears → refresh and confirm the change persisted
5. [x] **Portals section** → note all 7 are active → toggle one **off** → HIDDEN badge appears next to it → *(leave it off for now — you'll verify the user app effect in Phase 9)*
6. [x] **Alert Preferences** → toggle the Inventory category off → no error → refresh and confirm it stayed off → toggle it back on

---

### Phase 2 — Inventory ✅ verified 2026-04-26

**Goal:** Confirm all portal tabs load without blinking; products are real DB data; CRUD works.

7. [x] Navigate to `/inventory`
8. [x] Tab through all 7 portal tabs *(Solar, Transport, Groceries, Health, Events, Community, Logistics)* — each should load a product grid **once** with no repeated loading flash
9. [x] On the **Groceries** tab → category filter pills appear (Produce, Dairy, etc.) → click each pill → products filter correctly → click **All** to reset
10. [x] Click any product card → edit the price → click **Save** → toast confirms → price shown in the grid updates
11. [x] Click **Add Product** → fill Name, Price, Stock → click Save → new product appears in the grid
12. [x] Click the new product → toggle **Active** off → Save → the product card shows Inactive badge
13. [x] Delete the test product (or leave it inactive)

---

### Phase 3 — Users ✅ verified 2026-04-26

**Goal:** Confirm real user rows load; search and filters work; user detail page is functional.

14. [x] Navigate to `/users`
15. [x] Table loads with real user rows — no mock data
16. [x] Type a name or email in the search bar → list filters live
17. [x] Use the membership tier filter dropdown → list narrows
18. [x] Click any user row → `/users/:id` opens
19. [x] Profile card shows email, wallet balance, membership tier, referral code
20. [x] **Orders tab** → shows that user's orders (likely empty at this stage)
21. [x] **Wallet tab** → shows that user's transaction history (likely empty)
22. [x] Click **Suspend User** → status changes → click **Activate** to restore

---

### Phase 4 — Orders ✅ verified 2026-04-26

**Goal:** Create a test order from scratch; verify status changes, fulfillment tracking, and refund flow write to DB.

23. [x] Navigate to `/orders` → stat cards visible (Total, Pending, At Risk, Behind SLA)
24. [x] Click **+ Create Order** → full-screen 3-step wizard opens
25. [x] **Step 1:** Select channel (e.g. Walk-in) → search test user by name → select from dropdown
26. [x] **Step 2:** Switch to **Groceries** tab → products load from DB → add 2–3 items; optionally switch to another portal tab and add more items (multi-portal allowed)
27. [x] **Step 3 Review:** select Payment Method → click **Submit Order** → redirected to Order Detail
28. [x] Order Detail shows correct items, amounts, and `pending` status
29. [x] Change status to **Confirmed** → badge updates, timeline step added, fulfillment progress syncs automatically
30. [x] Change status to **Processing** → same
31. [x] **Fulfillment section (right sidebar):** assign yourself from the team dropdown → save → persists on refresh
32. [x] Add an internal note → note appears in thread with your name + timestamp
33. [x] Click **Refund** → confirm modal → toast "refunded to wallet" → order status → `cancelled`
34. [x] Go to `/users/:id` for that user → Wallet tab → credit transaction visible

---

### Phase 5 — Fulfillment *(page removed — now embedded in Order Detail)* ✅ verified 2026-04-26

> **2026-04-26:** The standalone `/fulfillment` page has been removed from the sidebar nav. Fulfillment tracking (assignee, progress, risk level badge, internal notes) now lives in the right sidebar of each Order Detail page. Service Requests and Custom Orders are still accessible via their own routes when those features are in use.

1. [x] Open any order at `/orders/:id`
2. [x] Fulfillment section visible in the right column — Assigned To dropdown, Save button, Internal Notes
3. [x] Assign a team member → save → refresh → assignment persists
4. [x] Add a note → note appears below with correct author name
5. [x] Risk Level badge next to order header reflects SLA age (configure thresholds in Settings → Platform → Fulfillment SLA)

---

### Phase 6 — Membership ✅ verified 2026-04-26

**Goal:** Tier config edits save; sticky sidebar nav works on the config page.

41. [x] Navigate to `/membership`
42. [x] Subscriptions tab → likely empty — empty state shows correctly
43. [x] Click **Configure Tiers** → `/membership/tiers` opens
44. [x] Sticky sidebar shows tier names (Bronze, Silver, Gold) → click **Silver** → page scrolls to Silver card
45. [x] Click **Edit Benefits** on Bronze → add a new benefit with a label → Save → benefit appears in list
46. [x] Change the Bronze **Annual Price** → Save → toast "Bronze tier saved"
47. [x] Go back to `/membership` → click **Edit** on the Bronze tier row → verify the new price is reflected

---

### Phase 7 — Wallet ✅ verified 2026-04-26

**Goal:** Manual adjustment credits a user's wallet and creates a transaction record.

48. [x] Navigate to `/wallet`
49. [x] Transaction log loads (may be empty or show the Phase 4 refund)
50. [x] Click **Manual Adjustment**
51. [x] Select the test user → Amount: ₦2,000 → Type: **Credit** → Reason: "Test credit" → Submit
52. [x] Transaction row appears immediately in the list
53. [x] Go to `/users/:id` → Wallet tab → ₦2,000 credit visible; running balance updated

---

### Phase 8 — Referrals ✅ verified 2026-04-26

**Goal:** Page loads cleanly with correct empty state.

54. [x] Navigate to `/referrals`
55. [x] Empty state shows correctly (no blinking, no loading spinner stuck)
56. [x] *(Will populate once real users sign up with referral codes in Phase 10+)*

---

### Phase 9 — Broadcast & Notifications ✅ verified 2026-04-26

**Goal:** Compose and send a broadcast; verify it appears in the notification bell and inbox.

57. [x] Navigate to `/broadcast`
58. [x] Click **Compose Broadcast**
59. [x] Title: "Test Broadcast" · Message: "This is a system test." · Audience: **All Users**
60. [x] Click **Send** → broadcast appears in list with status **Sent**
61. [x] Click the broadcast row → detail page shows · read rate counter shows 0
62. [x] Click the **notification bell** in the top nav → panel opens → broadcast notification appears
63. [x] Click the notification → marks as read → navigate to `/broadcast/:id`
64. [x] Navigate to `/notifications` (inbox page) → broadcast notification listed
65. [x] Category filter **System** → only system notifications shown
66. [x] Click **Mark all read** → all go grey
67. [x] Back on `/broadcast` → click **Retract** on the test broadcast → status changes to Retracted

---

### Phase 10 — Team ✅ verified 2026-04-26

**Goal:** Your super_admin entry is visible; magic link invite flow works; privilege management toggles work.

68. [x] Navigate to `/team`
69. [x] Your own entry is visible with role **Super Admin** and status Active
70. [x] Click **Invite Member** → enter a real email you can check → select role **Support** → click **Send Invite**
71. [x] Toast confirms invite sent → magic link email received → invited member can log in without "Access Denied"
72. [x] Click **Privileges** on a team member row → modal opens with 15 page toggles, pre-seeded from role defaults
73. [x] Toggle pages on/off → **Save Privileges** → member's sidebar nav reflects the changes

---

### Phase 11 — Analytics & Finance ✅ verified 2026-04-26

**Goal:** Charts and figures reflect the orders and transactions created in earlier phases.

1. [x] Navigate to `/analytics`
2. [x] Stat cards show real numbers (at least 1 order, 1 user)
3. [x] Revenue by portal chart shows a bar for Groceries (the test order)
4. [x] Monthly user growth chart has at least one data point
5. [x] Navigate to `/finance`
6. [x] Overview tab → total revenue and order count match the test order
7. [x] Transactions tab → wallet transactions from Phases 4 and 7 appear

---

### Phase 12 — Audit Log ✅ verified 2026-04-26

**Goal:** Every action taken in Phases 1–11 is captured with the correct admin name.

1. [x] Navigate to `/audit`
2. [x] Rows appear — your name shown in the Admin column for each
3. [x] Actions visible: `profile.update`, `order.create`, `order.status_change`, `wallet.manual_adjustment`, `membership_tier.update`, `portal.toggle`, `broadcast.send`, etc.
4. [x] Search for "order" → only order-related rows shown
5. [x] Change the Action filter to **wallet** → only wallet rows shown
6. [x] Click the expand icon on any row → Before/After values visible in the detail drawer

---

### Phase 13 — Live Carts ✅ verified 2026-04-26

**Goal:** Page loads without error; correct empty state.

86. [x] Navigate to `/carts`
87. [x] Empty state shows cleanly *(will populate once users add items via the user app)*

---

## Quick Smoke Test (15 minutes) ✅ verified 2026-04-26

1. [x] Admin: log in → verify dashboard loads with real data
2. [x] Admin: toggle one portal off → verify it disappears on user app
3. [x] Admin: toggle it back on
4. [x] User: sign up on the user-facing app → verify welcome email arrives ✅
5. [x] User: add Solar product to cart → checkout with Paystack test card
6. [x] Verify: order in admin Orders list; order confirmation email arrives
7. [x] User: top up wallet ₦5,000 → verify wallet top-up email arrives
8. [x] Admin: issue manual wallet credit of ₦1,000 → verify in user wallet history
9. [x] User: submit a Solar audit request → verify in admin Fulfillment > Service Requests
10. [x] Admin: send a broadcast to All Users → verify notification appears in user app inbox
11. [x] Admin: check Audit Log → last ~5 actions should be logged

---

## Known Limitations

| Item | Status |
|------|--------|
| WhatsApp notifications | Deferred to M9 — not yet implemented |
| Per-user benefit usage progress bars | ✅ Done — tracking wired in CartPanel on order confirmation; progress bar UI added to MembershipPanel (green → amber at 75% → red at 100%) |
| Supabase Auth emails | SMTP configured via Resend; branded templates applied in Dashboard → Auth → Email Templates |
| pg_cron job run history | `cron.job_run_details` not available on free plan; verify via Supabase Dashboard → Database → Cron instead |
| Analytics page | ✅ Wired to real DB — orders, users, wallet transactions |
| Finance page | ✅ Wired to real DB — orders and wallet transactions |
| Edge Function auto-deploy | Not handled by Netlify — must run `supabase functions deploy` manually after changes |

## Bugs Found & Fixed (2026-04-25)

| Bug | Fix |
| --- | --- |
| `flag_overdue_fulfillment()` used `'delivered'` which is not in `order_status` enum | Migration `20260425200000` replaced with `'completed'` |
| `send-email` Edge Function `DEFAULT_LOGO_URL` pointed to GitHub raw (webp) | Updated to Supabase Storage PNG URL; redeployed |
| `config.toml` template `content_path` resolved from `supabase/` dir instead of project root | Paths updated to `./supabase/templates/…` |
