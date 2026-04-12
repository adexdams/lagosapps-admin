import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DataTable, { type Column } from "./shared/DataTable";
import FilterBar from "./shared/FilterBar";
import StatCard from "./shared/StatCard";
import StatusBadge from "./shared/StatusBadge";
import {
  mockSubscriptions, formatNaira, formatDate,
  type MockSubscription,
} from "../../data/adminMockData";

export default function MembershipAdmin() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  /* ---------- computed stats ---------- */

  const activeCount = useMemo(
    () => mockSubscriptions.filter((s) => s.status === "active").length,
    [],
  );

  const membershipRevenue = useMemo(() => {
    // Approximate revenue based on tier pricing
    const tierPricing: Record<string, { annual: number; quarterly: number }> = {
      bronze: { annual: 15000, quarterly: 5000 },
      silver: { annual: 28000, quarterly: 8000 },
      gold: { annual: 55000, quarterly: 16000 },
    };
    return mockSubscriptions
      .filter((s) => s.status === "active")
      .reduce((sum, s) => {
        const pricing = tierPricing[s.tier] ?? { annual: 0, quarterly: 0 };
        return sum + (s.billingCycle === "annual" ? pricing.annual : pricing.quarterly);
      }, 0);
  }, []);

  const avgRetention = useMemo(() => {
    const total = mockSubscriptions.length;
    if (total === 0) return "0%";
    const active = mockSubscriptions.filter((s) => s.status === "active").length;
    return `${Math.round((active / total) * 100)}%`;
  }, []);

  /* ---------- filtered data ---------- */

  const filtered = useMemo(() => {
    return mockSubscriptions.filter((s) => {
      const q = search.toLowerCase();
      const matchesSearch = !q || s.userName.toLowerCase().includes(q);
      const matchesTier = !tierFilter || s.tier === tierFilter;
      const matchesStatus = !statusFilter || s.status === statusFilter;
      return matchesSearch && matchesTier && matchesStatus;
    });
  }, [search, tierFilter, statusFilter]);

  /* ---------- table columns ---------- */

  const columns: Column<MockSubscription>[] = [
    {
      key: "userName",
      label: "User",
      sortable: true,
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold flex-shrink-0">
            {row.userAvatar}
          </div>
          <span className="truncate font-medium">{row.userName}</span>
        </div>
      ),
    },
    {
      key: "tier",
      label: "Tier",
      sortable: true,
      render: (_, row) => <StatusBadge status={row.tier} variant="membership" />,
    },
    {
      key: "billingCycle",
      label: "Billing",
      sortable: true,
      hideOnMobile: true,
      render: (_, row) => <span className="capitalize text-on-surface-variant">{row.billingCycle}</span>,
    },
    {
      key: "startedAt",
      label: "Started",
      sortable: true,
      hideOnMobile: true,
      render: (_, row) => <span className="text-on-surface-variant">{formatDate(row.startedAt)}</span>,
    },
    {
      key: "expiresAt",
      label: "Expires",
      sortable: true,
      hideOnMobile: true,
      render: (_, row) => <span className="text-on-surface-variant">{formatDate(row.expiresAt)}</span>,
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      align: "center",
      render: (_, row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <div className="space-y-5 sm:space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] tracking-tight">
            Membership
          </h1>
          <p className="text-[13px] text-[#64748B] mt-1">
            Manage subscriptions and track membership performance.
          </p>
        </div>
        <button
          onClick={() => navigate("/membership/tiers")}
          className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary text-white rounded-xl text-[13px] font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">tune</span>
          Manage Tiers
        </button>
        <button
          onClick={() => navigate("/membership/tiers")}
          className="sm:hidden size-10 flex items-center justify-center bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">tune</span>
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <StatCard
          label="Active Subscriptions"
          value={String(activeCount)}
          icon="card_membership"
          color="#057a55"
        />
        <StatCard
          label="Revenue from Memberships"
          value={formatNaira(membershipRevenue)}
          icon="payments"
          color="#0D47A1"
        />
        <StatCard
          label="Average Retention"
          value={avgRetention}
          icon="autorenew"
          color="#EA580C"
        />
      </div>

      {/* Subscriptions table */}
      <div className="space-y-4 sm:space-y-5">
        <FilterBar
          onSearch={setSearch}
          searchValue={search}
          searchPlaceholder="Search user..."
          filters={[
            {
              key: "tier",
              label: "All Tiers",
              type: "select",
              value: tierFilter,
              options: [
                { label: "Bronze", value: "bronze" },
                { label: "Silver", value: "silver" },
                { label: "Gold", value: "gold" },
              ],
              onChange: setTierFilter,
            },
            {
              key: "status",
              label: "All Statuses",
              type: "select",
              value: statusFilter,
              options: [
                { label: "Active", value: "active" },
                { label: "Expired", value: "expired" },
                { label: "Cancelled", value: "cancelled" },
              ],
              onChange: setStatusFilter,
            },
          ]}
        />

        <DataTable
          columns={columns}
          data={filtered as MockSubscription[]}
          onRowClick={(row) => navigate(`/users/${row.userId}`)}
          emptyMessage="No subscriptions found"
          emptyIcon="card_membership"
        />
      </div>
    </div>
  );
}
