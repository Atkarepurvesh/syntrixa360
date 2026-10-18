import { describe, expect, it } from "vitest";

import { computeLeadKpis, createCrmStore, type CrmStore } from "../crm-store";
import {
  duplicateGate,
  displayDateToIso,
  displayTimeToInput,
  emptyLeadForm,
  leadToFormValues,
  toLeadEditInput,
  toNewLeadInput,
  validateFollowUp,
  validateLeadForm,
} from "../lead-form";
import {
  emptyLeadFilters,
  filterLeads,
  followUpState,
  matchesQuery,
  paginate,
  parseDisplayDate,
  queryLeads,
  sortLeads,
  type LeadFilters,
} from "../lead-query";
import { leads as seedLeads, type Lead } from "../leads-data";

// Tests compare against the real local date ("today"), so the fixed clock starts from it.
const NOW = new Date();
NOW.setHours(10, 30, 0, 0);
const isoDay = (d: Date, offset = 0) => {
  const x = new Date(d);
  x.setDate(x.getDate() + offset);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};
let t = NOW.getTime();
const store = (): CrmStore =>
  createCrmStore(undefined, () => new Date((t += 1000)));
const F = (p: Partial<LeadFilters> = {}): LeadFilters => ({
  ...emptyLeadFilters(),
  ...p,
});
const mk = (s: CrmStore, name: string, extra: Record<string, unknown> = {}) =>
  s.createLead({ name, source: "WhatsApp", owner: "Rahul Verma", ...extra });

describe("search", () => {
  it("matches name, company, phone (any format), email and id", () => {
    const s = store();
    const l = mk(s, "Zephyr Traders", {
      company: "Zephyr Pvt",
      mobile: "98765 43210",
      email: "Buy@Zephyr.com",
    });
    const ids = (q: string) =>
      filterLeads(s.listLeads(), F({ query: q }), { now: NOW }).map(
        (x) => x.id,
      );
    expect(ids("zephyr tra")).toEqual([l.id]);
    expect(ids("zephyr pvt")).toEqual([l.id]);
    expect(ids("+91 98765-43210")).toEqual([l.id]);
    expect(ids("9876543")).toEqual([l.id]);
    expect(ids("buy@zephyr")).toEqual([l.id]);
    expect(ids(l.id.toLowerCase())).toEqual([l.id]);
    expect(ids("")).toHaveLength(s.listLeads().length);
    expect(ids("no-such-customer")).toEqual([]);
    expect(matchesQuery(l, "   ")).toBe(true);
  });
});

describe("filters", () => {
  const s = createCrmStore(
    { leads: [], notifications: [] },
    () => new Date((t += 1000)),
  );
  const a = mk(s, "A", { priority: "High", mobile: "9000000001" });
  const b = s.createLead({
    name: "B",
    source: "IndiaMART",
    priority: "Low",
    status: "Qualified",
    owner: "Neha Singh",
  });
  const c = s.createLead({ name: "C", source: "Phone" }); // unassigned, no priority
  const all = s.listLeads();
  const run = (p: Partial<LeadFilters>) =>
    filterLeads(all, F(p), {
      now: new Date(),
      currentUserName: "Rahul Verma",
    }).map((x) => x.id);

  it("filters by source, status, priority and owner (incl. unassigned)", () => {
    expect(run({ source: "IndiaMART" })).toEqual([b.id]);
    expect(run({ status: "Qualified" })).toEqual([b.id]);
    expect(run({ tab: "Qualified" })).toEqual([b.id]);
    expect(run({ priority: "High" })).toEqual([a.id]);
    expect(run({ owner: "Neha Singh" })).toEqual([b.id]);
    expect(run({ owner: "unassigned" })).toEqual([c.id]);
  });
  it("combines filters (AND)", () => {
    expect(run({ source: "WhatsApp", priority: "High" })).toEqual([a.id]);
    expect(run({ source: "IndiaMART", priority: "High" })).toEqual([]);
  });
  it("follow-up state uses real dates", () => {
    const d = (n: number) => {
      const x = new Date(NOW);
      x.setDate(x.getDate() + n);
      return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
    };
    expect(parseDisplayDate("25 May 2025")?.getFullYear()).toBe(2025);
    expect(parseDisplayDate("nonsense")).toBeNull();
    const s2 = store();
    const today = mk(s2, "T", { followUp: { date: d(0) } });
    const later = mk(s2, "L", { followUp: { date: d(3) } });
    const none = mk(s2, "N");
    const clock = new Date();
    expect(followUpState(today, clock)).toBe("today");
    expect(followUpState(later, clock)).toBe("upcoming");
    expect(followUpState(none, clock)).toBe("none");
    expect(followUpState({ nextFollowUp: "01 Jan 2020" }, clock)).toBe(
      "overdue",
    );
  });
  it("Leads Today uses the current local date (not a hardcoded one)", () => {
    const todays = filterLeads(all, F({ quick: "leads-today" }), {
      now: new Date(),
    });
    expect(todays.map((x) => x.id).sort()).toEqual([a.id, b.id, c.id].sort());
    // the seed records are from May 2025, so none are "today"
    expect(
      filterLeads(seedLeads, F({ quick: "leads-today" }), { now: new Date() }),
    ).toHaveLength(0);
    // and a different "today" gives a different answer
    expect(
      filterLeads(all, F({ quick: "leads-today" }), {
        now: new Date("2031-01-01"),
      }),
    ).toHaveLength(0);
  });
  it("hot leads / score range never include unscored leads", () => {
    expect(run({ quick: "hot-leads" })).toEqual([]);
    expect(run({ scoreMin: "0" })).toEqual([]);
  });
});

describe("sorting", () => {
  it("sorts by created, updated, score and priority; unscored/unprioritised last", () => {
    const s = store();
    const lo = mk(s, "Lo", { priority: "Low" });
    const hi = mk(s, "Hi", { priority: "High" });
    const none = mk(s, "None");
    const mid = mk(s, "Mid", { priority: "Medium" });
    const rows = [lo, hi, none, mid].map((x) => s.getLead(x.id)!);
    expect(sortLeads(rows, "created_desc").map((x) => x.name)).toEqual([
      "Mid",
      "None",
      "Hi",
      "Lo",
    ]);
    expect(sortLeads(rows, "created_asc").map((x) => x.name)).toEqual([
      "Lo",
      "Hi",
      "None",
      "Mid",
    ]);
    expect(sortLeads(rows, "priority_desc").map((x) => x.name)).toEqual([
      "Hi",
      "Mid",
      "Lo",
      "None",
    ]);
    s.updateLead(lo.id, { city: "Pune" });
    expect(
      sortLeads(
        s.listLeads().filter((x) => rows.some((r) => r.id === x.id)),
        "updated_desc",
      )[0]!.name,
    ).toBe("Lo");
    const scored: Lead[] = [
      { ...rows[0]!, score: 40 },
      { ...rows[1]!, score: 90 },
      { ...rows[2]!, score: null },
    ];
    expect(sortLeads(scored, "score_desc").map((x) => x.score)).toEqual([
      90,
      40,
      null,
    ]);
  });
  it("does not mutate its input", () => {
    const copy = [...seedLeads];
    sortLeads(seedLeads, "score_desc");
    expect(seedLeads).toEqual(copy);
  });
});

describe("pagination and one-dataset consistency", () => {
  it("computes ranges and clamps pages", () => {
    const rows = Array.from({ length: 23 }, (_, i) => i);
    expect(paginate(rows, 1, 10)).toMatchObject({
      totalPages: 3,
      rangeStart: 1,
      rangeEnd: 10,
      total: 23,
    });
    expect(paginate(rows, 3, 10)).toMatchObject({
      rangeStart: 21,
      rangeEnd: 23,
    });
    expect(paginate(rows, 99, 10).page).toBe(3);
    expect(paginate([], 1, 10)).toMatchObject({
      page: 1,
      totalPages: 1,
      rangeStart: 0,
      rangeEnd: 0,
      total: 0,
    });
  });
  it("search + filter + sort + pages all derive from the same filtered set", () => {
    const f = F({ source: "WhatsApp" });
    const sorted = queryLeads(seedLeads, f, "score_desc", { now: NOW });
    const p1 = paginate(sorted, 1, 5);
    expect(sorted.every((l) => l.source === "WhatsApp")).toBe(true);
    expect(p1.total).toBe(sorted.length);
    expect(p1.rows).toEqual(sorted.slice(0, 5));
  });
});

describe("opening the right lead / latest state", () => {
  it("getLead(id) returns the latest record after edits (drawer never shows a stale copy)", () => {
    const s = store();
    const a = mk(s, "A");
    const b = mk(s, "B");
    expect(s.getLead(a.id)!.name).toBe("A");
    s.editLead(a.id, { name: "A renamed", city: "Surat" });
    expect(s.getLead(a.id)).toMatchObject({ name: "A renamed", city: "Surat" });
    expect(s.getLead(a.id)).not.toBe(a);
    expect(s.getLead(b.id)).toBe(b); // other leads untouched (same reference)
    expect(s.getLead("L-0")).toBeUndefined();
  });
});

describe("editing a lead", () => {
  const base = (s: CrmStore) =>
    mk(s, "Edit Me", {
      company: "Co",
      mobile: "9876543210",
      email: "a@b.com",
      priority: "Medium",
      followUp: {
        date: "2026-10-20",
        time: "10:00",
        type: "Call",
        note: "Call back",
      },
    });

  it("preserves id, createdAt and captureMethod; updates updatedAt; keeps history", () => {
    const s = store();
    const l = base(s);
    const before = l.activity.length;
    const res = s.editLead(
      l.id,
      { company: "New Co", city: "Pune" },
      "Priya Nair",
    )!;
    expect(res.changed).toBe(true);
    expect(res.lead).toMatchObject({
      id: l.id,
      createdAt: l.createdAt,
      createdOn: l.createdOn,
      captureMethod: "manual",
    });
    expect(new Date(res.lead.updatedAt).getTime()).toBeGreaterThan(
      new Date(l.updatedAt).getTime(),
    );
    expect(res.lead.activity).toHaveLength(before + 1);
    expect(res.lead.activity[0]).toMatchObject({
      type: "updated",
      user: "Priya Nair",
    });
    expect(res.lead.activity[0]!.description).toContain("Company");
    expect(res.lead.activity.slice(1)).toEqual(l.activity); // earlier history untouched
    expect(res.lead.notes).toEqual(l.notes);
  });
  it("records status and owner changes as their own events", () => {
    const s = store();
    const l = base(s);
    const r = s.editLead(
      l.id,
      { status: "Qualified", owner: "Neha Singh" },
      "Priya Nair",
    )!;
    const types = r.lead.activity.slice(0, 2).map((a) => a.type);
    expect(types).toEqual(
      expect.arrayContaining(["status-changed", "owner-changed"]),
    );
    expect(
      r.lead.activity.find((a) => a.type === "owner-changed")!.description,
    ).toBe("Reassigned from Rahul Verma to Neha Singh by Priya Nair");
  });
  it("source edits are an audited correction; captureMethod cannot be edited", () => {
    const s = store();
    const l = base(s);
    const r = s.editLead(l.id, { source: "IndiaMART" })!;
    expect(r.lead.source).toBe("IndiaMART");
    expect(r.lead.captureMethod).toBe("manual");
    expect(r.lead.activity[0]!.description).toBe(
      "Lead source corrected from WhatsApp to IndiaMART",
    );
    expect(s.updateLead(l.id, { captureMethod: "api" })!.captureMethod).toBe(
      "manual",
    );
  });
  it("rejects a blank name and unknown owners without changing anything", () => {
    const s = store();
    const l = base(s);
    expect(() => s.editLead(l.id, { name: "  " })).toThrow();
    expect(() => s.editLead(l.id, { owner: "Ghost Person" })).toThrow(
      /not an available team member/,
    );
    expect(s.getLead(l.id)).toBe(l);
  });
  it("rapid double submit: second identical edit is a no-op (no extra history)", () => {
    const s = store();
    const l = base(s);
    const first = s.editLead(l.id, { company: "Twice", status: "Contacted" })!;
    const second = s.editLead(l.id, { company: "Twice", status: "Contacted" })!;
    expect(first.changed).toBe(true);
    expect(second.changed).toBe(false);
    expect(s.getLead(l.id)!.activity).toHaveLength(first.lead.activity.length);
    expect(s.getLead(l.id)!.updatedAt).toBe(first.lead.updatedAt);
  });
  it("form <-> lead round trip: untouched form produces no changes", () => {
    const s = store();
    const l = base(s);
    const v = leadToFormValues(l);
    expect(v).toMatchObject({
      name: "Edit Me",
      company: "Co",
      source: "WhatsApp",
      captureMethod: "manual",
      owner: "Rahul Verma",
      followUpDate: "2026-10-20",
      followUpTime: "10:00",
    });
    const res = s.editLead(l.id, toLeadEditInput(v, l))!;
    expect(res.changed).toBe(false);
  });
  it("edit validation reuses the create rules (and allows an unchanged past follow-up)", () => {
    const s = store();
    const l = base(s);
    const v = leadToFormValues(l);
    expect(
      validateLeadForm(
        { ...v, name: "" },
        { now: NOW, allowedCaptureMethods: ["manual"] },
      ).name,
    ).toBeTruthy();
    expect(
      validateLeadForm(
        { ...v, email: "bad" },
        { now: NOW, allowedCaptureMethods: ["manual"] },
      ).email,
    ).toBeTruthy();
    const past = { ...v, followUpDate: "2020-01-01" };
    expect(
      validateLeadForm(past, { now: NOW, allowedCaptureMethods: ["manual"] })
        .followUpDate,
    ).toBeTruthy();
    expect(
      validateLeadForm(past, {
        now: NOW,
        allowedCaptureMethods: ["manual"],
        originalFollowUpDate: "2020-01-01",
      }).followUpDate,
    ).toBeUndefined();
  });
  it("display <-> input date/time helpers", () => {
    expect(displayDateToIso("05 Oct 2026")).toBe("2026-10-05");
    expect(displayDateToIso(null)).toBe("");
    expect(displayTimeToInput("03:30 PM")).toBe("15:30");
    expect(displayTimeToInput("12:05 AM")).toBe("00:05");
    expect(displayTimeToInput(undefined)).toBe("");
  });
});

describe("duplicate warning in edit/create", () => {
  it("warns on other leads, never on the lead being edited, and dismissal opens the gate", () => {
    const s = store();
    const a = mk(s, "A", { mobile: "9876543210", email: "x@y.com" });
    const b = mk(s, "B", { mobile: "9123456789" });
    const probe = { mobile: "+91 98765 43210", whatsapp: "", email: "" };
    const g1 = duplicateGate(s.listLeads(), probe, { excludeId: b.id });
    expect(g1.blocked).toBe(true);
    expect(g1.matches.map((m) => m.lead.id)).toEqual([a.id]);
    expect(
      duplicateGate(s.listLeads(), probe, { excludeId: a.id }).blocked,
    ).toBe(false);
    // dismiss = remember the key; same values pass, changed values re-arm
    expect(
      duplicateGate(s.listLeads(), probe, { excludeId: b.id, ackedKey: g1.key })
        .blocked,
    ).toBe(false);
    expect(
      duplicateGate(
        s.listLeads(),
        { ...probe, email: "x@y.com" },
        { excludeId: b.id, ackedKey: g1.key },
      ).blocked,
    ).toBe(true);
    // nothing merged
    expect(
      s.listLeads().filter((l) => l.id === a.id || l.id === b.id),
    ).toHaveLength(2);
  });
});

describe("assignment", () => {
  it("assigns an unassigned lead, then reassigns; records previous/new owner, actor and time", () => {
    const s = store();
    const l = s.createLead({ name: "U", source: "Phone" });
    expect(l.owner).toBe("");
    expect(s.getState().notifications[0]).toMatchObject({
      title: "New unassigned lead",
      kind: "lead_created",
    });
    const a = s.assignLead(l.id, "Neha Singh", "Priya Nair")!;
    expect(a.owner).toBe("Neha Singh");
    expect(a.activity[0]).toMatchObject({
      type: "owner-changed",
      description: "Assigned to Neha Singh by Priya Nair",
      user: "Priya Nair",
    });
    expect(a.activity[0]!.date).toBeTruthy();
    const b = s.assignLead(l.id, "Arjun Mehta", "Priya Nair")!;
    expect(b.activity[0]!.description).toBe(
      "Reassigned from Neha Singh to Arjun Mehta by Priya Nair",
    );
    const n = s.getState().notifications;
    expect(
      n.filter(
        (x) => x.recipient === "Arjun Mehta" && x.kind === "lead_assigned",
      ),
    ).toHaveLength(1);
    expect(
      n.some(
        (x) => x.recipient === "Neha Singh" && x.title === "Lead reassigned",
      ),
    ).toBe(true);
  });
  it("rejects people who are not on the team and blank owners; same owner is a no-op", () => {
    const s = store();
    const l = mk(s, "A");
    expect(() => s.assignLead(l.id, "Made Up")).toThrow();
    expect(() => s.assignLead(l.id, "")).toThrow();
    const n = s.getState().notifications.length;
    expect(s.assignLead(l.id, "Rahul Verma")).toBe(l);
    expect(s.getState().notifications).toHaveLength(n);
  });
  it("assignable members come from the existing team roster", () => {
    expect(store().members()).toEqual([
      "Rahul Verma",
      "Neha Singh",
      "Arjun Mehta",
      "Pooja Patel",
      "Sandeep Yadav",
    ]);
  });
  it("bulk assign reports changed / unchanged / missing and is repeat-safe", () => {
    const s = store();
    const a = mk(s, "A");
    const b = s.createLead({ name: "B", source: "Phone" });
    const r1 = s.assignLeads(
      [a.id, b.id, "L-0", a.id],
      "Neha Singh",
      "Priya Nair",
    );
    expect(r1).toEqual({ assigned: 2, unchanged: 0, missing: 1 });
    expect(s.assignLeads([a.id, b.id], "Neha Singh")).toEqual({
      assigned: 0,
      unchanged: 2,
      missing: 0,
    });
  });
});

describe("follow-ups, tasks and timeline", () => {
  it("scheduling twice with the same slot adds neither a second task nor a second event", () => {
    const s = store();
    const l = mk(s, "A");
    const fu = {
      date: "2026-10-20",
      time: "11:00",
      type: "Call",
      note: "Ring them",
    };
    expect(s.scheduleFollowUp(l.id, fu)!.changed).toBe(true);
    expect(s.scheduleFollowUp(l.id, fu)!.changed).toBe(false);
    const cur = s.getLead(l.id)!;
    expect(cur.tasks.filter((x) => x.kind === "follow-up")).toHaveLength(1);
    expect(
      cur.activity.filter((x) => x.type === "followup-created"),
    ).toHaveLength(1);
    expect(cur.nextFollowUp).toBe("20 Oct 2026");
    expect(cur.nextFollowUpTime).toBe("11:00 AM");
  });
  it("rescheduling updates the same pending task and keeps history", () => {
    const s = store();
    const l = mk(s, "A", { followUp: { date: "2026-10-20" } });
    const r = s.scheduleFollowUp(l.id, {
      date: "2026-10-25",
      note: "New plan",
    })!;
    expect(r.changed).toBe(true);
    const tasks = r.lead.tasks.filter((x) => x.kind === "follow-up");
    expect(tasks).toHaveLength(1);
    expect(tasks[0]).toMatchObject({
      due: "25 Oct 2026",
      title: "New plan",
      status: "Pending",
    });
    expect(r.lead.activity[0]!.description).toBe(
      "Follow-up rescheduled from 20 Oct 2026 to 25 Oct 2026",
    );
    expect(
      r.lead.activity.some(
        (a) => a.description === "Follow-up scheduled for 20 Oct 2026",
      ),
    ).toBe(true);
  });
  it("editing the follow-up date through editLead does not duplicate tasks either", () => {
    const s = store();
    const l = mk(s, "A", { followUp: { date: "2026-10-20" } });
    s.editLead(l.id, { followUp: { date: "2026-10-22" } });
    s.editLead(l.id, { followUp: { date: "2026-10-22" } });
    expect(
      s.getLead(l.id)!.tasks.filter((x) => x.kind === "follow-up"),
    ).toHaveLength(1);
  });
  it("follow-up validation", () => {
    expect(validateFollowUp("", NOW)).toBeTruthy();
    expect(validateFollowUp(isoDay(NOW, -1), NOW)).toBeTruthy();
    expect(validateFollowUp(isoDay(NOW), NOW)).toBe("");
  });
  it("notes: added once, timeline entry written, repeat click ignored, blank rejected", () => {
    const s = store();
    const l = mk(s, "A");
    expect(() => s.addNote(l.id, "   ")).toThrow();
    const r1 = s.addNote(l.id, "Wants samples", "Priya Nair")!;
    const r2 = s.addNote(l.id, "Wants samples", "Priya Nair")!;
    expect(r1.changed).toBe(true);
    expect(r2.changed).toBe(false);
    const cur = s.getLead(l.id)!;
    expect(cur.notes).toHaveLength(1);
    expect(cur.notes[0]).toMatchObject({
      text: "Wants samples",
      by: "Priya Nair",
    });
    expect(cur.activity[0]).toMatchObject({ type: "note", user: "Priya Nair" });
  });
});

describe("KPIs recalculate from the same store", () => {
  it("total / new / qualified / converted / due today follow create, edit and status changes", () => {
    const s = store();
    const k0 = s.kpis(new Date());
    const today = new Date();
    const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const l = mk(s, "K", { followUp: { date: iso } });
    let k = computeLeadKpis(s.listLeads(), new Date());
    expect(k.total).toBe(k0.total + 1);
    expect(k.newLeads).toBe(k0.newLeads + 1);
    expect(k.followUpsDueToday).toBe(k0.followUpsDueToday + 1);
    s.updateStatus(l.id, "Qualified");
    k = computeLeadKpis(s.listLeads(), new Date());
    expect(k.newLeads).toBe(k0.newLeads);
    expect(k.qualified).toBe(k0.qualified + 1);
    s.editLead(l.id, { status: "Converted" });
    k = computeLeadKpis(s.listLeads(), new Date());
    expect(k.qualified).toBe(k0.qualified);
    expect(k.converted).toBe(k0.converted + 1);
    s.scheduleFollowUp(l.id, { date: "2099-01-01" });
    expect(computeLeadKpis(s.listLeads(), new Date()).followUpsDueToday).toBe(
      k0.followUpsDueToday,
    );
  });
  it("seed data: stored statuses add up to the total", () => {
    const k = computeLeadKpis(seedLeads, NOW);
    expect(Object.values(k.byStatus).reduce((a, b) => a + (b ?? 0), 0)).toBe(
      k.total,
    );
    expect(k.total).toBe(seedLeads.length);
  });
});

describe("empty and missing optional data", () => {
  it("a minimal lead is valid, unscored, and has no invented data", () => {
    const s = store();
    const l = s.createLead(
      toNewLeadInput(emptyLeadForm({ name: "Bare", source: "Other" })),
    );
    expect(l.score).toBeNull();
    expect(l.priority).toBe("Medium");
    expect(l).toMatchObject({
      notes: [],
      tasks: [],
      files: [],
      deals: [],
      nextFollowUp: null,
      owner: "",
    });
    expect(l.ai.summary).toEqual([]);
    expect(l.productInterest).toBeUndefined();
    expect(leadToFormValues(l).productInterest).toBe("");
    expect(
      s.editLead(l.id, toLeadEditInput(leadToFormValues(l), l))!.changed,
    ).toBe(false);
  });
  it("empty stores and empty filter results are handled", () => {
    const s = createCrmStore({ leads: [], notifications: [] }, () => NOW);
    expect(s.kpis(NOW)).toMatchObject({
      total: 0,
      newLeads: 0,
      followUpsDueToday: 0,
    });
    expect(queryLeads([], F({ query: "x" }), "created_desc")).toEqual([]);
    expect(paginate([], 1, 10).total).toBe(0);
    expect(s.createLead({ name: "First", source: "Phone" }).id).toBe("L-1");
  });
  it("unknown lead ids return undefined instead of throwing", () => {
    const s = store();
    expect(s.editLead("nope", { name: "x" })).toBeUndefined();
    expect(s.assignLead("nope", "Neha Singh")).toBeUndefined();
    expect(s.scheduleFollowUp("nope", { date: "2030-01-01" })).toBeUndefined();
    expect(s.addNote("nope", "x")).toBeUndefined();
  });
});
