import { describe, expect, it } from "vitest";

import { postLoginPath } from "../post-login-route";

const m = (organizationStatus: string, status = "active") => ({
  organizationId: "o",
  organizationName: "n",
  organizationSlug: "s",
  organizationStatus,
  role: "owner",
  status,
});

describe("postLoginPath", () => {
  it("unfinished onboarding resumes the wizard", () => {
    expect(postLoginPath({ organizations: [m("onboarding")] })).toBe(
      "/onboarding/business",
    );
  });
  it("active workspace goes to the app", () => {
    expect(postLoginPath({ organizations: [m("active")] })).toBe("/app");
    expect(
      postLoginPath({ organizations: [m("onboarding"), m("active")] }),
    ).toBe("/app");
  });
  // SPEC CHANGE (Prompt 2, section J): a user with no valid active organization used to be sent to /app, which
  // renders an empty workspace. They now follow the setup flow (the first save creates the organization).
  it("no organization yet / inactive membership goes to setup", () => {
    expect(postLoginPath({ organizations: [] })).toBe("/onboarding/business");
    expect(postLoginPath({ organizations: [m("onboarding", "removed")] })).toBe(
      "/onboarding/business",
    );
    expect(postLoginPath(null)).toBe("/onboarding/business");
  });
  it("a missing organizationStatus means active (backend default)", () => {
    const noStatus = {
      organizationId: "o",
      organizationName: "n",
      organizationSlug: "s",
      role: "owner",
      status: "active",
    };
    expect(postLoginPath({ organizations: [noStatus] })).toBe("/app");
  });
  it("suspended / archived organizations stay reachable (read-only product rule)", () => {
    expect(postLoginPath({ organizations: [m("suspended")] })).toBe("/app");
    expect(postLoginPath({ organizations: [m("archived")] })).toBe("/app");
  });
});
