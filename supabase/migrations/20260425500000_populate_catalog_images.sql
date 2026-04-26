-- Populate image_url, icon, cta_text, description on service_portals and
-- image_url on all products, venues, and product_categories.
-- All images are publicly accessible URLs.
-- Admins can override any individual row via the Inventory / Settings pages.

-- ── 1. Service portals ────────────────────────────────────────────────────────

UPDATE service_portals SET
  icon        = 'solar_power',
  image_url   = 'https://plus.unsplash.com/premium_photo-1678766819822-d936a3d6a3ea?w=800&q=80',
  cta_text    = 'Get a Free Solar Audit',
  description = 'Solar energy, inverters, batteries and complete power solutions for homes, offices and factories'
WHERE id = 'solar';

UPDATE service_portals SET
  icon        = 'directions_car',
  image_url   = 'https://images.unsplash.com/photo-1649502913092-fb7f0e8fc632?w=800&q=80',
  cta_text    = 'Book a Ride Now',
  description = 'Car hire, van rental, bus charter, motorcycle dispatch and airport transfers across Lagos'
WHERE id = 'transport';

UPDATE service_portals SET
  icon        = 'restaurant',
  image_url   = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80',
  cta_text    = 'Order Groceries',
  description = 'Drinks, cereals, snacks, staples, canned goods, household supplies — delivered to your door'
WHERE id = 'groceries';

UPDATE service_portals SET
  icon        = 'health_and_safety',
  image_url   = 'https://plus.unsplash.com/premium_photo-1682130171029-49261a5ba80a?w=800&q=80',
  cta_text    = 'See a Doctor',
  description = 'Medical tests, doctor consultations, home visits, wellness advisory and medical supplies'
WHERE id = 'health';

UPDATE service_portals SET
  icon        = 'celebration',
  image_url   = 'https://plus.unsplash.com/premium_photo-1732464750678-973ff68fbf9d?w=800&q=80',
  cta_text    = 'Book a Venue',
  description = 'Venue bookings, event coverage, photography, video production, live streaming and trainings'
WHERE id = 'events';

UPDATE service_portals SET
  icon        = 'school',
  image_url   = 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&q=80',
  cta_text    = 'Get Involved',
  description = 'TEPLEARN courses, community sponsorships, donations, volunteering and youth empowerment'
WHERE id = 'community';

UPDATE service_portals SET
  icon        = 'local_shipping',
  image_url   = 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=800&q=80',
  cta_text    = 'Send a Package',
  description = 'We receive your Amazon, AliExpress, Shein and international packages and deliver to your door in Lagos'
WHERE id = 'logistics';

-- ── 2. Product categories — cover images ──────────────────────────────────────

-- Solar categories
UPDATE product_categories SET image_url = 'https://mainlandsolar.lagosapps.com/wp-content/uploads/2022/07/cloudE110.png'
  WHERE slug = 'panels'      AND portal_id = 'solar';
UPDATE product_categories SET image_url = 'https://mainlandsolar.lagosapps.com/wp-content/uploads/2022/02/New-Project.png'
  WHERE slug = 'inverters'   AND portal_id = 'solar';
UPDATE product_categories SET image_url = 'https://mainlandsolar.lagosapps.com/wp-content/uploads/2025/08/battery.jpg'
  WHERE slug = 'batteries'   AND portal_id = 'solar';
UPDATE product_categories SET image_url = 'https://mainlandsolar.lagosapps.com/wp-content/uploads/2022/02/cc_100A-removebg-preview.png'
  WHERE slug = 'controllers' AND portal_id = 'solar';
UPDATE product_categories SET image_url = 'https://images.unsplash.com/photo-1509671153-dff9e3e4ed53?w=400&q=80'
  WHERE slug = 'cables'      AND portal_id = 'solar';

-- Grocery categories
UPDATE product_categories SET image_url = 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&q=80'
  WHERE slug = 'drinks'     AND portal_id = 'groceries';
UPDATE product_categories SET image_url = 'https://images.unsplash.com/photo-1559181567-c3190bfa4614?w=400&q=80'
  WHERE slug = 'cereals'    AND portal_id = 'groceries';
UPDATE product_categories SET image_url = 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&q=80'
  WHERE slug = 'snacks'     AND portal_id = 'groceries';
UPDATE product_categories SET image_url = 'https://images.unsplash.com/photo-1608394831180-a3f929b6c5a3?w=400&q=80'
  WHERE slug = 'canned'     AND portal_id = 'groceries';
UPDATE product_categories SET image_url = 'https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?w=400&q=80'
  WHERE slug = 'staples'    AND portal_id = 'groceries';
UPDATE product_categories SET image_url = 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=400&q=80'
  WHERE slug = 'household'  AND portal_id = 'groceries';

-- Health categories
UPDATE product_categories SET image_url = 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400&q=80'
  WHERE slug = 'services'  AND portal_id = 'health';
UPDATE product_categories SET image_url = 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400&q=80'
  WHERE slug = 'tests'     AND portal_id = 'health';
UPDATE product_categories SET image_url = 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=400&q=80'
  WHERE slug = 'supplies'  AND portal_id = 'health';

-- Transport categories
UPDATE product_categories SET image_url = 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=400&q=80'
  WHERE slug = 'van-rental'        AND portal_id = 'transport';
UPDATE product_categories SET image_url = 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=400&q=80'
  WHERE slug = 'bus-rental'        AND portal_id = 'transport';
UPDATE product_categories SET image_url = 'https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=400&q=80'
  WHERE slug = 'car-rental'        AND portal_id = 'transport';
UPDATE product_categories SET image_url = 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=400&q=80'
  WHERE slug = 'motorcycle'        AND portal_id = 'transport';

-- Events categories
UPDATE product_categories SET image_url = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&q=80'
  WHERE slug = 'venues'    AND portal_id = 'events';
UPDATE product_categories SET image_url = 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=400&q=80'
  WHERE slug = 'coverage'  AND portal_id = 'events';

-- Community categories
UPDATE product_categories SET image_url = 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=400&q=80'
  WHERE slug = 'courses'     AND portal_id = 'community';
UPDATE product_categories SET image_url = 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=400&q=80'
  WHERE slug = 'sponsorships' AND portal_id = 'community';
UPDATE product_categories SET image_url = 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=400&q=80'
  WHERE slug = 'donations'   AND portal_id = 'community';
UPDATE product_categories SET image_url = 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=400&q=80'
  WHERE slug = 'volunteer'   AND portal_id = 'community';
UPDATE product_categories SET image_url = 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&q=80'
  WHERE slug = 'impact'      AND portal_id = 'community';

-- Logistics categories
UPDATE product_categories SET image_url = 'https://images.unsplash.com/photo-1553413077-190dd305871c?w=400&q=80'
  WHERE slug = 'packages' AND portal_id = 'logistics';

-- ── 3. Products — image_url by portal & category ─────────────────────────────

-- ── Solar ──

UPDATE products SET image_url = 'https://mainlandsolar.lagosapps.com/wp-content/uploads/2022/07/cloudE110.png'
  WHERE portal_id = 'solar'
    AND category_id = (SELECT id FROM product_categories WHERE slug = 'panels' AND portal_id = 'solar');

UPDATE products SET image_url = 'https://mainlandsolar.lagosapps.com/wp-content/uploads/2022/02/New-Project.png'
  WHERE portal_id = 'solar'
    AND category_id = (SELECT id FROM product_categories WHERE slug = 'inverters' AND portal_id = 'solar');

UPDATE products SET image_url = 'https://mainlandsolar.lagosapps.com/wp-content/uploads/2025/08/battery.jpg'
  WHERE portal_id = 'solar'
    AND category_id = (SELECT id FROM product_categories WHERE slug = 'batteries' AND portal_id = 'solar');

UPDATE products SET image_url = 'https://mainlandsolar.lagosapps.com/wp-content/uploads/2022/02/cc_100A-removebg-preview.png'
  WHERE portal_id = 'solar'
    AND category_id = (SELECT id FROM product_categories WHERE slug = 'controllers' AND portal_id = 'solar');

UPDATE products SET image_url = 'https://images.unsplash.com/photo-1509671153-dff9e3e4ed53?w=400&q=80'
  WHERE portal_id = 'solar'
    AND category_id = (SELECT id FROM product_categories WHERE slug = 'cables' AND portal_id = 'solar');

-- ── Groceries — per-product overrides where we have specific images ──

-- Drinks
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80'
  WHERE name = 'Coca Cola 50cl x12';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=400&q=80'
  WHERE name = 'Eva Water 75cl x12';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&q=80'
  WHERE name = 'Chi Exotic Juice 1L';

-- Cereals / Beverages
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1571091655789-405eb7a3a3a8?w=400&q=80'
  WHERE name = 'Bournvita 900g';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1559181567-c3190bfa4614?w=400&q=80'
  WHERE name = 'Golden Morn 900g';

-- Snacks
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?w=400&q=80'
  WHERE name = 'Pringles Original';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&q=80'
  WHERE name = 'McVities Shortbread';

-- Canned / Cooking
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1608394831180-a3f929b6c5a3?w=400&q=80'
  WHERE name = 'Tasty Tom Tin 400g';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80'
  WHERE name = 'Power Oil 5L';

-- Staples
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?w=400&q=80'
  WHERE name = 'Rice 50kg (Long Grain)';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1603729362753-f8162ac6c3df?w=400&q=80'
  WHERE name = 'Honeywell Spaghetti 500g';

-- Household
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=400&q=80'
  WHERE name = 'Ariel Auto 1.8Kg';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=400&q=80'
  WHERE name = 'Duracell AA x4';

-- ── Health ──

UPDATE products SET image_url = 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=400&q=80'
  WHERE name = 'Chest X-Ray';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1606811841689-23dfddce3e66?w=400&q=80'
  WHERE name = 'Dental Checkup';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&q=80'
  WHERE name = 'Doctor Consultation';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=400&q=80'
  WHERE name = 'First Aid Kit';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&q=80'
  WHERE name = 'Free Health Check';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400&q=80'
  WHERE name IN ('Full Blood Count', 'Genotype Test', 'Hepatitis B Screening', 'Malaria Test', 'Pregnancy Test');
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1632833239869-a37e3a5806d2?w=400&q=80'
  WHERE name = 'Philips AED Defibrillator';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&q=80'
  WHERE name = 'Portable Hematology Analyzer';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&q=80'
  WHERE name = 'Wellness Advisory';

-- ── Transport ──

UPDATE products SET image_url = 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&q=80'
  WHERE name = 'Van Rental — Cargo';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=400&q=80'
  WHERE name = 'Bus Charter — 30 Seater';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=400&q=80'
  WHERE name IN ('Sedan Rental', 'Airport Shuttle');
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400&q=80'
  WHERE name = 'SUV Rental';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=400&q=80'
  WHERE name = 'Motorcycle Dispatch';

-- ── Events ──

UPDATE products SET image_url = 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&q=80'
  WHERE name IN ('Audio Recording', 'Studio Booking');
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1497366858526-0766cadbe8fa?w=400&q=80'
  WHERE name = 'Conference Room' AND portal_id = 'events';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=400&q=80'
  WHERE name = 'Training Room' AND portal_id = 'events';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&q=80'
  WHERE name = 'Decoration Package';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=400&q=80'
  WHERE name = 'Photography Package';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1589793907316-f94025b46850?w=400&q=80'
  WHERE name = 'Video Production';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1619961602105-16fa2a5465c5?w=400&q=80'
  WHERE name = 'Live Streaming';

-- ── Community ──

UPDATE products SET image_url = 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&q=80'
  WHERE name = 'Web Development';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&q=80'
  WHERE name = 'Data Science & Analytics';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&q=80'
  WHERE name = 'Digital Marketing';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&q=80'
  WHERE name = 'UI/UX Design';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=400&q=80'
  WHERE name IN ('TEPLEARN Education', 'Education & School Support', 'Student Tuition Sponsorship');
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=400&q=80'
  WHERE name IN ('Community Cleanup', 'Tree Planting Drive');
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&q=80'
  WHERE name = 'Youth Empowerment';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&q=80'
  WHERE name IN ('Community Health Screening', 'Health Interventions');
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=400&q=80'
  WHERE name = 'Youth Empowerment' AND portal_id = 'community';

-- ── Logistics ──

UPDATE products SET image_url = 'https://images.unsplash.com/photo-1553413077-190dd305871c?w=400&q=80'
  WHERE name IN ('Amazon Package Receive', 'eBay Package Receive');
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=400&q=80'
  WHERE name IN ('AliExpress Package Receive', 'Temu Package Receive');
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=400&q=80'
  WHERE name = 'Shein Package Receive';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=400&q=80'
  WHERE name = 'Other Store — Custom';

-- ── 4. Venues ─────────────────────────────────────────────────────────────────

UPDATE venues SET image_url = 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600&q=80'
  WHERE name = 'Studio';
UPDATE venues SET image_url = 'https://images.unsplash.com/photo-1497366858526-0766cadbe8fa?w=600&q=80'
  WHERE name = 'Conference Room';
UPDATE venues SET image_url = 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&q=80'
  WHERE name = 'Training Room';
