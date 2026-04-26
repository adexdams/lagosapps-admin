import { useState, useEffect } from "react";
import { previewEmail, type InlineTemplate } from "../../../lib/email";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  template: string;
  sampleData?: Record<string, unknown>;
  inlineTemplate?: InlineTemplate; // preview unsaved edits
  customSubject?: string;
  customHtml?: string;
  title?: string;
}

type ViewMode = "desktop" | "mobile";

export default function EmailPreviewModal({ isOpen, onClose, template, sampleData, inlineTemplate, customSubject, customHtml, title }: Props) {
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("desktop");

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const result = await previewEmail({
        template,
        data: sampleData,
        inlineTemplate,
        customSubject,
        customHtml,
      });
      if (cancelled) return;
      if ("error" in result) setError(result.error);
      else {
        setSubject(result.subject);
        setHtml(result.html);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, template, customSubject, customHtml, JSON.stringify(sampleData), JSON.stringify(inlineTemplate)]);

  // Close on ESC
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6" style={{ background: "rgba(15,23,42,0.6)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8ECF1] flex-shrink-0">
          <div className="flex-1 min-w-0">
            <h2 className="text-[15px] font-bold text-[#0F172A] truncate">{title || "Email Preview"}</h2>
            {subject && <p className="text-[12px] text-[#64748B] truncate mt-0.5"><span className="font-semibold">Subject:</span> {subject}</p>}
          </div>
          <div className="flex items-center gap-2 ml-3">
            {/* View mode toggle */}
            <div className="hidden sm:flex bg-[#F1F5F9] rounded-lg p-0.5">
              <button
                onClick={() => setViewMode("desktop")}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                  viewMode === "desktop" ? "bg-white text-[#0F172A] shadow-sm" : "text-[#64748B]"
                }`}
              >
                <span className="material-symbols-outlined text-[14px] align-middle mr-1">desktop_windows</span>
                Desktop
              </button>
              <button
                onClick={() => setViewMode("mobile")}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                  viewMode === "mobile" ? "bg-white text-[#0F172A] shadow-sm" : "text-[#64748B]"
                }`}
              >
                <span className="material-symbols-outlined text-[14px] align-middle mr-1">smartphone</span>
                Mobile
              </button>
            </div>
            <button
              onClick={onClose}
              className="size-8 flex items-center justify-center rounded-lg hover:bg-[#F1F5F9] cursor-pointer"
              title="Close (Esc)"
            >
              <span className="material-symbols-outlined text-[20px] text-[#64748B]">close</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-[#F1F5F9] p-4 sm:p-6 flex items-start justify-center">
          {loading ? (
            <div className="flex items-center justify-center w-full h-full">
              <div className="flex flex-col items-center gap-3">
                <div className="size-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-sm text-[#64748B]">Rendering preview...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 max-w-md">
              <p className="text-sm text-red-600 font-semibold mb-1">Preview failed</p>
              <p className="text-xs text-red-600">{error}</p>
            </div>
          ) : (
            <div
              className="bg-white rounded-xl shadow-lg overflow-hidden w-full transition-all"
              style={{ maxWidth: viewMode === "mobile" ? "375px" : "100%" }}
            >
              <iframe
                srcDoc={html}
                title="Email preview"
                sandbox="allow-same-origin allow-scripts"
                className="w-full border-0"
                style={{ height: "70vh", minHeight: "500px" }}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#E8ECF1] flex items-center justify-between flex-shrink-0">
          <p className="text-[11px] text-[#94A3B8]">Preview is rendered in an isolated iframe — same HTML recipients will receive</p>
          <button
            onClick={onClose}
            className="px-4 py-2 text-[13px] font-semibold text-[#64748B] hover:text-[#334155] cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
