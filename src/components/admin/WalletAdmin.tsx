import { useState } from "react";
import DataTable, { type Column } from "./shared/DataTable";
import FilterBar, { type FilterConfig } from "./shared/FilterBar";
import StatCard from "./shared/StatCard";
import StatusBadge from "./shared/StatusBadge";
import { useToast } from "../../hooks/useToast";
import { mockWalletTxns, mockUsers, formatNaira, formatDate, type MockWalletTxn } from "../../data/adminMockData";

type TxnRow = MockWalletTxn & Record<string, unknown>;

export default function WalletAdmin() {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [showAdjust, setShowAdjust] = useState(false);

  // Adjustment form state
  const [adjUserId, setAdjUserId] = useState("");
  const [adjAmount, setAdjAmount] = useState("");
  const [adjType, setAdjType] = useState<"credit" | "debit">("credit");
  const [adjReason, setAdjReason] = useState("");

  const totalBalance = mockUsers.reduce((sum, u) => sum + u.walletBalance, 0);
  const totalCredits = mockWalletTxns.filter((t) => t.type === "credit").reduce((sum, t) => sum + t.amount, 0);
  const totalDebits = mockWalletTxns.filter((t) => t.type === "debit").reduce((sum, t) => sum + t.amount, 0);

  const filtered = mockWalletTxns.filter((t) => {
    const matchSearch = !search || t.userName.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase());
    const matchType = !typeFilter || t.type === typeFilter;
    return matchSearch && matchType;
  });

  const handleAdjust = () => {
    if (!adjUserId || !adjAmount || !adjReason) {
      toast.error("All fields are required");
      return;
    }
    const user = mockUsers.find((u) => u.id === adjUserId);
    toast.success(`${adjType === "credit" ? "Credited" : "Debited"} ${formatNaira(parseInt(adjAmount))} ${adjType === "credit" ? "to" : "from"} ${user?.name ?? adjUserId}`);
    setShowAdjust(false);
    setAdjUserId("");
    setAdjAmount("");
    setAdjReason("");
  };

  const columns: Column<TxnRow>[] = [
    {
      key: "id",
      label: "ID",
      hideOnMobile: true,
      render: (row) => <span className="text-[13px] font-mono text-[#64748B]">{row.id}</span>,
    },
    {
      key: "userName",
      label: "User",
      sortable: true,
      render: (row) => <span className="text-sm font-semibold text-[#0F172A]">{row.userName}</span>,
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
      render: (row) => <StatusBadge status={row.type as string} />,
    },
    {
      key: "amount",
      label: "Amount",
      align: "right",
      sortable: true,
      render: (row) => (
        <span className={`text-sm font-semibold ${(row.type as string) === "credit" ? "text-[#059669]" : "text-[#DC2626]"}`}>
          {(row.type as string) === "credit" ? "+" : "-"}{formatNaira(row.amount as number)}
        </span>
      ),
    },
    {
      key: "balance",
      label: "Balance After",
      align: "right",
      hideOnMobile: true,
      sortable: true,
      render: (row) => <span className="text-sm text-[#0F172A]">{formatNaira(row.balance as number)}</span>,
    },
    {
      key: "createdAt",
      label: "Date",
      sortable: true,
      hideOnMobile: true,
      render: (row) => <span className="text-[13px] text-[#64748B] whitespace-nowrap">{formatDate(row.createdAt as string)}</span>,
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

  const inputClass =
    "w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm text-[#0F172A] outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0F172A]">Wallet</h1>
          <p className="text-sm text-[#64748B] mt-0.5">Manage wallet transactions and adjustments</p>
        </div>
        <button
          onClick={() => setShowAdjust(!showAdjust)}
          className="inline-flex items-center gap-1.5 px-2.5 sm:px-4 py-2 sm:py-2.5 bg-primary text-white text-sm font-semibold rounded-xl cursor-pointer hover:brightness-[0.92] active:scale-[0.98] transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">{showAdjust ? "expand_less" : "add_card"}</span>
          <span className="hidden sm:inline">{showAdjust ? "Hide" : "Manual Adjustment"}</span>
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Balance (All Users)" value={formatNaira(totalBalance)} icon="account_balance_wallet" color="#0D47A1" />
        <StatCard label="Total Credits" value={formatNaira(totalCredits)} icon="arrow_downward" color="#1B5E20" />
        <StatCard label="Total Debits" value={formatNaira(totalDebits)} icon="arrow_upward" color="#B71C1C" />
      </div>

      {/* Collapsible adjustment form */}
      {showAdjust && (
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 p-5">
          <h3 className="text-sm font-bold text-[#0F172A] mb-4">Manual Wallet Adjustment</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-[13px] font-semibold text-[#0F172A] mb-1.5 block">User</label>
              <select value={adjUserId} onChange={(e) => setAdjUserId(e.target.value)} className={`${inputClass} cursor-pointer`}>
                <option value="">Select user...</option>
                {mockUsers.slice(0, 20).map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[13px] font-semibold text-[#0F172A] mb-1.5 block">Amount</label>
              <input type="number" value={adjAmount} onChange={(e) => setAdjAmount(e.target.value)} className={inputClass} placeholder="0" />
            </div>
            <div>
              <label className="text-[13px] font-semibold text-[#0F172A] mb-1.5 block">Type</label>
              <div className="flex gap-3 mt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={adjType === "credit"} onChange={() => setAdjType("credit")} className="accent-primary" />
                  <span className="text-sm text-[#059669] font-semibold">Credit</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={adjType === "debit"} onChange={() => setAdjType("debit")} className="accent-primary" />
                  <span className="text-sm text-[#DC2626] font-semibold">Debit</span>
                </label>
              </div>
            </div>
            <div>
              <label className="text-[13px] font-semibold text-[#0F172A] mb-1.5 block">Reason</label>
              <input type="text" value={adjReason} onChange={(e) => setAdjReason(e.target.value)} className={inputClass} placeholder="Reason..." />
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={handleAdjust}
              className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl cursor-pointer hover:brightness-[0.92] active:scale-[0.98] transition-all"
            >
              Submit Adjustment
            </button>
          </div>
        </div>
      )}

      <FilterBar
        onSearch={setSearch}
        searchValue={search}
        searchPlaceholder="Search transactions..."
        filters={filters}
      />

      <DataTable<TxnRow>
        columns={columns}
        data={filtered as TxnRow[]}
        pageSize={10}
      />
    </div>
  );
}
