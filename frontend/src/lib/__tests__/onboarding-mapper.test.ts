import { describe, expect, it } from "vitest";

import {
  applyDrafts,
  displayGstStatus,
  draftSlice,
  formFieldFromBackend,
  fromSummary,
  normalizeWebsite,
  stepForProgress,
  toAddressInput,
  toBusinessInput,
  toCategoryNames,
  toContactInput,
  toHoursDays,
  toRegions,
  toTaxInput,
} from "../onboarding-mapper";
import {
  businessSetupDefaults,
  type BusinessSetupValues,
} from "../onboarding-schema";
import type { OnboardingSummaryData } from "@/types/api/onboarding";

const filled = (
  over: Partial<BusinessSetupValues> = {},
): BusinessSetupValues => ({
  ...businessSetupDefaults,
  companyName: "  Sharma Herbal Exports ",
  businessType: "exporter",
  industry: "ayurvedic_herbal",
  businessModel: ["b2b"],
  gstin: "27aapfu0939f1zv",
  city: "Orai",
  state: "Uttar Pradesh",
  postalCode: "285001",
  website: "sharma.example.com",
  businessEmail: "sales@sharma.example.com",
  productCategories: ["ayurvedic", "custom"],
  customCategory: "Dry Fruits",
  ...over,
});

describe("form -> backend payloads", () => {
  it("business profile", () => {
    const b = toBusinessInput(filled());
    expect(b).toMatchObject({
      name: "Sharma Herbal Exports",
      businessType: "exporter",
      businessTypeOther: null,
      legalName: null,
      website: "https://sharma.example.com",
      primarySalesMarket: "domestic",
      timeFormat: "24h",
    });
  });
  it("keeps 'other' business type text only when type is other", () => {
    expect(
      toBusinessInput(
        filled({ businessType: "other", businessTypeOther: "Broker" }),
      ).businessTypeOther,
    ).toBe("Broker");
    expect(
      toBusinessInput(
        filled({ businessType: "exporter", businessTypeOther: "x" }),
      ).businessTypeOther,
    ).toBeNull();
  });
  it("contact + address", () => {
    expect(toContactInput(filled())).toEqual({
      businessEmail: "sales@sharma.example.com",
      businessPhone: null,
      sameAsOwner: false,
    });
    expect(toAddressInput(filled())).toMatchObject({
      country: "IN",
      city: "Orai",
      postalCode: "285001",
      addressLine1: null,
    });
  });
  it("GST: registered only when a GSTIN is given, otherwise unknown (never 'unregistered' by assumption)", () => {
    expect(toTaxInput(filled())).toMatchObject({
      gstStatus: "registered",
      gstin: "27AAPFU0939F1ZV",
    });
    expect(toTaxInput(filled({ gstin: "" }))).toEqual({
      gstStatus: "unknown",
      gstin: null,
      gstLegalName: null,
      gstTradeName: null,
    });
  });
  it("business hours: closed days carry no times", () => {
    const days = toHoursDays(filled());
    expect(days).toHaveLength(7);
    expect(days.find((d) => d.day === "sunday")).toEqual({
      day: "sunday",
      isOpen: false,
      startTime: null,
      endTime: null,
    });
    expect(days.find((d) => d.day === "monday")).toEqual({
      day: "monday",
      isOpen: true,
      startTime: "09:00",
      endTime: "18:00",
    });
  });
  it("regions are only sent for non-domestic markets", () => {
    expect(toRegions(filled({ salesRegions: ["india"] }))).toEqual([]);
    expect(
      toRegions(
        filled({ primarySalesMarket: "both", salesRegions: ["india"] }),
      ),
    ).toEqual(["india"]);
  });
  it("categories: labels for known values, the typed name for custom, no duplicates", () => {
    expect(toCategoryNames(filled())).toEqual([
      "Ayurvedic Products",
      "Dry Fruits",
    ]);
    expect(
      toCategoryNames(
        filled({ productCategories: ["custom"], customCategory: "  " }),
      ),
    ).toEqual([]);
    expect(
      toCategoryNames(
        filled({
          productCategories: ["ayurvedic", "custom"],
          customCategory: "ayurvedic products",
        }),
      ),
    ).toEqual(["Ayurvedic Products"]);
  });
  it("normalizeWebsite", () => {
    expect(normalizeWebsite("")).toBeNull();
    expect(normalizeWebsite("http://a.com")).toBe("http://a.com");
  });
});

describe("backend -> form (resume after refresh)", () => {
  const summary: OnboardingSummaryData = {
    organization: {
      id: "o1",
      name: "Sharma",
      slug: "sharma",
      status: "onboarding",
    },
    progress: {
      status: "in_progress",
      currentStep: "business_hours",
      completedSteps: ["business_profile"],
      remainingSteps: [],
      completionPercentage: 14,
      totalSteps: 7,
    },
    sections: [],
    businessProfile: {
      organizationId: "o1",
      name: "Sharma",
      legalName: null,
      businessType: "exporter",
      businessTypeOther: null,
      industry: "ayurvedic_herbal",
      businessModel: ["b2b"],
      description: null,
      turnoverRange: "1cr_5cr",
      employeeCountRange: null,
      salesTeamSize: null,
      primarySalesMarket: "both",
      defaultCurrency: "USD",
      timezone: "Asia/Kolkata",
      language: "en",
      dateFormat: "DD/MM/YYYY",
      timeFormat: "12h",
      salesProcessType: null,
      website: null,
      logoUrl: null,
    },
    contact: null,
    address: {
      country: "IN",
      state: "UP",
      city: "Orai",
      addressLine1: null,
      addressLine2: null,
      postalCode: "285001",
    },
    taxProfile: {
      gstin: "27AAPFU0939F1ZV",
      gstStatus: "registered",
      gstLegalName: null,
      gstTradeName: null,
      gstVerifiedAt: null,
      gstVerificationStatus: "not_verified",
      gstVerificationCheckedAt: null,
    },
    businessHours: {
      days: [
        {
          day: "monday",
          isOpen: true,
          startTime: "10:00:00",
          endTime: "19:00:00",
        },
        { day: "sunday", isOpen: false, startTime: null, endTime: null },
      ],
    },
    salesRegions: {
      primarySalesMarket: "both",
      regions: [{ code: "india", name: "India" }],
    },
    productCategories: {
      categories: [
        { name: "Herbal Products", isCustom: false },
        { name: "Dry Fruits", isCustom: true },
      ],
    },
  };
  it("restores every saved section", () => {
    const v = fromSummary(summary);
    expect(v).toMatchObject({
      companyName: "Sharma",
      defaultCurrency: "USD",
      timeFormat: "12h",
      city: "Orai",
      gstin: "27AAPFU0939F1ZV",
    });
    expect(v.businessHours?.monday).toEqual({
      open: true,
      start: "10:00",
      end: "19:00",
    });
    expect(v.businessHours?.sunday.open).toBe(false);
    expect(v.salesRegions).toEqual(["india"]);
    expect(v.productCategories).toEqual(["herbal", "custom"]);
    expect(v.customCategory).toBe("Dry Fruits");
  });
  it("a GSTIN that was saved but never checked is 'pending', not 'verified'", () => {
    expect(fromSummary(summary).gstStatus).toBe("pending");
    expect(displayGstStatus("X", "verified")).toBe("verified");
    expect(displayGstStatus("X", "failed")).toBe("failed");
    expect(displayGstStatus(null, "verified")).toBe("not_provided");
  });
  it("unsaved sections leave the defaults alone", () => {
    expect(fromSummary(summary).businessEmail).toBeUndefined();
  });
});

describe("drafts", () => {
  it("slice contains only the section's own fields", () => {
    expect(
      Object.keys(draftSlice("business_address", filled())).sort(),
    ).toEqual([
      "addressLine1",
      "addressLine2",
      "city",
      "country",
      "postalCode",
      "state",
    ]);
  });
  it("applyDrafts overlays only known keys of the right section", () => {
    const out = applyDrafts({ city: "Old" }, [
      {
        section: "business_address",
        data: { city: "Draft city", evil: 1, gstin: "NOPE" },
      },
    ]);
    expect(out).toEqual({ city: "Draft city" });
  });
});

describe("resume routing + errors", () => {
  it.each([
    ["business_profile", "in_progress", "business"],
    ["tax_profile", "in_progress", "tax"],
    ["business_address", "in_progress", "location"],
    ["sales_regions", "in_progress", "configuration"],
    ["summary", "in_progress", "review"],
    ["completed", "completed", "ready"],
  ] as const)("%s -> %s", (currentStep, status, expected) => {
    expect(stepForProgress({ currentStep, status })).toBe(expected);
  });
  it("resume follows UI order, not backend order", () => {
    expect(
      stepForProgress({
        currentStep: "business_contact",
        status: "in_progress",
        remainingSteps: [
          "business_contact",
          "business_address",
          "tax_profile",
          "business_hours",
        ],
      }),
    ).toBe("tax");
    expect(
      stepForProgress({
        currentStep: "business_hours",
        status: "in_progress",
        remainingSteps: ["business_hours"],
      }),
    ).toBe("configuration");
  });
  it("maps backend field names onto form fields", () => {
    expect(formFieldFromBackend("name")).toBe("companyName");
    expect(formFieldFromBackend("postal_code")).toBe("postalCode");
    expect(formFieldFromBackend("postalCode")).toBe("postalCode");
    expect(formFieldFromBackend("days.3.end_time")).toBe("businessHours");
    expect(formFieldFromBackend("categories")).toBe("productCategories");
    expect(formFieldFromBackend("nonsense")).toBeNull();
  });
});
