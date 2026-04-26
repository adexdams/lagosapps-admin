export interface PagePrivilege {
  key: string;
  label: string;
  icon: string;
  description: string;
}

export const PAGE_PRIVILEGES: PagePrivilege[] = [
  { key: "overview",       label: "Overview",       icon: "space_dashboard",       description: "Dashboard home — stats, revenue chart, quick actions" },
  { key: "users",          label: "Users",           icon: "group",                 description: "View and manage user accounts" },
  { key: "orders",         label: "Orders",          icon: "receipt_long",          description: "Create, update, and fulfill orders" },
  { key: "inventory",      label: "Inventory",       icon: "inventory_2",           description: "Add and edit products across all portals" },
  { key: "membership",     label: "Membership",      icon: "card_membership",       description: "Tier config, subscriptions, and benefit usage" },
  { key: "wallet",         label: "Wallet",          icon: "account_balance_wallet",description: "Transaction log and manual wallet adjustments" },
  { key: "referrals",      label: "Referrals",       icon: "group_add",             description: "Referral tracking and promo codes" },
  { key: "broadcast",      label: "Broadcast",       icon: "campaign",              description: "Compose and send broadcast messages to users" },
  { key: "carts",          label: "Live Carts",      icon: "shopping_cart",         description: "View active and abandoned user carts in real time" },
  { key: "finance",        label: "Finance",         icon: "payments",              description: "Revenue overview, wallet transactions, and reports" },
  { key: "analytics",      label: "Analytics",       icon: "analytics",             description: "Charts and growth metrics across all portals" },
  { key: "team",           label: "Team",            icon: "people",                description: "Invite team members and manage privileges" },
  { key: "audit",          label: "Audit Log",       icon: "history",               description: "Full log of admin actions with before/after values" },
  { key: "notifications",  label: "Notifications",   icon: "notifications",         description: "Admin notifications inbox and system alerts" },
  { key: "settings",       label: "Settings",        icon: "settings",              description: "Platform settings, portal toggles, and alert prefs" },
];

// Default page access per role when no explicit privilege rows have been saved yet.
// super_admin always gets full access and bypasses this table entirely.
export const ROLE_DEFAULT_PRIVILEGES: Record<string, string[]> = {
  super_admin:  PAGE_PRIVILEGES.map((p) => p.key),
  operations:   ["overview", "users", "orders", "inventory", "carts", "notifications", "broadcast"],
  support:      ["overview", "users", "orders", "notifications"],
  finance:      ["overview", "finance", "wallet", "analytics"],
  tech:         ["overview", "inventory", "settings", "audit", "analytics"],
};

/**
 * Returns true if the given privilege map (from AdminProfile.privileges) grants
 * access to a page, falling back to role defaults when no explicit rows exist.
 */
export function hasPrivilege(
  key: string,
  role: string,
  privileges: Record<string, boolean>
): boolean {
  if (role === "super_admin") return true;
  // Explicit DB row takes precedence
  if (key in privileges) return privileges[key];
  // Fall back to role default
  return (ROLE_DEFAULT_PRIVILEGES[role] ?? []).includes(key);
}
