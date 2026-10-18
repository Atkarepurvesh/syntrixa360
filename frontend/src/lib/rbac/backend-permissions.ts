// Backend permission codes -> frontend PermissionKey / OrgPermission.
//
// The BACKEND is the final authority (every request is re-checked server-side). This module only
// decides what the UI shows. Rules:
//   1. A frontend key that the backend DEFINES (BACKEND_CODES) is granted iff the backend granted it.
//   2. A frontend-only key is derived from a backend permission where there is an obvious equivalent
//      (DERIVED below).
//   3. INTERIM: frontend keys for modules the backend does not implement yet (orders, tasks, payments,
//      deals, ...) fall back to the legacy per-role matrix in catalog.ts, but only for members who hold
//      `workspace.read` (so a backend-revoked member never sees them). Remove as each module gets a
//      real backend permission set.
import { PERMISSIONS, ROLE_DEFINITIONS, type PermissionKey } from "./catalog";
import type { OrgPermission } from "@/lib/organization-data";

/** Mirror of backend/app/utils/seed.py PERMISSIONS (module.action). Keep in sync with the seed. */
export const BACKEND_CODES: ReadonlySet<string> = new Set([
  "organization.read",
  "organization.update",
  "organization.delete",
  "team.read",
  "team.invite",
  "team.manage",
  "roles.read",
  "roles.manage",
  "channels.read",
  "channels.manage",
  "onboarding.read",
  "onboarding.manage",
  "workspace.read",
  "workspace.manage",
  "billing.read",
  "billing.manage",
  "audit.read",
  "leads.read",
  "leads.create",
  "leads.update",
  "leads.delete",
  "customers.read",
  "customers.create",
  "customers.update",
  "customers.delete",
  "quotations.read",
  "quotations.create",
  "quotations.update",
  "quotations.delete",
  "reports.read",
]);

/** Backend modules: a frontend-only key in these modules additionally requires the module's `.read`. */
const BACKEND_MODULES = new Set([...BACKEND_CODES].map((c) => c.split(".")[0]));

/** Frontend-only key -> backend code that grants it. */
const DERIVED: Partial<Record<PermissionKey, string>> = {
  "dashboard.read": "workspace.read",
  "team_members.read": "team.read",
  "users.read": "team.read",
  "users.invite": "team.invite",
  "users.update": "team.manage",
  "users.suspend": "team.manage",
  "subscription.read": "billing.read",
  "usage.read": "billing.read",
};

const ROLE_TO_RBAC: Record<string, string> = {
  OWNER: "owner",
  MANAGER: "manager",
  EXECUTIVE: "sales-executive",
};

export function resolvePermissions(
  backendRole: string,
  backendPermissions: readonly string[],
): Set<PermissionKey> {
  const granted = new Set(backendPermissions);
  const legacy = new Set<string>(
    ROLE_DEFINITIONS[ROLE_TO_RBAC[backendRole] ?? ""]?.permissions ?? [],
  );
  const result = new Set<PermissionKey>();
  for (const key of PERMISSIONS) {
    if (BACKEND_CODES.has(key)) {
      if (granted.has(key)) result.add(key); // rule 1
      continue;
    }
    const via = DERIVED[key];
    if (via) {
      if (granted.has(via)) result.add(key); // rule 2
      continue;
    }
    const module = key.split(".")[0] ?? "";
    if (!granted.has("workspace.read")) continue; // revoked/limited member: no interim access
    if (BACKEND_MODULES.has(module) && !granted.has(`${module}.read`)) continue;
    if (legacy.has(key)) result.add(key); // rule 3 (interim)
  }
  return result;
}

/** OrgPermission (audit/AI/automation UI) from backend permissions. */
export function resolveOrgPermissions(
  backendPermissions: readonly string[],
): OrgPermission[] {
  const g = new Set(backendPermissions);
  const out: OrgPermission[] = [];
  // Own-activity views: any active member (there is no backend audit endpoint for own activity yet).
  out.push("audit_logs.read", "ai.activity.read", "automation.activity.read");
  if (g.has("audit.read"))
    out.push(
      "audit_logs.read.organization",
      "ai.activity.read.organization",
      "automation.activity.read.organization",
    );
  if (g.has("organization.update")) out.push("organization.settings");
  if (g.has("workspace.manage"))
    out.push("automation.configure", "ai.configure");
  // No backend code yet: export/approve/retry are limited to the owner (organization.delete is owner-only).
  if (g.has("organization.delete"))
    out.push("audit_logs.export", "ai.activity.approve", "automation.retry");
  return out;
}
