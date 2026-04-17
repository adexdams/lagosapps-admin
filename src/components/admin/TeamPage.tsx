import { useState } from "react";
import { useToast } from "../../hooks/useToast";
import Modal from "../ui/Modal";

const inputClass =
  "w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm text-[#0F172A] outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all";
const labelClass = "text-[13px] font-semibold text-[#0F172A] mb-1.5 block";
const card = "bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60";

type TeamRole = "super_admin" | "operations" | "support" | "finance" | "tech";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: TeamRole;
  status: "active" | "inactive";
  lastActive: string;
  avatar: string;
  privileges: Record<string, boolean>;
}

const ROLE_CONFIG: Record<TeamRole, { label: string; color: string; bg: string; description: string; icon: string }> = {
  super_admin: { label: "Super Admin", color: "#7C3AED", bg: "#F5F3FF", description: "Full access to all features and settings", icon: "admin_panel_settings" },
  operations: { label: "Operations", color: "#2563EB", bg: "#EFF6FF", description: "Manage orders, fulfillment, and inventory", icon: "assignment" },
  support: { label: "Support", color: "#059669", bg: "#ECFDF5", description: "Handle user inquiries and order support", icon: "support_agent" },
  finance: { label: "Finance", color: "#EA580C", bg: "#FFF7ED", description: "Manage wallet, payments, and financial reports", icon: "payments" },
  tech: { label: "Tech", color: "#0891B2", bg: "#ECFEFF", description: "Platform maintenance, integrations, and technical operations", icon: "code" },
};

const PRIVILEGE_GROUPS = [
  {
    group: "Users & Orders",
    items: [
      { key: "users.view", label: "View users" },
      { key: "users.edit", label: "Edit users" },
      { key: "users.deactivate", label: "Deactivate users" },
      { key: "orders.view", label: "View orders" },
      { key: "orders.create", label: "Create orders on behalf of users" },
      { key: "orders.status", label: "Update order status" },
      { key: "orders.refund", label: "Issue refunds" },
    ],
  },
  {
    group: "Fulfillment & Requests",
    items: [
      { key: "fulfillment.view", label: "View fulfillment queue" },
      { key: "fulfillment.manage", label: "Assign tasks and update progress" },
      { key: "requests.view", label: "View service requests" },
      { key: "requests.manage", label: "Review, schedule, and decline requests" },
      { key: "carts.view", label: "View live and abandoned carts" },
    ],
  },
  {
    group: "Inventory & Products",
    items: [
      { key: "inventory.view", label: "View inventory" },
      { key: "inventory.edit", label: "Add/edit products" },
      { key: "inventory.delete", label: "Remove products" },
      { key: "inventory.stock", label: "Manage stock levels" },
    ],
  },
  {
    group: "Membership & Referrals",
    items: [
      { key: "membership.view", label: "View memberships and subscriptions" },
      { key: "membership.config", label: "Configure tiers and benefits" },
      { key: "membership.usage", label: "View benefit usage data" },
      { key: "referrals.view", label: "View referrals" },
      { key: "referrals.manage", label: "Generate codes and manage referrals" },
    ],
  },
  {
    group: "Finance & Wallet",
    items: [
      { key: "wallet.view", label: "View wallet transactions" },
      { key: "wallet.adjust", label: "Manual wallet adjustments" },
      { key: "finance.view", label: "View finance dashboard and settlements" },
      { key: "finance.reports", label: "Generate financial reports" },
    ],
  },
  {
    group: "Communication",
    items: [
      { key: "broadcast.view", label: "View broadcasts" },
      { key: "broadcast.send", label: "Send broadcasts" },
      { key: "broadcast.retract", label: "Retract sent broadcasts" },
    ],
  },
  {
    group: "Analytics & Audit",
    items: [
      { key: "analytics.view", label: "View analytics dashboard" },
      { key: "analytics.export", label: "Export data and reports" },
      { key: "audit.view", label: "View audit log" },
      { key: "audit.export", label: "Export audit log" },
    ],
  },
  {
    group: "System",
    items: [
      { key: "settings.edit", label: "Edit platform settings and portal toggles" },
      { key: "team.manage", label: "Manage team members and privileges" },
    ],
  },
];

const ALL_PRIVILEGES = PRIVILEGE_GROUPS.flatMap((g) => g.items.map((i) => i.key));

const defaultPrivileges = (role: TeamRole): Record<string, boolean> => {
  const all = Object.fromEntries(ALL_PRIVILEGES.map((k) => [k, false]));
  if (role === "super_admin") return Object.fromEntries(ALL_PRIVILEGES.map((k) => [k, true]));
  if (role === "operations") {
    ["users.view", "orders.view", "orders.create", "orders.status",
     "fulfillment.view", "fulfillment.manage", "requests.view", "requests.manage", "carts.view",
     "inventory.view", "inventory.edit", "inventory.stock",
     "membership.view", "referrals.view",
     "broadcast.view", "analytics.view"].forEach((k) => { all[k] = true; });
  }
  if (role === "support") {
    ["users.view", "users.edit", "orders.view", "orders.create", "orders.status",
     "fulfillment.view", "requests.view", "requests.manage", "carts.view",
     "inventory.view",
     "membership.view", "membership.usage", "referrals.view",
     "wallet.view", "broadcast.view"].forEach((k) => { all[k] = true; });
  }
  if (role === "finance") {
    ["users.view", "orders.view",
     "membership.view", "membership.usage", "referrals.view",
     "wallet.view", "wallet.adjust", "finance.view", "finance.reports",
     "analytics.view", "analytics.export", "audit.view"].forEach((k) => { all[k] = true; });
  }
  if (role === "tech") {
    ["users.view", "orders.view",
     "fulfillment.view", "carts.view",
     "inventory.view", "inventory.edit", "inventory.delete", "inventory.stock",
     "analytics.view", "analytics.export", "audit.view", "audit.export",
     "settings.edit"].forEach((k) => { all[k] = true; });
  }
  return all;
};

const INITIAL_TEAM: TeamMember[] = [
  { id: "TM-001", name: "Damola Adediran", email: "damola@lagosapps.com", phone: "+234 801 234 5678", role: "super_admin", status: "active", lastActive: "2026-04-11", avatar: "DA", privileges: defaultPrivileges("super_admin") },
  { id: "TM-002", name: "Chioma Eze", email: "chioma@lagosapps.com", phone: "+234 802 345 6789", role: "operations", status: "active", lastActive: "2026-04-10", avatar: "CE", privileges: defaultPrivileges("operations") },
  { id: "TM-003", name: "Kunle Adeyemi", email: "kunle@lagosapps.com", phone: "+234 803 456 7890", role: "support", status: "active", lastActive: "2026-04-09", avatar: "KA", privileges: defaultPrivileges("support") },
  { id: "TM-004", name: "Fatima Bello", email: "fatima@lagosapps.com", phone: "+234 804 567 8901", role: "finance", status: "active", lastActive: "2026-04-08", avatar: "FB", privileges: defaultPrivileges("finance") },
  { id: "TM-005", name: "Emeka Emenike", email: "emeka@lagosapps.com", phone: "+234 805 678 9012", role: "support", status: "inactive", lastActive: "2026-03-15", avatar: "EE", privileges: defaultPrivileges("support") },
  { id: "TM-006", name: "Tunde Bakare", email: "tunde@lagosapps.com", phone: "+234 806 789 0123", role: "tech", status: "active", lastActive: "2026-04-11", avatar: "TB", privileges: defaultPrivileges("tech") },
];

function formatLastActive(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}

export default function TeamPage() {
  const toast = useToast();
  const [team, setTeam] = useState(INITIAL_TEAM);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newRole, setNewRole] = useState<TeamRole>("support");

  // Individual privilege modal
  const [privMember, setPrivMember] = useState<TeamMember | null>(null);
  const [editedPrivileges, setEditedPrivileges] = useState<Record<string, boolean>>({});

  // Group privilege modal
  const [groupEditRole, setGroupEditRole] = useState<TeamRole | null>(null);
  const [groupPrivileges, setGroupPrivileges] = useState<Record<string, boolean>>({});

  const handleAddMember = () => {
    if (!newName.trim() || !newEmail.trim()) { toast.error("Name and email are required"); return; }
    const initials = newName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
    const member: TeamMember = {
      id: `TM-${String(team.length + 1).padStart(3, "0")}`,
      name: newName, email: newEmail, phone: newPhone, role: newRole,
      status: "active", lastActive: new Date().toISOString().slice(0, 10),
      avatar: initials, privileges: defaultPrivileges(newRole),
    };
    setTeam((prev) => [...prev, member]);
    toast.success(`${newName} added as ${ROLE_CONFIG[newRole].label}`);
    setShowAddForm(false);
    setNewName(""); setNewEmail(""); setNewPhone(""); setNewRole("support");
  };

  const updateRole = (id: string, role: TeamRole) => {
    setTeam((prev) => prev.map((m) => m.id === id ? { ...m, role, privileges: defaultPrivileges(role) } : m));
    toast.success("Role updated — privileges reset to role defaults");
  };

  const toggleStatus = (id: string) => {
    setTeam((prev) => prev.map((m) => m.id === id ? { ...m, status: m.status === "active" ? "inactive" : "active" } : m));
  };

  // Individual privileges
  const openPrivileges = (member: TeamMember) => {
    setPrivMember(member);
    setEditedPrivileges({ ...member.privileges });
  };

  const savePrivileges = () => {
    if (!privMember) return;
    setTeam((prev) => prev.map((m) => m.id === privMember.id ? { ...m, privileges: { ...editedPrivileges } } : m));
    toast.success(`Privileges updated for ${privMember.name}`);
    setPrivMember(null);
  };

  // Group privileges
  const openGroupEdit = (role: TeamRole) => {
    setGroupEditRole(role);
    setGroupPrivileges({ ...defaultPrivileges(role) });
  };

  const saveGroupPrivileges = () => {
    if (!groupEditRole) return;
    const count = team.filter((m) => m.role === groupEditRole).length;
    setTeam((prev) => prev.map((m) => m.role === groupEditRole ? { ...m, privileges: { ...groupPrivileges } } : m));
    toast.success(`Privileges applied to all ${count} ${ROLE_CONFIG[groupEditRole].label} members`);
    setGroupEditRole(null);
  };

  const toggleGroupAll = (groupItems: { key: string }[], value: boolean) => {
    const isGroupEdit = !!groupEditRole;
    const setter = isGroupEdit ? setGroupPrivileges : setEditedPrivileges;
    setter((prev) => {
      const updated = { ...prev };
      groupItems.forEach((item) => { updated[item.key] = value; });
      return updated;
    });
  };

  const activeCount = team.filter((m) => m.status === "active").length;

  // Shared privilege editor UI
  const renderPrivilegeEditor = (privileges: Record<string, boolean>, setPriv: React.Dispatch<React.SetStateAction<Record<string, boolean>>>) => (
    <div className="space-y-5">
      {PRIVILEGE_GROUPS.map((group) => {
        const groupEnabled = group.items.every((item) => privileges[item.key]);
        const groupPartial = group.items.some((item) => privileges[item.key]) && !groupEnabled;
        return (
          <div key={group.group}>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[13px] font-semibold text-[#0F172A]">{group.group}</h4>
              <button
                onClick={() => toggleGroupAll(group.items, !groupEnabled)}
                className={`text-[11px] font-semibold cursor-pointer transition-colors ${
                  groupEnabled ? "text-[#DC2626] hover:text-[#B91C1C]" : "text-primary hover:text-primary/80"
                }`}
              >
                {groupEnabled ? "Disable all" : "Enable all"}
              </button>
            </div>
            {/* Group-level progress indicator */}
            <div className="h-1 bg-[#F1F5F9] rounded-full overflow-hidden mb-2">
              <div
                className={`h-full rounded-full transition-all ${groupPartial ? "bg-[#EA580C]" : groupEnabled ? "bg-primary" : "bg-transparent"}`}
                style={{ width: `${(group.items.filter((item) => privileges[item.key]).length / group.items.length) * 100}%` }}
              />
            </div>
            <div className="space-y-1.5">
              {group.items.map((item) => (
                <label key={item.key} className="flex items-center justify-between py-1.5 cursor-pointer group">
                  <span className="text-[13px] text-[#334155] group-hover:text-[#0F172A] transition-colors">{item.label}</span>
                  <button
                    onClick={() => setPriv((prev) => ({ ...prev, [item.key]: !prev[item.key] }))}
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${privileges[item.key] ? "bg-primary" : "bg-[#E2E8F0]"}`}
                  >
                    <div className={`size-4 bg-white rounded-full shadow transition-transform ${privileges[item.key] ? "translate-x-4" : ""}`} />
                  </button>
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0F172A]">Team</h1>
          <p className="text-sm text-[#64748B] mt-0.5">{activeCount} active of {team.length} members</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center gap-1.5 px-2.5 sm:px-4 py-2 sm:py-2.5 bg-primary text-white text-sm font-semibold rounded-xl cursor-pointer hover:brightness-[0.92] active:scale-[0.98] transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          <span className="hidden sm:inline">Add Member</span>
        </button>
      </div>

      {/* Role overview cards — with group edit buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4">
        {(Object.entries(ROLE_CONFIG) as [TeamRole, typeof ROLE_CONFIG[TeamRole]][]).map(([role, config]) => {
          const count = team.filter((m) => m.role === role && m.status === "active").length;
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
              {role !== "super_admin" && (
                <button
                  onClick={() => openGroupEdit(role)}
                  className="mt-2 text-[11px] font-semibold cursor-pointer transition-colors flex items-center gap-1"
                  style={{ color: config.color }}
                >
                  <span className="material-symbols-outlined text-[14px]">tune</span>
                  Edit Group Privileges
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Note about profile settings */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-[#EFF6FF] rounded-xl border border-[#BFDBFE]/40">
        <span className="material-symbols-outlined text-[18px] text-[#2563EB]">info</span>
        <p className="text-[13px] text-[#1E40AF]">All team members can access their own profile settings (avatar, name, email) regardless of role.</p>
      </div>

      {/* Add member form */}
      {showAddForm && (
        <div className={`${card} p-4 sm:p-5`}>
          <h3 className="text-sm font-semibold text-[#0F172A] mb-4">New Team Member</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className={labelClass}>Name</label>
              <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} className={inputClass} placeholder="Full name" />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className={inputClass} placeholder="email@lagosapps.com" />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input type="text" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} className={inputClass} placeholder="+234..." />
            </div>
            <div>
              <label className={labelClass}>Role</label>
              <select value={newRole} onChange={(e) => setNewRole(e.target.value as TeamRole)} className={`${inputClass} cursor-pointer`}>
                {Object.entries(ROLE_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button onClick={handleAddMember} className="flex-1 px-4 py-2.5 bg-primary text-white text-[13px] font-semibold rounded-xl cursor-pointer hover:brightness-[0.92] transition-all">Add</button>
              <button onClick={() => { setShowAddForm(false); setNewName(""); setNewEmail(""); setNewPhone(""); }} className="px-4 py-2.5 text-[13px] font-semibold text-[#64748B] hover:text-[#334155] cursor-pointer transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Team table */}
      <div className={`${card} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm">
            <thead>
              <tr className="bg-[#F8FAFC]">
                <th className="px-2.5 sm:px-4 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-left">Member</th>
                <th className="px-2.5 sm:px-4 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-left hidden sm:table-cell">Role</th>
                <th className="px-2.5 sm:px-4 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-center hidden md:table-cell">Status</th>
                <th className="px-2.5 sm:px-4 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-left hidden md:table-cell">Last Active</th>
                <th className="px-2.5 sm:px-4 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-center">Privileges</th>
                <th className="px-2.5 sm:px-4 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {team.map((member) => {
                const rc = ROLE_CONFIG[member.role];
                const privCount = Object.values(member.privileges).filter(Boolean).length;
                return (
                  <tr key={member.id} className="border-b border-[#F1F5F9] last:border-b-0 hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-2.5 sm:px-4 py-3 sm:py-3.5">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="size-8 sm:size-9 rounded-full flex items-center justify-center text-white text-[10px] sm:text-xs font-bold flex-shrink-0" style={{ background: `linear-gradient(135deg, ${rc.color}, ${rc.color}99)` }}>
                          {member.avatar}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#0F172A] truncate">{member.name}</p>
                          <p className="text-[11px] text-[#64748B] truncate">{member.email}</p>
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
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${member.status === "active" ? "text-[#059669]" : "text-[#94A3B8]"}`}>
                        <span className={`size-1.5 rounded-full ${member.status === "active" ? "bg-[#059669]" : "bg-[#94A3B8]"}`} />
                        {member.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-2.5 sm:px-4 py-3 hidden md:table-cell">
                      <span className="text-[13px] text-[#64748B]">{formatLastActive(member.lastActive)}</span>
                    </td>
                    <td className="px-2.5 sm:px-4 py-3 text-center">
                      <button
                        onClick={() => openPrivileges(member)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-[#64748B] hover:bg-[#F1F5F9] cursor-pointer transition-colors"
                      >
                        <span className="material-symbols-outlined text-[14px]">shield</span>
                        <span className="hidden sm:inline">{privCount}/{ALL_PRIVILEGES.length}</span>
                      </button>
                    </td>
                    <td className="px-2.5 sm:px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <select
                          value={member.role}
                          onChange={(e) => updateRole(member.id, e.target.value as TeamRole)}
                          className="border border-[#E2E8F0] rounded-lg px-1.5 py-1 text-[11px] outline-none cursor-pointer hidden sm:block"
                        >
                          {Object.entries(ROLE_CONFIG).map(([key, config]) => (
                            <option key={key} value={key}>{config.label}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => { toggleStatus(member.id); toast.success(`${member.name} ${member.status === "active" ? "deactivated" : "activated"}`); }}
                          className="size-8 flex items-center justify-center rounded-lg hover:bg-[#F1F5F9] transition-colors cursor-pointer"
                          title={member.status === "active" ? "Deactivate" : "Activate"}
                        >
                          <span className={`material-symbols-outlined text-[16px] ${member.status === "active" ? "text-[#DC2626]" : "text-[#059669]"}`}>
                            {member.status === "active" ? "person_off" : "person"}
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Individual Privileges Modal ── */}
      <Modal isOpen={!!privMember} onClose={() => setPrivMember(null)} title={`Privileges — ${privMember?.name}`} size="md">
        <div className="space-y-5">
          {privMember && (
            <div className="flex items-center gap-3 p-3 bg-[#F8FAFC] rounded-xl">
              <div className="size-10 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: `linear-gradient(135deg, ${ROLE_CONFIG[privMember.role].color}, ${ROLE_CONFIG[privMember.role].color}99)` }}>
                {privMember.avatar}
              </div>
              <div>
                <p className="text-sm font-semibold text-[#0F172A]">{privMember.name}</p>
                <p className="text-[12px] text-[#64748B]">{ROLE_CONFIG[privMember.role].label} — {ROLE_CONFIG[privMember.role].description}</p>
              </div>
            </div>
          )}

          {renderPrivilegeEditor(editedPrivileges, setEditedPrivileges)}

          <div className="flex justify-end gap-3 pt-3 border-t border-[#E8ECF1]">
            <button onClick={() => setPrivMember(null)} className="px-4 py-2 text-[13px] font-semibold text-[#64748B] hover:text-[#334155] cursor-pointer transition-colors">Cancel</button>
            <button onClick={savePrivileges} className="px-4 py-2 bg-primary text-white text-[13px] font-semibold rounded-lg cursor-pointer hover:brightness-[0.92] transition-all">Save Privileges</button>
          </div>
        </div>
      </Modal>

      {/* ── Group Privileges Modal ── */}
      <Modal isOpen={!!groupEditRole} onClose={() => setGroupEditRole(null)} title={`Group Privileges — ${groupEditRole ? ROLE_CONFIG[groupEditRole].label : ""}`} size="md">
        <div className="space-y-5">
          {groupEditRole && (
            <>
              <div className="p-3 rounded-xl" style={{ backgroundColor: ROLE_CONFIG[groupEditRole].bg }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-[20px]" style={{ color: ROLE_CONFIG[groupEditRole].color }}>{ROLE_CONFIG[groupEditRole].icon}</span>
                  <p className="text-sm font-bold" style={{ color: ROLE_CONFIG[groupEditRole].color }}>{ROLE_CONFIG[groupEditRole].label}</p>
                </div>
                <p className="text-[12px] text-[#64748B]">{ROLE_CONFIG[groupEditRole].description}</p>
                <p className="text-[12px] font-semibold text-[#0F172A] mt-2">
                  Applies to {team.filter((m) => m.role === groupEditRole).length} member{team.filter((m) => m.role === groupEditRole).length !== 1 ? "s" : ""}: {team.filter((m) => m.role === groupEditRole).map((m) => m.name).join(", ")}
                </p>
              </div>

              {renderPrivilegeEditor(groupPrivileges, setGroupPrivileges)}

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E8ECF1]">
                <button onClick={() => setGroupEditRole(null)} className="px-4 py-2 text-[13px] font-semibold text-[#64748B] hover:text-[#334155] cursor-pointer transition-colors">Cancel</button>
                <button onClick={saveGroupPrivileges} className="px-4 py-2 bg-primary text-white text-[13px] font-semibold rounded-lg cursor-pointer hover:brightness-[0.92] transition-all">
                  Apply to All {ROLE_CONFIG[groupEditRole].label} Members
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
