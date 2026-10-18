// Team Invitation → Employee Signup → Owner Approval
// Data model + seed data for the frontend simulation of Part 4.
//
// NOTE: This is a frontend-only demo. Everything here (tokens, OTPs, IDs)
// is generated client-side purely for the purpose of showing the full
// product flow. A real implementation must move invitation-token
// generation, OTP delivery, password hashing and approval transactions
// to a secure backend — see the endpoint list at the bottom of this file.

export type Role = "Sales Executive" | "Sales Manager" | "Team Manager" | "Admin" | "Viewer";

export const ROLES: Role[] = [
  "Sales Executive",
  "Sales Manager",
  "Team Manager",
  "Admin",
  "Viewer",
];

export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  "Sales Executive": [
    "View assigned leads",
    "Manage assigned customers",
    "Manage assigned deals",
    "Create activities",
    "View assigned inbox conversations",
    "Create quotations where permitted",
  ],
  "Sales Manager": [
    "View team performance",
    "Manage team leads",
    "Assign leads",
    "View team activities",
    "Manage team pipeline",
    "Approve certain sales actions",
  ],
  "Team Manager": [
    "Manage assigned team members",
    "View team performance",
    "Reassign leads within team",
    "Approve team activities",
  ],
  Admin: [
    "Manage team",
    "Manage organization configuration",
    "Manage integrations",
    "Manage permissions",
    "Manage operational settings",
  ],
  Viewer: ["View permitted records", "No destructive actions", "No channel management"],
};

export type ProductCategory =
  | "Herbal Products"
  | "Ayurvedic Products"
  | "Agricultural Products"
  | "Industrial Products"
  | "FMCG"
  | "Other";

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  "Herbal Products",
  "Ayurvedic Products",
  "Agricultural Products",
  "Industrial Products",
  "FMCG",
  "Other",
];

export type Channel = "WhatsApp" | "Business Email" | "Website Leads" | "Outlook";

// Only channels the organization has actually connected should ever be
// offered for assignment (spec §9). Outlook is intentionally omitted here
// to demonstrate that rule — it simply isn't connected for this org yet.
export const CONNECTED_CHANNELS: Channel[] = ["WhatsApp", "Business Email", "Website Leads"];

export type InvitationStatus =
  | "draft"
  | "sent"
  | "delivered"
  | "opened"
  | "accepted"
  | "pending_approval"
  | "approved"
  | "rejected"
  | "expired"
  | "cancelled";

export type MemberStatus = "pending_approval" | "active" | "rejected" | "suspended";

export interface TeamInvitation {
  id: string;
  token: string;
  email: string;
  employeeName?: string | undefined;
  proposedRole: Role;
  products: ProductCategory[];
  channels: Channel[];
  personalMessage?: string | undefined;
  status: InvitationStatus;
  invitedBy: string;
  sentAt: string;
  expiresAt: string;
  acceptedAt?: string | undefined;
}

export interface TeamMember {
  id: string;
  invitationId?: string | undefined;
  employeeId?: string | undefined; // e.g. SYN-EMP-001, assigned on approval
  fullName: string;
  email: string;
  mobile?: string | undefined;
  role: Role;
  products: ProductCategory[];
  channels: Channel[];
  reportingManagerId?: string | undefined;
  status: MemberStatus;
  emailVerified: boolean;
  mobileVerified: boolean;
  signupAt?: string | undefined;
  joinedAt?: string | undefined;
  rejectionReason?: string | undefined;
}

export interface AuditEvent {
  id: string;
  type: string;
  detail: string;
  actor: string;
  timestamp: string;
}

// Demo organization name — a real build would read this from the
// organization profile created during Part 3 of onboarding.
export const ORGANIZATION_NAME = "Shreeji Trading Pvt. Ltd.";

export const PLAN_MEMBER_LIMIT = 10;

export const INVITATION_EXPIRY_HOURS = 72;

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export { initials };

export const seedInvitations: TeamInvitation[] = [
  {
    id: "inv-1001",
    token: "a1b2c3d4e5f6g7h8i9j0",
    email: "neha.patel@shreejitraders.com",
    employeeName: "Neha Patel",
    proposedRole: "Sales Executive",
    products: ["Herbal Products", "FMCG"],
    channels: ["WhatsApp", "Website Leads"],
    personalMessage:
      "Welcome to our Syntrixa 360 sales workspace — looking forward to having you on the team!",
    status: "sent",
    invitedBy: "Amit Sharma",
    sentAt: "2026-08-31T10:15:00.000Z",
    expiresAt: "2026-09-03T10:15:00.000Z",
  },
  {
    id: "inv-1002",
    token: "k1l2m3n4o5p6q7r8s9t0",
    email: "amit.kulkarni@example.com",
    employeeName: "Amit Kulkarni",
    proposedRole: "Sales Manager",
    products: ["Agricultural Products", "Industrial Products"],
    channels: ["Business Email"],
    status: "expired",
    invitedBy: "Amit Sharma",
    sentAt: "2026-08-20T09:00:00.000Z",
    expiresAt: "2026-08-23T09:00:00.000Z",
  },
];

export const seedMembers: TeamMember[] = [
  {
    id: "mem-rahul-sharma",
    invitationId: "inv-1000",
    fullName: "Rahul Sharma",
    email: "rahul.sharma@example.com",
    mobile: "+91 98200 11223",
    role: "Sales Executive",
    products: ["Herbal Products", "Ayurvedic Products"],
    channels: ["WhatsApp"],
    status: "pending_approval",
    emailVerified: true,
    mobileVerified: true,
    signupAt: "2026-09-01T08:40:00.000Z",
  },
  {
    id: "mem-rahul-verma",
    employeeId: "SYN-EMP-001",
    fullName: "Rahul Verma",
    email: "rahul.verma@syntrixa-demo.com",
    mobile: "+91 98200 44551",
    role: "Sales Manager",
    products: ["Herbal Products", "Ayurvedic Products", "Agricultural Products"],
    channels: ["WhatsApp", "Business Email", "Website Leads"],
    status: "active",
    emailVerified: true,
    mobileVerified: true,
    signupAt: "2026-02-11T09:00:00.000Z",
    joinedAt: "2026-02-12T11:20:00.000Z",
  },
  {
    id: "mem-neha-singh",
    employeeId: "SYN-EMP-002",
    fullName: "Neha Singh",
    email: "neha.singh@syntrixa-demo.com",
    mobile: "+91 98200 44552",
    role: "Sales Executive",
    products: ["FMCG"],
    channels: ["WhatsApp", "Website Leads"],
    reportingManagerId: "mem-rahul-verma",
    status: "active",
    emailVerified: true,
    mobileVerified: true,
    signupAt: "2026-03-02T09:00:00.000Z",
    joinedAt: "2026-03-03T10:00:00.000Z",
  },
  {
    id: "mem-arjun-mehta",
    employeeId: "SYN-EMP-003",
    fullName: "Arjun Mehta",
    email: "arjun.mehta@syntrixa-demo.com",
    mobile: "+91 98200 44553",
    role: "Sales Executive",
    products: ["Industrial Products"],
    channels: ["Business Email"],
    reportingManagerId: "mem-rahul-verma",
    status: "suspended",
    emailVerified: true,
    mobileVerified: true,
    signupAt: "2026-04-18T09:00:00.000Z",
    joinedAt: "2026-04-19T09:30:00.000Z",
  },
];

export const seedAuditLog: AuditEvent[] = [
  {
    id: "aud-1",
    type: "TEAM_INVITATION_SENT",
    detail: "Invitation sent to neha.patel@shreejitraders.com as Sales Executive",
    actor: "Vikram Anand",
    timestamp: "2026-08-31T10:15:00.000Z",
  },
  {
    id: "aud-2",
    type: "EMPLOYEE_SIGNUP_COMPLETED",
    detail: "Rahul Sharma completed signup and is awaiting approval",
    actor: "Rahul Sharma",
    timestamp: "2026-09-01T08:40:00.000Z",
  },
];

/*
Recommended backend endpoints (spec §84) once this is wired to a real API:

  POST   /team/invitations
  GET    /team/invitations
  POST   /team/invitations/{id}/resend
  DELETE /team/invitations/{id}
  GET    /team/invitations/{token}
  POST   /team/invitations/{token}/accept
  POST   /team/members/signup
  POST   /team/members/verify
  GET    /team/approvals
  GET    /team/approvals/{id}
  POST   /team/approvals/{id}/approve
  POST   /team/approvals/{id}/reject
  GET    /team/members
  GET    /team/members/{id}
  PUT    /team/members/{id}
  POST   /team/members/{id}/suspend
  POST   /team/members/{id}/reactivate
  PUT    /team/members/{id}/products
  PUT    /team/members/{id}/channels
  PUT    /team/members/{id}/role
  PUT    /team/members/{id}/manager
*/
