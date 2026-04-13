import { useState } from "react";
import { useToast } from "../../hooks/useToast";
import Modal from "../ui/Modal";

const inputClass =
  "w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm text-[#0F172A] outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all";
const labelClass = "text-[13px] font-semibold text-[#0F172A] mb-1.5 block";
const card = "bg-white rounded-xl sm:rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60";

type TeamRole = "super_admin" | "operations" | "support" | "finance";

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

const ROLE_CONFIG: Record<TeamRole, { label: string; color: string; bg: string; description: string }> = {
  super_admin: { label: "Super Admin", color: "#7C3AED", bg: "#F5F3FF", description: "Full access to all features and settings" },
  operations: { label: "Operations", color: "#2563EB", bg: "#EFF6FF", description: "Manage orders, fulfillment, and inventory" },
  support: { label: "Support", color: "#059669", bg: "#ECFDF5", description: "Handle user inquiries and order support" },
  finance: { label: "Finance", color: "#EA580C", bg: "#FFF7ED", description: "Manage wallet, payments, and financial reports" },
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
    group: "Inventory & Products",
    items: [
      { key: "inventory.view", label: "View inventory" },
      { key: "inventory.edit", label: "Add/edit products" },
      { key: "inventory.delete", label: "Remove products" },
      { key: "inventory.stock", label: "Manage stock levels" },
    ],
  },
  {
    group: "Finance & Wallet",
    items: [
      { key: "wallet.view", label: "View transactions" },
      { key: "wallet.adjust", label: "Manual wallet adjustments" },
      { key: "analytics.view", label: "View analytics & reports" },
      { key: "analytics.export", label: "Export data" },
    ],
  },
  {
    group: "Communication & System",
    items: [
      { key: "broadcast.view", label: "View broadcasts" },
      { key: "broadcast.send", label: "Send broadcasts" },
      { key: "membership.view", label: "View memberships" },
      { key: "membership.config", label: "Configure tiers" },
      { key: "settings.view", label: "View settings" },
      { key: "settings.edit", label: "Edit platform settings" },
      { key: "team.manage", label: "Manage team members" },
    ],
  },
];

const ALL_PRIVILEGES = PRIVILEGE_GROUPS.flatMap((g) => g.items.map((i) => i.key));

const defaultPrivileges = (role: TeamRole): Record<string, boolean> => {
  const all = Object.fromEntries(ALL_PRIVILEGES.map((k) => [k, false]));
  if (role === "super_admin") return Object.fromEntries(ALL_PRIVILEGES.map((k) => [k, true]));
  if (role === "operations") {
    ["users.view", "orders.view", "orders.create", "orders.status", "inventory.view", "inventory.edit", "inventory.stock", "broadcast.view", "membership.view", "analytics.view"].forEach((k) => { all[k] = true; });
  }
  if (role === "support") {
    ["users.view", "users.edit", "orders.view", "orders.create", "orders.status", "inventory.view", "broadcast.view", "wallet.view"].forEach((k) => { all[k] = true; });
  }
  if (role === "finance") {
    ["users.view", "orders.view", "wallet.view", "wallet.adjust", "analytics.view", "analytics.export", "membership.view"].forEach((k) => { all[k] = true; });
  }
  return all;
};

const INITIAL_TEAM: TeamMember[] = [
  { id: "TM-001", name: "Damola Adediran", email: "damola@lagosapps.com", phone: "+234 801 234 5678", role: "super_admin", status: "active", lastActive: "2026-04-11", avatar: "DA", privileges: defaultPrivileges("super_admin") },
  { id: "TM-002", name: "Chioma Eze", email: "chioma@lagosapps.com", phone: "+234 802 345 6789", role: "operations", status: "active", lastActive: "2026-04-10", avatar: "CE", privileges: defaultPrivileges("operations") },
  { id: "TM-003", name: "Kunle Adeyemi", email: "kunle@lagosapps.com", phone: "+234 803 456 7890", role: "support", status: "active", lastActive: "2026-04-09", avatar: "KA", privileges: defaultPrivileges("support") },
  { id: "TM-004", name: "Fatima Bello", email: "fatima@lagosapps.com", phone: "+234 804 567 8901", role: "finance", status: "active", lastActive: "2026-04-08", avatar: "FB", privileges: defaultPrivileges("finance") },
  { id: "TM-005", name: "Emeka Emenike", email: "emeka@lagosapps.com", phone: "+234 805 678 9012", role: "support", status: "inactive", lastActive: "2026-03-15", avatar: "EE", privileges: defaultPrivileges("support") },
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

  // Privilege modal
  const [privMember, setPrivMember] = useState<TeamMember | null>(null);
  const [editedPrivileges, setEditedPrivileges] = useState<Record<string, boolean>>({});

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

  const activeCount = team.filter((m) => m.status === "active").length;

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

      {/* Role overview cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {(Object.entries(ROLE_CONFIG) as [TeamRole, typeof ROLE_CONFIG[TeamRole]][]).map(([role, config]) => {
          const count = team.filter((m) => m.role === role && m.status === "active").length;
          return (
            <div key={role} className={`${card} p-3.5 sm:p-5`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-block px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-semibold" style={{ backgroundColor: config.bg, color: config.color }}>
                  {config.label}
                </span>
              </div>
              <p className="text-lg sm:text-2xl font-extrabold text-[#0F172A]">{count}</p>
              <p className="text-[11px] text-[#94A3B8] mt-0.5 hidden sm:block">{config.description}</p>
            </div>
          );
        })}
      </div>

      {/* Add member form */}
      {showAddForm && (
        <div className={`${card} p-4 sm:p-5`}>
          <h3 className="text-sm font-semibold text-[#0F172A] mb-4">New Team Member</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
          </div>
          <div className="flex items-center gap-3 mt-4">
            <button onClick={handleAddMember} className="px-4 py-2 bg-primary text-white text-[13px] font-semibold rounded-lg cursor-pointer hover:brightness-[0.92] transition-all">Add Member</button>
            <button onClick={() => { setShowAddForm(false); setNewName(""); setNewEmail(""); setNewPhone(""); }} className="px-4 py-2 text-[13px] font-semibold text-[#64748B] hover:text-[#334155] cursor-pointer transition-colors">Cancel</button>
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
                      <span className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-semibold tracking-wide" style={{ backgroundColor: rc.bg, color: rc.color }}>
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

      {/* Privileges modal */}
      <Modal isOpen={!!privMember} onClose={() => setPrivMember(null)} title={`Privileges — ${privMember?.name}`} size="md">
        <div className="space-y-5">
          {/* Role summary */}
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

          {/* Privilege groups */}
          {PRIVILEGE_GROUPS.map((group) => (
            <div key={group.group}>
              <h4 className="text-[13px] font-semibold text-[#0F172A] mb-2">{group.group}</h4>
              <div className="space-y-1.5">
                {group.items.map((item) => (
                  <label key={item.key} className="flex items-center justify-between py-1.5 cursor-pointer group">
                    <span className="text-[13px] text-[#334155] group-hover:text-[#0F172A] transition-colors">{item.label}</span>
                    <button
                      onClick={() => setEditedPrivileges((prev) => ({ ...prev, [item.key]: !prev[item.key] }))}
                      className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${editedPrivileges[item.key] ? "bg-primary" : "bg-[#E2E8F0]"}`}
                    >
                      <div className={`size-4 bg-white rounded-full shadow transition-transform ${editedPrivileges[item.key] ? "translate-x-4" : ""}`} />
                    </button>
                  </label>
                ))}
              </div>
            </div>
          ))}

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-3 border-t border-[#E8ECF1]">
            <button onClick={() => setPrivMember(null)} className="px-4 py-2 text-[13px] font-semibold text-[#64748B] hover:text-[#334155] cursor-pointer transition-colors">Cancel</button>
            <button onClick={savePrivileges} className="px-4 py-2 bg-primary text-white text-[13px] font-semibold rounded-lg cursor-pointer hover:brightness-[0.92] transition-all">Save Privileges</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
