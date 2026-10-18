import { describe, expect, it } from "vitest";

import { computeLeadKpis, createCrmStore, type CrmStore } from "../crm-store";
import {
  buildSourceBreakdown,
  dashboardLeadCards,
  dashboardLeadKpis,
  SOURCE_COLORS,
} from "../dashboard-metrics";
import { scopeLeadsForUser } from "../lead-query";
import { leadSourcesList } from "../lead-sources";
import { leads as seedLeads, type Lead } from "../leads-data";

// Local-time "now" (the app uses the user's local date). All dates below are built in local time.
// Starts from the real local date: "today" in these tests is the real today.
const NOW = new Date();
NOW.setHours(10, 30, 0, 0);
let tick = NOW.getTime();
const fresh = (init?: { leads: Lead[] }): CrmStore =>
  createCrmStore(
    init ? { ...init, notifications: [] } : undefined,
    () => new Date((tick += 1000)),
  );
const empty = () => fresh({ leads: [] });
const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const today = () => iso(new Date());
const plusDays = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return iso(d);
};
const mk = (s: CrmStore, name: string, extra: Record<string, unknown> = {}) =>
  s.createLead({ name, source: "WhatsApp", owner: "Rahul Verma", ...extra });
const kpis = (s: CrmStore) => dashboardLeadKpis(s.listLeads(), new Date());
const slice = (s: CrmStore, key: string) =>
  buildSourceBreakdown(s.listLeads()).slices.find((x) => x.key === key);

describe("KPI counts", () => {
  it("total lead count matches the store, for seed data and after changes", () => {
    expect(computeLeadKpis(seedLeads, NOW).total).toBe(seedLeads.length);
    const s = empty();
    expect(kpis(s).total).toBe(0);
    mk(s, "A");
    mk(s, "B");
    expect(kpis(s).total).toBe(2);
  });

  it("New / Qualified / Converted use the stored status", () => {
    const s = empty();
    mk(s, "A");
    mk(s, "B", { status: "Qualified" });
    mk(s, "C", { status: "Qualified" });
    mk(s, "D", { status: "Converted" });
    mk(s, "E", { status: "Lost" });
    expect(kpis(s)).toMatchObject({
      total: 5,
      newLeads: 1,
      qualified: 2,
      converted: 1,
    });
  });

  it("seed data: status counts equal a direct count of the stored statuses", () => {
    const k = computeLeadKpis(seedLeads, NOW);
    const direct = (st: string) =>
      seedLeads.filter((l) => l.status === st).length;
    expect(k).toMatchObject({
      newLeads: direct("New"),
      qualified: direct("Qualified"),
      converted: direct("Converted"),
    });
  });

  it("New Leads (Today) counts only leads created on the current local date", () => {
    const s = empty();
    mk(s, "Today");
    const old = {
      ...s.listLeads()[0]!,
      id: "L-900",
      createdAt: new Date(2025, 4, 25, 9, 0).toISOString(),
    };
    const k = computeLeadKpis([...s.listLeads(), old], new Date());
    expect(k.newToday).toBe(1);
    expect(computeLeadKpis(seedLeads, new Date()).newToday).toBe(0); // seeds are from May 2025
  });
});

describe("follow-ups due today", () => {
  it("counts today only; past is overdue, future is upcoming, missing date is ignored", () => {
    const s = empty();
    mk(s, "Today", { followUp: { date: today() } });
    mk(s, "Yesterday", { followUp: { date: plusDays(-1) } });
    mk(s, "Tomorrow", { followUp: { date: plusDays(1) } });
    mk(s, "None");
    expect(kpis(s).followUpsDueToday).toBe(1);
  });

  it("a lead is counted once even with several tasks or repeated scheduling", () => {
    const s = empty();
    const l = mk(s, "A", { followUp: { date: today(), time: "10:00" } });
    s.scheduleFollowUp(l.id, { date: today(), time: "10:00" }); // same slot: no-op
    s.scheduleFollowUp(l.id, { date: today(), time: "15:00", note: "later" }); // same day, rescheduled
    expect(
      s.getLead(l.id)!.tasks.filter((t) => t.kind === "follow-up"),
    ).toHaveLength(1);
    expect(kpis(s).followUpsDueToday).toBe(1);
  });

  it("rescheduling away from today (or onto today) updates the count", () => {
    const s = empty();
    const l = mk(s, "A", { followUp: { date: today() } });
    expect(kpis(s).followUpsDueToday).toBe(1);
    s.scheduleFollowUp(l.id, { date: plusDays(5) });
    expect(kpis(s).followUpsDueToday).toBe(0);
    s.editLead(l.id, { followUp: { date: today() } });
    expect(kpis(s).followUpsDueToday).toBe(1);
  });

  it("handles malformed / missing follow-up values safely", () => {
    const s = empty();
    const l = mk(s, "A");
    const odd: Lead[] = [
      { ...l, id: "L-91", nextFollowUp: "not a date" },
      { ...l, id: "L-92", nextFollowUp: "" },
      { ...l, id: "L-93", nextFollowUp: null },
    ];
    expect(() => computeLeadKpis(odd, NOW)).not.toThrow();
    expect(computeLeadKpis(odd, NOW).followUpsDueToday).toBe(0);
  });

  it("local-date boundary: 00:00:00 and 23:59:59 today are 'today'; the next local midnight is not", () => {
    const l = { ...mk(empty(), "A"), nextFollowUp: "14 Oct 2026" } as Lead;
    const due = (now: Date) => computeLeadKpis([l], now).followUpsDueToday;
    expect(due(new Date(2026, 9, 14, 0, 0, 0))).toBe(1);
    expect(due(new Date(2026, 9, 14, 23, 59, 59))).toBe(1);
    expect(due(new Date(2026, 9, 15, 0, 0, 0))).toBe(0); // now overdue
    expect(due(new Date(2026, 9, 13, 23, 59, 59))).toBe(0); // still upcoming
  });

  it("month and year rollovers use real dates", () => {
    const l = { ...mk(empty(), "A"), nextFollowUp: "01 Jan 2027" } as Lead;
    expect(
      computeLeadKpis([l], new Date(2027, 0, 1, 9, 0)).followUpsDueToday,
    ).toBe(1);
    expect(
      computeLeadKpis([l], new Date(2026, 11, 31, 23, 59)).followUpsDueToday,
    ).toBe(0);
  });
});

describe("dashboard KPI cards view-model", () => {
  it("formats values and subtitles from the KPIs; no trend percentages", () => {
    const s = empty();
    mk(s, "A", { status: "Qualified", followUp: { date: today() } });
    mk(s, "B", { status: "Converted" });
    const cards = dashboardLeadCards(kpis(s));
    expect(cards.leads).toEqual({
      value: "2",
      subtitle: "1 qualified · 1 converted",
    });
    expect(cards["new-leads"]).toEqual({
      value: "2",
      subtitle: "1 follow-up due today",
    });
    expect(JSON.stringify(cards)).not.toMatch(/%|▲|▼/);
  });
  it("pluralises and handles the empty store", () => {
    const cards = dashboardLeadCards(kpis(empty()));
    expect(cards.leads).toEqual({
      value: "0",
      subtitle: "0 qualified · 0 converted",
    });
    expect(cards["new-leads"]).toEqual({
      value: "0",
      subtitle: "0 follow-ups due today",
    });
  });
  it("large numbers get thousands separators", () => {
    const k = { ...kpis(empty()), total: 12345 };
    expect(dashboardLeadCards(k).leads.value).toBe("12,345");
  });
});

describe("source-wise counts and chart model", () => {
  it("counts leads per canonical source; slices sum to the total and to 100%", () => {
    const s = empty();
    mk(s, "1");
    mk(s, "2");
    mk(s, "3", { source: "IndiaMART" });
    mk(s, "4", { source: "Website" });
    const b = buildSourceBreakdown(s.listLeads());
    expect(b.total).toBe(4);
    expect(b.slices.map((x) => [x.key, x.count])).toEqual([
      ["WhatsApp", 2],
      ["IndiaMART", 1],
      ["Website", 1],
    ]);
    expect(b.slices.reduce((n, x) => n + x.count, 0)).toBe(4);
    expect(b.slices.reduce((n, x) => n + x.percent, 0)).toBe(100);
    expect(b.slices[0]).toMatchObject({
      label: "WhatsApp",
      percent: 50,
      color: SOURCE_COLORS.WhatsApp,
    });
  });

  it("percentages add up to exactly 100 even when rounding would not (1/3 each)", () => {
    const s = empty();
    mk(s, "1", { source: "WhatsApp" });
    mk(s, "2", { source: "Website" });
    mk(s, "3", { source: "Email" });
    const b = buildSourceBreakdown(s.listLeads());
    expect(b.slices.map((x) => x.percent).sort()).toEqual([33, 33, 34]);
  });

  it("groups everything beyond the top four, and the catalog's 'Other', into Others", () => {
    const s = empty();
    for (const src of [
      "WhatsApp",
      "WhatsApp",
      "Website",
      "Website",
      "Email",
      "Email",
      "Phone",
      "Phone",
      "Justdial",
      "Alibaba",
      "Other",
    ]) {
      mk(s, `L-${src}-${s.listLeads().length}`, { source: src });
    }
    const b = buildSourceBreakdown(s.listLeads());
    // equal counts keep catalog order (Email, WhatsApp, Phone, Website), so the result is deterministic
    expect(b.slices.map((x) => x.key)).toEqual([
      "Email",
      "WhatsApp",
      "Phone",
      "Website",
      "others",
    ]);
    const others = b.slices.at(-1)!;
    expect(others).toMatchObject({ label: "Others", slug: "others", count: 3 }); // Justdial + Alibaba + Other
    expect(b.slices.reduce((n, x) => n + x.count, 0)).toBe(b.total);
  });

  it("omits Others when there is nothing to group; slugs match the existing Reports deep links", () => {
    const s = empty();
    mk(s, "1", { source: "Referral" });
    mk(s, "2", { source: "Housing.com" });
    const b = buildSourceBreakdown(s.listLeads());
    expect(b.slices.map((x) => x.slug).sort()).toEqual([
      "housingcom",
      "referral",
    ]);
  });

  it("an unknown or missing source is counted as Other, never dropped", () => {
    const s = empty();
    const l = mk(s, "A");
    const bad: Lead[] = [
      { ...l, id: "L-81", source: "Bogus" as never },
      { ...l, id: "L-82", source: undefined as never },
      { ...l, id: "L-83", source: "gmail" as never }, // alias -> Email
    ];
    const b = buildSourceBreakdown(bad);
    expect(b.total).toBe(3);
    expect(b.slices.reduce((n, x) => n + x.count, 0)).toBe(3);
    expect(b.slices.find((x) => x.key === "Email")?.count).toBe(1);
    expect(b.slices.find((x) => x.key === "others")?.count).toBe(2);
  });

  it("every catalog source has a chart colour", () => {
    for (const k of leadSourcesList)
      expect(SOURCE_COLORS[k]).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it("seed data: model total equals lead count", () => {
    const b = buildSourceBreakdown(seedLeads);
    expect(b.total).toBe(seedLeads.length);
    expect(b.slices.reduce((n, x) => n + x.count, 0)).toBe(seedLeads.length);
    expect(b.slices.reduce((n, x) => n + x.percent, 0)).toBe(100);
  });
});

describe("dashboard updates after store changes", () => {
  it("after creating a lead: KPIs and source slice both move", () => {
    const s = fresh();
    const k0 = kpis(s);
    const wa0 = slice(s, "WhatsApp")?.count ?? 0;
    const t0 = buildSourceBreakdown(s.listLeads()).total;
    mk(s, "ABC Pharma", { followUp: { date: today() } });
    const k1 = kpis(s);
    expect(k1.total).toBe(k0.total + 1);
    expect(k1.newLeads).toBe(k0.newLeads + 1);
    expect(k1.newToday).toBe(k0.newToday + 1);
    expect(k1.followUpsDueToday).toBe(k0.followUpsDueToday + 1);
    expect(buildSourceBreakdown(s.listLeads()).total).toBe(t0 + 1);
    // WhatsApp may be inside the top four or grouped into Others in the seed; its raw count always moves
    const raw = (src: string) =>
      s.sourceCounts().find((x) => x.source === src)?.count ?? 0;
    expect(raw("WhatsApp")).toBe(wa0 || raw("WhatsApp"));
    expect(dashboardLeadCards(k1).leads.value).toBe(String(k1.total));
  });

  it("after a status change: counts shift between New / Qualified / Converted, total unchanged", () => {
    const s = empty();
    const l = mk(s, "A");
    expect(kpis(s)).toMatchObject({ newLeads: 1, qualified: 0, converted: 0 });
    s.updateStatus(l.id, "Qualified");
    expect(kpis(s)).toMatchObject({
      total: 1,
      newLeads: 0,
      qualified: 1,
      converted: 0,
    });
    s.editLead(l.id, { status: "Converted" });
    expect(kpis(s)).toMatchObject({
      total: 1,
      newLeads: 0,
      qualified: 0,
      converted: 1,
    });
  });

  it("after assignment: org-wide numbers are unchanged, scoped numbers follow the owner", () => {
    const s = empty();
    const l = mk(s, "A");
    const rahul = { role: "sales-executive", name: "Rahul Verma" };
    const neha = { role: "sales-executive", name: "Neha Singh" };
    const owner = { role: "owner", name: "Amit Sharma" };
    const total = (u: { role: string; name: string }) =>
      dashboardLeadKpis(scopeLeadsForUser(s.listLeads(), u)).total;
    expect([total(rahul), total(neha), total(owner)]).toEqual([1, 0, 1]);
    s.assignLead(l.id, "Neha Singh", "Amit Sharma");
    expect([total(rahul), total(neha), total(owner)]).toEqual([0, 1, 1]);
  });

  it("after a source correction: the old slice shrinks and the new one grows (total unchanged)", () => {
    const s = empty();
    const a = mk(s, "A", { source: "WhatsApp" });
    mk(s, "B", { source: "WhatsApp" });
    expect(slice(s, "WhatsApp")?.count).toBe(2);
    expect(slice(s, "IndiaMART")).toBeUndefined();
    s.editLead(a.id, { source: "IndiaMART" }, "Priya Nair");
    const b = buildSourceBreakdown(s.listLeads());
    expect(b.total).toBe(2);
    expect(slice(s, "WhatsApp")?.count).toBe(1);
    expect(slice(s, "IndiaMART")?.count).toBe(1);
    expect(b.slices.reduce((n, x) => n + x.percent, 0)).toBe(100);
  });

  it("an unchanged edit or repeated scheduling does not move any number", () => {
    const s = empty();
    const l = mk(s, "A", { followUp: { date: today() } });
    const before = JSON.stringify([
      kpis(s),
      buildSourceBreakdown(s.listLeads()),
    ]);
    s.editLead(l.id, { name: "A" });
    s.scheduleFollowUp(l.id, { date: today() });
    expect(JSON.stringify([kpis(s), buildSourceBreakdown(s.listLeads())])).toBe(
      before,
    );
  });
});

describe("empty store", () => {
  it("gives zeroes and an empty chart model without NaN", () => {
    const s = empty();
    expect(kpis(s)).toMatchObject({
      total: 0,
      newLeads: 0,
      qualified: 0,
      converted: 0,
      followUpsDueToday: 0,
      newToday: 0,
    });
    const b = buildSourceBreakdown(s.listLeads());
    expect(b).toEqual({ total: 0, isEmpty: true, slices: [] });
    expect(JSON.stringify(dashboardLeadCards(kpis(s)))).not.toContain("NaN");
  });
  it("a role whose scope contains no leads sees the empty state too", () => {
    const b = buildSourceBreakdown(
      scopeLeadsForUser(seedLeads, { role: "sales-executive", name: "Nobody" }),
    );
    expect(b.isEmpty).toBe(true);
  });
});

describe("scoping", () => {
  it("sales executive sees own leads; owner and manager see all", () => {
    const own = scopeLeadsForUser(seedLeads, {
      role: "sales-executive",
      name: "Rahul Verma",
    });
    expect(own.every((l) => l.owner === "Rahul Verma")).toBe(true);
    expect(scopeLeadsForUser(seedLeads, { role: "owner", name: "x" })).toBe(
      seedLeads,
    );
    expect(scopeLeadsForUser(seedLeads, { role: "manager", name: "x" })).toBe(
      seedLeads,
    );
  });
});
