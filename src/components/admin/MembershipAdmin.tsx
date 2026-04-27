import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DataTable, { type Column } from "./shared/DataTable";
import FilterBar, { type FilterConfig } from "./shared/FilterBar";
import StatCard from "./shared/StatCard";
import StatusBadge from "./shared/StatusBadge";
import { formatNaira, formatDate } from "../../data/adminMockData";
import { getSubscriptions, getBenefitUsage, getMembershipTiers, cancelMembershipSubscription } from "../../lib/api";

interface SubRow extends Record<string, unknown> {
  id: string;
  user_id: string;
  tier: string;
  billing_cycle: string;
  amount_paid: number;
  starts_at: string;
  expires_at: string;
  status: string;
  profiles?: { name: string; email: string };
}

interface BenefitStat {
  key: string;
  label: string;
  totalUsed: number;
  userCount: number;
  atLimit: number;
  limit: number | null;
  period: string | null;
}

export default function MembershipAdmin() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"subscriptions" | "usage">("subscriptions");
  const [subs, setSubs] = useState<SubRow[]>([]);
  const [benefitStats, setBenefitStats] = useState<BenefitStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [cancelTarget, setCancelTarget] = useState<SubRow | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    (async () => {
      const [subRes, usageRes, tierRes] = await Promise.all([
        getSubscriptions(),
        getBenefitUsage(),
        getMembershipTiers(),
      ]);

      if (subRes.data) setSubs(subRes.data as SubRow[]);

      // Aggregate benefit usage
      if (usageRes.data && tierRes.data) {
        const allBenefits: { benefit_key: string; label: string; limit_count: number | null; limit_period: string | null }[] =
          (tierRes.data as Array<{ membership_tier_benefits?: Array<{ benefit_key: string; label: string; limit_count: number | null; limit_period: string | null }> }>)
            .flatMap((t) => t.membership_tier_benefits ?? []);

        const benefitMap = new Map<string, { label: string; limit: number | null; period: string | null }>();
        allBenefits.forEach((b) => {
          if (!benefitMap.has(b.benefit_key)) {
            benefitMap.set(b.benefit_key, { label: b.label, limit: b.limit_count, period: b.limit_period });
          }
        });

        type UsageRow = { benefit_key: string; used_count: number; user_id: string };
        const usageRows = usageRes.data as UsageRow[];
        const grouped = new Map<string, { totalUsed: number; users: Set<string>; atLimit: number }>();

        usageRows.forEach((row) => {
          const existing = grouped.get(row.benefit_key) ?? { totalUsed: 0, users: new Set<string>(), atLimit: 0 };
          existing.totalUsed += row.used_count;
          existing.users.add(row.user_id);
          const limit = benefitMap.get(row.benefit_key)?.limit;
          if (limit !== null && limit !== undefined && row.used_count >= limit) existing.atLimit += 1;
          grouped.set(row.benefit_key, existing);
        });

        const stats: BenefitStat[] = Array.from(grouped.entries()).map(([key, agg]) => {
          const meta = benefitMap.get(key);
          return {
            key,
            label: meta?.label ?? key,
            totalUsed: agg.totalUsed,
            userCount: agg.users.size,
            atLimit: agg.atLimit,
            limit: meta?.limit ?? null,
            period: meta?.period ?? null,
          };
        }).sort((a, b) => b.totalUsed - a.totalUsed);

        setBenefitStats(stats);
      }

      setLoading(false);
    })();
  }, []);

  const activeSubs = subs.filter((s) => s.status === "active");
  const totalRevenue = subs.reduce((s, sub) => s + (sub.amount_paid ?? 0), 0);
  const retention = subs.length > 0 ? Math.round((activeSubs.length / subs.length) * 100) : 0;

  const filtered = subs.filter((s) => {
    const name = s.profiles?.name ?? "";
    const matchSearch = !search || name.toLowerCase().includes(search.toLowerCase());
    const matchTier = !tierFilter || s.tier === tierFilter;
    const matchStatus = !statusFilter || s.status === statusFilter;
    return matchSearch && matchTier && matchStatus;
  });

  const mostUsed = benefitStats[0]?.label ?? "—";
  const leastUsed = benefitStats[benefitStats.length - 1]?.label ?? "—";
  const atLimitTotal = benefitStats.reduce((s, b) => s + b.atLimit, 0);

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    await cancelMembershipSubscription(cancelTarget.id);
    setSubs((prev) => prev.map((s) => s.id === cancelTarget.id ? { ...s, status: "cancelled" } : s));
    setCancelTarget(null);
    setCancelling(false);
  };

  const columns: Column<SubRow>[] = [
    {
      key: "profiles",
      label: "User",
      sortable: false,
      render: (row) => (
        <div>
          <p className="text-sm font-semibold text-[#0F172A]">{row.profiles?.name ?? "—"}</p>
          <p className="text-[11px] text-[#94A3B8]">{row.profiles?.email ?? ""}</p>
        </div>
      ),
    },
    {
      key: "tier",
      label: "Tier",
      sortable: true,
      render: (row) => <StatusBadge status={row.tier} />,
    },
    {
      key: "billing_cycle",
      label: "Billing",
      hideOnMobile: true,
      render: (row) => (
        <span className="text-[13px] text-[#334155] capitalize">{row.billing_cycle}</span>
      ),
    },
    {
      key: "amount_paid",
      label: "Paid",
      align: "right",
      sortable: true,
      hideOnMobile: true,
      render: (row) => (
        <span className="text-sm font-semibold text-[#0F172A]">{formatNaira(row.amount_paid)}</span>
      ),
    },
    {
      key: "starts_at",
      label: "Started",
      sortable: true,
      hideOnMobile: true,
      render: (row) => (
        <span className="text-[13px] text-[#64748B] whitespace-nowrap">{formatDate(row.starts_at)}</span>
      ),
    },
    {
      key: "expires_at",
      label: "Expires",
      sortable: true,
      hideOnMobile: true,
      render: (row) => (
        <span className="text-[13px] text-[#64748B] whitespace-nowrap">{formatDate(row.expires_at)}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      align: "center",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "actions",
      label: "",
      align: "center",
      render: (row) =>
        row.status === "active" ? (
          <button
            onClick={(e) => { e.stopPropagation(); setCancelTarget(row); }}
            className="text-[11px] font-semibold text-red-600 hover:text-red-700 px-2.5 py-1 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
        ) : null,
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
          className="inline-flex items-center gap-1.5 px-2.5 sm:px-4 py-2 sm:py-2.5 bg-[#0F172A] text-white text-sm font-semibold rounded-xl cursor-pointer hover:bg-[#1E293B] active:scale-[0.98] transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">tune</span>
          <span className="hidden sm:inline">Manage Tiers</span>
        </button>
      </div>

      <div className="flex gap-1 bg-white rounded-xl p-1 shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 w-fit">
        <button
          onClick={() => setTab("subscriptions")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${tab === "subscriptions" ? "bg-primary text-white" : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]"}`}
        >
          Subscriptions
        </button>
        <button
          onClick={() => setTab("usage")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${tab === "usage" ? "bg-primary text-white" : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]"}`}
        >
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

          <FilterBar
            onSearch={setSearch}
            searchValue={search}
            searchPlaceholder="Search subscriptions..."
            filters={filters}
          />

          <DataTable<SubRow>
            columns={columns}
            data={filtered}
            onRowClick={(row) => navigate(`/users/${row.user_id}`)}
            pageSize={10}
          />
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Most Used Benefit" value={mostUsed} icon="trending_up" color="#1B5E20" />
            <StatCard label="Least Used Benefit" value={leastUsed} icon="trending_down" color="#E65100" />
            <StatCard label="At Limit (Total)" value={String(atLimitTotal)} icon="block" color="#B71C1C" />
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-sm text-[#94A3B8]">Loading benefit usage...</div>
            ) : benefitStats.length === 0 ? (
              <div className="p-8 text-center text-sm text-[#94A3B8]">No benefit usage recorded yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#F8FAFC]">
                      <th className="px-4 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-left">Benefit</th>
                      <th className="px-4 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-center hidden sm:table-cell">Limit</th>
                      <th className="px-4 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-center">Total Usage</th>
                      <th className="px-4 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-center hidden md:table-cell">Users</th>
                      <th className="px-4 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-center">At Limit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {benefitStats.map((b) => (
                      <tr key={b.key} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="px-4 py-3 font-medium text-[#0F172A] truncate max-w-[160px]">{b.label}</td>
                        <td className="px-4 py-3 text-center text-[#64748B] hidden sm:table-cell">
                          {b.limit ? `${b.limit}/${b.period}` : "Unlimited"}
                        </td>
                        <td className="px-4 py-3 text-center font-semibold text-[#0F172A]">{b.totalUsed}</td>
                        <td className="px-4 py-3 text-center text-[#334155] hidden md:table-cell">{b.userCount}</td>
                        <td className="px-4 py-3 text-center">
                          {b.atLimit > 0 ? (
                            <span className="inline-block px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-red-50 text-red-600">
                              {b.atLimit}
                            </span>
                          ) : (
                            <span className="text-[#94A3B8]">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-red-600 text-[20px]">cancel</span>
              </div>
              <div>
                <p className="font-semibold text-[#0F172A] text-sm">Cancel Subscription</p>
                <p className="text-[12px] text-[#64748B]">{cancelTarget.profiles?.name ?? "This user"}</p>
              </div>
            </div>
            <p className="text-sm text-[#334155]">
              This will immediately cancel the <strong>{cancelTarget.tier}</strong> subscription. The user will lose access to membership benefits.
            </p>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setCancelTarget(null)} className="flex-1 py-2 rounded-xl border border-[#E8ECF1] text-sm font-semibold text-[#64748B] hover:bg-[#F1F5F9] cursor-pointer transition-colors">
                Keep Active
              </button>
              <button onClick={handleCancel} disabled={cancelling} className="flex-1 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-60 cursor-pointer transition-colors">
                {cancelling ? "Cancelling..." : "Yes, Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
