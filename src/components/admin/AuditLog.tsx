import React, { useState, useEffect } from "react";
import FilterBar, { type FilterConfig } from "./shared/FilterBar";
import { formatDate } from "../../data/adminMockData";
import { getAuditLog } from "../../lib/api";

interface AuditRow {
  id: string;
  admin_user_id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
  profiles?: { name: string } | null;
}

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
  "wallet.manual_adjustment": { bg: "#FFF7ED", text: "#EA580C" },
  "membership.config": { bg: "#F5F3FF", text: "#7C3AED" },
  "membership_tier.update": { bg: "#F5F3FF", text: "#7C3AED" },
  "notification.broadcast": { bg: "#F5F3FF", text: "#7C3AED" },
  "broadcast.send": { bg: "#F5F3FF", text: "#7C3AED" },
  "broadcast.retract": { bg: "#FEF2F2", text: "#DC2626" },
  "settings.update": { bg: "#F1F5F9", text: "#64748B" },
  "portal.update": { bg: "#FFF7ED", text: "#EA580C" },
  "inventory.restock": { bg: "#ECFDF5", text: "#059669" },
  "portal.toggle": { bg: "#FFF7ED", text: "#EA580C" },
  "referral.approve": { bg: "#ECFDF5", text: "#059669" },
  "export.data": { bg: "#F1F5F9", text: "#64748B" },
  "team.invite": { bg: "#EFF6FF", text: "#2563EB" },
  "subscription.cancel": { bg: "#FEF2F2", text: "#DC2626" },
  "order.create": { bg: "#ECFDF5", text: "#059669" },
  "fulfillment.update": { bg: "#FFF7ED", text: "#EA580C" },
  "service_request.update": { bg: "#FFF7ED", text: "#EA580C" },
};

const FALLBACK_COLOR = { bg: "#F1F5F9", text: "#64748B" };

function colorForAction(action: string) {
  if (ACTION_COLORS[action]) return ACTION_COLORS[action];
  const prefix = action.split(".")[0];
  return Object.entries(ACTION_COLORS).find(([k]) => k.startsWith(prefix))?.[1] ?? FALLBACK_COLOR;
}

function summariseValues(values: Record<string, unknown> | null): string {
  if (!values) return "—";
  const entries = Object.entries(values).slice(0, 4);
  return entries.map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join(" · ");
}

export default function AuditLog() {
  const [entries, setEntries] = useState<AuditRow[]>([]);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await getAuditLog();
      if (data) setEntries(data as AuditRow[]);
    })();
  }, []);

  const filtered = entries.filter((entry) => {
    const adminName = entry.profiles?.name ?? "";
    const matchSearch =
      !search ||
      adminName.toLowerCase().includes(search.toLowerCase()) ||
      entry.action.toLowerCase().includes(search.toLowerCase()) ||
      (entry.entity_type ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (entry.entity_id ?? "").toLowerCase().includes(search.toLowerCase());
    const matchAction = !actionFilter || entry.action.startsWith(actionFilter);
    return matchSearch && matchAction;
  });

  const actionPrefixes = Array.from(new Set(entries.map((e) => e.action.split(".")[0])));

  const filters: FilterConfig[] = [
    {
      key: "action",
      label: "All Actions",
      value: actionFilter,
      onChange: setActionFilter,
      options: actionPrefixes.map((a) => ({ value: a, label: a.charAt(0).toUpperCase() + a.slice(1) })),
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
        searchPlaceholder="Search by admin, action, or entity..."
        filters={filters}
      />

      <div className="bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm">
            <thead>
              <tr className="bg-[#F8FAFC]">
                <th className="px-2.5 sm:px-4 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-left">Timestamp</th>
                <th className="px-2.5 sm:px-4 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-left hidden sm:table-cell">Admin</th>
                <th className="px-2.5 sm:px-4 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-left">Action</th>
                <th className="px-2.5 sm:px-4 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-left hidden md:table-cell">Entity</th>
                <th className="px-2.5 sm:px-4 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-center">Details</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-[#94A3B8]">
                    {entries.length === 0 ? "No audit entries yet" : "No entries match your search"}
                  </td>
                </tr>
              ) : (
                filtered.map((entry) => {
                  const isExpanded = expandedRow === entry.id;
                  const colors = colorForAction(entry.action);
                  return (
                    <React.Fragment key={entry.id}>
                      <tr className={`border-b border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors ${isExpanded ? "bg-[#F8FAFC]" : ""}`}>
                        <td className="px-2.5 sm:px-4 py-3 text-[11px] sm:text-[13px] text-[#64748B] whitespace-nowrap">
                          {formatDate(entry.created_at)}
                        </td>
                        <td className="px-2.5 sm:px-4 py-3 text-sm font-semibold text-[#0F172A] hidden sm:table-cell">
                          {entry.profiles?.name ?? "—"}
                        </td>
                        <td className="px-2.5 sm:px-4 py-3">
                          <span
                            className="inline-block px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-[9px] sm:text-[11px] font-semibold tracking-wide"
                            style={{ backgroundColor: colors.bg, color: colors.text }}
                          >
                            {entry.action}
                          </span>
                        </td>
                        <td className="px-2.5 sm:px-4 py-3 text-[13px] text-[#334155] hidden md:table-cell">
                          {entry.entity_type && entry.entity_id
                            ? `${entry.entity_type} · ${entry.entity_id}`
                            : entry.entity_type ?? "—"}
                        </td>
                        <td className="px-2.5 sm:px-4 py-3 text-center">
                          <button
                            onClick={() => setExpandedRow(isExpanded ? null : entry.id)}
                            className="size-8 flex items-center justify-center rounded-lg hover:bg-white cursor-pointer transition-colors mx-auto"
                          >
                            <span className="material-symbols-outlined text-[18px] text-[#64748B]">
                              {isExpanded ? "visibility_off" : "visibility"}
                            </span>
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-[#F8FAFC]">
                          <td colSpan={5} className="px-2.5 sm:px-5 py-3 border-b border-[#E8ECF1]/60">
                            <div className="flex flex-col gap-2 text-[12px] sm:text-[13px]">
                              {entry.new_values && (
                                <div>
                                  <span className="text-[#94A3B8]">Changes: </span>
                                  <span className="text-[#334155] font-mono">{summariseValues(entry.new_values)}</span>
                                </div>
                              )}
                              {entry.old_values && (
                                <div>
                                  <span className="text-[#94A3B8]">Before: </span>
                                  <span className="text-[#334155] font-mono">{summariseValues(entry.old_values)}</span>
                                </div>
                              )}
                              {entry.ip_address && (
                                <div>
                                  <span className="text-[#94A3B8]">IP: </span>
                                  <span className="text-[#334155] font-mono">{entry.ip_address}</span>
                                </div>
                              )}
                              <div>
                                <span className="text-[#94A3B8]">ID: </span>
                                <span className="text-[#334155] font-mono">{entry.id}</span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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
