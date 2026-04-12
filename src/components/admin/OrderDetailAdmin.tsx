import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import StatusBadge from "./shared/StatusBadge";
import { useToast } from "../../hooks/useToast";
import {
  mockOrders,
  mockUsers,
  formatNaira,
  formatDate,
  PORTAL_LABELS,
  PORTAL_COLORS,
  type OrderStatus,
  type Portal,
} from "../../data/adminMockData";

const STATUS_OPTIONS: OrderStatus[] = ["pending", "confirmed", "processing", "completed", "cancelled"];

export default function OrderDetailAdmin() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const order = mockOrders.find((o) => o.id === id);
  const [status, setStatus] = useState<OrderStatus>(order?.status ?? "pending");

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

  const user = mockUsers.find((u) => u.id === order.userId);
  const portal = order.portal as Portal;
  const portalColor = PORTAL_COLORS[portal];

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus as OrderStatus);
    toast.success(`Order status updated to ${newStatus}`);
  };

  const handleRefund = () => {
    toast.success(`Refund of ${formatNaira(order.amount)} initiated`);
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate("/orders")}
        className="inline-flex items-center gap-1 text-sm font-semibold text-[#64748B] hover:text-[#0F172A] cursor-pointer transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Back to Orders
      </button>

      {/* Header card */}
      <div
        className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 overflow-hidden"
        style={{ borderTop: `4px solid ${portalColor}` }}
      >
        <div className="p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-[#0F172A]">{order.id}</h1>
              <p className="text-sm text-[#64748B] mt-0.5">{formatDate(order.createdAt)} via {PORTAL_LABELS[portal]}</p>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={status} />
              <span className="text-xl font-extrabold text-[#0F172A]">{formatNaira(order.amount)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Admin actions bar */}
      <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-[13px] font-semibold text-[#0F172A]">Status:</label>
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm text-[#334155] bg-white outline-none cursor-pointer focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
        <button
          onClick={handleRefund}
          className="inline-flex items-center gap-1.5 px-4 py-2 border border-[#DC2626] text-[#DC2626] text-[13px] font-semibold rounded-lg cursor-pointer hover:bg-[#FEF2F2] transition-all"
        >
          <span className="material-symbols-outlined text-[16px]">undo</span>
          Refund
        </button>
        <button className="inline-flex items-center gap-1.5 px-4 py-2 border border-[#E2E8F0] text-[#334155] text-[13px] font-semibold rounded-lg cursor-pointer hover:bg-[#F8FAFC] transition-all">
          <span className="material-symbols-outlined text-[16px]">chat</span>
          Contact
        </button>
      </div>

      {/* Content — 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E8ECF1]/60">
              <h3 className="text-sm font-bold text-[#0F172A]">Order Items</h3>
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between py-3 border-b border-[#F1F5F9]">
                <div>
                  <p className="text-sm font-semibold text-[#0F172A]">{order.product}</p>
                  <p className="text-[12px] text-[#64748B]">Qty: {order.quantity}</p>
                </div>
                <span className="text-sm font-bold text-[#0F172A]">{formatNaira(order.amount)}</span>
              </div>
            </div>
          </div>

          {/* Payment breakdown */}
          <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 p-5">
            <h3 className="text-sm font-bold text-[#0F172A] mb-4">Payment Breakdown</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#64748B]">Subtotal</span>
                <span className="font-semibold text-[#0F172A]">{formatNaira(order.amount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#64748B]">Discount</span>
                <span className="font-semibold text-[#059669]">-{formatNaira(0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#64748B]">Payment Method</span>
                <span className="font-semibold text-[#0F172A] capitalize">{order.paymentMethod.replace("_", " ")}</span>
              </div>
              <div className="border-t border-[#E8ECF1]/60 pt-2 mt-2 flex justify-between text-sm">
                <span className="font-bold text-[#0F172A]">Total</span>
                <span className="font-extrabold text-[#0F172A]">{formatNaira(order.amount)}</span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 p-5">
            <h3 className="text-sm font-bold text-[#0F172A] mb-4">Timeline</h3>
            <div className="space-y-4">
              {[
                { label: "Order Placed", date: order.createdAt, completed: true },
                { label: "Confirmed", date: status !== "pending" ? order.updatedAt : null, completed: ["confirmed", "processing", "completed"].includes(status) },
                { label: "Processing", date: ["processing", "completed"].includes(status) ? order.updatedAt : null, completed: ["processing", "completed"].includes(status) },
                { label: "Completed", date: status === "completed" ? order.updatedAt : null, completed: status === "completed" },
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`size-8 rounded-full flex items-center justify-center flex-shrink-0 ${step.completed ? "bg-[#ECFDF5]" : "bg-[#F1F5F9]"}`}>
                    <span className={`material-symbols-outlined text-[16px] ${step.completed ? "text-[#059669]" : "text-[#94A3B8]"}`}>
                      {step.completed ? "check_circle" : "radio_button_unchecked"}
                    </span>
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${step.completed ? "text-[#0F172A]" : "text-[#94A3B8]"}`}>{step.label}</p>
                    {step.date && <p className="text-[12px] text-[#64748B]">{formatDate(step.date)}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right — 1/3 */}
        <div className="space-y-6">
          {/* Customer card */}
          <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 p-5">
            <h3 className="text-sm font-bold text-[#0F172A] mb-4">Customer</h3>
            {user ? (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="size-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white text-xs font-bold">
                    {user.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#0F172A]">{user.name}</p>
                    <p className="text-[12px] text-[#64748B]">{user.email}</p>
                  </div>
                </div>
                <p className="text-[12px] text-[#64748B]">{user.phone}</p>
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
        </div>
      </div>
    </div>
  );
}
