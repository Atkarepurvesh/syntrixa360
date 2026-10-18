// Subscription, entitlements and usage — single data layer for
// UPDATE 7/20 (trial step), 8/20 (Subscription & Billing) and 9/20 (Usage & Limits).
//
// Architecture:  SUBSCRIPTION_PLAN -> ORGANIZATION_SUBSCRIPTION -> ENTITLEMENTS -> ORGANIZATION_USAGE
//
// The frontend is NOT a security boundary. Everything below is display data; the
// backend enforces limits and entitlements. `billingApi` is the only place that
// would change when a real backend exists: replace the bodies with fetch() calls.
// The DEV MOCK section is isolated at the bottom — nothing else imports from it.

// ---------------------------------------------------------------------------
// Types (conceptual API contract — field names may differ on the real backend)
// ---------------------------------------------------------------------------

export type SubscriptionStatus =
  | "TRIAL"
  | "ACTIVE"
  | "PAST_DUE"
  | "PAUSED"
  | "CANCELLED"
  | "EXPIRED"
  | "INCOMPLETE"
  | "UNKNOWN";

export type BillingInterval = "month" | "year";

export type FeatureGroup =
  | "CRM"
  | "Sales"
  | "Finance"
  | "Productivity"
  | "Communication"
  | "AI"
  | "Automation"
  | "Analytics"
  | "Integrations"
  | "Administration";

export interface PlanFeature {
  key: string; // entitlement key, e.g. "ai_copilot"
  label: string;
  group: FeatureGroup;
  availability: "included" | "limited" | "not_included";
}

export interface PlanLimit {
  resource: string; // e.g. "leads"
  limit: number | null; // null = unlimited
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  prices: Partial<Record<BillingInterval, number>>; // minor currency handled by backend
  currency: string; // billing currency from backend
  features: PlanFeature[];
  limits: PlanLimit[];
  trialDays?: number;
  /** Backend marks which plan new organizations trial. */
  isTrialDefault?: boolean;
  customPricing?: boolean;
}

export interface OrganizationSubscription {
  organizationId: string;
  planId: string;
  status: SubscriptionStatus | string; // tolerate new backend statuses
  interval: BillingInterval;
  trialStart?: string;
  trialEnd?: string;
  trialDays?: number;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  cancelledAt?: string | undefined;
  renewalDate?: string;
  paymentRequired: boolean;
  paymentMethod?: { brand: string; last4: string; expiry: string };
}

export interface BillingInvoice {
  id: string;
  number: string;
  date: string;
  amount: number;
  currency: string;
  status: "paid" | "pending" | "failed" | "refunded" | "void";
  period: string;
}

export interface SubscriptionHistoryItem {
  id: string;
  action: string;
  previousPlan?: string;
  newPlan?: string;
  date: string;
  effectiveDate: string;
  status: string;
}

export type ResetBehavior =
  "monthly" | "daily" | "billing_cycle" | "lifetime" | "never";
export type UsageCategory =
  "CRM" | "Sales" | "Team" | "AI" | "Automation" | "Communication" | "Storage";

export interface UsageResource {
  resource: string; // internal key
  label: string; // display name
  category: UsageCategory;
  unit: string;
  used: number;
  limit: number | null; // null = unlimited
  included: boolean; // false = feature not in plan
  periodStart: string;
  periodEnd: string;
  resetDate?: string | undefined;
  reset: ResetBehavior;
  href?: string | undefined; // existing module to navigate to
  actionLabel?: string | undefined;
  previousPeriodUsed?: number | undefined;
  breakdown?: { label: string | undefined; value: number; unit?: string }[];
  trend?: { label: string | undefined; value: number }[];
}

export interface UsageHistoryPoint {
  period: string;
  values: Record<string, number>;
}

export interface BillingSnapshot {
  organizationId: string;
  plan: SubscriptionPlan;
  subscription: OrganizationSubscription;
  usage: UsageResource[];
  /** Optional thresholds from backend; otherwise product defaults below. */
  thresholds?: UsageThresholds | undefined;
}

// ---------------------------------------------------------------------------
// Product-level thresholds (single place — never hard-code percentages in UI)
// ---------------------------------------------------------------------------

export interface UsageThresholds {
  warning: number; // % at which "warning" begins
  critical: number; // % at which "critical" begins
}

export const DEFAULT_USAGE_THRESHOLDS: UsageThresholds = {
  warning: 80,
  critical: 95,
};

export type UsageState =
  | "normal"
  | "warning"
  | "critical"
  | "exceeded"
  | "unlimited"
  | "not_available";

export interface ComputedUsage {
  state: UsageState;
  percentage: number | null;
  remaining: number | null;
}

export function computeUsage(
  r: Pick<UsageResource, "used" | "limit" | "included">,
  thresholds: UsageThresholds = DEFAULT_USAGE_THRESHOLDS,
): ComputedUsage {
  if (!r.included)
    return { state: "not_available", percentage: null, remaining: null };
  if (r.limit === null)
    return { state: "unlimited", percentage: null, remaining: null };
  if (r.limit <= 0) return { state: "exceeded", percentage: 100, remaining: 0 };
  const percentage = Math.round((r.used / r.limit) * 100);
  const remaining = Math.max(r.limit - r.used, 0);
  let state: UsageState = "normal";
  if (percentage >= 100) state = "exceeded";
  else if (percentage >= thresholds.critical) state = "critical";
  else if (percentage >= thresholds.warning) state = "warning";
  return { state, percentage, remaining };
}

export const USAGE_STATE_LABEL: Record<UsageState, string> = {
  normal: "Normal",
  warning: "Warning",
  critical: "Critical",
  exceeded: "Exceeded",
  unlimited: "Unlimited",
  not_available: "Not included",
};

// ---------------------------------------------------------------------------
// Entitlements — centralized. Use these instead of `if (plan === "business")`.
// ---------------------------------------------------------------------------

export interface Entitlements {
  hasFeature: (key: string) => boolean;
  hasLimit: (resource: string) => boolean;
  limitOf: (resource: string) => number | null | undefined;
}

export function buildEntitlements(
  plan: SubscriptionPlan | undefined,
): Entitlements {
  const features = new Map((plan?.features ?? []).map((f) => [f.key, f]));
  const limits = new Map(
    (plan?.limits ?? []).map((l) => [l.resource, l.limit]),
  );
  return {
    hasFeature: (key) => {
      const f = features.get(key);
      return !!f && f.availability !== "not_included";
    },
    hasLimit: (resource) =>
      limits.has(resource) && limits.get(resource) !== null,
    limitOf: (resource) => limits.get(resource),
  };
}

// ---------------------------------------------------------------------------
// Status presentation with a safe fallback for unknown backend statuses
// ---------------------------------------------------------------------------

export const SUBSCRIPTION_STATUS_META: Record<
  SubscriptionStatus,
  { label: string; tone: "success" | "info" | "warning" | "danger" | "muted" }
> = {
  TRIAL: { label: "Trial", tone: "info" },
  ACTIVE: { label: "Active", tone: "success" },
  PAST_DUE: { label: "Past due", tone: "danger" },
  PAUSED: { label: "Paused", tone: "warning" },
  CANCELLED: { label: "Cancelled", tone: "muted" },
  EXPIRED: { label: "Expired", tone: "danger" },
  INCOMPLETE: { label: "Incomplete", tone: "warning" },
  UNKNOWN: { label: "Unavailable", tone: "muted" },
};

export function statusMeta(status: string) {
  return (
    SUBSCRIPTION_STATUS_META[status as SubscriptionStatus] ??
    SUBSCRIPTION_STATUS_META.UNKNOWN
  );
}

// ---------------------------------------------------------------------------
// Date + number helpers (derived display only; backend dates are authoritative)
// ---------------------------------------------------------------------------

export function formatDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatNumber(n: number): string {
  return n.toLocaleString("en-IN");
}

export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${formatNumber(amount)}`;
  }
}

export function formatUnitValue(n: number, unit: string): string {
  return unit === "GB"
    ? `${n.toLocaleString("en-IN", { maximumFractionDigits: 1 })} GB`
    : formatNumber(n);
}

/** Display-only trial progress. Authoritative status/dates come from the backend. */
export function trialProgress(sub: OrganizationSubscription, now = new Date()) {
  if (!sub.trialStart || !sub.trialEnd) return null;
  const start = new Date(sub.trialStart).getTime();
  const end = new Date(sub.trialEnd).getTime();
  const total = Math.max(Math.round((end - start) / 86_400_000), 1);
  const elapsed = Math.min(
    Math.max(Math.ceil((now.getTime() - start) / 86_400_000), 1),
    total,
  );
  const remaining = Math.max(Math.ceil((end - now.getTime()) / 86_400_000), 0);
  return {
    total,
    day: elapsed,
    remaining,
    percent: Math.round((elapsed / total) * 100),
  };
}

// ---------------------------------------------------------------------------
// API surface. Swap the bodies for real endpoints; callers do not change.
// ---------------------------------------------------------------------------

export const billingApi = {
  getSnapshot: (organizationId: string): Promise<BillingSnapshot> =>
    devMock.getSnapshot(organizationId),
  listPlans: (): Promise<SubscriptionPlan[]> => devMock.listPlans(),
  listInvoices: (organizationId: string): Promise<BillingInvoice[]> =>
    devMock.listInvoices(organizationId),
  listHistory: (organizationId: string): Promise<SubscriptionHistoryItem[]> =>
    devMock.listHistory(organizationId),
  getUsageHistory: (organizationId: string): Promise<UsageHistoryPoint[]> =>
    devMock.getUsageHistory(organizationId),
  startTrial: (organizationId: string): Promise<OrganizationSubscription> =>
    devMock.startTrial(organizationId),
  /** Backend decides effective date & whether payment is needed; UI only displays the result. */
  previewPlanChange: (
    organizationId: string,
    planId: string,
    interval: BillingInterval,
  ) => devMock.previewPlanChange(organizationId, planId, interval),
  changePlan: (
    organizationId: string,
    planId: string,
    interval: BillingInterval,
  ) => devMock.changePlan(organizationId, planId, interval),
  cancel: (organizationId: string) => devMock.cancel(organizationId),
  resume: (organizationId: string) => devMock.resume(organizationId),
};

export interface PlanChangePreview {
  currentPlan: string;
  newPlan: string;
  interval: BillingInterval;
  price: number;
  currency: string;
  effective: string;
  direction: "upgrade" | "downgrade" | "same";
  limitChanges: {
    resource: string;
    label: string;
    from: number | null;
    to: number | null;
  }[];
  /** Resources whose current usage would exceed the new plan's limit. */
  exceeding: { label: string; used: number; newLimit: number }[];
  requiresCheckout: boolean;
}

// ===========================================================================
// DEV MOCK — isolated development data. Not production logic.
// Persisted in localStorage only so the demo survives refresh; a real backend
// replaces this entire section.
// ===========================================================================

const MOCK_KEY = "syntrixa360.dev.subscription";
const day = 86_400_000;
const iso = (offsetDays: number) =>
  new Date(Date.now() + offsetDays * day).toISOString();
const wait = (ms = 450) => new Promise((r) => setTimeout(r, ms));

const MOCK_PLANS: SubscriptionPlan[] = [
  {
    id: "plan_starter",
    name: "Starter Growth",
    description: "Essential CRM for small pharma wholesalers and growing B2B sales teams.",
    prices: { month: 4999, year: 49990 },
    currency: "INR",
    trialDays: 14,
    limits: [
      { resource: "members", limit: 3 },
      { resource: "leads", limit: 1000 },
      { resource: "customers", limit: 1000 },
      { resource: "ai_credits", limit: 500 },
      { resource: "automations", limit: 3 },
      { resource: "storage", limit: 5 },
    ],
    features: [
      {
        key: "leads",
        label: "Leads & Customers",
        group: "CRM",
        availability: "included",
      },
      {
        key: "quotations",
        label: "Quotations",
        group: "Sales",
        availability: "included",
      },
      {
        key: "ai_copilot",
        label: "AI Copilot",
        group: "AI",
        availability: "limited",
      },
      {
        key: "advanced_automation",
        label: "Advanced Automation",
        group: "Automation",
        availability: "not_included",
      },
      {
        key: "advanced_reports",
        label: "Advanced Reports",
        group: "Analytics",
        availability: "not_included",
      },
      {
        key: "custom_webhooks",
        label: "Custom Webhooks",
        group: "Integrations",
        availability: "not_included",
      },
    ],
  },
  {
    id: "plan_business",
    name: "Business Pro",
    description: "For growing distributor teams that need automation, team visibility and connected workflows.",
    prices: { month: 7999, year: 79990 },
    currency: "INR",
    trialDays: 14,
    isTrialDefault: true,
    limits: [
      { resource: "members", limit: 8 },
      { resource: "leads", limit: 5000 },
      { resource: "customers", limit: 5000 },
      { resource: "ai_credits", limit: 1500 },
      { resource: "automations", limit: 15 },
      { resource: "storage", limit: 10 },
    ],
    features: [
      {
        key: "leads",
        label: "Leads & Customers",
        group: "CRM",
        availability: "included",
      },
      {
        key: "quotations",
        label: "Quotations",
        group: "Sales",
        availability: "included",
      },
      {
        key: "ai_copilot",
        label: "AI Copilot",
        group: "AI",
        availability: "included",
      },
      {
        key: "advanced_automation",
        label: "Advanced Automation",
        group: "Automation",
        availability: "included",
      },
      {
        key: "advanced_reports",
        label: "Advanced Reports",
        group: "Analytics",
        availability: "included",
      },
      {
        key: "custom_webhooks",
        label: "Custom Webhooks",
        group: "Integrations",
        availability: "not_included",
      },
    ],
  },
  {
    id: "plan_enterprise",
    name: "Enterprise Intelligence",
    description: "Advanced sales intelligence and controls for established distributors and multi-team operations.",
    prices: { month: 11999, year: 119990 },
    currency: "INR",
    limits: [
      { resource: "members", limit: 15 },
      { resource: "leads", limit: 15000 },
      { resource: "customers", limit: 15000 },
      { resource: "ai_credits", limit: 4000 },
      { resource: "automations", limit: 40 },
      { resource: "storage", limit: 20 },
    ],
    features: [
      {
        key: "leads",
        label: "Leads & Customers",
        group: "CRM",
        availability: "included",
      },
      {
        key: "quotations",
        label: "Quotations",
        group: "Sales",
        availability: "included",
      },
      {
        key: "ai_copilot",
        label: "AI Copilot",
        group: "AI",
        availability: "included",
      },
      {
        key: "advanced_automation",
        label: "Advanced Automation",
        group: "Automation",
        availability: "included",
      },
      {
        key: "advanced_reports",
        label: "Advanced Reports",
        group: "Analytics",
        availability: "included",
      },
      {
        key: "custom_webhooks",
        label: "Custom Webhooks",
        group: "Integrations",
        availability: "included",
      },
    ],
  },
];

interface MockState {
  subscription: OrganizationSubscription;
  history: SubscriptionHistoryItem[];
}

function seedState(organizationId: string): MockState {
  return {
    subscription: {
      organizationId,
      planId: "plan_business",
      status: "TRIAL",
      interval: "month",
      trialStart: iso(-7),
      trialEnd: iso(7),
      trialDays: 14,
      currentPeriodStart: iso(-7),
      currentPeriodEnd: iso(7),
      cancelAtPeriodEnd: false,
      renewalDate: iso(7),
      paymentRequired: false,
    },
    history: [
      {
        id: "h1",
        action: "Trial Started",
        newPlan: "Business",
        date: iso(-7),
        effectiveDate: iso(-7),
        status: "Completed",
      },
    ],
  };
}

function readState(organizationId: string): MockState {
  if (typeof window === "undefined") return seedState(organizationId);
  try {
    const raw = window.localStorage.getItem(`${MOCK_KEY}.${organizationId}`);
    if (raw) return JSON.parse(raw) as MockState;
  } catch {
    /* fall through to seed */
  }
  const seeded = seedState(organizationId);
  writeState(organizationId, seeded);
  return seeded;
}

function writeState(organizationId: string, state: MockState) {
  try {
    window.localStorage.setItem(
      `${MOCK_KEY}.${organizationId}`,
      JSON.stringify(state),
    );
  } catch {
    /* best effort */
  }
}

function mockUsage(
  sub: OrganizationSubscription,
  plan: SubscriptionPlan,
): UsageResource[] {
  const lim = (k: string) =>
    plan.limits.find((l) => l.resource === k)?.limit ?? null;
  const base = {
    periodStart: sub.currentPeriodStart,
    periodEnd: sub.currentPeriodEnd,
    resetDate: sub.currentPeriodEnd,
    reset: "billing_cycle" as ResetBehavior,
    included: true,
  };
  const weekly = (a: number, b: number, c: number, d: number) =>
    [a, b, c, d].map((value, i) => ({ label: `Week ${i + 1}`, value }));
  return [
    {
      ...base,
      resource: "leads",
      label: "Leads",
      category: "CRM",
      unit: "records",
      used: 750,
      limit: lim("leads"),
      reset: "never",
      resetDate: undefined,
      href: "/app/leads",
      actionLabel: "View Leads",
      previousPeriodUsed: 640,
      trend: weekly(120, 180, 210, 240),
    },
    {
      ...base,
      resource: "customers",
      label: "Customers",
      category: "CRM",
      unit: "records",
      used: 420,
      limit: lim("customers"),
      reset: "never",
      resetDate: undefined,
      href: "/app/customers",
      actionLabel: "View Customers",
      previousPeriodUsed: 395,
    },
    {
      ...base,
      resource: "quotations",
      label: "Quotations",
      category: "Sales",
      unit: "records",
      used: 86,
      limit: null,
      href: "/app/quotations",
      actionLabel: "View Quotations",
      previousPeriodUsed: 71,
    },
    {
      ...base,
      resource: "orders",
      label: "Orders",
      category: "Sales",
      unit: "records",
      used: 154,
      limit: null,
      href: "/app/orders",
      actionLabel: "View Orders",
      previousPeriodUsed: 130,
    },
    {
      ...base,
      resource: "members",
      label: "Team Members",
      category: "Team",
      unit: "members",
      used: 4,
      limit: lim("members"),
      reset: "never",
      resetDate: undefined,
      href: "/app/team-management",
      actionLabel: "Manage Team",
      previousPeriodUsed: 3,
    },
    {
      ...base,
      resource: "ai_credits",
      label: "AI Credits",
      category: "AI",
      unit: "credits",
      used: 3420,
      limit: lim("ai_credits"),
      href: "/app/ai-assistant",
      actionLabel: "View AI Usage",
      previousPeriodUsed: 2800,
      breakdown: [
        { label: "AI Copilot", value: 1200, unit: "requests" },
        { label: "Lead Summaries", value: 430, unit: "generations" },
        { label: "Follow-up Generator", value: 210, unit: "generations" },
        { label: "AI Insights", value: 180, unit: "generations" },
        { label: "Other AI", value: 1400, unit: "credits" },
      ],
    },
    {
      ...base,
      resource: "automations",
      label: "Active Automations",
      category: "Automation",
      unit: "workflows",
      used: 32,
      limit: lim("automations"),
      reset: "never",
      resetDate: undefined,
      previousPeriodUsed: 28,
    },
    {
      ...base,
      resource: "storage",
      label: "Storage",
      category: "Storage",
      unit: "GB",
      used: 4.2,
      limit: lim("storage"),
      reset: "never",
      resetDate: undefined,
      previousPeriodUsed: 3.7,
      breakdown: [
        { label: "Documents", value: 2.1, unit: "GB" },
        { label: "Attachments", value: 1.4, unit: "GB" },
        { label: "Exports", value: 0.7, unit: "GB" },
      ],
    },
  ];
}

const devMock = {
  async getSnapshot(organizationId: string): Promise<BillingSnapshot> {
    await wait();
    const state = readState(organizationId);
    const plan =
      MOCK_PLANS.find((p) => p.id === state.subscription.planId) ??
      MOCK_PLANS[0]!;
    return {
      organizationId,
      plan,
      subscription: state.subscription,
      usage: mockUsage(state.subscription, plan),
    };
  },
  async listPlans() {
    await wait(300);
    return MOCK_PLANS;
  },
  async listInvoices(_organizationId?: string): Promise<BillingInvoice[]> {
    await wait(300);
    return [];
  },
  async listHistory(organizationId: string) {
    await wait(300);
    return readState(organizationId).history;
  },
  async getUsageHistory(
    _organizationId?: string,
  ): Promise<UsageHistoryPoint[]> {
    await wait(300);
    return [
      {
        period: "Aug 2026",
        values: {
          leads: 540,
          customers: 360,
          ai_credits: 2800,
          storage: 3.2,
          automations: 24,
        },
      },
      {
        period: "Sep 2026",
        values: {
          leads: 640,
          customers: 395,
          ai_credits: 3200,
          storage: 3.7,
          automations: 28,
        },
      },
      {
        period: "Oct 2026",
        values: {
          leads: 750,
          customers: 420,
          ai_credits: 3420,
          storage: 4.2,
          automations: 32,
        },
      },
    ];
  },
  async startTrial(organizationId: string) {
    await wait(700);
    const state = seedState(organizationId);
    state.history = [
      {
        id: crypto.randomUUID(),
        action: "Trial Started",
        newPlan: "Business",
        date: new Date().toISOString(),
        effectiveDate: new Date().toISOString(),
        status: "Completed",
      },
    ];
    writeState(organizationId, state);
    return state.subscription;
  },
  async previewPlanChange(
    organizationId: string,
    planId: string,
    interval: BillingInterval,
  ): Promise<PlanChangePreview> {
    await wait(350);
    const state = readState(organizationId);
    const current = MOCK_PLANS.find((p) => p.id === state.subscription.planId)!;
    const next = MOCK_PLANS.find((p) => p.id === planId)!;
    const usage = mockUsage(state.subscription, current);
    const order = MOCK_PLANS.map((p) => p.id);
    const direction =
      planId === current.id
        ? "same"
        : order.indexOf(planId) > order.indexOf(current.id)
          ? "upgrade"
          : "downgrade";
    const limitChanges = next.limits.map((l) => ({
      resource: l.resource,
      label: usage.find((u) => u.resource === l.resource)?.label ?? l.resource,
      from:
        current.limits.find((c) => c.resource === l.resource)?.limit ?? null,
      to: l.limit,
    }));
    const exceeding = next.limits.flatMap((l) => {
      const u = usage.find((x) => x.resource === l.resource);
      return u && l.limit !== null && u.used > l.limit
        ? [{ label: u.label, used: u.used, newLimit: l.limit }]
        : [];
    });
    return {
      currentPlan: current.name,
      newPlan: next.name,
      interval,
      price: next.prices[interval] ?? 0,
      currency: next.currency,
      effective: direction === "upgrade" ? "Immediately" : "Next billing cycle",
      direction,
      limitChanges,
      exceeding,
      requiresCheckout: direction === "upgrade" && !next.customPricing,
    };
  },
  async changePlan(
    organizationId: string,
    planId: string,
    interval: BillingInterval,
  ) {
    await wait(900);
    const state = readState(organizationId);
    const prev = MOCK_PLANS.find((p) => p.id === state.subscription.planId)!;
    const next = MOCK_PLANS.find((p) => p.id === planId)!;
    state.subscription = {
      ...state.subscription,
      planId,
      interval,
      status: "ACTIVE",
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: iso(30),
      renewalDate: iso(30),
      cancelAtPeriodEnd: false,
      paymentRequired: true,
    };
    state.history = [
      {
        id: crypto.randomUUID(),
        action: "Plan Changed",
        previousPlan: prev.name,
        newPlan: next.name,
        date: new Date().toISOString(),
        effectiveDate: new Date().toISOString(),
        status: "Completed",
      },
      ...state.history,
    ];
    writeState(organizationId, state);
    return state.subscription;
  },
  async cancel(organizationId: string) {
    await wait(700);
    const state = readState(organizationId);
    state.subscription = {
      ...state.subscription,
      cancelAtPeriodEnd: true,
      cancelledAt: new Date().toISOString(),
    };
    state.history = [
      {
        id: crypto.randomUUID(),
        action: "Cancellation Scheduled",
        date: new Date().toISOString(),
        effectiveDate: state.subscription.currentPeriodEnd,
        status: "Scheduled",
      },
      ...state.history,
    ];
    writeState(organizationId, state);
    return state.subscription;
  },
  async resume(organizationId: string) {
    await wait(700);
    const state = readState(organizationId);
    state.subscription = {
      ...state.subscription,
      cancelAtPeriodEnd: false,
      cancelledAt: undefined,
    };
    state.history = [
      {
        id: crypto.randomUUID(),
        action: "Subscription Resumed",
        date: new Date().toISOString(),
        effectiveDate: new Date().toISOString(),
        status: "Completed",
      },
      ...state.history,
    ];
    writeState(organizationId, state);
    return state.subscription;
  },
};
