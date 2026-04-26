import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import DataTable, { type Column } from "./shared/DataTable";
import FilterBar, { type FilterConfig } from "./shared/FilterBar";
import StatusBadge from "./shared/StatusBadge";
import { getOrders, getSettings } from "../../lib/api";
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

type OrderRow = DbOrder & Record<string, unknown>;

function computeRisk(createdAt: string, status: string, slaHours: number, slaWarningHours: number): "on_track" | "at_risk" | "behind" {
  if (status === "completed" || status === "cancelled") return "on_track";
  const ageHours = (Date.now() - new Date(createdAt).getTime()) / 3_600_000;
  if (ageHours >= slaHours) return "behind";
  if (ageHours >= slaHours - slaWarningHours) return "at_risk";
  return "on_track";
}

export default function OrdersPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [portalFilter, setPortalFilter] = useState("");
  const [orders, setOrders] = useState<DbOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [slaHours, setSlaHours] = useState(48);
  const [slaWarningHours, setSlaWarningHours] = useState(12);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    setLoading(true);
    Promise.all([
      getOrders(),
      getSettings(),
    ]).then(([{ data: ordersData }, { data: settingsData }]) => {
      if (!mountedRef.current) return;
      setOrders((ordersData as DbOrder[]) ?? []);
      setLoading(false);
      if (settingsData) {
        const map: Record<string, string> = {};
        for (const row of settingsData as { key: string; value: string }[]) map[row.key] = row.value;
        if (map.sla_hours) setSlaHours(parseInt(map.sla_hours, 10) || 48);
        if (map.sla_warning_hours) setSlaWarningHours(parseInt(map.sla_warning_hours, 10) || 12);
      }
    });
    return () => { mountedRef.current = false; };
  }, []);

  const filtered = orders.filter((o) => {
    const userName = o.profiles?.name ?? o.profiles?.email ?? "";
    const matchSearch =
      !search ||
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      userName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || o.status === statusFilter;
    const matchPortal = !portalFilter || o.portal_id === portalFilter;
    return matchSearch && matchStatus && matchPortal;
  });

  const columns: Column<OrderRow>[] = [
    {
      key: "id",
      label: "Order ID",
      sortable: true,
      render: (row) => <span className="font-semibold text-primary">{row.id as string}</span>,
    },
    {
      key: "user",
      label: "User",
      hideOnMobile: true,
      render: (row) => {
        const profile = (row as DbOrder).profiles;
        const name = profile?.name ?? profile?.email ?? "—";
        const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "??";
        return (
          <div className="flex items-center gap-2.5">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={name} className="size-8 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="size-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                {initials}
              </div>
            )}
            <span className="text-sm text-[#334155] font-medium">{name}</span>
          </div>
        );
      },
    },
    {
      key: "portal_id",
      label: "Service",
      sortable: true,
      hideOnMobile: true,
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
    {
      key: "total_amount",
      label: "Amount",
      align: "right",
      sortable: true,
      render: (row) => <span className="text-sm font-semibold text-[#0F172A]">{formatNaira(row.total_amount as number)}</span>,
    },
    {
      key: "status",
      label: "Status",
      align: "center",
      render: (row) => <StatusBadge status={row.status as string} />,
    },
    {
      key: "channel",
      label: "Channel",
      hideOnMobile: true,
      render: (row) => {
        const ch = (row.channel as string | null) ?? "web";
        const icons: Record<string, string> = { web: "language", whatsapp: "chat", phone: "call", walkin: "storefront" };
        return (
          <div className="flex items-center gap-1 text-[12px] text-[#64748B]">
            <span className="material-symbols-outlined text-[14px]">{icons[ch] ?? "language"}</span>
            <span className="capitalize">{ch}</span>
          </div>
        );
      },
    },
    {
      key: "created_at",
      label: "Date",
      sortable: true,
      hideOnMobile: true,
      render: (row) => (
        <span className="text-[13px] text-[#64748B] whitespace-nowrap">
          {new Date(row.created_at as string).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
        </span>
      ),
    },
  ];

  const portalOptions = (Object.keys(PORTAL_LABELS) as Portal[]).map((p) => ({
    value: p,
    label: PORTAL_LABELS[p],
  }));

  const filters: FilterConfig[] = [
    {
      key: "status",
      label: "All Statuses",
      value: statusFilter,
      onChange: setStatusFilter,
      options: [
        { value: "pending", label: "Pending" },
        { value: "confirmed", label: "Confirmed" },
        { value: "processing", label: "Processing" },
        { value: "completed", label: "Completed" },
        { value: "cancelled", label: "Cancelled" },
      ],
    },
    {
      key: "portal",
      label: "All Portals",
      value: portalFilter,
      onChange: setPortalFilter,
      options: portalOptions,
    },
  ];

  const activeOrders = orders.filter((o) => o.status !== "completed" && o.status !== "cancelled");
  const atRiskCount = activeOrders.filter((o) => computeRisk(o.created_at, o.status, slaHours, slaWarningHours) === "at_risk").length;
  const behindCount = activeOrders.filter((o) => computeRisk(o.created_at, o.status, slaHours, slaWarningHours) === "behind").length;
  const pendingCount = orders.filter((o) => o.status === "pending").length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0F172A]">Orders</h1>
          <p className="text-sm text-[#64748B] mt-0.5">{loading ? "Loading…" : `${orders.length} total orders`}</p>
        </div>
        <button
          onClick={() => navigate("/orders/create")}
          className="inline-flex items-center gap-1.5 px-2.5 sm:px-4 py-2 sm:py-2.5 bg-primary text-white text-sm font-semibold rounded-xl cursor-pointer hover:brightness-[0.92] active:scale-[0.98] transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span className="hidden sm:inline">Create Order</span>
        </button>
      </div>

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

      <FilterBar
        onSearch={setSearch}
        searchValue={search}
        searchPlaceholder="Search by order ID or user name..."
        filters={filters}
      />

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
        <DataTable<OrderRow>
          columns={columns}
          data={filtered as OrderRow[]}
          onRowClick={(row) => navigate(`/orders/${row.id as string}`)}
          pageSize={10}
        />
      )}
    </div>
  );
}
