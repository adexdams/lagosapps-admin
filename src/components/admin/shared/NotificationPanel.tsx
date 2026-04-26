import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import { supabase } from "../../../lib/supabase";
import { getSystemNotifications, markSystemNotificationRead, markAllSystemNotificationsRead } from "../../../lib/api";
import { formatDate } from "../../../data/adminMockData";

interface SystemNotification {
  id: string;
  recipient_id: string;
  type: string;
  title: string;
  message: string;
  entity_type: string | null;
  entity_id: string | null;
  read: boolean;
  created_at: string;
}

const TYPE_ICONS: Record<string, { icon: string; color: string; bg: string }> = {
  order_new: { icon: "receipt_long", color: "#EA580C", bg: "#FFF7ED" },
  order_overdue: { icon: "schedule", color: "#DC2626", bg: "#FEF2F2" },
  order_cancelled: { icon: "cancel", color: "#DC2626", bg: "#FEF2F2" },
  fulfillment_assigned: { icon: "assignment_ind", color: "#2563EB", bg: "#EFF6FF" },
  fulfillment_sla_risk: { icon: "warning", color: "#EA580C", bg: "#FFF7ED" },
  fulfillment_overdue: { icon: "error", color: "#DC2626", bg: "#FEF2F2" },
  request_new: { icon: "fiber_new", color: "#2563EB", bg: "#EFF6FF" },
  request_assigned: { icon: "assignment_ind", color: "#7C3AED", bg: "#F5F3FF" },
  request_overdue: { icon: "schedule", color: "#DC2626", bg: "#FEF2F2" },
  inventory_low_stock: { icon: "inventory_2", color: "#EA580C", bg: "#FFF7ED" },
  inventory_out_of_stock: { icon: "remove_shopping_cart", color: "#DC2626", bg: "#FEF2F2" },
  wallet_large_transaction: { icon: "payments", color: "#7C3AED", bg: "#F5F3FF" },
  wallet_adjustment: { icon: "account_balance_wallet", color: "#2563EB", bg: "#EFF6FF" },
  membership_new: { icon: "card_membership", color: "#059669", bg: "#ECFDF5" },
  membership_expiring: { icon: "schedule", color: "#EA580C", bg: "#FFF7ED" },
  membership_cancelled: { icon: "cancel", color: "#DC2626", bg: "#FEF2F2" },
  team_role_changed: { icon: "badge", color: "#7C3AED", bg: "#F5F3FF" },
  team_privilege_updated: { icon: "shield", color: "#7C3AED", bg: "#F5F3FF" },
  team_member_added: { icon: "person_add", color: "#059669", bg: "#ECFDF5" },
  settings_changed: { icon: "settings", color: "#64748B", bg: "#F1F5F9" },
  portal_toggled: { icon: "power_settings_new", color: "#64748B", bg: "#F1F5F9" },
  broadcast_sent: { icon: "campaign", color: "#0D47A1", bg: "#EFF6FF" },
};

const DEFAULT_META = { icon: "notifications", color: "#64748B", bg: "#F1F5F9" };

export default function NotificationPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalUnread, setTotalUnread] = useState(0);

  // unreadCount is used for the panel header text (from loaded slice)
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Fetch total unread count separately — not limited by the display slice
  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("system_notifications")
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", user.id)
      .eq("read", false)
      .then(({ count }) => setTotalUnread(count ?? 0));
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    getSystemNotifications(user.id).then(({ data }) => {
      if (cancelled) return;
      setNotifications(((data as SystemNotification[]) ?? []).slice(0, 15));
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [user?.id]);

  // Realtime: new notifications for this admin push into the panel
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`topbar_notifications:${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "system_notifications", filter: `recipient_id=eq.${user.id}` },
        (payload) => {
          setNotifications((prev) => [payload.new as SystemNotification, ...prev].slice(0, 15));
          setTotalUnread((c) => c + 1);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  function dispatchBadgeDelta(delta: number) {
    window.dispatchEvent(new CustomEvent("notif:badge-delta", { detail: delta }));
  }

  async function toggleRead(n: SystemNotification, e?: React.MouseEvent) {
    e?.stopPropagation();
    if (!n.read) {
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      setTotalUnread((c) => Math.max(0, c - 1));
      dispatchBadgeDelta(-1);
      const { error } = await markSystemNotificationRead(n.id);
      if (error) {
        setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: false } : x)));
        setTotalUnread((c) => c + 1);
        dispatchBadgeDelta(+1);
      }
    } else {
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: false } : x)));
      setTotalUnread((c) => c + 1);
      dispatchBadgeDelta(+1);
      await supabase.from("system_notifications").update({ read: false }).eq("id", n.id);
    }
  }

  async function handleMarkAllRead() {
    if (!user?.id) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setTotalUnread(0);
    window.dispatchEvent(new CustomEvent("notif:badge-reset"));
    await markAllSystemNotificationsRead(user.id);
  }

  function handleClick(n: SystemNotification) {
    if (!n.read) void toggleRead(n);
    setOpen(false);
    if (n.entity_type === "service_request") navigate("/fulfillment");
    else if (n.entity_type === "order" && n.entity_id) navigate(`/orders/${n.entity_id}`);
    else if (n.entity_type === "product") navigate("/inventory");
    else if (n.entity_type === "broadcast" && n.entity_id) navigate(`/broadcast/${n.entity_id}`);
    else if (n.entity_type === "custom_order_request") navigate("/fulfillment");
    else if (n.entity_type === "team_member") navigate("/team");
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative size-10 flex items-center justify-center rounded-xl hover:bg-[#F1F5F9] transition-colors cursor-pointer"
      >
        <span className="material-symbols-outlined text-[22px] text-[#334155]">notifications</span>
        {totalUnread > 0 && (
          <span className="absolute top-1 right-1 size-4 bg-[#DC2626] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {totalUnread > 99 ? "99+" : totalUnread}
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
                  <button onClick={handleMarkAllRead} className="text-[11px] font-semibold text-[#64748B] hover:text-[#0F172A] cursor-pointer">
                    Mark all read
                  </button>
                )}
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="px-4 py-8 text-center text-sm text-[#94A3B8]">Loading…</div>
              ) : notifications.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <span className="material-symbols-outlined text-[32px] text-[#CBD5E1] block mb-1">notifications_off</span>
                  <p className="text-sm text-[#94A3B8]">No notifications</p>
                </div>
              ) : (
                notifications.map((n) => {
                  const meta = TYPE_ICONS[n.type] ?? DEFAULT_META;
                  return (
                    <div
                      key={n.id}
                      onClick={() => handleClick(n)}
                      className={`px-4 py-3 border-b border-[#F1F5F9] last:border-0 transition-colors cursor-pointer ${
                        !n.read ? "bg-primary/[0.04] hover:bg-primary/[0.08]" : "hover:bg-[#F8FAFC]"
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className="flex flex-col items-center gap-1 pt-0.5 flex-shrink-0">
                          <div className={`size-2 rounded-full ${!n.read ? "bg-primary" : "bg-transparent"}`} />
                          <div className="size-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: meta.bg }}>
                            <span className="material-symbols-outlined text-[16px]" style={{ color: meta.color }}>{meta.icon}</span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-[13px] truncate ${!n.read ? "font-bold text-[#0F172A]" : "font-medium text-[#334155]"}`}>{n.title}</p>
                          <p className="text-[12px] text-[#64748B] truncate mt-0.5">{n.message}</p>
                          <div className="flex items-center justify-between mt-1.5">
                            <p className="text-[11px] text-[#94A3B8]">{formatDate(n.created_at)}</p>
                            <button
                              onClick={(e) => void toggleRead(n, e)}
                              className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                            >
                              {!n.read ? "Mark read" : "Mark unread"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="px-4 py-3 border-t border-[#E8ECF1]/60 flex items-center justify-between">
              <button
                onClick={() => { setOpen(false); navigate("/notifications"); }}
                className="text-sm font-semibold text-primary hover:underline cursor-pointer"
              >
                View all notifications
              </button>
              <button
                onClick={() => { setOpen(false); navigate("/settings"); }}
                className="text-xs font-semibold text-[#64748B] hover:text-[#334155] cursor-pointer"
              >
                Alert settings
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
