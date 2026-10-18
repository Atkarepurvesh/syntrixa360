// Mock "backend" for the Business Setup onboarding flow.
//
// This project does not yet have a real API/database (see the TODO in
// src/routes/login.tsx), so — consistent with the rest of the app's
// *-data.ts files — this module simulates the backend behaviour described in
// the Part 2 spec (organizations, membership, default CRM config, onboarding
// progress, audit events) using localStorage. Every function here is written
// so it can be swapped for a real `fetch("/api/...")` call later without
// changing the wizard components that call it.

import {
  DEFAULT_ACTIVITY_TYPES,
  DEFAULT_LEAD_SOURCES,
  DEFAULT_PERMISSION_CATEGORIES,
  DEFAULT_PIPELINE_STAGES,
  DEFAULT_PRIORITIES,
  DEFAULT_ROLES,
} from "./onboarding-options";
import {
  businessSetupDefaults,
  type BusinessSetupValues,
  type GstStatus,
} from "./onboarding-schema";

const DRAFT_KEY = "syntrixa360.onboarding.business.draft";
const ORG_KEY = "syntrixa360.onboarding.organization";
const AUDIT_KEY = "syntrixa360.onboarding.audit";

// ---------------------------------------------------------------------------
// Draft persistence (Part 2, items 67-70, 72). Never persist secrets — only
// the business-profile fields captured by this form are stored, and the
// logo is capped so a large upload doesn't blow the storage quota.
// ---------------------------------------------------------------------------

export function loadDraft(): Partial<BusinessSetupValues> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<BusinessSetupValues>;
  } catch {
    return null;
  }
}

export function saveDraft(values: BusinessSetupValues): void {
  if (typeof window === "undefined") return;
  try {
    // Guard against a very large base64 logo bloating localStorage.
    const safe = { ...values };
    if (safe.logoDataUrl && safe.logoDataUrl.length > 300_000) {
      safe.logoDataUrl = "";
      safe.logoFileName = "";
    }
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(safe));
  } catch {
    // Storage can fail (quota, private mode) — draft saving is best-effort.
  }
}

export function clearDraft(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DRAFT_KEY);
}

// ---------------------------------------------------------------------------
// Audit log (Part 2, item 80) — append-only, no sensitive payloads.
// ---------------------------------------------------------------------------

export type AuditEventType =
  | "BUSINESS_SETUP_STARTED"
  | "BUSINESS_DETAILS_SAVED"
  | "GST_VERIFICATION_REQUESTED"
  | "GST_VERIFIED"
  | "GST_VERIFICATION_FAILED"
  | "BUSINESS_DETAILS_COMPLETED"
  | "ORGANIZATION_CREATED"
  | "OWNER_MEMBERSHIP_CREATED"
  | "DEFAULT_SETTINGS_CREATED"
  | "ONBOARDING_STEP_COMPLETED"
  | "TEAM_INVITES_SENT"
  | "TEAM_INVITE_STEP_SKIPPED"
  | "TRIAL_ACTIVATED";

export interface AuditEvent {
  type: AuditEventType;
  at: string;
  meta?: Record<string, string | number | boolean>;
}

export function recordAuditEvent(
  type: AuditEventType,
  meta?: Record<string, string | number | boolean>,
): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(AUDIT_KEY);
    const events: AuditEvent[] = raw ? JSON.parse(raw) : [];
    const event: AuditEvent = meta
      ? { type, at: new Date().toISOString(), meta }
      : { type, at: new Date().toISOString() };
    events.push(event);
    window.localStorage.setItem(AUDIT_KEY, JSON.stringify(events.slice(-200)));
  } catch {
    // Non-critical — never block the user flow on audit logging failures.
  }
}

export function getAuditLog(): AuditEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(AUDIT_KEY);
    return raw ? (JSON.parse(raw) as AuditEvent[]) : [];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// GST verification (Part 2, items 12-17, 73). Simulated network call —
// deterministic-ish so the demo is usable: a syntactically valid, checksum-
// shaped GSTIN "succeeds"; anything ending in "0" fails, to let people see
// the failure state on demand.
// ---------------------------------------------------------------------------

export interface GstVerificationResult {
  status: GstStatus;
  legalName?: string;
  tradeName?: string;
  registrationStatus?: string;
  message?: string;
}

export async function verifyGstin(
  gstin: string,
  companyName: string,
): Promise<GstVerificationResult> {
  await new Promise((r) => setTimeout(r, 1100));

  const clean = gstin.trim().toUpperCase();
  const looksValid = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(clean);

  if (!looksValid) {
    return { status: "failed", message: "GSTIN format could not be verified." };
  }

  // Deterministic demo failure so the "could not verify" UI is reachable.
  if (clean.endsWith("0")) {
    return { status: "failed", message: "We couldn't verify this GSTIN with the tax authority." };
  }

  const verified: GstVerificationResult = {
    status: "verified",
    legalName: companyName || "Verified Legal Entity",
    registrationStatus: "Active",
  };
  if (companyName) verified.tradeName = companyName;
  return verified;
}

// ---------------------------------------------------------------------------
// Organization creation (Part 2, items 49-64, 84). Builds the organization
// record plus every default sub-resource described in the spec, and writes
// them as one atomic localStorage write (simulating a DB transaction so a
// half-configured organization is never left behind — item 75/76).
// ---------------------------------------------------------------------------

export interface OrganizationRecord {
  organizationId: string;
  status: "SETUP_IN_PROGRESS" | "ACTIVE";
  business: BusinessSetupValues;
  ownerMembership: { userId: string; role: "OWNER"; status: "ACTIVE"; createdAt: string };
  roles: readonly string[];
  permissionCategories: readonly string[];
  pipelineStages: readonly string[];
  activityTypes: readonly string[];
  priorities: readonly string[];
  leadSources: readonly string[];
  createdAt: string;
  updatedAt: string;
}

export interface OnboardingProgress {
  organizationId: string;
  currentStep: "CHANNELS" | "TEAM" | "COMPLETE";
  completedSteps: string[];
  completionPercentage: number;
  status: "IN_PROGRESS" | "COMPLETE";
  updatedAt: string;
}

function generateOrganizationId(): string {
  // Opaque, non-sequential ID (item 51) — not a database primary key.
  const bytes = new Uint8Array(12);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `org_${hex}`;
}

export function getOrganization(): OrganizationRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(ORG_KEY);
    return raw ? (JSON.parse(raw) as OrganizationRecord) : null;
  } catch {
    return null;
  }
}

export async function createOrganization(
  business: BusinessSetupValues,
  ownerUserId = "owner_current_user",
): Promise<{ organization: OrganizationRecord; progress: OnboardingProgress }> {
  // Simulated network latency for the "Creating Your Workspace..." state.
  await new Promise((r) => setTimeout(r, 1400));

  const now = new Date().toISOString();
  const organization: OrganizationRecord = {
    organizationId: generateOrganizationId(),
    status: "SETUP_IN_PROGRESS",
    business,
    ownerMembership: { userId: ownerUserId, role: "OWNER", status: "ACTIVE", createdAt: now },
    roles: DEFAULT_ROLES,
    permissionCategories: DEFAULT_PERMISSION_CATEGORIES,
    pipelineStages: DEFAULT_PIPELINE_STAGES,
    activityTypes: DEFAULT_ACTIVITY_TYPES,
    priorities: DEFAULT_PRIORITIES,
    leadSources: DEFAULT_LEAD_SOURCES,
    createdAt: now,
    updatedAt: now,
  };

  const progress: OnboardingProgress = {
    organizationId: organization.organizationId,
    currentStep: "CHANNELS",
    completedSteps: ["ACCOUNT", "VERIFICATION", "BUSINESS"],
    completionPercentage: 50,
    status: "IN_PROGRESS",
    updatedAt: now,
  };

  try {
    window.localStorage.setItem(ORG_KEY, JSON.stringify(organization));
    clearDraft();
  } catch (err) {
    throw new Error("We couldn't create your workspace. Please try again.");
  }

  recordAuditEvent("ORGANIZATION_CREATED", { organizationId: organization.organizationId });
  recordAuditEvent("OWNER_MEMBERSHIP_CREATED", { organizationId: organization.organizationId });
  recordAuditEvent("DEFAULT_SETTINGS_CREATED", { organizationId: organization.organizationId });
  recordAuditEvent("ONBOARDING_STEP_COMPLETED", { step: "BUSINESS" });

  return { organization, progress };
}

export function resetOnboardingDemo(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ORG_KEY);
  window.localStorage.removeItem(DRAFT_KEY);
  window.localStorage.removeItem(AUDIT_KEY);
}

export { businessSetupDefaults };
