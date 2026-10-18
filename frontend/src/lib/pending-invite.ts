/**
 * Invitation token to resume after the invitee signs in.
 *
 * Stored in localStorage (not sessionStorage) because the usual path is: open invite link -> create account ->
 * click the verification link in the e-mail, which opens a NEW tab where sessionStorage is empty. The token is
 * only usable by the invited e-mail address and expires server-side, and we additionally drop it after
 * PENDING_INVITE_TTL_MS. It is cleared once accepted, on a definitive rejection, or when the user opts out.
 */
export const PENDING_INVITE_KEY = "syntrixa360.pendingInvite";
export const PENDING_INVITE_TTL_MS = 24 * 60 * 60 * 1000;

export function savePendingInvite(
  token: string,
  now: number = Date.now(),
): void {
  try {
    localStorage.setItem(
      PENDING_INVITE_KEY,
      JSON.stringify({ token, savedAt: now }),
    );
  } catch {
    /* storage unavailable: the user can click the e-mail link again after signing in */
  }
}

export function takePendingInvite(now: number = Date.now()): string | null {
  try {
    const raw = localStorage.getItem(PENDING_INVITE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    const rec = parsed as { token?: unknown; savedAt?: unknown } | null;
    if (
      !rec ||
      typeof rec.token !== "string" ||
      typeof rec.savedAt !== "number" ||
      now - rec.savedAt > PENDING_INVITE_TTL_MS ||
      rec.savedAt > now + 60_000
    ) {
      localStorage.removeItem(PENDING_INVITE_KEY);
      return null;
    }
    return rec.token;
  } catch {
    return null;
  }
}

export function clearPendingInvite(): void {
  try {
    localStorage.removeItem(PENDING_INVITE_KEY);
  } catch {
    /* ignore */
  }
}
