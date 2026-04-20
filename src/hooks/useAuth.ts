import { createContext, useContext } from "react";
import type { User, Session } from "@supabase/supabase-js";

export interface AdminProfile {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  role: string;
  teamRole: string;
  privileges: Record<string, boolean>;
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  profile: AdminProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthState>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  signIn: async () => ({ error: "Not initialized" }),
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}
