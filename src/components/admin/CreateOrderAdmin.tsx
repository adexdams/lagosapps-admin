import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../hooks/useToast";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import { createOrder, insertOrderItems, insertOrderTimelineStep, generateOrderId, logAudit, getProducts } from "../../lib/api";
import {
  formatNaira,
  PORTAL_LABELS,
  PORTAL_COLORS,
  type Portal,
} from "../../data/adminMockData";

interface DbUser {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  membership_tier: string | null;
  avatar_url: string | null;
  wallet_balance: number;
}

interface DbProduct {
  id: string;
  portal_id: Portal;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_active: boolean;
}

type Step = 1 | 2 | 3;

const CHANNELS = [
  { value: "whatsapp", label: "WhatsApp", icon: "chat", desc: "Order received via WhatsApp" },
  { value: "phone", label: "Phone", icon: "call", desc: "Order received via phone call" },
  { value: "walkin", label: "Walk-in", icon: "storefront", desc: "Customer walked in" },
];

const PORTALS: Portal[] = ["solar", "transport", "groceries", "health", "events", "community", "logistics"];

interface CartItem {
  product: DbProduct;
  qty: number;
}

const inputClass = "w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm text-[#0F172A] outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all";

export default function CreateOrderAdmin() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user: authUser } = useAuth();

  const [step, setStep] = useState<Step>(1);
  const [channel, setChannel] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<DbUser | null>(null);
  const [searchResults, setSearchResults] = useState<DbUser[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [searching, setSearching] = useState(false);

  const [activePortal, setActivePortal] = useState<Portal>("solar");
  const [portalProducts, setPortalProducts] = useState<DbProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);

  const [paymentMethod, setPaymentMethod] = useState("wallet");
  const [adminNotes, setAdminNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Customer search debounce
  useEffect(() => {
    if (customerSearch.length < 2) { setSearchResults([]); return; }
    const id = setTimeout(async () => {
      setSearching(true);
      const { data } = await supabase
        .from("profiles")
        .select("id, name, email, phone, membership_tier, avatar_url, wallet_balance")
        .or(`name.ilike.%${customerSearch}%,email.ilike.%${customerSearch}%,phone.ilike.%${customerSearch}%`)
        .eq("is_active", true)
        .eq("role", "user")
        .limit(5);
      setSearching(false);
      setSearchResults((data as DbUser[]) ?? []);
    }, 300);
    return () => clearTimeout(id);
  }, [customerSearch]);

  // Load products when portal changes
  useEffect(() => {
    (async () => {
      setLoadingProducts(true);
      const { data } = await getProducts(activePortal);
      setLoadingProducts(false);
      const active = ((data as DbProduct[]) ?? []).filter((p) => p.is_active);
      setPortalProducts(active);
    })();
  }, [activePortal]);

  const selectUser = (user: DbUser) => {
    setSelectedUser(user);
    setCustomerSearch("");
    setShowResults(false);
  };

  const addToCart = (product: DbProduct) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.product.id === product.id);
      if (existing) return prev.map((c) => c.product.id === product.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { product, qty: 1 }];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev.map((c) => c.product.id === productId ? { ...c, qty: Math.max(0, c.qty + delta) } : c).filter((c) => c.qty > 0)
    );
  };

  const subtotal = cart.reduce((sum, c) => sum + c.product.price * c.qty, 0);

  async function handleSubmit() {
    if (!selectedUser || cart.length === 0) return;
    setSubmitting(true);

    // Group items by portal; we only support one portal per order for simplicity
    const portalsInCart = Array.from(new Set(cart.map((c) => c.product.portal_id)));
    const orderPortal = portalsInCart[0];
    if (portalsInCart.length > 1) {
      toast.error("Please add items from one portal at a time");
      setSubmitting(false);
      return;
    }

    // 1. Generate order ID + create order
    const orderId = await generateOrderId();
    const walletDeduction = paymentMethod === "wallet" ? Math.min(Number(selectedUser.wallet_balance), subtotal) : 0;
    const paymentAmount = subtotal - walletDeduction;

    const { data: createdOrder, error: orderErr } = await createOrder({
      id: orderId,
      user_id: selectedUser.id,
      portal_id: orderPortal,
      description: cart.map((c) => `${c.qty}× ${c.product.name}`).join(", "),
      total_amount: subtotal,
      discount_amount: 0,
      wallet_deduction: walletDeduction,
      payment_amount: paymentAmount,
      payment_method: paymentMethod,
      status: "pending",
      channel,
      admin_notes: adminNotes || null,
      created_by: authUser?.id,
    });

    if (orderErr || !createdOrder) {
      setSubmitting(false);
      toast.error(`Order creation failed: ${orderErr?.message ?? "unknown"}`);
      return;
    }

    // 2. Insert order items
    const { error: itemsErr } = await insertOrderItems(
      cart.map((c) => ({
        order_id: orderId,
        product_id: c.product.id,
        name: c.product.name,
        description: c.product.description,
        price: c.product.price,
        quantity: c.qty,
        member_covered: false,
      }))
    );
    if (itemsErr) {
      setSubmitting(false);
      toast.error(`Items failed: ${itemsErr.message}`);
      return;
    }

    // 3. Seed first timeline step
    await insertOrderTimelineStep({
      order_id: orderId,
      label: "Order Placed",
      occurred_at: new Date().toISOString(),
      completed: true,
      sort_order: 0,
      created_by: authUser?.id,
    });

    // 4. Audit
    await logAudit({
      action: "order.create",
      entity_type: "order",
      entity_id: orderId,
      new_values: { portal_id: orderPortal, total_amount: subtotal, channel, customer: selectedUser.email },
    });

    setSubmitting(false);
    toast.success(`Order ${orderId} created`);
    navigate(`/orders/${orderId}`);
  }

  const canProceed = () => {
    if (step === 1) return !!channel && !!selectedUser;
    if (step === 2) return cart.length > 0;
    return true;
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back */}
      <button
        onClick={() => navigate("/orders")}
        className="inline-flex items-center gap-1 text-sm font-semibold text-[#64748B] hover:text-[#0F172A] cursor-pointer transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Back to Orders
      </button>

      <h1 className="text-xl font-bold text-[#0F172A]">Create Order</h1>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`size-8 rounded-full flex items-center justify-center text-xs font-bold ${
              step >= s ? "bg-primary text-white" : "bg-[#F1F5F9] text-[#94A3B8]"
            }`}>
              {s}
            </div>
            <span className={`text-[13px] font-semibold ${step >= s ? "text-[#0F172A]" : "text-[#94A3B8]"}`}>
              {s === 1 ? "Customer" : s === 2 ? "Products" : "Review"}
            </span>
            {s < 3 && <div className={`w-8 h-0.5 ${step > s ? "bg-primary" : "bg-[#E2E8F0]"}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Customer */}
      {step === 1 && (
        <div className="space-y-5">
          {/* Channel selection */}
          <div>
            <label className="text-[13px] font-semibold text-[#0F172A] mb-3 block">Order Channel</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {CHANNELS.map((ch) => (
                <button
                  key={ch.value}
                  onClick={() => setChannel(ch.value)}
                  className={`p-4 rounded-xl border-2 text-left cursor-pointer transition-all ${
                    channel === ch.value ? "border-primary bg-primary/5" : "border-[#E2E8F0] hover:border-[#94A3B8]"
                  }`}
                >
                  <span className={`material-symbols-outlined text-[22px] ${channel === ch.value ? "text-primary" : "text-[#64748B]"}`}>{ch.icon}</span>
                  <p className="text-sm font-bold text-[#0F172A] mt-1">{ch.label}</p>
                  <p className="text-[12px] text-[#64748B]">{ch.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Customer search */}
          <div className="relative">
            <label className="text-[13px] font-semibold text-[#0F172A] mb-1.5 block">Customer</label>
            <input
              type="text"
              value={customerSearch}
              onChange={(e) => { setCustomerSearch(e.target.value); setShowResults(true); }}
              onFocus={() => setShowResults(true)}
              className={inputClass}
              placeholder="Search by name or phone..."
            />
            {(showResults || customerSearch.length >= 2) && (searching || searchResults.length > 0) && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-[#E8ECF1] z-10 max-h-60 overflow-y-auto">
                {searching && <p className="px-4 py-3 text-sm text-[#94A3B8]">Searching…</p>}
                {!searching && searchResults.map((user) => {
                  const initials = (user.name ?? user.email).split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
                  return (
                    <button
                      key={user.id}
                      onClick={() => selectUser(user)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#F8FAFC] cursor-pointer transition-colors text-left"
                    >
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.name ?? user.email} className="size-8 rounded-full object-cover" />
                      ) : (
                        <div className="size-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white text-[10px] font-bold">
                          {initials}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-[#0F172A]">{user.name ?? user.email}</p>
                        <p className="text-[12px] text-[#64748B]">{user.phone ?? user.email}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected user preview */}
          {selectedUser && (
            <div className="bg-[#F8FAFC] rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {selectedUser.avatar_url ? (
                  <img src={selectedUser.avatar_url} alt={selectedUser.name ?? selectedUser.email} className="size-10 rounded-full object-cover" />
                ) : (
                  <div className="size-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white text-sm font-bold">
                    {(selectedUser.name ?? selectedUser.email).split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-sm font-bold text-[#0F172A]">{selectedUser.name ?? selectedUser.email}</p>
                  <p className="text-[12px] text-[#64748B]">{selectedUser.email}{selectedUser.phone ? ` | ${selectedUser.phone}` : ""}</p>
                  {selectedUser.wallet_balance > 0 && (
                    <p className="text-[11px] text-[#059669] mt-0.5">Wallet: {formatNaira(Number(selectedUser.wallet_balance))}</p>
                  )}
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)} className="text-[#DC2626] cursor-pointer">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Products */}
      {step === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {/* Portal tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {PORTALS.map((p) => (
                <button
                  key={p}
                  onClick={() => setActivePortal(p)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-semibold whitespace-nowrap cursor-pointer transition-all ${
                    activePortal === p ? "text-white" : "bg-[#F1F5F9] text-[#64748B]"
                  }`}
                  style={activePortal === p ? { backgroundColor: PORTAL_COLORS[p] } : undefined}
                >
                  {PORTAL_LABELS[p].split(",")[0]}
                </button>
              ))}
            </div>

            {/* Product grid */}
            {loadingProducts ? (
              <p className="text-sm text-[#94A3B8] py-8 text-center">Loading {PORTAL_LABELS[activePortal]} products…</p>
            ) : portalProducts.length === 0 ? (
              <p className="text-sm text-[#94A3B8] py-8 text-center">No active products in this portal yet.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {portalProducts.map((product) => {
                  const inCart = cart.find((c) => c.product.id === product.id);
                  return (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className={`p-3 rounded-xl border-2 text-left cursor-pointer transition-all ${
                        inCart ? "border-primary bg-primary/5" : "border-[#E2E8F0] hover:border-[#94A3B8]"
                      }`}
                    >
                      <p className="text-sm font-semibold text-[#0F172A] truncate">{product.name}</p>
                      <p className="text-[12px] text-[#64748B] truncate">{product.description}</p>
                      <p className="text-sm font-bold text-[#0F172A] mt-1">{formatNaira(product.price)}</p>
                      {inCart && (
                        <span className="inline-block mt-1 text-[11px] font-semibold text-primary">x{inCart.qty} in cart</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cart sidebar */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 p-5 h-fit sticky top-24">
            <h3 className="text-sm font-bold text-[#0F172A] mb-4">Cart ({cart.length} items)</h3>
            {cart.length === 0 ? (
              <p className="text-sm text-[#94A3B8]">Add products to get started</p>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.product.id} className="flex items-center justify-between py-2 border-b border-[#F1F5F9]">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#0F172A] truncate">{item.product.name}</p>
                      <p className="text-[12px] text-[#64748B]">{formatNaira(item.product.price)} each</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQty(item.product.id, -1)} className="size-7 bg-[#F1F5F9] rounded-lg flex items-center justify-center cursor-pointer hover:bg-[#E2E8F0]">
                        <span className="material-symbols-outlined text-[14px]">remove</span>
                      </button>
                      <span className="text-sm font-bold w-6 text-center">{item.qty}</span>
                      <button onClick={() => updateQty(item.product.id, 1)} className="size-7 bg-[#F1F5F9] rounded-lg flex items-center justify-center cursor-pointer hover:bg-[#E2E8F0]">
                        <span className="material-symbols-outlined text-[14px]">add</span>
                      </button>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between pt-2 text-sm">
                  <span className="font-bold text-[#0F172A]">Subtotal</span>
                  <span className="font-extrabold text-[#0F172A]">{formatNaira(subtotal)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <div className="space-y-5 max-w-2xl">
          {/* Customer */}
          {selectedUser && (
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 p-5">
              <h3 className="text-sm font-bold text-[#0F172A] mb-3">Customer</h3>
              <div className="flex items-center gap-3">
                {selectedUser.avatar_url ? (
                  <img src={selectedUser.avatar_url} alt={selectedUser.name ?? selectedUser.email} className="size-10 rounded-full object-cover" />
                ) : (
                  <div className="size-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white text-sm font-bold">
                    {(selectedUser.name ?? selectedUser.email).split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-sm font-bold text-[#0F172A]">{selectedUser.name ?? selectedUser.email}</p>
                  <p className="text-[12px] text-[#64748B]">{selectedUser.email} | Channel: {channel}</p>
                </div>
              </div>
            </div>
          )}

          {/* Items */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 p-5">
            <h3 className="text-sm font-bold text-[#0F172A] mb-3">Items</h3>
            <div className="space-y-2">
              {cart.map((item) => (
                <div key={item.product.id} className="flex justify-between py-2 border-b border-[#F1F5F9] last:border-0">
                  <span className="text-sm text-[#334155]">{item.product.name} x{item.qty}</span>
                  <span className="text-sm font-semibold text-[#0F172A]">{formatNaira(item.product.price * item.qty)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Payment method */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 p-5">
            <h3 className="text-sm font-bold text-[#0F172A] mb-3">Payment Method</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
              {["wallet", "card", "bank_transfer"].map((m) => (
                <button
                  key={m}
                  onClick={() => setPaymentMethod(m)}
                  className={`p-3 rounded-xl border-2 text-center text-sm font-semibold cursor-pointer transition-all capitalize ${
                    paymentMethod === m ? "border-primary bg-primary/5 text-primary" : "border-[#E2E8F0] text-[#64748B]"
                  }`}
                >
                  {m.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Admin notes */}
          <div>
            <label className="text-[13px] font-semibold text-[#0F172A] mb-1.5 block">Admin Notes</label>
            <textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} className={`${inputClass} min-h-[80px]`} placeholder="Internal notes..." />
          </div>

          {/* Total + Submit */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 p-5 flex items-center justify-between">
            <div>
              <p className="text-[13px] text-[#64748B]">Total</p>
              <p className="text-2xl font-extrabold text-[#0F172A]">{formatNaira(subtotal)}</p>
            </div>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-3 bg-primary text-white text-sm font-semibold rounded-xl cursor-pointer hover:brightness-[0.92] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Submit Order"}
            </button>
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-[#E8ECF1]/60">
        {step > 1 ? (
          <button
            onClick={() => setStep((s) => (s - 1) as Step)}
            className="inline-flex items-center gap-1 px-5 py-2.5 border border-[#E2E8F0] text-sm font-semibold text-[#334155] rounded-xl cursor-pointer hover:bg-[#F8FAFC] transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back
          </button>
        ) : <div />}
        {step < 3 && (
          <button
            onClick={() => setStep((s) => (s + 1) as Step)}
            disabled={!canProceed()}
            className="inline-flex items-center gap-1 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl cursor-pointer hover:brightness-[0.92] active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        )}
      </div>
    </div>
  );
}
