import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import StatCard from "./shared/StatCard";
import { useToast } from "../../hooks/useToast";
import {
  mockOrders,
  formatNaira,
  formatDate,
  PORTAL_LABELS,
  PORTAL_COLORS,
  type Portal,
} from "../../data/adminMockData";

/* ── Team members ─────────────────────────────────────────────────────────── */

const TEAM_MEMBERS = [
  { id: "TM-1", name: "Chidi Okafor", role: "Operations Lead", avatar: "CO" },
  { id: "TM-2", name: "Amara Taiwo", role: "Solar Specialist", avatar: "AT" },
  { id: "TM-3", name: "Kunle Adeyemi", role: "Logistics Coord.", avatar: "KA" },
  { id: "TM-4", name: "Fatima Bello", role: "Customer Support", avatar: "FB" },
  { id: "TM-5", name: "Emeka Emenike", role: "Transport Mgr.", avatar: "EE" },
];

/* ── Fulfillment item type ────────────────────────────────────────────────── */

type RiskLevel = "on_track" | "at_risk" | "behind";

interface FulfillmentItem {
  orderId: string;
  userName: string;
  portal: Portal;
  amount: number;
  orderStatus: string;
  assignedTo: string | null;
  progress: number;
  dueDate: string;
  riskLevel: RiskLevel;
}

/* ── Seed-based deterministic random (so data stays stable) ───────────────── */

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const rand = seededRandom(42);

function randIntSeeded(min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}

/* ── Generate fulfillment data ────────────────────────────────────────────── */

const nonCancelledOrders = mockOrders.filter((o) => o.status !== "cancelled");
const sourceOrders = nonCancelledOrders.slice(0, 18);

const fulfillmentItems: FulfillmentItem[] = sourceOrders.map((order, idx) => {
  const progress = randIntSeeded(0, 100);
  const dayOffset = randIntSeeded(-3, 14);
  const now = new Date("2026-04-11");
  const dueDate = new Date(now.getTime() + dayOffset * 86400000);
  const dueDateStr = dueDate.toISOString().slice(0, 10);

  const daysUntilDue = dayOffset;
  let riskLevel: RiskLevel = "on_track";
  if (progress < 50 && daysUntilDue < 0) {
    riskLevel = "behind";
  } else if (progress < 30 && daysUntilDue <= 2) {
    riskLevel = "at_risk";
  }

  // First 3 orders are unassigned
  const isUnassigned = idx < 3;
  const teamMember = isUnassigned
    ? null
    : TEAM_MEMBERS[randIntSeeded(0, TEAM_MEMBERS.length - 1)];

  return {
    orderId: order.id,
    userName: order.userName,
    portal: order.portal,
    amount: order.amount,
    orderStatus: order.status,
    assignedTo: teamMember ? teamMember.id : null,
    progress: isUnassigned ? 0 : progress,
    dueDate: dueDateStr,
    riskLevel: isUnassigned ? "at_risk" : riskLevel,
  };
});

/* ── Risk dot colors ─────────────────────────────────────────────────────── */

const RISK_DOT_COLORS: Record<RiskLevel, string> = {
  on_track: "#059669",
  at_risk: "#EA580C",
  behind: "#DC2626",
};

/* ── Component ────────────────────────────────────────────────────────────── */

export default function FulfillmentPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const [items, setItems] = useState<FulfillmentItem[]>(fulfillmentItems);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [filterRisk, setFilterRisk] = useState("");
  const [search, setSearch] = useState("");
  const [assignDropdown, setAssignDropdown] = useState<string | null>(null);

  /* ---------- derived data ---------- */

  const unassigned = useMemo(() => items.filter((i) => !i.assignedTo), [items]);
  const assigned = useMemo(() => items.filter((i) => i.assignedTo), [items]);

  /* ---------- stats ---------- */

  const totalActive = items.length;
  const onTrackCount = items.filter((i) => i.riskLevel === "on_track").length;
  const atRiskCount = items.filter((i) => i.riskLevel === "at_risk").length;
  const behindCount = items.filter((i) => i.riskLevel === "behind").length;

  /* ---------- filtered + sorted table data ---------- */

  const filtered = useMemo(() => {
    let result = [...assigned];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (i) =>
          i.orderId.toLowerCase().includes(q) ||
          i.userName.toLowerCase().includes(q),
      );
    }
    if (filterRisk) {
      result = result.filter((i) => i.riskLevel === filterRisk);
    }
    if (sortKey) {
      result.sort((a, b) => {
        const aVal = a[sortKey as keyof FulfillmentItem];
        const bVal = b[sortKey as keyof FulfillmentItem];
        if (typeof aVal === "number" && typeof bVal === "number") {
          return sortDir === "asc" ? aVal - bVal : bVal - aVal;
        }
        return sortDir === "asc"
          ? String(aVal ?? "").localeCompare(String(bVal ?? ""))
          : String(bVal ?? "").localeCompare(String(aVal ?? ""));
      });
    }
    return result;
  }, [assigned, search, filterRisk, sortKey, sortDir]);

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function assignOrder(orderId: string, teamId: string) {
    const member = TEAM_MEMBERS.find((m) => m.id === teamId);
    if (!member) return;
    setItems((prev) =>
      prev.map((item) =>
        item.orderId === orderId ? { ...item, assignedTo: teamId, riskLevel: "on_track" } : item,
      ),
    );
    toast.success(`Order ${orderId} assigned to ${member.name}`);
    setAssignDropdown(null);
  }

  function getTeamMember(id: string | null) {
    if (!id) return null;
    return TEAM_MEMBERS.find((m) => m.id === id) ?? null;
  }

  function SortHeader({ label, sortField, hideOnMobile }: { label: string; sortField: string; hideOnMobile?: boolean }) {
    return (
      <th
        className={`px-4 sm:px-5 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-left cursor-pointer select-none hover:text-[#0F172A] transition-colors ${hideOnMobile ? "hidden lg:table-cell" : ""}`}
        onClick={() => handleSort(sortField)}
      >
        <span className="inline-flex items-center gap-1">
          {label}
          {sortKey === sortField && (
            <span className="material-symbols-outlined text-[13px]">
              {sortDir === "asc" ? "arrow_upward" : "arrow_downward"}
            </span>
          )}
        </span>
      </th>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] tracking-tight">
          Order Fulfillment
        </h1>
        <p className="text-[13px] text-[#64748B] mt-1">
          Assign orders to team members and track delivery progress across all portals.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Total Active"
          value={String(totalActive)}
          icon="assignment"
          color="#0D47A1"
        />
        <StatCard
          label="On Track"
          value={String(onTrackCount)}
          icon="check_circle"
          color="#059669"
          trend={{ value: `${totalActive > 0 ? Math.round((onTrackCount / totalActive) * 100) : 0}%`, positive: true }}
        />
        <StatCard
          label="At Risk"
          value={String(atRiskCount)}
          icon="warning"
          color="#EA580C"
          trend={{ value: `${totalActive > 0 ? Math.round((atRiskCount / totalActive) * 100) : 0}%`, positive: false }}
        />
        <StatCard
          label="Behind Schedule"
          value={String(behindCount)}
          icon="error"
          color="#DC2626"
          trend={{ value: `${totalActive > 0 ? Math.round((behindCount / totalActive) * 100) : 0}%`, positive: false }}
        />
      </div>

      {/* Unassigned Orders */}
      {unassigned.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-[15px] font-bold text-[#0F172A]">Unassigned Orders</h2>
            <span className="inline-flex items-center justify-center size-5 rounded-full bg-[#FEF2F2] text-[#DC2626] text-[11px] font-bold">
              {unassigned.length}
            </span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
            {unassigned.map((item) => {
              const portalColor = PORTAL_COLORS[item.portal];
              return (
                <div
                  key={item.orderId}
                  className="flex-shrink-0 w-[240px] sm:w-[260px] bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 p-4"
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[13px] font-bold text-primary">{item.orderId}</span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="size-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: portalColor }}
                      />
                      <span className="text-[11px] text-[#64748B] font-medium">
                        {PORTAL_LABELS[item.portal].split(",")[0]}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-[#334155] truncate">{item.userName}</p>
                  <p className="text-[13px] font-bold text-[#0F172A] mt-1">{formatNaira(item.amount)}</p>

                  {/* Assign dropdown */}
                  <div className="relative mt-3">
                    <button
                      onClick={() =>
                        setAssignDropdown(
                          assignDropdown === item.orderId ? null : item.orderId,
                        )
                      }
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-[12px] font-semibold text-white bg-primary rounded-xl hover:bg-primary/90 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">person_add</span>
                      Assign
                    </button>

                    {assignDropdown === item.orderId && (
                      <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-[#E8ECF1] z-50 overflow-hidden py-1">
                        <p className="px-3 py-2 text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                          Assign to
                        </p>
                        {TEAM_MEMBERS.map((tm) => (
                          <button
                            key={tm.id}
                            onClick={() => assignOrder(item.orderId, tm.id)}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                          >
                            <div className="size-7 rounded-full bg-gradient-to-br from-primary/80 to-primary/50 flex items-center justify-center text-white font-bold text-[9px] flex-shrink-0">
                              {tm.avatar}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-medium text-[#334155] leading-tight truncate">
                                {tm.name}
                              </p>
                              <p className="text-[10px] text-[#94A3B8]">{tm.role}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Fulfillment Board */}
      <div>
        <h2 className="text-[15px] font-bold text-[#0F172A] mb-3">Fulfillment Board</h2>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 mb-4">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Search */}
            <div className="flex items-center gap-2 bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 flex-1 min-w-[180px] max-w-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all">
              <span className="material-symbols-outlined text-[#94A3B8] text-[18px]">search</span>
              <input
                type="text"
                placeholder="Search order or customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent text-sm outline-none flex-1 text-[#0F172A] placeholder:text-[#94A3B8]"
              />
            </div>

            {/* Risk filter */}
            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              className="bg-white border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm text-[#0F172A] outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all cursor-pointer appearance-none pr-8 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394A3B8%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_8px_center] bg-no-repeat"
            >
              <option value="">All Risk Levels</option>
              <option value="on_track">On Track</option>
              <option value="at_risk">At Risk</option>
              <option value="behind">Behind</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F8FAFC]">
                  <SortHeader label="Order ID" sortField="orderId" />
                  <SortHeader label="Customer" sortField="userName" />
                  <SortHeader label="Portal" sortField="portal" hideOnMobile />
                  <th className="px-4 sm:px-5 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-left hidden lg:table-cell">
                    Assigned To
                  </th>
                  <th className="px-4 sm:px-5 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-center hidden sm:table-cell">
                    Status
                  </th>
                  <SortHeader label="Due Date" sortField="dueDate" hideOnMobile />
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const member = getTeamMember(item.assignedTo);
                  const portalColor = PORTAL_COLORS[item.portal];
                  const riskDotColor = RISK_DOT_COLORS[item.riskLevel];

                  return (
                    <tr
                      key={item.orderId}
                      className="border-b border-[#F1F5F9] last:border-b-0 hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                      onClick={() => navigate(`/fulfillment/${item.orderId}`)}
                    >
                      {/* Order ID */}
                      <td className="px-4 sm:px-5 py-3.5 sm:py-4">
                        <span className="font-bold text-primary">{item.orderId}</span>
                      </td>

                      {/* Customer */}
                      <td className="px-4 sm:px-5 py-3.5 sm:py-4">
                        <span className="font-medium text-[#334155]">{item.userName}</span>
                      </td>

                      {/* Portal */}
                      <td className="px-4 sm:px-5 py-3.5 sm:py-4 hidden lg:table-cell">
                        <div className="flex items-center gap-2">
                          <span
                            className="size-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: portalColor }}
                          />
                          <span className="text-[#334155] text-[13px] truncate max-w-[140px]">
                            {PORTAL_LABELS[item.portal].split(",")[0]}
                          </span>
                        </div>
                      </td>

                      {/* Assigned to */}
                      <td className="px-4 sm:px-5 py-3.5 sm:py-4 hidden lg:table-cell">
                        {member && (
                          <div className="flex items-center gap-2">
                            <div className="size-7 rounded-full bg-gradient-to-br from-primary/80 to-primary/50 flex items-center justify-center text-white font-bold text-[9px] flex-shrink-0">
                              {member.avatar}
                            </div>
                            <span className="text-[13px] font-medium text-[#334155]">
                              {member.name}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Status dot */}
                      <td className="px-4 sm:px-5 py-3.5 sm:py-4 hidden sm:table-cell">
                        <div className="flex justify-center">
                          <span
                            className="size-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: riskDotColor }}
                            title={item.riskLevel.replace("_", " ")}
                          />
                        </div>
                      </td>

                      {/* Due date */}
                      <td className="px-4 sm:px-5 py-3.5 sm:py-4 hidden lg:table-cell">
                        <span className="text-[#334155] text-[13px]">
                          {formatDate(item.dueDate)}
                        </span>
                      </td>
                    </tr>
                  );
                })}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <span className="material-symbols-outlined text-[48px] text-[#E8ECF1] mb-3 block">
                        search_off
                      </span>
                      <p className="text-[15px] font-semibold text-[#334155]">
                        No fulfillment items found
                      </p>
                      <p className="text-[13px] text-[#94A3B8] mt-1">
                        Try adjusting your search or filters.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between bg-[#F8FAFC] border-t border-[#F1F5F9] text-sm">
            <span className="text-[#64748B] text-[13px]">
              Showing {filtered.length} of {assigned.length} assigned items
            </span>
            <div className="flex items-center gap-3 text-[12px]">
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-[#059669]" />
                <span className="text-[#64748B]">On Track</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-[#EA580C]" />
                <span className="text-[#64748B]">At Risk</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-[#DC2626]" />
                <span className="text-[#64748B]">Behind</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
