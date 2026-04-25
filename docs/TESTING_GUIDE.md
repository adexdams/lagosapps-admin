# LagosApps — Testing Guide

End-to-end checklist for verifying every feature on both the **admin dashboard** and **user-facing app**, via browser and API/CLI. Work through each section in order — many checks are dependencies for later ones.

> **Last run: 2026-04-25.** Bugs found and fixed during run: `flag_overdue_fulfillment()` used wrong enum value (`delivered` → `completed`); `send-email` Edge Function logo pointed to GitHub raw instead of Supabase Storage; `config.toml` template paths resolved from wrong directory.

---

## Progress Summary

**Legend:** ✅ Verified · ⬜ Pending · 🔑 Needs admin account first · — Not applicable

| # | Section | CLI / API | Browser |
| --- | --- | --- | --- |
| **Setup** | | | |
| — | DB connection + project link | ✅ PostgreSQL 17.6 · linked | — |
| — | Admin account exists | ✅ `mainlandtech24@gmail.com` promoted to `super_admin` | 🔑 Sign in via Magic Link |
| — | Edge Functions deployed | ✅ `send-email` + `paystack-webhook` | — |
| **S1** | **Authentication** | | |
| 1A | Admin login | — | ⬜ Login via magic link · session persistence |
| 1B | User signup | ✅ `profiles` trigger confirmed · 1 user in DB | ⬜ Sign up · welcome email arrives |
| 1C | Referral signup | ✅ `referrals` schema confirmed | ⬜ Incognito sign-up with referral code → Bronze gifted |
| **S2** | **Admin: Users** | | |
| 2A–2B | Users list + User detail | ✅ Profiles table — 1 user, role breakdown confirmed | ⬜ Table loads · search · filter · user detail page |
| **S3** | **Admin: Orders** | | |
| 3A–3C | Orders list · detail · create | ✅ `orders` table empty (no test orders yet) | ⬜ Create order · status change · refund flow |
| **S4** | **Admin: Inventory** | | |
| 4A–4C | Product CRUD · portal tabs | ✅ 74 products across 7 portals confirmed | ⬜ Add/edit/toggle product · image upload |
| **S5** | **Admin: Membership** | | |
| 5A–5D | Tier config · subscriptions · benefits | ✅ 3 tiers · 15 benefits · prices confirmed | ⬜ Edit tier price · cancel subscription |
| **S6** | **Admin: Wallet** | | |
| 6A–6B | Transaction log · manual adjustment | ✅ Schema confirmed · table empty | ⬜ Manual credit → user wallet updates |
| **S7** | **Admin: Referrals** | | |
| 7A | Referrals list | ✅ Schema confirmed · table empty | ⬜ Table loads after referral sign-up |
| **S8** | **Admin: Notifications** | | |
| 8A–8D | Broadcasts · system panel · inbox | ✅ Realtime publications confirmed | ⬜ Compose · send · retract · bell panel |
| **S9** | **Admin: Settings** | | |
| 9A–9C | Portal toggles · alert prefs | ✅ 7 portals — all `is_active = true` | ⬜ Toggle portal off → hidden on user app |
| **S10** | **Admin: Email Templates** | | |
| 10A–10C | Template editor · dry-run · live send | ✅ Dry-run returns `success:true` · Supabase Storage logo confirmed | — Page removed from admin nav; templates managed via Supabase Dashboard |
| **S11** | **Admin: Fulfillment** | | |
| 11A–11C | Order queue · service requests · custom orders | ✅ Schema confirmed · all tables empty | ⬜ Assign order · update request status · convert to order |
| **S12** | **Admin: Audit Log** | | |
| 12A | Audit log table | ✅ Schema confirmed · table empty (populates after admin actions) | ⬜ Verify entries appear after browser actions |
| **S13** | **User App: Portals** | | |
| 13A | Portal display + toggle | ✅ All 7 active · 74 products seeded | ⬜ All 7 visible · toggle off/on via admin |
| 13B | Solar portal | ✅ Solar packages + products seeded | ⬜ Free Audit form → admin Fulfillment |
| 13C | Health portal | ✅ Health products seeded | ⬜ Medical test form + supplies cart |
| 13D | Events portal | ✅ 3 venues seeded | ⬜ Book venue → admin Fulfillment |
| 13E | Logistics portal | — | ⬜ Submit request → admin Fulfillment |
| 13F | Groceries portal | ✅ 13 grocery products seeded | ⬜ Add to cart + freeform custom request |
| 13G | Community portal | — | ⬜ Donation → cart → checkout |
| 13H | Transport portal | ✅ 6 transport products seeded | ⬜ Add to cart |
| **S14** | **User App: Cart & Checkout** | | |
| 14A | Cart operations | ✅ `carts` + `cart_items` schema ready | ⬜ Add/remove/clear · persistence on refresh |
| 14B | Card payment | ✅ `orders` schema + payment fields confirmed | ⬜ Test card `4084 0840 8408 4081` → order confirmed · email arrives |
| 14C | Wallet-only payment | ✅ Schema confirmed | ⬜ Top up wallet first · full wallet checkout |
| 14D | Hybrid (wallet + card) | ✅ `wallet_deduction` + `payment_amount` fields confirmed | ⬜ Partial wallet + Paystack remainder |
| 14E | Failed payment | ✅ Schema confirmed | ⬜ Failing card → order stays `pending` · cart intact |
| **S15** | **User App: Wallet** | | |
| 15A–15B | Top-up · history | ✅ `wallet_transactions` schema ready | ⬜ Top up ₦5,000 · top-up email arrives |
| **S16** | **User App: Membership** | | |
| 16A–16B | Subscribe · admin view | ✅ 3 tiers + 15 benefits · `membership_subscriptions` ready | ⬜ Subscribe Bronze · expiry shown · admin Membership tab |
| **S17** | **User App: Notifications** | | |
| 17A–17B | Broadcast inbox · order status | ✅ `user_notifications` in realtime publication | ⬜ Broadcast arrives without refresh · order status updates |
| **S18** | **Paystack Webhook** | | |
| 18A | Signature check (401) | ✅ Returns `401` on unsigned request | — |
| 18B–18C | End-to-end + idempotency replay | — | ⬜ Paystack test dashboard → Logs → Resend |
| **S19** | **Cron Jobs** | | |
| 19A | Schedules registered | ✅ 5 jobs — all `active = true` | — |
| 19B | Manual function calls | ✅ All 4 functions execute cleanly | — |
| 19C | Renewal reminder e2e | ⬜ Needs a real user to send email to | ⬜ Check inbox after `send_membership_renewal_reminders()` |
| **S20** | **RLS Security** | | |
| 20A | Anon blocked from orders/wallet | ✅ Returns `[]` on both tables · products return 74 (public) | — |
| 20B | User JWT sees only own rows | ✅ RLS enabled on all 36 tables | ⬜ Two users · cross-query returns `[]` |
| **S21** | **Cross-App Integration** | | |
| 21A–21C | Admin action → user · User action → admin | — | ⬜ Side-by-side browser test for realtime sync |
| **S22** | **DB Health Checks** | | |
| 22 | Orphans · balance drift · row counts | ✅ 0 orphaned items · 0 balance drift · 36 tables healthy | — |

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

### 1A · Admin login (browser)

- [ ] Navigate to admin app → `/`
- [ ] Unauthenticated → redirected to `/login`
- [ ] Enter email → click **Email Me a Magic Link** → "Check your inbox" confirmation shown
- [ ] Click link in email → redirected to dashboard `/`
- [ ] Refresh page → session persists, still logged in

### 1B · User signup (browser)

- [ ] Open user app → click **Sign Up**
- [ ] Submit with mismatched passwords → inline error shown
- [ ] Submit valid credentials → account created, user lands on dashboard
- [ ] Verify welcome email arrives in inbox from `hello@lagosapps.com`
- [ ] Verify `profiles` row created in DB:

```bash
supabase db query --linked "SELECT id, name, email, referral_code, role FROM profiles ORDER BY created_at DESC LIMIT 3;"
```

### 1C · Referral signup (browser)

- [ ] Log into user app as existing user → go to **Account** → copy referral code (e.g. `LA65664D`)
- [ ] Open incognito window → sign up with that code in the referral field
- [ ] Verify:
  - Welcome email arrives
  - `referrals` row created with `referrer_id` = existing user, `gifted_tier = 'bronze'`
  - New user has `membership_tier = 'bronze'` in `profiles`

```bash
supabase db query --linked "SELECT id, referrer_id, referred_id, gifted_tier, status FROM referrals ORDER BY created_at DESC LIMIT 3;"
```

---

## Section 2 — Admin Dashboard: Users

### 2A · Users list (browser)

- [ ] Navigate to `/users`
- [ ] Table loads with real user rows (not mock data)
- [ ] Search by name → results filter live
- [ ] Filter by role (`user` / `admin`) → list updates
- [ ] Filter by membership tier → list updates
- [ ] Sort by "Joined" column

### 2B · User detail (browser)

- [ ] Click any user row → `/users/:id` loads
- [ ] Profile section shows name, email, avatar, wallet balance, membership tier
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

## Section 3 — Admin Dashboard: Orders

### 3A · Orders list (browser)

- [ ] Navigate to `/orders`
- [ ] Real orders load (status badges, portal labels, amounts)
- [ ] Search by order ID → finds correct row
- [ ] Filter by status → list filters
- [ ] Filter by portal → list filters

### 3B · Order detail (browser)

- [ ] Click any order → `/orders/:id` loads
- [ ] Order timeline shows steps
- [ ] Change order status via dropdown → status updates in table on back navigation
- [ ] **Refund to Wallet** flow: click Refund → enter amount → confirm → check wallet balance increases for that user

```bash
supabase db query --linked "SELECT user_id, description, amount, type, running_balance FROM wallet_transactions ORDER BY created_at DESC LIMIT 5;"
```

### 3C · Create Order (browser)

- [ ] Navigate to `/orders` → **+ New Order** button
- [ ] Step 1: Search customer by name → select from dropdown
- [ ] Step 2: Select portal → products list loads from DB
- [ ] Step 3: Add items → total calculates
- [ ] Step 4: Submit → order appears in orders list with status `pending`

```bash
supabase db query --linked "SELECT id, status, total_amount, created_at FROM orders ORDER BY created_at DESC LIMIT 3;"
```

---

## Section 4 — Admin Dashboard: Inventory

### 4A · Product CRUD (browser)

- [ ] Navigate to `/inventory` → portal tabs load (Solar, Transport, Groceries, Health, Events, Community, Logistics)
- [ ] Select any portal tab → products load from DB
- [ ] Click **+ Add Product** → form opens
- [ ] Fill fields, upload image → save → product appears in grid
- [ ] Click edit on existing product → change price → save → price reflected
- [ ] Toggle product active/inactive → `is_active` updates

### 4B · Portal-specific metadata

- [ ] Add a **Solar** product → solar-specific fields visible (capacity, voltage, warranty)
- [ ] Add a **Health** product → health-specific fields visible

### 4C · CLI verification ✅ verified 2026-04-25

```bash
# Count products per portal — expected: 74 total across 7 portals
supabase db query --linked "SELECT sp.name, COUNT(p.id) as products FROM products p JOIN service_portals sp ON sp.id = p.portal_id GROUP BY sp.name ORDER BY sp.name;"

# Check recent products
supabase db query --linked "SELECT id, name, price, is_active, portal_id FROM products ORDER BY updated_at DESC LIMIT 5;"
```

---

## Section 5 — Admin Dashboard: Membership

### 5A · Tier configuration (browser)

- [ ] Navigate to `/membership` → **Configure Tiers** button → `/membership/config`
- [ ] Annual and quarterly prices load from DB for each tier
- [ ] Click **Edit Benefits** → add a new benefit → save → benefit appears
- [ ] Change a tier price → save → price visible on user-facing membership panel

### 5B · CLI verification ✅ verified 2026-04-25

```bash
# Expected: Bronze (₦24k/yr, 4 benefits), Silver (₦42k/yr, 5), Gold (₦60k/yr, 6)
supabase db query --linked "SELECT t.name, t.annual_price, t.quarterly_price, COUNT(b.id) as benefits FROM membership_tiers t LEFT JOIN membership_tier_benefits b ON b.tier_id = t.id GROUP BY t.id, t.name, t.annual_price, t.quarterly_price ORDER BY t.annual_price;"
```

### 5C · Subscriptions tab (browser)

- [ ] Active subscriptions listed with tier, billing cycle, expiry
- [ ] Cancel a subscription → status changes to `cancelled`
- [ ] Verify system notification fired to ops team (check notification bell)

### 5D · Benefit usage tab (browser)

- [ ] Usage counts display (may be 0 until users consume benefits)

---

## Section 6 — Admin Dashboard: Wallet

### 6A · Transaction log (browser)

- [ ] Navigate to `/wallet`
- [ ] Real transactions load with user names (profile join)
- [ ] Search by user name → filters results
- [ ] Filter by type (credit / debit) → filters results

### 6B · Manual adjustment (browser)

- [ ] Click **Manual Adjustment** → form expands
- [ ] Select user → amount → type (credit) → reason → **Submit Adjustment**
- [ ] Transaction appears in the list immediately
- [ ] User's wallet balance updated in DB

```bash
supabase db query --linked "SELECT description, amount, type, running_balance FROM wallet_transactions ORDER BY created_at DESC LIMIT 5;"
supabase db query --linked "SELECT name, wallet_balance FROM profiles WHERE role = 'user' ORDER BY wallet_balance DESC LIMIT 5;"
```

---

## Section 7 — Admin Dashboard: Referrals

### 7A · Referrals list (browser)

- [ ] Navigate to `/referrals`
- [ ] Referrer and referred names show (from profile join)
- [ ] Rows with no referred user show "Pending sign-up"
- [ ] Filter by status (pending / confirmed / expired)

```bash
supabase db query --linked "SELECT r.id, rp.name as referrer, ep.name as referred, r.gifted_tier, r.status FROM referrals r JOIN profiles rp ON rp.id = r.referrer_id LEFT JOIN profiles ep ON ep.id = r.referred_id ORDER BY r.created_at DESC LIMIT 10;"
```

---

## Section 8 — Admin Dashboard: Notifications

### 8A · Broadcast compose (browser)

- [ ] Navigate to `/notifications` → **Compose Broadcast**
- [ ] Fill title, message, select audience (All Users / tier / specific user)
- [ ] **Preview Email** → modal shows rendered HTML
- [ ] **Save Draft** → appears in list with Draft badge
- [ ] **Send** → status changes to Sent; check user app inbox for the notification

### 8B · Broadcast detail (browser)

- [ ] Click a sent broadcast row → detail page loads
- [ ] Read rate counter shown (updates as users read it)
- [ ] **Retract** → status changes to Retracted; unread users no longer see it in inbox

### 8C · System notification panel (browser)

- [ ] Bell icon in topbar → click → panel opens showing system notifications
- [ ] Perform an action that triggers a notification (e.g. cancel an order) → notification appears without page refresh (Realtime)
- [ ] Click notification → deep-links to relevant page → marks as read

### 8D · Notifications inbox (browser)

- [ ] Navigate to `/notifications` (inbox tab) → all system notifications listed
- [ ] Category filter pills work
- [ ] **Mark all read** → all go grey

---

## Section 9 — Admin Dashboard: Settings

### 9A · Portal toggles (browser)

- [ ] Navigate to `/settings`
- [ ] Toggle a portal off → HIDDEN badge appears
- [ ] Open user app → that portal should not appear (filtered by `is_active = true`)
- [ ] Toggle back on → portal reappears on user app

### 9B · CLI verification ✅ verified 2026-04-25

```bash
# Expected: 7 portals, all is_active = true
supabase db query --linked "SELECT id, name, is_active FROM service_portals ORDER BY sort_order;"
```

### 9C · Alert preferences (browser)

- [ ] Alert Preferences card visible in Settings
- [ ] Toggle individual category (e.g. Inventory) off → setting saves to DB
- [ ] Change Low Stock threshold → saves immediately (no Submit button)

```bash
supabase db query --linked "SELECT user_id, inventory_enabled, low_stock_threshold, wallet_enabled, large_txn_threshold FROM notification_preferences LIMIT 5;"
```

---

## Section 10 — Email Templates (Supabase Dashboard only)

> **Note:** The `/emails` page has been removed from the admin dashboard. Email templates are managed directly in **Supabase Dashboard → Edge Functions → `send-email`** source, or via the `supabase/templates/` directory in the admin repo. Redeploy the function after any template change.

### 10A · Template editing

### 10B · API dry-run ✅ verified 2026-04-25

```bash
curl -s -X POST https://uhrlsvnmoemrakwfrjyf.supabase.co/functions/v1/send-email \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVocmxzdm5tb2VtcmFrd2ZyanlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2ODY2ODQsImV4cCI6MjA5MjI2MjY4NH0.VN59kY6Mb5_n2cjejx-wyiTcz_G_VmYjhq5w8P4A0lI" \
  -H "Content-Type: application/json" \
  -d '{"template":"welcome","dryRun":true,"to":"test@example.com","data":{"name":"Tester","referralCode":"ABC123"}}' \
  | python3 -m json.tool | grep -E '"subject"|"success"'
```

Expected: `"success": true` and `"subject": "Welcome to LagosApps!"`

> Logo in output should reference `supabase.co/storage/v1/object/public/public-assets/brand-logo.png` — not GitHub raw.

### 10C · Send test email (API)

```bash
curl -s -X POST https://uhrlsvnmoemrakwfrjyf.supabase.co/functions/v1/send-email \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVocmxzdm5tb2VtcmFrd2ZyanlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2ODY2ODQsImV4cCI6MjA5MjI2MjY4NH0.VN59kY6Mb5_n2cjejx-wyiTcz_G_VmYjhq5w8P4A0lI" \
  -H "Content-Type: application/json" \
  -d '{"template":"order_confirmation","to":"YOUR_EMAIL","data":{"name":"Test User","orderId":"ORD-TEST001","total":"₦25,000"}}'
```

---

## Section 11 — Admin Dashboard: Fulfillment

### 11A · Order fulfillment queue (browser)

- [ ] Navigate to `/fulfillment` → Order Fulfillment tab
- [ ] Orders with `confirmed` / `processing` status appear
- [ ] **Assign** team member via dropdown → `fulfillment_tracking` row created
- [ ] Click order row → Fulfillment Detail opens
- [ ] Set SLA deadline, risk level, progress → save → changes persist on refresh

### 11B · Service requests tab (browser)

- [ ] Service Requests tab shows requests submitted from user app
- [ ] Assign team member → notification fires to that admin
- [ ] Change status (new → reviewing → scheduled) → updates in DB
- [ ] Add internal note → note appears in thread
- [ ] **Decline** with reason → status = declined, reason saved

### 11C · Custom orders tab (browser)

- [ ] Custom Orders tab shows freeform requests from Groceries portal
- [ ] **Convert to Order** button → navigates to Create Order wizard (pre-filled if wired)

```bash
supabase db query --linked "SELECT id, type, status, assigned_to FROM service_requests ORDER BY created_at DESC LIMIT 5;"
supabase db query --linked "SELECT id, description, status FROM custom_order_requests ORDER BY created_at DESC LIMIT 5;"
```

---

## Section 12 — Admin Dashboard: Audit Log

### 12A · Browser

- [ ] Navigate to `/audit`
- [ ] Real entries load (not mock data) — check that entries from previous test steps appear
- [ ] Search by admin name → filters
- [ ] Filter by action type (e.g. `order`) → only order-related actions shown
- [ ] Expand a row → shows `new_values` / `old_values` JSON diff

```bash
supabase db query --linked "SELECT action, entity_type, entity_id, created_at FROM admin_audit_log ORDER BY created_at DESC LIMIT 10;"
```

---

## Section 13 — User App: Portals & Products

### 13A · Portal display (browser)

- [ ] All 7 portals visible on user dashboard (Solar, Transport, Groceries, Health, Events, Community, Logistics)
- [ ] Toggle a portal off in admin Settings → refresh user app → portal disappears
- [ ] Toggle back on → portal reappears

### 13B · Solar portal (browser)

- [ ] Open Solar portal → 4 paths visible (Free Audit, Shop, Installation, Maintenance)
- [ ] **Free Audit** path → select purpose → select building → system estimate loads
- [ ] Complete booking form → submit → request appears in admin Fulfillment > Service Requests
- [ ] **Shop** path → categories load from DB → products load from DB → add to cart

### 13C · Health portal (browser)

- [ ] Open Health portal → services listed
- [ ] **Home Medical Tests** → fill form (address, date, people, symptoms) → submit → request in admin Fulfillment
- [ ] **Medical Supplies** → grid loads from DB → select items → **Add to Cart**

### 13D · Events portal (browser)

- [ ] Open Events portal → venue list loads from DB
- [ ] **Book a Venue** → select venue → fill date/duration/details → submit → request in admin Fulfillment
- [ ] **Event Coverage** → select services → submit

### 13E · Logistics portal (browser)

- [ ] Fill source, item links, delivery address → **Submit Now** → request in admin Fulfillment
- [ ] **Add to Cart** alternative path also works

### 13F · Groceries portal (browser)

- [ ] Products load from DB in categories
- [ ] Add standard product → appears in cart
- [ ] **Can't find what you need?** freeform path → describe items → submit → appears in admin Fulfillment > Custom Orders

### 13G · Community portal (browser)

- [ ] All 5 sections load (Impact, Sponsor, Donate, TEPLEARN, Volunteer)
- [ ] Donation → enters amount → **Add to Cart** → checkout works

### 13H · Transport portal (browser)

- [ ] Products and routes load from DB
- [ ] Add transport item → cart works

---

## Section 14 — User App: Cart & Checkout

### 14A · Cart operations (browser)

- [ ] Add item from any portal → cart badge increments
- [ ] Open cart → item listed with correct price
- [ ] Change quantity → total updates
- [ ] Remove item → item disappears
- [ ] **Clear Cart** → all items removed
- [ ] Close app and reopen (or refresh) → cart persists (DB-backed)

```bash
supabase db query --linked "SELECT c.id, p.name as user, COUNT(ci.id) as items FROM carts c JOIN profiles p ON p.id = c.user_id JOIN cart_items ci ON ci.cart_id = c.id GROUP BY c.id, p.name ORDER BY c.updated_at DESC LIMIT 5;"
```

### 14B · Checkout — card payment (browser)

- [ ] Add item(s) to cart → proceed to checkout
- [ ] Select **Pay by Card** → Paystack popup opens
- [ ] Enter test card: `4084 0840 8408 4081`, any future expiry, CVV `408`
- [ ] Enter PIN `0000`, OTP `123456`
- [ ] Payment succeeds → order created with status `confirmed`
- [ ] Order confirmation email arrives in inbox (check within ~30 seconds)
- [ ] Order appears in admin `/orders`

```bash
supabase db query --linked "SELECT id, status, payment_method, total_amount FROM orders ORDER BY created_at DESC LIMIT 3;"
```

### 14C · Checkout — wallet payment (browser)

- [ ] Top up wallet first (see Section 15A)
- [ ] Add item cheaper than wallet balance → checkout → select **Pay with Wallet**
- [ ] Wallet balance deducted → `wallet_transactions` debit row created
- [ ] Order confirmed

### 14D · Checkout — hybrid (wallet + card) (browser)

- [ ] Add item more expensive than wallet balance
- [ ] Checkout → wallet balance auto-applied as partial; Paystack opens for remainder
- [ ] Complete payment → order confirmed; wallet debited; card charged for difference

### 14E · Failed payment (browser)

- [ ] Cart → Pay → enter failing card `4084 0840 8408 4087`
- [ ] Paystack shows error → user closes popup → cart is still intact
- [ ] Order stays `pending` in DB (pre-created but never confirmed)

```bash
supabase db query --linked "SELECT id, status FROM orders ORDER BY created_at DESC LIMIT 1;"
```

---

## Section 15 — User App: Wallet

### 15A · Top-up (browser)

- [ ] Go to user dashboard → Wallet panel → **Top Up**
- [ ] Enter amount (e.g. ₦5,000) → Paystack opens
- [ ] Complete test card payment
- [ ] Wallet balance increases immediately
- [ ] Wallet top-up email arrives in inbox
- [ ] Transaction appears in wallet history

```bash
supabase db query --linked "SELECT description, amount, type, running_balance FROM wallet_transactions ORDER BY created_at DESC LIMIT 5;"
```

### 15B · Transaction history (browser)

- [ ] Wallet history shows all credits and debits with correct timestamps
- [ ] Admin `/wallet` page also shows the same transactions (with user name)

---

## Section 16 — User App: Membership

### 16A · Subscribe (browser)

- [ ] Go to user dashboard → Membership panel
- [ ] Tiers and prices load from DB (not hardcoded)
- [ ] Benefits listed under each tier (from `membership_tier_benefits`)
- [ ] Toggle between Annual and Quarterly → prices update
- [ ] Click **Subscribe** on Bronze → Paystack opens
- [ ] Complete test payment
- [ ] Membership tier on profile updates to `bronze`
- [ ] `membership_subscriptions` row created with correct expiry

```bash
supabase db query --linked "SELECT user_id, tier, billing_cycle, amount_paid, starts_at, expires_at, status FROM membership_subscriptions ORDER BY created_at DESC LIMIT 3;"
```

### 16B · Admin view (browser)

- [ ] Admin `/membership` → Subscriptions tab shows new subscription
- [ ] Tier Config shows prices as set in DB

---

## Section 17 — User App: Notifications

### 17A · Receive broadcast (browser)

- [ ] In admin: compose and send a broadcast to All Users
- [ ] In user app (same user is logged in): notification bell badge increments (Realtime)
- [ ] Click notification → broadcast content visible
- [ ] Mark as read → badge decrements

### 17B · Order status notification (browser)

- [ ] In admin: change an order's status
- [ ] User's order timeline updates (check Order Detail on user app)

---

## Section 18 — Paystack Webhook

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

- [ ] Go to Paystack test dashboard → Logs → find a successful test charge
- [ ] Verify the webhook was delivered (green checkmark)
- [ ] Verify the order/wallet record was updated in DB

### 18C · Webhook replay (Paystack dashboard)

- [ ] In Paystack Logs → find any successful event → click **Resend**
- [ ] Verify DB stays consistent (idempotency guard prevents double-credit)

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

### 19C · Trigger renewal reminder manually

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
# Check inbox for renewal reminder email, then clean up:
supabase db query --linked "DELETE FROM membership_subscriptions WHERE expires_at BETWEEN now() + interval '2 days' AND now() + interval '4 days' AND tier = 'silver';"
```

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

### 20B · User JWT only sees own rows (browser)

- [ ] Log in as User A → place an order → note order ID
- [ ] Log in as User B → try to access `/rest/v1/orders?id=eq.<User A order ID>` with User B's JWT → returns `[]`

---

## Section 21 — Cross-App Integration

### 21A · Admin action → user sees it (browser — two windows)

- [ ] Open admin app and user app side by side
- [ ] Admin changes order status → user's order detail updates (Realtime — no refresh)
- [ ] Admin sends broadcast → user's notification badge increments (Realtime)
- [ ] Admin toggles a portal off → user app portal disappears on next load

### 21B · User action → admin sees it (browser — two windows)

- [ ] User submits a service request → admin Fulfillment > Service Requests shows it
- [ ] User places an order → admin Orders list shows it
- [ ] User tops up wallet → admin Wallet shows the credit transaction
- [ ] User subscribes to membership → admin Membership subscriptions tab shows it

### 21C · Admin manual wallet adjustment → user sees it (browser)

- [ ] Admin credits ₦10,000 to a user's wallet
- [ ] User opens Wallet panel → balance increased, transaction in history

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

## Quick Smoke Test (15 minutes)

1. [ ] Admin: log in → verify dashboard loads with real data
2. [ ] Admin: toggle one portal off → verify it disappears on user app
3. [ ] Admin: toggle it back on
4. [ ] User: sign up on the user-facing app → verify welcome email arrives
5. [ ] User: add Solar product to cart → checkout with Paystack test card
6. [ ] Verify: order in admin Orders list; order confirmation email arrives
7. [ ] User: top up wallet ₦5,000 → verify wallet top-up email arrives
8. [ ] Admin: issue manual wallet credit of ₦1,000 → verify in user wallet history
9. [ ] User: submit a Solar audit request → verify in admin Fulfillment > Service Requests
10. [ ] Admin: send a broadcast to All Users → verify notification appears in user app inbox
11. [ ] Admin: check Audit Log → last ~5 actions should be logged

---

## Known Limitations

| Item | Status |
|------|--------|
| WhatsApp notifications | Deferred to M9 — not yet implemented |
| Per-user benefit usage progress bars | Deferred — benefit consumption not yet wired to orders |
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
