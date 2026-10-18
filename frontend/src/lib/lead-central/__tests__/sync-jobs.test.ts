import { describe, expect, it } from "vitest";

import type { SyncJobDto, SyncJobListDto } from "@/lib/api/sync-jobs";
import {
  availableActions,
  buildListParams,
  csvCell,
  DEFAULT_FILTERS,
  filtersDirty,
  formatDuration,
  jobsToCsv,
  percentOf,
  progressPercent,
  redactSecrets,
  statusMeta,
  summarizeJobs,
} from "@/lib/lead-central/sync-jobs";
import { isApiUnavailable } from "@/lib/lead-central/use-sync-jobs";
import { ApiError } from "@/types/api/common";

const job = (over: Partial<SyncJobDto> = {}): SyncJobDto => ({
  id: "job_1",
  platform: "gmail",
  platformLabel: "Gmail",
  jobType: "manual",
  status: "success",
  startedAt: "2026-10-16T10:00:00Z",
  completedAt: "2026-10-16T10:02:14Z",
  triggeredBy: null,
  syncMode: null,
  recordsProcessed: null,
  leadsCreated: null,
  leadsUpdated: null,
  duplicatesSkipped: null,
  failedRecords: null,
  apiCalls: null,
  lastError: null,
  progress: null,
  allowedActions: [],
  retryOfJobId: null,
  ...over,
});
const list = (
  items: SyncJobDto[],
  over: Partial<SyncJobListDto> = {},
): SyncJobListDto => ({
  items,
  total: items.length,
  page: 1,
  pageSize: 20,
  summary: null,
  ...over,
});

describe("buildListParams (filters + search + date range combine)", () => {
  const now = new Date(2026, 9, 16, 15, 0, 0);
  it("omits 'all' values and blank search", () => {
    const p = buildListParams(DEFAULT_FILTERS, 1, 20, now);
    expect(p.platform).toBeUndefined();
    expect(p.jobType).toBeUndefined();
    expect(p.status).toBeUndefined();
    expect(p.q).toBeUndefined();
    expect(p.from).toBeDefined();
    expect(p.to).toBeDefined();
  });
  it("sends every active filter together", () => {
    const p = buildListParams(
      {
        platform: "gmail",
        jobType: "full",
        status: "failed",
        search: "  timeout ",
        preset: "30d",
      },
      3,
      20,
      now,
    );
    expect(p).toMatchObject({
      platform: "gmail",
      jobType: "full",
      status: "failed",
      q: "timeout",
      page: 3,
      pageSize: 20,
    });
  });
  it("'All time' sends no bounds", () => {
    const p = buildListParams(
      { ...DEFAULT_FILTERS, preset: "all" },
      1,
      20,
      now,
    );
    expect(p.from).toBeUndefined();
    expect(p.to).toBeUndefined();
  });
  it("filtersDirty only when something differs from the default", () => {
    expect(filtersDirty(DEFAULT_FILTERS)).toBe(false);
    expect(filtersDirty({ ...DEFAULT_FILTERS, status: "failed" })).toBe(true);
    expect(filtersDirty({ ...DEFAULT_FILTERS, preset: "30d" })).toBe(true);
  });
});

describe("summarizeJobs (KPI cards match the dataset)", () => {
  const rows = [
    job({ id: "a", status: "success" }),
    job({ id: "b", status: "success" }),
    job({ id: "c", status: "failed" }),
    job({ id: "d", status: "running" }),
    job({ id: "e", status: "queued" }),
    job({ id: "f", status: "partial" }),
  ];
  it("counts the loaded rows when they are the complete result", () => {
    expect(summarizeJobs(list(rows))).toEqual({
      total: 6,
      success: 2,
      failed: 1,
      running: 2,
      partial: 1,
      basis: "loaded",
    });
  });
  it("prefers the server aggregate", () => {
    const s = summarizeJobs(
      list(rows.slice(0, 2), {
        total: 500,
        summary: {
          total: 500,
          success: 400,
          partial: 10,
          failed: 40,
          running: 3,
          queued: 2,
        },
      }),
    );
    expect(s).toMatchObject({
      total: 500,
      success: 400,
      failed: 40,
      running: 5,
      basis: "server",
    });
  });
  it("is null (shown as —) for a partial page without a server aggregate", () => {
    expect(summarizeJobs(list(rows.slice(0, 2), { total: 100 }))).toBeNull();
  });
  it("confirmed empty result is a real zero", () => {
    expect(summarizeJobs(list([]))).toMatchObject({
      total: 0,
      success: 0,
      failed: 0,
      running: 0,
    });
  });
  it("never invents a percentage without a denominator", () => {
    expect(percentOf(0, 0)).toBeNull();
    expect(percentOf(1, 3)).toBe(33);
  });
});

describe("duration / progress", () => {
  it("formats completed durations", () => {
    expect(formatDuration("2026-10-16T10:00:00Z", "2026-10-16T10:02:14Z")).toBe(
      "2m 14s",
    );
    expect(formatDuration("2026-10-16T10:00:00Z", "2026-10-16T11:05:00Z")).toBe(
      "1h 5m",
    );
  });
  it("is null when running, missing or inverted", () => {
    expect(formatDuration("2026-10-16T10:00:00Z", null)).toBeNull();
    expect(formatDuration(null, "2026-10-16T10:00:00Z")).toBeNull();
    expect(
      formatDuration("2026-10-16T10:05:00Z", "2026-10-16T10:00:00Z"),
    ).toBeNull();
  });
  it("progress only for running jobs with consistent numbers", () => {
    const p = { processed: 25, total: 100, stage: null, updatedAt: null };
    expect(progressPercent("running", p)).toBe(25);
    expect(progressPercent("success", p)).toBeNull(); // no fabricated 100% for completed jobs
    expect(progressPercent("running", { ...p, total: null })).toBeNull();
    expect(progressPercent("running", { ...p, total: 0 })).toBeNull();
    expect(progressPercent("running", { ...p, processed: 200 })).toBeNull();
    expect(progressPercent("running", null)).toBeNull();
  });
});

describe("actions never appear without server support + valid lifecycle", () => {
  it("no allowedActions -> no actions", () => {
    expect(availableActions(job({ status: "failed" }))).toEqual([]);
  });
  it("retry only for failed/partial, cancel only for queued/running", () => {
    const all = ["retry", "rerun", "cancel"] as const;
    expect(
      availableActions(job({ status: "failed", allowedActions: [...all] })),
    ).toEqual(["retry", "rerun"]);
    expect(
      availableActions(job({ status: "running", allowedActions: [...all] })),
    ).toEqual(["cancel"]);
    expect(
      availableActions(job({ status: "success", allowedActions: [...all] })),
    ).toEqual(["rerun"]);
  });
});

describe("statuses", () => {
  it("unknown server status keeps its own name", () => {
    expect(statusMeta("on_hold")).toEqual({ label: "On Hold", tone: "muted" });
    expect(statusMeta("failed").tone).toBe("danger");
  });
});

describe("export + redaction", () => {
  it("escapes CSV and neutralises formula injection", () => {
    expect(csvCell('a,"b"')).toBe('"a,""b"""');
    expect(csvCell("=SUM(A1)")).toBe("'=SUM(A1)");
    expect(csvCell(null)).toBe("");
    expect(csvCell(7)).toBe("7");
  });
  it("exports only whitelisted columns for the given rows", () => {
    const csv = jobsToCsv([
      job({
        lastError: "Gmail said: Bearer abcdef123456789 rejected",
        recordsProcessed: 12,
      }),
    ]);
    const [head, row] = csv.split("\r\n");
    expect(head).toBe(
      "Job ID,Platform,Job Type,Status,Started At,Completed At,Duration,Records Processed,Leads Created,Leads Updated,Duplicates Skipped,Error Summary",
    );
    expect(row).toContain("job_1,Gmail,Manual Sync,Success");
    expect(row).toContain("2m 14s,12");
    expect(row).not.toContain("abcdef123456789");
  });
  it("redacts credential-shaped text", () => {
    expect(redactSecrets("Authorization: Bearer abc.def.ghi12345")).not.toMatch(
      /abc\.def/,
    );
    expect(redactSecrets("failed with access_token=sk_live_123 retry")).toBe(
      "failed with [redacted] retry",
    );
    expect(redactSecrets("password: hunter2")).toBe("[redacted]");
    expect(redactSecrets("Connection timed out")).toBe("Connection timed out");
  });
});

describe("API availability detection", () => {
  const err = (status: number) =>
    new ApiError({
      status,
      code: "X",
      message: "m",
      kind: status === 404 ? "not_found" : "server",
    });
  it("404/405/501 mean the contract isn't implemented", () => {
    expect(isApiUnavailable(err(404))).toBe(true);
    expect(isApiUnavailable(err(501))).toBe(true);
    expect(isApiUnavailable(err(500))).toBe(false);
    expect(isApiUnavailable(new Error("x"))).toBe(false);
  });
});
