import { describe, expect, it } from "vitest";

import {
  createCrmStore,
  findDuplicateLeads,
  normalizePhone,
} from "../crm-store";
import {
  emptyLeadForm,
  isValidEmail,
  isValidPhone,
  toNewLeadInput,
  validateLeadForm,
  type LeadFormValues,
} from "../lead-form";
import { leadSourcesList } from "../lead-sources";
import { leads as seedLeads } from "../leads-data";

const NOW = new Date("2026-10-14T10:30:00");
const store = () => createCrmStore(undefined, () => NOW);
const valid = (o: Partial<LeadFormValues> = {}) =>
  emptyLeadForm({
    name: "ABC Pharma",
    source: "WhatsApp",
    owner: "Rahul Verma",
    ...o,
  });
const check = (v: LeadFormValues) => validateLeadForm(v, { now: NOW });

describe("required fields", () => {
  it("requires customer name and source", () => {
    const e = check(emptyLeadForm());
    expect(e.name).toBeTruthy();
    expect(e.source).toBeTruthy();
    expect(Object.keys(e).sort()).toEqual(["name", "source"]);
  });
  it("treats whitespace-only name as missing", () => {
    expect(check(valid({ name: "   " })).name).toBeTruthy();
  });
  it("accepts a form with only name and source (optionals blank)", () => {
    expect(check(valid({ owner: "" }))).toEqual({});
  });
});

describe("phone / email validation", () => {
  it.each([
    "9876543210",
    "98765 43210",
    "+91 98765 43210",
    "09876543210",
    "+1 415 555 0132",
    "(98765) 43210",
  ])("accepts phone %s", (p) => expect(isValidPhone(p)).toBe(true));
  it.each(["12345", "abcdefghij", "5876543210", "98765432", "+12"])(
    "rejects phone %s",
    (p) => expect(isValidPhone(p)).toBe(false),
  );
  it("blank phone/email are fine; bad ones give field errors", () => {
    expect(isValidPhone("")).toBe(true);
    expect(isValidEmail("")).toBe(true);
    expect(isValidEmail("a@b.co")).toBe(true);
    const e = check(valid({ mobile: "123", whatsapp: "x", email: "nope" }));
    expect(e.mobile).toBeTruthy();
    expect(e.whatsapp).toBeTruthy();
    expect(e.email).toBeTruthy();
  });
  it("rejects past follow-up dates and time without date", () => {
    expect(
      check(valid({ followUpDate: "2026-10-13" })).followUpDate,
    ).toBeTruthy();
    expect(
      check(valid({ followUpDate: "2026-10-14" })).followUpDate,
    ).toBeUndefined();
    expect(check(valid({ followUpTime: "10:00" })).followUpDate).toBeTruthy();
  });
});

describe("every supported lead source", () => {
  it.each(leadSourcesList)(
    "%s validates and is stored unchanged (captureMethod manual)",
    (source) => {
      const v = valid({ source });
      expect(check(v)).toEqual({});
      const s = store();
      const lead = s.createLead(toNewLeadInput(v));
      expect(lead.source).toBe(source);
      expect(lead.captureMethod).toBe("manual");
    },
  );
  it("includes all 15 required sources", () => {
    expect(leadSourcesList).toEqual(
      expect.arrayContaining([
        "IndiaMART",
        "TradeIndia",
        "ExportersIndia",
        "Alibaba",
        "Email",
        "WhatsApp",
        "Phone",
        "Website",
        "Meta",
        "Google",
        "Justdial",
        "99acres",
        "Housing.com",
        "Referral",
        "Other",
      ]),
    );
  });
  it("rejects an unknown source", () => {
    expect(check(valid({ source: "Bogus" as never })).source).toBeTruthy();
  });
});

describe("source / capture-method separation", () => {
  it("IndiaMART entered manually is source=IndiaMART, captureMethod=manual", () => {
    const l = store().createLead(
      toNewLeadInput(valid({ source: "IndiaMART" })),
    );
    expect([l.source, l.captureMethod]).toEqual(["IndiaMART", "manual"]);
  });
  it("manual form refuses api/webhook/email_parser/csv_import capture methods", () => {
    for (const m of ["api", "webhook", "email_parser", "csv_import"] as const) {
      expect(check(valid({ captureMethod: m })).captureMethod).toBeTruthy();
    }
  });
  it("a future import flow can opt in to csv_import and keeps the original source", () => {
    const v = valid({ source: "IndiaMART", captureMethod: "csv_import" });
    expect(
      validateLeadForm(v, {
        now: NOW,
        allowedCaptureMethods: ["manual", "csv_import"],
      }),
    ).toEqual({});
    const l = store().createLead(toNewLeadInput(v));
    expect([l.source, l.captureMethod]).toEqual(["IndiaMART", "csv_import"]);
  });
});

describe("successful creation", () => {
  const full = valid({
    contactPerson: "Anil",
    company: "ABC Pharma Pvt Ltd",
    mobile: "98765 43210",
    email: "Anil@ABC.com",
    productInterest: "Syrups",
    requirement: "Need 500 units",
    priority: "High",
    rating: "4",
    followUpDate: "2026-10-16",
    followUpTime: "15:30",
    followUpType: "WhatsApp",
    followUpNote: "Send catalogue",
  });
  it("creates a record with mapped fields, activity, follow-up task and owner notification", () => {
    const s = store();
    const before = s.listLeads().length;
    const nBefore = s.getState().notifications.length;
    const l = s.createLead(toNewLeadInput(full));
    expect(s.listLeads()).toHaveLength(before + 1);
    expect(s.listLeads()[0]).toBe(l);
    expect(l).toMatchObject({
      name: "ABC Pharma",
      company: "ABC Pharma Pvt Ltd",
      contactPerson: "Anil",
      mobile: "98765 43210",
      productInterest: "Syrups",
      requirement: "Need 500 units",
      priority: "High",
      rating: 4,
      status: "New",
      owner: "Rahul Verma",
      nextFollowUp: "16 Oct 2026",
      nextFollowUpTime: "03:30 PM",
    });
    expect(l.tasks[0]).toMatchObject({
      title: "Send catalogue",
      status: "Pending",
      assignedTo: "Rahul Verma",
    });
    expect(l.activity.map((a) => a.type)).toEqual([
      "followup-created",
      "created",
    ]);
    expect(l.activity[1]?.description).toBe("Lead created from WhatsApp");
    const n = s.getState().notifications;
    expect(n).toHaveLength(nBefore + 1);
    expect(n[0]).toMatchObject({
      kind: "lead_created",
      recipient: "Rahul Verma",
      leadId: l.id,
    });
  });
  it("omits blank optionals instead of storing empty strings", () => {
    const input = toNewLeadInput(valid());
    expect(input).not.toHaveProperty("mobile");
    expect(input).not.toHaveProperty("followUp");
    expect(store().createLead(input).nextFollowUp).toBeNull();
  });
});

describe("duplicate warning", () => {
  it("normalizes phones across formats", () => {
    expect(normalizePhone("+91 98765-43210")).toBe("9876543210");
    expect(normalizePhone("12345")).toBe("");
  });
  it("finds duplicates by phone and by email, never by blank values", () => {
    const s = store();
    const a = s.createLead(
      toNewLeadInput(valid({ mobile: "98765 43210", email: "x@y.com" })),
    );
    expect(s.findDuplicates({ mobile: "+91 9876543210" })).toEqual([
      { lead: a, reasons: ["phone"] },
    ]);
    expect(s.findDuplicates({ email: " X@Y.com " })[0]?.reasons).toEqual([
      "email",
    ]);
    expect(s.findDuplicates({ mobile: "", email: "" })).toEqual([]);
    expect(
      s.findDuplicates({ mobile: "9000000001", email: "other@y.com" }),
    ).toEqual([]);
  });
  it("matches seed records too, and warning does not block or merge", () => {
    const seed = seedLeads[0]!;
    const s = store();
    expect(
      findDuplicateLeads(s.listLeads(), { mobile: seed.mobile })[0]?.lead.id,
    ).toBe(seed.id);
    const before = s.listLeads().length;
    s.createLead(toNewLeadInput(valid({ mobile: seed.mobile }))); // "Create anyway"
    expect(s.listLeads()).toHaveLength(before + 1);
    expect(s.getLead(seed.id)).toBe(seed); // existing record untouched
  });
});

describe("validation failure keeps user input", () => {
  it("validate never mutates the values, and the store is untouched", () => {
    const s = store();
    const v = valid({
      name: "",
      mobile: "bad",
      requirement: "long message",
      followUpNote: "note",
    });
    const snapshot = structuredClone(v);
    const before = s.listLeads().length;
    expect(Object.keys(check(v)).length).toBeGreaterThan(0);
    expect(v).toEqual(snapshot);
    expect(s.listLeads()).toHaveLength(before);
  });
});

describe("no accidental source changes", () => {
  it("later activities, status, owner and field edits keep source and captureMethod", () => {
    const s = store();
    const l = s.createLead(toNewLeadInput(valid({ source: "IndiaMART" })));
    s.linkActivity(l.id, {
      type: "call",
      description: "Called",
      user: "Rahul Verma",
    });
    s.linkActivity(l.id, {
      type: "email",
      description: "Mailed",
      user: "Rahul Verma",
    });
    s.linkActivity(l.id, {
      type: "whatsapp",
      description: "Chatted",
      user: "Rahul Verma",
    });
    s.updateStatus(l.id, "Contacted");
    s.assignLead(l.id, "Neha Singh");
    s.updateLead(l.id, { source: "Phone", captureMethod: "api", city: "Pune" });
    const u = s.getLead(l.id)!;
    expect([u.source, u.captureMethod, u.city]).toEqual([
      "IndiaMART",
      "manual",
      "Pune",
    ]);
  });
});
