/**
 * Post-login redirect targets come from the query string (`/login?redirect=...`), i.e. from an attacker-controllable
 * place. Only same-origin, in-app paths under an explicit allow-list are accepted; everything else yields `fallback`.
 * Blocks: absolute / protocol-relative URLs (`//evil.com`, `https://...`), `javascript:`/`data:` schemes, backslash
 * tricks (`/\evil.com`), control characters, over-long values, and in-app paths outside the allow-list (e.g. `/login`,
 * which would create a redirect loop).
 */
const ALLOWED_ROOTS = ["/app", "/onboarding", "/accept-invite"] as const;
const PLACEHOLDER_ORIGIN = "https://app.invalid";
const MAX_LENGTH = 512;

export function safeInternalPath(
  raw: string | null | undefined,
  fallback: string,
): string {
  if (typeof raw !== "string" || raw.length === 0 || raw.length > MAX_LENGTH) {
    return fallback;
  }
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f\\]/.test(raw)) return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//")) return fallback;

  let url: URL;
  try {
    url = new URL(raw, PLACEHOLDER_ORIGIN);
  } catch {
    return fallback;
  }
  if (url.origin !== PLACEHOLDER_ORIGIN) return fallback;

  const path = url.pathname;
  const allowed = ALLOWED_ROOTS.some(
    (root) => path === root || path.startsWith(`${root}/`),
  );
  return allowed ? `${path}${url.search}${url.hash}` : fallback;
}

/** Build `/login?redirect=<current path>` for a protected page the visitor may not see yet. */
export function loginPathFor(currentPath: string): string {
  const safe = safeInternalPath(currentPath, "");
  return safe ? `/login?redirect=${encodeURIComponent(safe)}` : "/login";
}
