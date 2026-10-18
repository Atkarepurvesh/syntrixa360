// Platform Sync Status view-model. Real data only: the connection state comes from GET /api/v1/channels
// (src/lib/api/channels.ts). Providers the backend does not list are shown as "Not available yet" — never as
// connected, and never with an invented sync time.
import type { ChannelStatusDto } from "@/lib/api/channels";

export type PlatformTone = "connected" | "attention" | "pending" | "idle";

export type PlatformRow = {
  key: string;
  name: string;
  /** Short, honest state label. */
  statusLabel: string;
  tone: PlatformTone;
  detail: string;
  /** ISO timestamp of the last health check reported by the API (NOT a lead-sync time); null if none. */
  lastCheckedAt: string | null;
  /** True when this row comes from the backend channel list. */
  fromApi: boolean;
};

/** Lead-source platforms in the Lead Central brief that the channels API does not (yet) cover. */
const UNLISTED_PLATFORMS = [
  "IndiaMART",
  "LinkedIn",
  "Facebook",
  "Instagram",
] as const;

function describe(
  c: ChannelStatusDto,
): Pick<PlatformRow, "statusLabel" | "tone"> {
  switch (c.status) {
    case "connected":
      return { statusLabel: "Connected", tone: "connected" };
    case "error":
      return { statusLabel: "Error", tone: "attention" };
    case "pending":
      return { statusLabel: "Pending", tone: "pending" };
    case "disconnected":
      return { statusLabel: "Disconnected", tone: "attention" };
    default:
      return c.integrationAvailable
        ? { statusLabel: "Not connected", tone: "idle" }
        : { statusLabel: "Not available yet", tone: "idle" };
  }
}

export function buildPlatformRows(channels: ChannelStatusDto[]): PlatformRow[] {
  const rows: PlatformRow[] = channels.map((c) => ({
    key: c.channelType,
    name: c.label,
    ...describe(c),
    detail: c.message,
    lastCheckedAt: c.lastCheckedAt,
    fromApi: true,
  }));
  const known = new Set(channels.map((c) => c.label.toLowerCase()));
  for (const name of UNLISTED_PLATFORMS) {
    if (known.has(name.toLowerCase())) continue;
    rows.push({
      key: `unlisted-${name}`,
      name,
      statusLabel: "Not available yet",
      tone: "idle",
      detail: "No integration exists for this platform yet.",
      lastCheckedAt: null,
      fromApi: false,
    });
  }
  return rows;
}
