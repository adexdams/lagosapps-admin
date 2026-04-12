import { useState, useCallback, useMemo } from "react";
import type { ReactNode } from "react";
import { AdminAuthContext } from "../hooks/useAdminAuth";
import type { AdminUser } from "../hooks/useAdminAuth";

const STORAGE_KEY = "lagosapps_admin_user";

function loadUser(): AdminUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveUser(user: AdminUser | null) {
  if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  else localStorage.removeItem(STORAGE_KEY);
}

export default function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(loadUser);

  const login = useCallback((email: string, _password: string) => {
    // Scaffolding: accept any email/password for now
    const existing = loadUser();
    if (existing) {
      setUser(existing);
      return true;
    }
    // Create a demo admin from the email
    const name = email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const newUser: AdminUser = {
      id: `ADM-${Date.now()}`,
      name,
      email,
      whatsappNumber: "",
      role: "super_admin",
      avatar: null,
    };
    setUser(newUser);
    saveUser(newUser);
    return true;
  }, []);

  const register = useCallback((name: string, email: string, _password: string) => {
    const newUser: AdminUser = {
      id: `ADM-${Date.now()}`,
      name,
      email,
      whatsappNumber: "",
      role: "super_admin",
      avatar: null,
    };
    setUser(newUser);
    saveUser(newUser);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    saveUser(null);
  }, []);

  const updateProfile = useCallback((updates: Partial<AdminUser>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      saveUser(updated);
      return updated;
    });
  }, []);

  const value = useMemo(() => ({
    user,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateProfile,
  }), [user, login, register, logout, updateProfile]);

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}
