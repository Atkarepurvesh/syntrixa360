import { describe, expect, it } from "vitest";

import type { ChannelStatusDto } from "@/lib/api/channels";
import {
  buildSourceCards,
  filterCounts,
  filterSources,
  PROVIDERS,
  summarize,
  validateCustomSource,
  type CustomDraft,
} from "@/lib/lead-central/connections";

const ch = (over: Partial<ChannelStatusDto>): ChannelStatusDto => ({
  channelType: "gmail",
  label: "Gmail",
  status: "not_connected",
  integrationAvailable: false,
  setupRequired: true,
  message: "Setup required",
  healthStatus: null,
  displayName: null,
  connectedAt: null,
  lastCheckedAt: null,
  ...over,
});

const draft: CustomDraft = {
  id: "d1",
  name: "Partner Portal",
  sourceType: "other",
  method: "manual_import",
  importMode: "manual",
  description: "",
};

describe("buildSourceCards", () => {
  it("covers every provider plus the custom entry, with nothing connected by default", () => {
    const cards = buildSourceCards([ch({})]);
    expect(cards).toHaveLength(PROVIDERS.length + 1);
    expect(
      cards.every((c) => c.status !== "connected" && c.status !== "syncing"),
    ).toBe(true);
    expect(
      cards.every((c) => c.importedLeads === null && c.lastSyncAt === null),
    ).toBe(true);
  });
  it("marks providers the API doesn't list as unavailable", () => {
    const cards = buildSourceCards([ch({})]);
    expect(cards.find((c) => c.key === "indiamart")).toMatchObject({
      status: "not_connected",
      available: false,
    });
  });
  it("reflects server status only: connected, error, pending", () => {
    const cards = buildSourceCards([
      ch({
        channelType: "gmail",
        status: "connected",
        integrationAvailable: true,
        setupRequired: false,
      }),
      ch({
        channelType: "whatsapp",
        status: "error",
        integrationAvailable: true,
      }),
      ch({
        channelType: "website",
        status: "pending",
        integrationAvailable: true,
      }),
    ]);
    const s = (k: string) => cards.find((c) => c.key === k)!.status;
    expect(s("gmail")).toBe("connected");
    expect(s("whatsapp")).toBe("error");
    expect(s("website")).toBe("configuration_required");
  });
  it("adds drafts as 'draft', never connected", () => {
    const cards = buildSourceCards([], [draft]);
    const d = cards.find((c) => c.isDraft)!;
    expect(d.status).toBe("draft");
    expect(summarize(cards).draftCount).toBe(1);
    expect(summarize(cards).totalSources).toBe(PROVIDERS.length + 1);
  });
});

describe("filtering", () => {
  const cards = buildSourceCards(
    [
      ch({
        channelType: "gmail",
        status: "connected",
        integrationAvailable: true,
        setupRequired: false,
      }),
      ch({
        channelType: "whatsapp",
        status: "error",
        integrationAvailable: true,
      }),
    ],
    [draft],
  );
  it("combines search and status", () => {
    expect(filterSources(cards, "", "connected").map((c) => c.key)).toEqual([
      "gmail",
    ]);
    expect(filterSources(cards, "whats", "error").map((c) => c.key)).toEqual([
      "whatsapp",
    ]);
    expect(filterSources(cards, "gmail", "error")).toEqual([]);
  });
  it("Not Connected includes unconfigured and drafts; Syncing is empty", () => {
    const nc = filterSources(cards, "", "not_connected");
    expect(nc.some((c) => c.isDraft)).toBe(true);
    expect(
      nc.every((c) => c.status !== "connected" && c.status !== "error"),
    ).toBe(true);
    expect(filterSources(cards, "", "syncing")).toEqual([]);
  });
  it("counts follow the current search", () => {
    const counts = filterCounts(cards, "india");
    expect(counts.all).toBe(3); // IndiaMART, TradeIndia, ExportersIndia (name match only)
    expect(counts.connected).toBe(0);
    expect(counts.not_connected).toBe(3);
  });
});

describe("summarize", () => {
  it("reports health from real statuses and no invented metrics", () => {
    expect(summarize(buildSourceCards([ch({})])).health).toBe("no_connections");
    expect(
      summarize(
        buildSourceCards([
          ch({ status: "connected", integrationAvailable: true }),
        ]),
      ).health,
    ).toBe("healthy");
    const bad = summarize(
      buildSourceCards([ch({ status: "error", integrationAvailable: true })]),
    );
    expect(bad.health).toBe("attention");
    expect(bad.leadsImported).toBeNull();
    expect(bad.lastSyncAt).toBeNull();
  });
});

describe("validateCustomSource", () => {
  const base = {
    name: "Trade Fair 2026",
    sourceType: "other",
    method: "manual_import",
    importMode: "manual",
    description: "",
  };
  it("accepts valid input", () => {
    expect(validateCustomSource(base, ["Gmail"]).ok).toBe(true);
  });
  it("rejects short, odd-character and duplicate names (case-insensitive)", () => {
    expect(validateCustomSource({ ...base, name: "a" }, [])).toMatchObject({
      ok: false,
    });
    expect(
      validateCustomSource({ ...base, name: "<script>" }, []),
    ).toMatchObject({ ok: false });
    const dup = validateCustomSource({ ...base, name: "gmail" }, ["Gmail"]);
    expect(dup).toMatchObject({
      ok: false,
      errors: { name: "A source with this name already exists." },
    });
  });
  it("rejects unknown methods and over-long descriptions", () => {
    expect(
      validateCustomSource({ ...base, method: "run-url" }, []),
    ).toMatchObject({ ok: false });
    expect(
      validateCustomSource({ ...base, description: "x".repeat(301) }, []),
    ).toMatchObject({ ok: false });
  });
  it("strips any url/secret fields instead of keeping them", () => {
    const r = validateCustomSource(
      { ...base, webhookUrl: "http://169.254.169.254", apiKey: "k" },
      [],
    );
    expect(r.ok && Object.keys(r.value)).not.toContain("webhookUrl");
    expect(r.ok && Object.keys(r.value)).not.toContain("apiKey");
  });
});
