import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import StatCard from "./shared/StatCard";
import StatusBadge from "./shared/StatusBadge";
import { mockOrders, formatNaira, formatDate, PORTAL_LABELS, type Portal } from "../../data/adminMockData";

const TEAM_MEMBERS = [
  { id: "TM-001", name: "Damola A.", role: "Operations Lead", avatar: "DA" },
  { id: "TM-002", name: "Chioma E.", role: "Fulfillment Manager", avatar: "CE" },
  { id: "TM-003", name: "Kunle A.", role: "Field Agent", avatar: "KA" },
  { id: "TM-004", name: "Fatima B.", role: "Support Agent", avatar: "FB" },
  { id: "TM-005", name: "Emeka E.", role: "Logistics Lead", avatar: "EE" },
];

interface FulfillmentItem {
  orderId: string;
  customer: string;
  portal: Portal;
  assignedTo: string | null;
  status: "on_track" | "at_risk" | "behind";
  dueDate: string;
  amount: number;
}

function generateFulfillmentItems(): FulfillmentItem[] {
  const statuses: FulfillmentItem["status"][] = ["on_track", "on_track", "on_track", "at_risk", "behind"];
  return mockOrders
    .filter((o) => o.status === "processing" || o.status === "confirmed")
    .slice(0, 15)
    .map((o, i) => {
      const assignIdx = i % 7;
      return {
        orderId: o.id,
        customer: o.userName,
        portal: o.portal,
        assignedTo: assignIdx < 5 ? TEAM_MEMBERS[assignIdx].id : null,
        status: statuses[i % statuses.length],
        dueDate: o.updatedAt,
        amount: o.amount,
      };
    });
}

const STATUS_DOT: Record<string, string> = {
  on_track: "#059669",
  at_risk: "#EA580C",
  behind: "#DC2626",
};

export default function FulfillmentPage() {
  const navigate = useNavigate();
  const items = useMemo(() => generateFulfillmentItems(), []);
  const [assignments, setAssignments] = useState<Record<string, string | null>>(
    Object.fromEntries(items.map((i) => [i.orderId, i.assignedTo]))
  );

  const onTrack = items.filter((i) => i.status === "on_track").length;
  const atRisk = items.filter((i) => i.status === "at_risk").length;
  const behind = items.filter((i) => i.status === "behind").length;
  const unassigned = items.filter((i) => !assignments[i.orderId]);

  const handleAssign = (orderId: string, memberId: string) => {
    setAssignments((prev) => ({ ...prev, [orderId]: memberId }));
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-[#0F172A]">Fulfillment</h1>
        <p className="text-sm text-[#64748B] mt-0.5">Track and manage order fulfillment</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Active" value={String(items.length)} icon="assignment" color="#0D47A1" />
        <StatCard label="On Track" value={String(onTrack)} icon="check_circle" color="#1B5E20" />
        <StatCard label="At Risk" value={String(atRisk)} icon="warning" color="#E65100" />
        <StatCard label="Behind" value={String(behind)} icon="error" color="#B71C1C" />
      </div>

      {/* Unassigned orders (horizontal scroll) */}
      {unassigned.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-[#0F172A] mb-3">Unassigned Orders ({unassigned.length})</h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {unassigned.map((item) => (
              <div key={item.orderId} className="min-w-[260px] bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 p-4 flex-shrink-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-primary">{item.orderId}</span>
                  <span className="text-[12px] text-[#64748B]">{formatNaira(item.amount)}</span>
                </div>
                <p className="text-[13px] text-[#334155] mb-1">{item.customer}</p>
                <p className="text-[12px] text-[#64748B] mb-3">{PORTAL_LABELS[item.portal]}</p>
                <select
                  value=""
                  onChange={(e) => handleAssign(item.orderId, e.target.value)}
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm text-[#334155] bg-white outline-none cursor-pointer"
                >
                  <option value="" disabled>Assign to...</option>
                  {TEAM_MEMBERS.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fulfillment table */}
      <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F8FAFC]">
                <th className="px-5 py-3.5 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-left">Order</th>
                <th className="px-5 py-3.5 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-left">Customer</th>
                <th className="px-5 py-3.5 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-left hidden md:table-cell">Portal</th>
                <th className="px-5 py-3.5 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-left hidden sm:table-cell">Assigned To</th>
                <th className="px-5 py-3.5 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-center">Status</th>
                <th className="px-5 py-3.5 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-left hidden md:table-cell">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {items.map((item) => {
                const assignee = TEAM_MEMBERS.find((m) => m.id === assignments[item.orderId]);
                return (
                  <tr key={item.orderId} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => navigate(`/fulfillment/${item.orderId}`)}
                        className="font-semibold text-primary cursor-pointer hover:underline"
                      >
                        {item.orderId}
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-[#334155]">{item.customer}</td>
                    <td className="px-5 py-3.5 text-[#64748B] hidden md:table-cell">{PORTAL_LABELS[item.portal]}</td>
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      {assignee ? (
                        <span className="text-sm text-[#334155]">{assignee.name}</span>
                      ) : (
                        <StatusBadge status="pending" />
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold capitalize">
                        <span className="size-2 rounded-full" style={{ backgroundColor: STATUS_DOT[item.status] }} />
                        {item.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[#64748B] hidden md:table-cell whitespace-nowrap">{formatDate(item.dueDate)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
