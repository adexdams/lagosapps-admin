// ── Types ────────────────────────────────────────────────────────────────────

export type MembershipTier = "none" | "bronze" | "silver" | "gold";
export type OrderStatus = "pending" | "confirmed" | "processing" | "completed" | "cancelled";
export type WalletTxnType = "credit" | "debit";
export type ReferralStatus = "active" | "pending" | "expired";
export type Portal = "solar" | "transport" | "groceries" | "health" | "events" | "community" | "logistics";

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

export interface MockUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  membership: MembershipTier;
  walletBalance: number;
  totalOrders: number;
  totalSpent: number;
  referralsMade: number;
  joinedAt: string;
  status: "active" | "inactive";
}

export interface MockOrder {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  portal: Portal;
  items: string;
  itemCount: number;
  amount: number;
  status: OrderStatus;
  createdAt: string;
  timeline: { label: string; date: string }[];
  paymentRef: string;
  memberDiscount: number;
  walletDeduction: number;
}

export interface MockWalletTxn {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  description: string;
  type: WalletTxnType;
  amount: number;
  balanceAfter: number;
  createdAt: string;
}

export interface MockReferral {
  id: string;
  referrerId: string;
  referrerName: string;
  referrerAvatar: string;
  referredId: string;
  referredName: string;
  referredAvatar: string;
  giftedTier: MembershipTier;
  status: ReferralStatus;
  createdAt: string;
  expiresAt: string;
}

export interface MockNotification {
  id: string;
  title: string;
  message: string;
  type: "order" | "wallet" | "membership" | "system";
  recipients: string;
  sentBy: string;
  sentAt: string;
  readCount: number;
  totalCount: number;
}

export interface MockAuditEntry {
  id: string;
  admin: string;
  action: string;
  entity: string;
  details: string;
  timestamp: string;
}

export interface MockSubscription {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  tier: MembershipTier;
  billingCycle: "annual" | "quarterly";
  startedAt: string;
  expiresAt: string;
  status: "active" | "expired" | "cancelled";
}

export interface MockProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  portal: Portal;
  stockStatus: "in_stock" | "low_stock" | "out_of_stock";
  active: boolean;
  metadata?: Record<string, string>;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const firstNames = [
  "Chidi", "Amara", "Kunle", "Fatima", "Damola", "Nneka", "Emeka", "Zainab",
  "Tunde", "Adaeze", "Obinna", "Halima", "Segun", "Ifeoma", "Yusuf", "Chioma",
  "Adebayo", "Ngozi", "Ibrahim", "Kemi", "Obi", "Aisha", "Femi", "Uju",
  "Musa", "Bukola", "Chukwu", "Hauwa", "Jide", "Amina", "Tola", "Bisi",
  "Ahmed", "Funke", "Uche", "Sadiya", "Lanre", "Chiamaka", "Kabiru", "Dayo",
  "Nnamdi", "Rashida", "Seyi", "Obiageli", "Hassan", "Folake", "Chinedu", "Yetunde", "Aliyu", "Titilayo",
];
const lastNames = [
  "Okafor", "Taiwo", "Adeyemi", "Bello", "Adediran", "Eze", "Emenike", "Abdullahi",
  "Ogundimu", "Nwosu", "Usman", "Okonkwo", "Lawal", "Igwe", "Mohammed", "Akinola",
  "Chukwuma", "Balogun", "Suleiman", "Olayinka", "Nwachukwu", "Abubakar", "Oyelaran", "Onuoha",
  "Danjuma", "Adegoke", "Onyema", "Garba", "Bakare", "Udoka", "Yusuf", "Adeleke",
  "Obi", "Ibrahim", "Afolabi", "Musa", "Ojo", "Nwankwo", "Idris", "Ogundipe",
  "Nwafor", "Aliyu", "Salami", "Ekwueme", "Adamu", "Oyedele", "Okechukwu", "Audu", "Fashola", "Anyanwu",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}
function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randDate(_startYear: number, _endMonth: number): string {
  // Generate dates in last 12 months (May 2025 – Apr 2026) for good chart distribution
  const months = [
    "2025-05","2025-06","2025-07","2025-08","2025-09","2025-10",
    "2025-11","2025-12","2026-01","2026-02","2026-03","2026-04",
  ];
  const ym = months[randInt(0, months.length - 1)];
  const d = randInt(1, 28);
  return `${ym}-${String(d).padStart(2, "0")}`;
}
function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ── Generate Users ───────────────────────────────────────────────────────────

function generateUsers(): MockUser[] {
  return Array.from({ length: 50 }, (_, i) => {
    const first = firstNames[i];
    const last = lastNames[i];
    const name = `${first} ${last}`;
    const tiers: MembershipTier[] = ["none", "none", "none", "bronze", "bronze", "silver", "gold"];
    return {
      id: `USR-${String(i + 1).padStart(3, "0")}`,
      name,
      email: `${first.toLowerCase()}.${last.toLowerCase()}@example.com`,
      phone: `+234 ${randInt(700, 919)} ${randInt(100, 999)} ${randInt(1000, 9999)}`,
      avatar: initials(name),
      membership: pick(tiers),
      walletBalance: randInt(0, 500000),
      totalOrders: randInt(0, 30),
      totalSpent: randInt(0, 5000000),
      referralsMade: randInt(0, 5),
      joinedAt: randDate(2025, 12),
      status: Math.random() > 0.1 ? "active" : "inactive",
    };
  });
}

// ── Generate Orders ──────────────────────────────────────────────────────────

const orderItems: Record<Portal, string[]> = {
  solar: ["Solar Panel 650W", "5kW Inverter", "Gel Battery 200Ah", "Charge Controller 60A", "Installation Package"],
  transport: ["Sedan – Lekki to VI", "SUV – Ikeja to Airport", "Bus Charter – Lagos", "Van – Surulere to Yaba"],
  groceries: ["Fresh Produce Bundle", "Dairy & Eggs Pack", "Household Essentials", "Rice 50kg Bag", "Cooking Oil 5L x3"],
  health: ["Full Blood Count", "Malaria Test", "COVID-19 PCR", "General Consultation", "Eye Examination"],
  events: ["Hall Booking – Grand Ballroom", "Photography + Video", "DJ + Sound System", "Decoration Package"],
  community: ["Web Dev Bootcamp", "Solar Training Course", "Community Cleanup", "Youth Mentorship"],
  logistics: ["Same-day Delivery x3", "Bulk Pickup – Ikeja", "Cold Chain Delivery"],
};

function generateOrders(users: MockUser[]): MockOrder[] {
  const statuses: OrderStatus[] = ["pending", "confirmed", "processing", "completed", "completed", "completed", "cancelled"];
  const portals: Portal[] = ["solar", "transport", "groceries", "health", "events", "community", "logistics"];
  return Array.from({ length: 100 }, (_, i) => {
    const user = pick(users);
    const portal = pick(portals);
    const items = pickN(orderItems[portal], randInt(1, 3));
    const status = pick(statuses);
    const date = randDate(2025, 12);
    const timeline: { label: string; date: string }[] = [{ label: "Order placed", date }];
    if (status !== "pending") timeline.push({ label: "Confirmed", date });
    if (status === "processing" || status === "completed") timeline.push({ label: "Processing", date });
    if (status === "completed") timeline.push({ label: "Completed", date });
    if (status === "cancelled") timeline.push({ label: "Cancelled", date });

    const amount = portal === "solar" ? randInt(500000, 10000000) : portal === "transport" ? randInt(5000, 250000) : randInt(2000, 100000);
    const memberDiscount = user.membership !== "none" ? Math.round(amount * 0.1) : 0;

    return {
      id: `ORD-${String(i + 1).padStart(3, "0")}`,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      portal,
      items: items.join(", "),
      itemCount: items.length,
      amount,
      status,
      createdAt: date,
      timeline,
      paymentRef: `PAY-${Date.now()}-${randInt(1000, 9999)}`,
      memberDiscount,
      walletDeduction: randInt(0, Math.min(amount * 0.3, user.walletBalance)),
    };
  });
}

// ── Generate Wallet Transactions ─────────────────────────────────────────────

function generateWalletTxns(users: MockUser[]): MockWalletTxn[] {
  const creditDescs = ["Wallet top-up", "Referral bonus", "Refund – Order cancelled", "Cashback reward", "Membership credit"];
  const debitDescs = ["Order payment", "Wallet deduction – Order", "Service fee", "Subscription payment"];
  return Array.from({ length: 200 }, (_, i) => {
    const user = pick(users);
    const isCredit = Math.random() > 0.45;
    return {
      id: `TXN-${String(i + 1).padStart(3, "0")}`,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      description: isCredit ? pick(creditDescs) : pick(debitDescs),
      type: isCredit ? "credit" : "debit",
      amount: randInt(500, 200000),
      balanceAfter: randInt(0, 500000),
      createdAt: randDate(2025, 12),
    };
  });
}

// ── Generate Referrals ───────────────────────────────────────────────────────

function generateReferrals(users: MockUser[]): MockReferral[] {
  const tiers: MembershipTier[] = ["bronze", "silver", "gold"];
  const statuses: ReferralStatus[] = ["active", "active", "pending", "expired"];
  return Array.from({ length: 30 }, (_, i) => {
    const [referrer, referred] = pickN(users, 2);
    const created = randDate(2025, 12);
    return {
      id: `REF-${String(i + 1).padStart(3, "0")}`,
      referrerId: referrer.id,
      referrerName: referrer.name,
      referrerAvatar: referrer.avatar,
      referredId: referred.id,
      referredName: referred.name,
      referredAvatar: referred.avatar,
      giftedTier: pick(tiers),
      status: pick(statuses),
      createdAt: created,
      expiresAt: `2026-${String(randInt(6, 12)).padStart(2, "0")}-${String(randInt(1, 28)).padStart(2, "0")}`,
    };
  });
}

// ── Generate Notifications ───────────────────────────────────────────────────

function generateNotifications(): MockNotification[] {
  const items: Omit<MockNotification, "id">[] = [
    { title: "System Maintenance", message: "Platform will be down for maintenance on Saturday 2am–4am.", type: "system", recipients: "All Users", sentBy: "Admin", sentAt: "2026-04-10", readCount: 312, totalCount: 1247 },
    { title: "New Gold Benefits", message: "Gold members now get 15% off all solar products.", type: "membership", recipients: "Gold Members", sentBy: "Admin", sentAt: "2026-04-09", readCount: 89, totalCount: 142 },
    { title: "Order Dispatch Update", message: "Your grocery orders will now arrive within 2 hours.", type: "order", recipients: "All Users", sentBy: "Admin", sentAt: "2026-04-08", readCount: 524, totalCount: 1247 },
    { title: "Wallet Bonus Weekend", message: "Top up ₦10,000+ this weekend and get 5% bonus credit.", type: "wallet", recipients: "All Users", sentBy: "Admin", sentAt: "2026-04-07", readCount: 678, totalCount: 1247 },
    { title: "Welcome to LagosApps", message: "Thanks for joining! Explore our 7 service portals.", type: "system", recipients: "Fatima Bello", sentBy: "System", sentAt: "2026-04-06", readCount: 1, totalCount: 1 },
    { title: "Bronze Tier Perks", message: "Enjoy 5% off groceries and free delivery on first 3 orders.", type: "membership", recipients: "Bronze Members", sentBy: "Admin", sentAt: "2026-04-05", readCount: 156, totalCount: 267 },
    { title: "New Solar Packages", message: "Check out our latest solar packages with lithium batteries.", type: "order", recipients: "All Users", sentBy: "Admin", sentAt: "2026-04-04", readCount: 402, totalCount: 1247 },
    { title: "Referral Program Update", message: "Refer a friend and both of you get ₦2,000 wallet credit.", type: "wallet", recipients: "All Users", sentBy: "Admin", sentAt: "2026-04-03", readCount: 891, totalCount: 1247 },
    { title: "Event Venue Discount", message: "Book any venue this month and get 10% off.", type: "order", recipients: "Silver Members", sentBy: "Admin", sentAt: "2026-04-02", readCount: 45, totalCount: 89 },
    { title: "Transport Price Update", message: "Transport prices adjusted for fuel cost changes.", type: "system", recipients: "All Users", sentBy: "Admin", sentAt: "2026-04-01", readCount: 723, totalCount: 1247 },
    { title: "Health Portal Launch", message: "Health and Wellness is now live! Book medical tests online.", type: "system", recipients: "All Users", sentBy: "Admin", sentAt: "2026-03-28", readCount: 1102, totalCount: 1247 },
    { title: "Wallet Maintenance", message: "Wallet services will be briefly unavailable tonight 11pm–12am.", type: "wallet", recipients: "All Users", sentBy: "Admin", sentAt: "2026-03-25", readCount: 234, totalCount: 1247 },
    { title: "Order Completed", message: "Your solar installation has been completed successfully.", type: "order", recipients: "Chidi Okafor", sentBy: "System", sentAt: "2026-03-20", readCount: 1, totalCount: 1 },
    { title: "Membership Renewal", message: "Your Silver membership expires in 7 days. Renew now!", type: "membership", recipients: "Kunle Adeyemi", sentBy: "System", sentAt: "2026-03-18", readCount: 1, totalCount: 1 },
    { title: "Community Clean-up Day", message: "Join us this Saturday for community clean-up in Lekki.", type: "system", recipients: "All Users", sentBy: "Admin", sentAt: "2026-03-15", readCount: 567, totalCount: 1247 },
    { title: "Logistics Service Expansion", message: "Cold-chain delivery now available across Lagos mainland.", type: "order", recipients: "All Users", sentBy: "Admin", sentAt: "2026-03-10", readCount: 445, totalCount: 1247 },
    { title: "Quarterly Report", message: "Q1 2026 earnings have been deposited to your wallet.", type: "wallet", recipients: "Gold Members", sentBy: "System", sentAt: "2026-03-05", readCount: 120, totalCount: 142 },
    { title: "New Course Available", message: "Solar Installation Masterclass now open for enrollment.", type: "system", recipients: "All Users", sentBy: "Admin", sentAt: "2026-03-01", readCount: 334, totalCount: 1247 },
    { title: "Happy New Year", message: "Wishing you a prosperous 2026 from all of us at LagosApps!", type: "system", recipients: "All Users", sentBy: "Admin", sentAt: "2026-01-01", readCount: 987, totalCount: 1247 },
    { title: "Security Update", message: "We've enhanced our payment security. Please update your password.", type: "system", recipients: "All Users", sentBy: "Admin", sentAt: "2025-12-15", readCount: 456, totalCount: 1100 },
  ];
  return items.map((item, i) => ({ ...item, id: `NTF-${String(i + 1).padStart(3, "0")}` }));
}

// ── Generate Audit Log ───────────────────────────────────────────────────────

function generateAuditLog(): MockAuditEntry[] {
  const entries: Omit<MockAuditEntry, "id">[] = [
    { admin: "Admin", action: "product.create", entity: "Product: Solar Panel 650W", details: "Created new product in Solar portal. Price: ₦185,000", timestamp: "2026-04-10 14:32:00" },
    { admin: "Admin", action: "order.status_change", entity: "Order: ORD-042", details: "Status: pending → confirmed", timestamp: "2026-04-10 13:15:00" },
    { admin: "Admin", action: "user.wallet_adjust", entity: "User: Chidi Okafor", details: "Credit ₦5,000 — Referral bonus", timestamp: "2026-04-10 12:45:00" },
    { admin: "Admin", action: "notification.broadcast", entity: "Notification: System Maintenance", details: "Sent to All Users (1,247 recipients)", timestamp: "2026-04-10 11:00:00" },
    { admin: "Admin", action: "membership.tier_update", entity: "Tier: Gold", details: "Annual price: ₦50,000 → ₦55,000", timestamp: "2026-04-09 16:20:00" },
    { admin: "Admin", action: "product.update", entity: "Product: 5kW Inverter", details: "Price: ₦420,000 → ₦450,000. Stock: in_stock", timestamp: "2026-04-09 15:10:00" },
    { admin: "Admin", action: "order.cancel", entity: "Order: ORD-035", details: "Cancelled by admin. Reason: customer request", timestamp: "2026-04-09 14:00:00" },
    { admin: "Admin", action: "user.deactivate", entity: "User: Musa Danjuma", details: "Account deactivated. Reason: terms violation", timestamp: "2026-04-09 11:30:00" },
    { admin: "Admin", action: "settings.update", entity: "Settings: Payment", details: "Test mode: enabled → disabled", timestamp: "2026-04-08 17:45:00" },
    { admin: "Admin", action: "product.delete", entity: "Product: Old Battery Model", details: "Removed from Solar portal inventory", timestamp: "2026-04-08 16:00:00" },
    { admin: "Admin", action: "membership.benefit_update", entity: "Tier: Silver", details: "Added benefit: Free delivery (3 per month)", timestamp: "2026-04-08 14:30:00" },
    { admin: "Admin", action: "order.refund", entity: "Order: ORD-028", details: "Refund ₦15,400 to wallet. Reason: damaged goods", timestamp: "2026-04-08 13:00:00" },
    { admin: "Admin", action: "notification.broadcast", entity: "Notification: Gold Benefits", details: "Sent to Gold Members (142 recipients)", timestamp: "2026-04-07 10:00:00" },
    { admin: "Admin", action: "product.create", entity: "Product: Fresh Produce Bundle", details: "Created in Groceries portal. Price: ₦8,500", timestamp: "2026-04-07 09:15:00" },
    { admin: "Admin", action: "order.status_change", entity: "Order: ORD-040", details: "Status: processing → completed", timestamp: "2026-04-06 16:45:00" },
    { admin: "Admin", action: "user.membership_change", entity: "User: Amara Taiwo", details: "Tier: bronze → silver. Upgraded by admin", timestamp: "2026-04-06 14:20:00" },
    { admin: "Admin", action: "product.update", entity: "Product: Sedan – Lekki to VI", details: "Price updated for zone 3: ₦12,000 → ₦14,000", timestamp: "2026-04-05 15:30:00" },
    { admin: "Admin", action: "settings.update", entity: "Settings: Portal Toggles", details: "Community portal: active → inactive", timestamp: "2026-04-05 11:00:00" },
    { admin: "Admin", action: "order.status_change", entity: "Order: ORD-033", details: "Status: confirmed → processing", timestamp: "2026-04-04 13:10:00" },
    { admin: "Admin", action: "user.wallet_adjust", entity: "User: Fatima Bello", details: "Debit ₦2,500 — Service fee adjustment", timestamp: "2026-04-04 10:45:00" },
    { admin: "Admin", action: "product.create", entity: "Product: Photography + Video", details: "Created in Events portal. Price: ₦150,000", timestamp: "2026-04-03 16:00:00" },
    { admin: "Admin", action: "notification.broadcast", entity: "Notification: Wallet Bonus", details: "Sent to All Users (1,247 recipients)", timestamp: "2026-04-03 09:00:00" },
    { admin: "Admin", action: "membership.tier_update", entity: "Tier: Bronze", details: "Quarterly price: ₦5,000 → ₦4,500", timestamp: "2026-04-02 14:15:00" },
    { admin: "Admin", action: "order.cancel", entity: "Order: ORD-025", details: "Cancelled. Reason: payment timeout", timestamp: "2026-04-02 11:30:00" },
    { admin: "Admin", action: "product.update", entity: "Product: Hall Booking – Grand Ballroom", details: "Capacity: 500 → 600. Amenities added: Parking", timestamp: "2026-04-01 15:45:00" },
    { admin: "Admin", action: "user.deactivate", entity: "User: Test Account", details: "Removed test account from production", timestamp: "2026-04-01 10:00:00" },
    { admin: "Admin", action: "order.status_change", entity: "Order: ORD-020", details: "Status: pending → confirmed", timestamp: "2026-03-30 14:20:00" },
    { admin: "Admin", action: "product.create", entity: "Product: General Consultation", details: "Created in Health portal. Price: ₦0 (Free)", timestamp: "2026-03-30 11:00:00" },
    { admin: "Admin", action: "notification.broadcast", entity: "Notification: Health Portal Launch", details: "Sent to All Users (1,247 recipients)", timestamp: "2026-03-28 08:00:00" },
    { admin: "Admin", action: "settings.update", entity: "Settings: Support", details: "Support phone: +234 800 123 4567 → +234 800 123 4568", timestamp: "2026-03-27 16:30:00" },
    { admin: "Admin", action: "product.update", entity: "Product: Rice 50kg Bag", details: "Price: ₦42,000 → ₦45,000. Stock: low_stock", timestamp: "2026-03-26 13:15:00" },
    { admin: "Admin", action: "order.refund", entity: "Order: ORD-015", details: "Partial refund ₦5,000. Reason: missing item", timestamp: "2026-03-25 15:00:00" },
    { admin: "Admin", action: "membership.benefit_update", entity: "Tier: Gold", details: "Updated benefit: Free delivery → Unlimited per month", timestamp: "2026-03-25 11:45:00" },
    { admin: "Admin", action: "user.wallet_adjust", entity: "User: Emeka Emenike", details: "Credit ₦10,000 — Compensation for service delay", timestamp: "2026-03-24 14:00:00" },
    { admin: "Admin", action: "product.delete", entity: "Product: Discontinued Snack Pack", details: "Removed from Groceries portal", timestamp: "2026-03-23 10:30:00" },
    { admin: "Admin", action: "order.status_change", entity: "Order: ORD-010", details: "Status: processing → completed", timestamp: "2026-03-22 16:00:00" },
    { admin: "Admin", action: "notification.broadcast", entity: "Notification: Referral Program", details: "Sent to All Users (1,247 recipients)", timestamp: "2026-03-20 09:00:00" },
    { admin: "Admin", action: "user.membership_change", entity: "User: Kunle Adeyemi", details: "Tier: silver → gold. Auto-upgrade", timestamp: "2026-03-19 14:30:00" },
    { admin: "Admin", action: "product.create", entity: "Product: Same-day Delivery", details: "Created in Logistics portal. Price: ₦3,500", timestamp: "2026-03-18 11:15:00" },
    { admin: "Admin", action: "settings.update", entity: "Settings: Portal Toggles", details: "Logistics portal: inactive → active", timestamp: "2026-03-18 10:00:00" },
    { admin: "Admin", action: "order.cancel", entity: "Order: ORD-008", details: "Cancelled. Reason: out of stock", timestamp: "2026-03-17 13:45:00" },
    { admin: "Admin", action: "product.update", entity: "Product: SUV – Ikeja to Airport", details: "Pickup hours: 6am-10pm → 24h", timestamp: "2026-03-16 15:20:00" },
    { admin: "Admin", action: "user.wallet_adjust", entity: "User: Zainab Abdullahi", details: "Credit ₦3,000 — Welcome bonus", timestamp: "2026-03-15 10:00:00" },
    { admin: "Admin", action: "membership.tier_update", entity: "Tier: Silver", details: "Annual price: ₦25,000 → ₦28,000", timestamp: "2026-03-14 14:00:00" },
    { admin: "Admin", action: "product.create", entity: "Product: Charge Controller 60A", details: "Created in Solar portal. Price: ₦85,000", timestamp: "2026-03-13 11:30:00" },
    { admin: "Admin", action: "notification.broadcast", entity: "Notification: New Course", details: "Sent to All Users (1,247 recipients)", timestamp: "2026-03-10 08:00:00" },
    { admin: "Admin", action: "order.status_change", entity: "Order: ORD-005", details: "Status: confirmed → processing", timestamp: "2026-03-08 13:00:00" },
    { admin: "Admin", action: "user.deactivate", entity: "User: Spam Account", details: "Account deactivated. Reason: suspicious activity", timestamp: "2026-03-05 16:15:00" },
    { admin: "Admin", action: "product.update", entity: "Product: Cooking Oil 5L x3", details: "Price: ₦18,000 → ₦19,500", timestamp: "2026-03-03 14:45:00" },
    { admin: "Admin", action: "settings.update", entity: "Settings: Platform", details: "Site name: LagosApps Beta → LagosApps", timestamp: "2026-03-01 10:00:00" },
  ];
  return entries.map((e, i) => ({ ...e, id: `AUD-${String(i + 1).padStart(3, "0")}` }));
}

// ── Generate Subscriptions ───────────────────────────────────────────────────

function generateSubscriptions(users: MockUser[]): MockSubscription[] {
  const members = users.filter((u) => u.membership !== "none");
  const statuses: ("active" | "expired" | "cancelled")[] = ["active", "active", "active", "expired", "cancelled"];
  return Array.from({ length: 40 }, (_, i) => {
    const user = members[i % members.length];
    const cycle = Math.random() > 0.4 ? "annual" : "quarterly";
    const started = randDate(2025, 12);
    return {
      id: `SUB-${String(i + 1).padStart(3, "0")}`,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      tier: user.membership === "none" ? "bronze" : user.membership,
      billingCycle: cycle,
      startedAt: started,
      expiresAt: `2026-${String(randInt(6, 12)).padStart(2, "0")}-${String(randInt(1, 28)).padStart(2, "0")}`,
      status: pick(statuses),
    };
  });
}

// ── Generate Products ────────────────────────────────────────────────────────

function generateProducts(): MockProduct[] {
  const products: Omit<MockProduct, "id">[] = [
    // Solar
    { name: "Solar Panel 650W", description: "High-efficiency monocrystalline panel", price: 185000, image: "", category: "Panels", portal: "solar", stockStatus: "in_stock", active: true, metadata: { wattage: "650W", brand: "JA Solar" } },
    { name: "Solar Panel 450W", description: "Polycrystalline panel for budget builds", price: 125000, image: "", category: "Panels", portal: "solar", stockStatus: "in_stock", active: true, metadata: { wattage: "450W", brand: "Longi" } },
    { name: "5kW Hybrid Inverter", description: "Growatt hybrid inverter with MPPT", price: 450000, image: "", category: "Inverters", portal: "solar", stockStatus: "in_stock", active: true, metadata: { wattage: "5000W", brand: "Growatt" } },
    { name: "3.5kW Inverter", description: "Budget-friendly inverter for small homes", price: 280000, image: "", category: "Inverters", portal: "solar", stockStatus: "low_stock", active: true, metadata: { wattage: "3500W", brand: "Must" } },
    { name: "Gel Battery 200Ah", description: "Deep-cycle gel battery", price: 165000, image: "", category: "Batteries", portal: "solar", stockStatus: "in_stock", active: true, metadata: { brand: "Ritar", batteryType: "Gel" } },
    { name: "Lithium Battery 5kWh", description: "Wall-mount lithium iron phosphate", price: 850000, image: "", category: "Batteries", portal: "solar", stockStatus: "in_stock", active: true, metadata: { brand: "Felicity", batteryType: "Lithium" } },
    { name: "Charge Controller 60A", description: "MPPT charge controller", price: 85000, image: "", category: "Controllers", portal: "solar", stockStatus: "in_stock", active: true, metadata: { wattage: "60A", brand: "Must" } },
    { name: "Charge Controller 30A", description: "PWM charge controller for small systems", price: 25000, image: "", category: "Controllers", portal: "solar", stockStatus: "out_of_stock", active: false },
    { name: "Solar Panel 550W", description: "Tier 1 bifacial mono panel", price: 165000, image: "", category: "Panels", portal: "solar", stockStatus: "in_stock", active: true, metadata: { wattage: "550W", brand: "Trina" } },
    { name: "10kW Hybrid Inverter", description: "Large-scale hybrid inverter", price: 920000, image: "", category: "Inverters", portal: "solar", stockStatus: "in_stock", active: true, metadata: { wattage: "10000W", brand: "Deye" } },
    { name: "Lithium Battery 10kWh", description: "Stackable lithium storage system", price: 1650000, image: "", category: "Batteries", portal: "solar", stockStatus: "low_stock", active: true, metadata: { brand: "Pylontech", batteryType: "Lithium" } },
    { name: "Mounting Rack (Ground)", description: "Aluminium ground mounting structure", price: 45000, image: "", category: "Controllers", portal: "solar", stockStatus: "in_stock", active: true },
    { name: "Solar Cable 6mm (100m)", description: "UV-resistant PV cable", price: 32000, image: "", category: "Controllers", portal: "solar", stockStatus: "in_stock", active: true },
    { name: "MC4 Connectors Pack", description: "20-pair solar connectors", price: 8500, image: "", category: "Controllers", portal: "solar", stockStatus: "in_stock", active: true },
    // Transport
    { name: "Sedan – City Ride", description: "Comfortable sedan for city commutes", price: 8000, image: "", category: "Vehicles", portal: "transport", stockStatus: "in_stock", active: true, metadata: { pickupHours: "6am-10pm" } },
    { name: "SUV – Premium Ride", description: "Spacious SUV for comfort", price: 15000, image: "", category: "Vehicles", portal: "transport", stockStatus: "in_stock", active: true, metadata: { pickupHours: "24h" } },
    { name: "Bus Charter", description: "Full bus for group transport", price: 120000, image: "", category: "Vehicles", portal: "transport", stockStatus: "in_stock", active: true, metadata: { pickupHours: "6am-8pm" } },
    { name: "Van – Cargo", description: "Cargo van for goods transport", price: 25000, image: "", category: "Vehicles", portal: "transport", stockStatus: "in_stock", active: true, metadata: { pickupHours: "6am-6pm" } },
    { name: "Motorcycle – Express", description: "Quick bike for short trips", price: 3000, image: "", category: "Vehicles", portal: "transport", stockStatus: "in_stock", active: true, metadata: { pickupHours: "6am-10pm" } },
    { name: "Mini Van – Airport", description: "Airport shuttle service", price: 35000, image: "", category: "Vehicles", portal: "transport", stockStatus: "in_stock", active: true, metadata: { pickupHours: "24h" } },
    // Groceries
    { name: "Fresh Produce Bundle", description: "Seasonal vegetables and fruits", price: 8500, image: "", category: "Staples", portal: "groceries", stockStatus: "in_stock", active: true },
    { name: "Rice 50kg Bag", description: "Premium long-grain rice", price: 45000, image: "", category: "Staples", portal: "groceries", stockStatus: "in_stock", active: true },
    { name: "Cooking Oil 5L x3", description: "Vegetable cooking oil pack", price: 19500, image: "", category: "Staples", portal: "groceries", stockStatus: "in_stock", active: true },
    { name: "Dairy & Eggs Pack", description: "Milk, yoghurt, and eggs combo", price: 6500, image: "", category: "Drinks", portal: "groceries", stockStatus: "low_stock", active: true },
    { name: "Household Essentials", description: "Cleaning supplies bundle", price: 12000, image: "", category: "Household", portal: "groceries", stockStatus: "in_stock", active: true },
    { name: "Snack Variety Box", description: "Assorted Nigerian snacks", price: 5500, image: "", category: "Snacks", portal: "groceries", stockStatus: "in_stock", active: true },
    { name: "Premium Spice Set", description: "12 essential cooking spices", price: 8500, image: "", category: "Staples", portal: "groceries", stockStatus: "in_stock", active: true },
    { name: "Soft Drinks Crate", description: "24 assorted soft drinks", price: 7200, image: "", category: "Drinks", portal: "groceries", stockStatus: "in_stock", active: true },
    { name: "Frozen Fish Pack", description: "5kg mixed frozen fish", price: 14000, image: "", category: "Staples", portal: "groceries", stockStatus: "low_stock", active: true },
    { name: "Baby Care Bundle", description: "Diapers, wipes, and formula", price: 22000, image: "", category: "Household", portal: "groceries", stockStatus: "in_stock", active: true },
    { name: "Cereal Variety Box", description: "5 popular breakfast cereals", price: 9500, image: "", category: "Cereals", portal: "groceries", stockStatus: "in_stock", active: true },
    { name: "Canned Tomatoes 12pk", description: "Premium canned tomato paste", price: 6800, image: "", category: "Canned", portal: "groceries", stockStatus: "in_stock", active: true },
    // Health
    { name: "General Consultation", description: "30-minute doctor consultation", price: 0, image: "", category: "Services", portal: "health", stockStatus: "in_stock", active: true },
    { name: "Full Blood Count", description: "Complete blood count test", price: 5000, image: "", category: "Medical Tests", portal: "health", stockStatus: "in_stock", active: true },
    { name: "Malaria Test", description: "Rapid malaria diagnostic test", price: 3000, image: "", category: "Medical Tests", portal: "health", stockStatus: "in_stock", active: true },
    { name: "COVID-19 PCR", description: "PCR test with 24h results", price: 25000, image: "", category: "Medical Tests", portal: "health", stockStatus: "in_stock", active: true },
    { name: "Eye Examination", description: "Comprehensive eye check-up", price: 8000, image: "", category: "Services", portal: "health", stockStatus: "in_stock", active: true, metadata: { comingSoon: "false" } },
    { name: "First Aid Kit", description: "Basic first aid supplies", price: 4500, image: "", category: "Supplies", portal: "health", stockStatus: "in_stock", active: true },
    { name: "Dental Check-up", description: "Full dental examination", price: 12000, image: "", category: "Services", portal: "health", stockStatus: "in_stock", active: true },
    { name: "Pregnancy Test Kit", description: "Home pregnancy test pack of 3", price: 2500, image: "", category: "Supplies", portal: "health", stockStatus: "in_stock", active: true },
    { name: "Thyroid Panel", description: "TSH, T3, T4 hormone test", price: 15000, image: "", category: "Medical Tests", portal: "health", stockStatus: "in_stock", active: true },
    { name: "Blood Pressure Monitor", description: "Digital BP monitor for home use", price: 18000, image: "", category: "Supplies", portal: "health", stockStatus: "in_stock", active: true },
    // Events
    { name: "Grand Ballroom", description: "500-capacity hall with AC and parking", price: 350000, image: "", category: "Venues", portal: "events", stockStatus: "in_stock", active: true, metadata: { capacity: "500", location: "Victoria Island" } },
    { name: "Garden Terrace", description: "Outdoor venue with city views", price: 200000, image: "", category: "Venues", portal: "events", stockStatus: "in_stock", active: true, metadata: { capacity: "200", location: "Lekki" } },
    { name: "Photography + Video", description: "Full coverage for your event", price: 150000, image: "", category: "Coverage Services", portal: "events", stockStatus: "in_stock", active: true },
    { name: "DJ + Sound System", description: "Professional DJ and sound setup", price: 80000, image: "", category: "Coverage Services", portal: "events", stockStatus: "in_stock", active: true },
    { name: "Decoration Package", description: "Floral and lighting decoration", price: 120000, image: "", category: "Coverage Services", portal: "events", stockStatus: "in_stock", active: true },
    { name: "Rooftop Lounge", description: "Intimate 80-capacity rooftop space", price: 180000, image: "", category: "Venues", portal: "events", stockStatus: "in_stock", active: true, metadata: { capacity: "80", location: "Ikoyi" } },
    { name: "MC / Host Package", description: "Professional event host for 6hrs", price: 100000, image: "", category: "Coverage Services", portal: "events", stockStatus: "in_stock", active: true },
    { name: "Catering – 100 Guests", description: "Full catering package for 100", price: 450000, image: "", category: "Coverage Services", portal: "events", stockStatus: "in_stock", active: true },
    // Community
    { name: "Web Dev Bootcamp", description: "12-week full-stack web development course", price: 150000, image: "", category: "Courses", portal: "community", stockStatus: "in_stock", active: true },
    { name: "Solar Training Course", description: "Installation and maintenance training", price: 80000, image: "", category: "Courses", portal: "community", stockStatus: "in_stock", active: true },
    { name: "Community Cleanup", description: "Monthly neighborhood cleanup event", price: 0, image: "", category: "Volunteer Areas", portal: "community", stockStatus: "in_stock", active: true },
    { name: "Youth Mentorship", description: "3-month mentoring program", price: 0, image: "", category: "Impact Areas", portal: "community", stockStatus: "in_stock", active: true },
    { name: "Data Analytics Course", description: "8-week data analytics bootcamp", price: 120000, image: "", category: "Courses", portal: "community", stockStatus: "in_stock", active: true },
    { name: "Tree Planting Drive", description: "Monthly tree planting initiative", price: 0, image: "", category: "Volunteer Areas", portal: "community", stockStatus: "in_stock", active: true },
    // Logistics
    { name: "Same-day Delivery", description: "Delivery within Lagos same day", price: 3500, image: "", category: "Delivery", portal: "logistics", stockStatus: "in_stock", active: true },
    { name: "Bulk Pickup", description: "Scheduled bulk item pickup", price: 8000, image: "", category: "Delivery", portal: "logistics", stockStatus: "in_stock", active: true },
    { name: "Cold Chain Delivery", description: "Temperature-controlled delivery", price: 12000, image: "", category: "Delivery", portal: "logistics", stockStatus: "in_stock", active: true },
    { name: "Next-day Delivery", description: "Guaranteed next business day", price: 2500, image: "", category: "Delivery", portal: "logistics", stockStatus: "in_stock", active: true },
    { name: "Fragile Item Handling", description: "Special packaging for fragile goods", price: 5000, image: "", category: "Delivery", portal: "logistics", stockStatus: "in_stock", active: true },
    { name: "Document Courier", description: "Express document delivery", price: 1500, image: "", category: "Delivery", portal: "logistics", stockStatus: "in_stock", active: true },
  ];
  return products.map((p, i) => ({ ...p, id: `PRD-${String(i + 1).padStart(3, "0")}` }));
}

// ── Export singleton data ────────────────────────────────────────────────────

export const mockUsers = generateUsers();
export const mockOrders = generateOrders(mockUsers);
export const mockWalletTxns = generateWalletTxns(mockUsers);
export const mockReferrals = generateReferrals(mockUsers);
export const mockNotifications = generateNotifications();
export const mockAuditLog = generateAuditLog();
export const mockSubscriptions = generateSubscriptions(mockUsers);
export const mockProducts = generateProducts();

// ── Format helpers ───────────────────────────────────────────────────────────

export const formatNaira = (n: number) => `₦${n.toLocaleString()}`;
export const formatDate = (d: string) => {
  const date = new Date(d);
  return date.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
};
