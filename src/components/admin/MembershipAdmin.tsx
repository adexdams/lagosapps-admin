import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DataTable, { type Column } from "./shared/DataTable";
import FilterBar, { type FilterConfig } from "./shared/FilterBar";
import StatCard from "./shared/StatCard";
import StatusBadge from "./shared/StatusBadge";
import { mockSubscriptions, mockBenefitUsage, formatNaira, formatDate, type MockSubscription } from "../../data/adminMockData";

type SubRow = MockSubscription & Record<string, unknown>;

export default function MembershipAdmin() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"subscriptions" | "usage">("subscriptions");
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

  // Benefit usage aggregation
  const allBenefits = mockBenefitUsage.flatMap((u) => u.benefits);
  const benefitNames = [...new Set(allBenefits.map((b) => b.name))];
  const benefitStats = benefitNames.map((name) => {
    const instances = allBenefits.filter((b) => b.name === name);
    const totalUsed = instances.reduce((s, b) => s + b.used, 0);
    const usedCount = instances.filter((b) => b.used > 0).length;
    const atLimit = instances.filter((b) => b.limit !== null && b.used >= b.limit).length;
    return { name, totalUsed, usedCount, total: instances.length, atLimit, limit: instances[0]?.limit, period: instances[0]?.period };
  });
  const mostUsed = benefitStats.sort((a, b) => b.totalUsed - a.totalUsed)[0]?.name ?? "—";
  const leastUsed = benefitStats.sort((a, b) => a.totalUsed - b.totalUsed)[0]?.name ?? "—";
  const atLimitCount = mockBenefitUsage.filter((u) => u.benefits.some((b) => b.limit !== null && b.used >= b.limit)).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0F172A]">Membership</h1>
          <p className="text-sm text-[#64748B] mt-0.5">Manage tiers and subscriptions</p>
        </div>
        <button
          onClick={() => navigate("/membership/tiers")}
          className="inline-flex items-center gap-1.5 px-2.5 sm:px-4 py-2 sm:py-2.5 bg-[#0F172A] text-white text-sm font-semibold rounded-xl cursor-pointer hover:bg-[#1E293B] active:scale-[0.98] transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">tune</span>
          <span className="hidden sm:inline">Manage Tiers</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl p-1 shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 w-fit">
        <button onClick={() => setTab("subscriptions")} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${tab === "subscriptions" ? "bg-primary text-white" : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]"}`}>
          Subscriptions
        </button>
        <button onClick={() => setTab("usage")} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${tab === "usage" ? "bg-primary text-white" : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]"}`}>
          Benefit Usage
        </button>
      </div>

      {tab === "subscriptions" ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Active Subscriptions" value={String(activeSubs.length)} icon="card_membership" color="#4A148C" />
            <StatCard label="Revenue (Total)" value={formatNaira(totalRevenue)} icon="payments" color="#1B5E20" />
            <StatCard label="Retention Rate" value={`${retention}%`} icon="trending_up" color="#0D47A1" />
          </div>

          <FilterBar onSearch={setSearch} searchValue={search} searchPlaceholder="Search subscriptions..." filters={filters} />

          <DataTable<SubRow> columns={columns} data={filtered as SubRow[]} onRowClick={(row) => navigate(`/users/${row.userId}`)} pageSize={10} />
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Most Used Benefit" value={mostUsed} icon="trending_up" color="#1B5E20" />
            <StatCard label="Least Used Benefit" value={leastUsed} icon="trending_down" color="#E65100" />
            <StatCard label="Users at Limit" value={String(atLimitCount)} icon="block" color="#B71C1C" />
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F8FAFC]">
                    <th className="px-4 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-left">Benefit</th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-center hidden sm:table-cell">Limit</th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-center">Total Usage</th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-center hidden md:table-cell">Members Using</th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-center">At Limit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {benefitStats.map((b) => (
                    <tr key={b.name} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-4 py-3 font-medium text-[#0F172A]">{b.name}</td>
                      <td className="px-4 py-3 text-center text-[#64748B] hidden sm:table-cell">{b.limit ? `${b.limit}/${b.period}` : "Unlimited"}</td>
                      <td className="px-4 py-3 text-center font-semibold text-[#0F172A]">{b.totalUsed}</td>
                      <td className="px-4 py-3 text-center text-[#334155] hidden md:table-cell">{b.usedCount}/{b.total} ({b.total > 0 ? Math.round((b.usedCount / b.total) * 100) : 0}%)</td>
                      <td className="px-4 py-3 text-center">
                        {b.atLimit > 0 ? (
                          <span className="inline-block px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-red-50 text-red-600">{b.atLimit} users</span>
                        ) : (
                          <span className="text-[#94A3B8]">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
