import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DataTable, { type Column } from "./shared/DataTable";
import FilterBar, { type FilterConfig } from "./shared/FilterBar";
import StatusBadge from "./shared/StatusBadge";
import { mockUsers, formatNaira, type MockUser } from "../../data/adminMockData";

type UserRow = MockUser & Record<string, unknown>;

export default function UsersPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filtered = mockUsers.filter((u) => {
    const matchSearch =
      !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.phone.includes(search);
    const matchTier = !tierFilter || u.membershipTier === tierFilter;
    const matchStatus = !statusFilter || u.status === statusFilter;
    return matchSearch && matchTier && matchStatus;
  });

  const columns: Column<UserRow>[] = [
    {
      key: "name",
      label: "User",
      width: "22%",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {row.avatar}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#0F172A] truncate">{row.name}</p>
            <p className="text-[12px] text-[#64748B] truncate">{row.phone}</p>
          </div>
        </div>
      ),
    },
    {
      key: "email",
      label: "Email",
      width: "20%",
      sortable: true,
      hideOnMobile: true,
      render: (row) => <span className="text-[13px] text-[#334155]">{row.email}</span>,
    },
    {
      key: "membershipTier",
      label: "Tier",
      width: "10%",
      sortable: true,
      hideOnMobile: true,
      render: (row) => <StatusBadge status={row.membershipTier} />,
    },
    {
      key: "walletBalance",
      label: "Wallet",
      width: "14%",
      align: "right",
      sortable: true,
      render: (row) => (
        <span className="text-sm font-semibold text-[#0F172A]">
          {formatNaira(row.walletBalance)}
        </span>
      ),
    },
    {
      key: "totalOrders",
      label: "Orders",
      width: "8%",
      align: "center",
      sortable: true,
      hideOnMobile: true,
      render: (row) => <span className="text-sm text-[#334155]">{row.totalOrders}</span>,
    },
    {
      key: "joinedAt",
      label: "Joined",
      width: "14%",
      sortable: true,
      hideOnMobile: true,
      render: (row) => (
        <span className="text-[13px] text-[#64748B] whitespace-nowrap">
          {new Date(row.joinedAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
        </span>
      ),
    },
  ];

  const filters: FilterConfig[] = [
    {
      key: "tier",
      label: "All Tiers",
      value: tierFilter,
      onChange: setTierFilter,
      options: [
        { value: "none", label: "None" },
        { value: "bronze", label: "Bronze" },
        { value: "silver", label: "Silver" },
        { value: "gold", label: "Gold" },
      ],
    },
    {
      key: "status",
      label: "All Statuses",
      value: statusFilter,
      onChange: setStatusFilter,
      options: [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
      ],
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0F172A]">Users</h1>
          <p className="text-sm text-[#64748B] mt-0.5">{mockUsers.length} total users</p>
        </div>
      </div>

      <FilterBar
        onSearch={setSearch}
        searchValue={search}
        searchPlaceholder="Search users by name, email, or phone..."
        filters={filters}
        onExport={() => alert("Exporting users...")}
      />

      <DataTable<UserRow>
        columns={columns}
        data={filtered as UserRow[]}
        onRowClick={(row) => navigate(`/users/${row.id}`)}
        pageSize={10}
      />
    </div>
  );
}
