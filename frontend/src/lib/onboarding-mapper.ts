// Pure translation between the wizard's single form (BusinessSetupValues) and the seven backend sections.
// No I/O here so the contract with backend/app/schemas/onboarding.py can be unit-tested.
import type { WizardStepKey } from "@/components/onboarding/wizard-steps";
import type {
  AddressInput,
  BusinessProfileInput,
  ContactInput,
  DayHours,
  OnboardingProgress,
  OnboardingSection,
  OnboardingSummaryData,
  TaxProfileInput,
} from "@/types/api/onboarding";

import { PRODUCT_CATEGORIES, WEEK_DAYS } from "./onboarding-options";
import {
  businessSetupDefaults,
  type BusinessSetupValues,
  type GstStatus,
} from "./onboarding-schema";

type Values = BusinessSetupValues;
const blank = (s: string | undefined | null): string | null =>
  s && s.trim() ? s.trim() : null;

export function normalizeWebsite(s: string | undefined | null): string | null {
  const v = blank(s);
  if (!v) return null;
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
}

// ------------------------------------------------------------------ form -> backend payloads
export function toBusinessInput(v: Values): BusinessProfileInput {
  return {
    name: v.companyName.trim(),
    legalName: blank(v.legalName),
    businessType: v.businessType,
    businessTypeOther:
      v.businessType === "other" ? blank(v.businessTypeOther) : null,
    industry: v.industry,
    businessModel: v.businessModel,
    description: blank(v.description),
    turnoverRange: blank(v.turnoverRange),
    employeeCountRange: blank(v.employeeCountRange),
    salesTeamSize: blank(v.salesTeamSize),
    primarySalesMarket: v.primarySalesMarket,
    defaultCurrency: v.defaultCurrency,
    timezone: v.timezone,
    language: v.language,
    dateFormat: v.dateFormat,
    timeFormat: v.timeFormat,
    salesProcessType: blank(v.salesProcessType),
    website: normalizeWebsite(v.website),
  };
}

export function toContactInput(v: Values): ContactInput {
  return {
    businessEmail: blank(v.businessEmail),
    businessPhone: blank(v.businessPhone),
    sameAsOwner: v.sameAsOwner,
  };
}

export function toAddressInput(v: Values): AddressInput {
  return {
    country: v.country,
    state: v.state,
    city: v.city.trim(),
    addressLine1: blank(v.addressLine1),
    addressLine2: blank(v.addressLine2),
    postalCode: v.postalCode.trim(),
  };
}

export function toTaxInput(v: Values): TaxProfileInput {
  const gstin = blank(v.gstin)?.toUpperCase() ?? null;
  // No GSTIN entered = we do not know the registration status (never claim "unregistered" on their behalf).
  if (!gstin)
    return {
      gstStatus: "unknown",
      gstin: null,
      gstLegalName: null,
      gstTradeName: null,
    };
  return {
    gstStatus: "registered",
    gstin,
    gstLegalName: blank(v.gstLegalName),
    gstTradeName: blank(v.gstTradeName),
  };
}

export function toHoursDays(v: Values): DayHours[] {
  return WEEK_DAYS.map(({ key }) => {
    const d = v.businessHours[key];
    return {
      day: key,
      isOpen: d.open,
      startTime: d.open ? d.start : null,
      endTime: d.open ? d.end : null,
    };
  });
}

export function toRegions(v: Values): string[] {
  return v.primarySalesMarket === "domestic" ? [] : v.salesRegions;
}

export function toCategoryNames(v: Values): string[] {
  const out: string[] = [];
  for (const value of v.productCategories) {
    const name =
      value === "custom"
        ? blank(v.customCategory)
        : PRODUCT_CATEGORIES.find((c) => c.value === value)?.label;
    if (name && !out.some((n) => n.toLowerCase() === name.toLowerCase()))
      out.push(name);
  }
  return out;
}

// ------------------------------------------------------------------ backend -> form
export function fromSummary(s: OnboardingSummaryData): Partial<Values> {
  const out: Partial<Values> = {};
  const b = s.businessProfile;
  if (b) {
    Object.assign(out, {
      companyName: b.name,
      legalName: b.legalName ?? "",
      businessType: b.businessType,
      businessTypeOther: b.businessTypeOther ?? "",
      industry: b.industry,
      businessModel: b.businessModel,
      description: b.description ?? "",
      turnoverRange: b.turnoverRange ?? "",
      employeeCountRange: b.employeeCountRange ?? "",
      salesTeamSize: b.salesTeamSize ?? "",
      primarySalesMarket: b.primarySalesMarket as Values["primarySalesMarket"],
      defaultCurrency: b.defaultCurrency,
      timezone: b.timezone,
      language: b.language,
      dateFormat: b.dateFormat,
      timeFormat: b.timeFormat,
      salesProcessType: b.salesProcessType ?? "",
      website: b.website ?? "",
    });
  }
  if (s.contact) {
    Object.assign(out, {
      businessEmail: s.contact.businessEmail ?? "",
      businessPhone: s.contact.businessPhone ?? "",
      sameAsOwner: s.contact.sameAsOwner,
    });
  }
  if (s.address) {
    Object.assign(out, {
      country: s.address.country,
      state: s.address.state,
      city: s.address.city,
      addressLine1: s.address.addressLine1 ?? "",
      addressLine2: s.address.addressLine2 ?? "",
      postalCode: s.address.postalCode,
    });
  }
  if (s.taxProfile) {
    Object.assign(out, {
      gstin: s.taxProfile.gstin ?? "",
      gstLegalName: s.taxProfile.gstLegalName ?? "",
      gstTradeName: s.taxProfile.gstTradeName ?? "",
      gstStatus: displayGstStatus(
        s.taxProfile.gstin,
        s.taxProfile.gstVerificationStatus,
      ),
    });
  }
  if (s.businessHours?.days.length) {
    const hours = { ...businessSetupDefaults.businessHours };
    for (const d of s.businessHours.days) {
      hours[d.day] = {
        open: d.isOpen,
        start: d.startTime?.slice(0, 5) ?? hours[d.day].start,
        end: d.endTime?.slice(0, 5) ?? hours[d.day].end,
      };
    }
    out.businessHours = hours;
  }
  if (s.salesRegions.regions.length)
    out.salesRegions = s.salesRegions.regions.map((r) => r.code);
  if (s.productCategories.categories.length) {
    const values: string[] = [];
    let custom = "";
    for (const c of s.productCategories.categories) {
      const known = PRODUCT_CATEGORIES.find(
        (p) => p.label === c.name && p.value !== "custom",
      );
      if (known) values.push(known.value);
      else if (!custom) {
        custom = c.name; // the form has ONE custom slot; further custom names are kept by the backend, not shown here
        values.push("custom");
      }
    }
    out.productCategories = values;
    out.customCategory = custom;
  }
  return out;
}

export function displayGstStatus(
  gstin: string | null | undefined,
  verification: string,
): GstStatus {
  if (!gstin) return "not_provided";
  if (verification === "verified") return "verified";
  if (verification === "failed") return "failed";
  return "pending"; // saved but never verified by a provider
}

// ------------------------------------------------------------------ drafts
export const SECTION_FIELDS: Record<
  OnboardingSection,
  ReadonlyArray<keyof Values>
> = {
  business_profile: [
    "companyName",
    "legalName",
    "businessType",
    "businessTypeOther",
    "industry",
    "businessModel",
    "description",
    "turnoverRange",
    "employeeCountRange",
    "salesTeamSize",
    "primarySalesMarket",
    "defaultCurrency",
    "timezone",
    "language",
    "dateFormat",
    "timeFormat",
    "salesProcessType",
    "website",
  ],
  business_contact: ["sameAsOwner", "businessPhone", "businessEmail"],
  business_address: [
    "country",
    "state",
    "city",
    "addressLine1",
    "addressLine2",
    "postalCode",
  ],
  tax_profile: ["gstin", "gstLegalName", "gstTradeName"],
  business_hours: ["businessHours"],
  sales_regions: ["salesRegions"],
  product_categories: ["productCategories", "customCategory"],
};

/** Which backend sections a wizard screen saves when the user presses Next. */
export const STEP_SECTIONS: Partial<
  Record<WizardStepKey, OnboardingSection[]>
> = {
  business: ["business_profile"],
  tax: ["tax_profile"],
  company: ["business_profile"],
  location: ["business_address", "business_contact", "business_profile"],
  configuration: [
    "business_profile",
    "business_hours",
    "sales_regions",
    "product_categories",
  ],
};

export function draftSlice(
  section: OnboardingSection,
  v: Values,
): Record<string, unknown> {
  return Object.fromEntries(SECTION_FIELDS[section].map((k) => [k, v[k]]));
}

/** Overlay unsaved drafts on top of saved values. Unknown keys are ignored (a draft is never trusted blindly). */
export function applyDrafts(
  base: Partial<Values>,
  drafts: Array<{ section: OnboardingSection; data: Record<string, unknown> }>,
): Partial<Values> {
  const out: Record<string, unknown> = { ...base };
  for (const d of drafts) {
    const allowed = SECTION_FIELDS[d.section];
    if (!allowed) continue;
    for (const key of allowed) if (key in d.data) out[key] = d.data[key];
  }
  return out as Partial<Values>;
}

// ------------------------------------------------------------------ resume routing
/** Sections a wizard screen is responsible for, in UI order (backend order differs: contact/address precede tax). */
const STEP_REQUIRED: Array<[WizardStepKey, OnboardingSection[]]> = [
  ["business", ["business_profile"]],
  ["tax", ["tax_profile"]],
  ["location", ["business_address", "business_contact"]],
  ["configuration", ["business_hours", "sales_regions", "product_categories"]],
];

export function stepForProgress(
  p: Pick<OnboardingProgress, "currentStep" | "status"> & {
    remainingSteps?: OnboardingSection[];
  },
): WizardStepKey {
  if (p.status === "completed" || p.currentStep === "completed") return "ready";
  const remaining =
    p.remainingSteps ??
    (p.currentStep === "summary" ? [] : [p.currentStep as OnboardingSection]);
  for (const [step, sections] of STEP_REQUIRED) {
    if (sections.some((sec) => remaining.includes(sec))) return step;
  }
  return "review"; // everything saved, only activation is left
}

// ------------------------------------------------------------------ backend validation errors -> form fields
const FIELD_RENAMES: Record<string, keyof Values> = {
  name: "companyName",
  days: "businessHours",
  regions: "salesRegions",
  categories: "productCategories",
};
const snakeToCamel = (s: string) =>
  s.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());

export function formFieldFromBackend(field: string): keyof Values | null {
  const head = (field.split(".").find((p) => p !== "body") ?? "").trim();
  if (!head) return null;
  const camel = FIELD_RENAMES[head] ?? snakeToCamel(head);
  return camel in businessSetupDefaults ? (camel as keyof Values) : null;
}
