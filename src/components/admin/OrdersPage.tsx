import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import DataTable, { type Column } from "./shared/DataTable";
import FilterBar, { type FilterConfig } from "./shared/FilterBar";
import StatusBadge from "./shared/StatusBadge";
import {
  getOrders, getSettings, getCustomRequestsList,
  updateCustomRequestStatus,
} from "../../lib/api";
import {
  formatNaira,
  PORTAL_LABELS,
  PORTAL_COLORS,
  type Portal,
} from "../../data/adminMockData";

interface DbOrder {
  id: string;
  user_id: string;
  portal_id: Portal;
  description: string | null;
  total_amount: number;
  payment_amount: number;
  status: "pending" | "confirmed" | "processing" | "completed" | "cancelled";
  channel: string | null;
  created_at: string;
  profiles: { name: string | null; email: string; avatar_url: string | null } | null;
}

interface DbCustomRequest {
  id: string;
  user_id: string;
  portal_id: string;
  description: string;
  status: "new" | "under_review" | "converted" | "declined";
  decline_reason: string | null;
  converted_order_id: string | null;
  created_at: string;
  profiles: { id?: string; name: string | null; email: string; avatar_url?: string | null } | null;
  custom_request_notes?: { id: string; text: string; created_at: string; profiles: { name: string | null } | null }[];
}

type OrderRow = DbOrder & Record<string, unknown>;
type CRRow = DbCustomRequest & Record<string, unknown>;

function computeRisk(createdAt: string, status: string, slaHours: number, slaWarningHours: number) {
  if (status === "completed" || status === "cancelled") return "on_track";
  const ageHours = (Date.now() - new Date(createdAt).getTime()) / 3_600_000;
  if (ageHours >= slaHours) return "behind";
  if (ageHours >= slaHours - slaWarningHours) return "at_risk";
  return "on_track";
}

const CR_STATUS_LABEL: Record<string, string> = { new: "New", under_review: "Under Review", converted: "Converted", declined: "Declined" };
const CR_STATUS_COLOR: Record<string, string> = { new: "#2563EB", under_review: "#D97706", converted: "#059669", declined: "#DC2626" };

export default function OrdersPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"orders" | "custom_requests">("orders");

  // Orders state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [portalFilter, setPortalFilter] = useState("");
  const [orders, setOrders] = useState<DbOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [slaHours, setSlaHours] = useState(48);
  const [slaWarningHours, setSlaWarningHours] = useState(12);

  // Custom requests list state
  const [crSearch, setCrSearch] = useState("");
  const [crStatusFilter, setCrStatusFilter] = useState("");
  const [crPortalFilter, setCrPortalFilter] = useState("");
  const [customRequests, setCustomRequests] = useState<DbCustomRequest[]>([]);
  const [crLoading, setCrLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const mountedRef = useRef(true);

  // Load orders + custom requests together on mount so badge is always accurate
  useEffect(() => {
    mountedRef.current = true;
    Promise.all([
      getOrders(),
      getSettings(),
      getCustomRequestsList(),
    ]).then(([{ data: ordersData }, { data: settingsData }, { data: crData }]) => {
      if (!mountedRef.current) return;
      setOrders((ordersData as DbOrder[]) ?? []);
      setLoading(false);
      setCustomRequests((crData as DbCustomRequest[]) ?? []);
      setCrLoading(false);
      if (settingsData) {
        const map: Record<string, string> = {};
        for (const row of settingsData as { key: string; value: string }[]) map[row.key] = row.value;
        if (map.sla_hours) setSlaHours(parseInt(map.sla_hours, 10) || 48);
        if (map.sla_warning_hours) setSlaWarningHours(parseInt(map.sla_warning_hours, 10) || 12);
      }
    });
    return () => { mountedRef.current = false; };
  }, []);

  async function handleInlineStatusChange(id: string, newStatus: string) {
    setUpdatingId(id);
    await updateCustomRequestStatus(id, { status: newStatus });
    setCustomRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: newStatus as DbCustomRequest["status"] } : r));
    setUpdatingId(null);
  }

  // ── Orders tab ──────────────────────────────────────────────
  const filtered = orders.filter((o) => {
    const userName = o.profiles?.name ?? o.profiles?.email ?? "";
    const matchSearch = !search || o.id.toLowerCase().includes(search.toLowerCase()) || userName.toLowerCase().includes(search.toLowerCase());
    return matchSearch && (!statusFilter || o.status === statusFilter) && (!portalFilter || o.portal_id === portalFilter);
  });

  const orderColumns: Column<OrderRow>[] = [
    {
      key: "id", label: "Order ID", sortable: true,
      render: (row) => <span className="font-semibold text-primary">{row.id as string}</span>,
    },
    {
      key: "user", label: "User", hideOnMobile: true,
      render: (row) => {
        const p = (row as DbOrder).profiles;
        const name = p?.name ?? p?.email ?? "—";
        const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "??";
        return (
          <div className="flex items-center gap-2.5">
            {p?.avatar_url ? <img src={p.avatar_url} alt={name} className="size-8 rounded-full object-cover flex-shrink-0" /> : (
              <div className="size-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">{initials}</div>
            )}
            <span className="text-sm text-[#334155] font-medium">{name}</span>
          </div>
        );
      },
    },
    {
      key: "portal_id", label: "Service", sortable: true, hideOnMobile: true,
      render: (row) => {
        const portal = (row as DbOrder).portal_id;
        return (
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full flex-shrink-0" style={{ backgroundColor: PORTAL_COLORS[portal] }} />
            <span className="text-[13px] text-[#334155]">{PORTAL_LABELS[portal]}</span>
          </div>
        );
      },
    },
    { key: "total_amount", label: "Amount", align: "right", sortable: true, render: (row) => <span className="text-sm font-semibold text-[#0F172A]">{formatNaira(row.total_amount as number)}</span> },
    { key: "status", label: "Status", align: "center", render: (row) => <StatusBadge status={row.status as string} /> },
    {
      key: "channel", label: "Channel", hideOnMobile: true,
      render: (row) => {
        const ch = (row.channel as string | null) ?? "web";
        const icons: Record<string, string> = { web: "language", whatsapp: "chat", phone: "call", walkin: "storefront" };
        return <div className="flex items-center gap-1 text-[12px] text-[#64748B]"><span className="material-symbols-outlined text-[14px]">{icons[ch] ?? "language"}</span><span className="capitalize">{ch}</span></div>;
      },
    },
    {
      key: "created_at", label: "Date", sortable: true, hideOnMobile: true,
      render: (row) => <span className="text-[13px] text-[#64748B] whitespace-nowrap">{new Date(row.created_at as string).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</span>,
    },
  ];

  const portalOptions = (Object.keys(PORTAL_LABELS) as Portal[]).map((p) => ({ value: p, label: PORTAL_LABELS[p] }));

  const orderFilters: FilterConfig[] = [
    { key: "status", label: "All Statuses", value: statusFilter, onChange: setStatusFilter, options: [{ value: "pending", label: "Pending" }, { value: "confirmed", label: "Confirmed" }, { value: "processing", label: "Processing" }, { value: "completed", label: "Completed" }, { value: "cancelled", label: "Cancelled" }] },
    { key: "portal", label: "All Portals", value: portalFilter, onChange: setPortalFilter, options: portalOptions },
  ];

  const activeOrders = orders.filter((o) => o.status !== "completed" && o.status !== "cancelled");
  const atRiskCount = activeOrders.filter((o) => computeRisk(o.created_at, o.status, slaHours, slaWarningHours) === "at_risk").length;
  const behindCount = activeOrders.filter((o) => computeRisk(o.created_at, o.status, slaHours, slaWarningHours) === "behind").length;
  const pendingCount = orders.filter((o) => o.status === "pending").length;

  // ── Custom Requests tab ─────────────────────────────────────
  const filteredCR = customRequests.filter((r) => {
    const userName = r.profiles?.name ?? r.profiles?.email ?? "";
    const matchSearch = !crSearch || r.id.toLowerCase().includes(crSearch.toLowerCase()) || userName.toLowerCase().includes(crSearch.toLowerCase()) || r.description.toLowerCase().includes(crSearch.toLowerCase());
    return matchSearch && (!crStatusFilter || r.status === crStatusFilter) && (!crPortalFilter || r.portal_id === crPortalFilter);
  });

  const crColumns: Column<CRRow>[] = [
    {
      key: "id", label: "Request ID", sortable: true,
      render: (row) => <span className="font-semibold text-[#6366F1] text-[13px]">{row.id as string}</span>,
    },
    {
      key: "user", label: "Customer",
      render: (row) => {
        const p = (row as DbCustomRequest).profiles;
        const name = p?.name ?? p?.email ?? "—";
        const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "??";
        return (
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-full bg-gradient-to-br from-[#6366F1] to-[#6366F1]/70 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">{initials}</div>
            <span className="text-sm text-[#334155] font-medium">{name}</span>
          </div>
        );
      },
    },
    {
      key: "portal_id", label: "Portal", hideOnMobile: true,
      render: (row) => {
        const portal = row.portal_id as string;
        return (
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full flex-shrink-0" style={{ backgroundColor: PORTAL_COLORS[portal as Portal] ?? "#94A3B8" }} />
            <span className="text-[13px] text-[#334155]">{PORTAL_LABELS[portal as Portal] ?? portal}</span>
          </div>
        );
      },
    },
    {
      key: "description", label: "Request",
      render: (row) => <span className="text-[13px] text-[#334155] line-clamp-2 max-w-xs">{row.description as string}</span>,
    },
    {
      key: "status", label: "Status", align: "center", sortable: true,
      render: (row) => {
        const s = row.status as string;
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold" style={{ color: CR_STATUS_COLOR[s] ?? "#64748B", backgroundColor: (CR_STATUS_COLOR[s] ?? "#94A3B8") + "18" }}>
            {CR_STATUS_LABEL[s] ?? s}
          </span>
        );
      },
    },
    {
      key: "actions", label: "", align: "center",
      render: (row) => {
        const id = row.id as string;
        const isBusy = updatingId === id;
        return (
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <select
              value={row.status as string}
              disabled={isBusy}
              onChange={(e) => void handleInlineStatusChange(id, e.target.value)}
              className="text-[12px] border border-[#E8ECF1] rounded-lg px-2 py-1.5 bg-white text-[#334155] cursor-pointer disabled:opacity-50"
            >
              <option value="new">New</option>
              <option value="under_review">Under Review</option>
              <option value="converted">Converted</option>
              <option value="declined">Declined</option>
            </select>
          </div>
        );
      },
    },
    {
      key: "created_at", label: "Date", sortable: true, hideOnMobile: true,
      render: (row) => <span className="text-[13px] text-[#64748B] whitespace-nowrap">{new Date(row.created_at as string).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</span>,
    },
  ];

  const crFilters: FilterConfig[] = [
    { key: "status", label: "All Statuses", value: crStatusFilter, onChange: setCrStatusFilter, options: [{ value: "new", label: "New" }, { value: "under_review", label: "Under Review" }, { value: "converted", label: "Converted" }, { value: "declined", label: "Declined" }] },
    { key: "portal", label: "All Portals", value: crPortalFilter, onChange: setCrPortalFilter, options: portalOptions },
  ];

  const pendingCRCount = customRequests.filter((r) => r.status === "new" || r.status === "under_review").length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0F172A]">Orders</h1>
          <p className="text-sm text-[#64748B] mt-0.5">
            {activeTab === "orders" ? (loading ? "Loading…" : `${orders.length} total orders`) : (crLoading ? "Loading…" : `${customRequests.length} custom requests`)}
          </p>
        </div>
        {activeTab === "orders" && (
          <button onClick={() => navigate("/orders/create")} className="inline-flex items-center gap-1.5 px-2.5 sm:px-4 py-2 sm:py-2.5 bg-primary text-white text-sm font-semibold rounded-xl cursor-pointer hover:brightness-[0.92] active:scale-[0.98] transition-all">
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span className="hidden sm:inline">Create Order</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl p-1 shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 w-fit">
        <button onClick={() => setActiveTab("orders")} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${activeTab === "orders" ? "bg-primary text-white" : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]"}`}>
          Orders
        </button>
        <button onClick={() => setActiveTab("custom_requests")} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${activeTab === "custom_requests" ? "bg-primary text-white" : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]"}`}>
          Custom Requests
          {pendingCRCount > 0 && (
            <span className="size-5 bg-[#6366F1] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {pendingCRCount > 99 ? "99+" : pendingCRCount}
            </span>
          )}
        </button>
      </div>

      {/* ── ORDERS TAB ── */}
      {activeTab === "orders" && (
        <>
          {!loading && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white rounded-xl border border-[#E8ECF1]/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4">
                <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wide">Total Orders</p>
                <p className="text-2xl font-bold text-[#0F172A] mt-1">{orders.length}</p>
              </div>
              <div className="bg-white rounded-xl border border-[#E8ECF1]/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4">
                <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wide">Pending</p>
                <p className="text-2xl font-bold text-[#0F172A] mt-1">{pendingCount}</p>
              </div>
              <div className="bg-white rounded-xl border border-[#FED7AA] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4 bg-[#FFF7ED]">
                <p className="text-[11px] font-semibold text-[#EA580C] uppercase tracking-wide">At Risk</p>
                <p className="text-2xl font-bold text-[#EA580C] mt-1">{atRiskCount}</p>
                <p className="text-[10px] text-[#94A3B8] mt-0.5">SLA &lt; {slaWarningHours}h left</p>
              </div>
              <div className="bg-white rounded-xl border border-[#FECACA] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4 bg-[#FEF2F2]">
                <p className="text-[11px] font-semibold text-[#DC2626] uppercase tracking-wide">Behind SLA</p>
                <p className="text-2xl font-bold text-[#DC2626] mt-1">{behindCount}</p>
                <p className="text-[10px] text-[#94A3B8] mt-0.5">Over {slaHours}h old</p>
              </div>
            </div>
          )}
          <FilterBar onSearch={setSearch} searchValue={search} searchPlaceholder="Search by order ID or user name..." filters={orderFilters} />
          {loading ? (
            <div className="py-16 text-center text-sm text-[#94A3B8]">Loading orders…</div>
          ) : orders.length === 0 ? (
            <div className="py-16 text-center">
              <span className="material-symbols-outlined text-[48px] text-[#CBD5E1] block mb-2">receipt_long</span>
              <p className="text-sm text-[#64748B]">No orders yet</p>
              <p className="text-xs text-[#94A3B8] mt-1">Orders will appear here when customers check out or when you create one manually.</p>
              <button onClick={() => navigate("/orders/create")} className="mt-3 text-sm font-semibold text-primary hover:underline cursor-pointer">Create the first order</button>
            </div>
          ) : (
            <DataTable<OrderRow> columns={orderColumns} data={filtered as OrderRow[]} onRowClick={(row) => navigate(`/orders/${row.id as string}`)} pageSize={10} />
          )}
        </>
      )}

      {/* ── CUSTOM REQUESTS TAB ── */}
      {activeTab === "custom_requests" && (
        <>
          {!crLoading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-white rounded-xl border border-[#E8ECF1]/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4">
                <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wide">Total Requests</p>
                <p className="text-2xl font-bold text-[#0F172A] mt-1">{customRequests.length}</p>
              </div>
              <div className="bg-white rounded-xl border border-[#E0E7FF] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4 bg-[#EEF2FF]">
                <p className="text-[11px] font-semibold text-[#6366F1] uppercase tracking-wide">Needs Review</p>
                <p className="text-2xl font-bold text-[#6366F1] mt-1">{pendingCRCount}</p>
                <p className="text-[10px] text-[#94A3B8] mt-0.5">New + Under Review</p>
              </div>
              <div className="bg-white rounded-xl border border-[#D1FAE5] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4 bg-[#F0FDF4]">
                <p className="text-[11px] font-semibold text-[#059669] uppercase tracking-wide">Converted</p>
                <p className="text-2xl font-bold text-[#059669] mt-1">{customRequests.filter((r) => r.status === "converted").length}</p>
              </div>
            </div>
          )}
          <FilterBar onSearch={setCrSearch} searchValue={crSearch} searchPlaceholder="Search by ID, customer or description..." filters={crFilters} />
          {crLoading ? (
            <div className="py-16 text-center text-sm text-[#94A3B8]">Loading custom requests…</div>
          ) : customRequests.length === 0 ? (
            <div className="py-16 text-center">
              <span className="material-symbols-outlined text-[48px] text-[#CBD5E1] block mb-2">edit_note</span>
              <p className="text-sm text-[#64748B]">No custom requests yet</p>
              <p className="text-xs text-[#94A3B8] mt-1">Custom requests appear when users submit freeform orders from Groceries or Logistics portals.</p>
            </div>
          ) : (
            <DataTable<CRRow> columns={crColumns} data={filteredCR as CRRow[]} onRowClick={(row) => navigate(`/orders/requests/${row.id as string}`)} pageSize={10} />
          )}
        </>
      )}

    </div>
  );
}
