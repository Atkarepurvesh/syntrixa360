import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  BACKEND_CODES,
  resolveOrgPermissions,
  resolvePermissions,
} from "../backend-permissions";

// Mirrors backend/app/utils/seed.py SYSTEM_ROLES (verified against the seed file below when available).
const ALL = [...BACKEND_CODES];
const MANAGER = ALL.filter(
  (c) => !["organization.delete", "billing.manage", "roles.manage"].includes(c),
);
const EXECUTIVE = [
  "organization.read",
  "team.read",
  "channels.read",
  "onboarding.read",
  "workspace.read",
  "reports.read",
  "leads.read",
  "leads.create",
  "leads.update",
  "customers.read",
  "customers.create",
  "customers.update",
  "quotations.read",
  "quotations.create",
  "quotations.update",
];

describe("BACKEND_CODES stays in sync with the backend seed", () => {
  const seed = path.resolve(
    __dirname,
    "../../../../../backend/app/utils/seed.py",
  );
  it.skipIf(!existsSync(seed))("matches backend/app/utils/seed.py", () => {
    const text = readFileSync(seed, "utf8");
    const block = text.slice(
      text.indexOf("_MODULES"),
      text.indexOf("PERMISSIONS:"),
    );
    const codes = new Set<string>();
    for (const line of block.split("\n")) {
      const m = line.match(/^\s*"(\w+)":\s*\[(.*)\],?\s*$/);
      if (!m) continue;
      for (const a of m[2]!.matchAll(/\("(\w+)",/g))
        codes.add(`${m[1]}.${a[1]}`);
    }
    expect(codes.size).toBeGreaterThan(25);
    expect([...codes].sort()).toEqual([...BACKEND_CODES].sort());
  });
});

describe("resolvePermissions (backend is authoritative)", () => {
  it("OWNER gets backend-defined admin keys", () => {
    const p = resolvePermissions("OWNER", ALL);
    for (const k of [
      "billing.manage",
      "roles.manage",
      "organization.update",
      "users.invite",
      "users.update",
      "team_members.read",
      "dashboard.read",
    ])
      expect(p.has(k as never), k).toBe(true);
  });

  it("MANAGER lacks billing.manage / roles.manage but can manage users", () => {
    const p = resolvePermissions("MANAGER", MANAGER);
    expect(p.has("billing.manage")).toBe(false);
    expect(p.has("roles.manage")).toBe(false);
    expect(p.has("users.invite")).toBe(true);
    expect(p.has("users.suspend")).toBe(true);
  });

  it("EXECUTIVE cannot invite/manage users or touch org/billing", () => {
    const p = resolvePermissions("EXECUTIVE", EXECUTIVE);
    for (const k of [
      "users.invite",
      "users.update",
      "users.suspend",
      "organization.update",
      "billing.read",
      "roles.read",
    ])
      expect(p.has(k as never), k).toBe(false);
    expect(p.has("leads.create")).toBe(true);
    expect(p.has("leads.delete")).toBe(false);
    expect(p.has("team_members.read")).toBe(true);
  });

  it("a backend-defined key is denied when the backend did not grant it, whatever the legacy matrix says", () => {
    const p = resolvePermissions("OWNER", ["workspace.read", "leads.read"]); // owner role, revoked permissions
    expect(p.has("leads.read")).toBe(true);
    expect(p.has("leads.create")).toBe(false);
    expect(p.has("customers.read")).toBe(false);
    expect(p.has("billing.manage")).toBe(false);
  });

  it("frontend-only keys of backend modules additionally require the module .read (leads.export)", () => {
    const withRead = resolvePermissions("OWNER", [
      "workspace.read",
      "leads.read",
    ]);
    const without = resolvePermissions("OWNER", ["workspace.read"]);
    expect(withRead.has("leads.export")).toBe(true);
    expect(without.has("leads.export")).toBe(false);
  });

  it("member without workspace.read gets nothing from the interim legacy matrix", () => {
    const p = resolvePermissions("OWNER", ["organization.read"]);
    expect(p.has("orders.read")).toBe(false);
    expect(p.has("dashboard.read")).toBe(false);
    expect(p.has("organization.read")).toBe(true);
  });

  it("unknown backend role gets only what the backend granted explicitly", () => {
    const p = resolvePermissions("CUSTOM", ["workspace.read", "leads.read"]);
    expect(p.has("orders.read")).toBe(false);
    expect(p.has("leads.read")).toBe(true);
  });

  it("no permissions at all -> empty (fail closed)", () => {
    expect(resolvePermissions("OWNER", []).size).toBe(0);
  });
});

describe("resolveOrgPermissions", () => {
  it("executive: own-activity only", () => {
    const p = resolveOrgPermissions(EXECUTIVE);
    expect(p).toContain("audit_logs.read");
    expect(p).not.toContain("audit_logs.read.organization");
    expect(p).not.toContain("audit_logs.export");
  });
  it("manager: org-wide audit, no export/approve/retry", () => {
    const p = resolveOrgPermissions(MANAGER);
    expect(p).toContain("audit_logs.read.organization");
    expect(p).toContain("automation.configure");
    expect(p).not.toContain("audit_logs.export");
  });
  it("owner: everything", () => {
    const p = resolveOrgPermissions(ALL);
    expect(p).toEqual(
      expect.arrayContaining([
        "audit_logs.export",
        "ai.activity.approve",
        "automation.retry",
        "organization.settings",
      ]),
    );
  });
});
