import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "../../hooks/useToast";
import { mockNotifications, formatDate } from "../../data/adminMockData";

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  order: { bg: "#FFF7ED", text: "#EA580C" },
  wallet: { bg: "#EFF6FF", text: "#2563EB" },
  membership: { bg: "#F5F3FF", text: "#7C3AED" },
  system: { bg: "#F1F5F9", text: "#64748B" },
};

export default function BroadcastDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [broadcastStatus, setBroadcastStatus] = useState<"sent" | "retracted">("sent");
  const [showRetractConfirm, setShowRetractConfirm] = useState(false);

  const notif = mockNotifications.find((n) => n.id === id);

  if (!notif) {
    return (
      <div className="text-center py-20">
        <p className="text-lg font-semibold text-[#0F172A]">Broadcast not found</p>
        <button onClick={() => navigate("/broadcast")} className="text-primary text-sm font-semibold mt-2 cursor-pointer">
          Back to Broadcast
        </button>
      </div>
    );
  }

  const typeColor = TYPE_COLORS[notif.type] ?? TYPE_COLORS.system;
  const readPct = notif.read ? 85 : 42;

  return (
    <div className="space-y-6">
      {/* Back */}
      <button
        onClick={() => navigate("/broadcast")}
        className="inline-flex items-center gap-1 text-sm font-semibold text-[#64748B] hover:text-[#0F172A] cursor-pointer transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Back to Broadcast
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Content card */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 p-3.5 sm:p-5 md:p-7">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-lg font-bold text-[#0F172A]">{notif.title}</h2>
              <span
                className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-semibold uppercase"
                style={{ backgroundColor: typeColor.bg, color: typeColor.text }}
              >
                {notif.type}
              </span>
            </div>
            <p className="text-sm text-[#334155] leading-relaxed">{notif.message}</p>
            {broadcastStatus === "retracted" && (
              <div className="mt-3 p-3 bg-red-50 rounded-lg">
                <p className="text-sm text-red-600 font-semibold">This broadcast has been retracted</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 p-3.5 sm:p-5">
            <h3 className="text-sm font-bold text-[#0F172A] mb-3">Actions</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => navigate("/broadcast/compose")}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-primary/90 cursor-pointer transition-all"
              >
                <span className="material-symbols-outlined text-[16px] mr-1 align-text-bottom">replay</span>
                Resend
              </button>
              {broadcastStatus === "sent" && (
                <button
                  onClick={() => setShowRetractConfirm(true)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-orange-50 text-orange-600 hover:bg-orange-100 cursor-pointer transition-all"
                >
                  <span className="material-symbols-outlined text-[16px] mr-1 align-text-bottom">undo</span>
                  Retract
                </button>
              )}
              {broadcastStatus === "retracted" && (
                <button
                  onClick={() => { toast.success("Broadcast deleted"); navigate("/broadcast"); }}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer transition-all"
                >
                  <span className="material-symbols-outlined text-[16px] mr-1 align-text-bottom">delete</span>
                  Delete
                </button>
              )}
            </div>
            {showRetractConfirm && (
              <div className="mt-3 p-3 bg-orange-50 rounded-xl space-y-2">
                <p className="text-sm text-orange-800">Users who haven't read this notification will no longer see it. Users who already read it will see a retraction notice.</p>
                <div className="flex gap-2">
                  <button onClick={() => { setBroadcastStatus("retracted"); setShowRetractConfirm(false); toast.success("Broadcast retracted"); }} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-orange-600 text-white hover:bg-orange-700 cursor-pointer">Confirm Retract</button>
                  <button onClick={() => setShowRetractConfirm(false)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#64748B] hover:text-[#0F172A] cursor-pointer">Cancel</button>
                </div>
              </div>
            )}
          </div>

          {/* Delivery stats */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 p-3.5 sm:p-5 md:p-7">
            <h3 className="text-sm font-bold text-[#0F172A] mb-4">Delivery Stats</h3>
            <div className="space-y-4">
              {/* Read rate progress */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[13px] text-[#64748B]">Read Rate</span>
                  <span className="text-sm font-bold text-[#0F172A]">{readPct}%</span>
                </div>
                <div className="h-3 bg-[#F1F5F9] rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${readPct}%` }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:gap-4 pt-2">
                <div className="text-center p-3 bg-[#F8FAFC] rounded-xl">
                  <p className="text-lg font-extrabold text-[#0F172A]">{readPct}%</p>
                  <p className="text-[12px] text-[#64748B]">Open Rate</p>
                </div>
                <div className="text-center p-3 bg-[#F8FAFC] rounded-xl">
                  <p className="text-lg font-extrabold text-[#0F172A]">{Math.round(readPct * 0.6)}%</p>
                  <p className="text-[12px] text-[#64748B]">Click Rate</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right — 1/3 */}
        <div className="space-y-6">
          {/* Config card */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 p-5">
            <h3 className="text-sm font-bold text-[#0F172A] mb-4">Configuration</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[#64748B]">Recipients</span>
                <span className="text-sm font-semibold text-[#0F172A] capitalize">{notif.read ? "All Users" : "Active Users"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[#64748B]">Sent By</span>
                <span className="text-sm font-semibold text-[#0F172A]">Admin</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[#64748B]">Date</span>
                <span className="text-sm text-[#334155]">{formatDate(notif.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[#64748B]">Type</span>
                <span
                  className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-semibold uppercase"
                  style={{ backgroundColor: typeColor.bg, color: typeColor.text }}
                >
                  {notif.type}
                </span>
              </div>
            </div>
          </div>

          {/* Audience breakdown */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 p-5">
            <h3 className="text-sm font-bold text-[#0F172A] mb-4">Audience Breakdown</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[#64748B]">Delivered</span>
                <span className="text-sm font-bold text-[#059669]">1,180</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[#64748B]">Bounced</span>
                <span className="text-sm font-bold text-[#DC2626]">12</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[#64748B]">Pending</span>
                <span className="text-sm font-bold text-[#EA580C]">35</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
