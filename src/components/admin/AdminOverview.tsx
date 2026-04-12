const formatNaira = (n: number) => `₦${n.toLocaleString()}`;

const stats = [
  { label: "Total Users", value: "1,247", icon: "group", color: "#0D47A1", trend: "+12 this week" },
  { label: "Revenue (MTD)", value: formatNaira(4800000), icon: "payments", color: "#1B5E20", trend: "+₦320K today" },
  { label: "Active Orders", value: "23", icon: "receipt_long", color: "#E65100", trend: "5 pending payment" },
  { label: "Active Members", value: "412", icon: "card_membership", color: "#4A148C", trend: "89% retention" },
];

const recentOrders = [
  { id: "ORD-042", user: "Chidi O.", service: "Mainland Solar", amount: 8250000, status: "pending", date: "2026-04-10" },
  { id: "ORD-041", user: "Amara T.", service: "LagosCart", amount: 15400, status: "completed", date: "2026-04-10" },
  { id: "ORD-040", user: "Kunle A.", service: "Van Lagos", amount: 120000, status: "processing", date: "2026-04-09" },
  { id: "ORD-039", user: "Fatima B.", service: "Mainland Clinics", amount: 0, status: "completed", date: "2026-04-09" },
  { id: "ORD-038", user: "Damola A.", service: "Mainland Events", amount: 60000, status: "pending", date: "2026-04-08" },
];

const revenueByPortal = [
  { name: "Solar", amount: 2400000, color: "#E65100" },
  { name: "Transport", amount: 890000, color: "#0D47A1" },
  { name: "Groceries", amount: 650000, color: "#1B5E20" },
  { name: "Health", amount: 420000, color: "#B71C1C" },
  { name: "Events", amount: 310000, color: "#4A148C" },
  { name: "Logistics", amount: 130000, color: "#004D40" },
];

const maxRevenue = Math.max(...revenueByPortal.map((r) => r.amount));

export default function AdminOverview() {
  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl p-4 md:p-5 border border-outline-variant/10">
            <div className="size-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: stat.color + "12" }}>
              <span className="material-symbols-outlined text-[22px]" style={{ color: stat.color }}>{stat.icon}</span>
            </div>
            <p className="text-xs sm:text-sm text-on-surface-variant font-medium">{stat.label}</p>
            <p className="text-xl md:text-2xl font-extrabold text-on-surface mt-0.5">{stat.value}</p>
            <p className="text-xs text-on-surface-variant mt-1">{stat.trend}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6">
        {/* Recent orders */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-outline-variant/10 overflow-hidden">
          <div className="flex items-center justify-between px-4 md:px-5 py-3 border-b border-outline-variant/10">
            <h2 className="text-sm md:text-base font-bold text-on-surface">Recent Orders</h2>
            <a href="/orders" className="text-sm font-bold text-primary hover:underline">View All</a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant">
                  <th className="text-left px-4 py-2.5 font-bold text-xs uppercase tracking-wider">Order</th>
                  <th className="text-left px-4 py-2.5 font-bold text-xs uppercase tracking-wider hidden sm:table-cell">User</th>
                  <th className="text-left px-4 py-2.5 font-bold text-xs uppercase tracking-wider hidden md:table-cell">Service</th>
                  <th className="text-right px-4 py-2.5 font-bold text-xs uppercase tracking-wider">Amount</th>
                  <th className="text-center px-4 py-2.5 font-bold text-xs uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/8">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-surface-container/30 cursor-pointer">
                    <td className="px-4 py-3 font-bold text-primary">{order.id}</td>
                    <td className="px-4 py-3 hidden sm:table-cell">{order.user}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-on-surface-variant">{order.service}</td>
                    <td className="px-4 py-3 text-right font-bold">{order.amount === 0 ? "Free" : formatNaira(order.amount)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        order.status === "completed" ? "bg-primary/10 text-primary" :
                        order.status === "pending" ? "bg-[#E65100]/10 text-[#E65100]" :
                        "bg-[#0D47A1]/10 text-[#0D47A1]"
                      }`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Revenue by portal */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-outline-variant/10 p-4 md:p-5">
          <h2 className="text-sm md:text-base font-bold text-on-surface mb-4">Revenue by Portal</h2>
          <div className="space-y-3">
            {revenueByPortal.map((portal) => (
              <div key={portal.name} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-on-surface">{portal.name}</span>
                  <span className="font-bold text-on-surface">{formatNaira(portal.amount)}</span>
                </div>
                <div className="h-2.5 bg-surface-container-high rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${(portal.amount / maxRevenue) * 100}%`, backgroundColor: portal.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Add Product", icon: "add_circle", color: "#1B5E20" },
          { label: "Broadcast", icon: "campaign", color: "#0D47A1" },
          { label: "Adjust Wallet", icon: "add_card", color: "#E65100" },
          { label: "Export Data", icon: "download", color: "#4A148C" },
        ].map((action) => (
          <button key={action.label} className="flex items-center gap-2 sm:gap-3 bg-white rounded-xl p-3 sm:p-4 border border-outline-variant/10 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all text-left">
            <span className="material-symbols-outlined text-[20px]" style={{ color: action.color }}>{action.icon}</span>
            <span className="text-xs sm:text-sm font-bold text-on-surface">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
