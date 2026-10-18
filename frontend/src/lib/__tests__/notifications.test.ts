import { describe, expect, it } from "vitest";

import {
  countUnread,
  createCrmStore,
  filterNotifications,
  notificationsForUser,
  notificationTime,
  type CrmNotification,
  type CrmStore,
} from "../crm-store";
import { notifications as seedFixtures } from "../crm-data";

let tick = new Date(2026, 9, 14, 10, 0, 0).getTime();
const clock = () => new Date((tick += 1000));
const store = (): CrmStore =>
  createCrmStore({ leads: [], notifications: [] }, clock);
const mine = (s: CrmStore, user: string) =>
  notificationsForUser(s.getState().notifications, user);
const mk = (s: CrmStore, name: string, owner?: string) =>
  s.createLead({ name, source: "WhatsApp", ...(owner ? { owner } : {}) });

describe("reading from the shared store", () => {
  it("seed notifications come from the store once, unread, with /app links", () => {
    const s = createCrmStore();
    const n = s.getState().notifications;
    expect(n).toHaveLength(seedFixtures.length);
    expect(n.every((x) => !x.read && x.to.startsWith("/app/"))).toBe(true);
    expect(new Set(n.map((x) => x.id)).size).toBe(n.length);
    // reading / subscribing never re-seeds
    s.subscribe(() => {})();
    expect(s.getState().notifications).toHaveLength(seedFixtures.length);
  });

  it("subscribers are notified when a notification is added", () => {
    const s = store();
    let calls = 0;
    s.subscribe(() => calls++);
    mk(s, "A", "Rahul Verma");
    expect(calls).toBeGreaterThan(0);
  });
});

describe("assignment and reassignment notifications", () => {
  it("creating a lead with an owner notifies that owner exactly once, with stable fields", () => {
    const s = store();
    const l = mk(s, "ABC", "Rahul Verma");
    const n = mine(s, "Rahul Verma");
    expect(n).toHaveLength(1);
    expect(n[0]).toMatchObject({
      kind: "lead_created",
      recipient: "Rahul Verma",
      leadId: l.id,
      read: false,
      to: "/app/leads",
      search: { q: l.id },
    });
    expect(n[0]!.id).toBeTruthy();
    expect(Date.parse(n[0]!.createdAt!)).not.toBeNaN();
  });

  it("an unassigned lead creates a broadcast notification (no recipient)", () => {
    const s = store();
    mk(s, "U");
    const n = s.getState().notifications[0]!;
    expect(n.recipient).toBeUndefined();
    expect(mine(s, "Rahul Verma")).toHaveLength(1);
    expect(mine(s, "Neha Singh")).toHaveLength(1);
  });

  it("assigning an unassigned lead notifies only the new owner", () => {
    const s = store();
    const l = mk(s, "U");
    s.assignLead(l.id, "Neha Singh", "Priya Nair");
    const mineNeha = mine(s, "Neha Singh").filter(
      (n) => n.kind === "lead_assigned",
    );
    expect(mineNeha).toHaveLength(1);
    expect(mineNeha[0]).toMatchObject({
      title: "Lead assigned to you",
      leadId: l.id,
    });
    expect(
      mine(s, "Rahul Verma").filter((n) => n.kind === "lead_assigned"),
    ).toHaveLength(0);
  });

  it("reassigning notifies the new owner and tells the previous owner", () => {
    const s = store();
    const l = mk(s, "A", "Rahul Verma");
    s.assignLead(l.id, "Neha Singh");
    const neha = mine(s, "Neha Singh");
    const rahul = mine(s, "Rahul Verma");
    expect(neha.find((n) => n.title === "Lead assigned to you")).toBeTruthy();
    expect(rahul.find((n) => n.title === "Lead reassigned")).toMatchObject({
      leadId: l.id,
      read: false,
    });
    // a third person sees neither
    expect(
      mine(s, "Arjun Mehta").filter((n) => n.leadId === l.id && n.recipient),
    ).toHaveLength(0);
  });

  it("owner change through the edit form notifies the same way", () => {
    const s = store();
    const l = mk(s, "A", "Rahul Verma");
    s.editLead(l.id, { owner: "Neha Singh" });
    expect(
      mine(s, "Neha Singh").filter((n) => n.kind === "lead_assigned"),
    ).toHaveLength(1);
    expect(
      mine(s, "Rahul Verma").some((n) => n.title === "Lead reassigned"),
    ).toBe(true);
  });
});

describe("duplicate prevention", () => {
  it("re-assigning to the same owner, and edits that keep the owner, add nothing", () => {
    const s = store();
    const l = mk(s, "A", "Rahul Verma");
    const before = s.getState().notifications.length;
    s.assignLead(l.id, "Rahul Verma");
    s.editLead(l.id, { owner: "Rahul Verma", city: "Pune" });
    s.updateStatus(l.id, "Qualified");
    s.scheduleFollowUp(l.id, { date: "2026-10-20" });
    expect(s.getState().notifications).toHaveLength(before);
  });

  it("assigning twice to the same person yields one assignment notification", () => {
    const s = store();
    const l = mk(s, "A");
    s.assignLead(l.id, "Neha Singh");
    s.assignLead(l.id, "Neha Singh");
    expect(
      s
        .getState()
        .notifications.filter(
          (n) => n.recipient === "Neha Singh" && n.kind === "lead_assigned",
        ),
    ).toHaveLength(1);
  });

  it("ids are unique across many notifications", () => {
    const s = store();
    for (let i = 0; i < 25; i++) mk(s, `L${i}`, "Rahul Verma");
    const ids = s.getState().notifications.map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("read / unread", () => {
  it("mark read and unread update state and the unread count", () => {
    const s = store();
    mk(s, "A", "Rahul Verma");
    mk(s, "B", "Rahul Verma");
    const id = mine(s, "Rahul Verma")[0]!.id;
    expect(countUnread(mine(s, "Rahul Verma"))).toBe(2);
    s.markNotificationRead(id);
    expect(countUnread(mine(s, "Rahul Verma"))).toBe(1);
    expect(s.getState().notifications.find((n) => n.id === id)!.read).toBe(
      true,
    );
    s.markNotificationUnread(id);
    expect(countUnread(mine(s, "Rahul Verma"))).toBe(2);
  });

  it("repeating a read/unread action, or using an unknown id, does not touch state or notify", () => {
    const s = store();
    mk(s, "A", "Rahul Verma");
    const id = s.getState().notifications[0]!.id;
    s.markNotificationRead(id);
    let calls = 0;
    s.subscribe(() => calls++);
    const ref = s.getState();
    s.markNotificationRead(id);
    s.markNotificationRead("nope");
    s.markNotificationUnread("nope");
    s.markNotificationUnread(
      s.getState().notifications.find((n) => !n.read)?.id ?? "x",
    );
    expect(calls).toBe(0);
    expect(s.getState()).toBe(ref);
  });

  it("mark all as read affects only what the user can see", () => {
    const s = store();
    mk(s, "A", "Rahul Verma");
    mk(s, "B", "Neha Singh");
    mk(s, "Unassigned");
    expect(s.markAllNotificationsRead("Rahul Verma")).toBe(2); // own + broadcast
    expect(countUnread(mine(s, "Rahul Verma"))).toBe(0);
    expect(countUnread(mine(s, "Neha Singh"))).toBe(1); // her private one is still unread
    expect(s.markAllNotificationsRead("Rahul Verma")).toBe(0); // idempotent
  });
});

describe("All / Unread filtering", () => {
  it("unread tab hides read items; all shows everything", () => {
    const s = store();
    mk(s, "A", "Rahul Verma");
    mk(s, "B", "Rahul Verma");
    const list = () => mine(s, "Rahul Verma");
    s.markNotificationRead(list()[0]!.id);
    expect(filterNotifications(list(), "all")).toHaveLength(2);
    expect(filterNotifications(list(), "unread")).toHaveLength(1);
    expect(filterNotifications(list(), "unread")[0]!.read).toBe(false);
  });
});

describe("empty state and scoping", () => {
  it("an empty store gives no notifications and a zero count", () => {
    const s = store();
    expect(mine(s, "Rahul Verma")).toEqual([]);
    expect(countUnread([])).toBe(0);
    expect(filterNotifications([], "unread")).toEqual([]);
  });

  it("private notifications are never shown to another user", () => {
    const s = store();
    mk(s, "Secret", "Neha Singh");
    expect(
      mine(s, "Rahul Verma").filter((n) => n.recipient === "Neha Singh"),
    ).toHaveLength(0);
    expect(mine(s, "Neha Singh")).toHaveLength(1);
    expect(mine(s, "")).toHaveLength(0);
  });
});

describe("relative time", () => {
  const base: CrmNotification = {
    id: "N",
    title: "t",
    body: "b",
    tone: "info",
    time: "10m ago",
    to: "/app/leads",
    search: {},
    read: false,
    kind: "general",
  };
  const at = (min: number) =>
    new Date(2026, 9, 14, 10, 0, 0).getTime() + min * 60_000;
  const n = { ...base, createdAt: new Date(at(0)).toISOString() };
  it("uses the real timestamp when present, and the fixture text otherwise", () => {
    expect(notificationTime(n, new Date(at(0)))).toBe("Just now");
    expect(notificationTime(n, new Date(at(5)))).toBe("5m ago");
    expect(notificationTime(n, new Date(at(180)))).toBe("3h ago");
    expect(notificationTime(n, new Date(at(60 * 49)))).toBe("2d ago");
    expect(notificationTime(n, new Date(at(-5)))).toBe("Just now"); // clock skew
    expect(notificationTime(base)).toBe("10m ago");
    expect(notificationTime({ ...base, createdAt: "garbage" })).toBe("10m ago");
  });
});
