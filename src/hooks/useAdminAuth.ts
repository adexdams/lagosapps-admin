import { createContext, useContext } from "react";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  whatsappNumber: string;
  role: "super_admin" | "operations" | "support" | "finance";
  avatar: string | null;
}

export interface AdminAuthContextValue {
  user: AdminUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => boolean;
  register: (name: string, email: string, password: string) => void;
  logout: () => void;
  updateProfile: (updates: Partial<AdminUser>) => void;
}

export const AdminAuthContext = createContext<AdminAuthContextValue>({
  user: null,
  isAuthenticated: false,
  login: () => false,
  register: () => {},
  logout: () => {},
  updateProfile: () => {},
});

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}
