import { useState, useMemo } from "react";
import type { Column } from "./shared/DataTable";
import FilterBar from "./shared/FilterBar";
import { mockAuditLog, type MockAuditEntry } from "../../data/adminMockData";

const ACTION_COLORS: Record<string, string> = {
  "product.create": "bg-primary/10 text-primary",
  "product.update": "bg-[#0D47A1]/10 text-[#0D47A1]",
  "product.delete": "bg-error/10 text-error",
  "order.status_change": "bg-[#E65100]/10 text-[#E65100]",
  "order.cancel": "bg-error/10 text-error",
  "order.refund": "bg-[#B71C1C]/10 text-[#B71C1C]",
  "user.deactivate": "bg-error/10 text-error",
  "user.wallet_adjust": "bg-[#0D47A1]/10 text-[#0D47A1]",
  "user.membership_change": "bg-[#4A148C]/10 text-[#4A148C]",
  "membership.tier_update": "bg-[#F9A825]/10 text-[#F9A825]",
  "membership.benefit_update": "bg-[#4A148C]/10 text-[#4A148C]",
  "notification.broadcast": "bg-[#0D47A1]/10 text-[#0D47A1]",
  "settings.update": "bg-surface-container text-on-surface-variant",
};

export default function AuditLog() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return mockAuditLog.filter((e) => {
      const q = search.toLowerCase();
      const matchesSearch = !q || e.entity.toLowerCase().includes(q) || e.action.toLowerCase().includes(q) || e.admin.toLowerCase().includes(q);
      const matchesAction = !actionFilter || e.action.startsWith(actionFilter);
      return matchesSearch && matchesAction;
    });
  }, [search, actionFilter]);

  const columns: Column<MockAuditEntry>[] = [
    {
      key: "timestamp",
      label: "Timestamp",
      sortable: true,
      render: (_, row) => <span className="text-on-surface-variant text-xs">{row.timestamp}</span>,
    },
    {
      key: "admin",
      label: "Admin",
      hideOnMobile: true,
      render: (_, row) => <span className="font-medium text-on-surface">{row.admin}</span>,
    },
    {
      key: "action",
      label: "Action",
      sortable: true,
      render: (_, row) => (
        <span className={`inline-block text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full ${ACTION_COLORS[row.action] || "bg-surface-container text-on-surface-variant"}`}>
          {row.action}
        </span>
      ),
    },
    {
      key: "entity",
      label: "Entity",
      hideOnMobile: true,
      render: (_, row) => <span className="text-sm text-on-surface">{row.entity}</span>,
    },
    {
      key: "details",
      label: "Details",
      hideOnMobile: true,
      render: (_, row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpandedId(expandedId === row.id ? null : row.id);
          }}
          className="p-1.5 rounded-lg hover:bg-[#F1F5F9] cursor-pointer transition-colors"
          title={expandedId === row.id ? "Hide details" : "View details"}
        >
          <span className="material-symbols-outlined text-[18px] text-[#64748B]">
            {expandedId === row.id ? "visibility_off" : "visibility"}
          </span>
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-5">
      <FilterBar
        onSearch={setSearch}
        searchValue={search}
        searchPlaceholder="Search entity, action, or admin..."
        filters={[
          {
            key: "action",
            label: "All Actions",
            type: "select",
            value: actionFilter,
            options: [
              { label: "Product", value: "product" },
              { label: "Order", value: "order" },
              { label: "User", value: "user" },
              { label: "Membership", value: "membership" },
              { label: "Notification", value: "notification" },
              { label: "Settings", value: "settings" },
            ],
            onChange: setActionFilter,
          },
        ]}
      />

      {/* Custom table to support expandable rows */}
      <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F8FAFC] text-on-surface-variant">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`px-4 py-2.5 font-bold text-xs uppercase tracking-wider text-left ${col.hideOnMobile ? "hidden md:table-cell" : ""}`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/8">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12 text-center text-on-surface-variant">
                    No audit log entries found
                  </td>
                </tr>
              ) : (
                filtered.slice(0, 50).map((entry) => (
                  <>
                    <tr key={entry.id} className="hover:bg-surface-container/30">
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          className={`px-4 py-3 ${col.hideOnMobile ? "hidden md:table-cell" : ""}`}
                        >
                          {col.render ? col.render(entry[col.key as keyof MockAuditEntry], entry) : String(entry[col.key as keyof MockAuditEntry])}
                        </td>
                      ))}
                    </tr>
                    {expandedId === entry.id && (
                      <tr key={`${entry.id}-detail`} className="bg-[#F8FAFC]">
                        <td colSpan={columns.length} className="px-6 py-3">
                          <div className="text-sm">
                            <span className="font-bold text-on-surface-variant">Details: </span>
                            <span className="text-on-surface">{entry.details}</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
