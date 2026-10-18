import { describe, expect, it, vi } from "vitest";

import type { AuthUser } from "@/types/api/auth";
import { ApiError } from "@/types/api/common";

vi.mock("../api/auth", () => ({ getCurrentUser: vi.fn() }));

import { getCurrentUser } from "../api/auth";
import { decideAppAccess, resolveAppAccess } from "../route-guard";

const user = (...statuses: string[]) =>
  ({
    id: "u",
    organizations: statuses.map((s, i) => ({
      organizationId: `o${i}`,
      organizationName: "n",
      organizationSlug: "s",
      organizationStatus: s,
      role: "owner",
      status: "active",
    })),
  }) as unknown as AuthUser;

describe("decideAppAccess (pure)", () => {
  it("active workspace -> allow", () => {
    expect(decideAppAccess(user("active")).kind).toBe("allow");
  });
  it("incomplete onboarding -> wizard, never the app", () => {
    expect(decideAppAccess(user("onboarding"))).toMatchObject({
      kind: "redirect",
      to: "/onboarding/business",
    });
  });
  it("no organization -> setup flow", () => {
    expect(decideAppAccess(user())).toMatchObject({
      kind: "redirect",
      to: "/onboarding/business",
    });
  });
});

describe("resolveAppAccess (server is authoritative)", () => {
  it("uses the fresh server answer, so a stale 'onboarding' cache cannot keep a finished user out", async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce(user("active"));
    expect((await resolveAppAccess()).kind).toBe("allow");
  });
  it("401 -> login", async () => {
    vi.mocked(getCurrentUser).mockRejectedValueOnce(
      new ApiError({
        status: 401,
        code: "unauthorized",
        kind: "unauthorized",
        message: "no",
      }),
    );
    expect(await resolveAppAccess()).toEqual({ kind: "login" });
  });
  it("network / 5xx is rethrown (the UI shows retry; no redirect loop)", async () => {
    vi.mocked(getCurrentUser).mockRejectedValueOnce(
      new ApiError({
        status: 503,
        code: "unavailable",
        kind: "server",
        message: "down",
      }),
    );
    await expect(resolveAppAccess()).rejects.toBeInstanceOf(ApiError);
  });
});
