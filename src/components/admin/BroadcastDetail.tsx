import { useParams, useNavigate } from "react-router-dom";
import StatusBadge from "./shared/StatusBadge";
import { mockNotifications, formatDate } from "../../data/adminMockData";

export default function BroadcastDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const broadcast = mockNotifications.find((n) => n.id === id);

  if (!broadcast) {
    return (
      <div className="space-y-5 sm:space-y-8">
        <button
          onClick={() => navigate("/broadcast")}
          className="inline-flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#334155] transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to Broadcast
        </button>
        <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 p-10 text-center">
          <span className="material-symbols-outlined text-[48px] text-[#94A3B8] mb-3 block">
            search_off
          </span>
          <p className="text-lg font-semibold text-[#0F172A]">Broadcast not found</p>
          <p className="text-sm text-[#64748B] mt-1">
            The broadcast with ID "{id}" does not exist.
          </p>
        </div>
      </div>
    );
  }

  const readPct =
    broadcast.totalCount > 0
      ? Math.round((broadcast.readCount / broadcast.totalCount) * 100)
      : 0;

  // Mock delivery stats
  const delivered = broadcast.totalCount - 47;
  const bounced = 47;
  const openRate = readPct;
  const clickRate = Math.max(0, readPct - 18);

  return (
    <div className="space-y-5 sm:space-y-8">
      {/* Back + header */}
      <div>
        <button
          onClick={() => navigate("/broadcast")}
          className="inline-flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#334155] transition-colors cursor-pointer mb-4"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to Broadcast
        </button>
        <h1 className="text-xl font-bold text-[#0F172A]">{broadcast.title}</h1>
      </div>

      {/* 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 sm:gap-6">
        {/* Left column — 60% */}
        <div className="lg:col-span-3 space-y-5 sm:space-y-6">
          {/* Content card */}
          <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 overflow-hidden">
            <div className="px-5 py-3 border-b border-[#E8ECF1]/60 flex items-center justify-between">
              <h2 className="text-base font-bold text-[#0F172A]">Content</h2>
              <StatusBadge status={broadcast.type} />
            </div>
            <div className="p-5 sm:p-6">
              <h3 className="text-lg font-bold text-[#0F172A] mb-3">{broadcast.title}</h3>
              <div className="border border-[#E2E8F0] rounded-xl p-4 bg-[#F8FAFC]">
                <p className="text-sm text-[#334155] leading-relaxed whitespace-pre-wrap">
                  {broadcast.message}
                </p>
              </div>
            </div>
          </div>

          {/* Delivery Stats card */}
          <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 overflow-hidden">
            <div className="px-5 py-3 border-b border-[#E8ECF1]/60">
              <h2 className="text-base font-bold text-[#0F172A]">Delivery Stats</h2>
            </div>
            <div className="p-5 sm:p-6 space-y-5">
              {/* Read rate with progress bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] font-semibold text-[#0F172A]">Read Rate</span>
                  <span className="text-sm font-bold text-[#0F172A]">{readPct}%</span>
                </div>
                <div className="h-3 bg-[#F1F5F9] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${readPct}%` }}
                  />
                </div>
                <p className="text-xs text-[#94A3B8] mt-1.5">
                  {broadcast.readCount.toLocaleString()} of {broadcast.totalCount.toLocaleString()} recipients read this broadcast
                </p>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-[#F8FAFC] rounded-xl p-3.5 text-center">
                  <p className="text-lg font-bold text-[#0F172A]">
                    {broadcast.totalCount.toLocaleString()}
                  </p>
                  <p className="text-[11px] text-[#64748B] font-medium mt-0.5">Total Recipients</p>
                </div>
                <div className="bg-[#F8FAFC] rounded-xl p-3.5 text-center">
                  <p className="text-lg font-bold text-[#059669]">
                    {broadcast.readCount.toLocaleString()}
                  </p>
                  <p className="text-[11px] text-[#64748B] font-medium mt-0.5">Read</p>
                </div>
                <div className="bg-[#F8FAFC] rounded-xl p-3.5 text-center">
                  <p className="text-lg font-bold text-[#EA580C]">{openRate}%</p>
                  <p className="text-[11px] text-[#64748B] font-medium mt-0.5">Open Rate</p>
                </div>
                <div className="bg-[#F8FAFC] rounded-xl p-3.5 text-center">
                  <p className="text-lg font-bold text-[#2563EB]">{clickRate}%</p>
                  <p className="text-[11px] text-[#64748B] font-medium mt-0.5">Click Rate</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column — 40% */}
        <div className="lg:col-span-2 space-y-5 sm:space-y-6">
          {/* Config card */}
          <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 overflow-hidden">
            <div className="px-5 py-3 border-b border-[#E8ECF1]/60">
              <h2 className="text-base font-bold text-[#0F172A]">Configuration</h2>
            </div>
            <div className="p-5 sm:p-6 space-y-4">
              <div>
                <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-1">
                  Recipients
                </p>
                <p className="text-sm font-medium text-[#0F172A]">{broadcast.recipients}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-1">
                  Sent By
                </p>
                <p className="text-sm font-medium text-[#0F172A]">{broadcast.sentBy}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-1">
                  Date Sent
                </p>
                <p className="text-sm font-medium text-[#0F172A]">{formatDate(broadcast.sentAt)}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-1">
                  Type
                </p>
                <StatusBadge status={broadcast.type} />
              </div>
            </div>
          </div>

          {/* Audience breakdown card */}
          <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 overflow-hidden">
            <div className="px-5 py-3 border-b border-[#E8ECF1]/60">
              <h2 className="text-base font-bold text-[#0F172A]">Audience Breakdown</h2>
            </div>
            <div className="p-5 sm:p-6 space-y-3">
              {/* Delivered */}
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-lg bg-[#ECFDF5] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[16px] text-[#059669]">
                      check_circle
                    </span>
                  </div>
                  <span className="text-sm text-[#334155] font-medium">Delivered</span>
                </div>
                <span className="text-sm font-bold text-[#0F172A]">
                  {delivered.toLocaleString()}
                </span>
              </div>

              {/* Bounced */}
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-lg bg-[#FEF2F2] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[16px] text-[#DC2626]">
                      error
                    </span>
                  </div>
                  <span className="text-sm text-[#334155] font-medium">Bounced</span>
                </div>
                <span className="text-sm font-bold text-[#DC2626]">
                  {bounced.toLocaleString()}
                </span>
              </div>

              {/* Pending */}
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-lg bg-[#FFF7ED] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[16px] text-[#EA580C]">
                      schedule
                    </span>
                  </div>
                  <span className="text-sm text-[#334155] font-medium">Pending</span>
                </div>
                <span className="text-sm font-bold text-[#0F172A]">0</span>
              </div>

              {/* Divider */}
              <div className="border-t border-[#E8ECF1]/60 pt-3 mt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[#0F172A]">Total Audience</span>
                  <span className="text-sm font-bold text-[#0F172A]">
                    {broadcast.totalCount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
