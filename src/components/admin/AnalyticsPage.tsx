import { useMemo } from "react";
import StatCard from "./shared/StatCard";
import {
  mockOrders,
  mockUsers,
  mockWalletTxns,
  mockSubscriptions,
  formatNaira,
  PORTAL_LABELS,
  PORTAL_COLORS,
  type Portal,
} from "../../data/adminMockData";

export default function AnalyticsPage() {
  const totalRevenue = mockOrders.reduce((sum, o) => sum + o.amount, 0);
  const totalUsers = mockUsers.length;
  const activeMembers = mockSubscriptions.filter((s) => s.status === "active").length;
  const avgOrderValue = mockOrders.length > 0 ? Math.round(totalRevenue / mockOrders.length) : 0;

  // Revenue by portal
  const revenueByPortal = useMemo(() => {
    const map: Record<string, number> = {};
    mockOrders.forEach((o) => {
      map[o.portal] = (map[o.portal] || 0) + o.amount;
    });
    return (Object.keys(PORTAL_LABELS) as Portal[])
      .map((p) => ({ portal: p, amount: map[p] || 0 }))
      .sort((a, b) => b.amount - a.amount);
  }, []);

  const maxPortalRevenue = Math.max(...revenueByPortal.map((r) => r.amount), 1);

  // Orders by status
  const ordersByStatus = useMemo(() => {
    const map: Record<string, number> = {};
    mockOrders.forEach((o) => {
      map[o.status] = (map[o.status] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, []);

  const statusColors: Record<string, string> = {
    completed: "#059669",
    pending: "#EA580C",
    processing: "#2563EB",
    confirmed: "#7C3AED",
    cancelled: "#DC2626",
  };

  // Monthly revenue trend (last 6 months)
  const monthlyRevenue = useMemo(() => {
    const months: { label: string; amount: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(2026, 3 - i, 1);
      const label = d.toLocaleDateString("en-NG", { month: "short" });
      const monthStr = d.toISOString().slice(0, 7);
      const amount = mockOrders
        .filter((o) => o.createdAt.startsWith(monthStr))
        .reduce((s, o) => s + o.amount, 0);
      months.push({ label, amount });
    }
    return months;
  }, []);

  const maxMonthly = Math.max(...monthlyRevenue.map((m) => m.amount), 1);

  // Transaction volume
  const creditVolume = mockWalletTxns.filter((t) => t.type === "credit").reduce((s, t) => s + t.amount, 0);
  const debitVolume = mockWalletTxns.filter((t) => t.type === "debit").reduce((s, t) => s + t.amount, 0);
  const totalVolume = creditVolume + debitVolume;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#0F172A]">Analytics</h1>
        <p className="text-sm text-[#64748B] mt-0.5">Platform performance and insights</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <StatCard label="Total Revenue" value={formatNaira(totalRevenue)} icon="payments" color="#1B5E20" />
        <StatCard label="Total Users" value={totalUsers.toLocaleString()} icon="group" color="#0D47A1" />
        <StatCard label="Active Members" value={String(activeMembers)} icon="card_membership" color="#4A148C" />
        <StatCard label="Avg Order Value" value={formatNaira(avgOrderValue)} icon="receipt_long" color="#E65100" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
        {/* Revenue by Portal */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 p-5 sm:p-6">
          <h3 className="text-[15px] font-bold text-[#0F172A] mb-5">Revenue by Portal</h3>
          <div className="space-y-4">
            {revenueByPortal.map((item) => {
              const pct = Math.round((item.amount / totalRevenue) * 100);
              return (
                <div key={item.portal}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="size-2.5 rounded-full" style={{ backgroundColor: PORTAL_COLORS[item.portal] }} />
                      <span className="text-[13px] font-medium text-[#334155]">{PORTAL_LABELS[item.portal]}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-[11px] font-semibold text-[#94A3B8]">{pct}%</span>
                      <span className="text-[13px] font-bold text-[#0F172A]">{formatNaira(item.amount)}</span>
                    </div>
                  </div>
                  <div className="h-3 bg-[#F1F5F9] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${(item.amount / maxPortalRevenue) * 100}%`, backgroundColor: PORTAL_COLORS[item.portal] }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Monthly Revenue Trend */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 p-5 sm:p-6">
          <h3 className="text-[15px] font-bold text-[#0F172A] mb-5">Monthly Revenue Trend</h3>
          <div className="flex items-end gap-1 sm:gap-2 md:gap-3 h-40 sm:h-48">
            {monthlyRevenue.map((m) => (
              <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] font-semibold text-[#64748B]">
                  {m.amount > 0 ? formatNaira(m.amount) : "-"}
                </span>
                <div className="w-full bg-[#F1F5F9] rounded-t-lg overflow-hidden flex-1 flex items-end">
                  <div
                    className="w-full bg-primary rounded-t-lg transition-all"
                    style={{ height: `${(m.amount / maxMonthly) * 100}%`, minHeight: m.amount > 0 ? "8px" : "0px" }}
                  />
                </div>
                <span className="text-[11px] font-semibold text-[#64748B]">{m.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Second row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
        {/* Orders by Status */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 p-5 sm:p-6">
          <h3 className="text-[15px] font-bold text-[#0F172A] mb-5">Orders by Status</h3>
          <div className="space-y-3">
            {ordersByStatus.map(([status, count]) => {
              const pct = Math.round((count / mockOrders.length) * 100);
              return (
                <div key={status}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[13px] font-medium text-[#334155] capitalize">{status}</span>
                    <span className="text-[13px] font-bold text-[#0F172A]">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: statusColors[status] ?? "#94A3B8" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Transaction Volume */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 p-5 sm:p-6">
          <h3 className="text-[15px] font-bold text-[#0F172A] mb-5">Transaction Volume</h3>
          <div className="flex items-center justify-center mb-6">
            <div className="relative size-40">
              {/* CSS pie chart using conic-gradient */}
              <div
                className="size-full rounded-full"
                style={{
                  background: totalVolume > 0
                    ? `conic-gradient(#059669 0% ${(creditVolume / totalVolume) * 100}%, #DC2626 ${(creditVolume / totalVolume) * 100}% 100%)`
                    : "#F1F5F9",
                }}
              />
              <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center">
                <div className="text-center">
                  <p className="text-lg font-extrabold text-[#0F172A]">{formatNaira(totalVolume)}</p>
                  <p className="text-[11px] text-[#64748B]">Total</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2">
              <span className="size-3 rounded-full bg-[#059669]" />
              <span className="text-[13px] text-[#334155]">Credits: {formatNaira(creditVolume)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="size-3 rounded-full bg-[#DC2626]" />
              <span className="text-[13px] text-[#334155]">Debits: {formatNaira(debitVolume)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
