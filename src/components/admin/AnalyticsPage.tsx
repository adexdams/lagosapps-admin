import { useMemo } from "react";
import StatCard from "./shared/StatCard";
import {
  mockOrders,
  mockUsers,
  mockSubscriptions,
  mockServiceRequests,
  mockCustomRequests,
  mockCarts,
  formatNaira,
  PORTAL_LABELS,
  PORTAL_COLORS,
  type Portal,
  type MembershipTier,
} from "../../data/adminMockData";

const card = "bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60";

const TEAM_MEMBERS = ["Damola A.", "Chioma E.", "Kunle A.", "Fatima B.", "Emeka E."];

export default function AnalyticsPage() {
  // ── User metrics ──
  const totalUsers = mockUsers.length;
  const activeUsers = mockUsers.filter((u) => u.status === "active").length;
  const newUsersThisMonth = mockUsers.filter((u) => u.joinedAt >= "2026-04-01").length;
  const activeMembers = mockSubscriptions.filter((s) => s.status === "active").length;

  // Membership distribution
  const tierCounts = useMemo(() => {
    const map: Record<string, number> = { none: 0, bronze: 0, silver: 0, gold: 0 };
    mockUsers.forEach((u) => { map[u.membershipTier] = (map[u.membershipTier] || 0) + 1; });
    return map;
  }, []);

  const tierColors: Record<string, string> = { none: "#94A3B8", bronze: "#8D6E63", silver: "#64748B", gold: "#D97706" };

  // ── Fulfillment metrics ──
  const completedOrders = mockOrders.filter((o) => o.status === "completed").length;
  const processingOrders = mockOrders.filter((o) => o.status === "processing" || o.status === "confirmed").length;
  const cancelledOrders = mockOrders.filter((o) => o.status === "cancelled").length;
  const completionRate = mockOrders.length > 0 ? Math.round((completedOrders / mockOrders.length) * 100) : 0;

  const completedRequests = mockServiceRequests.filter((r) => r.status === "completed").length;
  const declinedRequests = mockServiceRequests.filter((r) => r.status === "declined").length;
  const pendingRequests = mockServiceRequests.filter((r) => r.status === "new" || r.status === "reviewing").length;
  const requestCompletionRate = mockServiceRequests.length > 0 ? Math.round((completedRequests / mockServiceRequests.length) * 100) : 0;

  const convertedCustom = mockCustomRequests.filter((r) => r.status === "converted").length;
  const customConversionRate = mockCustomRequests.length > 0 ? Math.round((convertedCustom / mockCustomRequests.length) * 100) : 0;

  // ── Staff workload ──
  const staffWorkload = useMemo(() => {
    const map: Record<string, { orders: number; requests: number; total: number }> = {};
    TEAM_MEMBERS.forEach((name) => { map[name] = { orders: 0, requests: 0, total: 0 }; });
    mockServiceRequests.forEach((r) => {
      if (r.assignedTo && map[r.assignedTo as string]) {
        map[r.assignedTo as string].requests++;
        map[r.assignedTo as string].total++;
      }
    });
    // Simulate order assignments based on fulfillment pattern
    const activeOrders = mockOrders.filter((o) => o.status === "processing" || o.status === "confirmed");
    activeOrders.forEach((_, i) => {
      const name = TEAM_MEMBERS[i % TEAM_MEMBERS.length];
      if (map[name]) { map[name].orders++; map[name].total++; }
    });
    return Object.entries(map).sort((a, b) => b[1].total - a[1].total);
  }, []);

  const maxWorkload = Math.max(...staffWorkload.map(([, d]) => d.total), 1);

  // ── Orders by portal ──
  const ordersByPortal = useMemo(() => {
    const map: Record<string, number> = {};
    mockOrders.forEach((o) => { map[o.portal] = (map[o.portal] || 0) + 1; });
    return (Object.keys(PORTAL_LABELS) as Portal[])
      .map((p) => ({ portal: p, count: map[p] || 0 }))
      .sort((a, b) => b.count - a.count);
  }, []);

  const maxPortalOrders = Math.max(...ordersByPortal.map((r) => r.count), 1);

  // ── Cart metrics ──
  const activeCarts = mockCarts.length;
  const abandonedCarts = mockCarts.filter((c) => {
    const diff = Date.now() - new Date(c.lastUpdated.replace(" ", "T")).getTime();
    return diff > 24 * 3600000;
  }).length;
  const avgCartValue = activeCarts > 0
    ? Math.round(mockCarts.reduce((sum, c) => sum + c.items.reduce((s, it) => s + it.price * it.quantity, 0), 0) / activeCarts)
    : 0;

  // ── Monthly new users (last 6 months) — realistic growth curve ──
  const monthlyUsers = [
    { label: "Nov", count: 18 },
    { label: "Dec", count: 31 },
    { label: "Jan", count: 45 },
    { label: "Feb", count: 38 },
    { label: "Mar", count: 67 },
    { label: "Apr", count: 82 },
  ];

  const maxMonthlyUsers = Math.max(...monthlyUsers.map((m) => m.count), 1);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#0F172A]">Analytics</h1>
        <p className="text-sm text-[#64748B] mt-0.5">User activity, fulfillment performance, and staff metrics</p>
      </div>

      {/* ── Top stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <StatCard label="Total Users" value={totalUsers.toLocaleString()} icon="group" color="#0D47A1" trend={{ value: `${newUsersThisMonth} this month`, positive: true }} />
        <StatCard label="Active Users" value={String(activeUsers)} icon="person" color="#1B5E20" trend={{ value: `${Math.round((activeUsers / totalUsers) * 100)}% of total`, positive: true }} />
        <StatCard label="Order Completion" value={`${completionRate}%`} icon="check_circle" color="#059669" trend={{ value: `${completedOrders} completed`, positive: completionRate > 70 }} />
        <StatCard label="Active Carts" value={String(activeCarts)} icon="shopping_cart" color="#E65100" trend={{ value: `${abandonedCarts} abandoned`, positive: false }} />
      </div>

      {/* ── Row 1: User Growth + Membership Distribution ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
        {/* New Users per Month */}
        <div className={`${card} p-3.5 sm:p-5 md:p-6`}>
          <h3 className="text-[15px] font-bold text-[#0F172A] mb-5">New Users per Month</h3>
          <div className="flex items-end gap-1 sm:gap-2 md:gap-3">
            {monthlyUsers.map((m) => {
              const pct = Math.max((m.count / maxMonthlyUsers) * 100, 4);
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
        </div>

        {/* Membership Distribution */}
        <div className={`${card} p-3.5 sm:p-5 md:p-6`}>
          <h3 className="text-[15px] font-bold text-[#0F172A] mb-5">Membership Distribution</h3>
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
            {(["gold", "silver", "bronze", "none"] as MembershipTier[]).map((tier) => (
              <div key={tier} className="flex items-center gap-2">
                <span className="size-3 rounded-full flex-shrink-0" style={{ backgroundColor: tierColors[tier] }} />
                <span className="text-[12px] sm:text-[13px] text-[#334155] capitalize">{tier === "none" ? "No Tier" : tier}: {tierCounts[tier]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Row 2: Fulfillment Performance + Staff Workload ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
        {/* Fulfillment Performance */}
        <div className={`${card} p-3.5 sm:p-5 md:p-6`}>
          <h3 className="text-[15px] font-bold text-[#0F172A] mb-5">Fulfillment Performance</h3>
          <div className="space-y-4">
            {/* Order fulfillment */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[13px] font-medium text-[#334155]">Orders Completed</span>
                <span className="text-[13px] font-bold text-[#0F172A]">{completedOrders}/{mockOrders.length} ({completionRate}%)</span>
              </div>
              <div className="h-3 bg-[#F1F5F9] rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-[#059669]" style={{ width: `${completionRate}%` }} />
              </div>
            </div>
            {/* In progress */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[13px] font-medium text-[#334155]">In Progress</span>
                <span className="text-[13px] font-bold text-[#EA580C]">{processingOrders} orders</span>
              </div>
              <div className="h-3 bg-[#F1F5F9] rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-[#EA580C]" style={{ width: `${(processingOrders / mockOrders.length) * 100}%` }} />
              </div>
            </div>
            {/* Cancelled */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[13px] font-medium text-[#334155]">Cancelled</span>
                <span className="text-[13px] font-bold text-[#DC2626]">{cancelledOrders} orders</span>
              </div>
              <div className="h-3 bg-[#F1F5F9] rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-[#DC2626]" style={{ width: `${(cancelledOrders / mockOrders.length) * 100}%` }} />
              </div>
            </div>
            {/* Service requests */}
            <div className="pt-2 border-t border-[#F1F5F9]">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[13px] font-medium text-[#334155]">Requests Resolved</span>
                <span className="text-[13px] font-bold text-[#0F172A]">{completedRequests}/{mockServiceRequests.length} ({requestCompletionRate}%)</span>
              </div>
              <div className="h-3 bg-[#F1F5F9] rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-[#2563EB]" style={{ width: `${requestCompletionRate}%` }} />
              </div>
            </div>
            {/* Custom order conversion */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[13px] font-medium text-[#334155]">Custom Order Conversion</span>
                <span className="text-[13px] font-bold text-[#0F172A]">{convertedCustom}/{mockCustomRequests.length} ({customConversionRate}%)</span>
              </div>
              <div className="h-3 bg-[#F1F5F9] rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-[#7C3AED]" style={{ width: `${customConversionRate}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Staff Workload */}
        <div className={`${card} p-3.5 sm:p-5 md:p-6`}>
          <h3 className="text-[15px] font-bold text-[#0F172A] mb-5">Staff Workload</h3>
          <div className="space-y-4">
            {staffWorkload.map(([name, data]) => (
              <div key={name}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="size-7 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
                      {name.split(" ").map((w) => w[0]).join("")}
                    </div>
                    <span className="text-[13px] font-medium text-[#334155]">{name}</span>
                  </div>
                  <span className="text-[13px] font-bold text-[#0F172A]">{data.total} tasks</span>
                </div>
                <div className="h-3 bg-[#F1F5F9] rounded-full overflow-hidden flex">
                  <div className="h-full bg-[#0D47A1]" style={{ width: `${(data.orders / maxWorkload) * 100}%` }} title={`${data.orders} orders`} />
                  <div className="h-full bg-[#7C3AED]" style={{ width: `${(data.requests / maxWorkload) * 100}%` }} title={`${data.requests} requests`} />
                </div>
                <div className="flex gap-3 mt-1">
                  <span className="text-[10px] text-[#64748B]">{data.orders} orders</span>
                  <span className="text-[10px] text-[#64748B]">{data.requests} requests</span>
                </div>
              </div>
            ))}
            <div className="flex items-center gap-4 pt-2 border-t border-[#F1F5F9]">
              <div className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-[#0D47A1]" /><span className="text-[11px] text-[#64748B]">Orders</span></div>
              <div className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-[#7C3AED]" /><span className="text-[11px] text-[#64748B]">Requests</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 3: Orders by Portal + Cart & Engagement ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
        {/* Orders by Portal */}
        <div className={`${card} p-3.5 sm:p-5 md:p-6`}>
          <h3 className="text-[15px] font-bold text-[#0F172A] mb-5">Orders by Portal</h3>
          <div className="space-y-3">
            {ordersByPortal.map((item) => {
              const pct = Math.round((item.count / mockOrders.length) * 100);
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
        </div>

        {/* Cart & Engagement */}
        <div className={`${card} p-3.5 sm:p-5 md:p-6`}>
          <h3 className="text-[15px] font-bold text-[#0F172A] mb-5">Cart & Engagement</h3>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-5">
            <div className="p-3 sm:p-4 bg-[#EFF6FF] rounded-xl text-center">
              <p className="text-[11px] font-semibold text-[#2563EB] uppercase tracking-wide">Active Carts</p>
              <p className="text-xl sm:text-2xl font-extrabold text-[#2563EB] mt-1">{activeCarts}</p>
            </div>
            <div className="p-3 sm:p-4 bg-[#FFF7ED] rounded-xl text-center">
              <p className="text-[11px] font-semibold text-[#EA580C] uppercase tracking-wide">Abandoned</p>
              <p className="text-xl sm:text-2xl font-extrabold text-[#EA580C] mt-1">{abandonedCarts}</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-[#F1F5F9]">
              <span className="text-[13px] text-[#64748B]">Avg Cart Value</span>
              <span className="text-[13px] font-bold text-[#0F172A]">{formatNaira(avgCartValue)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-[#F1F5F9]">
              <span className="text-[13px] text-[#64748B]">Pending Requests</span>
              <span className="text-[13px] font-bold text-[#EA580C]">{pendingRequests}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-[#F1F5F9]">
              <span className="text-[13px] text-[#64748B]">Declined Requests</span>
              <span className="text-[13px] font-bold text-[#DC2626]">{declinedRequests}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-[13px] text-[#64748B]">Active Members</span>
              <span className="text-[13px] font-bold text-[#059669]">{activeMembers}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
