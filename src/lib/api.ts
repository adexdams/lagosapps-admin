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
  return supabase.from("profiles").select("*").order("created_at", { ascending: false });
}

export async function getUser(id: string) {
  return supabase.from("profiles").select("*").eq("id", id).single();
}

export async function updateUser(id: string, data: Record<string, unknown>) {
  return supabase.from("profiles").update(data).eq("id", id);
}

// ── Orders ──────────────────────────────────────────────────

export async function getOrders() {
  return supabase
    .from("orders")
    .select("*, profiles!user_id(name, email, avatar_url)")
    .order("created_at", { ascending: false });
}

export async function getOrder(id: string) {
  return supabase
    .from("orders")
    .select("*, order_items(*), order_timeline(*, profiles(name, email)), profiles!user_id(id, name, email, avatar_url, phone, membership_tier)")
    .eq("id", id)
    .single();
}

export async function updateOrderStatus(id: string, status: string) {
  return supabase.from("orders").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
}

export async function createOrder(data: Record<string, unknown>) {
  return supabase.from("orders").insert(data).select().single();
}

export async function insertOrderItems(items: Record<string, unknown>[]) {
  return supabase.from("order_items").insert(items);
}

export async function insertOrderTimelineStep(step: Record<string, unknown>) {
  return supabase.from("order_timeline").insert(step);
}

// Shared between admin + user-facing repos — both apps must produce
// identical 17-char IDs so cross-repo joins and searches work.
// Format: ORD-{8 chars time32}{4 chars random}
// Epoch-offset timestamp keeps the time component at 8 chars through ~2058.
const ORDER_ID_EPOCH = 1704067200000; // 2024-01-01T00:00:00Z

export function generateOrderId(): string {
  const time = (Date.now() - ORDER_ID_EPOCH).toString(32).toUpperCase().padStart(8, "0").slice(-8);
  const rand = Math.floor(Math.random() * (32 ** 4)).toString(32).toUpperCase().padStart(4, "0");
  return `ORD-${time}${rand}`;
}

export function generateTxnId(): string {
  const time = (Date.now() - ORDER_ID_EPOCH).toString(32).toUpperCase().padStart(8, "0").slice(-8);
  const rand = Math.floor(Math.random() * (32 ** 4)).toString(32).toUpperCase().padStart(4, "0");
  return `TXN-${time}${rand}`;
}

// ── Fulfillment ─────────────────────────────────────────────

export async function getFulfillmentOrders() {
  return supabase
    .from("orders")
    .select("*, profiles!user_id(name, email), fulfillment_tracking(*)")
    .in("status", ["pending", "confirmed", "processing"])
    .order("created_at", { ascending: false });
}

export async function getFulfillmentTrackingByOrder(orderId: string) {
  return supabase
    .from("fulfillment_tracking")
    .select("*")
    .eq("order_id", orderId)
    .maybeSingle();
}

export async function getFulfillmentNotesByOrder(orderId: string) {
  return supabase
    .from("fulfillment_notes")
    .select("*, profiles!author_id(name, email)")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false });
}

export async function upsertFulfillmentTracking(data: Record<string, unknown>) {
  return supabase.from("fulfillment_tracking").upsert(data, { onConflict: "order_id" }).select().single();
}

export async function addFulfillmentNote(data: Record<string, unknown>) {
  return supabase.from("fulfillment_notes").insert(data).select().single();
}

// ── Service Requests ────────────────────────────────────────

export async function getServiceRequestsList() {
  return supabase
    .from("service_requests")
    .select("*, profiles!user_id(name, email)")
    .order("created_at", { ascending: false });
}

export async function updateServiceRequestStatus(id: string, data: Record<string, unknown>) {
  return supabase.from("service_requests").update(data).eq("id", id);
}

// ── Custom Order Requests ──────────────────────────────────

export async function getCustomRequestsList() {
  return supabase
    .from("custom_order_requests")
    .select("*, profiles!user_id(id, name, email)")
    .order("created_at", { ascending: false });
}

export async function updateCustomRequestStatus(id: string, data: Record<string, unknown>) {
  return supabase.from("custom_order_requests").update(data).eq("id", id);
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
  let query = supabase.from("wallet_transactions")
    .select("*, user_profile:profiles!wallet_transactions_user_id_fkey(name, email)")
    .order("created_at", { ascending: false });
  if (userId) query = query.eq("user_id", userId);
  return query;
}

export async function createWalletTransaction(data: Record<string, unknown>) {
  return supabase.from("wallet_transactions").insert(data).select().single();
}

export async function updateUserWalletBalance(userId: string, newBalance: number) {
  return supabase.from("profiles").update({ wallet_balance: newBalance }).eq("id", userId);
}

// ── Membership ──────────────────────────────────────────────

export async function getMembershipTiers() {
  return supabase.from("membership_tiers").select("*, membership_tier_benefits(*)").order("sort_order");
}

export async function updateMembershipTier(id: string, data: Record<string, unknown>) {
  return supabase.from("membership_tiers").update(data).eq("id", id);
}

export async function getSubscriptions() {
  return supabase.from("membership_subscriptions").select("*, profiles(name, email, avatar_url)").order("created_at", { ascending: false });
}

export async function getBenefitUsage(userId?: string) {
  let query = supabase.from("membership_benefit_usage").select("*");
  if (userId) query = query.eq("user_id", userId);
  return query;
}

// ── Referrals ───────────────────────────────────────────────

export async function getReferrals() {
  return supabase.from("referrals")
    .select("*, referrer:profiles!referrer_id(name, email), referred:profiles!referred_id(name, email)")
    .order("created_at", { ascending: false });
}

// ── Admin Referral Codes ─────────────────────────────────────

export async function getAdminReferralCodes() {
  return supabase
    .from("admin_referral_codes")
    .select("*, creator:profiles!created_by(name, email)")
    .order("created_at", { ascending: false });
}

export async function createAdminReferralCode(data: {
  code: string;
  gifted_tier: string;
  max_uses: number | null;
  expires_at: string | null;
  description: string | null;
  created_by: string;
}) {
  return supabase.from("admin_referral_codes").insert(data).select().single();
}

export async function updateAdminReferralCode(id: string, data: Record<string, unknown>) {
  return supabase.from("admin_referral_codes").update(data).eq("id", id);
}

export async function getAdminCodeRedemptions(codeId: string) {
  return supabase
    .from("admin_code_redemptions")
    .select("*, profiles(name, email)")
    .eq("code_id", codeId)
    .order("redeemed_at", { ascending: false });
}

export async function updateMembershipTierBenefit(id: string, data: Record<string, unknown>) {
  return supabase.from("membership_tier_benefits").update(data).eq("id", id);
}

export async function createMembershipTierBenefit(data: Record<string, unknown>) {
  return supabase.from("membership_tier_benefits").insert(data).select().single();
}

export async function deleteMembershipTierBenefit(id: string) {
  return supabase.from("membership_tier_benefits").delete().eq("id", id);
}

export async function createMembershipSubscription(data: Record<string, unknown>) {
  return supabase.from("membership_subscriptions").insert(data).select().single();
}

export async function cancelMembershipSubscription(id: string) {
  return supabase.from("membership_subscriptions").update({ status: "cancelled" }).eq("id", id);
}

export async function cancelUserSubscriptions(userId: string) {
  return supabase.from("membership_subscriptions").update({ status: "cancelled" }).eq("user_id", userId).eq("status", "active");
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

export async function addServiceRequestNote(data: Record<string, unknown>) {
  return supabase.from("service_request_notes").insert(data).select().single();
}

// ── Custom Order Requests ───────────────────────────────────

export async function getCustomRequests() {
  return supabase.from("custom_order_requests").select("*, custom_request_notes(*)").order("created_at", { ascending: false });
}

export async function updateCustomRequest(id: string, data: Record<string, unknown>) {
  return supabase.from("custom_order_requests").update(data).eq("id", id);
}

export async function getCustomRequestDetail(id: string) {
  return supabase
    .from("custom_order_requests")
    .select("*, profiles!user_id(id, name, email, avatar_url), custom_request_notes(*, profiles!author_id(name))")
    .eq("id", id)
    .single();
}

export async function addCustomRequestNote(requestId: string, authorId: string, text: string) {
  return supabase.from("custom_request_notes").insert({ request_id: requestId, author_id: authorId, text });
}

// ── Fulfillment ─────────────────────────────────────────────

export async function getFulfillmentTracking() {
  return supabase.from("fulfillment_tracking").select("*, orders(*, profiles!user_id(name)), fulfillment_notes(*)").order("created_at", { ascending: false });
}

export async function updateFulfillmentTracking(id: string, data: Record<string, unknown>) {
  return supabase.from("fulfillment_tracking").update(data).eq("id", id);
}

// ── Carts ───────────────────────────────────────────────────

export async function getCarts() {
  return supabase.from("carts").select("*, cart_items(*), profiles(name, email, membership_tier, avatar_url)").order("updated_at", { ascending: false });
}

// ── Broadcasts ──────────────────────────────────────────────

export async function getBroadcasts() {
  // Aggregate recipient count + read count in a single query using select with count
  return supabase
    .from("broadcasts")
    .select("*, recipients:broadcast_recipients(count), reads:broadcast_recipients!inner(count)", { count: "exact" })
    .order("created_at", { ascending: false });
}

export async function getBroadcastsList() {
  // Simpler query: fetch broadcasts; counts come from a separate fetch to avoid the
  // complicated inline aggregation (Supabase PostgREST can't count reads separately
  // from a single join without RPC).
  return supabase.from("broadcasts").select("*").order("created_at", { ascending: false });
}

export async function getBroadcastRecipientStats(broadcastId: string) {
  const { data, error } = await supabase
    .from("broadcast_recipients")
    .select("delivered, read")
    .eq("broadcast_id", broadcastId);
  if (error) return { total: 0, delivered: 0, read: 0, error };
  const rows = (data ?? []) as { delivered: boolean; read: boolean }[];
  return {
    total: rows.length,
    delivered: rows.filter((r) => r.delivered).length,
    read: rows.filter((r) => r.read).length,
    error: null,
  };
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

/**
 * Resolve recipient user IDs based on the broadcast's targeting rule.
 * Returns an array of { id, email, name } — feeds the fan-out step.
 */
export async function resolveBroadcastRecipients(
  recipientsType: "all" | "tier" | "specific",
  filter: { tiers?: string[]; user_id?: string }
): Promise<{ id: string; email: string; name: string | null }[]> {
  let q = supabase.from("profiles").select("id, email, name").eq("is_active", true).eq("role", "user");
  if (recipientsType === "tier" && filter.tiers && filter.tiers.length > 0) {
    q = q.in("membership_tier", filter.tiers);
  } else if (recipientsType === "specific" && filter.user_id) {
    q = q.eq("id", filter.user_id);
  }
  const { data, error } = await q;
  if (error || !data) return [];
  return data as { id: string; email: string; name: string | null }[];
}

/**
 * Insert broadcast_recipients rows in bulk. Also creates user_notifications
 * so the message appears in each user's in-app inbox.
 */
export async function fanOutBroadcast(
  broadcastId: string,
  recipients: { id: string }[],
  broadcastTitle: string,
  broadcastMessage: string,
  imageUrl?: string | null
) {
  if (recipients.length === 0) return { count: 0, error: null };

  const recipientRows = recipients.map((r) => ({
    broadcast_id: broadcastId,
    user_id: r.id,
    delivered: true, // we just created them; email attempt follows
    read: false,
  }));

  const notificationRows = recipients.map((r) => ({
    user_id: r.id,
    type: "broadcast" as const,
    title: broadcastTitle,
    message: broadcastMessage,
    entity_type: "broadcast",
    entity_id: broadcastId,
    image_url: imageUrl ?? null,
    read: false,
    retracted: false,
  }));

  const [recRes, notifRes] = await Promise.all([
    supabase.from("broadcast_recipients").insert(recipientRows),
    supabase.from("user_notifications").insert(notificationRows),
  ]);

  if (recRes.error) return { count: 0, error: recRes.error };
  if (notifRes.error) return { count: recipients.length, error: notifRes.error };
  return { count: recipients.length, error: null };
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
  return supabase.from("admin_team_members").select("*, profiles(name, email, avatar_url), admin_team_privileges(*)").order("created_at");
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
  return supabase.from("admin_audit_log").select("*, profiles(name)").order("created_at", { ascending: false });
}

export async function createAuditEntry(data: Record<string, unknown>) {
  return supabase.from("admin_audit_log").insert(data);
}

/**
 * Log an admin action to admin_audit_log. Non-blocking — errors are logged
 * to console but never thrown, so a broken audit log can't block real work.
 *
 * Usage:
 *   await logAudit({
 *     action: "product.create",
 *     entity_type: "product",
 *     entity_id: newProduct.id,
 *     new_values: { name, price, portal_id },
 *   });
 */
export async function logAudit(entry: {
  action: string;
  entity_type?: string;
  entity_id?: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  source?: "admin" | "user";
}): Promise<void> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    if (!userId) {
      console.warn("logAudit: no authenticated user, skipping");
      return;
    }
    const { error } = await supabase.from("admin_audit_log").insert({
      admin_user_id: userId,
      action: entry.action,
      entity_type: entry.entity_type ?? null,
      entity_id: entry.entity_id ?? null,
      old_values: entry.old_values ?? null,
      new_values: entry.new_values ?? null,
      source: entry.source ?? "admin",
    });
    if (error) console.error("logAudit failed:", error);
  } catch (e) {
    console.error("logAudit threw:", e);
  }
}

// ── Platform Settings ───────────────────────────────────────

export async function getSettings() {
  return supabase.from("platform_settings").select("*");
}

export async function updateSetting(key: string, value: string, updatedBy?: string) {
  return supabase.from("platform_settings").update({ value, updated_by: updatedBy }).eq("key", key);
}

export async function upsertSetting(key: string, value: string, updatedBy?: string) {
  return supabase.from("platform_settings").upsert({ key, value, updated_by: updatedBy }, { onConflict: "key" });
}

// ── Storage ─────────────────────────────────────────────────

export async function uploadFile(bucket: string, path: string, file: File) {
  return supabase.storage.from(bucket).upload(path, file, { upsert: true });
}

export function getPublicUrl(bucket: string, path: string) {
  return supabase.storage.from(bucket).getPublicUrl(path);
}
