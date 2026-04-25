import { useState, useEffect } from "react";
import DataTable, { type Column } from "./shared/DataTable";
import FilterBar, { type FilterConfig } from "./shared/FilterBar";
import StatCard from "./shared/StatCard";
import StatusBadge from "./shared/StatusBadge";
import { formatDate } from "../../data/adminMockData";
import { getReferrals } from "../../lib/api";

interface RefRow extends Record<string, unknown> {
  id: string;
  referrer_id: string;
  referred_id: string | null;
  gifted_tier: string | null;
  reward_amount: number;
  status: string;
  expires_at: string | null;
  completed_at: string | null;
  created_at: string;
  referrer?: { name: string; email: string };
  referred?: { name: string; email: string } | null;
}

export default function ReferralsAdmin() {
  const [referrals, setReferrals] = useState<RefRow[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await getReferrals();
      if (data) setReferrals(data as RefRow[]);
    })();
  }, []);

  const totalRefs = referrals.length;
  const activeRefs = referrals.filter((r) => r.status === "confirmed" || r.status === "paid").length;
  const expiredRefs = referrals.filter((r) => r.status === "expired").length;

  const filtered = referrals.filter((r) => {
    const referrerName = r.referrer?.name ?? "";
    const referredName = r.referred?.name ?? "";
    const matchSearch =
      !search ||
      referrerName.toLowerCase().includes(search.toLowerCase()) ||
      referredName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const columns: Column<RefRow>[] = [
    {
      key: "referrer",
      label: "Referrer",
      sortable: false,
      render: (row) => (
        <div>
          <p className="text-sm font-semibold text-[#0F172A]">{row.referrer?.name ?? "—"}</p>
          <p className="text-[11px] text-[#94A3B8]">{row.referrer?.email ?? ""}</p>
        </div>
      ),
    },
    {
      key: "referred",
      label: "Referred",
      sortable: false,
      render: (row) => (
        row.referred ? (
          <div>
            <p className="text-sm text-[#334155]">{row.referred.name}</p>
            <p className="text-[11px] text-[#94A3B8]">{row.referred.email}</p>
          </div>
        ) : (
          <span className="text-[13px] text-[#94A3B8] italic">Pending sign-up</span>
        )
      ),
    },
    {
      key: "gifted_tier",
      label: "Gifted Tier",
      align: "center",
      hideOnMobile: true,
      render: (row) => row.gifted_tier ? <StatusBadge status={row.gifted_tier} /> : <span className="text-[#94A3B8]">—</span>,
    },
    {
      key: "reward_amount",
      label: "Reward",
      align: "right",
      hideOnMobile: true,
      render: (row) => (
        <span className="text-sm font-semibold text-[#0F172A]">
          {(row.reward_amount ?? 0) > 0 ? `₦${Number(row.reward_amount).toLocaleString()}` : "—"}
        </span>
      ),
    },
    {
      key: "created_at",
      label: "Created",
      sortable: true,
      hideOnMobile: true,
      render: (row) => (
        <span className="text-[13px] text-[#64748B] whitespace-nowrap">{formatDate(row.created_at)}</span>
      ),
    },
    {
      key: "expires_at",
      label: "Expires",
      hideOnMobile: true,
      render: (row) => (
        <span className="text-[13px] text-[#64748B] whitespace-nowrap">
          {row.expires_at ? formatDate(row.expires_at) : "—"}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      align: "center",
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  const filters: FilterConfig[] = [
    {
      key: "status",
      label: "All Statuses",
      value: statusFilter,
      onChange: setStatusFilter,
      options: [
        { value: "pending", label: "Pending" },
        { value: "confirmed", label: "Confirmed" },
        { value: "paid", label: "Paid" },
        { value: "expired", label: "Expired" },
      ],
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-[#0F172A]">Referrals</h1>
        <p className="text-sm text-[#64748B] mt-0.5">Track referral activity across all users</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Referrals" value={String(totalRefs)} icon="group_add" color="#0D47A1" />
        <StatCard label="Active / Completed" value={String(activeRefs)} icon="check_circle" color="#1B5E20" />
        <StatCard label="Expired" value={String(expiredRefs)} icon="schedule" color="#B71C1C" />
      </div>

      <FilterBar
        onSearch={setSearch}
        searchValue={search}
        searchPlaceholder="Search by referrer or referred name..."
        filters={filters}
      />

      <DataTable<RefRow>
        columns={columns}
        data={filtered}
        pageSize={10}
      />
    </div>
  );
}
