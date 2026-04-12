import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DataTable, { type Column } from "./shared/DataTable";
import FilterBar, { type FilterConfig } from "./shared/FilterBar";
import StatusBadge from "./shared/StatusBadge";
import {
  mockOrders,
  formatNaira,
  PORTAL_LABELS,
  PORTAL_COLORS,
  type MockOrder,
  type Portal,
} from "../../data/adminMockData";

type OrderRow = MockOrder & Record<string, unknown>;

export default function OrdersPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [portalFilter, setPortalFilter] = useState("");

  const filtered = mockOrders.filter((o) => {
    const matchSearch =
      !search ||
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.userName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || o.status === statusFilter;
    const matchPortal = !portalFilter || o.portal === portalFilter;
    return matchSearch && matchStatus && matchPortal;
  });

  const columns: Column<OrderRow>[] = [
    {
      key: "id",
      label: "Order ID",
      sortable: true,
      render: (row) => <span className="font-semibold text-primary">{row.id}</span>,
    },
    {
      key: "userName",
      label: "User",
      sortable: true,
      hideOnMobile: true,
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
            {(row.userName as string).split(" ").map((w: string) => w[0]).join("").slice(0, 2)}
          </div>
          <span className="text-sm text-[#334155] font-medium">{row.userName}</span>
        </div>
      ),
    },
    {
      key: "portal",
      label: "Service",
      sortable: true,
      hideOnMobile: true,
      render: (row) => {
        const portal = row.portal as Portal;
        return (
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full flex-shrink-0" style={{ backgroundColor: PORTAL_COLORS[portal] }} />
            <span className="text-[13px] text-[#334155]">{PORTAL_LABELS[portal]}</span>
          </div>
        );
      },
    },
    {
      key: "quantity",
      label: "Items",
      align: "center",
      hideOnMobile: true,
      render: (row) => <span className="text-sm text-[#334155]">{row.quantity}</span>,
    },
    {
      key: "amount",
      label: "Amount",
      align: "right",
      sortable: true,
      render: (row) => <span className="text-sm font-semibold text-[#0F172A]">{formatNaira(row.amount as number)}</span>,
    },
    {
      key: "status",
      label: "Status",
      align: "center",
      render: (row) => <StatusBadge status={row.status as string} />,
    },
    {
      key: "createdAt",
      label: "Date",
      sortable: true,
      hideOnMobile: true,
      render: (row) => (
        <span className="text-[13px] text-[#64748B] whitespace-nowrap">
          {new Date(row.createdAt as string).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
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

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0F172A]">Orders</h1>
          <p className="text-sm text-[#64748B] mt-0.5">{mockOrders.length} total orders</p>
        </div>
        <button
          onClick={() => navigate("/orders/create")}
          className="inline-flex items-center gap-1.5 px-2.5 sm:px-4 py-2 sm:py-2.5 bg-primary text-white text-sm font-semibold rounded-xl cursor-pointer hover:brightness-[0.92] active:scale-[0.98] transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span className="hidden sm:inline">Create Order</span>
        </button>
      </div>

      <FilterBar
        onSearch={setSearch}
        searchValue={search}
        searchPlaceholder="Search by order ID or user name..."
        filters={filters}
      />

      <DataTable<OrderRow>
        columns={columns}
        data={filtered as OrderRow[]}
        onRowClick={(row) => navigate(`/orders/${row.id}`)}
        pageSize={10}
      />
    </div>
  );
}
