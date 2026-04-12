import { useState, useEffect, useRef } from "react";

interface PanelNotification {
  id: string;
  type: "order" | "wallet" | "membership" | "system";
  title: string;
  message: string;
  timeAgo: string;
  read: boolean;
}

const TYPE_CONFIG: Record<PanelNotification["type"], { icon: string; color: string; bg: string }> = {
  order: { icon: "receipt_long", color: "#EA580C", bg: "#FFF7ED" },
  wallet: { icon: "account_balance_wallet", color: "#2563EB", bg: "#EFF6FF" },
  membership: { icon: "card_membership", color: "#7C3AED", bg: "#F5F3FF" },
  system: { icon: "settings", color: "#64748B", bg: "#F1F5F9" },
};

const initialNotifications: PanelNotification[] = [
  {
    id: "pn-1",
    type: "order",
    title: "New order received",
    message: "Chidi Okafor placed a solar panel order worth ₦2,450,000 on the Solar portal.",
    timeAgo: "2 min ago",
    read: false,
  },
  {
    id: "pn-2",
    type: "wallet",
    title: "Large wallet top-up",
    message: "Fatima Bello topped up ₦500,000 to her wallet. Transaction verified.",
    timeAgo: "18 min ago",
    read: false,
  },
  {
    id: "pn-3",
    type: "membership",
    title: "Gold membership upgraded",
    message: "Amara Taiwo upgraded from Silver to Gold membership tier.",
    timeAgo: "1 hr ago",
    read: false,
  },
  {
    id: "pn-4",
    type: "system",
    title: "Scheduled maintenance tonight",
    message: "System maintenance is scheduled for 2am-4am WAT. Some services will be unavailable.",
    timeAgo: "2 hrs ago",
    read: false,
  },
  {
    id: "pn-5",
    type: "order",
    title: "Order cancellation request",
    message: "Kunle Adeyemi requested cancellation for ORD-042. Awaiting admin approval.",
    timeAgo: "3 hrs ago",
    read: true,
  },
  {
    id: "pn-6",
    type: "wallet",
    title: "Refund processed",
    message: "Refund of ₦15,400 has been credited to Emeka Emenike for ORD-028.",
    timeAgo: "5 hrs ago",
    read: true,
  },
  {
    id: "pn-7",
    type: "membership",
    title: "Membership expiring soon",
    message: "12 Silver members have memberships expiring within the next 7 days.",
    timeAgo: "8 hrs ago",
    read: true,
  },
  {
    id: "pn-8",
    type: "system",
    title: "Daily report ready",
    message: "Your daily analytics report for April 10, 2026 is now available to review.",
    timeAgo: "12 hrs ago",
    read: true,
  },
];

export default function NotificationPanel() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<PanelNotification[]>(initialNotifications);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  /* close on outside click */
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function markRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative cursor-pointer p-1.5 rounded-lg hover:bg-[#F1F5F9] transition-colors"
      >
        <span className="material-symbols-outlined text-[20px] text-[#64748B]">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 size-2.5 bg-[#DC2626] rounded-full ring-2 ring-white" />
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-[380px] max-h-[480px] bg-white rounded-2xl shadow-xl border border-[#E8ECF1] flex flex-col z-50 overflow-hidden"
          style={{ animation: "fade-in-down 150ms ease-out" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8ECF1]">
            <div className="flex items-center gap-2">
              <h3 className="text-[15px] font-bold text-[#0F172A]">Notifications</h3>
              {unreadCount > 0 && (
                <span className="bg-[#DC2626] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md min-w-[18px] text-center">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[12px] font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="flex-1 overflow-y-auto">
            {notifications.map((n) => {
              const config = TYPE_CONFIG[n.type];
              return (
                <button
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={`w-full text-left flex items-start gap-3 px-5 py-3.5 border-b border-[#F1F5F9] last:border-b-0 transition-colors cursor-pointer hover:bg-[#F8FAFC] ${
                    !n.read ? "bg-[#F8FAFC]" : "bg-white"
                  }`}
                >
                  {/* Unread dot */}
                  <div className="flex-shrink-0 w-2 pt-2.5">
                    {!n.read && (
                      <span className="block size-2 rounded-full bg-[#2563EB]" />
                    )}
                  </div>

                  {/* Type icon */}
                  <div
                    className="size-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: config.bg }}
                  >
                    <span
                      className="material-symbols-outlined text-[18px]"
                      style={{ color: config.color }}
                    >
                      {config.icon}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-[13px] leading-tight ${!n.read ? "font-bold text-[#0F172A]" : "font-semibold text-[#334155]"}`}>
                      {n.title}
                    </p>
                    <p className="text-[12px] text-[#64748B] mt-0.5 truncate leading-snug">
                      {n.message}
                    </p>
                    <p className="text-[11px] text-[#94A3B8] mt-1 font-medium">{n.timeAgo}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="border-t border-[#E8ECF1] px-5 py-3">
            <button
              onClick={() => {
                setOpen(false);
                /* could navigate to /broadcast here */
              }}
              className="w-full text-center text-[13px] font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer"
            >
              View all notifications
            </button>
          </div>
        </div>
      )}

      {/* Inline animation keyframe */}
      <style>{`
        @keyframes fade-in-down {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
