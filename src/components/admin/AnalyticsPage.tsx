import StatCard from "./shared/StatCard";
import {
  mockOrders, mockUsers, mockProducts,
  formatNaira, PORTAL_LABELS, PORTAL_COLORS,
  type Portal,
} from "../../data/adminMockData";

// Pre-compute analytics data
const revenueByMonth = (() => {
  const months: Record<string, number> = {};
  mockOrders.forEach((o) => {
    const key = o.createdAt.slice(0, 7); // YYYY-MM
    months[key] = (months[key] || 0) + o.amount;
  });
  return Object.entries(months)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([month, amount]) => ({ month, amount }));
})();

const revenueByPortal = (() => {
  const portals: Record<string, number> = {};
  mockOrders.forEach((o) => {
    portals[o.portal] = (portals[o.portal] || 0) + o.amount;
  });
  return Object.entries(portals)
    .map(([portal, amount]) => ({ portal: portal as Portal, amount }))
    .sort((a, b) => b.amount - a.amount);
})();

const signupsByMonth = (() => {
  const months: Record<string, number> = {};
  mockUsers.forEach((u) => {
    const key = u.joinedAt.slice(0, 7);
    months[key] = (months[key] || 0) + 1;
  });
  return Object.entries(months)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, count]) => ({ month, count }));
})();

const membershipDist = (() => {
  const dist: Record<string, number> = { none: 0, bronze: 0, silver: 0, gold: 0 };
  mockUsers.forEach((u) => { dist[u.membership]++; });
  return dist;
})();

const ordersByPortal = (() => {
  const portals: Record<string, number> = {};
  mockOrders.forEach((o) => { portals[o.portal] = (portals[o.portal] || 0) + 1; });
  return Object.entries(portals)
    .map(([portal, count]) => ({ portal: portal as Portal, count }))
    .sort((a, b) => b.count - a.count);
})();

const avgOrderValue = mockOrders.length > 0 ? Math.round(mockOrders.reduce((s, o) => s + o.amount, 0) / mockOrders.length) : 0;
const completionRate = mockOrders.length > 0 ? Math.round((mockOrders.filter((o) => o.status === "completed").length / mockOrders.length) * 100) : 0;
const mostPopularPortal = ordersByPortal[0];

const topProducts = (() => {
  const counts: Record<string, { name: string; portal: Portal; count: number }> = {};
  mockOrders.forEach((o) => {
    o.items.split(", ").forEach((item) => {
      if (!counts[item]) {
        const product = mockProducts.find((p) => p.name === item);
        counts[item] = { name: item, portal: o.portal as Portal, count: 0 };
        if (product) counts[item].portal = product.portal;
      }
      counts[item].count++;
    });
  });
  return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 10);
})();

const MONTH_LABELS: Record<string, string> = {
  "01": "Jan", "02": "Feb", "03": "Mar", "04": "Apr", "05": "May", "06": "Jun",
  "07": "Jul", "08": "Aug", "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dec",
};

function monthLabel(ym: string) {
  const [, m] = ym.split("-");
  return MONTH_LABELS[m] || m;
}

/* ── Shared card class ─────────────────────────────────────────────────────── */
const card = "bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60";

export default function AnalyticsPage() {
  const maxRevMonth = Math.max(...revenueByMonth.map((r) => r.amount), 1);
  const maxSignup = Math.max(...signupsByMonth.map((s) => s.count), 1);
  const maxOrderPortal = Math.max(...ordersByPortal.map((o) => o.count), 1);
  const totalMembers = Object.values(membershipDist).reduce((s, v) => s + v, 0);
  const totalRevenue = revenueByPortal.reduce((s, r) => s + r.amount, 0);

  // Donut chart via conic-gradient
  const pieSegments = (() => {
    const colors: Record<string, string> = { none: "#9CA3AF", bronze: "#8D6E63", silver: "#78909C", gold: "#F9A825" };
    let cumulative = 0;
    return Object.entries(membershipDist).map(([tier, count]) => {
      const pct = totalMembers > 0 ? (count / totalMembers) * 100 : 0;
      const start = cumulative;
      cumulative += pct;
      return { tier, count, pct, start, end: cumulative, color: colors[tier] };
    });
  })();
  const conicGradient = pieSegments
    .map((s) => `${s.color} ${s.start}% ${s.end}%`)
    .join(", ");

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] tracking-tight">
          Analytics
        </h1>
        <p className="text-sm text-[#94A3B8] mt-1">
          Platform performance and insights
        </p>
      </div>

      {/* ── Row 1: Monthly Revenue + Revenue by Portal ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 sm:gap-6">
        {/* Monthly revenue bar chart */}
        <div className={`lg:col-span-3 ${card} p-5 sm:p-6`}>
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-[#0F172A]">Monthly Revenue</h2>
            <p className="text-[13px] text-[#94A3B8] mt-0.5">Last 12 months performance</p>
          </div>
          <div className="flex items-end gap-[6px] sm:gap-2.5 h-52 overflow-hidden">
            {revenueByMonth.map((r) => {
              const pct = (r.amount / maxRevMonth) * 100;
              return (
                <div key={r.month} className="flex-1 flex flex-col items-center gap-1.5 group">
                  <span className="text-[10px] font-semibold text-[#64748B] opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap">
                    {formatNaira(r.amount)}
                  </span>
                  <div className="w-full relative flex-1 flex items-end">
                    <div
                      className="w-full rounded-full bg-gradient-to-t from-primary/90 to-primary/50 transition-all duration-200 group-hover:from-primary group-hover:to-primary/70 group-hover:brightness-110"
                      style={{ height: `${Math.max(pct, 2)}%`, minHeight: "4px" }}
                    />
                  </div>
                  <span className="text-[11px] text-[#94A3B8] font-medium">{monthLabel(r.month)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Revenue by portal */}
        <div className={`lg:col-span-2 ${card} p-5 sm:p-6`}>
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-[#0F172A]">Revenue by Portal</h2>
            <p className="text-[13px] text-[#94A3B8] mt-0.5">
              Total: {formatNaira(totalRevenue)}
            </p>
          </div>
          <div className="space-y-4">
            {revenueByPortal.map((r) => {
              const pct = totalRevenue > 0 ? Math.round((r.amount / totalRevenue) * 100) : 0;
              return (
                <div key={r.portal}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[13px] font-medium text-[#0F172A]">{PORTAL_LABELS[r.portal]}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-[#0F172A]">{formatNaira(r.amount)}</span>
                      <span className="text-[11px] font-medium text-[#94A3B8] w-8 text-right">{pct}%</span>
                    </div>
                  </div>
                  <div className="h-2.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${totalRevenue > 0 ? (r.amount / totalRevenue) * 100 : 0}%`,
                        backgroundColor: PORTAL_COLORS[r.portal],
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Row 2: Signups + Membership Donut ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        {/* Signups bar chart */}
        <div className={`${card} p-5 sm:p-6`}>
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-[#0F172A]">New Signups</h2>
            <p className="text-[13px] text-[#94A3B8] mt-0.5">Last 6 months</p>
          </div>
          <div className="flex items-end gap-3 sm:gap-5 h-44">
            {signupsByMonth.map((s) => {
              const pct = (s.count / maxSignup) * 100;
              return (
                <div key={s.month} className="flex-1 flex flex-col items-center gap-1.5 group">
                  <span className="text-[10px] font-semibold text-[#64748B] opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    {s.count}
                  </span>
                  <div className="w-full flex-1 flex items-end">
                    <div
                      className="w-full rounded-full bg-gradient-to-t from-[#0D47A1]/90 to-[#0D47A1]/40 transition-all duration-200 group-hover:from-[#0D47A1] group-hover:to-[#0D47A1]/60 group-hover:brightness-110"
                      style={{ height: `${Math.max(pct, 2)}%`, minHeight: "4px" }}
                    />
                  </div>
                  <span className="text-[11px] text-[#94A3B8] font-medium">{monthLabel(s.month)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Membership donut chart */}
        <div className={`${card} p-5 sm:p-6`}>
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-[#0F172A]">Membership Distribution</h2>
            <p className="text-[13px] text-[#94A3B8] mt-0.5">{totalMembers} total users</p>
          </div>
          <div className="flex items-center gap-8 sm:gap-10">
            {/* Donut */}
            <div className="relative flex-shrink-0">
              <div
                className="size-36 sm:size-40 rounded-full"
                style={{ background: `conic-gradient(${conicGradient})` }}
              />
              {/* White center cutout */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="size-20 sm:size-24 bg-white rounded-full flex flex-col items-center justify-center shadow-[0_0_0_4px_rgba(255,255,255,1)]">
                  <span className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
                    {totalMembers}
                  </span>
                  <span className="text-[10px] font-medium text-[#94A3B8] -mt-0.5">
                    users
                  </span>
                </div>
              </div>
            </div>
            {/* Legend */}
            <div className="space-y-3 flex-1">
              {pieSegments.map((s) => (
                <div key={s.tier} className="flex items-center gap-3">
                  <div
                    className="size-3 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: s.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between">
                      <span className="text-[13px] font-medium text-[#0F172A] capitalize">{s.tier}</span>
                      <span className="text-[12px] font-semibold text-[#64748B]">{Math.round(s.pct)}%</span>
                    </div>
                    <p className="text-[11px] text-[#94A3B8] mt-0.5">
                      {s.count} {s.count === 1 ? "user" : "users"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 3: Orders by Portal + Order Stats ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 sm:gap-6">
        {/* Orders by portal bar chart */}
        <div className={`lg:col-span-3 ${card} p-5 sm:p-6`}>
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-[#0F172A]">Orders by Portal</h2>
            <p className="text-[13px] text-[#94A3B8] mt-0.5">Distribution across service portals</p>
          </div>
          <div className="flex items-end gap-2 sm:gap-4 h-44">
            {ordersByPortal.map((o) => {
              const pct = (o.count / maxOrderPortal) * 100;
              return (
                <div key={o.portal} className="flex-1 flex flex-col items-center gap-1.5 group">
                  <span className="text-[10px] font-semibold text-[#64748B] opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    {o.count}
                  </span>
                  <div className="w-full flex-1 flex items-end">
                    <div
                      className="w-full rounded-full transition-all duration-200 group-hover:brightness-110 group-hover:brightness-110"
                      style={{
                        height: `${Math.max(pct, 2)}%`,
                        minHeight: "4px",
                        background: `linear-gradient(to top, ${PORTAL_COLORS[o.portal]}E6, ${PORTAL_COLORS[o.portal]}66)`,
                      }}
                    />
                  </div>
                  <span className="text-[11px] text-[#94A3B8] font-medium text-center leading-tight">
                    {PORTAL_LABELS[o.portal].split(",")[0].split(" ")[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order stat cards */}
        <div className="lg:col-span-2 grid grid-cols-1 gap-4">
          <StatCard
            label="Avg Order Value"
            value={formatNaira(avgOrderValue)}
            icon="payments"
            color="#E65100"
          />
          <StatCard
            label="Completion Rate"
            value={`${completionRate}%`}
            icon="check_circle"
            color="#1B5E20"
            trend={{
              value: `${mockOrders.filter((o) => o.status === "completed").length} completed`,
              positive: true,
            }}
          />
          <StatCard
            label="Most Popular"
            value={mostPopularPortal ? PORTAL_LABELS[mostPopularPortal.portal] : "\u2014"}
            icon="star"
            color="#4A148C"
            trend={
              mostPopularPortal
                ? { value: `${mostPopularPortal.count} orders`, positive: true }
                : undefined
            }
          />
        </div>
      </div>

      {/* ── Row 4: Top Products Table ────────────────────────────────────── */}
      <div className={`${card} overflow-hidden`}>
        <div className="px-5 sm:px-6 py-4 sm:py-5">
          <h2 className="text-sm font-semibold text-[#0F172A]">Top 10 Most Ordered Products</h2>
          <p className="text-[13px] text-[#94A3B8] mt-0.5">Ranked by order frequency</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F8FAFC]">
                <th className="text-left px-4 sm:px-5 py-3 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider w-14">
                  Rank
                </th>
                <th className="text-left px-4 sm:px-5 py-3 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                  Product
                </th>
                <th className="text-left px-4 sm:px-5 py-3 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider hidden sm:table-cell">
                  Portal
                </th>
                <th className="text-right px-4 sm:px-5 py-3 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                  Times Ordered
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {topProducts.map((p, i) => (
                <tr key={p.name} className="hover:bg-[#F8FAFC]/60 transition-colors duration-100">
                  <td className="px-4 sm:px-5 py-3">
                    <span className="inline-flex items-center justify-center size-6 rounded-md bg-[#F1F5F9] text-[11px] font-bold text-[#64748B]">
                      {i + 1}
                    </span>
                  </td>
                  <td className="px-4 sm:px-5 py-3 font-semibold text-[#0F172A]">
                    {p.name}
                  </td>
                  <td className="px-4 sm:px-5 py-3 hidden sm:table-cell">
                    <div className="flex items-center gap-2">
                      <div
                        className="size-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: PORTAL_COLORS[p.portal] }}
                      />
                      <span className="text-[13px] text-[#64748B]">{PORTAL_LABELS[p.portal]}</span>
                    </div>
                  </td>
                  <td className="px-4 sm:px-5 py-3 text-right">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#F1F5F9] text-[12px] font-semibold text-[#0F172A]">
                      {p.count}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
