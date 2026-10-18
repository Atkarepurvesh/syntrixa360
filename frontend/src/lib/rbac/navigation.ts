// Centralized navigation + route-permission config. The sidebar, route guard,
// search scopes and breadcrumbs all read from here, so access rules live once.
import type { PermissionKey, EntitlementKey } from "./catalog";

export type NavRule = {
  /** Required (all). Omit for items every member may see. */
  permission?: PermissionKey;
  /** Any one of these is enough. */
  requiredAny?: readonly PermissionKey[];
  entitlement?: EntitlementKey;
};

export type RouteRule = NavRule & { prefix: string };

export const NAV_RULES: Record<string, NavRule> = {
  "/app": { permission: "dashboard.read" },
  "/app/workspace": { permission: "workspace.read" },
  "/app/leads": { permission: "leads.read" },
  // Lead Central (dashboard + future sub-pages) reads the same lead data as Leads, so it needs the same permission.
  "/app/lead-central": { permission: "leads.read" },
  "/app/customers": { permission: "customers.read" },
  "/app/requirements": { permission: "requirements.read" },
  "/app/products": { permission: "products.read" },
  "/app/pipeline": { permission: "deals.read" },
  "/app/follow-ups": { permission: "followups.read" },
  "/app/tasks": { permission: "tasks.read" },
  "/app/calendar": { permission: "calendar.read" },
  "/app/quotations": { permission: "quotations.read" },
  "/app/orders": { permission: "orders.read" },
  "/app/payment-followups": { permission: "payments.read" },
  "/app/repeat-orders": { permission: "repeat_orders.read" },
  "/app/my-performance": { permission: "performance.read" },
  "/app/inbox": { permission: "inbox.read" },
  "/app/activity": { permission: "activities.read" },
  "/app/reports": { requiredAny: ["reports.read", "analytics.read"] },
  "/app/ai-assistant": { permission: "ai.read", entitlement: "ai_assistant" },
  "/app/team": { permission: "users.read" },
  "/app/team-management": { permission: "users.invite", entitlement: "team_management" },
  // Team Members / Organization / User detail (Admin branch). Actions inside are gated by admin-permissions.ts.
  "/app/team-members": { permission: "team_members.read" },
  "/app/users": { permission: "team_members.read" },
  "/app/organization": { permission: "organization.read" },
  // Subscription & Usage (Billing branch). Page-level view/manage checks stay in lib/permissions.ts.
  "/app/subscription": { permission: "subscription.read" },
  "/app/usage": { permission: "usage.read" },
  // Security Center: "My security" is personal; org/team tabs are gated by the backend capabilities.
  "/app/security": {},
  // Audit Logs + AI & Automation: gated per active organization (useOrganization().can) in the
  // sidebar, the route (ROUTE_REQUIRES / page), and the server. Route is open at this layer.
  "/app/audit-logs": {},
  "/app/ai-activity": {},
  // Profile, settings and notifications are personal: every authenticated member.
  "/app/profile": {},
  "/app/settings": {},
  "/app/notifications": {},
};

/** Longest-prefix match so detail routes (/app/customers/123) inherit their parent rule. */
export function ruleForPath(pathname: string): NavRule | undefined {
  const clean = pathname.replace(/\/+$/, "") || "/";
  if (clean === "/app") return NAV_RULES["/app"];
  const match = Object.keys(NAV_RULES)
    .filter((p) => p !== "/app" && (clean === p || clean.startsWith(p + "/")))
    .sort((a, b) => b.length - a.length)[0];
  return match ? NAV_RULES[match] : undefined;
}
