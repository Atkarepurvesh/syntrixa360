// REAL end-to-end test of the frontend API layer against a RUNNING FastAPI backend.
// Skipped unless INTEGRATION_API_URL is set. Email links are read from the backend's
// console log (EMAIL_BACKEND=console) via BACKEND_LOG.
//
//   VITE_API_URL=http://localhost:8000/api/v1 INTEGRATION_API_URL=http://localhost:8000/api/v1 \
//   BACKEND_LOG=/tmp/uvicorn.log npx vitest run
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const URL_ = process.env["INTEGRATION_API_URL"];
const LOG = process.env["BACKEND_LOG"] ?? "";
const run = URL_ ? describe : describe.skip;

function lastToken(kind: "verify-email" | "reset-password"): string {
  const m = [
    ...readFileSync(LOG, "utf8").matchAll(
      new RegExp(`${kind}\\?token=([\\w-]+)`, "g"),
    ),
  ];
  const last = m[m.length - 1];
  if (!last?.[1]) throw new Error(`no ${kind} link in backend log`);
  return last[1];
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

run("auth against real backend", () => {
  const suffix = Math.random().toString(36).slice(2, 8);
  const email = `it_${suffix}@example.com`;
  const phone = `+9198${Math.floor(10000000 + Math.random() * 89999999)}`;
  const password = "Str0ng!Pass#1";
  const newPassword = "Brand#New9pass";

  let auth: typeof import("../auth");
  let client: typeof import("../client");
  let common: typeof import("@/types/api/common");

  it("loads modules", async () => {
    client = await import("../client");
    auth = await import("../auth");
    common = await import("@/types/api/common");
  });

  it("register: camelCase->snake_case body, returns camelCase user, not verified", async () => {
    const u = await auth.register({
      fullName: "Integration User",
      email,
      phone,
      password,
    });
    expect(u.email).toBe(email);
    expect(u.fullName).toBe("Integration User");
    expect(u.emailVerified).toBe(false);
  });

  it("register duplicate email -> 409 conflict", async () => {
    await expect(
      auth.register({
        fullName: "Dup",
        email,
        phone: `+9198${Math.floor(10000000 + Math.random() * 89999999)}`,
        password,
      }),
    ).rejects.toMatchObject({ status: 409, kind: "conflict" });
  });

  it("register weak password -> 422 with fieldErrors on `password`", async () => {
    try {
      await auth.register({
        fullName: "Weak",
        email: `w_${suffix}@example.com`,
        phone,
        password: "short",
      });
      throw new Error("should have failed");
    } catch (e) {
      expect(e).toBeInstanceOf(common.ApiError);
      const err = e as InstanceType<typeof common.ApiError>;
      expect(err.status).toBe(422);
      expect(err.fieldErrors.some((f) => f.field === "password")).toBe(true);
    }
  });

  it("login with wrong password -> 401, no tokens stored", async () => {
    await expect(auth.login(email, "Wrong!Pass#1")).rejects.toMatchObject({
      status: 401,
      kind: "unauthorized",
    });
    expect(client.getAccessToken()).toBeNull();
  });

  it("login ok -> raw TokenResponse mapped to camelCase; /auth/me works", async () => {
    const res = await auth.login(email, password);
    expect(res.accessToken.length).toBeGreaterThan(20);
    expect(res.refreshToken.length).toBeGreaterThan(20);
    expect(res.user.email).toBe(email);
    const me = await auth.getCurrentUser();
    expect(me.email).toBe(email);
    expect(me.organizations).toEqual([]);
    expect(me.emailVerified).toBe(false);
  });

  it("verify-email with the emailed link token", async () => {
    await sleep(300);
    await auth.verifyEmail(lastToken("verify-email"));
    const me = await auth.getCurrentUser();
    expect(me.emailVerified).toBe(true);
  });

  it("verify-email token is single use -> 400", async () => {
    await expect(
      auth.verifyEmail(lastToken("verify-email")),
    ).rejects.toMatchObject({ status: 400 });
  });

  it("refresh: single-flight, rotates tokens, new access token works", async () => {
    const before = client.getRefreshToken();
    const [a, b] = await Promise.all([
      client.refreshSession(),
      client.refreshSession(),
    ]);
    expect(a && b).toBe(true);
    expect(client.getRefreshToken()).not.toBe(before);
    expect((await auth.getCurrentUser()).email).toBe(email);
  });

  it("expired/invalid access token is transparently refreshed on 401", async () => {
    client.setTokens({ accessToken: "garbage.invalid.token" });
    const me = await auth.getCurrentUser(); // 401 -> refresh -> retry once
    expect(me.email).toBe(email);
  });

  it("forgot-password + reset-password, then old password fails and new works", async () => {
    await auth.forgotPassword(email);
    await sleep(300);
    await auth.resetPassword(lastToken("reset-password"), newPassword);
    await expect(auth.login(email, password)).rejects.toMatchObject({
      status: 401,
    });
    const res = await auth.login(email, newPassword);
    expect(res.user.email).toBe(email);
  });

  it("forgot-password for unknown email gives the same success (no enumeration)", async () => {
    // must not throw (backend answers 202 either way); void endpoints resolve with null data
    await expect(
      auth.forgotPassword(`nobody_${suffix}@example.com`),
    ).resolves.not.toThrow();
  });

  it("logout revokes the refresh token; protected call then fails", async () => {
    const rt = client.getRefreshToken()!;
    await auth.logout();
    expect(client.getAccessToken()).toBeNull();
    expect(client.getRefreshToken()).toBeNull();
    // the revoked token must no longer refresh
    client.setTokens({ accessToken: "x", refreshToken: rt });
    expect(await client.refreshSession()).toBe(false);
    client.clearTokens();
    await expect(auth.getCurrentUser()).rejects.toMatchObject({ status: 401 });
  });
});
