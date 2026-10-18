// REAL end-to-end test: frontend API layer + organization-data mapping against a RUNNING backend.
// Skipped unless INTEGRATION_API_URL is set (see auth.integration.test.ts for the env vars).
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const URL_ = process.env["INTEGRATION_API_URL"];
const LOG = process.env["BACKEND_LOG"] ?? "";
const run = URL_ ? describe : describe.skip;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function lastLinkToken(kind: "verify-email" | "accept-invite"): string {
  const re =
    kind === "verify-email"
      ? /verify-email\?token=([\w-]+)/g
      : /accept-invite\/([\w-]+)/g;
  const m = [...readFileSync(LOG, "utf8").matchAll(re)];
  const last = m[m.length - 1];
  if (!last?.[1]) throw new Error(`no ${kind} link in backend log`);
  return last[1];
}
const rnd = () => Math.random().toString(36).slice(2, 8);
const phone = () => `+9198${Math.floor(10000000 + Math.random() * 89999999)}`;
const password = "Str0ng!Pass#1";

run("organization, RBAC and tenancy against real backend", () => {
  const s = rnd();
  const owner = { email: `own_${s}@example.com`, name: "Owner One" };
  const exec = { email: `exe_${s}@example.com`, name: "Exec One" };
  const outsider = { email: `out_${s}@example.com`, name: "Outsider" };

  let client: typeof import("../client");
  let auth: typeof import("../auth");
  let orgs: typeof import("../organizations");
  let team: typeof import("../team");
  let data: typeof import("@/lib/organization-data");
  let common: typeof import("@/types/api/common");
  let orgId = "";
  let execMemberId = "";

  async function signUpAndLogin(u: { email: string; name: string }) {
    await auth.register({
      fullName: u.name,
      email: u.email,
      phone: phone(),
      password,
    });
    await sleep(250);
    await auth.verifyEmail(lastLinkToken("verify-email"));
    client.clearTokens();
    client.setActiveOrganizationId(null);
    await auth.login(u.email, password);
  }

  it("loads modules", async () => {
    client = await import("../client");
    auth = await import("../auth");
    orgs = await import("../organizations");
    team = await import("../team");
    data = await import("@/lib/organization-data");
    common = await import("@/types/api/common");
  });

  it("new user has no organizations; creating one via onboarding makes them OWNER", async () => {
    await signUpAndLogin(owner);
    expect(await orgs.listOrganizations()).toEqual([]);
    const created = await client.api.post<{
      organizationId?: string;
      id?: string;
    }>("/onboarding/business", {
      name: `Acme ${s}`,
      businessType: "trader",
      industry: "fmcg",
    });
    expect(created).toBeTruthy();
    const list = await data.fetchOrganizations(); // goes through the real mapping layer
    expect(list).toHaveLength(1);
    const o = list[0]!;
    orgId = o.id;
    expect(o.role).toEqual({ key: "owner", label: "Owner" });
    expect(o.backendRole).toBe("OWNER");
    expect(o.status).toBe("active");
    expect(o.backendPermissions).toEqual(
      expect.arrayContaining(["team.manage", "billing.manage", "leads.read"]),
    );
    expect(o.permissions).toEqual(
      expect.arrayContaining(["audit_logs.export", "organization.settings"]),
    );
  });

  it("X-Organization-ID is sent after setActiveOrganizationId; team endpoints work for the owner", async () => {
    await expect(team.listMembers()).rejects.toMatchObject({ status: 400 }); // no org header yet
    client.setActiveOrganizationId(orgId);
    const members = await team.listMembers();
    expect(members).toHaveLength(1);
    expect(members[0]).toMatchObject({
      email: owner.email,
      isSelf: true,
      role: { key: "OWNER" },
    });
    const cur = await orgs.getCurrentOrganization();
    expect(cur.id).toBe(orgId);
  });

  it("owner invites an executive; invitee accepts and gets a scoped role", async () => {
    await signUpAndLogin(exec); // executive account exists first (sessions swap on the shared client)
    client.clearTokens();
    await auth.login(owner.email, password);
    client.setActiveOrganizationId(orgId);
    const inv = await team.createInvitation({
      email: exec.email,
      role: "EXECUTIVE",
    });
    expect(inv).toMatchObject({
      email: exec.email,
      role: { key: "EXECUTIVE" },
      status: "pending",
    });
    expect(JSON.stringify(inv)).not.toMatch(/token/i);
    await sleep(250);
    const token = lastLinkToken("accept-invite");
    expect((await team.listInvitations()).map((i) => i.email)).toContain(
      exec.email,
    );

    client.clearTokens();
    client.setActiveOrganizationId(null);
    await auth.login(exec.email, password);
    const m = await team.acceptInvitation(token);
    expect(m).toMatchObject({ id: orgId, role: { key: "EXECUTIVE" } });
    await expect(team.acceptInvitation(token)).rejects.toMatchObject({
      status: 400,
    }); // single use
  });

  it("executive sees backend-derived UI permissions: no team management", async () => {
    const [mine] = await data.fetchOrganizations();
    expect(mine!.role.label).toBe("Executive");
    const { resolvePermissions } =
      await import("@/lib/rbac/backend-permissions");
    const perms = resolvePermissions(
      mine!.backendRole,
      mine!.backendPermissions,
    );
    expect(perms.has("leads.create")).toBe(true);
    expect(perms.has("users.invite")).toBe(false);
    client.setActiveOrganizationId(orgId);
    expect((await team.listMembers()).length).toBe(2); // team.read allowed
    execMemberId = (await team.listMembers()).find(
      (x) => x.email === exec.email,
    )!.id;
    await expect(
      team.createInvitation({ email: `x_${s}@example.com`, role: "EXECUTIVE" }),
    ).rejects.toMatchObject({ status: 403 });
    await expect(team.listInvitations()).rejects.toMatchObject({ status: 403 });
    await expect(
      team.updateMember(execMemberId, { role: "OWNER" }),
    ).rejects.toMatchObject({ status: 403 }); // no self-promotion
    await expect(team.removeMember(execMemberId)).rejects.toMatchObject({
      status: 403,
    });
  });

  it("outsider (member of nothing): cannot read the org, cannot switch to it, same error as for a random id", async () => {
    await signUpAndLogin(outsider);
    expect(await orgs.listOrganizations()).toEqual([]);
    client.setActiveOrganizationId(orgId); // attacker-controlled header
    await expect(team.listMembers()).rejects.toMatchObject({ status: 403 });
    await expect(
      team.updateMember(execMemberId, { role: "OWNER" }),
    ).rejects.toMatchObject({ status: 403 });
    await expect(data.switchOrganization(orgId)).rejects.toMatchObject({
      code: "not_a_member",
    });
    await expect(
      data.switchOrganization("00000000-0000-0000-0000-000000000000"),
    ).rejects.toMatchObject({ code: "not_a_member" });
    await expect(
      orgs.switchOrganizationApi("not-a-uuid"),
    ).rejects.toBeInstanceOf(common.ApiError);
  });

  it("owner suspends the executive: access is cut immediately on the SAME valid token", async () => {
    client.clearTokens();
    await auth.login(owner.email, password);
    client.setActiveOrganizationId(orgId);
    const upd = await team.updateMember(execMemberId, { status: "suspended" });
    expect(upd.status).toBe("suspended");
    // owner cannot demote or remove themself
    const self = (await team.listMembers()).find((x) => x.isSelf)!;
    await expect(
      team.updateMember(self.id, { role: "EXECUTIVE" }),
    ).rejects.toMatchObject({ status: 403 });
    await expect(team.removeMember(self.id)).rejects.toMatchObject({
      status: 403,
    });

    client.clearTokens();
    await auth.login(exec.email, password);
    await expect(team.listMembers()).rejects.toMatchObject({ status: 403 });
    expect(await orgs.listOrganizations()).toEqual([]); // suspended membership is not listed
  });

  it("owner removes the member; roles listing reflects the seed", async () => {
    client.clearTokens();
    await auth.login(owner.email, password);
    client.setActiveOrganizationId(orgId);
    await team.removeMember(execMemberId);
    expect((await team.listMembers()).map((m) => m.email)).toEqual([
      owner.email,
    ]);
    const roles = await team.listRoles();
    expect(roles.map((r) => r.key).sort()).toEqual([
      "EXECUTIVE",
      "MANAGER",
      "OWNER",
    ]);
  });
});
