// My Workspace / My Performance / AI Recommendations — derived data layer.
//
// IMPORTANT: This file does NOT introduce new source-of-truth data. It only
// reads + filters + aggregates the existing per-module mock data (leads,
// customers, pipeline, quotations, orders, payments, follow-ups, tasks,
// requirements, repeat orders, team) that already powers My Leads, My
// Customers, My Pipeline, My Quotations, My Orders, My Payment Follow-ups,
// My Follow-ups and My Tasks. Nothing here talks to a backend/API — it is a
// UI-only aggregation layer, same spirit as `orderKpis()` / `paymentKpis()`
// / `computePipelineKpis()` in the other *-data.ts files.

import type { CurrentUser } from "@/lib/current-user";
import { team } from "@/lib/crm-data";
import {
  customerRows,
  parseRevenueToLakh,
  type CustomerRow,
} from "@/lib/customers-data";
import { leads, type Lead } from "@/lib/leads-data";
import {
  lostDeals,
  pipelineDeals,
  stageOrder,
  type PipelineDeal,
} from "@/lib/pipeline-data";
import {
  quotationsData,
  quotationGrandTotal,
  type Quotation,
  type QuotationStatus,
} from "@/lib/quotations-data";
import { ordersData, type Order } from "@/lib/orders-data";
import {
  paymentFollowUps,
  formatINRCompact,
  type PaymentFollowUp,
} from "@/lib/payments-data";
import { followUpList, type FollowUp } from "@/lib/followups-data";
import { taskList, TODAY_ISO, type Task } from "@/lib/tasks-data";
import { requirements, type Requirement } from "@/lib/requirements-data";
import {
  repeatOrderOpportunities,
  type RepeatOrderOpportunity,
} from "@/lib/repeat-orders-data";

// ---------------------------------------------------------------------------
// Scope helpers — "my" data for the logged-in user (owner/manager see team-wide)
// ---------------------------------------------------------------------------

function isScopedToUser(user: CurrentUser) {
  return user.role === "sales-executive";
}

// Payment Follow-up module's mock "today" reference date (matches the
// hardcoded value already used by `paymentKpis()` in payments-data.ts).
const PAYMENT_TODAY = "06 Sep 2026";
const isPaymentDueToday = (p: PaymentFollowUp) =>
  p.paymentStatus !== "Paid" && p.dueDate === PAYMENT_TODAY;

export function myLeads(user: CurrentUser): Lead[] {
  return isScopedToUser(user)
    ? leads.filter((l) => l.owner === user.name)
    : leads;
}

export function myCustomers(user: CurrentUser): CustomerRow[] {
  return isScopedToUser(user)
    ? customerRows.filter((c) => c.owner === user.name)
    : customerRows;
}

export function myDeals(user: CurrentUser): PipelineDeal[] {
  return isScopedToUser(user)
    ? pipelineDeals.filter((d) => d.owner === user.name)
    : pipelineDeals;
}

export function myQuotations(user: CurrentUser): Quotation[] {
  return isScopedToUser(user)
    ? quotationsData.filter((q) => q.owner === user.name)
    : quotationsData;
}

export function myOrdersList(user: CurrentUser): Order[] {
  return isScopedToUser(user)
    ? ordersData.filter((o) => o.salespersonName === user.name)
    : ordersData;
}

export function myPayments(user: CurrentUser): PaymentFollowUp[] {
  return isScopedToUser(user)
    ? paymentFollowUps.filter((p) => p.salespersonName === user.name)
    : paymentFollowUps;
}

export function myFollowUps(user: CurrentUser): FollowUp[] {
  return isScopedToUser(user)
    ? followUpList.filter((f) => f.owner === user.name)
    : followUpList;
}

export function myTasks(user: CurrentUser): Task[] {
  return isScopedToUser(user)
    ? taskList.filter((t) => t.assignedTo === user.name)
    : taskList;
}

export function myRequirements(user: CurrentUser): Requirement[] {
  return isScopedToUser(user)
    ? requirements.filter((r) => r.salespersonName === user.name)
    : requirements;
}

export function myRepeatOrders(user: CurrentUser): RepeatOrderOpportunity[] {
  return isScopedToUser(user)
    ? repeatOrderOpportunities.filter((o) => o.salespersonName === user.name)
    : repeatOrderOpportunities;
}

/** The team.ts row for the logged-in Sales Executive (used for My Performance). */
export function myTeamRecord(user: CurrentUser) {
  return team.find((m) => m.id === user.id || m.name === user.name) ?? null;
}

// ---------------------------------------------------------------------------
// Section 5 — Today's Summary (KPI strip)
// ---------------------------------------------------------------------------

export function workspaceSummaryKpis(user: CurrentUser) {
  const leadsRows = myLeads(user);
  const customersRows = myCustomers(user);
  const dealsRows = myDeals(user).filter((d) => d.stage !== "Won");
  const quotationsRows = myQuotations(user).filter(
    (q) =>
      !["Rejected", "Expired", "Cancelled", "Converted"].includes(q.status),
  );
  const ordersRows = myOrdersList(user).filter((o) => o.status !== "Cancelled");
  const paymentsRows = myPayments(user).filter(
    (p) => p.paymentStatus !== "Paid",
  );

  return {
    leads: leadsRows.length,
    customers: customersRows.length,
    pipelineOpen: dealsRows.length,
    pipelineValue: dealsRows.reduce((s, d) => s + d.value, 0),
    quotationsOpen: quotationsRows.length,
    quotationsValue: quotationsRows.reduce(
      (s, q) => s + quotationGrandTotal(q),
      0,
    ),
    ordersOpen: ordersRows.length,
    ordersValue: ordersRows.reduce((s, o) => s + o.orderTotal, 0),
    outstanding: paymentsRows.reduce(
      (s, p) => s + (p.orderTotal - p.paidAmount),
      0,
    ),
    outstandingCount: paymentsRows.length,
  };
}

// ---------------------------------------------------------------------------
// Section 6/7 — Today's Actions (priority-ranked action feed)
// ---------------------------------------------------------------------------

export type ActionPriority = "High" | "Medium" | "Low";

export type WorkspaceAction = {
  id: string;
  kind: "follow-up" | "payment" | "lead" | "quotation" | "task" | "reorder";
  title: string;
  customer: string;
  reason: string;
  due: string;
  priority: ActionPriority;
  actionLabel: string;
  to: string;
  search?: Record<string, string>;
  params?: Record<string, string>;
};

export function todaysActions(user: CurrentUser): WorkspaceAction[] {
  const actions: WorkspaceAction[] = [];

  // 1. Overdue follow-ups (highest priority)
  for (const f of myFollowUps(user).filter((f) => f.status === "overdue")) {
    actions.push({
      id: `followup-${f.id}`,
      kind: "follow-up",
      title: `${f.company} — follow-up overdue`,
      customer: f.company,
      reason: f.daysOverdue
        ? `${f.type} follow-up overdue by ${f.daysOverdue} day${f.daysOverdue > 1 ? "s" : ""}`
        : `${f.type} follow-up is overdue`,
      due: f.due,
      priority: "High",
      actionLabel: "Follow Up",
      to: "/app/follow-ups",
      search: { filter: "overdue" },
    });
  }

  // 2. Payments due / overdue
  for (const p of myPayments(user).filter(
    (p) => p.paymentStatus === "Overdue" || isPaymentDueToday(p),
  )) {
    const pending = p.orderTotal - p.paidAmount;
    actions.push({
      id: `payment-${p.id}`,
      kind: "payment",
      title: `${p.customerName} — payment ${p.paymentStatus === "Overdue" ? "overdue" : "due today"}`,
      customer: p.customerName,
      reason: `${formatINRCompact(pending)} pending on order ${p.orderNumber}`,
      due: p.dueDate,
      priority: p.paymentStatus === "Overdue" ? "High" : "Medium",
      actionLabel: "View Payment",
      to: "/app/payment-followups",
      search: { payment: p.id },
    });
  }

  // 3. Hot / high-score leads with no follow-up scheduled
  for (const l of myLeads(user).filter(
    (l) => l.score !== null && l.score >= 80 && !l.nextFollowUp,
  )) {
    actions.push({
      id: `lead-${l.id}`,
      kind: "lead",
      title: `${l.company} — high-priority lead`,
      customer: l.company,
      reason: `Score ${l.score}/100, no follow-up scheduled yet`,
      due: "Not scheduled",
      priority: "High",
      actionLabel: "View Lead",
      to: "/app/leads",
      search: { q: l.id },
    });
  }

  // 4. Quotations sitting idle waiting for a response
  for (const q of myQuotations(user).filter(
    (q) => q.status === "Sent" || q.status === "Viewed",
  )) {
    actions.push({
      id: `quotation-${q.id}`,
      kind: "quotation",
      title: `${q.company} — quotation waiting for follow-up`,
      customer: q.company,
      reason: `Quotation ${q.id} has been ${q.status.toLowerCase()} since ${q.issueDate}`,
      due: q.validUntil ? `Valid until ${q.validUntil}` : "—",
      priority: "Medium",
      actionLabel: "Follow Up",
      to: "/app/quotations",
      search: { quotation: q.id },
    });
  }

  // 5. Tasks due today
  for (const t of myTasks(user).filter(
    (t) =>
      t.dueDateISO === TODAY_ISO &&
      t.status !== "Completed" &&
      t.status !== "Cancelled",
  )) {
    actions.push({
      id: `task-${t.id}`,
      kind: "task",
      title: t.title,
      customer: t.relatedName || "—",
      reason: `${t.taskType} task due today`,
      due: t.due,
      priority: t.priority,
      actionLabel: "Complete Task",
      to: "/app/tasks",
      search: { filter: "today" },
    });
  }

  // 6. Repeat-order opportunities that are due now
  for (const r of myRepeatOrders(user).filter(
    (r) => r.status === "Due" || r.status === "Overdue",
  )) {
    actions.push({
      id: `reorder-${r.id}`,
      kind: "reorder",
      title: `${r.customerName} — repeat order expected`,
      customer: r.customerName,
      reason: `Usually reorders ${r.lastProductName} every ~${r.averageOrderCycleDays} days`,
      due: r.expectedReorderDate,
      priority: r.priority,
      actionLabel: "View Opportunity",
      to: "/app/repeat-orders",
      search: { reorder: r.id },
    });
  }

  const rank: Record<ActionPriority, number> = { High: 0, Medium: 1, Low: 2 };
  return actions
    .sort((a, b) => rank[a.priority] - rank[b.priority])
    .slice(0, 12);
}

// ---------------------------------------------------------------------------
// Section 9 — Pipeline Snapshot
// ---------------------------------------------------------------------------

export function pipelineSnapshot(user: CurrentUser) {
  const rows = myDeals(user);
  return stageOrder.map((stage) => {
    const inStage = rows.filter((d) => d.stage === stage);
    return {
      stage,
      count: inStage.length,
      value: inStage.reduce((s, d) => s + d.value, 0),
    };
  });
}

// ---------------------------------------------------------------------------
// Section 10 — Quotation Snapshot
// ---------------------------------------------------------------------------

const quotationSnapshotGroups: {
  label: string;
  statuses: QuotationStatus[];
}[] = [
  { label: "Draft", statuses: ["Draft", "Pending Approval", "Approved"] },
  { label: "Sent", statuses: ["Sent", "Viewed"] },
  { label: "Negotiation", statuses: ["Negotiation"] },
  { label: "Accepted", statuses: ["Accepted"] },
  {
    label: "Waiting for Follow-up",
    statuses: ["Sent", "Viewed", "Negotiation"],
  },
];

export function quotationSnapshot(user: CurrentUser) {
  const rows = myQuotations(user);
  return quotationSnapshotGroups.map((group) => {
    const matched = rows.filter((q) => group.statuses.includes(q.status));
    return {
      label: group.label,
      count: matched.length,
      value: matched.reduce((s, q) => s + quotationGrandTotal(q), 0),
    };
  });
}

// ---------------------------------------------------------------------------
// Section 11 — Order Snapshot
// ---------------------------------------------------------------------------

export function orderSnapshot(user: CurrentUser) {
  const rows = myOrdersList(user);
  const recent = [...rows]
    .sort((a, b) => Date.parse(b.orderDate) - Date.parse(a.orderDate))
    .slice(0, 5);
  const pending = rows.filter(
    (o) => o.status === "Processing" || o.status === "Shipped",
  );
  const completed = rows.filter((o) => o.status === "Delivered");
  const totalValue = rows
    .filter((o) => o.status !== "Cancelled")
    .reduce((s, o) => s + o.orderTotal, 0);

  return {
    recent,
    pendingCount: pending.length,
    completedCount: completed.length,
    totalValue,
  };
}

// ---------------------------------------------------------------------------
// Section 12 — Payment Snapshot
// ---------------------------------------------------------------------------

export function paymentSnapshot(user: CurrentUser) {
  const rows = myPayments(user).filter((p) => p.paymentStatus !== "Paid");
  const pendingAmount = (p: PaymentFollowUp) => p.orderTotal - p.paidAmount;

  const overdue = rows.filter((p) => p.paymentStatus === "Overdue");
  const dueToday = rows.filter((p) => isPaymentDueToday(p));
  const upcoming = rows.filter(
    (p) => p.paymentStatus !== "Overdue" && !isPaymentDueToday(p),
  );

  return {
    outstanding: rows.reduce((s, p) => s + pendingAmount(p), 0),
    dueTodayAmount: dueToday.reduce((s, p) => s + pendingAmount(p), 0),
    dueTodayCount: dueToday.length,
    overdueAmount: overdue.reduce((s, p) => s + pendingAmount(p), 0),
    overdueCount: overdue.length,
    upcomingAmount: upcoming.reduce((s, p) => s + pendingAmount(p), 0),
    upcomingCount: upcoming.length,
  };
}

// ---------------------------------------------------------------------------
// Section 13 — Customers Needing Attention
// ---------------------------------------------------------------------------

export type CustomerAttentionReason =
  | "Follow-up overdue"
  | "Payment overdue"
  | "Quotation waiting"
  | "Repeat order expected"
  | "Inactive customer"
  | "High-value opportunity";

export type CustomerAttentionItem = {
  customer: CustomerRow;
  reasons: CustomerAttentionReason[];
};

export function customersNeedingAttention(
  user: CurrentUser,
): CustomerAttentionItem[] {
  const rows = myCustomers(user);
  const overduePaymentCustomers = new Set(
    myPayments(user)
      .filter((p) => p.paymentStatus === "Overdue")
      .map((p) => p.customerName),
  );
  const waitingQuotationCustomers = new Set(
    myQuotations(user)
      .filter((q) => q.status === "Sent" || q.status === "Viewed")
      .map((q) => q.company),
  );
  const reorderDueCustomers = new Set(
    myRepeatOrders(user)
      .filter((r) => r.status === "Due" || r.status === "Overdue")
      .map((r) => r.customerName),
  );

  const items: CustomerAttentionItem[] = rows.map((c) => {
    const reasons: CustomerAttentionReason[] = [];
    if (c.nextFollowUp.toLowerCase().includes("overdue"))
      reasons.push("Follow-up overdue");
    if (overduePaymentCustomers.has(c.company)) reasons.push("Payment overdue");
    if (waitingQuotationCustomers.has(c.company))
      reasons.push("Quotation waiting");
    if (reorderDueCustomers.has(c.company))
      reasons.push("Repeat order expected");
    if (c.health === "Inactive") reasons.push("Inactive customer");
    if (c.health === "Healthy" && c.orders >= 15)
      reasons.push("High-value opportunity");
    return { customer: c, reasons };
  });

  return items
    .filter((i) => i.reasons.length > 0)
    .sort((a, b) => b.reasons.length - a.reasons.length);
}

// ---------------------------------------------------------------------------
// Section 19 — Priority Opportunities
// ---------------------------------------------------------------------------

export function priorityOpportunities(user: CurrentUser) {
  return [...myDeals(user)]
    .filter((d) => d.stage !== "Won")
    .sort((a, b) => b.value * b.probability - a.value * a.probability)
    .slice(0, 5);
}

// ---------------------------------------------------------------------------
// Section 20 — Recent Sales
// ---------------------------------------------------------------------------

export function recentSales(user: CurrentUser) {
  const quotationsRows = [...myQuotations(user)]
    .sort((a, b) => Date.parse(b.issueDate) - Date.parse(a.issueDate))
    .slice(0, 5);
  const ordersRows = [...myOrdersList(user)]
    .sort((a, b) => Date.parse(b.orderDate) - Date.parse(a.orderDate))
    .slice(0, 5);
  return { quotationsRows, ordersRows };
}

// ---------------------------------------------------------------------------
// AI Recommendations (mock/UI-only — no model, no backend)
// ---------------------------------------------------------------------------

export type RecommendationType =
  | "attention"
  | "overdue"
  | "quotation"
  | "reorder"
  | "opportunity"
  | "payment"
  | "pipeline";

export type Recommendation = {
  id: string;
  type: RecommendationType;
  priority: ActionPriority;
  title: string;
  reason: string;
  customer: string;
  actionLabel: string;
  to: string;
  search?: Record<string, string>;
  params?: Record<string, string>;
};

export function aiRecommendations(user: CurrentUser): Recommendation[] {
  const recs: Recommendation[] = [];

  for (const c of customersNeedingAttention(user).slice(0, 3)) {
    recs.push({
      id: `attn-${c.customer.id}`,
      type: "attention",
      priority: c.reasons.length >= 2 ? "High" : "Medium",
      title: `${c.customer.company} may need attention`,
      reason: c.reasons.join(" · "),
      customer: c.customer.company,
      actionLabel: "View Customer",
      to: "/app/customers/$id",
      params: { id: c.customer.slug },
    });
  }

  for (const f of myFollowUps(user)
    .filter((f) => f.status === "overdue")
    .slice(0, 3)) {
    recs.push({
      id: `overdue-${f.id}`,
      type: "overdue",
      priority: "High",
      title: `${f.company} follow-up is overdue`,
      reason: f.daysOverdue
        ? `Overdue by ${f.daysOverdue} day${f.daysOverdue > 1 ? "s" : ""} — customer may lose interest.`
        : "This follow-up is overdue.",
      customer: f.company,
      actionLabel: "Follow Up",
      to: "/app/follow-ups",
      search: { filter: "overdue" },
    });
  }

  for (const q of myQuotations(user)
    .filter((q) => q.status === "Sent" || q.status === "Viewed")
    .slice(0, 3)) {
    recs.push({
      id: `quote-${q.id}`,
      type: "quotation",
      priority: "Medium",
      title: `${q.company} quotation waiting for follow-up`,
      reason: `Quotation ${q.id} sent on ${q.issueDate} with no decision yet.`,
      customer: q.company,
      actionLabel: "View Quotation",
      to: "/app/quotations",
      search: { quotation: q.id },
    });
  }

  for (const r of myRepeatOrders(user)
    .filter((r) => r.status === "Due" || r.status === "Overdue")
    .slice(0, 2)) {
    recs.push({
      id: `reorder-${r.id}`,
      type: "reorder",
      priority: r.priority,
      title: `${r.customerName} may be ready for another order`,
      reason: `Typically reorders ${r.lastProductName} every ~${r.averageOrderCycleDays} days — due now.`,
      customer: r.customerName,
      actionLabel: "View Opportunity",
      to: "/app/repeat-orders",
      search: { reorder: r.id },
    });
  }

  for (const d of priorityOpportunities(user).slice(0, 2)) {
    recs.push({
      id: `opp-${d.id}`,
      type: "opportunity",
      priority: "High",
      title: `${d.customer} is a high-priority opportunity`,
      reason: `${d.valueLabel} at ${d.probability}% probability, stage: ${d.stage}.`,
      customer: d.customer,
      actionLabel: "View Deal",
      to: "/app/pipeline",
      search: { deal: d.id },
    });
  }

  for (const p of myPayments(user)
    .filter((p) => isPaymentDueToday(p))
    .slice(0, 2)) {
    recs.push({
      id: `pay-${p.id}`,
      type: "payment",
      priority: "Medium",
      title: `Payment follow-up due for ${p.customerName}`,
      reason: `${formatINRCompact(p.orderTotal - p.paidAmount)} pending on order ${p.orderNumber}.`,
      customer: p.customerName,
      actionLabel: "View Payment",
      to: "/app/payment-followups",
      search: { payment: p.id },
    });
  }

  for (const d of myDeals(user)
    .filter((d) => d.health === "At Risk" || d.health === "Needs Attention")
    .slice(0, 2)) {
    recs.push({
      id: `pipe-${d.id}`,
      type: "pipeline",
      priority: d.health === "At Risk" ? "High" : "Medium",
      title: `${d.customer} pipeline opportunity needs action`,
      reason: `Deal is marked "${d.health}" — last activity: ${d.lastActivity}.`,
      customer: d.customer,
      actionLabel: "View Deal",
      to: "/app/pipeline",
      search: { deal: d.id },
    });
  }

  const rank: Record<ActionPriority, number> = { High: 0, Medium: 1, Low: 2 };
  return recs.sort((a, b) => rank[a.priority] - rank[b.priority]).slice(0, 8);
}

// ---------------------------------------------------------------------------
// My Performance (Phase 4) — reuses the same per-module mock data + the
// existing `team` row (revenue/target/leads/followUps/tasks/conversion/trend)
// that already powers the Dashboard's Team Performance widget.
// ---------------------------------------------------------------------------

export function performanceSummary(user: CurrentUser) {
  const record = myTeamRecord(user);
  const achievementPct = record?.target ?? 0;
  const achievedLakh = record ? parseRevenueToLakh(record.revenue) : 0;
  // Derive an implied monthly target from achieved revenue ÷ achievement%,
  // so Target vs Achievement stays internally consistent with existing
  // per-person mock data instead of inventing a second, unrelated number.
  const targetLakh =
    achievementPct > 0
      ? Math.round((achievedLakh / achievementPct) * 100)
      : achievedLakh;

  const dealsRows = myDeals(user);
  const won = dealsRows.filter(
    (d) => d.stage === "Won" || d.health === "Won",
  ).length;
  const lost = isScopedToUser(user)
    ? lostDeals.filter((d) => d.owner === user.name).length
    : lostDeals.length;

  return {
    targetLakh,
    achievedLakh,
    achievementPct,
    revenueLabel: record?.revenue ?? formatINRCompact(achievedLakh * 100_000),
    wonDeals: won,
    lostDeals: lost,
    conversionRate: record?.conversion ?? "—",
    trend: record?.trend ?? [],
  };
}

export function leadPerformance(user: CurrentUser) {
  const rows = myLeads(user);
  const contacted = rows.filter((l) => l.status !== "New").length;
  const qualified = rows.filter((l) =>
    ["Qualified", "Quotation Sent", "Negotiation", "Converted"].includes(
      l.status,
    ),
  ).length;
  const converted = rows.filter((l) => l.status === "Converted").length;

  return {
    generated: rows.length,
    contacted,
    qualified,
    converted,
    conversionRate:
      rows.length > 0 ? Math.round((converted / rows.length) * 1000) / 10 : 0,
  };
}

export function quotationPerformance(user: CurrentUser) {
  const rows = myQuotations(user);
  const sent = rows.filter((q) =>
    [
      "Sent",
      "Viewed",
      "Negotiation",
      "Accepted",
      "Rejected",
      "Converted",
    ].includes(q.status),
  ).length;
  const accepted = rows.filter(
    (q) => q.status === "Accepted" || q.status === "Converted",
  ).length;
  const rejected = rows.filter((q) =>
    ["Rejected", "Expired", "Cancelled"].includes(q.status),
  ).length;

  return {
    created: rows.length,
    sent,
    accepted,
    rejected,
    conversionRate:
      rows.length > 0 ? Math.round((accepted / rows.length) * 1000) / 10 : 0,
  };
}

export function orderPerformance(user: CurrentUser) {
  const rows = myOrdersList(user);
  const completed = rows.filter((o) => o.status === "Delivered").length;
  const pending = rows.filter(
    (o) => o.status === "Processing" || o.status === "Shipped",
  ).length;
  const value = rows
    .filter((o) => o.status !== "Cancelled")
    .reduce((s, o) => s + o.orderTotal, 0);

  return { orders: rows.length, value, completed, pending };
}

export function followUpPerformance(user: CurrentUser) {
  const rows = myFollowUps(user);
  const completed = rows.filter((f) => f.status === "completed").length;
  const overdue = rows.filter((f) => f.status === "overdue").length;

  return {
    completed,
    overdue,
    completionRate:
      rows.length > 0 ? Math.round((completed / rows.length) * 1000) / 10 : 0,
  };
}

export function taskPerformance(user: CurrentUser) {
  const rows = myTasks(user);
  const completed = rows.filter((t) => t.status === "Completed").length;
  const pending = rows.filter(
    (t) => t.status === "Pending" || t.status === "In Progress",
  ).length;
  const overdue = rows.filter((t) => t.status === "Overdue").length;

  return {
    completed,
    pending,
    overdue,
    completionRate:
      rows.length > 0 ? Math.round((completed / rows.length) * 1000) / 10 : 0,
  };
}

export function repeatOrderPerformance(user: CurrentUser) {
  const rows = myRepeatOrders(user);
  const repeatCustomers = new Set(
    rows.filter((r) => r.previousOrderCount > 0).map((r) => r.customerName),
  );
  const converted = rows.filter((r) => r.status === "Converted");

  return {
    repeatOrders: converted.length,
    repeatOrderValue: converted.reduce((s, r) => s + r.lastOrderValue, 0),
    repeatCustomers: repeatCustomers.size,
  };
}
