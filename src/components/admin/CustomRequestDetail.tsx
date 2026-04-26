import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth";
import { getCustomRequestDetail, updateCustomRequestStatus, addCustomRequestNote } from "../../lib/api";
import { PORTAL_LABELS, PORTAL_COLORS, type Portal } from "../../data/adminMockData";

interface CRNote {
  id: string;
  text: string;
  created_at: string;
  profiles: { name: string | null } | null;
}

interface CustomRequest {
  id: string;
  user_id: string;
  portal_id: string;
  description: string;
  status: "new" | "under_review" | "converted" | "declined";
  decline_reason: string | null;
  converted_order_id: string | null;
  created_at: string;
  updated_at: string;
  profiles: { id: string; name: string | null; email: string; avatar_url: string | null } | null;
  custom_request_notes: CRNote[];
}

const STATUS_LABEL: Record<string, string> = { new: "New", under_review: "Under Review", converted: "Converted", declined: "Declined" };
const STATUS_COLOR: Record<string, string> = { new: "#2563EB", under_review: "#D97706", converted: "#059669", declined: "#DC2626" };

export default function CustomRequestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [request, setRequest] = useState<CustomRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>("");
  const [savingStatus, setSavingStatus] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const { data, error } = await getCustomRequestDetail(id);
    setLoading(false);
    if (error || !data) return;
    const r = data as CustomRequest;
    setRequest(r);
    setStatus(r.status);
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  async function handleSaveStatus() {
    if (!request || status === request.status) return;
    setSavingStatus(true);
    await updateCustomRequestStatus(request.id, { status });
    setRequest((r) => r ? { ...r, status: status as CustomRequest["status"] } : r);
    setSavingStatus(false);
  }

  async function handleAddNote() {
    if (!request || !noteText.trim() || !user?.id) return;
    setAddingNote(true);
    await addCustomRequestNote(request.id, user.id, noteText.trim());
    setNoteText("");
    // Re-fetch to get note with author name
    const { data } = await getCustomRequestDetail(request.id);
    if (data) setRequest(data as CustomRequest);
    setAddingNote(false);
  }

  if (loading) return <div className="text-center py-20 text-[#94A3B8]">Loading request…</div>;

  if (!request) return (
    <div className="text-center py-20">
      <p className="text-lg font-semibold text-[#0F172A]">Request not found</p>
      <button onClick={() => navigate("/orders")} className="text-primary text-sm font-semibold mt-2 cursor-pointer">
        Back to Orders
      </button>
    </div>
  );

  const customerName = request.profiles?.name ?? request.profiles?.email ?? "Unknown";
  const customerInitials = customerName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "??";

  return (
    <div className="space-y-5">
      {/* Back link */}
      <button
        onClick={() => navigate("/orders")}
        className="inline-flex items-center gap-1 text-sm font-semibold text-[#64748B] hover:text-[#0F172A] cursor-pointer transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Back to Orders
      </button>

      {/* Header card */}
      <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 p-5 md:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold text-[#6366F1] uppercase tracking-widest">{request.id}</span>
            <h1 className="text-xl font-bold text-[#0F172A] mt-0.5">Custom Request</h1>
            <p className="text-sm text-[#64748B] mt-0.5">
              {new Date(request.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              {" · "}
              <span className="flex-inline items-center gap-1">
                <span className="inline-block size-2 rounded-full align-middle mr-0.5" style={{ backgroundColor: PORTAL_COLORS[request.portal_id as Portal] ?? "#94A3B8" }} />
                {PORTAL_LABELS[request.portal_id as Portal] ?? request.portal_id}
              </span>
            </p>
          </div>
          <span
            className="inline-flex items-center px-3 py-1.5 rounded-full text-[12px] font-semibold"
            style={{ color: STATUS_COLOR[request.status], backgroundColor: STATUS_COLOR[request.status] + "18" }}
          >
            {STATUS_LABEL[request.status]}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-5">

          {/* Full request description */}
          <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 p-5 md:p-6">
            <h2 className="text-[13px] font-bold text-[#64748B] uppercase tracking-wide mb-3">Request Details</h2>
            <p className="text-[14px] text-[#334155] whitespace-pre-wrap leading-relaxed">{request.description}</p>
          </div>

          {/* Admin notes */}
          <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 p-5 md:p-6">
            <h2 className="text-[13px] font-bold text-[#64748B] uppercase tracking-wide mb-4">
              Admin Notes {request.custom_request_notes.length > 0 && <span className="ml-1 text-[#6366F1]">({request.custom_request_notes.length})</span>}
            </h2>

            {request.custom_request_notes.length === 0 ? (
              <p className="text-[13px] text-[#94A3B8] italic mb-4">No notes yet — add the first one below.</p>
            ) : (
              <div className="space-y-3 mb-4">
                {request.custom_request_notes.map((note) => (
                  <div key={note.id} className="bg-[#F8FAFC] rounded-xl p-3.5 border border-[#E8ECF1]">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[12px] font-semibold text-[#334155]">{note.profiles?.name ?? "Admin"}</span>
                      <span className="text-[11px] text-[#94A3B8]">
                        {new Date(note.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-[13px] text-[#334155]">{note.text}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void handleAddNote(); } }}
                placeholder="Add a note…"
                className="flex-1 text-[13px] border-2 border-[#E8ECF1] rounded-xl px-3 py-2.5 bg-white focus:border-primary focus:outline-none transition-colors"
              />
              <button
                onClick={() => void handleAddNote()}
                disabled={addingNote || !noteText.trim()}
                className="px-4 py-2.5 bg-[#6366F1] text-white text-[13px] font-semibold rounded-xl cursor-pointer hover:brightness-[0.92] disabled:opacity-50 transition-all"
              >
                {addingNote ? "…" : "Add"}
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">

          {/* Customer info */}
          <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 p-5">
            <h2 className="text-[13px] font-bold text-[#64748B] uppercase tracking-wide mb-3">Customer</h2>
            <div className="flex items-center gap-3">
              {request.profiles?.avatar_url ? (
                <img src={request.profiles.avatar_url} alt={customerName} className="size-10 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="size-10 rounded-full bg-gradient-to-br from-[#6366F1] to-[#6366F1]/70 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {customerInitials}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-[#0F172A] truncate">{customerName}</p>
                <p className="text-[12px] text-[#64748B] truncate">{request.profiles?.email ?? ""}</p>
              </div>
            </div>
            {request.profiles?.id && (
              <button
                onClick={() => navigate(`/users/${request.profiles!.id}`)}
                className="mt-3 w-full py-2 border border-[#E8ECF1] rounded-xl text-[13px] font-semibold text-[#334155] hover:bg-[#F8FAFC] transition-all cursor-pointer"
              >
                View Profile
              </button>
            )}
          </div>

          {/* Status management */}
          <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 p-5">
            <h2 className="text-[13px] font-bold text-[#64748B] uppercase tracking-wide mb-3">Status</h2>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full text-[13px] border-2 border-[#E8ECF1] rounded-xl px-3 py-2.5 bg-white text-[#334155] cursor-pointer focus:border-primary focus:outline-none transition-colors mb-3"
            >
              <option value="new">New</option>
              <option value="under_review">Under Review</option>
              <option value="converted">Converted</option>
              <option value="declined">Declined</option>
            </select>
            <button
              onClick={() => void handleSaveStatus()}
              disabled={savingStatus || status === request.status}
              className="w-full py-2.5 bg-primary text-white text-[13px] font-semibold rounded-xl cursor-pointer hover:brightness-[0.92] disabled:opacity-50 transition-all"
            >
              {savingStatus ? "Saving…" : "Update Status"}
            </button>

            {request.converted_order_id && (
              <button
                onClick={() => navigate(`/orders/${request.converted_order_id}`)}
                className="mt-2 w-full py-2.5 border border-[#E8ECF1] rounded-xl text-[13px] font-semibold text-[#334155] hover:bg-[#F8FAFC] transition-all cursor-pointer"
              >
                View Converted Order
              </button>
            )}
          </div>

          {/* Portal info */}
          <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 p-5">
            <h2 className="text-[13px] font-bold text-[#64748B] uppercase tracking-wide mb-3">Portal</h2>
            <div className="flex items-center gap-2.5">
              <span className="size-3 rounded-full flex-shrink-0" style={{ backgroundColor: PORTAL_COLORS[request.portal_id as Portal] ?? "#94A3B8" }} />
              <span className="text-[14px] font-semibold text-[#0F172A]">{PORTAL_LABELS[request.portal_id as Portal] ?? request.portal_id}</span>
            </div>
            <p className="text-[12px] text-[#94A3B8] mt-1.5">
              Submitted {new Date(request.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
