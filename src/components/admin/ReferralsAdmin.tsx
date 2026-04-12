import { useState } from "react";
import DataTable, { type Column } from "./shared/DataTable";
import FilterBar, { type FilterConfig } from "./shared/FilterBar";
import StatCard from "./shared/StatCard";
import StatusBadge from "./shared/StatusBadge";
import { useToast } from "../../hooks/useToast";
import { mockReferrals, formatDate, type MockReferral } from "../../data/adminMockData";

type RefRow = MockReferral & Record<string, unknown>;

export default function ReferralsAdmin() {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Generate referral code state
  const [genTier, setGenTier] = useState("bronze");
  const [generatedCode, setGeneratedCode] = useState("");

  const totalRefs = mockReferrals.length;
  const activeRefs = mockReferrals.filter((r) => r.status === "confirmed" || r.status === "paid").length;
  const expiredRefs = mockReferrals.filter((r) => r.status === "expired").length;

  const filtered = mockReferrals.filter((r) => {
    const matchSearch = !search || r.referrerName.toLowerCase().includes(search.toLowerCase()) || r.referredName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const generateCode = () => {
    const prefix = genTier.slice(0, 3).toUpperCase();
    const random = Math.random().toString(36).slice(2, 8).toUpperCase();
    const code = `REF-${prefix}-${random}`;
    setGeneratedCode(code);
    toast.success("Referral code generated");
  };

  const copyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    toast.success("Code copied to clipboard");
  };

  const columns: Column<RefRow>[] = [
    {
      key: "referrerName",
      label: "Referrer",
      sortable: true,
      render: (row) => <span className="text-sm font-semibold text-[#0F172A]">{row.referrerName}</span>,
    },
    {
      key: "referredName",
      label: "Referred",
      sortable: true,
      render: (row) => <span className="text-sm text-[#334155]">{row.referredName}</span>,
    },
    {
      key: "reward",
      label: "Reward",
      align: "right",
      hideOnMobile: true,
      render: (row) => {
        const reward = row.reward as number;
        return <span className="text-sm font-semibold text-[#0F172A]">{reward > 0 ? `\u20A6${reward.toLocaleString()}` : "-"}</span>;
      },
    },
    {
      key: "createdAt",
      label: "Created",
      sortable: true,
      hideOnMobile: true,
      render: (row) => <span className="text-[13px] text-[#64748B] whitespace-nowrap">{formatDate(row.createdAt as string)}</span>,
    },
    {
      key: "completedAt",
      label: "Completed",
      hideOnMobile: true,
      render: (row) => {
        const completedAt = row.completedAt as string | null;
        return <span className="text-[13px] text-[#64748B] whitespace-nowrap">{completedAt ? formatDate(completedAt) : "-"}</span>;
      },
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

  const inputClass = "border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm text-[#334155] bg-white outline-none cursor-pointer focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all";

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-[#0F172A]">Referrals</h1>
        <p className="text-sm text-[#64748B] mt-0.5">Track and manage referral codes</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Referrals" value={String(totalRefs)} icon="group_add" color="#0D47A1" />
        <StatCard label="Active / Completed" value={String(activeRefs)} icon="check_circle" color="#1B5E20" />
        <StatCard label="Expired" value={String(expiredRefs)} icon="schedule" color="#B71C1C" />
      </div>

      {/* Generate Referral Code */}
      <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 p-5">
        <h3 className="text-sm font-bold text-[#0F172A] mb-3">Generate Referral Code</h3>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="text-[13px] font-semibold text-[#0F172A] mb-1.5 block">Tier</label>
            <select value={genTier} onChange={(e) => setGenTier(e.target.value)} className={inputClass}>
              <option value="bronze">Bronze</option>
              <option value="silver">Silver</option>
              <option value="gold">Gold</option>
            </select>
          </div>
          <button
            onClick={generateCode}
            className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl cursor-pointer hover:brightness-[0.92] active:scale-[0.98] transition-all"
          >
            Generate
          </button>
          {generatedCode && (
            <div className="flex items-center gap-2 bg-[#F1F5F9] rounded-xl px-4 py-2.5">
              <span className="text-sm font-mono font-bold text-[#0F172A]">{generatedCode}</span>
              <button onClick={copyCode} className="cursor-pointer hover:opacity-70">
                <span className="material-symbols-outlined text-[16px] text-[#64748B]">content_copy</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <FilterBar
        onSearch={setSearch}
        searchValue={search}
        searchPlaceholder="Search referrals..."
        filters={filters}
      />

      <DataTable<RefRow>
        columns={columns}
        data={filtered as RefRow[]}
        pageSize={10}
      />
    </div>
  );
}
