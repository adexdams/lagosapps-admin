-- ============================================================
-- LagosApps — Row-Level Security Policies
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_tier_benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_benefit_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_portals ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE solar_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE building_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE transport_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
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

-- ── Helper: check if current user is admin ──
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ════════════════════════════════════════════════════════════
-- PUBLIC READ (no auth required)
-- ════════════════════════════════════════════════════════════

-- Portals, categories, products, packages, venues, tiers — public catalog
CREATE POLICY "Public read portals" ON service_portals FOR SELECT USING (true);
CREATE POLICY "Public read categories" ON product_categories FOR SELECT USING (true);
CREATE POLICY "Public read products" ON products FOR SELECT USING (true);
CREATE POLICY "Public read solar_packages" ON solar_packages FOR SELECT USING (true);
CREATE POLICY "Public read building_types" ON building_types FOR SELECT USING (true);
CREATE POLICY "Public read pricing_zones" ON pricing_zones FOR SELECT USING (true);
CREATE POLICY "Public read transport_pricing" ON transport_pricing FOR SELECT USING (true);
CREATE POLICY "Public read venues" ON venues FOR SELECT USING (true);
CREATE POLICY "Public read tiers" ON membership_tiers FOR SELECT USING (true);
CREATE POLICY "Public read tier_benefits" ON membership_tier_benefits FOR SELECT USING (true);

-- ════════════════════════════════════════════════════════════
-- AUTHENTICATED USERS — own data only
-- ════════════════════════════════════════════════════════════

-- Users: read own profile, update own profile
CREATE POLICY "Users read own profile" ON users FOR SELECT USING (auth.uid() = id OR is_admin());
CREATE POLICY "Users update own profile" ON users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Orders: user sees own orders
CREATE POLICY "Users read own orders" ON orders FOR SELECT USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Users create orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id OR is_admin());
CREATE POLICY "Users read own order items" ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND (orders.user_id = auth.uid() OR is_admin()))
);
CREATE POLICY "Users read own order timeline" ON order_timeline FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_timeline.order_id AND (orders.user_id = auth.uid() OR is_admin()))
);

-- Wallet: user sees own transactions
CREATE POLICY "Users read own wallet" ON wallet_transactions FOR SELECT USING (auth.uid() = user_id OR is_admin());

-- Cart: user manages own cart
CREATE POLICY "Users manage own cart" ON carts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own cart items" ON cart_items FOR ALL USING (
  EXISTS (SELECT 1 FROM carts WHERE carts.id = cart_items.cart_id AND carts.user_id = auth.uid())
);

-- Subscriptions: user sees own
CREATE POLICY "Users read own subscriptions" ON membership_subscriptions FOR SELECT USING (auth.uid() = user_id OR is_admin());

-- Benefit usage: user sees own
CREATE POLICY "Users read own benefit usage" ON membership_benefit_usage FOR SELECT USING (auth.uid() = user_id OR is_admin());

-- Referrals: user sees own (as referrer or referred)
CREATE POLICY "Users read own referrals" ON referrals FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id OR is_admin());

-- User notifications: user sees own
CREATE POLICY "Users read own notifications" ON user_notifications FOR SELECT USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Users update own notifications" ON user_notifications FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Broadcast recipients: user sees own
CREATE POLICY "Users read own broadcast receipts" ON broadcast_recipients FOR SELECT USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Users update own broadcast receipts" ON broadcast_recipients FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Service requests: user sees own
CREATE POLICY "Users read own service requests" ON service_requests FOR SELECT USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Users create service requests" ON service_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Custom order requests: user sees own
CREATE POLICY "Users read own custom requests" ON custom_order_requests FOR SELECT USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Users create custom requests" ON custom_order_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ════════════════════════════════════════════════════════════
-- ADMIN — full access
-- ════════════════════════════════════════════════════════════

-- Admin can read/write all user data
CREATE POLICY "Admin full access users" ON users FOR ALL USING (is_admin());

-- Admin can manage all orders
CREATE POLICY "Admin full access orders" ON orders FOR ALL USING (is_admin());
CREATE POLICY "Admin full access order items" ON order_items FOR ALL USING (is_admin());
CREATE POLICY "Admin full access order timeline" ON order_timeline FOR ALL USING (is_admin());

-- Admin can manage wallet
CREATE POLICY "Admin full access wallet" ON wallet_transactions FOR ALL USING (is_admin());

-- Admin can view all carts
CREATE POLICY "Admin read all carts" ON carts FOR SELECT USING (is_admin());
CREATE POLICY "Admin read all cart items" ON cart_items FOR SELECT USING (is_admin());

-- Admin can manage subscriptions
CREATE POLICY "Admin full access subscriptions" ON membership_subscriptions FOR ALL USING (is_admin());
CREATE POLICY "Admin full access benefit usage" ON membership_benefit_usage FOR ALL USING (is_admin());

-- Admin can manage referrals
CREATE POLICY "Admin full access referrals" ON referrals FOR ALL USING (is_admin());

-- Admin can manage catalog
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

-- Admin can manage broadcasts
CREATE POLICY "Admin full access broadcasts" ON broadcasts FOR ALL USING (is_admin());
CREATE POLICY "Admin full access broadcast_recipients" ON broadcast_recipients FOR ALL USING (is_admin());

-- Admin can manage user notifications
CREATE POLICY "Admin full access user notifications" ON user_notifications FOR ALL USING (is_admin());

-- Admin system notifications: admin sees own
CREATE POLICY "Admin read own system notifications" ON system_notifications FOR SELECT USING (auth.uid() = recipient_id);
CREATE POLICY "Admin update own system notifications" ON system_notifications FOR UPDATE USING (auth.uid() = recipient_id);
-- System/triggers can insert for any admin
CREATE POLICY "System insert system notifications" ON system_notifications FOR INSERT WITH CHECK (is_admin());

-- Admin notification preferences: admin manages own
CREATE POLICY "Admin manage own preferences" ON notification_preferences FOR ALL USING (auth.uid() = admin_id);

-- Admin can manage service requests
CREATE POLICY "Admin full access service requests" ON service_requests FOR ALL USING (is_admin());
CREATE POLICY "Admin full access request notes" ON service_request_notes FOR ALL USING (is_admin());

-- Admin can manage custom order requests
CREATE POLICY "Admin full access custom requests" ON custom_order_requests FOR ALL USING (is_admin());
CREATE POLICY "Admin full access custom request notes" ON custom_request_notes FOR ALL USING (is_admin());

-- Admin can manage fulfillment
CREATE POLICY "Admin full access fulfillment" ON fulfillment_tracking FOR ALL USING (is_admin());
CREATE POLICY "Admin full access fulfillment notes" ON fulfillment_notes FOR ALL USING (is_admin());

-- Admin team management
CREATE POLICY "Admin read team members" ON admin_team_members FOR SELECT USING (is_admin());
CREATE POLICY "Admin manage team members" ON admin_team_members FOR ALL USING (is_admin());
CREATE POLICY "Admin read team privileges" ON admin_team_privileges FOR SELECT USING (is_admin());
CREATE POLICY "Admin manage team privileges" ON admin_team_privileges FOR ALL USING (is_admin());

-- Audit log: admin can read, system can insert
CREATE POLICY "Admin read audit log" ON admin_audit_log FOR SELECT USING (is_admin());
CREATE POLICY "Admin insert audit log" ON admin_audit_log FOR INSERT WITH CHECK (is_admin());

-- Platform settings: admin can read/write
CREATE POLICY "Admin full access settings" ON platform_settings FOR ALL USING (is_admin());
CREATE POLICY "Public read settings" ON platform_settings FOR SELECT USING (true);
