import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "../../hooks/useToast";
import { supabase } from "../../lib/supabase";
import { updateBroadcast, getBroadcastRecipientStats, logAudit } from "../../lib/api";
import { formatDate } from "../../data/adminMockData";

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  info: { bg: "#EFF6FF", text: "#2563EB" },
  promo: { bg: "#ECFDF5", text: "#059669" },
  alert: { bg: "#FEF2F2", text: "#DC2626" },
  update: { bg: "#F5F3FF", text: "#7C3AED" },
};

interface Broadcast {
  id: string;
  title: string;
  message: string;
  type: string;
  status: "draft" | "sent" | "retracted";
  recipients_type: "all" | "tier" | "specific";
  recipients_filter: Record<string, unknown>;
  image_url: string | null;
  sent_by: string | null;
  sent_at: string | null;
  retracted_at: string | null;
  created_at: string;
}

export default function BroadcastDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [broadcast, setBroadcast] = useState<Broadcast | null>(null);
  const [sentByName, setSentByName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, delivered: 0, read: 0 });
  const [showRetractConfirm, setShowRetractConfirm] = useState(false);
  const [retracting, setRetracting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const { data, error } = await supabase.from("broadcasts").select("*").eq("id", id).single();
    if (error || !data) {
      setLoading(false);
      return;
    }
    setBroadcast(data as Broadcast);

    // Author name
    if ((data as Broadcast).sent_by) {
      const { data: sender } = await supabase.from("profiles").select("name, email").eq("id", (data as Broadcast).sent_by).maybeSingle();
      if (sender) setSentByName((sender as { name: string | null; email: string }).name || (sender as { email: string }).email);
    }

    // Recipient stats
    const s = await getBroadcastRecipientStats(id);
    setStats({ total: s.total, delivered: s.delivered, read: s.read });
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function handleRetract() {
    if (!broadcast) return;
    setRetracting(true);
    const { error } = await updateBroadcast(broadcast.id, {
      status: "retracted",
      retracted_at: new Date().toISOString(),
    });
    if (error) {
      setRetracting(false);
      toast.error(`Retract failed: ${error.message}`);
      return;
    }
    // Also mark unread recipient notifications as retracted in user inboxes
    await supabase
      .from("user_notifications")
      .update({ retracted: true })
      .eq("entity_type", "broadcast")
      .eq("entity_id", broadcast.id)
      .eq("read", false);

    await logAudit({
      action: "broadcast.retract",
      entity_type: "broadcast",
      entity_id: broadcast.id,
    });

    setBroadcast({ ...broadcast, status: "retracted", retracted_at: new Date().toISOString() });
    setShowRetractConfirm(false);
    setRetracting(false);
    toast.success("Broadcast retracted — unread recipients will no longer see it");
  }

  async function handleDelete() {
    if (!broadcast) return;
    if (!window.confirm("Delete this broadcast permanently? This cannot be undone.")) return;
    setDeleting(true);
    const { error } = await supabase.from("broadcasts").delete().eq("id", broadcast.id);
    if (error) {
      setDeleting(false);
      toast.error(`Delete failed: ${error.message}`);
      return;
    }
    await logAudit({ action: "broadcast.delete", entity_type: "broadcast", entity_id: broadcast.id });
    toast.success("Broadcast deleted");
    navigate("/broadcast");
  }

  if (loading) {
    return <div className="text-center py-20 text-[#94A3B8]">Loading…</div>;
  }

  if (!broadcast) {
    return (
      <div className="text-center py-20">
        <p className="text-lg font-semibold text-[#0F172A]">Broadcast not found</p>
        <button onClick={() => navigate("/broadcast")} className="text-primary text-sm font-semibold mt-2 cursor-pointer">
          Back to Broadcast
        </button>
      </div>
    );
  }

  const typeColor = TYPE_COLORS[broadcast.type] ?? TYPE_COLORS.info;
  const readPct = stats.total > 0 ? Math.round((stats.read / stats.total) * 100) : 0;

  let recipientsLabel = "All Users";
  const filter = broadcast.recipients_filter;
  if (broadcast.recipients_type === "tier" && Array.isArray((filter as { tiers?: string[] }).tiers)) {
    recipientsLabel = `${(filter as { tiers: string[] }).tiers.join(", ")} tier`.replace(/\b\w/g, (c) => c.toUpperCase());
  } else if (broadcast.recipients_type === "specific") {
    recipientsLabel = "Specific User";
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate("/broadcast")}
        className="inline-flex items-center gap-1 text-sm font-semibold text-[#64748B] hover:text-[#0F172A] cursor-pointer transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Back to Broadcast
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Content card */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 p-3.5 sm:p-5 md:p-7">
            <div className="flex items-start justify-between mb-4 gap-3">
              <h2 className="text-lg font-bold text-[#0F172A]">{broadcast.title}</h2>
              <span
                className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-semibold uppercase flex-shrink-0"
                style={{ backgroundColor: typeColor.bg, color: typeColor.text }}
              >
                {broadcast.type}
              </span>
            </div>
            {broadcast.image_url && (
              <img src={broadcast.image_url} alt="" className="w-full rounded-xl mb-3 max-h-64 object-cover" />
            )}
            <p className="text-sm text-[#334155] leading-relaxed whitespace-pre-wrap">{broadcast.message}</p>
            {broadcast.status === "retracted" && (
              <div className="mt-3 p-3 bg-red-50 rounded-lg">
                <p className="text-sm text-red-600 font-semibold">This broadcast has been retracted {broadcast.retracted_at && `on ${formatDate(broadcast.retracted_at)}`}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 p-3.5 sm:p-5">
            <h3 className="text-sm font-bold text-[#0F172A] mb-3">Actions</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => navigate("/broadcast/compose")}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-primary/90 cursor-pointer transition-all"
              >
                <span className="material-symbols-outlined text-[16px] mr-1 align-text-bottom">replay</span>
                Duplicate as New
              </button>
              {broadcast.status === "sent" && (
                <button
                  onClick={() => setShowRetractConfirm(true)}
                  disabled={retracting}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-orange-50 text-orange-600 hover:bg-orange-100 cursor-pointer transition-all disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[16px] mr-1 align-text-bottom">undo</span>
                  Retract
                </button>
              )}
              {(broadcast.status === "retracted" || broadcast.status === "draft") && (
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer transition-all disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[16px] mr-1 align-text-bottom">delete</span>
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              )}
            </div>
            {showRetractConfirm && (
              <div className="mt-3 p-3 bg-orange-50 rounded-xl space-y-2">
                <p className="text-sm text-orange-800">Users who haven't opened this will no longer see it in their inbox. Users who already read it keep the content but see a "retracted" note.</p>
                <div className="flex gap-2">
                  <button onClick={handleRetract} disabled={retracting} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-orange-600 text-white hover:bg-orange-700 cursor-pointer disabled:opacity-50">
                    {retracting ? "Retracting..." : "Confirm Retract"}
                  </button>
                  <button onClick={() => setShowRetractConfirm(false)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#64748B] hover:text-[#0F172A] cursor-pointer">Cancel</button>
                </div>
              </div>
            )}
          </div>

          {/* Delivery stats */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 p-3.5 sm:p-5 md:p-7">
            <h3 className="text-sm font-bold text-[#0F172A] mb-4">Delivery Stats</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[13px] text-[#64748B]">Read Rate</span>
                  <span className="text-sm font-bold text-[#0F172A]">{readPct}%</span>
                </div>
                <div className="h-3 bg-[#F1F5F9] rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${readPct}%` }} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-2">
                <div className="text-center p-3 bg-[#F8FAFC] rounded-xl">
                  <p className="text-lg font-extrabold text-[#0F172A]">{stats.total}</p>
                  <p className="text-[12px] text-[#64748B]">Recipients</p>
                </div>
                <div className="text-center p-3 bg-[#ECFDF5] rounded-xl">
                  <p className="text-lg font-extrabold text-[#059669]">{stats.delivered}</p>
                  <p className="text-[12px] text-[#64748B]">Delivered</p>
                </div>
                <div className="text-center p-3 bg-[#EFF6FF] rounded-xl">
                  <p className="text-lg font-extrabold text-[#2563EB]">{stats.read}</p>
                  <p className="text-[12px] text-[#64748B]">Read</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right — 1/3 */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 p-5">
            <h3 className="text-sm font-bold text-[#0F172A] mb-4">Configuration</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[#64748B]">Recipients</span>
                <span className="text-sm font-semibold text-[#0F172A]">{recipientsLabel}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[#64748B]">Sent By</span>
                <span className="text-sm font-semibold text-[#0F172A]">{sentByName || "System"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[#64748B]">{broadcast.sent_at ? "Sent" : "Created"}</span>
                <span className="text-sm text-[#334155]">{formatDate(broadcast.sent_at ?? broadcast.created_at)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[#64748B]">Type</span>
                <span className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-semibold uppercase" style={{ backgroundColor: typeColor.bg, color: typeColor.text }}>
                  {broadcast.type}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[#64748B]">Status</span>
                <span className="text-sm font-semibold text-[#0F172A] capitalize">{broadcast.status}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 p-5">
            <h3 className="text-sm font-bold text-[#0F172A] mb-4">Audience Breakdown</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[#64748B]">Total Recipients</span>
                <span className="text-sm font-bold text-[#0F172A]">{stats.total}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[#64748B]">Read</span>
                <span className="text-sm font-bold text-[#059669]">{stats.read}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[#64748B]">Unread</span>
                <span className="text-sm font-bold text-[#EA580C]">{stats.total - stats.read}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
