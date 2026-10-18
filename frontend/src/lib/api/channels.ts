import { api } from "./client";

/** Mirrors backend ChannelOut. There is intentionally no credential/token field. */
export interface ChannelStatusDto {
  channelType: string;
  label: string;
  status:
    | "not_connected"
    | "pending"
    | "connected"
    | "error"
    | "disconnected"
    | (string & {});
  integrationAvailable: boolean;
  setupRequired: boolean;
  message: string;
  healthStatus: string | null;
  displayName: string | null;
  connectedAt: string | null;
  lastCheckedAt: string | null;
}
export interface ChannelListDto {
  channels: ChannelStatusDto[];
  connectedCount: number;
}

/** Real connection status from the server. No client call can mark a channel connected. */
export const listChannels = () => api.get<ChannelListDto>("/channels");
