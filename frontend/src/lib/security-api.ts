// Security API client (Active Sessions + Security Activity).
//
// Talks to the real backend under /api/v1 using the cookie-based session of
// the signed-in user. The server decides identity, organisation scope and
// permissions; nothing here sends organization_id. Responses are the safe DTOs
// only (masked IP, no tokens/secrets) — the UI never receives anything else.
//
// Dev preview only: set VITE_SECURITY_API=mock to use the in-memory adapter in
// security-api.mock.ts (see .env.development). Production builds use HTTP.

export type SessionStatus =
  "active" | "recently_active" | "expired" | "revoked" | "signed_out";
export type EventStatus =
  "success" | "failed" | "blocked" | "warning" | "resolved" | "pending";
export type DeviceType = "desktop" | "mobile" | "tablet" | "unknown";

export interface SessionDTO {
  id: string;
  device: string;
  device_type: DeviceType;
  browser: string;
  operating_system: string;
  location: string | null;
  ip_address_masked: string | null;
  authentication_method: string | null;
  created_at: string;
  last_active_at: string;
  expires_at: string | null;
  status: SessionStatus;
  is_current: boolean;
  /** Team view only: whose session this is. */
  member?: string | null;
  /** Set by the backend's own detection only — never inferred in the UI. */
  flagged_unrecognized?: boolean;
}

export interface SessionListResponse {
  items: SessionDTO[];
  total: number;
  page: number;
  page_size: number;
  summary: { active_count: number; recent_count: number; other_count: number };
  /** What the backend allows this user to do. UI hides actions accordingly. */
  capabilities: {
    can_revoke: boolean;
    can_revoke_others: boolean;
    can_view_team?: boolean;
  };
}

export interface SecurityEventDTO {
  id: string;
  event_type: string;
  status: EventStatus;
  source: string | null;
  device: string | null;
  browser: string | null;
  operating_system: string | null;
  location: string | null;
  ip_address_masked: string | null;
  authentication_method: string | null;
  description: string | null;
  attempt_count?: number | null;
  created_at: string;
}

export interface SecurityEventListResponse {
  items: SecurityEventDTO[];
  total: number;
  page: number;
  page_size: number;
}

export interface SecuritySummaryResponse {
  recent_events: number;
  successful_logins: number;
  failed_logins: number;
  open_alerts: number;
  status: "secure" | "attention_required" | "action_required";
  status_message: string;
  alerts: SecurityEventDTO[];
  two_factor_enabled?: boolean | null;
  /** Authenticator-style 2FA is offered only if "authenticator" is listed here. */
  two_factor_methods?: string[];
  password?: {
    configured: boolean;
    last_changed_at?: string | null;
    policy?: PasswordPolicy;
  };
  email?: { masked: string; verified: boolean };
  recovery_configured?: boolean | null;
  connected_accounts?: number;
  recommendations?: Recommendation[];
  retention_note?: string | null;
  capabilities: {
    can_export: boolean;
    can_view_org?: boolean;
    can_manage_account?: boolean;
    can_view_team_security?: boolean;
    can_view_org_security?: boolean;
    can_view_audit_logs?: boolean;
  };
}

export interface PasswordPolicy {
  min_length?: number;
  require_upper?: boolean;
  require_lower?: boolean;
  require_number?: boolean;
  require_special?: boolean;
}
export interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  status: "recommended" | "completed" | "action_required";
  action?:
    | "enable_2fa"
    | "verify_email"
    | "change_password"
    | "review_sessions"
    | "review_connected_accounts";
}
export interface IdentityDTO {
  id: string;
  provider: string;
  email_masked: string | null;
  status: string;
  connected_at: string;
  can_disconnect: boolean;
}
export interface IdentitiesResponse {
  items: IdentityDTO[];
  available_providers: string[];
}
export interface TwoFactorSetup {
  secret: string;
  qr_data_uri?: string | null;
}
export interface OrgPolicy {
  min_password_length?: number;
  password_complexity?: boolean;
  two_factor_required?: boolean;
  idle_timeout_minutes?: number;
  max_session_hours?: number;
  max_active_sessions?: number;
}
export interface DomainDTO {
  domain: string;
  status: string;
  verified_at?: string | null;
}
export interface OrgSecurityResponse {
  policy: OrgPolicy;
  domains: DomainDTO[];
  capabilities: { can_manage_policies: boolean };
}
export interface TeamMemberSecurity {
  id: string;
  name: string;
  account_status: string;
  two_factor_enabled: boolean | null;
  last_login_at: string | null;
  active_sessions: number | null;
}
export interface TeamSecurityResponse {
  summary: {
    members: number;
    active: number;
    inactive: number;
    pending_invitations: number;
    suspended: number;
    two_factor_enabled: number;
    two_factor_disabled: number;
    recent_failed_logins: number;
  };
  items: TeamMemberSecurity[];
  total: number;
  page: number;
  page_size: number;
}
export interface TeamMemberDetail extends TeamMemberSecurity {
  recent_events: SecurityEventDTO[];
}

export interface SessionQuery {
  page: number;
  page_size: number;
  status?: string | undefined;
  device_type?: string | undefined;
  browser?: string | undefined;
  last_active?: string | undefined;
  search?: string | undefined;
  sort?: "newest" | "oldest" | undefined;
}

export interface EventQuery {
  page: number;
  page_size: number;
  /** "organization" only when the backend granted org-level access; the server re-checks. */
  scope?: string | undefined;
  event_group?: string | undefined;
  status?: string | undefined;
  source?: string | undefined;
  device_type?: string | undefined;
  search?: string | undefined;
  start_date?: string | undefined;
  end_date?: string | undefined;
  sort?: "newest" | "oldest" | undefined;
}

export class SecurityApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

type Params = Record<string, string | number | undefined>;

function toQuery(params?: Params) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params ?? {})) {
    if (v !== undefined && v !== "" && v !== "all") sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

async function httpRequest<T>(
  method: string,
  path: string,
  params?: Params,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`/api/v1${path}${toQuery(params)}`, {
    method,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    // Never surface raw server text — only a stable machine code from the API.
    let code = "UNKNOWN";
    try {
      const j = (await res.json()) as { code?: string };
      if (typeof j.code === "string") code = j.code;
    } catch {
      /* non-JSON error body: ignore */
    }
    if (res.status === 401 && typeof window !== "undefined") {
      window.location.assign("/login?reason=session_expired");
    }
    throw new SecurityApiError(res.status, code, "Request failed");
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

async function request<T>(
  method: string,
  path: string,
  params?: Params,
  body?: unknown,
): Promise<T> {
  if (import.meta.env["VITE_SECURITY_API"] === "mock") {
    const { mockRequest } = await import("./security-api.mock");
    return mockRequest<T>(method, path, params ?? {}, body);
  }
  return httpRequest<T>(method, path, params, body);
}

async function downloadEvents(q: Omit<EventQuery, "page" | "page_size">) {
  const res = await fetch(
    `/api/v1/security/events/export${toQuery({ ...q, format: "csv" })}`,
    { credentials: "include" },
  );
  if (!res.ok)
    throw new SecurityApiError(res.status, "EXPORT_FAILED", "Export failed");
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement("a");
  a.href = url;
  a.download = "security-activity.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export const securityApi = {
  changePassword: (current_password: string, new_password: string) =>
    request<void>("POST", "/auth/password/change", undefined, {
      current_password,
      new_password,
    }),
  twoFactorSetup: () =>
    request<TwoFactorSetup>("POST", "/auth/2fa/setup", undefined, {}),
  twoFactorVerify: (code: string) =>
    request<{ recovery_codes?: string[] }>(
      "POST",
      "/auth/2fa/verify",
      undefined,
      { code },
    ),
  twoFactorDisable: (code: string) =>
    request<void>("POST", "/auth/2fa/disable", undefined, { code }),
  resendVerification: () =>
    request<void>("POST", "/auth/email/verification/resend", undefined, {}),
  listIdentities: () => request<IdentitiesResponse>("GET", "/auth/identities"),
  disconnectIdentity: (id: string) =>
    request<void>(
      "POST",
      `/auth/identities/${encodeURIComponent(id)}/disconnect`,
      undefined,
      {},
    ),
  /** OAuth connect is a full-page redirect owned by the backend. */
  connectIdentity: (provider: string) =>
    window.location.assign(
      `/api/v1/auth/identities/${encodeURIComponent(provider)}/connect`,
    ),
  getOrganization: () =>
    request<OrgSecurityResponse>("GET", "/security/organization"),
  updatePolicies: (patch: OrgPolicy) =>
    request<OrgPolicy>(
      "PATCH",
      "/security/organization/policies",
      undefined,
      patch,
    ),
  getTeam: (page: number, page_size: number) =>
    request<TeamSecurityResponse>("GET", "/security/team", { page, page_size }),
  getTeamMember: (id: string) =>
    request<TeamMemberDetail>(
      "GET",
      `/security/team/members/${encodeURIComponent(id)}`,
    ),
  listTeamSessions: (q: SessionQuery) =>
    request<
      SessionListResponse & { capabilities: { can_revoke_team?: boolean } }
    >("GET", "/auth/sessions/team", { ...q }),
  exportEvents: downloadEvents,
  listSessions: (q: SessionQuery) =>
    request<SessionListResponse>("GET", "/auth/sessions", { ...q }),
  getSession: (id: string) =>
    request<SessionDTO>("GET", `/auth/sessions/${encodeURIComponent(id)}`),
  revokeSession: (id: string) =>
    request<void>(
      "POST",
      `/auth/sessions/${encodeURIComponent(id)}/revoke`,
      undefined,
      {},
    ),
  /** `password` is only sent after the backend answers REAUTH_REQUIRED. */
  revokeOthers: (password?: string) =>
    request<{ revoked_count: number }>(
      "POST",
      "/auth/sessions/revoke-others",
      undefined,
      password ? { password } : {},
    ),
  listEvents: (q: EventQuery) =>
    request<SecurityEventListResponse>("GET", "/security/events", { ...q }),
  getEvent: (id: string) =>
    request<SecurityEventDTO>(
      "GET",
      `/security/events/${encodeURIComponent(id)}`,
    ),
  getSummary: () =>
    request<SecuritySummaryResponse>("GET", "/security/summary"),
};
