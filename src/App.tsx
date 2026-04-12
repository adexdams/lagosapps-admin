import { Routes, Route, Navigate } from "react-router-dom";
import ToastProvider from "./components/ui/ToastProvider";
import AdminAuthProvider from "./components/AdminAuthProvider";
import { useAdminAuth } from "./hooks/useAdminAuth";
import AdminLayout from "./components/admin/AdminLayout";
import LoginPage from "./components/admin/LoginPage";
import SignupPage from "./components/admin/SignupPage";

function AuthGate() {
  const { isAuthenticated } = useAdminAuth();

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/signup" element={<Navigate to="/" replace />} />
      <Route path="/*" element={<AdminLayout />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AdminAuthProvider>
        <AuthGate />
      </AdminAuthProvider>
    </ToastProvider>
  );
}
