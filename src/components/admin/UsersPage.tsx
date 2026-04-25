import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DataTable, { type Column } from "./shared/DataTable";
import FilterBar, { type FilterConfig } from "./shared/FilterBar";
import StatusBadge from "./shared/StatusBadge";
import { getUsers } from "../../lib/api";
import { formatNaira } from "../../data/adminMockData";

interface DbProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  membership_tier: string;
  wallet_balance: number;
  referral_code: string | null;
  is_active: boolean;
  role: string;
  created_at: string;
}

type UserRow = DbProfile & Record<string, unknown>;

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

export default function UsersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<DbProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await getUsers();
      if (cancelled) return;
      setUsers(
        ((data ?? []) as DbProfile[]).filter((u) => u.role === "user")
      );
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch =
      !search ||
      (u.name ?? "").toLowerCase().includes(q) ||
      (u.email ?? "").toLowerCase().includes(q) ||
      (u.phone ?? "").includes(search);
    const matchTier = !tierFilter || u.membership_tier === tierFilter;
    const matchStatus =
      !statusFilter ||
      (statusFilter === "active" ? u.is_active : !u.is_active);
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
            {initials(row.name || row.email)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#0F172A] truncate">{row.name || "—"}</p>
            <p className="text-[12px] text-[#64748B] truncate">{row.phone || "—"}</p>
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
      key: "membership_tier",
      label: "Tier",
      width: "10%",
      sortable: true,
      hideOnMobile: true,
      render: (row) => <StatusBadge status={row.membership_tier} />,
    },
    {
      key: "wallet_balance",
      label: "Wallet",
      width: "14%",
      align: "right",
      sortable: true,
      render: (row) => (
        <span className="text-sm font-semibold text-[#0F172A]">
          {formatNaira(row.wallet_balance)}
        </span>
      ),
    },
    {
      key: "is_active",
      label: "Status",
      width: "10%",
      align: "center",
      hideOnMobile: true,
      render: (row) => <StatusBadge status={row.is_active ? "active" : "inactive"} />,
    },
    {
      key: "created_at",
      label: "Joined",
      width: "14%",
      sortable: true,
      hideOnMobile: true,
      render: (row) => (
        <span className="text-[13px] text-[#64748B] whitespace-nowrap">
          {new Date(row.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
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
          <p className="text-sm text-[#64748B] mt-0.5">
            {loading ? "Loading…" : `${users.length} total users`}
          </p>
        </div>
      </div>

      <FilterBar
        onSearch={setSearch}
        searchValue={search}
        searchPlaceholder="Search users by name, email, or phone..."
        filters={filters}
      />

      {loading ? (
        <div className="bg-white rounded-2xl border border-[#E8ECF1]/60 px-5 py-16 text-center text-[#94A3B8] text-sm">
          Loading users…
        </div>
      ) : (
        <DataTable<UserRow>
          columns={columns}
          data={filtered as UserRow[]}
          onRowClick={(row) => navigate(`/users/${row.id}`)}
          pageSize={10}
        />
      )}
    </div>
  );
}
