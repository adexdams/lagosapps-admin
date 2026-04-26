import { useState, useEffect } from "react";
import DataTable, { type Column } from "./shared/DataTable";
import FilterBar, { type FilterConfig } from "./shared/FilterBar";
import StatCard from "./shared/StatCard";
import StatusBadge from "./shared/StatusBadge";
import { formatDate } from "../../data/adminMockData";
import { getReferrals, getAdminReferralCodes, createAdminReferralCode, updateAdminReferralCode, logAudit } from "../../lib/api";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";

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

interface CodeRow extends Record<string, unknown> {
  id: string;
  code: string;
  gifted_tier: string;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  creator?: { name: string; email: string } | null;
}

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return "LA" + Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export default function ReferralsAdmin() {
  const { user } = useAuth();
  const toast = useToast();

  const [tab, setTab] = useState<"referrals" | "codes">("referrals");

  // ── Referrals tab ──────────────────────────────────────────
  const [referrals, setReferrals] = useState<RefRow[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // ── Promo Codes tab ────────────────────────────────────────
  const [codes, setCodes] = useState<CodeRow[]>([]);
  const [codesLoading, setCodesLoading] = useState(true);
  const [codeSearch, setCodeSearch] = useState("");
  const [codeStatusFilter, setCodeStatusFilter] = useState("");

  // ── Create code modal ──────────────────────────────────────
  const [createModal, setCreateModal] = useState(false);
  const [newCode, setNewCode] = useState(generateCode());
  const [newTier, setNewTier] = useState<"bronze" | "silver" | "gold">("bronze");
  const [usageType, setUsageType] = useState<"single" | "limited" | "unlimited">("single");
  const [maxUsesInput, setMaxUsesInput] = useState("10");
  const [expiryInput, setExpiryInput] = useState("");
  const [descInput, setDescInput] = useState("");
  const [creating, setCreating] = useState(false);

  // ── Deactivate confirm ─────────────────────────────────────
  const [deactivateTarget, setDeactivateTarget] = useState<CodeRow | null>(null);
  const [deactivating, setDeactivating] = useState(false);

  useEffect(() => {
    loadReferrals();
    loadCodes();
  }, []);

  async function loadReferrals() {
    const { data } = await getReferrals();
    if (data) setReferrals(data as RefRow[]);
  }

  async function loadCodes() {
    setCodesLoading(true);
    const { data } = await getAdminReferralCodes();
    if (data) setCodes(data as CodeRow[]);
    setCodesLoading(false);
  }

  // ── Create Code ────────────────────────────────────────────
  async function handleCreate() {
    if (!newCode.trim()) { toast.error("Enter a code"); return; }
    if (usageType === "limited") {
      const n = parseInt(maxUsesInput, 10);
      if (!n || n < 2) { toast.error("Enter a limit of 2 or more"); return; }
    }
    if (!user?.id) return;
    setCreating(true);

    const maxUses = usageType === "single" ? 1 : usageType === "limited" ? parseInt(maxUsesInput, 10) : null;
    const { data, error } = await createAdminReferralCode({
      code: newCode.trim().toUpperCase(),
      gifted_tier: newTier,
      max_uses: maxUses,
      expires_at: expiryInput || null,
      description: descInput.trim() || null,
      created_by: user.id,
    });

    if (error) {
      toast.error(error.message.includes("unique") ? "Code already exists — try a different one" : error.message);
      setCreating(false);
      return;
    }

    void logAudit({ action: "referral_code.create", entity_type: "admin_referral_codes", entity_id: (data as CodeRow).id, new_values: { code: newCode, tier: newTier, max_uses: maxUses } });
    await loadCodes();
    toast.success(`Code "${newCode.trim().toUpperCase()}" created`);
    setCreateModal(false);
    setNewCode(generateCode());
    setDescInput("");
    setExpiryInput("");
    setCreating(false);
  }

  // ── Deactivate Code ────────────────────────────────────────
  async function handleDeactivate() {
    if (!deactivateTarget) return;
    setDeactivating(true);
    await updateAdminReferralCode(deactivateTarget.id, { is_active: false });
    void logAudit({ action: "referral_code.deactivate", entity_type: "admin_referral_codes", entity_id: deactivateTarget.id });
    setCodes((prev) => prev.map((c) => c.id === deactivateTarget.id ? { ...c, is_active: false } : c));
    toast.success("Code deactivated");
    setDeactivateTarget(null);
    setDeactivating(false);
  }

  // ── Referrals table ────────────────────────────────────────
  const totalRefs = referrals.length;
  const activeRefs = referrals.filter((r) => r.status === "confirmed" || r.status === "paid").length;
  const expiredRefs = referrals.filter((r) => r.status === "expired").length;

  const filteredRefs = referrals.filter((r) => {
    const referrerName = r.referrer?.name ?? "";
    const referredName = r.referred?.name ?? "";
    const matchSearch = !search || referrerName.toLowerCase().includes(search.toLowerCase()) || referredName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const refColumns: Column<RefRow>[] = [
    { key: "referrer", label: "Referrer", sortable: false, render: (row) => <div><p className="text-sm font-semibold text-[#0F172A]">{row.referrer?.name ?? "—"}</p><p className="text-[11px] text-[#94A3B8]">{row.referrer?.email ?? ""}</p></div> },
    { key: "referred", label: "Referred", sortable: false, render: (row) => row.referred ? <div><p className="text-sm text-[#334155]">{row.referred.name}</p><p className="text-[11px] text-[#94A3B8]">{row.referred.email}</p></div> : <span className="text-[13px] text-[#94A3B8] italic">Pending sign-up</span> },
    { key: "gifted_tier", label: "Tier", align: "center", hideOnMobile: true, render: (row) => row.gifted_tier ? <StatusBadge status={row.gifted_tier} /> : <span className="text-[#94A3B8]">—</span> },
    { key: "created_at", label: "Created", sortable: true, hideOnMobile: true, render: (row) => <span className="text-[13px] text-[#64748B] whitespace-nowrap">{formatDate(row.created_at)}</span> },
    { key: "expires_at", label: "Expires", hideOnMobile: true, render: (row) => <span className="text-[13px] text-[#64748B] whitespace-nowrap">{row.expires_at ? formatDate(row.expires_at) : "—"}</span> },
    { key: "status", label: "Status", align: "center", render: (row) => <StatusBadge status={row.status} /> },
  ];

  const refFilters: FilterConfig[] = [
    { key: "status", label: "All Statuses", value: statusFilter, onChange: setStatusFilter, options: [{ value: "pending", label: "Pending" }, { value: "confirmed", label: "Confirmed" }, { value: "paid", label: "Paid" }, { value: "expired", label: "Expired" }] },
  ];

  // ── Promo Codes table ──────────────────────────────────────
  const activeCodes = codes.filter((c) => c.is_active).length;
  const totalUses = codes.reduce((s, c) => s + c.used_count, 0);

  const filteredCodes = codes.filter((c) => {
    const matchSearch = !codeSearch || c.code.toLowerCase().includes(codeSearch.toLowerCase()) || (c.description ?? "").toLowerCase().includes(codeSearch.toLowerCase());
    const matchStatus = !codeStatusFilter || (codeStatusFilter === "active" ? c.is_active : !c.is_active);
    return matchSearch && matchStatus;
  });

  const codeColumns: Column<CodeRow>[] = [
    {
      key: "code",
      label: "Code",
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-sm text-primary">{row.code}</span>
          <button
            onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(row.code); toast.success("Copied!"); }}
            className="text-[#94A3B8] hover:text-primary cursor-pointer transition-colors"
            title="Copy code"
          >
            <span className="material-symbols-outlined text-[14px]">content_copy</span>
          </button>
        </div>
      ),
    },
    {
      key: "gifted_tier",
      label: "Tier",
      align: "center",
      render: (row) => <StatusBadge status={row.gifted_tier} />,
    },
    {
      key: "max_uses",
      label: "Usage",
      align: "center",
      render: (row) => (
        <div className="text-center">
          <span className="text-sm font-semibold text-[#0F172A]">{row.used_count}</span>
          <span className="text-[#94A3B8] text-sm"> / </span>
          <span className="text-sm text-[#64748B]">{row.max_uses === null ? "∞" : row.max_uses}</span>
        </div>
      ),
    },
    {
      key: "expires_at",
      label: "Expires",
      hideOnMobile: true,
      render: (row) => <span className="text-[13px] text-[#64748B] whitespace-nowrap">{row.expires_at ? formatDate(row.expires_at) : "Never"}</span>,
    },
    {
      key: "description",
      label: "Note",
      hideOnMobile: true,
      render: (row) => <span className="text-[13px] text-[#64748B] truncate max-w-[160px] block">{row.description || "—"}</span>,
    },
    {
      key: "is_active",
      label: "Status",
      align: "center",
      render: (row) => <StatusBadge status={row.is_active ? "active" : "inactive"} />,
    },
    {
      key: "actions",
      label: "",
      align: "center",
      render: (row) => row.is_active ? (
        <button
          onClick={(e) => { e.stopPropagation(); setDeactivateTarget(row); }}
          className="text-[11px] font-semibold text-[#DC2626] hover:text-[#B91C1C] px-2.5 py-1 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
        >
          Deactivate
        </button>
      ) : null,
    },
  ];

  const codeFilters: FilterConfig[] = [
    { key: "status", label: "All Statuses", value: codeStatusFilter, onChange: setCodeStatusFilter, options: [{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }] },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0F172A]">Referrals</h1>
          <p className="text-sm text-[#64748B] mt-0.5">User referrals and admin promo codes</p>
        </div>
        {tab === "codes" && (
          <button
            onClick={() => { setNewCode(generateCode()); setCreateModal(true); }}
            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 bg-[#0F172A] text-white text-sm font-semibold rounded-xl cursor-pointer hover:bg-[#1E293B] active:scale-[0.98] transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span className="hidden sm:inline">New Code</span>
          </button>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-white rounded-xl p-1 shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 w-fit">
        <button onClick={() => setTab("referrals")} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${tab === "referrals" ? "bg-primary text-white" : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]"}`}>
          User Referrals
        </button>
        <button onClick={() => setTab("codes")} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${tab === "codes" ? "bg-primary text-white" : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]"}`}>
          Promo Codes
        </button>
      </div>

      {/* ── User Referrals tab ─────────────────────────────── */}
      {tab === "referrals" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Total Referrals" value={String(totalRefs)} icon="group_add" color="#0D47A1" />
            <StatCard label="Active / Completed" value={String(activeRefs)} icon="check_circle" color="#1B5E20" />
            <StatCard label="Expired" value={String(expiredRefs)} icon="schedule" color="#B71C1C" />
          </div>
          <FilterBar onSearch={setSearch} searchValue={search} searchPlaceholder="Search by referrer or referred name..." filters={refFilters} />
          <DataTable<RefRow> columns={refColumns} data={filteredRefs} pageSize={10} />
        </>
      )}

      {/* ── Promo Codes tab ────────────────────────────────── */}
      {tab === "codes" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Active Codes" value={String(activeCodes)} icon="confirmation_number" color="#4A148C" />
            <StatCard label="Total Codes" value={String(codes.length)} icon="list" color="#0D47A1" />
            <StatCard label="Total Uses" value={String(totalUses)} icon="people" color="#1B5E20" />
          </div>

          <FilterBar onSearch={setCodeSearch} searchValue={codeSearch} searchPlaceholder="Search by code or description..." filters={codeFilters} />

          {codesLoading ? (
            <div className="bg-white rounded-2xl border border-[#E8ECF1]/60 p-8 text-center text-sm text-[#94A3B8]">Loading codes…</div>
          ) : (
            <DataTable<CodeRow> columns={codeColumns} data={filteredCodes} pageSize={15} />
          )}
        </>
      )}

      {/* ── Create Code Modal ──────────────────────────────── */}
      {createModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#0F172A]">Create Promo Code</h3>
              <button onClick={() => setCreateModal(false)} className="text-[#94A3B8] hover:text-[#64748B] cursor-pointer">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-4">
              {/* Code input */}
              <div>
                <label className="text-[12px] font-semibold text-[#64748B] uppercase tracking-wide block mb-1.5">Code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ""))}
                    maxLength={20}
                    className="flex-1 border-2 border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm font-mono font-bold uppercase outline-none focus:border-primary transition-all"
                    placeholder="e.g. WELCOME2026"
                  />
                  <button
                    onClick={() => setNewCode(generateCode())}
                    className="px-3 py-2.5 border-2 border-[#E2E8F0] rounded-xl text-[#64748B] hover:border-primary hover:text-primary cursor-pointer transition-all"
                    title="Generate random code"
                  >
                    <span className="material-symbols-outlined text-[18px]">refresh</span>
                  </button>
                </div>
              </div>

              {/* Tier */}
              <div>
                <label className="text-[12px] font-semibold text-[#64748B] uppercase tracking-wide block mb-1.5">Gifted Tier</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["bronze", "silver", "gold"] as const).map((t) => {
                    const colors: Record<string, string> = { bronze: "#8D6E63", silver: "#78909C", gold: "#F9A825" };
                    const active = newTier === t;
                    return (
                      <button
                        key={t}
                        onClick={() => setNewTier(t)}
                        className={`py-2.5 rounded-xl text-sm font-bold capitalize cursor-pointer transition-all border-2 ${active ? "text-white" : "text-[#64748B] bg-white"}`}
                        style={{ borderColor: active ? colors[t] : "#E2E8F0", backgroundColor: active ? colors[t] : undefined }}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Usage limit */}
              <div>
                <label className="text-[12px] font-semibold text-[#64748B] uppercase tracking-wide block mb-1.5">Usage Limit</label>
                <div className="flex gap-1 bg-[#F1F5F9] rounded-xl p-1 mb-2">
                  {([["single", "Single use"], ["limited", "Limited"], ["unlimited", "Unlimited"]] as const).map(([v, label]) => (
                    <button
                      key={v}
                      onClick={() => setUsageType(v)}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${usageType === v ? "bg-white text-[#0F172A] shadow-sm" : "text-[#64748B]"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {usageType === "limited" && (
                  <input
                    type="number"
                    min="2"
                    placeholder="e.g. 50"
                    value={maxUsesInput}
                    onChange={(e) => setMaxUsesInput(e.target.value)}
                    className="w-full border-2 border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary transition-all"
                  />
                )}
                {usageType === "single" && <p className="text-[12px] text-[#94A3B8]">Code can only be used once, then automatically deactivates.</p>}
                {usageType === "unlimited" && <p className="text-[12px] text-[#94A3B8]">Code never runs out — deactivate manually when done.</p>}
              </div>

              {/* Expiry */}
              <div>
                <label className="text-[12px] font-semibold text-[#64748B] uppercase tracking-wide block mb-1.5">Expiry Date <span className="font-normal normal-case">(optional)</span></label>
                <input
                  type="date"
                  value={expiryInput}
                  onChange={(e) => setExpiryInput(e.target.value)}
                  className="w-full border-2 border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary bg-white cursor-pointer transition-all"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-[12px] font-semibold text-[#64748B] uppercase tracking-wide block mb-1.5">Note <span className="font-normal normal-case">(optional)</span></label>
                <input
                  type="text"
                  placeholder="e.g. Q2 sales campaign"
                  value={descInput}
                  onChange={(e) => setDescInput(e.target.value)}
                  className="w-full border-2 border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary transition-all"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={() => setCreateModal(false)} className="flex-1 py-2.5 rounded-xl border border-[#E2E8F0] text-sm font-semibold text-[#64748B] hover:bg-[#F1F5F9] cursor-pointer transition-colors">
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:brightness-[0.92] disabled:opacity-60 cursor-pointer transition-all"
              >
                {creating ? "Creating…" : "Create Code"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Deactivate Confirm ─────────────────────────────── */}
      {deactivateTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-amber-600 text-[20px]">block</span>
              </div>
              <div>
                <p className="font-semibold text-[#0F172A] text-sm">Deactivate Code</p>
                <p className="font-mono font-bold text-primary text-sm">{deactivateTarget.code}</p>
              </div>
            </div>
            <p className="text-sm text-[#334155]">No new users will be able to redeem this code. Existing redemptions are unaffected.</p>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setDeactivateTarget(null)} className="flex-1 py-2.5 rounded-xl border border-[#E2E8F0] text-sm font-semibold text-[#64748B] hover:bg-[#F1F5F9] cursor-pointer transition-colors">
                Keep Active
              </button>
              <button onClick={handleDeactivate} disabled={deactivating} className="flex-1 py-2.5 rounded-xl bg-[#DC2626] text-white text-sm font-semibold hover:bg-[#B91C1C] disabled:opacity-60 cursor-pointer transition-colors">
                {deactivating ? "Deactivating…" : "Deactivate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
