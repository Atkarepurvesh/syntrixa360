// DEV-ONLY in-memory stand-in for the /api/v1 security endpoints, loaded only
// when VITE_SECURITY_API=mock. It exists so the UI can be previewed before the
// backend ships; it is never bundled into a default (HTTP) build path.
import type {
  EventStatus,
  SecurityEventDTO,
  SessionDTO,
  SessionStatus,
} from "./security-api";
import { SecurityApiError } from "./security-api";

const ago = (min: number) => new Date(Date.now() - min * 60_000).toISOString();
const mk = (
  id: string,
  device: string,
  device_type: SessionDTO["device_type"],
  browser: string,
  os: string,
  min: number,
  status: SessionStatus,
  cur = false,
): SessionDTO => ({
  id,
  device,
  device_type,
  browser,
  operating_system: os,
  location: "India",
  ip_address_masked: "103.21.xxx.xxx",
  authentication_method: "Email + Password",
  created_at: ago(min + 180),
  last_active_at: ago(min),
  expires_at: null,
  status,
  is_current: cur,
});
let sessions: SessionDTO[] = [
  mk(
    "s1",
    "Windows Desktop",
    "desktop",
    "Chrome",
    "Windows 11",
    0,
    "active",
    true,
  ),
  mk(
    "s2",
    "Android Phone",
    "mobile",
    "Chrome",
    "Android 14",
    10,
    "recently_active",
  ),
  mk(
    "s3",
    "Windows Laptop",
    "desktop",
    "Edge",
    "Windows 11",
    120,
    "recently_active",
  ),
  mk("s4", "Mac Desktop", "desktop", "Safari", "macOS 14", 1700, "active"),
];
const ev = (
  id: string,
  event_type: string,
  status: EventStatus,
  min: number,
  extra: Partial<SecurityEventDTO> = {},
): SecurityEventDTO => ({
  id,
  event_type,
  status,
  source: "authentication",
  device: "Windows Desktop",
  browser: "Chrome",
  operating_system: "Windows 11",
  location: "India",
  ip_address_masked: "103.21.xxx.xxx",
  authentication_method: "Email + Password",
  description: null,
  created_at: ago(min),
  ...extra,
});
const events = [
  ev("e1", "AUTH_LOGIN_SUCCESS", "success", 5),
  ev("e2", "AUTH_PASSWORD_CHANGED", "success", 90, { source: "user" }),
  ev("e3", "AUTH_LOGIN_FAILED", "failed", 1500, {
    device: "Android Phone",
    operating_system: "Android 14",
    attempt_count: 3,
  }),
  ev("e4", "AUTH_2FA_ENABLED", "success", 9000, { source: "user" }),
  ev("e5", "AUTH_SESSION_REVOKED", "success", 12000, { source: "user" }),
];
const page = <T>(all: T[], p: Params) => {
  const n = Number(p["page_size"]) || 20,
    pg = Number(p["page"]) || 1;
  return {
    items: all.slice((pg - 1) * n, pg * n),
    total: all.length,
    page: pg,
    page_size: n,
  };
};
type Params = Record<string, string | number | undefined>;

// ---- account / identities / org / team (dev preview only) ----
const emailVerified = true;
let tfa = true,
  pwChanged = ago(60 * 24 * 30);
let idents = [
  {
    id: "i1",
    provider: "google",
    email_masked: "a***@gmail.com",
    status: "connected",
    connected_at: ago(60 * 24 * 40),
    can_disconnect: true,
  },
];
let policy: Record<string, number | boolean> = {
  min_password_length: 8,
  password_complexity: true,
  two_factor_required: false,
  idle_timeout_minutes: 30,
  max_active_sessions: 5,
};
const members = [
  {
    id: "m1",
    name: "Priya Nair",
    account_status: "active",
    two_factor_enabled: true,
    last_login_at: ago(40),
    active_sessions: 2,
  },
  {
    id: "m2",
    name: "Rahul Verma",
    account_status: "active",
    two_factor_enabled: false,
    last_login_at: ago(600),
    active_sessions: 1,
  },
  {
    id: "m3",
    name: "Neha Singh",
    account_status: "suspended",
    two_factor_enabled: false,
    last_login_at: null,
    active_sessions: 0,
  },
];
const bad = (status: number, code: string) =>
  new SecurityApiError(status, code, "err");

async function accountRequest<T>(
  method: string,
  path: string,
  body: Record<string, string> | undefined,
): Promise<T | undefined> {
  const o = (v: unknown) => v as T;
  if (path === "/auth/password/change") {
    if (body?.["current_password"] !== "Current@123")
      throw bad(400, "INVALID_CURRENT_PASSWORD");
    pwChanged = ago(0);
    return o(undefined);
  }
  if (path === "/auth/2fa/setup")
    return o({ secret: "JBSWY3DPEHPK3PXP", qr_data_uri: null });
  if (path === "/auth/2fa/verify") {
    if (body?.["code"] !== "123456") throw bad(400, "INVALID_CODE");
    tfa = true;
    return o({
      recovery_codes: ["a1b2-c3d4", "e5f6-g7h8", "i9j0-k1l2", "m3n4-o5p6"],
    });
  }
  if (path === "/auth/2fa/disable") {
    if (body?.["code"] !== "123456") throw bad(400, "INVALID_CODE");
    tfa = false;
    return o(undefined);
  }
  if (path === "/auth/email/verification/resend") {
    return o(undefined);
  }
  if (path === "/auth/identities")
    return o({ items: idents, available_providers: ["google", "microsoft"] });
  const im = path.match(/^\/auth\/identities\/([^/]+)\/disconnect$/);
  if (im) {
    idents = idents.filter((i) => i.id !== im[1]);
    return o(undefined);
  }
  if (path === "/security/organization" && method === "GET")
    return o({
      policy,
      domains: [
        {
          domain: "abcpharma.com",
          status: "verified",
          verified_at: ago(60 * 24 * 90),
        },
      ],
      capabilities: { can_manage_policies: true },
    });
  if (path === "/security/organization/policies") {
    policy = {
      ...policy,
      ...(body as unknown as Record<string, number | boolean>),
    };
    return o(policy);
  }
  if (path === "/security/team")
    return o({
      summary: {
        members: 24,
        active: 20,
        inactive: 1,
        pending_invitations: 3,
        suspended: 1,
        two_factor_enabled: 18,
        two_factor_disabled: 6,
        recent_failed_logins: 2,
      },
      items: members,
      total: members.length,
      page: 1,
      page_size: 20,
    });
  const tm = path.match(/^\/security\/team\/members\/([^/]+)$/);
  if (tm)
    return o({
      ...members.find((m) => m.id === tm[1]),
      recent_events: events.slice(0, 2),
    });
  return undefined;
}

export async function mockRequest<T>(
  method: string,
  path: string,
  p: Params,
  body?: unknown,
): Promise<T> {
  await new Promise((r) => setTimeout(r, 250));
  const acc = await accountRequest<T>(
    method,
    path,
    body as Record<string, string> | undefined,
  );
  if (
    acc !== undefined ||
    path.startsWith("/auth/password") ||
    path.startsWith("/auth/2fa/disable") ||
    path === "/auth/email/verification/resend" ||
    /^\/auth\/identities\/[^/]+\/disconnect$/.test(path)
  )
    return acc as T;
  const out = (v: unknown) => v as T;
  if (path === "/auth/sessions" && method === "GET") {
    const q = String(p["search"] ?? "").toLowerCase();
    const live = sessions.filter(
      (s) => s.status === "active" || s.status === "recently_active",
    );
    const rows = sessions.filter(
      (s) =>
        (!p["status"] || p["status"] === "all" || s.status === p["status"]) &&
        (!p["device_type"] ||
          p["device_type"] === "all" ||
          s.device_type === p["device_type"]) &&
        (!q ||
          `${s.device} ${s.browser} ${s.operating_system} ${s.location}`
            .toLowerCase()
            .includes(q)),
    );
    return out({
      ...page(rows, p),
      summary: {
        active_count: live.length,
        recent_count: live.filter(
          (s) => Date.now() - +new Date(s.last_active_at) < 864e5,
        ).length,
        other_count: live.filter((s) => !s.is_current).length,
      },
      capabilities: { can_revoke: true, can_revoke_others: true },
    });
  }
  if (path === "/auth/sessions/revoke-others") {
    if (!(body as { password?: string })?.password)
      throw new SecurityApiError(
        403,
        "REAUTH_REQUIRED",
        "Re-authentication required",
      );
    const n = sessions.filter(
      (s) => !s.is_current && s.status !== "revoked",
    ).length;
    sessions = sessions.map((s) =>
      s.is_current ? s : { ...s, status: "revoked" as const },
    );
    return out({ revoked_count: n });
  }
  const m = path.match(/^\/auth\/sessions\/([^/]+)(\/revoke)?$/);
  if (m) {
    const s = sessions.find((x) => x.id === m[1]);
    if (!s) throw new SecurityApiError(404, "NOT_FOUND", "Not found");
    if (m[2]) {
      sessions = sessions.map((x) =>
        x.id === s.id ? { ...x, status: "revoked" as const } : x,
      );
      return out(undefined);
    }
    return out(s);
  }
  if (path === "/security/events") {
    const q = String(p["search"] ?? "").toLowerCase();
    const rows = events.filter(
      (e) =>
        (!p["status"] || p["status"] === "all" || e.status === p["status"]) &&
        (!q ||
          `${e.event_type} ${e.device} ${e.browser} ${e.location}`
            .toLowerCase()
            .includes(q)),
    );
    return out(page(p["sort"] === "oldest" ? [...rows].reverse() : rows, p));
  }
  const em = path.match(/^\/security\/events\/([^/]+)$/);
  if (em) return out(events.find((e) => e.id === em[1]));
  if (path === "/security/summary") {
    return out({
      recent_events: events.length,
      successful_logins: 1,
      failed_logins: 1,
      open_alerts: 0,
      status: "secure",
      status_message: "No unresolved security events require your attention.",
      alerts: [],
      two_factor_enabled: tfa,
      two_factor_methods: ["authenticator"],
      password: {
        configured: true,
        last_changed_at: pwChanged,
        policy: {
          min_length: 8,
          require_upper: true,
          require_lower: true,
          require_number: true,
          require_special: true,
        },
      },
      email: { masked: "a***@syntrixa360.com", verified: emailVerified },
      recovery_configured: tfa,
      connected_accounts: idents.length,
      recommendations: [
        ...(tfa
          ? []
          : [
              {
                id: "r1",
                title: "Enable two-factor authentication",
                description:
                  "Add an additional layer of protection to your account.",
                priority: "medium",
                status: "recommended",
                action: "enable_2fa",
              },
            ]),
        {
          id: "r2",
          title: "Review active sessions",
          description: "Sign out devices you no longer use.",
          priority: "low",
          status: "recommended",
          action: "review_sessions",
        },
      ],
      capabilities: {
        can_export: false,
        can_view_org: false,
        can_view_team_security: true,
        can_view_org_security: true,
        can_view_audit_logs: false,
      },
    });
  }
  throw new SecurityApiError(404, "NOT_FOUND", "Not found");
}
