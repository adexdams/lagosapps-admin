import StatCard from "./shared/StatCard";

const formatNaira = (n: number) => `₦${n.toLocaleString()}`;

const stats = [
  { label: "Total Users", value: "1,247", icon: "group", color: "#0D47A1", trend: "+12 this week" },
  { label: "Revenue (MTD)", value: formatNaira(4800000), icon: "payments", color: "#1B5E20", trend: "+₦320K today" },
  { label: "Active Orders", value: "23", icon: "receipt_long", color: "#E65100", trend: "5 pending payment" },
  { label: "Active Members", value: "412", icon: "card_membership", color: "#4A148C", trend: "89% retention" },
];

const recentOrders = [
  { id: "ORD-042", user: "Chidi O.", service: "Solar", amount: 8250000, status: "pending", date: "2026-04-10" },
  { id: "ORD-041", user: "Amara T.", service: "Groceries", amount: 15400, status: "completed", date: "2026-04-10" },
  { id: "ORD-040", user: "Kunle A.", service: "Transport", amount: 120000, status: "processing", date: "2026-04-09" },
  { id: "ORD-039", user: "Fatima B.", service: "Health", amount: 0, status: "completed", date: "2026-04-09" },
  { id: "ORD-038", user: "Damola A.", service: "Events", amount: 60000, status: "pending", date: "2026-04-08" },
];

const revenueByPortal = [
  { name: "Solar", amount: 2400000, color: "#E65100" },
  { name: "Transport", amount: 890000, color: "#0D47A1" },
  { name: "Groceries", amount: 650000, color: "#1B5E20" },
  { name: "Health", amount: 420000, color: "#B71C1C" },
  { name: "Events", amount: 310000, color: "#4A148C" },
  { name: "Logistics", amount: 130000, color: "#004D40" },
];

const totalRevenue = revenueByPortal.reduce((sum, p) => sum + p.amount, 0);
const maxRevenue = Math.max(...revenueByPortal.map((r) => r.amount));

const statusStyles: Record<string, string> = {
  completed: "bg-[#ECFDF5] text-[#059669]",
  pending: "bg-[#FFF7ED] text-[#EA580C]",
  processing: "bg-[#EFF6FF] text-[#2563EB]",
};

const statTrends: { value: string; positive: boolean }[] = [
  { value: "+12 this week", positive: true },
  { value: "+₦320K today", positive: true },
  { value: "5 pending payment", positive: false },
  { value: "89% retention", positive: true },
];

const quickActions = [
  { label: "Add Product", icon: "add_circle", color: "#1B5E20", bg: "#ECFDF5" },
  { label: "Broadcast", icon: "campaign", color: "#0D47A1", bg: "#EFF6FF" },
  { label: "Adjust Wallet", icon: "add_card", color: "#E65100", bg: "#FFF7ED" },
  { label: "Export Data", icon: "download", color: "#4A148C", bg: "#F5F3FF" },
];

export default function AdminOverview() {
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat, i) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            trend={statTrends[i]}
          />
        ))}
      </div>

      {/* Orders + Revenue row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-3 bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 overflow-hidden">
          <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-[#E8ECF1]/60">
            <h2 className="text-sm sm:text-[15px] font-bold text-[#0F172A]">Recent Orders</h2>
            <a
              href="/orders"
              className="text-sm font-semibold text-[#057a55] hover:text-[#045e43] transition-colors"
            >
              View All
            </a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F8FAFC]">
                  <th className="text-left px-4 sm:px-5 py-3.5 font-semibold text-[11px] uppercase tracking-wider text-[#64748B]">
                    Order
                  </th>
                  <th className="text-left px-4 sm:px-5 py-3.5 font-semibold text-[11px] uppercase tracking-wider text-[#64748B] hidden sm:table-cell">
                    User
                  </th>
                  <th className="text-left px-4 sm:px-5 py-3.5 font-semibold text-[11px] uppercase tracking-wider text-[#64748B] hidden md:table-cell">
                    Service
                  </th>
                  <th className="text-right px-4 sm:px-5 py-3.5 font-semibold text-[11px] uppercase tracking-wider text-[#64748B]">
                    Amount
                  </th>
                  <th className="text-center px-4 sm:px-5 py-3.5 font-semibold text-[11px] uppercase tracking-wider text-[#64748B]">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8ECF1]/50">
                {recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-[#F8FAFC]/60 transition-colors cursor-pointer"
                  >
                    <td className="px-4 sm:px-5 py-3.5 font-semibold text-[#057a55]">
                      {order.id}
                    </td>
                    <td className="px-4 sm:px-5 py-3.5 text-[#334155] hidden sm:table-cell">
                      {order.user}
                    </td>
                    <td className="px-4 sm:px-5 py-3.5 text-[#64748B] hidden md:table-cell">
                      {order.service}
                    </td>
                    <td className="px-4 sm:px-5 py-3.5 text-right font-semibold text-[#0F172A]">
                      {order.amount === 0 ? "Free" : formatNaira(order.amount)}
                    </td>
                    <td className="px-4 sm:px-5 py-3.5 text-center">
                      <span
                        className={`inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize ${
                          statusStyles[order.status] ?? "bg-[#F1F5F9] text-[#64748B]"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Revenue by Portal */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 p-4 sm:p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-sm sm:text-[15px] font-bold text-[#0F172A]">Revenue by Portal</h2>
              <p className="text-[11px] text-[#94A3B8] font-medium mt-0.5">Month to date</p>
            </div>
            <div className="text-right">
              <p className="text-lg sm:text-xl font-extrabold text-[#0F172A] tracking-tight">
                {formatNaira(totalRevenue)}
              </p>
              <p className="text-[11px] text-[#94A3B8] font-medium">Total</p>
            </div>
          </div>
          <div className="space-y-4">
            {revenueByPortal.map((portal) => {
              const pct = Math.round((portal.amount / totalRevenue) * 100);
              return (
                <div key={portal.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block size-2.5 rounded-full"
                        style={{ backgroundColor: portal.color }}
                      />
                      <span className="text-[13px] font-medium text-[#334155]">{portal.name}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-[11px] font-semibold text-[#94A3B8]">{pct}%</span>
                      <span className="text-[13px] font-bold text-[#0F172A]">
                        {formatNaira(portal.amount)}
                      </span>
                    </div>
                  </div>
                  <div className="h-3 bg-[#F1F5F9] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(portal.amount / maxRevenue) * 100}%`,
                        backgroundColor: portal.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm sm:text-[15px] font-bold text-[#0F172A] mb-3 sm:mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {quickActions.map((action) => (
            <button
              key={action.label}
              className="flex flex-col items-center gap-3 bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 p-5 sm:p-6 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all text-center"
            >
              <div
                className="size-11 sm:size-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: action.bg }}
              >
                <span
                  className="material-symbols-outlined text-[22px] sm:text-[24px]"
                  style={{ color: action.color }}
                >
                  {action.icon}
                </span>
              </div>
              <span className="text-[13px] sm:text-sm font-semibold text-[#0F172A]">
                {action.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
