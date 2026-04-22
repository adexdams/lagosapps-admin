import { Routes, Route, Navigate } from "react-router-dom";
import ToastProvider from "./components/ui/ToastProvider";
import AuthProvider from "./components/AuthProvider";
import AdminRoute from "./components/admin/AdminRoute";
import AdminLayout from "./components/admin/AdminLayout";
import LoginPage from "./components/admin/LoginPage";
import ErrorBoundary from "./components/ErrorBoundary";
import ConfigError from "./components/ConfigError";
import { supabaseConfigured } from "./lib/supabase";

export default function App() {
  // Fail loud and useful if env vars are missing (common on fresh Netlify deploy)
  if (!supabaseConfigured) {
    return <ConfigError />;
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/*"
              element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
