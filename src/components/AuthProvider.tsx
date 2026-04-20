import { useState, useEffect, useCallback, type ReactNode } from "react";
import { supabase } from "../lib/supabase";
import { AuthContext, type AdminProfile } from "../hooks/useAuth";
import type { User, Session } from "@supabase/supabase-js";

interface Props {
  children: ReactNode;
}

export default function AuthProvider({ children }: Props) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string) => {
    // Load user profile
    const { data: userData } = await supabase
      .from("users")
      .select("id, name, email, avatar_url, role")
      .eq("id", userId)
      .single();

    if (!userData || userData.role !== "admin") {
      setProfile(null);
      return;
    }

    // Load team member info + privileges
    const { data: teamData } = await supabase
      .from("admin_team_members")
      .select("role, admin_team_privileges(privilege_key, enabled)")
      .eq("user_id", userId)
      .single();

    const privileges: Record<string, boolean> = {};
    if (teamData?.admin_team_privileges) {
      (teamData.admin_team_privileges as { privilege_key: string; enabled: boolean }[]).forEach((p) => {
        privileges[p.privilege_key] = p.enabled;
      });
    }

    setProfile({
      id: userData.id,
      name: userData.name,
      email: userData.email,
      avatar_url: userData.avatar_url,
      role: userData.role,
      teamRole: teamData?.role ?? "support",
      privileges,
    });
  }, []);

  useEffect(() => {
    // Check existing session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        loadProfile(s.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        loadProfile(s.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
