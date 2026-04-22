export default function ConfigError() {
  return (
    <div className="min-h-screen bg-[#F5F6FA] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 p-6 sm:p-8 max-w-lg w-full">
        <div className="flex items-start gap-3 mb-4">
          <div className="size-10 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-[22px] text-orange-600">settings_alert</span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-[#0F172A]">Missing configuration</h1>
            <p className="text-sm text-[#64748B] mt-1">
              Supabase environment variables are not set. The admin dashboard needs these to connect to the database.
            </p>
          </div>
        </div>

        <div className="bg-[#F8FAFC] border border-[#E8ECF1] rounded-xl p-4 mb-4">
          <p className="text-[12px] font-semibold text-[#0F172A] mb-2">Required variables</p>
          <ul className="space-y-1 text-[12px] text-[#334155] font-mono">
            <li>VITE_SUPABASE_URL</li>
            <li>VITE_SUPABASE_ANON_KEY</li>
          </ul>
        </div>

        <div className="space-y-3 text-[13px] text-[#64748B]">
          <div>
            <p className="font-semibold text-[#334155] mb-1">Local development</p>
            <p>Add them to <code className="bg-[#F1F5F9] px-1.5 py-0.5 rounded text-[12px]">.env</code> in the repo root and restart the dev server.</p>
          </div>
          <div>
            <p className="font-semibold text-[#334155] mb-1">Netlify production</p>
            <p>Site settings → Build &amp; deploy → Environment variables → add both, then trigger a new deploy.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
