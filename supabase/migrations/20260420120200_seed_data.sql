-- ============================================================
-- LagosApps — Seed Data
-- Service portals, membership tiers, pricing zones, platform settings
-- ============================================================

-- ── Service Portals ──────────────────────────────────────────

INSERT INTO service_portals (id, name, description, color, sort_order, is_active) VALUES
  ('solar', 'Solar, Renewables and More', 'Energy solutions including solar panels, inverters, batteries, and installation services', '#E65100', 1, true),
  ('transport', 'Cars, Vans and Rides', 'Vehicle rental, purchase, and transportation services across Lagos zones', '#0D47A1', 2, true),
  ('groceries', 'Food, Groceries and Household', 'Fresh groceries, ready-made meals, and household supplies delivery', '#1B5E20', 3, true),
  ('health', 'Health and Wellness', 'Medical consultations, health checks, tests, and medical supplies', '#B71C1C', 4, true),
  ('events', 'Events and Studios', 'Venue booking, event coverage, photography, and training facilities', '#4A148C', 5, true),
  ('community', 'A Better You', 'Education, sponsorships, donations, volunteering, and community impact programs', '#004D40', 6, true),
  ('logistics', 'Receive & Deliver', 'International package forwarding and local delivery services', '#4A148C', 7, true);

-- ── Membership Tiers ─────────────────────────────────────────

INSERT INTO membership_tiers (id, name, annual_price, quarterly_price, color, sort_order, is_active) VALUES
  ('bronze', 'Bronze', 24000, 7500, '#8D6E63', 1, true),
  ('silver', 'Silver', 42000, 12500, '#64748B', 2, true),
  ('gold', 'Gold', 60000, 18000, '#D97706', 3, true);

-- ── Tier Benefits ────────────────────────────────────────────

-- Bronze
INSERT INTO membership_tier_benefits (tier_id, label, benefit_key, limit_count, limit_period, sort_order) VALUES
  ('bronze', 'Free Delivery', 'free_delivery', 3, 'month', 1),
  ('bronze', 'Doctor Consultations', 'doctor_consultations', 2, 'month', 2),
  ('bronze', 'Order Discount (5%)', 'order_discount', 5, 'month', 3),
  ('bronze', 'Car Rental Days', 'car_rental_days', 2, 'quarter', 4);

-- Silver
INSERT INTO membership_tier_benefits (tier_id, label, benefit_key, limit_count, limit_period, sort_order) VALUES
  ('silver', 'Free Delivery', 'free_delivery', 8, 'month', 1),
  ('silver', 'Doctor Consultations', 'doctor_consultations', 5, 'month', 2),
  ('silver', 'Order Discount (10%)', 'order_discount', 10, 'month', 3),
  ('silver', 'Car Rental Days', 'car_rental_days', 5, 'quarter', 4),
  ('silver', 'Event Venue Discount', 'event_venue_discount', 2, 'quarter', 5);

-- Gold
INSERT INTO membership_tier_benefits (tier_id, label, benefit_key, limit_count, limit_period, sort_order) VALUES
  ('gold', 'Free Delivery', 'free_delivery', NULL, 'month', 1),
  ('gold', 'Doctor Consultations', 'doctor_consultations', NULL, 'month', 2),
  ('gold', 'Order Discount (15%)', 'order_discount', NULL, 'month', 3),
  ('gold', 'Car Rental Days', 'car_rental_days', 10, 'quarter', 4),
  ('gold', 'Event Venue Discount', 'event_venue_discount', 5, 'quarter', 5),
  ('gold', 'Priority Support', 'priority_support', NULL, 'month', 6);

-- ── Pricing Zones (Transport) ────────────────────────────────

INSERT INTO pricing_zones (portal_id, name, slug, sort_order) VALUES
  ('transport', 'Mainland', 'mainland', 1),
  ('transport', 'Island', 'island', 2),
  ('transport', 'Outskirts', 'outskirts', 3),
  ('transport', 'Abeokuta', 'abeokuta', 4),
  ('transport', 'Ibadan', 'ibadan', 5);

-- ── Platform Settings ────────────────────────────────────────

INSERT INTO platform_settings (key, value) VALUES
  ('site_name', 'LagosApps'),
  ('support_email', 'support@lagosapps.com'),
  ('support_phone', '+234 801 234 5678'),
  ('whatsapp_number', '+234 801 234 5678'),
  ('paystack_test_mode', 'true'),
  ('paystack_public_key', 'pk_test_xxxxxxxxxxxxxxxxxxxxx');
