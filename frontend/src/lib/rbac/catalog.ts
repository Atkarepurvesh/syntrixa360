// Single authoritative permission catalog for navigation, route guards and UI actions.
// NOTE: There is no backend in this project yet. These keys follow the
// `resource.action` convention from the RBAC spec. When the backend permission
// matrix exists, replace ROLE_DEFINITIONS/MEMBERSHIPS with API data (same shapes)
// and keep every consumer unchanged. Never add a second permission list elsewhere.

export const PERMISSIONS = [
  "dashboard.read",
  "workspace.read",
  "leads.read", "leads.create", "leads.update", "leads.delete", "leads.assign", "leads.export", "leads.import",
  "customers.read", "customers.create", "customers.update", "customers.delete", "customers.export", "customers.import",
  "requirements.read", "requirements.create",
  "products.read", "products.update",
  "deals.read", "deals.update",
  "followups.read", "followups.create",
  "tasks.read", "tasks.create", "tasks.update",
  "calendar.read",
  "quotations.read", "quotations.create", "quotations.send", "quotations.approve",
  "orders.read", "orders.update", "orders.cancel", "orders.export",
  "payments.read", "payments.create", "payments.refund",
  "repeat_orders.read",
  "performance.read",
  "inbox.read",
  "activities.read",
  "reports.read", "analytics.read", "reports.export",
  "ai.read", "ai.execute",
  "users.read", "users.invite", "users.update", "users.suspend",
  "roles.read", "roles.manage",
  "organization.read", "organization.update",
  "billing.read", "billing.manage",
  // Added when merging the Team Members / Subscription / Usage branches:
  "team_members.read",
  "subscription.read", "usage.read",
] as const;

export type PermissionKey = (typeof PERMISSIONS)[number];
export type EntitlementKey = "ai_assistant" | "advanced_ai" | "team_management";

export type RoleDefinition = {
  id: string;
  label: string;
  permissions: readonly PermissionKey[];
};

const ALL = PERMISSIONS;

const SALES_EXEC: PermissionKey[] = [
  "dashboard.read", "workspace.read",
  "leads.read", "leads.create", "leads.update",
  "customers.read", "customers.create", "customers.update",
  "requirements.read", "requirements.create", "products.read",
  "deals.read", "deals.update", "followups.read", "followups.create",
  "tasks.read", "tasks.create", "tasks.update", "calendar.read",
  "quotations.read", "quotations.create", "orders.read", "payments.read",
  "repeat_orders.read", "performance.read", "inbox.read", "activities.read",
  "ai.read",
  // Team Members + Organization pages are view-only for everyone except Viewer
  // (matches the Admin branch: owner/manager/sales-exec can view; actions are gated in admin-permissions.ts).
  "team_members.read", "organization.read",
];

export const ROLE_DEFINITIONS: Record<string, RoleDefinition> = {
  owner: { id: "owner", label: "Owner", permissions: ALL },
  manager: {
    id: "manager",
    label: "Sales Manager",
    permissions: [
      ...SALES_EXEC,
      "leads.assign", "leads.export", "leads.delete", "customers.export",
      "quotations.send", "quotations.approve", "orders.update", "orders.export",
      "reports.read", "analytics.read", "reports.export", "ai.execute",
      "users.read", "users.invite", "payments.create",
      // Subscription + Usage: managers can view plan/usage (owner manages via billing.manage).
      "subscription.read", "usage.read",
    ],
  },
  "sales-executive": { id: "sales-executive", label: "Sales Executive", permissions: SALES_EXEC },
  viewer: {
    id: "viewer",
    label: "Viewer",
    permissions: ["dashboard.read", "leads.read", "customers.read", "deals.read", "tasks.read", "calendar.read"],
  },
};

export type Organization = {
  id: string;
  name: string;
  /** Entitlements come from the plan, NOT from RBAC. */
  entitlements: readonly EntitlementKey[];
};

/**
 * Plan entitlements per organization id. Organization identity itself (list, active org,
 * switching) comes from OrganizationProvider / organization-data.ts — this map only adds the
 * plan layer. Unknown organizations get the conservative default.
 * Replace with the subscription API (see subscription-data.ts) when the backend exists.
 */
export const ORG_ENTITLEMENTS: Record<string, readonly EntitlementKey[]> = {
  "org-velmora": ["ai_assistant", "advanced_ai", "team_management"],
  "org-eustoma": ["ai_assistant", "team_management"],
  "org-abc": ["team_management"],
  "org-kiran": [],
};
export const DEFAULT_ENTITLEMENTS: readonly EntitlementKey[] = ["team_management"];

/** Organization-level role keys (organization-data.ts) → RBAC role ids. */
const ORG_ROLE_TO_RBAC: Record<string, string> = {
  sales_manager: "manager",
  sales_executive: "sales-executive",
  viewer: "viewer",
};

/**
 * Which RBAC role applies in the active organization.
 *  - Owner/Admin membership  → the dev "Viewing as" role switcher decides (so reviewers can
 *    still preview Owner / Manager / Sales Executive in their own organization).
 *  - Any other membership    → the membership role from the organization API wins.
 */
export function roleIdForMembership(user: { role: string }, orgRoleKey: string): string {
  return ORG_ROLE_TO_RBAC[orgRoleKey] ?? user.role;
}
