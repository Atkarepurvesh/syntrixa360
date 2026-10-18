import type { InvitationDto } from "@/types/api/organization";

/** Effective state of an invitation: a pending one past its expiry is shown as expired. */
export function invitationState(
  i: Pick<InvitationDto, "status" | "expiresAt">,
  now = Date.now(),
): string {
  const s = i.status.toLowerCase();
  return s === "pending" && new Date(i.expiresAt).getTime() <= now
    ? "expired"
    : s;
}
