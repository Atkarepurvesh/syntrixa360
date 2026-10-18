import { describe, expect, it } from "vitest";

import { leads as seedLeads, type Lead } from "@/lib/leads-data";
import { buildPlatformRows } from "@/lib/lead-central/platforms";
import {
  buildRecentActivity,
  buildSourceSlices,
  buildTrend,
  computeKpis,
  leadsInRange,
  previousRange,
  recentLeads,
  resolveRange,
} from "@/lib/lead-central/metrics";

const NOW = new Date(2026, 9, 15, 12, 0, 0); // 15 Oct 2026, local

function lead(over: Partial<Lead> & { id: string; daysAgo: number }): Lead {
  const base = seedLeads[0]!;
  const d = new Date(
    NOW.getFullYear(),
    NOW.getMonth(),
    NOW.getDate() - over.daysAgo,
    10,
    0,
    0,
  );
  const { daysAgo: _ignored, ...rest } = over;
  void _ignored;
  return {
    ...base,
    status: "Contacted",
    score: 50,
    source: "Website",
    activity: [],
    createdAt: d.toISOString(),
    ...rest,
  };
}

describe("resolveRange / previousRange", () => {
  it("today covers exactly the local day", () => {
    const r = resolveRange("today", NOW);
    expect(r.from).toEqual(new Date(2026, 9, 15));
    expect(r.to).toEqual(new Date(2026, 9, 16));
  });
  it("7d is 7 whole days ending today and has an equally long previous period", () => {
    const r = resolveRange("7d", NOW);
    expect(r.from).toEqual(new Date(2026, 9, 9));
    const p = previousRange(r)!;
    expect(p.to).toEqual(r.from);
    expect(p.to!.getTime() - p.from!.getTime()).toBe(
      r.to!.getTime() - r.from!.getTime(),
    );
  });
  it("all time and this year have no previous period", () => {
    expect(previousRange(resolveRange("all", NOW))).toBeNull();
    expect(previousRange(resolveRange("year", NOW))).toBeNull();
  });
});

const byKey = (list: ReturnType<typeof computeKpis>) =>
  Object.fromEntries(list.map((x) => [x.key, x])) as Record<
    "total" | "new" | "hot" | "converted",
    ReturnType<typeof computeKpis>[number]
  >;

describe("computeKpis", () => {
  const data = [
    lead({ id: "a", daysAgo: 1, status: "New", score: 90 }),
    lead({ id: "b", daysAgo: 2, status: "Converted", score: 85 }),
    lead({ id: "c", daysAgo: 3, status: "Contacted", score: 10 }),
    lead({ id: "d", daysAgo: 10, status: "New", score: 95 }), // previous 7d window
    lead({ id: "e", daysAgo: 400, status: "Converted", score: 10 }),
  ];
  it("counts only leads created in range, using the Leads module definitions", () => {
    const k = byKey(computeKpis(data, resolveRange("7d", NOW)));
    expect(k.total.value).toBe(3);
    expect(k.new.value).toBe(1);
    expect(k.hot.value).toBe(2);
    expect(k.converted.value).toBe(1);
  });
  it("computes a comparison only when the previous period has data", () => {
    const k = byKey(computeKpis(data, resolveRange("7d", NOW)));
    expect(k.total.previous).toBe(1);
    expect(k.total.changePercent).toBe(200);
    expect(k.converted.previous).toBe(0);
    expect(k.converted.changePercent).toBeNull(); // previous = 0 -> no invented percentage
  });
  it("gives no comparison for All time", () => {
    const k = computeKpis(data, resolveRange("all", NOW));
    expect(
      k.every((x) => x.previous === null && x.changePercent === null),
    ).toBe(true);
    expect(k[0]!.value).toBe(5);
  });
});

describe("buildTrend", () => {
  it("is empty when no lead is in range", () => {
    expect(
      buildTrend([lead({ id: "x", daysAgo: 400 })], resolveRange("7d", NOW)),
    ).toEqual([]);
  });
  it("uses one point per day for short ranges, including empty days", () => {
    const t = buildTrend(
      [lead({ id: "a", daysAgo: 1, status: "Converted", score: 90 })],
      resolveRange("7d", NOW),
    );
    expect(t).toHaveLength(7);
    const hit = t.find((p) => p.newLeads + p.convertedLeads + p.hotLeads > 0)!;
    expect(hit).toMatchObject({ newLeads: 0, convertedLeads: 1, hotLeads: 1 });
  });
  it("switches to monthly buckets for long spans", () => {
    const t = buildTrend(
      [lead({ id: "a", daysAgo: 1 }), lead({ id: "b", daysAgo: 200 })],
      resolveRange("all", NOW),
    );
    expect(t.length).toBeGreaterThan(5);
    expect(t.length).toBeLessThan(15);
  });
});

describe("buildSourceSlices", () => {
  it("counts each lead once and percentages sum to 100", () => {
    const data = [
      ...Array.from({ length: 3 }, (_, i) =>
        lead({ id: `w${i}`, daysAgo: 1, source: "Website" }),
      ),
      lead({ id: "i1", daysAgo: 1, source: "IndiaMART" }),
      lead({ id: "e1", daysAgo: 1, source: "Email" }),
    ];
    const s = buildSourceSlices(data, resolveRange("all", NOW));
    expect(s.reduce((a, b) => a + b.count, 0)).toBe(5);
    expect(s.reduce((a, b) => a + b.percent, 0)).toBe(100);
    expect(s[0]).toMatchObject({ label: "Website", count: 3 });
  });
  it("groups the tail into Other sources and returns [] when empty", () => {
    expect(buildSourceSlices([], resolveRange("all", NOW))).toEqual([]);
    const sources = [
      "Website",
      "WhatsApp",
      "Email",
      "Phone",
      "Referral",
      "Meta",
      "Google",
      "IndiaMART",
    ] as const;
    const s = buildSourceSlices(
      sources.map((src, i) => lead({ id: `s${i}`, daysAgo: 1, source: src })),
      resolveRange("all", NOW),
      6,
    );
    expect(s).toHaveLength(7);
    expect(s[6]).toMatchObject({ key: "others", count: 2 });
    expect(s.reduce((a, b) => a + b.percent, 0)).toBe(100);
  });
});

describe("recentLeads / buildRecentActivity", () => {
  it("sorts newest first and filters by search text", () => {
    const data = [
      lead({ id: "old", daysAgo: 5, company: "Alpha Co" }),
      lead({ id: "new", daysAgo: 1, company: "Beta Co" }),
    ];
    expect(
      recentLeads(data, resolveRange("all", NOW)).map((l) => l.id),
    ).toEqual(["new", "old"]);
    expect(
      recentLeads(data, resolveRange("all", NOW), "alpha").map((l) => l.id),
    ).toEqual(["old"]);
  });
  it("only surfaces recorded events and skips unparseable dates", () => {
    const l = lead({
      id: "z",
      daysAgo: 1,
      activity: [
        {
          id: "1",
          type: "created",
          description: "Lead created",
          user: "System",
          date: "14 Oct 2026",
          time: "10:00 AM",
        },
        {
          id: "2",
          type: "note",
          description: "ignored kind",
          user: "x",
          date: "14 Oct 2026",
          time: "11:00 AM",
        },
        {
          id: "3",
          type: "converted",
          description: "bad date",
          user: "x",
          date: "garbage",
          time: "",
        },
      ],
    });
    const ev = buildRecentActivity([l], resolveRange("all", NOW));
    expect(ev).toHaveLength(1);
    expect(ev[0]).toMatchObject({ kind: "created", title: "New lead created" });
  });
});

describe("buildPlatformRows", () => {
  it("never reports unlisted platforms as connected and invents no timestamps", () => {
    const rows = buildPlatformRows([
      {
        channelType: "whatsapp",
        label: "WhatsApp Business",
        status: "not_connected",
        integrationAvailable: false,
        setupRequired: true,
        message: "Not configured",
        healthStatus: null,
        displayName: null,
        connectedAt: null,
        lastCheckedAt: null,
      },
    ]);
    expect(rows[0]).toMatchObject({
      statusLabel: "Not available yet",
      tone: "idle",
      fromApi: true,
    });
    const extra = rows.filter((r) => !r.fromApi);
    expect(extra.map((r) => r.name)).toEqual([
      "IndiaMART",
      "LinkedIn",
      "Facebook",
      "Instagram",
    ]);
    expect(
      rows.every((r) => r.tone !== "connected" && r.lastCheckedAt === null),
    ).toBe(true);
  });
  it("shows connected only when the API says so", () => {
    const [r] = buildPlatformRows([
      {
        channelType: "email",
        label: "Gmail",
        status: "connected",
        integrationAvailable: true,
        setupRequired: false,
        message: "ok",
        healthStatus: "healthy",
        displayName: "x",
        connectedAt: "2026-10-01T00:00:00Z",
        lastCheckedAt: "2026-10-02T00:00:00Z",
      },
    ]);
    expect(r).toMatchObject({
      statusLabel: "Connected",
      tone: "connected",
      lastCheckedAt: "2026-10-02T00:00:00Z",
    });
  });
});

describe("leadsInRange", () => {
  it("treats the end as exclusive", () => {
    const r = resolveRange("today", NOW);
    expect(leadsInRange([lead({ id: "t", daysAgo: 0 })], r)).toHaveLength(1);
    expect(leadsInRange([lead({ id: "y", daysAgo: 1 })], r)).toHaveLength(0);
  });
});
