import {
  ApiError,
  type ApiErrorKind,
  type ApiErrorBody,
  type ApiSuccessResponse,
  type FieldError,
} from "@/types/api/common";

import { toCamel, toSnake } from "./case";

const DEFAULT_TIMEOUT_MS = 15_000;

function baseUrl(): string {
  const url = import.meta.env["VITE_API_URL"] as string | undefined;
  if (!url) {
    throw new ApiError({
      status: 0,
      code: "CONFIG_MISSING",
      message: "VITE_API_URL is not configured.",
      kind: "unknown",
    });
  }
  return url.replace(/\/+$/, "");
}

// ---------------------------------------------------------------------------
// Token handling. The access token lives in memory only (never localStorage).
// The refresh token is expected to be an httpOnly cookie (credentials:
// "include"); if the backend returns it in the body we keep it in memory too.
// ---------------------------------------------------------------------------

let accessToken: string | null = null;
let refreshTokenInMemory: string | null = null;
let onAuthFailure: (() => void) | null = null;

// The backend returns the refresh token in the JSON body (no cookie flow yet).
// The access token stays in memory only. The refresh token is kept in
// sessionStorage (per-tab, cleared when the tab closes) so a page reload does
// not log the user out. Trade-off: readable by injected JS (XSS). Recommended
// hardening: move the refresh token to an httpOnly cookie in the backend.
const REFRESH_KEY = "syntrixa360.refresh";

// Active organization for X-Organization-ID. UX state only: the backend re-verifies
// membership + permissions in the database on EVERY request.
let activeOrganizationId: string | null = null;
export function setActiveOrganizationId(id: string | null) {
  activeOrganizationId = id;
}
export function getActiveOrganizationId(): string | null {
  return activeOrganizationId;
}

function readStoredRefresh(): string | null {
  try {
    return sessionStorage.getItem(REFRESH_KEY);
  } catch {
    return null;
  }
}
function writeStoredRefresh(v: string | null) {
  try {
    if (v) sessionStorage.setItem(REFRESH_KEY, v);
    else sessionStorage.removeItem(REFRESH_KEY);
  } catch {
    /* storage unavailable (SSR / private mode): in-memory only */
  }
}

export function hasStoredSession(): boolean {
  return refreshTokenInMemory !== null || readStoredRefresh() !== null;
}

export function setTokens(tokens: {
  accessToken: string;
  refreshToken?: string | undefined;
}) {
  accessToken = tokens.accessToken;
  if (tokens.refreshToken) {
    refreshTokenInMemory = tokens.refreshToken;
    writeStoredRefresh(tokens.refreshToken);
  }
}

export function clearTokens() {
  setApiOrganizationId(null);
  accessToken = null;
  refreshTokenInMemory = null;
  writeStoredRefresh(null);
}

export function getRefreshToken(): string | null {
  return refreshTokenInMemory ?? readStoredRefresh();
}

export function getAccessToken(): string | null {
  return accessToken;
}

// ---------------------------------------------------------------------------
// Active organization. Organization-scoped endpoints (onboarding, ...) need the
// `X-Organization-ID` header; the backend re-checks membership + permission on
// every request, so this is routing information, not an authorisation claim.
// ---------------------------------------------------------------------------
const ORG_HEADER_KEY = "syntrixa360.api.organization";
// Explicit override used by the onboarding wizard (the organization may not be in the
// provider's list yet). When null, the OrganizationProvider's active organization is used.
let organizationOverride: string | null = null;

export function setApiOrganizationId(id: string | null) {
  organizationOverride = id;
  try {
    if (id) sessionStorage.setItem(ORG_HEADER_KEY, id);
    else sessionStorage.removeItem(ORG_HEADER_KEY);
  } catch {
    /* storage unavailable: keep it in memory only */
  }
}

/** Organization sent as X-Organization-ID: onboarding override first, then the active organization. */
export function getApiOrganizationId(): string | null {
  if (organizationOverride) return organizationOverride;
  if (activeOrganizationId) return activeOrganizationId;
  try {
    return sessionStorage.getItem(ORG_HEADER_KEY);
  } catch {
    return null;
  }
}

/** Called once when refresh fails; the auth layer clears state and redirects. */
export function setAuthFailureHandler(fn: (() => void) | null) {
  onAuthFailure = fn;
}

// ---------------------------------------------------------------------------
// Error parsing
// ---------------------------------------------------------------------------

function kindFromStatus(status: number): ApiErrorKind {
  if (status === 401) return "unauthorized";
  if (status === 403) return "forbidden";
  if (status === 404) return "not_found";
  if (status === 409) return "conflict";
  if (status === 422 || status === 400) return "validation";
  if (status === 429) return "rate_limited";
  if (status === 503) return "unavailable";
  if (status >= 500) return "server";
  return "unknown";
}

const FRIENDLY: Record<ApiErrorKind, string> = {
  network: "Unable to connect to Syntrixa360 server.",
  timeout: "The server took too long to respond. Please try again.",
  unauthorized: "Your session has expired. Please sign in again.",
  forbidden: "You don't have permission to do that.",
  not_found: "We couldn't find what you were looking for.",
  conflict: "That conflicts with existing data. Please refresh and try again.",
  validation: "Please check the highlighted fields and try again.",
  rate_limited: "Too many requests. Please wait a moment and try again.",
  server: "Something went wrong on our side. Please try again.",
  unavailable:
    "The service is temporarily unavailable. Please try again shortly.",
  unknown: "Something went wrong. Please try again.",
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function extractFieldErrors(details: unknown): FieldError[] {
  // Backend: details is a list [{field, message, type}] for 422 validation errors.
  // (Also tolerate the older {errors: [...]} / {fields: [...]} shapes.)
  let list: unknown = details;
  if (isRecord(details) && !Array.isArray(details)) {
    list = details["errors"] ?? details["fields"];
  }
  if (!Array.isArray(list)) return [];
  const out: FieldError[] = [];
  for (const item of list) {
    if (isRecord(item) && typeof item["message"] === "string") {
      const field = typeof item["field"] === "string" ? item["field"] : "";
      out.push({
        field: field.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase()),
        message: item["message"],
      });
    }
  }
  return out;
}

async function parseError(res: Response): Promise<ApiError> {
  const kind = kindFromStatus(res.status);
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  const raw = isRecord(body) ? body["error"] : null;
  const err: Partial<ApiErrorBody> | null = isRecord(raw)
    ? (raw as Partial<ApiErrorBody>)
    : null;
  const code =
    err && typeof err.code === "string" ? err.code : `HTTP_${res.status}`;
  // 5xx messages are never surfaced raw (could leak internals); 4xx backend
  // messages are written for users, so they are passed through.
  const message =
    err && typeof err.message === "string" && res.status < 500
      ? err.message
      : FRIENDLY[kind];
  return new ApiError({
    status: res.status,
    code,
    message,
    kind,
    details: isRecord(err?.details)
      ? (err?.details as Record<string, unknown>)
      : undefined,
    fieldErrors: extractFieldErrors(err?.details),
  });
}

// ---------------------------------------------------------------------------
// Refresh (single-flight)
// ---------------------------------------------------------------------------

let refreshInFlight: Promise<boolean> | null = null;

async function doRefresh(): Promise<boolean> {
  const rt = getRefreshToken();
  if (!rt) return false;
  try {
    const res = await fetch(`${baseUrl()}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ refresh_token: rt }),
    });
    if (!res.ok) return false;
    // Backend returns a raw TokenResponse (no {success,data} envelope).
    const json = toCamel<{ accessToken?: string; refreshToken?: string }>(
      await res.json(),
    );
    if (!json.accessToken) return false;
    setTokens({
      accessToken: json.accessToken,
      refreshToken: json.refreshToken,
    });
    return true;
  } catch {
    return false;
  }
}

/** All concurrent 401s share one refresh request. */
export function refreshSession(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = doRefresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

// ---------------------------------------------------------------------------
// Core request
// ---------------------------------------------------------------------------

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestOptions {
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  timeoutMs?: number;
  signal?: AbortSignal | undefined;
  /** Skip auth header and 401-refresh (login, register, refresh itself). */
  skipAuth?: boolean;
  /** Do not send X-Organization-ID (e.g. POST /onboarding/business, which creates the organization). */
  skipOrganization?: boolean;
}

const NO_REFRESH_PATHS = ["/auth/login", "/auth/register", "/auth/refresh"];

async function send(
  method: Method,
  path: string,
  opts: RequestOptions,
): Promise<Response> {
  const url = new URL(`${baseUrl()}${path}`);
  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      if (v !== undefined) url.searchParams.set(k, String(v));
    }
  }
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort("timeout"),
    opts.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  );
  opts.signal?.addEventListener("abort", () =>
    controller.abort(opts.signal?.reason),
  );

  const headers: Record<string, string> = { Accept: "application/json" };
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  if (!opts.skipAuth && accessToken)
    headers["Authorization"] = `Bearer ${accessToken}`;
  const orgId = opts.skipAuth || opts.skipOrganization ? null : getApiOrganizationId();
  if (orgId) headers["X-Organization-ID"] = orgId;

  try {
    return await fetch(url, {
      method,
      headers,
      credentials: "include",
      signal: controller.signal,
      ...(opts.body !== undefined
        ? { body: JSON.stringify(toSnake(opts.body)) }
        : {}),
    });
  } catch (e) {
    const timedOut =
      controller.signal.aborted && controller.signal.reason === "timeout";
    throw new ApiError({
      status: 0,
      code: timedOut ? "TIMEOUT" : "NETWORK_ERROR",
      message: FRIENDLY[timedOut ? "timeout" : "network"],
      kind: timedOut ? "timeout" : "network",
      details: undefined,
    });
  } finally {
    clearTimeout(timer);
  }
}

async function request<T>(
  method: Method,
  path: string,
  opts: RequestOptions = {},
): Promise<T> {
  let res = await send(method, path, opts);

  if (
    res.status === 401 &&
    !opts.skipAuth &&
    !NO_REFRESH_PATHS.includes(path)
  ) {
    const ok = await refreshSession();
    if (!ok) {
      clearTokens();
      onAuthFailure?.();
      throw await parseError(res);
    }
    res = await send(method, path, opts); // retried exactly once
    if (res.status === 401) {
      clearTokens();
      onAuthFailure?.();
    }
  }

  if (!res.ok) throw await parseError(res);
  if (res.status === 204) return undefined as T;

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    throw new ApiError({
      status: res.status,
      code: "INVALID_RESPONSE",
      message: FRIENDLY.server,
      kind: "server",
    });
  }
  if (isRecord(json) && json["success"] === true && "data" in json) {
    return toCamel<T>((json as unknown as ApiSuccessResponse<T>).data);
  }
  // Backend returns token responses (/auth/login, /auth/refresh) without the envelope.
  if (isRecord(json) && typeof json["access_token"] === "string") {
    return toCamel<T>(json);
  }
  if (isRecord(json) && json["success"] === false) {
    throw new ApiError({
      status: res.status,
      code: "API_ERROR",
      message: FRIENDLY.server,
      kind: "server",
    });
  }
  throw new ApiError({
    status: res.status,
    code: "INVALID_RESPONSE",
    message: FRIENDLY.server,
    kind: "server",
  });
}

export const api = {
  get: <T>(path: string, opts?: Omit<RequestOptions, "body">) =>
    request<T>("GET", path, opts),
  post: <T>(
    path: string,
    body?: unknown,
    opts?: Omit<RequestOptions, "body">,
  ) => request<T>("POST", path, { ...opts, body }),
  put: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, "body">) =>
    request<T>("PUT", path, { ...opts, body }),
  patch: <T>(
    path: string,
    body?: unknown,
    opts?: Omit<RequestOptions, "body">,
  ) => request<T>("PATCH", path, { ...opts, body }),
  delete: <T>(path: string, opts?: Omit<RequestOptions, "body">) =>
    request<T>("DELETE", path, opts),
};
