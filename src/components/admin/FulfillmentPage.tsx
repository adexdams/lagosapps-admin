import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import StatCard from "./shared/StatCard";
import FilterBar, { type FilterConfig } from "./shared/FilterBar";
import StatusBadge from "./shared/StatusBadge";
import { useToast } from "../../hooks/useToast";
import {
  mockOrders,
  mockServiceRequests,
  mockCustomRequests,
  formatNaira,
  formatDate,
  PORTAL_LABELS,
  PORTAL_COLORS,
  type Portal,
  type MockServiceRequest,
  type MockCustomRequest,
} from "../../data/adminMockData";

type FulfillmentTab = "orders" | "requests" | "custom";

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
  const toast = useToast();
  const [tab, setTab] = useState<FulfillmentTab>("orders");

  // ── Order Fulfillment state ──
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

  // ── Service Requests state ──
  const [reqSearch, setReqSearch] = useState("");
  const [reqPortalFilter, setReqPortalFilter] = useState("");
  const [reqStatusFilter, setReqStatusFilter] = useState("");

  const filteredRequests = useMemo(() => {
    return mockServiceRequests.filter((r) => {
      const q = reqSearch.toLowerCase();
      const matchSearch = !q || r.userName.toLowerCase().includes(q) || r.id.toLowerCase().includes(q) || r.typeLabel.toLowerCase().includes(q);
      const matchPortal = !reqPortalFilter || r.portal === reqPortalFilter;
      const matchStatus = !reqStatusFilter || r.status === reqStatusFilter;
      return matchSearch && matchPortal && matchStatus;
    });
  }, [reqSearch, reqPortalFilter, reqStatusFilter]);

  const reqNew = mockServiceRequests.filter((r) => r.status === "new").length;
  const reqScheduled = mockServiceRequests.filter((r) => r.status === "scheduled").length;
  const reqOverdue = mockServiceRequests.filter((r) => r.status === "in_progress" && new Date(r.updatedAt) < new Date(Date.now() - 7 * 86400000)).length;

  // ── Custom Orders state ──
  const [crSearch, setCrSearch] = useState("");
  const [crStatusFilter, setCrStatusFilter] = useState("");
  const [expandedCr, setExpandedCr] = useState<string | null>(null);

  const filteredCustom = useMemo(() => {
    return mockCustomRequests.filter((r) => {
      const q = crSearch.toLowerCase();
      const matchSearch = !q || r.userName.toLowerCase().includes(q) || r.id.toLowerCase().includes(q);
      const matchStatus = !crStatusFilter || r.status === crStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [crSearch, crStatusFilter]);

  const crNew = mockCustomRequests.filter((r) => r.status === "new").length;
  const crConverted = mockCustomRequests.filter((r) => r.status === "converted").length;

  const card = "bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60";

  const reqFilters: FilterConfig[] = [
    { key: "portal", label: "All Portals", options: (["solar", "health", "events", "community", "logistics"] as Portal[]).map((p) => ({ value: p, label: PORTAL_LABELS[p] })), value: reqPortalFilter, onChange: setReqPortalFilter },
    { key: "status", label: "All Statuses", options: [{ value: "new", label: "New" }, { value: "reviewing", label: "Reviewing" }, { value: "scheduled", label: "Scheduled" }, { value: "in_progress", label: "In Progress" }, { value: "completed", label: "Completed" }, { value: "declined", label: "Declined" }], value: reqStatusFilter, onChange: setReqStatusFilter },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-[#0F172A]">Fulfillment</h1>
        <p className="text-sm text-[#64748B] mt-0.5">Track and manage all assigned work</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl p-1 shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 w-fit">
        {([
          { key: "orders" as const, label: "Order Fulfillment", count: items.length },
          { key: "requests" as const, label: "Service Requests", count: mockServiceRequests.length },
          { key: "custom" as const, label: "Custom Orders", count: mockCustomRequests.length },
        ]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              tab === t.key ? "bg-primary text-white" : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]"
            }`}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {/* ═══════════════════ ORDER FULFILLMENT TAB ═══════════════════ */}
      {tab === "orders" && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            <StatCard label="Total Active" value={String(items.length)} icon="assignment" color="#0D47A1" />
            <StatCard label="On Track" value={String(onTrack)} icon="check_circle" color="#1B5E20" />
            <StatCard label="At Risk" value={String(atRisk)} icon="warning" color="#E65100" />
            <StatCard label="Behind" value={String(behind)} icon="error" color="#B71C1C" />
          </div>

          {unassigned.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-[#0F172A] mb-3">Unassigned Orders ({unassigned.length})</h2>
              <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2">
                {unassigned.map((item) => (
                  <div key={item.orderId} className="min-w-[220px] sm:min-w-[260px] bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 p-3 sm:p-4 flex-shrink-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-primary">{item.orderId}</span>
                      <span className="text-[12px] text-[#64748B]">{formatNaira(item.amount)}</span>
                    </div>
                    <p className="text-[13px] text-[#334155] mb-1">{item.customer}</p>
                    <p className="text-[12px] text-[#64748B] mb-3">{PORTAL_LABELS[item.portal]}</p>
                    <select value="" onChange={(e) => handleAssign(item.orderId, e.target.value)} className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm text-[#334155] bg-white outline-none cursor-pointer">
                      <option value="" disabled>Assign to...</option>
                      {TEAM_MEMBERS.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={`${card} overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="bg-[#F8FAFC]">
                    <th className="px-2.5 sm:px-4 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-left">Order</th>
                    <th className="px-2.5 sm:px-4 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-left hidden sm:table-cell">Customer</th>
                    <th className="px-2.5 sm:px-4 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-left hidden md:table-cell">Portal</th>
                    <th className="px-2.5 sm:px-4 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-left hidden sm:table-cell">Assigned To</th>
                    <th className="px-2.5 sm:px-4 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-center">Status</th>
                    <th className="px-2.5 sm:px-4 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-left hidden md:table-cell">Due Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {items.map((item) => {
                    const assignee = TEAM_MEMBERS.find((m) => m.id === assignments[item.orderId]);
                    return (
                      <tr key={item.orderId} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="px-2.5 sm:px-4 py-3">
                          <button onClick={() => navigate(`/fulfillment/${item.orderId}`)} className="font-semibold text-primary cursor-pointer hover:underline">{item.orderId}</button>
                        </td>
                        <td className="px-2.5 sm:px-4 py-3 text-[#334155] hidden sm:table-cell">{item.customer}</td>
                        <td className="px-2.5 sm:px-4 py-3 text-[#64748B] hidden md:table-cell">{PORTAL_LABELS[item.portal]}</td>
                        <td className="px-2.5 sm:px-4 py-3 hidden sm:table-cell">
                          {assignee ? <span className="text-sm text-[#334155]">{assignee.name}</span> : <StatusBadge status="pending" />}
                        </td>
                        <td className="px-2.5 sm:px-4 py-3 text-center">
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold capitalize">
                            <span className="size-2 rounded-full" style={{ backgroundColor: STATUS_DOT[item.status] }} />
                            {item.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-2.5 sm:px-4 py-3 text-[#64748B] hidden md:table-cell whitespace-nowrap">{formatDate(item.dueDate)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ═══════════════════ SERVICE REQUESTS TAB ═══════════════════ */}
      {tab === "requests" && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            <StatCard label="Total Requests" value={String(mockServiceRequests.length)} icon="description" color="#0D47A1" />
            <StatCard label="New" value={String(reqNew)} icon="fiber_new" color="#E65100" trend={{ value: "Awaiting review", positive: false }} />
            <StatCard label="Scheduled" value={String(reqScheduled)} icon="event" color="#1B5E20" />
            <StatCard label="Overdue" value={String(reqOverdue)} icon="warning" color="#B71C1C" />
          </div>

          <FilterBar onSearch={setReqSearch} searchValue={reqSearch} searchPlaceholder="Search by name, ID, or type..." filters={reqFilters} onExport={() => {}} />

          <div className={`${card} overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="bg-[#F8FAFC]">
                    <th className="px-2.5 sm:px-4 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-left">Request ID</th>
                    <th className="px-2.5 sm:px-4 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-left">Customer</th>
                    <th className="px-2.5 sm:px-4 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-left hidden md:table-cell">Portal</th>
                    <th className="px-2.5 sm:px-4 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-left hidden sm:table-cell">Type</th>
                    <th className="px-2.5 sm:px-4 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-left hidden sm:table-cell">Assigned</th>
                    <th className="px-2.5 sm:px-4 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-left hidden md:table-cell">Submitted</th>
                    <th className="px-2.5 sm:px-4 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {filteredRequests.length === 0 ? (
                    <tr><td colSpan={7} className="px-5 py-12 text-center text-[#94A3B8]">No service requests found</td></tr>
                  ) : (
                    filteredRequests.map((r: MockServiceRequest) => (
                      <tr key={r.id} onClick={() => navigate(`/fulfillment/request/${r.id}`)} className="hover:bg-[#F8FAFC] transition-colors cursor-pointer">
                        <td className="px-2.5 sm:px-4 py-3 font-semibold text-primary">{r.id}</td>
                        <td className="px-2.5 sm:px-4 py-3 font-medium text-[#0F172A]">{r.userName}</td>
                        <td className="px-2.5 sm:px-4 py-3 hidden md:table-cell">
                          <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold text-white" style={{ backgroundColor: PORTAL_COLORS[r.portal as Portal] }}>
                            {PORTAL_LABELS[r.portal as Portal].split(",")[0]}
                          </span>
                        </td>
                        <td className="px-2.5 sm:px-4 py-3 text-[#334155] hidden sm:table-cell">{r.typeLabel}</td>
                        <td className="px-2.5 sm:px-4 py-3 hidden sm:table-cell">
                          {r.assignedTo ? <span className="text-[#334155]">{r.assignedTo as string}</span> : <span className="text-[#94A3B8] italic">Unassigned</span>}
                        </td>
                        <td className="px-2.5 sm:px-4 py-3 text-[#64748B] hidden md:table-cell whitespace-nowrap">{formatDate(r.createdAt as string)}</td>
                        <td className="px-2.5 sm:px-4 py-3 text-center"><StatusBadge status={(r.status as string).replace("_", " ")} /></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ═══════════════════ CUSTOM ORDERS TAB ═══════════════════ */}
      {tab === "custom" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4">
            <StatCard label="Total Requests" value={String(mockCustomRequests.length)} icon="edit_note" color="#0D47A1" />
            <StatCard label="Awaiting Review" value={String(crNew + mockCustomRequests.filter((r) => r.status === "under_review").length)} icon="pending" color="#E65100" />
            <StatCard label="Converted to Orders" value={String(crConverted)} icon="check_circle" color="#1B5E20" />
          </div>

          <FilterBar
            onSearch={setCrSearch}
            searchValue={crSearch}
            searchPlaceholder="Search custom requests..."
            filters={[
              { key: "status", label: "All Statuses", value: crStatusFilter, onChange: setCrStatusFilter, options: [{ value: "new", label: "New" }, { value: "under_review", label: "Under Review" }, { value: "converted", label: "Converted" }, { value: "declined", label: "Declined" }] },
            ]}
          />

          <div className={`${card} overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="bg-[#F8FAFC]">
                    <th className="px-2.5 sm:px-4 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-left">ID</th>
                    <th className="px-2.5 sm:px-4 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-left">Customer</th>
                    <th className="px-2.5 sm:px-4 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-left hidden sm:table-cell">Portal</th>
                    <th className="px-2.5 sm:px-4 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-left hidden md:table-cell">Description</th>
                    <th className="px-2.5 sm:px-4 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-left hidden md:table-cell">Date</th>
                    <th className="px-2.5 sm:px-4 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-center">Status</th>
                    <th className="px-2.5 sm:px-4 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-center w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {filteredCustom.length === 0 ? (
                    <tr><td colSpan={7} className="px-5 py-12 text-center text-[#94A3B8]">No custom requests found</td></tr>
                  ) : (
                    filteredCustom.map((cr: MockCustomRequest) => (
                      <>
                        <tr key={cr.id} className="hover:bg-[#F8FAFC] transition-colors cursor-pointer" onClick={() => setExpandedCr(expandedCr === cr.id ? null : cr.id)}>
                          <td className="px-2.5 sm:px-4 py-3 font-semibold text-primary whitespace-nowrap">{cr.id}</td>
                          <td className="px-2.5 sm:px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="size-7 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
                                {cr.userName.split(" ").map((n) => n[0]).join("")}
                              </div>
                              <span className="text-[#334155] font-medium truncate">{cr.userName}</span>
                            </div>
                          </td>
                          <td className="px-2.5 sm:px-4 py-3 hidden sm:table-cell">
                            <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold text-white" style={{ backgroundColor: PORTAL_COLORS[cr.portal as Portal] }}>
                              {(cr.portal as string).charAt(0).toUpperCase() + (cr.portal as string).slice(1)}
                            </span>
                          </td>
                          <td className="px-2.5 sm:px-4 py-3 hidden md:table-cell">
                            <span className="text-[#64748B] line-clamp-1 max-w-[250px]">{cr.description}</span>
                          </td>
                          <td className="px-2.5 sm:px-4 py-3 text-[#64748B] hidden md:table-cell whitespace-nowrap">{formatDate(cr.createdAt)}</td>
                          <td className="px-2.5 sm:px-4 py-3 text-center"><StatusBadge status={(cr.status as string).replace("_", " ")} /></td>
                          <td className="px-2.5 sm:px-4 py-3 text-center">
                            <span className="material-symbols-outlined text-[18px] text-[#94A3B8]">{expandedCr === cr.id ? "expand_less" : "expand_more"}</span>
                          </td>
                        </tr>
                        {expandedCr === cr.id && (
                          <tr key={`${cr.id}-detail`}>
                            <td colSpan={7} className="px-4 pb-4 pt-0">
                              <div className="bg-[#F8FAFC] rounded-xl p-4 space-y-3">
                                <div>
                                  <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wide mb-1">Customer Description</p>
                                  <p className="text-sm text-[#0F172A]">{cr.description}</p>
                                </div>
                                {cr.notes.length > 0 && (
                                  <div>
                                    <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wide mb-1">Internal Notes</p>
                                    {cr.notes.map((n, i) => (
                                      <p key={i} className="text-sm text-[#334155]"><span className="font-semibold">{n.author}:</span> {n.text}</p>
                                    ))}
                                  </div>
                                )}
                                {cr.convertedOrderId && (
                                  <p className="text-sm text-primary font-semibold cursor-pointer hover:underline" onClick={() => navigate(`/orders/${cr.convertedOrderId}`)}>
                                    Converted → {cr.convertedOrderId}
                                  </p>
                                )}
                                {cr.declineReason && (
                                  <p className="text-sm text-red-600"><span className="font-semibold">Decline reason:</span> {cr.declineReason}</p>
                                )}
                                <div className="flex gap-2 pt-2">
                                  {cr.status !== "converted" && cr.status !== "declined" && (
                                    <>
                                      <button onClick={() => navigate("/orders/create")} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary/90 cursor-pointer">Convert to Order</button>
                                      <button onClick={() => toast.success("Request declined")} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer">Decline</button>
                                    </>
                                  )}
                                  <button onClick={() => navigate(`/users/${cr.userId}`)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#64748B] border border-[#E2E8F0] hover:bg-[#F1F5F9] cursor-pointer">View Customer</button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
