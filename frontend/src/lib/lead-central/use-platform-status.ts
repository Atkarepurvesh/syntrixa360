import { useQuery } from "@tanstack/react-query";

import { listChannels } from "@/lib/api/channels";

/** Real GET /api/v1/channels (org-scoped by the API client's session; no client-side org id is trusted). */
export function usePlatformStatus() {
  return useQuery({
    queryKey: ["lead-central", "channels"],
    queryFn: listChannels,
    staleTime: 30_000,
    retry: 1,
  });
}
