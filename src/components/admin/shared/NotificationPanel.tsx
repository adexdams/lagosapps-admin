import { useState } from "react";
import { mockNotifications, formatDate } from "../../../data/adminMockData";

const TYPE_ICONS: Record<string, { icon: string; color: string; bg: string }> = {
  order: { icon: "receipt_long", color: "#EA580C", bg: "#FFF7ED" },
  wallet: { icon: "account_balance_wallet", color: "#2563EB", bg: "#EFF6FF" },
  membership: { icon: "card_membership", color: "#7C3AED", bg: "#F5F3FF" },
  system: { icon: "settings", color: "#64748B", bg: "#F1F5F9" },
};

export default function NotificationPanel() {
  const [open, setOpen] = useState(false);
  const [readState, setReadState] = useState<Record<string, boolean>>(
    Object.fromEntries(mockNotifications.map((n) => [n.id, n.read]))
  );

  const unreadCount = Object.values(readState).filter((r) => !r).length;

  const toggleRead = (id: string) => {
    setReadState((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const markAllRead = () => {
    setReadState((prev) => Object.fromEntries(Object.keys(prev).map((k) => [k, true])));
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative size-10 flex items-center justify-center rounded-xl hover:bg-[#F1F5F9] transition-colors cursor-pointer"
      >
        <span className="material-symbols-outlined text-[22px] text-[#334155]">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 size-4 bg-[#DC2626] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="fixed left-3 right-3 top-16 z-50 sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:w-96 bg-white rounded-2xl shadow-xl border border-[#E8ECF1]/60 overflow-hidden">
            <div className="px-4 py-3 border-b border-[#E8ECF1]/60 flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#0F172A]">Notifications</h3>
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-semibold text-primary">{unreadCount} unread</span>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-[11px] font-semibold text-[#64748B] hover:text-[#0F172A] cursor-pointer">
                    Mark all read
                  </button>
                )}
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {mockNotifications.slice(0, 10).map((n) => {
                const isUnread = !readState[n.id];
                const typeConfig = TYPE_ICONS[n.type] ?? TYPE_ICONS.system;
                return (
                  <div
                    key={n.id}
                    className={`px-4 py-3 border-b border-[#F1F5F9] last:border-0 transition-colors ${
                      isUnread ? "bg-primary/[0.04]" : "hover:bg-[#F8FAFC]"
                    }`}
                  >
                    <div className="flex gap-3">
                      {/* Unread dot + type icon */}
                      <div className="flex flex-col items-center gap-1 pt-0.5 flex-shrink-0">
                        <div className={`size-2 rounded-full ${isUnread ? "bg-primary" : "bg-transparent"}`} />
                        <div className="size-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: typeConfig.bg }}>
                          <span className="material-symbols-outlined text-[16px]" style={{ color: typeConfig.color }}>{typeConfig.icon}</span>
                        </div>
                      </div>
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-[13px] truncate ${isUnread ? "font-bold text-[#0F172A]" : "font-medium text-[#334155]"}`}>{n.title}</p>
                        <p className="text-[12px] text-[#64748B] truncate mt-0.5">{n.message}</p>
                        <div className="flex items-center justify-between mt-1.5">
                          <p className="text-[11px] text-[#94A3B8]">{formatDate(n.createdAt)}</p>
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleRead(n.id); }}
                            className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                          >
                            {isUnread ? "Mark read" : "Mark unread"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="px-4 py-3 border-t border-[#E8ECF1]/60">
              <a href="/broadcast" className="text-sm font-semibold text-primary hover:underline">View all broadcasts</a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
