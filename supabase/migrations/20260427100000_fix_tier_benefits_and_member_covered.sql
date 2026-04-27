-- ════════════════════════════════════════════════════════════
-- Fix tier benefit keys + restore member_covered on products
-- ════════════════════════════════════════════════════════════

-- 1. Remove benefit rows whose keys are never tracked by the app:
--    - order_discount / order_discount_5 (no trackBenefitUsage call for these)
--    - photography_package (events portal tracks event_venue_discount, not this key)
DELETE FROM membership_tier_benefits
WHERE benefit_key IN ('order_discount', 'order_discount_5', 'photography_package');

-- 2. Add solar_product benefit to every tier
--    (CartPanel maps solar portal → 'solar_product' in PORTAL_BENEFIT)
INSERT INTO membership_tier_benefits (tier_id, label, benefit_key, limit_count, limit_period, sort_order) VALUES
  ('bronze', 'Solar Product Coverage', 'solar_product', 2,    'quarter', 5),
  ('silver', 'Solar Product Coverage', 'solar_product', 4,    'quarter', 6),
  ('gold',   'Solar Product Coverage', 'solar_product', NULL, 'quarter', 7);

-- 3. Add event_venue_discount to Bronze (currently missing, Silver+Gold already have it)
INSERT INTO membership_tier_benefits (tier_id, label, benefit_key, limit_count, limit_period, sort_order) VALUES
  ('bronze', 'Event Venue Discount', 'event_venue_discount', 1, 'quarter', 6);

-- 4. Restore member_covered on health consultation products
--    These trigger the doctor_consultations benefit (Bronze: 2/mo, Silver: 5/mo, Gold: unlimited)
UPDATE products
SET member_covered = true
WHERE portal_id = 'health'
  AND name IN ('Doctor Consultation', 'Wellness Advisory');

-- 5. Restore member_covered on transport car-rental products
--    These trigger the car_rental_days benefit (Bronze: 2/qtr, Silver: 5/qtr, Gold: 10/qtr)
UPDATE products
SET member_covered = true
WHERE portal_id = 'transport'
  AND name IN ('Sedan Rental', 'Airport Shuttle');

-- 6. Restore member_covered on events venue products
--    These trigger the event_venue_discount benefit
UPDATE products
SET member_covered = true
WHERE portal_id = 'events'
  AND name IN ('Studio Booking', 'Conference Room', 'Training Room', 'Photography Package');

-- 7. Restore member_covered on solar accessories
--    These trigger the solar_product benefit
--    Large inverters / batteries are excluded — only accessories/panels up to mounting kit
UPDATE products
SET member_covered = true
WHERE portal_id = 'solar'
  AND name IN ('MC4 Connector Set', 'Solar Cable 6mm 10m', 'Roof Mounting Kit');

-- 8. Mark all logistics services as member_covered
--    Logistics has no specific portal key in PORTAL_BENEFIT so it falls back to
--    free_delivery — each package-receive order counts as one free-delivery use
UPDATE products
SET member_covered = true
WHERE portal_id = 'logistics';
