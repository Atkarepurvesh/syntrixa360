// Orchestrates the real backend calls behind each wizard screen. No component state, no mock data.
import type { WizardStepKey } from "@/components/onboarding/wizard-steps";
import { ApiError } from "@/types/api/common";
import type {
  ActivationData,
  OnboardingProgress,
  OnboardingSection,
} from "@/types/api/onboarding";

import { setApiOrganizationId } from "./api/client";
import type { DraftSaver, SaveFn } from "./draft-autosave";
import { onboardingApi } from "./api/onboarding";
import {
  applyDrafts,
  draftSlice,
  formFieldFromBackend,
  fromSummary,
  STEP_SECTIONS,
  stepForProgress,
  toAddressInput,
  toBusinessInput,
  toCategoryNames,
  toContactInput,
  toHoursDays,
  toRegions,
  toTaxInput,
} from "./onboarding-mapper";
import type { BusinessSetupValues } from "./onboarding-schema";

type Values = BusinessSetupValues;

export interface ResumeResult {
  organizationId: string;
  values: Partial<Values>;
  step: WizardStepKey;
  progress: OnboardingProgress;
  restoredDraft: boolean;
}

/** Load everything the server has for an organization still in onboarding (saved sections + unsaved drafts). */
export async function resumeOnboarding(
  organizationId: string,
): Promise<ResumeResult> {
  setApiOrganizationId(organizationId);
  const [summary, drafts] = await Promise.all([
    onboardingApi.getSummary(),
    onboardingApi.listDrafts(),
  ]);
  return {
    organizationId,
    values: applyDrafts(fromSummary(summary), drafts.drafts),
    step: stepForProgress(summary.progress),
    progress: summary.progress,
    restoredDraft: drafts.drafts.length > 0,
  };
}

/**
 * Save the backend sections that belong to a wizard screen. Each section is its own atomic request; if one
 * fails the earlier ones stay saved (the next attempt simply overwrites them - every save is an upsert).
 * Returns the organization id (created by the very first save).
 */
export async function saveStep(
  step: WizardStepKey,
  v: Values,
  organizationId: string | null,
): Promise<string | null> {
  let orgId = organizationId;
  const saveProfile = async () => {
    if (orgId) {
      await onboardingApi.saveBusiness(toBusinessInput(v));
      return;
    }
    const created = await onboardingApi.startBusiness(toBusinessInput(v));
    orgId = created.organizationId;
    setApiOrganizationId(orgId);
  };

  const needOrg = (): string => {
    if (!orgId) throw new Error("Save your business information first.");
    return orgId;
  };
  if (step !== "business" && step !== "company") {
    if (["tax", "location", "configuration"].includes(step)) needOrg();
  }

  switch (step) {
    case "business":
    case "company":
      await saveProfile();
      break;
    case "tax":
      await onboardingApi.saveGst(toTaxInput(v));
      break;
    case "location":
      await onboardingApi.saveAddress(toAddressInput(v));
      await onboardingApi.saveContact(toContactInput(v));
      await onboardingApi.saveBusiness(toBusinessInput(v)); // website lives on the business profile
      break;
    case "configuration":
      await onboardingApi.saveBusiness(toBusinessInput(v)); // market, currency, timezone ... first
      await onboardingApi.saveBusinessHours(toHoursDays(v));
      await onboardingApi.saveSalesRegions(toRegions(v));
      await onboardingApi.saveProductCategories(toCategoryNames(v));
      break;
    default:
      break; // trial / review / ready have nothing to save
  }
  return orgId;
}

/** Server draft write used by DraftSaver (carries the revision so stale writes are refused). */
export const saveDraftRequest: SaveFn = (section, data, baseRevision) =>
  onboardingApi.saveDraft(section as OnboardingSection, data, baseRevision);

/** Queue the unsaved values of every section the current screen covers. */
export function queueDrafts(
  saver: DraftSaver,
  step: WizardStepKey,
  v: Values,
  organizationId: string | null,
): void {
  if (!organizationId) return;
  for (const s of STEP_SECTIONS[step] ?? []) saver.enqueue(s, draftSlice(s, v));
}

/** The final step: validates server-side that every section is saved, then activates workspace + trial. */
export async function activateWorkspace(): Promise<ActivationData> {
  return onboardingApi.activate();
}

export interface FlowError {
  message: string;
  /** form field -> message, for server-side validation errors */
  fields: Partial<Record<keyof Values, string>>;
  remainingSteps?: string[];
  needsLogin: boolean;
}

export function describeError(e: unknown): FlowError {
  if (!(e instanceof ApiError))
    return {
      message: "Something went wrong. Please try again.",
      fields: {},
      needsLogin: false,
    };
  const fields: FlowError["fields"] = {};
  for (const fe of e.fieldErrors ?? []) {
    const key = formFieldFromBackend(fe.field);
    if (key && !fields[key]) fields[key] = fe.message;
  }
  const remaining = (e.details as { remaining_steps?: unknown } | undefined)
    ?.remaining_steps;
  return {
    message: e.message,
    fields,
    needsLogin: e.kind === "unauthorized",
    ...(Array.isArray(remaining)
      ? { remainingSteps: remaining.map(String) }
      : {}),
  };
}
