import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { useToast } from "../../hooks/useToast";

interface TemplateVariable {
  name: string;
  description: string;
}

interface EmailTemplate {
  key: string;
  label: string;
  description: string | null;
  subject: string;
  banner_url: string | null;
  heading: string;
  body_html: string;
  variables: TemplateVariable[] | null;
  is_active: boolean;
  updated_at: string;
}

const card = "bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60";
const inputClass = "w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm text-[#0F172A] outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all";
const labelClass = "text-[13px] font-semibold text-[#0F172A] mb-1.5 block";

export default function EmailTemplatesPage() {
  const toast = useToast();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selected, setSelected] = useState<EmailTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadTemplates();
    loadLogo();
  }, []);

  async function loadTemplates() {
    setLoading(true);
    const { data, error } = await supabase
      .from("email_templates")
      .select("*")
      .order("label");
    if (error) toast.error(error.message);
    else {
      setTemplates((data as EmailTemplate[]) ?? []);
      if (data && data.length > 0 && !selected) setSelected(data[0] as EmailTemplate);
    }
    setLoading(false);
  }

  async function loadLogo() {
    const { data } = await supabase
      .from("platform_settings")
      .select("value")
      .eq("key", "email_logo_url")
      .maybeSingle();
    if (data?.value) setLogoUrl(data.value as string);
  }

  async function saveTemplate() {
    if (!selected) return;
    setSaving(true);
    const { error } = await supabase
      .from("email_templates")
      .update({
        subject: selected.subject,
        heading: selected.heading,
        body_html: selected.body_html,
        banner_url: selected.banner_url,
      })
      .eq("key", selected.key);
    if (error) toast.error(error.message);
    else {
      toast.success(`${selected.label} saved`);
      setTemplates((prev) => prev.map((t) => (t.key === selected.key ? selected : t)));
    }
    setSaving(false);
  }

  async function uploadBanner(file: File) {
    if (!selected) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `banners/${selected.key}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("email-assets").upload(path, file, { upsert: true });
    if (upErr) {
      toast.error(upErr.message);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("email-assets").getPublicUrl(path);
    const url = data.publicUrl;
    setSelected({ ...selected, banner_url: url });
    await supabase.from("email_templates").update({ banner_url: url }).eq("key", selected.key);
    setTemplates((prev) => prev.map((t) => (t.key === selected.key ? { ...t, banner_url: url } : t)));
    toast.success("Banner uploaded");
    setUploading(false);
  }

  async function uploadLogo(file: File) {
    setUploadingLogo(true);
    const ext = file.name.split(".").pop();
    const path = `logo-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("email-assets").upload(path, file, { upsert: true });
    if (upErr) {
      toast.error(upErr.message);
      setUploadingLogo(false);
      return;
    }
    const { data } = supabase.storage.from("email-assets").getPublicUrl(path);
    const url = data.publicUrl;
    setLogoUrl(url);
    // Upsert platform setting
    const { error: updErr } = await supabase
      .from("platform_settings")
      .upsert({ key: "email_logo_url", value: url });
    if (updErr) toast.error(updErr.message);
    else toast.success("Logo updated — all emails now use this logo");
    setUploadingLogo(false);
  }

  async function sendTestEmail() {
    if (!selected) return;
    const { data: { session } } = await supabase.auth.getSession();
    const email = session?.user?.email;
    if (!email) {
      toast.error("No logged-in admin email to send test to");
      return;
    }

    // Sample data for each template
    const sampleData: Record<string, Record<string, string>> = {
      welcome: { name: "Test Admin", referralCode: "TEST01" },
      password_reset: { resetUrl: "https://lagosapps.com/reset?token=test" },
      order_confirmation: { name: "Test Admin", orderId: "ORD-TEST", total: "₦15,000" },
      wallet_topup: { amount: "₦50,000", newBalance: "₦125,000", reference: "TEST-REF-001" },
      membership_renewal: { tier: "Silver", daysRemaining: "7", expiresAt: "May 1, 2026", renewUrl: "https://lagosapps.com/renew" },
      broadcast: { title: "Test Broadcast", message: "This is a test broadcast message." },
    };

    toast.info("Sending test email...");
    const { data, error } = await supabase.functions.invoke("send-email", {
      body: {
        template: selected.key,
        to: email,
        data: sampleData[selected.key] ?? {},
      },
    });
    if (error || (data && (data as { error?: string }).error)) {
      toast.error((error?.message || (data as { error?: string }).error) ?? "Failed to send");
    } else {
      toast.success(`Test email sent to ${email}`);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-[#0F172A]">Email Templates</h1>
        <p className="text-sm text-[#64748B] mt-0.5">Edit transactional email content, banner images, and logo</p>
      </div>

      {/* Global logo */}
      <div className={`${card} p-4 sm:p-5`}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-[15px] font-bold text-[#0F172A]">Global Email Logo</h2>
            <p className="text-[13px] text-[#64748B] mt-0.5">Used in the header of every email — upload a new one to replace it everywhere</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="size-16 rounded-xl bg-[#F8FAFC] border border-[#E8ECF1] flex items-center justify-center overflow-hidden flex-shrink-0">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="max-h-12 max-w-12 object-contain" />
            ) : (
              <img src="/lagosapp-logo.webp" alt="Default logo" className="max-h-12 max-w-12 object-contain" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] text-[#64748B] truncate">{logoUrl || "Using default logo from repo"}</p>
            <div className="flex gap-2 mt-2">
              <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0])} />
              <button onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo} className="px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg cursor-pointer hover:brightness-[0.92] transition-all disabled:opacity-50">
                {uploadingLogo ? "Uploading..." : "Upload New Logo"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-[#94A3B8]">Loading templates...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Template list */}
          <div className="lg:col-span-1 space-y-2">
            <h3 className="text-[13px] font-bold text-[#64748B] uppercase tracking-wider mb-2">Templates</h3>
            {templates.map((t) => (
              <button
                key={t.key}
                onClick={() => setSelected(t)}
                className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                  selected?.key === t.key
                    ? "bg-primary/5 border-primary/30"
                    : "bg-white border-[#E8ECF1] hover:border-[#CBD5E1]"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className={`text-sm font-semibold ${selected?.key === t.key ? "text-primary" : "text-[#0F172A]"}`}>{t.label}</p>
                  {t.banner_url && <span className="text-[10px] text-[#059669] font-semibold">BANNER</span>}
                </div>
                <p className="text-[12px] text-[#64748B] truncate">{t.description}</p>
              </button>
            ))}
          </div>

          {/* Editor */}
          {selected && (
            <div className="lg:col-span-2 space-y-4">
              <div className={`${card} p-4 sm:p-5 space-y-4`}>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="text-[15px] font-bold text-[#0F172A]">{selected.label}</h3>
                  <div className="flex gap-2">
                    <button onClick={sendTestEmail} className="px-3 py-1.5 border border-[#E2E8F0] text-[#334155] text-xs font-semibold rounded-lg cursor-pointer hover:bg-[#F1F5F9] transition-all">
                      Send Test to Me
                    </button>
                    <button onClick={saveTemplate} disabled={saving} className="px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg cursor-pointer hover:brightness-[0.92] transition-all disabled:opacity-50">
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>

                {/* Banner */}
                <div>
                  <label className={labelClass}>Banner Image (optional)</label>
                  {selected.banner_url ? (
                    <div className="relative bg-[#F8FAFC] rounded-xl overflow-hidden border border-[#E8ECF1]">
                      <img src={selected.banner_url} alt="Banner" className="w-full h-32 object-cover" />
                      <button
                        onClick={() => setSelected({ ...selected, banner_url: null })}
                        className="absolute top-2 right-2 size-7 bg-white rounded-lg shadow flex items-center justify-center cursor-pointer hover:bg-red-50 text-red-500"
                        title="Remove banner"
                      >
                        <span className="material-symbols-outlined text-[16px]">close</span>
                      </button>
                    </div>
                  ) : (
                    <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadBanner(e.target.files[0])} />
                  )}
                  <button
                    onClick={() => bannerInputRef.current?.click()}
                    disabled={uploading}
                    className="mt-2 px-3 py-1.5 border border-[#E2E8F0] text-[#334155] text-xs font-semibold rounded-lg cursor-pointer hover:bg-[#F1F5F9] transition-all disabled:opacity-50"
                  >
                    {uploading ? "Uploading..." : selected.banner_url ? "Replace Banner" : "Upload Banner"}
                  </button>
                  <p className="text-[11px] text-[#94A3B8] mt-1.5">Recommended: 1200×400px, under 200KB</p>
                </div>

                {/* Subject */}
                <div>
                  <label className={labelClass}>Subject Line</label>
                  <input
                    type="text"
                    value={selected.subject}
                    onChange={(e) => setSelected({ ...selected, subject: e.target.value })}
                    className={inputClass}
                  />
                </div>

                {/* Heading */}
                <div>
                  <label className={labelClass}>Email Heading</label>
                  <input
                    type="text"
                    value={selected.heading}
                    onChange={(e) => setSelected({ ...selected, heading: e.target.value })}
                    className={inputClass}
                  />
                </div>

                {/* Body */}
                <div>
                  <label className={labelClass}>Body (HTML supported)</label>
                  <textarea
                    value={selected.body_html}
                    onChange={(e) => setSelected({ ...selected, body_html: e.target.value })}
                    className={`${inputClass} font-mono text-[12px]`}
                    rows={10}
                  />
                </div>

                {/* Variables reference */}
                {selected.variables && selected.variables.length > 0 && (
                  <div className="bg-[#EFF6FF] rounded-xl p-3">
                    <p className="text-[12px] font-semibold text-[#1E40AF] mb-2">Available variables (use with double braces: <code>{"{{name}}"}</code>)</p>
                    <div className="space-y-1">
                      {selected.variables.map((v) => (
                        <div key={v.name} className="text-[12px]">
                          <code className="bg-white px-1.5 py-0.5 rounded text-[#1E40AF] font-semibold">{`{{${v.name}}}`}</code>
                          <span className="text-[#64748B] ml-2">— {v.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-[11px] text-[#94A3B8]">Last updated: {new Date(selected.updated_at).toLocaleString("en-NG")}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
