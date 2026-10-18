// Public marketing catalogue for /integrations.
//
// HONESTY RULES (read before editing):
//  - A card may only be `live` when it carries a `verification` record (what was verified, when, and by whom).
//    A marketing card existing is NOT evidence that a connector exists. src/data/integrations.test.ts enforces this.
//  - As of this change NO connector is implemented: backend/app/services/channel_service.py reports
//    `integration_available = False` for every channel and the Lead Central UI treats all providers as
//    "not available yet". So nothing below is `live`.
//  - Descriptions are written as capabilities (infinitive form, like src/lib/lead-central/connections.ts) and
//    never claim that data is already flowing.
//  - To promote a card: build + verify the connector against the real provider, then set `status: "live"` and
//    add `verification`.
import { BRAND_GLYPHS } from "@/data/integration-logos";

export type IntegrationCategoryId =
  | "marketplaces"
  | "messaging"
  | "real-estate"
  | "google"
  | "website"
  | "social"
  | "automation";

export type IntegrationCategory = {
  id: IntegrationCategoryId;
  /** Full heading used for the group on the page. */
  label: string;
  /** Short label used on the filter chip. */
  chip: string;
  /** lucide-react icon name. */
  icon: string;
};

export const INTEGRATION_CATEGORIES: readonly IntegrationCategory[] = [
  { id: "marketplaces", label: "B2B Marketplaces", chip: "B2B Marketplaces", icon: "Store" },
  {
    id: "messaging",
    label: "Messaging & Communication",
    chip: "Messaging & Communication",
    icon: "MessageSquare",
  },
  { id: "real-estate", label: "Real Estate Portals", chip: "Real Estate", icon: "Building2" },
  { id: "google", label: "Google & Productivity", chip: "Google & Productivity", icon: "Layers" },
  {
    id: "website",
    label: "Website & E-commerce",
    chip: "Website & E-commerce",
    icon: "Globe",
  },
  {
    id: "social",
    label: "Social Media & Advertising",
    chip: "Social Media & Advertising",
    icon: "Megaphone",
  },
  {
    id: "automation",
    label: "Automation & Custom Integrations",
    chip: "Import & Custom API",
    icon: "Workflow",
  },
];

export type IntegrationStatus = "live" | "planned" | "requires-approval" | "on-request";

export const STATUS_META: Record<
  IntegrationStatus,
  { label: string; summary: string; badgeClass: string }
> = {
  live: {
    label: "Live",
    summary: "Built, verified with the provider and available to connect.",
    badgeClass: "bg-success-soft text-success",
  },
  planned: {
    label: "Planned",
    summary: "On the build list. Not built yet, so it cannot be connected today.",
    badgeClass: "bg-violet-soft text-violet",
  },
  "requires-approval": {
    label: "Requires approval",
    summary:
      "Depends on approval or API access from the platform itself. Not available to connect today.",
    badgeClass: "bg-warning-soft text-warning",
  },
  "on-request": {
    label: "On request",
    summary: "Not scheduled. Tell us you need it and we will assess feasibility.",
    badgeClass: "bg-secondary text-navy",
  },
};

export const STATUS_ORDER: readonly IntegrationStatus[] = [
  "live",
  "planned",
  "requires-approval",
  "on-request",
];

export type IntegrationLogo =
  /** Genuine brand glyph from src/data/integration-logos.ts. */
  | { kind: "brand"; glyph: string }
  /** Generic capability (not a brand): a lucide-react icon name. */
  | { kind: "icon"; icon: string }
  /** Placeholder until an official logo file is added under src/assets/integrations/. */
  | { kind: "monogram"; text: string; color?: string };

export type Integration = {
  /** Stable id; also the file name for an optional official logo: src/assets/integrations/<id>.svg|png|webp */
  id: string;
  name: string;
  category: IntegrationCategoryId;
  logo: IntegrationLogo;
  /** What the connector is meant to do (capability, not a claim that it is running). */
  description: string;
  /** How data would reach Syntrixa360. */
  method: string;
  /** The kind of records it would bring in. */
  brings: readonly string[];
  /** What has to be true before it can be built / connected. */
  requirement: string;
  status: IntegrationStatus;
  /** Extra search terms. */
  keywords?: readonly string[];
  /** REQUIRED when status is "live". */
  verification?: { verifiedOn: string; evidence: string };
};

export const INTEGRATIONS: readonly Integration[] = [
  // ---------------------------------------------------------------- B2B marketplaces
  {
    id: "indiamart",
    name: "IndiaMART",
    category: "marketplaces",
    logo: { kind: "monogram", text: "iM", color: "#2E3192" },
    description: "Import buyer enquiries from IndiaMART into the central lead list.",
    method: "API / enquiry pull from your IndiaMART seller account.",
    brings: ["Buyer name and contact details", "Product enquired about", "Enquiry message and time"],
    requirement: "An active IndiaMART seller account with API access enabled for it.",
    status: "planned",
    keywords: ["b2b", "buyer", "enquiry", "inquiry", "lead manager"],
  },
  {
    id: "tradeindia",
    name: "TradeIndia",
    category: "marketplaces",
    logo: { kind: "monogram", text: "Ti", color: "#D62027" },
    description: "Import buyer enquiries from TradeIndia into the central lead list.",
    method: "API or enquiry feed from your TradeIndia account.",
    brings: ["Buyer contact details", "Product enquired about", "Enquiry message and time"],
    requirement: "A TradeIndia account with enquiry/API access available to you.",
    status: "planned",
    keywords: ["b2b", "buyer", "enquiry", "inquiry"],
  },
  {
    id: "exportersindia",
    name: "ExportersIndia",
    category: "marketplaces",
    logo: { kind: "monogram", text: "Ei", color: "#1F5FA8" },
    description: "Import buyer enquiries from ExportersIndia into the central lead list.",
    method: "API or enquiry feed from your ExportersIndia account.",
    brings: ["Buyer contact details", "Product enquired about", "Enquiry message and time"],
    requirement: "An ExportersIndia account with enquiry/API access available to you.",
    status: "planned",
    keywords: ["b2b", "export", "buyer", "enquiry", "inquiry"],
  },
  {
    id: "alibaba",
    name: "Alibaba.com",
    category: "marketplaces",
    logo: { kind: "brand", glyph: "alibaba" },
    description: "Bring Alibaba.com buyer inquiries and messages into the central lead list.",
    method: "Alibaba.com open platform API (OAuth).",
    brings: ["Buyer inquiries", "Product and RFQ context", "Buyer messages"],
    requirement: "Approval for API access from Alibaba.com before a connector can be built.",
    status: "requires-approval",
    keywords: ["export", "global", "rfq", "inquiry", "enquiry"],
  },
  {
    id: "global-sources",
    name: "Global Sources",
    category: "marketplaces",
    logo: { kind: "monogram", text: "GS", color: "#E60012" },
    description: "Bring Global Sources buyer inquiries into the central lead list.",
    method: "To be confirmed with the platform (API, email notifications or export).",
    brings: ["Buyer inquiries", "Product context"],
    requirement: "Platform access method has not been confirmed. CSV/Excel import is the likely first route.",
    status: "on-request",
    keywords: ["export", "sourcing", "inquiry", "enquiry"],
  },
  {
    id: "made-in-china",
    name: "Made-in-China",
    category: "marketplaces",
    logo: { kind: "monogram", text: "MIC", color: "#F26A21" },
    description: "Bring Made-in-China.com buyer inquiries into the central lead list.",
    method: "To be confirmed with the platform (API, email notifications or export).",
    brings: ["Buyer inquiries", "Product context"],
    requirement: "Platform access method has not been confirmed. CSV/Excel import is the likely first route.",
    status: "on-request",
    keywords: ["export", "china", "sourcing", "inquiry", "enquiry"],
  },
  {
    id: "udaan",
    name: "Udaan",
    category: "marketplaces",
    logo: { kind: "monogram", text: "ud", color: "#1B3FA0" },
    description: "Bring Udaan seller-side buyer and order enquiries into the central lead list.",
    method: "To be confirmed with the platform.",
    brings: ["Buyer details", "Enquiry or order context"],
    requirement: "No public lead-access route has been confirmed for Udaan sellers.",
    status: "on-request",
    keywords: ["b2b", "wholesale", "retail", "orders"],
  },
  {
    id: "justdial",
    name: "Justdial",
    category: "marketplaces",
    logo: { kind: "monogram", text: "JD", color: "#0A64B4" },
    description: "Import Justdial business enquiries into the central lead list.",
    method: "Partner API or lead feed from Justdial.",
    brings: ["Customer contact details", "Enquiry category and message"],
    requirement: "Access to Justdial lead data is controlled by Justdial and has not been confirmed.",
    status: "requires-approval",
    keywords: ["jd", "local", "enquiry", "inquiry", "listing"],
  },

  // ---------------------------------------------------------------- Messaging & communication
  {
    id: "whatsapp-business",
    name: "WhatsApp Business",
    category: "messaging",
    logo: { kind: "brand", glyph: "whatsapp" },
    description: "Turn WhatsApp Business conversations into leads and keep the chat history on the lead.",
    method: "WhatsApp Business Platform (Cloud API) via Meta.",
    brings: ["Inbound messages", "Sender phone number and name", "Conversation history"],
    requirement:
      "A Meta business account, a WhatsApp Business number and Meta's business verification. Channel-status scaffolding exists in the backend; the connector itself is not built.",
    status: "planned",
    keywords: ["chat", "message", "meta", "wa"],
  },
  {
    id: "gmail",
    name: "Gmail",
    category: "messaging",
    logo: { kind: "brand", glyph: "gmail" },
    description: "Turn enquiry emails received in Gmail into leads and link replies to the lead.",
    method: "Google sign-in (OAuth) with the Gmail API.",
    brings: ["Inbound enquiry emails", "Sender details", "Email threads on the lead"],
    requirement:
      "Google's review of the app for Gmail access. Channel-status scaffolding exists in the backend; the connector itself is not built.",
    status: "planned",
    keywords: ["email", "mail", "google", "inbox"],
  },
  {
    id: "outlook",
    name: "Microsoft Outlook",
    category: "messaging",
    logo: { kind: "monogram", text: "Ol", color: "#0078D4" },
    description: "Turn enquiry emails received in Outlook into leads and link replies to the lead.",
    method: "Microsoft sign-in (OAuth) with Microsoft Graph.",
    brings: ["Inbound enquiry emails", "Sender details", "Email threads on the lead"],
    requirement:
      "A Microsoft app registration and user consent. Channel-status scaffolding exists in the backend; the connector itself is not built.",
    status: "planned",
    keywords: ["email", "mail", "microsoft", "inbox", "office"],
  },
  {
    id: "microsoft-365",
    name: "Microsoft 365",
    category: "messaging",
    logo: { kind: "monogram", text: "M3", color: "#D83B01" },
    description: "Connect company Microsoft 365 mailboxes so team enquiries can become leads.",
    method: "Microsoft Graph with organisation-level consent.",
    brings: ["Shared and individual mailbox enquiries", "Sender details"],
    requirement: "Admin consent from your Microsoft 365 tenant. No work has started beyond Outlook planning.",
    status: "on-request",
    keywords: ["office", "microsoft", "email", "exchange", "teams"],
  },
  {
    id: "phone-calls",
    name: "Phone Calls",
    category: "messaging",
    logo: { kind: "icon", icon: "Phone" },
    description: "Log inbound calls from a cloud-telephony provider against the matching lead.",
    method: "Webhook or call-log feed from your telephony provider.",
    brings: ["Caller number", "Call time and duration", "Missed-call alerts"],
    requirement: "A cloud-telephony provider that can send call events. Specific providers are not yet chosen.",
    status: "on-request",
    keywords: ["call", "telephony", "ivr", "dialer", "voice", "missed call"],
  },
  {
    id: "sms-providers",
    name: "SMS Providers",
    category: "messaging",
    logo: { kind: "icon", icon: "MessageCircle" },
    description: "Send and receive SMS through a gateway and keep the messages on the lead.",
    method: "API from an SMS gateway provider.",
    brings: ["Inbound SMS", "Delivery status"],
    requirement: "A supported SMS gateway account. Providers are not yet chosen; in India, sender registration (DLT) also applies.",
    status: "on-request",
    keywords: ["text", "sms", "gateway", "dlt", "message"],
  },
  {
    id: "website-live-chat",
    name: "Website Live Chat",
    category: "messaging",
    logo: { kind: "icon", icon: "MessagesSquare" },
    description: "Capture visitors who start a live-chat conversation on your website as leads.",
    method: "Webhook or API from a live-chat tool.",
    brings: ["Visitor name and contact details", "Chat transcript"],
    requirement: "A live-chat tool that can send events. Tools are not yet chosen.",
    status: "on-request",
    keywords: ["chat", "widget", "website", "visitor"],
  },

  // ---------------------------------------------------------------- Real estate portals
  {
    id: "99acres",
    name: "99acres",
    category: "real-estate",
    logo: { kind: "monogram", text: "99", color: "#1265B2" },
    description: "Import property enquiries from 99acres into the central lead list.",
    method: "Partner API or lead feed from the portal.",
    brings: ["Enquirer contact details", "Property enquired about", "Enquiry time"],
    requirement: "Lead access is controlled by the portal and has not been confirmed.",
    status: "requires-approval",
    keywords: ["property", "realty", "real estate", "housing"],
  },
  {
    id: "housing-com",
    name: "Housing.com",
    category: "real-estate",
    logo: { kind: "monogram", text: "H", color: "#7B2D8E" },
    description: "Import property enquiries from Housing.com into the central lead list.",
    method: "Partner API or lead feed from the portal.",
    brings: ["Enquirer contact details", "Property enquired about", "Enquiry time"],
    requirement: "Lead access is controlled by the portal and has not been confirmed.",
    status: "requires-approval",
    keywords: ["property", "realty", "real estate"],
  },
  {
    id: "magicbricks",
    name: "Magicbricks",
    category: "real-estate",
    logo: { kind: "monogram", text: "mb", color: "#D8232A" },
    description: "Import property enquiries from Magicbricks into the central lead list.",
    method: "Partner API or lead feed from the portal.",
    brings: ["Enquirer contact details", "Property enquired about", "Enquiry time"],
    requirement: "Lead access is controlled by the portal and has not been confirmed.",
    status: "requires-approval",
    keywords: ["property", "realty", "real estate"],
  },

  // ---------------------------------------------------------------- Google & productivity
  {
    id: "google-sheets",
    name: "Google Sheets",
    category: "google",
    logo: { kind: "brand", glyph: "google-sheets" },
    description: "Import leads from a Google Sheet, or export leads to one, with column mapping.",
    method: "Google sign-in (OAuth) with the Sheets API.",
    brings: ["Rows from a chosen sheet", "Mapped lead fields"],
    requirement: "Google's review of the app for Sheets access. Not built yet.",
    status: "planned",
    keywords: ["spreadsheet", "google", "sheet", "export", "import"],
  },
  {
    id: "google-drive",
    name: "Google Drive",
    category: "google",
    logo: { kind: "brand", glyph: "google-drive" },
    description: "Attach Drive files such as catalogues and quotations to a lead.",
    method: "Google sign-in (OAuth) with the Drive API.",
    brings: ["File links on the lead"],
    requirement: "Not scheduled. Tell us if you need it.",
    status: "on-request",
    keywords: ["google", "files", "documents", "storage"],
  },
  {
    id: "google-calendar",
    name: "Google Calendar",
    category: "google",
    logo: { kind: "brand", glyph: "google-calendar" },
    description: "Show follow-ups and meetings in Google Calendar.",
    method: "Google sign-in (OAuth) with the Calendar API.",
    brings: ["Follow-up and meeting events"],
    requirement: "Not scheduled. Tell us if you need it.",
    status: "on-request",
    keywords: ["google", "calendar", "meeting", "schedule", "follow-up"],
  },

  // ---------------------------------------------------------------- Website & e-commerce
  {
    id: "website-forms",
    name: "Website Forms",
    category: "website",
    logo: { kind: "icon", icon: "TextCursorInput" },
    description: "Create a lead when someone submits a contact or enquiry form on your website.",
    method: "Form endpoint / webhook that your site posts to.",
    brings: ["Form fields mapped to lead fields", "Page and submission time"],
    requirement: "A form you can point at the endpoint. Channel-status scaffolding exists; the endpoint is not built.",
    status: "planned",
    keywords: ["contact form", "web form", "enquiry form", "website"],
  },
  {
    id: "wordpress",
    name: "WordPress",
    category: "website",
    logo: { kind: "brand", glyph: "wordpress" },
    description: "Send WordPress form submissions to Syntrixa360 as leads.",
    method: "Through the form endpoint / webhook once it exists; no dedicated plugin is planned yet.",
    brings: ["Form submissions mapped to lead fields"],
    requirement: "Depends on Website Forms / Webhooks being built first.",
    status: "on-request",
    keywords: ["wp", "cms", "plugin", "website", "form"],
  },
  {
    id: "shopify",
    name: "Shopify",
    category: "website",
    logo: { kind: "brand", glyph: "shopify" },
    description: "Send Shopify contact-form and customer data to Syntrixa360 as leads.",
    method: "Webhook or app integration; not yet designed.",
    brings: ["Contact-form submissions", "Customer details"],
    requirement: "Not scheduled. A Shopify app would also need Shopify's app review.",
    status: "on-request",
    keywords: ["store", "ecommerce", "e-commerce", "shop", "customers"],
  },
  {
    id: "woocommerce",
    name: "WooCommerce",
    category: "website",
    logo: { kind: "brand", glyph: "woocommerce" },
    description: "Send WooCommerce enquiries and customer data to Syntrixa360 as leads.",
    method: "Webhook or REST API; not yet designed.",
    brings: ["Product enquiries", "Customer details"],
    requirement: "Depends on Website Forms / Webhooks being built first.",
    status: "on-request",
    keywords: ["store", "ecommerce", "e-commerce", "wordpress", "shop"],
  },
  {
    id: "product-enquiry-forms",
    name: "Product Enquiry Forms",
    category: "website",
    logo: { kind: "icon", icon: "PackageSearch" },
    description: "Capture enquiries submitted from a specific product page, with the product attached to the lead.",
    method: "Form endpoint / webhook that your site posts to.",
    brings: ["Enquirer details", "Product named in the enquiry"],
    requirement: "Depends on the Website Forms endpoint being built.",
    status: "planned",
    keywords: ["product", "enquiry", "inquiry", "catalogue", "form"],
  },
  {
    id: "rfq-forms",
    name: "RFQ Forms",
    category: "website",
    logo: { kind: "icon", icon: "ClipboardList" },
    description: "Capture request-for-quotation submissions with quantity and requirement details.",
    method: "Form endpoint / webhook that your site posts to.",
    brings: ["Requester details", "Products and quantities", "Requirement notes"],
    requirement: "Depends on the Website Forms endpoint being built.",
    status: "planned",
    keywords: ["rfq", "quotation", "quote", "requirement", "form"],
  },

  // ---------------------------------------------------------------- Social media & advertising
  {
    id: "facebook-lead-ads",
    name: "Facebook Lead Ads",
    category: "social",
    logo: { kind: "brand", glyph: "facebook" },
    description: "Bring Facebook Lead Ads form submissions into the central lead list.",
    method: "Meta Marketing / Lead Retrieval API.",
    brings: ["Lead form answers", "Campaign and ad reference"],
    requirement: "Meta app review and business verification for lead access.",
    status: "requires-approval",
    keywords: ["meta", "ads", "advertising", "lead form", "fb"],
  },
  {
    id: "instagram-lead-ads",
    name: "Instagram Lead Ads",
    category: "social",
    logo: { kind: "brand", glyph: "instagram" },
    description: "Bring Instagram Lead Ads form submissions into the central lead list.",
    method: "Meta Marketing / Lead Retrieval API.",
    brings: ["Lead form answers", "Campaign and ad reference"],
    requirement: "Meta app review and business verification for lead access.",
    status: "requires-approval",
    keywords: ["meta", "ads", "advertising", "lead form", "ig"],
  },
  {
    id: "linkedin-lead-gen",
    name: "LinkedIn Lead Gen Forms",
    category: "social",
    logo: { kind: "brand", glyph: "linkedin" },
    description: "Bring LinkedIn Lead Gen Form submissions into the central lead list.",
    method: "LinkedIn Marketing API.",
    brings: ["Lead form answers", "Campaign reference"],
    requirement: "Access to LinkedIn's Marketing API, which LinkedIn grants by approval.",
    status: "requires-approval",
    keywords: ["ads", "advertising", "lead form", "b2b"],
  },
  {
    id: "google-ads-lead-forms",
    name: "Google Ads Lead Forms",
    category: "social",
    logo: { kind: "brand", glyph: "google-ads" },
    description: "Bring Google Ads lead-form-extension submissions into the central lead list.",
    method: "Google Ads API or lead-form webhook.",
    brings: ["Lead form answers", "Campaign reference"],
    requirement: "Google Ads API access (developer-token approval) or a webhook from the lead form.",
    status: "requires-approval",
    keywords: ["google", "ads", "advertising", "adwords", "lead form"],
  },

  // ---------------------------------------------------------------- Automation & custom integrations
  {
    id: "csv-import",
    name: "CSV Import",
    category: "automation",
    logo: { kind: "icon", icon: "FileText" },
    description: "Upload a CSV file of leads, map its columns and review errors before saving.",
    method: "File upload in Syntrixa360.",
    brings: ["Leads from any CSV export", "Column-to-field mapping"],
    requirement: "Not built yet. Lead storage is still being built in the backend.",
    status: "planned",
    keywords: ["upload", "file", "bulk", "csv", "spreadsheet", "migrate"],
  },
  {
    id: "excel-import",
    name: "Excel Import",
    category: "automation",
    logo: { kind: "icon", icon: "FileSpreadsheet" },
    description: "Upload an Excel workbook of leads, map its columns and review errors before saving.",
    method: "File upload in Syntrixa360.",
    brings: ["Leads from .xlsx files", "Column-to-field mapping"],
    requirement: "Not built yet. Lead storage is still being built in the backend.",
    status: "planned",
    keywords: ["upload", "file", "bulk", "xlsx", "xls", "spreadsheet", "migrate"],
  },
  {
    id: "rest-api",
    name: "REST API",
    category: "automation",
    logo: { kind: "icon", icon: "Code" },
    description: "Create and update leads from your own systems over a documented HTTP API.",
    method: "Authenticated HTTPS API.",
    brings: ["Leads pushed from any system you control"],
    requirement: "A public, documented lead API is not available yet.",
    status: "planned",
    keywords: ["api", "developer", "http", "json", "custom"],
  },
  {
    id: "webhooks",
    name: "Webhooks",
    category: "automation",
    logo: { kind: "icon", icon: "Webhook" },
    description: "Receive leads posted by other tools, and notify other tools when a lead changes.",
    method: "Inbound and outbound HTTPS webhooks.",
    brings: ["Leads posted by any tool that can send a webhook"],
    requirement: "Not built yet.",
    status: "planned",
    keywords: ["api", "developer", "http", "events", "automation", "callback"],
  },
  {
    id: "zapier",
    name: "Zapier",
    category: "automation",
    logo: { kind: "brand", glyph: "zapier" },
    description: "Connect Syntrixa360 to the apps in your Zapier account.",
    method: "Zapier's webhook steps once Webhooks exist. No Zapier app listing is planned yet.",
    brings: ["Leads from any Zapier-connected app"],
    requirement: "Depends on Webhooks / REST API being built first.",
    status: "on-request",
    keywords: ["automation", "no-code", "workflow", "zap"],
  },
  {
    id: "make",
    name: "Make",
    category: "automation",
    logo: { kind: "brand", glyph: "make" },
    description: "Connect Syntrixa360 to the apps in your Make scenarios.",
    method: "Make's HTTP / webhook modules once Webhooks exist. No Make app listing is planned yet.",
    brings: ["Leads from any Make-connected app"],
    requirement: "Depends on Webhooks / REST API being built first.",
    status: "on-request",
    keywords: ["integromat", "automation", "no-code", "workflow", "scenario"],
  },
  {
    id: "n8n",
    name: "n8n",
    category: "automation",
    logo: { kind: "brand", glyph: "n8n" },
    description: "Connect Syntrixa360 to your n8n workflows.",
    method: "n8n's HTTP / webhook nodes once Webhooks exist. No dedicated n8n node is planned yet.",
    brings: ["Leads from any n8n workflow"],
    requirement: "Depends on Webhooks / REST API being built first.",
    status: "on-request",
    keywords: ["automation", "no-code", "workflow", "self-hosted", "open source"],
  },
  {
    id: "pabbly-connect",
    name: "Pabbly Connect",
    category: "automation",
    logo: { kind: "monogram", text: "Pc", color: "#1D4ED8" },
    description: "Connect Syntrixa360 to the apps in your Pabbly Connect workflows.",
    method: "Pabbly's webhook / API steps once Webhooks exist. No Pabbly app listing is planned yet.",
    brings: ["Leads from any Pabbly-connected app"],
    requirement: "Depends on Webhooks / REST API being built first.",
    status: "on-request",
    keywords: ["automation", "no-code", "workflow"],
  },
  {
    id: "custom-integration",
    name: "Custom Integration Requests",
    category: "automation",
    logo: { kind: "icon", icon: "Puzzle" },
    description: "Ask us to connect a marketplace, communication tool or business platform that is not listed.",
    method: "Assessed case by case: API, webhook, file import or email parsing.",
    brings: ["Depends on the platform"],
    requirement: "We review feasibility with you first. A request is not a commitment to build.",
    status: "on-request",
    keywords: ["custom", "request", "new platform", "other", "missing"],
  },
];

/** Integrations shown in the hero network visual (illustrative). Every id must exist in INTEGRATIONS. */
export const NETWORK_NODE_IDS: readonly string[] = [
  "indiamart",
  "tradeindia",
  "whatsapp-business",
  "gmail",
  "linkedin-lead-gen",
  "facebook-lead-ads",
  "instagram-lead-ads",
  "shopify",
  "google-sheets",
  "99acres",
  "exportersindia",
  "alibaba",
];

export function categoryLabel(id: IntegrationCategoryId): string {
  return INTEGRATION_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

export function getIntegration(id: string): Integration | undefined {
  return INTEGRATIONS.find((i) => i.id === id);
}

export type IntegrationFilter = {
  query: string;
  category: IntegrationCategoryId | "all";
};

function haystack(i: Integration): string {
  return [
    i.name,
    categoryLabel(i.category),
    i.description,
    i.method,
    STATUS_META[i.status].label,
    ...(i.keywords ?? []),
  ]
    .join(" ")
    .toLowerCase();
}

/** Every whitespace-separated word of the query must appear somewhere in the integration's searchable text. */
export function filterIntegrations(
  items: readonly Integration[],
  { query, category }: IntegrationFilter,
): Integration[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return items.filter((i) => {
    if (category !== "all" && i.category !== category) return false;
    if (words.length === 0) return true;
    const text = haystack(i);
    return words.every((w) => text.includes(w));
  });
}

export function groupByCategory(
  items: readonly Integration[],
): { category: IntegrationCategory; items: Integration[] }[] {
  return INTEGRATION_CATEGORIES.map((category) => ({
    category,
    items: items.filter((i) => i.category === category.id),
  })).filter((g) => g.items.length > 0);
}

export function countByStatus(items: readonly Integration[]): Record<IntegrationStatus, number> {
  const counts: Record<IntegrationStatus, number> = {
    live: 0,
    planned: 0,
    "requires-approval": 0,
    "on-request": 0,
  };
  for (const i of items) counts[i.status] += 1;
  return counts;
}

/** Problems with the catalogue itself; the unit test asserts this is empty. */
export function validateCatalogue(items: readonly Integration[] = INTEGRATIONS): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();
  const categories = new Set<string>(INTEGRATION_CATEGORIES.map((c) => c.id));
  for (const i of items) {
    if (seen.has(i.id)) problems.push(`duplicate id: ${i.id}`);
    seen.add(i.id);
    if (!categories.has(i.category)) problems.push(`${i.id}: unknown category ${i.category}`);
    if (i.status === "live" && !i.verification) {
      problems.push(`${i.id}: status "live" requires a verification record`);
    }
    if (i.logo.kind === "brand" && !(i.logo.glyph in BRAND_GLYPHS)) {
      problems.push(`${i.id}: no brand glyph "${i.logo.glyph}"`);
    }
    if (!i.description.trim() || i.brings.length === 0) problems.push(`${i.id}: missing copy`);
  }
  for (const id of NETWORK_NODE_IDS) {
    if (!seen.has(id)) problems.push(`network node ${id} is not in the catalogue`);
  }
  return problems;
}

// ------------------------------------------------------------------ Workflow + FAQ copy

export const integrationFlowSteps = [
  {
    step: "1",
    title: "Source Platform",
    description: "The marketplace, inbox, form or ad platform where an enquiry starts.",
    icon: "Globe",
    tone: "brand",
  },
  {
    step: "2",
    title: "Connector or Import",
    description: "A connector, API, webhook or file import carries the enquiry across.",
    icon: "PlugZap",
    tone: "success",
  },
  {
    step: "3",
    title: "Validation and Field Mapping",
    description: "Incoming data is checked and mapped to Syntrixa360 lead fields.",
    icon: "ListChecks",
    tone: "warning",
  },
  {
    step: "4",
    title: "Central Lead Engine",
    description: "Leads from every source are collected into one central lead list.",
    icon: "Database",
    tone: "violet",
  },
  {
    step: "5",
    title: "CRM",
    description: "Leads connect to customers, requirements, quotations and the pipeline.",
    icon: "Users",
    tone: "teal",
  },
  {
    step: "6",
    title: "Follow-up Workflow",
    description: "Assign owners, schedule follow-ups and track each lead to close.",
    icon: "BellRing",
    tone: "rose",
  },
] as const;

export const integrationFaqs = [
  {
    question: "Which integrations can I connect today?",
    answer:
      "None are marked Live yet. Every card shows its real status: Planned (on the build list), Requires approval (depends on the platform granting access) or On request (not scheduled). We only mark an integration Live after it has been built and verified against the real platform.",
  },
  {
    question: "Why do some platforms say “Requires approval”?",
    answer:
      "Platforms such as Meta, LinkedIn, Google Ads and some portals decide who may read lead data. We need their approval or API access before a connector can be built and used with your account.",
  },
  {
    question: "Can I bring leads in without a connector?",
    answer:
      "CSV import, Excel import, a REST API and webhooks are planned so that leads from any source can be brought in. They are not available yet. If you need a specific route sooner, send us a custom integration request.",
  },
  {
    question: "My platform is not listed. Can you add it?",
    answer:
      "Send a custom integration request. We look at what the platform offers (API, webhook, file export or email) and tell you whether it is feasible. A request is not a promise to build, and we do not commit to dates in advance.",
  },
] as const;
