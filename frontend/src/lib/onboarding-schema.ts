import { z } from "zod";

import { WEEK_DAYS, type WeekDayKey } from "./onboarding-options";

// GSTIN format: 2-digit state code, 10-char PAN, 1 entity code, "Z", 1 checksum.
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export type GstStatus = "not_provided" | "pending" | "verified" | "failed";

const businessHoursDaySchema = z
  .object({
    open: z.boolean(),
    start: z.string(),
    end: z.string(),
  })
  .superRefine((day, ctx) => {
    if (day.open && day.start >= day.end) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Closing time must be after opening time.",
        path: ["end"],
      });
    }
  });

const businessHoursSchema = z.object(
  Object.fromEntries(WEEK_DAYS.map((d) => [d.key, businessHoursDaySchema])) as Record<
    WeekDayKey,
    typeof businessHoursDaySchema
  >,
);

export const businessSetupSchema = z
  .object({
    // 1. Business Information
    companyName: z
      .string()
      .trim()
      .min(1, "Please enter your company or business name.")
      .max(150, "Company name is too long."),
    legalName: z.string().trim().max(150).optional().or(z.literal("")),
    businessType: z.string().min(1, "Please select a business type."),
    businessTypeOther: z.string().trim().max(100).optional().or(z.literal("")),
    industry: z.string().min(1, "Please select an industry."),
    businessModel: z.array(z.string()),
    description: z
      .string()
      .trim()
      .max(600, "Keep the description under 600 characters.")
      .optional()
      .or(z.literal("")),

    // 2. Tax / GST
    gstin: z.string().trim().optional().or(z.literal("")),
    gstStatus: z.custom<GstStatus>(),
    gstLegalName: z.string().optional(),
    gstTradeName: z.string().optional(),

    // 3. Company Details
    turnoverRange: z.string().optional().or(z.literal("")),
    employeeCountRange: z.string().optional().or(z.literal("")),

    // 4. Location
    country: z.string().min(1, "Please select a country."),
    state: z.string().min(1, "Please select a state or province."),
    city: z.string().trim().min(1, "Please enter a city."),
    addressLine1: z.string().trim().max(200).optional().or(z.literal("")),
    addressLine2: z.string().trim().max(200).optional().or(z.literal("")),
    postalCode: z.string().trim().min(1, "Please enter a postal / ZIP code."),
    website: z.string().trim().optional().or(z.literal("")),
    logoDataUrl: z.string().optional(),
    logoFileName: z.string().optional(),

    // 4b. Business contact
    sameAsOwner: z.boolean(),
    businessPhone: z.string().trim().optional().or(z.literal("")),
    businessEmail: z
      .string()
      .trim()
      .optional()
      .or(z.literal(""))
      .refine((v) => !v || z.string().email().safeParse(v).success, {
        message: "Please enter a valid business email.",
      }),

    // 5. Configuration
    primarySalesMarket: z.enum(["domestic", "international", "both"]),
    salesRegions: z.array(z.string()),
    defaultCurrency: z.string().min(1, "Please select a default currency."),
    timezone: z.string().min(1, "Please select a business timezone."),
    language: z.string().min(1),
    dateFormat: z.string().min(1),
    timeFormat: z.enum(["12h", "24h"]),
    businessHours: businessHoursSchema,
    salesTeamSize: z.string().optional().or(z.literal("")),
    productCategories: z.array(z.string()).min(1, "Select at least one product category."),
    customCategory: z.string().trim().optional().or(z.literal("")),
    salesProcessType: z.string().optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (data.businessType === "other" && !data.businessTypeOther?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please specify your business type.",
        path: ["businessTypeOther"],
      });
    }

    if (data.gstin) {
      if (!GSTIN_REGEX.test(data.gstin.toUpperCase())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please enter a valid GSTIN.",
          path: ["gstin"],
        });
      }
    }

    if (data.website) {
      const normalized = /^https?:\/\//i.test(data.website)
        ? data.website
        : `https://${data.website}`;
      try {
        new URL(normalized);
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please enter a valid website URL.",
          path: ["website"],
        });
      }
    }

    if (!data.sameAsOwner && data.businessEmail === "" && data.businessPhone === "") {
      // Business contact is optional overall (owner contact can be reused),
      // so no error here — this branch exists to document the rule (item 31).
    }

    if (data.country === "IN" && data.postalCode) {
      if (!/^\d{6}$/.test(data.postalCode.trim())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please enter a valid 6-digit PIN code.",
          path: ["postalCode"],
        });
      }
    }

    if (data.primarySalesMarket !== "domestic" && data.salesRegions.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select at least one sales region.",
        path: ["salesRegions"],
      });
    }

    if (data.productCategories.includes("custom") && !data.customCategory?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please add your custom product category.",
        path: ["customCategory"],
      });
    }
  });

export type BusinessSetupValues = z.infer<typeof businessSetupSchema>;

export const defaultBusinessHours = Object.fromEntries(
  WEEK_DAYS.map((d) => [
    d.key,
    {
      open: d.key !== "sunday",
      start: "09:00",
      end: "18:00",
    },
  ]),
) as BusinessSetupValues["businessHours"];

export const businessSetupDefaults: BusinessSetupValues = {
  companyName: "",
  legalName: "",
  businessType: "",
  businessTypeOther: "",
  industry: "",
  businessModel: [],
  description: "",

  gstin: "",
  gstStatus: "not_provided",
  gstLegalName: "",
  gstTradeName: "",

  turnoverRange: "",
  employeeCountRange: "",

  country: "IN",
  state: "",
  city: "",
  addressLine1: "",
  addressLine2: "",
  postalCode: "",
  website: "",
  logoDataUrl: "",
  logoFileName: "",

  sameAsOwner: false,
  businessPhone: "",
  businessEmail: "",

  primarySalesMarket: "domestic",
  salesRegions: [],
  defaultCurrency: "INR",
  timezone: "Asia/Kolkata",
  language: "en",
  dateFormat: "DD/MM/YYYY",
  timeFormat: "24h",
  businessHours: defaultBusinessHours,
  salesTeamSize: "",
  productCategories: [],
  customCategory: "",
  salesProcessType: "",
};

// Field groups used to validate one wizard step at a time via `trigger()`.
export const STEP_FIELDS = {
  business: [
    "companyName",
    "legalName",
    "businessType",
    "businessTypeOther",
    "industry",
    "businessModel",
    "description",
  ],
  tax: ["gstin", "gstStatus"],
  company: ["turnoverRange", "employeeCountRange"],
  location: [
    "country",
    "state",
    "city",
    "addressLine1",
    "addressLine2",
    "postalCode",
    "website",
    "logoDataUrl",
    "sameAsOwner",
    "businessPhone",
    "businessEmail",
  ],
  configuration: [
    "primarySalesMarket",
    "salesRegions",
    "defaultCurrency",
    "timezone",
    "language",
    "dateFormat",
    "timeFormat",
    "businessHours",
    "salesTeamSize",
    "productCategories",
    "customCategory",
    "salesProcessType",
  ],
} as const satisfies Record<string, Array<keyof BusinessSetupValues>>;
