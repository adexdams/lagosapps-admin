import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DataTable, { type Column } from "./shared/DataTable";
import FilterBar, { type FilterConfig } from "./shared/FilterBar";
import StatCard from "./shared/StatCard";
import StatusBadge from "./shared/StatusBadge";
import { mockSubscriptions, formatNaira, formatDate, type MockSubscription } from "../../data/adminMockData";

type SubRow = MockSubscription & Record<string, unknown>;

export default function MembershipAdmin() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const activeSubs = mockSubscriptions.filter((s) => s.status === "active");
  const totalRevenue = mockSubscriptions.reduce((sum, s) => sum + s.amount, 0);
  const retention = activeSubs.length > 0 ? Math.round((activeSubs.length / mockSubscriptions.length) * 100) : 0;

  const filtered = mockSubscriptions.filter((s) => {
    const matchSearch = !search || s.userName.toLowerCase().includes(search.toLowerCase());
    const matchTier = !tierFilter || s.tier === tierFilter;
    const matchStatus = !statusFilter || s.status === statusFilter;
    return matchSearch && matchTier && matchStatus;
  });

  const columns: Column<SubRow>[] = [
    {
      key: "userName",
      label: "User",
      sortable: true,
      render: (row) => <span className="text-sm font-semibold text-[#0F172A]">{row.userName}</span>,
    },
    {
      key: "tier",
      label: "Tier",
      sortable: true,
      render: (row) => <StatusBadge status={row.tier as string} />,
    },
    {
      key: "amount",
      label: "Billing",
      align: "right",
      sortable: true,
      hideOnMobile: true,
      render: (row) => <span className="text-sm font-semibold text-[#0F172A]">{formatNaira(row.amount as number)}/mo</span>,
    },
    {
      key: "startDate",
      label: "Started",
      sortable: true,
      hideOnMobile: true,
      render: (row) => <span className="text-[13px] text-[#64748B] whitespace-nowrap">{formatDate(row.startDate as string)}</span>,
    },
    {
      key: "endDate",
      label: "Expires",
      sortable: true,
      hideOnMobile: true,
      render: (row) => <span className="text-[13px] text-[#64748B] whitespace-nowrap">{formatDate(row.endDate as string)}</span>,
    },
    {
      key: "status",
      label: "Status",
      align: "center",
      render: (row) => <StatusBadge status={row.status as string} />,
    },
  ];

  const filters: FilterConfig[] = [
    {
      key: "tier",
      label: "All Tiers",
      value: tierFilter,
      onChange: setTierFilter,
      options: [
        { value: "bronze", label: "Bronze" },
        { value: "silver", label: "Silver" },
        { value: "gold", label: "Gold" },
      ],
    },
    {
      key: "status",
      label: "All Statuses",
      value: statusFilter,
      onChange: setStatusFilter,
      options: [
        { value: "active", label: "Active" },
        { value: "expired", label: "Expired" },
        { value: "cancelled", label: "Cancelled" },
      ],
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0F172A]">Membership</h1>
          <p className="text-sm text-[#64748B] mt-0.5">Manage tiers and subscriptions</p>
        </div>
        <button
          onClick={() => navigate("/membership/tiers")}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#0F172A] text-white text-sm font-semibold rounded-xl cursor-pointer hover:bg-[#1E293B] active:scale-[0.98] transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">tune</span>
          Manage Tiers
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Active Subscriptions" value={String(activeSubs.length)} icon="card_membership" color="#4A148C" />
        <StatCard label="Revenue (Total)" value={formatNaira(totalRevenue)} icon="payments" color="#1B5E20" />
        <StatCard label="Retention Rate" value={`${retention}%`} icon="trending_up" color="#0D47A1" />
      </div>

      <FilterBar
        onSearch={setSearch}
        searchValue={search}
        searchPlaceholder="Search subscriptions..."
        filters={filters}
      />

      <DataTable<SubRow>
        columns={columns}
        data={filtered as SubRow[]}
        onRowClick={(row) => navigate(`/users/${row.userId}`)}
        pageSize={10}
      />
    </div>
  );
}
