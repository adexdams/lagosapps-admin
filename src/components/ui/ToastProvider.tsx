import { useState, useCallback, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ToastContext, type Toast, type ToastType } from "../../hooks/useToast";

const AUTO_DISMISS: Record<ToastType, number | null> = {
  success: 4000,
  info: 6000,
  error: null,
  warning: null,
};

const BORDER_COLORS: Record<ToastType, string> = {
  success: "#1B5E20",
  error: "#B71C1C",
  warning: "#E65100",
  info: "#0D47A1",
};

const ICONS: Record<ToastType, string> = {
  success: "check_circle",
  error: "error",
  warning: "warning",
  info: "info",
};

const MAX_TOASTS = 3;

export default function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (type: ToastType, message: string) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const toast: Toast = { id, type, message };

      setToasts((prev) => {
        const next = [...prev, toast];
        return next.slice(-MAX_TOASTS);
      });

      const duration = AUTO_DISMISS[type];
      if (duration) {
        const timer = setTimeout(() => removeToast(id), duration);
        timersRef.current.set(id, timer);
      }
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      {createPortal(
        <div
          className="fixed z-[9999] flex flex-col gap-2 pointer-events-none"
          style={{
            bottom: "20px",
            left: "50%",
            transform: "translateX(-50%)",
          }}
          role="region"
          aria-label="Notifications"
        >
          {/* Mobile: bottom-center */}
          <div className="flex flex-col gap-2 md:hidden">
            {toasts.map((toast) => (
              <ToastItem
                key={toast.id}
                toast={toast}
                onDismiss={() => removeToast(toast.id)}
                mobile
              />
            ))}
          </div>
        </div>,
        document.body
      )}
      {createPortal(
        <div
          className="fixed z-[9999] hidden md:flex flex-col gap-2 pointer-events-none"
          style={{ top: "20px", right: "20px" }}
          role="region"
          aria-label="Notifications"
        >
          {toasts.map((toast) => (
            <ToastItem
              key={toast.id}
              toast={toast}
              onDismiss={() => removeToast(toast.id)}
            />
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

function ToastItem({
  toast,
  onDismiss,
  mobile,
}: {
  toast: Toast;
  onDismiss: () => void;
  mobile?: boolean;
}) {
  return (
    <div
      className="pointer-events-auto bg-white rounded-lg shadow-lg flex items-center gap-3 px-4 py-3 min-w-[300px] max-w-[420px]"
      style={{
        borderLeft: `4px solid ${BORDER_COLORS[toast.type]}`,
        animation: mobile
          ? "toast-slide-up 300ms ease-out"
          : "toast-slide-in 300ms ease-out",
      }}
      role="alert"
    >
      <span
        className="material-symbols-outlined text-[20px]"
        style={{ color: BORDER_COLORS[toast.type] }}
      >
        {ICONS[toast.type]}
      </span>
      <p className="text-sm flex-1 text-on-surface">{toast.message}</p>
      <button
        onClick={onDismiss}
        className="text-outline hover:text-on-surface transition-colors cursor-pointer"
        aria-label="Dismiss notification"
      >
        <span className="material-symbols-outlined text-[18px]">close</span>
      </button>
    </div>
  );
}
