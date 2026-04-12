import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import StatusBadge from "./shared/StatusBadge";
import { useToast } from "../../hooks/useToast";
import {
  mockOrders,
  formatNaira,
  formatDate,
  PORTAL_LABELS,
  PORTAL_COLORS,
  type Portal,
} from "../../data/adminMockData";

/* ── Team members (same as FulfillmentPage) ──────────────────────────────── */

const TEAM_MEMBERS = [
  { id: "TM-1", name: "Chidi Okafor", role: "Operations Lead", avatar: "CO" },
  { id: "TM-2", name: "Amara Taiwo", role: "Solar Specialist", avatar: "AT" },
  { id: "TM-3", name: "Kunle Adeyemi", role: "Logistics Coord.", avatar: "KA" },
  { id: "TM-4", name: "Fatima Bello", role: "Customer Support", avatar: "FB" },
  { id: "TM-5", name: "Emeka Emenike", role: "Transport Mgr.", avatar: "EE" },
];

/* ── Types ────────────────────────────────────────────────────────────────── */

type Priority = "high" | "medium" | "low";
type RiskLevel = "on_track" | "at_risk" | "behind";

interface TimelineStep {
  label: string;
  date: string;
  performedBy: string;
  completed: boolean;
}

interface FulfillmentNote {
  id: string;
  text: string;
  author: string;
  timestamp: string;
}

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function computeRisk(progress: number, dueDate: string): RiskLevel {
  const now = new Date("2026-04-11").getTime();
  const due = new Date(dueDate).getTime();
  const daysLeft = (due - now) / 86400000;
  if (progress < 50 && daysLeft < 0) return "behind";
  if (progress < 30 && daysLeft <= 2) return "at_risk";
  return "on_track";
}

const RISK_STYLES: Record<RiskLevel, { bg: string; text: string; label: string }> = {
  on_track: { bg: "#ECFDF5", text: "#059669", label: "On Track" },
  at_risk: { bg: "#FFF7ED", text: "#EA580C", label: "At Risk" },
  behind: { bg: "#FEF2F2", text: "#DC2626", label: "Behind" },
};

const PRIORITY_COLORS: Record<Priority, { bg: string; text: string }> = {
  high: { bg: "#FEF2F2", text: "#DC2626" },
  medium: { bg: "#FFF7ED", text: "#EA580C" },
  low: { bg: "#ECFDF5", text: "#059669" },
};

/* ── Component ────────────────────────────────────────────────────────────── */

export default function FulfillmentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  /* ---------- find order ---------- */

  const order = useMemo(() => mockOrders.find((o) => o.id === id), [id]);

  /* ---------- generate deterministic fulfillment data for this order ---------- */

  const seed = useMemo(() => {
    if (!id) return 1;
    let h = 0;
    for (let i = 0; i < id.length; i++) {
      h = (h * 31 + id.charCodeAt(i)) % 2147483647;
    }
    return h || 1;
  }, [id]);

  const rand = useMemo(() => seededRandom(seed), [seed]);

  const initialAssignee = useMemo(() => {
    const idx = Math.floor(rand() * TEAM_MEMBERS.length);
    return TEAM_MEMBERS[idx].id;
  }, [rand]);

  const initialProgress = useMemo(() => Math.floor(rand() * 80) + 10, [rand]);

  const initialPriority = useMemo((): Priority => {
    const arr: Priority[] = ["high", "medium", "low"];
    return arr[Math.floor(rand() * arr.length)];
  }, [rand]);

  const dueDateDefault = useMemo(() => {
    const offset = Math.floor(rand() * 14) - 3;
    const d = new Date("2026-04-11");
    d.setDate(d.getDate() + offset);
    return d.toISOString().slice(0, 10);
  }, [rand]);

  const responseDeadlineDefault = useMemo(() => {
    const d = new Date("2026-04-11");
    d.setDate(d.getDate() - Math.floor(rand() * 5));
    return d.toISOString().slice(0, 10);
  }, [rand]);

  /* ---------- state ---------- */

  const [assignedTo, setAssignedTo] = useState(initialAssignee);
  const [showReassign, setShowReassign] = useState(false);
  const [progress, setProgress] = useState(initialProgress);
  const [showProgressInput, setShowProgressInput] = useState(false);
  const [progressInput, setProgressInput] = useState(String(initialProgress));
  const [priority, setPriority] = useState<Priority>(initialPriority);
  const [responseDeadline, setResponseDeadline] = useState(responseDeadlineDefault);
  const [fulfillmentDeadline, setFulfillmentDeadline] = useState(dueDateDefault);
  const [noteText, setNoteText] = useState("");

  const riskLevel = useMemo(() => computeRisk(progress, fulfillmentDeadline), [progress, fulfillmentDeadline]);

  /* ---------- mock timeline ---------- */

  const timeline: TimelineStep[] = useMemo(() => {
    const steps: TimelineStep[] = [
      { label: "Order Placed", date: order?.createdAt ?? "2026-04-05", performedBy: order?.userName ?? "Customer", completed: true },
      { label: "Assigned to Team", date: "2026-04-06", performedBy: "Admin", completed: true },
      { label: "In Progress", date: "2026-04-08", performedBy: TEAM_MEMBERS.find((m) => m.id === assignedTo)?.name ?? "Team Member", completed: true },
      { label: "Completed", date: fulfillmentDeadline, performedBy: "", completed: false },
    ];
    return steps;
  }, [order, assignedTo, fulfillmentDeadline]);

  /* ---------- mock notes ---------- */

  const [notes, setNotes] = useState<FulfillmentNote[]>([
    {
      id: "note-1",
      text: "Customer confirmed delivery address. All items in stock.",
      author: "Chidi Okafor",
      timestamp: "2026-04-07 10:15",
    },
    {
      id: "note-2",
      text: "Coordinating with logistics team for pickup schedule.",
      author: "Admin",
      timestamp: "2026-04-08 14:30",
    },
  ]);

  /* ---------- handlers ---------- */

  function handleReassign(teamId: string) {
    const member = TEAM_MEMBERS.find((m) => m.id === teamId);
    if (!member) return;
    setAssignedTo(teamId);
    setShowReassign(false);
    toast.success(`Reassigned to ${member.name}`);
  }

  function handleUpdateSla() {
    toast.success("SLA & timeline updated successfully");
  }

  function handleUpdateProgress() {
    const val = Math.min(100, Math.max(0, parseInt(progressInput) || 0));
    setProgress(val);
    setProgressInput(String(val));
    setShowProgressInput(false);
    toast.success(`Progress updated to ${val}%`);
  }

  function handleAddNote() {
    if (!noteText.trim()) return;
    setNotes((prev) => [
      ...prev,
      {
        id: `note-${Date.now()}`,
        text: noteText.trim(),
        author: "Admin",
        timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
      },
    ]);
    setNoteText("");
    toast.success("Note added");
  }

  /* ---------- not found ---------- */

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <span className="material-symbols-outlined text-[64px] text-[#E8ECF1] mb-4">
          assignment_late
        </span>
        <h2 className="text-lg font-bold text-[#0F172A]">Order Not Found</h2>
        <p className="text-sm text-[#64748B] mt-1">The order {id} could not be found.</p>
        <button
          onClick={() => navigate("/fulfillment")}
          className="mt-4 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
        >
          Back to Fulfillment
        </button>
      </div>
    );
  }

  const assignee = TEAM_MEMBERS.find((m) => m.id === assignedTo);
  const portalColor = PORTAL_COLORS[order.portal as Portal];
  const riskStyle = RISK_STYLES[riskLevel];
  const progressColor = progress >= 70 ? "#059669" : progress >= 40 ? "#EA580C" : "#DC2626";

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate("/fulfillment")}
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Back to Fulfillment
      </button>

      {/* 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Left column (3/5 = 60%) */}
        <div className="lg:col-span-3 space-y-5">
          {/* Order Summary */}
          <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 p-5 sm:p-6">
            <h2 className="text-[15px] font-bold text-[#0F172A] mb-4">Order Summary</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-[11px] text-[#94A3B8] font-semibold uppercase tracking-wider">Order ID</p>
                <p className="text-sm font-bold text-primary mt-1">{order.id}</p>
              </div>
              <div>
                <p className="text-[11px] text-[#94A3B8] font-semibold uppercase tracking-wider">Customer</p>
                <p className="text-sm font-medium text-[#334155] mt-1">{order.userName}</p>
              </div>
              <div>
                <p className="text-[11px] text-[#94A3B8] font-semibold uppercase tracking-wider">Portal</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="size-2.5 rounded-full" style={{ backgroundColor: portalColor }} />
                  <span className="text-sm text-[#334155]">{PORTAL_LABELS[order.portal as Portal].split(",")[0]}</span>
                </div>
              </div>
              <div>
                <p className="text-[11px] text-[#94A3B8] font-semibold uppercase tracking-wider">Amount</p>
                <p className="text-sm font-bold text-[#0F172A] mt-1">{formatNaira(order.amount)}</p>
              </div>
              <div>
                <p className="text-[11px] text-[#94A3B8] font-semibold uppercase tracking-wider">Order Date</p>
                <p className="text-sm text-[#334155] mt-1">{formatDate(order.createdAt)}</p>
              </div>
              <div>
                <p className="text-[11px] text-[#94A3B8] font-semibold uppercase tracking-wider">Status</p>
                <div className="mt-1">
                  <StatusBadge status={order.status} />
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 p-5 sm:p-6">
            <h2 className="text-[15px] font-bold text-[#0F172A] mb-4">Fulfillment Timeline</h2>
            <div className="relative pl-6">
              {/* Vertical line */}
              <div className="absolute left-[9px] top-2 bottom-2 w-px bg-[#E8ECF1]" />
              <div className="space-y-5">
                {timeline.map((step, idx) => (
                  <div key={idx} className="relative flex gap-4">
                    {/* Dot */}
                    <div
                      className={`absolute -left-6 top-0.5 size-[18px] rounded-full border-2 flex items-center justify-center ${
                        step.completed
                          ? "border-primary bg-primary"
                          : "border-[#E8ECF1] bg-white"
                      }`}
                    >
                      {step.completed && (
                        <span className="material-symbols-outlined text-white text-[12px]">check</span>
                      )}
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${step.completed ? "text-[#0F172A]" : "text-[#94A3B8]"}`}>
                        {step.label}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[12px] text-[#64748B]">{formatDate(step.date)}</span>
                        {step.performedBy && (
                          <>
                            <span className="text-[#E8ECF1]">&middot;</span>
                            <span className="text-[12px] text-[#94A3B8]">{step.performedBy}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 p-5 sm:p-6">
            <h2 className="text-[15px] font-bold text-[#0F172A] mb-4">Notes</h2>

            {/* Existing notes */}
            <div className="space-y-3 mb-4">
              {notes.map((note) => (
                <div key={note.id} className="rounded-xl bg-[#F8FAFC] border border-[#E8ECF1]/60 p-3.5">
                  <p className="text-sm text-[#334155] leading-relaxed">{note.text}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[11px] font-semibold text-[#64748B]">{note.author}</span>
                    <span className="text-[#E8ECF1]">&middot;</span>
                    <span className="text-[11px] text-[#94A3B8]">{note.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Add note */}
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add a note..."
              rows={3}
              className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm text-[#0F172A] outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all resize-none placeholder:text-[#94A3B8]"
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={handleAddNote}
                disabled={!noteText.trim()}
                className="px-4 py-2 bg-primary text-white rounded-xl text-[13px] font-semibold hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-default"
              >
                Add Note
              </button>
            </div>
          </div>
        </div>

        {/* Right column (2/5 = 40%) */}
        <div className="lg:col-span-2 space-y-5">
          {/* Assignment card */}
          <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 p-5 sm:p-6">
            <h2 className="text-[15px] font-bold text-[#0F172A] mb-4">Assignment</h2>
            {assignee && (
              <div className="flex items-center gap-3 mb-4">
                <div className="size-10 rounded-full bg-gradient-to-br from-primary/80 to-primary/50 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                  {assignee.avatar}
                </div>
                <div>
                  <p className="text-sm font-bold text-[#0F172A]">{assignee.name}</p>
                  <p className="text-[12px] text-[#64748B]">{assignee.role}</p>
                </div>
              </div>
            )}

            <div className="relative">
              <button
                onClick={() => setShowReassign(!showReassign)}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-[13px] font-semibold text-[#334155] bg-[#F8FAFC] border border-[#E8ECF1] rounded-xl hover:bg-[#F1F5F9] transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
                Reassign
              </button>

              {showReassign && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-[#E8ECF1] z-50 overflow-hidden py-1">
                  <p className="px-3 py-2 text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                    Assign to
                  </p>
                  {TEAM_MEMBERS.map((tm) => (
                    <button
                      key={tm.id}
                      onClick={() => handleReassign(tm.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-[#F8FAFC] transition-colors cursor-pointer ${
                        assignedTo === tm.id ? "bg-primary/5" : ""
                      }`}
                    >
                      <div className="size-7 rounded-full bg-gradient-to-br from-primary/80 to-primary/50 flex items-center justify-center text-white font-bold text-[9px] flex-shrink-0">
                        {tm.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-[#334155] leading-tight truncate">
                          {tm.name}
                        </p>
                        <p className="text-[10px] text-[#94A3B8]">{tm.role}</p>
                      </div>
                      {assignedTo === tm.id && (
                        <span className="material-symbols-outlined text-primary text-[16px]">check</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* SLA & Timeline card */}
          <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 p-5 sm:p-6">
            <h2 className="text-[15px] font-bold text-[#0F172A] mb-4">SLA & Timeline</h2>
            <div className="space-y-3.5">
              {/* Response deadline */}
              <div>
                <label className="text-[11px] text-[#64748B] font-semibold uppercase tracking-wider">
                  Response Deadline
                </label>
                <input
                  type="date"
                  value={responseDeadline}
                  onChange={(e) => setResponseDeadline(e.target.value)}
                  className="w-full mt-1.5 border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm text-[#0F172A] outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                />
              </div>

              {/* Fulfillment deadline */}
              <div>
                <label className="text-[11px] text-[#64748B] font-semibold uppercase tracking-wider">
                  Fulfillment Deadline
                </label>
                <input
                  type="date"
                  value={fulfillmentDeadline}
                  onChange={(e) => setFulfillmentDeadline(e.target.value)}
                  className="w-full mt-1.5 border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm text-[#0F172A] outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                />
              </div>

              {/* Priority */}
              <div>
                <label className="text-[11px] text-[#64748B] font-semibold uppercase tracking-wider">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="w-full mt-1.5 border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm text-[#0F172A] outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all cursor-pointer appearance-none bg-white pr-8 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394A3B8%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_8px_center] bg-no-repeat"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              {/* Risk level (auto-computed) */}
              <div>
                <label className="text-[11px] text-[#64748B] font-semibold uppercase tracking-wider">
                  Risk Level
                </label>
                <div className="mt-1.5 flex items-center gap-2">
                  <span
                    className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-semibold tracking-wide uppercase"
                    style={{ backgroundColor: riskStyle.bg, color: riskStyle.text }}
                  >
                    {riskStyle.label}
                  </span>
                  <span className="text-[11px] text-[#94A3B8]">Auto-computed</span>
                </div>
              </div>

              {/* Priority badge */}
              <div>
                <label className="text-[11px] text-[#64748B] font-semibold uppercase tracking-wider">
                  Priority Badge
                </label>
                <div className="mt-1.5">
                  <span
                    className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-semibold tracking-wide uppercase"
                    style={{ backgroundColor: PRIORITY_COLORS[priority].bg, color: PRIORITY_COLORS[priority].text }}
                  >
                    {priority}
                  </span>
                </div>
              </div>

              <button
                onClick={handleUpdateSla}
                className="w-full mt-2 px-4 py-2.5 bg-primary text-white rounded-xl text-[13px] font-bold hover:bg-primary/90 transition-colors cursor-pointer"
              >
                Update
              </button>
            </div>
          </div>

          {/* Progress card */}
          <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 p-5 sm:p-6">
            <h2 className="text-[15px] font-bold text-[#0F172A] mb-4">Progress</h2>

            {/* Progress bar */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] text-[#64748B]">Completion</span>
                <span className="text-sm font-bold" style={{ color: progressColor }}>
                  {progress}%
                </span>
              </div>
              <div className="w-full h-3 bg-[#F1F5F9] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${progress}%`, backgroundColor: progressColor }}
                />
              </div>
            </div>

            {/* Update progress */}
            {showProgressInput ? (
              <div className="flex items-center gap-2 mt-3">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={progressInput}
                  onChange={(e) => setProgressInput(e.target.value)}
                  className="flex-1 border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm text-[#0F172A] outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  placeholder="0-100"
                />
                <button
                  onClick={handleUpdateProgress}
                  className="px-4 py-2.5 bg-primary text-white rounded-xl text-[13px] font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setShowProgressInput(false);
                    setProgressInput(String(progress));
                  }}
                  className="px-3 py-2.5 text-[13px] font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowProgressInput(true)}
                className="w-full mt-2 flex items-center justify-center gap-1.5 px-3 py-2 text-[13px] font-semibold text-[#334155] bg-[#F8FAFC] border border-[#E8ECF1] rounded-xl hover:bg-[#F1F5F9] transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">edit</span>
                Update Progress
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
