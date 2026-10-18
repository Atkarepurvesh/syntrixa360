// Pure form logic for the Add Lead dialog (no React) so it can be unit-tested.
import {
  findDuplicateLeads,
  type DuplicateMatch,
  type LeadEditInput,
  type NewLeadInput,
} from "@/lib/crm-store";
import { parseDisplayDate } from "@/lib/lead-query";
import {
  captureMethodsList,
  leadSourcesList,
  type CaptureMethod,
  type LeadSource,
} from "@/lib/lead-sources";
import {
  leadPriorityList,
  leadStatusList,
  type Lead,
  type LeadPriority,
  type LeadStatus,
} from "@/lib/leads-data";

/** Capture methods a person can pick in the manual Add Lead form. API/webhook/email-parser
 *  leads are created by their integrations, and CSV leads by the import flow, so offering
 *  them here would record a capture method that is not how the lead actually arrived. */
export const MANUAL_FORM_CAPTURE_METHODS: CaptureMethod[] = ["manual"];

export type LeadFormValues = {
  name: string;
  contactPerson: string;
  company: string;
  mobile: string;
  whatsapp: string;
  email: string;
  website: string;
  industry: string;
  productInterest: string;
  requirement: string; // customer inquiry / message
  estimatedRequirement: string;
  budget: string;
  quantity: string;
  city: string;
  state: string;
  country: string;
  source: LeadSource | "";
  captureMethod: CaptureMethod;
  owner: string;
  status: LeadStatus;
  priority: LeadPriority;
  rating: string;
  followUpDate: string; // yyyy-mm-dd
  followUpTime: string; // HH:mm
  followUpType: string;
  followUpNote: string;
};

export type LeadFormErrors = Partial<Record<keyof LeadFormValues, string>>;

export function emptyLeadForm(
  overrides: Partial<LeadFormValues> = {},
): LeadFormValues {
  return {
    name: "",
    contactPerson: "",
    company: "",
    mobile: "",
    whatsapp: "",
    email: "",
    website: "",
    industry: "",
    productInterest: "",
    requirement: "",
    estimatedRequirement: "",
    budget: "",
    quantity: "",
    city: "",
    state: "",
    country: "India",
    source: "",
    captureMethod: "manual",
    owner: "",
    status: "New",
    priority: "Medium",
    rating: "3",
    followUpDate: "",
    followUpTime: "",
    followUpType: "Call",
    followUpNote: "",
    ...overrides,
  };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Accepts 10-digit Indian mobiles (6-9 start, optional +91 / 91 / 0 prefix) and +international numbers. */
export function isValidPhone(raw: string): boolean {
  const v = raw.trim();
  if (!v) return true;
  if (!/^[+\d\s\-()]+$/.test(v)) return false;
  const digits = v.replace(/\D/g, "");
  if (v.startsWith("+") && !v.startsWith("+91"))
    return digits.length >= 8 && digits.length <= 15;
  const local =
    digits.startsWith("91") && digits.length === 12
      ? digits.slice(2)
      : digits.startsWith("0") && digits.length === 11
        ? digits.slice(1)
        : digits;
  return /^[6-9]\d{9}$/.test(local);
}

export const isValidEmail = (v: string) => !v.trim() || EMAIL_RE.test(v.trim());

function todayIso(now: Date) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
}

export function validateLeadForm(
  v: LeadFormValues,
  opts: {
    now?: Date;
    allowedCaptureMethods?: readonly CaptureMethod[];
    /** Edit mode: an unchanged (already past) follow-up date is not an error. */
    originalFollowUpDate?: string;
  } = {},
): LeadFormErrors {
  const e: LeadFormErrors = {};
  const allowed = opts.allowedCaptureMethods ?? MANUAL_FORM_CAPTURE_METHODS;
  if (!v.name.trim()) e.name = "Customer name is required";
  if (!v.source) e.source = "Select where this lead came from";
  else if (!leadSourcesList.includes(v.source))
    e.source = "Unknown lead source";
  if (
    !captureMethodsList.includes(v.captureMethod) ||
    !allowed.includes(v.captureMethod)
  )
    e.captureMethod =
      "This capture method isn't available when adding a lead manually";
  if (!isValidPhone(v.mobile))
    e.mobile = "Enter a valid phone number (10 digits, or + country code)";
  if (!isValidPhone(v.whatsapp)) e.whatsapp = "Enter a valid WhatsApp number";
  if (!isValidEmail(v.email)) e.email = "Enter a valid email address";
  if (!leadStatusList.includes(v.status)) e.status = "Unknown status";
  if (!leadPriorityList.includes(v.priority)) e.priority = "Unknown priority";
  if (v.followUpDate) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v.followUpDate))
      e.followUpDate = "Enter a valid date";
    else if (
      v.followUpDate !== opts.originalFollowUpDate &&
      v.followUpDate < todayIso(opts.now ?? new Date())
    )
      e.followUpDate = "Follow-up date can't be in the past";
  } else if (v.followUpTime) {
    e.followUpDate = "Pick a date for the follow-up time";
  }
  return e;
}

const opt = (s: string) => {
  const t = s.trim();
  return t ? t : undefined;
};

/** Convert validated form values to createLead input. Blank optionals are omitted, not stored as "". */
export function toNewLeadInput(v: LeadFormValues): NewLeadInput {
  if (!v.source) throw new Error("source is required");
  const input: NewLeadInput = {
    name: v.name.trim(),
    source: v.source,
    captureMethod: v.captureMethod,
    status: v.status,
    priority: v.priority,
    rating: Number(v.rating) || 3,
  };
  const set = <K extends keyof NewLeadInput>(
    k: K,
    val: NewLeadInput[K] | undefined,
  ) => {
    if (val !== undefined) input[k] = val;
  };
  set("owner", opt(v.owner));
  set("company", opt(v.company));
  set("contactPerson", opt(v.contactPerson));
  set("mobile", opt(v.mobile));
  set("whatsapp", opt(v.whatsapp));
  set("email", opt(v.email));
  set("website", opt(v.website));
  set("industry", opt(v.industry));
  set("productInterest", opt(v.productInterest));
  set("requirement", opt(v.requirement));
  set("estimatedRequirement", opt(v.estimatedRequirement));
  set("budget", opt(v.budget));
  set("quantity", opt(v.quantity));
  set("city", opt(v.city));
  set("state", opt(v.state));
  set("country", opt(v.country));
  if (v.followUpDate) {
    const fu: NonNullable<NewLeadInput["followUp"]> = {
      date: v.followUpDate,
      type: v.followUpType,
    };
    const time = opt(v.followUpTime);
    const note = opt(v.followUpNote);
    if (time) fu.time = time;
    if (note) fu.note = note;
    input.followUp = fu;
  }
  return input;
}

// ---- edit mode ------------------------------------------------------------------------
const pad2 = (n: number) => String(n).padStart(2, "0");

/** "25 May 2025" -> "2025-05-25" ("" if unparseable/absent). */
export function displayDateToIso(value: string | null | undefined): string {
  const d = parseDisplayDate(value);
  return d
    ? `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
    : "";
}
/** "03:30 PM" -> "15:30" ("" if absent). */
export function displayTimeToInput(value: string | null | undefined): string {
  const m = /^(\d{1,2}):(\d{2}) (AM|PM)$/.exec((value ?? "").trim());
  if (!m) return "";
  const h = (Number(m[1]) % 12) + (m[3] === "PM" ? 12 : 0);
  return `${pad2(h)}:${m[2]}`;
}

/** Load an existing lead into form values (missing optionals become ""). */
export function leadToFormValues(lead: Lead): LeadFormValues {
  const pending = lead.tasks.find(
    (t) => t.kind === "follow-up" && t.status === "Pending",
  );
  return emptyLeadForm({
    name: lead.name,
    contactPerson: lead.contactPerson,
    company: lead.company,
    mobile: lead.mobile,
    whatsapp: lead.whatsapp,
    email: lead.email,
    website: lead.website,
    industry: lead.industry,
    productInterest: lead.productInterest ?? "",
    requirement: lead.requirement,
    estimatedRequirement: lead.estimatedRequirement ?? "",
    budget: lead.budget,
    quantity: lead.quantity ?? "",
    city: lead.city,
    state: lead.state,
    country: lead.country ?? "",
    source: lead.source,
    captureMethod: lead.captureMethod,
    owner: lead.owner,
    status: lead.status,
    priority: lead.priority ?? "Medium",
    rating: String(lead.rating),
    followUpDate: displayDateToIso(lead.nextFollowUp),
    followUpTime: displayTimeToInput(lead.nextFollowUpTime),
    followUpNote: pending?.title ?? "",
  });
}

/** Form values -> editLead input. Blank text fields clear the field (unlike create, which omits them).
 *  Priority is only sent when the lead had one or the user changed it from the default. */
export function toLeadEditInput(
  v: LeadFormValues,
  original: Lead,
): LeadEditInput {
  if (!v.source) throw new Error("source is required");
  const input: LeadEditInput = {
    name: v.name,
    company: v.company.trim() || v.name,
    contactPerson: v.contactPerson,
    mobile: v.mobile,
    whatsapp: v.whatsapp,
    email: v.email,
    website: v.website,
    industry: v.industry,
    productInterest: v.productInterest,
    requirement: v.requirement,
    estimatedRequirement: v.estimatedRequirement,
    budget: v.budget,
    quantity: v.quantity,
    city: v.city,
    state: v.state,
    country: v.country,
    source: v.source,
    status: v.status,
    rating: Number(v.rating) || original.rating,
  };
  if (original.priority !== undefined || v.priority !== "Medium")
    input.priority = v.priority;
  if (v.owner.trim()) input.owner = v.owner;
  // Blank follow-up date = leave the existing follow-up as is (clearing isn't supported yet).
  if (v.followUpDate) {
    const fu: NonNullable<LeadEditInput["followUp"]> = {
      date: v.followUpDate,
      type: v.followUpType,
    };
    if (v.followUpTime.trim()) fu.time = v.followUpTime.trim();
    if (v.followUpNote.trim()) fu.note = v.followUpNote.trim();
    input.followUp = fu;
  }
  return input;
}

// ---- duplicate warning gate -----------------------------------------------------------
export const duplicateProbeKey = (
  v: Pick<LeadFormValues, "mobile" | "whatsapp" | "email">,
) =>
  [v.mobile, v.whatsapp, v.email].map((x) => x.trim().toLowerCase()).join("|");

/**
 * Decides whether a submit must pause for a duplicate warning. Matches are only ever shown, never
 * merged. Once the user dismisses/confirms for the current phone+email values (`ackedKey`), the
 * gate stays open; changing those values re-arms it.
 */
export function duplicateGate(
  leads: Lead[],
  v: Pick<LeadFormValues, "mobile" | "whatsapp" | "email">,
  opts: { excludeId?: string; ackedKey?: string | null } = {},
): { matches: DuplicateMatch[]; blocked: boolean; key: string } {
  const key = duplicateProbeKey(v);
  const matches = findDuplicateLeads(leads, v, opts.excludeId);
  return { matches, key, blocked: matches.length > 0 && opts.ackedKey !== key };
}

/** Standalone follow-up date check (Schedule Follow-up dialog). Returns an error message or "". */
export function validateFollowUp(date: string, now: Date = new Date()): string {
  if (!date) return "Pick a follow-up date";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return "Enter a valid date";
  if (date < todayIso(now)) return "Follow-up date can't be in the past";
  return "";
}
