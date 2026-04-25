import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import { getSystemNotifications, markSystemNotificationRead, markAllSystemNotificationsRead } from "../../lib/api";
import { supabase } from "../../lib/supabase";
import { formatDate } from "../../data/adminMockData";

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

// Map notification type → category bucket + visual
const TYPE_META: Record<string, { category: string; icon: string; color: string; bg: string }> = {
  order_new: { category: "orders", icon: "receipt_long", color: "#EA580C", bg: "#FFF7ED" },
  order_overdue: { category: "orders", icon: "schedule", color: "#DC2626", bg: "#FEF2F2" },
  order_cancelled: { category: "orders", icon: "cancel", color: "#DC2626", bg: "#FEF2F2" },
  fulfillment_assigned: { category: "fulfillment", icon: "assignment_ind", color: "#2563EB", bg: "#EFF6FF" },
  fulfillment_sla_risk: { category: "fulfillment", icon: "warning", color: "#EA580C", bg: "#FFF7ED" },
  fulfillment_overdue: { category: "fulfillment", icon: "error", color: "#DC2626", bg: "#FEF2F2" },
  request_new: { category: "requests", icon: "fiber_new", color: "#2563EB", bg: "#EFF6FF" },
  request_assigned: { category: "requests", icon: "assignment_ind", color: "#7C3AED", bg: "#F5F3FF" },
  request_overdue: { category: "requests", icon: "schedule", color: "#DC2626", bg: "#FEF2F2" },
  inventory_low_stock: { category: "inventory", icon: "inventory_2", color: "#EA580C", bg: "#FFF7ED" },
  inventory_out_of_stock: { category: "inventory", icon: "remove_shopping_cart", color: "#DC2626", bg: "#FEF2F2" },
  wallet_large_transaction: { category: "wallet", icon: "payments", color: "#7C3AED", bg: "#F5F3FF" },
  wallet_adjustment: { category: "wallet", icon: "account_balance_wallet", color: "#2563EB", bg: "#EFF6FF" },
  membership_new: { category: "membership", icon: "card_membership", color: "#059669", bg: "#ECFDF5" },
  membership_expiring: { category: "membership", icon: "schedule", color: "#EA580C", bg: "#FFF7ED" },
  membership_cancelled: { category: "membership", icon: "cancel", color: "#DC2626", bg: "#FEF2F2" },
  team_role_changed: { category: "team", icon: "badge", color: "#7C3AED", bg: "#F5F3FF" },
  team_privilege_updated: { category: "team", icon: "shield", color: "#7C3AED", bg: "#F5F3FF" },
  team_member_added: { category: "team", icon: "person_add", color: "#059669", bg: "#ECFDF5" },
  settings_changed: { category: "system", icon: "settings", color: "#64748B", bg: "#F1F5F9" },
  portal_toggled: { category: "system", icon: "power_settings_new", color: "#64748B", bg: "#F1F5F9" },
  broadcast_sent: { category: "system", icon: "campaign", color: "#0D47A1", bg: "#EFF6FF" },
};

const CATEGORIES = ["all", "orders", "fulfillment", "requests", "inventory", "wallet", "membership", "team", "system"] as const;

const card = "bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60";

export default function NotificationsInboxPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("all");
  const [unreadOnly, setUnreadOnly] = useState(false);

  const load = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await getSystemNotifications(user.id);
    setLoading(false);
    if (error) {
      toastRef.current.error(`Failed to load: ${error.message}`);
      return;
    }
    setNotifications((data as SystemNotification[]) ?? []);
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  // Realtime subscription — new notifications show up without refresh
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`system_notifications:${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "system_notifications", filter: `recipient_id=eq.${user.id}` },
        (payload) => {
          setNotifications((prev) => [payload.new as SystemNotification, ...prev]);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const filtered = notifications.filter((n) => {
    if (unreadOnly && n.read) return false;
    if (category === "all") return true;
    const meta = TYPE_META[n.type];
    return meta?.category === category;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  async function toggleRead(n: SystemNotification) {
    // Flip optimistically
    setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: !x.read } : x)));
    if (!n.read) {
      const { error } = await markSystemNotificationRead(n.id);
      if (error) {
        setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: false } : x)));
        toast.error(error.message);
      }
    } else {
      const { error } = await supabase.from("system_notifications").update({ read: false }).eq("id", n.id);
      if (error) {
        setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
        toast.error(error.message);
      }
    }
  }

  async function handleMarkAllRead() {
    if (!user?.id) return;
    const { error } = await markAllSystemNotificationsRead(user.id);
    if (error) { toast.error(error.message); return; }
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast.success("All marked as read");
  }

  function handleClick(n: SystemNotification) {
    // Deep link to the related entity when we can
    if (n.entity_type === "service_request" && n.entity_id) {
      navigate(`/fulfillment`);
    } else if (n.entity_type === "order" && n.entity_id) {
      navigate(`/orders/${n.entity_id}`);
    } else if (n.entity_type === "product" && n.entity_id) {
      navigate(`/inventory`);
    } else if (n.entity_type === "broadcast" && n.entity_id) {
      navigate(`/broadcast/${n.entity_id}`);
    } else if (n.entity_type === "custom_order_request") {
      navigate(`/fulfillment`);
    } else if (n.entity_type === "team_member") {
      navigate(`/team`);
    }
    // Mark read
    if (!n.read) void toggleRead(n);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#0F172A]">Notifications</h1>
          <p className="text-sm text-[#64748B] mt-0.5">
            {notifications.length} total · {unreadCount} unread
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setUnreadOnly((v) => !v)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              unreadOnly ? "bg-primary text-white" : "border border-[#E2E8F0] text-[#334155] hover:bg-[#F1F5F9]"
            }`}
          >
            {unreadOnly ? "Showing unread" : "All notifications"}
          </button>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-1 px-3 py-1.5 border border-[#E2E8F0] rounded-lg text-xs font-semibold text-[#334155] hover:bg-[#F1F5F9] cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">done_all</span>
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => {
          const count = c === "all"
            ? notifications.length
            : notifications.filter((n) => TYPE_META[n.type]?.category === c).length;
          return (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-full text-[12px] font-semibold cursor-pointer transition-all ${
                category === c ? "bg-primary text-white" : "bg-white border border-[#E2E8F0] text-[#64748B] hover:bg-[#F1F5F9]"
              }`}
            >
              {c.charAt(0).toUpperCase() + c.slice(1)} {count > 0 && <span className="ml-1 opacity-80">({count})</span>}
            </button>
          );
        })}
      </div>

      {/* Notification list */}
      <div className={card}>
        {loading ? (
          <div className="py-16 flex flex-col items-center gap-3">
            <span className="size-5 border-2 border-[#E2E8F0] border-t-primary rounded-full animate-spin" />
            <p className="text-sm text-[#94A3B8]">Loading notifications…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <span className="material-symbols-outlined text-[48px] text-[#CBD5E1] block mb-2">
              {unreadOnly ? "mark_email_read" : "notifications_off"}
            </span>
            <p className="text-sm font-semibold text-[#64748B]">
              {unreadOnly ? "No unread notifications" : category !== "all" ? `No ${category} notifications` : "No notifications yet"}
            </p>
            <p className="text-[12px] text-[#94A3B8] mt-1">
              {unreadOnly ? "All caught up — everything has been read" : "Notifications will appear here as activity happens on the platform"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#F1F5F9]">
            {filtered.map((n) => {
              const meta = TYPE_META[n.type] ?? { category: "system", icon: "notifications", color: "#64748B", bg: "#F1F5F9" };
              return (
                <div
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors ${
                    n.read ? "hover:bg-[#F8FAFC]" : "bg-primary/[0.03] hover:bg-primary/[0.06]"
                  }`}
                >
                  {/* Unread dot + icon */}
                  <div className="flex flex-col items-center gap-1 pt-0.5 flex-shrink-0">
                    <div className={`size-2 rounded-full ${!n.read ? "bg-primary" : "bg-transparent"}`} />
                    <div className="size-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: meta.bg }}>
                      <span className="material-symbols-outlined text-[18px]" style={{ color: meta.color }}>{meta.icon}</span>
                    </div>
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${n.read ? "font-medium text-[#334155]" : "font-bold text-[#0F172A]"}`}>{n.title}</p>
                    <p className="text-[13px] text-[#64748B] mt-0.5 line-clamp-2">{n.message}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <p className="text-[11px] text-[#94A3B8]">{formatDate(n.created_at)}</p>
                      <button
                        onClick={(e) => { e.stopPropagation(); void toggleRead(n); }}
                        className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                      >
                        {n.read ? "Mark unread" : "Mark read"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
