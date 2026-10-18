// Sync Jobs & Logs (Lead Central, Prompt 3): pure, testable derivations. No React, no network.
//
// Honesty rules baked in here:
//  - KPI numbers come from the server's aggregate, or from the loaded rows ONLY when those rows are the
//    complete result (total <= items.length). Otherwise they are null and the UI shows "—".
//  - Percentages are produced only from real counts with a non-zero denominator.
//  - Progress is produced only for jobs that are genuinely running AND carry numeric processed/total.
//  - Actions are the intersection of what the server allows and what the job's lifecycle permits.
//  - Text shown or exported is defensively scrubbed of token / password shaped content.
import type {
  SyncJobAction,
  SyncJobDto,
  SyncJobListDto,
  SyncJobListParams,
  SyncJobSummaryDto,
  SyncProgressDto,
} from "@/lib/api/sync-jobs";

import { resolveRange } from "./metrics";
import type { DateRangePreset } from "./types";

export type StatusTone = "success" | "danger" | "warning" | "info" | "muted";

export const STATUS_META: Record<string, { label: string; tone: StatusTone }> =
  {
    success: { label: "Success", tone: "success" },
    partial: { label: "Partial", tone: "warning" },
    failed: { label: "Failed", tone: "danger" },
    running: { label: "Running", tone: "info" },
    queued: { label: "Queued", tone: "info" },
    cancelled: { label: "Cancelled", tone: "muted" },
  };

export const STATUS_FILTERS = [
  "success",
  "partial",
  "failed",
  "running",
  "queued",
  "cancelled",
] as const;

export const JOB_TYPE_LABELS: Record<string, string> = {
  initial: "Initial Sync",
  full: "Full Sync",
  incremental: "Incremental Sync",
  scheduled: "Scheduled Sync",
  manual: "Manual Sync",
  webhook: "Webhook Processing",
};

const titleCase = (v: string) =>
  v
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();

/** Unknown server values are shown as their own readable name — never mapped to a different status. */
export function statusMeta(status: string): {
  label: string;
  tone: StatusTone;
} {
  return STATUS_META[status] ?? { label: titleCase(status), tone: "muted" };
}
export const jobTypeLabel = (t: string) => JOB_TYPE_LABELS[t] ?? titleCase(t);

export const isRunning = (s: string) => s === "running" || s === "queued";

// ---------------------------------------------------------------------------
// Filters -> server query
// ---------------------------------------------------------------------------
export type JobFilters = {
  platform: string; // "all" | provider key
  jobType: string; // "all" | job type
  status: string; // "all" | status
  search: string;
  preset: DateRangePreset;
};

export const DEFAULT_FILTERS: JobFilters = {
  platform: "all",
  jobType: "all",
  status: "all",
  search: "",
  preset: "7d",
};

export const filtersDirty = (f: JobFilters) =>
  f.platform !== "all" ||
  f.jobType !== "all" ||
  f.status !== "all" ||
  f.search.trim() !== "" ||
  f.preset !== DEFAULT_FILTERS.preset;

/** Filters + range + paging -> the list request. "all" values and blank search are omitted entirely. */
export function buildListParams(
  f: JobFilters,
  page: number,
  pageSize: number,
  now: Date = new Date(),
): SyncJobListParams {
  const range = resolveRange(f.preset, now);
  const q = f.search.trim();
  return {
    platform: f.platform === "all" ? undefined : f.platform,
    jobType: f.jobType === "all" ? undefined : f.jobType,
    status: f.status === "all" ? undefined : f.status,
    from: range.from ? range.from.toISOString() : undefined,
    to: range.to ? range.to.toISOString() : undefined,
    q: q === "" ? undefined : q,
    page,
    pageSize,
  };
}

// ---------------------------------------------------------------------------
// KPI summary
// ---------------------------------------------------------------------------
export type JobSummary = {
  total: number;
  success: number;
  failed: number;
  /** Running + queued (the brief defines Running as "queued or currently processing"). */
  running: number;
  partial: number;
  basis: "server" | "loaded";
};

function fromRows(items: SyncJobDto[]): SyncJobSummaryDto {
  const count = (s: string) => items.filter((j) => j.status === s).length;
  return {
    total: items.length,
    success: count("success"),
    partial: count("partial"),
    failed: count("failed"),
    running: count("running"),
    queued: count("queued"),
  };
}

/** null = the numbers cannot be stated honestly (partial page and no server aggregate). */
export function summarizeJobs(list: SyncJobListDto): JobSummary | null {
  const s =
    list.summary ??
    (list.total <= list.items.length ? fromRows(list.items) : null);
  if (!s) return null;
  return {
    total: s.total,
    success: s.success,
    failed: s.failed,
    running: s.running + s.queued,
    partial: s.partial,
    basis: list.summary ? "server" : "loaded",
  };
}

/** Whole-number percent of `part` in `whole`; null when there is no valid denominator. */
export function percentOf(part: number, whole: number): number | null {
  if (!Number.isFinite(part) || !Number.isFinite(whole) || whole <= 0)
    return null;
  return Math.round((part / whole) * 100);
}

// ---------------------------------------------------------------------------
// Duration / progress
// ---------------------------------------------------------------------------
/** "2m 14s". null unless both timestamps are valid and ordered (running jobs have no duration yet). */
export function formatDuration(
  startedAt: string | null,
  completedAt: string | null,
): string | null {
  if (!startedAt || !completedAt) return null;
  const ms = new Date(completedAt).getTime() - new Date(startedAt).getTime();
  if (!Number.isFinite(ms) || ms < 0) return null;
  const total = Math.round(ms / 1000);
  if (total < 1) return "<1s";
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

/** Percent complete — only for a genuinely running job with numeric processed/total (0 < total, processed <= total). */
export function progressPercent(
  status: string,
  p: SyncProgressDto | null,
): number | null {
  if (status !== "running" || !p) return null;
  const { processed, total } = p;
  if (processed === null || total === null) return null;
  if (total <= 0 || processed < 0 || processed > total) return null;
  return Math.round((processed / total) * 100);
}

const dtf = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
/** One timestamp format everywhere; "—" for null/invalid. */
export function formatTimestamp(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : dtf.format(d);
}

export const formatCount = (n: number | null) =>
  n === null ? "—" : n.toLocaleString("en-IN");

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------
const LIFECYCLE: Record<SyncJobAction, (status: string) => boolean> = {
  retry: (s) => s === "failed" || s === "partial",
  rerun: (s) =>
    s === "success" || s === "partial" || s === "failed" || s === "cancelled",
  cancel: (s) => s === "queued" || s === "running",
};

/** Server-allowed AND lifecycle-coherent. With no server support this is always empty (no action is shown). */
export function availableActions(job: SyncJobDto): SyncJobAction[] {
  return job.allowedActions.filter((a) => LIFECYCLE[a]?.(job.status) === true);
}

// ---------------------------------------------------------------------------
// Safe text + CSV export
// ---------------------------------------------------------------------------
const SECRET_PATTERNS: RegExp[] = [
  /\bBearer\s+[A-Za-z0-9._~+/=-]{8,}/gi,
  /\b(authorization|cookie|set-cookie)\s*[:=]\s*[^\s,;]+/gi,
  /\b(access[_-]?token|refresh[_-]?token|id[_-]?token|api[_-]?key|apikey|client[_-]?secret|secret|password|passwd|pwd|token)\b\s*[:=]\s*["']?[^\s"',;&]+/gi,
  /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g,
];

/** Defence in depth: the server must already sanitise, but nothing credential-shaped is ever rendered/exported. */
export function redactSecrets(text: string): string {
  let out = text;
  for (const re of SECRET_PATTERNS) out = out.replace(re, "[redacted]");
  return out;
}

/** RFC-4180 quoting + neutralises spreadsheet formula injection (=, +, -, @, tab, CR prefixes). */
export function csvCell(value: string | number | null): string {
  if (value === null) return "";
  let s = String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export const CSV_HEADERS = [
  "Job ID",
  "Platform",
  "Job Type",
  "Status",
  "Started At",
  "Completed At",
  "Duration",
  "Records Processed",
  "Leads Created",
  "Leads Updated",
  "Duplicates Skipped",
  "Error Summary",
] as const;

/** Report of exactly the given rows. Only whitelisted summary fields — never logs, payloads or credentials. */
export function jobsToCsv(jobs: SyncJobDto[]): string {
  const rows = jobs.map((j) =>
    [
      j.id,
      j.platformLabel,
      jobTypeLabel(j.jobType),
      statusMeta(j.status).label,
      j.startedAt,
      j.completedAt,
      formatDuration(j.startedAt, j.completedAt),
      j.recordsProcessed,
      j.leadsCreated,
      j.leadsUpdated,
      j.duplicatesSkipped,
      j.lastError ? redactSecrets(j.lastError) : null,
    ]
      .map(csvCell)
      .join(","),
  );
  return [CSV_HEADERS.map(csvCell).join(","), ...rows].join("\r\n");
}
