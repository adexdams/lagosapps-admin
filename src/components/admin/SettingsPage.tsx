import { useState } from "react";
import { useToast } from "../../hooks/useToast";
import { PORTAL_LABELS, PORTAL_COLORS, type Portal } from "../../data/adminMockData";

const PORTALS: Portal[] = ["solar", "transport", "groceries", "health", "events", "community", "logistics"];
const inputClass = "w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm text-[#0F172A] outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all";
const labelClass = "text-[13px] font-semibold text-[#0F172A] mb-1.5 block";
const card = "bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60";

export default function SettingsPage() {
  const toast = useToast();

  const [siteName, setSiteName] = useState("LagosApps");
  const [supportEmail, setSupportEmail] = useState("support@lagosapps.com");
  const [supportPhone, setSupportPhone] = useState("+234 800 123 4567");
  const [whatsappNumber, setWhatsappNumber] = useState("+234 800 123 4567");
  const [portalStates, setPortalStates] = useState<Record<Portal, boolean>>({
    solar: true, transport: true, groceries: true, health: true,
    events: true, community: false, logistics: true,
  });
  const [testMode, setTestMode] = useState(false);

  const handleSave = (section: string) => toast.success(`${section} saved successfully`);

  return (
    <div className="space-y-4 sm:space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-[#0F172A]">Settings</h1>
        <p className="text-sm text-[#64748B] mt-0.5">Platform configuration</p>
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
          <p className="text-xs text-[#64748B] mt-0.5">Disabled portals are hidden from the user dashboard</p>
        </div>
        <div className="p-3.5 sm:p-5 md:p-7 space-y-3">
          {PORTALS.map((portal) => (
            <div key={portal} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="size-3 rounded-full" style={{ backgroundColor: PORTAL_COLORS[portal] }} />
                <span className="text-sm font-medium text-[#0F172A]">{PORTAL_LABELS[portal]}</span>
              </div>
              <button
                onClick={() => setPortalStates((prev) => ({ ...prev, [portal]: !prev[portal] }))}
                className={`w-10 h-5.5 rounded-full p-0.5 transition-colors cursor-pointer ${portalStates[portal] ? "bg-primary" : "bg-[#E2E8F0]"}`}
              >
                <div className={`size-4.5 bg-white rounded-full shadow transition-transform ${portalStates[portal] ? "translate-x-4.5" : ""}`} />
              </button>
            </div>
          ))}
          <div className="flex justify-end pt-2">
            <button onClick={() => handleSave("Portal toggles")} className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl cursor-pointer hover:brightness-[0.92] transition-all">Save Changes</button>
          </div>
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
