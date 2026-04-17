import { useParams, useNavigate } from "react-router-dom";
import StatusBadge from "./shared/StatusBadge";
import { useState } from "react";
import { useToast } from "../../hooks/useToast";
import {
  mockUsers,
  mockOrders,
  mockWalletTxns,
  mockReferrals,
  mockCarts,
  mockBenefitUsage,
  mockUserNotifications,
  formatNaira,
  formatDate,
  PORTAL_LABELS,
  PORTAL_COLORS,
  type Portal,
} from "../../data/adminMockData";

export default function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [notifTypeFilter, setNotifTypeFilter] = useState("");

  const user = mockUsers.find((u) => u.id === id);
  if (!user) {
    return (
      <div className="text-center py-20">
        <p className="text-lg font-semibold text-[#0F172A]">User not found</p>
        <button onClick={() => navigate("/users")} className="text-primary text-sm font-semibold mt-2 cursor-pointer">
          Back to Users
        </button>
      </div>
    );
  }

  const userOrders = mockOrders.filter((o) => o.userId === user.id).slice(0, 10);
  const userTxns = mockWalletTxns.filter((t) => t.userId === user.id).slice(0, 10);
  const userReferrals = mockReferrals.filter((r) => r.referrerId === user.id);
  const userCart = mockCarts.find((c) => c.userId === user.id);
  const userBenefits = mockBenefitUsage.find((b) => b.userId === user.id);
  const userNotifs = mockUserNotifications.filter((n) => n.userId === user.id).filter((n) => !notifTypeFilter || n.type === notifTypeFilter);

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate("/users")}
        className="inline-flex items-center gap-1 text-sm font-semibold text-[#64748B] hover:text-[#0F172A] cursor-pointer transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Back to Users
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left column — 3/5 */}
        <div className="lg:col-span-3 space-y-6">
          {/* Profile card */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 p-3.5 sm:p-5 md:p-7">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="size-12 sm:size-16 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white text-base sm:text-xl font-bold flex-shrink-0">
                {user.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-[#0F172A]">{user.name}</h2>
                <p className="text-sm text-[#64748B]">{user.phone}</p>
                <p className="text-sm text-[#64748B]">{user.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <StatusBadge status={user.membershipTier} />
                  <StatusBadge status={user.status} />
                </div>
                <p className="text-[12px] text-[#94A3B8] mt-2">Joined {formatDate(user.joinedAt)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-5 pt-4 border-t border-[#E8ECF1]/60">
              <button className="px-4 py-2 bg-primary text-white text-[13px] font-semibold rounded-lg cursor-pointer hover:brightness-[0.92] transition-all">
                Adjust Wallet
              </button>
              <button className="px-4 py-2 bg-[#0F172A] text-white text-[13px] font-semibold rounded-lg cursor-pointer hover:bg-[#1E293B] transition-all">
                Set Membership
              </button>
              <button className="px-4 py-2 border border-[#E2E8F0] text-[13px] font-semibold text-[#DC2626] rounded-lg cursor-pointer hover:bg-[#FEF2F2] transition-all">
                {user.status === "active" ? "Suspend" : "Activate"}
              </button>
            </div>
          </div>

          {/* Order History */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E8ECF1]/60">
              <h3 className="text-sm font-bold text-[#0F172A]">Order History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="bg-[#F8FAFC]">
                    <th className="px-2.5 sm:px-4 py-2.5 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-left">Order</th>
                    <th className="px-2.5 sm:px-4 py-2.5 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-left hidden sm:table-cell">Portal</th>
                    <th className="px-2.5 sm:px-4 py-2.5 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-right">Amount</th>
                    <th className="px-2.5 sm:px-4 py-2.5 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-center">Status</th>
                    <th className="px-2.5 sm:px-4 py-2.5 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-left hidden md:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {userOrders.length === 0 ? (
                    <tr><td colSpan={5} className="px-5 py-8 text-center text-[#94A3B8]">No orders found</td></tr>
                  ) : (
                    userOrders.map((o) => (
                      <tr
                        key={o.id}
                        onClick={() => navigate(`/orders/${o.id}`)}
                        className="hover:bg-[#F8FAFC] cursor-pointer transition-colors"
                      >
                        <td className="px-2.5 sm:px-4 py-3 font-semibold text-primary">{o.id}</td>
                        <td className="px-2.5 sm:px-4 py-3 text-[#334155] hidden sm:table-cell">{PORTAL_LABELS[o.portal]}</td>
                        <td className="px-2.5 sm:px-4 py-3 text-right font-semibold text-[#0F172A]">{formatNaira(o.amount)}</td>
                        <td className="px-2.5 sm:px-4 py-3 text-center"><StatusBadge status={o.status} /></td>
                        <td className="px-2.5 sm:px-4 py-3 text-[#64748B] hidden md:table-cell whitespace-nowrap">{formatDate(o.createdAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Wallet Transactions */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E8ECF1]/60">
              <h3 className="text-sm font-bold text-[#0F172A]">Wallet Transactions</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="bg-[#F8FAFC]">
                    <th className="px-2.5 sm:px-4 py-2.5 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-left">Description</th>
                    <th className="px-2.5 sm:px-4 py-2.5 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-center">Type</th>
                    <th className="px-2.5 sm:px-4 py-2.5 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-right">Amount</th>
                    <th className="px-2.5 sm:px-4 py-2.5 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-left hidden md:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {userTxns.length === 0 ? (
                    <tr><td colSpan={4} className="px-5 py-8 text-center text-[#94A3B8]">No transactions</td></tr>
                  ) : (
                    userTxns.map((t) => (
                      <tr key={t.id} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="px-2.5 sm:px-4 py-3 text-[#334155]">{t.description}</td>
                        <td className="px-2.5 sm:px-4 py-3 text-center"><StatusBadge status={t.type} /></td>
                        <td className={`px-2.5 sm:px-4 py-3 text-right font-semibold ${t.type === "credit" ? "text-[#059669]" : "text-[#DC2626]"}`}>
                          {t.type === "credit" ? "+" : "-"}{formatNaira(t.amount)}
                        </td>
                        <td className="px-2.5 sm:px-4 py-3 text-[#64748B] hidden md:table-cell whitespace-nowrap">{formatDate(t.createdAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right column — 2/5 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Stats */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 p-5">
            <h3 className="text-sm font-bold text-[#0F172A] mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[#64748B]">Wallet Balance</span>
                <span className="text-sm font-bold text-[#0F172A]">{formatNaira(user.walletBalance)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[#64748B]">Total Orders</span>
                <span className="text-sm font-bold text-[#0F172A]">{user.totalOrders}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[#64748B]">Total Spent</span>
                <span className="text-sm font-bold text-[#0F172A]">{formatNaira(user.totalSpent)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[#64748B]">Referral Code</span>
                <span className="text-sm font-mono font-bold text-primary">{user.referralCode}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[#64748B]">Last Active</span>
                <span className="text-sm text-[#334155]">{formatDate(user.lastActive)}</span>
              </div>
            </div>
          </div>

          {/* Referrals */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 p-5">
            <h3 className="text-sm font-bold text-[#0F172A] mb-4">
              Referrals ({userReferrals.length})
            </h3>
            {userReferrals.length === 0 ? (
              <p className="text-sm text-[#94A3B8]">No referrals yet</p>
            ) : (
              <div className="space-y-3">
                {userReferrals.map((r) => (
                  <div key={r.id} className="flex items-center justify-between py-2 border-b border-[#F1F5F9] last:border-0">
                    <div>
                      <p className="text-sm font-semibold text-[#0F172A]">{r.referredName}</p>
                      <p className="text-[12px] text-[#64748B]">{formatDate(r.createdAt)}</p>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Current Cart */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 p-5">
            <h3 className="text-sm font-bold text-[#0F172A] mb-4">
              Current Cart {userCart ? `(${userCart.items.length} items)` : ""}
            </h3>
            {!userCart || userCart.items.length === 0 ? (
              <p className="text-sm text-[#94A3B8]">Cart is empty</p>
            ) : (
              <div className="space-y-2">
                {userCart.items.map((item) => (
                  <div key={item.productId} className="flex items-center justify-between py-2 border-b border-[#F1F5F9] last:border-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="size-2 rounded-full flex-shrink-0" style={{ backgroundColor: PORTAL_COLORS[item.portal as Portal] }} />
                      <span className="text-sm text-[#0F172A] truncate">{item.productName}</span>
                      <span className="text-[11px] text-[#94A3B8]">x{item.quantity}</span>
                    </div>
                    <span className="text-sm font-semibold text-[#0F172A] flex-shrink-0">{formatNaira(item.price * item.quantity)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-2 border-t border-[#E2E8F0]">
                  <span className="text-[13px] font-semibold text-[#64748B]">Total</span>
                  <span className="text-sm font-bold text-[#0F172A]">{formatNaira(userCart.items.reduce((s, it) => s + it.price * it.quantity, 0))}</span>
                </div>
                <p className="text-[11px] text-[#94A3B8]">Last updated: {userCart.lastUpdated}</p>
              </div>
            )}
          </div>

          {/* Benefit Usage */}
          {userBenefits && (
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-[#0F172A]">Benefit Usage</h3>
                <StatusBadge status={userBenefits.tier} />
              </div>
              <div className="space-y-3">
                {userBenefits.benefits.map((b) => {
                  const pct = b.limit ? Math.min(100, Math.round((b.used / b.limit) * 100)) : null;
                  const barColor = pct === null ? "#059669" : pct >= 100 ? "#DC2626" : pct >= 75 ? "#EA580C" : "#059669";
                  return (
                    <div key={b.name}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[13px] text-[#334155]">{b.name}</span>
                        <span className="text-[12px] font-semibold text-[#0F172A]">
                          {b.limit ? `${b.used}/${b.limit}` : `${b.used} used`}
                          <span className="text-[#94A3B8] font-normal"> / {b.period}</span>
                        </span>
                      </div>
                      {b.limit && (
                        <div className="h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: barColor }} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notifications — full width */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8ECF1]/60">
          <h3 className="text-sm font-bold text-[#0F172A]">Notifications ({userNotifs.length})</h3>
          <select value={notifTypeFilter} onChange={(e) => setNotifTypeFilter(e.target.value)} className="border border-[#E2E8F0] rounded-lg px-2 py-1 text-xs text-[#334155] outline-none cursor-pointer">
            <option value="">All Types</option>
            <option value="order">Order</option>
            <option value="wallet">Wallet</option>
            <option value="membership">Membership</option>
            <option value="system">System</option>
            <option value="broadcast">Broadcast</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm">
            <thead>
              <tr className="bg-[#F8FAFC]">
                <th className="px-4 py-2.5 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-left">Title</th>
                <th className="px-4 py-2.5 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-center">Type</th>
                <th className="px-4 py-2.5 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-center hidden sm:table-cell">Status</th>
                <th className="px-4 py-2.5 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-left hidden md:table-cell">Date</th>
                <th className="px-4 py-2.5 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {userNotifs.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-[#94A3B8]">No notifications</td></tr>
              ) : (
                userNotifs.map((n) => (
                  <tr key={n.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {!n.read && <span className="size-2 rounded-full bg-primary flex-shrink-0" />}
                        <span className={`text-sm ${n.read ? "text-[#64748B]" : "text-[#0F172A] font-semibold"}`}>{n.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center"><StatusBadge status={n.type} /></td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      <span className={`text-[11px] font-semibold ${n.read ? "text-[#94A3B8]" : "text-primary"}`}>{n.read ? "Read" : "Unread"}</span>
                    </td>
                    <td className="px-4 py-3 text-[#64748B] hidden md:table-cell whitespace-nowrap">{formatDate(n.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => toast.success(n.read ? "Marked as unread" : "Marked as read")} className="text-xs text-primary font-semibold hover:underline cursor-pointer mr-2">
                        {n.read ? "Mark Unread" : "Mark Read"}
                      </button>
                      <button onClick={() => toast.success("Notification deleted")} className="text-xs text-red-500 font-semibold hover:underline cursor-pointer">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
