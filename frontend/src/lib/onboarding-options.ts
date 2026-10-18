// Static reference data for the Business Setup (Part 2) onboarding wizard.
// Kept separate from the schema/store so new options can be added without
// touching validation or persistence logic.

export const BUSINESS_TYPES = [
  { value: "manufacturer", label: "Manufacturer" },
  { value: "exporter", label: "Exporter" },
  { value: "importer", label: "Importer" },
  { value: "wholesaler", label: "Wholesaler" },
  { value: "distributor", label: "Distributor" },
  { value: "trader", label: "Trader" },
  { value: "service", label: "Service Business" },
  { value: "manufacturer_exporter", label: "Manufacturer & Exporter" },
  { value: "manufacturer_distributor", label: "Manufacturer & Distributor" },
  { value: "exporter_trader", label: "Exporter & Trader" },
  { value: "other", label: "Other" },
] as const;

export const INDUSTRIES = [
  { value: "manufacturing", label: "Manufacturing" },
  { value: "wholesale_distribution", label: "Wholesale Distribution" },
  { value: "export_trade", label: "Export & International Trade" },
  { value: "import", label: "Import" },
  { value: "agriculture", label: "Agriculture" },
  { value: "food_products", label: "Food Products" },
  { value: "ayurvedic_herbal", label: "Ayurvedic / Herbal" },
  { value: "pharmaceutical", label: "Pharmaceutical" },
  { value: "industrial_products", label: "Industrial Products" },
  { value: "fmcg", label: "FMCG" },
  { value: "textiles", label: "Textiles" },
  { value: "chemicals", label: "Chemicals" },
  { value: "consumer_products", label: "Consumer Products" },
  { value: "other", label: "Other" },
] as const;

export const BUSINESS_MODELS = [
  { value: "b2b", label: "B2B" },
  { value: "b2c", label: "B2C" },
  { value: "b2b2c", label: "B2B2C" },
  { value: "wholesale", label: "Wholesale" },
  { value: "distribution", label: "Distribution" },
  { value: "export", label: "Export" },
  { value: "import", label: "Import" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "service", label: "Service" },
  { value: "mixed", label: "Mixed" },
] as const;

export const TURNOVER_RANGES = [
  { value: "below_10l", label: "Below ₹10 Lakh" },
  { value: "10l_50l", label: "₹10 Lakh – ₹50 Lakh" },
  { value: "50l_1cr", label: "₹50 Lakh – ₹1 Crore" },
  { value: "1cr_5cr", label: "₹1 Crore – ₹5 Crore" },
  { value: "5cr_25cr", label: "₹5 Crore – ₹25 Crore" },
  { value: "25cr_plus", label: "₹25 Crore+" },
] as const;

export const EMPLOYEE_RANGES = [
  { value: "1-5", label: "1–5" },
  { value: "6-10", label: "6–10" },
  { value: "11-25", label: "11–25" },
  { value: "26-50", label: "26–50" },
  { value: "51-100", label: "51–100" },
  { value: "101-250", label: "101–250" },
  { value: "251-500", label: "251–500" },
  { value: "500+", label: "500+" },
] as const;

export const SALES_TEAM_SIZES = [
  { value: "1-5", label: "1–5" },
  { value: "6-10", label: "6–10" },
  { value: "11-25", label: "11–25" },
  { value: "26-50", label: "26–50" },
  { value: "50+", label: "50+" },
] as const;

export const COUNTRIES = [
  { value: "IN", label: "India" },
  { value: "US", label: "United States" },
  { value: "GB", label: "United Kingdom" },
  { value: "AE", label: "United Arab Emirates" },
  { value: "AU", label: "Australia" },
  { value: "CA", label: "Canada" },
  { value: "SG", label: "Singapore" },
  { value: "DE", label: "Germany" },
  { value: "other", label: "Other" },
] as const;

// State lists are intentionally partial for non-India countries — the goal is
// to demonstrate a country-aware dropdown, not to ship an exhaustive geo DB.
export const STATES_BY_COUNTRY: Record<string, string[]> = {
  IN: [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Delhi",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
    "Jammu and Kashmir",
    "Ladakh",
    "Chandigarh",
    "Puducherry",
  ],
  US: [
    "California",
    "Texas",
    "New York",
    "Florida",
    "Illinois",
    "Washington",
    "New Jersey",
    "Other",
  ],
  GB: ["England", "Scotland", "Wales", "Northern Ireland"],
  AE: ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah", "Fujairah", "Umm Al Quwain"],
  AU: ["New South Wales", "Victoria", "Queensland", "Western Australia", "South Australia"],
  CA: ["Ontario", "Quebec", "British Columbia", "Alberta"],
  SG: ["Singapore"],
  DE: ["Bavaria", "Berlin", "Hesse", "North Rhine-Westphalia"],
};

export const CURRENCIES = [
  { value: "INR", label: "INR – Indian Rupee" },
  { value: "USD", label: "USD – US Dollar" },
  { value: "EUR", label: "EUR – Euro" },
  { value: "GBP", label: "GBP – British Pound" },
  { value: "AED", label: "AED – UAE Dirham" },
  { value: "AUD", label: "AUD – Australian Dollar" },
  { value: "CAD", label: "CAD – Canadian Dollar" },
  { value: "SGD", label: "SGD – Singapore Dollar" },
] as const;

export const TIMEZONES = [
  { value: "Asia/Kolkata", label: "Asia/Kolkata (IST, UTC+5:30)" },
  { value: "Asia/Dubai", label: "Asia/Dubai (UTC+4:00)" },
  { value: "Asia/Singapore", label: "Asia/Singapore (UTC+8:00)" },
  { value: "Europe/London", label: "Europe/London (UTC+0:00/+1:00)" },
  { value: "Europe/Berlin", label: "Europe/Berlin (UTC+1:00/+2:00)" },
  { value: "America/New_York", label: "America/New_York (UTC-5:00/-4:00)" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles (UTC-8:00/-7:00)" },
  { value: "Australia/Sydney", label: "Australia/Sydney (UTC+10:00/+11:00)" },
] as const;

export const COUNTRY_TIMEZONE: Record<string, string> = {
  IN: "Asia/Kolkata",
  US: "America/New_York",
  GB: "Europe/London",
  AE: "Asia/Dubai",
  AU: "Australia/Sydney",
  CA: "America/New_York",
  SG: "Asia/Singapore",
  DE: "Europe/Berlin",
};

export const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi" },
  { value: "gu", label: "Gujarati" },
  { value: "mr", label: "Marathi" },
  { value: "ar", label: "Arabic" },
] as const;

export const DATE_FORMATS = [
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
] as const;

export const TIME_FORMATS = [
  { value: "12h", label: "12-hour" },
  { value: "24h", label: "24-hour" },
] as const;

export const SALES_MARKETS = [
  { value: "domestic", label: "Domestic" },
  { value: "international", label: "International" },
  { value: "both", label: "Both" },
] as const;

export const SALES_REGIONS = [
  { value: "india", label: "India" },
  { value: "middle_east", label: "Middle East" },
  { value: "europe", label: "Europe" },
  { value: "north_america", label: "North America" },
  { value: "south_america", label: "South America" },
  { value: "africa", label: "Africa" },
  { value: "asia_pacific", label: "Asia-Pacific" },
  { value: "anz", label: "Australia & New Zealand" },
  { value: "global", label: "Global" },
] as const;

export const PRODUCT_CATEGORIES = [
  { value: "ayurvedic", label: "Ayurvedic Products" },
  { value: "herbal", label: "Herbal Products" },
  { value: "food", label: "Food Products" },
  { value: "agricultural", label: "Agricultural Products" },
  { value: "industrial", label: "Industrial Products" },
  { value: "pharmaceutical", label: "Pharmaceutical Products" },
  { value: "fmcg", label: "FMCG" },
  { value: "textiles", label: "Textiles" },
  { value: "machinery", label: "Machinery" },
  { value: "chemicals", label: "Chemicals" },
  { value: "custom", label: "Custom" },
] as const;

export const SALES_PROCESS_TYPES = [
  { value: "direct", label: "Direct Sales" },
  { value: "distributor", label: "Distributor Sales" },
  { value: "wholesale", label: "Wholesale" },
  { value: "export", label: "Export Sales" },
  { value: "inquiry_quote_order", label: "Inquiry → Quotation → Order" },
  { value: "lead_deal_order", label: "Lead → Deal → Order" },
  { value: "mixed", label: "Mixed" },
] as const;

export const WEEK_DAYS = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
] as const;

export type WeekDayKey = (typeof WEEK_DAYS)[number]["key"];

// ---- Defaults generated for every new organization (Part 2, items 55-60) ----

export const DEFAULT_ROLES = ["Owner", "Admin", "Manager", "Sales Executive", "Viewer"] as const;

export const DEFAULT_PERMISSION_CATEGORIES = [
  "CRM",
  "Leads",
  "Customers",
  "Deals",
  "Inbox",
  "Activities",
  "Calendar",
  "Quotations",
  "Products",
  "Team",
  "Reports",
  "Settings",
  "Channels",
] as const;

export const DEFAULT_PIPELINE_STAGES = [
  "New",
  "Contacted",
  "Qualified",
  "Requirement",
  "Quotation",
  "Negotiation",
  "Won",
  "Lost",
] as const;

export const DEFAULT_ACTIVITY_TYPES = [
  "Call",
  "Meeting",
  "Task",
  "Follow-up",
  "Email",
  "WhatsApp",
  "Demo",
  "Site Visit",
  "Quotation Follow-up",
  "Payment Follow-up",
  "Order Follow-up",
] as const;

export const DEFAULT_PRIORITIES = ["Low", "Medium", "High", "Urgent"] as const;

export const DEFAULT_LEAD_SOURCES = [
  "Website",
  "WhatsApp",
  "Email",
  "Referral",
  "Trade Show",
  "IndiaMART",
  "Export Inquiry",
  "Cold Outreach",
  "Other",
] as const;

export function labelFor(
  options: ReadonlyArray<{ value: string; label: string }>,
  value: string | undefined,
): string | undefined {
  if (!value) return undefined;
  return options.find((o) => o.value === value)?.label;
}
