import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../hooks/useToast";
import { mockUsers } from "../../data/adminMockData";
import EmailPreviewModal from "./shared/EmailPreviewModal";

type RecipientType = "all" | "tier" | "specific";
type NotifType = "info" | "promo" | "alert" | "update";

const TYPE_CONFIG: { value: NotifType; label: string; color: string }[] = [
  { value: "info", label: "Info", color: "#0D47A1" },
  { value: "promo", label: "Promo", color: "#1B5E20" },
  { value: "alert", label: "Alert", color: "#B71C1C" },
  { value: "update", label: "Update", color: "#4A148C" },
];

const TIER_PILLS = [
  { value: "bronze", label: "Bronze", color: "#CD7F32" },
  { value: "silver", label: "Silver", color: "#94A3B8" },
  { value: "gold", label: "Gold", color: "#D97706" },
];

export default function BroadcastCompose() {
  const navigate = useNavigate();
  const toast = useToast();

  const [recipientType, setRecipientType] = useState<RecipientType>("all");
  const [selectedTiers, setSelectedTiers] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [notifType, setNotifType] = useState<NotifType>("info");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Only image files allowed"); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error("Max 2MB file size"); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const toggleTier = (tier: string) => {
    setSelectedTiers((prev) => prev.includes(tier) ? prev.filter((t) => t !== tier) : [...prev, tier]);
  };

  const handleSend = () => {
    if (!title.trim()) { toast.error("Title is required"); return; }
    if (!message.trim()) { toast.error("Message is required"); return; }
    toast.success("Broadcast sent successfully");
    navigate("/broadcast");
  };

  const inputClass = "w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm text-[#0F172A] outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all";

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Back */}
      <button
        onClick={() => navigate("/broadcast")}
        className="inline-flex items-center gap-1 text-sm font-semibold text-[#64748B] hover:text-[#0F172A] cursor-pointer transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Back to Broadcast
      </button>

      <h1 className="text-xl font-bold text-[#0F172A]">New Broadcast</h1>

      <div className="bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 p-3.5 sm:p-5 md:p-7 space-y-6">
        {/* Recipients */}
        <div>
          <label className="text-[13px] font-semibold text-[#0F172A] mb-3 block">Recipients</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {([
              { type: "all" as RecipientType, icon: "groups", title: "All Users", desc: "Send to everyone" },
              { type: "tier" as RecipientType, icon: "card_membership", title: "By Tier", desc: "Select membership tiers" },
              { type: "specific" as RecipientType, icon: "person", title: "Specific User", desc: "Choose a single user" },
            ]).map((opt) => (
              <button
                key={opt.type}
                onClick={() => setRecipientType(opt.type)}
                className={`p-4 rounded-xl border-2 text-left cursor-pointer transition-all ${
                  recipientType === opt.type ? "border-primary bg-primary/5" : "border-[#E2E8F0] hover:border-[#94A3B8]"
                }`}
              >
                <span className={`material-symbols-outlined text-[22px] ${recipientType === opt.type ? "text-primary" : "text-[#64748B]"}`}>{opt.icon}</span>
                <p className="text-sm font-bold text-[#0F172A] mt-1">{opt.title}</p>
                <p className="text-[12px] text-[#64748B]">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Tier selection */}
        {recipientType === "tier" && (
          <div>
            <label className="text-[13px] font-semibold text-[#0F172A] mb-2 block">Select Tiers</label>
            <div className="flex gap-2">
              {TIER_PILLS.map((t) => (
                <button
                  key={t.value}
                  onClick={() => toggleTier(t.value)}
                  className={`px-4 py-2 rounded-full text-[13px] font-semibold cursor-pointer transition-all ${
                    selectedTiers.includes(t.value) ? "text-white" : "bg-[#F1F5F9] text-[#64748B]"
                  }`}
                  style={selectedTiers.includes(t.value) ? { backgroundColor: t.color } : undefined}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Specific user */}
        {recipientType === "specific" && (
          <div>
            <label className="text-[13px] font-semibold text-[#0F172A] mb-1.5 block">Select User</label>
            <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)} className={`${inputClass} cursor-pointer`}>
              <option value="">Choose a user...</option>
              {mockUsers.map((u) => (
                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
              ))}
            </select>
          </div>
        )}

        {/* Type */}
        <div>
          <label className="text-[13px] font-semibold text-[#0F172A] mb-2 block">Type</label>
          <div className="flex gap-2 flex-wrap">
            {TYPE_CONFIG.map((t) => (
              <button
                key={t.value}
                onClick={() => setNotifType(t.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold cursor-pointer transition-all border-2 ${
                  notifType === t.value ? "bg-white" : "border-transparent bg-[#F1F5F9] text-[#64748B]"
                }`}
                style={notifType === t.value ? { borderColor: t.color, color: t.color } : undefined}
              >
                <span className="w-1 h-4 rounded-full" style={{ backgroundColor: notifType === t.value ? t.color : "#94A3B8" }} />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="text-[13px] font-semibold text-[#0F172A] mb-1.5 block">Title</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} placeholder="Notification title..." />
        </div>

        {/* Message */}
        <div>
          <label className="text-[13px] font-semibold text-[#0F172A] mb-1.5 block">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className={`${inputClass} min-h-[120px] resize-y`}
            placeholder="Write your message..."
            maxLength={500}
          />
          <p className="text-[11px] text-[#94A3B8] mt-1 text-right">{message.length}/500</p>
        </div>

        {/* Image attachment */}
        <div>
          <label className="text-[13px] font-semibold text-[#0F172A] mb-1.5 block">Image (optional)</label>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleImageSelect(e.target.files[0])}
          />
          {imagePreview ? (
            <div className="flex items-center gap-3 p-3 bg-[#F8FAFC] rounded-xl border border-[#E8ECF1]/60">
              <img src={imagePreview} alt="Preview" className="size-16 sm:size-20 rounded-lg object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-[#0F172A] truncate">{imageFile?.name}</p>
                <p className="text-[11px] text-[#94A3B8]">{imageFile ? `${(imageFile.size / 1024).toFixed(0)} KB` : ""}</p>
              </div>
              <button
                onClick={() => { setImagePreview(null); setImageFile(null); }}
                className="size-8 flex items-center justify-center rounded-lg hover:bg-[#FEF2F2] text-[#DC2626] cursor-pointer transition-colors flex-shrink-0"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-[#E2E8F0] rounded-xl text-[13px] text-[#94A3B8] hover:border-primary hover:text-primary cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">add_photo_alternate</span>
              Click to upload image
            </button>
          )}
        </div>

        {/* In-app notification preview (quick glance) */}
        {(title || message) && (
          <div>
            <label className="text-[13px] font-semibold text-[#0F172A] mb-2 block">In-app notification preview</label>
            <div className="bg-[#F8FAFC] rounded-xl p-4 border border-[#E8ECF1]/60">
              <div className="flex items-start gap-3">
                <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[16px] text-primary">campaign</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-[#0F172A]">{title || "Notification Title"}</p>
                  <p className="text-[13px] text-[#334155] mt-0.5">{message || "Your message will appear here..."}</p>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-[#94A3B8] mt-2">Click "Preview Email" below to see the full branded email version</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap justify-end gap-3 pt-3 border-t border-[#E8ECF1]/60">
          <button
            onClick={() => {
              if (!title.trim() || !message.trim()) {
                toast.error("Add a title and message to preview");
                return;
              }
              setPreviewOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 border border-[#E2E8F0] text-[#334155] text-sm font-semibold rounded-xl cursor-pointer hover:bg-[#F1F5F9] active:scale-[0.98] transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">visibility</span>
            Preview Email
          </button>
          <button
            onClick={() => { toast.success("Draft saved"); navigate("/broadcast"); }}
            className="px-6 py-2.5 border border-[#E2E8F0] text-[#334155] text-sm font-semibold rounded-xl cursor-pointer hover:bg-[#F1F5F9] active:scale-[0.98] transition-all"
          >
            Save Draft
          </button>
          <button
            onClick={handleSend}
            className="px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl cursor-pointer hover:brightness-[0.92] active:scale-[0.98] transition-all"
          >
            Send Broadcast
          </button>
        </div>
      </div>

      {/* Email preview — uses the current form state */}
      <EmailPreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        template="broadcast"
        sampleData={{ title: title || "Your broadcast title", message: message || "Your message content..." }}
        title="Preview — Broadcast Email"
      />
    </div>
  );
}
