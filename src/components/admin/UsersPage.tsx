import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DataTable, { type Column } from "./shared/DataTable";
import FilterBar from "./shared/FilterBar";
import StatusBadge from "./shared/StatusBadge";
import { mockUsers, formatNaira, formatDate, type MockUser } from "../../data/adminMockData";

export default function UsersPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filtered = useMemo(() => {
    return mockUsers.filter((u) => {
      const q = search.toLowerCase();
      const matchesSearch = !q || u.name.toLowerCase().includes(q) || u.phone.includes(q) || u.email.toLowerCase().includes(q);
      const matchesTier = !tierFilter || u.membership === tierFilter;
      const matchesStatus = !statusFilter || u.status === statusFilter;
      return matchesSearch && matchesTier && matchesStatus;
    });
  }, [search, tierFilter, statusFilter]);

  const columns: Column<MockUser>[] = [
    {
      key: "name",
      label: "User",
      sortable: true,
      width: "22%",
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
            {row.avatar}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-[#0F172A] truncate">{row.name}</p>
            <p className="text-[11px] text-[#94A3B8] truncate">{row.phone}</p>
          </div>
        </div>
      ),
    },
    {
      key: "email",
      label: "Email",
      sortable: true,
      width: "20%",
      hideOnMobile: true,
      render: (_, row) => <span className="text-[#64748B] truncate block">{row.email}</span>,
    },
    {
      key: "membership",
      label: "Tier",
      sortable: true,
      width: "10%",
      render: (_, row) => <StatusBadge status={row.membership} variant="membership" />,
    },
    {
      key: "walletBalance",
      label: "Wallet",
      sortable: true,
      width: "14%",
      align: "right",
      hideOnMobile: true,
      render: (_, row) => <span className="font-semibold text-[#0F172A]">{formatNaira(row.walletBalance)}</span>,
    },
    {
      key: "totalOrders",
      label: "Orders",
      sortable: true,
      width: "8%",
      align: "center",
      hideOnMobile: true,
      render: (_, row) => <span className="text-[#64748B]">{String(row.totalOrders)}</span>,
    },
    {
      key: "joinedAt",
      label: "Joined",
      sortable: true,
      width: "14%",
      hideOnMobile: true,
      render: (_, row) => <span className="text-[#64748B] whitespace-nowrap">{formatDate(row.joinedAt)}</span>,
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-5">
      <FilterBar
        onSearch={setSearch}
        searchValue={search}
        searchPlaceholder="Search name, phone, or email..."
        filters={[
          {
            key: "tier",
            label: "All Tiers",
            type: "select",
            value: tierFilter,
            options: [
              { label: "None", value: "none" },
              { label: "Bronze", value: "bronze" },
              { label: "Silver", value: "silver" },
              { label: "Gold", value: "gold" },
            ],
            onChange: setTierFilter,
          },
          {
            key: "status",
            label: "All Statuses",
            type: "select",
            value: statusFilter,
            options: [
              { label: "Active", value: "active" },
              { label: "Inactive", value: "inactive" },
            ],
            onChange: setStatusFilter,
          },
        ]}
        onExport={() => {}}
      />

      <DataTable
        columns={columns}
        data={filtered as MockUser[]}
        onRowClick={(row) => navigate(`/users/${row.id}`)}
        emptyMessage="No users found matching your filters"
        emptyIcon="group_off"
      />
    </div>
  );
}
