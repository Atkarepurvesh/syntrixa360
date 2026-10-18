// Pure search / filter / sort / paginate logic for the Leads page (no React), so every
// view of the list (table, grid, tabs, KPI cards, pagination counts) uses the same dataset
// and the same definitions, and so it can be unit-tested.
import type { Lead, LeadPriority, LeadStatus } from "@/lib/leads-data";

const MONTHS = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
];
const DAY_MS = 86_400_000;

/** Parses the "25 May 2025" display dates used on Lead (local midnight). null if unparseable. */
export function parseDisplayDate(
  value: string | null | undefined,
): Date | null {
  const m = /^(\d{1,2}) ([A-Za-z]{3}) (\d{4})$/.exec((value ?? "").trim());
  if (!m) return null;
  const month = MONTHS.indexOf(m[2]!.toLowerCase());
  if (month < 0) return null;
  return new Date(Number(m[3]), month, Number(m[1]));
}

const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const isSameLocalDay = (a: Date, b: Date) =>
  startOfDay(a).getTime() === startOfDay(b).getTime();

export type FollowUpState = "none" | "overdue" | "today" | "upcoming";

/** Follow-up state from the lead's real next-follow-up date vs. the current local date. */
export function followUpState(
  lead: Pick<Lead, "nextFollowUp">,
  now: Date = new Date(),
): FollowUpState {
  if (!lead.nextFollowUp) return "none";
  const d = parseDisplayDate(lead.nextFollowUp);
  if (!d) return "upcoming";
  const diff = startOfDay(d).getTime() - startOfDay(now).getTime();
  return diff < 0 ? "overdue" : diff === 0 ? "today" : "upcoming";
}

export type SortKey =
  | "created_desc"
  | "created_asc"
  | "updated_desc"
  | "score_desc"
  | "priority_desc";

export const SORT_OPTIONS: Array<{ key: SortKey; label: string }> = [
  { key: "created_desc", label: "Newest created" },
  { key: "created_asc", label: "Oldest created" },
  { key: "updated_desc", label: "Recently updated" },
  { key: "score_desc", label: "Lead score (high to low)" },
  { key: "priority_desc", label: "Priority (high to low)" },
];

const PRIORITY_RANK: Record<LeadPriority, number> = {
  High: 3,
  Medium: 2,
  Low: 1,
};
const time = (iso: string) => {
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? 0 : t;
};

export function sortLeads(leads: Lead[], key: SortKey): Lead[] {
  const byCreatedDesc = (a: Lead, b: Lead) =>
    time(b.createdAt) - time(a.createdAt);
  const cmp: Record<SortKey, (a: Lead, b: Lead) => number> = {
    created_desc: byCreatedDesc,
    created_asc: (a, b) => time(a.createdAt) - time(b.createdAt),
    updated_desc: (a, b) =>
      time(b.updatedAt) - time(a.updatedAt) || byCreatedDesc(a, b),
    // unscored leads (null) always sort last
    score_desc: (a, b) =>
      (b.score ?? -1) - (a.score ?? -1) || byCreatedDesc(a, b),
    // leads without a priority sort last
    priority_desc: (a, b) =>
      (b.priority ? PRIORITY_RANK[b.priority] : 0) -
        (a.priority ? PRIORITY_RANK[a.priority] : 0) || byCreatedDesc(a, b),
  };
  return [...leads].sort(cmp[key]); // Array.prototype.sort is stable
}

export type LeadFilters = {
  query: string;
  tab: "all" | LeadStatus;
  source: string; // "all" | canonical source key
  owner: string; // "all" | name | "unassigned"
  status: string; // "all" | LeadStatus
  priority: string; // "all" | LeadPriority
  rating: string; // "all" | "1".."5" (minimum)
  followUp: string; // "all" | FollowUpState
  scoreMin: string;
  scoreMax: string;
  quick: string | null; // my-leads | leads-today | hot-leads | no-followup | no-activity
};

export const emptyLeadFilters = (): LeadFilters => ({
  query: "",
  tab: "all",
  source: "all",
  owner: "all",
  status: "all",
  priority: "all",
  rating: "all",
  followUp: "all",
  scoreMin: "",
  scoreMax: "",
  quick: null,
});

const digits = (v: string) => v.replace(/\D/g, "");

/** Search by customer name, company, contact person, phone (any format), email and lead id. */
export function matchesQuery(lead: Lead, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const qd = digits(q).length > 10 ? digits(q).slice(-10) : digits(q); // drop +91 / 0 prefixes
  return (
    lead.name.toLowerCase().includes(q) ||
    lead.company.toLowerCase().includes(q) ||
    lead.contactPerson.toLowerCase().includes(q) ||
    lead.email.toLowerCase().includes(q) ||
    lead.id.toLowerCase().includes(q) ||
    lead.mobile.toLowerCase().includes(q) ||
    (qd.length >= 3 &&
      (digits(lead.mobile).includes(qd) || digits(lead.whatsapp).includes(qd)))
  );
}

export const HOT_SCORE = 80;
export const INACTIVE_DAYS = 3;

export function isHot(lead: Lead) {
  return lead.score !== null && lead.score >= HOT_SCORE;
}
export function isCreatedToday(lead: Lead, now: Date) {
  return isSameLocalDay(new Date(lead.createdAt), now);
}
/** No contact recorded for INACTIVE_DAYS+ days (uses the real lastContact date). */
export function isInactive(lead: Lead, now: Date) {
  const d = parseDisplayDate(lead.lastContact);
  return (
    d !== null &&
    startOfDay(now).getTime() - d.getTime() >= INACTIVE_DAYS * DAY_MS
  );
}

export type QueryContext = { now?: Date; currentUserName?: string };

export function filterLeads(
  leads: Lead[],
  f: LeadFilters,
  ctx: QueryContext = {},
): Lead[] {
  const now = ctx.now ?? new Date();
  const min = f.scoreMin.trim() === "" ? null : Number(f.scoreMin);
  const max = f.scoreMax.trim() === "" ? null : Number(f.scoreMax);
  return leads.filter((l) => {
    if (f.tab !== "all" && l.status !== f.tab) return false;
    if (f.status !== "all" && l.status !== f.status) return false;
    if (f.source !== "all" && l.source !== f.source) return false;
    if (
      f.owner === "unassigned"
        ? l.owner !== ""
        : f.owner !== "all" && l.owner !== f.owner
    )
      return false;
    if (f.priority !== "all" && l.priority !== f.priority) return false;
    if (f.rating !== "all" && l.rating < Number(f.rating)) return false;
    if (f.followUp !== "all" && followUpState(l, now) !== f.followUp)
      return false;
    if (
      min !== null &&
      !Number.isNaN(min) &&
      (l.score === null || l.score < min)
    )
      return false;
    if (
      max !== null &&
      !Number.isNaN(max) &&
      (l.score === null || l.score > max)
    )
      return false;
    if (f.quick === "my-leads" && l.owner !== ctx.currentUserName) return false;
    if (f.quick === "leads-today" && !isCreatedToday(l, now)) return false;
    if (f.quick === "hot-leads" && !isHot(l)) return false;
    if (f.quick === "no-followup" && l.nextFollowUp) return false;
    if (f.quick === "no-activity" && !isInactive(l, now)) return false;
    return matchesQuery(l, f.query);
  });
}

export function queryLeads(
  leads: Lead[],
  f: LeadFilters,
  sort: SortKey,
  ctx: QueryContext = {},
): Lead[] {
  return sortLeads(filterLeads(leads, f, ctx), sort);
}

export function countActiveFilters(f: LeadFilters): number {
  return [
    f.source !== "all",
    f.owner !== "all",
    f.status !== "all",
    f.priority !== "all",
    f.rating !== "all",
    f.followUp !== "all",
    f.scoreMin.trim() !== "",
    f.scoreMax.trim() !== "",
  ].filter(Boolean).length;
}

export const hasAnyFilter = (f: LeadFilters) =>
  countActiveFilters(f) > 0 ||
  f.query.trim() !== "" ||
  f.tab !== "all" ||
  f.quick !== null;

export type Page<T> = {
  rows: T[];
  page: number;
  totalPages: number;
  total: number;
  rangeStart: number;
  rangeEnd: number;
};

export function paginate<T>(
  rows: T[],
  page: number,
  pageSize: number,
): Page<T> {
  const size = Math.max(1, pageSize);
  const totalPages = Math.max(1, Math.ceil(rows.length / size));
  const p = Math.min(Math.max(1, page), totalPages);
  const start = (p - 1) * size;
  return {
    rows: rows.slice(start, start + size),
    page: p,
    totalPages,
    total: rows.length,
    rangeStart: rows.length === 0 ? 0 : start + 1,
    rangeEnd: Math.min(start + size, rows.length),
  };
}

/** ISO timestamp -> "14 Oct 2026, 03:30 PM" (local time); "—" if invalid. */
export function formatStamp(iso: string | null | undefined): string {
  const d = iso ? new Date(iso) : null;
  if (!d || Number.isNaN(d.getTime())) return "—";
  const h = d.getHours();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())} ${MONTHS[d.getMonth()]![0]!.toUpperCase()}${MONTHS[d.getMonth()]!.slice(1)} ${d.getFullYear()}, ${pad(h % 12 === 0 ? 12 : h % 12)}:${pad(d.getMinutes())} ${h >= 12 ? "PM" : "AM"}`;
}

/**
 * Role scoping shared by the Leads page and the Dashboard so both show the same leads:
 * a Sales Executive sees only the leads they own; Owner and Manager see all.
 */
export function scopeLeadsForUser(
  leads: Lead[],
  user: { role: string; name: string },
): Lead[] {
  return user.role === "sales-executive"
    ? leads.filter((l) => l.owner === user.name)
    : leads;
}
