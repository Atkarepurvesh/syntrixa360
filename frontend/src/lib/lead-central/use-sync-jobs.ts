import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  cancelSyncJob,
  getSyncJobErrors,
  getSyncJobLeads,
  getSyncJobLogs,
  listSyncJobs,
  rerunSyncJob,
  retrySyncJob,
  type JobActionResultDto,
  type SyncJobAction,
  type SyncJobListParams,
} from "@/lib/api/sync-jobs";
import { ApiError } from "@/types/api/common";

const KEY = ["lead-central", "sync-jobs"] as const;

/** The backend doesn't expose the sync-jobs contract (yet): 404 / 405 / 501 on the endpoint itself. */
export function isApiUnavailable(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    (error.status === 404 || error.status === 405 || error.status === 501)
  );
}

export const isForbidden = (e: unknown) =>
  e instanceof ApiError && e.status === 403;

const noRetryOnClientErrors = (count: number, error: unknown) =>
  !(error instanceof ApiError && error.status >= 400 && error.status < 500) &&
  count < 1;

/** GET /lead-central/sync-jobs — server-filtered, server-paged. Previous page stays visible while paging. */
export function useSyncJobs(params: SyncJobListParams) {
  return useQuery({
    queryKey: [...KEY, "list", params],
    queryFn: ({ signal }) => listSyncJobs(params, signal),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
    retry: noRetryOnClientErrors,
  });
}

/** Detail-tab data is only fetched when its tab is opened for the selected job. */
export function useSyncJobLogs(jobId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: [...KEY, "logs", jobId],
    queryFn: () => getSyncJobLogs(jobId as string),
    enabled: enabled && jobId !== null,
    retry: noRetryOnClientErrors,
  });
}
export function useSyncJobErrors(jobId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: [...KEY, "errors", jobId],
    queryFn: () => getSyncJobErrors(jobId as string),
    enabled: enabled && jobId !== null,
    retry: noRetryOnClientErrors,
  });
}
export function useSyncJobLeads(jobId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: [...KEY, "leads", jobId],
    queryFn: () => getSyncJobLeads(jobId as string),
    enabled: enabled && jobId !== null,
    retry: noRetryOnClientErrors,
  });
}

const ACTION_FN: Record<
  SyncJobAction,
  (id: string) => Promise<JobActionResultDto>
> = {
  retry: retrySyncJob,
  rerun: rerunSyncJob,
  cancel: cancelSyncJob,
};

/**
 * Asks the server to retry / re-run / cancel. It NEVER edits cached job status: on settle the whole sync-jobs
 * cache is invalidated and the status shown is whatever the server then reports. `isPending` doubles as the
 * duplicate-submission guard (the buttons are disabled while a request is in flight).
 */
export function useSyncJobAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ action, jobId }: { action: SyncJobAction; jobId: string }) =>
      ACTION_FN[action](jobId),
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
