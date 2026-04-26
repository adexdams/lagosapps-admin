import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import StatCard from "./shared/StatCard";
import FilterBar, { type FilterConfig } from "./shared/FilterBar";
import StatusBadge from "./shared/StatusBadge";
import { useToast } from "../../hooks/useToast";
import {
  getFulfillmentOrders,
  getServiceRequestsList,
  getCustomRequestsList,
  upsertFulfillmentTracking,
} from "../../lib/api";
import { supabase } from "../../lib/supabase";
import {
  formatNaira,
  formatDate,
  PORTAL_LABELS,
  PORTAL_COLORS,
  type Portal,
} from "../../data/adminMockData";

type FulfillmentTab = "orders" | "requests" | "custom";

interface DbFulfillmentOrder {
  id: string;
  user_id: string;
  portal_id: Portal;
  total_amount: number;
  status: string;
  updated_at: string;
  profiles: { name: string | null; email: string } | null;
  fulfillment_tracking: Array<{
    id: string;
    assigned_to: string | null;
    risk_level: "on_track" | "at_risk" | "behind";
    priority: string;
    progress: number;
    fulfillment_deadline: string | null;
  }> | null;
}

interface DbServiceRequest {
  id: string;
  user_id: string;
  portal_id: Portal;
  type: string;
  type_label: string;
  status: string;
  assigned_to: string | null;
  details: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  profiles: { name: string | null; email: string } | null;
}

interface DbCustomRequest {
  id: string;
  user_id: string;
  portal_id: Portal;
  description: string;
  status: string;
  converted_order_id: string | null;
  decline_reason: string | null;
  created_at: string;
  profiles: { name: string | null; email: string } | null;
}

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  profiles: { name: string | null; email: string; avatar_url: string | null } | null;
}

const STATUS_DOT: Record<string, string> = {
  on_track: "#059669",
  at_risk: "#EA580C",
  behind: "#DC2626",
};

export default function FulfillmentPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;
  const [tab, setTab] = useState<FulfillmentTab>("orders");

  // Shared team member list for assignment dropdowns
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  // ── Tab: Orders ──
  const [orders, setOrders] = useState<DbFulfillmentOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // ── Tab: Service Requests ──
  const [serviceRequests, setServiceRequests] = useState<DbServiceRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [reqSearch, setReqSearch] = useState("");
  const [reqPortalFilter, setReqPortalFilter] = useState("");
  const [reqStatusFilter, setReqStatusFilter] = useState("");

  // ── Tab: Custom Orders ──
  const [customRequests, setCustomRequests] = useState<DbCustomRequest[]>([]);
  const [loadingCustom, setLoadingCustom] = useState(true);
  const [crSearch, setCrSearch] = useState("");
  const [crStatusFilter, setCrStatusFilter] = useState("");
  const [expandedCr, setExpandedCr] = useState<string | null>(null);

  const loadTeam = useCallback(async () => {
    const { data } = await supabase
      .from("admin_team_members")
      .select("id, user_id, role, profiles(name, email, avatar_url)")
      .eq("is_active", true);
    setTeamMembers((data as unknown as TeamMember[]) ?? []);
  }, []);

  const loadOrders = useCallback(async () => {
    setLoadingOrders(true);
    const { data, error } = await getFulfillmentOrders();
    setLoadingOrders(false);
    if (error) { toastRef.current.error(error.message); return; }
    setOrders((data as unknown as DbFulfillmentOrder[]) ?? []);
  }, []);

  const loadRequests = useCallback(async () => {
    setLoadingRequests(true);
    const { data, error } = await getServiceRequestsList();
    setLoadingRequests(false);
    if (error) { toastRef.current.error(error.message); return; }
    setServiceRequests((data as unknown as DbServiceRequest[]) ?? []);
  }, []);

  const loadCustom = useCallback(async () => {
    setLoadingCustom(true);
    const { data, error } = await getCustomRequestsList();
    setLoadingCustom(false);
    if (error) { toastRef.current.error(error.message); return; }
    setCustomRequests((data as unknown as DbCustomRequest[]) ?? []);
  }, []);

  useEffect(() => {
    loadTeam();
    loadOrders();
    loadRequests();
    loadCustom();
  }, [loadTeam, loadOrders, loadRequests, loadCustom]);

  // Derivations — order fulfillment stats
  const onTrack = orders.filter((o) => (o.fulfillment_tracking?.[0]?.risk_level ?? "on_track") === "on_track").length;
  const atRisk = orders.filter((o) => o.fulfillment_tracking?.[0]?.risk_level === "at_risk").length;
  const behind = orders.filter((o) => o.fulfillment_tracking?.[0]?.risk_level === "behind").length;
  const unassigned = orders.filter((o) => !o.fulfillment_tracking?.[0]?.assigned_to);

  async function handleAssignOrder(orderId: string, userId: string) {
    const { error } = await upsertFulfillmentTracking({
      order_id: orderId,
      assigned_to: userId,
      risk_level: "on_track",
      priority: "medium",
      progress: 0,
    });
    if (error) { toastRef.current.error(error.message); return; }
    toastRef.current.success("Assigned");
    loadOrders();
  }

  // Filters
  const filteredRequests = useMemo(() => {
    return serviceRequests.filter((r) => {
      const name = r.profiles?.name ?? r.profiles?.email ?? "";
      const q = reqSearch.toLowerCase();
      const matchSearch = !q || name.toLowerCase().includes(q) || r.id.toLowerCase().includes(q) || r.type_label.toLowerCase().includes(q);
      const matchPortal = !reqPortalFilter || r.portal_id === reqPortalFilter;
      const matchStatus = !reqStatusFilter || r.status === reqStatusFilter;
      return matchSearch && matchPortal && matchStatus;
    });
  }, [serviceRequests, reqSearch, reqPortalFilter, reqStatusFilter]);

  const reqNew = serviceRequests.filter((r) => r.status === "new").length;
  const reqScheduled = serviceRequests.filter((r) => r.status === "scheduled").length;
  const reqOverdue = serviceRequests.filter((r) => r.status === "in_progress" && new Date(r.updated_at) < new Date(Date.now() - 7 * 86400000)).length;

  const filteredCustom = useMemo(() => {
    return customRequests.filter((r) => {
      const name = r.profiles?.name ?? r.profiles?.email ?? "";
      const q = crSearch.toLowerCase();
      const matchSearch = !q || name.toLowerCase().includes(q) || r.id.toLowerCase().includes(q);
      const matchStatus = !crStatusFilter || r.status === crStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [customRequests, crSearch, crStatusFilter]);

  const crNew = customRequests.filter((r) => r.status === "new").length;
  const crConverted = customRequests.filter((r) => r.status === "converted").length;

  const card = "bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60";

  const reqFilters: FilterConfig[] = [
    {
      key: "portal",
      label: "All Portals",
      options: (["solar", "health", "events", "community", "logistics"] as Portal[]).map((p) => ({ value: p, label: PORTAL_LABELS[p] })),
      value: reqPortalFilter,
      onChange: setReqPortalFilter,
    },
    {
      key: "status",
      label: "All Statuses",
      options: [
        { value: "new", label: "New" },
        { value: "reviewing", label: "Reviewing" },
        { value: "scheduled", label: "Scheduled" },
        { value: "in_progress", label: "In Progress" },
        { value: "completed", label: "Completed" },
        { value: "declined", label: "Declined" },
      ],
      value: reqStatusFilter,
      onChange: setReqStatusFilter,
    },
  ];

  function teamMemberName(userId: string | null): string {
    if (!userId) return "Unassigned";
    const m = teamMembers.find((t) => t.user_id === userId);
    return m?.profiles?.name ?? m?.profiles?.email ?? "—";
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-[#0F172A]">Fulfillment</h1>
        <p className="text-sm text-[#64748B] mt-0.5">Track and manage all assigned work</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl p-1 shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 w-fit">
        {([
          { key: "orders" as const, label: "Order Fulfillment", count: orders.length },
          { key: "requests" as const, label: "Service Requests", count: serviceRequests.length },
          { key: "custom" as const, label: "Custom Orders", count: customRequests.length },
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

      {/* ORDER FULFILLMENT TAB */}
      {tab === "orders" && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            <StatCard label="Total Active" value={String(orders.length)} icon="assignment" color="#0D47A1" />
            <StatCard label="On Track" value={String(onTrack)} icon="check_circle" color="#1B5E20" />
            <StatCard label="At Risk" value={String(atRisk)} icon="warning" color="#E65100" />
            <StatCard label="Behind" value={String(behind)} icon="error" color="#B71C1C" />
          </div>

          {loadingOrders ? (
            <p className="text-sm text-[#94A3B8] py-8 text-center">Loading orders…</p>
          ) : orders.length === 0 ? (
            <div className="py-12 text-center">
              <span className="material-symbols-outlined text-[40px] text-[#CBD5E1] block mb-2">assignment_turned_in</span>
              <p className="text-sm text-[#64748B]">No orders currently in fulfillment</p>
              <p className="text-xs text-[#94A3B8] mt-1">Orders in <strong>Pending</strong>, <strong>Confirmed</strong>, or <strong>Processing</strong> status will appear here.</p>
            </div>
          ) : (
            <>
              {unassigned.length > 0 && (
                <div>
                  <h2 className="text-sm font-bold text-[#0F172A] mb-3">Unassigned Orders ({unassigned.length})</h2>
                  <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2">
                    {unassigned.map((o) => (
                      <div key={o.id} className="min-w-[220px] sm:min-w-[260px] bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 p-3 sm:p-4 flex-shrink-0">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-bold text-primary">{o.id}</span>
                          <span className="text-[12px] text-[#64748B]">{formatNaira(o.total_amount)}</span>
                        </div>
                        <p className="text-[13px] text-[#334155] mb-1">{o.profiles?.name ?? o.profiles?.email ?? "—"}</p>
                        <p className="text-[12px] text-[#64748B] mb-3">{PORTAL_LABELS[o.portal_id]}</p>
                        <select value="" onChange={(e) => handleAssignOrder(o.id, e.target.value)} className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm text-[#334155] bg-white outline-none cursor-pointer">
                          <option value="" disabled>Assign to...</option>
                          {teamMembers.map((m) => <option key={m.id} value={m.user_id}>{m.profiles?.name ?? m.profiles?.email}</option>)}
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
                        <th className="px-2.5 sm:px-4 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-left hidden sm:table-cell">Assigned</th>
                        <th className="px-2.5 sm:px-4 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-center">Risk</th>
                        <th className="px-2.5 sm:px-4 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-left hidden md:table-cell">Updated</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F5F9]">
                      {orders.map((o) => {
                        const track = o.fulfillment_tracking?.[0];
                        const risk = track?.risk_level ?? "on_track";
                        const assignedUser = track?.assigned_to;
                        return (
                          <tr key={o.id} className="hover:bg-[#F8FAFC] transition-colors">
                            <td className="px-2.5 sm:px-4 py-3">
                              <button onClick={() => navigate(`/fulfillment/${o.id}`)} className="font-semibold text-primary cursor-pointer hover:underline">{o.id}</button>
                            </td>
                            <td className="px-2.5 sm:px-4 py-3 text-[#334155] hidden sm:table-cell">{o.profiles?.name ?? o.profiles?.email ?? "—"}</td>
                            <td className="px-2.5 sm:px-4 py-3 text-[#64748B] hidden md:table-cell">{PORTAL_LABELS[o.portal_id]}</td>
                            <td className="px-2.5 sm:px-4 py-3 hidden sm:table-cell">
                              {assignedUser ? <span className="text-sm text-[#334155]">{teamMemberName(assignedUser)}</span> : <StatusBadge status="pending" />}
                            </td>
                            <td className="px-2.5 sm:px-4 py-3 text-center">
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold capitalize">
                                <span className="size-2 rounded-full" style={{ backgroundColor: STATUS_DOT[risk] }} />
                                {risk.replace("_", " ")}
                              </span>
                            </td>
                            <td className="px-2.5 sm:px-4 py-3 text-[#64748B] hidden md:table-cell whitespace-nowrap">{formatDate(o.updated_at)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* SERVICE REQUESTS TAB */}
      {tab === "requests" && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            <StatCard label="Total Requests" value={String(serviceRequests.length)} icon="description" color="#0D47A1" />
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
                  {loadingRequests ? (
                    <tr><td colSpan={7} className="px-5 py-12 text-center text-[#94A3B8]">Loading requests…</td></tr>
                  ) : filteredRequests.length === 0 ? (
                    <tr><td colSpan={7} className="px-5 py-12 text-center text-[#94A3B8]">No service requests found</td></tr>
                  ) : (
                    filteredRequests.map((r) => (
                      <tr key={r.id} onClick={() => navigate(`/fulfillment/request/${r.id}`)} className="hover:bg-[#F8FAFC] transition-colors cursor-pointer">
                        <td className="px-2.5 sm:px-4 py-3 font-semibold text-primary">{r.id}</td>
                        <td className="px-2.5 sm:px-4 py-3 font-medium text-[#0F172A]">{r.profiles?.name ?? r.profiles?.email ?? "—"}</td>
                        <td className="px-2.5 sm:px-4 py-3 hidden md:table-cell">
                          <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold text-white" style={{ backgroundColor: PORTAL_COLORS[r.portal_id] }}>
                            {PORTAL_LABELS[r.portal_id].split(",")[0]}
                          </span>
                        </td>
                        <td className="px-2.5 sm:px-4 py-3 text-[#334155] hidden sm:table-cell">{r.type_label}</td>
                        <td className="px-2.5 sm:px-4 py-3 hidden sm:table-cell">
                          {r.assigned_to ? <span className="text-[#334155]">{teamMemberName(r.assigned_to)}</span> : <span className="text-[#94A3B8] italic">Unassigned</span>}
                        </td>
                        <td className="px-2.5 sm:px-4 py-3 text-[#64748B] hidden md:table-cell whitespace-nowrap">{formatDate(r.created_at)}</td>
                        <td className="px-2.5 sm:px-4 py-3 text-center"><StatusBadge status={r.status.replace("_", " ")} /></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* CUSTOM ORDERS TAB */}
      {tab === "custom" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4">
            <StatCard label="Total Requests" value={String(customRequests.length)} icon="edit_note" color="#0D47A1" />
            <StatCard label="Awaiting Review" value={String(crNew + customRequests.filter((r) => r.status === "under_review").length)} icon="pending" color="#E65100" />
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
                  {loadingCustom ? (
                    <tr><td colSpan={7} className="px-5 py-12 text-center text-[#94A3B8]">Loading custom requests…</td></tr>
                  ) : filteredCustom.length === 0 ? (
                    <tr><td colSpan={7} className="px-5 py-12 text-center text-[#94A3B8]">No custom requests found</td></tr>
                  ) : (
                    filteredCustom.map((cr) => {
                      const name = cr.profiles?.name ?? cr.profiles?.email ?? "—";
                      const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
                      return (
                        <React.Fragment key={cr.id}>
                          <tr className="hover:bg-[#F8FAFC] transition-colors cursor-pointer" onClick={() => setExpandedCr(expandedCr === cr.id ? null : cr.id)}>
                            <td className="px-2.5 sm:px-4 py-3 font-semibold text-primary whitespace-nowrap">{cr.id}</td>
                            <td className="px-2.5 sm:px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="size-7 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
                                  {initials}
                                </div>
                                <span className="text-[#334155] font-medium truncate">{name}</span>
                              </div>
                            </td>
                            <td className="px-2.5 sm:px-4 py-3 hidden sm:table-cell">
                              <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold text-white" style={{ backgroundColor: PORTAL_COLORS[cr.portal_id] }}>
                                {cr.portal_id.charAt(0).toUpperCase() + cr.portal_id.slice(1)}
                              </span>
                            </td>
                            <td className="px-2.5 sm:px-4 py-3 hidden md:table-cell">
                              <span className="text-[#64748B] line-clamp-1 max-w-[250px]">{cr.description}</span>
                            </td>
                            <td className="px-2.5 sm:px-4 py-3 text-[#64748B] hidden md:table-cell whitespace-nowrap">{formatDate(cr.created_at)}</td>
                            <td className="px-2.5 sm:px-4 py-3 text-center"><StatusBadge status={cr.status.replace("_", " ")} /></td>
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
                                  {cr.converted_order_id && (
                                    <p className="text-sm text-primary font-semibold cursor-pointer hover:underline" onClick={() => navigate(`/orders/${cr.converted_order_id}`)}>
                                      Converted → {cr.converted_order_id}
                                    </p>
                                  )}
                                  {cr.decline_reason && (
                                    <p className="text-sm text-red-600"><span className="font-semibold">Decline reason:</span> {cr.decline_reason}</p>
                                  )}
                                  <div className="flex gap-2 pt-2">
                                    {cr.status !== "converted" && cr.status !== "declined" && (
                                      <button
                                        onClick={() => navigate("/orders/create", { state: { userId: cr.user_id, portalId: cr.portal_id, description: cr.description, requestId: cr.id, requestType: "custom" } })}
                                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary/90 cursor-pointer"
                                      >Convert to Order</button>
                                    )}
                                    <button onClick={() => navigate(`/users/${cr.user_id}`)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#64748B] border border-[#E2E8F0] hover:bg-[#F1F5F9] cursor-pointer">View Customer</button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
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
