// Shared frontend-only CRM store (UI phase; replace with API queries/mutations later).
//
// One lead collection is the single source of truth. Dashboard KPIs, source counts,
// activity timelines and notifications are all derived from / written by the actions here.
// Follows the same useSyncExternalStore pattern as admin-store.ts.
import { useMemo, useSyncExternalStore } from "react";

import { notifications as seedNotifications } from "@/lib/crm-data";
import {
  leadSourceLabel,
  normalizeLeadSource,
  leadSourcesList,
  type CaptureMethod,
  type LeadSource,
} from "@/lib/lead-sources";
import { followUpState, isSameLocalDay } from "@/lib/lead-query";
import {
  leads as seedLeads,
  salesOwners,
  type ActivityItem,
  type Lead,
  type LeadPriority,
  type LeadStatus,
} from "@/lib/leads-data";

export type CrmNotification = {
  id: string;
  title: string;
  body: string;
  tone: "danger" | "success" | "info" | "warning";
  /** Display string kept for compatibility with the existing notifications page. */
  time: string;
  to: string;
  search: Record<string, string>;
  /** ISO timestamp; absent on seed fixtures. */
  createdAt?: string;
  read: boolean;
  /** Employee this alert is for; undefined = everyone. */
  recipient?: string;
  kind: "general" | "lead_created" | "lead_assigned" | "lead_status";
  leadId?: string;
};

export type CrmState = { leads: Lead[]; notifications: CrmNotification[] };

export type NewLeadInput = {
  name: string;
  source: LeadSource | string;
  captureMethod?: CaptureMethod;
  owner?: string;
  status?: LeadStatus;
  /** Optional follow-up; sets nextFollowUp on the lead plus a pending task. */
  followUp?: { date: string; time?: string; type?: string; note?: string };
} & Partial<
  Pick<
    Lead,
    | "company"
    | "contactPerson"
    | "mobile"
    | "whatsapp"
    | "email"
    | "website"
    | "industry"
    | "city"
    | "state"
    | "budget"
    | "requirement"
    | "tags"
    | "rating"
    | "priority"
    | "productInterest"
    | "estimatedRequirement"
    | "quantity"
    | "country"
  >
>;

/** Fields that must never be changed through updateLead (origin attribution, identity). */
const PROTECTED_FIELDS = [
  "id",
  "source",
  "captureMethod",
  "createdAt",
  "createdOn",
  "createdTime",
] as const;

export const UNASSIGNED_LABEL = "Unassigned";

export type FollowUpInput = {
  date: string;
  time?: string;
  type?: string;
  note?: string;
};

const EDITABLE_TEXT_FIELDS = {
  name: "Customer name",
  company: "Company",
  contactPerson: "Contact person",
  mobile: "Phone",
  whatsapp: "WhatsApp",
  email: "Email",
  website: "Website",
  industry: "Industry",
  city: "City",
  state: "State",
  budget: "Budget",
  requirement: "Inquiry",
  productInterest: "Product interest",
  estimatedRequirement: "Estimated requirement",
  quantity: "Quantity",
  country: "Country",
} as const;
type EditableTextField = keyof typeof EDITABLE_TEXT_FIELDS;

/** Supported edit-form fields. `source` is an audited correction; captureMethod can't be edited. */
export type LeadEditInput = Partial<Record<EditableTextField, string>> & {
  rating?: number;
  priority?: LeadPriority;
  source?: LeadSource | string;
  status?: LeadStatus;
  owner?: string;
  followUp?: FollowUpInput;
};

/** Minimal view of an Inbox conversation the store needs (the conversation itself lives in the Inbox UI). */
export type ConversationRef = {
  id: string;
  channel: "whatsapp" | "email" | "website";
  contact: string;
};
const CHANNEL_LABEL = {
  whatsapp: "WhatsApp",
  email: "Email",
  website: "Website",
} as const;

export type MutationResult = {
  lead: Lead;
  changed: boolean;
  changes: string[];
};

// ---- date helpers ---------------------------------------------------------------------
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const pad = (n: number) => String(n).padStart(2, "0");
function displayDate(d: Date) {
  return `${pad(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
function displayTime(d: Date) {
  const h = d.getHours();
  return `${pad(h % 12 === 0 ? 12 : h % 12)}:${pad(d.getMinutes())} ${h >= 12 ? "PM" : "AM"}`;
}
/** "2026-10-14" + "15:30" -> display strings used by Lead (e.g. "14 Oct 2026", "03:30 PM"). */
export function followUpDisplay(
  date: string,
  time?: string,
): { date: string; time: string | null } {
  const [y, m, d] = date.split("-").map(Number);
  const dd = new Date(y!, (m ?? 1) - 1, d ?? 1);
  let t: string | null = null;
  if (time && /^\d{2}:\d{2}$/.test(time)) {
    const [h, mi] = time.split(":").map(Number);
    dd.setHours(h!, mi!);
    t = displayTime(dd);
  }
  return { date: displayDate(dd), time: t };
}

// ---- pure derivations (usable by any page, and unit-tested) ---------------------------
export type SourceCount = {
  source: LeadSource;
  label: string;
  count: number;
  percent: number;
};

/** Counts per canonical source from the lead collection; zero-count sources omitted. */
export function computeSourceCounts(leads: Lead[]): SourceCount[] {
  const counts = new Map<LeadSource, number>();
  for (const l of leads) {
    // Defensive: a missing/unknown source is counted as "Other", never dropped from the total.
    const src = normalizeLeadSource(l.source);
    counts.set(src, (counts.get(src) ?? 0) + 1);
  }
  const total = leads.length;
  return leadSourcesList
    .filter((s) => counts.has(s))
    .map((s) => ({
      source: s,
      label: leadSourceLabel(s),
      count: counts.get(s)!,
      percent: total ? Math.round(((counts.get(s) ?? 0) / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * KPI definitions (single source for the Leads page cards, tabs and quick filters):
 *  - total: every lead in the (role-scoped) list
 *  - newLeads / qualified / converted: leads whose stored `status` equals New / Qualified / Converted
 *  - newToday: leads whose `createdAt` falls on the current local date
 *  - followUpsDueToday: leads whose next follow-up date is the current local date
 */
export type LeadKpis = {
  total: number;
  newLeads: number;
  qualified: number;
  converted: number;
  followUpsDueToday: number;
  newToday: number;
  byStatus: Partial<Record<LeadStatus, number>>;
  bySource: SourceCount[];
};

export function computeLeadKpis(
  leads: Lead[],
  now: Date = new Date(),
): LeadKpis {
  const byStatus: Partial<Record<LeadStatus, number>> = {};
  let newToday = 0;
  let followUpsDueToday = 0;
  for (const l of leads) {
    byStatus[l.status] = (byStatus[l.status] ?? 0) + 1;
    if (isSameLocalDay(new Date(l.createdAt), now)) newToday += 1;
    if (followUpState(l, now) === "today") followUpsDueToday += 1;
  }
  return {
    total: leads.length,
    newLeads: byStatus.New ?? 0,
    qualified: byStatus.Qualified ?? 0,
    converted: byStatus.Converted ?? 0,
    followUpsDueToday,
    newToday,
    byStatus,
    bySource: computeSourceCounts(leads),
  };
}

// ---- duplicate detection (warn only; never merges) --------------------------------------
/** Digits only, last 10 (drops +91 / 0 prefixes). Returns "" when too short to compare. */
export function normalizePhone(v: string | undefined | null): string {
  const d = (v ?? "").replace(/\D/g, "");
  return d.length >= 10 ? d.slice(-10) : "";
}
export const normalizeEmail = (v: string | undefined | null) =>
  (v ?? "").trim().toLowerCase();

export type DuplicateMatch = { lead: Lead; reasons: ("phone" | "email")[] };

export function findDuplicateLeads(
  leads: Lead[],
  probe: { mobile?: string; whatsapp?: string; email?: string },
  excludeId?: string,
): DuplicateMatch[] {
  const phones = [
    normalizePhone(probe.mobile),
    normalizePhone(probe.whatsapp),
  ].filter(Boolean);
  const email = normalizeEmail(probe.email);
  const out: DuplicateMatch[] = [];
  for (const lead of leads) {
    if (lead.id === excludeId) continue;
    const reasons: DuplicateMatch["reasons"] = [];
    const lp = [
      normalizePhone(lead.mobile),
      normalizePhone(lead.whatsapp),
    ].filter(Boolean);
    if (phones.some((p) => lp.includes(p))) reasons.push("phone");
    if (email && normalizeEmail(lead.email) === email) reasons.push("email");
    if (reasons.length) out.push({ lead, reasons });
  }
  return out;
}

// ---- store factory (a fresh instance per test; singleton exported below) --------------
// ---- notification selectors (pure) ---------------------------------------------------
/** A notification is visible to its recipient; one with no recipient is a broadcast for everyone. */
export const isVisibleTo = (n: CrmNotification, userName: string) =>
  n.recipient === undefined || n.recipient === userName;

export const notificationsForUser = (
  list: CrmNotification[],
  userName: string,
): CrmNotification[] => list.filter((n) => isVisibleTo(n, userName));

export const countUnread = (list: CrmNotification[]) =>
  list.filter((n) => !n.read).length;

export const filterNotifications = (
  list: CrmNotification[],
  tab: "all" | "unread",
) => (tab === "unread" ? list.filter((n) => !n.read) : list);

/** "Just now" / "5m ago" / "3h ago" / "2d ago" from the real timestamp; seed fixtures keep their text. */
export function notificationTime(n: CrmNotification, now: Date = new Date()) {
  const t = n.createdAt ? new Date(n.createdAt).getTime() : NaN;
  if (Number.isNaN(t)) return n.time;
  const mins = Math.max(0, Math.floor((now.getTime() - t) / 60_000));
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return hrs < 24 ? `${hrs}h ago` : `${Math.floor(hrs / 24)}d ago`;
}

export function createCrmStore(
  initial?: Partial<CrmState>,
  clock: () => Date = () => new Date(),
  opts: { members?: readonly string[] } = {},
) {
  const members = opts.members ?? salesOwners;
  const seedN: CrmNotification[] = seedNotifications.map((n) => ({
    ...n,
    to: n.to.startsWith("/app") ? n.to : `/app${n.to}`,
    search: { ...n.search },
    read: false,
    kind: "general" as const,
  }));
  let state: CrmState = {
    leads: initial?.leads ?? seedLeads,
    notifications: initial?.notifications ?? seedN,
  };
  const subs = new Set<() => void>();
  const set = (p: Partial<CrmState>) => {
    state = { ...state, ...p };
    subs.forEach((f) => f());
  };
  let seq = 0;
  const uid = (prefix: string) =>
    `${prefix}-${clock().getTime().toString(36)}-${(seq++).toString(36)}`;

  function nextLeadId(): string {
    const max = state.leads.reduce(
      (m, l) => Math.max(m, Number(l.id.replace(/\D/g, "")) || 0),
      0,
    );
    return `L-${max + 1}`;
  }
  function activity(
    type: ActivityItem["type"],
    description: string,
    user: string,
  ): ActivityItem {
    const now = clock();
    return {
      id: uid("act"),
      type,
      description,
      user,
      date: displayDate(now),
      time: displayTime(now),
    };
  }
  function notify(
    n: Omit<
      CrmNotification,
      "id" | "time" | "createdAt" | "read" | "search"
    > & { search?: Record<string, string> },
  ) {
    const item: CrmNotification = {
      ...n,
      id: uid("N"),
      time: "Just now",
      createdAt: clock().toISOString(),
      read: false,
      search: n.search ?? {},
    };
    set({ notifications: [item, ...state.notifications] });
    return item;
  }
  /** Replace one lead (stamping updatedAt) and prepend any new activity events. */
  function commit(next: Lead, events: ActivityItem[]): Lead {
    const stamped: Lead = {
      ...next,
      updatedAt: clock().toISOString(),
      activity: [...events.slice().reverse(), ...next.activity],
    };
    set({ leads: state.leads.map((l) => (l.id === stamped.id ? stamped : l)) });
    return stamped;
  }
  const who = (actor: string | undefined, lead: Lead) =>
    actor?.trim() || lead.owner || "System";
  const ownerLabel = (o: string) => o || UNASSIGNED_LABEL;

  function ownerEvent(lead: Lead, newOwner: string, actor: string | undefined) {
    const by = actor?.trim() ? ` by ${actor.trim()}` : "";
    return activity(
      "owner-changed",
      lead.owner
        ? `Reassigned from ${lead.owner} to ${newOwner}${by}`
        : `Assigned to ${newOwner}${by}`,
      who(actor, lead),
    );
  }
  function ownerNotifications(lead: Lead, prevOwner: string, newOwner: string) {
    notify({
      title: "Lead assigned to you",
      body: `${lead.name} was assigned to ${newOwner}.`,
      tone: "info",
      to: "/app/leads",
      search: { q: lead.id },
      recipient: newOwner,
      kind: "lead_assigned",
      leadId: lead.id,
    });
    if (prevOwner) {
      notify({
        title: "Lead reassigned",
        body: `${lead.name} was reassigned from you to ${newOwner}.`,
        tone: "warning",
        to: "/app/leads",
        search: { q: lead.id },
        recipient: prevOwner,
        kind: "lead_assigned",
        leadId: lead.id,
      });
    }
  }

  /** Apply a follow-up date to a lead (idempotent: same date/time is a no-op, an existing
   *  pending follow-up task is rescheduled rather than duplicated). */
  function applyFollowUp(
    lead: Lead,
    fu: FollowUpInput,
    user: string,
  ): { lead: Lead; event: ActivityItem | null } {
    const disp = followUpDisplay(fu.date, fu.time);
    const title = fu.note?.trim() || `${fu.type ?? "Call"} follow-up`;
    const existing = lead.tasks.find(
      (t) => t.kind === "follow-up" && t.status === "Pending",
    );
    const sameSlot =
      lead.nextFollowUp === disp.date && lead.nextFollowUpTime === disp.time;
    if (sameSlot && (!fu.note?.trim() || existing?.title === title)) {
      return { lead, event: null };
    }
    const task = {
      id: existing?.id ?? uid("t"),
      kind: "follow-up" as const,
      title,
      due: disp.date,
      assignedTo: lead.owner || UNASSIGNED_LABEL,
      status: "Pending" as const,
    };
    const tasks = existing
      ? lead.tasks.map((t) => (t.id === existing.id ? task : t))
      : [task, ...lead.tasks];
    const event = activity(
      "followup-created",
      lead.nextFollowUp && existing
        ? `Follow-up rescheduled from ${lead.nextFollowUp} to ${disp.date}`
        : `Follow-up scheduled for ${disp.date}`,
      user,
    );
    return {
      lead: {
        ...lead,
        nextFollowUp: disp.date,
        nextFollowUpTime: disp.time,
        followUpOverdueDays: 0,
        tasks,
      },
      event,
    };
  }

  const api = {
    getState: () => state,
    subscribe: (f: () => void) => {
      subs.add(f);
      return () => subs.delete(f);
    },
    listLeads: () => state.leads,
    /** Assignable team members (existing team roster). */
    members: () => members,
    findDuplicates: (
      probe: { mobile?: string; whatsapp?: string; email?: string },
      excludeId?: string,
    ) => findDuplicateLeads(state.leads, probe, excludeId),
    getLead: (id: string) => state.leads.find((l) => l.id === id),

    /** Create a lead; also writes the "created" activity and a notification. No owner => unassigned. */
    createLead(input: NewLeadInput): Lead {
      const name = input.name.trim();
      if (!name) throw new Error("Lead name is required");
      const source = normalizeLeadSource(input.source);
      const captureMethod = input.captureMethod ?? "manual";
      const owner = input.owner?.trim() ?? "";
      const now = clock();
      const fu = input.followUp?.date
        ? followUpDisplay(input.followUp.date, input.followUp.time)
        : null;
      const lead: Lead = {
        id: nextLeadId(),
        name,
        company: input.company ?? name,
        contactPerson: input.contactPerson ?? "",
        mobile: input.mobile ?? "",
        whatsapp: input.whatsapp ?? input.mobile ?? "",
        email: input.email ?? "",
        website: input.website ?? "",
        source,
        captureMethod,
        owner,
        status: input.status ?? "New",
        rating: input.rating ?? 3,
        score: null, // not scored yet; never invented
        priority: input.priority,
        productInterest: input.productInterest,
        estimatedRequirement: input.estimatedRequirement,
        quantity: input.quantity,
        country: input.country,
        industry: input.industry ?? "",
        city: input.city ?? "",
        state: input.state ?? "",
        budget: input.budget ?? "",
        requirement: input.requirement ?? "",
        createdOn: displayDate(now),
        createdTime: displayTime(now),
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        lastContact: displayDate(now),
        lastContactTime: displayTime(now),
        nextFollowUp: fu?.date ?? null,
        nextFollowUpTime: fu?.time ?? null,
        followUpOverdueDays: 0,
        tags: input.tags ?? [],
        notes: [],
        activity: [
          ...(fu
            ? [
                activity(
                  "followup-created",
                  `Follow-up scheduled for ${fu.date}`,
                  owner || "System",
                ),
              ]
            : []),
          activity(
            "created",
            `Lead created from ${leadSourceLabel(source)}`,
            owner || "System",
          ),
        ],
        files: [],
        deals: [],
        tasks: fu
          ? [
              {
                id: uid("t"),
                kind: "follow-up" as const,
                title:
                  input.followUp?.note?.trim() ||
                  `${input.followUp?.type ?? "Call"} follow-up`,
                due: fu.date,
                assignedTo: owner || UNASSIGNED_LABEL,
                status: "Pending" as const,
              },
            ]
          : [],
        ai: {
          summary: [],
          recommendation: "",
          engagement: 0,
          responseRate: 0,
          purchaseIntent: 0,
          budgetFit: 0,
          followUpRisk: 0,
        },
      };
      set({ leads: [lead, ...state.leads] });
      notify(
        owner
          ? {
              title: "New lead assigned to you",
              body: `${lead.name} (${leadSourceLabel(source)}) was added and assigned to ${owner}.`,
              tone: "success",
              to: "/app/leads",
              search: { q: lead.id },
              recipient: owner,
              kind: "lead_created",
              leadId: lead.id,
            }
          : {
              title: "New unassigned lead",
              body: `${lead.name} (${leadSourceLabel(source)}) was added and needs an owner.`,
              tone: "warning",
              to: "/app/leads",
              search: { q: lead.id },
              kind: "lead_created",
              leadId: lead.id,
            },
      );
      return lead;
    },

    /** Low-level field patch. Source/captureMethod/id/created* are protected and silently ignored.
     *  Prefer editLead() for user edits (it validates and writes the timeline). */
    updateLead(id: string, patch: Partial<Lead>): Lead | undefined {
      const cur = api.getLead(id);
      if (!cur) return undefined;
      const safe = { ...patch };
      for (const k of PROTECTED_FIELDS) delete safe[k];
      return commit({ ...cur, ...safe }, []);
    },

    /**
     * User-facing edit. Applies only real differences, preserves id/createdAt/captureMethod and all
     * history, stamps updatedAt, and records timeline events. Re-submitting the same values is a
     * no-op (changed:false), so a double click can't write duplicate history.
     */
    editLead(
      id: string,
      input: LeadEditInput,
      actor?: string,
    ): MutationResult | undefined {
      const cur = api.getLead(id);
      if (!cur) return undefined;
      let next: Lead = cur;
      const events: ActivityItem[] = [];
      const changes: string[] = [];
      const user = who(actor, cur);

      const fieldLabels: string[] = [];
      const patch: Partial<Lead> = {};
      for (const key of Object.keys(
        EDITABLE_TEXT_FIELDS,
      ) as EditableTextField[]) {
        const v = input[key];
        if (v === undefined) continue;
        const nv = v.trim();
        if (key === "name" && !nv) throw new Error("Lead name is required");
        if (nv !== ((cur[key] as string | undefined) ?? "")) {
          (patch as Record<string, unknown>)[key] = nv;
          fieldLabels.push(EDITABLE_TEXT_FIELDS[key]);
        }
      }
      if (input.rating !== undefined && input.rating !== cur.rating) {
        patch.rating = input.rating;
        fieldLabels.push("Rating");
      }
      if (input.priority !== undefined && input.priority !== cur.priority) {
        patch.priority = input.priority;
        fieldLabels.push("Priority");
      }
      if (fieldLabels.length) {
        next = { ...next, ...patch };
        events.push(
          activity(
            "updated",
            `Lead details updated: ${fieldLabels.join(", ")}`,
            user,
          ),
        );
        changes.push(...fieldLabels);
      }

      if (input.source !== undefined) {
        const src = normalizeLeadSource(input.source);
        if (src !== cur.source) {
          events.push(
            activity(
              "updated",
              `Lead source corrected from ${leadSourceLabel(cur.source)} to ${leadSourceLabel(src)}`,
              user,
            ),
          );
          next = { ...next, source: src };
          changes.push("Source");
        }
      }

      if (input.status !== undefined && input.status !== cur.status) {
        events.push(
          activity(
            "status-changed",
            `Status changed from ${cur.status} to ${input.status}`,
            user,
          ),
        );
        next = { ...next, status: input.status };
        changes.push("Status");
      }

      let ownerChange: { prev: string; to: string } | null = null;
      if (input.owner !== undefined && input.owner.trim() !== cur.owner) {
        const to = input.owner.trim();
        if (to && !members.includes(to))
          throw new Error(`${to} is not an available team member`);
        if (to) {
          events.push(ownerEvent(cur, to, actor));
          ownerChange = { prev: cur.owner, to };
          next = { ...next, owner: to };
          changes.push("Owner");
        }
      }

      if (input.followUp?.date) {
        const r = applyFollowUp(next, input.followUp, user);
        if (r.event) {
          next = r.lead;
          events.push(r.event);
          changes.push("Follow-up");
        }
      }

      if (changes.length === 0) return { lead: cur, changed: false, changes };
      const lead = commit(next, events);
      if (ownerChange)
        ownerNotifications(lead, ownerChange.prev, ownerChange.to);
      return { lead, changed: true, changes };
    },

    /** Assign (unassigned lead) or reassign. Same owner => no-op. Unknown member => error. */
    assignLead(id: string, newOwner: string, actor?: string): Lead | undefined {
      const cur = api.getLead(id);
      if (!cur) return undefined;
      const to = newOwner.trim();
      if (!to) throw new Error("Choose a team member to assign this lead to");
      if (!members.includes(to))
        throw new Error(`${to} is not an available team member`);
      if (cur.owner === to) return cur;
      const lead = commit({ ...cur, owner: to }, [ownerEvent(cur, to, actor)]);
      ownerNotifications(lead, cur.owner, to);
      return lead;
    },

    /** Bulk assign; reports how many actually changed. */
    assignLeads(ids: string[], newOwner: string, actor?: string) {
      let assigned = 0;
      let unchanged = 0;
      let missing = 0;
      for (const id of new Set(ids)) {
        const cur = api.getLead(id);
        if (!cur) {
          missing += 1;
          continue;
        }
        const before = cur.owner;
        const after = api.assignLead(id, newOwner, actor);
        if (after && after.owner !== before) assigned += 1;
        else unchanged += 1;
      }
      return { assigned, unchanged, missing };
    },

    updateStatus(
      id: string,
      status: LeadStatus,
      actor?: string,
    ): Lead | undefined {
      const cur = api.getLead(id);
      if (!cur || cur.status === status) return cur;
      return commit({ ...cur, status }, [
        activity(
          "status-changed",
          `Status changed from ${cur.status} to ${status}`,
          who(actor, cur),
        ),
      ]);
    },

    /** Schedule or reschedule the lead's follow-up (idempotent; never duplicates tasks). */
    scheduleFollowUp(
      id: string,
      fu: FollowUpInput,
      actor?: string,
    ): MutationResult | undefined {
      const cur = api.getLead(id);
      if (!cur) return undefined;
      const r = applyFollowUp(cur, fu, who(actor, cur));
      if (!r.event) return { lead: cur, changed: false, changes: [] };
      return {
        lead: commit(r.lead, [r.event]),
        changed: true,
        changes: ["Follow-up"],
      };
    },

    /** Add a note + timeline entry. Re-submitting the same note within 5s is ignored. */
    addNote(id: string, text: string, by?: string): MutationResult | undefined {
      const cur = api.getLead(id);
      if (!cur) return undefined;
      const t = text.trim();
      if (!t) throw new Error("Write a note first");
      const author = who(by, cur);
      const last = cur.notes[0];
      if (
        last &&
        last.text === t &&
        last.by === author &&
        clock().getTime() - new Date(cur.updatedAt).getTime() < 5000
      ) {
        return { lead: cur, changed: false, changes: [] };
      }
      const now = clock();
      const note = {
        id: uid("n"),
        text: t,
        by: author,
        date: displayDate(now),
        time: displayTime(now),
      };
      const preview = t.length > 60 ? `${t.slice(0, 57)}...` : t;
      const lead = commit({ ...cur, notes: [note, ...cur.notes] }, [
        activity("note", `Note added: ${preview}`, author),
      ]);
      return { lead, changed: true, changes: ["Note"] };
    },

    /** Attach a call/email/WhatsApp/note activity. Never alters the lead's original source. */
    linkActivity(
      id: string,
      a: { type: ActivityItem["type"]; description: string; user: string },
    ): Lead | undefined {
      const cur = api.getLead(id);
      if (!cur) return undefined;
      const now = clock();
      return commit(
        {
          ...cur,
          lastContact: displayDate(now),
          lastContactTime: displayTime(now),
        },
        [activity(a.type, a.description, a.user)],
      );
    },

    // ---- Inbox conversation links ---------------------------------------------------
    /** The lead a conversation is linked to, if any. */
    getLeadForConversation: (conversationId: string): Lead | undefined =>
      state.leads.find((l) =>
        l.linkedConversations?.some((c) => c.id === conversationId),
      ),

    /** Link a conversation to an existing lead. Idempotent (same lead => no change, no new activity);
     *  a conversation already linked to a different lead is rejected, never silently moved.
     *  The lead's origin source/captureMethod are not touched. */
    linkConversation(
      leadId: string,
      conv: ConversationRef,
      actor?: string,
      how: "linked" | "created" = "linked",
    ): MutationResult | undefined {
      const cur = api.getLead(leadId);
      if (!cur) return undefined;
      const other = api.getLeadForConversation(conv.id);
      if (other && other.id !== cur.id)
        throw new Error(`This conversation is already linked to ${other.id}`);
      if (other) return { lead: cur, changed: false, changes: [] };
      const by = actor?.trim() || "System";
      const label = CHANNEL_LABEL[conv.channel];
      const link = {
        id: conv.id,
        channel: conv.channel,
        contact: conv.contact,
        linkedAt: clock().toISOString(),
        linkedBy: by,
      };
      const lead = commit(
        {
          ...cur,
          linkedConversations: [...(cur.linkedConversations ?? []), link],
        },
        [
          activity(
            "updated",
            how === "created"
              ? `Lead created from ${label} conversation with ${conv.contact}`
              : `${label} conversation with ${conv.contact} linked to this lead`,
            by,
          ),
        ],
      );
      return { lead, changed: true, changes: ["Conversation"] };
    },

    /** Create a lead from a conversation and link it. If the conversation already has a lead, that lead
     *  is returned and nothing is created (protects against double clicks / repeated submits). */
    createLeadFromConversation(
      conv: ConversationRef,
      input: NewLeadInput,
      actor?: string,
    ): { lead: Lead; created: boolean } {
      const existing = api.getLeadForConversation(conv.id);
      if (existing) return { lead: existing, created: false };
      const created = api.createLead({
        ...input,
        captureMethod: "conversation",
      });
      const linked = api.linkConversation(created.id, conv, actor, "created");
      return { lead: linked?.lead ?? created, created: true };
    },

    createNotification: notify,
    /** Idempotent: already-read (or unknown) ids leave state untouched, so nothing re-renders. */
    markNotificationRead(id: string) {
      if (!state.notifications.some((n) => n.id === id && !n.read)) return;
      set({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n,
        ),
      });
    },
    markNotificationUnread(id: string) {
      if (!state.notifications.some((n) => n.id === id && n.read)) return;
      set({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, read: false } : n,
        ),
      });
    },
    /** Marks everything visible to `forUser` as read (their own + broadcast). Other people's private
     *  notifications are never touched. Returns how many changed. */
    markAllNotificationsRead(forUser?: string): number {
      const hit = (n: CrmNotification) =>
        !n.read && (forUser === undefined || isVisibleTo(n, forUser));
      const count = state.notifications.filter(hit).length;
      if (count === 0) return 0;
      set({
        notifications: state.notifications.map((n) =>
          hit(n) ? { ...n, read: true } : n,
        ),
      });
      return count;
    },

    kpis: (now?: Date) => computeLeadKpis(state.leads, now ?? clock()),
    sourceCounts: () => computeSourceCounts(state.leads),
  };
  return api;
}

export type CrmStore = ReturnType<typeof createCrmStore>;

export const crmStore = createCrmStore();

// ---- React hooks ----------------------------------------------------------------------
export function useCrmState(): CrmState {
  return useSyncExternalStore(
    crmStore.subscribe,
    crmStore.getState,
    crmStore.getState,
  );
}
export const useLeads = () => useCrmState().leads;
export const useCrmNotifications = () => useCrmState().notifications;
/** Notifications visible to one user (own + broadcast), newest first as stored. */
export function useUserNotifications(userName: string): CrmNotification[] {
  const all = useCrmNotifications();
  return useMemo(() => notificationsForUser(all, userName), [all, userName]);
}
export function useLeadKpis(): LeadKpis {
  const leads = useLeads();
  return useMemo(() => computeLeadKpis(leads), [leads]);
}
