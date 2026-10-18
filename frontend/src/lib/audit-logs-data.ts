// Audit Logs — DTOs, labels and the data adapter.
//
// "WHO did WHAT, WHEN, WHERE, to WHICH RESOURCE?"
//
// The adapter functions at the bottom (`fetchAuditLogs`, `fetchAuditLog`,
// `fetchAuditSummary`, `fetchAuditFacets`) are the ONLY place that knows where
// data comes from. Today they resolve DEV fixtures so the UI can be exercised
// without a backend; they behave like the real endpoints:
//   GET /api/v1/audit-logs            (server-side filter / sort / paginate)
//   GET /api/v1/audit-logs/{id}
//   GET /api/v1/audit-logs/summary
// Swap their bodies for `fetch` calls — types and UI stay unchanged. The
// backend must derive organization_id from the session and never trust the
// `orgId` passed here (it is only used by the fixture to separate tenants).

import {
  delay,
  dayBounds,
  ForbiddenError,
  isoMinutesAgo,
  makeRng,
  ORG_NAMES,
  ORG_POOLS,
  paginate,
  type Paginated,
} from "@/lib/activity-fixtures";
import { slugify } from "@/lib/customers-data";

// ---- Types ---------------------------------------------------------------
export type ActorType =
  "user" | "ai" | "automation" | "integration" | "system" | "api";
export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "VIEW"
  | "LOGIN"
  | "LOGOUT"
  | "ASSIGN"
  | "UNASSIGN"
  | "IMPORT"
  | "EXPORT"
  | "APPROVE"
  | "REJECT"
  | "SEND"
  | "GENERATE"
  | "SYNC"
  | "ARCHIVE"
  | "RESTORE"
  | "STATUS_CHANGE"
  | "ROLE_CHANGE"
  | "PERMISSION_CHANGE"
  | "SETTINGS_CHANGE";
export type AuditResourceType =
  | "organization"
  | "user"
  | "member"
  | "lead"
  | "customer"
  | "contact"
  | "company"
  | "deal"
  | "product"
  | "quotation"
  | "order"
  | "invoice"
  | "payment"
  | "task"
  | "followup"
  | "conversation"
  | "message"
  | "campaign"
  | "automation"
  | "report"
  | "integration"
  | "subscription"
  | "settings"
  | "data_import";
export type AuditStatus = "success" | "failed" | "pending" | "cancelled";

export interface AuditLogDTO {
  id: string;
  createdAt: string; // ISO
  actor: {
    type: ActorType;
    name: string;
    userId?: string;
    email?: string;
    role?: string;
    avatarUrl?: string | null;
  };
  action: AuditAction;
  resource: {
    type: AuditResourceType;
    id: string | null;
    name: string;
    exists: boolean;
  };
  source: ActorType;
  status: AuditStatus;
  description: string;
  /** Only the relevant changed fields — never whole rows. */
  changes?: { field: string; before: string; after: string }[];
  organization: { name: string };
  /** Extra context when the backend provides it. */
  automation?: { name: string; trigger?: string; action?: string };
  integration?: { name: string };
  /** Distinguishes "AI suggested" from "AI executed" when backend supports it. */
  aiMode?: "suggested" | "executed";
  /** Stripped by the backend unless the viewer is authorized. */
  technical?: {
    eventId: string;
    requestId?: string;
    ipAddress?: string;
    userAgent?: string;
  };
}

export type AuditQuery = {
  scope: "mine" | "organization";
  page: number;
  pageSize: number;
  search?: string;
  actorType?: ActorType;
  actorId?: string;
  action?: AuditAction;
  resourceType?: AuditResourceType;
  status?: AuditStatus;
  startDate?: string;
  endDate?: string;
  sort: "newest" | "oldest" | "actor" | "action" | "resource";
};

export type AuditSummary = {
  totalActivities: number;
  todayActivities: number;
  userActions: number;
  systemAutomation: number;
};

export type AuditFacets = {
  actions: AuditAction[];
  resourceTypes: AuditResourceType[];
  actorTypes: ActorType[];
  statuses: AuditStatus[];
  actors: { id: string; name: string }[];
};

/** Capabilities the backend actually supports. UI hides what is false. */
export const AUDIT_CAPABILITIES = {
  export: false,
  realtime: false,
  retentionNotice: false,
} as const;

// ---- Labels --------------------------------------------------------------
export const ACTION_LABEL: Record<AuditAction, string> = {
  CREATE: "Created",
  UPDATE: "Updated",
  DELETE: "Deleted",
  VIEW: "Viewed",
  LOGIN: "Logged in",
  LOGOUT: "Logged out",
  ASSIGN: "Assigned",
  UNASSIGN: "Unassigned",
  IMPORT: "Imported",
  EXPORT: "Exported",
  APPROVE: "Approved",
  REJECT: "Rejected",
  SEND: "Sent",
  GENERATE: "Generated",
  SYNC: "Synced",
  ARCHIVE: "Archived",
  RESTORE: "Restored",
  STATUS_CHANGE: "Changed status",
  ROLE_CHANGE: "Changed role",
  PERMISSION_CHANGE: "Changed permissions",
  SETTINGS_CHANGE: "Changed settings",
};
export const RESOURCE_LABEL: Record<AuditResourceType, string> = {
  organization: "Organization",
  user: "User",
  member: "Organization Member",
  lead: "Lead",
  customer: "Customer",
  contact: "Contact",
  company: "Company",
  deal: "Deal",
  product: "Product",
  quotation: "Quotation",
  order: "Order",
  invoice: "Invoice",
  payment: "Payment",
  task: "Task",
  followup: "Follow-up",
  conversation: "Conversation",
  message: "Message",
  campaign: "Campaign",
  automation: "Automation",
  report: "Report",
  integration: "Integration",
  subscription: "Subscription",
  settings: "Settings",
  data_import: "Data Import",
};
export const ACTOR_TYPE_LABEL: Record<ActorType, string> = {
  user: "User",
  ai: "AI",
  automation: "Automation",
  integration: "Integration",
  system: "System",
  api: "API",
};
export const STATUS_LABEL: Record<AuditStatus, string> = {
  success: "Success",
  failed: "Failed",
  pending: "Pending",
  cancelled: "Cancelled",
};

// ---- DEV fixture generation (tenant separated) ---------------------------
const cache = new Map<string, AuditLogDTO[]>();

function buildFixture(orgId: string): AuditLogDTO[] {
  const pool = ORG_POOLS[orgId];
  if (!pool) return [];
  const orgName = ORG_NAMES[orgId] ?? "Organization";
  const rng = makeRng(`audit-${orgId}`);
  const out: AuditLogDTO[] = [];
  const N = 320;

  for (let i = 0; i < N; i++) {
    const minutes = Math.round(i * 18 + i * i * 0.25 + rng.int(0, 14));
    const u = rng.pick(pool.users);
    const customer = rng.pick(pool.customers);
    const lead = rng.pick(pool.leads);
    const kind = (i * 7 + rng.int(0, 5)) % 22;

    const base = {
      id: `${orgId}-aud-${i}`,
      createdAt: isoMinutesAgo(minutes),
      organization: { name: orgName },
      status: "success" as AuditStatus,
      technical: {
        eventId: `evt_${rng.hex(10)}`,
        requestId: `req_${rng.hex(12)}`,
        ipAddress: `103.${rng.int(20, 250)}.${rng.int(1, 250)}.${rng.int(1, 250)}`,
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126",
      },
    };
    const actor = (x = u): AuditLogDTO["actor"] => ({
      type: "user",
      name: x.name,
      userId: x.id,
      email: x.email,
      role: x.role,
    });
    const noTech = {
      technical: {
        eventId: base.technical.eventId,
        requestId: base.technical.requestId,
      },
    };
    let ev: Omit<
      AuditLogDTO,
      "id" | "createdAt" | "organization" | "status" | "technical"
    > & {
      status?: AuditStatus;
      technical?: AuditLogDTO["technical"];
    };

    switch (kind) {
      case 0:
      case 1:
        ev = {
          actor: actor(),
          action: "CREATE",
          source: "user",
          resource: {
            type: "lead",
            id: slugify(lead),
            name: lead,
            exists: true,
          },
          description: `${u.name} created a new lead.`,
        };
        break;
      case 2:
      case 3:
        ev = {
          actor: actor(),
          action: "UPDATE",
          source: "user",
          resource: {
            type: "customer",
            id: slugify(customer),
            name: customer,
            exists: true,
          },
          description: "Customer credit terms were updated.",
          changes: [
            { field: "Credit Limit", before: "₹5,00,000", after: "₹7,50,000" },
            { field: "Payment Terms", before: "30 Days", after: "45 Days" },
          ],
        };
        break;
      case 4:
        ev = {
          actor: actor(),
          action: "STATUS_CHANGE",
          source: "user",
          resource: {
            type: "lead",
            id: slugify(lead),
            name: lead,
            exists: true,
          },
          description: "Lead status was changed.",
          changes: [
            { field: "Status", before: "New", after: "Qualified" },
            {
              field: "Assigned To",
              before: u.name,
              after: rng.pick(pool.users).name,
            },
          ],
        };
        break;
      case 5:
        ev = {
          actor: actor(),
          action: "CREATE",
          source: "user",
          resource: {
            type: "quotation",
            id: `Q-${2000 + i}`,
            name: `Quotation for ${customer}`,
            exists: true,
          },
          description: "A quotation was created.",
        };
        break;
      case 6:
        ev = {
          actor: actor(),
          action: "ASSIGN",
          source: "user",
          resource: {
            type: "lead",
            id: slugify(lead),
            name: lead,
            exists: true,
          },
          description: "Lead was assigned to a team member.",
          changes: [
            {
              field: "Assigned To",
              before: "Unassigned",
              after: rng.pick(pool.users).name,
            },
          ],
        };
        break;
      case 7:
        ev = {
          actor: actor(),
          action: "DELETE",
          source: "user",
          resource: {
            type: "customer",
            id: null,
            name: `${customer} (duplicate)`,
            exists: false,
          },
          description: "A duplicate customer record was deleted.",
        };
        break;
      case 8:
        ev = {
          actor: actor(),
          action: "APPROVE",
          source: "user",
          resource: {
            type: "quotation",
            id: `Q-${2000 + i}`,
            name: `Quotation for ${customer}`,
            exists: true,
          },
          description: "Quotation discount was approved.",
        };
        break;
      case 9: {
        const target = rng.pick(pool.users);
        ev = {
          actor: actor(),
          action: "ROLE_CHANGE",
          source: "user",
          resource: {
            type: "member",
            id: target.id,
            name: target.name,
            exists: true,
          },
          description: `Role of ${target.name} was changed.`,
          changes: [
            {
              field: "Role",
              before: "Sales Executive",
              after: "Sales Manager",
            },
          ],
        };
        break;
      }
      case 10:
        ev = {
          actor: actor(),
          action: "SETTINGS_CHANGE",
          source: "user",
          resource: {
            type: "settings",
            id: null,
            name: "Business Hours",
            exists: true,
          },
          description: "Organization business hours were updated.",
          changes: [
            { field: "Closing Time", before: "6:00 PM", after: "7:00 PM" },
          ],
        };
        break;
      case 11:
        ev = {
          actor: actor(),
          action: "IMPORT",
          source: "user",
          resource: {
            type: "data_import",
            id: null,
            name: "Customer list (CSV)",
            exists: true,
          },
          status: i % 3 === 0 ? "failed" : "success",
          description:
            i % 3 === 0
              ? "Import failed: file format not recognised."
              : "Customers were imported.",
        };
        break;
      case 12:
        ev = {
          actor: actor(),
          action: "EXPORT",
          source: "user",
          resource: {
            type: "report",
            id: null,
            name: "Monthly Sales Report",
            exists: true,
          },
          status: i % 2 ? "failed" : "success",
          description:
            i % 2 ? "Export request failed." : "Report was exported.",
        };
        break;
      case 13:
        ev = {
          actor: { type: "ai", name: "Syntrixa AI" },
          action: "GENERATE",
          source: "ai",
          aiMode: i % 2 ? "executed" : "suggested",
          resource: {
            type: "followup",
            id: null,
            name: `Follow-up for ${lead}`,
            exists: true,
          },
          description:
            i % 2
              ? "AI generated a follow-up message for the lead."
              : "AI suggested a follow-up recommendation for the lead.",
          ...noTech,
        };
        break;
      case 14:
        ev = {
          actor: { type: "ai", name: "Syntrixa AI" },
          action: "GENERATE",
          source: "ai",
          aiMode: "executed",
          resource: {
            type: "lead",
            id: slugify(lead),
            name: lead,
            exists: true,
          },
          description: "AI generated a lead summary.",
          ...noTech,
        };
        break;
      case 15:
        ev = {
          actor: { type: "automation", name: "Lead Follow-up Automation" },
          action: "STATUS_CHANGE",
          source: "automation",
          resource: {
            type: "lead",
            id: slugify(lead),
            name: lead,
            exists: true,
          },
          description: "Lead follow-up status changed automatically.",
          automation: {
            name: "Follow-up Reminder",
            trigger: "Lead inactive for 3 days",
            action: "Updated lead status",
          },
          changes: [
            { field: "Follow-up Status", before: "On track", after: "Overdue" },
          ],
          ...noTech,
        };
        break;
      case 16:
        ev = {
          actor: { type: "automation", name: "Follow-up Reminder" },
          action: "CREATE",
          source: "automation",
          resource: {
            type: "task",
            id: null,
            name: `Call ${lead}`,
            exists: true,
          },
          description: "A follow-up task was created automatically.",
          automation: {
            name: "Follow-up Reminder",
            trigger: "Lead inactive for 3 days",
            action: "Created Task",
          },
          ...noTech,
        };
        break;
      case 17:
        ev = {
          actor: { type: "integration", name: "WhatsApp Integration" },
          action: "SYNC",
          source: "integration",
          resource: {
            type: "customer",
            id: slugify(customer),
            name: customer,
            exists: true,
          },
          description: "Customer information synchronized from WhatsApp.",
          integration: { name: "WhatsApp" },
          ...noTech,
        };
        break;
      case 18:
        ev = {
          actor: { type: "system", name: "Syntrixa360 System" },
          action: "IMPORT",
          source: "system",
          resource: {
            type: "data_import",
            id: null,
            name: "Nightly data sync",
            exists: true,
          },
          status: i % 5 === 0 ? "pending" : "success",
          description: "Scheduled background import completed.",
          ...noTech,
        };
        break;
      case 19:
        ev = {
          actor: { type: "api", name: "Public API" },
          action: "UPDATE",
          source: "api",
          resource: {
            type: "order",
            id: `ORD-${3000 + i}`,
            name: `Order #${3000 + i}`,
            exists: true,
          },
          description: "Order status updated via API.",
          changes: [
            { field: "Status", before: "Processing", after: "Dispatched" },
          ],
          ...noTech,
        };
        break;
      case 20:
        ev = {
          actor: actor(),
          action: "SEND",
          source: "user",
          resource: {
            type: "quotation",
            id: `Q-${2000 + i}`,
            name: `Quotation for ${customer}`,
            exists: true,
          },
          status: i % 7 === 0 ? "cancelled" : "success",
          description: "Quotation was emailed to the customer.",
        };
        break;
      default:
        ev = {
          actor: actor(),
          action: "CREATE",
          source: "user",
          resource: {
            type: "payment",
            id: `PAY-${4000 + i}`,
            name: `Payment from ${customer}`,
            exists: true,
          },
          description: "A payment was recorded.",
        };
    }
    out.push({ ...base, ...ev } as AuditLogDTO);
  }
  return out;
}

const rowsFor = (orgId: string) => {
  let rows = cache.get(orgId);
  if (!rows) cache.set(orgId, (rows = buildFixture(orgId)));
  return rows;
};

type Ctx = {
  orgId: string;
  viewerUserId: string;
  canViewOrganization: boolean;
};

/** Applies the viewer's scope + tenant isolation (server-side in real life). */
function scoped(ctx: Ctx, scope: AuditQuery["scope"]) {
  if (scope === "organization" && !ctx.canViewOrganization)
    throw new ForbiddenError();
  const rows = rowsFor(ctx.orgId);
  const visible =
    scope === "mine"
      ? rows.filter((r) => r.actor.userId === ctx.viewerUserId)
      : rows;
  // Technical details are only returned to organization-level readers.
  return ctx.canViewOrganization
    ? visible
    : visible.map(({ technical: _t, ...r }) => r as AuditLogDTO);
}

// ---- Adapter (swap these for fetch calls) --------------------------------
export async function fetchAuditLogs(
  ctx: Ctx,
  q: AuditQuery,
): Promise<Paginated<AuditLogDTO>> {
  await delay();
  const { s, e } = dayBounds(q.startDate, q.endDate);
  const needle = q.search?.trim().toLowerCase();
  let rows = scoped(ctx, q.scope).filter((r) => {
    const t = new Date(r.createdAt).getTime();
    if (t < s || t > e) return false;
    if (q.actorType && r.actor.type !== q.actorType) return false;
    if (q.actorId && r.actor.userId !== q.actorId) return false;
    if (q.action && r.action !== q.action) return false;
    if (q.resourceType && r.resource.type !== q.resourceType) return false;
    if (q.status && r.status !== q.status) return false;
    if (needle) {
      const hay = [
        r.actor.name,
        ACTION_LABEL[r.action],
        RESOURCE_LABEL[r.resource.type],
        r.resource.name,
        r.description,
        r.technical?.requestId ?? "",
      ]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(needle)) return false;
    }
    return true;
  });
  const by: Record<
    AuditQuery["sort"],
    (a: AuditLogDTO, b: AuditLogDTO) => number
  > = {
    newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
    oldest: (a, b) => a.createdAt.localeCompare(b.createdAt),
    actor: (a, b) => a.actor.name.localeCompare(b.actor.name),
    action: (a, b) => a.action.localeCompare(b.action),
    resource: (a, b) => a.resource.type.localeCompare(b.resource.type),
  };
  rows = [...rows].sort(by[q.sort]);
  return paginate(rows, q.page, q.pageSize);
}

export async function fetchAuditLog(
  ctx: Ctx,
  id: string,
  scope: AuditQuery["scope"],
) {
  await delay(120);
  const row = scoped(ctx, scope).find((r) => r.id === id);
  if (!row) throw new Error("not_found");
  return row;
}

export async function fetchAuditSummary(
  ctx: Ctx,
  scope: AuditQuery["scope"],
): Promise<AuditSummary> {
  await delay(160);
  const rows = scoped(ctx, scope);
  const startOfToday = new Date().setHours(0, 0, 0, 0);
  return {
    totalActivities: rows.length,
    todayActivities: rows.filter(
      (r) => new Date(r.createdAt).getTime() >= startOfToday,
    ).length,
    userActions: rows.filter((r) => r.actor.type === "user").length,
    systemAutomation: rows.filter((r) => r.actor.type !== "user").length,
  };
}

/** Which filter values actually exist — keeps filters limited to backend-supported values. */
export async function fetchAuditFacets(
  ctx: Ctx,
  scope: AuditQuery["scope"],
): Promise<AuditFacets> {
  await delay(100);
  const rows = scoped(ctx, scope);
  const uniq = <T>(xs: T[]) => [...new Set(xs)];
  const actors = new Map<string, string>();
  rows.forEach(
    (r) => r.actor.userId && actors.set(r.actor.userId, r.actor.name),
  );
  return {
    actions: uniq(rows.map((r) => r.action)),
    resourceTypes: uniq(rows.map((r) => r.resource.type)),
    actorTypes: uniq(rows.map((r) => r.actor.type)),
    statuses: uniq(rows.map((r) => r.status)),
    actors: [...actors].map(([id, name]) => ({ id, name })),
  };
}

/** GET /api/v1/audit-logs/export — not supported yet (see AUDIT_CAPABILITIES). */
export async function exportAuditLogs(): Promise<never> {
  throw new Error("Audit export is not supported by the backend yet.");
}
