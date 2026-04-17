# LagosApps — Tech Stack

## Overview

This document defines the complete technology stack for the LagosApps platform, covering both the user-facing app and the admin dashboard.

---

## Frontend

| Tool | Purpose | Repo |
|------|---------|------|
| **React 18 + TypeScript** | UI framework | Both repos |
| **Tailwind CSS v4** | Styling (via `@tailwindcss/vite`) | Both repos |
| **Vite 6+** | Build tool and dev server | Both repos |
| **React Router DOM v7** | Route-based navigation | Admin repo only |

### Repos

- **User App**: `github.com/adexdams/lagosapps` — Landing page + user dashboard (state-driven navigation)
- **Admin App**: `github.com/adexdams/lagosapps-admin` — Admin dashboard (route-based navigation)

### Frontend Libraries (no external service needed)

| Library | Purpose |
|---------|---------|
| **papaparse** or vanilla JS | CSV export for data tables and reports |
| **jspdf + jspdf-autotable** | PDF generation for invoices, receipts, and financial reports |

These handle the "Export Data" buttons across the admin dashboard and the downloadable reports in the Finance page — all generated in the browser, no server-side service required.

---

## Backend & Database

| Tool | Purpose | Pricing |
|------|---------|---------|
| **Supabase** | Postgres database, Auth, Storage, Edge Functions, Realtime | Free tier: 500MB DB, 1GB storage, 50K auth users |

### Supabase handles

- **Auth**: Email + password sign-up/sign-in, session management, password reset. No SMS/OTP for now.
- **Database**: All user data, orders, products, memberships, wallet transactions, referrals, notifications, cart. Full schema in `ADMIN_DASHBOARD_AND_DATABASE_MIGRATION_PLAN.md`.
- **Storage**: Product images (350+ items across 7 portals), user avatars, broadcast images, receipts/invoices.
- **Image Transformations**: Built-in resize and format conversion for product images and avatars — no external image service needed.
- **Edge Functions**: Paystack webhook handler, cron jobs for membership expiry, referral status updates (active → expired), daily analytics aggregation.
- **Realtime**: Live order status updates, notification push to dashboard, fulfillment progress updates.
- **Row-Level Security**: Users can only read/write their own data. Admin role has full access. Team privileges enforced at both frontend and database level.

---

## Payments

| Tool | Purpose | Pricing |
|------|---------|---------|
| **Paystack** | Payment gateway | 1.5% + ₦100 per transaction (waived under ₦2,500) |

### Paystack handles

- Cart checkout (card, bank transfer, USSD)
- Wallet top-ups
- Membership subscription billing (annual/quarterly)
- Refunds (membership downgrades → wallet credit)
- Webhook notifications for payment status updates
- Settlement tracking and reconciliation (powers the Finance page)
- Test mode for development (no real charges)

### Integration points

- `PaystackCheckout.tsx` currently simulates the flow — replace with real Paystack Inline JS
- Webhook endpoint on Supabase Edge Function to confirm payments
- Store payment references in orders and wallet transactions tables
- Finance page pulls from Paystack data: transactions, settlements, fees, revenue breakdown

---

## Email

| Tool | Purpose | Pricing |
|------|---------|---------|
| **Resend** | Transactional email | Free tier: 3,000 emails/month |

### Resend handles

- Order confirmation emails
- Password reset emails
- Membership renewal reminders
- Referral notifications (when someone uses your link)
- Wallet top-up receipts
- Admin broadcast emails (sent via the Broadcast page)
- Built-in deliverability monitoring (no separate tool needed)

---

## Messaging

| Tool | Purpose | Pricing |
|------|---------|---------|
| **WhatsApp Business API** (Meta direct) | Customer messaging | Per-conversation pricing by Meta |

### WhatsApp handles

- Order status updates
- Delivery notifications
- Customer support replies
- Booking confirmations
- Admin-created orders received via WhatsApp channel

### Not using (deferred)

- No SMS provider — email + WhatsApp cover all notification needs for now
- SMS/OTP can be added later via Termii or Twilio when phone number auth is reintroduced
- No push notifications — in-app notifications + email + WhatsApp are sufficient for launch

---

## Analytics

| Tool | Purpose | Pricing |
|------|---------|---------|
| **PostHog** | Product analytics | Free tier: 1M events/month |

### PostHog tracks

- Page views and user flows
- Cart abandonment rate
- Membership conversion funnel (none → bronze → silver → gold)
- Feature usage per portal
- Checkout completion rate
- Referral link effectiveness
- Admin dashboard usage (which pages admins visit most, which actions they take)

---

## Error Tracking

| Tool | Purpose | Pricing |
|------|---------|---------|
| **Sentry** | Error monitoring + performance | Free tier: 5,000 errors/month |

### Sentry monitors

- React rendering errors
- Failed API calls (Supabase, Paystack)
- Payment integration failures
- Unhandled promise rejections
- Performance bottlenecks (slow pages, long API calls)
- Edge Function errors (webhook failures, cron job issues)

---

## Hosting & DevOps

| Tool | Purpose | Pricing |
|------|---------|---------|
| **GitHub** | Source control, CI/CD triggers | Free |
| **Netlify** | Frontend hosting | Free tier: 100GB bandwidth/month |
| **Cloudflare** | DNS, CDN, DDoS protection | Free tier |

### Netlify hosts

- User app (`lagosapps.com`)
- Admin app (`admin.lagosapps.com`)
- Auto-deploys on push to `main` branch
- Custom domain + HTTPS
- Environment variables for API keys

### Cloudflare provides

- DNS management for all domains
- Global CDN for static assets and Supabase Storage images
- DDoS protection (important for a payments-handling platform)
- SSL/TLS encryption
- Basic WAF (Web Application Firewall) on free tier

---

## Deferred (Not Needed Now)

These may be added later as the platform scales:

| Feature | Why deferred | Add when |
|---------|-------------|----------|
| SMS (Termii / Twilio) | WhatsApp + email cover notifications | Phone number auth or SMS marketing needed |
| Push notifications (OneSignal / FCM) | In-app + email + WhatsApp sufficient | Mobile app is built, or web push demand grows |
| Maps / Geocoding (Google Maps) | Transport zones are predefined, not dynamic | Real-time delivery tracking or address autocomplete needed |
| 2FA / TOTP | Admin accounts use strong passwords for now | Security audit requires it, or team grows beyond trusted circle |
| Advanced search (Meilisearch / Typesense) | Postgres full-text search is sufficient | Product catalog exceeds 1,000+ items or search UX needs fuzzy matching |
| Image CDN (Cloudinary / imgix) | Supabase image transformations are sufficient | Image volume or transformation complexity grows significantly |

---

## Cost Estimate (Pre-Revenue)

| Service | Monthly Cost |
|---------|-------------|
| GitHub | Free |
| Netlify | Free |
| Supabase | Free (under limits) |
| Resend | Free (under 3K emails) |
| Paystack | Free (1.5% + ₦100 per txn) |
| PostHog | Free (under 1M events) |
| Sentry | Free (under 5K errors) |
| Cloudflare | Free |
| WhatsApp Business API | Per-conversation (~₦30–50/conversation) |
| **Total fixed cost** | **₦0/month** |
| **Variable** | Paystack fees + WhatsApp conversations |

---

## Integration Priority Order

1. **Supabase** (auth + database) — Unblocks everything. Auth replaces localStorage, database replaces hardcoded arrays.
2. **Paystack** — Enables real payments. Replace simulated `PaystackCheckout.tsx` with Paystack Inline JS.
3. **Resend** — Transactional emails after payments/signups work.
4. **Cloudflare** — Set up DNS and CDN before going live.
5. **Sentry** — Deploy to production with error tracking from day one.
6. **PostHog** — Add analytics after users start using the platform.
7. **WhatsApp Business API** — Connect after core flows are live.
