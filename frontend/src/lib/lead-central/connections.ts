// Platform Connections (Lead Central, Prompt 2): provider catalog + pure derivations.
//
// Honesty rules baked in here:
//  - Status comes ONLY from GET /api/v1/channels. Providers that endpoint doesn't list are "not_connected" and
//    flagged `available: false` (no integration exists). Nothing is ever derived as connected.
//  - There is no sync-state, import-count or last-sync data anywhere in the backend, so none is produced:
//    "syncing" is part of the status vocabulary (and the filter) but can't occur yet; counts and times are null.
//  - A custom source is a local DRAFT. Draft != saved != connected != synced; only "draft" exists today.
import { z } from "zod";

import type { ChannelStatusDto } from "@/lib/api/channels";

export type SourceGroup = "direct" | "marketplace" | "social" | "custom";
export type ConnectionMethod = "oauth" | "api" | "webhook" | "manual";

export type ProviderDef = {
  key: string;
  name: string;
  description: string;
  group: SourceGroup;
  method: ConnectionMethod;
  /** Matching `channelType` in GET /channels, when the backend knows this provider. */
  channelType?: string;
};

export const GROUP_LABELS: Record<SourceGroup, string> = {
  direct: "Communication & direct lead sources",
  marketplace: "B2B marketplaces & enquiry platforms",
  social: "Social platforms",
  custom: "Custom integrations",
};

/** Single definition of every provider shown on the page (UI components must not redefine these). */
export const PROVIDERS: ProviderDef[] = [
  {
    key: "gmail",
    name: "Gmail",
    description: "Turn enquiry emails into leads.",
    group: "direct",
    method: "oauth",
    channelType: "gmail",
  },
  {
    key: "whatsapp",
    name: "WhatsApp Business",
    description: "Capture leads from WhatsApp conversations.",
    group: "direct",
    method: "api",
    channelType: "whatsapp",
  },
  {
    key: "website",
    name: "Website / Contact Form",
    description: "Receive website enquiries and form submissions.",
    group: "direct",
    method: "webhook",
    channelType: "website",
  },
  {
    key: "indiamart",
    name: "IndiaMART",
    description: "Import buyer enquiries from IndiaMART.",
    group: "marketplace",
    method: "api",
  },
  {
    key: "tradeindia",
    name: "TradeIndia",
    description: "Import enquiries from TradeIndia.",
    group: "marketplace",
    method: "api",
  },
  {
    key: "alibaba",
    name: "Alibaba",
    description: "Import inquiries from Alibaba.",
    group: "marketplace",
    method: "api",
  },
  {
    key: "exportersindia",
    name: "ExportersIndia",
    description: "Import enquiries from ExportersIndia.",
    group: "marketplace",
    method: "api",
  },
  {
    key: "justdial",
    name: "Justdial",
    description: "Import leads from Justdial.",
    group: "marketplace",
    method: "api",
  },
  {
    key: "linkedin",
    name: "LinkedIn",
    description: "Capture leads from LinkedIn lead forms.",
    group: "social",
    method: "oauth",
  },
  {
    key: "facebook",
    name: "Facebook",
    description: "Capture leads from Facebook lead ads.",
    group: "social",
    method: "oauth",
  },
  {
    key: "instagram",
    name: "Instagram",
    description: "Capture leads from Instagram lead ads.",
    group: "social",
    method: "oauth",
  },
];

export const CUSTOM_SOURCE_KEY = "custom";

export type SourceStatus =
  | "connected"
  | "syncing"
  | "error"
  | "not_connected"
  | "configuration_required"
  | "draft";

export const STATUS_LABELS: Record<SourceStatus, string> = {
  connected: "Connected",
  syncing: "Syncing",
  error: "Error",
  not_connected: "Not Connected",
  configuration_required: "Configuration Required",
  draft: "Draft · not saved",
};

export type StatusFilter =
  "all" | "connected" | "syncing" | "error" | "not_connected";

export const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All Sources" },
  { value: "connected", label: "Connected" },
  { value: "syncing", label: "Syncing" },
  { value: "error", label: "Error" },
  { value: "not_connected", label: "Not Connected" },
];

export type SourceCardModel = {
  key: string;
  name: string;
  description: string;
  group: SourceGroup;
  method: ConnectionMethod;
  status: SourceStatus;
  /** True only when the backend reports a real integration for this provider. */
  available: boolean;
  /** Server message for this channel (API providers only). */
  message: string | null;
  healthStatus: string | null;
  connectedAt: string | null;
  lastCheckedAt: string | null;
  /** No backend source for these today: always null (rendered as "—"). */
  importedLeads: number | null;
  lastSyncAt: string | null;
  isDraft: boolean;
  draft?: CustomDraft;
};

function mapChannelStatus(c: ChannelStatusDto): SourceStatus {
  switch (c.status) {
    case "connected":
      return "connected";
    case "error":
      return "error";
    case "pending":
      return "configuration_required";
    case "disconnected":
      return "not_connected";
    default:
      return c.integrationAvailable && c.setupRequired
        ? "configuration_required"
        : "not_connected";
  }
}

export function buildSourceCards(
  channels: ChannelStatusDto[],
  drafts: CustomDraft[] = [],
): SourceCardModel[] {
  const byType = new Map(channels.map((c) => [c.channelType, c]));
  const base = {
    importedLeads: null,
    lastSyncAt: null,
    isDraft: false,
  } as const;
  const cards: SourceCardModel[] = PROVIDERS.map((p) => {
    const c = p.channelType ? byType.get(p.channelType) : undefined;
    return {
      ...base,
      key: p.key,
      name: p.name,
      description: p.description,
      group: p.group,
      method: p.method,
      status: c ? mapChannelStatus(c) : "not_connected",
      available: c ? c.integrationAvailable || c.status === "connected" : false,
      message: c ? c.message : "No integration exists for this platform yet.",
      healthStatus: c?.healthStatus ?? null,
      connectedAt: c?.connectedAt ?? null,
      lastCheckedAt: c?.lastCheckedAt ?? null,
    };
  });
  cards.push({
    ...base,
    key: CUSTOM_SOURCE_KEY,
    name: "Other / Custom Source",
    description:
      "Define a source of your own, e.g. a directory, partner or form not listed here.",
    group: "custom",
    method: "manual",
    status: "not_connected",
    available: false,
    message: "Custom sources can't be saved or connected yet.",
    healthStatus: null,
    connectedAt: null,
    lastCheckedAt: null,
  });
  for (const d of drafts) {
    cards.push({
      ...base,
      key: `draft:${d.id}`,
      name: d.name,
      description: d.description || "Draft custom source.",
      group: "custom",
      method:
        d.method === "webhook"
          ? "webhook"
          : d.method === "api_pull"
            ? "api"
            : "manual",
      status: "draft",
      available: false,
      message:
        "Draft only: kept in this browser tab, not saved to your workspace and not connected.",
      healthStatus: null,
      connectedAt: null,
      lastCheckedAt: null,
      isDraft: true,
      draft: d,
    });
  }
  return cards;
}

const matchesStatus = (c: SourceCardModel, f: StatusFilter) =>
  f === "all" ||
  (f === "not_connected"
    ? c.status === "not_connected" ||
      c.status === "configuration_required" ||
      c.status === "draft"
    : c.status === f);

export function filterSources(
  cards: SourceCardModel[],
  search: string,
  status: StatusFilter,
) {
  const q = search.trim().toLowerCase();
  return cards.filter(
    (c) => matchesStatus(c, status) && (!q || c.name.toLowerCase().includes(q)),
  );
}

/** Counts per filter chip for the current search (so chips show what clicking them would yield). */
export function filterCounts(
  cards: SourceCardModel[],
  search: string,
): Record<StatusFilter, number> {
  return Object.fromEntries(
    FILTERS.map((f) => [f.value, filterSources(cards, search, f.value).length]),
  ) as Record<StatusFilter, number>;
}

export type ConnectionSummary = {
  totalSources: number;
  draftCount: number;
  connected: number;
  errors: number;
  /** No data source exists for these: always null today. */
  leadsImported: number | null;
  lastSyncAt: string | null;
  health: "no_connections" | "healthy" | "attention";
};

export function summarize(cards: SourceCardModel[]): ConnectionSummary {
  const real = cards.filter((c) => !c.isDraft);
  const connected = real.filter((c) => c.status === "connected").length;
  const errors = real.filter((c) => c.status === "error").length;
  return {
    totalSources: real.length,
    draftCount: cards.length - real.length,
    connected,
    errors,
    leadsImported: null,
    lastSyncAt: null,
    health:
      errors > 0 ? "attention" : connected > 0 ? "healthy" : "no_connections",
  };
}

// ---- custom source draft -----------------------------------------------------------------------
export const SOURCE_TYPES = [
  { value: "marketplace", label: "Marketplace / enquiry platform" },
  { value: "directory", label: "Business directory" },
  { value: "social", label: "Social platform" },
  { value: "form", label: "Form / landing page" },
  { value: "other", label: "Other" },
] as const;
export const CUSTOM_METHODS = [
  { value: "manual_import", label: "Manual import (CSV)" },
  { value: "webhook", label: "Inbound webhook (set up in a later stage)" },
  { value: "api_pull", label: "API pull (set up in a later stage)" },
] as const;
export const IMPORT_MODES = [
  { value: "manual", label: "Manual" },
  { value: "scheduled", label: "Scheduled (when sync is available)" },
] as const;

export type CustomDraft = {
  id: string;
  name: string;
  sourceType: (typeof SOURCE_TYPES)[number]["value"];
  method: (typeof CUSTOM_METHODS)[number]["value"];
  importMode: (typeof IMPORT_MODES)[number]["value"];
  description: string;
};

/**
 * Deliberately has NO url / token / secret / webhook fields: arbitrary input must never become an executable
 * webhook or a server-side fetch. Those are generated and validated server-side in a later stage.
 */
export const customSourceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Enter at least 2 characters.")
    .max(60, "Keep the name under 60 characters.")
    .regex(
      /^[\p{L}\p{N} .,&'()/-]+$/u,
      "Use letters, numbers and basic punctuation only.",
    ),
  sourceType: z.enum(["marketplace", "directory", "social", "form", "other"]),
  method: z.enum(["manual_import", "webhook", "api_pull"]),
  importMode: z.enum(["manual", "scheduled"]),
  description: z
    .string()
    .trim()
    .max(300, "Keep the description under 300 characters."),
});

export type CustomSourceInput = z.infer<typeof customSourceSchema>;

/** Validates and checks the name against every existing source name (case-insensitive). */
export function validateCustomSource(
  input: unknown,
  existingNames: string[],
):
  | { ok: true; value: CustomSourceInput }
  | { ok: false; errors: Partial<Record<keyof CustomSourceInput, string>> } {
  const parsed = customSourceSchema.safeParse(input);
  if (!parsed.success) {
    const errors: Partial<Record<keyof CustomSourceInput, string>> = {};
    for (const issue of parsed.error.issues) {
      const k = issue.path[0] as keyof CustomSourceInput;
      if (!errors[k]) errors[k] = issue.message;
    }
    return { ok: false, errors };
  }
  const taken = existingNames.some(
    (n) => n.trim().toLowerCase() === parsed.data.name.toLowerCase(),
  );
  if (taken)
    return {
      ok: false,
      errors: { name: "A source with this name already exists." },
    };
  return { ok: true, value: parsed.data };
}
