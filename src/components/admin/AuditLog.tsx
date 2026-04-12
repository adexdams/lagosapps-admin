import { useState } from "react";
import FilterBar, { type FilterConfig } from "./shared/FilterBar";
import { mockAuditLog, formatDate } from "../../data/adminMockData";

const ACTION_COLORS: Record<string, { bg: string; text: string }> = {
  "user.update": { bg: "#EFF6FF", text: "#2563EB" },
  "user.suspend": { bg: "#FEF2F2", text: "#DC2626" },
  "user.activate": { bg: "#ECFDF5", text: "#059669" },
  "order.status_change": { bg: "#FFF7ED", text: "#EA580C" },
  "order.cancel": { bg: "#FEF2F2", text: "#DC2626" },
  "order.refund": { bg: "#FEF2F2", text: "#DC2626" },
  "product.create": { bg: "#ECFDF5", text: "#059669" },
  "product.update": { bg: "#EFF6FF", text: "#2563EB" },
  "product.delete": { bg: "#FEF2F2", text: "#DC2626" },
  "product.price_update": { bg: "#EFF6FF", text: "#2563EB" },
  "wallet.adjust": { bg: "#FFF7ED", text: "#EA580C" },
  "membership.config": { bg: "#F5F3FF", text: "#7C3AED" },
  "notification.broadcast": { bg: "#F5F3FF", text: "#7C3AED" },
  "settings.update": { bg: "#F1F5F9", text: "#64748B" },
  "inventory.restock": { bg: "#ECFDF5", text: "#059669" },
  "portal.toggle": { bg: "#FFF7ED", text: "#EA580C" },
  "referral.approve": { bg: "#ECFDF5", text: "#059669" },
  "export.data": { bg: "#F1F5F9", text: "#64748B" },
  "team.invite": { bg: "#EFF6FF", text: "#2563EB" },
  "subscription.cancel": { bg: "#FEF2F2", text: "#DC2626" },
};

const FALLBACK_COLOR = { bg: "#F1F5F9", text: "#64748B" };

export default function AuditLog() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const filtered = mockAuditLog.filter((entry) => {
    const matchSearch =
      !search ||
      entry.adminName.toLowerCase().includes(search.toLowerCase()) ||
      entry.action.toLowerCase().includes(search.toLowerCase()) ||
      entry.target.toLowerCase().includes(search.toLowerCase());
    const matchAction = !actionFilter || entry.action.startsWith(actionFilter);
    return matchSearch && matchAction;
  });

  const actionTypes = Array.from(new Set(mockAuditLog.map((e) => e.action.split(".")[0])));

  const filters: FilterConfig[] = [
    {
      key: "action",
      label: "All Actions",
      value: actionFilter,
      onChange: setActionFilter,
      options: actionTypes.map((a) => ({ value: a, label: a.charAt(0).toUpperCase() + a.slice(1) })),
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-[#0F172A]">Audit Log</h1>
        <p className="text-sm text-[#64748B] mt-0.5">Track all admin actions and changes</p>
      </div>

      <FilterBar
        onSearch={setSearch}
        searchValue={search}
        searchPlaceholder="Search audit log..."
        filters={filters}
      />

      {/* Custom expandable table */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F8FAFC]">
                <th className="px-5 py-3.5 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-left">Timestamp</th>
                <th className="px-5 py-3.5 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-left">Admin</th>
                <th className="px-5 py-3.5 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-left">Action</th>
                <th className="px-5 py-3.5 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-left hidden md:table-cell">Entity</th>
                <th className="px-5 py-3.5 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-center">Details</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-[#94A3B8]">No entries found</td>
                </tr>
              ) : (
                filtered.map((entry) => {
                  const isExpanded = expandedRow === entry.id;
                  const colors = ACTION_COLORS[entry.action] ?? FALLBACK_COLOR;
                  return (
                    <tr key={entry.id} className="group">
                      <td colSpan={5} className="p-0">
                        <div
                          className={`flex items-center px-5 py-3.5 border-b border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors ${isExpanded ? "bg-[#F8FAFC]" : ""}`}
                        >
                          <div className="flex-1 grid grid-cols-5 items-center gap-2" style={{ gridTemplateColumns: "auto 1fr 1fr 1fr auto" }}>
                            {/* Timestamp */}
                            <span className="text-[13px] text-[#64748B] whitespace-nowrap">
                              {formatDate(entry.createdAt)}
                            </span>
                            {/* Admin */}
                            <span className="text-sm font-semibold text-[#0F172A]">{entry.adminName}</span>
                            {/* Action badge */}
                            <span
                              className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-semibold tracking-wide w-fit"
                              style={{ backgroundColor: colors.bg, color: colors.text }}
                            >
                              {entry.action}
                            </span>
                            {/* Entity */}
                            <span className="text-[13px] text-[#334155] hidden md:block">{entry.target}</span>
                            {/* Toggle */}
                            <button
                              onClick={() => setExpandedRow(isExpanded ? null : entry.id)}
                              className="size-8 flex items-center justify-center rounded-lg hover:bg-white cursor-pointer transition-colors"
                            >
                              <span className="material-symbols-outlined text-[18px] text-[#64748B]">
                                {isExpanded ? "visibility_off" : "visibility"}
                              </span>
                            </button>
                          </div>
                        </div>
                        {/* Expanded details */}
                        {isExpanded && (
                          <div className="px-5 py-3 bg-[#F8FAFC] border-b border-[#E8ECF1]/60">
                            <div className="flex flex-wrap gap-4 text-[13px]">
                              <div>
                                <span className="text-[#94A3B8]">Details: </span>
                                <span className="text-[#334155]">{entry.details}</span>
                              </div>
                              <div>
                                <span className="text-[#94A3B8]">IP: </span>
                                <span className="text-[#334155] font-mono">{entry.ipAddress}</span>
                              </div>
                              <div>
                                <span className="text-[#94A3B8]">ID: </span>
                                <span className="text-[#334155] font-mono">{entry.id}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </td>
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
