/* ──────────────────────────────────────────────
 *  Admin Mock Data
 *  50 users, 100 orders, 200 wallet txns,
 *  30 referrals, 20 notifications, 50 audit entries,
 *  40 subscriptions, ~55 products
 * ────────────────────────────────────────────── */

// ── Types ─────────────────────────────────────

export type MembershipTier = "none" | "bronze" | "silver" | "gold";
export type OrderStatus = "pending" | "confirmed" | "processing" | "completed" | "cancelled";
export type WalletTxnType = "credit" | "debit";
export type ReferralStatus = "pending" | "confirmed" | "paid" | "expired";
export type Portal = "solar" | "transport" | "groceries" | "health" | "events" | "community" | "logistics";

export interface MockUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  membershipTier: MembershipTier;
  walletBalance: number;
  totalOrders: number;
  totalSpent: number;
  referralCode: string;
  status: "active" | "inactive";
  joinedAt: string;
  lastActive: string;
  avatar: string;
}

export interface MockOrder {
  id: string;
  userId: string;
  userName: string;
  portal: Portal;
  product: string;
  quantity: number;
  amount: number;
  status: OrderStatus;
  paymentMethod: "wallet" | "card" | "bank_transfer";
  createdAt: string;
  updatedAt: string;
}

export interface MockWalletTxn {
  id: string;
  userId: string;
  userName: string;
  type: WalletTxnType;
  amount: number;
  balance: number;
  description: string;
  reference: string;
  createdAt: string;
}

export interface MockReferral {
  id: string;
  referrerId: string;
  referrerName: string;
  referredId: string;
  referredName: string;
  status: ReferralStatus;
  reward: number;
  createdAt: string;
  completedAt: string | null;
}

export interface MockNotification {
  id: string;
  title: string;
  message: string;
  type: "order" | "wallet" | "membership" | "system";
  read: boolean;
  createdAt: string;
}

export interface MockAuditEntry {
  id: string;
  adminName: string;
  action: string;
  target: string;
  details: string;
  ipAddress: string;
  createdAt: string;
}

export interface MockSubscription {
  id: string;
  userId: string;
  userName: string;
  tier: Exclude<MembershipTier, "none">;
  status: "active" | "expired" | "cancelled";
  startDate: string;
  endDate: string;
  amount: number;
  autoRenew: boolean;
}

export interface MockProduct {
  id: string;
  portal: Portal;
  category: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  stock: number;
  status: "active" | "inactive" | "out_of_stock";
  imageUrl: string;
  createdAt: string;
}

export const PORTAL_CATEGORIES: Record<Portal, string[]> = {
  solar: ["Solar Panels", "Inverters", "Batteries", "Charge Controllers", "Cables & Accessories"],
  transport: ["Van Rental", "Bus Rental", "Car Rental", "Car Purchase", "EV Purchase", "Motorcycle Dispatch"],
  groceries: ["Drinks & Juices", "Cereals & Beverages", "Snacks & Biscuits", "Canned & Cooking", "Staples & Pasta", "Household Supplies"],
  health: ["Health Services", "Medical Tests", "Medical Supplies"],
  events: ["Venues", "Coverage Services", "Event Types"],
  community: ["TEPLEARN Courses", "Sponsorships", "Donations", "Volunteer Areas", "Impact Areas"],
  logistics: ["Package Receive & Deliver"],
};

// ── Portal lookup tables ──────────────────────

export const PORTAL_LABELS: Record<Portal, string> = {
  solar: "Solar, Renewables and More",
  transport: "Cars, Vans and Rides",
  groceries: "Food, Groceries and Household",
  health: "Health and Wellness",
  events: "Events and Studios",
  community: "A Better You",
  logistics: "Receive & Deliver",
};

export const PORTAL_COLORS: Record<Portal, string> = {
  solar: "#E65100",
  transport: "#0D47A1",
  groceries: "#1B5E20",
  health: "#B71C1C",
  events: "#4A148C",
  community: "#004D40",
  logistics: "#4A148C",
};

// ── Helpers ───────────────────────────────────

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randDate(): string {
  // May 2025 – Apr 2026  (last 12 months)
  const start = new Date("2025-05-01").getTime();
  const end = new Date("2026-04-30").getTime();
  const d = new Date(start + Math.random() * (end - start));
  return d.toISOString().slice(0, 10);
}

function padId(prefix: string, n: number, len = 3) {
  return `${prefix}-${String(n).padStart(len, "0")}`;
}

// ── Name pools ────────────────────────────────

const FIRST = [
  "Chidi", "Amara", "Kunle", "Fatima", "Damola", "Ngozi", "Tunde", "Bola",
  "Emeka", "Aisha", "Yemi", "Chioma", "Femi", "Halima", "Segun", "Zainab",
  "Kelechi", "Adeola", "Ibrahim", "Bukola", "Obinna", "Titilayo", "Musa",
  "Folake", "Chukwu", "Adaeze", "Wale", "Hadiza", "Ifeanyi", "Kemi",
  "Jide", "Nkechi", "Tobi", "Bintu", "Uche", "Dayo", "Chiamaka", "Ayo",
  "Funke", "Chinedu", "Lola", "Gbenga", "Amina", "Tochi", "Bisi",
  "Olamide", "Yusuf", "Sade", "Ikenna", "Temitope",
];

const LAST = [
  "Okonkwo", "Adeyemi", "Balogun", "Mohammed", "Adediran", "Eze", "Oluwole",
  "Abubakar", "Nwosu", "Bello", "Ogundimu", "Yusuf", "Chukwuma", "Afolabi",
  "Lawal", "Okafor", "Suleiman", "Adebayo", "Usman", "Okwu", "Bakare",
  "Ogundele", "Aliyu", "Oladipo", "Nnamdi", "Salami", "Okoro", "Abdullahi",
  "Fasanmi", "Dike", "Olatunde", "Hassan", "Emenike", "Ojo", "Madu",
  "Ayodele", "Garba", "Adesanya", "Onwuka", "Jimoh", "Bassey", "Aina",
  "Olayinka", "Dauda", "Anyanwu", "Adeniyi", "Bada", "Obi", "Shehu", "Coker",
];

// ── Generator: Users ──────────────────────────

function generateUsers(count: number): MockUser[] {
  const tiers: MembershipTier[] = ["none", "bronze", "silver", "gold"];
  const statuses: ("active" | "inactive")[] = ["active", "active", "active", "inactive"];
  const users: MockUser[] = [];

  for (let i = 1; i <= count; i++) {
    const first = FIRST[(i - 1) % FIRST.length];
    const last = LAST[(i - 1) % LAST.length];
    const name = `${first} ${last}`;
    const email = `${first.toLowerCase()}.${last.toLowerCase()}@email.com`;
    const initials = `${first[0]}${last[0]}`;
    const joined = randDate();

    users.push({
      id: padId("USR", i),
      name,
      email,
      phone: `+234 ${randInt(700, 909)} ${randInt(100, 999)} ${randInt(1000, 9999)}`,
      membershipTier: randPick(tiers),
      walletBalance: randInt(0, 500000),
      totalOrders: randInt(0, 30),
      totalSpent: randInt(0, 5000000),
      referralCode: `REF-${first.slice(0, 3).toUpperCase()}${randInt(100, 999)}`,
      status: randPick(statuses),
      joinedAt: joined,
      lastActive: randDate(),
      avatar: initials,
    });
  }
  return users;
}

// ── Generator: Orders ─────────────────────────

const PRODUCT_NAMES: Record<Portal, string[]> = {
  solar: ["200W Solar Panel", "5kVA Inverter", "200Ah Battery", "Charge Controller", "Solar Cable 10m", "MC4 Connector Set", "Mounting Kit"],
  transport: ["Sedan Rental", "SUV Rental", "Bus Charter", "Van Rental", "Motorcycle Dispatch", "Airport Shuttle"],
  groceries: ["Fresh Produce Box", "Rice 50kg", "Vegetable Oil 5L", "Dairy Pack", "Household Essentials", "Snack Box", "Spice Set"],
  health: ["Doctor Consultation", "Blood Count Test", "Malaria Test", "COVID-19 Test", "Eye Exam", "First Aid Kit", "Dental Checkup"],
  events: ["Ballroom Booking", "Garden Venue", "Rooftop Venue", "Photography Package", "DJ Services", "Decoration Package", "MC Services", "Catering Package"],
  community: ["Web Dev Bootcamp", "Solar Installation Training", "Community Cleanup", "Mentorship Program", "Data Analytics Course", "Tree Planting Drive"],
  logistics: ["Same-Day Delivery", "Bulk Freight", "Cold Chain Delivery", "Next-Day Delivery", "Fragile Handling", "Document Courier"],
};

function generateOrders(count: number, users: MockUser[]): MockOrder[] {
  const statuses: OrderStatus[] = ["pending", "confirmed", "processing", "completed", "cancelled"];
  const payMethods: ("wallet" | "card" | "bank_transfer")[] = ["wallet", "card", "bank_transfer"];
  const portals: Portal[] = ["solar", "transport", "groceries", "health", "events", "community", "logistics"];
  const orders: MockOrder[] = [];

  for (let i = 1; i <= count; i++) {
    const user = randPick(users);
    const portal = portals[(i - 1) % portals.length];
    const product = randPick(PRODUCT_NAMES[portal]);
    const created = randDate();

    orders.push({
      id: padId("ORD", i),
      userId: user.id,
      userName: user.name,
      portal,
      product,
      quantity: randInt(1, 5),
      amount: randInt(2000, 10000000),
      status: randPick(statuses),
      paymentMethod: randPick(payMethods),
      createdAt: created,
      updatedAt: created,
    });
  }
  return orders;
}

// ── Generator: Wallet Transactions ────────────

function generateWalletTxns(count: number, users: MockUser[]): MockWalletTxn[] {
  const types: WalletTxnType[] = ["credit", "debit"];
  const descriptions = [
    "Wallet top-up via card",
    "Order payment",
    "Referral bonus",
    "Membership reward",
    "Cashback credit",
    "Transfer to bank",
    "Refund for cancelled order",
    "Admin adjustment",
    "Promo credit",
    "Service charge",
  ];
  const txns: MockWalletTxn[] = [];

  for (let i = 1; i <= count; i++) {
    const user = randPick(users);
    const type = randPick(types);
    const amount = randInt(500, 500000);

    txns.push({
      id: padId("TXN", i),
      userId: user.id,
      userName: user.name,
      type,
      amount,
      balance: randInt(0, 1000000),
      description: randPick(descriptions),
      reference: `REF-${randInt(100000, 999999)}`,
      createdAt: randDate(),
    });
  }
  return txns;
}

// ── Generator: Referrals ──────────────────────

function generateReferrals(count: number, users: MockUser[]): MockReferral[] {
  const statuses: ReferralStatus[] = ["pending", "confirmed", "paid", "expired"];
  const refs: MockReferral[] = [];

  for (let i = 1; i <= count; i++) {
    const referrer = users[i % users.length];
    const referred = users[(i + 7) % users.length];
    const status = randPick(statuses);
    const created = randDate();

    refs.push({
      id: padId("RFL", i),
      referrerId: referrer.id,
      referrerName: referrer.name,
      referredId: referred.id,
      referredName: referred.name,
      status,
      reward: status === "paid" ? randInt(500, 5000) : 0,
      createdAt: created,
      completedAt: status === "paid" || status === "confirmed" ? randDate() : null,
    });
  }
  return refs;
}

// ── Generator: Notifications ──────────────────

function generateNotifications(count: number): MockNotification[] {
  const templates: { title: string; message: string; type: MockNotification["type"] }[] = [
    { title: "New Order Received", message: "Order ORD-042 has been placed by Chidi O. for Solar Panel", type: "order" },
    { title: "Payment Confirmed", message: "Wallet top-up of ₦50,000 confirmed for Amara T.", type: "wallet" },
    { title: "Membership Upgrade", message: "Kunle A. upgraded to Gold membership tier", type: "membership" },
    { title: "Order Completed", message: "Order ORD-038 has been fulfilled and delivered", type: "order" },
    { title: "Low Stock Alert", message: "200W Solar Panel stock is below 5 units", type: "system" },
    { title: "Refund Processed", message: "₦25,000 refunded to Fatima B. wallet for cancelled order", type: "wallet" },
    { title: "New User Signup", message: "Emeka E. joined via referral from Damola A.", type: "system" },
    { title: "Subscription Renewal", message: "Silver tier subscription renewed for Ngozi E.", type: "membership" },
    { title: "Order Cancelled", message: "Order ORD-035 cancelled by customer Bola O.", type: "order" },
    { title: "System Maintenance", message: "Scheduled maintenance completed at 03:00 WAT", type: "system" },
    { title: "Bulk Order Alert", message: "Large order of ₦2.5M placed for Transport portal", type: "order" },
    { title: "Wallet Withdrawal", message: "Tunde O. withdrew ₦100,000 to bank account", type: "wallet" },
    { title: "Membership Expired", message: "Bronze tier expired for Aisha M. — send renewal reminder", type: "membership" },
    { title: "Daily Revenue Report", message: "Total revenue yesterday: ₦1.2M across all portals", type: "system" },
    { title: "New Review", message: "5-star review received for Groceries portal from Yemi A.", type: "system" },
    { title: "Payment Failed", message: "Card payment failed for Order ORD-029 — retry pending", type: "wallet" },
    { title: "Inventory Updated", message: "15 new products added to Health portal catalog", type: "system" },
    { title: "Order Dispatched", message: "Logistics order ORD-031 picked up by rider", type: "order" },
    { title: "Referral Bonus Paid", message: "₦2,000 referral bonus credited to Chioma E.", type: "wallet" },
    { title: "Platform Update", message: "Version 2.4 deployed with new analytics features", type: "system" },
  ];

  const items: MockNotification[] = [];
  for (let i = 0; i < count && i < templates.length; i++) {
    const t = templates[i];
    items.push({
      id: padId("NTF", i + 1),
      title: t.title,
      message: t.message,
      type: t.type,
      read: i > 4, // first 5 are unread
      createdAt: randDate(),
    });
  }
  return items;
}

// ── Generator: Audit Log ──────────────────────

function generateAuditLog(count: number): MockAuditEntry[] {
  const admins = ["Damola Adediran", "Chioma Eze", "Kunle Adeyemi", "Fatima Bello"];
  const actions = [
    { action: "user.update", target: "USR-012", details: "Updated membership tier to Gold" },
    { action: "order.status_change", target: "ORD-042", details: "Status changed from pending to confirmed" },
    { action: "product.create", target: "PRD-055", details: "Added 200W Solar Panel to Solar portal" },
    { action: "product.update", target: "PRD-023", details: "Updated price from ₦15,000 to ₦12,500" },
    { action: "wallet.adjust", target: "USR-008", details: "Manual credit of ₦10,000 — compensation" },
    { action: "membership.config", target: "Gold Tier", details: "Updated monthly fee from ₦5,000 to ₦4,500" },
    { action: "order.cancel", target: "ORD-035", details: "Admin cancelled order — customer request" },
    { action: "user.suspend", target: "USR-031", details: "Account suspended for policy violation" },
    { action: "notification.broadcast", target: "All Users", details: "Sent promo notification for Easter sale" },
    { action: "settings.update", target: "Payment", details: "Switched Paystack to test mode" },
    { action: "product.delete", target: "PRD-044", details: "Removed discontinued Health product" },
    { action: "order.refund", target: "ORD-028", details: "Processed ₦25,000 refund to wallet" },
    { action: "user.activate", target: "USR-031", details: "Account reactivated after review" },
    { action: "inventory.restock", target: "PRD-007", details: "Restocked 50 units of Rice 50kg" },
    { action: "portal.toggle", target: "Community", details: "Disabled Community portal temporarily" },
    { action: "referral.approve", target: "RFL-015", details: "Approved referral bonus payment of ₦2,000" },
    { action: "export.data", target: "Orders", details: "Exported 100 orders as CSV" },
    { action: "team.invite", target: "Emeka Emenike", details: "Invited new support team member" },
    { action: "subscription.cancel", target: "SUB-022", details: "Admin cancelled subscription — user request" },
    { action: "product.price_update", target: "PRD-015", details: "Bulk price update for Transport portal" },
  ];
  const ips = ["102.89.23.45", "197.210.54.12", "105.112.78.90", "41.58.120.33", "154.113.89.67"];

  const entries: MockAuditEntry[] = [];
  for (let i = 0; i < count; i++) {
    const tpl = actions[i % actions.length];
    entries.push({
      id: padId("AUD", i + 1),
      adminName: randPick(admins),
      action: tpl.action,
      target: tpl.target,
      details: tpl.details,
      ipAddress: randPick(ips),
      createdAt: randDate(),
    });
  }
  return entries;
}

// ── Generator: Subscriptions ──────────────────

function generateSubscriptions(count: number, users: MockUser[]): MockSubscription[] {
  const tiers: Exclude<MembershipTier, "none">[] = ["bronze", "silver", "gold"];
  const statuses: ("active" | "expired" | "cancelled")[] = ["active", "active", "expired", "cancelled"];
  const amounts: Record<string, number> = { bronze: 2000, silver: 3500, gold: 5000 };
  const subs: MockSubscription[] = [];

  for (let i = 0; i < count; i++) {
    const user = users[i % users.length];
    const tier = randPick(tiers);
    const start = randDate();
    const startD = new Date(start);
    const endD = new Date(startD);
    endD.setMonth(endD.getMonth() + 1);

    subs.push({
      id: padId("SUB", i + 1),
      userId: user.id,
      userName: user.name,
      tier,
      status: randPick(statuses),
      startDate: start,
      endDate: endD.toISOString().slice(0, 10),
      amount: amounts[tier],
      autoRenew: Math.random() > 0.3,
    });
  }
  return subs;
}

// ── Generator: Products ───────────────────────

interface ProductTemplate {
  name: string;
  category: string;
  description: string;
  price: number;
  unit: string;
  stock: number;
}

const PRODUCT_TEMPLATES: Record<Portal, ProductTemplate[]> = {
  solar: [
    { name: "SMS 650W Panel", category: "Solar Panels", description: "High-efficiency monocrystalline 650W panel", price: 185000, unit: "unit", stock: 45 },
    { name: "SMS 550W Panel", category: "Solar Panels", description: "Tier 1 bifacial mono 550W panel", price: 165000, unit: "unit", stock: 30 },
    { name: "SMS 450W Panel", category: "Solar Panels", description: "Polycrystalline 450W panel for budget builds", price: 125000, unit: "unit", stock: 50 },
    { name: "Eitai 350W Mono PV", category: "Solar Panels", description: "Compact 350W mono PV module", price: 95000, unit: "unit", stock: 35 },
    { name: "Growatt 12KVA Hybrid", category: "Inverters", description: "SPF compact hybrid inverter 48V", price: 920000, unit: "unit", stock: 8 },
    { name: "Growatt 10KVA Hybrid", category: "Inverters", description: "SPF compact hybrid inverter 48V", price: 750000, unit: "unit", stock: 12 },
    { name: "Torchn 5KVA 48V", category: "Inverters", description: "5KVA/4KW 48V 80A inverter", price: 450000, unit: "unit", stock: 18 },
    { name: "VEICHI 3KVA", category: "Inverters", description: "SIS3-3K-24-S inverter for small homes", price: 280000, unit: "unit", stock: 22 },
    { name: "51.2V 200Ah LiFePO4", category: "Batteries", description: "Rack-mounted lithium iron phosphate", price: 850000, unit: "unit", stock: 15 },
    { name: "Moli 12V 300A Lithium", category: "Batteries", description: "3.84KW lithium battery", price: 380000, unit: "unit", stock: 25 },
    { name: "150Ah Gel Battery", category: "Batteries", description: "Deep-cycle maintenance-free gel battery", price: 120000, unit: "unit", stock: 40 },
    { name: "Bluesun Runner 100A", category: "Charge Controllers", description: "MPPT charge controller 100A", price: 85000, unit: "unit", stock: 28 },
    { name: "Bluesun Explorer 60A", category: "Charge Controllers", description: "MPPT charge controller 60A with LCD", price: 65000, unit: "unit", stock: 35 },
    { name: "Solar Cable 6mm 10m", category: "Cables & Accessories", description: "Twin solar DC cable, 10-metre roll", price: 8500, unit: "roll", stock: 100 },
    { name: "MC4 Connector Set", category: "Cables & Accessories", description: "Waterproof MC4 male-female pair", price: 2500, unit: "pair", stock: 200 },
    { name: "Roof Mounting Kit", category: "Cables & Accessories", description: "Aluminium rail mounting for 4 panels", price: 35000, unit: "set", stock: 32 },
  ],
  transport: [
    { name: "Van Rental — Cargo", category: "Van Rental", description: "Cargo van for moving goods and equipment", price: 35000, unit: "day", stock: 6 },
    { name: "Bus Charter — 30 Seater", category: "Bus Rental", description: "Coaster bus for group transport and outings", price: 120000, unit: "trip", stock: 5 },
    { name: "Sedan Rental", category: "Car Rental", description: "Comfortable sedan for city trips, AC included", price: 25000, unit: "day", stock: 12 },
    { name: "SUV Rental", category: "Car Rental", description: "Spacious SUV for family or business travel", price: 45000, unit: "day", stock: 8 },
    { name: "Motorcycle Dispatch", category: "Motorcycle Dispatch", description: "Quick motorcycle dispatch across the city", price: 3000, unit: "trip", stock: 20 },
    { name: "Airport Shuttle", category: "Car Rental", description: "Reliable airport pickup and drop-off service", price: 18000, unit: "trip", stock: 10 },
  ],
  groceries: [
    { name: "Coca Cola 50cl x12", category: "Drinks & Juices", description: "Classic Coca Cola pack of 12", price: 3600, unit: "pack", stock: 80 },
    { name: "Chi Exotic Juice 1L", category: "Drinks & Juices", description: "Mixed tropical fruit juice", price: 1200, unit: "bottle", stock: 55 },
    { name: "Eva Water 75cl x12", category: "Drinks & Juices", description: "Premium table water pack", price: 2400, unit: "pack", stock: 100 },
    { name: "Golden Morn 900g", category: "Cereals & Beverages", description: "Whole grain cereal mix", price: 2800, unit: "pack", stock: 60 },
    { name: "Bournvita 900g", category: "Cereals & Beverages", description: "Chocolate malt beverage", price: 3500, unit: "tin", stock: 45 },
    { name: "Pringles Original", category: "Snacks & Biscuits", description: "Original flavour crisps 165g", price: 2500, unit: "can", stock: 50 },
    { name: "McVities Shortbread", category: "Snacks & Biscuits", description: "Butter shortbread biscuits 200g", price: 1800, unit: "pack", stock: 40 },
    { name: "Tasty Tom Tin 400g", category: "Canned & Cooking", description: "Tomato paste cooking tin", price: 900, unit: "tin", stock: 120 },
    { name: "Power Oil 5L", category: "Canned & Cooking", description: "Refined vegetable cooking oil", price: 9500, unit: "keg", stock: 70 },
    { name: "Honeywell Spaghetti 500g", category: "Staples & Pasta", description: "Premium spaghetti pasta", price: 800, unit: "pack", stock: 90 },
    { name: "Rice 50kg (Long Grain)", category: "Staples & Pasta", description: "Premium long-grain parboiled rice", price: 72000, unit: "bag", stock: 40 },
    { name: "Ariel Auto 1.8Kg", category: "Household Supplies", description: "Automatic washing powder", price: 4500, unit: "pack", stock: 50 },
    { name: "Duracell AA x4", category: "Household Supplies", description: "Alkaline batteries pack of 4", price: 2200, unit: "pack", stock: 80 },
  ],
  health: [
    { name: "Free Health Check", category: "Health Services", description: "1st & 3rd Friday community screening", price: 0, unit: "session", stock: 99 },
    { name: "Doctor Consultation", category: "Health Services", description: "30-minute consultation with GP", price: 10000, unit: "session", stock: 99 },
    { name: "Wellness Advisory", category: "Health Services", description: "Wellness centre advisory session", price: 5000, unit: "session", stock: 99 },
    { name: "Dental Checkup", category: "Health Services", description: "Dental examination with cleaning", price: 20000, unit: "session", stock: 99 },
    { name: "Pregnancy Test", category: "Medical Tests", description: "Urine pregnancy test (PT)", price: 2000, unit: "test", stock: 99 },
    { name: "Full Blood Count", category: "Medical Tests", description: "Complete blood count & differential", price: 8000, unit: "test", stock: 99 },
    { name: "Hepatitis B Screening", category: "Medical Tests", description: "HBsAg rapid screening test", price: 5000, unit: "test", stock: 99 },
    { name: "Genotype Test", category: "Medical Tests", description: "Haemoglobin electrophoresis", price: 6000, unit: "test", stock: 99 },
    { name: "Malaria Test", category: "Medical Tests", description: "Rapid malaria antigen diagnostic", price: 3500, unit: "test", stock: 99 },
    { name: "Chest X-Ray", category: "Medical Tests", description: "Standard chest radiograph", price: 12000, unit: "test", stock: 99 },
    { name: "Portable Hematology Analyzer", category: "Medical Supplies", description: "Auto hematology analyzer device", price: 450000, unit: "unit", stock: 5 },
    { name: "Philips AED Defibrillator", category: "Medical Supplies", description: "Heartstart Onsite AED", price: 680000, unit: "unit", stock: 3 },
    { name: "First Aid Kit", category: "Medical Supplies", description: "Complete household first aid kit", price: 12000, unit: "kit", stock: 40 },
  ],
  events: [
    { name: "Studio Booking", category: "Venues", description: "10-person studio — soundproofing, pro lighting", price: 50000, unit: "day", stock: 5 },
    { name: "Conference Room", category: "Venues", description: "20-person room — projector, whiteboard, WiFi", price: 80000, unit: "day", stock: 4 },
    { name: "Training Room", category: "Venues", description: "50-person room — flexible layout, AV equipment", price: 150000, unit: "day", stock: 3 },
    { name: "Video Production", category: "Coverage Services", description: "Professional video recording & editing", price: 120000, unit: "event", stock: 10 },
    { name: "Photography Package", category: "Coverage Services", description: "Professional photographer — 6 hours", price: 80000, unit: "event", stock: 10 },
    { name: "Audio Recording", category: "Coverage Services", description: "Studio-quality audio recording session", price: 60000, unit: "session", stock: 8 },
    { name: "Live Streaming", category: "Coverage Services", description: "Multi-camera live stream setup", price: 150000, unit: "event", stock: 5 },
    { name: "Decoration Package", category: "Coverage Services", description: "Full event decoration and florals", price: 200000, unit: "event", stock: 6 },
  ],
  community: [
    { name: "Web Development", category: "TEPLEARN Courses", description: "12-week fullstack web development", price: 150000, unit: "seat", stock: 30 },
    { name: "Data Science & Analytics", category: "TEPLEARN Courses", description: "8-week data analytics with Python", price: 120000, unit: "seat", stock: 25 },
    { name: "UI/UX Design", category: "TEPLEARN Courses", description: "10-week product design bootcamp", price: 100000, unit: "seat", stock: 20 },
    { name: "Digital Marketing", category: "TEPLEARN Courses", description: "6-week digital marketing course", price: 80000, unit: "seat", stock: 30 },
    { name: "Student Tuition Sponsorship", category: "Sponsorships", description: "Sponsor a student's school fees", price: 50000, unit: "sponsorship", stock: 99 },
    { name: "Community Health Screening", category: "Sponsorships", description: "Fund a free community health check", price: 100000, unit: "sponsorship", stock: 99 },
    { name: "Education & School Support", category: "Donations", description: "Support school supplies and learning", price: 0, unit: "donation", stock: 99 },
    { name: "Youth Empowerment", category: "Donations", description: "Fund mentoring and career programs", price: 0, unit: "donation", stock: 99 },
    { name: "Community Cleanup", category: "Volunteer Areas", description: "Organised neighbourhood cleanup event", price: 0, unit: "volunteer", stock: 100 },
    { name: "Tree Planting Drive", category: "Volunteer Areas", description: "Plant and nurture trees in the community", price: 0, unit: "volunteer", stock: 200 },
    { name: "TEPLEARN Education", category: "Impact Areas", description: "Youth skills training programs", price: 0, unit: "program", stock: 99 },
    { name: "Health Interventions", category: "Impact Areas", description: "Free community health screenings", price: 0, unit: "program", stock: 99 },
  ],
  logistics: [
    { name: "Amazon Package Receive", category: "Package Receive & Deliver", description: "Receive and deliver Amazon orders", price: 5000, unit: "package", stock: 99 },
    { name: "AliExpress Package Receive", category: "Package Receive & Deliver", description: "Receive and deliver AliExpress orders", price: 4500, unit: "package", stock: 99 },
    { name: "Shein Package Receive", category: "Package Receive & Deliver", description: "Receive and deliver Shein orders", price: 4000, unit: "package", stock: 99 },
    { name: "Temu Package Receive", category: "Package Receive & Deliver", description: "Receive and deliver Temu orders", price: 4000, unit: "package", stock: 99 },
    { name: "eBay Package Receive", category: "Package Receive & Deliver", description: "Receive and deliver eBay orders", price: 5500, unit: "package", stock: 99 },
    { name: "Other Store — Custom", category: "Package Receive & Deliver", description: "Receive from any other online store", price: 6000, unit: "package", stock: 99 },
  ],
};

function generateProducts(): MockProduct[] {
  const products: MockProduct[] = [];
  let idx = 1;
  const portals: Portal[] = ["solar", "transport", "groceries", "health", "events", "community", "logistics"];

  for (const portal of portals) {
    for (const tpl of PRODUCT_TEMPLATES[portal]) {
      const stockStatus: MockProduct["status"] =
        tpl.stock === 0 ? "out_of_stock" : Math.random() > 0.9 ? "inactive" : "active";

      products.push({
        id: padId("PRD", idx),
        portal,
        category: tpl.category,
        name: tpl.name,
        description: tpl.description,
        price: tpl.price,
        unit: tpl.unit,
        stock: tpl.stock,
        status: stockStatus,
        imageUrl: `/images/${portal}/${idx}.webp`,
        createdAt: randDate(),
      });
      idx++;
    }
  }
  return products;
}

// ── Types: Service Requests ─────────────────────

export type ServiceRequestType =
  | "solar_audit" | "solar_installation" | "solar_maintenance"
  | "health_home_visit" | "health_check_booking" | "health_consultation"
  | "event_venue_booking" | "event_training_room" | "event_coverage"
  | "volunteer" | "sponsorship" | "donation"
  | "logistics_forwarding";

export type ServiceRequestStatus = "new" | "reviewing" | "scheduled" | "in_progress" | "completed" | "declined";

export interface MockServiceRequest {
  id: string;
  userId: string;
  userName: string;
  portal: Portal;
  type: ServiceRequestType;
  typeLabel: string;
  status: ServiceRequestStatus;
  assignedTo: string | null;
  details: Record<string, string>;
  declineReason: string | null;
  notes: { author: string; text: string; date: string }[];
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
}

const SERVICE_REQUEST_TEMPLATES: { type: ServiceRequestType; portal: Portal; label: string; detailsFn: () => Record<string, string> }[] = [
  { type: "solar_audit", portal: "solar", label: "Free Solar Audit", detailsFn: () => ({ buildingType: randPick(["Standalone", "Duplex", "Flat", "Bungalow", "Factory"]), address: `${randInt(1, 99)} ${randPick(["Allen Ave, Ikeja", "Admiralty Way, Lekki", "Herbert Macaulay, Yaba", "Adeola Odeku, VI", "Ikorodu Road, Maryland"])}`, preferredDate: randDate() }) },
  { type: "solar_installation", portal: "solar", label: "Installation Request", detailsFn: () => ({ address: `${randInt(1, 99)} ${randPick(["Awolowo Road, Ikoyi", "Bode Thomas, Surulere", "Opebi Road, Ikeja", "Ozumba Mbadiwe, VI"])}`, packageType: randPick(["3.5KW Gel", "5KW Lithium", "7.5KW Lithium", "10KW Lithium", "12KW Lithium"]), preferredDate: randDate(), notes: randPick(["Need to install before rainy season", "Please call before coming", "Gate code: 1234"]) }) },
  { type: "solar_maintenance", portal: "solar", label: "Maintenance Request", detailsFn: () => ({ address: `${randInt(1, 99)} ${randPick(["Admiralty Way, Lekki", "Allen Ave, Ikeja", "Adeola Odeku, VI"])}`, issue: randPick(["Inverter showing error code", "Battery not holding charge", "Panel output dropped", "Charge controller fault"]), preferredDate: randDate() }) },
  { type: "health_home_visit", portal: "health", label: "Home Visit", detailsFn: () => ({ address: `${randInt(1, 99)} ${randPick(["Bode Thomas, Surulere", "Allen Ave, Ikeja", "Opebi Road, Ikeja", "Lekki Phase 1"])}`, date: randDate(), people: String(randInt(1, 5)), symptoms: randPick(["Persistent headache and fever for 3 days", "Annual family health screening", "Blood sugar monitoring", "Post-surgery follow-up check"]) }) },
  { type: "health_check_booking", portal: "health", label: "Free Health Check Booking", detailsFn: () => ({ preferredDate: randDate(), people: String(randInt(1, 4)), tests: randPick(["Full blood count, Malaria", "Blood pressure, Genotype", "Hepatitis B, Blood group", "Pregnancy test, Urinalysis"]) }) },
  { type: "health_consultation", portal: "health", label: "Wellness Consultation", detailsFn: () => ({ consultationType: randPick(["General wellness", "Nutrition advice", "Fitness assessment", "Mental health"]), preferredDate: randDate(), notes: randPick(["First time visit", "Follow-up from last month", "Referred by Dr. Eze"]) }) },
  { type: "event_venue_booking", portal: "events", label: "Venue Booking", detailsFn: () => ({ venue: randPick(["Studio", "Conference Room", "Training Room"]), eventDate: randDate(), guests: String(randInt(10, 200)), eventType: randPick(["Wedding reception", "Corporate meeting", "Birthday party", "Product launch", "Networking event"]) }) },
  { type: "event_training_room", portal: "events", label: "Training Room Booking", detailsFn: () => ({ date: randDate(), duration: randPick(["Half day", "Full day", "2 days", "1 week"]), attendees: String(randInt(10, 50)), purpose: randPick(["Tech workshop", "Team building", "Board meeting", "Certification training"]) }) },
  { type: "event_coverage", portal: "events", label: "Event Coverage Request", detailsFn: () => ({ services: randPick(["Video + Photography", "Photography only", "Live streaming + Audio", "Full coverage package"]), eventType: randPick(["Wedding", "Conference", "Concert", "Funeral", "Graduation"]), eventDate: randDate(), location: randPick(["Lagos Island", "Lekki", "Ikeja", "Surulere", "Victoria Island"]) }) },
  { type: "volunteer", portal: "community", label: "Volunteer Application", detailsFn: () => ({ area: randPick(["Community Cleanup", "Tree Planting", "Teaching", "Health Outreach", "Mentoring"]), availability: randPick(["Weekends only", "Flexible", "Mornings only", "Evenings"]), details: randPick(["I'm a medical student and want to help", "Experienced teacher looking to volunteer", "Want to give back to the community", "Available for the next 3 months"]) }) },
  { type: "sponsorship", portal: "community", label: "Sponsorship Submission", detailsFn: () => ({ sponsorshipType: randPick(["Student Tuition", "Health Screening", "Youth Empowerment", "School Supplies"]), amount: `₦${randInt(10, 500) * 1000}`, frequency: randPick(["One-time", "Monthly", "Quarterly", "Annually"]) }) },
  { type: "donation", portal: "community", label: "Donation", detailsFn: () => ({ cause: randPick(["Education & Schools", "Youth Empowerment", "Health Interventions", "Community Development"]), amount: `₦${randInt(5, 200) * 1000}`, frequency: randPick(["One-time", "Monthly", "Weekly"]), notes: randPick(["In memory of my father", "Want to sponsor a child", "Anonymous please", ""]) }) },
  { type: "logistics_forwarding", portal: "logistics", label: "Forwarding Request", detailsFn: () => ({ store: randPick(["Amazon", "AliExpress", "Shein", "Temu", "eBay", "Other"]), itemDescription: randPick(["Laptop and accessories", "3 boxes of clothing", "Phone cases (bulk)", "Kitchen appliances", "Electronics — fragile"]), trackingNumber: `TRK-${randInt(100000, 999999)}`, deliveryAddress: `${randInt(1, 99)} ${randPick(["Allen Ave, Ikeja", "Admiralty Way, Lekki", "Herbert Macaulay, Yaba", "Bode Thomas, Surulere"])}` }) },
];

const TEAM_NAMES = ["Damola A.", "Chioma E.", "Kunle A.", "Fatima B.", "Emeka E."];

function generateServiceRequests(count: number, users: MockUser[]): MockServiceRequest[] {
  const statuses: ServiceRequestStatus[] = ["new", "new", "reviewing", "scheduled", "in_progress", "completed", "declined"];
  const requests: MockServiceRequest[] = [];

  for (let i = 1; i <= count; i++) {
    const user = randPick(users);
    const tpl = SERVICE_REQUEST_TEMPLATES[(i - 1) % SERVICE_REQUEST_TEMPLATES.length];
    const status = randPick(statuses);
    const created = randDate();

    requests.push({
      id: padId("REQ", i),
      userId: user.id,
      userName: user.name,
      portal: tpl.portal,
      type: tpl.type,
      typeLabel: tpl.label,
      status,
      assignedTo: status !== "new" ? randPick(TEAM_NAMES) : null,
      details: tpl.detailsFn(),
      declineReason: status === "declined" ? randPick(["Service not available in this area", "Date unavailable", "Duplicate request", "Customer unreachable"]) : null,
      notes: status !== "new" ? [{ author: randPick(TEAM_NAMES), text: randPick(["Customer confirmed via phone", "Vendor notified", "Parts ordered, awaiting delivery", "Scheduled for next available slot"]), date: randDate() }] : [],
      createdAt: created,
      updatedAt: created,
    });
  }
  return requests;
}

// ── Types: Custom Order Requests ────────────────

export type CustomRequestStatus = "new" | "under_review" | "converted" | "declined";

export interface MockCustomRequest {
  id: string;
  userId: string;
  userName: string;
  portal: Portal;
  description: string;
  status: CustomRequestStatus;
  convertedOrderId: string | null;
  declineReason: string | null;
  notes: { author: string; text: string; date: string }[];
  createdAt: string;
  [key: string]: unknown;
}

function generateCustomRequests(count: number, users: MockUser[]): MockCustomRequest[] {
  const statuses: CustomRequestStatus[] = ["new", "new", "under_review", "converted", "declined"];
  const groceryDescs = [
    "I need 5kg of fresh tomatoes, 2 baskets of peppers, and scotch bonnet. Delivery to Lekki.",
    "Looking for bulk rice — 4 bags of 50kg long grain plus cooking oil 25L. Need by Saturday.",
    "Assorted party jollof rice ingredients for 200 guests. Can you put together a package?",
    "Weekly grocery box: milk, bread, eggs, butter, fruits, and vegetables for a family of 4.",
    "I need baby food supplies — Cerelac, NAN milk, fruit puree. Monthly subscription if possible.",
    "Bulk office snacks for 50 people — biscuits, drinks, water, chips. Delivery to VI.",
    "Fresh fish and seafood for a restaurant. Need regular supply 3x per week.",
  ];
  const logisticsDescs = [
    "2 laptops from Amazon, order already placed. Need delivery to Ikeja.",
    "Bulk clothing order from Shein, 3 separate packages. Consolidate and deliver.",
    "Fragile electronics from eBay — please handle with care. Insurance needed.",
    "4 boxes of kitchen appliances from AliExpress. Expected to arrive in 2 weeks.",
    "Phone accessories from Temu, small package. Deliver to Surulere.",
    "Custom furniture parts from Amazon — heavy items, may need special handling.",
  ];
  const reqs: MockCustomRequest[] = [];

  for (let i = 1; i <= count; i++) {
    const user = randPick(users);
    const portal: Portal = i % 3 === 0 ? "logistics" : "groceries";
    const desc = portal === "groceries" ? randPick(groceryDescs) : randPick(logisticsDescs);
    const status = randPick(statuses);

    reqs.push({
      id: padId("CRQ", i),
      userId: user.id,
      userName: user.name,
      portal,
      description: desc,
      status,
      convertedOrderId: status === "converted" ? padId("ORD", randInt(1, 100)) : null,
      declineReason: status === "declined" ? randPick(["Items not available", "Delivery area not covered", "Customer did not respond to clarification"]) : null,
      notes: status !== "new" ? [{ author: randPick(TEAM_NAMES), text: randPick(["Called customer to clarify quantities", "Pricing sent to customer for approval", "Items sourced from vendor"]), date: randDate() }] : [],
      createdAt: randDate(),
    });
  }
  return reqs;
}

// ── Types: Live Carts ───────────────────────────

export interface MockCartItem {
  productId: string;
  productName: string;
  portal: Portal;
  price: number;
  quantity: number;
}

export interface MockCart {
  userId: string;
  userName: string;
  userTier: MembershipTier;
  items: MockCartItem[];
  lastUpdated: string;
  createdAt: string;
  [key: string]: unknown;
}

function generateCarts(count: number, users: MockUser[], products: MockProduct[]): MockCart[] {
  const carts: MockCart[] = [];
  const activeProducts = products.filter((p) => p.status === "active");

  for (let i = 0; i < count; i++) {
    const user = users[i % users.length];
    const itemCount = randInt(1, 5);
    const items: MockCartItem[] = [];

    for (let j = 0; j < itemCount; j++) {
      const product = randPick(activeProducts);
      if (!items.find((it) => it.productId === product.id)) {
        items.push({
          productId: product.id,
          productName: product.name,
          portal: product.portal,
          price: product.price,
          quantity: randInt(1, 3),
        });
      }
    }

    const daysAgo = randInt(0, 72);
    const updated = new Date();
    updated.setHours(updated.getHours() - daysAgo);

    carts.push({
      userId: user.id,
      userName: user.name,
      userTier: user.membershipTier,
      items,
      lastUpdated: updated.toISOString().slice(0, 16).replace("T", " "),
      createdAt: randDate(),
    });
  }
  return carts;
}

// ── Types: Benefit Usage ────────────────────────

export interface MockBenefitUsage {
  userId: string;
  userName: string;
  tier: Exclude<MembershipTier, "none">;
  benefits: { name: string; used: number; limit: number | null; period: string }[];
  [key: string]: unknown;
}

const TIER_BENEFITS: Record<string, { name: string; limit: number | null; period: string }[]> = {
  bronze: [
    { name: "Free Delivery", limit: 3, period: "month" },
    { name: "Doctor Consultations", limit: 2, period: "month" },
    { name: "Order Discount (5%)", limit: 5, period: "month" },
    { name: "Car Rental Days", limit: 2, period: "quarter" },
  ],
  silver: [
    { name: "Free Delivery", limit: 8, period: "month" },
    { name: "Doctor Consultations", limit: 5, period: "month" },
    { name: "Order Discount (10%)", limit: 10, period: "month" },
    { name: "Car Rental Days", limit: 5, period: "quarter" },
    { name: "Event Venue Discount", limit: 2, period: "quarter" },
  ],
  gold: [
    { name: "Free Delivery", limit: null, period: "month" },
    { name: "Doctor Consultations", limit: null, period: "month" },
    { name: "Order Discount (15%)", limit: null, period: "month" },
    { name: "Car Rental Days", limit: 10, period: "quarter" },
    { name: "Event Venue Discount", limit: 5, period: "quarter" },
    { name: "Priority Support", limit: null, period: "month" },
  ],
};

function generateBenefitUsage(subs: MockSubscription[]): MockBenefitUsage[] {
  return subs
    .filter((s) => s.status === "active")
    .map((s) => {
      const tierBenefits = TIER_BENEFITS[s.tier] || [];
      return {
        userId: s.userId,
        userName: s.userName,
        tier: s.tier,
        benefits: tierBenefits.map((b) => ({
          name: b.name,
          used: b.limit ? randInt(0, b.limit) : randInt(0, 15),
          limit: b.limit,
          period: b.period,
        })),
      };
    });
}

// ── Types: User Notifications ───────────────────

export interface MockUserNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "order" | "wallet" | "membership" | "system" | "broadcast";
  read: boolean;
  retracted: boolean;
  createdAt: string;
  [key: string]: unknown;
}

function generateUserNotifications(users: MockUser[]): MockUserNotification[] {
  const templates: { title: string; message: string; type: MockUserNotification["type"] }[] = [
    { title: "Order Confirmed", message: "Your order ORD-042 has been confirmed and is being processed.", type: "order" },
    { title: "Wallet Top-up Successful", message: "₦50,000 has been added to your wallet.", type: "wallet" },
    { title: "Membership Renewed", message: "Your Silver membership has been renewed until July 2026.", type: "membership" },
    { title: "Order Delivered", message: "Your Groceries order has been delivered. Rate your experience!", type: "order" },
    { title: "Referral Bonus", message: "You earned ₦2,000 referral bonus! Your friend joined LagosApps.", type: "wallet" },
    { title: "Easter Sale!", message: "Get 20% off all Groceries this weekend. Shop now!", type: "broadcast" },
    { title: "New Service Available", message: "Ambulance service coming soon to Health portal.", type: "system" },
    { title: "Payment Failed", message: "Your card payment for ORD-039 failed. Please retry.", type: "wallet" },
    { title: "Membership Expiring", message: "Your Bronze membership expires in 3 days. Renew now!", type: "membership" },
    { title: "Free Health Check", message: "Free health screening this Friday at our Ikeja centre.", type: "broadcast" },
  ];

  const notifs: MockUserNotification[] = [];
  let idx = 1;

  for (const user of users.slice(0, 20)) {
    const count = randInt(3, 8);
    for (let j = 0; j < count; j++) {
      const tpl = randPick(templates);
      notifs.push({
        id: padId("UNT", idx),
        userId: user.id,
        title: tpl.title,
        message: tpl.message,
        type: tpl.type,
        read: Math.random() > 0.4,
        retracted: false,
        createdAt: randDate(),
      });
      idx++;
    }
  }
  return notifs;
}

// ── Generate all data ─────────────────────────

export const mockUsers = generateUsers(50);
export const mockOrders = generateOrders(100, mockUsers);
export const mockWalletTxns = generateWalletTxns(200, mockUsers);
export const mockReferrals = generateReferrals(30, mockUsers);
export const mockNotifications = generateNotifications(20);
export const mockAuditLog = generateAuditLog(50);
export const mockSubscriptions = generateSubscriptions(40, mockUsers);
export const mockProducts = generateProducts();
export const mockServiceRequests = generateServiceRequests(40, mockUsers);
export const mockCustomRequests = generateCustomRequests(15, mockUsers);
export const mockCarts = generateCarts(18, mockUsers, mockProducts);
export const mockBenefitUsage = generateBenefitUsage(mockSubscriptions);
export const mockUserNotifications = generateUserNotifications(mockUsers);

// ── Utility exports ───────────────────────────

export function formatNaira(amount: number | null | undefined): string {
  return `\u20A6${(amount ?? 0).toLocaleString()}`;
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
