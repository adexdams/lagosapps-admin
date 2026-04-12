import { useState } from "react";
import { useToast } from "../../hooks/useToast";

import { PORTAL_LABELS, PORTAL_COLORS, type Portal } from "../../data/adminMockData";

const PORTALS: Portal[] = [
  "solar",
  "transport",
  "groceries",
  "health",
  "events",
  "community",
  "logistics",
];

const inputClass =
  "w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm text-[#0F172A] outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all";
const labelClass = "text-[13px] font-semibold text-[#0F172A] mb-1.5 block";

type TeamRole = "super_admin" | "operations" | "support" | "finance";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  status: "active" | "inactive";
  lastActive: string;
  avatar: string;
}

const ROLE_CONFIG: Record<TeamRole, { label: string; color: string; bg: string }> = {
  super_admin: { label: "Super Admin", color: "#7C3AED", bg: "#F5F3FF" },
  operations: { label: "Operations", color: "#2563EB", bg: "#EFF6FF" },
  support: { label: "Support", color: "#059669", bg: "#ECFDF5" },
  finance: { label: "Finance", color: "#EA580C", bg: "#FFF7ED" },
};

const INITIAL_TEAM: TeamMember[] = [
  {
    id: "TM-001",
    name: "Damola Adediran",
    email: "damola@lagosapps.com",
    role: "super_admin",
    status: "active",
    lastActive: "2026-04-11",
    avatar: "DA",
  },
  {
    id: "TM-002",
    name: "Chioma Eze",
    email: "chioma@lagosapps.com",
    role: "operations",
    status: "active",
    lastActive: "2026-04-10",
    avatar: "CE",
  },
  {
    id: "TM-003",
    name: "Kunle Adeyemi",
    email: "kunle@lagosapps.com",
    role: "support",
    status: "active",
    lastActive: "2026-04-09",
    avatar: "KA",
  },
  {
    id: "TM-004",
    name: "Fatima Bello",
    email: "fatima@lagosapps.com",
    role: "finance",
    status: "active",
    lastActive: "2026-04-08",
    avatar: "FB",
  },
  {
    id: "TM-005",
    name: "Emeka Emenike",
    email: "emeka@lagosapps.com",
    role: "support",
    status: "inactive",
    lastActive: "2026-03-15",
    avatar: "EE",
  },
];

export default function SettingsPage() {
  const toast = useToast();
  // Profile fields
  const [profileName, setProfileName] = useState("Admin");
  const [profileEmail] = useState("admin@lagosapps.com");
  const [profileWhatsApp, setProfileWhatsApp] = useState("+234 800 123 4567");

  // Platform settings
  const [siteName, setSiteName] = useState("LagosApps");
  const [supportEmail, setSupportEmail] = useState("support@lagosapps.com");
  const [supportPhone, setSupportPhone] = useState("+234 800 123 4567");
  const [whatsappNumber, setWhatsappNumber] = useState("+234 800 123 4567");

  // Team members
  const [team, setTeam] = useState<TeamMember[]>(INITIAL_TEAM);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<TeamRole>("support");
  const [editingRole, setEditingRole] = useState<string | null>(null);

  // Portal toggles
  const [portalStates, setPortalStates] = useState<Record<Portal, boolean>>({
    solar: true,
    transport: true,
    groceries: true,
    health: true,
    events: true,
    community: false,
    logistics: true,
  });

  // Payment settings
  const [testMode, setTestMode] = useState(false);

  const togglePortal = (portal: Portal) => {
    setPortalStates((prev) => ({ ...prev, [portal]: !prev[portal] }));
  };

  const handleSave = (section: string) => {
    toast.success(`${section} saved successfully`);
  };

  const handleAddMember = () => {
    if (!newName.trim() || !newEmail.trim()) {
      toast.error("Name and email are required");
      return;
    }
    const initials = newName
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
    const member: TeamMember = {
      id: `TM-${String(team.length + 1).padStart(3, "0")}`,
      name: newName,
      email: newEmail,
      role: newRole,
      status: "active",
      lastActive: "2026-04-11",
      avatar: initials,
    };
    setTeam((prev) => [...prev, member]);
    setNewName("");
    setNewEmail("");
    setNewRole("support");
    setShowAddForm(false);
    toast.success(`${newName} added to team`);
  };

  const toggleMemberStatus = (id: string) => {
    setTeam((prev) =>
      prev.map((m) =>
        m.id === id
          ? { ...m, status: m.status === "active" ? "inactive" : "active" }
          : m
      )
    );
  };

  const updateMemberRole = (id: string, role: TeamRole) => {
    setTeam((prev) => prev.map((m) => (m.id === id ? { ...m, role } : m)));
    setEditingRole(null);
    toast.success("Role updated");
  };

  const formatLastActive = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-5 sm:space-y-8 max-w-3xl">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold text-[#0F172A]">Settings</h1>
        <p className="text-sm text-[#64748B] mt-1">
          Manage platform configuration and team access.
        </p>
      </div>

      {/* ── Your Profile ── */}
      <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 overflow-hidden">
        <div className="px-5 py-3 border-b border-[#E8ECF1]/60">
          <h2 className="text-base font-bold text-[#0F172A]">Your Profile</h2>
        </div>
        <div className="p-5 sm:p-7 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Full Name</label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                value={profileEmail}
                readOnly
                className={`${inputClass} bg-[#F8FAFC] text-[#64748B] cursor-not-allowed`}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>WhatsApp Number</label>
            <input
              type="text"
              value={profileWhatsApp}
              onChange={(e) => setProfileWhatsApp(e.target.value)}
              className={inputClass}
              placeholder="+234 801 234 5678"
            />
            <p className="text-xs text-[#94A3B8] mt-1">This will be displayed on your admin overview page</p>
          </div>
          <div className="flex justify-end pt-2">
            <button
              onClick={() => {
                handleSave("Profile");
              }}
              className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl cursor-pointer hover:brightness-[0.92] active:scale-[0.98] transition-all"
            >
              Save Profile
            </button>
          </div>
        </div>
      </div>

      {/* ── Platform Settings ── */}
      <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 overflow-hidden">
        <div className="px-5 py-3 border-b border-[#E8ECF1]/60">
          <h2 className="text-base font-bold text-[#0F172A]">Platform Settings</h2>
        </div>
        <div className="p-5 sm:p-7 space-y-5">
          <div>
            <label className={labelClass}>Site Name</label>
            <input
              type="text"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Support Email</label>
            <input
              type="email"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Support Phone</label>
              <input
                type="text"
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>WhatsApp Number</label>
              <input
                type="text"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button
              onClick={() => handleSave("Platform settings")}
              className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl cursor-pointer hover:brightness-[0.92] active:scale-[0.98] transition-all"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>

      {/* ── Team Members ── */}
      <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 overflow-hidden">
        <div className="px-5 py-3 border-b border-[#E8ECF1]/60 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#0F172A]">Team Members</h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Manage who has access to the admin dashboard
            </p>
          </div>
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-[13px] font-semibold rounded-lg cursor-pointer hover:brightness-[0.92] active:scale-[0.98] transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">person_add</span>
              Add Member
            </button>
          )}
        </div>

        {/* Add member inline form */}
        {showAddForm && (
          <div className="px-5 py-4 bg-[#F8FAFC] border-b border-[#E8ECF1]/60">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className={labelClass}>Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className={inputClass}
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className={inputClass}
                  placeholder="email@lagosapps.com"
                />
              </div>
              <div>
                <label className={labelClass}>Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as TeamRole)}
                  className={`${inputClass} cursor-pointer`}
                >
                  {Object.entries(ROLE_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-3">
              <button
                onClick={handleAddMember}
                className="px-4 py-2 bg-primary text-white text-[13px] font-semibold rounded-lg cursor-pointer hover:brightness-[0.92] active:scale-[0.98] transition-all"
              >
                Add Member
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewName("");
                  setNewEmail("");
                  setNewRole("support");
                }}
                className="px-4 py-2 text-[13px] font-semibold text-[#64748B] hover:text-[#334155] cursor-pointer transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Team table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F8FAFC]">
                <th className="px-5 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-left">
                  Member
                </th>
                <th className="px-5 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-left hidden sm:table-cell">
                  Role
                </th>
                <th className="px-5 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-center hidden md:table-cell">
                  Status
                </th>
                <th className="px-5 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-left hidden md:table-cell">
                  Last Active
                </th>
                <th className="px-5 py-3 text-[11px] font-semibold text-[#64748B] uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {team.map((member) => {
                const roleConfig = ROLE_CONFIG[member.role];
                return (
                  <tr
                    key={member.id}
                    className="border-b border-[#F1F5F9] last:border-b-0 hover:bg-[#F8FAFC] transition-colors"
                  >
                    {/* Name + email */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className="size-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                          style={{
                            background: `linear-gradient(135deg, ${roleConfig.color}, ${roleConfig.color}99)`,
                          }}
                        >
                          {member.avatar}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#0F172A] truncate">
                            {member.name}
                          </p>
                          <p className="text-[12px] text-[#64748B] truncate">{member.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      {editingRole === member.id ? (
                        <select
                          value={member.role}
                          onChange={(e) =>
                            updateMemberRole(member.id, e.target.value as TeamRole)
                          }
                          onBlur={() => setEditingRole(null)}
                          autoFocus
                          className="border border-[#E2E8F0] rounded-lg px-2 py-1 text-[12px] outline-none focus:border-primary cursor-pointer"
                        >
                          {Object.entries(ROLE_CONFIG).map(([key, config]) => (
                            <option key={key} value={key}>
                              {config.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span
                          className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-semibold tracking-wide"
                          style={{
                            backgroundColor: roleConfig.bg,
                            color: roleConfig.color,
                          }}
                        >
                          {roleConfig.label}
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5 text-center hidden md:table-cell">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                          member.status === "active"
                            ? "text-[#059669]"
                            : "text-[#94A3B8]"
                        }`}
                      >
                        <span
                          className={`size-1.5 rounded-full ${
                            member.status === "active"
                              ? "bg-[#059669]"
                              : "bg-[#94A3B8]"
                          }`}
                        />
                        {member.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </td>

                    {/* Last active */}
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <span className="text-[13px] text-[#64748B]">
                        {formatLastActive(member.lastActive)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditingRole(member.id)}
                          className="size-8 flex items-center justify-center rounded-lg hover:bg-[#F1F5F9] transition-colors cursor-pointer"
                          title="Edit role"
                        >
                          <span className="material-symbols-outlined text-[16px] text-[#64748B]">
                            edit
                          </span>
                        </button>
                        <button
                          onClick={() => {
                            toggleMemberStatus(member.id);
                            toast.success(
                              `${member.name} ${member.status === "active" ? "deactivated" : "activated"}`
                            );
                          }}
                          className="size-8 flex items-center justify-center rounded-lg hover:bg-[#F1F5F9] transition-colors cursor-pointer"
                          title={
                            member.status === "active" ? "Deactivate" : "Activate"
                          }
                        >
                          <span
                            className={`material-symbols-outlined text-[16px] ${
                              member.status === "active"
                                ? "text-[#DC2626]"
                                : "text-[#059669]"
                            }`}
                          >
                            {member.status === "active"
                              ? "person_off"
                              : "person"}
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

      {/* ── Service Portal Toggles ── */}
      <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 overflow-hidden">
        <div className="px-5 py-3 border-b border-[#E8ECF1]/60">
          <h2 className="text-base font-bold text-[#0F172A]">Service Portal Toggles</h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Disabled portals are hidden from the user dashboard
          </p>
        </div>
        <div className="p-5 sm:p-7 space-y-3">
          {PORTALS.map((portal) => (
            <div key={portal} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div
                  className="size-3 rounded-full"
                  style={{ backgroundColor: PORTAL_COLORS[portal] }}
                />
                <span className="text-sm font-medium text-[#0F172A]">
                  {PORTAL_LABELS[portal]}
                </span>
              </div>
              <button
                onClick={() => togglePortal(portal)}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
                  portalStates[portal] ? "bg-primary" : "bg-[#E2E8F0]"
                }`}
              >
                <div
                  className={`size-5 bg-white rounded-full shadow transition-transform ${
                    portalStates[portal] ? "translate-x-5" : ""
                  }`}
                />
              </button>
            </div>
          ))}
          <div className="flex justify-end pt-2">
            <button
              onClick={() => handleSave("Portal toggles")}
              className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl cursor-pointer hover:brightness-[0.92] active:scale-[0.98] transition-all"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>

      {/* ── Payment Settings ── */}
      <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E8ECF1]/60 overflow-hidden">
        <div className="px-5 py-3 border-b border-[#E8ECF1]/60">
          <h2 className="text-base font-bold text-[#0F172A]">Payment Settings</h2>
        </div>
        <div className="p-5 sm:p-7 space-y-5">
          <div>
            <label className={labelClass}>Paystack Public Key</label>
            <input
              type="password"
              defaultValue="pk_test_xxxxxxxxxxxxxxxxxxxxxxxxx"
              className={`${inputClass} font-mono`}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[13px] font-semibold text-[#0F172A]">Test Mode</span>
              <p className="text-xs text-[#64748B] mt-0.5">
                Enable test mode for development
              </p>
            </div>
            <button
              onClick={() => setTestMode(!testMode)}
              className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
                testMode ? "bg-[#E65100]" : "bg-[#E2E8F0]"
              }`}
            >
              <div
                className={`size-5 bg-white rounded-full shadow transition-transform ${
                  testMode ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>
          <div className="flex justify-end pt-2">
            <button
              onClick={() => handleSave("Payment settings")}
              className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl cursor-pointer hover:brightness-[0.92] active:scale-[0.98] transition-all"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
