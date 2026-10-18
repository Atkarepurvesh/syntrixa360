// Real onboarding endpoints (FastAPI, /api/v1/onboarding/*). Source of truth: backend/app/api/v1/onboarding.py.
// Organization-scoped calls send X-Organization-ID automatically (see setApiOrganizationId in ./client).
import { api } from "./client";
import type {
  ActivationData,
  AddressData,
  AddressInput,
  BusinessHoursData,
  BusinessProfileData,
  BusinessProfileInput,
  ContactData,
  ContactInput,
  DraftData,
  GstVerifyResult,
  OnboardingProgress,
  OnboardingSection,
  OnboardingSummaryData,
  ProductCategoriesData,
  SalesRegionsData,
  TaxProfileData,
  TaxProfileInput,
  DayHours,
} from "@/types/api/onboarding";

export const onboardingKeys = {
  status: ["onboarding", "status"] as const,
  summary: ["onboarding", "summary"] as const,
  drafts: ["onboarding", "drafts"] as const,
  activation: ["onboarding", "activation"] as const,
};

const P = "/onboarding";

export const onboardingApi = {
  getStatus: () => api.get<OnboardingProgress>(`${P}/status`),
  getSummary: () => api.get<OnboardingSummaryData>(`${P}/summary`),

  /** First save: creates the organization + owner membership. Must NOT send an org header. */
  startBusiness: (data: BusinessProfileInput) =>
    api.post<BusinessProfileData>(`${P}/business`, data, {
      skipOrganization: true,
    }),
  saveBusiness: (data: BusinessProfileInput) =>
    api.put<BusinessProfileData>(`${P}/business`, data),
  saveContact: (data: ContactInput) =>
    api.put<ContactData>(`${P}/contact`, data),
  saveAddress: (data: AddressInput) =>
    api.put<AddressData>(`${P}/address`, data),
  saveGst: (data: TaxProfileInput) => api.put<TaxProfileData>(`${P}/gst`, data),
  saveBusinessHours: (days: DayHours[]) =>
    api.put<BusinessHoursData>(`${P}/business-hours`, { days }),
  saveSalesRegions: (regions: string[]) =>
    api.put<SalesRegionsData>(`${P}/sales-regions`, { regions }),
  saveProductCategories: (categories: string[]) =>
    api.put<ProductCategoriesData>(`${P}/product-categories`, { categories }),

  /** Verifies the GSTIN already SAVED for the organization with the configured provider. */
  verifyGst: () => api.post<GstVerifyResult>(`${P}/gst/verify`),

  listDrafts: () => api.get<{ drafts: DraftData[] }>(`${P}/drafts`),
  saveDraft: (
    section: OnboardingSection,
    data: Record<string, unknown>,
    baseRevision?: number,
  ) =>
    api.put<DraftData>(`${P}/drafts/${section}`, {
      data,
      ...(baseRevision !== undefined ? { baseRevision } : {}),
    }),
  deleteDraft: (section: OnboardingSection) =>
    api.delete<{ deleted: boolean }>(`${P}/drafts/${section}`),

  getActivation: () => api.get<ActivationData>(`${P}/activation`),
  /** Atomic + idempotent: activates the workspace and starts the trial. 409 lists `remainingSteps`. */
  activate: () => api.post<ActivationData>(`${P}/activate`),
};
