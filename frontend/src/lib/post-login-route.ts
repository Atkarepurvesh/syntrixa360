import type { AuthUser } from "@/types/api/auth";

export type AppDestination = "/onboarding/business" | "/app";

/**
 * Where a signed-in user belongs, from their memberships as reported by the SERVER (`GET /auth/me`):
 *  - any usable workspace -> the app. Usable = an active membership in an organization that is active,
 *    suspended or archived (suspended/archived stay reachable: read-only product rule, the backend serves reads);
 *  - otherwise (unfinished onboarding, or no valid organization at all) -> the setup wizard, which resumes at the
 *    first incomplete section (or creates the organization on the first save).
 * A membership that is not itself active never counts. An absent organizationStatus means "active" (backend default).
 *
 * (Merge note: structure/AppDestination/null handling from v4-phase2b; the "archived stays reachable" rule is from
 *  v5-prompt3-verified, which was checked against the live backend.)
 */
export function postLoginPath(
  user: Pick<AuthUser, "organizations"> | null,
): AppDestination {
  const usable = (user?.organizations ?? []).filter(
    (m) =>
      m.status === "active" &&
      ["active", "suspended", "archived"].includes(
        m.organizationStatus ?? "active",
      ),
  );
  return usable.length > 0 ? "/app" : "/onboarding/business";
}
