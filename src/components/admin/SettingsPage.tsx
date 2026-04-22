import { useState, useRef, useEffect, useCallback } from "react";
import { useToast } from "../../hooks/useToast";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import { updateUser, logAudit, getNotificationPreferences, upsertNotificationPreference, getPortals, updatePortal } from "../../lib/api";
import { PORTAL_LABELS, PORTAL_COLORS, type Portal } from "../../data/adminMockData";

interface NotifPref {
  category: string;
  enabled: boolean;
  low_stock_threshold: number | null;
  large_transaction_threshold: number | null;
  overdue_hours_threshold: number | null;
  sla_risk_hours_threshold: number | null;
}

const ALERT_CATEGORIES: { key: string; label: string; description: string; icon: string; thresholdKey?: keyof NotifPref; thresholdLabel?: string; thresholdUnit?: string; thresholdDefault?: number }[] = [
  { key: "orders", label: "Orders", description: "New orders, status changes, overdue, cancellations", icon: "receipt_long", thresholdKey: "overdue_hours_threshold", thresholdLabel: "Alert when order pending for", thresholdUnit: "hours", thresholdDefault: 24 },
  { key: "fulfillment", label: "Fulfillment", description: "Tasks assigned to you, SLA at risk, overdue", icon: "assignment", thresholdKey: "sla_risk_hours_threshold", thresholdLabel: "Alert when fulfillment deadline is within", thresholdUnit: "hours", thresholdDefault: 12 },
  { key: "requests", label: "Service Requests", description: "New requests, assigned to you, overdue reviews", icon: "description" },
  { key: "inventory", label: "Inventory", description: "Low stock, out of stock", icon: "inventory_2", thresholdKey: "low_stock_threshold", thresholdLabel: "Notify when stock drops below", thresholdUnit: "units", thresholdDefault: 5 },
  { key: "wallet", label: "Wallet & Finance", description: "Large transactions, manual adjustments", icon: "account_balance_wallet", thresholdKey: "large_transaction_threshold", thresholdLabel: "Flag transactions above", thresholdUnit: "₦", thresholdDefault: 100000 },
  { key: "membership", label: "Membership", description: "New subscriptions, expiring, cancellations", icon: "card_membership" },
  { key: "team", label: "Team", description: "New members, role changes, privilege updates", icon: "people" },
  { key: "system", label: "System", description: "Settings changed, portal toggled, broadcasts sent", icon: "settings" },
];

const PORTALS: Portal[] = ["solar", "transport", "groceries", "health", "events", "community", "logistics"];
const inputClass = "w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm text-[#0F172A] outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all";
const labelClass = "text-[13px] font-semibold text-[#0F172A] mb-1.5 block";
const card = "bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60";

export default function SettingsPage() {
  const toast = useToast();
  const { user, profile } = useAuth();

  const [siteName, setSiteName] = useState("LagosApps");
  const [supportEmail, setSupportEmail] = useState("support@lagosapps.com");
  const [supportPhone, setSupportPhone] = useState("+234 800 123 4567");
  const [whatsappNumber, setWhatsappNumber] = useState("+234 800 123 4567");
  const [portalStates, setPortalStates] = useState<Record<Portal, boolean>>({
    solar: true, transport: true, groceries: true, health: true,
    events: true, community: true, logistics: true,
  });
  const [loadingPortals, setLoadingPortals] = useState(true);
  const [togglingPortal, setTogglingPortal] = useState<Portal | null>(null);
  const [testMode, setTestMode] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarRef = useRef<HTMLInputElement>(null);
  const [prefs, setPrefs] = useState<Record<string, NotifPref>>({});
  const [savingPref, setSavingPref] = useState<string | null>(null);

  const loadPrefs = useCallback(async () => {
    if (!user?.id) return;
    const { data } = await getNotificationPreferences(user.id);
    const map: Record<string, NotifPref> = {};
    for (const row of (data ?? []) as NotifPref[]) map[row.category] = row;
    setPrefs(map);
  }, [user?.id]);

  useEffect(() => { loadPrefs(); }, [loadPrefs]);

  async function saveAlertPref(category: string, update: Partial<NotifPref>) {
    if (!user?.id) return;
    setSavingPref(category);
    const existing = prefs[category] ?? {
      category,
      enabled: true,
      low_stock_threshold: null,
      large_transaction_threshold: null,
      overdue_hours_threshold: null,
      sla_risk_hours_threshold: null,
    };
    const merged = { ...existing, ...update };
    setPrefs((prev) => ({ ...prev, [category]: merged }));
    const { error } = await upsertNotificationPreference({
      admin_id: user.id,
      category,
      enabled: merged.enabled,
      low_stock_threshold: merged.low_stock_threshold,
      large_transaction_threshold: merged.large_transaction_threshold,
      overdue_hours_threshold: merged.overdue_hours_threshold,
      sla_risk_hours_threshold: merged.sla_risk_hours_threshold,
    });
    setSavingPref(null);
    if (error) toast.error(`Save failed: ${error.message}`);
  }

  // Load current avatar from profile on mount
  useEffect(() => {
    if (profile?.avatar_url) setAvatarUrl(profile.avatar_url);
  }, [profile]);

  // Load portal active states from DB on mount
  useEffect(() => {
    (async () => {
      const { data, error } = await getPortals();
      setLoadingPortals(false);
      if (error || !data) return;
      const states: Record<Portal, boolean> = { solar: true, transport: true, groceries: true, health: true, events: true, community: true, logistics: true };
      for (const p of data as { id: string; is_active: boolean }[]) {
        if (p.id in states) states[p.id as Portal] = p.is_active;
      }
      setPortalStates(states);
    })();
  }, []);

  async function handlePortalToggle(portal: Portal) {
    const next = !portalStates[portal];
    const prev = portalStates[portal];
    setTogglingPortal(portal);
    // Optimistic update
    setPortalStates((s) => ({ ...s, [portal]: next }));
    const { error } = await updatePortal(portal, { is_active: next });
    if (error) {
      // Rollback
      setPortalStates((s) => ({ ...s, [portal]: prev }));
      setTogglingPortal(null);
      toast.error(`Failed to toggle ${PORTAL_LABELS[portal]}: ${error.message}`);
      return;
    }
    await logAudit({
      action: "portal.toggle",
      entity_type: "service_portal",
      entity_id: portal,
      old_values: { is_active: prev },
      new_values: { is_active: next },
    });
    setTogglingPortal(null);
    toast.success(`${PORTAL_LABELS[portal]} ${next ? "enabled" : "disabled"}`);
  }

  const handleSave = (section: string) => toast.success(`${section} saved successfully`);

  async function handleAvatarChange(file: File) {
    if (!file.type.startsWith("image/")) { toast.error("Only image files allowed"); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error("Max 2MB file size"); return; }
    if (!user?.id) { toast.error("Not authenticated"); return; }

    setUploadingAvatar(true);
    const ext = file.name.split(".").pop() ?? "png";
    const path = `${user.id}/avatar.${ext}`;

    // Upload to avatars bucket (RLS enforces {user_id}/... path convention)
    const { error: uploadErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (uploadErr) {
      toast.error(`Upload failed: ${uploadErr.message}`);
      setUploadingAvatar(false);
      return;
    }

    // Get public URL (with cache-busting query so image refreshes immediately)
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const publicUrl = `${data.publicUrl}?t=${Date.now()}`;

    // Save to profile
    const { error: updateErr } = await updateUser(user.id, { avatar_url: publicUrl });
    if (updateErr) {
      toast.error(`Profile update failed: ${updateErr.message}`);
      setUploadingAvatar(false);
      return;
    }

    await logAudit({
      action: "profile.avatar_update",
      entity_type: "profile",
      entity_id: user.id,
    });

    setAvatarUrl(publicUrl);
    setUploadingAvatar(false);
    toast.success("Profile picture updated");
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-[#0F172A]">Settings</h1>
        <p className="text-sm text-[#64748B] mt-0.5">Platform configuration</p>
      </div>

      {/* Profile */}
      <div className={`${card} overflow-hidden`}>
        <div className="px-4 sm:px-5 py-3 border-b border-[#E8ECF1]/60">
          <h2 className="text-base font-bold text-[#0F172A]">Your Profile</h2>
        </div>
        <div className="p-3.5 sm:p-5 md:p-7">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            {/* Avatar */}
            <div className="relative group">
              <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleAvatarChange(e.target.files[0])} />
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile" className="size-20 sm:size-24 rounded-full object-cover" />
              ) : (
                <div className="size-20 sm:size-24 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white text-2xl sm:text-3xl font-bold">
                  {profile?.name ? profile.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() : "AD"}
                </div>
              )}
              <button
                onClick={() => !uploadingAvatar && avatarRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer disabled:cursor-not-allowed"
              >
                {uploadingAvatar ? (
                  <span className="size-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-white text-[24px]">photo_camera</span>
                )}
              </button>
            </div>
            {/* Info */}
            <div className="text-center sm:text-left">
              <p className="text-lg font-bold text-[#0F172A]">{profile?.name ?? "Admin"}</p>
              <p className="text-[13px] text-[#64748B]">{profile?.email ?? user?.email ?? ""}</p>
              <button
                onClick={() => !uploadingAvatar && avatarRef.current?.click()}
                disabled={uploadingAvatar}
                className="mt-2 text-[13px] font-semibold text-primary cursor-pointer hover:underline disabled:opacity-50"
              >
                {uploadingAvatar ? "Uploading..." : "Change photo"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Preferences */}
      <div className={`${card} overflow-hidden`}>
        <div className="px-4 sm:px-5 py-3 border-b border-[#E8ECF1]/60">
          <h2 className="text-base font-bold text-[#0F172A]">Alert Preferences</h2>
          <p className="text-xs text-[#64748B] mt-0.5">Configure which system notifications you receive and at what thresholds</p>
        </div>
        <div className="divide-y divide-[#F1F5F9]">
          {ALERT_CATEGORIES.map((cat) => {
            const pref = prefs[cat.key];
            const enabled = pref?.enabled ?? true;
            const currentThreshold = cat.thresholdKey ? (pref?.[cat.thresholdKey] as number | null) ?? cat.thresholdDefault ?? 0 : null;
            return (
              <div key={cat.key} className="px-4 sm:px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="size-9 rounded-lg bg-[#F1F5F9] flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-[18px] text-[#64748B]">{cat.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#0F172A]">{cat.label}</p>
                      <p className="text-[12px] text-[#64748B] mt-0.5">{cat.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => saveAlertPref(cat.key, { enabled: !enabled })}
                    disabled={savingPref === cat.key}
                    className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer flex-shrink-0 disabled:opacity-50 ${enabled ? "bg-primary" : "bg-[#E2E8F0]"}`}
                  >
                    <div className={`size-5 bg-white rounded-full shadow transition-transform ${enabled ? "translate-x-5" : ""}`} />
                  </button>
                </div>

                {/* Threshold config — only for categories with one */}
                {enabled && cat.thresholdKey && cat.thresholdLabel && (
                  <div className="mt-3 pl-12 flex items-center gap-2">
                    <label className="text-[12px] text-[#64748B]">{cat.thresholdLabel}</label>
                    <input
                      type="number"
                      value={currentThreshold ?? ""}
                      onChange={(e) => {
                        const n = e.target.value ? Number(e.target.value) : null;
                        saveAlertPref(cat.key, { [cat.thresholdKey as keyof NotifPref]: n } as Partial<NotifPref>);
                      }}
                      className="w-24 border border-[#E2E8F0] rounded-lg px-2 py-1 text-sm outline-none focus:border-primary"
                    />
                    <span className="text-[12px] font-semibold text-[#64748B]">{cat.thresholdUnit}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Platform Settings */}
      <div className={`${card} overflow-hidden`}>
        <div className="px-4 sm:px-5 py-3 border-b border-[#E8ECF1]/60">
          <h2 className="text-base font-bold text-[#0F172A]">Platform Settings</h2>
        </div>
        <div className="p-3.5 sm:p-5 md:p-7 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className={labelClass}>Site Name</label><input type="text" value={siteName} onChange={(e) => setSiteName(e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>Support Email</label><input type="email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>Support Phone</label><input type="text" value={supportPhone} onChange={(e) => setSupportPhone(e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>WhatsApp Number</label><input type="text" value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} className={inputClass} /></div>
          </div>
          <div className="flex justify-end">
            <button onClick={() => handleSave("Platform settings")} className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl cursor-pointer hover:brightness-[0.92] transition-all">Save Changes</button>
          </div>
        </div>
      </div>

      {/* Service Portal Toggles */}
      <div className={`${card} overflow-hidden`}>
        <div className="px-4 sm:px-5 py-3 border-b border-[#E8ECF1]/60">
          <h2 className="text-base font-bold text-[#0F172A]">Service Portal Toggles</h2>
          <p className="text-xs text-[#64748B] mt-0.5">Disabled portals immediately disappear from the user-facing app. Changes save automatically.</p>
        </div>
        <div className="p-3.5 sm:p-5 md:p-7 space-y-3">
          {loadingPortals ? (
            <p className="text-sm text-[#94A3B8] py-2">Loading portal states…</p>
          ) : (
            PORTALS.map((portal) => (
              <div key={portal} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="size-3 rounded-full flex-shrink-0" style={{ backgroundColor: PORTAL_COLORS[portal] }} />
                  <span className="text-sm font-medium text-[#0F172A] truncate">{PORTAL_LABELS[portal]}</span>
                  {!portalStates[portal] && (
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-600 flex-shrink-0">HIDDEN</span>
                  )}
                </div>
                <button
                  onClick={() => handlePortalToggle(portal)}
                  disabled={togglingPortal === portal}
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer flex-shrink-0 disabled:opacity-50 ${portalStates[portal] ? "bg-primary" : "bg-[#E2E8F0]"}`}
                  title={portalStates[portal] ? "Click to hide this portal from users" : "Click to show this portal to users"}
                >
                  <div className={`size-5 bg-white rounded-full shadow transition-transform ${portalStates[portal] ? "translate-x-5" : ""}`} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Payment Settings */}
      <div className={`${card} overflow-hidden`}>
        <div className="px-4 sm:px-5 py-3 border-b border-[#E8ECF1]/60">
          <h2 className="text-base font-bold text-[#0F172A]">Payment Settings</h2>
        </div>
        <div className="p-3.5 sm:p-5 md:p-7 space-y-5">
          <div>
            <label className={labelClass}>Paystack Public Key</label>
            <input type="password" defaultValue="pk_test_xxxxxxxxxxxxxxxxxxxxxxxxx" className={`${inputClass} font-mono`} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[#0F172A]">Test Mode</p>
              <p className="text-[12px] text-[#64748B]">Enable test mode for development</p>
            </div>
            <button
              onClick={() => setTestMode(!testMode)}
              className={`w-10 h-5.5 rounded-full p-0.5 transition-colors cursor-pointer ${testMode ? "bg-[#EA580C]" : "bg-[#E2E8F0]"}`}
            >
              <div className={`size-4.5 bg-white rounded-full shadow transition-transform ${testMode ? "translate-x-4.5" : ""}`} />
            </button>
          </div>
          <div className="flex justify-end">
            <button onClick={() => handleSave("Payment settings")} className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl cursor-pointer hover:brightness-[0.92] transition-all">Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  );
}
