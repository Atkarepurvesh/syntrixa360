// Pure logic for creating / linking CRM leads from Inbox conversations (no React), so the Inbox UI
// and the tests share one implementation. The shared CRM store stays the only source of truth for leads.
import {
  findDuplicateLeads,
  normalizeEmail,
  normalizePhone,
  type ConversationRef,
  type CrmStore,
  type DuplicateMatch,
} from "@/lib/crm-store";
import { isValidEmail, isValidPhone } from "@/lib/lead-form";
import { scopeLeadsForUser } from "@/lib/lead-query";
import {
  leadSourcesList,
  normalizeLeadSource,
  type LeadSource,
} from "@/lib/lead-sources";
import type { Lead } from "@/lib/leads-data";

export type InboxChannel = ConversationRef["channel"];
export type ViewerUser = { role: string; name: string };

/** The conversation channel is the lead's origin: WhatsApp chat -> WhatsApp, email thread -> Email. */
export const CHANNEL_SOURCE: Record<InboxChannel, LeadSource> = {
  whatsapp: "WhatsApp",
  email: "Email",
  website: "Website",
};

export type ConversationLeadValues = {
  name: string;
  phone: string;
  email: string;
  company: string;
  source: string;
  owner: string; // "" = unassigned
  requirement: string; // latest customer message (editable)
};

const looksLikePhone = (v: string) => /^\+?[\d\s()-]{7,}$/.test(v.trim());
const looksLikeEmail = (v: string) => /^[^\s@]+@[^\s@]+$/.test(v.trim());

/** Map the Inbox's display owner ("You", "Rahul", "Unassigned") to a real team member name ("" if none). */
export function resolveConversationOwner(
  assigned: string,
  members: readonly string[],
  currentUserName: string,
): string {
  const a = assigned.trim();
  if (!a || a === "Unassigned") return "";
  if (a === "You")
    return members.includes(currentUserName) ? currentUserName : "";
  const exact = members.find((m) => m === a);
  if (exact) return exact;
  const first = members.filter(
    (m) => m.split(" ")[0]?.toLowerCase() === a.toLowerCase(),
  );
  return first.length === 1 ? first[0]! : ""; // ambiguous short names are not guessed
}

/** Prefill for the Create Lead form: only what the conversation really knows, never invented. */
export function conversationLeadDefaults(
  conv: {
    channel: InboxChannel;
    company: string;
    contact: string;
    assigned: string;
    phone?: string | undefined;
    email?: string | undefined;
  },
  latestCustomerMessage: string,
  ctx: { members: readonly string[]; currentUserName: string },
): ConversationLeadValues {
  const contact = conv.contact.trim();
  const phone = conv.phone ?? (looksLikePhone(contact) ? contact : "");
  const email = conv.email ?? (looksLikeEmail(contact) ? contact : "");
  const contactIsIdentity = looksLikePhone(contact) || looksLikeEmail(contact);
  return {
    name: contactIsIdentity ? conv.company : contact || conv.company,
    phone: conv.channel === "whatsapp" || conv.phone ? phone : "",
    email: conv.channel === "email" || conv.email ? email : "",
    company: conv.company,
    source: CHANNEL_SOURCE[conv.channel],
    owner: resolveConversationOwner(
      conv.assigned,
      ctx.members,
      ctx.currentUserName,
    ),
    requirement: latestCustomerMessage.trim(),
  };
}

export type ConversationLeadErrors = Partial<
  Record<keyof ConversationLeadValues, string>
>;

export function validateConversationLead(
  v: ConversationLeadValues,
): ConversationLeadErrors {
  const e: ConversationLeadErrors = {};
  if (!v.name.trim()) e.name = "Name is required";
  const src = normalizeLeadSource(v.source);
  if (!v.source.trim()) e.source = "Select where this lead came from";
  else if (!leadSourcesList.includes(src)) e.source = "Unknown lead source";
  if (!isValidPhone(v.phone)) e.phone = "Enter a valid phone number";
  if (!isValidEmail(v.email)) e.email = "Enter a valid email address";
  return e;
}

/** Existing leads that share this phone/email, limited to what the viewer may see.
 *  `hidden` counts matches owned by someone else so they are reported without exposing details. */
export function findLeadMatches(
  allLeads: Lead[],
  probe: { phone?: string; email?: string },
  viewer: ViewerUser,
): { visible: DuplicateMatch[]; hidden: number } {
  const all = findDuplicateLeads(allLeads, {
    mobile: probe.phone ?? "",
    whatsapp: probe.phone ?? "",
    email: probe.email ?? "",
  });
  const allowed = new Set(scopeLeadsForUser(allLeads, viewer).map((l) => l.id));
  const visible = all.filter((m) => allowed.has(m.lead.id));
  return { visible, hidden: all.length - visible.length };
}

/** Manual lookup for the link dialog: exact lead id, or exact normalised phone/email.
 *  Names never match, so a similar-looking name can't link the wrong customer. */
export function searchLeadsByIdentity(
  allLeads: Lead[],
  query: string,
  viewer: ViewerUser,
): Lead[] {
  const q = query.trim();
  if (!q) return [];
  const phone = normalizePhone(q);
  const email = looksLikeEmail(q) ? normalizeEmail(q) : "";
  const idQ = q.toLowerCase();
  return scopeLeadsForUser(allLeads, viewer).filter(
    (l) =>
      l.id.toLowerCase() === idQ ||
      (phone !== "" &&
        (normalizePhone(l.mobile) === phone ||
          normalizePhone(l.whatsapp) === phone)) ||
      (email !== "" && normalizeEmail(l.email) === email),
  );
}

const probeKey = (v: Pick<ConversationLeadValues, "phone" | "email">) =>
  [normalizePhone(v.phone), normalizeEmail(v.email)].join("|");

export type CreateFromConversationResult =
  | { status: "invalid"; errors: ConversationLeadErrors }
  | {
      status: "duplicate";
      matches: DuplicateMatch[];
      hidden: number;
      key: string;
    }
  | { status: "already-linked"; lead: Lead }
  | { status: "created"; lead: Lead }
  | { status: "error"; message: string };

/** Validate -> duplicate gate -> create + link. Never reports success unless the store did the work. */
export function submitLeadFromConversation(
  store: CrmStore,
  conv: ConversationRef,
  values: ConversationLeadValues,
  opts: { viewer: ViewerUser; ackedKey?: string | null },
): CreateFromConversationResult {
  const existing = store.getLeadForConversation(conv.id);
  if (existing) return { status: "already-linked", lead: existing };
  const errors = validateConversationLead(values);
  if (Object.keys(errors).length > 0) return { status: "invalid", errors };
  const key = probeKey(values);
  const { visible, hidden } = findLeadMatches(
    store.listLeads(),
    values,
    opts.viewer,
  );
  if ((visible.length > 0 || hidden > 0) && opts.ackedKey !== key)
    return { status: "duplicate", matches: visible, hidden, key };
  try {
    const opt = (s: string) => (s.trim() ? s.trim() : undefined);
    const phone = opt(values.phone);
    const email = opt(values.email);
    const company = opt(values.company);
    const requirement = opt(values.requirement);
    const owner = opt(values.owner);
    const r = store.createLeadFromConversation(
      conv,
      {
        name: values.name.trim(),
        source: values.source,
        ...(owner ? { owner } : {}),
        ...(phone ? { mobile: phone } : {}),
        ...(email ? { email } : {}),
        ...(company ? { company } : {}),
        ...(requirement ? { requirement } : {}),
      },
      opts.viewer.name,
    );
    return r.created
      ? { status: "created", lead: r.lead }
      : { status: "already-linked", lead: r.lead };
  } catch (e) {
    return {
      status: "error",
      message: e instanceof Error ? e.message : "Could not create the lead",
    };
  }
}

export type LinkResult =
  | { status: "linked"; lead: Lead }
  | { status: "already-linked"; lead: Lead }
  | { status: "error"; message: string };

/** Link to an existing lead the viewer is allowed to see. */
export function linkConversationToLead(
  store: CrmStore,
  conv: ConversationRef,
  leadId: string,
  viewer: ViewerUser,
): LinkResult {
  const lead = scopeLeadsForUser(store.listLeads(), viewer).find(
    (l) => l.id === leadId,
  );
  if (!lead) return { status: "error", message: "Lead not found" };
  try {
    const r = store.linkConversation(lead.id, conv, viewer.name);
    if (!r) return { status: "error", message: "Lead not found" };
    return r.changed
      ? { status: "linked", lead: r.lead }
      : { status: "already-linked", lead: r.lead };
  } catch (e) {
    return {
      status: "error",
      message:
        e instanceof Error ? e.message : "Could not link the conversation",
    };
  }
}
