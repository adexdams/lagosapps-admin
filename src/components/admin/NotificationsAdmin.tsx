import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DataTable, { type Column } from "./shared/DataTable";
import StatusBadge from "./shared/StatusBadge";
import { mockNotifications, formatDate, type MockNotification } from "../../data/adminMockData";

export default function NotificationsAdmin() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return mockNotifications;
    const q = search.toLowerCase();
    return mockNotifications.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.recipients.toLowerCase().includes(q) ||
        n.type.toLowerCase().includes(q)
    );
  }, [search]);

  const columns: Column<MockNotification>[] = [
    {
      key: "title",
      label: "Title",
      sortable: true,
      render: (_, row) => (
        <span className="font-semibold text-[#0F172A]">{row.title}</span>
      ),
    },
    {
      key: "type",
      label: "Type",
      align: "center",
      render: (_, row) => <StatusBadge status={row.type} />,
    },
    {
      key: "recipients",
      label: "Recipients",
      hideOnMobile: true,
      render: (_, row) => <span className="text-[#334155]">{row.recipients}</span>,
    },
    {
      key: "sentBy",
      label: "Sent By",
      hideOnMobile: true,
      render: (_, row) => <span className="text-[#334155]">{row.sentBy}</span>,
    },
    {
      key: "sentAt",
      label: "Date",
      sortable: true,
      hideOnMobile: true,
      render: (_, row) => (
        <span className="text-[#64748B]">{formatDate(row.sentAt)}</span>
      ),
    },
    {
      key: "readCount",
      label: "Read Rate",
      align: "right",
      render: (_, row) => {
        const pct =
          row.totalCount > 0
            ? Math.round((row.readCount / row.totalCount) * 100)
            : 0;
        return (
          <span className="text-[#64748B] text-xs">
            {row.readCount.toLocaleString()}/{row.totalCount.toLocaleString()} ({pct}%)
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-5 sm:space-y-8">
      {/* Header row */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0F172A]">Broadcast</h1>
          <p className="text-sm text-[#64748B] mt-1">
            View sent broadcasts and compose new ones.
          </p>
        </div>
        <button
          onClick={() => navigate("/broadcast/compose")}
          className="inline-flex items-center gap-2 h-[44px] px-5 rounded-xl bg-primary text-white text-sm font-semibold hover:brightness-[0.92] active:scale-[0.98] transition-all cursor-pointer shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          New Broadcast
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-white rounded-xl border border-[#E2E8F0] px-3 py-2.5 max-w-sm">
        <span className="material-symbols-outlined text-[18px] text-[#94A3B8]">search</span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search broadcasts..."
          className="bg-transparent text-sm outline-none flex-1 text-[#0F172A] placeholder:text-[#94A3B8]"
        />
      </div>

      {/* Broadcast history table */}
      <DataTable
        columns={columns}
        data={filtered as MockNotification[]}
        emptyMessage="No broadcasts sent yet"
        emptyIcon="campaign"
        onRowClick={(row) => navigate(`/broadcast/${row.id}`)}
      />
    </div>
  );
}
