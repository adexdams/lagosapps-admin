import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "../../hooks/useToast";
import StatusBadge from "./shared/StatusBadge";
import {
  mockOrders,
  mockServiceRequests,
  formatNaira,
  formatDate,
  PORTAL_LABELS,
  PORTAL_COLORS,
  type Portal,
  type ServiceRequestStatus,
} from "../../data/adminMockData";

const TEAM_MEMBERS = [
  { id: "TM-001", name: "Damola A.", role: "Operations Lead", avatar: "DA" },
  { id: "TM-002", name: "Chioma E.", role: "Fulfillment Manager", avatar: "CE" },
  { id: "TM-003", name: "Kunle A.", role: "Field Agent", avatar: "KA" },
  { id: "TM-004", name: "Fatima B.", role: "Support Agent", avatar: "FB" },
  { id: "TM-005", name: "Emeka E.", role: "Logistics Lead", avatar: "EE" },
];

const STATUS_FLOW: ServiceRequestStatus[] = ["new", "reviewing", "scheduled", "in_progress", "completed"];

const inputClass = "w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm text-[#0F172A] outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all";
const card = "bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60";

const INITIAL_NOTES = [
  { id: "n1", author: "Damola A.", text: "Customer confirmed delivery window for Saturday morning.", date: "2026-04-10" },
  { id: "n2", author: "Chioma E.", text: "Vendor notified of special packaging request.", date: "2026-04-09" },
];

export default function FulfillmentDetail() {
  const { id, requestId } = useParams<{ id: string; requestId: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  // Determine if this is an order or a service request
  const isRequest = !!requestId;
  const order = !isRequest ? mockOrders.find((o) => o.id === id) : null;
  const request = isRequest ? mockServiceRequests.find((r) => r.id === requestId) : null;

  // ── Shared state ──
  const [assignee, setAssignee] = useState(isRequest ? (request?.assignedTo ?? "") : "TM-001");
  const [notes, setNotes] = useState(
    isRequest
      ? (request?.notes ?? []).map((n, i) => ({ id: `n${i}`, ...n }))
      : INITIAL_NOTES
  );
  const [newNote, setNewNote] = useState("");

  // ── Order-specific state ──
  const [responseDeadline, setResponseDeadline] = useState("2026-04-12");
  const [fulfillmentDeadline, setFulfillmentDeadline] = useState("2026-04-15");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [progress, setProgress] = useState(45);

  // ── Request-specific state ──
  const [reqStatus, setReqStatus] = useState<ServiceRequestStatus>(request?.status ?? "new");
  const [declineReason, setDeclineReason] = useState("");
  const [showDecline, setShowDecline] = useState(false);

  // Not found
  if (!order && !request) {
    return (
      <div className="text-center py-20">
        <p className="text-lg font-semibold text-[#0F172A]">{isRequest ? "Request" : "Order"} not found</p>
        <button onClick={() => navigate("/fulfillment")} className="text-primary text-sm font-semibold mt-2 cursor-pointer">Back to Fulfillment</button>
      </div>
    );
  }

  const portal = (isRequest ? request!.portal : order!.portal) as Portal;

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    setNotes((prev) => [{ id: `n${prev.length + 1}`, author: "Admin", text: newNote, date: new Date().toISOString().slice(0, 10) }, ...prev]);
    setNewNote("");
    toast.success("Note added");
  };

  // ── Order-specific helpers ──
  const riskLevel = priority === "high" ? "behind" : priority === "medium" ? "at_risk" : "on_track";
  const riskColors: Record<string, { bg: string; text: string }> = {
    on_track: { bg: "#ECFDF5", text: "#059669" },
    at_risk: { bg: "#FFF7ED", text: "#EA580C" },
    behind: { bg: "#FEF2F2", text: "#DC2626" },
  };

  const orderTimeline = order ? [
    { label: "Order Placed", date: order.createdAt, completed: true },
    { label: "Confirmed", date: order.updatedAt, completed: true },
    { label: "In Fulfillment", date: "2026-04-10", completed: true },
    { label: "Completed", date: null, completed: false },
  ] : [];

  // ── Request-specific helpers ──
  const requestTimeline = request ? [
    { label: "Submitted", date: request.createdAt, completed: true },
    { label: "Reviewing", date: STATUS_FLOW.indexOf(reqStatus) >= 1 ? request.updatedAt : null, completed: STATUS_FLOW.indexOf(reqStatus) >= 1 || reqStatus === "declined" },
    { label: "Scheduled", date: STATUS_FLOW.indexOf(reqStatus) >= 2 ? request.updatedAt : null, completed: STATUS_FLOW.indexOf(reqStatus) >= 2 },
    { label: "In Progress", date: STATUS_FLOW.indexOf(reqStatus) >= 3 ? request.updatedAt : null, completed: STATUS_FLOW.indexOf(reqStatus) >= 3 },
    { label: "Completed", date: reqStatus === "completed" ? request.updatedAt : null, completed: reqStatus === "completed" },
  ] : [];

  const timeline = isRequest ? requestTimeline : orderTimeline;

  const handleDecline = () => {
    if (!declineReason.trim()) return;
    setReqStatus("declined");
    setShowDecline(false);
    toast.success("Request declined");
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back */}
      <button onClick={() => navigate("/fulfillment")} className="inline-flex items-center gap-1 text-sm font-semibold text-[#64748B] hover:text-[#0F172A] cursor-pointer transition-colors">
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Back to Fulfillment
      </button>

      {/* Header card */}
      <div className={`${card} p-4 sm:p-6`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-lg font-bold text-[#0F172A]">{isRequest ? request!.id : order!.id}</h1>
              <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold text-white" style={{ backgroundColor: PORTAL_COLORS[portal] }}>
                {PORTAL_LABELS[portal].split(",")[0]}
              </span>
              {isRequest ? (
                <StatusBadge status={reqStatus.replace("_", " ")} />
              ) : (
                <StatusBadge status={order!.status} />
              )}
            </div>
            <p className="text-sm text-[#64748B]">
              {isRequest
                ? `${request!.typeLabel} — submitted ${formatDate(request!.createdAt)}`
                : `${order!.product} — ${formatNaira(order!.amount)} — Customer: ${order!.userName}`}
            </p>
          </div>
          {isRequest && (
            <div className="flex items-center gap-2">
              <button onClick={() => navigate("/orders/create")} className="px-3 py-2 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-primary/90 cursor-pointer">Convert to Order</button>
              {reqStatus !== "declined" && reqStatus !== "completed" && (
                <button onClick={() => setShowDecline(!showDecline)} className="px-3 py-2 rounded-xl text-sm font-semibold bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer">Decline</button>
              )}
            </div>
          )}
        </div>

        {showDecline && (
          <div className="mt-4 p-4 bg-red-50 rounded-xl space-y-3">
            <textarea value={declineReason} onChange={(e) => setDeclineReason(e.target.value)} placeholder="Reason for declining..." className={inputClass} rows={2} />
            <div className="flex gap-2">
              <button onClick={handleDecline} className="px-3 py-2 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-700 cursor-pointer">Confirm Decline</button>
              <button onClick={() => setShowDecline(false)} className="px-3 py-2 rounded-xl text-sm font-semibold text-[#64748B] hover:text-[#0F172A] cursor-pointer">Cancel</button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">

          {/* Request details (service requests only) */}
          {isRequest && request && (
            <div className={`${card} p-4 sm:p-6`}>
              <h2 className="text-[15px] font-bold text-[#0F172A] mb-4">Request Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(request.details).map(([key, value]) => (
                  <div key={key}>
                    <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wide mb-1">{key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}</p>
                    <p className="text-sm text-[#0F172A]">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className={`${card} p-4 sm:p-6`}>
            <h3 className="text-sm font-bold text-[#0F172A] mb-4">Timeline</h3>
            <div className="space-y-4">
              {timeline.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`size-8 rounded-full flex items-center justify-center flex-shrink-0 ${step.completed ? "bg-[#ECFDF5]" : "bg-[#F1F5F9]"}`}>
                    <span className={`material-symbols-outlined text-[16px] ${step.completed ? "text-[#059669]" : "text-[#94A3B8]"}`}>
                      {step.completed ? "check_circle" : "radio_button_unchecked"}
                    </span>
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${step.completed ? "text-[#0F172A]" : "text-[#94A3B8]"}`}>{step.label}</p>
                    {step.date && <p className="text-[12px] text-[#64748B]">{formatDate(step.date)}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Customer (service requests only) */}
          {isRequest && request && (
            <div className={`${card} p-4 sm:p-6`}>
              <h2 className="text-[15px] font-bold text-[#0F172A] mb-3">Customer</h2>
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-bold text-xs">
                  {request.userName.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#0F172A]">{request.userName}</p>
                  <button onClick={() => navigate(`/users/${request.userId}`)} className="text-xs text-primary font-semibold hover:underline cursor-pointer">View Profile</button>
                </div>
              </div>
            </div>
          )}

          {/* Notes (shared) */}
          <div className={`${card} p-4 sm:p-6`}>
            <h3 className="text-sm font-bold text-[#0F172A] mb-4">Internal Notes</h3>
            <div className="flex gap-2 mb-4">
              <input type="text" value={newNote} onChange={(e) => setNewNote(e.target.value)} className={`${inputClass} flex-1`} placeholder="Add a note..." onKeyDown={(e) => e.key === "Enter" && handleAddNote()} />
              <button onClick={handleAddNote} className="px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl cursor-pointer hover:brightness-[0.92] transition-all flex-shrink-0">Add</button>
            </div>
            <div className="space-y-3">
              {notes.map((note) => (
                <div key={note.id} className="flex gap-3 p-3 bg-[#F8FAFC] rounded-xl">
                  <div className="size-7 rounded-full bg-[#E2E8F0] flex items-center justify-center text-[10px] font-bold text-[#64748B] flex-shrink-0">{note.author.split(" ").map((w: string) => w[0]).join("")}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold text-[#0F172A]">{note.author}</span>
                      <span className="text-[11px] text-[#94A3B8]">{formatDate(note.date)}</span>
                    </div>
                    <p className="text-sm text-[#334155]">{note.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4 sm:space-y-6">
          {/* Assignment (shared) */}
          <div className={`${card} p-4 sm:p-6`}>
            <h3 className="text-sm font-bold text-[#0F172A] mb-3">Assignment</h3>
            <select value={assignee} onChange={(e) => { setAssignee(e.target.value); toast.success("Assignee updated"); }} className={`${inputClass} cursor-pointer`}>
              {isRequest && <option value="">Unassigned</option>}
              {TEAM_MEMBERS.map((m) => <option key={m.id} value={isRequest ? m.name : m.id}>{m.name} — {m.role}</option>)}
            </select>
          </div>

          {/* Status workflow (service requests only) */}
          {isRequest && (
            <div className={`${card} p-4 sm:p-6`}>
              <h3 className="text-sm font-bold text-[#0F172A] mb-3">Update Status</h3>
              <div className="space-y-2">
                {STATUS_FLOW.map((s) => (
                  <button key={s} onClick={() => { setReqStatus(s); toast.success(`Status updated to ${s.replace("_", " ")}`); }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${reqStatus === s ? "bg-primary/10 text-primary font-semibold" : "hover:bg-[#F1F5F9] text-[#334155]"}`}>
                    {s.replace("_", " ").replace(/^./, (c) => c.toUpperCase())}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* SLA Settings (orders only) */}
          {!isRequest && (
            <div className={`${card} p-4 sm:p-6 space-y-4`}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#0F172A]">SLA Settings</h3>
                <span className="inline-block px-2 py-0.5 rounded-lg text-[11px] font-semibold uppercase" style={{ backgroundColor: riskColors[riskLevel].bg, color: riskColors[riskLevel].text }}>
                  {riskLevel.replace("_", " ")}
                </span>
              </div>
              <div>
                <label className="text-[13px] font-semibold text-[#0F172A] mb-1.5 block">Response Deadline</label>
                <input type="date" value={responseDeadline} onChange={(e) => setResponseDeadline(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="text-[13px] font-semibold text-[#0F172A] mb-1.5 block">Fulfillment Deadline</label>
                <input type="date" value={fulfillmentDeadline} onChange={(e) => setFulfillmentDeadline(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="text-[13px] font-semibold text-[#0F172A] mb-1.5 block">Priority</label>
                <select value={priority} onChange={(e) => setPriority(e.target.value as "low" | "medium" | "high")} className={`${inputClass} cursor-pointer`}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <button onClick={() => toast.success("SLA settings updated")} className="w-full py-2.5 bg-primary text-white text-sm font-semibold rounded-xl cursor-pointer hover:brightness-[0.92] active:scale-[0.98] transition-all">
                Update SLA
              </button>
            </div>
          )}

          {/* Progress (orders only) */}
          {!isRequest && (
            <div className={`${card} p-4 sm:p-6`}>
              <h3 className="text-sm font-bold text-[#0F172A] mb-3">Progress</h3>
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[13px] text-[#64748B]">Completion</span>
                  <span className="text-sm font-bold text-[#0F172A]">{progress}%</span>
                </div>
                <div className="h-3 bg-[#F1F5F9] rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>
              <input type="range" min="0" max="100" value={progress} onChange={(e) => setProgress(parseInt(e.target.value))} className="w-full accent-primary cursor-pointer" />
              <button onClick={() => toast.success(`Progress updated to ${progress}%`)} className="w-full mt-3 py-2.5 bg-[#0F172A] text-white text-sm font-semibold rounded-xl cursor-pointer hover:bg-[#1E293B] active:scale-[0.98] transition-all">
                Update Progress
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
