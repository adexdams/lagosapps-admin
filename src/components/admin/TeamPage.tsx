import { useState, useEffect, useRef, useCallback } from "react";
import { useToast } from "../../hooks/useToast";
import { useAuth } from "../../hooks/useAuth";
import Modal from "../ui/Modal";
import { supabase } from "../../lib/supabase";
import { logAudit } from "../../lib/api";
import { PAGE_PRIVILEGES, ROLE_DEFAULT_PRIVILEGES } from "../../lib/privileges";

const inputClass =
  "w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm text-[#0F172A] outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all";
const labelClass = "text-[13px] font-semibold text-[#0F172A] mb-1.5 block";
const card = "bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60";

type TeamRole = "super_admin" | "operations" | "support" | "finance" | "tech";

interface DbTeamMember {
  id: string;
  user_id: string;
  role: TeamRole;
  phone: string | null;
  is_active: boolean;
  last_active_at: string | null;
  created_at: string;
  profiles: { name: string; email: string; avatar_url: string | null } | null;
}

const ROLE_CONFIG: Record<TeamRole, { label: string; color: string; bg: string; description: string; icon: string }> = {
  super_admin: { label: "Super Admin", color: "#7C3AED", bg: "#F5F3FF", description: "Full access to all features and settings", icon: "admin_panel_settings" },
  operations:  { label: "Operations",  color: "#2563EB", bg: "#EFF6FF", description: "Manage orders, fulfillment, and inventory", icon: "assignment" },
  support:     { label: "Support",     color: "#059669", bg: "#ECFDF5", description: "Handle user inquiries and order support", icon: "support_agent" },
  finance:     { label: "Finance",     color: "#EA580C", bg: "#FFF7ED", description: "Manage wallet, payments, and financial reports", icon: "payments" },
  tech:        { label: "Tech",        color: "#0891B2", bg: "#ECFEFF", description: "Platform maintenance, integrations, and technical operations", icon: "code" },
};

function initials(name: string, email?: string | null) {
  const src = (name || email || "?").trim();
  return src.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("") || "?";
}

function formatLastActive(iso: string | null) {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}

export default function TeamPage() {
  const toast = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;
  const { user, profile } = useAuth();
  const isSuperAdmin = profile?.role === "super_admin";

  const [team, setTeam] = useState<DbTeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<TeamRole>("support");
  const [adding, setAdding] = useState(false);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);

  // Privilege modal state
  const [privMember, setPrivMember] = useState<DbTeamMember | null>(null);
  const [privMap, setPrivMap] = useState<Record<string, boolean>>({});
  const [privLoading, setPrivLoading] = useState(false);
  const [privSaving, setPrivSaving] = useState(false);

  const loadTeam = useCallback(async () => {
    const { data } = await supabase
      .from("admin_team_members")
      .select("*, profiles(name, email, avatar_url)")
      .order("created_at", { ascending: true });
    setTeam((data as unknown as DbTeamMember[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { loadTeam(); }, [loadTeam]);

  // Load privileges when privilege modal opens
  useEffect(() => {
    if (!privMember) return;
    setPrivLoading(true);
    supabase
      .from("admin_team_privileges")
      .select("privilege_key, enabled")
      .eq("team_member_id", privMember.id)
      .then(({ data }) => {
        const map: Record<string, boolean> = {};
        if (data && data.length > 0) {
          data.forEach((p: { privilege_key: string; enabled: boolean }) => {
            map[p.privilege_key] = p.enabled;
          });
          // Fill in any keys not yet in DB with role defaults
          PAGE_PRIVILEGES.forEach((p) => {
            if (!(p.key in map)) {
              map[p.key] = (ROLE_DEFAULT_PRIVILEGES[privMember.role] ?? []).includes(p.key);
            }
          });
        } else {
          // No rows yet — seed from role defaults
          const defaults = ROLE_DEFAULT_PRIVILEGES[privMember.role] ?? [];
          PAGE_PRIVILEGES.forEach((p) => { map[p.key] = defaults.includes(p.key); });
        }
        setPrivMap(map);
        setPrivLoading(false);
      });
  }, [privMember]);

  async function savePrivileges() {
    if (!privMember) return;
    setPrivSaving(true);
    const rows = PAGE_PRIVILEGES.map((p) => ({
      team_member_id: privMember.id,
      privilege_key: p.key,
      enabled: privMap[p.key] ?? false,
    }));
    const { error } = await supabase
      .from("admin_team_privileges")
      .upsert(rows, { onConflict: "team_member_id,privilege_key" });
    setPrivSaving(false);
    if (error) { toastRef.current.error(`Failed to save: ${error.message}`); return; }
    await logAudit({
      action: "team.privilege_updated",
      entity_type: "team_member",
      entity_id: privMember.user_id,
      new_values: privMap,
    });
    toastRef.current.success(`Privileges updated for ${privMember.profiles?.name ?? privMember.profiles?.email ?? "member"}`);
    setPrivMember(null);
  }

  function toggleAllPrivileges(on: boolean) {
    const next: Record<string, boolean> = {};
    PAGE_PRIVILEGES.forEach((p) => { next[p.key] = on; });
    setPrivMap(next);
  }

  async function handleAddMember() {
    const trimmedEmail = newEmail.trim().toLowerCase();
    if (!trimmedEmail) { toastRef.current.error("Email is required"); return; }
    setAdding(true);

    const { error: otpErr } = await supabase.auth.signInWithOtp({
      email: trimmedEmail,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    if (otpErr) { toastRef.current.error(`Failed to send invite: ${otpErr.message}`); setAdding(false); return; }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("id, name, email")
      .eq("email", trimmedEmail)
      .maybeSingle();

    if (profileData) {
      const already = team.find((m) => m.user_id === profileData.id);
      if (already) {
        toastRef.current.error("This user is already on the team");
        setAdding(false);
        return;
      }
      const { error } = await supabase.from("admin_team_members").insert({
        user_id: profileData.id,
        role: newRole,
        is_active: true,
      });
      if (error) { toastRef.current.error(`Invite sent but team record failed: ${error.message}`); setAdding(false); return; }
      await supabase.from("profiles").update({ role: "admin" }).eq("id", profileData.id).eq("role", "user");
      await logAudit({ action: "team.add_member", entity_type: "admin_team_members", entity_id: profileData.id, new_values: { role: newRole, email: profileData.email } });
      toastRef.current.success(`Invite sent — ${profileData.name || profileData.email} added as ${ROLE_CONFIG[newRole].label}`);
    } else {
      toastRef.current.success(`Invite sent to ${trimmedEmail}. Once they sign in, add them here to grant the ${ROLE_CONFIG[newRole].label} role.`);
    }

    setShowAddForm(false);
    setNewEmail("");
    setNewRole("support");
    setAdding(false);
    loadTeam();
  }

  async function updateRole(memberId: string, role: TeamRole, name: string) {
    setUpdatingRole(memberId);
    const { error } = await supabase.from("admin_team_members").update({ role }).eq("id", memberId);
    setUpdatingRole(null);
    if (error) { toastRef.current.error(`Failed: ${error.message}`); return; }
    setTeam((prev) => prev.map((m) => m.id === memberId ? { ...m, role } : m));
    toastRef.current.success(`${name}'s role updated to ${ROLE_CONFIG[role].label}`);
  }

  async function toggleStatus(member: DbTeamMember) {
    const next = !member.is_active;
    const { error } = await supabase.from("admin_team_members").update({ is_active: next }).eq("id", member.id);
    if (error) { toastRef.current.error(`Failed: ${error.message}`); return; }
    setTeam((prev) => prev.map((m) => m.id === member.id ? { ...m, is_active: next } : m));
    const name = member.profiles?.name ?? member.profiles?.email ?? "Member";
    toastRef.current.success(`${name} ${next ? "activated" : "deactivated"}`);
  }

  const activeCount = team.filter((m) => m.is_active).length;
  const grantedCount = Object.values(privMap).filter(Boolean).length;

  if (loading) {
    return <div className="py-20 text-center text-[#94A3B8] text-sm">Loading team…</div>;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0F172A]">Team</h1>
          <p className="text-sm text-[#64748B] mt-0.5">{activeCount} active of {team.length} members</p>
        </div>
        {isSuperAdmin && (
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-4 py-2 sm:py-2.5 bg-primary text-white text-sm font-semibold rounded-xl cursor-pointer hover:brightness-[0.92] active:scale-[0.98] transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            <span className="hidden sm:inline">Invite Member</span>
          </button>
        )}
      </div>

      {/* Role overview cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4">
        {(Object.entries(ROLE_CONFIG) as [TeamRole, typeof ROLE_CONFIG[TeamRole]][]).map(([role, config]) => {
          const count = team.filter((m) => m.role === role && m.is_active).length;
          return (
            <div key={role} className={`${card} p-3.5 sm:p-5`}>
              <div className="flex items-center gap-2 mb-2">
                <div className="size-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: config.bg }}>
                  <span className="material-symbols-outlined text-[18px]" style={{ color: config.color }}>{config.icon}</span>
                </div>
              </div>
              <p className="text-[13px] font-bold text-[#0F172A]">{config.label}</p>
              <p className="text-lg font-extrabold text-[#0F172A] mt-0.5">{count}</p>
              <p className="text-[10px] text-[#94A3B8] mt-0.5 hidden sm:block leading-tight">{config.description}</p>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 px-4 py-2.5 bg-[#EFF6FF] rounded-xl border border-[#BFDBFE]/40">
        <span className="material-symbols-outlined text-[18px] text-[#2563EB]">info</span>
        <p className="text-[13px] text-[#1E40AF]">
          {isSuperAdmin
            ? "As super admin you can invite members, change roles, and control which pages each member can access via the Privileges button."
            : "Contact a super admin to invite or manage team members."}
        </p>
      </div>

      {/* Add member form */}
      {showAddForm && isSuperAdmin && (
        <div className={`${card} p-4 sm:p-5`}>
          <h3 className="text-sm font-semibold text-[#0F172A] mb-4">Invite Team Member</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className={labelClass}>Email Address</label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className={inputClass}
                placeholder="user@example.com"
                onKeyDown={(e) => e.key === "Enter" && handleAddMember()}
              />
            </div>
            <div>
              <label className={labelClass}>Role</label>
              <select value={newRole} onChange={(e) => setNewRole(e.target.value as TeamRole)} className={`${inputClass} cursor-pointer`}>
                {Object.entries(ROLE_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <button onClick={handleAddMember} disabled={adding} className="px-4 py-2.5 bg-primary text-white text-[13px] font-semibold rounded-xl cursor-pointer hover:brightness-[0.92] transition-all disabled:opacity-50">
              {adding ? "Sending…" : "Send Invite"}
            </button>
            <button onClick={() => { setShowAddForm(false); setNewEmail(""); }} className="px-4 py-2.5 text-[13px] font-semibold text-[#64748B] hover:text-[#334155] cursor-pointer transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {/* Team table */}
      <div className={`${card} overflow-hidden`}>
        {team.length === 0 ? (
          <div className="py-16 text-center">
            <span className="material-symbols-outlined text-[48px] text-[#CBD5E1] block mb-2">people</span>
            <p className="text-sm text-[#64748B]">No team members yet</p>
            <p className="text-xs text-[#94A3B8] mt-1">Add team members by their email address above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="bg-[#F8FAFC]">
                  <th className="px-2.5 sm:px-4 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-left">Member</th>
                  <th className="px-2.5 sm:px-4 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-left hidden sm:table-cell">Role</th>
                  <th className="px-2.5 sm:px-4 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-center hidden md:table-cell">Status</th>
                  <th className="px-2.5 sm:px-4 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-left hidden md:table-cell">Last Active</th>
                  <th className="px-2.5 sm:px-4 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {team.map((member) => {
                  const rc = ROLE_CONFIG[member.role];
                  const name = member.profiles?.name || member.profiles?.email || "—";
                  const isCurrentUser = member.user_id === user?.id;
                  return (
                    <tr key={member.id} className="border-b border-[#F1F5F9] last:border-b-0 hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-2.5 sm:px-4 py-3 sm:py-3.5">
                        <div className="flex items-center gap-2 sm:gap-3">
                          {member.profiles?.avatar_url ? (
                            <img src={member.profiles.avatar_url} alt={name} className="size-8 sm:size-9 rounded-full object-cover flex-shrink-0" />
                          ) : (
                            <div className="size-8 sm:size-9 rounded-full flex items-center justify-center text-white text-[10px] sm:text-xs font-bold flex-shrink-0" style={{ background: `linear-gradient(135deg, ${rc.color}, ${rc.color}99)` }}>
                              {initials(member.profiles?.name ?? "", member.profiles?.email)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#0F172A] truncate">
                              {name}
                              {isCurrentUser && <span className="ml-1 text-[10px] text-primary">(you)</span>}
                            </p>
                            <p className="text-[11px] text-[#64748B] truncate">{member.profiles?.email ?? "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-2.5 sm:px-4 py-3 hidden sm:table-cell">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold tracking-wide" style={{ backgroundColor: rc.bg, color: rc.color }}>
                          <span className="material-symbols-outlined text-[13px]">{rc.icon}</span>
                          {rc.label}
                        </span>
                      </td>
                      <td className="px-2.5 sm:px-4 py-3 text-center hidden md:table-cell">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${member.is_active ? "text-[#059669]" : "text-[#94A3B8]"}`}>
                          <span className={`size-1.5 rounded-full ${member.is_active ? "bg-[#059669]" : "bg-[#94A3B8]"}`} />
                          {member.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-2.5 sm:px-4 py-3 hidden md:table-cell">
                        <span className="text-[13px] text-[#64748B]">{formatLastActive(member.last_active_at)}</span>
                      </td>
                      <td className="px-2.5 sm:px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {!isCurrentUser && isSuperAdmin && (
                            <>
                              {/* Privileges button — only for non-super_admin members */}
                              {member.role !== "super_admin" && (
                                <button
                                  onClick={() => setPrivMember(member)}
                                  className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg border border-[#E2E8F0] text-[11px] font-semibold text-[#64748B] hover:bg-[#F1F5F9] hover:text-primary cursor-pointer transition-colors"
                                  title="Manage page privileges"
                                >
                                  <span className="material-symbols-outlined text-[13px]">lock_open</span>
                                  Privileges
                                </button>
                              )}
                              <select
                                value={member.role}
                                onChange={(e) => updateRole(member.id, e.target.value as TeamRole, name)}
                                disabled={updatingRole === member.id}
                                className="border border-[#E2E8F0] rounded-lg px-1.5 py-1 text-[11px] outline-none cursor-pointer hidden sm:block disabled:opacity-50"
                              >
                                {Object.entries(ROLE_CONFIG).map(([key, config]) => (
                                  <option key={key} value={key}>{config.label}</option>
                                ))}
                              </select>
                              <button
                                onClick={() => toggleStatus(member)}
                                className="size-8 flex items-center justify-center rounded-lg hover:bg-[#F1F5F9] transition-colors cursor-pointer"
                                title={member.is_active ? "Deactivate" : "Activate"}
                              >
                                <span className={`material-symbols-outlined text-[16px] ${member.is_active ? "text-[#DC2626]" : "text-[#059669]"}`}>
                                  {member.is_active ? "person_off" : "person"}
                                </span>
                              </button>
                            </>
                          )}
                          {(isCurrentUser || !isSuperAdmin) && (
                            <span className="text-[11px] text-[#94A3B8] pr-2">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Privileges modal */}
      <Modal
        isOpen={!!privMember}
        onClose={() => setPrivMember(null)}
        title={`Privileges — ${privMember?.profiles?.name ?? privMember?.profiles?.email ?? "Member"}`}
        size="md"
      >
        {privLoading ? (
          <div className="py-10 text-center text-sm text-[#94A3B8]">Loading…</div>
        ) : (
          <div className="space-y-4">
            {/* Summary + bulk actions */}
            <div className="flex items-center justify-between">
              <p className="text-[13px] text-[#64748B]">
                <span className="font-semibold text-[#0F172A]">{grantedCount}</span> of {PAGE_PRIVILEGES.length} pages enabled
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleAllPrivileges(true)}
                  className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                >
                  Grant all
                </button>
                <span className="text-[#CBD5E1]">·</span>
                <button
                  onClick={() => toggleAllPrivileges(false)}
                  className="text-[11px] font-semibold text-[#64748B] hover:text-[#DC2626] cursor-pointer"
                >
                  Clear all
                </button>
              </div>
            </div>

            {/* Role badge */}
            {privMember && (
              <div className="flex items-center gap-1.5 px-3 py-2 bg-[#F8FAFC] rounded-xl">
                <span className="material-symbols-outlined text-[14px]" style={{ color: ROLE_CONFIG[privMember.role].color }}>
                  {ROLE_CONFIG[privMember.role].icon}
                </span>
                <span className="text-[12px] text-[#64748B]">
                  Role: <span className="font-semibold" style={{ color: ROLE_CONFIG[privMember.role].color }}>{ROLE_CONFIG[privMember.role].label}</span>
                  {" "}— defaults shown until you save custom privileges
                </span>
              </div>
            )}

            {/* Toggle list */}
            <div className="border border-[#E8ECF1] rounded-xl overflow-hidden">
              {PAGE_PRIVILEGES.map((priv, idx) => (
                <div
                  key={priv.key}
                  className={`flex items-center gap-3 px-4 py-3 ${idx < PAGE_PRIVILEGES.length - 1 ? "border-b border-[#F1F5F9]" : ""}`}
                >
                  <div className="size-7 rounded-lg bg-[#F1F5F9] flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-[15px] text-[#64748B]">{priv.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-[#0F172A]">{priv.label}</p>
                    <p className="text-[11px] text-[#94A3B8] truncate">{priv.description}</p>
                  </div>
                  {/* Toggle switch */}
                  <button
                    onClick={() => setPrivMap((prev) => ({ ...prev, [priv.key]: !prev[priv.key] }))}
                    className={`relative w-10 h-6 rounded-full flex-shrink-0 transition-colors cursor-pointer ${
                      privMap[priv.key] ? "bg-primary" : "bg-[#CBD5E1]"
                    }`}
                    title={privMap[priv.key] ? "Disable" : "Enable"}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform ${
                        privMap[priv.key] ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>

            {/* Save / Cancel */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={savePrivileges}
                disabled={privSaving}
                className="px-4 py-2.5 bg-primary text-white text-[13px] font-semibold rounded-xl cursor-pointer hover:brightness-[0.92] transition-all disabled:opacity-50"
              >
                {privSaving ? "Saving…" : "Save Privileges"}
              </button>
              <button
                onClick={() => setPrivMember(null)}
                className="px-4 py-2.5 text-[13px] font-semibold text-[#64748B] hover:text-[#334155] cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
