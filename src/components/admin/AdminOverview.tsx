import StatCard from "./shared/StatCard";
import {
  mockOrders,
  mockUsers,
  mockServiceRequests,
  mockSubscriptions,
  formatNaira,
} from "../../data/adminMockData";

const completedOrders = mockOrders.filter((o) => o.status === "completed").length;
const pendingOrders = mockOrders.filter((o) => o.status === "pending").length;
const processingOrders = mockOrders.filter((o) => o.status === "processing" || o.status === "confirmed").length;
const activeMembers = mockSubscriptions.filter((s) => s.status === "active").length;
const newRequests = mockServiceRequests.filter((r) => r.status === "new").length;

const recentOrders = mockOrders
  .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  .slice(0, 5);

const statusStyles: Record<string, string> = {
  completed: "bg-[#ECFDF5] text-[#059669]",
  pending: "bg-[#FFF7ED] text-[#EA580C]",
  processing: "bg-[#EFF6FF] text-[#2563EB]",
  confirmed: "bg-[#F5F3FF] text-[#7C3AED]",
  cancelled: "bg-[#FEF2F2] text-[#DC2626]",
};

const quickActions = [
  { label: "Add Product", icon: "add_circle", color: "#1B5E20", bg: "#ECFDF5", href: "/inventory" },
  { label: "Broadcast", icon: "campaign", color: "#0D47A1", bg: "#EFF6FF", href: "/broadcast/compose" },
  { label: "Create Order", icon: "receipt_long", color: "#E65100", bg: "#FFF7ED", href: "/orders/create" },
  { label: "View Analytics", icon: "analytics", color: "#4A148C", bg: "#F5F3FF", href: "/analytics" },
];

export default function AdminOverview() {
  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
        <StatCard label="Total Users" value={mockUsers.length.toLocaleString()} icon="group" color="#0D47A1" trend={{ value: `${activeMembers} members`, positive: true }} />
        <StatCard label="Active Orders" value={String(processingOrders)} icon="receipt_long" color="#E65100" trend={{ value: `${pendingOrders} pending`, positive: false }} />
        <StatCard label="Completed" value={String(completedOrders)} icon="check_circle" color="#1B5E20" trend={{ value: `${Math.round((completedOrders / mockOrders.length) * 100)}% rate`, positive: true }} />
        <StatCard label="New Requests" value={String(newRequests)} icon="description" color="#7C3AED" trend={{ value: "Awaiting review", positive: false }} />
      </div>

      {/* Orders + Fulfillment snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-3 bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 overflow-hidden">
          <div className="flex items-center justify-between px-2.5 sm:px-4 py-4 border-b border-[#E8ECF1]/60">
            <h2 className="text-sm sm:text-[15px] font-bold text-[#0F172A]">Recent Orders</h2>
            <a href="/orders" className="text-sm font-semibold text-[#057a55] hover:text-[#045e43] transition-colors">View All</a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="bg-[#F8FAFC]">
                  <th className="text-left px-2.5 sm:px-4 py-3.5 font-semibold text-[11px] uppercase tracking-wider text-[#64748B]">Order</th>
                  <th className="text-left px-2.5 sm:px-4 py-3.5 font-semibold text-[11px] uppercase tracking-wider text-[#64748B] hidden sm:table-cell">User</th>
                  <th className="text-left px-2.5 sm:px-4 py-3.5 font-semibold text-[11px] uppercase tracking-wider text-[#64748B] hidden md:table-cell">Service</th>
                  <th className="text-right px-2.5 sm:px-4 py-3.5 font-semibold text-[11px] uppercase tracking-wider text-[#64748B]">Amount</th>
                  <th className="text-center px-2.5 sm:px-4 py-3.5 font-semibold text-[11px] uppercase tracking-wider text-[#64748B]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8ECF1]/50">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-[#F8FAFC]/60 transition-colors cursor-pointer">
                    <td className="px-2.5 sm:px-4 py-3.5 font-semibold text-[#057a55]">{order.id}</td>
                    <td className="px-2.5 sm:px-4 py-3.5 text-[#334155] hidden sm:table-cell">{order.userName}</td>
                    <td className="px-2.5 sm:px-4 py-3.5 text-[#64748B] hidden md:table-cell capitalize">{order.portal}</td>
                    <td className="px-2.5 sm:px-4 py-3.5 text-right font-semibold text-[#0F172A]">
                      {order.amount === 0 ? "Free" : formatNaira(order.amount)}
                    </td>
                    <td className="px-2.5 sm:px-4 py-3.5 text-center">
                      <span className={`inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize ${statusStyles[order.status] ?? "bg-[#F1F5F9] text-[#64748B]"}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Fulfillment snapshot */}
        <div className="lg:col-span-2 bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm sm:text-[15px] font-bold text-[#0F172A]">Fulfillment Snapshot</h2>
            <a href="/fulfillment" className="text-sm font-semibold text-[#057a55] hover:text-[#045e43] transition-colors">View All</a>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[13px] text-[#334155]">Orders in Progress</span>
                <span className="text-sm font-bold text-[#EA580C]">{processingOrders}</span>
              </div>
              <div className="h-2.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-[#EA580C]" style={{ width: `${(processingOrders / mockOrders.length) * 100}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[13px] text-[#334155]">Service Requests Pending</span>
                <span className="text-sm font-bold text-[#7C3AED]">{newRequests}</span>
              </div>
              <div className="h-2.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-[#7C3AED]" style={{ width: `${mockServiceRequests.length > 0 ? (newRequests / mockServiceRequests.length) * 100 : 0}%` }} />
              </div>
            </div>
            <div className="pt-3 border-t border-[#F1F5F9] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[#64748B]">Completion Rate</span>
                <span className="text-sm font-bold text-[#059669]">{Math.round((completedOrders / mockOrders.length) * 100)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[#64748B]">Cancellation Rate</span>
                <span className="text-sm font-bold text-[#DC2626]">{Math.round((mockOrders.filter((o) => o.status === "cancelled").length / mockOrders.length) * 100)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[#64748B]">Active Members</span>
                <span className="text-sm font-bold text-[#0F172A]">{activeMembers}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm sm:text-[15px] font-bold text-[#0F172A] mb-3 sm:mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
          {quickActions.map((action) => (
            <a
              key={action.label}
              href={action.href}
              className="flex flex-col items-center gap-2 sm:gap-3 bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 p-3.5 sm:p-5 md:p-6 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all text-center no-underline"
            >
              <div className="size-11 sm:size-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: action.bg }}>
                <span className="material-symbols-outlined text-[22px] sm:text-[24px]" style={{ color: action.color }}>{action.icon}</span>
              </div>
              <span className="text-[13px] sm:text-sm font-semibold text-[#0F172A]">{action.label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
