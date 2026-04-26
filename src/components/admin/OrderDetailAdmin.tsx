import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import StatusBadge from "./shared/StatusBadge";
import { useToast } from "../../hooks/useToast";
import { getOrder, updateOrderStatus, insertOrderTimelineStep, createWalletTransaction, logAudit } from "../../lib/api";
import { supabase } from "../../lib/supabase";
import {
  formatNaira,
  formatDate,
  PORTAL_LABELS,
  PORTAL_COLORS,
  type Portal,
} from "../../data/adminMockData";

type OrderStatus = "pending" | "confirmed" | "processing" | "completed" | "cancelled";
const STATUS_OPTIONS: OrderStatus[] = ["pending", "confirmed", "processing", "completed", "cancelled"];
const STATUS_LABELS: Record<string, string> = {
  pending: "Order placed — awaiting payment",
  confirmed: "Payment confirmed",
  processing: "Order in processing",
  completed: "Order completed",
  cancelled: "Order cancelled",
};

interface OrderItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  quantity: number;
  member_covered: boolean;
}

interface TimelineStep {
  id: string;
  label: string;
  occurred_at: string | null;
  completed: boolean;
  sort_order: number;
  created_by: string | null;
  profiles: { name: string | null; email: string } | null;
}

interface OrderProfile {
  id: string;
  name: string | null;
  email: string;
  avatar_url: string | null;
  phone: string | null;
  membership_tier: string | null;
}

interface Order {
  id: string;
  user_id: string;
  portal_id: Portal;
  description: string | null;
  total_amount: number;
  discount_amount: number;
  wallet_deduction: number;
  payment_amount: number;
  payment_method: string | null;
  payment_reference: string | null;
  status: OrderStatus;
  channel: string | null;
  delivery_address: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  order_items: OrderItem[];
  order_timeline: TimelineStep[];
  profiles: OrderProfile | null;
}

export default function OrderDetailAdmin() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);
  const [refunding, setRefunding] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const { data, error } = await getOrder(id);
    setLoading(false);
    if (error || !data) return;
    setOrder(data as unknown as Order);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function handleStatusChange(newStatus: string) {
    if (!order) return;
    const old = order.status;
    setSavingStatus(true);

    const { error } = await updateOrderStatus(order.id, newStatus);
    if (error) {
      setSavingStatus(false);
      toast.error(`Failed: ${error.message}`);
      return;
    }

    // Capture which admin made the change
    const { data: sessionData } = await supabase.auth.getSession();
    const adminId = sessionData?.session?.user?.id ?? null;

    // Write a timeline entry for this status change
    const nextSort = order.order_timeline.length > 0
      ? Math.max(...order.order_timeline.map((t) => t.sort_order)) + 1
      : 1;
    await insertOrderTimelineStep({
      order_id: order.id,
      label: STATUS_LABELS[newStatus] ?? `Status changed to ${newStatus}`,
      occurred_at: new Date().toISOString(),
      completed: true,
      sort_order: nextSort,
      created_by: adminId,
    });

    await logAudit({
      action: "order.status_change",
      entity_type: "order",
      entity_id: order.id,
      old_values: { status: old },
      new_values: { status: newStatus },
    });

    setSavingStatus(false);
    toast.success(`Status updated to ${newStatus}`);
    load(); // reload to pull fresh timeline
  }

  async function handleRefund() {
    if (!order) return;
    if (!window.confirm(`Refund ${formatNaira(order.payment_amount)} to ${order.profiles?.name ?? "customer"}? This will credit their wallet.`)) return;

    setRefunding(true);

    // 1. Cancel order
    const { error: orderErr } = await updateOrderStatus(order.id, "cancelled");
    if (orderErr) {
      setRefunding(false);
      toast.error(`Refund failed: ${orderErr.message}`);
      return;
    }

    // 2. Credit the user's wallet
    // Fetch current wallet balance
    const { data: userData } = await supabase
      .from("profiles")
      .select("wallet_balance")
      .eq("id", order.user_id)
      .single();
    const currentBalance = Number((userData as { wallet_balance: number } | null)?.wallet_balance ?? 0);
    const newBalance = currentBalance + order.payment_amount;

    const txnId = `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const { error: txnErr } = await createWalletTransaction({
      id: txnId,
      user_id: order.user_id,
      description: `Refund for order ${order.id}`,
      amount: order.payment_amount,
      type: "credit",
      running_balance: newBalance,
      reference: order.id,
    });
    if (txnErr) {
      setRefunding(false);
      toast.error(`Wallet credit failed: ${txnErr.message}`);
      return;
    }

    // 3. Update profile balance
    await supabase.from("profiles").update({ wallet_balance: newBalance }).eq("id", order.user_id);

    await logAudit({
      action: "order.refund",
      entity_type: "order",
      entity_id: order.id,
      new_values: { refund_amount: order.payment_amount, credited_to_wallet: true },
    });

    setOrder({ ...order, status: "cancelled" });
    setRefunding(false);
    toast.success(`${formatNaira(order.payment_amount)} refunded to wallet`);
  }

  if (loading) {
    return <div className="text-center py-20 text-[#94A3B8]">Loading order…</div>;
  }

  if (!order) {
    return (
      <div className="text-center py-20">
        <p className="text-lg font-semibold text-[#0F172A]">Order not found</p>
        <button onClick={() => navigate("/orders")} className="text-primary text-sm font-semibold mt-2 cursor-pointer">
          Back to Orders
        </button>
      </div>
    );
  }

  const portal = order.portal_id;
  const portalColor = PORTAL_COLORS[portal];
  const user = order.profiles;

  const itemsTotal = order.order_items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const timeline = order.order_timeline.sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate("/orders")}
        className="inline-flex items-center gap-1 text-sm font-semibold text-[#64748B] hover:text-[#0F172A] cursor-pointer transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Back to Orders
      </button>

      {/* Header card */}
      <div
        className="bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 overflow-hidden"
        style={{ borderTop: `4px solid ${portalColor}` }}
      >
        <div className="p-3.5 sm:p-5 md:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-[#0F172A]">{order.id}</h1>
              <p className="text-sm text-[#64748B] mt-0.5">{formatDate(order.created_at)} via {PORTAL_LABELS[portal]}</p>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={order.status} />
              <span className="text-xl font-extrabold text-[#0F172A]">{formatNaira(order.total_amount)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Admin actions bar */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-[13px] font-semibold text-[#0F172A]">Status:</label>
          <select
            value={order.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={savingStatus || refunding}
            className="border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm text-[#334155] bg-white outline-none cursor-pointer focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all disabled:opacity-50"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          {savingStatus && <span className="text-xs text-[#94A3B8]">Saving…</span>}
        </div>
        {order.status !== "cancelled" && order.payment_amount > 0 && (
          <button
            onClick={handleRefund}
            disabled={refunding || savingStatus}
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-[#DC2626] text-[#DC2626] text-[13px] font-semibold rounded-lg cursor-pointer hover:bg-[#FEF2F2] transition-all disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[16px]">undo</span>
            {refunding ? "Refunding..." : "Refund"}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E8ECF1]/60">
              <h3 className="text-sm font-bold text-[#0F172A]">Order Items ({order.order_items.length})</h3>
            </div>
            <div className="p-5">
              {order.order_items.length === 0 ? (
                <p className="text-sm text-[#94A3B8]">No items on this order.</p>
              ) : (
                order.order_items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-3 border-b border-[#F1F5F9] last:border-0">
                    <div>
                      <p className="text-sm font-semibold text-[#0F172A]">{item.name}</p>
                      {item.description && <p className="text-[12px] text-[#64748B]">{item.description}</p>}
                      <p className="text-[12px] text-[#64748B]">
                        Qty: {item.quantity} · Unit: {formatNaira(item.price)}
                        {item.member_covered && <span className="ml-2 text-[10px] font-bold text-[#059669]">MEMBER COVERED</span>}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-[#0F172A]">{formatNaira(item.price * item.quantity)}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Payment breakdown */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 p-5">
            <h3 className="text-sm font-bold text-[#0F172A] mb-4">Payment Breakdown</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#64748B]">Subtotal</span>
                <span className="font-semibold text-[#0F172A]">{formatNaira(itemsTotal)}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#64748B]">Membership Discount</span>
                  <span className="font-semibold text-[#059669]">-{formatNaira(order.discount_amount)}</span>
                </div>
              )}
              {order.wallet_deduction > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#64748B]">Wallet Deduction</span>
                  <span className="font-semibold text-[#059669]">-{formatNaira(order.wallet_deduction)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-[#64748B]">Payment Method</span>
                <span className="font-semibold text-[#0F172A] capitalize">{(order.payment_method ?? "—").replace("_", " ")}</span>
              </div>
              {order.payment_reference && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#64748B]">Reference</span>
                  <span className="font-mono text-[11px] text-[#334155]">{order.payment_reference}</span>
                </div>
              )}
              <div className="border-t border-[#E8ECF1]/60 pt-2 mt-2 flex justify-between text-sm">
                <span className="font-bold text-[#0F172A]">Total</span>
                <span className="font-extrabold text-[#0F172A]">{formatNaira(order.total_amount)}</span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 p-5">
            <h3 className="text-sm font-bold text-[#0F172A] mb-4">Timeline</h3>
            {timeline.length === 0 ? (
              <p className="text-sm text-[#94A3B8]">No timeline steps yet. Order status changes will appear here.</p>
            ) : (
              <div className="space-y-4">
                {timeline.map((step) => (
                  <div key={step.id} className="flex items-start gap-3">
                    <div className={`size-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${step.completed ? "bg-[#ECFDF5]" : "bg-[#F1F5F9]"}`}>
                      <span className={`material-symbols-outlined text-[16px] ${step.completed ? "text-[#059669]" : "text-[#94A3B8]"}`}>
                        {step.completed ? "check_circle" : "radio_button_unchecked"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${step.completed ? "text-[#0F172A]" : "text-[#94A3B8]"}`}>{step.label}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {step.occurred_at && (
                          <span className="text-[12px] text-[#64748B]">{formatDate(step.occurred_at)}</span>
                        )}
                        {step.profiles && (
                          <>
                            <span className="text-[11px] text-[#CBD5E1]">·</span>
                            <span className="text-[12px] text-[#94A3B8]">
                              by {step.profiles.name ?? step.profiles.email}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 p-5">
            <h3 className="text-sm font-bold text-[#0F172A] mb-4">Customer</h3>
            {user ? (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.name ?? user.email} className="size-10 rounded-full object-cover" />
                  ) : (
                    <div className="size-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white text-xs font-bold">
                      {(user.name ?? user.email).split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-[#0F172A]">{user.name ?? "—"}</p>
                    <p className="text-[12px] text-[#64748B]">{user.email}</p>
                  </div>
                </div>
                {user.phone && <p className="text-[12px] text-[#64748B]">{user.phone}</p>}
                {user.membership_tier && user.membership_tier !== "none" && (
                  <p className="text-[12px] text-[#64748B] mt-1">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold capitalize bg-primary/10 text-primary">{user.membership_tier}</span> member
                  </p>
                )}
                <button
                  onClick={() => navigate(`/users/${user.id}`)}
                  className="text-sm font-semibold text-primary mt-3 cursor-pointer hover:underline"
                >
                  View Profile
                </button>
              </div>
            ) : (
              <p className="text-sm text-[#94A3B8]">Customer not found</p>
            )}
          </div>

          {order.delivery_address && (
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 p-5">
              <h3 className="text-sm font-bold text-[#0F172A] mb-2">Delivery Address</h3>
              <p className="text-sm text-[#334155]">{order.delivery_address}</p>
            </div>
          )}

          {order.admin_notes && (
            <div className="bg-[#FFF7ED] rounded-xl sm:rounded-2xl border border-[#FED7AA] p-5">
              <h3 className="text-sm font-bold text-[#EA580C] mb-2">Admin Notes</h3>
              <p className="text-sm text-[#9A3412] whitespace-pre-wrap">{order.admin_notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
