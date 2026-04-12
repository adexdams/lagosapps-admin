import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  size?: "sm" | "md" | "lg";
  title?: string;
  children: ReactNode;
}

const MAX_WIDTHS = { sm: 560, md: 720, lg: 960 };

export default function Modal({
  isOpen,
  onClose,
  size = "md",
  title,
  children,
}: ModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  // ESC to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Focus trap
  useEffect(() => {
    if (!isOpen || !contentRef.current) return;
    const el = contentRef.current;
    const focusable = el.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    first?.focus();

    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", trap);
    return () => document.removeEventListener("keydown", trap);
  }, [isOpen]);

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center"
      style={{ animation: "modal-backdrop-in 200ms ease-out" }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Desktop: centered modal */}
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
        className="relative bg-white rounded-xl hidden md:block"
        style={{
          maxWidth: MAX_WIDTHS[size],
          width: "90%",
          maxHeight: "85vh",
          animation: "modal-scale-in 200ms ease-out",
        }}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/15">
            <h2 id="modal-title" className="text-lg font-bold text-primary">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-outline hover:text-on-surface transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        )}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: "calc(85vh - 70px)" }}>
          {children}
        </div>
      </div>

      {/* Mobile: bottom sheet */}
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title-mobile" : undefined}
        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl md:hidden"
        style={{
          maxHeight: "90vh",
          animation: "sheet-slide-up 300ms ease-out",
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-outline-variant rounded-full" />
        </div>
        {title && (
          <div className="flex items-center justify-between px-6 py-3 border-b border-outline-variant/15">
            <h2
              id="modal-title-mobile"
              className="text-lg font-bold text-primary"
            >
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-outline hover:text-on-surface transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        )}
        <div className="p-4 sm:p-6 overflow-y-auto -webkit-overflow-scrolling-touch" style={{ maxHeight: "calc(90vh - 80px)", paddingBottom: "env(safe-area-inset-bottom, 16px)" }}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
