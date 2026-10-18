// Sync Jobs & Logs (Lead Central, Prompt 3) API client.
//
// IMPORTANT: as of this prompt the backend has NO sync-job model, endpoint or worker (verified: no
// `sync_job` / `SyncLog` anywhere under backend/). These calls target the PROPOSED contract documented in
// docs/LEAD_CENTRAL_PROMPT3.md. Until the backend ships it, GET /lead-central/sync-jobs answers 404 and the
// page shows an explicit "not available yet" state. Nothing here fabricates data, and no client call can
// change a job's status: every mutation only *asks* the server, and the UI re-reads the server's answer.
import { api } from "./client";

/** Lifecycle proposed for the backend job model. Unknown values from the server are tolerated (string & {}). */
export type SyncJobStatus =
  "queued" | "running" | "success" | "partial" | "failed" | "cancelled";

export type SyncJobType =
  "initial" | "full" | "incremental" | "scheduled" | "manual" | "webhook";

/** Actions the SERVER says are allowed for a job right now (permission + lifecycle + source config). */
export type SyncJobAction = "retry" | "rerun" | "cancel";

export interface SyncProgressDto {
  processed: number | null;
  total: number | null;
  stage: string | null;
  updatedAt: string | null;
}

export interface SyncJobDto {
  id: string;
  /** Provider key, e.g. "gmail". */
  platform: string;
  platformLabel: string;
  jobType: SyncJobType | (string & {});
  status: SyncJobStatus | (string & {});
  startedAt: string | null;
  completedAt: string | null;
  triggeredBy: string | null;
  syncMode: string | null;
  recordsProcessed: number | null;
  leadsCreated: number | null;
  leadsUpdated: number | null;
  duplicatesSkipped: number | null;
  failedRecords: number | null;
  apiCalls: number | null;
  /** Server-sanitised, human-readable summary. Never a stack trace. */
  lastError: string | null;
  progress: SyncProgressDto | null;
  allowedActions: SyncJobAction[];
  retryOfJobId: string | null;
}

export interface SyncJobSummaryDto {
  total: number;
  success: number;
  partial: number;
  failed: number;
  running: number;
  queued: number;
}

export interface SyncJobListDto {
  items: SyncJobDto[];
  /** Total rows matching the filters (all pages). */
  total: number;
  page: number;
  pageSize: number;
  /** Aggregate over ALL rows matching the date range (not only this page); null if the server omits it. */
  summary: SyncJobSummaryDto | null;
}

export interface SyncLogEntryDto {
  id: string;
  at: string;
  level: "info" | "warning" | "error" | (string & {});
  stage: string | null;
  message: string;
}

export interface SyncErrorDto {
  id: string;
  at: string;
  category: string;
  message: string;
  stage: string | null;
  /** Non-sensitive reference to the affected record, if known. */
  recordRef: string | null;
  retryable: boolean | null;
}

export type SyncLeadOutcome = "created" | "updated" | "skipped" | (string & {});

export interface SyncJobLeadDto {
  leadId: string;
  name: string;
  outcome: SyncLeadOutcome;
}

export interface SyncItemsDto<T> {
  items: T[];
  total: number;
}

export interface SyncJobListParams {
  platform?: string | undefined;
  jobType?: string | undefined;
  status?: string | undefined;
  /** ISO timestamps, inclusive start / exclusive end. */
  from?: string | undefined;
  to?: string | undefined;
  q?: string | undefined;
  page: number;
  pageSize: number;
}

export interface JobActionResultDto {
  /** Present when the server created a new job (retry / re-run). */
  jobId: string | null;
  status: SyncJobStatus | (string & {});
}

const BASE = "/lead-central/sync-jobs";
const enc = encodeURIComponent;

export const listSyncJobs = (p: SyncJobListParams, signal?: AbortSignal) =>
  api.get<SyncJobListDto>(BASE, {
    query: {
      platform: p.platform,
      job_type: p.jobType,
      status: p.status,
      from: p.from,
      to: p.to,
      q: p.q,
      page: p.page,
      page_size: p.pageSize,
    },
    signal,
  });

export const getSyncJob = (id: string) =>
  api.get<SyncJobDto>(`${BASE}/${enc(id)}`);
export const getSyncJobLogs = (id: string) =>
  api.get<SyncItemsDto<SyncLogEntryDto>>(`${BASE}/${enc(id)}/logs`);
export const getSyncJobErrors = (id: string) =>
  api.get<SyncItemsDto<SyncErrorDto>>(`${BASE}/${enc(id)}/errors`);
export const getSyncJobLeads = (id: string) =>
  api.get<SyncItemsDto<SyncJobLeadDto>>(`${BASE}/${enc(id)}/leads`);

export const retrySyncJob = (id: string) =>
  api.post<JobActionResultDto>(`${BASE}/${enc(id)}/retry`);
export const rerunSyncJob = (id: string) =>
  api.post<JobActionResultDto>(`${BASE}/${enc(id)}/rerun`);
export const cancelSyncJob = (id: string) =>
  api.post<JobActionResultDto>(`${BASE}/${enc(id)}/cancel`);
