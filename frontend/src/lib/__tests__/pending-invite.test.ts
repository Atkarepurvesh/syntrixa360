import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  PENDING_INVITE_KEY,
  PENDING_INVITE_TTL_MS,
  clearPendingInvite,
  savePendingInvite,
  takePendingInvite,
} from "../pending-invite";

// Regression (Prompt 3): the token used to live in sessionStorage, so the e-mail verification link (a NEW tab)
// lost it and a freshly signed-up invitee ended up in the create-business wizard instead of the invitation.
function memoryStorage(): Storage {
  const m = new Map<string, string>();
  return {
    get length() {
      return m.size;
    },
    clear: () => m.clear(),
    getItem: (k) => m.get(k) ?? null,
    key: (i) => [...m.keys()][i] ?? null,
    removeItem: (k) => void m.delete(k),
    setItem: (k, v) => void m.set(k, String(v)),
  };
}

describe("pending invitation", () => {
  beforeEach(() => {
    // vitest runs in the node environment (no DOM): give each test fresh in-memory storages.
    vi.stubGlobal("localStorage", memoryStorage());
    vi.stubGlobal("sessionStorage", memoryStorage());
  });

  it("survives a different tab: stored in localStorage, not sessionStorage", () => {
    savePendingInvite("tok-123");
    expect(sessionStorage.getItem(PENDING_INVITE_KEY)).toBeNull();
    expect(takePendingInvite()).toBe("tok-123");
  });

  it("expires after the TTL and is removed", () => {
    savePendingInvite("tok-old", 1_000);
    expect(takePendingInvite(1_000 + PENDING_INVITE_TTL_MS - 1)).toBe(
      "tok-old",
    );
    expect(takePendingInvite(1_000 + PENDING_INVITE_TTL_MS + 1)).toBeNull();
    expect(localStorage.getItem(PENDING_INVITE_KEY)).toBeNull();
  });

  it("can be cleared", () => {
    savePendingInvite("tok-x");
    clearPendingInvite();
    expect(takePendingInvite()).toBeNull();
  });

  it("ignores corrupt or tampered values", () => {
    localStorage.setItem(PENDING_INVITE_KEY, "not-json");
    expect(takePendingInvite()).toBeNull();
    localStorage.setItem(
      PENDING_INVITE_KEY,
      JSON.stringify({ token: 5, savedAt: Date.now() }),
    );
    expect(takePendingInvite()).toBeNull();
    localStorage.setItem(
      PENDING_INVITE_KEY,
      JSON.stringify({ token: "t", savedAt: Date.now() + 10 * 60_000 }),
    );
    expect(takePendingInvite()).toBeNull();
  });
});
