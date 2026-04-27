import { useParams, useNavigate } from "react-router-dom";
import StatusBadge from "./shared/StatusBadge";
import { useState, useEffect } from "react";
import {
  getUser, getOrders, getWalletTransactions, getReferrals,
  updateUser, createWalletTransaction, updateUserWalletBalance,
  createMembershipSubscription, cancelUserSubscriptions, logAudit,
} from "../../lib/api";
import { useToast } from "../../hooks/useToast";
import { formatNaira, PORTAL_LABELS, type Portal } from "../../data/adminMockData";

interface DbProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  membership_tier: string;
  wallet_balance: number;
  referral_code: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface DbOrder {
  id: string;
  user_id: string;
  portal_id: string;
  total_amount: number;
  status: string;
  created_at: string;
}

interface DbTxn {
  id: string;
  user_id: string;
  description: string;
  type: string;
  amount: number;
  created_at: string;
}

interface DbReferral {
  id: string;
  referrer_id: string;
  referred: { name: string; email: string } | null;
  status: string;
  created_at: string;
}

function initials(name: string, email?: string): string {
  const src = (name || email || "?").trim();
  return src.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("") || "?";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

function newTxnId() {
  return `TXN-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`.toUpperCase();
}

export default function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [notifTypeFilter, setNotifTypeFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<DbProfile | null>(null);
  const [orders, setOrders] = useState<DbOrder[]>([]);
  const [txns, setTxns] = useState<DbTxn[]>([]);
  const [referrals, setReferrals] = useState<DbReferral[]>([]);

  // ── Adjust Wallet state ────────────────────────────────────
  const [walletModal, setWalletModal] = useState(false);
  const [walletAmount, setWalletAmount] = useState("");
  const [walletType, setWalletType] = useState<"credit" | "debit">("credit");
  const [walletDesc, setWalletDesc] = useState("");
  const [walletSaving, setWalletSaving] = useState(false);

  // ── Set Membership state ───────────────────────────────────
  const [memberModal, setMemberModal] = useState(false);
  const [memberTier, setMemberTier] = useState<"none" | "bronze" | "silver" | "gold">("bronze");
  const [memberCycle, setMemberCycle] = useState<"annual" | "quarterly">("annual");
  const [memberSaving, setMemberSaving] = useState(false);

  // ── Cancel Membership state ────────────────────────────────
  const [cancelMemberModal, setCancelMemberModal] = useState(false);
  const [cancelMemberSaving, setCancelMemberSaving] = useState(false);

  // ── Suspend modal state ────────────────────────────────────
  const [suspendModal, setSuspendModal] = useState(false);
  const [suspendSaving, setSuspendSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      const [profileRes, ordersRes, txnsRes, referralsRes] = await Promise.all([
        getUser(id),
        getOrders(),
        getWalletTransactions(id),
        getReferrals(),
      ]);
      if (cancelled) return;
      setUser((profileRes.data as DbProfile) ?? null);
      const allOrders = (ordersRes.data as DbOrder[]) ?? [];
      setOrders(allOrders.filter((o) => o.user_id === id).slice(0, 10));
      setTxns((txnsRes.data as DbTxn[]) ?? []);
      const allReferrals = (referralsRes.data as DbReferral[]) ?? [];
      setReferrals(allReferrals.filter((r) => r.referrer_id === id));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [id]);

  // ── Handlers ──────────────────────────────────────────────

  async function handleAdjustWallet() {
    if (!user) return;
    const amount = parseFloat(walletAmount);
    if (!amount || amount <= 0) { toast.error("Enter a valid amount"); return; }
    if (!walletDesc.trim()) { toast.error("Enter a description"); return; }
    setWalletSaving(true);
    const newBalance = walletType === "credit"
      ? user.wallet_balance + amount
      : user.wallet_balance - amount;
    if (newBalance < 0) { toast.error("Debit exceeds wallet balance"); setWalletSaving(false); return; }

    const txnId = newTxnId();
    const [txnRes] = await Promise.all([
      createWalletTransaction({
        id: txnId,
        user_id: user.id,
        description: walletDesc.trim(),
        amount,
        type: walletType,
        running_balance: newBalance,
        reference: `ADMIN-ADJ-${Date.now()}`,
      }),
      updateUserWalletBalance(user.id, newBalance),
    ]);

    if (txnRes.error) { toast.error(txnRes.error.message); setWalletSaving(false); return; }

    void logAudit({
      action: "wallet.manual_adjustment",
      entity_type: "wallet_transaction",
      entity_id: txnId,
      new_values: { user_id: user.id, amount, type: walletType, description: walletDesc.trim(), new_balance: newBalance },
    });

    setUser((prev) => prev ? { ...prev, wallet_balance: newBalance } : prev);
    setTxns((prev) => [{
      id: txnId, user_id: user.id, description: walletDesc.trim(),
      type: walletType, amount, created_at: new Date().toISOString(),
    }, ...prev]);
    toast.success(`Wallet ${walletType === "credit" ? "credited" : "debited"} ₦${amount.toLocaleString()}`);
    setWalletModal(false);
    setWalletAmount("");
    setWalletDesc("");
    setWalletSaving(false);
  }

  async function handleSetMembership() {
    if (!user) return;
    setMemberSaving(true);

    if (memberTier === "none") {
      // Cancel all active subs — trigger will sync profile tier to 'none'
      const { error } = await updateUser(user.id, { membership_tier: "none" });
      if (error) { toast.error(error.message); setMemberSaving(false); return; }
    } else {
      const today = new Date().toISOString().split("T")[0];
      const daysToAdd = memberCycle === "annual" ? 365 : 90;
      const expiresAt = new Date(Date.now() + daysToAdd * 86400000).toISOString().split("T")[0];
      // Trigger auto-cancels existing active subs and syncs profiles.membership_tier
      const { error } = await createMembershipSubscription({
        user_id: user.id,
        tier: memberTier,
        billing_cycle: memberCycle,
        amount_paid: 0,
        starts_at: today,
        expires_at: expiresAt,
        status: "active",
      });
      if (error) { toast.error(error.message); setMemberSaving(false); return; }
    }

    void logAudit({
      action: "membership.admin_set",
      entity_type: "membership_subscription",
      new_values: { user_id: user.id, tier: memberTier, billing_cycle: memberCycle },
    });

    setUser((prev) => prev ? { ...prev, membership_tier: memberTier } : prev);
    toast.success(`Membership set to ${memberTier === "none" ? "None" : memberTier}`);
    setMemberModal(false);
    setMemberSaving(false);
  }

  async function handleCancelMembership() {
    if (!user) return;
    setCancelMemberSaving(true);
    const { error } = await cancelUserSubscriptions(user.id);
    if (error) { toast.error(error.message); setCancelMemberSaving(false); return; }

    void logAudit({
      action: "membership.admin_cancelled",
      entity_type: "membership_subscription",
      entity_id: user.id,
      new_values: { user_id: user.id, previous_tier: user.membership_tier },
    });

    setUser((prev) => prev ? { ...prev, membership_tier: "none" } : prev);
    toast.success("Membership cancelled");
    setCancelMemberModal(false);
    setCancelMemberSaving(false);
  }

  async function handleToggleSuspend() {
    if (!user) return;
    setSuspendSaving(true);
    const newActive = !user.is_active;
    const { error } = await updateUser(user.id, { is_active: newActive });
    if (error) { toast.error(error.message); setSuspendSaving(false); return; }

    void logAudit({
      action: newActive ? "user.activated" : "user.suspended",
      entity_type: "profile",
      entity_id: user.id,
      new_values: { is_active: newActive },
    });

    setUser((prev) => prev ? { ...prev, is_active: newActive } : prev);
    toast.success(`User ${newActive ? "activated" : "suspended"}`);
    setSuspendModal(false);
    setSuspendSaving(false);
  }

  if (loading) {
    return <div className="text-center py-20 text-[#94A3B8] text-sm">Loading…</div>;
  }

  if (!user) {
    return (
      <div className="text-center py-20">
        <p className="text-lg font-semibold text-[#0F172A]">User not found</p>
        <button onClick={() => navigate("/users")} className="text-primary text-sm font-semibold mt-2 cursor-pointer">
          Back to Users
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back */}
      <button
        onClick={() => navigate("/users")}
        className="inline-flex items-center gap-1 text-sm font-semibold text-[#64748B] hover:text-[#0F172A] cursor-pointer transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Back to Users
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left column */}
        <div className="lg:col-span-3 space-y-6">
          {/* Profile card */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 p-3.5 sm:p-5 md:p-7">
            <div className="flex items-start gap-3 sm:gap-4">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.name} className="size-12 sm:size-16 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="size-12 sm:size-16 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white text-base sm:text-xl font-bold flex-shrink-0">
                  {initials(user.name, user.email)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-[#0F172A]">{user.name || "—"}</h2>
                <p className="text-sm text-[#64748B]">{user.phone || "—"}</p>
                <p className="text-sm text-[#64748B]">{user.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <StatusBadge status={user.membership_tier} />
                  <StatusBadge status={user.is_active ? "active" : "inactive"} />
                </div>
                <p className="text-[12px] text-[#94A3B8] mt-2">Joined {formatDate(user.created_at)}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-[#E8ECF1]/60">
              <button
                onClick={() => { setWalletType("credit"); setWalletModal(true); }}
                className="px-4 py-2 bg-primary text-white text-[13px] font-semibold rounded-lg cursor-pointer hover:brightness-[0.92] transition-all"
              >
                Adjust Wallet
              </button>
              <button
                onClick={() => { setMemberTier((user.membership_tier as typeof memberTier) || "bronze"); setMemberModal(true); }}
                className="px-4 py-2 bg-[#0F172A] text-white text-[13px] font-semibold rounded-lg cursor-pointer hover:bg-[#1E293B] transition-all"
              >
                Set Membership
              </button>
              {user.membership_tier !== "none" && (
                <button
                  onClick={() => setCancelMemberModal(true)}
                  className="px-4 py-2 border border-[#E2E8F0] text-[13px] font-semibold text-[#DC2626] rounded-lg cursor-pointer hover:bg-[#FEF2F2] transition-all"
                >
                  Cancel Membership
                </button>
              )}
              <button
                onClick={() => setSuspendModal(true)}
                className="px-4 py-2 border border-[#E2E8F0] text-[13px] font-semibold text-[#64748B] rounded-lg cursor-pointer hover:bg-[#F1F5F9] transition-all"
              >
                {user.is_active ? "Suspend" : "Activate"}
              </button>
            </div>
          </div>

          {/* Order History */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E8ECF1]/60">
              <h3 className="text-sm font-bold text-[#0F172A]">Order History</h3>
            </div>
            <div className="overflow-hidden">
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="bg-[#F8FAFC]">
                    <th className="px-2.5 sm:px-4 py-2.5 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-left">Order</th>
                    <th className="px-2.5 sm:px-4 py-2.5 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-left hidden sm:table-cell">Portal</th>
                    <th className="px-2.5 sm:px-4 py-2.5 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-right">Amount</th>
                    <th className="px-2.5 sm:px-4 py-2.5 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-center hidden sm:table-cell">Status</th>
                    <th className="px-2.5 sm:px-4 py-2.5 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-left hidden md:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {orders.length === 0 ? (
                    <tr><td colSpan={5} className="px-5 py-8 text-center text-[#94A3B8]">No orders found</td></tr>
                  ) : orders.map((o) => (
                    <tr key={o.id} onClick={() => navigate(`/orders/${o.id}`)} className="hover:bg-[#F8FAFC] cursor-pointer transition-colors">
                      <td className="px-2.5 sm:px-4 py-3 font-semibold text-primary">{o.id}</td>
                      <td className="px-2.5 sm:px-4 py-3 text-[#334155] hidden sm:table-cell capitalize">{PORTAL_LABELS[o.portal_id as Portal] ?? o.portal_id}</td>
                      <td className="px-2.5 sm:px-4 py-3 text-right font-semibold text-[#0F172A]">{o.total_amount === 0 ? "Free" : formatNaira(o.total_amount)}</td>
                      <td className="px-2.5 sm:px-4 py-3 text-center hidden sm:table-cell"><StatusBadge status={o.status} /></td>
                      <td className="px-2.5 sm:px-4 py-3 text-[#64748B] hidden md:table-cell whitespace-nowrap">{formatDate(o.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Wallet Transactions */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E8ECF1]/60">
              <h3 className="text-sm font-bold text-[#0F172A]">Wallet Transactions</h3>
            </div>
            <div className="overflow-hidden">
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="bg-[#F8FAFC]">
                    <th className="px-2.5 sm:px-4 py-2.5 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-left">Description</th>
                    <th className="px-2.5 sm:px-4 py-2.5 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-center hidden sm:table-cell">Type</th>
                    <th className="px-2.5 sm:px-4 py-2.5 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-right">Amount</th>
                    <th className="px-2.5 sm:px-4 py-2.5 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-left hidden md:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {txns.length === 0 ? (
                    <tr><td colSpan={4} className="px-5 py-8 text-center text-[#94A3B8]">No transactions</td></tr>
                  ) : txns.map((t) => (
                    <tr key={t.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-2.5 sm:px-4 py-3 text-[#334155]">{t.description}</td>
                      <td className="px-2.5 sm:px-4 py-3 text-center hidden sm:table-cell"><StatusBadge status={t.type} /></td>
                      <td className={`px-2.5 sm:px-4 py-3 text-right font-semibold ${t.type === "credit" ? "text-[#059669]" : "text-[#DC2626]"}`}>
                        {t.type === "credit" ? "+" : "-"}{formatNaira(t.amount)}
                      </td>
                      <td className="px-2.5 sm:px-4 py-3 text-[#64748B] hidden md:table-cell whitespace-nowrap">{formatDate(t.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 p-5">
            <h3 className="text-sm font-bold text-[#0F172A] mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[#64748B]">Wallet Balance</span>
                <span className="text-sm font-bold text-[#0F172A]">{formatNaira(user.wallet_balance)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[#64748B]">Total Orders</span>
                <span className="text-sm font-bold text-[#0F172A]">{orders.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[#64748B]">Total Spent</span>
                <span className="text-sm font-bold text-[#0F172A]">
                  {formatNaira(orders.filter((o) => o.status === "completed").reduce((s, o) => s + o.total_amount, 0))}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[#64748B]">Referral Code</span>
                <span className="text-sm font-mono font-bold text-primary">{user.referral_code ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[#64748B]">Last Updated</span>
                <span className="text-sm text-[#334155]">{formatDate(user.updated_at)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 p-5">
            <h3 className="text-sm font-bold text-[#0F172A] mb-4">Referrals ({referrals.length})</h3>
            {referrals.length === 0 ? (
              <p className="text-sm text-[#94A3B8]">No referrals yet</p>
            ) : (
              <div className="space-y-3">
                {referrals.map((r) => (
                  <div key={r.id} className="flex items-center justify-between py-2 border-b border-[#F1F5F9] last:border-0">
                    <div>
                      <p className="text-sm font-semibold text-[#0F172A]">{r.referred?.name ?? r.referred?.email ?? "—"}</p>
                      <p className="text-[12px] text-[#64748B]">{formatDate(r.created_at)}</p>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 p-5">
            <h3 className="text-sm font-bold text-[#0F172A] mb-4">Current Cart</h3>
            <p className="text-sm text-[#94A3B8]">Cart is empty</p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8ECF1]/60">
          <h3 className="text-sm font-bold text-[#0F172A]">Notifications</h3>
          <select value={notifTypeFilter} onChange={(e) => setNotifTypeFilter(e.target.value)} className="border border-[#E2E8F0] rounded-lg px-2 py-1 text-xs text-[#334155] outline-none cursor-pointer">
            <option value="">All Types</option>
            <option value="order">Order</option>
            <option value="wallet">Wallet</option>
            <option value="membership">Membership</option>
            <option value="system">System</option>
            <option value="broadcast">Broadcast</option>
          </select>
        </div>
        <div className="px-5 py-10 text-center text-[#94A3B8] text-sm">No notifications</div>
      </div>

      {/* ── Adjust Wallet Modal ──────────────────────────────── */}
      {walletModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#0F172A]">Adjust Wallet</h3>
              <button onClick={() => setWalletModal(false)} className="text-[#94A3B8] hover:text-[#64748B] cursor-pointer">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <p className="text-[13px] text-[#64748B]">Current balance: <strong>{formatNaira(user.wallet_balance)}</strong></p>

            <div className="flex gap-1 bg-[#F1F5F9] rounded-xl p-1">
              {(["credit", "debit"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setWalletType(t)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer capitalize ${walletType === t ? (t === "credit" ? "bg-white text-[#059669] shadow-sm" : "bg-white text-[#DC2626] shadow-sm") : "text-[#64748B]"}`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[12px] font-semibold text-[#64748B] uppercase tracking-wide block mb-1.5">Amount (₦)</label>
                <input
                  type="number"
                  min="1"
                  placeholder="0"
                  value={walletAmount}
                  onChange={(e) => setWalletAmount(e.target.value)}
                  className="w-full border-2 border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary transition-all"
                />
              </div>
              <div>
                <label className="text-[12px] font-semibold text-[#64748B] uppercase tracking-wide block mb-1.5">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Refund for order #123"
                  value={walletDesc}
                  onChange={(e) => setWalletDesc(e.target.value)}
                  className="w-full border-2 border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary transition-all"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={() => setWalletModal(false)} className="flex-1 py-2.5 rounded-xl border border-[#E2E8F0] text-sm font-semibold text-[#64748B] hover:bg-[#F1F5F9] cursor-pointer transition-colors">
                Cancel
              </button>
              <button
                onClick={handleAdjustWallet}
                disabled={walletSaving}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer disabled:opacity-60 transition-colors ${walletType === "credit" ? "bg-[#059669] hover:bg-[#047857]" : "bg-[#DC2626] hover:bg-[#B91C1C]"}`}
              >
                {walletSaving ? "Saving…" : `Apply ${walletType === "credit" ? "Credit" : "Debit"}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Set Membership Modal ─────────────────────────────── */}
      {memberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#0F172A]">Set Membership</h3>
              <button onClick={() => setMemberModal(false)} className="text-[#94A3B8] hover:text-[#64748B] cursor-pointer">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <p className="text-[13px] text-[#64748B]">Current tier: <strong className="capitalize">{user.membership_tier}</strong></p>

            <div className="space-y-3">
              <div>
                <label className="text-[12px] font-semibold text-[#64748B] uppercase tracking-wide block mb-1.5">Tier</label>
                <select
                  value={memberTier}
                  onChange={(e) => setMemberTier(e.target.value as typeof memberTier)}
                  className="w-full border-2 border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary bg-white cursor-pointer transition-all"
                >
                  <option value="none">None (remove membership)</option>
                  <option value="bronze">Bronze</option>
                  <option value="silver">Silver</option>
                  <option value="gold">Gold</option>
                </select>
              </div>
              {memberTier !== "none" && (
                <div>
                  <label className="text-[12px] font-semibold text-[#64748B] uppercase tracking-wide block mb-1.5">Billing Cycle</label>
                  <select
                    value={memberCycle}
                    onChange={(e) => setMemberCycle(e.target.value as typeof memberCycle)}
                    className="w-full border-2 border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary bg-white cursor-pointer transition-all"
                  >
                    <option value="annual">Annual</option>
                    <option value="quarterly">Quarterly</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={() => setMemberModal(false)} className="flex-1 py-2.5 rounded-xl border border-[#E2E8F0] text-sm font-semibold text-[#64748B] hover:bg-[#F1F5F9] cursor-pointer transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSetMembership}
                disabled={memberSaving}
                className="flex-1 py-2.5 rounded-xl bg-[#0F172A] text-white text-sm font-semibold hover:bg-[#1E293B] disabled:opacity-60 cursor-pointer transition-colors"
              >
                {memberSaving ? "Saving…" : "Apply"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Cancel Membership Modal ──────────────────────────── */}
      {cancelMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-red-600 text-[20px]">card_membership</span>
              </div>
              <div>
                <p className="font-semibold text-[#0F172A] text-sm">Cancel Membership</p>
                <p className="text-[12px] text-[#64748B]">{user.name || user.email}</p>
              </div>
            </div>
            <p className="text-sm text-[#334155]">
              This will immediately cancel the <strong className="capitalize">{user.membership_tier}</strong> membership. The user will lose access to all membership benefits.
            </p>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setCancelMemberModal(false)} className="flex-1 py-2.5 rounded-xl border border-[#E2E8F0] text-sm font-semibold text-[#64748B] hover:bg-[#F1F5F9] cursor-pointer transition-colors">
                Keep Active
              </button>
              <button
                onClick={handleCancelMembership}
                disabled={cancelMemberSaving}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-60 cursor-pointer transition-colors"
              >
                {cancelMemberSaving ? "Cancelling…" : "Yes, Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Suspend / Activate Modal ─────────────────────────── */}
      {suspendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className={`size-10 rounded-full flex items-center justify-center flex-shrink-0 ${user.is_active ? "bg-red-50" : "bg-green-50"}`}>
                <span className={`material-symbols-outlined text-[20px] ${user.is_active ? "text-red-600" : "text-green-600"}`}>
                  {user.is_active ? "block" : "check_circle"}
                </span>
              </div>
              <div>
                <p className="font-semibold text-[#0F172A] text-sm">{user.is_active ? "Suspend User" : "Activate User"}</p>
                <p className="text-[12px] text-[#64748B]">{user.name || user.email}</p>
              </div>
            </div>
            <p className="text-sm text-[#334155]">
              {user.is_active
                ? "This user will be blocked from logging in and placing orders."
                : "This user's account will be restored and they can log in again."}
            </p>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setSuspendModal(false)} className="flex-1 py-2.5 rounded-xl border border-[#E2E8F0] text-sm font-semibold text-[#64748B] hover:bg-[#F1F5F9] cursor-pointer transition-colors">
                Keep as is
              </button>
              <button
                onClick={handleToggleSuspend}
                disabled={suspendSaving}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer disabled:opacity-60 transition-colors ${user.is_active ? "bg-[#DC2626] hover:bg-[#B91C1C]" : "bg-[#059669] hover:bg-[#047857]"}`}
              >
                {suspendSaving ? "Saving…" : (user.is_active ? "Yes, Suspend" : "Yes, Activate")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
