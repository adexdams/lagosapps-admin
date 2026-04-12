import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "../../hooks/useToast";
import StatusBadge from "./shared/StatusBadge";
import { mockOrders, formatNaira, formatDate, PORTAL_LABELS, type Portal } from "../../data/adminMockData";

const TEAM_MEMBERS = [
  { id: "TM-001", name: "Damola A.", role: "Operations Lead", avatar: "DA" },
  { id: "TM-002", name: "Chioma E.", role: "Fulfillment Manager", avatar: "CE" },
  { id: "TM-003", name: "Kunle A.", role: "Field Agent", avatar: "KA" },
  { id: "TM-004", name: "Fatima B.", role: "Support Agent", avatar: "FB" },
  { id: "TM-005", name: "Emeka E.", role: "Logistics Lead", avatar: "EE" },
];

const INITIAL_NOTES = [
  { id: "n1", author: "Damola A.", text: "Customer confirmed delivery window for Saturday morning.", date: "2026-04-10" },
  { id: "n2", author: "Chioma E.", text: "Vendor notified of special packaging request.", date: "2026-04-09" },
];

export default function FulfillmentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const order = mockOrders.find((o) => o.id === id);
  const [assignee, setAssignee] = useState("TM-001");
  const [responseDeadline, setResponseDeadline] = useState("2026-04-12");
  const [fulfillmentDeadline, setFulfillmentDeadline] = useState("2026-04-15");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [progress, setProgress] = useState(45);
  const [notes, setNotes] = useState(INITIAL_NOTES);
  const [newNote, setNewNote] = useState("");

  if (!order) {
    return (
      <div className="text-center py-20">
        <p className="text-lg font-semibold text-[#0F172A]">Order not found</p>
        <button onClick={() => navigate("/fulfillment")} className="text-primary text-sm font-semibold mt-2 cursor-pointer">
          Back to Fulfillment
        </button>
      </div>
    );
  }

  const portal = order.portal as Portal;
  const riskLevel = priority === "high" ? "behind" : priority === "medium" ? "at_risk" : "on_track";
  const riskColors: Record<string, { bg: string; text: string }> = {
    on_track: { bg: "#ECFDF5", text: "#059669" },
    at_risk: { bg: "#FFF7ED", text: "#EA580C" },
    behind: { bg: "#FEF2F2", text: "#DC2626" },
  };

  const handleUpdateSLA = () => {
    toast.success("SLA settings updated");
  };

  const handleUpdateProgress = () => {
    toast.success(`Progress updated to ${progress}%`);
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    setNotes((prev) => [
      { id: `n${prev.length + 1}`, author: "Admin", text: newNote, date: "2026-04-11" },
      ...prev,
    ]);
    setNewNote("");
    toast.success("Note added");
  };

  const timeline = [
    { label: "Order Placed", date: order.createdAt, completed: true },
    { label: "Confirmed", date: order.updatedAt, completed: true },
    { label: "In Fulfillment", date: "2026-04-10", completed: true },
    { label: "Completed", date: null, completed: false },
  ];

  const inputClass = "w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm text-[#0F172A] outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all";

  return (
    <div className="space-y-6">
      {/* Back */}
      <button
        onClick={() => navigate("/fulfillment")}
        className="inline-flex items-center gap-1 text-sm font-semibold text-[#64748B] hover:text-[#0F172A] cursor-pointer transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Back to Fulfillment
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order summary */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="text-lg font-bold text-[#0F172A]">{order.id}</h2>
                <p className="text-sm text-[#64748B]">{PORTAL_LABELS[portal]} - {order.product}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-extrabold text-[#0F172A]">{formatNaira(order.amount)}</p>
                <StatusBadge status={order.status} />
              </div>
            </div>
            <div className="flex items-center gap-4 text-[13px] text-[#64748B]">
              <span>Customer: <strong className="text-[#0F172A]">{order.userName}</strong></span>
              <span>Created: {formatDate(order.createdAt)}</span>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 p-5">
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

          {/* Notes */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 p-5">
            <h3 className="text-sm font-bold text-[#0F172A] mb-4">Notes</h3>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className={`${inputClass} flex-1`}
                placeholder="Add a note..."
                onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
              />
              <button
                onClick={handleAddNote}
                className="px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl cursor-pointer hover:brightness-[0.92] transition-all"
              >
                Add
              </button>
            </div>
            <div className="space-y-3">
              {notes.map((note) => (
                <div key={note.id} className="p-3 bg-[#F8FAFC] rounded-xl">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[13px] font-semibold text-[#0F172A]">{note.author}</span>
                    <span className="text-[11px] text-[#94A3B8]">{formatDate(note.date)}</span>
                  </div>
                  <p className="text-sm text-[#334155]">{note.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right — 1/3 */}
        <div className="space-y-6">
          {/* Assignment */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 p-5">
            <h3 className="text-sm font-bold text-[#0F172A] mb-3">Assignment</h3>
            <select
              value={assignee}
              onChange={(e) => { setAssignee(e.target.value); toast.success("Reassigned"); }}
              className={`${inputClass} cursor-pointer`}
            >
              {TEAM_MEMBERS.map((m) => (
                <option key={m.id} value={m.id}>{m.name} - {m.role}</option>
              ))}
            </select>
          </div>

          {/* SLA */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#0F172A]">SLA Settings</h3>
              <span
                className="inline-block px-2 py-0.5 rounded-lg text-[11px] font-semibold uppercase"
                style={{ backgroundColor: riskColors[riskLevel].bg, color: riskColors[riskLevel].text }}
              >
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
            <button
              onClick={handleUpdateSLA}
              className="w-full py-2.5 bg-primary text-white text-sm font-semibold rounded-xl cursor-pointer hover:brightness-[0.92] active:scale-[0.98] transition-all"
            >
              Update SLA
            </button>
          </div>

          {/* Progress */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 p-5">
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
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={(e) => setProgress(parseInt(e.target.value))}
              className="w-full accent-primary cursor-pointer"
            />
            <button
              onClick={handleUpdateProgress}
              className="w-full mt-3 py-2.5 bg-[#0F172A] text-white text-sm font-semibold rounded-xl cursor-pointer hover:bg-[#1E293B] active:scale-[0.98] transition-all"
            >
              Update Progress
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
