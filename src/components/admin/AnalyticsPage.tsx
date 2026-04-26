import { useState, useEffect, useMemo } from "react";
import StatCard from "./shared/StatCard";
import { getUsers, getOrders, getServiceRequestsList, getSubscriptions, getCustomRequestsList } from "../../lib/api";
import { formatNaira, PORTAL_LABELS, PORTAL_COLORS, type Portal } from "../../data/adminMockData";

const card = "bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60";

const tierColors: Record<string, string> = { none: "#94A3B8", bronze: "#8D6E63", silver: "#64748B", gold: "#D97706" };

interface DbProfile { id: string; membership_tier: string; is_active: boolean; created_at: string; role?: string; }
interface DbOrder { id: string; portal_id: string; total_amount: number; status: string; created_at: string; }
interface DbRequest { id: string; status: string; portal_id?: string; }
interface DbSub { status: string; }

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-40 gap-2">
      <span className="material-symbols-outlined text-[40px] text-[#E2E8F0]">bar_chart</span>
      <p className="text-[13px] text-[#94A3B8]">No {label} data yet</p>
    </div>
  );
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<DbProfile[]>([]);
  const [orders, setOrders] = useState<DbOrder[]>([]);
  const [requests, setRequests] = useState<DbRequest[]>([]);
  const [customRequests, setCustomRequests] = useState<DbRequest[]>([]);
  const [subscriptions, setSubscriptions] = useState<DbSub[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [usersRes, ordersRes, reqRes, customRes, subsRes] = await Promise.all([
        getUsers(),
        getOrders(),
        getServiceRequestsList(),
        getCustomRequestsList(),
        getSubscriptions(),
      ]);
      if (cancelled) return;
      setUsers(((usersRes.data ?? []) as DbProfile[]).filter((u) => u.role === "user" || !u.role));
      setOrders((ordersRes.data as DbOrder[]) ?? []);
      setRequests((reqRes.data as DbRequest[]) ?? []);
      setCustomRequests((customRes.data as DbRequest[]) ?? []);
      setSubscriptions((subsRes.data as DbSub[]) ?? []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  // ── User metrics ──
  const totalUsers = users.length;
  const thisMonth = new Date().toISOString().slice(0, 7);
  const newUsersThisMonth = users.filter((u) => u.created_at.startsWith(thisMonth)).length;
  const activeMembers = subscriptions.filter((s) => s.status === "active").length;

  const tierCounts = useMemo(() => {
    const map: Record<string, number> = { none: 0, bronze: 0, silver: 0, gold: 0 };
    users.forEach((u) => { const t = u.membership_tier || "none"; map[t] = (map[t] || 0) + 1; });
    return map;
  }, [users]);

  // ── Order metrics ──
  const completedOrders = orders.filter((o) => o.status === "completed").length;
  const processingOrders = orders.filter((o) => o.status === "processing" || o.status === "confirmed").length;
  const cancelledOrders = orders.filter((o) => o.status === "cancelled").length;
  const completionRate = orders.length > 0 ? Math.round((completedOrders / orders.length) * 100) : 0;

  // ── Request metrics ──
  const completedRequests = requests.filter((r) => r.status === "completed").length;
  const declinedRequests = requests.filter((r) => r.status === "declined").length;
  const pendingRequests = requests.filter((r) => r.status === "new" || r.status === "reviewing").length;
  const requestCompletionRate = requests.length > 0 ? Math.round((completedRequests / requests.length) * 100) : 0;
  const convertedCustom = customRequests.filter((r) => r.status === "converted").length;
  const customConversionRate = customRequests.length > 0 ? Math.round((convertedCustom / customRequests.length) * 100) : 0;

  // ── Orders by portal ──
  const ordersByPortal = useMemo(() => {
    const map: Record<string, number> = {};
    orders.forEach((o) => { map[o.portal_id] = (map[o.portal_id] || 0) + 1; });
    return (Object.keys(PORTAL_LABELS) as Portal[])
      .map((p) => ({ portal: p, count: map[p] || 0 }))
      .sort((a, b) => b.count - a.count);
  }, [orders]);

  const maxPortalOrders = Math.max(...ordersByPortal.map((r) => r.count), 1);

  // ── Revenue by portal ──
  const revenueByPortal = useMemo(() => {
    const map: Record<string, number> = {};
    orders.filter((o) => o.status === "completed").forEach((o) => {
      map[o.portal_id] = (map[o.portal_id] || 0) + o.total_amount;
    });
    return map;
  }, [orders]);

  const totalRevenue = Object.values(revenueByPortal).reduce((s, v) => s + v, 0);

  // ── User growth — last 6 months ──
  const monthlyUsers = useMemo(() => {
    const months: { label: string; key: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push({ label: d.toLocaleString("default", { month: "short" }), key: d.toISOString().slice(0, 7) });
    }
    return months.map((m) => ({
      label: m.label,
      count: users.filter((u) => u.created_at.startsWith(m.key)).length,
    }));
  }, [users]);

  const maxMonthlyUsers = Math.max(...monthlyUsers.map((m) => m.count), 1);

  if (loading) {
    return (
      <div className="space-y-4">
        <div><h1 className="text-xl font-bold text-[#0F172A]">Analytics</h1></div>
        <div className="py-20 text-center text-[#94A3B8] text-sm">Loading analytics…</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#0F172A]">Analytics</h1>
        <p className="text-sm text-[#64748B] mt-0.5">User activity, fulfillment performance, and revenue metrics</p>
      </div>

      {/* Top stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <StatCard label="Total Users" value={totalUsers === 0 ? "0" : totalUsers.toLocaleString()} icon="group" color="#0D47A1" trend={{ value: `${newUsersThisMonth} this month`, positive: true }} />
        <StatCard label="Total Orders" value={String(orders.length)} icon="receipt_long" color="#1B5E20" trend={{ value: `${completedOrders} completed, ${processingOrders} active`, positive: orders.length > 0 }} />
        <StatCard label="Order Completion" value={`${completionRate}%`} icon="check_circle" color="#059669" trend={{ value: orders.length > 0 ? `${completedOrders}/${orders.length}` : "No orders yet", positive: completionRate > 70 }} />
        <StatCard label="Active Members" value={String(activeMembers)} icon="card_membership" color="#E65100" trend={{ value: `${pendingRequests} requests pending`, positive: false }} />
      </div>

      {/* Row 1: User Growth + Membership Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
        {/* New Users per Month */}
        <div className={`${card} p-3.5 sm:p-5 md:p-6`}>
          <h3 className="text-[15px] font-bold text-[#0F172A] mb-5">New Users per Month</h3>
          {totalUsers === 0 ? <EmptyChart label="user growth" /> : (
            <div className="flex items-end gap-1 sm:gap-2 md:gap-3">
              {monthlyUsers.map((m) => {
                const pct = Math.max((m.count / maxMonthlyUsers) * 100, m.count > 0 ? 4 : 0);
                return (
                  <div key={m.label} className="flex-1 min-w-0 flex flex-col items-center gap-1">
                    <span className="text-[10px] font-bold text-[#0F172A] hidden sm:block">{m.count}</span>
                    <div className="w-full relative h-40 sm:h-48 bg-[#F1F5F9] rounded-t-lg overflow-hidden">
                      <div className="absolute bottom-0 inset-x-0 bg-[#0D47A1] rounded-t-lg transition-all" style={{ height: `${pct}%` }} />
                    </div>
                    <span className="text-[11px] font-semibold text-[#64748B]">{m.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Membership Distribution */}
        <div className={`${card} p-3.5 sm:p-5 md:p-6`}>
          <h3 className="text-[15px] font-bold text-[#0F172A] mb-5">Membership Distribution</h3>
          {totalUsers === 0 ? <EmptyChart label="membership" /> : (
            <>
              <div className="flex items-center justify-center mb-6">
                <div className="relative size-32 sm:size-40">
                  <div
                    className="size-full rounded-full"
                    style={{
                      background: `conic-gradient(
                        ${tierColors.gold} 0% ${(tierCounts.gold / totalUsers) * 100}%,
                        ${tierColors.silver} ${(tierCounts.gold / totalUsers) * 100}% ${((tierCounts.gold + tierCounts.silver) / totalUsers) * 100}%,
                        ${tierColors.bronze} ${((tierCounts.gold + tierCounts.silver) / totalUsers) * 100}% ${((tierCounts.gold + tierCounts.silver + tierCounts.bronze) / totalUsers) * 100}%,
                        ${tierColors.none} ${((tierCounts.gold + tierCounts.silver + tierCounts.bronze) / totalUsers) * 100}% 100%
                      )`,
                    }}
                  />
                  <div className="absolute inset-3 sm:inset-4 bg-white rounded-full flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-lg font-extrabold text-[#0F172A]">{activeMembers}</p>
                      <p className="text-[10px] text-[#64748B]">Members</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(["gold", "silver", "bronze", "none"] as const).map((tier) => (
                  <div key={tier} className="flex items-center gap-2">
                    <span className="size-3 rounded-full flex-shrink-0" style={{ backgroundColor: tierColors[tier] }} />
                    <span className="text-[12px] sm:text-[13px] text-[#334155] capitalize">{tier === "none" ? "No Tier" : tier}: {tierCounts[tier]}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Row 2: Fulfillment Performance + Orders by Portal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
        {/* Fulfillment Performance */}
        <div className={`${card} p-3.5 sm:p-5 md:p-6`}>
          <h3 className="text-[15px] font-bold text-[#0F172A] mb-5">Fulfillment Performance</h3>
          {orders.length === 0 && requests.length === 0 ? <EmptyChart label="fulfillment" /> : (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[13px] font-medium text-[#334155]">Orders Completed</span>
                  <span className="text-[13px] font-bold text-[#0F172A]">{completedOrders}/{orders.length} ({completionRate}%)</span>
                </div>
                <div className="h-3 bg-[#F1F5F9] rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-[#059669]" style={{ width: `${completionRate}%` }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[13px] font-medium text-[#334155]">In Progress</span>
                  <span className="text-[13px] font-bold text-[#EA580C]">{processingOrders} orders</span>
                </div>
                <div className="h-3 bg-[#F1F5F9] rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-[#EA580C]" style={{ width: orders.length > 0 ? `${(processingOrders / orders.length) * 100}%` : "0%" }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[13px] font-medium text-[#334155]">Cancelled</span>
                  <span className="text-[13px] font-bold text-[#DC2626]">{cancelledOrders} orders</span>
                </div>
                <div className="h-3 bg-[#F1F5F9] rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-[#DC2626]" style={{ width: orders.length > 0 ? `${(cancelledOrders / orders.length) * 100}%` : "0%" }} />
                </div>
              </div>
              <div className="pt-2 border-t border-[#F1F5F9]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[13px] font-medium text-[#334155]">Requests Resolved</span>
                  <span className="text-[13px] font-bold text-[#0F172A]">{completedRequests}/{requests.length} ({requestCompletionRate}%)</span>
                </div>
                <div className="h-3 bg-[#F1F5F9] rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-[#2563EB]" style={{ width: `${requestCompletionRate}%` }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[13px] font-medium text-[#334155]">Custom Order Conversion</span>
                  <span className="text-[13px] font-bold text-[#0F172A]">{convertedCustom}/{customRequests.length} ({customConversionRate}%)</span>
                </div>
                <div className="h-3 bg-[#F1F5F9] rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-[#7C3AED]" style={{ width: `${customConversionRate}%` }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Orders by Portal */}
        <div className={`${card} p-3.5 sm:p-5 md:p-6`}>
          <h3 className="text-[15px] font-bold text-[#0F172A] mb-5">Orders by Portal</h3>
          {orders.length === 0 ? <EmptyChart label="portal order" /> : (
            <div className="space-y-3">
              {ordersByPortal.map((item) => {
                const pct = orders.length > 0 ? Math.round((item.count / orders.length) * 100) : 0;
                return (
                  <div key={item.portal}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="size-2.5 rounded-full" style={{ backgroundColor: PORTAL_COLORS[item.portal] }} />
                        <span className="text-[11px] sm:text-[13px] font-medium text-[#334155] truncate">{PORTAL_LABELS[item.portal]}</span>
                      </div>
                      <span className="text-[13px] font-bold text-[#0F172A]">{item.count} ({pct}%)</span>
                    </div>
                    <div className="h-2.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(item.count / maxPortalOrders) * 100}%`, backgroundColor: PORTAL_COLORS[item.portal] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Row 3: Revenue by Portal + Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
        {/* Revenue breakdown */}
        <div className={`${card} p-3.5 sm:p-5 md:p-6`}>
          <h3 className="text-[15px] font-bold text-[#0F172A] mb-5">Revenue by Portal</h3>
          {totalRevenue === 0 ? <EmptyChart label="revenue" /> : (
            <div className="space-y-3">
              {(Object.keys(PORTAL_LABELS) as Portal[]).filter((p) => revenueByPortal[p] > 0).map((portal) => {
                const rev = revenueByPortal[portal] ?? 0;
                const pct = totalRevenue > 0 ? Math.round((rev / totalRevenue) * 100) : 0;
                return (
                  <div key={portal}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="size-2.5 rounded-full" style={{ backgroundColor: PORTAL_COLORS[portal] }} />
                        <span className="text-[13px] font-medium text-[#334155]">{PORTAL_LABELS[portal]}</span>
                      </div>
                      <span className="text-[13px] font-bold text-[#0F172A]">{formatNaira(rev)} ({pct}%)</span>
                    </div>
                    <div className="h-2.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: PORTAL_COLORS[portal] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Summary stats */}
        <div className={`${card} p-3.5 sm:p-5 md:p-6`}>
          <h3 className="text-[15px] font-bold text-[#0F172A] mb-5">Platform Summary</h3>
          <div className="space-y-3">
            {[
              { label: "Total Revenue", value: formatNaira(totalRevenue), color: "#059669" },
              { label: "Total Orders", value: String(orders.length), color: "#0F172A" },
              { label: "Active Members", value: String(activeMembers), color: "#0D47A1" },
              { label: "Pending Requests", value: String(pendingRequests), color: "#EA580C" },
              { label: "Declined Requests", value: String(declinedRequests), color: "#DC2626" },
              { label: "Cancellation Rate", value: orders.length > 0 ? `${Math.round((cancelledOrders / orders.length) * 100)}%` : "0%", color: "#DC2626" },
            ].map((row) => (
              <div key={row.label} className="flex justify-between items-center py-2 border-b border-[#F1F5F9] last:border-0">
                <span className="text-[13px] text-[#64748B]">{row.label}</span>
                <span className="text-[13px] font-bold" style={{ color: row.color }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
