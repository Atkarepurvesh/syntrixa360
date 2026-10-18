import { describe, expect, it } from "vitest";

import {
  createCrmStore,
  type ConversationRef,
  type CrmStore,
} from "../crm-store";
import {
  conversationLeadDefaults,
  findLeadMatches,
  linkConversationToLead,
  resolveConversationOwner,
  searchLeadsByIdentity,
  submitLeadFromConversation,
  validateConversationLead,
  type ConversationLeadValues,
} from "../inbox-lead-link";

let tick = Date.now();
const store = (): CrmStore =>
  createCrmStore(
    { leads: [], notifications: [] },
    () => new Date((tick += 1000)),
  );
const OWNER = { role: "owner", name: "Amit Sharma" };
const RAHUL = { role: "sales-executive", name: "Rahul Verma" };
const NEHA = { role: "sales-executive", name: "Neha Singh" };
const members = ["Rahul Verma", "Neha Singh", "Pooja Patel"];

const conv = (over: Partial<ConversationRef> = {}): ConversationRef => ({
  id: "c-1",
  channel: "whatsapp",
  contact: "+91 98765 43210",
  ...over,
});
const vals = (
  over: Partial<ConversationLeadValues> = {},
): ConversationLeadValues => ({
  name: "Shreeji Traders",
  phone: "9876543210",
  email: "",
  company: "Shreeji Traders",
  source: "WhatsApp",
  owner: "Rahul Verma",
  requirement: "Need a catalog",
  ...over,
});
const submit = (
  s: CrmStore,
  c = conv(),
  v = vals(),
  o: Parameters<typeof submitLeadFromConversation>[3] = { viewer: OWNER },
) => submitLeadFromConversation(s, c, v, o);

describe("prefill from a conversation", () => {
  const base = {
    channel: "whatsapp" as const,
    company: "Shreeji Traders",
    contact: "Nilesh Shah",
    assigned: "Rahul",
  };
  const ctx = { members, currentUserName: "Rahul Verma" };
  it("uses what the conversation knows: contact name, company, channel source, latest customer message", () => {
    const d = conversationLeadDefaults(base, " Need a catalog ", ctx);
    expect(d).toMatchObject({
      name: "Nilesh Shah",
      company: "Shreeji Traders",
      source: "WhatsApp",
      requirement: "Need a catalog",
      owner: "Rahul Verma",
      phone: "",
      email: "",
    });
  });
  it("a phone-number contact on WhatsApp becomes the phone, and the name falls back to the company", () => {
    const d = conversationLeadDefaults(
      { ...base, contact: "+91 98765 43210" },
      "",
      ctx,
    );
    expect(d).toMatchObject({
      phone: "+91 98765 43210",
      name: "Shreeji Traders",
    });
  });
  it("an email contact on an email thread becomes the email; source follows the channel", () => {
    const d = conversationLeadDefaults(
      { ...base, channel: "email", contact: "a@b.co" },
      "",
      ctx,
    );
    expect(d).toMatchObject({ email: "a@b.co", phone: "", source: "Email" });
    expect(
      conversationLeadDefaults({ ...base, channel: "website" }, "", ctx).source,
    ).toBe("Website");
  });
  it("owner mapping: You, short names, unassigned, ambiguous and unknown", () => {
    expect(resolveConversationOwner("You", members, "Neha Singh")).toBe(
      "Neha Singh",
    );
    expect(resolveConversationOwner("Pooja", members, "x")).toBe("Pooja Patel");
    expect(resolveConversationOwner("Unassigned", members, "x")).toBe("");
    expect(resolveConversationOwner("Sam", members, "x")).toBe("");
    expect(
      resolveConversationOwner("Rahul", ["Rahul Verma", "Rahul Jain"], "x"),
    ).toBe("");
  });
});

describe("validation", () => {
  it("requires a name and a valid source; rejects bad phone/email", () => {
    expect(validateConversationLead(vals())).toEqual({});
    expect(validateConversationLead(vals({ name: "  " })).name).toBeTruthy();
    expect(validateConversationLead(vals({ source: "" })).source).toBeTruthy();
    expect(validateConversationLead(vals({ phone: "12" })).phone).toBeTruthy();
    expect(
      validateConversationLead(vals({ email: "nope" })).email,
    ).toBeTruthy();
  });
  it("an invalid form creates nothing", () => {
    const s = store();
    const r = submit(s, conv(), vals({ name: "" }));
    expect(r.status).toBe("invalid");
    expect(s.listLeads()).toHaveLength(0);
    expect(s.getLeadForConversation("c-1")).toBeUndefined();
  });
});

describe("create lead from a conversation", () => {
  it("creates the lead, links the conversation, keeps channel source, uses the 'conversation' capture method", () => {
    const s = store();
    const r = submit(s);
    expect(r.status).toBe("created");
    const lead = s.getLeadForConversation("c-1")!;
    expect(lead).toMatchObject({
      name: "Shreeji Traders",
      mobile: "9876543210",
      source: "WhatsApp",
      captureMethod: "conversation",
      owner: "Rahul Verma",
      requirement: "Need a catalog",
    });
    expect(lead.linkedConversations).toHaveLength(1);
    expect(lead.linkedConversations![0]).toMatchObject({
      id: "c-1",
      channel: "whatsapp",
      linkedBy: "Amit Sharma",
    });
  });
  it("the user can correct prefilled fields before saving", () => {
    const s = store();
    submit(
      s,
      conv(),
      vals({ name: "Corrected Name", source: "Referral", phone: "9123456780" }),
    );
    expect(s.listLeads()[0]).toMatchObject({
      name: "Corrected Name",
      source: "Referral",
      mobile: "9123456780",
    });
  });
  it("timeline gets one entry for creation and one for the link, with timestamp, type and user", () => {
    const s = store();
    submit(s);
    const lead = s.listLeads()[0]!;
    const a = lead.activity.find((x) =>
      x.description.includes("conversation"),
    )!;
    expect(a).toMatchObject({ type: "updated", user: "Amit Sharma" });
    expect(a.description).toBe(
      "Lead created from WhatsApp conversation with +91 98765 43210",
    );
    expect(a.date).toBeTruthy();
    expect(a.time).toBeTruthy();
    expect(lead.activity.filter((x) => x.type === "created")).toHaveLength(1);
  });
  it("repeated submits (double click) create only one lead and no extra activity", () => {
    const s = store();
    const first = submit(s);
    const n = s.listLeads()[0]!.activity.length;
    const again = submit(s);
    submit(s);
    expect(first.status).toBe("created");
    expect(again.status).toBe("already-linked");
    expect(s.listLeads()).toHaveLength(1);
    expect(s.listLeads()[0]!.activity).toHaveLength(n);
  });
  it("store failure is reported, not hidden", () => {
    const s = store();
    const bad = {
      ...s,
      createLeadFromConversation: () => {
        throw new Error("boom");
      },
    } as unknown as CrmStore;
    const r = submitLeadFromConversation(bad, conv(), vals(), {
      viewer: OWNER,
    });
    expect(r).toEqual({ status: "error", message: "boom" });
    expect(s.listLeads()).toHaveLength(0);
  });
  it("owner is optional (unassigned) and blank optional fields are omitted", () => {
    const s = store();
    submit(
      s,
      conv(),
      vals({ owner: "", email: "", company: "", requirement: "" }),
    );
    const l = s.listLeads()[0]!;
    expect(l.owner).toBe("");
    expect(l.email).toBe("");
  });
});

describe("duplicate warning", () => {
  const seeded = () => {
    const s = store();
    s.createLead({
      name: "Existing",
      source: "Phone",
      mobile: "+91 98765 43210",
      owner: "Rahul Verma",
    });
    return s;
  };
  it("warns before creating when phone or email already exists, then allows 'create anyway' for the same values", () => {
    const s = seeded();
    const r = submit(s);
    expect(r.status).toBe("duplicate");
    if (r.status !== "duplicate") return;
    expect(r.matches[0]!.reasons).toContain("phone");
    expect(s.listLeads()).toHaveLength(1);
    const ok = submit(s, conv(), vals(), { viewer: OWNER, ackedKey: r.key });
    expect(ok.status).toBe("created");
    expect(s.listLeads()).toHaveLength(2);
  });
  it("changing the phone re-arms the warning", () => {
    const s = seeded();
    const r = submit(s);
    if (r.status !== "duplicate") throw new Error("expected duplicate");
    // different (non-matching) phone -> no duplicate at all
    expect(
      submit(s, conv(), vals({ phone: "9000000001" }), {
        viewer: OWNER,
        ackedKey: r.key,
      }).status,
    ).toBe("created");
  });
  it("email matches are detected too", () => {
    const s = store();
    s.createLead({ name: "E", source: "Email", email: "Buyer@X.com" });
    expect(
      submit(
        s,
        conv({ channel: "email" }),
        vals({ phone: "", email: "buyer@x.com" }),
      ).status,
    ).toBe("duplicate");
  });
  it("a match owned by someone else is counted but not exposed to a sales executive", () => {
    const s = seeded(); // owned by Rahul
    const r = submit(s, conv(), vals({ owner: "Neha Singh" }), {
      viewer: NEHA,
    });
    expect(r.status).toBe("duplicate");
    if (r.status !== "duplicate") return;
    expect(r.matches).toHaveLength(0);
    expect(r.hidden).toBe(1);
  });
});

describe("link to an existing lead", () => {
  const withLeads = () => {
    const s = store();
    const a = s.createLead({
      name: "Alpha",
      source: "Referral",
      mobile: "9876543210",
      email: "a@x.com",
      owner: "Rahul Verma",
    });
    const b = s.createLead({
      name: "Alpha Two",
      source: "Website",
      mobile: "98765 43210",
      owner: "Rahul Verma",
    });
    const c = s.createLead({
      name: "Gamma",
      source: "Phone",
      mobile: "9111111111",
      email: "c@x.com",
      owner: "Rahul Verma",
    });
    return { s, a, b, c };
  };
  it("matches by normalised phone (any format) or email", () => {
    const { s, a, b, c } = withLeads();
    const m = findLeadMatches(
      s.listLeads(),
      { phone: "+91 98765-43210" },
      OWNER,
    ).visible.map((x) => x.lead.id);
    expect(m.sort()).toEqual([a.id, b.id].sort());
    expect(
      findLeadMatches(s.listLeads(), { email: "C@X.com" }, OWNER).visible[0]!
        .lead.id,
    ).toBe(c.id);
  });
  it("multiple matches are all returned for selection; no match gives an empty list", () => {
    const { s } = withLeads();
    expect(
      findLeadMatches(s.listLeads(), { phone: "9876543210" }, OWNER).visible,
    ).toHaveLength(2);
    expect(
      findLeadMatches(
        s.listLeads(),
        { phone: "9000000000", email: "none@x.com" },
        OWNER,
      ),
    ).toEqual({ visible: [], hidden: 0 });
  });
  it("manual lookup never matches on names", () => {
    const { s, a } = withLeads();
    expect(searchLeadsByIdentity(s.listLeads(), "Alpha", OWNER)).toEqual([]);
    expect(searchLeadsByIdentity(s.listLeads(), "alp", OWNER)).toEqual([]);
    expect(
      searchLeadsByIdentity(s.listLeads(), a.id, OWNER).map((l) => l.id),
    ).toEqual([a.id]);
    expect(
      searchLeadsByIdentity(s.listLeads(), "a@x.com", OWNER).map((l) => l.id),
    ).toEqual([a.id]);
    expect(
      searchLeadsByIdentity(s.listLeads(), "9876543210", OWNER),
    ).toHaveLength(2);
    expect(searchLeadsByIdentity(s.listLeads(), "", OWNER)).toEqual([]);
  });
  it("linking does not create a lead and does not change the original source or capture method", () => {
    const { s, a } = withLeads();
    const before = s.listLeads().length;
    const r = linkConversationToLead(s, conv(), a.id, OWNER);
    expect(r.status).toBe("linked");
    expect(s.listLeads()).toHaveLength(before);
    const l = s.getLead(a.id)!;
    expect(l.source).toBe("Referral"); // WhatsApp conversation does not overwrite the origin
    expect(l.captureMethod).toBe(a.captureMethod);
    expect(s.getLeadForConversation("c-1")!.id).toBe(a.id);
  });
  it("link activity is written once with timestamp and user; repeating adds nothing", () => {
    const { s, a } = withLeads();
    linkConversationToLead(s, conv(), a.id, OWNER);
    const n = s.getLead(a.id)!.activity.length;
    const act = s.getLead(a.id)!.activity[0]!;
    expect(act).toMatchObject({
      type: "updated",
      user: "Amit Sharma",
      description:
        "WhatsApp conversation with +91 98765 43210 linked to this lead",
    });
    expect(act.date && act.time).toBeTruthy();
    expect(linkConversationToLead(s, conv(), a.id, OWNER).status).toBe(
      "already-linked",
    );
    linkConversationToLead(s, conv(), a.id, OWNER);
    expect(s.getLead(a.id)!.activity).toHaveLength(n);
    expect(s.getLead(a.id)!.linkedConversations).toHaveLength(1);
  });
  it("a conversation already linked to one lead can't be silently re-linked to another", () => {
    const { s, a, c } = withLeads();
    linkConversationToLead(s, conv(), a.id, OWNER);
    const r = linkConversationToLead(s, conv(), c.id, OWNER);
    expect(r).toMatchObject({ status: "error" });
    expect(s.getLeadForConversation("c-1")!.id).toBe(a.id);
    expect(s.getLead(c.id)!.linkedConversations ?? []).toHaveLength(0);
  });
  it("unknown lead id is an error and changes nothing", () => {
    const { s } = withLeads();
    expect(linkConversationToLead(s, conv(), "L-9999", OWNER).status).toBe(
      "error",
    );
    expect(s.getLeadForConversation("c-1")).toBeUndefined();
  });
  it("creating from a conversation that is already linked returns that lead instead of a new one", () => {
    const { s, a } = withLeads();
    linkConversationToLead(s, conv(), a.id, OWNER);
    const r = submit(s, conv(), vals({ phone: "9000000009" }));
    expect(r).toMatchObject({ status: "already-linked" });
    expect(s.listLeads()).toHaveLength(3);
  });
});

describe("scoping", () => {
  it("a sales executive can't see or link another user's lead", () => {
    const s = store();
    const l = s.createLead({
      name: "Private",
      source: "Phone",
      mobile: "9876543210",
      owner: "Rahul Verma",
    });
    expect(
      findLeadMatches(s.listLeads(), { phone: "9876543210" }, NEHA),
    ).toEqual({ visible: [], hidden: 1 });
    expect(searchLeadsByIdentity(s.listLeads(), l.id, NEHA)).toEqual([]);
    expect(linkConversationToLead(s, conv(), l.id, NEHA).status).toBe("error");
    expect(s.getLead(l.id)!.linkedConversations ?? []).toHaveLength(0);
  });
  it("the owner of the lead, and owners/managers, can link", () => {
    const s = store();
    const l = s.createLead({
      name: "Mine",
      source: "Phone",
      owner: "Rahul Verma",
    });
    expect(linkConversationToLead(s, conv(), l.id, RAHUL).status).toBe(
      "linked",
    );
    expect(
      linkConversationToLead(s, conv({ id: "c-2" }), l.id, {
        role: "manager",
        name: "Priya Nair",
      }).status,
    ).toBe("linked");
  });
  it("linking triggers no notification or source change by itself", () => {
    const s = store();
    const l = s.createLead({
      name: "X",
      source: "Website",
      owner: "Rahul Verma",
    });
    const n = s.getState().notifications.length;
    linkConversationToLead(s, conv(), l.id, OWNER);
    expect(s.getState().notifications).toHaveLength(n);
    expect(s.getLead(l.id)!.source).toBe("Website");
  });
});
