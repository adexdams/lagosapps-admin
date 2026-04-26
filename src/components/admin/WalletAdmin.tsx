import { useState, useEffect, useCallback } from "react";
import DataTable, { type Column } from "./shared/DataTable";
import FilterBar, { type FilterConfig } from "./shared/FilterBar";
import StatCard from "./shared/StatCard";
import StatusBadge from "./shared/StatusBadge";
import { useToast } from "../../hooks/useToast";
import { formatNaira, formatDate } from "../../data/adminMockData";
import {
  getWalletTransactions,
  createWalletTransaction,
  updateUserWalletBalance,
  getUsers,
  generateTxnId,
  logAudit,
} from "../../lib/api";

interface TxnRow extends Record<string, unknown> {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  type: "credit" | "debit";
  running_balance: number;
  created_at: string;
  user_profile?: { name: string; email: string };
}

interface UserRow {
  id: string;
  name: string;
  email: string;
  wallet_balance: number;
}

const inputClass =
  "w-full border-2 border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm text-[#0F172A] outline-none focus:border-primary transition-all";

export default function WalletAdmin() {
  const toast = useToast();
  const [txns, setTxns] = useState<TxnRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [showAdjust, setShowAdjust] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [adjUserId, setAdjUserId] = useState("");
  const [adjUserSearch, setAdjUserSearch] = useState("");
  const [adjAmount, setAdjAmount] = useState("");
  const [adjType, setAdjType] = useState<"credit" | "debit">("credit");
  const [adjReason, setAdjReason] = useState("");

  const loadData = useCallback(async () => {
    const [txnRes, userRes] = await Promise.all([getWalletTransactions(), getUsers()]);
    if (txnRes.data) setTxns(txnRes.data as TxnRow[]);
    if (userRes.data) setUsers(userRes.data as UserRow[]);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const totalCredits = txns.filter((t) => t.type === "credit").reduce((s, t) => s + t.amount, 0);
  const totalDebits = txns.filter((t) => t.type === "debit").reduce((s, t) => s + t.amount, 0);
  const totalBalance = users.reduce((s, u) => s + (u.wallet_balance ?? 0), 0);

  const filtered = txns.filter((t) => {
    const name = t.user_profile?.name ?? "";
    const matchSearch =
      !search ||
      name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase());
    const matchType = !typeFilter || t.type === typeFilter;
    return matchSearch && matchType;
  });

  const handleAdjust = async () => {
    if (!adjUserId || !adjAmount || !adjReason) { toast.error("All fields are required"); return; }
    const amount = parseFloat(adjAmount);
    if (isNaN(amount) || amount <= 0) { toast.error("Enter a valid positive amount"); return; }

    const user = users.find((u) => u.id === adjUserId);
    if (!user) { toast.error("User not found"); return; }

    setSubmitting(true);
    const currentBalance = user.wallet_balance ?? 0;
    const newBalance = adjType === "credit"
      ? currentBalance + amount
      : Math.max(0, currentBalance - amount);
    const txnId = generateTxnId();

    const { error } = await createWalletTransaction({
      id: txnId,
      user_id: adjUserId,
      description: `Admin adjustment: ${adjReason}`,
      amount,
      type: adjType,
      running_balance: newBalance,
      reference: txnId,
    });

    if (error) { toast.error("Failed to create transaction"); setSubmitting(false); return; }

    await updateUserWalletBalance(adjUserId, newBalance);

    logAudit({
      action: "wallet.manual_adjustment",
      entity_type: "wallet",
      entity_id: txnId,
      new_values: { user_id: adjUserId, type: adjType, amount, reason: adjReason, new_balance: newBalance },
    });

    toast.success(
      `${adjType === "credit" ? "Credited" : "Debited"} ${formatNaira(amount)} ${adjType === "credit" ? "to" : "from"} ${user.name}`
    );
    setShowAdjust(false);
    setAdjUserId("");
    setAdjUserSearch("");
    setAdjAmount("");
    setAdjReason("");
    setSubmitting(false);
    loadData();
  };

  const columns: Column<TxnRow>[] = [
    {
      key: "id",
      label: "ID",
      hideOnMobile: true,
      render: (row) => <span className="text-[13px] font-mono text-[#64748B]">{row.id}</span>,
    },
    {
      key: "profiles",
      label: "User",
      sortable: false,
      render: (row) => (
        <div>
          <p className="text-sm font-semibold text-[#0F172A]">{row.user_profile?.name ?? "—"}</p>
          <p className="text-[11px] text-[#94A3B8]">{row.user_profile?.email ?? ""}</p>
        </div>
      ),
    },
    {
      key: "description",
      label: "Description",
      hideOnMobile: true,
      render: (row) => <span className="text-[13px] text-[#334155]">{row.description}</span>,
    },
    {
      key: "type",
      label: "Type",
      align: "center",
      render: (row) => <StatusBadge status={row.type} />,
    },
    {
      key: "amount",
      label: "Amount",
      align: "right",
      sortable: true,
      render: (row) => (
        <span className={`text-sm font-semibold ${row.type === "credit" ? "text-[#059669]" : "text-[#DC2626]"}`}>
          {row.type === "credit" ? "+" : "-"}{formatNaira(row.amount)}
        </span>
      ),
    },
    {
      key: "running_balance",
      label: "Balance After",
      align: "right",
      hideOnMobile: true,
      render: (row) => <span className="text-sm text-[#0F172A]">{formatNaira(row.running_balance)}</span>,
    },
    {
      key: "created_at",
      label: "Date",
      sortable: true,
      hideOnMobile: true,
      render: (row) => (
        <span className="text-[13px] text-[#64748B] whitespace-nowrap">{formatDate(row.created_at)}</span>
      ),
    },
  ];

  const filters: FilterConfig[] = [
    {
      key: "type",
      label: "All Types",
      value: typeFilter,
      onChange: setTypeFilter,
      options: [
        { value: "credit", label: "Credit" },
        { value: "debit", label: "Debit" },
      ],
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0F172A]">Wallet</h1>
          <p className="text-sm text-[#64748B] mt-0.5">Manage wallet transactions and adjustments</p>
        </div>
        <button
          onClick={() => setShowAdjust(true)}
          className="inline-flex items-center gap-1.5 px-2.5 sm:px-4 py-2 sm:py-2.5 bg-primary text-white text-sm font-semibold rounded-xl cursor-pointer hover:brightness-[0.92] active:scale-[0.98] transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">add_card</span>
          <span className="hidden sm:inline">Manual Adjustment</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Balance (All Users)" value={formatNaira(totalBalance)} icon="account_balance_wallet" color="#0D47A1" />
        <StatCard label="Total Credits" value={formatNaira(totalCredits)} icon="arrow_downward" color="#1B5E20" />
        <StatCard label="Total Debits" value={formatNaira(totalDebits)} icon="arrow_upward" color="#B71C1C" />
      </div>

      <FilterBar
        onSearch={setSearch}
        searchValue={search}
        searchPlaceholder="Search transactions..."
        filters={filters}
      />

      <DataTable<TxnRow>
        columns={columns}
        data={filtered}
        pageSize={15}
      />

      {/* ── Manual Adjustment Modal ──────────────────────────── */}
      {showAdjust && (() => {
        const filteredUsers = users.filter((u) =>
          !adjUserSearch || u.name.toLowerCase().includes(adjUserSearch.toLowerCase()) || u.email.toLowerCase().includes(adjUserSearch.toLowerCase())
        );
        const selectedUser = users.find((u) => u.id === adjUserId);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#0F172A]">Manual Wallet Adjustment</h3>
                <button
                  onClick={() => { setShowAdjust(false); setAdjUserId(""); setAdjUserSearch(""); setAdjAmount(""); setAdjReason(""); }}
                  className="text-[#94A3B8] hover:text-[#64748B] cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {/* User search + select */}
              <div className="space-y-2">
                <label className="text-[12px] font-semibold text-[#64748B] uppercase tracking-wide block">User</label>
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={adjUserSearch}
                  onChange={(e) => { setAdjUserSearch(e.target.value); setAdjUserId(""); }}
                  className={inputClass}
                />
                {adjUserSearch && !adjUserId && (
                  <div className="border border-[#E2E8F0] rounded-xl overflow-hidden max-h-44 overflow-y-auto">
                    {filteredUsers.length === 0 ? (
                      <p className="px-3 py-2.5 text-sm text-[#94A3B8]">No users found</p>
                    ) : filteredUsers.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => { setAdjUserId(u.id); setAdjUserSearch(u.name); }}
                        className="w-full text-left px-3 py-2.5 hover:bg-[#F8FAFC] border-b border-[#F1F5F9] last:border-0 cursor-pointer transition-colors"
                      >
                        <p className="text-sm font-semibold text-[#0F172A]">{u.name}</p>
                        <p className="text-[11px] text-[#94A3B8]">{u.email} · Balance: {formatNaira(u.wallet_balance ?? 0)}</p>
                      </button>
                    ))}
                  </div>
                )}
                {selectedUser && (
                  <p className="text-[12px] text-[#64748B]">
                    Current balance: <strong className="text-[#0F172A]">{formatNaira(selectedUser.wallet_balance ?? 0)}</strong>
                  </p>
                )}
              </div>

              {/* Credit / Debit toggle */}
              <div className="space-y-2">
                <label className="text-[12px] font-semibold text-[#64748B] uppercase tracking-wide block">Adjustment Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setAdjType("credit")}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 cursor-pointer transition-all ${adjType === "credit" ? "border-[#059669] bg-[#059669]/5" : "border-[#E2E8F0] hover:border-[#059669]/30"}`}
                  >
                    <span className={`material-symbols-outlined text-[22px] ${adjType === "credit" ? "text-[#059669]" : "text-[#94A3B8]"}`}>add_circle</span>
                    <span className={`text-sm font-bold ${adjType === "credit" ? "text-[#059669]" : "text-[#64748B]"}`}>Credit</span>
                    <span className="text-[11px] text-[#94A3B8]">Adds to wallet</span>
                  </button>
                  <button
                    onClick={() => setAdjType("debit")}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 cursor-pointer transition-all ${adjType === "debit" ? "border-[#DC2626] bg-[#DC2626]/5" : "border-[#E2E8F0] hover:border-[#DC2626]/30"}`}
                  >
                    <span className={`material-symbols-outlined text-[22px] ${adjType === "debit" ? "text-[#DC2626]" : "text-[#94A3B8]"}`}>remove_circle</span>
                    <span className={`text-sm font-bold ${adjType === "debit" ? "text-[#DC2626]" : "text-[#64748B]"}`}>Debit</span>
                    <span className="text-[11px] text-[#94A3B8]">Deducts from wallet</span>
                  </button>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="text-[12px] font-semibold text-[#64748B] uppercase tracking-wide block mb-1.5">Amount (₦)</label>
                <input
                  type="number"
                  min="1"
                  placeholder="0"
                  value={adjAmount}
                  onChange={(e) => setAdjAmount(e.target.value)}
                  className={inputClass}
                />
              </div>

              {/* Reason */}
              <div>
                <label className="text-[12px] font-semibold text-[#64748B] uppercase tracking-wide block mb-1.5">Reason</label>
                <input
                  type="text"
                  placeholder="e.g. Refund for order #123"
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => { setShowAdjust(false); setAdjUserId(""); setAdjUserSearch(""); setAdjAmount(""); setAdjReason(""); }}
                  className="flex-1 py-2.5 rounded-xl border border-[#E2E8F0] text-sm font-semibold text-[#64748B] hover:bg-[#F1F5F9] cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdjust}
                  disabled={submitting}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer disabled:opacity-60 transition-colors ${adjType === "credit" ? "bg-[#059669] hover:bg-[#047857]" : "bg-[#DC2626] hover:bg-[#B91C1C]"}`}
                >
                  {submitting ? "Saving…" : `Apply ${adjType === "credit" ? "Credit" : "Debit"}`}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
