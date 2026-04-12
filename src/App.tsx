import { Routes, Route, Navigate } from "react-router-dom";
import ToastProvider from "./components/ui/ToastProvider";
import AdminLayout from "./components/admin/AdminLayout";

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/*" element={<AdminLayout />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ToastProvider>
  );
}
