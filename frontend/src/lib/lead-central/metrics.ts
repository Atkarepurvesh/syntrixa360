// Pure (React-free) derivations for the Lead Central dashboard, computed from the same lead list the Leads
// module uses (shared CRM store, role-scoped by the caller). Definitions deliberately reuse the Leads module:
//   - New       = leads created inside the range whose stored status is "New" (same as the Leads module's New KPI)
//   - Hot       = isHot() from lead-query (score >= HOT_SCORE), same as the Leads page "Hot Leads" filter
//   - Converted = stored status "Converted" (the store records no conversion timestamp, so the range is applied
//                 to the lead's createdAt: "leads created in this range that are converted")
//   - Total     = every lead created inside the range
// Source shares use the canonical lead model: one lead counts once, under its immutable origin `source`.
import { computeSourceCounts } from "@/lib/crm-store";
import { isHot } from "@/lib/lead-query";
import { SOURCE_COLORS, OTHERS_COLOR } from "@/lib/dashboard-metrics";
import type { Lead } from "@/lib/leads-data";
import type {
  DateRange,
  DateRangePreset,
  KpiValue,
  RecentActivityEvent,
  SourceSlice,
  TrendPoint,
} from "./types";

const DAY_MS = 86_400_000;

export const DATE_PRESETS: { value: DateRangePreset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "year", label: "This year" },
  { value: "all", label: "All time" },
];

export const presetLabel = (p: DateRangePreset) =>
  DATE_PRESETS.find((x) => x.value === p)?.label ?? "All time";

const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

export function resolveRange(
  preset: DateRangePreset,
  now: Date = new Date(),
): DateRange {
  const tomorrow = addDays(startOfDay(now), 1);
  switch (preset) {
    case "today":
      return { preset, from: startOfDay(now), to: tomorrow };
    case "7d":
      return { preset, from: addDays(tomorrow, -7), to: tomorrow };
    case "30d":
      return { preset, from: addDays(tomorrow, -30), to: tomorrow };
    case "90d":
      return { preset, from: addDays(tomorrow, -90), to: tomorrow };
    case "year":
      return { preset, from: new Date(now.getFullYear(), 0, 1), to: tomorrow };
    default:
      return { preset: "all", from: null, to: null };
  }
}

/** The equally long period immediately before `range`; null for unbounded ranges / "This year" (no fair comparison). */
export function previousRange(range: DateRange): DateRange | null {
  if (!range.from || !range.to || range.preset === "year") return null;
  const span = range.to.getTime() - range.from.getTime();
  return {
    preset: range.preset,
    from: new Date(range.from.getTime() - span),
    to: range.from,
  };
}

const createdMs = (l: Lead) => new Date(l.createdAt).getTime();

export function leadsInRange(leads: Lead[], range: DateRange): Lead[] {
  return leads.filter((l) => {
    const t = createdMs(l);
    if (Number.isNaN(t)) return false;
    if (range.from && t < range.from.getTime()) return false;
    if (range.to && t >= range.to.getTime()) return false;
    return true;
  });
}

const isNew = (l: Lead) => l.status === "New";
const isConverted = (l: Lead) => l.status === "Converted";

function counts(list: Lead[]) {
  return {
    total: list.length,
    new: list.filter(isNew).length,
    hot: list.filter(isHot).length,
    converted: list.filter(isConverted).length,
  };
}

export function computeKpis(leads: Lead[], range: DateRange): KpiValue[] {
  const current = counts(leadsInRange(leads, range));
  const prevRange = previousRange(range);
  const previous = prevRange ? counts(leadsInRange(leads, prevRange)) : null;
  const make = (key: KpiValue["key"], label: string): KpiValue => {
    const value = current[key];
    const prev = previous ? previous[key] : null;
    const changePercent =
      prev !== null && prev > 0
        ? Math.round(((value - prev) / prev) * 1000) / 10
        : null;
    return { key, label, value, previous: prev, changePercent };
  };
  return [
    make("total", "Total Leads"),
    make("new", "New Leads"),
    make("hot", "Hot Leads"),
    make("converted", "Converted Leads"),
  ];
}

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
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

/**
 * Time series over the range: daily buckets up to 92 days, monthly beyond that. "All time" spans the first to
 * last lead. Empty array when there are no leads in range (the chart then shows its empty state).
 */
export function buildTrend(leads: Lead[], range: DateRange): TrendPoint[] {
  const inRange = leadsInRange(leads, range);
  if (inRange.length === 0) return [];
  const times = inRange.map(createdMs);
  const start = startOfDay(range.from ?? new Date(Math.min(...times)));
  const end = startOfDay(
    range.to ? addDays(range.to, -1) : new Date(Math.max(...times)),
  );
  const spanDays = Math.round((end.getTime() - start.getTime()) / DAY_MS) + 1;
  const monthly = spanDays > 92;

  const keyOf = (d: Date) =>
    monthly
      ? iso(new Date(d.getFullYear(), d.getMonth(), 1))
      : iso(startOfDay(d));
  const points = new Map<string, TrendPoint>();
  const cursor = monthly
    ? new Date(start.getFullYear(), start.getMonth(), 1)
    : new Date(start);
  while (cursor.getTime() <= end.getTime()) {
    const k = keyOf(cursor);
    points.set(k, {
      date: k,
      label: monthly
        ? `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`
        : `${String(cursor.getDate()).padStart(2, "0")} ${MONTHS[cursor.getMonth()]}`,
      newLeads: 0,
      convertedLeads: 0,
      hotLeads: 0,
    });
    if (monthly) cursor.setMonth(cursor.getMonth() + 1);
    else cursor.setDate(cursor.getDate() + 1);
  }
  for (const l of inRange) {
    const p = points.get(keyOf(new Date(l.createdAt)));
    if (!p) continue;
    if (isNew(l)) p.newLeads += 1;
    if (isConverted(l)) p.convertedLeads += 1;
    if (isHot(l)) p.hotLeads += 1;
  }
  return [...points.values()];
}

/**
 * Source distribution of the leads created in range. One lead = one slice entry (canonical `source`).
 * Top `max` sources are kept; the remainder is grouped as "Other sources". Percentages are whole numbers
 * that sum to exactly 100 (largest-remainder rounding).
 */
export function buildSourceSlices(
  leads: Lead[],
  range: DateRange,
  max = 6,
): SourceSlice[] {
  const rows = computeSourceCounts(leadsInRange(leads, range)); // sorted desc, zero-count omitted
  const total = rows.reduce((s, r) => s + r.count, 0);
  if (total === 0) return [];
  const head = rows.slice(0, max);
  const tail = rows.slice(max);
  const raw: Omit<SourceSlice, "percent">[] = head.map((r) => ({
    key: r.source,
    label: r.label,
    count: r.count,
    color: SOURCE_COLORS[r.source],
  }));
  if (tail.length) {
    raw.push({
      key: "others",
      label: "Other sources",
      count: tail.reduce((s, r) => s + r.count, 0),
      color: OTHERS_COLOR,
    });
  }
  const exact = raw.map((r) => (r.count / total) * 100);
  const floors = exact.map(Math.floor);
  let left = 100 - floors.reduce((a, b) => a + b, 0);
  const order = exact
    .map((e, i) => ({ i, rem: e - Math.floor(e) }))
    .sort((a, b) => b.rem - a.rem);
  for (const { i } of order) {
    if (left <= 0) break;
    floors[i]! += 1;
    left -= 1;
  }
  return raw.map((r, i) => ({ ...r, percent: floors[i]! }));
}

export function recentLeads(
  leads: Lead[],
  range: DateRange,
  query = "",
): Lead[] {
  const q = query.trim().toLowerCase();
  return leadsInRange(leads, range)
    .filter(
      (l) =>
        !q ||
        [l.name, l.company, l.contactPerson, l.email, l.mobile, l.id].some(
          (v) => v.toLowerCase().includes(q),
        ),
    )
    .sort((a, b) => createdMs(b) - createdMs(a));
}

const EVENT_KIND: Partial<
  Record<Lead["activity"][number]["type"], RecentActivityEvent["kind"]>
> = {
  created: "created",
  "owner-changed": "assigned",
  "followup-created": "follow-up",
  "status-changed": "status",
  converted: "converted",
};
const EVENT_TITLE: Record<RecentActivityEvent["kind"], string> = {
  created: "New lead created",
  assigned: "Lead assigned",
  "follow-up": "Follow-up scheduled",
  status: "Status changed",
  converted: "Lead converted",
};

/** Real lead-timeline events recorded on the leads (never generated); newest first. */
export function buildRecentActivity(
  leads: Lead[],
  range: DateRange,
  limit = 8,
): RecentActivityEvent[] {
  const events: RecentActivityEvent[] = [];
  for (const lead of leadsInRange(leads, range)) {
    for (const a of lead.activity) {
      const kind = EVENT_KIND[a.type];
      if (!kind) continue;
      const at = new Date(`${a.date} ${a.time}`);
      if (Number.isNaN(at.getTime())) continue;
      events.push({
        id: `${lead.id}:${a.id}`,
        kind,
        title: EVENT_TITLE[kind],
        description: a.description,
        leadId: lead.id,
        leadName: lead.name,
        at,
      });
    }
  }
  return events.sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, limit);
}
