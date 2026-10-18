import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { BRAND_GLYPHS } from "@/data/integration-logos";
import {
  INTEGRATIONS,
  INTEGRATION_CATEGORIES,
  NETWORK_NODE_IDS,
  countByStatus,
  filterIntegrations,
  getIntegration,
  groupByCategory,
  validateCatalogue,
} from "@/data/integrations";
import { navLinks } from "@/data/site";

const root = path.resolve(__dirname, "../..");

describe("navbar order", () => {
  it("reads Product, Solutions, Integrations, Industries, Pricing", () => {
    expect(navLinks.map((l) => l.label)).toEqual([
      "Product",
      "Solutions",
      "Integrations",
      "Industries",
      "Pricing",
    ]);
  });

  it("Integrations is its own top-level item pointing at /integrations", () => {
    const item = navLinks.find((l) => l.label === "Integrations");
    expect(item?.to).toBe("/integrations");
    expect(item !== undefined && "children" in item).toBe(false);
  });

  it("Integrations is not nested under Solutions", () => {
    const solutions = navLinks.find((l) => l.label === "Solutions");
    expect(solutions !== undefined && "children" in solutions).toBe(false);
  });

  it("the /integrations route file exists and is registered in the route tree", () => {
    expect(existsSync(path.join(root, "src/routes/integrations.tsx"))).toBe(true);
    const tree = readFileSync(path.join(root, "src/routeTree.gen.ts"), "utf8");
    expect(tree).toContain("'/integrations': typeof IntegrationsRoute");
    expect(tree).toContain("IntegrationsRoute: IntegrationsRoute");
  });
});

describe("catalogue contents", () => {
  const required = [
    "IndiaMART",
    "TradeIndia",
    "ExportersIndia",
    "Alibaba.com",
    "Global Sources",
    "Made-in-China",
    "Udaan",
    "Justdial",
    "WhatsApp Business",
    "Gmail",
    "Microsoft Outlook",
    "Microsoft 365",
    "Phone Calls",
    "SMS Providers",
    "Website Live Chat",
    "99acres",
    "Housing.com",
    "Magicbricks",
    "Google Sheets",
    "Google Drive",
    "Google Calendar",
    "Website Forms",
    "WordPress",
    "Shopify",
    "WooCommerce",
    "Product Enquiry Forms",
    "RFQ Forms",
    "Facebook Lead Ads",
    "Instagram Lead Ads",
    "LinkedIn Lead Gen Forms",
    "Google Ads Lead Forms",
    "CSV Import",
    "Excel Import",
    "REST API",
    "Webhooks",
    "Zapier",
    "Make",
    "n8n",
    "Pabbly Connect",
    "Custom Integration Requests",
  ];

  it("includes every platform from the brief", () => {
    const names = INTEGRATIONS.map((i) => i.name);
    for (const name of required) expect(names).toContain(name);
    expect(INTEGRATIONS).toHaveLength(required.length);
  });

  it("has no structural problems (unique ids, known categories, glyphs, network nodes)", () => {
    expect(validateCatalogue()).toEqual([]);
  });

  it("every category has at least one integration", () => {
    for (const c of INTEGRATION_CATEGORIES) {
      expect(INTEGRATIONS.some((i) => i.category === c.id)).toBe(true);
    }
  });

  it("every network node and brand glyph resolves", () => {
    for (const id of NETWORK_NODE_IDS) expect(getIntegration(id)).toBeTruthy();
    for (const g of Object.values(BRAND_GLYPHS)) {
      expect(g.path.length).toBeGreaterThan(20);
    }
  });
});

describe("honest availability", () => {
  it("never shows Live without a verification record", () => {
    for (const i of INTEGRATIONS) {
      if (i.status === "live") expect(i.verification).toBeTruthy();
    }
  });

  it("flags a live card with no verification as a catalogue problem", () => {
    const first = INTEGRATIONS[0];
    if (!first) throw new Error("catalogue is empty");
    const bad = [{ ...first, id: "x-live", status: "live" as const }];
    expect(validateCatalogue(bad).some((p) => p.includes("requires a verification"))).toBe(true);
  });

  it("matches the backend: no connector is implemented, so none is Live", () => {
    // backend/app/services/channel_service.py: INTEGRATIONS = {c: False ...}. When a connector is really
    // built and verified, give its card a `verification` record and update this expectation.
    expect(countByStatus(INTEGRATIONS).live).toBe(0);
  });
});

describe("search and category filters", () => {
  it("returns everything with no query and category 'all'", () => {
    expect(filterIntegrations(INTEGRATIONS, { query: "", category: "all" })).toHaveLength(
      INTEGRATIONS.length,
    );
  });

  it("finds by name, case-insensitively", () => {
    const hits = filterIntegrations(INTEGRATIONS, { query: "indiaMART", category: "all" });
    expect(hits.map((h) => h.id)).toEqual(["indiamart"]);
  });

  it("finds by keyword and by status label", () => {
    expect(
      filterIntegrations(INTEGRATIONS, { query: "spreadsheet", category: "all" }).map((h) => h.id),
    ).toContain("google-sheets");
    const approval = filterIntegrations(INTEGRATIONS, { query: "requires approval", category: "all" });
    expect(approval.length).toBeGreaterThan(0);
    expect(approval.every((h) => h.status === "requires-approval")).toBe(true);
  });

  it("requires every word of the query to match", () => {
    const hits = filterIntegrations(INTEGRATIONS, { query: "gmail outlook", category: "all" });
    expect(hits).toHaveLength(0);
  });

  it("filters by category and combines it with the query", () => {
    const social = filterIntegrations(INTEGRATIONS, { query: "", category: "social" });
    expect(social.map((s) => s.id)).toEqual([
      "facebook-lead-ads",
      "instagram-lead-ads",
      "linkedin-lead-gen",
      "google-ads-lead-forms",
    ]);
    const googleOnly = filterIntegrations(INTEGRATIONS, { query: "google", category: "social" });
    expect(googleOnly.map((s) => s.id)).toEqual(["google-ads-lead-forms"]);
  });

  it("returns nothing for an unknown term", () => {
    expect(filterIntegrations(INTEGRATIONS, { query: "zzzzqq", category: "all" })).toHaveLength(0);
  });

  it("groups results in catalogue category order and drops empty groups", () => {
    const groups = groupByCategory(
      filterIntegrations(INTEGRATIONS, { query: "", category: "all" }),
    );
    expect(groups.map((g) => g.category.id)).toEqual(INTEGRATION_CATEGORIES.map((c) => c.id));
    const only = groupByCategory(filterIntegrations(INTEGRATIONS, { query: "99acres", category: "all" }));
    expect(only.map((g) => g.category.id)).toEqual(["real-estate"]);
  });
});
