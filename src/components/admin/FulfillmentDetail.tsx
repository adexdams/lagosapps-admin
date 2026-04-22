import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "../../hooks/useToast";
import StatusBadge from "./shared/StatusBadge";
import {
  getOrder,
  getFulfillmentTrackingByOrder,
  upsertFulfillmentTracking,
  addFulfillmentNote,
  getServiceRequest,
  updateServiceRequest,
  addServiceRequestNote,
  logAudit,
} from "../../lib/api";
import { supabase } from "../../lib/supabase";
import {
  formatNaira,
  formatDate,
  PORTAL_LABELS,
  PORTAL_COLORS,
  type Portal,
} from "../../data/adminMockData";

type ServiceRequestStatus =
  | "new"
  | "reviewing"
  | "scheduled"
  | "in_progress"
  | "completed"
  | "declined";

interface DbOrder {
  id: string;
  user_id: string;
  portal_id: Portal;
  description: string | null;
  total_amount: number;
  status: string;
  created_at: string;
  updated_at: string;
  profiles: { id: string; name: string | null; email: string } | null;
  order_items: Array<{ id: string; product_name: string; quantity: number; unit_price: number; total_price: number }>;
  order_timeline: Array<{ id: string; step_label: string; completed: boolean; completed_at: string | null; sort_order: number }>;
}

interface DbFulfillmentNote {
  id: string;
  author_id: string;
  text: string;
  created_at: string;
  profiles: { name: string | null } | null;
}

interface DbFulfillmentTracking {
  id: string;
  order_id: string;
  assigned_to: string | null;
  risk_level: "on_track" | "at_risk" | "behind";
  priority: "low" | "medium" | "high";
  progress: number;
  response_deadline: string | null;
  fulfillment_deadline: string | null;
  fulfillment_notes: DbFulfillmentNote[];
}

interface DbServiceRequestNote {
  id: string;
  author_id: string;
  text: string;
  created_at: string;
}

interface DbServiceRequest {
  id: string;
  user_id: string;
  portal_id: Portal;
  type: string;
  type_label: string;
  status: ServiceRequestStatus;
  assigned_to: string | null;
  details: Record<string, unknown>;
  decline_reason: string | null;
  created_at: string;
  updated_at: string;
  service_request_notes: DbServiceRequestNote[];
}

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  profiles: { name: string | null; email: string } | null;
}

const STATUS_FLOW: ServiceRequestStatus[] = ["new", "reviewing", "scheduled", "in_progress", "completed"];

const inputClass = "w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm text-[#0F172A] outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all";
const card = "bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60";

export default function FulfillmentDetail() {
  const { id, requestId } = useParams<{ id: string; requestId: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const isRequest = !!requestId;

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  // Order mode
  const [order, setOrder] = useState<DbOrder | null>(null);
  const [tracking, setTracking] = useState<DbFulfillmentTracking | null>(null);
  const [assignee, setAssignee] = useState("");
  const [responseDeadline, setResponseDeadline] = useState("");
  const [fulfillmentDeadline, setFulfillmentDeadline] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [progress, setProgress] = useState(0);
  const [riskLevel, setRiskLevel] = useState<"on_track" | "at_risk" | "behind">("on_track");

  // Request mode
  const [request, setRequest] = useState<DbServiceRequest | null>(null);
  const [reqStatus, setReqStatus] = useState<ServiceRequestStatus>("new");
  const [reqAssignee, setReqAssignee] = useState<string>("");
  const [declineReason, setDeclineReason] = useState("");
  const [showDecline, setShowDecline] = useState(false);

  // Shared notes UI
  const [newNote, setNewNote] = useState("");

  const loadTeam = useCallback(async () => {
    const { data } = await supabase
      .from("admin_team_members")
      .select("id, user_id, role, profiles(name, email)")
      .eq("is_active", true);
    setTeamMembers((data as unknown as TeamMember[]) ?? []);
  }, []);

  const loadCurrentUser = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    setCurrentUserId(data.user?.id ?? null);
  }, []);

  const loadOrderData = useCallback(async (orderId: string) => {
    setLoading(true);
    const [{ data: orderData, error: orderErr }, { data: trackData }] = await Promise.all([
      getOrder(orderId),
      getFulfillmentTrackingByOrder(orderId),
    ]);
    setLoading(false);
    if (orderErr || !orderData) { setNotFound(true); return; }
    const o = orderData as unknown as DbOrder;
    setOrder(o);
    if (trackData) {
      const t = trackData as unknown as DbFulfillmentTracking;
      setTracking(t);
      setAssignee(t.assigned_to ?? "");
      setResponseDeadline(t.response_deadline ?? "");
      setFulfillmentDeadline(t.fulfillment_deadline ?? "");
      setPriority(t.priority);
      setProgress(t.progress);
      setRiskLevel(t.risk_level);
    }
  }, []);

  const loadRequestData = useCallback(async (reqId: string) => {
    setLoading(true);
    const { data, error } = await getServiceRequest(reqId);
    setLoading(false);
    if (error || !data) { setNotFound(true); return; }
    const r = data as unknown as DbServiceRequest;
    setRequest(r);
    setReqStatus(r.status);
    setReqAssignee(r.assigned_to ?? "");
    setDeclineReason(r.decline_reason ?? "");
  }, []);

  useEffect(() => {
    loadTeam();
    loadCurrentUser();
    if (isRequest && requestId) loadRequestData(requestId);
    else if (id) loadOrderData(id);
  }, [id, requestId, isRequest, loadTeam, loadCurrentUser, loadOrderData, loadRequestData]);

  if (loading) {
    return <div className="py-16 text-center text-sm text-[#94A3B8]">Loading…</div>;
  }

  if (notFound) {
    return (
      <div className="text-center py-20">
        <p className="text-lg font-semibold text-[#0F172A]">{isRequest ? "Request" : "Order"} not found</p>
        <button onClick={() => navigate("/fulfillment")} className="text-primary text-sm font-semibold mt-2 cursor-pointer">Back to Fulfillment</button>
      </div>
    );
  }

  const portal: Portal = (isRequest ? request!.portal_id : order!.portal_id) as Portal;
  const portalLabel = PORTAL_LABELS[portal] ?? portal;
  const portalColor = PORTAL_COLORS[portal] ?? "#64748B";

  function teamMemberName(userId: string | null): string {
    if (!userId) return "Unassigned";
    const m = teamMembers.find((t) => t.user_id === userId);
    return m?.profiles?.name ?? m?.profiles?.email ?? "—";
  }

  // ── Shared: add note ─────────────────────────────
  async function handleAddNote() {
    if (!newNote.trim() || !currentUserId) return;
    if (isRequest && request) {
      const { error } = await addServiceRequestNote({
        request_id: request.id,
        author_id: currentUserId,
        text: newNote.trim(),
      });
      if (error) { toast.error(error.message); return; }
      setNewNote("");
      toast.success("Note added");
      loadRequestData(request.id);
    } else if (order) {
      const { error } = await addFulfillmentNote({
        order_id: order.id,
        author_id: currentUserId,
        text: newNote.trim(),
      });
      if (error) { toast.error(error.message); return; }
      setNewNote("");
      toast.success("Note added");
      loadOrderData(order.id);
    }
  }

  // ── Order-mode handlers ─────────────────────────
  async function handleSaveSLA() {
    if (!order) return;
    const { error } = await upsertFulfillmentTracking({
      order_id: order.id,
      assigned_to: assignee || null,
      risk_level: riskLevel,
      priority,
      progress,
      response_deadline: responseDeadline || null,
      fulfillment_deadline: fulfillmentDeadline || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("SLA settings updated");
    logAudit({ action: "fulfillment.sla_update", entity_type: "order", entity_id: order.id, new_values: { priority, risk_level: riskLevel, response_deadline: responseDeadline, fulfillment_deadline: fulfillmentDeadline } });
    loadOrderData(order.id);
  }

  async function handleSaveProgress() {
    if (!order) return;
    const { error } = await upsertFulfillmentTracking({
      order_id: order.id,
      assigned_to: assignee || null,
      risk_level: riskLevel,
      priority,
      progress,
      response_deadline: responseDeadline || null,
      fulfillment_deadline: fulfillmentDeadline || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success(`Progress updated to ${progress}%`);
    logAudit({ action: "fulfillment.progress_update", entity_type: "order", entity_id: order.id, new_values: { progress } });
    loadOrderData(order.id);
  }

  async function handleAssignOrder(userId: string) {
    if (!order) return;
    setAssignee(userId);
    const { error } = await upsertFulfillmentTracking({
      order_id: order.id,
      assigned_to: userId || null,
      risk_level: riskLevel,
      priority,
      progress,
      response_deadline: responseDeadline || null,
      fulfillment_deadline: fulfillmentDeadline || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Assignee updated");
    logAudit({ action: "fulfillment.assign", entity_type: "order", entity_id: order.id, new_values: { assigned_to: userId } });
  }

  // ── Request-mode handlers ───────────────────────
  async function handleAssignRequest(userId: string) {
    if (!request) return;
    setReqAssignee(userId);
    const { error } = await updateServiceRequest(request.id, { assigned_to: userId || null });
    if (error) { toast.error(error.message); return; }
    toast.success("Assignee updated");
    logAudit({ action: "service_request.assign", entity_type: "service_request", entity_id: request.id, new_values: { assigned_to: userId } });
  }

  async function handleChangeRequestStatus(next: ServiceRequestStatus) {
    if (!request) return;
    const prev = reqStatus;
    setReqStatus(next);
    const { error } = await updateServiceRequest(request.id, { status: next });
    if (error) { setReqStatus(prev); toast.error(error.message); return; }
    toast.success(`Status updated to ${next.replace("_", " ")}`);
    logAudit({ action: "service_request.status_change", entity_type: "service_request", entity_id: request.id, old_values: { status: prev }, new_values: { status: next } });
  }

  async function handleDecline() {
    if (!request || !declineReason.trim()) return;
    const { error } = await updateServiceRequest(request.id, { status: "declined", decline_reason: declineReason.trim() });
    if (error) { toast.error(error.message); return; }
    setReqStatus("declined");
    setShowDecline(false);
    toast.success("Request declined");
    logAudit({ action: "service_request.decline", entity_type: "service_request", entity_id: request.id, new_values: { decline_reason: declineReason } });
    loadRequestData(request.id);
  }

  // ── Shared: timeline ───────────────────────────
  const orderTimeline = order?.order_timeline
    ?.slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((t) => ({ label: t.step_label, date: t.completed_at, completed: t.completed })) ?? [];

  const requestTimeline = request
    ? [
        { label: "Submitted", date: request.created_at, completed: true },
        { label: "Reviewing", date: STATUS_FLOW.indexOf(reqStatus) >= 1 ? request.updated_at : null, completed: STATUS_FLOW.indexOf(reqStatus) >= 1 || reqStatus === "declined" },
        { label: "Scheduled", date: STATUS_FLOW.indexOf(reqStatus) >= 2 ? request.updated_at : null, completed: STATUS_FLOW.indexOf(reqStatus) >= 2 },
        { label: "In Progress", date: STATUS_FLOW.indexOf(reqStatus) >= 3 ? request.updated_at : null, completed: STATUS_FLOW.indexOf(reqStatus) >= 3 },
        { label: "Completed", date: reqStatus === "completed" ? request.updated_at : null, completed: reqStatus === "completed" },
      ]
    : [];

  const timeline = isRequest ? requestTimeline : orderTimeline;

  const riskColors: Record<string, { bg: string; text: string }> = {
    on_track: { bg: "#ECFDF5", text: "#059669" },
    at_risk: { bg: "#FFF7ED", text: "#EA580C" },
    behind: { bg: "#FEF2F2", text: "#DC2626" },
  };

  const notes = isRequest
    ? (request?.service_request_notes ?? []).map((n) => ({
        id: n.id,
        author: teamMemberName(n.author_id),
        text: n.text,
        created_at: n.created_at,
      }))
    : (tracking?.fulfillment_notes ?? []).map((n) => ({
        id: n.id,
        author: n.profiles?.name ?? teamMemberName(n.author_id),
        text: n.text,
        created_at: n.created_at,
      }));

  const sortedNotes = [...notes].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const customerName = isRequest
    ? teamMemberName(request!.user_id) // fallback if not a team member — we still render via profiles fetch below
    : order!.profiles?.name ?? order!.profiles?.email ?? "—";
  // Note: for request view, we fetch profile minimally below; fall back to ID if we haven't loaded it.

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
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h1 className="text-lg font-bold text-[#0F172A]">{isRequest ? request!.id : order!.id}</h1>
              <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold text-white" style={{ backgroundColor: portalColor }}>
                {portalLabel.split(",")[0]}
              </span>
              {isRequest ? (
                <StatusBadge status={reqStatus.replace("_", " ")} />
              ) : (
                <StatusBadge status={order!.status} />
              )}
            </div>
            <p className="text-sm text-[#64748B]">
              {isRequest
                ? `${request!.type_label} — submitted ${formatDate(request!.created_at)}`
                : `${order!.description ?? order!.order_items[0]?.product_name ?? "Order"} — ${formatNaira(order!.total_amount)} — Customer: ${customerName}`}
            </p>
          </div>
          {isRequest && reqStatus !== "declined" && reqStatus !== "completed" && (
            <div className="flex items-center gap-2">
              <button onClick={() => navigate("/orders/create")} className="px-3 py-2 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-primary/90 cursor-pointer">Convert to Order</button>
              <button onClick={() => setShowDecline(!showDecline)} className="px-3 py-2 rounded-xl text-sm font-semibold bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer">Decline</button>
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
              {Object.keys(request.details).length === 0 ? (
                <p className="text-sm text-[#94A3B8] italic">No additional details provided.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.entries(request.details).map(([key, value]) => (
                    <div key={key}>
                      <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wide mb-1">{key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}</p>
                      <p className="text-sm text-[#0F172A]">{String(value)}</p>
                    </div>
                  ))}
                </div>
              )}
              {request.decline_reason && (
                <div className="mt-4 p-3 bg-red-50 rounded-xl">
                  <p className="text-[11px] font-semibold text-red-600 uppercase tracking-wide mb-1">Decline Reason</p>
                  <p className="text-sm text-[#0F172A]">{request.decline_reason}</p>
                </div>
              )}
            </div>
          )}

          {/* Order items (orders only) */}
          {!isRequest && order && order.order_items.length > 0 && (
            <div className={`${card} p-4 sm:p-6`}>
              <h2 className="text-[15px] font-bold text-[#0F172A] mb-3">Items</h2>
              <div className="space-y-2">
                {order.order_items.map((it) => (
                  <div key={it.id} className="flex items-center justify-between py-2 border-b border-[#F1F5F9] last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#0F172A] truncate">{it.product_name}</p>
                      <p className="text-[12px] text-[#64748B]">Qty: {it.quantity} × {formatNaira(it.unit_price)}</p>
                    </div>
                    <p className="text-sm font-semibold text-[#0F172A]">{formatNaira(it.total_price)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timeline */}
          {timeline.length > 0 && (
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
          )}

          {/* Customer (service requests only) */}
          {isRequest && request && (
            <div className={`${card} p-4 sm:p-6`}>
              <h2 className="text-[15px] font-bold text-[#0F172A] mb-3">Customer</h2>
              <button onClick={() => navigate(`/users/${request.user_id}`)} className="inline-flex items-center gap-2 text-sm text-primary font-semibold hover:underline cursor-pointer">
                <span className="material-symbols-outlined text-[16px]">person</span>
                View Profile
              </button>
            </div>
          )}

          {/* Notes (shared) */}
          <div className={`${card} p-4 sm:p-6`}>
            <h3 className="text-sm font-bold text-[#0F172A] mb-4">Internal Notes</h3>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className={`${inputClass} flex-1`}
                placeholder="Add a note..."
                onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
              />
              <button onClick={handleAddNote} className="px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl cursor-pointer hover:brightness-[0.92] transition-all flex-shrink-0">Add</button>
            </div>
            {sortedNotes.length === 0 ? (
              <p className="text-sm text-[#94A3B8] italic text-center py-6">No notes yet.</p>
            ) : (
              <div className="space-y-3">
                {sortedNotes.map((note) => {
                  const author = note.author ?? "—";
                  const initials = author.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "??";
                  return (
                    <div key={note.id} className="flex gap-3 p-3 bg-[#F8FAFC] rounded-xl">
                      <div className="size-7 rounded-full bg-[#E2E8F0] flex items-center justify-center text-[10px] font-bold text-[#64748B] flex-shrink-0">{initials}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-semibold text-[#0F172A]">{author}</span>
                          <span className="text-[11px] text-[#94A3B8]">{formatDate(note.created_at)}</span>
                        </div>
                        <p className="text-sm text-[#334155]">{note.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4 sm:space-y-6">
          {/* Assignment (shared) */}
          <div className={`${card} p-4 sm:p-6`}>
            <h3 className="text-sm font-bold text-[#0F172A] mb-3">Assignment</h3>
            <select
              value={isRequest ? reqAssignee : assignee}
              onChange={(e) => isRequest ? handleAssignRequest(e.target.value) : handleAssignOrder(e.target.value)}
              className={`${inputClass} cursor-pointer`}
            >
              <option value="">Unassigned</option>
              {teamMembers.map((m) => (
                <option key={m.id} value={m.user_id}>{m.profiles?.name ?? m.profiles?.email} — {m.role}</option>
              ))}
            </select>
          </div>

          {/* Status workflow (service requests only) */}
          {isRequest && (
            <div className={`${card} p-4 sm:p-6`}>
              <h3 className="text-sm font-bold text-[#0F172A] mb-3">Update Status</h3>
              <div className="space-y-2">
                {STATUS_FLOW.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleChangeRequestStatus(s)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${reqStatus === s ? "bg-primary/10 text-primary font-semibold" : "hover:bg-[#F1F5F9] text-[#334155]"}`}
                  >
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
              <div>
                <label className="text-[13px] font-semibold text-[#0F172A] mb-1.5 block">Risk Level</label>
                <select value={riskLevel} onChange={(e) => setRiskLevel(e.target.value as "on_track" | "at_risk" | "behind")} className={`${inputClass} cursor-pointer`}>
                  <option value="on_track">On Track</option>
                  <option value="at_risk">At Risk</option>
                  <option value="behind">Behind</option>
                </select>
              </div>
              <button onClick={handleSaveSLA} className="w-full py-2.5 bg-primary text-white text-sm font-semibold rounded-xl cursor-pointer hover:brightness-[0.92] active:scale-[0.98] transition-all">
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
              <button onClick={handleSaveProgress} className="w-full mt-3 py-2.5 bg-[#0F172A] text-white text-sm font-semibold rounded-xl cursor-pointer hover:bg-[#1E293B] active:scale-[0.98] transition-all">
                Update Progress
              </button>
            </div>
          )}

          {/* Quick nav to order (orders only) */}
          {!isRequest && order && (
            <div className={`${card} p-4 sm:p-6`}>
              <button onClick={() => navigate(`/orders/${order.id}`)} className="w-full inline-flex items-center justify-center gap-2 py-2.5 bg-[#F1F5F9] text-[#334155] text-sm font-semibold rounded-xl cursor-pointer hover:bg-[#E2E8F0] transition-all">
                <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                View Full Order
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
