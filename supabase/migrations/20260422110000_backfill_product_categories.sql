-- ============================================================
-- Backfill category_id for products seeded in migration
-- 20260420120300_seed_products.sql (which left category_id NULL).
--
-- Strategy: match by portal_id + product_categories.name. The seed
-- inserted products without category_id but the categories were also
-- seeded in the same migration, so we can UPDATE by looking up the
-- category UUID from its name + portal.
-- ============================================================

-- Solar
UPDATE products SET category_id = (SELECT id FROM product_categories WHERE portal_id = 'solar' AND name = 'Solar Panels')
  WHERE portal_id = 'solar' AND category_id IS NULL AND name IN ('SMS 650W Panel', 'SMS 550W Panel', 'SMS 450W Panel', 'Eitai 350W Mono PV');

UPDATE products SET category_id = (SELECT id FROM product_categories WHERE portal_id = 'solar' AND name = 'Inverters')
  WHERE portal_id = 'solar' AND category_id IS NULL AND name IN ('Growatt 12KVA Hybrid', 'Growatt 10KVA Hybrid', 'Torchn 5KVA 48V', 'VEICHI 3KVA');

UPDATE products SET category_id = (SELECT id FROM product_categories WHERE portal_id = 'solar' AND name = 'Batteries')
  WHERE portal_id = 'solar' AND category_id IS NULL AND name IN ('51.2V 200Ah LiFePO4', 'Moli 12V 300A Lithium', '150Ah Gel Battery');

UPDATE products SET category_id = (SELECT id FROM product_categories WHERE portal_id = 'solar' AND name = 'Charge Controllers')
  WHERE portal_id = 'solar' AND category_id IS NULL AND name IN ('Bluesun Runner 100A', 'Bluesun Explorer 60A');

UPDATE products SET category_id = (SELECT id FROM product_categories WHERE portal_id = 'solar' AND name = 'Cables & Accessories')
  WHERE portal_id = 'solar' AND category_id IS NULL AND name IN ('Solar Cable 6mm 10m', 'MC4 Connector Set', 'Roof Mounting Kit');

-- Transport
UPDATE products SET category_id = (SELECT id FROM product_categories WHERE portal_id = 'transport' AND name = 'Van Rental')
  WHERE portal_id = 'transport' AND category_id IS NULL AND name = 'Van Rental — Cargo';
UPDATE products SET category_id = (SELECT id FROM product_categories WHERE portal_id = 'transport' AND name = 'Bus Rental')
  WHERE portal_id = 'transport' AND category_id IS NULL AND name = 'Bus Charter — 30 Seater';
UPDATE products SET category_id = (SELECT id FROM product_categories WHERE portal_id = 'transport' AND name = 'Car Rental')
  WHERE portal_id = 'transport' AND category_id IS NULL AND name IN ('Sedan Rental', 'SUV Rental', 'Airport Shuttle');
UPDATE products SET category_id = (SELECT id FROM product_categories WHERE portal_id = 'transport' AND name = 'Motorcycle Dispatch')
  WHERE portal_id = 'transport' AND category_id IS NULL AND name = 'Motorcycle Dispatch';

-- Groceries
UPDATE products SET category_id = (SELECT id FROM product_categories WHERE portal_id = 'groceries' AND name = 'Drinks & Juices')
  WHERE portal_id = 'groceries' AND category_id IS NULL AND name IN ('Coca Cola 50cl x12', 'Chi Exotic Juice 1L', 'Eva Water 75cl x12');
UPDATE products SET category_id = (SELECT id FROM product_categories WHERE portal_id = 'groceries' AND name = 'Cereals & Beverages')
  WHERE portal_id = 'groceries' AND category_id IS NULL AND name IN ('Golden Morn 900g', 'Bournvita 900g');
UPDATE products SET category_id = (SELECT id FROM product_categories WHERE portal_id = 'groceries' AND name = 'Snacks & Biscuits')
  WHERE portal_id = 'groceries' AND category_id IS NULL AND name IN ('Pringles Original', 'McVities Shortbread');
UPDATE products SET category_id = (SELECT id FROM product_categories WHERE portal_id = 'groceries' AND name = 'Canned & Cooking')
  WHERE portal_id = 'groceries' AND category_id IS NULL AND name IN ('Tasty Tom Tin 400g', 'Power Oil 5L');
UPDATE products SET category_id = (SELECT id FROM product_categories WHERE portal_id = 'groceries' AND name = 'Staples & Pasta')
  WHERE portal_id = 'groceries' AND category_id IS NULL AND name IN ('Honeywell Spaghetti 500g', 'Rice 50kg (Long Grain)');
UPDATE products SET category_id = (SELECT id FROM product_categories WHERE portal_id = 'groceries' AND name = 'Household Supplies')
  WHERE portal_id = 'groceries' AND category_id IS NULL AND name IN ('Ariel Auto 1.8Kg', 'Duracell AA x4');

-- Health
UPDATE products SET category_id = (SELECT id FROM product_categories WHERE portal_id = 'health' AND name = 'Health Services')
  WHERE portal_id = 'health' AND category_id IS NULL AND name IN ('Free Health Check', 'Doctor Consultation', 'Wellness Advisory', 'Dental Checkup');
UPDATE products SET category_id = (SELECT id FROM product_categories WHERE portal_id = 'health' AND name = 'Medical Tests')
  WHERE portal_id = 'health' AND category_id IS NULL AND name IN ('Pregnancy Test', 'Full Blood Count', 'Hepatitis B Screening', 'Genotype Test', 'Malaria Test', 'Chest X-Ray');
UPDATE products SET category_id = (SELECT id FROM product_categories WHERE portal_id = 'health' AND name = 'Medical Supplies')
  WHERE portal_id = 'health' AND category_id IS NULL AND name IN ('Portable Hematology Analyzer', 'Philips AED Defibrillator', 'First Aid Kit');

-- Events
UPDATE products SET category_id = (SELECT id FROM product_categories WHERE portal_id = 'events' AND name = 'Venues')
  WHERE portal_id = 'events' AND category_id IS NULL AND name IN ('Studio Booking', 'Conference Room', 'Training Room');
UPDATE products SET category_id = (SELECT id FROM product_categories WHERE portal_id = 'events' AND name = 'Coverage Services')
  WHERE portal_id = 'events' AND category_id IS NULL AND name IN ('Video Production', 'Photography Package', 'Audio Recording', 'Live Streaming', 'Decoration Package');

-- Community
UPDATE products SET category_id = (SELECT id FROM product_categories WHERE portal_id = 'community' AND name = 'TEPLEARN Courses')
  WHERE portal_id = 'community' AND category_id IS NULL AND name IN ('Web Development', 'Data Science & Analytics', 'UI/UX Design', 'Digital Marketing');
UPDATE products SET category_id = (SELECT id FROM product_categories WHERE portal_id = 'community' AND name = 'Sponsorships')
  WHERE portal_id = 'community' AND category_id IS NULL AND name IN ('Student Tuition Sponsorship', 'Community Health Screening');
UPDATE products SET category_id = (SELECT id FROM product_categories WHERE portal_id = 'community' AND name = 'Donations')
  WHERE portal_id = 'community' AND category_id IS NULL AND name IN ('Education & School Support', 'Youth Empowerment');
UPDATE products SET category_id = (SELECT id FROM product_categories WHERE portal_id = 'community' AND name = 'Volunteer Areas')
  WHERE portal_id = 'community' AND category_id IS NULL AND name IN ('Community Cleanup', 'Tree Planting Drive');
UPDATE products SET category_id = (SELECT id FROM product_categories WHERE portal_id = 'community' AND name = 'Impact Areas')
  WHERE portal_id = 'community' AND category_id IS NULL AND name IN ('TEPLEARN Education', 'Health Interventions');

-- Logistics (one category, all products go there)
UPDATE products SET category_id = (SELECT id FROM product_categories WHERE portal_id = 'logistics' AND name = 'Package Receive & Deliver')
  WHERE portal_id = 'logistics' AND category_id IS NULL;
