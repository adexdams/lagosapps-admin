import { useState, useMemo } from "react";
import StatCard from "./shared/StatCard";
import DataTable, { type Column } from "./shared/DataTable";
import FilterBar, { type FilterConfig } from "./shared/FilterBar";
import StatusBadge from "./shared/StatusBadge";
import { useToast } from "../../hooks/useToast";
import { mockOrders, mockWalletTxns, formatNaira, formatDate, type Portal } from "../../data/adminMockData";

/* ── Mock Paystack transactions ─────────────────────────────────────────────── */

type PayChannel = "card" | "bank_transfer" | "ussd" | "wallet";
type PayStatus = "success" | "failed" | "pending" | "reversed";

interface PaystackTxn {
  id: string;
  reference: string;
  orderId: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  fee: number;
  net: number;
  channel: PayChannel;
  status: PayStatus;
  cardType: string;
  bank: string;
  portal: Portal;
  createdAt: string;
  [key: string]: unknown;
}

const BANKS = ["GTBank", "Access Bank", "Zenith Bank", "First Bank", "UBA", "Kuda", "Opay", "Moniepoint"];
const CARD_TYPES = ["Visa ****4242", "Mastercard ****8371", "Verve ****6012", "Visa ****9910", "Mastercard ****1234"];
const CHANNELS: PayChannel[] = ["card", "card", "card", "bank_transfer", "bank_transfer", "ussd", "wallet"];
const STATUSES: PayStatus[] = ["success", "success", "success", "success", "success", "success", "failed", "pending", "reversed"];

const paystackTxns: PaystackTxn[] = mockOrders
  .filter((o) => o.amount > 0 && o.status !== "cancelled")
  .slice(0, 60)
  .map((order, i) => {
    const channel = CHANNELS[i % CHANNELS.length];
    const status = STATUSES[i % STATUSES.length];
    const fee = Math.round(order.amount * 0.015 + 10000);
    return {
      id: `TXN-${String(i + 1).padStart(4, "0")}`,
      reference: `PAY-${order.id.replace("ORD-", "")}-${Math.random().toString(36).slice(2, 8)}`,
      orderId: order.id,
      customerName: order.userName,
      customerEmail: `${order.userName.split(" ")[0].toLowerCase()}@example.com`,
      amount: order.amount,
      fee: status === "success" ? fee : 0,
      net: status === "success" ? order.amount - fee : 0,
      channel,
      status,
      cardType: channel === "card" ? CARD_TYPES[i % CARD_TYPES.length] : "-",
      bank: channel === "bank_transfer" ? BANKS[i % BANKS.length] : channel === "card" ? BANKS[(i + 2) % BANKS.length] : "-",
      portal: order.portal as Portal,
      createdAt: order.createdAt,
    };
  });

/* ── Mock settlements ────────────────────────────────────────────────────────── */

interface Settlement {
  id: string;
  amount: number;
  fee: number;
  net: number;
  status: "settled" | "pending" | "processing";
  settledAt: string;
  txnCount: number;
  [key: string]: unknown;
}

const settlements: Settlement[] = Array.from({ length: 12 }, (_, i) => {
  const month = 12 - i;
  const mStr = `2026-${String(month > 12 ? month - 12 : month).padStart(2, "0")}`;
  const txnCount = 15 + Math.floor(Math.random() * 30);
  const amount = (200000 + Math.floor(Math.random() * 3000000)) * txnCount / 10;
  const fee = Math.round(amount * 0.015);
  return {
    id: `STL-${String(i + 1).padStart(3, "0")}`,
    amount,
    fee,
    net: amount - fee,
    status: i === 0 ? "processing" : i === 1 ? "pending" : "settled",
    settledAt: `${mStr}-28`,
    txnCount,
  };
});

/* ── Computed analytics ──────────────────────────────────────────────────────── */

const successTxns = paystackTxns.filter((t) => t.status === "success");
const totalRevenue = successTxns.reduce((s, t) => s + t.amount, 0);
const totalFees = successTxns.reduce((s, t) => s + t.fee, 0);
const totalNet = totalRevenue - totalFees;
const successRate = paystackTxns.length > 0 ? Math.round((successTxns.length / paystackTxns.length) * 100) : 0;
const avgTxnValue = successTxns.length > 0 ? Math.round(totalRevenue / successTxns.length) : 0;
const failedCount = paystackTxns.filter((t) => t.status === "failed").length;
const pendingCount = paystackTxns.filter((t) => t.status === "pending").length;

const channelBreakdown = (() => {
  const map: Record<string, { count: number; amount: number }> = {};
  successTxns.forEach((t) => {
    if (!map[t.channel]) map[t.channel] = { count: 0, amount: 0 };
    map[t.channel].count++;
    map[t.channel].amount += t.amount;
  });
  return Object.entries(map).sort((a, b) => b[1].amount - a[1].amount);
})();

// Realistic daily revenue with clear variation (last 14 days)
const dailyRevenue: [string, number][] = [
  ["2026-04-01", 320000],
  ["2026-04-02", 185000],
  ["2026-04-03", 540000],
  ["2026-04-04", 410000],
  ["2026-04-05", 95000],
  ["2026-04-06", 120000],
  ["2026-04-07", 680000],
  ["2026-04-08", 450000],
  ["2026-04-09", 290000],
  ["2026-04-10", 820000],
  ["2026-04-11", 560000],
  ["2026-04-12", 150000],
  ["2026-04-13", 75000],
  ["2026-04-14", 730000],
];

const walletCredits = mockWalletTxns.filter((t) => t.type === "credit").reduce((s, t) => s + t.amount, 0);
const walletDebits = mockWalletTxns.filter((t) => t.type === "debit").reduce((s, t) => s + t.amount, 0);

const CHANNEL_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  card: { label: "Card", color: "#2563EB", icon: "credit_card" },
  bank_transfer: { label: "Bank Transfer", color: "#059669", icon: "account_balance" },
  ussd: { label: "USSD", color: "#D97706", icon: "dialpad" },
  wallet: { label: "Wallet", color: "#7C3AED", icon: "account_balance_wallet" },
};

const card = "bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60";

/* ── Component ───────────────────────────────────────────────────────────────── */

type Tab = "overview" | "transactions" | "settlements" | "reports";

export default function FinancePage() {
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("overview");
  const [txnSearch, setTxnSearch] = useState("");
  const [txnStatus, setTxnStatus] = useState("");
  const [txnChannel, setTxnChannel] = useState("");

  const filteredTxns = useMemo(() => {
    return paystackTxns.filter((t) => {
      const q = txnSearch.toLowerCase();
      const matchSearch = !q || t.reference.toLowerCase().includes(q) || t.customerName.toLowerCase().includes(q) || t.orderId.toLowerCase().includes(q);
      const matchStatus = !txnStatus || t.status === txnStatus;
      const matchChannel = !txnChannel || t.channel === txnChannel;
      return matchSearch && matchStatus && matchChannel;
    });
  }, [txnSearch, txnStatus, txnChannel]);

  const maxDaily = Math.max(...dailyRevenue.map(([, v]) => v), 1);

  const txnColumns: Column<PaystackTxn>[] = [
    { key: "reference", label: "Reference", render: (row) => <span className="font-mono text-[11px] sm:text-[12px] text-[#0F172A] font-semibold truncate block max-w-[120px] sm:max-w-none">{row.reference}</span> },
    { key: "customerName", label: "Customer", hideOnMobile: true, render: (row) => <span className="text-[#334155]">{row.customerName}</span> },
    { key: "amount", label: "Amount", align: "right", sortable: true, render: (row) => <span className="font-semibold text-[#0F172A]">{formatNaira(row.amount)}</span> },
    { key: "fee", label: "Fee", align: "right", hideOnMobile: true, render: (row) => <span className="text-[#94A3B8]">{row.fee > 0 ? formatNaira(row.fee) : "-"}</span> },
    { key: "channel", label: "Channel", hideOnMobile: true, render: (row) => {
      const ch = CHANNEL_CONFIG[row.channel];
      return (
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[14px]" style={{ color: ch.color }}>{ch.icon}</span>
          <span className="text-[12px] text-[#334155]">{ch.label}</span>
        </div>
      );
    }},
    { key: "status", label: "Status", align: "center", render: (row) => <StatusBadge status={row.status} /> },
    { key: "createdAt", label: "Date", hideOnMobile: true, sortable: true, render: (row) => <span className="text-[12px] text-[#64748B] whitespace-nowrap">{formatDate(row.createdAt)}</span> },
  ];

  const settlementColumns: Column<Settlement>[] = [
    { key: "id", label: "ID", render: (row) => <span className="font-mono text-[12px] font-semibold text-[#0F172A]">{row.id}</span> },
    { key: "txnCount", label: "Txns", align: "center", hideOnMobile: true, render: (row) => <span className="text-[#334155]">{row.txnCount}</span> },
    { key: "amount", label: "Gross", align: "right", hideOnMobile: true, sortable: true, render: (row) => <span className="font-semibold text-[#0F172A]">{formatNaira(row.amount)}</span> },
    { key: "fee", label: "Fees", align: "right", hideOnMobile: true, render: (row) => <span className="text-[#DC2626]">-{formatNaira(row.fee)}</span> },
    { key: "net", label: "Net", align: "right", render: (row) => <span className="font-semibold text-[#059669]">{formatNaira(row.net)}</span> },
    { key: "status", label: "Status", align: "center", render: (row) => <StatusBadge status={row.status} /> },
    { key: "settledAt", label: "Date", hideOnMobile: true, sortable: true, render: (row) => <span className="text-[12px] text-[#64748B] whitespace-nowrap">{formatDate(row.settledAt)}</span> },
  ];

  const txnFilters: FilterConfig[] = [
    { key: "status", label: "All Statuses", value: txnStatus, onChange: setTxnStatus, options: [
      { value: "success", label: "Success" }, { value: "failed", label: "Failed" }, { value: "pending", label: "Pending" }, { value: "reversed", label: "Reversed" },
    ]},
    { key: "channel", label: "All Channels", value: txnChannel, onChange: setTxnChannel, options: [
      { value: "card", label: "Card" }, { value: "bank_transfer", label: "Bank Transfer" }, { value: "ussd", label: "USSD" }, { value: "wallet", label: "Wallet" },
    ]},
  ];

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "overview", label: "Overview", icon: "monitoring" },
    { key: "transactions", label: "Transactions", icon: "receipt_long" },
    { key: "settlements", label: "Settlements", icon: "account_balance" },
    { key: "reports", label: "Reports", icon: "summarize" },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[#0F172A]">Finance</h1>
        <p className="text-sm text-[#64748B] mt-0.5">Payment analytics, Paystack transactions and settlements</p>
      </div>

      {/* Tab bar */}
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

      {/* ── Overview Tab ──────────────────────────────────────────────────── */}
      {tab === "overview" && (
        <div className="space-y-4 sm:space-y-6">
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            <StatCard label="Total Revenue" value={formatNaira(totalRevenue)} icon="payments" color="#1B5E20" trend={{ value: `${successTxns.length} transactions`, positive: true }} />
            <StatCard label="Net Income" value={formatNaira(totalNet)} icon="trending_up" color="#0D47A1" trend={{ value: `${formatNaira(totalFees)} in fees`, positive: false }} />
            <StatCard label="Success Rate" value={`${successRate}%`} icon="check_circle" color="#059669" trend={{ value: `${failedCount} failed`, positive: successRate > 90 }} />
            <StatCard label="Avg Transaction" value={formatNaira(avgTxnValue)} icon="analytics" color="#7C3AED" trend={{ value: `${pendingCount} pending`, positive: false }} />
          </div>

          {/* Revenue trend + Channel breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
            {/* Daily revenue chart */}
            <div className={`lg:col-span-3 ${card} p-3.5 sm:p-5 md:p-6`}>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-sm font-semibold text-[#0F172A]">Revenue Trend</h3>
                  <p className="text-[12px] text-[#94A3B8] mt-0.5">Last 14 days</p>
                </div>
                <span className="text-sm font-bold text-[#0F172A]">{formatNaira(totalRevenue)}</span>
              </div>
              <div className="flex items-end gap-[3px] sm:gap-1.5">
                {dailyRevenue.map(([date, amount]) => {
                  const pct = Math.max((amount / maxDaily) * 100, 4);
                  return (
                    <div key={date} className="flex-1 min-w-0 flex flex-col items-center gap-1 group">
                      <span className="text-[9px] font-semibold text-[#64748B] opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block truncate max-w-full">
                        {formatNaira(amount)}
                      </span>
                      <div className="w-full relative h-36 sm:h-44">
                        <div
                          className="absolute bottom-0 inset-x-0.5 rounded-t-md bg-gradient-to-t from-primary to-primary/50 group-hover:from-primary group-hover:to-primary/70 transition-all"
                          style={{ height: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[9px] sm:text-[10px] text-[#94A3B8] font-medium">{date.slice(8)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Channel breakdown */}
            <div className={`lg:col-span-2 ${card} p-3.5 sm:p-5 md:p-6`}>
              <h3 className="text-sm font-semibold text-[#0F172A] mb-5">Payment Channels</h3>
              <div className="space-y-4">
                {channelBreakdown.map(([channel, data]) => {
                  const cfg = CHANNEL_CONFIG[channel];
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
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: cfg.color }} />
                      </div>
                      <p className="text-[11px] text-[#94A3B8] mt-1">{data.count} transactions</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Wallet summary */}
          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:gap-6">
            <div className={`${card} p-3.5 sm:p-5 md:p-6`}>
              <h3 className="text-sm font-semibold text-[#0F172A] mb-5">Wallet Activity</h3>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-5">
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
                  <span className="text-[13px] font-bold text-[#0F172A]">{mockWalletTxns.length}</span>
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

      {/* ── Transactions Tab ─────────────────────────────────────────────── */}
      {tab === "transactions" && (
        <div className="space-y-4">
          <FilterBar
            onSearch={setTxnSearch}
            searchValue={txnSearch}
            searchPlaceholder="Search by reference, customer, or order ID..."
            filters={txnFilters}
            onExport={() => toast.success("Exporting transactions...")}
          />
          <DataTable<PaystackTxn>
            columns={txnColumns}
            data={filteredTxns}
            pageSize={15}
          />
        </div>
      )}

      {/* ── Settlements Tab ──────────────────────────────────────────────── */}
      {tab === "settlements" && (
        <div className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
            <StatCard label="Total Settled" value={formatNaira(settlements.filter((s) => s.status === "settled").reduce((sum, s) => sum + s.net, 0))} icon="check_circle" color="#059669" />
            <StatCard label="Pending Payout" value={formatNaira(settlements.filter((s) => s.status === "pending" || s.status === "processing").reduce((sum, s) => sum + s.net, 0))} icon="schedule" color="#D97706" />
            <StatCard label="Total Fees Paid" value={formatNaira(settlements.reduce((sum, s) => sum + s.fee, 0))} icon="receipt" color="#DC2626" />
          </div>
          <DataTable<Settlement>
            columns={settlementColumns}
            data={settlements}
            pageSize={12}
          />
        </div>
      )}

      {/* ── Reports Tab ──────────────────────────────────────────────────── */}
      {tab === "reports" && (
        <div className="space-y-4 sm:space-y-6">
          <div className={`${card} p-3.5 sm:p-5 md:p-6`}>
            <h3 className="text-sm font-semibold text-[#0F172A] mb-4">Generate Report</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label className="text-[13px] font-semibold text-[#0F172A] mb-1.5 block">Report Type</label>
                <select className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm text-[#0F172A] outline-none focus:border-primary cursor-pointer">
                  <option>Revenue Summary</option>
                  <option>Transaction Details</option>
                  <option>Settlement Report</option>
                  <option>Failed Transactions</option>
                  <option>Wallet Activity</option>
                  <option>Portal Breakdown</option>
                </select>
              </div>
              <div>
                <label className="text-[13px] font-semibold text-[#0F172A] mb-1.5 block">From</label>
                <input type="date" defaultValue="2026-01-01" className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm text-[#0F172A] outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-[13px] font-semibold text-[#0F172A] mb-1.5 block">To</label>
                <input type="date" defaultValue="2026-04-12" className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm text-[#0F172A] outline-none focus:border-primary" />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button onClick={() => toast.success("Report generated — downloading...")} className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#0F172A] text-white text-sm font-semibold rounded-xl cursor-pointer hover:bg-[#1E293B] transition-all">
                <span className="material-symbols-outlined text-[18px]">download</span>
                Generate & Download
              </button>
            </div>
          </div>

          {/* Quick report cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {[
              { title: "Monthly Revenue", desc: "Revenue breakdown by month with portal split", icon: "bar_chart", period: "Last 12 months" },
              { title: "Transaction Audit", desc: "All transactions with Paystack references", icon: "fact_check", period: "Custom range" },
              { title: "Fee Analysis", desc: "Paystack fees breakdown by channel and volume", icon: "calculate", period: "Last 6 months" },
              { title: "Failed Payments", desc: "Failed transaction log with error reasons", icon: "error", period: "Last 30 days" },
              { title: "Wallet Report", desc: "Credits, debits, and balance movements", icon: "account_balance_wallet", period: "Custom range" },
              { title: "Settlement History", desc: "Bank settlement amounts and timelines", icon: "account_balance", period: "All time" },
            ].map((report) => (
              <button
                key={report.title}
                onClick={() => toast.success(`${report.title} — downloading...`)}
                className={`${card} p-4 sm:p-5 text-left cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all group`}
              >
                <div className="flex items-start gap-3">
                  <div className="size-9 sm:size-10 rounded-xl bg-[#F1F5F9] flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 transition-colors">
                    <span className="material-symbols-outlined text-[20px] text-[#64748B] group-hover:text-primary transition-colors">{report.icon}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#0F172A]">{report.title}</p>
                    <p className="text-[12px] text-[#64748B] mt-0.5">{report.desc}</p>
                    <p className="text-[11px] text-[#94A3B8] mt-1.5">{report.period}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
