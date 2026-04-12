import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DataTable, { type Column } from "./shared/DataTable";
import FilterBar, { type FilterConfig } from "./shared/FilterBar";
import { mockNotifications, formatDate, type MockNotification } from "../../data/adminMockData";

type NotifRow = MockNotification & Record<string, unknown>;

export default function NotificationsAdmin() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const filtered = mockNotifications.filter((n) => {
    const matchSearch = !search || n.title.toLowerCase().includes(search.toLowerCase());
    const matchType = !typeFilter || n.type === typeFilter;
    return matchSearch && matchType;
  });

  const columns: Column<NotifRow>[] = [
    {
      key: "title",
      label: "Title",
      sortable: true,
      render: (row) => <span className="text-sm font-semibold text-[#0F172A]">{row.title}</span>,
    },
    {
      key: "type",
      label: "Type",
      render: (row) => {
        const typeColors: Record<string, { bg: string; text: string }> = {
          order: { bg: "#FFF7ED", text: "#EA580C" },
          wallet: { bg: "#EFF6FF", text: "#2563EB" },
          membership: { bg: "#F5F3FF", text: "#7C3AED" },
          system: { bg: "#F1F5F9", text: "#64748B" },
        };
        const t = row.type as string;
        const colors = typeColors[t] ?? { bg: "#F1F5F9", text: "#64748B" };
        return (
          <span className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-semibold uppercase" style={{ backgroundColor: colors.bg, color: colors.text }}>
            {t}
          </span>
        );
      },
    },
    {
      key: "read",
      label: "Read",
      align: "center",
      hideOnMobile: true,
      render: (row) => (
        <span className={`material-symbols-outlined text-[18px] ${(row.read as boolean) ? "text-[#059669]" : "text-[#94A3B8]"}`}>
          {(row.read as boolean) ? "mark_email_read" : "mail"}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Date",
      sortable: true,
      hideOnMobile: true,
      render: (row) => <span className="text-[13px] text-[#64748B] whitespace-nowrap">{formatDate(row.createdAt as string)}</span>,
    },
  ];

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
          <p className="text-sm text-[#64748B] mt-0.5">Broadcast history and notifications</p>
        </div>
        <button
          onClick={() => navigate("/broadcast/compose")}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl cursor-pointer hover:brightness-[0.92] active:scale-[0.98] transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          New Broadcast
        </button>
      </div>

      <FilterBar
        onSearch={setSearch}
        searchValue={search}
        searchPlaceholder="Search broadcasts..."
        filters={filters}
      />

      <DataTable<NotifRow>
        columns={columns}
        data={filtered as NotifRow[]}
        onRowClick={(row) => navigate(`/broadcast/${row.id}`)}
        pageSize={10}
      />
    </div>
  );
}
