import { useState, useMemo } from "react";
import DataTable, { type Column } from "./shared/DataTable";
import FilterBar from "./shared/FilterBar";
import StatCard from "./shared/StatCard";
import StatusBadge from "./shared/StatusBadge";
import { useToast } from "../../hooks/useToast";
import {
  mockWalletTxns, mockUsers, formatNaira, formatDate,
  type MockWalletTxn,
} from "../../data/adminMockData";

export default function WalletAdmin() {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [showAdjustment, setShowAdjustment] = useState(false);
  const [adjUser, setAdjUser] = useState("");
  const [adjAmount, setAdjAmount] = useState("");
  const [adjType, setAdjType] = useState<"credit" | "debit">("credit");
  const [adjReason, setAdjReason] = useState("");

  const totalBalance = mockUsers.reduce((sum, u) => sum + u.walletBalance, 0);
  const creditsThisMonth = mockWalletTxns.filter((t) => t.type === "credit").reduce((sum, t) => sum + t.amount, 0);
  const debitsThisMonth = mockWalletTxns.filter((t) => t.type === "debit").reduce((sum, t) => sum + t.amount, 0);

  const filtered = useMemo(() => {
    return mockWalletTxns.filter((t) => {
      const q = search.toLowerCase();
      const matchesSearch = !q || t.userName.toLowerCase().includes(q) || t.id.toLowerCase().includes(q);
      const matchesType = !typeFilter || t.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [search, typeFilter]);

  const handleAdjustment = () => {
    if (!adjUser.trim() || !adjAmount || !adjReason.trim()) {
      toast.error("All fields are required");
      return;
    }
    toast.success(`Wallet ${adjType} of ${formatNaira(Number(adjAmount))} processed`);
    setShowAdjustment(false);
    setAdjUser("");
    setAdjAmount("");
    setAdjReason("");
  };

  const columns: Column<MockWalletTxn>[] = [
    {
      key: "id",
      label: "Transaction ID",
      sortable: true,
      render: (_, row) => <span className="font-bold text-on-surface">{row.id}</span>,
    },
    {
      key: "userName",
      label: "User",
      sortable: true,
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold flex-shrink-0">
            {row.userAvatar}
          </div>
          <span className="truncate">{row.userName}</span>
        </div>
      ),
    },
    {
      key: "description",
      label: "Description",
      hideOnMobile: true,
      render: (_, row) => <span className="text-on-surface-variant">{row.description}</span>,
    },
    {
      key: "type",
      label: "Type",
      align: "center",
      render: (_, row) => <StatusBadge status={row.type} />,
    },
    {
      key: "amount",
      label: "Amount",
      sortable: true,
      align: "right",
      render: (_, row) => (
        <span className={`font-bold ${row.type === "credit" ? "text-primary" : "text-error"}`}>
          {row.type === "credit" ? "+" : "-"}{formatNaira(row.amount)}
        </span>
      ),
    },
    {
      key: "balanceAfter",
      label: "Balance After",
      sortable: true,
      align: "right",
      hideOnMobile: true,
      render: (_, row) => <span className="font-medium">{formatNaira(row.balanceAfter)}</span>,
    },
    {
      key: "createdAt",
      label: "Date",
      sortable: true,
      hideOnMobile: true,
      render: (_, row) => <span className="text-on-surface-variant">{formatDate(row.createdAt)}</span>,
    },
  ];

  return (
    <div className="space-y-5 sm:space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
        <StatCard label="Total Wallet Balance" value={formatNaira(totalBalance)} icon="account_balance_wallet" color="#0D47A1" />
        <StatCard label="Credits This Month" value={formatNaira(creditsThisMonth)} icon="add_card" color="#1B5E20" trend={{ value: "Credits", positive: true }} />
        <StatCard label="Debits This Month" value={formatNaira(debitsThisMonth)} icon="remove_circle" color="#B71C1C" trend={{ value: "Debits", positive: false }} />
      </div>

      {/* Manual Adjustment */}
      <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 overflow-hidden">
        <button
          onClick={() => setShowAdjustment(!showAdjustment)}
          className="w-full flex items-center justify-between px-5 py-3 cursor-pointer hover:bg-surface-container/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-primary">tune</span>
            <span className="text-sm font-bold text-on-surface">Manual Adjustment</span>
          </div>
          <span className="material-symbols-outlined text-[20px] text-on-surface-variant">
            {showAdjustment ? "expand_less" : "expand_more"}
          </span>
        </button>

        {showAdjustment && (
          <div className="px-5 pb-5 border-t border-[#E8ECF1]/60 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-bold text-on-surface-variant mb-1 block">User</label>
                <select
                  value={adjUser}
                  onChange={(e) => setAdjUser(e.target.value)}
                  className="w-full border-2 border-outline-variant/15 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary cursor-pointer"
                >
                  <option value="">Select user...</option>
                  {mockUsers.slice(0, 20).map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-on-surface-variant mb-1 block">Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant font-bold">₦</span>
                  <input
                    type="number"
                    value={adjAmount}
                    onChange={(e) => setAdjAmount(e.target.value)}
                    className="w-full border-2 border-outline-variant/15 rounded-xl pl-7 pr-3 py-2 text-sm outline-none focus:border-primary"
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-on-surface-variant mb-1 block">Type</label>
                <div className="flex gap-3 mt-1">
                  {(["credit", "debit"] as const).map((t) => (
                    <label key={t} className="flex items-center gap-1.5 cursor-pointer">
                      <input type="radio" name="adjType" value={t} checked={adjType === t} onChange={() => setAdjType(t)} className="accent-primary" />
                      <span className="text-sm capitalize">{t}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-on-surface-variant mb-1 block">Reason</label>
                <input
                  type="text"
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  className="w-full border-2 border-outline-variant/15 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary"
                  placeholder="Reason for adjustment"
                />
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <button
                onClick={handleAdjustment}
                className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg cursor-pointer hover:brightness-[0.92] transition-all"
              >
                Process Adjustment
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Transaction Log */}
      <div className="space-y-4 sm:space-y-5">
        <h2 className="text-base font-bold text-on-surface">Transaction Log</h2>
        <FilterBar
          onSearch={setSearch}
          searchValue={search}
          searchPlaceholder="Search transaction or user..."
          filters={[
            {
              key: "type",
              label: "All Types",
              type: "select",
              value: typeFilter,
              options: [
                { label: "Credit", value: "credit" },
                { label: "Debit", value: "debit" },
              ],
              onChange: setTypeFilter,
            },
          ]}
        />

        <DataTable
          columns={columns}
          data={filtered as MockWalletTxn[]}
          emptyMessage="No transactions found"
          emptyIcon="account_balance_wallet"
        />
      </div>
    </div>
  );
}
