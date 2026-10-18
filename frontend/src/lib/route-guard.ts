// Authoritative routing: ask the SERVER who the user is and which workspace state they are in, instead of trusting
// React state or any cached flag (which can be stale after an activation in another tab, a removed membership, ...).
import { ApiError } from "@/types/api/common";
import type { AuthUser } from "@/types/api/auth";

import { getCurrentUser } from "./api/auth";
import { postLoginPath, type AppDestination } from "./post-login-route";

export type GuardDecision =
  | { kind: "login" }
  | { kind: "allow"; user: AuthUser }
  | { kind: "redirect"; to: AppDestination; user: AuthUser };

/** Pure part (unit-tested): a fresh /auth/me payload -> allowed to open the app, or where to go instead. */
export function decideAppAccess(user: AuthUser): GuardDecision {
  const to = postLoginPath(user);
  return to === "/app"
    ? { kind: "allow", user }
    : { kind: "redirect", to, user };
}

/**
 * Fetches a fresh /auth/me. 401 (after the client's own refresh attempt failed) => login. Any other failure
 * (network, 5xx) is rethrown so the caller can show a retry instead of redirecting in a loop.
 */
export async function resolveAppAccess(): Promise<GuardDecision> {
  try {
    return decideAppAccess(await getCurrentUser());
  } catch (e) {
    if (e instanceof ApiError && e.kind === "unauthorized") {
      return { kind: "login" };
    }
    throw e;
  }
}
