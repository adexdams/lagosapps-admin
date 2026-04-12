import { useParams, useNavigate } from "react-router-dom";
import StatusBadge from "./shared/StatusBadge";
import {
  mockUsers,
  mockOrders,
  mockWalletTxns,
  mockReferrals,
  formatNaira,
  formatDate,
  PORTAL_LABELS,
} from "../../data/adminMockData";

export default function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

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
        </div>
      </div>
    </div>
  );
}
