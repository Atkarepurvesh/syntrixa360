// Onboarding pages live outside /app, so no provider has set the active organization on a direct page load.
// Resolve it from the SERVER (/auth/me) and set the API client's X-Organization-ID.
import { getCurrentUser } from "./api/auth";
import { setApiOrganizationId } from "./api/client";

export interface OnboardingOrg {
  organizationId: string;
  organizationName: string;
  role: string;
  organizationStatus: string;
}

/** The organization the user is onboarding (preferred) or their first usable one; null if none. */
export async function ensureOnboardingOrganization(): Promise<OnboardingOrg | null> {
  const me = await getCurrentUser();
  const mine = (me.organizations ?? []).filter((m) => m.status === "active");
  const pick =
    mine.find((m) => m.organizationStatus === "onboarding") ??
    mine.find((m) => (m.organizationStatus ?? "active") === "active");
  if (!pick) return null;
  setApiOrganizationId(pick.organizationId);
  return {
    organizationId: pick.organizationId,
    organizationName: pick.organizationName,
    role: String(pick.role).toUpperCase(),
    organizationStatus: pick.organizationStatus ?? "active",
  };
}
