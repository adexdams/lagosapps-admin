import { useParams, useNavigate } from "react-router-dom";
import StatusBadge from "./shared/StatusBadge";
import {
  mockUsers, mockOrders, mockWalletTxns, mockReferrals,
  formatNaira, formatDate, PORTAL_LABELS,
} from "../../data/adminMockData";

export default function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = mockUsers.find((u) => u.id === id);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <span className="material-symbols-outlined text-outline/30 text-[48px]">person_off</span>
        <p className="text-on-surface-variant">User not found</p>
        <button onClick={() => navigate("/users")} className="text-primary font-bold text-sm cursor-pointer">Back to Users</button>
      </div>
    );
  }

  const userOrders = mockOrders.filter((o) => o.userId === user.id).slice(0, 10);
  const userTxns = mockWalletTxns.filter((t) => t.userId === user.id).slice(0, 10);
  const userReferrals = mockReferrals.filter((r) => r.referrerId === user.id);

  return (
    <div className="space-y-5 sm:space-y-8">
      {/* Back button */}
      <button onClick={() => navigate("/users")} className="flex items-center gap-1 text-sm font-bold text-primary cursor-pointer hover:underline">
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Back to Users
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
        {/* Left column */}
        <div className="lg:col-span-3 space-y-4 sm:space-y-6">
          {/* Profile card */}
          <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 p-4 sm:p-6 md:p-8">
            <div className="flex items-start gap-4 sm:gap-6">
              <div className="size-16 sm:size-20 md:size-24 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl sm:text-2xl font-extrabold flex-shrink-0">
                {user.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-extrabold text-on-surface">{user.name}</h2>
                <p className="text-sm text-on-surface-variant mt-0.5">{user.phone}</p>
                <p className="text-sm text-on-surface-variant">{user.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <StatusBadge status={user.membership} variant="membership" />
                  <StatusBadge status={user.status} />
                </div>
                <p className="text-xs text-on-surface-variant mt-2">Since {formatDate(user.joinedAt)}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3 mt-4 sm:mt-5 pt-4 sm:pt-5 border-t border-[#E8ECF1]/60">
              <button className="px-3 sm:px-5 py-2 bg-primary text-white text-xs font-bold rounded-lg cursor-pointer hover:brightness-[0.92]">Edit Profile</button>
              <button className="px-3 sm:px-5 py-2 bg-[#E65100]/10 text-[#E65100] text-xs font-bold rounded-lg cursor-pointer hover:bg-[#E65100]/20">Adjust Wallet</button>
              <button className="px-3 sm:px-5 py-2 bg-error/10 text-error text-xs font-bold rounded-lg cursor-pointer hover:bg-error/20">Deactivate</button>
            </div>
          </div>

          {/* Order History */}
          <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 overflow-hidden">
            <div className="flex items-center justify-between px-3 sm:px-5 py-3 sm:py-4 border-b border-[#E8ECF1]/60">
              <h3 className="text-sm font-bold text-on-surface">Order History</h3>
              <button onClick={() => navigate("/orders")} className="text-sm font-bold text-primary cursor-pointer hover:underline">View All</button>
            </div>
            {userOrders.length === 0 ? (
              <p className="px-3 sm:px-5 py-8 text-center text-sm text-on-surface-variant">No orders yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#F8FAFC] text-on-surface-variant">
                      <th className="text-left px-3 sm:px-5 py-2.5 font-bold text-xs uppercase tracking-wider">ID</th>
                      <th className="text-left px-3 sm:px-5 py-2.5 font-bold text-xs uppercase tracking-wider hidden sm:table-cell">Service</th>
                      <th className="text-right px-3 sm:px-5 py-2.5 font-bold text-xs uppercase tracking-wider">Amount</th>
                      <th className="text-center px-3 sm:px-5 py-2.5 font-bold text-xs uppercase tracking-wider">Status</th>
                      <th className="text-left px-3 sm:px-5 py-2.5 font-bold text-xs uppercase tracking-wider hidden md:table-cell">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/8">
                    {userOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-surface-container/30 cursor-pointer" onClick={() => navigate(`/orders/${order.id}`)}>
                        <td className="px-3 sm:px-5 py-3 font-bold text-primary">{order.id}</td>
                        <td className="px-3 sm:px-5 py-3 text-on-surface-variant hidden sm:table-cell">{PORTAL_LABELS[order.portal]}</td>
                        <td className="px-3 sm:px-5 py-3 text-right font-bold">{formatNaira(order.amount)}</td>
                        <td className="px-3 sm:px-5 py-3 text-center"><StatusBadge status={order.status} variant="order" /></td>
                        <td className="px-3 sm:px-5 py-3 text-on-surface-variant hidden md:table-cell">{formatDate(order.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Wallet Transactions */}
          <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 overflow-hidden">
            <div className="flex items-center justify-between px-3 sm:px-5 py-3 sm:py-4 border-b border-[#E8ECF1]/60">
              <h3 className="text-sm font-bold text-on-surface">Wallet Transactions</h3>
              <p className="text-sm font-extrabold text-on-surface">Balance: {formatNaira(user.walletBalance)}</p>
            </div>
            {userTxns.length === 0 ? (
              <p className="px-3 sm:px-5 py-8 text-center text-sm text-on-surface-variant">No transactions yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#F8FAFC] text-on-surface-variant">
                      <th className="text-left px-3 sm:px-5 py-2.5 font-bold text-xs uppercase tracking-wider hidden sm:table-cell">Date</th>
                      <th className="text-left px-3 sm:px-5 py-2.5 font-bold text-xs uppercase tracking-wider">Description</th>
                      <th className="text-center px-3 sm:px-5 py-2.5 font-bold text-xs uppercase tracking-wider">Type</th>
                      <th className="text-right px-3 sm:px-5 py-2.5 font-bold text-xs uppercase tracking-wider">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/8">
                    {userTxns.map((txn) => (
                      <tr key={txn.id}>
                        <td className="px-3 sm:px-5 py-3 text-on-surface-variant hidden sm:table-cell">{formatDate(txn.createdAt)}</td>
                        <td className="px-3 sm:px-5 py-3">{txn.description}</td>
                        <td className="px-3 sm:px-5 py-3 text-center"><StatusBadge status={txn.type} /></td>
                        <td className={`px-3 sm:px-5 py-3 text-right font-bold ${txn.type === "credit" ? "text-primary" : "text-error"}`}>
                          {txn.type === "credit" ? "+" : "-"}{formatNaira(txn.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Quick Stats */}
          <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 p-3 sm:p-5">
            <h3 className="text-sm font-bold text-on-surface mb-3 sm:mb-5">Quick Stats</h3>
            <div className="space-y-2 sm:space-y-3">
              {[
                { label: "Total Orders", value: String(user.totalOrders) },
                { label: "Total Spent", value: formatNaira(user.totalSpent) },
                { label: "Wallet Balance", value: formatNaira(user.walletBalance) },
                { label: "Referrals Made", value: String(user.referralsMade) },
                { label: "Member Since", value: formatDate(user.joinedAt) },
              ].map((stat) => (
                <div key={stat.label} className="flex justify-between items-center">
                  <span className="text-sm text-on-surface-variant">{stat.label}</span>
                  <span className="text-sm font-bold text-on-surface">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Referrals */}
          <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 p-3 sm:p-5">
            <h3 className="text-sm font-bold text-on-surface mb-3 sm:mb-5">Referrals</h3>
            {userReferrals.length === 0 ? (
              <p className="text-sm text-on-surface-variant text-center py-4">No referrals yet</p>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {userReferrals.map((ref) => (
                  <div key={ref.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="size-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                        {ref.referredAvatar}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-on-surface">{ref.referredName}</p>
                        <p className="text-xs text-on-surface-variant">{formatDate(ref.createdAt)}</p>
                      </div>
                    </div>
                    <StatusBadge status={ref.status} variant="referral" />
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
