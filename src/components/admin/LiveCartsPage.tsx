import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import StatCard from "./shared/StatCard";
import StatusBadge from "./shared/StatusBadge";
import { useToast } from "../../hooks/useToast";
import { supabase } from "../../lib/supabase";
import { sendBroadcastEmail } from "../../lib/email";
import { formatNaira, PORTAL_COLORS, type Portal } from "../../data/adminMockData";

interface CartItem {
  id: string;
  product_id: string | null;
  portal_id: Portal;
  name: string;
  description: string | null;
  image_url: string | null;
  price: number;
  quantity: number;
  member_covered: boolean;
}

interface DbCart {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  cart_items: CartItem[];
  profiles: {
    id: string;
    name: string | null;
    email: string;
    membership_tier: string | null;
    avatar_url: string | null;
  } | null;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

function isAbandoned(dateStr: string): boolean {
  return Date.now() - new Date(dateStr).getTime() > 24 * 3600000;
}

const card = "bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60";

export default function LiveCartsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [tab, setTab] = useState<"active" | "abandoned">("active");
  const [expandedCart, setExpandedCart] = useState<string | null>(null);
  const [carts, setCarts] = useState<DbCart[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);

  const toastRef = useRef(toast);
  toastRef.current = toast;

  const loadCarts = useCallback(async () => {
    setLoading(true);
    // Fetch carts with their items and the owner's profile in one go
    const { data, error } = await supabase
      .from("carts")
      .select("*, cart_items(*), profiles(id, name, email, membership_tier, avatar_url)")
      .order("updated_at", { ascending: false });
    setLoading(false);
    if (error) {
      toastRef.current.error(`Failed to load carts: ${error.message}`);
      return;
    }
    // Only show carts that have at least one item
    const withItems = ((data as DbCart[]) ?? []).filter((c) => c.cart_items && c.cart_items.length > 0);
    setCarts(withItems);
  }, []); // stable — toast accessed via ref

  useEffect(() => { loadCarts(); }, [loadCarts]);

  const activeCarts = useMemo(() => carts.filter((c) => !isAbandoned(c.updated_at)), [carts]);
  const abandonedCarts = useMemo(() => carts.filter((c) => isAbandoned(c.updated_at)), [carts]);
  const displayCarts = tab === "active" ? activeCarts : abandonedCarts;

  const totalValue = carts.reduce(
    (sum, c) => sum + c.cart_items.reduce((s, it) => s + it.price * it.quantity, 0),
    0
  );
  const avgValue = carts.length > 0 ? Math.round(totalValue / carts.length) : 0;

  async function sendAbandonedReminder(cart: DbCart) {
    if (!cart.profiles?.email) { toast.error("No email on file for this user"); return; }
    setSendingReminder(cart.id);
    const cartTotal = cart.cart_items.reduce((s, it) => s + it.price * it.quantity, 0);
    const name = cart.profiles.name ?? "there";
    const result = await sendBroadcastEmail(
      cart.profiles.email,
      `Hey ${name}, your cart is waiting`,
      `You have ${cart.cart_items.length} item${cart.cart_items.length !== 1 ? "s" : ""} worth ${formatNaira(cartTotal)} sitting in your cart. Come back and complete your order at lagosapps.com.`
    );
    setSendingReminder(null);
    if ("error" in result && result.error) toast.error(`Reminder failed: ${result.error}`);
    else toast.success(`Reminder sent to ${cart.profiles.email}`);
  }

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
        <StatCard label="Total Carts" value={String(carts.length)} icon="shopping_bag" color="#4A148C" />
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

      <div className={card}>
        <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-[#E8ECF1]/60 bg-[#F8FAFC] rounded-t-2xl">
          <div className="col-span-3 text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">Customer</div>
          <div className="col-span-1 text-[11px] font-semibold uppercase tracking-wider text-[#64748B] hidden sm:block">Items</div>
          <div className="col-span-2 text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">Value</div>
          <div className="col-span-2 text-[11px] font-semibold uppercase tracking-wider text-[#64748B] hidden md:block">Portals</div>
          <div className="col-span-2 text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">{tab === "abandoned" ? "Idle Since" : "Last Active"}</div>
          <div className="col-span-2 text-[11px] font-semibold uppercase tracking-wider text-[#64748B] text-right">Actions</div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-[#94A3B8]">Loading carts…</div>
        ) : displayCarts.length === 0 ? (
          <div className="py-12 text-center text-sm text-[#94A3B8]">No {tab} carts</div>
        ) : (
          displayCarts.map((c) => {
            const cartTotal = c.cart_items.reduce((s, it) => s + it.price * it.quantity, 0);
            const portalsInCart = Array.from(new Set(c.cart_items.map((it) => it.portal_id)));
            const isExpanded = expandedCart === c.id;
            const name = c.profiles?.name ?? c.profiles?.email ?? "Unknown user";
            const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

            return (
              <div key={c.id} className="border-b border-[#E8ECF1]/40 last:border-0">
                <div
                  className="grid grid-cols-12 gap-2 px-4 py-3.5 items-center hover:bg-[#F8FAFC]/60 transition-colors cursor-pointer"
                  onClick={() => setExpandedCart(isExpanded ? null : c.id)}
                >
                  <div className="col-span-3 flex items-center gap-2.5 min-w-0">
                    {c.profiles?.avatar_url ? (
                      <img src={c.profiles.avatar_url} alt={name} className="size-8 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="size-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0">
                        {initials}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#0F172A] truncate">{name}</p>
                      {c.profiles?.membership_tier && c.profiles.membership_tier !== "none" && (
                        <p className="text-[11px] text-[#94A3B8]"><StatusBadge status={c.profiles.membership_tier} /></p>
                      )}
                    </div>
                  </div>
                  <div className="col-span-1 text-sm text-[#334155] hidden sm:block">{c.cart_items.length}</div>
                  <div className="col-span-2 text-sm font-semibold text-[#0F172A]">{formatNaira(cartTotal)}</div>
                  <div className="col-span-2 hidden md:flex gap-1 flex-wrap">
                    {portalsInCart.map((p) => (
                      <span key={p} className="size-2.5 rounded-full inline-block" style={{ backgroundColor: PORTAL_COLORS[p] }} title={p} />
                    ))}
                  </div>
                  <div className="col-span-2 text-sm text-[#64748B]">{timeAgo(c.updated_at)}</div>
                  <div className="col-span-2 flex justify-end gap-2 items-center">
                    <button
                      onClick={(e) => { e.stopPropagation(); if (c.profiles?.id) navigate(`/users/${c.profiles.id}`); }}
                      className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                    >
                      View User
                    </button>
                    {tab === "abandoned" && (
                      <button
                        onClick={(e) => { e.stopPropagation(); void sendAbandonedReminder(c); }}
                        disabled={sendingReminder === c.id}
                        className="text-xs font-semibold text-[#EA580C] hover:underline cursor-pointer disabled:opacity-50"
                      >
                        {sendingReminder === c.id ? "Sending..." : "Remind"}
                      </button>
                    )}
                    <span className="material-symbols-outlined text-[18px] text-[#94A3B8]">{isExpanded ? "expand_less" : "expand_more"}</span>
                  </div>
                </div>

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
                          {c.cart_items.map((item) => (
                            <tr key={item.id}>
                              <td className="py-2 text-[#0F172A] font-medium">{item.name}</td>
                              <td className="py-2 hidden sm:table-cell">
                                <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold text-white" style={{ backgroundColor: PORTAL_COLORS[item.portal_id] }}>
                                  {item.portal_id.slice(0, 3).toUpperCase()}
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
                      <p className="text-[11px] text-[#94A3B8] mt-3">Cart created {new Date(c.created_at).toLocaleString("en-NG")} · Last updated {new Date(c.updated_at).toLocaleString("en-NG")}</p>
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
