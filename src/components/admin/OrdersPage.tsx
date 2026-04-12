import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DataTable, { type Column } from "./shared/DataTable";
import FilterBar from "./shared/FilterBar";
import StatusBadge from "./shared/StatusBadge";
import {
  mockOrders, formatNaira, formatDate,
  PORTAL_LABELS, PORTAL_COLORS,
  type MockOrder, type Portal,
} from "../../data/adminMockData";

export default function OrdersPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [portalFilter, setPortalFilter] = useState("");

  const filtered = useMemo(() => {
    return mockOrders.filter((o) => {
      const q = search.toLowerCase();
      const matchesSearch = !q || o.id.toLowerCase().includes(q) || o.userName.toLowerCase().includes(q);
      const matchesStatus = !statusFilter || o.status === statusFilter;
      const matchesPortal = !portalFilter || o.portal === portalFilter;
      return matchesSearch && matchesStatus && matchesPortal;
    });
  }, [search, statusFilter, portalFilter]);

  const columns: Column<MockOrder>[] = [
    {
      key: "id",
      label: "Order ID",
      sortable: true,
      render: (_, row) => <span className="font-bold text-primary">{row.id}</span>,
    },
    {
      key: "userName",
      label: "User",
      sortable: true,
      hideOnMobile: true,
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold flex-shrink-0">
            {row.userAvatar}
          </div>
          <span className="truncate">{row.userName}</span>
        </div>
      ),
    },
    {
      key: "portal",
      label: "Service",
      sortable: true,
      hideOnMobile: true,
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <div className="size-2 rounded-full flex-shrink-0" style={{ backgroundColor: PORTAL_COLORS[row.portal as Portal] }} />
          <span>{PORTAL_LABELS[row.portal as Portal]}</span>
        </div>
      ),
    },
    {
      key: "items",
      label: "Items",
      hideOnMobile: true,
      render: (_, row) => <span className="text-on-surface-variant truncate block max-w-[180px]">{row.itemCount} item{row.itemCount > 1 ? "s" : ""}</span>,
    },
    {
      key: "amount",
      label: "Amount",
      sortable: true,
      align: "right",
      render: (_, row) => <span className="font-bold">{row.amount === 0 ? "Free" : formatNaira(row.amount)}</span>,
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      align: "center",
      render: (_, row) => <StatusBadge status={row.status} variant="order" />,
    },
    {
      key: "createdAt",
      label: "Date",
      sortable: true,
      hideOnMobile: true,
      render: (_, row) => <span className="text-on-surface-variant">{formatDate(row.createdAt)}</span>,
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header with create button */}
      <div className="flex items-center justify-between">
        <div />
        <button
          onClick={() => navigate("/orders/create")}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-[13px] font-semibold rounded-xl cursor-pointer hover:brightness-[0.92] transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Create Order
        </button>
      </div>

      <FilterBar
        onSearch={setSearch}
        searchValue={search}
        searchPlaceholder="Search order ID or user name..."
        filters={[
          {
            key: "status",
            label: "All Statuses",
            type: "select",
            value: statusFilter,
            options: [
              { label: "Pending", value: "pending" },
              { label: "Confirmed", value: "confirmed" },
              { label: "Processing", value: "processing" },
              { label: "Completed", value: "completed" },
              { label: "Cancelled", value: "cancelled" },
            ],
            onChange: setStatusFilter,
          },
          {
            key: "portal",
            label: "All Portals",
            type: "select",
            value: portalFilter,
            options: [
              { label: "Solar", value: "solar" },
              { label: "Transport", value: "transport" },
              { label: "Groceries", value: "groceries" },
              { label: "Health", value: "health" },
              { label: "Events", value: "events" },
              { label: "Community", value: "community" },
              { label: "Logistics", value: "logistics" },
            ],
            onChange: setPortalFilter,
          },
        ]}
        onExport={() => {}}
      />

      <DataTable
        columns={columns}
        data={filtered as MockOrder[]}
        onRowClick={(row) => navigate(`/orders/${row.id}`)}
        emptyMessage="No orders found matching your filters"
        emptyIcon="receipt_long"
      />
    </div>
  );
}
