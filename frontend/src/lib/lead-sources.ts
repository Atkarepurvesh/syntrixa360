// Unified lead source catalog + capture methods (UI-only phase, no backend).
//
// `source`        = where the inquiry ORIGINALLY came from. Never changes once set.
// `captureMethod` = how the lead was ENTERED into Syntrixa360.
//
// The canonical key of a source is its `LeadSource` string value. Existing values
// ("Email", "Phone", "Meta", "Google", ...) are kept as-is so current pages, filters and
// badges keep working; `label` is what the UI should show.

export const LEAD_SOURCES = [
  { key: "IndiaMART", label: "IndiaMART" },
  { key: "TradeIndia", label: "TradeIndia" },
  { key: "ExportersIndia", label: "ExportersIndia" },
  { key: "Alibaba", label: "Alibaba" },
  { key: "Email", label: "Gmail / Email" },
  { key: "WhatsApp", label: "WhatsApp" },
  { key: "Phone", label: "Phone Call" },
  { key: "Website", label: "Website" },
  { key: "Meta", label: "Facebook / Instagram / Meta" },
  { key: "Google", label: "Google Business" },
  { key: "Justdial", label: "Justdial" },
  { key: "99acres", label: "99acres" },
  { key: "Housing.com", label: "Housing.com" },
  { key: "Referral", label: "Referral" },
  { key: "Other", label: "Other" },
] as const;

export type LeadSource = (typeof LEAD_SOURCES)[number]["key"];

export const leadSourcesList: LeadSource[] = LEAD_SOURCES.map((s) => s.key);

const labelByKey = Object.fromEntries(
  LEAD_SOURCES.map((s) => [s.key, s.label]),
) as Record<LeadSource, string>;

export function leadSourceLabel(source: LeadSource): string {
  return labelByKey[source];
}

// Alternate spellings / legacy values -> canonical key (lower-cased, spaces and punctuation stripped).
const ALIASES: Record<string, LeadSource> = {
  indiamart: "IndiaMART",
  tradeindia: "TradeIndia",
  exportersindia: "ExportersIndia",
  alibaba: "Alibaba",
  email: "Email",
  gmail: "Email",
  gmailemail: "Email",
  whatsapp: "WhatsApp",
  phone: "Phone",
  phonecall: "Phone",
  call: "Phone",
  website: "Website",
  web: "Website",
  meta: "Meta",
  facebook: "Meta",
  instagram: "Meta",
  facebookinstagrammeta: "Meta",
  google: "Google",
  googlebusiness: "Google",
  justdial: "Justdial",
  "99acres": "99acres",
  housingcom: "Housing.com",
  housing: "Housing.com",
  referral: "Referral",
  other: "Other",
  // Legacy: "Manual" used to be a *source*; it is a capture method now, so origin is unknown.
  manual: "Other",
};

const squash = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, "");

/** Map any known spelling to its canonical source key; unknown values -> "Other". */
export function normalizeLeadSource(
  value: string | null | undefined,
): LeadSource {
  if (!value) return "Other";
  return ALIASES[squash(value)] ?? "Other";
}

export const CAPTURE_METHODS = [
  { key: "manual", label: "Manual" },
  { key: "conversation", label: "Inbox Conversation" }, // created by a user from an Inbox conversation
  { key: "csv_import", label: "CSV / Excel Import" },
  { key: "api", label: "API" },
  { key: "webhook", label: "Webhook / Form" },
  { key: "email_parser", label: "Email Parser" },
] as const;

export type CaptureMethod = (typeof CAPTURE_METHODS)[number]["key"];

export const captureMethodsList: CaptureMethod[] = CAPTURE_METHODS.map(
  (m) => m.key,
);

export function captureMethodLabel(method: CaptureMethod): string {
  return CAPTURE_METHODS.find((m) => m.key === method)?.label ?? method;
}
