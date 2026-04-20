-- ============================================================
-- LagosApps — Seed Product Catalog
-- Categories + Products across all 7 portals
-- ============================================================

-- ── Product Categories ───────────────────────────────────────

-- Solar
INSERT INTO product_categories (portal_id, name, slug, sort_order) VALUES
  ('solar', 'Solar Panels', 'panels', 1),
  ('solar', 'Inverters', 'inverters', 2),
  ('solar', 'Batteries', 'batteries', 3),
  ('solar', 'Charge Controllers', 'controllers', 4),
  ('solar', 'Cables & Accessories', 'cables', 5);

-- Transport
INSERT INTO product_categories (portal_id, name, slug, sort_order) VALUES
  ('transport', 'Van Rental', 'van-rental', 1),
  ('transport', 'Bus Rental', 'bus-rental', 2),
  ('transport', 'Car Rental', 'car-rental', 3),
  ('transport', 'Car Purchase', 'car-purchase', 4),
  ('transport', 'EV Purchase', 'ev-purchase', 5),
  ('transport', 'Motorcycle Dispatch', 'motorcycle', 6);

-- Groceries
INSERT INTO product_categories (portal_id, name, slug, sort_order) VALUES
  ('groceries', 'Drinks & Juices', 'drinks', 1),
  ('groceries', 'Cereals & Beverages', 'cereals', 2),
  ('groceries', 'Snacks & Biscuits', 'snacks', 3),
  ('groceries', 'Canned & Cooking', 'canned', 4),
  ('groceries', 'Staples & Pasta', 'staples', 5),
  ('groceries', 'Household Supplies', 'household', 6);

-- Health
INSERT INTO product_categories (portal_id, name, slug, sort_order) VALUES
  ('health', 'Health Services', 'services', 1),
  ('health', 'Medical Tests', 'tests', 2),
  ('health', 'Medical Supplies', 'supplies', 3);

-- Events
INSERT INTO product_categories (portal_id, name, slug, sort_order) VALUES
  ('events', 'Venues', 'venues', 1),
  ('events', 'Coverage Services', 'coverage', 2),
  ('events', 'Event Types', 'types', 3);

-- Community
INSERT INTO product_categories (portal_id, name, slug, sort_order) VALUES
  ('community', 'TEPLEARN Courses', 'courses', 1),
  ('community', 'Sponsorships', 'sponsorships', 2),
  ('community', 'Donations', 'donations', 3),
  ('community', 'Volunteer Areas', 'volunteer', 4),
  ('community', 'Impact Areas', 'impact', 5);

-- Logistics
INSERT INTO product_categories (portal_id, name, slug, sort_order) VALUES
  ('logistics', 'Package Receive & Deliver', 'packages', 1);

-- ── Products: Solar ──────────────────────────────────────────

INSERT INTO products (portal_id, name, description, price, unit, stock, stock_status, metadata) VALUES
  ('solar', 'SMS 650W Panel', 'High-efficiency monocrystalline 650W panel', 185000, 'unit', 45, 'in_stock', '{"wattage": 650, "type": "Monocrystalline"}'),
  ('solar', 'SMS 550W Panel', 'Tier 1 bifacial mono 550W panel', 165000, 'unit', 30, 'in_stock', '{"wattage": 550, "type": "Bifacial Mono"}'),
  ('solar', 'SMS 450W Panel', 'Polycrystalline 450W panel for budget builds', 125000, 'unit', 50, 'in_stock', '{"wattage": 450, "type": "Polycrystalline"}'),
  ('solar', 'Eitai 350W Mono PV', 'Compact 350W mono PV module', 95000, 'unit', 35, 'in_stock', '{"wattage": 350, "type": "Mono PV"}'),
  ('solar', 'Growatt 12KVA Hybrid', 'SPF compact hybrid inverter 48V', 920000, 'unit', 8, 'in_stock', '{"capacity": "12KVA", "voltage": "48V"}'),
  ('solar', 'Growatt 10KVA Hybrid', 'SPF compact hybrid inverter 48V', 750000, 'unit', 12, 'in_stock', '{"capacity": "10KVA", "voltage": "48V"}'),
  ('solar', 'Torchn 5KVA 48V', '5KVA/4KW 48V 80A inverter', 450000, 'unit', 18, 'in_stock', '{"capacity": "5KVA", "voltage": "48V"}'),
  ('solar', 'VEICHI 3KVA', 'SIS3-3K-24-S inverter for small homes', 280000, 'unit', 22, 'in_stock', '{"capacity": "3KVA", "voltage": "24V"}'),
  ('solar', '51.2V 200Ah LiFePO4', 'Rack-mounted lithium iron phosphate', 850000, 'unit', 15, 'in_stock', '{"capacity": "200Ah", "type": "LiFePO4"}'),
  ('solar', 'Moli 12V 300A Lithium', '3.84KW lithium battery', 380000, 'unit', 25, 'in_stock', '{"capacity": "300Ah", "type": "Lithium"}'),
  ('solar', '150Ah Gel Battery', 'Deep-cycle maintenance-free gel battery', 120000, 'unit', 40, 'in_stock', '{"capacity": "150Ah", "type": "Gel"}'),
  ('solar', 'Bluesun Runner 100A', 'MPPT charge controller 100A', 85000, 'unit', 28, 'in_stock', '{"amps": 100, "type": "MPPT"}'),
  ('solar', 'Bluesun Explorer 60A', 'MPPT charge controller 60A with LCD', 65000, 'unit', 35, 'in_stock', '{"amps": 60, "type": "MPPT"}'),
  ('solar', 'Solar Cable 6mm 10m', 'Twin solar DC cable, 10-metre roll', 8500, 'roll', 100, 'in_stock', '{}'),
  ('solar', 'MC4 Connector Set', 'Waterproof MC4 male-female pair', 2500, 'pair', 200, 'in_stock', '{}'),
  ('solar', 'Roof Mounting Kit', 'Aluminium rail mounting for 4 panels', 35000, 'set', 32, 'in_stock', '{}');

-- ── Products: Transport ──────────────────────────────────────

INSERT INTO products (portal_id, name, description, price, unit, stock, stock_status, metadata) VALUES
  ('transport', 'Van Rental — Cargo', 'Cargo van for moving goods and equipment', 35000, 'day', 6, 'in_stock', '{"vehicle_type": "van"}'),
  ('transport', 'Bus Charter — 30 Seater', 'Coaster bus for group transport and outings', 120000, 'trip', 5, 'in_stock', '{"vehicle_type": "bus", "capacity": 30}'),
  ('transport', 'Sedan Rental', 'Comfortable sedan for city trips, AC included', 25000, 'day', 12, 'in_stock', '{"vehicle_type": "car"}'),
  ('transport', 'SUV Rental', 'Spacious SUV for family or business travel', 45000, 'day', 8, 'in_stock', '{"vehicle_type": "suv"}'),
  ('transport', 'Motorcycle Dispatch', 'Quick motorcycle dispatch across the city', 3000, 'trip', 20, 'in_stock', '{"vehicle_type": "motorcycle"}'),
  ('transport', 'Airport Shuttle', 'Reliable airport pickup and drop-off service', 18000, 'trip', 10, 'in_stock', '{"vehicle_type": "car"}');

-- ── Products: Groceries ──────────────────────────────────────

INSERT INTO products (portal_id, name, description, price, unit, stock, stock_status, metadata) VALUES
  ('groceries', 'Coca Cola 50cl x12', 'Classic Coca Cola pack of 12', 3600, 'pack', 80, 'in_stock', '{}'),
  ('groceries', 'Chi Exotic Juice 1L', 'Mixed tropical fruit juice', 1200, 'bottle', 55, 'in_stock', '{}'),
  ('groceries', 'Eva Water 75cl x12', 'Premium table water pack', 2400, 'pack', 100, 'in_stock', '{}'),
  ('groceries', 'Golden Morn 900g', 'Whole grain cereal mix', 2800, 'pack', 60, 'in_stock', '{}'),
  ('groceries', 'Bournvita 900g', 'Chocolate malt beverage', 3500, 'tin', 45, 'in_stock', '{}'),
  ('groceries', 'Pringles Original', 'Original flavour crisps 165g', 2500, 'can', 50, 'in_stock', '{}'),
  ('groceries', 'McVities Shortbread', 'Butter shortbread biscuits 200g', 1800, 'pack', 40, 'in_stock', '{}'),
  ('groceries', 'Tasty Tom Tin 400g', 'Tomato paste cooking tin', 900, 'tin', 120, 'in_stock', '{}'),
  ('groceries', 'Power Oil 5L', 'Refined vegetable cooking oil', 9500, 'keg', 70, 'in_stock', '{}'),
  ('groceries', 'Honeywell Spaghetti 500g', 'Premium spaghetti pasta', 800, 'pack', 90, 'in_stock', '{}'),
  ('groceries', 'Rice 50kg (Long Grain)', 'Premium long-grain parboiled rice', 72000, 'bag', 40, 'in_stock', '{}'),
  ('groceries', 'Ariel Auto 1.8Kg', 'Automatic washing powder', 4500, 'pack', 50, 'in_stock', '{}'),
  ('groceries', 'Duracell AA x4', 'Alkaline batteries pack of 4', 2200, 'pack', 80, 'in_stock', '{}');

-- ── Products: Health ─────────────────────────────────────────

INSERT INTO products (portal_id, name, description, price, unit, stock, stock_status, metadata) VALUES
  ('health', 'Free Health Check', '1st & 3rd Friday community screening', 0, 'session', 99, 'in_stock', '{"coming_soon": false}'),
  ('health', 'Doctor Consultation', '30-minute consultation with GP', 10000, 'session', 99, 'in_stock', '{}'),
  ('health', 'Wellness Advisory', 'Wellness centre advisory session', 5000, 'session', 99, 'in_stock', '{}'),
  ('health', 'Dental Checkup', 'Dental examination with cleaning', 20000, 'session', 99, 'in_stock', '{}'),
  ('health', 'Pregnancy Test', 'Urine pregnancy test (PT)', 2000, 'test', 99, 'in_stock', '{}'),
  ('health', 'Full Blood Count', 'Complete blood count & differential', 8000, 'test', 99, 'in_stock', '{}'),
  ('health', 'Hepatitis B Screening', 'HBsAg rapid screening test', 5000, 'test', 99, 'in_stock', '{}'),
  ('health', 'Genotype Test', 'Haemoglobin electrophoresis', 6000, 'test', 99, 'in_stock', '{}'),
  ('health', 'Malaria Test', 'Rapid malaria antigen diagnostic', 3500, 'test', 99, 'in_stock', '{}'),
  ('health', 'Chest X-Ray', 'Standard chest radiograph', 12000, 'test', 99, 'in_stock', '{}'),
  ('health', 'Portable Hematology Analyzer', 'Auto hematology analyzer device', 450000, 'unit', 5, 'in_stock', '{}'),
  ('health', 'Philips AED Defibrillator', 'Heartstart Onsite AED', 680000, 'unit', 3, 'low_stock', '{}'),
  ('health', 'First Aid Kit', 'Complete household first aid kit', 12000, 'kit', 40, 'in_stock', '{}');

-- ── Products: Events ─────────────────────────────────────────

INSERT INTO products (portal_id, name, description, price, unit, stock, stock_status, metadata) VALUES
  ('events', 'Studio Booking', '10-person studio — soundproofing, pro lighting', 50000, 'day', 5, 'in_stock', '{"capacity": 10}'),
  ('events', 'Conference Room', '20-person room — projector, whiteboard, WiFi', 80000, 'day', 4, 'in_stock', '{"capacity": 20}'),
  ('events', 'Training Room', '50-person room — flexible layout, AV equipment', 150000, 'day', 3, 'low_stock', '{"capacity": 50}'),
  ('events', 'Video Production', 'Professional video recording & editing', 120000, 'event', 10, 'in_stock', '{}'),
  ('events', 'Photography Package', 'Professional photographer — 6 hours', 80000, 'event', 10, 'in_stock', '{}'),
  ('events', 'Audio Recording', 'Studio-quality audio recording session', 60000, 'session', 8, 'in_stock', '{}'),
  ('events', 'Live Streaming', 'Multi-camera live stream setup', 150000, 'event', 5, 'in_stock', '{}'),
  ('events', 'Decoration Package', 'Full event decoration and florals', 200000, 'event', 6, 'in_stock', '{}');

-- ── Products: Community ──────────────────────────────────────

INSERT INTO products (portal_id, name, description, price, unit, stock, stock_status, metadata) VALUES
  ('community', 'Web Development', '12-week fullstack web development', 150000, 'seat', 30, 'in_stock', '{}'),
  ('community', 'Data Science & Analytics', '8-week data analytics with Python', 120000, 'seat', 25, 'in_stock', '{}'),
  ('community', 'UI/UX Design', '10-week product design bootcamp', 100000, 'seat', 20, 'in_stock', '{}'),
  ('community', 'Digital Marketing', '6-week digital marketing course', 80000, 'seat', 30, 'in_stock', '{}'),
  ('community', 'Student Tuition Sponsorship', 'Sponsor a students school fees', 50000, 'sponsorship', 99, 'in_stock', '{}'),
  ('community', 'Community Health Screening', 'Fund a free community health check', 100000, 'sponsorship', 99, 'in_stock', '{}'),
  ('community', 'Education & School Support', 'Support school supplies and learning', 0, 'donation', 99, 'in_stock', '{}'),
  ('community', 'Youth Empowerment', 'Fund mentoring and career programs', 0, 'donation', 99, 'in_stock', '{}'),
  ('community', 'Community Cleanup', 'Organised neighbourhood cleanup event', 0, 'volunteer', 100, 'in_stock', '{}'),
  ('community', 'Tree Planting Drive', 'Plant and nurture trees in the community', 0, 'volunteer', 200, 'in_stock', '{}'),
  ('community', 'TEPLEARN Education', 'Youth skills training programs', 0, 'program', 99, 'in_stock', '{}'),
  ('community', 'Health Interventions', 'Free community health screenings', 0, 'program', 99, 'in_stock', '{}');

-- ── Products: Logistics ──────────────────────────────────────

INSERT INTO products (portal_id, name, description, price, unit, stock, stock_status, metadata) VALUES
  ('logistics', 'Amazon Package Receive', 'Receive and deliver Amazon orders', 5000, 'package', 99, 'in_stock', '{"store": "Amazon"}'),
  ('logistics', 'AliExpress Package Receive', 'Receive and deliver AliExpress orders', 4500, 'package', 99, 'in_stock', '{"store": "AliExpress"}'),
  ('logistics', 'Shein Package Receive', 'Receive and deliver Shein orders', 4000, 'package', 99, 'in_stock', '{"store": "Shein"}'),
  ('logistics', 'Temu Package Receive', 'Receive and deliver Temu orders', 4000, 'package', 99, 'in_stock', '{"store": "Temu"}'),
  ('logistics', 'eBay Package Receive', 'Receive and deliver eBay orders', 5500, 'package', 99, 'in_stock', '{"store": "eBay"}'),
  ('logistics', 'Other Store — Custom', 'Receive from any other online store', 6000, 'package', 99, 'in_stock', '{"store": "Other"}');

-- ── Solar Packages ───────────────────────────────────────────

INSERT INTO solar_packages (name, battery_type, capacity_kw, price, sort_order) VALUES
  ('3.5KW Gel Package', 'gel', 3.5, 850000, 1),
  ('5KW Gel Package', 'gel', 5.0, 1200000, 2),
  ('7.5KW Gel Package', 'gel', 7.5, 1800000, 3),
  ('10KW Gel Package', 'gel', 10.0, 2500000, 4),
  ('12KW Gel Package', 'gel', 12.0, 3200000, 5),
  ('3.5KW Lithium Package', 'lithium', 3.5, 1100000, 6),
  ('5KW Lithium Package', 'lithium', 5.0, 1600000, 7),
  ('7.5KW Lithium Package', 'lithium', 7.5, 2400000, 8),
  ('10KW Lithium Package', 'lithium', 10.0, 3300000, 9),
  ('12KW Lithium Package', 'lithium', 12.0, 4200000, 10);

-- ── Venues ───────────────────────────────────────────────────

INSERT INTO venues (name, location, description, capacity, price_range, amenities, categories, sort_order) VALUES
  ('Studio', 'Ikeja, Lagos', '10-person studio with soundproofing and professional lighting', 10, '₦50,000 - ₦80,000/day', ARRAY['Soundproofing', 'Pro Lighting', 'AC', 'WiFi'], ARRAY['Recording', 'Photography', 'Podcast'], 1),
  ('Conference Room', 'Victoria Island, Lagos', '20-person room with projector, whiteboard, and high-speed WiFi', 20, '₦80,000 - ₦120,000/day', ARRAY['Projector', 'Whiteboard', 'WiFi', 'AC', 'Coffee Station'], ARRAY['Meeting', 'Workshop', 'Presentation'], 2),
  ('Training Room', 'Lekki, Lagos', '50-person flexible layout room with full AV equipment', 50, '₦150,000 - ₦250,000/day', ARRAY['AV Equipment', 'Flexible Layout', 'WiFi', 'AC', 'Breakout Area', 'Catering Available'], ARRAY['Training', 'Seminar', 'Team Building', 'Conference'], 3);

-- ── Building Types ───────────────────────────────────────────

INSERT INTO building_types (label, recommendation, gel_price, lithium_price, sort_order) VALUES
  ('Single Room', 'Small solar setup for basic needs', 350000, 550000, 1),
  ('Flat / Apartment', 'Medium setup for apartments', 850000, 1100000, 2),
  ('Bungalow', 'Standard home solar system', 1200000, 1600000, 3),
  ('Duplex', 'Larger system for multi-floor homes', 1800000, 2400000, 4),
  ('Factory / Commercial', 'Industrial-grade solar installation', 3500000, 4500000, 5);
