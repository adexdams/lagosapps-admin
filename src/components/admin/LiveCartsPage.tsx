import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import StatCard from "./shared/StatCard";
import StatusBadge from "./shared/StatusBadge";
import {
  mockCarts,
  formatNaira,
  PORTAL_COLORS,
  type MockCart,
  type Portal,
} from "../../data/adminMockData";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr.replace(" ", "T")).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

function isAbandoned(dateStr: string): boolean {
  const diff = Date.now() - new Date(dateStr.replace(" ", "T")).getTime();
  return diff > 24 * 3600000;
}

const card = "bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60";

export default function LiveCartsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"active" | "abandoned">("active");
  const [expandedCart, setExpandedCart] = useState<string | null>(null);

  const activeCarts = useMemo(() => mockCarts.filter((c) => !isAbandoned(c.lastUpdated)), []);
  const abandonedCarts = useMemo(() => mockCarts.filter((c) => isAbandoned(c.lastUpdated)), []);
  const displayCarts = tab === "active" ? activeCarts : abandonedCarts;

  const totalValue = mockCarts.reduce((sum, c) => sum + c.items.reduce((s, it) => s + it.price * it.quantity, 0), 0);
  const avgValue = mockCarts.length > 0 ? Math.round(totalValue / mockCarts.length) : 0;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-[#0F172A]">Live Carts</h1>
        <p className="text-sm text-[#64748B] mt-0.5">Monitor active and abandoned shopping carts</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <StatCard label="Active Carts" value={String(activeCarts.length)} icon="shopping_cart" color="#1B5E20" />
        <StatCard label="Abandoned (24h+)" value={String(abandonedCarts.length)} icon="remove_shopping_cart" color="#B71C1C" trend={{ value: "Idle over 24 hours", positive: false }} />
        <StatCard label="Avg Cart Value" value={formatNaira(avgValue)} icon="payments" color="#0D47A1" />
        <StatCard label="Total Carts" value={String(mockCarts.length)} icon="shopping_bag" color="#4A148C" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl p-1 shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 w-fit">
        {(["active", "abandoned"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              tab === t ? "bg-primary text-white" : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]"
            }`}
          >
            {t === "active" ? `Active (${activeCarts.length})` : `Abandoned (${abandonedCarts.length})`}
          </button>
        ))}
      </div>

      {/* Cart list */}
      <div className={card}>
        {/* Table header */}
        <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-[#E8ECF1]/60 bg-[#F8FAFC] rounded-t-2xl">
          <div className="col-span-3 text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">Customer</div>
          <div className="col-span-1 text-[11px] font-semibold uppercase tracking-wider text-[#64748B] hidden sm:block">Items</div>
          <div className="col-span-2 text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">Value</div>
          <div className="col-span-2 text-[11px] font-semibold uppercase tracking-wider text-[#64748B] hidden md:block">Portals</div>
          <div className="col-span-2 text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">{tab === "abandoned" ? "Idle Since" : "Last Active"}</div>
          <div className="col-span-2 text-[11px] font-semibold uppercase tracking-wider text-[#64748B] text-right">Actions</div>
        </div>

        {displayCarts.length === 0 ? (
          <div className="py-12 text-center text-sm text-[#94A3B8]">No {tab} carts</div>
        ) : (
          displayCarts.map((c: MockCart) => {
            const cartTotal = c.items.reduce((s, it) => s + it.price * it.quantity, 0);
            const portalsInCart = [...new Set(c.items.map((it) => it.portal))];
            const isExpanded = expandedCart === c.userId;

            return (
              <div key={c.userId} className="border-b border-[#E8ECF1]/40 last:border-0">
                <div
                  className="grid grid-cols-12 gap-2 px-4 py-3.5 items-center hover:bg-[#F8FAFC]/60 transition-colors cursor-pointer"
                  onClick={() => setExpandedCart(isExpanded ? null : c.userId)}
                >
                  <div className="col-span-3 flex items-center gap-2.5 min-w-0">
                    <div className="size-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0">
                      {c.userName.split(" ").map((n: string) => n[0]).join("")}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#0F172A] truncate">{c.userName}</p>
                      <p className="text-[11px] text-[#94A3B8]"><StatusBadge status={c.userTier} /></p>
                    </div>
                  </div>
                  <div className="col-span-1 text-sm text-[#334155] hidden sm:block">{c.items.length}</div>
                  <div className="col-span-2 text-sm font-semibold text-[#0F172A]">{formatNaira(cartTotal)}</div>
                  <div className="col-span-2 hidden md:flex gap-1 flex-wrap">
                    {portalsInCart.map((p) => (
                      <span key={p} className="size-2.5 rounded-full inline-block" style={{ backgroundColor: PORTAL_COLORS[p as Portal] }} title={p} />
                    ))}
                  </div>
                  <div className="col-span-2 text-sm text-[#64748B]">{timeAgo(c.lastUpdated)}</div>
                  <div className="col-span-2 flex justify-end gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/users/${c.userId}`); }}
                      className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                    >
                      View User
                    </button>
                    {tab === "abandoned" && (
                      <button
                        onClick={(e) => { e.stopPropagation(); }}
                        className="text-xs font-semibold text-[#EA580C] hover:underline cursor-pointer"
                      >
                        Remind
                      </button>
                    )}
                    <span className="material-symbols-outlined text-[18px] text-[#94A3B8]">{isExpanded ? "expand_less" : "expand_more"}</span>
                  </div>
                </div>

                {/* Expanded cart items */}
                {isExpanded && (
                  <div className="px-4 pb-4">
                    <div className="bg-[#F8FAFC] rounded-xl p-4">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-[11px] uppercase tracking-wider text-[#64748B]">
                            <th className="text-left pb-2 font-semibold">Product</th>
                            <th className="text-left pb-2 font-semibold hidden sm:table-cell">Portal</th>
                            <th className="text-right pb-2 font-semibold">Price</th>
                            <th className="text-center pb-2 font-semibold">Qty</th>
                            <th className="text-right pb-2 font-semibold">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E8ECF1]/50">
                          {c.items.map((item) => (
                            <tr key={item.productId}>
                              <td className="py-2 text-[#0F172A] font-medium">{item.productName}</td>
                              <td className="py-2 hidden sm:table-cell">
                                <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold text-white" style={{ backgroundColor: PORTAL_COLORS[item.portal as Portal] }}>
                                  {(item.portal as string).slice(0, 3).toUpperCase()}
                                </span>
                              </td>
                              <td className="py-2 text-right text-[#64748B]">{formatNaira(item.price)}</td>
                              <td className="py-2 text-center text-[#334155]">{item.quantity}</td>
                              <td className="py-2 text-right font-semibold text-[#0F172A]">{formatNaira(item.price * item.quantity)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t border-[#E2E8F0]">
                            <td colSpan={4} className="pt-2 text-right font-semibold text-[#64748B]">Subtotal</td>
                            <td className="pt-2 text-right font-bold text-[#0F172A]">{formatNaira(cartTotal)}</td>
                          </tr>
                        </tfoot>
                      </table>
                      <p className="text-[11px] text-[#94A3B8] mt-3">Cart created {c.createdAt} · Last updated {c.lastUpdated}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
