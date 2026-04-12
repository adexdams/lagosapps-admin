import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../ui/Button";
import { useToast } from "../../hooks/useToast";

type RecipientMode = "all" | "tier" | "user";
type NotifType = "order" | "wallet" | "membership" | "system";

const TIER_CONFIG: { key: string; label: string; color: string }[] = [
  { key: "bronze", label: "Bronze", color: "#8D6E63" },
  { key: "silver", label: "Silver", color: "#64748B" },
  { key: "gold", label: "Gold", color: "#D97706" },
];

const TYPE_CONFIG: { key: NotifType; label: string; color: string }[] = [
  { key: "order", label: "Order", color: "#EA580C" },
  { key: "wallet", label: "Wallet", color: "#2563EB" },
  { key: "membership", label: "Membership", color: "#7C3AED" },
  { key: "system", label: "System", color: "#64748B" },
];

const TYPE_ICONS: Record<NotifType, string> = {
  order: "receipt_long",
  wallet: "account_balance_wallet",
  membership: "card_membership",
  system: "settings",
};

const inputClass =
  "w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm text-[#0F172A] outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all";
const labelClass = "text-[13px] font-semibold text-[#0F172A] mb-2 block";

export default function BroadcastCompose() {
  const navigate = useNavigate();
  const toast = useToast();

  const [recipientMode, setRecipientMode] = useState<RecipientMode>("all");
  const [selectedTiers, setSelectedTiers] = useState<string[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [notifType, setNotifType] = useState<NotifType>("system");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  const toggleTier = (tier: string) => {
    setSelectedTiers((prev) =>
      prev.includes(tier) ? prev.filter((t) => t !== tier) : [...prev, tier]
    );
  };

  const recipientDescription = () => {
    if (recipientMode === "all") return "All Users (1,247)";
    if (recipientMode === "tier") {
      if (selectedTiers.length === 0) return "No tiers selected";
      return selectedTiers.map((t) => t.charAt(0).toUpperCase() + t.slice(1)).join(", ") + " Members";
    }
    return userSearch.trim() || "No user selected";
  };

  const handleSend = () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!message.trim()) {
      toast.error("Message is required");
      return;
    }
    if (recipientMode === "tier" && selectedTiers.length === 0) {
      toast.error("Select at least one tier");
      return;
    }
    if (recipientMode === "user" && !userSearch.trim()) {
      toast.error("Enter a user to search");
      return;
    }
    toast.success(`Broadcast sent to ${recipientDescription()}`);
    navigate("/broadcast");
  };

  return (
    <div className="space-y-5 sm:space-y-8 max-w-2xl mx-auto">
      {/* Back + header */}
      <div>
        <button
          onClick={() => navigate("/broadcast")}
          className="inline-flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#334155] transition-colors cursor-pointer mb-4"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to Broadcast
        </button>
        <h1 className="text-xl font-bold text-[#0F172A]">New Broadcast</h1>
        <p className="text-sm text-[#64748B] mt-1">
          Compose and send a notification to your users.
        </p>
      </div>

      {/* Compose card */}
      <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 overflow-hidden">
        <div className="p-5 sm:p-7 space-y-6">
          {/* Recipients */}
          <div>
            <label className={labelClass}>Recipients</label>
            <div className="grid grid-cols-3 gap-3">
              {/* All Users card */}
              <button
                type="button"
                onClick={() => setRecipientMode("all")}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                  recipientMode === "all"
                    ? "border-primary bg-primary/5"
                    : "border-[#E2E8F0] hover:border-[#94A3B8] bg-white"
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[28px] ${
                    recipientMode === "all" ? "text-primary" : "text-[#94A3B8]"
                  }`}
                >
                  groups
                </span>
                <span className="text-[13px] font-semibold text-[#0F172A]">All Users</span>
                <span className="text-[11px] text-[#64748B]">1,247 users</span>
              </button>

              {/* By Tier card */}
              <button
                type="button"
                onClick={() => setRecipientMode("tier")}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                  recipientMode === "tier"
                    ? "border-primary bg-primary/5"
                    : "border-[#E2E8F0] hover:border-[#94A3B8] bg-white"
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[28px] ${
                    recipientMode === "tier" ? "text-primary" : "text-[#94A3B8]"
                  }`}
                >
                  workspace_premium
                </span>
                <span className="text-[13px] font-semibold text-[#0F172A]">By Tier</span>
                <span className="text-[11px] text-[#64748B]">Select tiers</span>
              </button>

              {/* Specific User card */}
              <button
                type="button"
                onClick={() => setRecipientMode("user")}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                  recipientMode === "user"
                    ? "border-primary bg-primary/5"
                    : "border-[#E2E8F0] hover:border-[#94A3B8] bg-white"
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[28px] ${
                    recipientMode === "user" ? "text-primary" : "text-[#94A3B8]"
                  }`}
                >
                  person
                </span>
                <span className="text-[13px] font-semibold text-[#0F172A]">Specific User</span>
                <span className="text-[11px] text-[#64748B]">Search user</span>
              </button>
            </div>

            {/* Tier pills */}
            {recipientMode === "tier" && (
              <div className="flex flex-wrap gap-2 mt-3">
                {TIER_CONFIG.map((tier) => {
                  const isSelected = selectedTiers.includes(tier.key);
                  return (
                    <button
                      key={tier.key}
                      type="button"
                      onClick={() => toggleTier(tier.key)}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border-2 text-sm font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? "bg-white shadow-sm"
                          : "bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] hover:border-[#94A3B8]"
                      }`}
                      style={
                        isSelected
                          ? { borderColor: tier.color, color: tier.color }
                          : undefined
                      }
                    >
                      <span
                        className="material-symbols-outlined text-[16px]"
                        style={isSelected ? { color: tier.color } : undefined}
                      >
                        {isSelected ? "check_circle" : "circle"}
                      </span>
                      {tier.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* User search */}
            {recipientMode === "user" && (
              <div className="mt-3 relative">
                <span className="material-symbols-outlined text-[18px] text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2">
                  search
                </span>
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className={`${inputClass} pl-9`}
                  placeholder="Search user by name or email..."
                />
              </div>
            )}
          </div>

          {/* Type */}
          <div>
            <label className={labelClass}>Type</label>
            <div className="flex flex-wrap gap-2">
              {TYPE_CONFIG.map((t) => {
                const isSelected = notifType === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setNotifType(t.key)}
                    className={`inline-flex items-center gap-2 pl-3 pr-4 py-2 rounded-lg border text-sm font-medium transition-all cursor-pointer ${
                      isSelected
                        ? "bg-white shadow-sm border-[#E2E8F0]"
                        : "bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] hover:border-[#94A3B8]"
                    }`}
                  >
                    <div
                      className="w-1 h-5 rounded-full"
                      style={{ backgroundColor: t.color }}
                    />
                    <span
                      className="text-sm font-semibold"
                      style={isSelected ? { color: t.color } : undefined}
                    >
                      {t.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className={labelClass}>Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClass}
              placeholder="Broadcast title"
            />
          </div>

          {/* Message */}
          <div>
            <label className={labelClass}>Message</label>
            <div className="relative">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                maxLength={500}
                className={`${inputClass} resize-none pb-8`}
                placeholder="Write your broadcast message..."
              />
              <span className="absolute bottom-3 right-3 text-[11px] text-[#94A3B8]">
                {message.length}/500
              </span>
            </div>
          </div>

          {/* Preview */}
          {(title.trim() || message.trim()) && (
            <div>
              <label className={labelClass}>Preview</label>
              <div className="border border-[#E2E8F0] rounded-xl p-4 bg-[#F8FAFC]">
                <div className="flex items-start gap-3">
                  <div
                    className="size-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor:
                        TYPE_CONFIG.find((t) => t.key === notifType)?.color + "18",
                    }}
                  >
                    <span
                      className="material-symbols-outlined text-[20px]"
                      style={{
                        color: TYPE_CONFIG.find((t) => t.key === notifType)?.color,
                      }}
                    >
                      {TYPE_ICONS[notifType]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-[#0F172A] truncate">
                        {title || "Untitled"}
                      </span>
                      <span
                        className="inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide"
                        style={{
                          backgroundColor:
                            TYPE_CONFIG.find((t) => t.key === notifType)?.color + "18",
                          color: TYPE_CONFIG.find((t) => t.key === notifType)?.color,
                        }}
                      >
                        {notifType}
                      </span>
                    </div>
                    <p className="text-[13px] text-[#334155] leading-relaxed line-clamp-2">
                      {message || "Your message will appear here..."}
                    </p>
                    <p className="text-[11px] text-[#94A3B8] mt-1.5">Just now</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-7 py-4 border-t border-[#E8ECF1]/60 flex items-center justify-between">
          <span className="text-[13px] text-[#64748B]">
            Sending to: <span className="font-semibold text-[#334155]">{recipientDescription()}</span>
          </span>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={() => navigate("/broadcast")}>
              Cancel
            </Button>
            <Button onClick={handleSend}>
              <span className="material-symbols-outlined text-[18px]">send</span>
              Send Broadcast
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
