import { useState } from "react";
import { Routes, Route, NavLink, useLocation } from "react-router-dom";
import AdminOverview from "./AdminOverview";

const navItems = [
  { path: "/", label: "Overview", icon: "dashboard" },
  { path: "/users", label: "Users", icon: "group" },
  { path: "/orders", label: "Orders", icon: "receipt_long" },
  { path: "/inventory", label: "Inventory", icon: "inventory_2" },
  { path: "/membership", label: "Membership", icon: "card_membership" },
  { path: "/wallet", label: "Wallet", icon: "account_balance_wallet" },
  { path: "/referrals", label: "Referrals", icon: "group_add" },
  { path: "/notifications", label: "Notifications", icon: "campaign" },
  { path: "/analytics", label: "Analytics", icon: "analytics" },
  { path: "/audit", label: "Audit Log", icon: "history" },
  { path: "/settings", label: "Settings", icon: "settings" },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const currentPage = navItems.find((item) => item.path === location.pathname)?.label || "Overview";

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-[#0A2540] text-white flex-shrink-0 fixed inset-y-0 left-0 z-40">
        {/* Logo */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center gap-2">
          <div className="size-8 rounded-lg bg-[#00C3F7]/20 flex items-center justify-center">
            <span className="text-[#00C3F7] font-extrabold text-sm">L</span>
          </div>
          <span className="font-bold text-base">LagosApps</span>
          <span className="text-[10px] font-bold bg-primary/30 text-primary-fixed px-2 py-0.5 rounded-full ml-1">Admin</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${
                  isActive
                    ? "bg-white/10 text-white font-bold border-l-3 border-[#00C3F7]"
                    : "text-white/60 hover:bg-white/5 hover:text-white/90 border-l-3 border-transparent"
                }`
              }
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/10">
          <a href="http://localhost:5173" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-white/50 hover:text-white/80 transition-colors">
            <span className="material-symbols-outlined text-[18px]">open_in_new</span>
            Back to Site
          </a>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 bg-[#0A2540] text-white flex flex-col h-full shadow-2xl" style={{ animation: "slide-in-left 200ms ease-out" }}>
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base">LagosApps</span>
                <span className="text-[10px] font-bold bg-primary/30 text-primary-fixed px-2 py-0.5 rounded-full">Admin</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="text-white/60 cursor-pointer">
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>
            <nav className="flex-1 py-3 overflow-y-auto">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/"}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-5 py-3 text-sm transition-colors ${
                      isActive ? "bg-white/10 text-white font-bold" : "text-white/60 hover:bg-white/5"
                    }`
                  }
                >
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 md:ml-60 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-outline-variant/15 px-4 md:px-6 py-3 flex items-center gap-4">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden cursor-pointer">
            <span className="material-symbols-outlined text-[24px] text-on-surface">menu</span>
          </button>

          <h1 className="text-base md:text-lg font-bold text-on-surface">{currentPage}</h1>

          <div className="flex-1" />

          {/* Search */}
          <div className="hidden sm:flex items-center gap-2 bg-surface-container rounded-lg px-3 py-2 max-w-xs flex-1">
            <span className="material-symbols-outlined text-outline text-[18px]">search</span>
            <input type="text" placeholder="Search..." className="bg-transparent text-sm outline-none flex-1 text-on-surface" />
          </div>

          <div className="flex-1 hidden sm:block" />

          {/* Admin avatar */}
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-xs">
              AD
            </div>
            <span className="hidden sm:inline text-sm font-medium text-on-surface">Admin</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <Routes>
            <Route index element={<AdminOverview />} />
            <Route path="users" element={<Placeholder page="Users" />} />
            <Route path="users/:id" element={<Placeholder page="User Detail" />} />
            <Route path="orders" element={<Placeholder page="Orders" />} />
            <Route path="orders/:id" element={<Placeholder page="Order Detail" />} />
            <Route path="inventory" element={<Placeholder page="Inventory" />} />
            <Route path="membership" element={<Placeholder page="Membership" />} />
            <Route path="wallet" element={<Placeholder page="Wallet" />} />
            <Route path="referrals" element={<Placeholder page="Referrals" />} />
            <Route path="notifications" element={<Placeholder page="Notifications" />} />
            <Route path="analytics" element={<Placeholder page="Analytics" />} />
            <Route path="audit" element={<Placeholder page="Audit Log" />} />
            <Route path="settings" element={<Placeholder page="Settings" />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function Placeholder({ page }: { page: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-4">
      <div className="size-20 rounded-full bg-surface-container flex items-center justify-center">
        <span className="material-symbols-outlined text-outline/30 text-[40px]">construction</span>
      </div>
      <h2 className="text-xl font-bold text-on-surface">{page}</h2>
      <p className="text-sm text-on-surface-variant">This page is under construction.</p>
    </div>
  );
}
