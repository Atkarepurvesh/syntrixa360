// Inbox — Part 3: Customer Context & CRM / Sales Integration
//
// This module is the "matching + aggregation" layer described in the spec:
//   CONVERSATION -> CUSTOMER -> REQUIREMENT -> DEAL -> QUOTATION -> ACTIVITY -> FOLLOW-UP
//
// It never invents data: every field here is read from the CRM modules that
// already exist (customers-data, leads-data, pipeline-data, followups-data,
// tasks-data, calendar-data, crm-data). A conversation is linked to a
// customer purely by company name, mirroring how the rest of the app
// (Follow Ups, Pipeline, Calendar) already cross-links records — see
// `getCustomerRowByCompany` in customers-data.ts.

import {
  customerRows,
  getCustomerRowByCompany,
  resolveCustomerSlug,
  type CustomerRow,
} from "@/lib/customers-data";
import { leads as leadRecords, type Lead } from "@/lib/leads-data";
import { pipelineDeals, type PipelineDeal } from "@/lib/pipeline-data";
import { quotations as quotationRecords } from "@/lib/crm-data";
import { followUpList, type FollowUp } from "@/lib/followups-data";
import { taskList, type Task } from "@/lib/tasks-data";
import { eventList, type CalendarEvent } from "@/lib/calendar-data";

export type MatchStatus = "exact" | "possible" | "none";

export type Requirement = {
  product: string;
  quantity: string;
  unit?: string;
  destination?: string;
  incoterm?: string;
  paymentTerms?: string;
  deliveryTimeline?: string;
  notes?: string;
  source: "lead" | "deal" | "manual";
};

export type TimelineEvent = {
  id: string;
  kind: "message" | "activity" | "deal" | "quotation" | "followup" | "meeting" | "system";
  title: string;
  date: string;
  meta?: string;
};

export type CustomerContext = {
  matchStatus: MatchStatus;
  company: string;
  customer?: CustomerRow | undefined;
  lead?: Lead | undefined;
  deals: PipelineDeal[];
  quotations: (typeof quotationRecords)[number][];
  followUps: FollowUp[];
  tasks: Task[];
  events: CalendarEvent[];
  requirement?: Requirement | undefined;
  timeline: TimelineEvent[];
};

/** Section 3/4 — identify + match a conversation's company against CRM records. */
export function matchCompany(companyOrIdentity: string): MatchStatus {
  const customer = getCustomerRowByCompany(companyOrIdentity);
  if (customer) return "exact";
  const looksLikeIdentity =
    /^\+?[\d\s()-]{6,}$/.test(companyOrIdentity) || companyOrIdentity.includes("@");
  if (looksLikeIdentity) return "none";
  // Free-text company name with no exact customer row but present elsewhere (lead only, etc.)
  const inLeads = leadRecords.some(
    (l) => l.company.toLowerCase() === companyOrIdentity.toLowerCase(),
  );
  return inLeads ? "possible" : "none";
}

/** Section 82 — possible-duplicate lookup used before creating a new Lead/Customer. */
export function findPossibleDuplicates(query: string): CustomerRow[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return customerRows
    .filter(
      (c) =>
        c.company.toLowerCase().includes(q) ||
        c.phone.replace(/\s/g, "").includes(q.replace(/\s/g, "")) ||
        c.email.toLowerCase().includes(q),
    )
    .slice(0, 5);
}

/** Section 37/28 — derive the current structured requirement from Lead/Deal data. */
function deriveRequirement(lead?: Lead, deal?: PipelineDeal): Requirement | undefined {
  if (deal) {
    return {
      product: deal.product,
      quantity: deal.quantity,
      notes: deal.notes,
      source: "deal",
    };
  }
  if (lead?.requirement) {
    return {
      product: lead.requirement,
      quantity: lead.budget,
      source: "lead",
    };
  }
  return undefined;
}

/** Section 66/102 — build a single unified, newest-first timeline. */
function buildTimeline(ctx: Omit<CustomerContext, "timeline" | "requirement">): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  ctx.deals.forEach((d) => {
    events.push({
      id: `deal-${d.id}`,
      kind: "deal",
      title: `Deal ${d.id} — ${d.stage}`,
      date: d.closeDate,
      meta: d.valueLabel,
    });
    d.timeline
      .slice(0, 3)
      .forEach((t) =>
        events.push({ id: `deal-${d.id}-${t.id}`, kind: "deal", title: t.title, date: t.date }),
      );
  });

  ctx.quotations.forEach((q) => {
    events.push({
      id: `quote-${q.id}`,
      kind: "quotation",
      title: `Quotation ${q.id} — ${q.status}`,
      date: q.date,
      meta: q.value,
    });
  });

  ctx.followUps.forEach((f) => {
    events.push({
      id: `followup-${f.id}`,
      kind: "followup",
      title: `Follow-up (${f.type}) — ${f.status}`,
      date: f.due,
      meta: f.owner,
    });
  });

  ctx.tasks.forEach((t) => {
    events.push({
      id: `task-${t.id}`,
      kind: "activity",
      title: t.title,
      date: t.due,
      meta: t.status,
    });
  });

  ctx.events.forEach((e) => {
    events.push({
      id: `event-${e.id}`,
      kind: "meeting",
      title: e.title,
      date: `${e.dateISO} ${e.timeLabel}`,
      meta: e.status,
    });
  });

  return events;
}

/** Main aggregator — Section 1/76/77: everything the right sidebar needs, in one call. */
export function getCustomerContext(company: string): CustomerContext {
  const status = matchCompany(company);
  const customer = getCustomerRowByCompany(company);
  const lead = leadRecords.find((l) => l.company.toLowerCase() === company.toLowerCase());
  const deals = pipelineDeals.filter((d) => d.customer.toLowerCase() === company.toLowerCase());
  const quotations = quotationRecords.filter(
    (q) => q.company.toLowerCase() === company.toLowerCase(),
  );
  const followUps = followUpList.filter((f) => f.company.toLowerCase() === company.toLowerCase());
  const tasks = taskList.filter((t) => t.relatedName.toLowerCase() === company.toLowerCase());
  const events = eventList.filter(
    (e) => (e.company ?? e.customer ?? "").toLowerCase() === company.toLowerCase(),
  );

  const base = {
    matchStatus: status,
    company,
    customer,
    lead,
    deals,
    quotations,
    followUps,
    tasks,
    events,
  };
  const requirement = deriveRequirement(lead, deals[0]);
  const timeline = buildTimeline(base);

  return { ...base, requirement, timeline };
}

export function customerSlugFor(company: string): string {
  return resolveCustomerSlug(company);
}
