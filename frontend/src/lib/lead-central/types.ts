// Lead Central Dashboard (Prompt 1) view-model types. They only DESCRIBE derived data; the lead entity itself
// (`Lead`, `LeadSource`, `LeadStatus`) is the existing one from leads-data.ts and is never redefined here.
import type { LeadSource } from "@/lib/lead-sources";

export type DateRangePreset = "today" | "7d" | "30d" | "90d" | "year" | "all";

export type DateRange = {
  preset: DateRangePreset;
  /** Inclusive start (local midnight). null = unbounded ("All time"). */
  from: Date | null;
  /** Exclusive end (local midnight of the day after today). null = unbounded. */
  to: Date | null;
};

export type KpiKey = "total" | "new" | "hot" | "converted";

export type KpiValue = {
  key: KpiKey;
  label: string;
  value: number;
  /** Previous equal-length period; null when the range is unbounded (no valid comparison exists). */
  previous: number | null;
  /** Percent change vs previous period; null when there is no valid comparison (no previous period or previous = 0). */
  changePercent: number | null;
};

export type TrendPoint = {
  /** Bucket start, ISO date (yyyy-mm-dd, local). */
  date: string;
  label: string;
  newLeads: number;
  convertedLeads: number;
  hotLeads: number;
};

export type SourceSlice = {
  key: LeadSource | "others";
  label: string;
  count: number;
  /** Whole-number share; slices sum to exactly 100 (0 when empty). */
  percent: number;
  color: string;
};

export type RecentActivityEvent = {
  id: string;
  kind: "created" | "assigned" | "follow-up" | "status" | "converted";
  title: string;
  description: string;
  leadId: string;
  leadName: string;
  at: Date;
};
