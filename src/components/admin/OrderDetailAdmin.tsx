import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import StatusBadge from "./shared/StatusBadge";
import { useToast } from "../../hooks/useToast";
import {
  mockOrders, mockUsers, formatNaira, formatDate,
  PORTAL_LABELS, PORTAL_COLORS,
  type OrderStatus, type Portal,
} from "../../data/adminMockData";

const STATUS_FLOW: OrderStatus[] = ["pending", "confirmed", "processing", "completed"];

export default function OrderDetailAdmin() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const order = mockOrders.find((o) => o.id === id);
  const [status, setStatus] = useState<OrderStatus>(order?.status ?? "pending");

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <span className="material-symbols-outlined text-outline/30 text-[48px]">receipt_long</span>
        <p className="text-on-surface-variant">Order not found</p>
        <button onClick={() => navigate("/orders")} className="text-primary font-bold text-sm cursor-pointer">Back to Orders</button>
      </div>
    );
  }

  const user = mockUsers.find((u) => u.id === order.userId);
  const portalColor = PORTAL_COLORS[order.portal as Portal];
  const paidAmount = order.amount - order.memberDiscount - order.walletDeduction;

  const handleStatusChange = (newStatus: OrderStatus) => {
    setStatus(newStatus);
    toast.success(`Order status updated to ${newStatus}`);
  };

  return (
    <div className="space-y-5 sm:space-y-8">
      {/* Back button */}
      <button onClick={() => navigate("/orders")} className="flex items-center gap-1 text-sm font-bold text-primary cursor-pointer hover:underline">
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Back to Orders
      </button>

      {/* Header card */}
      <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 overflow-hidden">
        <div className="p-4 sm:p-6 md:p-8" style={{ borderTop: `4px solid ${portalColor}` }}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold text-on-surface">{order.id}</h2>
              <p className="text-sm text-on-surface-variant mt-0.5">
                {PORTAL_LABELS[order.portal as Portal]} &middot; {formatDate(order.createdAt)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={status} variant="order" />
              <span className="text-xl font-extrabold text-on-surface">{formatNaira(order.amount)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Admin actions */}
      <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 p-3 sm:p-5">
        <h3 className="text-sm font-bold text-on-surface mb-2 sm:mb-3">Admin Actions</h3>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-on-surface-variant">Status:</label>
            <select
              value={status}
              onChange={(e) => handleStatusChange(e.target.value as OrderStatus)}
              className="bg-white border-2 border-outline-variant/15 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary cursor-pointer"
            >
              {STATUS_FLOW.map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <button
            onClick={() => toast.info("Refund dialog would open here")}
            className="px-3 sm:px-5 py-2 bg-error/10 text-error text-xs font-bold rounded-lg cursor-pointer hover:bg-error/20"
          >
            Issue Refund
          </button>
          <button
            onClick={() => toast.info("Contact user dialog would open here")}
            className="px-3 sm:px-5 py-2 bg-[#0D47A1]/10 text-[#0D47A1] text-xs font-bold rounded-lg cursor-pointer hover:bg-[#0D47A1]/20"
          >
            Contact User
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Order Items + Payment */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Items */}
          <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 overflow-hidden">
            <div className="px-3 sm:px-5 py-3 sm:py-4 border-b border-[#E8ECF1]/60">
              <h3 className="text-sm font-bold text-on-surface">Order Items</h3>
            </div>
            <div className="p-3 sm:p-5">
              <p className="text-sm text-on-surface">{order.items}</p>
              <p className="text-xs text-on-surface-variant mt-1">{order.itemCount} item{order.itemCount > 1 ? "s" : ""}</p>
            </div>
          </div>

          {/* Payment Breakdown */}
          <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 p-3 sm:p-5">
            <h3 className="text-sm font-bold text-on-surface mb-3 sm:mb-5">Payment Breakdown</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Subtotal</span>
                <span className="font-bold">{formatNaira(order.amount)}</span>
              </div>
              {order.memberDiscount > 0 && (
                <div className="flex justify-between text-primary">
                  <span>Membership Discount</span>
                  <span className="font-bold">-{formatNaira(order.memberDiscount)}</span>
                </div>
              )}
              {order.walletDeduction > 0 && (
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Wallet Deduction</span>
                  <span className="font-bold">-{formatNaira(order.walletDeduction)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-[#E8ECF1]/60">
                <span className="font-bold text-on-surface">Paid via Paystack</span>
                <span className="font-extrabold text-on-surface">{formatNaira(Math.max(0, paidAmount))}</span>
              </div>
              <p className="text-xs text-on-surface-variant mt-1">Ref: {order.paymentRef}</p>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 p-3 sm:p-5">
            <h3 className="text-sm font-bold text-on-surface mb-3 sm:mb-5">Timeline</h3>
            <div className="space-y-3 sm:space-y-4">
              {order.timeline.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`mt-0.5 size-3 rounded-full flex-shrink-0 ${i === order.timeline.length - 1 ? "bg-primary" : "bg-outline-variant/30"}`} />
                  <div>
                    <p className="text-sm font-medium text-on-surface">{step.label}</p>
                    <p className="text-xs text-on-surface-variant">{formatDate(step.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* User Info sidebar */}
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 p-3 sm:p-5">
            <h3 className="text-sm font-bold text-on-surface mb-3 sm:mb-5">Customer</h3>
            {user ? (
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                    {user.avatar}
                  </div>
                  <div>
                    <p className="font-bold text-on-surface">{user.name}</p>
                    <p className="text-xs text-on-surface-variant">{user.phone}</p>
                  </div>
                </div>
                <p className="text-sm text-on-surface-variant">{user.email}</p>
                <div className="flex items-center gap-2">
                  <StatusBadge status={user.membership} variant="membership" />
                </div>
                <button
                  onClick={() => navigate(`/users/${user.id}`)}
                  className="text-sm font-bold text-primary cursor-pointer hover:underline"
                >
                  View Full Profile
                </button>
              </div>
            ) : (
              <p className="text-sm text-on-surface-variant">User not found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
