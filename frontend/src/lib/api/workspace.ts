import { api } from "./client";

export interface WorkspaceSettingsDto {
  organizationStatus: string;
  configured: boolean;
  pipelineStages: Array<{
    code: string | null;
    name: string;
    stageType: string;
    probability: number;
    displayOrder: number;
    isSystem: boolean;
  }>;
  activityTypes: Array<{ code: string; label: string; enabled: boolean }>;
  quotation: {
    currency: string;
    taxDisplay: string;
    discountEnabled: boolean;
    validityDays: number;
    numberPrefix: string;
  } | null;
}

/** Read-only: what activation actually persisted. */
export const getWorkspaceSettings = () =>
  api.get<WorkspaceSettingsDto>("/workspace/settings");
