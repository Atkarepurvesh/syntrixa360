// AI & Automation Activity — DTOs, labels and the data adapter.
//
// "What did Syntrixa AI and my automations do?"
//
// Same contract as audit-logs-data.ts: the exported fetch* functions are the
// single swap point for the real endpoints
//   GET /api/v1/ai/activity            GET /api/v1/ai/activity/summary
//   GET /api/v1/automation/runs        GET /api/v1/automation/runs/summary
// Today they resolve DEV fixtures (tenant separated). The two sources are
// exposed as ONE feed here so server-side pagination/sorting stays correct;
// if the backend keeps separate tables it should still expose a unified feed.

import {
  delay,
  dayBounds,
  ForbiddenError,
  isoMinutesAgo,
  makeRng,
  ORG_POOLS,
  paginate,
  type Paginated,
} from "@/lib/activity-fixtures";
import { slugify } from "@/lib/customers-data";

// ---- Types ---------------------------------------------------------------
export type AiActivityType =
  | "AI_SUGGESTION"
  | "AI_EXECUTION"
  | "AI_GENERATION"
  | "AI_ANALYSIS"
  | "AI_PREDICTION"
  | "AI_CLASSIFICATION"
  | "AI_SCORE";
export type ActivityStatus =
  | "suggested"
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "cancelled"
  | "skipped"
  | "approved"
  | "rejected";
export type ActivitySource =
  "ai" | "automation" | "user" | "system" | "integration" | "scheduler";
export type ActivityResourceType =
  | "lead"
  | "customer"
  | "contact"
  | "deal"
  | "quotation"
  | "order"
  | "invoice"
  | "payment"
  | "task"
  | "conversation";
export type ApprovalStatus =
  "not_required" | "pending_approval" | "approved" | "rejected";

interface Common {
  id: string;
  createdAt: string;
  completedAt?: string | undefined;
  durationMs?: number | undefined;
  status: ActivityStatus;
  source: ActivitySource;
  /** Real user who triggered/owns it — only exposed to authorized viewers. */
  ownerUserId?: string | undefined;
  resource: {
    type: ActivityResourceType;
    id: string | null;
    name: string;
    exists: boolean;
  };
  trigger: {
    type:
      | "manual"
      | "schedule"
      | "event"
      | "webhook"
      | "api"
      | "ai_decision"
      | "condition"
      | "crm_event";
    label: string;
  };
}

export interface AiActivityDTO extends Common {
  kind: "ai";
  activityType: AiActivityType;
  title: string;
  aiModule: string;
  inputSummary?: string | undefined;
  output?: string | undefined;
  /** Short user-facing explanation. Never internal model reasoning. */
  reason?: string | undefined;
  confidence?: number | undefined; // 0..1 — only when the backend calculates it
  approvalStatus: ApprovalStatus;
  approvedBy?: string | undefined;
  approvedAt?: string | undefined;
  provider?: string | undefined;
  model?: string | undefined;
}

export interface AutomationRunDTO extends Common {
  kind: "automation";
  automationName: string;
  automationType:
    "workflow" | "task" | "notification" | "email" | "whatsapp" | "data_sync";
  workflow?: string | undefined;
  conditions: string[];
  actions: string[];
  result?: string | undefined;
  /** User-friendly message only — never stack traces. */
  error?: string | undefined;
  progress?: number | undefined; // only when the backend reports it
  steps?: {
    kind: "trigger" | "condition" | "action" | "result";
    label: string;
    ok: boolean;
  }[];
}

export type ActivityDTO = AiActivityDTO | AutomationRunDTO;

export type ActivityQuery = {
  scope: "mine" | "organization";
  kind: "all" | "ai" | "automation";
  page: number;
  pageSize: number;
  search?: string;
  aiType?: AiActivityType;
  automationType?: AutomationRunDTO["automationType"];
  status?: ActivityStatus;
  source?: ActivitySource;
  resourceType?: ActivityResourceType;
  startDate?: string;
  endDate?: string;
  sort: "newest" | "oldest" | "duration" | "status" | "type";
};

export type ActivitySummary = {
  aiActivities: number;
  automationRuns: number;
  successfulRuns: number;
  failedRuns: number;
};

export type ActivityFacets = {
  statuses: ActivityStatus[];
  sources: ActivitySource[];
  resourceTypes: ActivityResourceType[];
  aiTypes: AiActivityType[];
  automationTypes: AutomationRunDTO["automationType"][];
};

/** What the backend actually supports. UI hides everything that is false. */
export const ACTIVITY_CAPABILITIES = {
  export: false,
  approval: false,
  retry: false,
  realtime: false,
  usage: false,
} as const;

// ---- Labels --------------------------------------------------------------
export const AI_TYPE_LABEL: Record<AiActivityType, string> = {
  AI_SUGGESTION: "AI Suggestion",
  AI_EXECUTION: "AI Execution",
  AI_GENERATION: "AI Generation",
  AI_ANALYSIS: "AI Analysis",
  AI_PREDICTION: "AI Prediction",
  AI_CLASSIFICATION: "AI Classification",
  AI_SCORE: "AI Score",
};
export const AUTOMATION_TYPE_LABEL: Record<
  AutomationRunDTO["automationType"],
  string
> = {
  workflow: "Workflow",
  task: "Task",
  notification: "Notification",
  email: "Email",
  whatsapp: "WhatsApp",
  data_sync: "Data Sync",
};
export const ACTIVITY_STATUS_LABEL: Record<ActivityStatus, string> = {
  suggested: "Suggested",
  pending: "Pending",
  running: "Running",
  completed: "Completed",
  failed: "Failed",
  cancelled: "Cancelled",
  skipped: "Skipped",
  approved: "Approved",
  rejected: "Rejected",
};
export const SOURCE_LABEL: Record<ActivitySource, string> = {
  ai: "AI",
  automation: "Automation",
  user: "User",
  system: "System",
  integration: "Integration",
  scheduler: "Scheduler",
};
export const ACTIVITY_RESOURCE_LABEL: Record<ActivityResourceType, string> = {
  lead: "Lead",
  customer: "Customer",
  contact: "Contact",
  deal: "Deal",
  quotation: "Quotation",
  order: "Order",
  invoice: "Invoice",
  payment: "Payment",
  task: "Task",
  conversation: "Conversation",
};
export const TRIGGER_LABEL: Record<Common["trigger"]["type"], string> = {
  manual: "Manual",
  schedule: "Schedule",
  event: "Event",
  webhook: "Webhook",
  api: "API",
  ai_decision: "AI Decision",
  condition: "Condition",
  crm_event: "CRM Event",
};

export const activityName = (a: ActivityDTO) =>
  a.kind === "ai" ? a.title : a.automationName;

/** Suggestion ≠ execution ≠ automation. This is the plain-language mode label. */
export function activityModeLabel(a: ActivityDTO) {
  if (a.kind === "automation") return "Automation Execution";
  if (a.approvalStatus === "pending_approval")
    return "AI Suggestion · Awaiting approval";
  return a.activityType === "AI_SUGGESTION"
    ? "AI Suggestion (not executed)"
    : AI_TYPE_LABEL[a.activityType];
}

// ---- DEV fixture generation (tenant separated) ---------------------------
const cache = new Map<string, ActivityDTO[]>();

function build(orgId: string): ActivityDTO[] {
  const pool = ORG_POOLS[orgId];
  if (!pool) return [];
  const rng = makeRng(`ai-${orgId}`);
  const out: ActivityDTO[] = [];
  const N = 260;
  for (let i = 0; i < N; i++) {
    const minutes = Math.round(i * 22 + i * i * 0.3 + rng.int(0, 14));
    const created = isoMinutesAgo(minutes);
    const customer = rng.pick(pool.customers);
    const lead = rng.pick(pool.leads);
    const u = rng.pick(pool.users);
    const dur = rng.int(400, 9000);
    const done = isoMinutesAgo(Math.max(0, minutes - dur / 60_000));
    const res = (
      type: ActivityResourceType,
      name: string,
      exists = true,
    ): Common["resource"] => ({
      type,
      id: type === "customer" || type === "lead" ? slugify(name) : null,
      name,
      exists,
    });
    const common = {
      id: `${orgId}-act-${i}`,
      createdAt: created,
      ownerUserId: u.id,
    };
    const kind = (i * 5 + rng.int(0, 4)) % 17;
    const failed = i % 9 === 4;

    if (kind < 8) {
      // ---- AI activities ---------------------------------------------------
      const t = kind;
      const base = {
        ...common,
        kind: "ai" as const,
        completedAt: done,
        durationMs: dur,
        provider: "Syntrixa AI",
        model: "Standard",
        approvalStatus: "not_required" as ApprovalStatus,
      };
      if (t === 0)
        out.push({
          ...base,
          activityType: "AI_SCORE",
          title: "Lead Score Generated",
          aiModule: "Lead Intelligence",
          status: "completed",
          source: "ai",
          resource: res("lead", lead),
          trigger: { type: "crm_event", label: "Lead updated" },
          inputSummary: "Lead profile and recent engagement",
          output: `Score ${rng.int(55, 94)} / 100`,
          reason: "Recent replies and an open enquiry increased the score.",
          confidence: rng.int(70, 95) / 100,
        });
      else if (t === 1)
        out.push({
          ...base,
          activityType: "AI_SUGGESTION",
          title: "Lead Follow-up Suggestion",
          aiModule: "Follow-up Intelligence",
          status: "suggested",
          source: "ai",
          resource: res("lead", lead),
          trigger: { type: "ai_decision", label: "Lead inactive for 5 days" },
          inputSummary: "Lead inactivity detected",
          output:
            "Follow up with the customer regarding the pending quotation.",
          reason:
            "Lead has been inactive for 5 days and has an open quotation.",
          confidence: 0.87,
          completedAt: undefined,
          durationMs: undefined,
        });
      else if (t === 2)
        out.push({
          ...base,
          activityType: "AI_GENERATION",
          title: "Follow-up Message Generated",
          aiModule: "Follow-up Generator",
          status: "completed",
          source: "ai",
          resource: res("customer", customer),
          trigger: { type: "manual", label: "Requested by a user" },
          output:
            "A polite follow-up message about the pending order was drafted.",
          approvalStatus: "approved",
          approvedBy: u.name,
          approvedAt: done,
        });
      else if (t === 3)
        out.push({
          ...base,
          activityType: "AI_SUGGESTION",
          title: "Reply Suggestion",
          aiModule: "Inbox Assistant",
          status: "pending",
          source: "ai",
          resource: res("conversation", `Chat with ${customer}`),
          trigger: { type: "event", label: "New customer message" },
          output:
            "Thanks for reaching out — we can share the revised quotation today.",
          approvalStatus: "pending_approval",
          completedAt: undefined,
          durationMs: undefined,
        });
      else if (t === 4)
        out.push({
          ...base,
          activityType: "AI_PREDICTION",
          title: "Repeat Order Prediction",
          aiModule: "Repeat Order Engine",
          status: "completed",
          source: "scheduler",
          resource: res("customer", customer),
          trigger: { type: "schedule", label: "Daily at 6:00 AM" },
          output: "Likely to reorder within 12 days.",
          reason: "Past order gaps average 14 days.",
          confidence: rng.int(65, 92) / 100,
        });
      else if (t === 5)
        out.push({
          ...base,
          activityType: "AI_ANALYSIS",
          title: "Sales Insight Generated",
          aiModule: "Sales Insights",
          status: failed ? "failed" : "completed",
          source: "ai",
          resource: res("deal", `${customer} deal`),
          trigger: { type: "schedule", label: "Weekly on Monday" },
          output: failed
            ? undefined
            : "Deals above ₹5L close faster after a site visit.",
        });
      else if (t === 6)
        out.push({
          ...base,
          activityType: "AI_GENERATION",
          title: "Lead Summary Generated",
          aiModule: "Lead Intelligence",
          status: "completed",
          source: "ai",
          resource: res("lead", lead),
          trigger: { type: "manual", label: "Opened lead summary" },
          output: "Summary of 6 interactions and the open quotation.",
        });
      else
        out.push({
          ...base,
          activityType: "AI_EXECUTION",
          title: "Daily Briefing Prepared",
          aiModule: "AI Daily Briefing",
          status: "completed",
          source: "scheduler",
          resource: res("task", "Today's priorities"),
          trigger: { type: "schedule", label: "Daily at 8:30 AM" },
          output: "Briefing prepared for the sales team.",
        });
    } else {
      // ---- Automation runs -------------------------------------------------
      const t = kind - 8;
      const running = i % 37 === 1;
      const base = {
        ...common,
        kind: "automation" as const,
        status: (running
          ? "running"
          : failed
            ? "failed"
            : "completed") as ActivityStatus,
        completedAt: running ? undefined : done,
        durationMs: running ? undefined : dur,
        ...(running ? { progress: 65 } : {}),
      };
      const ok = !failed;
      if (t === 0 || t === 7)
        out.push({
          ...base,
          automationName: "Inactive Lead Follow-up",
          automationType: "task",
          workflow: "Lead Nurturing",
          source: "automation",
          resource: res("lead", lead),
          trigger: { type: "condition", label: "Lead inactive for 3 days" },
          conditions: ["Lead status = Qualified"],
          actions: ["Create follow-up task"],
          result: ok ? "Follow-up task created" : undefined,
          error: ok ? undefined : "Task service temporarily unavailable.",
          steps: [
            { kind: "trigger", label: "Lead inactive for 3 days", ok: true },
            { kind: "condition", label: "Lead status = Qualified", ok: true },
            { kind: "action", label: "Create follow-up task", ok },
            { kind: "result", label: ok ? "Completed" : "Failed", ok },
          ],
        });
      else if (t === 1)
        out.push({
          ...base,
          automationName: "High Value Lead Alert",
          automationType: "notification",
          source: "automation",
          resource: res("lead", lead),
          trigger: { type: "crm_event", label: "Lead created" },
          conditions: ["Lead value > ₹10,00,000"],
          actions: ["Notify Sales Manager"],
          result: ok ? "Notification sent" : undefined,
          error: ok ? undefined : "Notification could not be delivered.",
          steps: [
            { kind: "trigger", label: "Lead created", ok: true },
            { kind: "condition", label: "Lead value > ₹10,00,000", ok: true },
            { kind: "action", label: "Notify Sales Manager", ok },
            { kind: "result", label: ok ? "Completed" : "Failed", ok },
          ],
        });
      else if (t === 2)
        out.push({
          ...base,
          automationName: "Payment Reminder",
          automationType: "email",
          source: "scheduler",
          resource: res("payment", `Payment from ${customer}`),
          trigger: { type: "schedule", label: "Daily at 9:00 AM" },
          conditions: ["Invoice overdue by 3+ days"],
          actions: ["Send email reminder"],
          result: ok ? "Reminder email sent" : undefined,
          error: ok ? undefined : "Email provider unavailable.",
          steps: [
            { kind: "trigger", label: "Daily at 9:00 AM", ok: true },
            {
              kind: "condition",
              label: "Invoice overdue by 3+ days",
              ok: true,
            },
            { kind: "action", label: "Send email reminder", ok },
            { kind: "result", label: ok ? "Completed" : "Failed", ok },
          ],
        });
      else if (t === 3)
        out.push({
          ...base,
          automationName: "Lead Assignment",
          automationType: "workflow",
          workflow: "Lead Routing",
          source: "automation",
          resource: res("lead", lead),
          trigger: { type: "crm_event", label: "Lead created" },
          conditions: ["Lead score > 70"],
          actions: [
            "Assign Sales Manager",
            "Create follow-up",
            "Send notification",
          ],
          result: ok ? `Assigned to ${u.name}` : undefined,
          error: ok ? undefined : "No eligible owner found.",
          steps: [
            { kind: "trigger", label: "Lead created", ok: true },
            { kind: "condition", label: "Lead score > 70", ok: true },
            { kind: "action", label: "Assign Sales Manager", ok },
            { kind: "action", label: "Create follow-up", ok },
            { kind: "action", label: "Send notification", ok },
            { kind: "result", label: ok ? "Completed" : "Failed", ok },
          ],
        });
      else if (t === 4)
        out.push({
          ...base,
          automationName: "WhatsApp Re-engagement",
          automationType: "whatsapp",
          source: "automation",
          resource: res("customer", customer),
          trigger: { type: "condition", label: "No order in 45 days" },
          conditions: ["Customer opted in"],
          actions: ["Send WhatsApp message"],
          result: ok ? "Message sent" : undefined,
          error: ok ? undefined : "WhatsApp channel is disconnected.",
        });
      else if (t === 5)
        out.push({
          ...base,
          automationName: "Order Reminder",
          automationType: "notification",
          source: "automation",
          resource: res("order", `Order #${3000 + i}`),
          trigger: { type: "event", label: "Order dispatched" },
          conditions: [],
          actions: ["Notify customer"],
          result: ok ? "Customer notified" : undefined,
          error: ok ? undefined : "Notification could not be delivered.",
        });
      else
        out.push({
          ...base,
          automationName: "Customer Data Sync",
          automationType: "data_sync",
          source: "integration",
          resource: res("customer", customer),
          trigger: { type: "webhook", label: "Integration webhook" },
          conditions: [],
          actions: ["Update customer record"],
          result: ok ? "Customer updated" : undefined,
          error: ok ? undefined : "Source system returned an invalid response.",
        });
      // A run still in progress has no result or error yet.
      const last = out[out.length - 1];
      if (running && last?.kind === "automation") {
        last.result = undefined;
        last.error = undefined;
      }
    }
  }
  return out;
}

const rowsFor = (orgId: string) => {
  let rows = cache.get(orgId);
  if (!rows) cache.set(orgId, (rows = build(orgId)));
  return rows;
};

type Ctx = {
  orgId: string;
  viewerUserId: string;
  canViewOrganization: boolean;
};

function scoped(ctx: Ctx, scope: ActivityQuery["scope"]) {
  if (scope === "organization" && !ctx.canViewOrganization)
    throw new ForbiddenError();
  const rows = rowsFor(ctx.orgId);
  return scope === "mine"
    ? rows.filter((r) => r.ownerUserId === ctx.viewerUserId)
    : rows;
}

// ---- Adapter (swap these for fetch calls) --------------------------------
export async function fetchActivity(
  ctx: Ctx,
  q: ActivityQuery,
): Promise<Paginated<ActivityDTO>> {
  await delay();
  const { s, e } = dayBounds(q.startDate, q.endDate);
  const needle = q.search?.trim().toLowerCase();
  let rows = scoped(ctx, q.scope).filter((r) => {
    if (q.kind !== "all" && r.kind !== q.kind) return false;
    const t = new Date(r.createdAt).getTime();
    if (t < s || t > e) return false;
    if (
      q.status &&
      r.status !== q.status &&
      !(
        q.status === "pending" &&
        r.kind === "ai" &&
        r.approvalStatus === "pending_approval"
      )
    )
      return false;
    if (q.source && r.source !== q.source) return false;
    if (q.resourceType && r.resource.type !== q.resourceType) return false;
    if (q.aiType && !(r.kind === "ai" && r.activityType === q.aiType))
      return false;
    if (
      q.automationType &&
      !(r.kind === "automation" && r.automationType === q.automationType)
    )
      return false;
    if (needle) {
      const hay = [
        activityName(r),
        r.kind === "ai" ? r.aiModule : (r.workflow ?? ""),
        r.resource.name,
        r.trigger.label,
        r.kind === "ai" ? (r.output ?? "") : (r.result ?? ""),
      ]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(needle)) return false;
    }
    return true;
  });
  const by: Record<
    ActivityQuery["sort"],
    (a: ActivityDTO, b: ActivityDTO) => number
  > = {
    newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
    oldest: (a, b) => a.createdAt.localeCompare(b.createdAt),
    duration: (a, b) => (b.durationMs ?? 0) - (a.durationMs ?? 0),
    status: (a, b) => a.status.localeCompare(b.status),
    type: (a, b) => a.kind.localeCompare(b.kind),
  };
  rows = [...rows].sort(by[q.sort]);
  return paginate(rows, q.page, q.pageSize);
}

export async function fetchActivityDetail(
  ctx: Ctx,
  id: string,
  scope: ActivityQuery["scope"],
) {
  await delay(120);
  const row = scoped(ctx, scope).find((r) => r.id === id);
  if (!row) throw new Error("not_found");
  return row;
}

export async function fetchActivitySummary(
  ctx: Ctx,
  scope: ActivityQuery["scope"],
): Promise<ActivitySummary> {
  await delay(160);
  const rows = scoped(ctx, scope);
  const runs = rows.filter(
    (r): r is AutomationRunDTO => r.kind === "automation",
  );
  return {
    aiActivities: rows.length - runs.length,
    automationRuns: runs.length,
    successfulRuns: runs.filter((r) => r.status === "completed").length,
    failedRuns: runs.filter((r) => r.status === "failed").length,
  };
}

export async function fetchActivityFacets(
  ctx: Ctx,
  scope: ActivityQuery["scope"],
): Promise<ActivityFacets> {
  await delay(100);
  const rows = scoped(ctx, scope);
  const uniq = <T>(xs: T[]) => [...new Set(xs)];
  return {
    statuses: uniq(rows.map((r) => r.status)),
    sources: uniq(rows.map((r) => r.source)),
    resourceTypes: uniq(rows.map((r) => r.resource.type)),
    aiTypes: uniq(
      rows.flatMap((r) => (r.kind === "ai" ? [r.activityType] : [])),
    ),
    automationTypes: uniq(
      rows.flatMap((r) => (r.kind === "automation" ? [r.automationType] : [])),
    ),
  };
}

/** Run history for one automation (execution history, not configuration). */
export async function fetchAutomationHistory(ctx: Ctx, automationName: string) {
  await delay(120);
  const scope = ctx.canViewOrganization ? "organization" : "mine";
  const runs = scoped(ctx, scope).filter(
    (r): r is AutomationRunDTO =>
      r.kind === "automation" && r.automationName === automationName,
  );
  return {
    runs: runs.length,
    successful: runs.filter((r) => r.status === "completed").length,
    failed: runs.filter((r) => r.status === "failed").length,
  };
}

/** Approval / retry — not supported by the backend yet (see ACTIVITY_CAPABILITIES). */
export async function decideApproval(
  _id: string,
  _decision: "approve" | "reject",
): Promise<never> {
  throw new Error("Approval workflow is not supported by the backend yet.");
}
export async function retryRun(_id: string): Promise<never> {
  throw new Error("Retry is not supported by the backend yet.");
}
export async function exportActivity(): Promise<never> {
  throw new Error("Activity export is not supported by the backend yet.");
}
