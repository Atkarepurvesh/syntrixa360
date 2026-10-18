import { describe, expect, it } from "vitest";

import { loginPathFor, safeInternalPath } from "../safe-redirect";

const FB = "/app";

describe("safeInternalPath", () => {
  it("accepts in-app paths under the allow-list, keeping query and hash", () => {
    expect(safeInternalPath("/app", FB)).toBe("/app");
    expect(safeInternalPath("/app/leads?tab=won#x", FB)).toBe(
      "/app/leads?tab=won#x",
    );
    expect(safeInternalPath("/onboarding/business", FB)).toBe(
      "/onboarding/business",
    );
    expect(safeInternalPath("/accept-invite/abc123", FB)).toBe(
      "/accept-invite/abc123",
    );
  });

  it.each([
    "https://evil.com",
    "http://evil.com/app",
    "//evil.com",
    "//evil.com/app",
    "/\\evil.com",
    "\\\\evil.com",
    "javascript:alert(1)",
    "data:text/html,<script>1</script>",
    "app/leads", // relative
    "/app\n/../..", // control chars
    "/app\t//evil.com",
    "/application", // prefix lookalike
    "/appx/leads",
    "/login", // would loop
    "/signup",
    "/",
    "",
    "/app/" + "a".repeat(600),
  ])("rejects %j", (bad) => {
    expect(safeInternalPath(bad, FB)).toBe(FB);
  });

  it("rejects non-strings", () => {
    expect(safeInternalPath(null, FB)).toBe(FB);
    expect(safeInternalPath(undefined, FB)).toBe(FB);
    expect(safeInternalPath(42 as unknown as string, FB)).toBe(FB);
  });

  it("normalises dot segments instead of escaping the allow-list", () => {
    expect(safeInternalPath("/app/../login", FB)).toBe(FB);
    expect(safeInternalPath("/app/../../evil", FB)).toBe(FB);
  });

  it("percent-encoded slashes stay inside the same origin", () => {
    expect(safeInternalPath("/app/%2F%2Fevil.com", FB)).toBe(
      "/app/%2F%2Fevil.com",
    );
  });
});

describe("loginPathFor", () => {
  it("round-trips a protected path through the login redirect param", () => {
    const login = loginPathFor("/app/leads?x=1");
    expect(login).toBe("/login?redirect=%2Fapp%2Fleads%3Fx%3D1");
    const param = new URLSearchParams(login.split("?")[1]).get("redirect");
    expect(safeInternalPath(param, FB)).toBe("/app/leads?x=1");
  });
  it("drops unsafe targets", () => {
    expect(loginPathFor("//evil.com")).toBe("/login");
    expect(loginPathFor("/login")).toBe("/login");
  });
});
