import { useState, useMemo } from "react";
import DataTable, { type Column } from "./shared/DataTable";
import FilterBar from "./shared/FilterBar";
import StatCard from "./shared/StatCard";
import StatusBadge from "./shared/StatusBadge";
import Button from "../ui/Button";
import { useToast } from "../../hooks/useToast";
import { mockReferrals, formatDate, type MockReferral } from "../../data/adminMockData";

const inputClass =
  "w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm text-[#0F172A] outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all";
const labelClass = "text-[13px] font-semibold text-[#0F172A] mb-1.5 block";

function generateCode(tier: string): string {
  const prefix = tier.slice(0, 3).toUpperCase();
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let random = "";
  for (let i = 0; i < 6; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `REF-${prefix}-${random}`;
}

export default function ReferralsAdmin() {
  const toast = useToast();

  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Generate referral code state
  const [genTier, setGenTier] = useState("bronze");
  const [generatedCode, setGeneratedCode] = useState("");

  const totalReferrals = mockReferrals.length;
  const activeCount = mockReferrals.filter((r) => r.status === "active").length;
  const expiredCount = mockReferrals.filter((r) => r.status === "expired").length;

  const filtered = useMemo(() => {
    return mockReferrals.filter((r) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q || r.referrerName.toLowerCase().includes(q) || r.referredName.toLowerCase().includes(q);
      const matchesTier = !tierFilter || r.giftedTier === tierFilter;
      const matchesStatus = !statusFilter || r.status === statusFilter;
      return matchesSearch && matchesTier && matchesStatus;
    });
  }, [search, tierFilter, statusFilter]);

  const handleGenerate = () => {
    setGeneratedCode(generateCode(genTier));
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode);
      toast.success("Referral code copied to clipboard");
    } catch {
      // Fallback for non-secure contexts
      const textarea = document.createElement("textarea");
      textarea.value = generatedCode;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      toast.success("Referral code copied to clipboard");
    }
  };

  const columns: Column<MockReferral>[] = [
    {
      key: "referrerName",
      label: "Referrer",
      sortable: true,
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold flex-shrink-0">
            {row.referrerAvatar}
          </div>
          <span className="truncate font-medium text-[#0F172A]">{row.referrerName}</span>
        </div>
      ),
    },
    {
      key: "referredName",
      label: "Referred",
      sortable: true,
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-full bg-[#E65100]/10 text-[#E65100] flex items-center justify-center text-[10px] font-bold flex-shrink-0">
            {row.referredAvatar}
          </div>
          <span className="truncate font-medium text-[#0F172A]">{row.referredName}</span>
        </div>
      ),
    },
    {
      key: "giftedTier",
      label: "Gifted Tier",
      sortable: true,
      render: (_, row) => <StatusBadge status={row.giftedTier} variant="membership" />,
    },
    {
      key: "createdAt",
      label: "Created",
      sortable: true,
      hideOnMobile: true,
      render: (_, row) => <span className="text-[#64748B]">{formatDate(row.createdAt)}</span>,
    },
    {
      key: "expiresAt",
      label: "Expires",
      sortable: true,
      hideOnMobile: true,
      render: (_, row) => <span className="text-[#64748B]">{formatDate(row.expiresAt)}</span>,
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      align: "center",
      render: (_, row) => <StatusBadge status={row.status} variant="referral" />,
    },
  ];

  return (
    <div className="space-y-5 sm:space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
        <StatCard
          label="Total Referrals"
          value={String(totalReferrals)}
          icon="group_add"
          color="#0D47A1"
        />
        <StatCard
          label="Active"
          value={String(activeCount)}
          icon="check_circle"
          color="#1B5E20"
          trend={{
            value: `${Math.round((activeCount / totalReferrals) * 100)}% of total`,
            positive: true,
          }}
        />
        <StatCard
          label="Expired"
          value={String(expiredCount)}
          icon="schedule"
          color="#B71C1C"
          trend={{
            value: `${Math.round((expiredCount / totalReferrals) * 100)}% of total`,
            positive: false,
          }}
        />
      </div>

      {/* Generate Referral Code card */}
      <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 p-4 sm:p-6">
        <h2 className="text-base font-bold text-[#0F172A] mb-4">Generate Referral Code</h2>

        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
          {/* Tier dropdown */}
          <div className="w-full sm:w-auto">
            <label className={labelClass}>Tier</label>
            <select
              value={genTier}
              onChange={(e) => {
                setGenTier(e.target.value);
                setGeneratedCode("");
              }}
              className={`${inputClass} sm:w-[180px] cursor-pointer`}
            >
              <option value="bronze">Bronze</option>
              <option value="silver">Silver</option>
              <option value="gold">Gold</option>
            </select>
          </div>

          {/* Generate button */}
          <Button onClick={handleGenerate}>
            <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
            Generate
          </Button>
        </div>

        {/* Generated code display */}
        {generatedCode && (
          <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <input
              type="text"
              readOnly
              value={generatedCode}
              className={`${inputClass} sm:max-w-[280px] bg-[#F8FAFC] font-mono font-semibold tracking-wide`}
            />
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#0F172A] text-white rounded-xl text-sm font-semibold hover:bg-[#1E293B] active:scale-[0.98] transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">content_copy</span>
              Copy
            </button>
          </div>
        )}
      </div>

      {/* Filter + Table */}
      <FilterBar
        onSearch={setSearch}
        searchValue={search}
        searchPlaceholder="Search referrer or referred..."
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
              { label: "Pending", value: "pending" },
              { label: "Expired", value: "expired" },
            ],
            onChange: setStatusFilter,
          },
        ]}
      />

      <DataTable
        columns={columns}
        data={filtered as MockReferral[]}
        emptyMessage="No referrals found"
        emptyIcon="group_add"
      />
    </div>
  );
}
