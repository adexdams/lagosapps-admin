import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import FilterBar, { type FilterConfig } from "./shared/FilterBar";
import { useToast } from "../../hooks/useToast";
import { getBroadcastsList } from "../../lib/api";
import { supabase } from "../../lib/supabase";
import { formatDate } from "../../data/adminMockData";

const TYPE_CONFIG: Record<string, { bg: string; text: string; icon: string }> = {
  info: { bg: "#EFF6FF", text: "#2563EB", icon: "info" },
  promo: { bg: "#ECFDF5", text: "#059669", icon: "celebration" },
  alert: { bg: "#FEF2F2", text: "#DC2626", icon: "warning" },
  update: { bg: "#F5F3FF", text: "#7C3AED", icon: "campaign" },
};

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  draft: { bg: "#F1F5F9", text: "#64748B", label: "DRAFT" },
  sent: { bg: "#ECFDF5", text: "#059669", label: "SENT" },
  retracted: { bg: "#FEF2F2", text: "#DC2626", label: "RETRACTED" },
};

const card = "bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60";

interface BroadcastRow {
  id: string;
  title: string;
  message: string;
  type: string;
  status: string;
  recipients_type: string;
  sent_at: string | null;
  created_at: string;
}

interface BroadcastWithStats extends BroadcastRow {
  recipient_count: number;
  read_count: number;
}

export default function NotificationsAdmin() {
  const navigate = useNavigate();
  const { error: toastError } = useToast();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [broadcasts, setBroadcasts] = useState<BroadcastWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBroadcasts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await getBroadcastsList();
    if (error) {
      toastError(`Failed to load broadcasts: ${error.message}`);
      setLoading(false);
      return;
    }
    const rows = (data ?? []) as BroadcastRow[];

    // Fetch recipient counts + read counts in one go
    const { data: recipientData } = await supabase
      .from("broadcast_recipients")
      .select("broadcast_id, read")
      .in("broadcast_id", rows.map((r) => r.id));

    const counts = new Map<string, { total: number; read: number }>();
    for (const r of (recipientData ?? []) as { broadcast_id: string; read: boolean }[]) {
      const c = counts.get(r.broadcast_id) ?? { total: 0, read: 0 };
      c.total++;
      if (r.read) c.read++;
      counts.set(r.broadcast_id, c);
    }

    setBroadcasts(
      rows.map((b) => ({
        ...b,
        recipient_count: counts.get(b.id)?.total ?? 0,
        read_count: counts.get(b.id)?.read ?? 0,
      }))
    );
    setLoading(false);
  }, [toastError]);

  useEffect(() => { loadBroadcasts(); }, [loadBroadcasts]);

  const filtered = broadcasts.filter((b) => {
    const matchSearch = !search || b.title.toLowerCase().includes(search.toLowerCase());
    const matchType = !typeFilter || b.type === typeFilter;
    const matchStatus = !statusFilter || b.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  const sentCount = broadcasts.filter((b) => b.status === "sent").length;
  const draftCount = broadcasts.filter((b) => b.status === "draft").length;

  const filters: FilterConfig[] = [
    {
      key: "type", label: "All Types", value: typeFilter, onChange: setTypeFilter,
      options: [
        { value: "info", label: "Info" },
        { value: "promo", label: "Promo" },
        { value: "alert", label: "Alert" },
        { value: "update", label: "Update" },
      ],
    },
    {
      key: "status", label: "All Statuses", value: statusFilter, onChange: setStatusFilter,
      options: [
        { value: "sent", label: "Sent" },
        { value: "draft", label: "Draft" },
        { value: "retracted", label: "Retracted" },
      ],
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0F172A]">Broadcast</h1>
          <p className="text-sm text-[#64748B] mt-0.5">
            {broadcasts.length} broadcasts · {sentCount} sent · {draftCount} draft
          </p>
        </div>
        <button
          onClick={() => navigate("/broadcast/compose")}
          className="inline-flex items-center gap-1.5 px-2.5 sm:px-4 py-2 sm:py-2.5 bg-primary text-white text-sm font-semibold rounded-xl cursor-pointer hover:brightness-[0.92] active:scale-[0.98] transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span className="hidden sm:inline">New Broadcast</span>
        </button>
      </div>

      <FilterBar
        onSearch={setSearch}
        searchValue={search}
        searchPlaceholder="Search broadcasts..."
        filters={filters}
      />

      <div className={`${card} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm">
            <thead>
              <tr className="bg-[#F8FAFC]">
                <th className="px-2.5 sm:px-4 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-left">Title</th>
                <th className="px-2.5 sm:px-4 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-center">Type</th>
                <th className="px-2.5 sm:px-4 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-center">Status</th>
                <th className="px-2.5 sm:px-4 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-center hidden sm:table-cell">User Read Rate</th>
                <th className="px-2.5 sm:px-4 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-left hidden md:table-cell">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {loading ? (
                <tr><td colSpan={5} className="px-5 py-12 text-center text-[#94A3B8]">Loading broadcasts…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-12 text-center text-[#94A3B8]">No broadcasts found</td></tr>
              ) : (
                filtered.map((b) => {
                  const tc = TYPE_CONFIG[b.type] ?? TYPE_CONFIG.info;
                  const sc = STATUS_CONFIG[b.status] ?? STATUS_CONFIG.draft;
                  const readPct = b.recipient_count > 0 ? Math.round((b.read_count / b.recipient_count) * 100) : 0;
                  return (
                    <tr
                      key={b.id}
                      onClick={() => navigate(`/broadcast/${b.id}`)}
                      className="hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                    >
                      <td className="px-2.5 sm:px-4 py-3">
                        <p className="text-sm font-semibold text-[#0F172A] truncate max-w-[250px] sm:max-w-none">{b.title}</p>
                        <p className="text-[12px] text-[#64748B] truncate max-w-[250px] sm:max-w-[400px] mt-0.5">{b.message}</p>
                      </td>
                      <td className="px-2.5 sm:px-4 py-3 text-center">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg" style={{ backgroundColor: tc.bg }}>
                          <span className="material-symbols-outlined text-[14px]" style={{ color: tc.text }}>{tc.icon}</span>
                          <span className="text-[11px] font-semibold uppercase" style={{ color: tc.text }}>{b.type}</span>
                        </div>
                      </td>
                      <td className="px-2.5 sm:px-4 py-3 text-center">
                        <span className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-semibold" style={{ backgroundColor: sc.bg, color: sc.text }}>
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-2.5 sm:px-4 py-3 hidden sm:table-cell">
                        {b.status === "sent" && b.recipient_count > 0 ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${readPct >= 70 ? "bg-[#059669]" : readPct >= 40 ? "bg-[#EA580C]" : "bg-[#DC2626]"}`} style={{ width: `${readPct}%` }} />
                            </div>
                            <span className={`text-[12px] font-semibold ${readPct >= 70 ? "text-[#059669]" : readPct >= 40 ? "text-[#EA580C]" : "text-[#DC2626]"}`}>
                              {b.read_count}/{b.recipient_count}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-[#94A3B8]">—</span>
                        )}
                      </td>
                      <td className="px-2.5 sm:px-4 py-3 text-[#64748B] hidden md:table-cell whitespace-nowrap">
                        {formatDate(b.sent_at ?? b.created_at)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
