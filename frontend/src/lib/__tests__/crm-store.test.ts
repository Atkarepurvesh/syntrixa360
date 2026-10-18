import { describe, expect, it } from "vitest";

import { computeLeadKpis, createCrmStore } from "../crm-store";
import {
  leadSourceLabel,
  leadSourcesList,
  normalizeLeadSource,
} from "../lead-sources";
import { leads as seedLeads } from "../leads-data";

const NOW = new Date("2026-10-14T10:30:00");
const fresh = () => createCrmStore(undefined, () => NOW);

describe("source catalog", () => {
  it("has the 15 canonical sources with no duplicates", () => {
    expect(leadSourcesList).toHaveLength(15);
    expect(new Set(leadSourcesList).size).toBe(15);
    expect(leadSourcesList).toEqual(
      expect.arrayContaining([
        "ExportersIndia",
        "Alibaba",
        "Justdial",
        "99acres",
        "Housing.com",
        "Other",
      ]),
    );
  });
  it("normalizes legacy and alternate spellings without creating new values", () => {
    expect(normalizeLeadSource("Gmail")).toBe("Email");
    expect(normalizeLeadSource("Phone Call")).toBe("Phone");
    expect(normalizeLeadSource("indiamart")).toBe("IndiaMART");
    expect(normalizeLeadSource("Facebook/Instagram/Meta")).toBe("Meta");
    expect(normalizeLeadSource("Manual")).toBe("Other");
    expect(normalizeLeadSource("???")).toBe("Other");
    expect(leadSourceLabel("Phone")).toBe("Phone Call");
  });
});

describe("seed data", () => {
  it("keeps the sample records, all with canonical source + captureMethod", () => {
    expect(seedLeads).toHaveLength(35);
    for (const l of seedLeads) {
      expect(leadSourcesList).toContain(l.source);
      expect(l.captureMethod).toBeTruthy();
      expect(Number.isNaN(new Date(l.createdAt).getTime())).toBe(false);
    }
  });
});

describe("createLead", () => {
  it("stores source and captureMethod independently", () => {
    const s = fresh();
    const a = s.createLead({
      name: "ABC Pharma",
      source: "WhatsApp",
      owner: "Rahul Verma",
    });
    expect(a.source).toBe("WhatsApp");
    expect(a.captureMethod).toBe("manual");
    const b = s.createLead({
      name: "XYZ",
      source: "IndiaMART",
      captureMethod: "api",
    });
    expect(b.source).toBe("IndiaMART");
    expect(b.captureMethod).toBe("api");
  });
  it("adds to the collection, writes a created activity and notifies the owner", () => {
    const s = fresh();
    const before = s.listLeads().length;
    const nBefore = s.getState().notifications.length;
    const l = s.createLead({
      name: "ABC Pharma",
      source: "WhatsApp",
      owner: "Rahul Verma",
    });
    expect(s.listLeads()).toHaveLength(before + 1);
    expect(s.getLead(l.id)).toBe(l);
    expect(l.status).toBe("New");
    expect(l.activity[0]).toMatchObject({
      type: "created",
      description: "Lead created from WhatsApp",
    });
    const n = s.getState().notifications;
    expect(n).toHaveLength(nBefore + 1);
    expect(n[0]).toMatchObject({
      kind: "lead_created",
      recipient: "Rahul Verma",
      leadId: l.id,
      read: false,
    });
  });
  it("generates unique ids and rejects blank names", () => {
    const s = fresh();
    const a = s.createLead({ name: "A", source: "Phone" });
    const b = s.createLead({ name: "B", source: "Phone" });
    expect(a.id).not.toBe(b.id);
    expect(new Set(s.listLeads().map((x) => x.id)).size).toBe(
      s.listLeads().length,
    );
    expect(() => s.createLead({ name: "  ", source: "Phone" })).toThrow();
  });
  it("normalizes unknown source input", () => {
    expect(fresh().createLead({ name: "A", source: "Gmail" }).source).toBe(
      "Email",
    );
  });
});

describe("updates and source attribution", () => {
  it("updateLead edits fields but protects source/captureMethod/id", () => {
    const s = fresh();
    const l = s.createLead({
      name: "A",
      source: "IndiaMART",
      captureMethod: "api",
    });
    const u = s.updateLead(l.id, {
      city: "Pune",
      source: "Phone",
      captureMethod: "manual",
      id: "L-1",
    })!;
    expect(u.city).toBe("Pune");
    expect(u.source).toBe("IndiaMART");
    expect(u.captureMethod).toBe("api");
    expect(u.id).toBe(l.id);
  });
  it("assignLead changes owner, logs activity and notifies the new owner", () => {
    const s = fresh();
    const l = s.createLead({
      name: "A",
      source: "Phone",
      owner: "Rahul Verma",
    });
    const u = s.assignLead(l.id, "Neha Singh")!;
    expect(u.owner).toBe("Neha Singh");
    expect(u.activity[0]?.type).toBe("owner-changed");
    const n = s.getState().notifications;
    expect(n.find((x) => x.recipient === "Neha Singh")).toMatchObject({
      kind: "lead_assigned",
      leadId: l.id,
    });
    // the previous owner is told the lead moved away
    expect(
      n.find(
        (x) => x.recipient === "Rahul Verma" && x.title === "Lead reassigned",
      ),
    ).toBeTruthy();
  });
  it("assigning to the current owner is a no-op", () => {
    const s = fresh();
    const l = s.createLead({
      name: "A",
      source: "Phone",
      owner: "Rahul Verma",
    });
    const n = s.getState().notifications.length;
    s.assignLead(l.id, "Rahul Verma");
    expect(s.getState().notifications).toHaveLength(n);
  });
  it("updateStatus logs activity", () => {
    const s = fresh();
    const l = s.createLead({ name: "A", source: "Phone" });
    const u = s.updateStatus(l.id, "Qualified")!;
    expect(u.status).toBe("Qualified");
    expect(u.activity[0]?.description).toBe(
      "Status changed from New to Qualified",
    );
  });
  it("later calls/emails/WhatsApp keep the original source", () => {
    const s = fresh();
    const l = s.createLead({
      name: "A",
      source: "IndiaMART",
      captureMethod: "api",
    });
    s.linkActivity(l.id, {
      type: "call",
      description: "Called customer",
      user: "Rahul Verma",
    });
    s.linkActivity(l.id, {
      type: "whatsapp",
      description: "Sent catalogue",
      user: "Rahul Verma",
    });
    const u = s.getLead(l.id)!;
    expect(u.source).toBe("IndiaMART");
    expect(u.activity.map((a) => a.type).slice(0, 3)).toEqual([
      "whatsapp",
      "call",
      "created",
    ]);
  });
});

describe("derived dashboard numbers", () => {
  it("source counts and KPIs come from the same collection and update on create", () => {
    const s = fresh();
    const base = s.kpis();
    const wa = base.bySource.find((x) => x.source === "WhatsApp")?.count ?? 0;
    s.createLead({
      name: "ABC Pharma",
      source: "WhatsApp",
      owner: "Rahul Verma",
    });
    const k = s.kpis();
    expect(k.total).toBe(base.total + 1);
    expect(k.newToday).toBe(base.newToday + 1);
    expect(k.byStatus.New).toBe((base.byStatus.New ?? 0) + 1);
    expect(k.bySource.find((x) => x.source === "WhatsApp")?.count).toBe(wa + 1);
    expect(k.bySource.reduce((n, x) => n + x.count, 0)).toBe(k.total);
  });
  it("newToday only counts the current local day", () => {
    const k = computeLeadKpis(seedLeads, NOW);
    expect(k.newToday).toBe(0);
  });
  it("notifies subscribers on change", () => {
    const s = fresh();
    let calls = 0;
    const off = s.subscribe(() => calls++);
    s.createLead({ name: "A", source: "Phone" });
    expect(calls).toBeGreaterThan(0);
    off();
  });
});
