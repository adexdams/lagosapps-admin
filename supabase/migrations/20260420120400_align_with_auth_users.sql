-- ============================================================
-- LagosApps — Schema Alignment: profiles table extending auth.users
--
-- The admin repo originally created a standalone `users` table.
-- The user-facing repo expects a `profiles` table that extends
-- Supabase's built-in auth.users. Since both repos share this
-- database, we align to the user repo's pattern (which is the
-- correct Supabase-auth-native approach).
--
-- This migration:
-- 1. Drops the old `users` table (and cascades to related FKs)
-- 2. Creates `profiles` extending auth.users with auto-create trigger
-- 3. Recreates all tables that referenced `users` to reference `profiles`
-- ============================================================

-- ── Drop dependent tables (they reference users) ────────────

DROP TABLE IF EXISTS admin_audit_log CASCADE;
DROP TABLE IF EXISTS admin_team_privileges CASCADE;
DROP TABLE IF EXISTS admin_team_members CASCADE;
DROP TABLE IF EXISTS fulfillment_notes CASCADE;
DROP TABLE IF EXISTS fulfillment_tracking CASCADE;
DROP TABLE IF EXISTS custom_request_notes CASCADE;
DROP TABLE IF EXISTS custom_order_requests CASCADE;
DROP TABLE IF EXISTS service_request_notes CASCADE;
DROP TABLE IF EXISTS service_requests CASCADE;
DROP TABLE IF EXISTS notification_preferences CASCADE;
DROP TABLE IF EXISTS system_notifications CASCADE;
DROP TABLE IF EXISTS user_notifications CASCADE;
DROP TABLE IF EXISTS broadcast_recipients CASCADE;
DROP TABLE IF EXISTS broadcasts CASCADE;
DROP TABLE IF EXISTS referrals CASCADE;
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS carts CASCADE;
DROP TABLE IF EXISTS wallet_transactions CASCADE;
DROP TABLE IF EXISTS order_timeline CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS membership_benefit_usage CASCADE;
DROP TABLE IF EXISTS membership_subscriptions CASCADE;
DROP TABLE IF EXISTS platform_settings CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop the is_admin helper so we can recreate it referencing profiles
DROP FUNCTION IF EXISTS is_admin() CASCADE;

-- ── Create profiles extending auth.users ────────────────────

DROP TABLE IF EXISTS profiles CASCADE;
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  email TEXT DEFAULT '',
  whatsapp_number TEXT DEFAULT '',
  addresses JSONB DEFAULT '[]'::jsonb,
  avatar_url TEXT,
  membership_tier membership_tier NOT NULL DEFAULT 'none',
  wallet_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
  referral_code VARCHAR(20) UNIQUE,
  referred_by UUID REFERENCES profiles(id),
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-create profile on auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, referral_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    'LA' || UPPER(SUBSTR(MD5(RANDOM()::TEXT), 1, 6))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger on profiles
CREATE TRIGGER set_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Recreate is_admin helper (now references profiles) ──────

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── Recreate dependent tables (FKs now point to profiles) ───

CREATE TABLE membership_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
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
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  benefit_key VARCHAR(50) NOT NULL,
  used_count INT NOT NULL DEFAULT 0,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL
);

CREATE TABLE orders (
  id VARCHAR(20) PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id),
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
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id VARCHAR(20) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  name TEXT NOT NULL,
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
  created_by UUID REFERENCES profiles(id)
);

CREATE TABLE wallet_transactions (
  id VARCHAR(20) PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id),
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  type wallet_txn_type NOT NULL,
  running_balance DECIMAL(12,2) NOT NULL,
  reference TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
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

CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES profiles(id),
  referred_id UUID REFERENCES profiles(id),
  gifted_tier VARCHAR(10) REFERENCES membership_tiers(id),
  reward_amount DECIMAL(10,2) DEFAULT 0,
  status referral_status NOT NULL DEFAULT 'pending',
  expires_at DATE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('info', 'promo', 'alert', 'update')),
  image_url TEXT,
  recipients_type VARCHAR(20) NOT NULL CHECK (recipients_type IN ('all', 'tier', 'specific')),
  recipients_filter JSONB DEFAULT '{}',
  status broadcast_status NOT NULL DEFAULT 'draft',
  sent_by UUID REFERENCES profiles(id),
  sent_at TIMESTAMPTZ,
  retracted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE broadcast_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id UUID NOT NULL REFERENCES broadcasts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  delivered BOOLEAN NOT NULL DEFAULT false,
  read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('order', 'wallet', 'membership', 'system', 'broadcast')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  entity_type VARCHAR(30),
  entity_id TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  retracted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE system_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
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
  admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category VARCHAR(30) NOT NULL CHECK (category IN (
    'orders', 'fulfillment', 'requests', 'inventory',
    'wallet', 'membership', 'team', 'system'
  )),
  enabled BOOLEAN NOT NULL DEFAULT true,
  low_stock_threshold INT,
  large_transaction_threshold DECIMAL(12,2),
  overdue_hours_threshold INT,
  sla_risk_hours_threshold INT,
  UNIQUE(admin_id, category)
);

CREATE TABLE service_requests (
  id VARCHAR(20) PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id),
  portal_id VARCHAR(20) NOT NULL REFERENCES service_portals(id),
  type VARCHAR(30) NOT NULL,
  type_label TEXT NOT NULL,
  status service_request_status NOT NULL DEFAULT 'new',
  assigned_to UUID REFERENCES profiles(id),
  details JSONB NOT NULL DEFAULT '{}',
  decline_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE service_request_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id VARCHAR(20) NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id),
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE custom_order_requests (
  id VARCHAR(20) PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id),
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
  author_id UUID NOT NULL REFERENCES profiles(id),
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE fulfillment_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id VARCHAR(20) NOT NULL REFERENCES orders(id) ON DELETE CASCADE UNIQUE,
  assigned_to UUID REFERENCES profiles(id),
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
  author_id UUID NOT NULL REFERENCES profiles(id),
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE admin_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
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
  admin_user_id UUID NOT NULL REFERENCES profiles(id),
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(30),
  entity_id TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE platform_settings (
  key VARCHAR(50) PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES profiles(id)
);

-- ── Recreate indexes ────────────────────────────────────────

CREATE INDEX idx_profiles_membership_tier ON profiles(membership_tier);
CREATE INDEX idx_profiles_referral_code ON profiles(referral_code);
CREATE INDEX idx_profiles_role ON profiles(role);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_portal_id ON orders(portal_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

CREATE INDEX idx_wallet_txns_user_id ON wallet_transactions(user_id);
CREATE INDEX idx_wallet_txns_created_at ON wallet_transactions(created_at DESC);

CREATE INDEX idx_subscriptions_user_id ON membership_subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON membership_subscriptions(status);
CREATE INDEX idx_subscriptions_expires_at ON membership_subscriptions(expires_at);

CREATE INDEX idx_benefit_usage_user_id ON membership_benefit_usage(user_id);
CREATE INDEX idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX idx_referrals_status ON referrals(status);

CREATE INDEX idx_service_requests_user_id ON service_requests(user_id);
CREATE INDEX idx_service_requests_status ON service_requests(status);
CREATE INDEX idx_service_requests_assigned_to ON service_requests(assigned_to);

CREATE INDEX idx_custom_requests_user_id ON custom_order_requests(user_id);
CREATE INDEX idx_custom_requests_status ON custom_order_requests(status);

CREATE INDEX idx_carts_user_id ON carts(user_id);
CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);

CREATE INDEX idx_broadcasts_status ON broadcasts(status);
CREATE INDEX idx_broadcast_recipients_user_id ON broadcast_recipients(user_id);
CREATE INDEX idx_broadcast_recipients_broadcast_id ON broadcast_recipients(broadcast_id);

CREATE INDEX idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX idx_user_notifications_read ON user_notifications(user_id, read);
CREATE INDEX idx_system_notifications_recipient ON system_notifications(recipient_id);
CREATE INDEX idx_system_notifications_read ON system_notifications(recipient_id, read);

CREATE INDEX idx_fulfillment_order_id ON fulfillment_tracking(order_id);
CREATE INDEX idx_fulfillment_assigned_to ON fulfillment_tracking(assigned_to);

CREATE INDEX idx_audit_log_admin_user ON admin_audit_log(admin_user_id);
CREATE INDEX idx_audit_log_action ON admin_audit_log(action);
CREATE INDEX idx_audit_log_created_at ON admin_audit_log(created_at DESC);

CREATE INDEX idx_team_members_user_id ON admin_team_members(user_id);
CREATE INDEX idx_team_privileges_member ON admin_team_privileges(team_member_id);
CREATE INDEX idx_notif_prefs_admin ON notification_preferences(admin_id);

-- ── Recreate updated_at triggers ────────────────────────────

CREATE TRIGGER set_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON carts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON service_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON custom_order_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON fulfillment_tracking FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Enable RLS + recreate policies ──────────────────────────

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_benefit_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE broadcast_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_request_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_order_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_request_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE fulfillment_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE fulfillment_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_team_privileges ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users read own profile" ON profiles FOR SELECT USING (auth.uid() = id OR is_admin());
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Admin full access profiles" ON profiles FOR ALL USING (is_admin());

-- Orders
CREATE POLICY "Users read own orders" ON orders FOR SELECT USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Users create orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id OR is_admin());
CREATE POLICY "Admin full access orders" ON orders FOR ALL USING (is_admin());
CREATE POLICY "Users read own order items" ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND (orders.user_id = auth.uid() OR is_admin()))
);
CREATE POLICY "Admin full access order items" ON order_items FOR ALL USING (is_admin());
CREATE POLICY "Users read own order timeline" ON order_timeline FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_timeline.order_id AND (orders.user_id = auth.uid() OR is_admin()))
);
CREATE POLICY "Admin full access order timeline" ON order_timeline FOR ALL USING (is_admin());

-- Wallet
CREATE POLICY "Users read own wallet" ON wallet_transactions FOR SELECT USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Admin full access wallet" ON wallet_transactions FOR ALL USING (is_admin());

-- Cart
CREATE POLICY "Users manage own cart" ON carts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admin read all carts" ON carts FOR SELECT USING (is_admin());
CREATE POLICY "Users manage own cart items" ON cart_items FOR ALL USING (
  EXISTS (SELECT 1 FROM carts WHERE carts.id = cart_items.cart_id AND carts.user_id = auth.uid())
);
CREATE POLICY "Admin read all cart items" ON cart_items FOR SELECT USING (is_admin());

-- Subscriptions
CREATE POLICY "Users read own subscriptions" ON membership_subscriptions FOR SELECT USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Admin full access subscriptions" ON membership_subscriptions FOR ALL USING (is_admin());
CREATE POLICY "Users read own benefit usage" ON membership_benefit_usage FOR SELECT USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Admin full access benefit usage" ON membership_benefit_usage FOR ALL USING (is_admin());

-- Referrals
CREATE POLICY "Users read own referrals" ON referrals FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id OR is_admin());
CREATE POLICY "Admin full access referrals" ON referrals FOR ALL USING (is_admin());

-- Notifications
CREATE POLICY "Users read own notifications" ON user_notifications FOR SELECT USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Users update own notifications" ON user_notifications FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin full access user notifications" ON user_notifications FOR ALL USING (is_admin());

-- Broadcasts (admin-managed)
CREATE POLICY "Admin full access broadcasts" ON broadcasts FOR ALL USING (is_admin());
CREATE POLICY "Users read own broadcast receipts" ON broadcast_recipients FOR SELECT USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Users update own broadcast receipts" ON broadcast_recipients FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin full access broadcast_recipients" ON broadcast_recipients FOR ALL USING (is_admin());

-- System notifications (admin-only)
CREATE POLICY "Admin read own system notifications" ON system_notifications FOR SELECT USING (auth.uid() = recipient_id);
CREATE POLICY "Admin update own system notifications" ON system_notifications FOR UPDATE USING (auth.uid() = recipient_id);
CREATE POLICY "System insert system notifications" ON system_notifications FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admin manage own preferences" ON notification_preferences FOR ALL USING (auth.uid() = admin_id);

-- Service requests
CREATE POLICY "Users read own service requests" ON service_requests FOR SELECT USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Users create service requests" ON service_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin full access service requests" ON service_requests FOR ALL USING (is_admin());
CREATE POLICY "Admin full access request notes" ON service_request_notes FOR ALL USING (is_admin());

-- Custom orders
CREATE POLICY "Users read own custom requests" ON custom_order_requests FOR SELECT USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Users create custom requests" ON custom_order_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin full access custom requests" ON custom_order_requests FOR ALL USING (is_admin());
CREATE POLICY "Admin full access custom request notes" ON custom_request_notes FOR ALL USING (is_admin());

-- Fulfillment
CREATE POLICY "Admin full access fulfillment" ON fulfillment_tracking FOR ALL USING (is_admin());
CREATE POLICY "Admin full access fulfillment notes" ON fulfillment_notes FOR ALL USING (is_admin());

-- Team
CREATE POLICY "Admin read team members" ON admin_team_members FOR SELECT USING (is_admin());
CREATE POLICY "Admin manage team members" ON admin_team_members FOR ALL USING (is_admin());
CREATE POLICY "Admin read team privileges" ON admin_team_privileges FOR SELECT USING (is_admin());
CREATE POLICY "Admin manage team privileges" ON admin_team_privileges FOR ALL USING (is_admin());

-- Audit
CREATE POLICY "Admin read audit log" ON admin_audit_log FOR SELECT USING (is_admin());
CREATE POLICY "Admin insert audit log" ON admin_audit_log FOR INSERT WITH CHECK (is_admin());

-- Settings
CREATE POLICY "Public read settings" ON platform_settings FOR SELECT USING (true);
CREATE POLICY "Admin full access settings" ON platform_settings FOR ALL USING (is_admin());

-- ── Recreate catalog admin policies (dropped by CASCADE) ────

CREATE POLICY "Admin manage portals" ON service_portals FOR ALL USING (is_admin());
CREATE POLICY "Admin manage categories" ON product_categories FOR ALL USING (is_admin());
CREATE POLICY "Admin manage products" ON products FOR ALL USING (is_admin());
CREATE POLICY "Admin manage solar_packages" ON solar_packages FOR ALL USING (is_admin());
CREATE POLICY "Admin manage building_types" ON building_types FOR ALL USING (is_admin());
CREATE POLICY "Admin manage pricing_zones" ON pricing_zones FOR ALL USING (is_admin());
CREATE POLICY "Admin manage transport_pricing" ON transport_pricing FOR ALL USING (is_admin());
CREATE POLICY "Admin manage venues" ON venues FOR ALL USING (is_admin());
CREATE POLICY "Admin manage tiers" ON membership_tiers FOR ALL USING (is_admin());
CREATE POLICY "Admin manage tier_benefits" ON membership_tier_benefits FOR ALL USING (is_admin());

-- ── Re-seed platform settings ───────────────────────────────

INSERT INTO platform_settings (key, value) VALUES
  ('site_name', 'LagosApps'),
  ('support_email', 'support@lagosapps.com'),
  ('support_phone', '+234 801 234 5678'),
  ('whatsapp_number', '+234 801 234 5678'),
  ('paystack_test_mode', 'true'),
  ('paystack_public_key', 'pk_test_xxxxxxxxxxxxxxxxxxxxx');
