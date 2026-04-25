import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError("Email is required"); return; }
    setError("");
    setInfo("");
    setLoading(true);
    const { error: mlErr } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    if (mlErr) setError(mlErr.message);
    else setInfo(`Magic link sent to ${email}. Check your inbox.`);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — brand/visual */}
      <div className="hidden lg:flex flex-col flex-1 relative overflow-hidden bg-[#0A2540]">
        {/* Civic Towers background image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/civic-towers.jpg')" }}
        />
        {/* Dark gradient overlay so text stays readable */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050f1c]/95 via-[#0A2540]/70 to-[#0A2540]/40" />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full px-12 py-10">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <img src="/lagosapp-logo.png" alt="LagosApps" className="h-9 w-auto brightness-[200%] saturate-0" />
            <span className="text-[11px] font-bold bg-white/10 text-white/80 px-2.5 py-0.5 rounded-md tracking-widest uppercase">
              Admin
            </span>
          </div>

          {/* Center copy */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="max-w-sm">
              {/* Stat pills */}
              <div className="flex flex-wrap gap-2 mb-8">
                {[
                  { icon: "group", label: "Users" },
                  { icon: "receipt_long", label: "Orders" },
                  { icon: "payments", label: "Finance" },
                  { icon: "analytics", label: "Analytics" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-1.5 bg-white/8 border border-white/10 rounded-full px-3 py-1.5">
                    <span className="material-symbols-outlined text-[14px] text-white/60">{item.icon}</span>
                    <span className="text-[12px] font-semibold text-white/70">{item.label}</span>
                  </div>
                ))}
              </div>

              <h1 className="text-4xl font-black text-white leading-tight mb-4">
                Run the entire<br />
                <span className="text-primary">LagosApps</span><br />
                platform.
              </h1>
              <p className="text-[15px] text-white/50 leading-relaxed">
                Manage users, orders, inventory, memberships, wallet, analytics — all from one place.
              </p>
            </div>
          </div>

          {/* Footer */}
          <p className="text-[12px] text-white/25">
            © {new Date().getFullYear()} LagosApps · Restricted access
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 lg:max-w-[480px] flex flex-col items-center justify-center bg-[#F5F6FA] px-6 py-12">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-10">
          <img src="/lagosapp-logo.png" alt="LagosApps" className="h-9 w-auto" />
          <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-md tracking-widest uppercase">Admin</span>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-black text-[#0F172A]">Sign in</h2>
            <p className="text-sm text-[#64748B] mt-1">
              We'll email you a one-time magic link — no password needed.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] border border-[#E8ECF1]/60 p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                  <p className="text-sm text-red-600 font-medium">{error}</p>
                </div>
              )}

              {info ? (
                <div className="py-6 text-center space-y-3">
                  <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <span className="material-symbols-outlined text-[28px] text-primary">mark_email_read</span>
                  </div>
                  <p className="text-sm font-bold text-[#0F172A]">Check your inbox</p>
                  <p className="text-[13px] text-[#64748B]">
                    A sign-in link was sent to <span className="font-semibold text-[#0F172A]">{email}</span>.
                    Click it to access the dashboard.
                  </p>
                  <button
                    type="button"
                    onClick={() => { setInfo(""); setEmail(""); }}
                    className="text-[13px] font-semibold text-primary hover:underline cursor-pointer"
                  >
                    Use a different email
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-[13px] font-semibold text-[#0F172A] mb-1.5 block">Email address</label>
                    <div className="relative">
                      <span className="material-symbols-outlined text-[18px] text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2">mail</span>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@lagosapps.com"
                        className="w-full border border-[#E2E8F0] rounded-xl pl-10 pr-3 py-2.5 text-sm text-[#0F172A] outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                        autoComplete="email"
                        autoFocus
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-primary text-white text-sm font-semibold rounded-xl cursor-pointer hover:brightness-[0.92] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="inline-flex items-center gap-2 justify-center">
                        <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending link…
                      </span>
                    ) : (
                      "Email Me a Magic Link"
                    )}
                  </button>
                </>
              )}
            </form>
          </div>

          <p className="text-center text-[12px] text-[#94A3B8] mt-6">
            Admin access only · <a href="https://lagosapps.com/" className="hover:underline">Back to site</a>
          </p>
        </div>
      </div>
    </div>
  );
}
