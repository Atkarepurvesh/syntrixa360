/**
 * Channel & Integration data layer — Part 3 (Connect Your Channels).
 *
 * This mirrors the same pattern as the other `lib/*-data.ts` files in this
 * project (crm-data.ts, leads-data.ts, etc.): typed mock data + small
 * "service" functions that simulate an async backend. There is no real
 * server yet, so `connect*`, `test*`, `reconnect*` and `disconnect*` below
 * simulate network latency and return realistic success/error payloads that
 * a real API (see the endpoint list in the Part 3 spec) would return.
 *
 * When a real backend exists, only this file needs to be swapped out — the
 * UI components consume the same shape (ChannelConnection, TestResult, …)
 * regardless of where the data comes from.
 */

export type ChannelType = "WHATSAPP" | "EMAIL_SMTP" | "WEBSITE" | "OUTLOOK";

export type ChannelStatus =
  | "NOT_CONNECTED"
  | "CONNECTING"
  | "CONNECTED"
  | "ACTION_REQUIRED"
  | "CONNECTION_ERROR"
  | "DISCONNECTED"
  | "REAUTHORIZATION_REQUIRED";

export type ChannelHealth = "HEALTHY" | "WARNING" | "ERROR" | "DISCONNECTED" | "REAUTH_REQUIRED";

export interface ChannelConnection {
  connectionId: string;
  organizationId: string;
  channelType: ChannelType;
  provider: string;
  accountIdentifier: string | null;
  displayName: string | null;
  status: ChannelStatus;
  healthStatus: ChannelHealth;
  connectedAt: string | null;
  lastCheckedAt: string | null;
  lastSyncAt: string | null;
  disconnectedAt: string | null;
  meta: Record<string, string>;
}

export interface TestResult {
  status: "CONNECTED" | "CONNECTION_ERROR";
  health: ChannelHealth;
  errorCode?: string;
  userFriendlyMessage: string;
  checkedAt: string;
}

export interface ChannelAuditEvent {
  id: string;
  type:
    | "CHANNEL_CONNECTION_STARTED"
    | "CHANNEL_CONNECTED"
    | "CHANNEL_TESTED"
    | "CHANNEL_RECONNECTED"
    | "CHANNEL_DISCONNECTED"
    | "CHANNEL_ERROR"
    | "CHANNEL_REAUTH_REQUIRED"
    | "CHANNEL_SYNC_STARTED"
    | "CHANNEL_SYNC_COMPLETED";
  channelType: ChannelType;
  message: string;
  at: string;
}

const ORG_ID = "org_syntrixa_demo";

export const CHANNEL_META: Record<
  ChannelType,
  { label: string; description: string; connectCta: string }
> = {
  WHATSAPP: {
    label: "WhatsApp",
    description:
      "Connect WhatsApp Business to manage customer conversations and sales communication.",
    connectCta: "Connect WhatsApp",
  },
  EMAIL_SMTP: {
    label: "Business Email",
    description:
      "Connect your business email to sync customer conversations and send emails from Syntrixa 360.",
    connectCta: "Connect Email",
  },
  WEBSITE: {
    label: "Website",
    description: "Connect your website to capture visitor enquiries and leads.",
    connectCta: "Connect Website",
  },
  OUTLOOK: {
    label: "Outlook",
    description:
      "Connect Microsoft Outlook to sync business email and calendar-related communication where supported.",
    connectCta: "Connect Outlook",
  },
};

export function createInitialConnections(): Record<ChannelType, ChannelConnection> {
  const base = (channelType: ChannelType, provider: string): ChannelConnection => ({
    connectionId: `conn_${channelType.toLowerCase()}`,
    organizationId: ORG_ID,
    channelType,
    provider,
    accountIdentifier: null,
    displayName: null,
    status: "NOT_CONNECTED",
    healthStatus: "DISCONNECTED",
    connectedAt: null,
    lastCheckedAt: null,
    lastSyncAt: null,
    disconnectedAt: null,
    meta: {},
  });

  return {
    WHATSAPP: base("WHATSAPP", "META_CLOUD_API"),
    EMAIL_SMTP: base("EMAIL_SMTP", "SMTP"),
    WEBSITE: base("WEBSITE", "WIDGET"),
    OUTLOOK: base("OUTLOOK", "MICROSOFT"),
  };
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function nowIso() {
  return new Date().toISOString();
}

let auditSeq = 0;
export function makeAuditEvent(
  type: ChannelAuditEvent["type"],
  channelType: ChannelType,
  message: string,
): ChannelAuditEvent {
  auditSeq += 1;
  return { id: `audit_${auditSeq}`, type, channelType, message, at: nowIso() };
}

// ---------------------------------------------------------------------------
// WhatsApp
// ---------------------------------------------------------------------------

export interface WhatsAppBusinessAccount {
  businessId: string;
  businessName: string;
  phoneNumber: string;
  phoneStatus: "VERIFIED" | "VERIFICATION_REQUIRED";
}

export const MOCK_WHATSAPP_ACCOUNTS: WhatsAppBusinessAccount[] = [
  {
    businessId: "wba_1001",
    businessName: "Syntrixa Traders Pvt Ltd",
    phoneNumber: "+91 98765 43210",
    phoneStatus: "VERIFIED",
  },
  {
    businessId: "wba_1002",
    businessName: "Syntrixa Traders — Support Line",
    phoneNumber: "+91 98700 12345",
    phoneStatus: "VERIFIED",
  },
];

/** Simulates opening embedded signup and returns the accounts the owner can pick from. */
export async function startWhatsAppAuthorization(): Promise<
  { ok: true; accounts: WhatsAppBusinessAccount[] } | { ok: false; message: string }
> {
  await delay(1400);
  // Simulated failure path is intentionally rare so the happy path is easy to demo;
  // real integration would surface the provider's actual authorization outcome.
  return { ok: true, accounts: MOCK_WHATSAPP_ACCOUNTS };
}

export async function confirmWhatsAppConnection(
  account: WhatsAppBusinessAccount,
): Promise<ChannelConnection> {
  await delay(900);
  return {
    connectionId: "conn_whatsapp",
    organizationId: ORG_ID,
    channelType: "WHATSAPP",
    provider: "META_CLOUD_API",
    accountIdentifier: account.phoneNumber,
    displayName: account.businessName,
    status: "CONNECTED",
    healthStatus: "HEALTHY",
    connectedAt: nowIso(),
    lastCheckedAt: nowIso(),
    lastSyncAt: nowIso(),
    disconnectedAt: null,
    meta: { businessId: account.businessId, phoneStatus: account.phoneStatus },
  };
}

// ---------------------------------------------------------------------------
// Email / SMTP
// ---------------------------------------------------------------------------

export interface SmtpFormValues {
  email: string;
  host: string;
  port: string;
  security: "TLS" | "STARTTLS" | "SSL";
  username: string;
  password: string;
}

export async function testSmtpConnection(
  values: SmtpFormValues,
): Promise<
  { ok: true; connection: ChannelConnection } | { ok: false; title: string; message: string }
> {
  await delay(1300);

  if (!values.password || values.password.length < 4) {
    return {
      ok: false,
      title: "Authentication Failed",
      message: "Please verify your email credentials or app password.",
    };
  }
  if (!values.host.includes(".")) {
    return {
      ok: false,
      title: "Connection Failed",
      message: "We couldn't connect to the mail server. Please check the server and port settings.",
    };
  }

  return {
    ok: true,
    connection: {
      connectionId: "conn_email_smtp",
      organizationId: ORG_ID,
      channelType: "EMAIL_SMTP",
      provider: "SMTP",
      accountIdentifier: values.email,
      displayName: values.host,
      status: "CONNECTED",
      healthStatus: "HEALTHY",
      connectedAt: nowIso(),
      lastCheckedAt: nowIso(),
      lastSyncAt: nowIso(),
      disconnectedAt: null,
      meta: { host: values.host, port: values.port, security: values.security },
    },
  };
}

// ---------------------------------------------------------------------------
// Website
// ---------------------------------------------------------------------------

export interface WebsiteWidgetConfig {
  widgetName: string;
  welcomeMessage: string;
  offlineMessage: string;
  businessHours: string;
  leadFields: string[];
}

export const DEFAULT_WIDGET_CONFIG: WebsiteWidgetConfig = {
  widgetName: "Sales Chat",
  welcomeMessage: "Hello! How can we help you today?",
  offlineMessage: "We're offline right now — leave a message and we'll get back to you.",
  businessHours: "Mon–Sat, 9:00 AM – 7:00 PM",
  leadFields: ["Name", "Email", "Phone"],
};

export async function verifyWebsiteUrl(
  url: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  await delay(1000);
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") {
      return { ok: false, message: "Please provide a secure (https://) website URL." };
    }
    return { ok: true };
  } catch {
    return { ok: false, message: "That doesn't look like a valid website URL." };
  }
}

export function generateWidgetToken(orgId: string) {
  return `wgt_pub_${orgId.replace(/[^a-z0-9]/gi, "").slice(0, 8)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function buildWidgetSnippet(publicToken: string) {
  return `<script>
  (function (s, y, n) {
    s.SyntrixaWidget = n;
    s[n] = s[n] || function () { (s[n].q = s[n].q || []).push(arguments); };
    var w = y.createElement("script");
    w.async = true;
    w.src = "https://widget.syntrixa360.com/loader.js";
    y.head.appendChild(w);
  })(window, document, "syntrixa");
  syntrixa("init", { widgetToken: "${publicToken}" });
</script>`;
}

export async function testWebsiteInstallation(
  _url: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  await delay(1100);
  return { ok: true };
}

export async function finalizeWebsiteConnection(
  url: string,
  config: WebsiteWidgetConfig,
  publicToken: string,
): Promise<ChannelConnection> {
  await delay(600);
  const domain = new URL(url).hostname;
  return {
    connectionId: "conn_website",
    organizationId: ORG_ID,
    channelType: "WEBSITE",
    provider: "WIDGET",
    accountIdentifier: domain,
    displayName: config.widgetName,
    status: "CONNECTED",
    healthStatus: "HEALTHY",
    connectedAt: nowIso(),
    lastCheckedAt: nowIso(),
    lastSyncAt: nowIso(),
    disconnectedAt: null,
    meta: { url, widgetToken: publicToken },
  };
}

// ---------------------------------------------------------------------------
// Outlook
// ---------------------------------------------------------------------------

export interface MicrosoftAccount {
  accountName: string;
  email: string;
  domain: string;
}

export const MOCK_MICROSOFT_ACCOUNT: MicrosoftAccount = {
  accountName: "Syntrixa Traders Pvt Ltd",
  email: "sales@syntrixatraders.com",
  domain: "syntrixatraders.com",
};

export async function startOutlookAuthorization(): Promise<
  { ok: true; account: MicrosoftAccount } | { ok: false; message: string }
> {
  await delay(1400);
  return { ok: true, account: MOCK_MICROSOFT_ACCOUNT };
}

export async function confirmOutlookConnection(
  account: MicrosoftAccount,
): Promise<ChannelConnection> {
  await delay(800);
  return {
    connectionId: "conn_outlook",
    organizationId: ORG_ID,
    channelType: "OUTLOOK",
    provider: "MICROSOFT",
    accountIdentifier: account.email,
    displayName: account.accountName,
    status: "CONNECTED",
    healthStatus: "HEALTHY",
    connectedAt: nowIso(),
    lastCheckedAt: nowIso(),
    lastSyncAt: nowIso(),
    disconnectedAt: null,
    meta: { domain: account.domain },
  };
}

// ---------------------------------------------------------------------------
// Shared: test / reconnect / disconnect
// ---------------------------------------------------------------------------

export async function testChannelConnection(connection: ChannelConnection): Promise<TestResult> {
  await delay(1100);

  if (connection.status !== "CONNECTED" && connection.status !== "ACTION_REQUIRED") {
    return {
      status: "CONNECTION_ERROR",
      health: "DISCONNECTED",
      errorCode: "NOT_CONNECTED",
      userFriendlyMessage: "This channel isn't connected yet.",
      checkedAt: nowIso(),
    };
  }

  return {
    status: "CONNECTED",
    health: "HEALTHY",
    userFriendlyMessage: "Connection is healthy.",
    checkedAt: nowIso(),
  };
}

export async function disconnectChannel(connection: ChannelConnection): Promise<ChannelConnection> {
  await delay(600);
  return {
    ...connection,
    status: "DISCONNECTED",
    healthStatus: "DISCONNECTED",
    disconnectedAt: nowIso(),
  };
}

export function statusLabel(status: ChannelStatus): string {
  switch (status) {
    case "NOT_CONNECTED":
      return "Not Connected";
    case "CONNECTING":
      return "Connecting";
    case "CONNECTED":
      return "Connected";
    case "ACTION_REQUIRED":
      return "Action Required";
    case "CONNECTION_ERROR":
      return "Connection Error";
    case "DISCONNECTED":
      return "Disconnected";
    case "REAUTHORIZATION_REQUIRED":
      return "Reauthorization Required";
  }
}
