import { describe, expect, it } from "vitest";

import { invitationState } from "../invitation-state";

const now = Date.parse("2026-10-10T00:00:00Z");
const future = "2026-10-20T00:00:00Z";
const past = "2026-10-01T00:00:00Z";

describe("invitationState", () => {
  it("pending and in date -> pending", () =>
    expect(invitationState({ status: "pending", expiresAt: future }, now)).toBe(
      "pending",
    ));
  it("pending past expiry -> expired (never offered a Revoke button as live)", () =>
    expect(invitationState({ status: "PENDING", expiresAt: past }, now)).toBe(
      "expired",
    ));
  it("accepted/revoked stay as the server says, even if the date has passed", () => {
    expect(invitationState({ status: "accepted", expiresAt: past }, now)).toBe(
      "accepted",
    );
    expect(invitationState({ status: "revoked", expiresAt: past }, now)).toBe(
      "revoked",
    );
  });
});
