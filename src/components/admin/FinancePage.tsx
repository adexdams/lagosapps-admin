import { useState, useEffect, useMemo, useRef } from "react";
import StatCard from "./shared/StatCard";
import DataTable, { type Column } from "./shared/DataTable";
import FilterBar, { type FilterConfig } from "./shared/FilterBar";
import StatusBadge from "./shared/StatusBadge";
import { useToast } from "../../hooks/useToast";
import { getOrders, getWalletTransactions } from "../../lib/api";
import { formatNaira, type Portal } from "../../data/adminMockData";

const card = "bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60";

interface DbOrder {
  id: string;
  portal_id: Portal;
  total_amount: number;
  payment_amount: number;
  status: string;
  channel: string | null;
  created_at: string;
  profiles: { name: string | null; email: string } | null;
  [key: string]: unknown;
}

interface DbTxn {
  id: string;
  user_id: string;
  description: string;
  type: string;
  amount: number;
  created_at: string;
  profiles: { name: string | null; email: string } | null;
  [key: string]: unknown;
}

type Tab = "overview" | "transactions" | "reports";

const CHANNEL_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  card: { label: "Card", color: "#2563EB", icon: "credit_card" },
  bank_transfer: { label: "Bank Transfer", color: "#059669", icon: "account_balance" },
  ussd: { label: "USSD", color: "#D97706", icon: "dialpad" },
  wallet: { label: "Wallet", color: "#7C3AED", icon: "account_balance_wallet" },
  web: { label: "Web", color: "#64748B", icon: "language" },
};

export default function FinancePage() {
  const toast = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;
  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<DbOrder[]>([]);
  const [txns, setTxns] = useState<DbTxn[]>([]);
  const [txnSearch, setTxnSearch] = useState("");
  const [txnType, setTxnType] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [ordersRes, txnsRes] = await Promise.all([getOrders(), getWalletTransactions()]);
      if (cancelled) return;
      setOrders((ordersRes.data as DbOrder[]) ?? []);
      setTxns((txnsRes.data as DbTxn[]) ?? []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Derived metrics ──
  const completedOrders = orders.filter((o) => o.status === "completed");
  const totalRevenue = completedOrders.reduce((s, o) => s + o.total_amount, 0);
  const paystackFee = (amount: number) => Math.min(Math.round(amount * 0.015 + 10000), 200000);
  const totalFees = completedOrders.reduce((s, o) => s + paystackFee(o.total_amount), 0);
  const totalNet = totalRevenue - totalFees;
  const successRate = orders.length > 0 ? Math.round((completedOrders.length / orders.length) * 100) : 0;
  const avgOrderValue = completedOrders.length > 0 ? Math.round(totalRevenue / completedOrders.length) : 0;
  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const cancelledCount = orders.filter((o) => o.status === "cancelled").length;

  const walletCredits = txns.filter((t) => t.type === "credit").reduce((s, t) => s + t.amount, 0);
  const walletDebits = txns.filter((t) => t.type === "debit").reduce((s, t) => s + t.amount, 0);

  const channelBreakdown = useMemo(() => {
    const map: Record<string, { count: number; amount: number }> = {};
    completedOrders.forEach((o) => {
      const ch = o.channel ?? "web";
      if (!map[ch]) map[ch] = { count: 0, amount: 0 };
      map[ch].count++;
      map[ch].amount += o.total_amount;
    });
    return Object.entries(map).sort((a, b) => b[1].amount - a[1].amount);
  }, [completedOrders]);

  const filteredTxns = useMemo(() => {
    return txns.filter((t) => {
      const name = t.profiles?.name ?? t.profiles?.email ?? "";
      const q = txnSearch.toLowerCase();
      const matchSearch = !q || t.id.toLowerCase().includes(q) || name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
      const matchType = !txnType || t.type === txnType;
      return matchSearch && matchType;
    });
  }, [txns, txnSearch, txnType]);

  const txnColumns: Column<DbTxn>[] = [
    { key: "id", label: "ID", render: (row) => <span className="font-mono text-[11px] sm:text-[12px] text-[#0F172A] font-semibold">{row.id}</span> },
    { key: "description", label: "Description", render: (row) => <span className="text-[#334155] text-sm">{row.description}</span> },
    { key: "user", label: "User", hideOnMobile: true, render: (row) => <span className="text-[#64748B] text-sm">{row.profiles?.name ?? row.profiles?.email ?? "—"}</span> },
    { key: "type", label: "Type", align: "center", render: (row) => <StatusBadge status={row.type} /> },
    { key: "amount", label: "Amount", align: "right", sortable: true, render: (row) => (
      <span className={`font-semibold ${row.type === "credit" ? "text-[#059669]" : "text-[#DC2626]"}`}>
        {row.type === "credit" ? "+" : "-"}{formatNaira(row.amount)}
      </span>
    )},
    { key: "created_at", label: "Date", hideOnMobile: true, sortable: true, render: (row) => (
      <span className="text-[12px] text-[#64748B] whitespace-nowrap">
        {new Date(row.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
      </span>
    )},
  ];

  const txnFilters: FilterConfig[] = [
    { key: "type", label: "All Types", value: txnType, onChange: setTxnType, options: [
      { value: "credit", label: "Credit" }, { value: "debit", label: "Debit" },
    ]},
  ];

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "overview", label: "Overview", icon: "monitoring" },
    { key: "transactions", label: "Wallet Transactions", icon: "account_balance_wallet" },
    { key: "reports", label: "Reports", icon: "summarize" },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#0F172A]">Finance</h1>
        <p className="text-sm text-[#64748B] mt-0.5">Revenue analytics, wallet activity and financial reports</p>
      </div>

      <div className={`${card} p-1`}>
        <div className="flex">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg sm:rounded-xl text-[12px] sm:text-[13px] font-semibold cursor-pointer transition-all ${
                tab === t.key ? "bg-[#0F172A] text-white shadow-sm" : "text-[#64748B] hover:text-[#334155] hover:bg-[#F8FAFC]"
              }`}
            >
              <span className="material-symbols-outlined text-[16px] sm:text-[18px]">{t.icon}</span>
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-[#94A3B8] text-sm">Loading finance data…</div>
      ) : (
        <>
          {tab === "overview" && (
            <div className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
                <StatCard label="Total Revenue" value={formatNaira(totalRevenue)} icon="payments" color="#1B5E20" trend={{ value: `${completedOrders.length} orders`, positive: true }} />
                <StatCard label="Net Income" value={formatNaira(totalNet)} icon="trending_up" color="#0D47A1" trend={{ value: `${formatNaira(totalFees)} in fees`, positive: false }} />
                <StatCard label="Success Rate" value={`${successRate}%`} icon="check_circle" color="#059669" trend={{ value: `${cancelledCount} cancelled`, positive: successRate > 90 }} />
                <StatCard label="Avg Order Value" value={formatNaira(avgOrderValue)} icon="analytics" color="#7C3AED" trend={{ value: `${pendingCount} pending`, positive: false }} />
              </div>

              {/* Channel breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                <div className={`${card} p-3.5 sm:p-5 md:p-6`}>
                  <h3 className="text-sm font-semibold text-[#0F172A] mb-5">Payment Channels</h3>
                  {channelBreakdown.length === 0 ? (
                    <p className="text-sm text-[#94A3B8] py-8 text-center">No completed orders yet</p>
                  ) : (
                    <div className="space-y-4">
                      {channelBreakdown.map(([channel, data]) => {
                        const cfg = CHANNEL_CONFIG[channel] ?? CHANNEL_CONFIG.web;
                        const pct = totalRevenue > 0 ? Math.round((data.amount / totalRevenue) * 100) : 0;
                        return (
                          <div key={channel}>
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-[16px]" style={{ color: cfg.color }}>{cfg.icon}</span>
                                <span className="text-[13px] font-medium text-[#334155]">{cfg.label}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] text-[#94A3B8]">{pct}%</span>
                                <span className="text-[13px] font-bold text-[#0F172A]">{formatNaira(data.amount)}</span>
                              </div>
                            </div>
                            <div className="h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: cfg.color }} />
                            </div>
                            <p className="text-[11px] text-[#94A3B8] mt-1">{data.count} orders</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Wallet summary */}
                <div className={`${card} p-3.5 sm:p-5 md:p-6`}>
                  <h3 className="text-sm font-semibold text-[#0F172A] mb-5">Wallet Activity</h3>
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="p-3 sm:p-4 bg-[#ECFDF5] rounded-xl">
                      <p className="text-[11px] font-semibold text-[#059669] uppercase tracking-wide">Total Credits</p>
                      <p className="text-lg sm:text-xl font-extrabold text-[#059669] mt-1">{formatNaira(walletCredits)}</p>
                    </div>
                    <div className="p-3 sm:p-4 bg-[#FEF2F2] rounded-xl">
                      <p className="text-[11px] font-semibold text-[#DC2626] uppercase tracking-wide">Total Debits</p>
                      <p className="text-lg sm:text-xl font-extrabold text-[#DC2626] mt-1">{formatNaira(walletDebits)}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-[#F1F5F9]">
                      <span className="text-[13px] text-[#64748B]">Net Wallet Flow</span>
                      <span className={`text-[13px] font-bold ${walletCredits - walletDebits >= 0 ? "text-[#059669]" : "text-[#DC2626]"}`}>{formatNaira(walletCredits - walletDebits)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-[#F1F5F9]">
                      <span className="text-[13px] text-[#64748B]">Total Transactions</span>
                      <span className="text-[13px] font-bold text-[#0F172A]">{txns.length}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-[13px] text-[#64748B]">Paystack Fee Rate</span>
                      <span className="text-[13px] font-bold text-[#0F172A]">1.5% + ₦100</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === "transactions" && (
            <div className="space-y-4">
              {txns.length === 0 ? (
                <div className={`${card} py-16 text-center`}>
                  <span className="material-symbols-outlined text-[48px] text-[#CBD5E1] block mb-2">account_balance_wallet</span>
                  <p className="text-sm text-[#64748B]">No wallet transactions yet</p>
                  <p className="text-xs text-[#94A3B8] mt-1">Transactions appear here when users top up wallets or make purchases.</p>
                </div>
              ) : (
                <>
                  <FilterBar
                    onSearch={setTxnSearch}
                    searchValue={txnSearch}
                    searchPlaceholder="Search by ID, user, or description..."
                    filters={txnFilters}
                    onExport={() => toastRef.current.success("Exporting transactions...")}
                  />
                  <DataTable<DbTxn>
                    columns={txnColumns}
                    data={filteredTxns}
                    pageSize={15}
                  />
                </>
              )}
            </div>
          )}

          {tab === "reports" && (
            <div className="space-y-4 sm:space-y-6">
              <div className={`${card} p-3.5 sm:p-5 md:p-6`}>
                <h3 className="text-sm font-semibold text-[#0F172A] mb-4">Generate Report</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div>
                    <label className="text-[13px] font-semibold text-[#0F172A] mb-1.5 block">Report Type</label>
                    <select className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm text-[#0F172A] outline-none focus:border-primary cursor-pointer">
                      <option>Revenue Summary</option>
                      <option>Order Details</option>
                      <option>Wallet Activity</option>
                      <option>Failed Transactions</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[13px] font-semibold text-[#0F172A] mb-1.5 block">From</label>
                    <input type="date" className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm text-[#0F172A] outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="text-[13px] font-semibold text-[#0F172A] mb-1.5 block">To</label>
                    <input type="date" className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm text-[#0F172A] outline-none focus:border-primary" />
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <button onClick={() => toastRef.current.success("Report generated — downloading...")} className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#0F172A] text-white text-sm font-semibold rounded-xl cursor-pointer hover:bg-[#1E293B] transition-all">
                    <span className="material-symbols-outlined text-[18px]">download</span>
                    Generate & Download
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {[
                  { title: "Monthly Revenue", desc: "Revenue by month with portal split", icon: "bar_chart" },
                  { title: "Order Audit", desc: "All orders with status history", icon: "fact_check" },
                  { title: "Wallet Report", desc: "Credits, debits, and balance movements", icon: "account_balance_wallet" },
                  { title: "Failed Orders", desc: "Cancelled and refunded orders", icon: "error" },
                ].map((report) => (
                  <button
                    key={report.title}
                    onClick={() => toastRef.current.success(`${report.title} — downloading...`)}
                    className={`${card} p-4 sm:p-5 text-left cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all group`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="size-9 sm:size-10 rounded-xl bg-[#F1F5F9] flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 transition-colors">
                        <span className="material-symbols-outlined text-[20px] text-[#64748B] group-hover:text-primary transition-colors">{report.icon}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#0F172A]">{report.title}</p>
                        <p className="text-[12px] text-[#64748B] mt-0.5">{report.desc}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
