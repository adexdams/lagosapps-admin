import { supabase } from "./supabase";

// ── Auth ────────────────────────────────────────────────────

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function getSession() {
  return supabase.auth.getSession();
}

export function onAuthStateChange(callback: (event: string, session: unknown) => void) {
  return supabase.auth.onAuthStateChange(callback);
}

// ── Users ───────────────────────────────────────────────────

export async function getUsers() {
  return supabase.from("users").select("*").order("created_at", { ascending: false });
}

export async function getUser(id: string) {
  return supabase.from("users").select("*").eq("id", id).single();
}

export async function updateUser(id: string, data: Record<string, unknown>) {
  return supabase.from("users").update(data).eq("id", id);
}

// ── Orders ──────────────────────────────────────────────────

export async function getOrders() {
  return supabase.from("orders").select("*, order_items(*)").order("created_at", { ascending: false });
}

export async function getOrder(id: string) {
  return supabase.from("orders").select("*, order_items(*), order_timeline(*)").eq("id", id).single();
}

export async function updateOrderStatus(id: string, status: string) {
  return supabase.from("orders").update({ status }).eq("id", id);
}

export async function createOrder(data: Record<string, unknown>) {
  return supabase.from("orders").insert(data).select().single();
}

// ── Products ────────────────────────────────────────────────

export async function getProducts(portalId?: string) {
  let query = supabase.from("products").select("*, product_categories(name, slug)").order("created_at", { ascending: false });
  if (portalId) query = query.eq("portal_id", portalId);
  return query;
}

export async function getProduct(id: string) {
  return supabase.from("products").select("*").eq("id", id).single();
}

export async function createProduct(data: Record<string, unknown>) {
  return supabase.from("products").insert(data).select().single();
}

export async function updateProduct(id: string, data: Record<string, unknown>) {
  return supabase.from("products").update(data).eq("id", id);
}

export async function deleteProduct(id: string) {
  return supabase.from("products").delete().eq("id", id);
}

// ── Service Portals ─────────────────────────────────────────

export async function getPortals() {
  return supabase.from("service_portals").select("*").order("sort_order");
}

export async function updatePortal(id: string, data: Record<string, unknown>) {
  return supabase.from("service_portals").update(data).eq("id", id);
}

// ── Product Categories ──────────────────────────────────────

export async function getCategories(portalId?: string) {
  let query = supabase.from("product_categories").select("*").order("sort_order");
  if (portalId) query = query.eq("portal_id", portalId);
  return query;
}

// ── Wallet Transactions ─────────────────────────────────────

export async function getWalletTransactions(userId?: string) {
  let query = supabase.from("wallet_transactions").select("*").order("created_at", { ascending: false });
  if (userId) query = query.eq("user_id", userId);
  return query;
}

export async function createWalletTransaction(data: Record<string, unknown>) {
  return supabase.from("wallet_transactions").insert(data).select().single();
}

// ── Membership ──────────────────────────────────────────────

export async function getMembershipTiers() {
  return supabase.from("membership_tiers").select("*, membership_tier_benefits(*)").order("sort_order");
}

export async function updateMembershipTier(id: string, data: Record<string, unknown>) {
  return supabase.from("membership_tiers").update(data).eq("id", id);
}

export async function getSubscriptions() {
  return supabase.from("membership_subscriptions").select("*, users(name, email, avatar_url)").order("created_at", { ascending: false });
}

export async function getBenefitUsage(userId?: string) {
  let query = supabase.from("membership_benefit_usage").select("*");
  if (userId) query = query.eq("user_id", userId);
  return query;
}

// ── Referrals ───────────────────────────────────────────────

export async function getReferrals() {
  return supabase.from("referrals").select("*").order("created_at", { ascending: false });
}

// ── Service Requests ────────────────────────────────────────

export async function getServiceRequests() {
  return supabase.from("service_requests").select("*, service_request_notes(*)").order("created_at", { ascending: false });
}

export async function getServiceRequest(id: string) {
  return supabase.from("service_requests").select("*, service_request_notes(*)").eq("id", id).single();
}

export async function updateServiceRequest(id: string, data: Record<string, unknown>) {
  return supabase.from("service_requests").update(data).eq("id", id);
}

// ── Custom Order Requests ───────────────────────────────────

export async function getCustomRequests() {
  return supabase.from("custom_order_requests").select("*, custom_request_notes(*)").order("created_at", { ascending: false });
}

export async function updateCustomRequest(id: string, data: Record<string, unknown>) {
  return supabase.from("custom_order_requests").update(data).eq("id", id);
}

// ── Fulfillment ─────────────────────────────────────────────

export async function getFulfillmentTracking() {
  return supabase.from("fulfillment_tracking").select("*, orders(*, users(name)), fulfillment_notes(*)").order("created_at", { ascending: false });
}

export async function updateFulfillmentTracking(id: string, data: Record<string, unknown>) {
  return supabase.from("fulfillment_tracking").update(data).eq("id", id);
}

// ── Carts ───────────────────────────────────────────────────

export async function getCarts() {
  return supabase.from("carts").select("*, cart_items(*), users(name, email, membership_tier, avatar_url)").order("updated_at", { ascending: false });
}

// ── Broadcasts ──────────────────────────────────────────────

export async function getBroadcasts() {
  return supabase.from("broadcasts").select("*").order("created_at", { ascending: false });
}

export async function getBroadcast(id: string) {
  return supabase.from("broadcasts").select("*, broadcast_recipients(*)").eq("id", id).single();
}

export async function createBroadcast(data: Record<string, unknown>) {
  return supabase.from("broadcasts").insert(data).select().single();
}

export async function updateBroadcast(id: string, data: Record<string, unknown>) {
  return supabase.from("broadcasts").update(data).eq("id", id);
}

// ── System Notifications (admin internal) ───────────────────

export async function getSystemNotifications(adminId: string) {
  return supabase.from("system_notifications").select("*").eq("recipient_id", adminId).order("created_at", { ascending: false });
}

export async function markSystemNotificationRead(id: string) {
  return supabase.from("system_notifications").update({ read: true }).eq("id", id);
}

export async function markAllSystemNotificationsRead(adminId: string) {
  return supabase.from("system_notifications").update({ read: true }).eq("recipient_id", adminId).eq("read", false);
}

// ── Notification Preferences ────────────────────────────────

export async function getNotificationPreferences(adminId: string) {
  return supabase.from("notification_preferences").select("*").eq("admin_id", adminId);
}

export async function upsertNotificationPreference(data: Record<string, unknown>) {
  return supabase.from("notification_preferences").upsert(data, { onConflict: "admin_id,category" });
}

// ── User Notifications ──────────────────────────────────────

export async function getUserNotifications(userId: string) {
  return supabase.from("user_notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false });
}

// ── Team ────────────────────────────────────────────────────

export async function getTeamMembers() {
  return supabase.from("admin_team_members").select("*, users(name, email, avatar_url), admin_team_privileges(*)").order("created_at");
}

export async function createTeamMember(data: Record<string, unknown>) {
  return supabase.from("admin_team_members").insert(data).select().single();
}

export async function updateTeamMember(id: string, data: Record<string, unknown>) {
  return supabase.from("admin_team_members").update(data).eq("id", id);
}

export async function upsertTeamPrivileges(privileges: Record<string, unknown>[]) {
  return supabase.from("admin_team_privileges").upsert(privileges, { onConflict: "team_member_id,privilege_key" });
}

// ── Audit Log ───────────────────────────────────────────────

export async function getAuditLog() {
  return supabase.from("admin_audit_log").select("*, users(name)").order("created_at", { ascending: false });
}

export async function createAuditEntry(data: Record<string, unknown>) {
  return supabase.from("admin_audit_log").insert(data);
}

// ── Platform Settings ───────────────────────────────────────

export async function getSettings() {
  return supabase.from("platform_settings").select("*");
}

export async function updateSetting(key: string, value: string, updatedBy?: string) {
  return supabase.from("platform_settings").update({ value, updated_by: updatedBy }).eq("key", key);
}

// ── Storage ─────────────────────────────────────────────────

export async function uploadFile(bucket: string, path: string, file: File) {
  return supabase.storage.from(bucket).upload(path, file, { upsert: true });
}

export function getPublicUrl(bucket: string, path: string) {
  return supabase.storage.from(bucket).getPublicUrl(path);
}
