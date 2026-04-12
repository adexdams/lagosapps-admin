import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../ui/Button";
import StatusBadge from "./shared/StatusBadge";
import { useToast } from "../../hooks/useToast";
import {
  mockUsers, mockProducts, formatNaira,
  PORTAL_LABELS, PORTAL_COLORS,
  type Portal, type MockUser, type MockProduct,
} from "../../data/adminMockData";

const PORTALS: Portal[] = ["solar", "transport", "groceries", "health", "events", "community", "logistics"];
const card = "bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60";
const input = "w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm text-[#0F172A] outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all";
const label = "text-[13px] font-semibold text-[#0F172A] mb-1.5 block";

interface CartItem {
  product: MockProduct;
  qty: number;
}

export default function CreateOrderAdmin() {
  const navigate = useNavigate();
  const toast = useToast();

  // Step tracking
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Select user
  const [userSearch, setUserSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<MockUser | null>(null);

  // Step 2: Select products
  const [selectedPortal, setSelectedPortal] = useState<Portal>("solar");
  const [cart, setCart] = useState<CartItem[]>([]);

  // Step 3: Notes
  const [channel, setChannel] = useState<"whatsapp" | "phone" | "walk_in">("whatsapp");
  const [adminNotes, setAdminNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"wallet" | "paystack" | "cash" | "bank_transfer">("wallet");

  const filteredUsers = userSearch.length >= 2
    ? mockUsers.filter((u) => u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.phone.includes(userSearch)).slice(0, 8)
    : [];

  const portalProducts = mockProducts.filter((p) => p.portal === selectedPortal && p.active);

  const addToCart = (product: MockProduct) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.product.id === product.id);
      if (existing) return prev.map((c) => c.product.id === product.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { product, qty: 1 }];
    });
  };

  const updateQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((c) => c.product.id !== productId));
    } else {
      setCart((prev) => prev.map((c) => c.product.id === productId ? { ...c, qty } : c));
    }
  };

  const subtotal = cart.reduce((sum, c) => sum + c.product.price * c.qty, 0);

  const handleSubmit = () => {
    if (!selectedUser) { toast.error("Select a customer"); return; }
    if (cart.length === 0) { toast.error("Add at least one item"); return; }
    toast.success(`Order created for ${selectedUser.name} — ${formatNaira(subtotal)}`);
    navigate("/orders");
  };

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => navigate("/orders")} className="flex items-center gap-1 text-sm font-semibold text-primary cursor-pointer hover:underline mb-2">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to Orders
          </button>
          <h1 className="text-xl font-extrabold text-[#0F172A] tracking-tight">Create Order</h1>
          <p className="text-[13px] text-[#94A3B8] mt-0.5">Place an order on behalf of a customer</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-[#25D366]">chat</span>
          <span className="text-[13px] font-semibold text-[#64748B]">WhatsApp / Phone / Walk-in</span>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2">
        {[
          { n: 1, label: "Customer" },
          { n: 2, label: "Products" },
          { n: 3, label: "Review & Submit" },
        ].map(({ n, label: stepLabel }) => (
          <div key={n} className="flex items-center gap-2 flex-1">
            <div className={`size-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
              step >= n ? "bg-primary text-white" : "bg-[#F1F5F9] text-[#94A3B8]"
            }`}>
              {step > n ? <span className="material-symbols-outlined text-[16px]">check</span> : n}
            </div>
            <span className={`text-[13px] font-medium hidden sm:inline ${step >= n ? "text-[#0F172A]" : "text-[#94A3B8]"}`}>
              {stepLabel}
            </span>
            {n < 3 && <div className={`flex-1 h-0.5 rounded-full ${step > n ? "bg-primary" : "bg-[#E8ECF1]"}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Customer */}
      {step === 1 && (
        <div className={`${card} p-5 sm:p-6`}>
          <h2 className="text-sm font-semibold text-[#0F172A] mb-4">Select Customer</h2>

          {/* Channel */}
          <div className="mb-5">
            <label className={label}>Order Channel</label>
            <div className="flex gap-2">
              {([
                { value: "whatsapp", label: "WhatsApp", icon: "chat", color: "#25D366" },
                { value: "phone", label: "Phone Call", icon: "call", color: "#0D47A1" },
                { value: "walk_in", label: "Walk-in", icon: "storefront", color: "#E65100" },
              ] as const).map((ch) => (
                <button
                  key={ch.value}
                  onClick={() => setChannel(ch.value)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold cursor-pointer transition-all ${
                    channel === ch.value
                      ? "border-2 border-primary bg-primary/5 text-[#0F172A]"
                      : "border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]" style={{ color: ch.color }}>{ch.icon}</span>
                  {ch.label}
                </button>
              ))}
            </div>
          </div>

          {/* User search */}
          <div className="mb-4">
            <label className={label}>Search Customer</label>
            <div className="relative">
              <input
                type="text"
                value={userSearch}
                onChange={(e) => { setUserSearch(e.target.value); setSelectedUser(null); }}
                className={input}
                placeholder="Type name or phone number..."
              />
              {filteredUsers.length > 0 && !selectedUser && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-[#E8ECF1] z-10 max-h-60 overflow-y-auto">
                  {filteredUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => { setSelectedUser(u); setUserSearch(u.name); }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#F8FAFC] cursor-pointer text-left transition-colors"
                    >
                      <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {u.avatar}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#0F172A]">{u.name}</p>
                        <p className="text-[11px] text-[#94A3B8]">{u.phone} · {u.email}</p>
                      </div>
                      <div className="ml-auto">
                        <StatusBadge status={u.membership} variant="membership" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Selected user preview */}
          {selectedUser && (
            <div className="bg-[#F8FAFC] rounded-xl p-4 flex items-center gap-4">
              <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg font-bold">
                {selectedUser.avatar}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-[#0F172A]">{selectedUser.name}</p>
                <p className="text-[13px] text-[#64748B]">{selectedUser.phone} · {selectedUser.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <StatusBadge status={selectedUser.membership} variant="membership" />
                  <span className="text-[11px] text-[#94A3B8]">Wallet: {formatNaira(selectedUser.walletBalance)}</span>
                </div>
              </div>
              <button onClick={() => { setSelectedUser(null); setUserSearch(""); }} className="text-[#94A3B8] hover:text-[#DC2626] cursor-pointer">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          )}

          <div className="flex justify-end mt-6">
            <Button onClick={() => { if (!selectedUser) { toast.error("Select a customer first"); return; } setStep(2); }}>
              Continue
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Products */}
      {step === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Product catalog */}
          <div className="lg:col-span-2 space-y-4">
            <div className={`${card} p-4 sm:p-5`}>
              <h2 className="text-sm font-semibold text-[#0F172A] mb-4">Select Products</h2>

              {/* Portal tabs */}
              <div className="flex gap-1.5 overflow-x-auto mb-4 pb-1">
                {PORTALS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setSelectedPortal(p)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold whitespace-nowrap cursor-pointer transition-all ${
                      selectedPortal === p ? "text-white" : "bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]"
                    }`}
                    style={selectedPortal === p ? { backgroundColor: PORTAL_COLORS[p] } : undefined}
                  >
                    <div className="size-1.5 rounded-full bg-current" />
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>

              {/* Product grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {portalProducts.map((product) => {
                  const inCart = cart.find((c) => c.product.id === product.id);
                  return (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${
                        inCart ? "border-primary bg-primary/5" : "border-[#E2E8F0] hover:border-[#94A3B8] hover:bg-[#F8FAFC]"
                      }`}
                    >
                      <p className="text-[13px] font-semibold text-[#0F172A] truncate">{product.name}</p>
                      <p className="text-[11px] text-[#94A3B8] truncate mt-0.5">{product.description}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-bold text-[#0F172A]">
                          {product.price === 0 ? "Free" : formatNaira(product.price)}
                        </span>
                        {inCart && (
                          <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                            x{inCart.qty}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Cart sidebar */}
          <div className="space-y-4">
            <div className={`${card} p-4 sm:p-5 sticky top-24`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-[#0F172A]">Order Summary</h2>
                <span className="text-[11px] font-semibold text-[#94A3B8]">{cart.length} items</span>
              </div>

              {/* Customer preview */}
              {selectedUser && (
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#F1F5F9]">
                  <div className="size-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                    {selectedUser.avatar}
                  </div>
                  <span className="text-[13px] font-medium text-[#0F172A]">{selectedUser.name}</span>
                  <div className="flex items-center gap-1 ml-auto">
                    <span className="material-symbols-outlined text-[14px] text-[#25D366]">chat</span>
                    <span className="text-[11px] text-[#94A3B8] capitalize">{channel.replace("_", "-")}</span>
                  </div>
                </div>
              )}

              {cart.length === 0 ? (
                <p className="text-center text-[13px] text-[#94A3B8] py-8">No items added yet</p>
              ) : (
                <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#F8FAFC]">
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-[#0F172A] truncate">{item.product.name}</p>
                        <p className="text-[11px] text-[#94A3B8]">{formatNaira(item.product.price)} each</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => updateQty(item.product.id, item.qty - 1)} className="size-6 rounded-md bg-[#F1F5F9] flex items-center justify-center cursor-pointer hover:bg-[#E2E8F0]">
                          <span className="material-symbols-outlined text-[14px] text-[#64748B]">remove</span>
                        </button>
                        <span className="text-[13px] font-semibold text-[#0F172A] w-6 text-center">{item.qty}</span>
                        <button onClick={() => updateQty(item.product.id, item.qty + 1)} className="size-6 rounded-md bg-[#F1F5F9] flex items-center justify-center cursor-pointer hover:bg-[#E2E8F0]">
                          <span className="material-symbols-outlined text-[14px] text-[#64748B]">add</span>
                        </button>
                      </div>
                      <span className="text-[13px] font-bold text-[#0F172A] w-20 text-right">{formatNaira(item.product.price * item.qty)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Total */}
              <div className="border-t border-[#F1F5F9] pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-[13px] font-semibold text-[#64748B]">Subtotal</span>
                  <span className="text-lg font-extrabold text-[#0F172A]">{formatNaira(subtotal)}</span>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button variant="secondary" onClick={() => setStep(1)} className="flex-1">Back</Button>
                <Button onClick={() => { if (cart.length === 0) { toast.error("Add at least one item"); return; } setStep(3); }} className="flex-1">
                  Review
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <div className="max-w-2xl mx-auto space-y-5">
          <div className={`${card} p-5 sm:p-6`}>
            <h2 className="text-sm font-semibold text-[#0F172A] mb-5">Review Order</h2>

            {/* Customer */}
            {selectedUser && (
              <div className="flex items-center gap-3 p-3 bg-[#F8FAFC] rounded-xl mb-5">
                <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                  {selectedUser.avatar}
                </div>
                <div>
                  <p className="font-semibold text-[#0F172A]">{selectedUser.name}</p>
                  <p className="text-[11px] text-[#94A3B8]">{selectedUser.phone}</p>
                </div>
                <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-lg border border-[#E2E8F0]">
                  <span className="material-symbols-outlined text-[14px]" style={{ color: channel === "whatsapp" ? "#25D366" : channel === "phone" ? "#0D47A1" : "#E65100" }}>
                    {channel === "whatsapp" ? "chat" : channel === "phone" ? "call" : "storefront"}
                  </span>
                  <span className="text-[11px] font-semibold text-[#64748B] capitalize">{channel.replace("_", "-")}</span>
                </div>
              </div>
            )}

            {/* Items */}
            <div className="space-y-2 mb-5">
              {cart.map((item) => (
                <div key={item.product.id} className="flex items-center justify-between py-2 border-b border-[#F1F5F9] last:border-0">
                  <div>
                    <p className="text-[13px] font-medium text-[#0F172A]">{item.product.name}</p>
                    <p className="text-[11px] text-[#94A3B8]">
                      <span className="inline-block size-1.5 rounded-full mr-1" style={{ backgroundColor: PORTAL_COLORS[item.product.portal] }} />
                      {PORTAL_LABELS[item.product.portal]} · Qty: {item.qty}
                    </p>
                  </div>
                  <span className="text-[13px] font-bold text-[#0F172A]">{formatNaira(item.product.price * item.qty)}</span>
                </div>
              ))}
            </div>

            {/* Payment method */}
            <div className="mb-5">
              <label className={label}>Payment Method</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {([
                  { value: "wallet", label: "Wallet", icon: "account_balance_wallet" },
                  { value: "paystack", label: "Paystack", icon: "credit_card" },
                  { value: "cash", label: "Cash", icon: "payments" },
                  { value: "bank_transfer", label: "Bank Transfer", icon: "account_balance" },
                ] as const).map((pm) => (
                  <button
                    key={pm.value}
                    onClick={() => setPaymentMethod(pm.value)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl text-[12px] font-semibold cursor-pointer transition-all ${
                      paymentMethod === pm.value
                        ? "border-2 border-primary bg-primary/5 text-primary"
                        : "border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">{pm.icon}</span>
                    {pm.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Admin notes */}
            <div className="mb-5">
              <label className={label}>Admin Notes (optional)</label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
                className={`${input} resize-none`}
                placeholder="e.g. Customer requested via WhatsApp, delivery to Lekki..."
              />
            </div>

            {/* Total */}
            <div className="flex justify-between items-center p-4 bg-[#F8FAFC] rounded-xl mb-5">
              <span className="text-sm font-semibold text-[#64748B]">Total Amount</span>
              <span className="text-xl font-extrabold text-[#0F172A]">{formatNaira(subtotal)}</span>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setStep(2)}>Back</Button>
              <Button onClick={handleSubmit} className="flex-1">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                Place Order
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
