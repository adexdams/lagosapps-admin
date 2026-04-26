import { useState, useRef, useEffect, useCallback } from "react";
import { useToast } from "../../hooks/useToast";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import { updateUser, logAudit, getNotificationPreferences, upsertNotificationPreference, getPortals, updatePortal, getSettings, updateSetting, upsertSetting } from "../../lib/api";
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

const SECTIONS = [
  { id: "profile", label: "Profile", icon: "person" },
  { id: "platform", label: "Platform", icon: "tune" },
  { id: "portals", label: "Portals", icon: "apps" },
  { id: "alerts", label: "Alerts", icon: "notifications" },
  { id: "payment", label: "Payment", icon: "payments" },
];

const inputClass = "w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm text-[#0F172A] outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all";
const labelClass = "text-[13px] font-semibold text-[#0F172A] mb-1.5 block";
const card = "bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60";

export default function SettingsPage() {
  const toast = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;
  const { user, profile } = useAuth();
  const [activeSection, setActiveSection] = useState("profile");

  // ── Profile ──
  const [displayName, setDisplayName] = useState("");
  const [displayPhone, setDisplayPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarRef = useRef<HTMLInputElement>(null);

  // ── Platform Settings ──
  const [siteName, setSiteName] = useState("LagosApps");
  const [supportEmail, setSupportEmail] = useState("support@lagosapps.com");
  const [supportPhone, setSupportPhone] = useState("+234 801 234 5678");
  const [whatsappNumber, setWhatsappNumber] = useState("+234 801 234 5678");
  const [referralDurationMonths, setReferralDurationMonths] = useState("6");
  const [referralMaxPerYear, setReferralMaxPerYear] = useState("2");
  const [slaHours, setSlaHours] = useState("48");
  const [slaWarningHours, setSlaWarningHours] = useState("12");
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  // ── Portals ──
  const [portalStates, setPortalStates] = useState<Record<Portal, boolean>>({
    solar: true, transport: true, groceries: true, health: true,
    events: true, community: true, logistics: true,
  });
  const [loadingPortals, setLoadingPortals] = useState(true);
  const [togglingPortal, setTogglingPortal] = useState<Portal | null>(null);

  // ── Payment ──
  const [testMode, setTestMode] = useState(false);

  // ── Alert Prefs ──
  const [prefs, setPrefs] = useState<Record<string, NotifPref>>({});
  const [savingPref, setSavingPref] = useState<string | null>(null);

  // Sync profile fields when profile loads
  useEffect(() => {
    if (profile?.name) setDisplayName(profile.name);
    if (profile?.phone) setDisplayPhone(profile.phone ?? "");
    if (profile?.avatar_url) setAvatarUrl(profile.avatar_url);
  }, [profile]);

  // Load platform settings from DB
  useEffect(() => {
    (async () => {
      const { data } = await getSettings();
      setLoadingSettings(false);
      if (!data) return;
      const map: Record<string, string> = {};
      for (const row of data as { key: string; value: string }[]) map[row.key] = row.value;
      if (map.site_name) setSiteName(map.site_name);
      if (map.support_email) setSupportEmail(map.support_email);
      if (map.support_phone) setSupportPhone(map.support_phone);
      if (map.whatsapp_number) setWhatsappNumber(map.whatsapp_number);
      if (map.paystack_test_mode) setTestMode(map.paystack_test_mode === "true");
      if (map.referral_duration_months) setReferralDurationMonths(map.referral_duration_months);
      if (map.referral_max_per_year) setReferralMaxPerYear(map.referral_max_per_year);
      if (map.sla_hours) setSlaHours(map.sla_hours);
      if (map.sla_warning_hours) setSlaWarningHours(map.sla_warning_hours);
    })();
  }, []);

  // Load portal active states
  useEffect(() => {
    (async () => {
      const { data } = await getPortals();
      setLoadingPortals(false);
      if (!data) return;
      const states: Record<Portal, boolean> = { solar: true, transport: true, groceries: true, health: true, events: true, community: true, logistics: true };
      for (const p of data as { id: string; is_active: boolean }[]) {
        if (p.id in states) states[p.id as Portal] = p.is_active;
      }
      setPortalStates(states);
    })();
  }, []);

  // Load alert prefs
  const loadPrefs = useCallback(async () => {
    if (!user?.id) return;
    const { data } = await getNotificationPreferences(user.id);
    const map: Record<string, NotifPref> = {};
    for (const row of (data ?? []) as NotifPref[]) map[row.category] = row;
    setPrefs(map);
  }, [user?.id]);

  useEffect(() => { loadPrefs(); }, [loadPrefs]);

  async function saveProfile() {
    if (!user?.id) return;
    setSavingProfile(true);
    const { error } = await updateUser(user.id, { name: displayName.trim(), phone: displayPhone.trim() });
    setSavingProfile(false);
    if (error) { toast.error(`Save failed: ${error.message}`); return; }
    await logAudit({ action: "profile.update", entity_type: "profile", entity_id: user.id });
    toast.success("Profile updated");
  }

  async function savePlatformSettings() {
    if (!user?.id) return;
    const dur = parseInt(referralDurationMonths, 10);
    const max = parseInt(referralMaxPerYear, 10);
    const sla = parseInt(slaHours, 10);
    const warn = parseInt(slaWarningHours, 10);
    if (isNaN(dur) || dur < 1 || dur > 24) { toast.error("Referral duration must be between 1 and 24 months"); return; }
    if (isNaN(max) || max < 1 || max > 20) { toast.error("Max referrals per year must be between 1 and 20"); return; }
    if (isNaN(sla) || sla < 1) { toast.error("SLA hours must be at least 1"); return; }
    if (isNaN(warn) || warn < 0 || warn >= sla) { toast.error("Warning threshold must be less than SLA hours"); return; }
    setSavingSettings(true);
    await Promise.all([
      updateSetting("site_name", siteName, user.id),
      updateSetting("support_email", supportEmail, user.id),
      updateSetting("support_phone", supportPhone, user.id),
      updateSetting("whatsapp_number", whatsappNumber, user.id),
      updateSetting("referral_duration_months", String(dur), user.id),
      updateSetting("referral_max_per_year", String(max), user.id),
      upsertSetting("sla_hours", String(sla), user.id),
      upsertSetting("sla_warning_hours", String(warn), user.id),
    ]);
    setSavingSettings(false);
    toast.success("Platform settings saved");
  }

  async function handlePortalToggle(portal: Portal) {
    const next = !portalStates[portal];
    const prev = portalStates[portal];
    setTogglingPortal(portal);
    setPortalStates((s) => ({ ...s, [portal]: next }));
    const { error } = await updatePortal(portal, { is_active: next });
    if (error) {
      setPortalStates((s) => ({ ...s, [portal]: prev }));
      setTogglingPortal(null);
      toast.error(`Failed to toggle ${PORTAL_LABELS[portal]}: ${error.message}`);
      return;
    }
    await logAudit({ action: "portal.toggle", entity_type: "service_portal", entity_id: portal, old_values: { is_active: prev }, new_values: { is_active: next } });
    setTogglingPortal(null);
    toast.success(`${PORTAL_LABELS[portal]} ${next ? "enabled" : "disabled"}`);
  }

  async function saveAlertPref(category: string, update: Partial<NotifPref>) {
    if (!user?.id) return;
    setSavingPref(category);
    const existing = prefs[category] ?? {
      category, enabled: true,
      low_stock_threshold: null, large_transaction_threshold: null,
      overdue_hours_threshold: null, sla_risk_hours_threshold: null,
    };
    const merged = { ...existing, ...update };
    setPrefs((prev) => ({ ...prev, [category]: merged }));
    const { error } = await upsertNotificationPreference({ admin_id: user.id, category, enabled: merged.enabled, low_stock_threshold: merged.low_stock_threshold, large_transaction_threshold: merged.large_transaction_threshold, overdue_hours_threshold: merged.overdue_hours_threshold, sla_risk_hours_threshold: merged.sla_risk_hours_threshold });
    setSavingPref(null);
    if (error) toast.error(`Save failed: ${error.message}`);
  }

  async function handleAvatarChange(file: File) {
    if (!file.type.startsWith("image/")) { toast.error("Only image files allowed"); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error("Max 2MB file size"); return; }
    if (!user?.id) { toast.error("Not authenticated"); return; }
    setUploadingAvatar(true);
    const ext = file.name.split(".").pop() ?? "png";
    const path = `${user.id}/avatar.${ext}`;
    const { error: uploadErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (uploadErr) { toast.error(`Upload failed: ${uploadErr.message}`); setUploadingAvatar(false); return; }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const publicUrl = `${data.publicUrl}?t=${Date.now()}`;
    const { error: updateErr } = await updateUser(user.id, { avatar_url: publicUrl });
    if (updateErr) { toast.error(`Profile update failed: ${updateErr.message}`); setUploadingAvatar(false); return; }
    await logAudit({ action: "profile.avatar_update", entity_type: "profile", entity_id: user.id });
    setAvatarUrl(publicUrl);
    setUploadingAvatar(false);
    toast.success("Profile picture updated");
  }

  function scrollToSection(id: string) {
    setActiveSection(id);
    document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="flex gap-6 items-start">
      {/* Sticky sidebar nav */}
      <nav className="hidden lg:flex flex-col gap-1 w-44 flex-shrink-0 sticky top-20 self-start">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => scrollToSection(s.id)}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all cursor-pointer text-left ${
              activeSection === s.id
                ? "bg-primary/8 text-primary font-semibold"
                : "text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#334155]"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{s.icon}</span>
            {s.label}
          </button>
        ))}
      </nav>

      {/* Main content */}
      <div className="flex-1 min-w-0 space-y-5">
        <div>
          <h1 className="text-xl font-bold text-[#0F172A]">Settings</h1>
          <p className="text-sm text-[#64748B] mt-0.5">Platform configuration and preferences</p>
        </div>

        {/* Profile */}
        <section id="section-profile" className={`${card} overflow-hidden`}>
          <div className="px-4 sm:px-5 py-3 border-b border-[#E8ECF1]/60 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-[#64748B]">person</span>
            <h2 className="text-base font-bold text-[#0F172A]">Your Profile</h2>
          </div>
          <div className="p-4 sm:p-6 space-y-5">
            {/* Avatar row */}
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <div className="relative group flex-shrink-0">
                <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleAvatarChange(e.target.files[0])} />
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="size-20 rounded-full object-cover" />
                ) : (
                  <div className="size-20 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white text-2xl font-bold">
                    {displayName ? displayName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() : (profile?.email ?? "AD").slice(0, 2).toUpperCase()}
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
              <div className="text-center sm:text-left">
                <p className="text-lg font-bold text-[#0F172A]">{displayName || profile?.email || "Admin"}</p>
                <p className="text-[13px] text-[#64748B]">{profile?.email ?? user?.email ?? ""}</p>
                <button
                  onClick={() => !uploadingAvatar && avatarRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="mt-1.5 text-[13px] font-semibold text-primary cursor-pointer hover:underline disabled:opacity-50"
                >
                  {uploadingAvatar ? "Uploading..." : "Change photo"}
                </button>
              </div>
            </div>

            {/* Name + phone edit */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your full name"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Phone</label>
                <input
                  type="text"
                  value={displayPhone}
                  onChange={(e) => setDisplayPhone(e.target.value)}
                  placeholder="+234..."
                  className={inputClass}
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={saveProfile}
                disabled={savingProfile}
                className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl cursor-pointer hover:brightness-[0.92] transition-all disabled:opacity-50"
              >
                {savingProfile ? "Saving…" : "Save Profile"}
              </button>
              <p className="text-[12px] text-[#94A3B8]">Name and photo appear in the top nav bar</p>
            </div>
          </div>
        </section>

        {/* Platform Settings */}
        <section id="section-platform" className={`${card} overflow-hidden`}>
          <div className="px-4 sm:px-5 py-3 border-b border-[#E8ECF1]/60 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-[#64748B]">tune</span>
            <h2 className="text-base font-bold text-[#0F172A]">Platform Settings</h2>
          </div>
          <div className="p-4 sm:p-6 space-y-5">
            {loadingSettings ? (
              <p className="text-sm text-[#94A3B8]">Loading…</p>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className={labelClass}>Site Name</label><input type="text" value={siteName} onChange={(e) => setSiteName(e.target.value)} className={inputClass} /></div>
                  <div><label className={labelClass}>Support Email</label><input type="email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} className={inputClass} /></div>
                  <div><label className={labelClass}>Support Phone</label><input type="text" value={supportPhone} onChange={(e) => setSupportPhone(e.target.value)} className={inputClass} /></div>
                  <div><label className={labelClass}>WhatsApp Number</label><input type="text" value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} className={inputClass} /></div>
                </div>
                <div className="border-t border-[#E8ECF1] pt-5">
                  <p className="text-[13px] font-bold text-[#0F172A] mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-[#64748B]">timer</span>
                    Fulfillment SLA
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Order SLA (hours)</label>
                      <input type="number" min="1" value={slaHours} onChange={(e) => setSlaHours(e.target.value)} className={inputClass} />
                      <p className="text-[11px] text-[#94A3B8] mt-1">Orders older than this are marked Behind SLA.</p>
                    </div>
                    <div>
                      <label className={labelClass}>At-risk threshold (hours before deadline)</label>
                      <input type="number" min="0" value={slaWarningHours} onChange={(e) => setSlaWarningHours(e.target.value)} className={inputClass} />
                      <p className="text-[11px] text-[#94A3B8] mt-1">Orders within this window before the SLA deadline are marked At Risk.</p>
                    </div>
                  </div>
                </div>
                <div className="border-t border-[#E8ECF1] pt-5">
                  <p className="text-[13px] font-bold text-[#0F172A] mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-[#64748B]">group_add</span>
                    Referral Programme
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Gift duration (months)</label>
                      <input type="number" min="1" max="24" value={referralDurationMonths} onChange={(e) => setReferralDurationMonths(e.target.value)} className={inputClass} />
                      <p className="text-[11px] text-[#94A3B8] mt-1">How many months new members receive free membership after using a referral code.</p>
                    </div>
                    <div>
                      <label className={labelClass}>Max referrals per year (per tier)</label>
                      <input type="number" min="1" max="20" value={referralMaxPerYear} onChange={(e) => setReferralMaxPerYear(e.target.value)} className={inputClass} />
                      <p className="text-[11px] text-[#94A3B8] mt-1">How many times a member can gift each tier per calendar year.</p>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button onClick={savePlatformSettings} disabled={savingSettings} className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl cursor-pointer hover:brightness-[0.92] transition-all disabled:opacity-50">
                    {savingSettings ? "Saving…" : "Save Changes"}
                  </button>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Service Portal Toggles */}
        <section id="section-portals" className={`${card} overflow-hidden`}>
          <div className="px-4 sm:px-5 py-3 border-b border-[#E8ECF1]/60 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-[#64748B]">apps</span>
            <div>
              <h2 className="text-base font-bold text-[#0F172A]">Service Portal Toggles</h2>
              <p className="text-[11px] text-[#94A3B8] mt-0.5">Disabled portals disappear from the user-facing app immediately.</p>
            </div>
          </div>
          <div className="p-4 sm:p-6 space-y-3">
            {loadingPortals ? (
              <p className="text-sm text-[#94A3B8]">Loading portal states…</p>
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
                  >
                    <div className={`size-5 bg-white rounded-full shadow transition-transform ${portalStates[portal] ? "translate-x-5" : ""}`} />
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Alert Preferences */}
        <section id="section-alerts" className={`${card} overflow-hidden`}>
          <div className="px-4 sm:px-5 py-3 border-b border-[#E8ECF1]/60 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-[#64748B]">notifications</span>
            <div>
              <h2 className="text-base font-bold text-[#0F172A]">Alert Preferences</h2>
              <p className="text-[11px] text-[#94A3B8] mt-0.5">Configure which system notifications you receive</p>
            </div>
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
        </section>

        {/* Payment Settings */}
        <section id="section-payment" className={`${card} overflow-hidden`}>
          <div className="px-4 sm:px-5 py-3 border-b border-[#E8ECF1]/60 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-[#64748B]">payments</span>
            <h2 className="text-base font-bold text-[#0F172A]">Payment Settings</h2>
          </div>
          <div className="p-4 sm:p-6 space-y-5">
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
                className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${testMode ? "bg-[#EA580C]" : "bg-[#E2E8F0]"}`}
              >
                <div className={`size-5 bg-white rounded-full shadow transition-transform ${testMode ? "translate-x-5" : ""}`} />
              </button>
            </div>
            <div className="flex justify-end">
              <button onClick={() => toast.success("Payment settings saved")} className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl cursor-pointer hover:brightness-[0.92] transition-all">
                Save Changes
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
