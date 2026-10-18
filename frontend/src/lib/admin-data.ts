// Mock data for Organization, Team Members and User Detail (frontend-only demo).
// Shapes mirror the backend entities but IDs are slugs, never shown in the UI.

export type MemberStatus = "Active" | "Inactive" | "Invited" | "Suspended";
export type OrgStatus = "Active" | "Inactive" | "Suspended";
export type Source = "User" | "System" | "AI" | "Automation" | "Integration";

export type Member = {
  id: string; name: string; email: string; phone: string; employeeCode: string;
  department: string; designation: string; role: string; managerId: string | null;
  status: MemberStatus; joined: string; lastActive: string; verified: boolean; twoFA: boolean;
};

export const ORG_ROLES = ["Owner", "Admin", "Sales Manager", "Finance Manager", "Sales Executive", "Viewer"] as const;
export const ROLE_PERM_COUNT: Record<string, number> = {
  Owner: 32, Admin: 28, "Sales Manager": 22, "Finance Manager": 16, "Sales Executive": 12, Viewer: 6,
};
export const DEPARTMENTS = ["Management", "Sales", "Finance", "Operations"];

export const MEMBERS: Member[] = [
  { id: "purvesh", name: "Purvesh Desai", email: "purvesh@velmora.example", phone: "+91 98200 00001", employeeCode: "EMP-001", department: "Management", designation: "Founder", role: "Owner", managerId: null, status: "Active", joined: "2025-01-10", lastActive: "5 min ago", verified: true, twoFA: true },
  { id: "amit", name: "Amit Sharma", email: "amit@velmora.example", phone: "+91 98200 00002", employeeCode: "EMP-002", department: "Sales", designation: "Sales Manager", role: "Sales Manager", managerId: "purvesh", status: "Active", joined: "2026-08-05", lastActive: "1 hour ago", verified: true, twoFA: true },
  { id: "rahul", name: "Rahul Sharma", email: "rahul@velmora.example", phone: "+91 98200 00003", employeeCode: "EMP-014", department: "Sales", designation: "Sales Executive", role: "Sales Executive", managerId: "amit", status: "Active", joined: "2026-09-12", lastActive: "10 min ago", verified: true, twoFA: false },
  { id: "neha", name: "Neha Sharma", email: "neha@velmora.example", phone: "+91 98200 00004", employeeCode: "EMP-015", department: "Sales", designation: "Sales Executive", role: "Sales Executive", managerId: "amit", status: "Active", joined: "2026-07-21", lastActive: "Yesterday", verified: true, twoFA: false },
  { id: "sneha", name: "Sneha Patel", email: "sneha@velmora.example", phone: "+91 98200 00005", employeeCode: "EMP-006", department: "Finance", designation: "Finance Manager", role: "Finance Manager", managerId: "purvesh", status: "Active", joined: "2025-11-02", lastActive: "3 hours ago", verified: true, twoFA: true },
  { id: "karan", name: "Karan Mehta", email: "karan@velmora.example", phone: "+91 98200 00006", employeeCode: "EMP-019", department: "Operations", designation: "Operations Analyst", role: "Viewer", managerId: "sneha", status: "Inactive", joined: "2026-03-18", lastActive: "3 weeks ago", verified: true, twoFA: false },
  { id: "isha", name: "Isha Kapoor", email: "isha@velmora.example", phone: "+91 98200 00007", employeeCode: "EMP-021", department: "Sales", designation: "Sales Executive", role: "Sales Executive", managerId: "amit", status: "Suspended", joined: "2026-05-30", lastActive: "2 days ago", verified: false, twoFA: false },
];

export type Invitation = {
  id: string; email: string; role: string; department: string; invitedBy: string;
  invitedAt: string; expires: string; status: "Pending" | "Accepted" | "Expired" | "Cancelled";
};
export const INVITATIONS: Invitation[] = [
  { id: "i1", email: "vikram@example.com", role: "Sales Executive", department: "Sales", invitedBy: "Purvesh Desai", invitedAt: "2026-09-28", expires: "2026-10-05", status: "Pending" },
  { id: "i2", email: "anita@example.com", role: "Finance Manager", department: "Finance", invitedBy: "Purvesh Desai", invitedAt: "2026-09-26", expires: "2026-10-03", status: "Pending" },
  { id: "i3", email: "dev@example.com", role: "Viewer", department: "Operations", invitedBy: "Amit Sharma", invitedAt: "2026-09-20", expires: "2026-09-27", status: "Expired" },
];

export const PERMISSION_MODULES: Record<string, string[]> = {
  CRM: ["View Leads", "Create Leads", "Edit Leads", "Delete Leads", "View Customers", "Create Customers", "Edit Customers"],
  Sales: ["View Quotations", "Create Quotations", "Approve Quotations", "View Orders", "Manage Orders"],
  Finance: ["View Invoices", "Manage Payments"],
  Communication: ["View Inbox", "Send Messages"],
  AI: ["Use AI Copilot", "View AI Insights", "Manage AI Automations"],
  Analytics: ["View Reports", "Export Reports"],
  Administration: ["Manage Team", "Manage Roles", "Manage Organization"],
};

const ALLOW: Record<string, string[] | "all"> = {
  Owner: "all",
  Admin: "all",
  "Sales Manager": ["View Leads", "Create Leads", "Edit Leads", "View Customers", "Create Customers", "Edit Customers", "View Quotations", "Create Quotations", "Approve Quotations", "View Orders", "Manage Orders", "View Inbox", "Send Messages", "Use AI Copilot", "View AI Insights", "View Reports", "Export Reports", "Manage Team"],
  "Finance Manager": ["View Customers", "View Quotations", "View Orders", "View Invoices", "Manage Payments", "View Reports", "Export Reports"],
  "Sales Executive": ["View Leads", "Create Leads", "Edit Leads", "View Customers", "Create Customers", "Edit Customers", "View Quotations", "Create Quotations", "View Orders", "View Inbox", "Send Messages", "Use AI Copilot"],
  Viewer: ["View Leads", "View Customers", "View Quotations", "View Orders", "View Reports"],
};
export type PermSource = "Role" | "Inherited" | "Direct";
export function permissionsFor(role: string) {
  const allow = ALLOW[role] ?? [];
  return Object.entries(PERMISSION_MODULES).map(([module, items]) => ({
    module,
    items: items.map((name) => {
      const granted = allow === "all" || allow.includes(name);
      // Demo: Manager inherits view rights from the reporting hierarchy.
      const source: PermSource = granted && name.startsWith("View") && role !== "Viewer" ? "Inherited" : "Role";
      return { name, granted, source };
    }),
  }));
}

export type ActivityItem = { id: string; title: string; description: string; when: string; module: string; source: Source };
export function activityFor(m: Member): ActivityItem[] {
  return [
    { id: "a1", title: "Logged in", description: "Signed in from Chrome on Windows.", when: "Today, 10:42 AM", module: "Security", source: "User" },
    { id: "a2", title: "Quotation Created", description: "Created quotation QT-1024 for ABC Pharma.", when: "Today, 10:15 AM", module: "Sales", source: "User" },
    { id: "a3", title: "AI Action", description: "AI generated a follow-up recommendation.", when: "Today, 9:30 AM", module: "AI", source: "AI" },
    { id: "a4", title: "Follow-up Created", description: "Automatic follow-up reminder created.", when: "Yesterday, 4:20 PM", module: "CRM", source: "Automation" },
    { id: "a5", title: "Customer Updated", description: "Updated contact details for Shreeji Traders.", when: "Yesterday, 11:05 AM", module: "CRM", source: "User" },
    { id: "a6", title: "Role Changed", description: `Role set to ${m.role} by Purvesh Desai.`, when: "12 Sep 2026", module: "Administration", source: "System" },
    { id: "a7", title: "Joined Organization", description: "Accepted invitation and joined Velmora Pharma.", when: new Date(m.joined).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }), module: "Administration", source: "System" },
  ];
}

export type SessionItem = { id: string; browser: string; os: string; location: string; lastActive: string; loginAt: string; current: boolean };
export const SESSIONS: SessionItem[] = [
  { id: "s1", browser: "Chrome", os: "Windows", location: "Mumbai, India", lastActive: "Just now", loginAt: "Today, 9:02 AM", current: true },
  { id: "s2", browser: "Safari", os: "iPhone (iOS)", location: "Mumbai, India", lastActive: "2 hours ago", loginAt: "Yesterday, 6:40 PM", current: false },
  { id: "s3", browser: "Edge", os: "Windows", location: "Pune, India", lastActive: "3 days ago", loginAt: "28 Sep 2026", current: false },
];

export const SECURITY_EVENTS = [
  { id: "e1", label: "Login", when: "Today, 9:02 AM" },
  { id: "e2", label: "Password Changed", when: "14 Aug 2026" },
  { id: "e3", label: "Failed Login", when: "02 Aug 2026" },
  { id: "e4", label: "Session Revoked", when: "29 Jul 2026" },
];

export const IDENTITY_PROVIDERS = [
  { id: "google", name: "Google", email: "rahul@velmora.example", connectedAt: "12 Sep 2026", connected: true },
  { id: "microsoft", name: "Microsoft", email: "", connectedAt: "", connected: false },
];

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
export const initialsOf = (n: string) => n.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
export const memberById = (id: string | null) => MEMBERS.find((m) => m.id === id);
/** True if `candidate` already sits above/below `memberId` — would create a loop. */
export function wouldCreateCycle(members: Member[], memberId: string, newManagerId: string) {
  if (memberId === newManagerId) return true;
  let cur = members.find((m) => m.id === newManagerId);
  while (cur?.managerId) {
    if (cur.managerId === memberId) return true;
    cur = members.find((m) => m.id === cur!.managerId);
  }
  return false;
}
