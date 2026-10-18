// Pure view-models for the Dashboard's lead KPI cards and Lead Source widget, derived from the
// shared CRM store's lead list (see crm-store.ts). Kept free of React so it can be unit-tested.
import {
  computeLeadKpis,
  computeSourceCounts,
  type LeadKpis,
} from "@/lib/crm-store";
import { leadSourceLabel, type LeadSource } from "@/lib/lead-sources";
import type { Lead } from "@/lib/leads-data";

// ---- KPI cards --------------------------------------------------------------------------
export type DashboardLeadCard = { value: string; subtitle: string };

/**
 * Dashboard "Total Leads" and "New Leads (Today)" cards.
 *  - Total Leads  = every lead in scope; subtitle shows the stored-status Qualified / Converted counts.
 *  - New Leads (Today) = leads whose createdAt is the current local date; subtitle shows follow-ups
 *    due today (next follow-up date is the current local date; one lead counts once).
 * No trend percentages: the store has no comparison-period data to compute them from.
 */
export function dashboardLeadCards(k: LeadKpis): {
  leads: DashboardLeadCard;
  "new-leads": DashboardLeadCard;
} {
  return {
    leads: {
      value: k.total.toLocaleString("en-IN"),
      subtitle: `${k.qualified.toLocaleString("en-IN")} qualified · ${k.converted.toLocaleString("en-IN")} converted`,
    },
    "new-leads": {
      value: k.newToday.toLocaleString("en-IN"),
      subtitle: `${k.followUpsDueToday.toLocaleString("en-IN")} follow-up${k.followUpsDueToday === 1 ? "" : "s"} due today`,
    },
  };
}

export const dashboardLeadKpis = (leads: Lead[], now: Date = new Date()) =>
  computeLeadKpis(leads, now);

// ---- Lead Source widget -----------------------------------------------------------------
export const SOURCE_COLORS: Record<LeadSource, string> = {
  // the five colours the widget already used
  WhatsApp: "#22c55e",
  Website: "#3b82f6",
  Email: "#f5b014",
  Referral: "#7c3aed",
  Other: "#94a3b8",
  // additional catalog sources
  IndiaMART: "#f97316",
  TradeIndia: "#14b8a6",
  ExportersIndia: "#ec4899",
  Alibaba: "#ef4444",
  Phone: "#0ea5e9",
  Meta: "#6366f1",
  Google: "#84cc16",
  Justdial: "#eab308",
  "99acres": "#06b6d4",
  "Housing.com": "#a855f7",
};
export const OTHERS_COLOR = SOURCE_COLORS.Other;

export type SourceSlice = {
  /** Canonical source key, or "others" for the grouped remainder. */
  key: LeadSource | "others";
  /** Slug used by the existing Reports deep-link (?source=). */
  slug: string;
  label: string;
  count: number;
  /** Whole-number share of all leads; the slices always sum to exactly 100 (or 0 when empty). */
  percent: number;
  color: string;
};
export type SourceBreakdown = {
  total: number;
  slices: SourceSlice[];
  isEmpty: boolean;
};

const slugOf = (source: string) =>
  source.toLowerCase().replace(/[^a-z0-9]/g, "");

/** Largest-remainder rounding so displayed percentages add up to exactly 100. */
function percentages(counts: number[], total: number): number[] {
  if (total === 0) return counts.map(() => 0);
  const raw = counts.map((c) => (c / total) * 100);
  const floors = raw.map(Math.floor);
  let left = 100 - floors.reduce((a, b) => a + b, 0);
  const order = raw
    .map((r, i) => ({ i, frac: r - Math.floor(r) }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i);
  for (const { i } of order) {
    if (left <= 0) break;
    floors[i]! += 1;
    left -= 1;
  }
  return floors;
}

/**
 * Lead Source widget model. The chart shows each source's SHARE of leads (percent in the legend,
 * total lead count in the centre, as before). Counts come from the shared store via
 * computeSourceCounts (unknown/missing sources normalise to "Other"). The top `maxNamed` named
 * sources get their own slice; everything else, including the catalog's "Other" source, is grouped
 * into "Others" (the widget previously had four named slices + "Others").
 */
export function buildSourceBreakdown(
  leads: Lead[],
  maxNamed = 4,
): SourceBreakdown {
  const counts = computeSourceCounts(leads); // sorted by count desc, catalog order for ties is stable
  const total = leads.length;
  const named = counts.filter((c) => c.source !== "Other");
  const top = named.slice(0, maxNamed);
  const othersCount =
    counts.reduce((n, c) => n + c.count, 0) -
    top.reduce((n, c) => n + c.count, 0);
  const raw: Array<Omit<SourceSlice, "percent">> = top.map((c) => ({
    key: c.source,
    slug: slugOf(c.source),
    label: leadSourceLabel(c.source),
    count: c.count,
    color: SOURCE_COLORS[c.source],
  }));
  if (othersCount > 0) {
    raw.push({
      key: "others",
      slug: "others",
      label: "Others",
      count: othersCount,
      color: OTHERS_COLOR,
    });
  }
  const pct = percentages(
    raw.map((r) => r.count),
    total,
  );
  return {
    total,
    isEmpty: total === 0,
    slices: raw.map((r, i) => ({ ...r, percent: pct[i]! })),
  };
}
