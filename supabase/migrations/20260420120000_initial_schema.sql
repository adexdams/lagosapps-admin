-- ============================================================
-- LagosApps — Initial Database Schema
-- Creates all tables for the multi-portal marketplace platform
-- ============================================================

-- ── Custom types ────────────────────────────────────────────

CREATE TYPE membership_tier AS ENUM ('none', 'bronze', 'silver', 'gold');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'processing', 'completed', 'cancelled');
CREATE TYPE wallet_txn_type AS ENUM ('credit', 'debit');
CREATE TYPE referral_status AS ENUM ('pending', 'confirmed', 'paid', 'expired');
CREATE TYPE billing_cycle AS ENUM ('annual', 'quarterly');
CREATE TYPE subscription_status AS ENUM ('active', 'expired', 'cancelled');
CREATE TYPE stock_status AS ENUM ('in_stock', 'low_stock', 'out_of_stock');
CREATE TYPE service_request_status AS ENUM ('new', 'reviewing', 'scheduled', 'in_progress', 'completed', 'declined');
CREATE TYPE custom_request_status AS ENUM ('new', 'under_review', 'converted', 'declined');
CREATE TYPE broadcast_status AS ENUM ('draft', 'sent', 'retracted');
CREATE TYPE team_role AS ENUM ('super_admin', 'operations', 'support', 'finance', 'tech');
CREATE TYPE fulfillment_risk AS ENUM ('on_track', 'at_risk', 'behind');
CREATE TYPE fulfillment_priority AS ENUM ('low', 'medium', 'high');

-- ════════════════════════════════════════════════════════════
-- 1. CORE USER TABLES
-- ════════════════════════════════════════════════════════════

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT UNIQUE,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  membership_tier membership_tier NOT NULL DEFAULT 'none',
  wallet_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
  referral_code VARCHAR(20) UNIQUE,
  referred_by UUID REFERENCES users(id),
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE membership_tiers (
  id VARCHAR(10) PRIMARY KEY CHECK (id IN ('bronze', 'silver', 'gold')),
  name TEXT NOT NULL,
  annual_price DECIMAL(10,2) NOT NULL,
  quarterly_price DECIMAL(10,2) NOT NULL,
  color VARCHAR(7) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE membership_tier_benefits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_id VARCHAR(10) NOT NULL REFERENCES membership_tiers(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  benefit_key VARCHAR(50) NOT NULL,
  limit_count INT, -- NULL = unlimited
  limit_period VARCHAR(10) CHECK (limit_period IN ('month', 'quarter', 'year')),
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE membership_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tier VARCHAR(10) NOT NULL REFERENCES membership_tiers(id),
  billing_cycle billing_cycle NOT NULL,
  amount_paid DECIMAL(10,2) NOT NULL,
  starts_at DATE NOT NULL,
  expires_at DATE NOT NULL,
  status subscription_status NOT NULL DEFAULT 'active',
  auto_renew BOOLEAN NOT NULL DEFAULT true,
  payment_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE membership_benefit_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES membership_subscriptions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  benefit_key VARCHAR(50) NOT NULL,
  used_count INT NOT NULL DEFAULT 0,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL
);

-- ════════════════════════════════════════════════════════════
-- 2. PRODUCT CATALOG
-- ════════════════════════════════════════════════════════════

CREATE TABLE service_portals (
  id VARCHAR(20) PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color VARCHAR(7),
  image_url TEXT,
  cta_text TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_id VARCHAR(20) NOT NULL REFERENCES service_portals(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug VARCHAR(50) NOT NULL,
  description TEXT,
  icon TEXT,
  image_url TEXT,
  parent_category_id UUID REFERENCES product_categories(id),
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(portal_id, slug)
);

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES product_categories(id),
  portal_id VARCHAR(20) NOT NULL REFERENCES service_portals(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(12,2) NOT NULL DEFAULT 0,
  unit VARCHAR(20) DEFAULT 'unit',
  image_url TEXT,
  metadata JSONB DEFAULT '{}', -- portal-specific: wattage, capacity, pickup hours, etc.
  stock INT NOT NULL DEFAULT 0,
  low_stock_threshold INT NOT NULL DEFAULT 5,
  stock_status stock_status NOT NULL DEFAULT 'in_stock',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Specialized catalog tables

CREATE TABLE solar_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  battery_type VARCHAR(10) NOT NULL CHECK (battery_type IN ('gel', 'lithium')),
  capacity_kw DECIMAL(5,1) NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE building_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  recommendation TEXT,
  gel_price DECIMAL(12,2),
  lithium_price DECIMAL(12,2),
  image_url TEXT,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE pricing_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_id VARCHAR(20) NOT NULL REFERENCES service_portals(id),
  name TEXT NOT NULL,
  slug VARCHAR(30) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  UNIQUE(portal_id, slug)
);

CREATE TABLE transport_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  zone_id UUID NOT NULL REFERENCES pricing_zones(id) ON DELETE CASCADE,
  price DECIMAL(12,2) NOT NULL,
  UNIQUE(product_id, zone_id)
);

CREATE TABLE venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT,
  description TEXT,
  capacity INT,
  price_range TEXT,
  image_url TEXT,
  amenities TEXT[] DEFAULT '{}',
  categories TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0
);

-- ════════════════════════════════════════════════════════════
-- 3. ORDERS & TRANSACTIONS
-- ════════════════════════════════════════════════════════════

CREATE TABLE orders (
  id VARCHAR(20) PRIMARY KEY, -- ORD-XXX format
  user_id UUID NOT NULL REFERENCES users(id),
  portal_id VARCHAR(20) NOT NULL REFERENCES service_portals(id),
  description TEXT,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  wallet_deduction DECIMAL(12,2) NOT NULL DEFAULT 0,
  payment_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  payment_method VARCHAR(20) CHECK (payment_method IN ('wallet', 'card', 'bank_transfer', 'ussd')),
  payment_reference TEXT,
  status order_status NOT NULL DEFAULT 'pending',
  channel VARCHAR(20) DEFAULT 'web' CHECK (channel IN ('web', 'whatsapp', 'phone', 'walkin')),
  delivery_address TEXT,
  admin_notes TEXT,
  created_by UUID REFERENCES users(id), -- NULL = customer, UUID = admin who created it
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id VARCHAR(20) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  name TEXT NOT NULL, -- snapshot at time of order
  description TEXT,
  price DECIMAL(12,2) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  member_covered BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE order_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id VARCHAR(20) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  occurred_at TIMESTAMPTZ,
  completed BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_by UUID REFERENCES users(id) -- admin who added the step
);

CREATE TABLE wallet_transactions (
  id VARCHAR(20) PRIMARY KEY, -- TXN-XXX format
  user_id UUID NOT NULL REFERENCES users(id),
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL, -- always positive
  type wallet_txn_type NOT NULL,
  running_balance DECIMAL(12,2) NOT NULL,
  reference TEXT,
  created_by UUID REFERENCES users(id), -- NULL = system, UUID = admin who made adjustment
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  portal_id VARCHAR(20) NOT NULL REFERENCES service_portals(id),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  price DECIMAL(12,2) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  member_covered BOOLEAN NOT NULL DEFAULT false
);

-- ════════════════════════════════════════════════════════════
-- 4. REFERRALS
-- ════════════════════════════════════════════════════════════

CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES users(id),
  referred_id UUID REFERENCES users(id),
  gifted_tier VARCHAR(10) REFERENCES membership_tiers(id),
  reward_amount DECIMAL(10,2) DEFAULT 0,
  status referral_status NOT NULL DEFAULT 'pending',
  expires_at DATE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ════════════════════════════════════════════════════════════
-- 5. COMMUNICATION — BROADCASTS (admin → users)
-- ════════════════════════════════════════════════════════════

CREATE TABLE broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('info', 'promo', 'alert', 'update')),
  image_url TEXT,
  recipients_type VARCHAR(20) NOT NULL CHECK (recipients_type IN ('all', 'tier', 'specific')),
  recipients_filter JSONB DEFAULT '{}', -- e.g. {"tiers": ["gold","silver"]} or {"user_id": "xxx"}
  status broadcast_status NOT NULL DEFAULT 'draft',
  sent_by UUID REFERENCES users(id),
  sent_at TIMESTAMPTZ,
  retracted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE broadcast_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id UUID NOT NULL REFERENCES broadcasts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  delivered BOOLEAN NOT NULL DEFAULT false,
  read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ════════════════════════════════════════════════════════════
-- 6. COMMUNICATION — USER NOTIFICATIONS (system → user)
-- ════════════════════════════════════════════════════════════

CREATE TABLE user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('order', 'wallet', 'membership', 'system', 'broadcast')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  entity_type VARCHAR(30), -- 'order', 'subscription', etc.
  entity_id TEXT, -- the relevant record ID
  read BOOLEAN NOT NULL DEFAULT false,
  retracted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ════════════════════════════════════════════════════════════
-- 7. COMMUNICATION — SYSTEM NOTIFICATIONS (internal admin alerts)
-- ════════════════════════════════════════════════════════════

CREATE TABLE system_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(30) NOT NULL CHECK (type IN (
    'order_new', 'order_overdue', 'order_cancelled',
    'fulfillment_assigned', 'fulfillment_sla_risk', 'fulfillment_overdue',
    'request_new', 'request_assigned', 'request_overdue',
    'inventory_low_stock', 'inventory_out_of_stock',
    'wallet_large_transaction', 'wallet_adjustment',
    'membership_new', 'membership_expiring', 'membership_cancelled',
    'team_role_changed', 'team_privilege_updated', 'team_member_added',
    'settings_changed', 'portal_toggled'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  entity_type VARCHAR(30),
  entity_id TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR(30) NOT NULL CHECK (category IN (
    'orders', 'fulfillment', 'requests', 'inventory',
    'wallet', 'membership', 'team', 'system'
  )),
  enabled BOOLEAN NOT NULL DEFAULT true,
  -- Thresholds (nullable — NULL means use system default)
  low_stock_threshold INT,
  large_transaction_threshold DECIMAL(12,2),
  overdue_hours_threshold INT,
  sla_risk_hours_threshold INT,
  UNIQUE(admin_id, category)
);

-- ════════════════════════════════════════════════════════════
-- 8. SERVICE REQUESTS & CUSTOM ORDERS
-- ════════════════════════════════════════════════════════════

CREATE TABLE service_requests (
  id VARCHAR(20) PRIMARY KEY, -- REQ-XXX format
  user_id UUID NOT NULL REFERENCES users(id),
  portal_id VARCHAR(20) NOT NULL REFERENCES service_portals(id),
  type VARCHAR(30) NOT NULL, -- solar_audit, health_home_visit, event_venue_booking, etc.
  type_label TEXT NOT NULL, -- human-readable: "Free Solar Audit", "Home Visit", etc.
  status service_request_status NOT NULL DEFAULT 'new',
  assigned_to UUID REFERENCES users(id),
  details JSONB NOT NULL DEFAULT '{}', -- varies by type: address, date, symptoms, etc.
  decline_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE service_request_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id VARCHAR(20) NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id),
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE custom_order_requests (
  id VARCHAR(20) PRIMARY KEY, -- CRQ-XXX format
  user_id UUID NOT NULL REFERENCES users(id),
  portal_id VARCHAR(20) NOT NULL REFERENCES service_portals(id),
  description TEXT NOT NULL,
  status custom_request_status NOT NULL DEFAULT 'new',
  converted_order_id VARCHAR(20) REFERENCES orders(id),
  decline_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE custom_request_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id VARCHAR(20) NOT NULL REFERENCES custom_order_requests(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id),
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ════════════════════════════════════════════════════════════
-- 9. FULFILLMENT
-- ════════════════════════════════════════════════════════════

CREATE TABLE fulfillment_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id VARCHAR(20) NOT NULL REFERENCES orders(id) ON DELETE CASCADE UNIQUE,
  assigned_to UUID REFERENCES users(id),
  risk_level fulfillment_risk NOT NULL DEFAULT 'on_track',
  priority fulfillment_priority NOT NULL DEFAULT 'medium',
  progress INT NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  response_deadline DATE,
  fulfillment_deadline DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE fulfillment_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id VARCHAR(20) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id),
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ════════════════════════════════════════════════════════════
-- 10. ADMIN TEAM & AUDIT
-- ════════════════════════════════════════════════════════════

CREATE TABLE admin_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  role team_role NOT NULL DEFAULT 'support',
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_active_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE admin_team_privileges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id UUID NOT NULL REFERENCES admin_team_members(id) ON DELETE CASCADE,
  privilege_key VARCHAR(50) NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(team_member_id, privilege_key)
);

CREATE TABLE admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES users(id),
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(30),
  entity_id TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ════════════════════════════════════════════════════════════
-- 11. PLATFORM SETTINGS
-- ════════════════════════════════════════════════════════════

CREATE TABLE platform_settings (
  key VARCHAR(50) PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES users(id)
);

-- ════════════════════════════════════════════════════════════
-- 12. INDEXES
-- ════════════════════════════════════════════════════════════

-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_membership_tier ON users(membership_tier);
CREATE INDEX idx_users_referral_code ON users(referral_code);
CREATE INDEX idx_users_role ON users(role);

-- Orders
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_portal_id ON orders(portal_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- Products
CREATE INDEX idx_products_portal_id ON products(portal_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_stock_status ON products(stock_status);

-- Wallet
CREATE INDEX idx_wallet_txns_user_id ON wallet_transactions(user_id);
CREATE INDEX idx_wallet_txns_created_at ON wallet_transactions(created_at DESC);

-- Subscriptions
CREATE INDEX idx_subscriptions_user_id ON membership_subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON membership_subscriptions(status);
CREATE INDEX idx_subscriptions_expires_at ON membership_subscriptions(expires_at);

-- Benefit usage
CREATE INDEX idx_benefit_usage_user_id ON membership_benefit_usage(user_id);

-- Referrals
CREATE INDEX idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX idx_referrals_status ON referrals(status);

-- Service requests
CREATE INDEX idx_service_requests_user_id ON service_requests(user_id);
CREATE INDEX idx_service_requests_status ON service_requests(status);
CREATE INDEX idx_service_requests_assigned_to ON service_requests(assigned_to);

-- Custom order requests
CREATE INDEX idx_custom_requests_user_id ON custom_order_requests(user_id);
CREATE INDEX idx_custom_requests_status ON custom_order_requests(status);

-- Carts
CREATE INDEX idx_carts_user_id ON carts(user_id);
CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);

-- Broadcasts
CREATE INDEX idx_broadcasts_status ON broadcasts(status);
CREATE INDEX idx_broadcast_recipients_user_id ON broadcast_recipients(user_id);
CREATE INDEX idx_broadcast_recipients_broadcast_id ON broadcast_recipients(broadcast_id);

-- Notifications
CREATE INDEX idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX idx_user_notifications_read ON user_notifications(user_id, read);
CREATE INDEX idx_system_notifications_recipient ON system_notifications(recipient_id);
CREATE INDEX idx_system_notifications_read ON system_notifications(recipient_id, read);

-- Fulfillment
CREATE INDEX idx_fulfillment_order_id ON fulfillment_tracking(order_id);
CREATE INDEX idx_fulfillment_assigned_to ON fulfillment_tracking(assigned_to);

-- Audit log
CREATE INDEX idx_audit_log_admin_user ON admin_audit_log(admin_user_id);
CREATE INDEX idx_audit_log_action ON admin_audit_log(action);
CREATE INDEX idx_audit_log_created_at ON admin_audit_log(created_at DESC);

-- Team
CREATE INDEX idx_team_members_user_id ON admin_team_members(user_id);
CREATE INDEX idx_team_privileges_member ON admin_team_privileges(team_member_id);

-- Notification preferences
CREATE INDEX idx_notif_prefs_admin ON notification_preferences(admin_id);

-- ════════════════════════════════════════════════════════════
-- 13. UPDATED_AT TRIGGER
-- ════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON carts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON service_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON custom_order_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON fulfillment_tracking FOR EACH ROW EXECUTE FUNCTION update_updated_at();
