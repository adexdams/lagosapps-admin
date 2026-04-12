import { useState } from "react";
import { mockNotifications } from "../../../data/adminMockData";

export default function NotificationPanel() {
  const [open, setOpen] = useState(false);
  const unreadCount = mockNotifications.filter((n) => !n.read).length;

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
          <div className="absolute right-0 top-12 z-50 w-[calc(100vw-2rem)] sm:w-80 max-w-80 bg-white rounded-2xl shadow-lg border border-[#E8ECF1]/60 overflow-hidden">
            <div className="px-4 py-3 border-b border-[#E8ECF1]/60 flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#0F172A]">Notifications</h3>
              <span className="text-[11px] font-semibold text-primary">{unreadCount} unread</span>
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-[#F1F5F9]">
              {mockNotifications.slice(0, 8).map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 hover:bg-[#F8FAFC] transition-colors cursor-pointer ${
                    !n.read ? "bg-primary/[0.02]" : ""
                  }`}
                >
                  <p className="text-[13px] font-semibold text-[#0F172A] truncate">{n.title}</p>
                  <p className="text-[12px] text-[#64748B] truncate mt-0.5">{n.message}</p>
                  <p className="text-[11px] text-[#94A3B8] mt-1">{n.createdAt}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
