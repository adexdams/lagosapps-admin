import { useState, useEffect } from "react";
import { Routes, Route, NavLink, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import { hasPrivilege, PAGE_PRIVILEGES } from "../../lib/privileges";

import AdminOverview from "./AdminOverview";
import UsersPage from "./UsersPage";
import UserDetail from "./UserDetail";
import OrdersPage from "./OrdersPage";
import OrderDetailAdmin from "./OrderDetailAdmin";
import InventoryPage from "./InventoryPage";
import MembershipAdmin from "./MembershipAdmin";
import WalletAdmin from "./WalletAdmin";
import ReferralsAdmin from "./ReferralsAdmin";
import NotificationsAdmin from "./NotificationsAdmin";
import BroadcastCompose from "./BroadcastCompose";
import BroadcastDetail from "./BroadcastDetail";
import AnalyticsPage from "./AnalyticsPage";
import AuditLog from "./AuditLog";
import SettingsPage from "./SettingsPage";
import FinancePage from "./FinancePage";
import TeamPage from "./TeamPage";
import CreateOrderAdmin from "./CreateOrderAdmin";
import CustomRequestDetail from "./CustomRequestDetail";
import MembershipTierConfig from "./MembershipTierConfig";
import LiveCartsPage from "./LiveCartsPage";
import NotificationsInboxPage from "./NotificationsInboxPage";
import NotificationPanel from "./shared/NotificationPanel";

// Nav items — `privilege` matches PAGE_PRIVILEGES keys in privileges.ts
const navItems = [
  { path: "/",             label: "Overview",     icon: "space_dashboard",        privilege: "overview" },
  { path: "/users",        label: "Users",        icon: "group",                  privilege: "users" },
  { path: "/orders",       label: "Orders",       icon: "receipt_long",           privilege: "orders" },
  { path: "/inventory",    label: "Inventory",    icon: "inventory_2",            privilege: "inventory" },
  { path: "/membership",   label: "Membership",   icon: "card_membership",        privilege: "membership" },
  { path: "/wallet",       label: "Wallet",       icon: "account_balance_wallet", privilege: "wallet" },
  { path: "/referrals",    label: "Referrals",    icon: "group_add",              privilege: "referrals" },
  { path: "/broadcast",    label: "Broadcast",    icon: "campaign",               privilege: "broadcast" },
  { path: "/carts",        label: "Carts",        icon: "shopping_cart",          privilege: "carts" },
  { path: "/finance",      label: "Finance",      icon: "payments",               privilege: "finance" },
  { path: "/analytics",    label: "Analytics",    icon: "analytics",              privilege: "analytics" },
  { path: "/team",         label: "Team",         icon: "people",                 privilege: "team" },
  { path: "/audit",        label: "Audit Log",    icon: "history",                privilege: "audit" },
  { path: "/notifications",label: "Notifications",icon: "notifications",          privilege: "notifications" },
  { path: "/settings",     label: "Settings",     icon: "settings",               privilege: "settings" },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifUnread, setNotifUnread] = useState(0);
  const location = useLocation();
  const { user, profile, signOut } = useAuth();

  // Privilege helper for the current logged-in admin
  const can = (key: string) =>
    hasPrivilege(key, profile?.role ?? "", profile?.privileges ?? {});

  const visibleNav = navItems.filter((item) => can(item.privilege));

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("system_notifications")
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", user.id)
      .eq("read", false)
      .then(({ count }) => setNotifUnread(count ?? 0));
    const ch = supabase
      .channel(`sidebar_notif_count:${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "system_notifications", filter: `recipient_id=eq.${user.id}` },
        () => setNotifUnread((c) => c + 1)
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id]);

  useEffect(() => {
    const onDelta = (e: Event) => {
      const delta = (e as CustomEvent<number>).detail;
      setNotifUnread((c) => Math.max(0, c + delta));
    };
    const onReset = () => setNotifUnread(0);
    window.addEventListener("notif:badge-delta", onDelta);
    window.addEventListener("notif:badge-reset", onReset);
    return () => {
      window.removeEventListener("notif:badge-delta", onDelta);
      window.removeEventListener("notif:badge-reset", onReset);
    };
  }, []);

  const initials = profile?.name
    ? profile.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : (profile?.email ?? user?.email ?? "AD").slice(0, 2).toUpperCase();

  const currentPage = navItems.find((item) => item.path === location.pathname)?.label || "Overview";

  // Gate component — redirects to / when the current admin lacks the privilege
  const Gate = ({ priv, children }: { priv: string; children: React.ReactNode }) =>
    can(priv) ? <>{children}</> : <Navigate to="/" replace />;

  const NavList = ({ mobile }: { mobile?: boolean }) => (
    <>
      {visibleNav.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.path === "/"}
          onClick={mobile ? () => setSidebarOpen(false) : undefined}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 ${mobile ? "py-3" : "py-2.5"} rounded-xl ${mobile ? "text-sm" : "text-[13px]"} font-medium transition-all mb-0.5 ${
              isActive
                ? "bg-primary/8 text-primary font-semibold"
                : "text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#334155]"
            }`
          }
        >
          <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
          <span className="flex-1">{item.label}</span>
          {item.path === "/notifications" && notifUnread > 0 && (
            <span className="size-5 bg-[#DC2626] text-white text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0">
              {notifUnread > 99 ? "99+" : notifUnread}
            </span>
          )}
        </NavLink>
      ))}
    </>
  );

  return (
    <div className="min-h-screen bg-[#F5F6FA] flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-[260px] bg-white border-r border-[#E8ECF1] flex-shrink-0 fixed inset-y-0 left-0 z-40">
        <div className="px-6 py-5 flex items-center gap-2.5">
          <img src="/lagosapp-logo.png" alt="LagosApps" className="h-8 w-auto" />
          <span className="text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-md tracking-wide uppercase">Admin</span>
        </div>
        <nav className="flex-1 px-3 py-2 overflow-y-auto">
          <NavList />
        </nav>
        <div className="px-6 py-4 border-t border-[#E8ECF1] space-y-2">
          <a href="https://lagosapps.com/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[13px] text-[#94A3B8] hover:text-[#64748B] transition-colors">
            <span className="material-symbols-outlined text-[18px]">open_in_new</span>
            Back to Site
          </a>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-[280px] bg-white flex flex-col h-full shadow-2xl" style={{ animation: "slide-in-left 200ms ease-out" }}>
            <div className="px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src="/lagosapp-logo.png" alt="LagosApps" className="h-7 w-auto" />
                <span className="text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-md uppercase">Admin</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="text-[#94A3B8] cursor-pointer hover:text-[#64748B]">
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>
            <nav className="flex-1 px-3 py-2 overflow-y-auto">
              <NavList mobile />
            </nav>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 md:ml-[260px] flex flex-col min-h-screen min-w-0">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-[#E8ECF1] px-4 md:px-8 h-16 flex items-center gap-4">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden cursor-pointer">
            <span className="material-symbols-outlined text-[24px] text-[#334155]">menu</span>
          </button>
          <h1 className="text-base md:text-lg font-semibold text-[#0F172A] tracking-tight">{currentPage}</h1>
          <div className="flex-1" />
          <div className="hidden sm:flex items-center gap-2 bg-[#F1F5F9] rounded-xl px-4 py-2.5 max-w-xs flex-1">
            <span className="material-symbols-outlined text-[#94A3B8] text-[18px]">search</span>
            <input type="text" placeholder="Search anything..." className="bg-transparent text-sm outline-none flex-1 text-[#0F172A] placeholder:text-[#94A3B8]" />
          </div>
          <div className="flex-1 hidden sm:block" />
          <NotificationPanel />
          <div className="flex items-center gap-3 group relative">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.name ?? "Admin"} className="size-9 rounded-full object-cover shadow-sm" />
            ) : (
              <div className="size-9 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                {initials}
              </div>
            )}
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-[#0F172A] leading-tight">{profile?.name || "Admin"}</p>
              <p className="text-[11px] text-[#94A3B8] capitalize">{profile?.teamRole?.replace("_", " ") || "Admin"}</p>
            </div>
            <button onClick={signOut} className="hidden sm:flex size-8 items-center justify-center rounded-lg hover:bg-[#FEF2F2] text-[#94A3B8] hover:text-[#DC2626] cursor-pointer transition-colors" title="Sign out">
              <span className="material-symbols-outlined text-[18px]">logout</span>
            </button>
          </div>
        </header>

        <main className="flex-1 px-3 sm:px-4 md:px-8 lg:px-10 py-4 sm:py-6 md:py-8 pb-12 md:pb-10 overflow-x-clip">
          <Routes>
            <Route index element={<AdminOverview />} />
            <Route path="users"            element={<Gate priv="users">        <UsersPage /></Gate>} />
            <Route path="users/:id"        element={<Gate priv="users">        <UserDetail /></Gate>} />
            <Route path="orders"           element={<Gate priv="orders">       <OrdersPage /></Gate>} />
            <Route path="orders/create"          element={<Gate priv="orders"><CreateOrderAdmin /></Gate>} />
            <Route path="orders/requests/:id"   element={<Gate priv="orders"><CustomRequestDetail /></Gate>} />
            <Route path="orders/:id"            element={<Gate priv="orders"><OrderDetailAdmin /></Gate>} />
            <Route path="carts"            element={<Gate priv="carts">        <LiveCartsPage /></Gate>} />
            <Route path="inventory"        element={<Gate priv="inventory">    <InventoryPage /></Gate>} />
            <Route path="membership"       element={<Gate priv="membership">   <MembershipAdmin /></Gate>} />
            <Route path="membership/tiers" element={<Gate priv="membership">   <MembershipTierConfig /></Gate>} />
            <Route path="wallet"           element={<Gate priv="wallet">       <WalletAdmin /></Gate>} />
            <Route path="referrals"        element={<Gate priv="referrals">    <ReferralsAdmin /></Gate>} />
            <Route path="broadcast"        element={<Gate priv="broadcast">    <NotificationsAdmin /></Gate>} />
            <Route path="broadcast/compose" element={<Gate priv="broadcast">  <BroadcastCompose /></Gate>} />
            <Route path="broadcast/:id"    element={<Gate priv="broadcast">    <BroadcastDetail /></Gate>} />
            <Route path="finance"          element={<Gate priv="finance">      <FinancePage /></Gate>} />
            <Route path="analytics"        element={<Gate priv="analytics">    <AnalyticsPage /></Gate>} />
            <Route path="team"             element={<Gate priv="team">         <TeamPage /></Gate>} />
            <Route path="audit"            element={<Gate priv="audit">        <AuditLog /></Gate>} />
            <Route path="notifications"    element={<Gate priv="notifications"><NotificationsInboxPage /></Gate>} />
            <Route path="settings"         element={<Gate priv="settings">     <SettingsPage /></Gate>} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

// make PAGE_PRIVILEGES available to TeamPage without a separate import in this file
export { PAGE_PRIVILEGES };
