import { useState } from "react";
import { useNavigate } from "react-router-dom";
import FilterBar, { type FilterConfig } from "./shared/FilterBar";
import { mockNotifications, formatDate, type MockNotification } from "../../data/adminMockData";

const TYPE_CONFIG: Record<string, { bg: string; text: string; icon: string }> = {
  order: { bg: "#FFF7ED", text: "#EA580C", icon: "receipt_long" },
  wallet: { bg: "#EFF6FF", text: "#2563EB", icon: "account_balance_wallet" },
  membership: { bg: "#F5F3FF", text: "#7C3AED", icon: "card_membership" },
  system: { bg: "#F1F5F9", text: "#64748B", icon: "settings" },
};

const card = "bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60";

export default function NotificationsAdmin() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const filtered = mockNotifications.filter((n) => {
    const matchSearch = !search || n.title.toLowerCase().includes(search.toLowerCase());
    const matchType = !typeFilter || n.type === typeFilter;
    return matchSearch && matchType;
  });

  const readCount = mockNotifications.filter((n) => n.read).length;
  const unreadCount = mockNotifications.length - readCount;

  const filters: FilterConfig[] = [
    {
      key: "type",
      label: "All Types",
      value: typeFilter,
      onChange: setTypeFilter,
      options: [
        { value: "order", label: "Order" },
        { value: "wallet", label: "Wallet" },
        { value: "membership", label: "Membership" },
        { value: "system", label: "System" },
      ],
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0F172A]">Broadcast</h1>
          <p className="text-sm text-[#64748B] mt-0.5">
            {mockNotifications.length} broadcasts · {readCount} read by users · {unreadCount} unread
          </p>
        </div>
        <button
          onClick={() => navigate("/broadcast/compose")}
          className="inline-flex items-center gap-1.5 px-2.5 sm:px-4 py-2 sm:py-2.5 bg-primary text-white text-sm font-semibold rounded-xl cursor-pointer hover:brightness-[0.92] active:scale-[0.98] transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span className="hidden sm:inline">New Broadcast</span>
        </button>
      </div>

      <FilterBar
        onSearch={setSearch}
        searchValue={search}
        searchPlaceholder="Search broadcasts..."
        filters={filters}
      />

      <div className={`${card} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm">
            <thead>
              <tr className="bg-[#F8FAFC]">
                <th className="px-2.5 sm:px-4 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-left">Title</th>
                <th className="px-2.5 sm:px-4 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-center">Type</th>
                <th className="px-2.5 sm:px-4 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-center hidden sm:table-cell">User Read Rate</th>
                <th className="px-2.5 sm:px-4 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-left hidden md:table-cell">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {filtered.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-12 text-center text-[#94A3B8]">No broadcasts found</td></tr>
              ) : (
                filtered.map((n: MockNotification) => {
                  const tc = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.system;
                  // Simulate a user read rate per broadcast
                  const readPct = n.read ? 85 : 42;
                  return (
                    <tr
                      key={n.id}
                      onClick={() => navigate(`/broadcast/${n.id}`)}
                      className="hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                    >
                      {/* Title + message preview */}
                      <td className="px-2.5 sm:px-4 py-3">
                        <p className="text-sm font-semibold text-[#0F172A] truncate max-w-[250px] sm:max-w-none">{n.title}</p>
                        <p className="text-[12px] text-[#64748B] truncate max-w-[250px] sm:max-w-[400px] mt-0.5">{n.message}</p>
                      </td>
                      {/* Type */}
                      <td className="px-2.5 sm:px-4 py-3 text-center">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg" style={{ backgroundColor: tc.bg }}>
                          <span className="material-symbols-outlined text-[14px]" style={{ color: tc.text }}>{tc.icon}</span>
                          <span className="text-[11px] font-semibold uppercase" style={{ color: tc.text }}>{n.type}</span>
                        </div>
                      </td>
                      {/* User read rate */}
                      <td className="px-2.5 sm:px-4 py-3 hidden sm:table-cell">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${readPct >= 70 ? "bg-[#059669]" : readPct >= 40 ? "bg-[#EA580C]" : "bg-[#DC2626]"}`} style={{ width: `${readPct}%` }} />
                          </div>
                          <span className={`text-[12px] font-semibold ${readPct >= 70 ? "text-[#059669]" : readPct >= 40 ? "text-[#EA580C]" : "text-[#DC2626]"}`}>{readPct}%</span>
                        </div>
                      </td>
                      {/* Date */}
                      <td className="px-2.5 sm:px-4 py-3 text-[#64748B] hidden md:table-cell whitespace-nowrap">{formatDate(n.createdAt)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
