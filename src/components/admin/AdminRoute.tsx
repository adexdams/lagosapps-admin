import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export default function AdminRoute({ children }: Props) {
  const { user, profile, loading } = useAuth();

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F6FA] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-[#64748B]">Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in → redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but not admin → show access denied
  // (profile will be null if user.role !== 'admin')
  if (!profile) {
    return (
      <div className="min-h-screen bg-[#F5F6FA] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 p-8 max-w-sm text-center">
          <span className="material-symbols-outlined text-[48px] text-[#DC2626] mb-3 block">shield</span>
          <h1 className="text-lg font-bold text-[#0F172A] mb-2">Access Denied</h1>
          <p className="text-sm text-[#64748B] mb-4">Your account does not have admin privileges. Contact a super admin to request access.</p>
          <button
            onClick={() => { supabase.auth.signOut(); }}
            className="px-4 py-2 bg-[#0F172A] text-white text-sm font-semibold rounded-xl cursor-pointer hover:bg-[#1E293B] transition-all"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
