import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";

type Mode = "password" | "magic_link";

export default function LoginPage() {
  const { signIn } = useAuth();
  const [mode, setMode] = useState<Mode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Email and password are required");
      return;
    }
    setError("");
    setInfo("");
    setLoading(true);
    const result = await signIn(email, password);
    if (result.error) setError(result.error);
    setLoading(false);
  };

  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    setError("");
    setInfo("");
    setLoading(true);
    const { error: mlErr } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      },
    });
    if (mlErr) setError(mlErr.message);
    else setInfo(`Magic link sent to ${email}. Check your inbox.`);
    setLoading(false);
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setError("");
    setInfo("");
  };

  return (
    <div className="min-h-screen bg-[#F5F6FA] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2.5 mb-3">
            <img src="/lagosapp-logo.png" alt="LagosApps" className="h-10 w-auto" />
            <span className="text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-md tracking-wide uppercase">Admin</span>
          </div>
          <p className="text-sm text-[#64748B]">Sign in to the admin dashboard</p>
        </div>

        {/* Login card */}
        <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 p-6 sm:p-8">
          {/* Mode tabs */}
          <div className="flex gap-1 bg-[#F1F5F9] rounded-xl p-1 mb-6">
            <button
              type="button"
              onClick={() => switchMode("password")}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                mode === "password" ? "bg-white text-[#0F172A] shadow-sm" : "text-[#64748B] hover:text-[#334155]"
              }`}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => switchMode("magic_link")}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                mode === "magic_link" ? "bg-white text-[#0F172A] shadow-sm" : "text-[#64748B] hover:text-[#334155]"
              }`}
            >
              Magic Link
            </button>
          </div>

          <form onSubmit={mode === "password" ? handlePasswordSubmit : handleMagicLinkSubmit} className="space-y-5">
            {/* Error */}
            {error && (
              <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                <p className="text-sm text-red-600 font-medium">{error}</p>
              </div>
            )}

            {/* Info (magic link sent) */}
            {info && (
              <div className="p-3 bg-green-50 rounded-xl border border-green-100">
                <p className="text-sm text-green-700 font-medium">{info}</p>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="text-[13px] font-semibold text-[#0F172A] mb-1.5 block">Email</label>
              <div className="relative">
                <span className="material-symbols-outlined text-[18px] text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2">mail</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@lagosapps.com"
                  className="w-full border border-[#E2E8F0] rounded-xl pl-10 pr-3 py-2.5 text-sm text-[#0F172A] outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  autoComplete="email"
                  autoFocus
                />
              </div>
            </div>

            {/* Password (only in password mode) */}
            {mode === "password" && (
              <div>
                <label className="text-[13px] font-semibold text-[#0F172A] mb-1.5 block">Password</label>
                <div className="relative">
                  <span className="material-symbols-outlined text-[18px] text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2">lock</span>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full border border-[#E2E8F0] rounded-xl pl-10 pr-10 py-2.5 text-sm text-[#0F172A] outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B] cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">{showPassword ? "visibility_off" : "visibility"}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Magic link explainer */}
            {mode === "magic_link" && (
              <div className="flex items-start gap-2 p-3 bg-[#EFF6FF] rounded-xl">
                <span className="material-symbols-outlined text-[18px] text-[#2563EB] flex-shrink-0 mt-0.5">info</span>
                <p className="text-[12px] text-[#1E40AF]">
                  We'll email you a one-time sign-in link. No password needed — click the link and you're in.
                </p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary text-white text-sm font-semibold rounded-xl cursor-pointer hover:brightness-[0.92] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {mode === "password" ? "Signing in..." : "Sending link..."}
                </span>
              ) : (
                mode === "password" ? "Sign In" : "Email Me a Magic Link"
              )}
            </button>

            {/* Forgot password (password mode only) */}
            {mode === "password" && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={async () => {
                    if (!email.trim()) {
                      setError("Enter your email first");
                      return;
                    }
                    setError("");
                    setLoading(true);
                    const { error: fpErr } = await supabase.auth.resetPasswordForEmail(email, {
                      redirectTo: `${window.location.origin}/login`,
                    });
                    if (fpErr) setError(fpErr.message);
                    else setInfo(`Password reset link sent to ${email}`);
                    setLoading(false);
                  }}
                  className="text-[12px] font-semibold text-primary hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
            )}
          </form>
        </div>

        <p className="text-center text-[12px] text-[#94A3B8] mt-6">LagosApps Admin Dashboard</p>
      </div>
    </div>
  );
}
