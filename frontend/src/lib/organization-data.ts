// Organization membership layer (multi-tenancy).
//
// Architecture:  users → organization_members → organizations → org-scoped data
//
// IMPORTANT — this file is the ONLY place that knows where organization data
// comes from. It now talks to the real backend (GET /api/v1/organizations and
// POST /api/v1/organizations/{id}/switch). The backend remains the final
// authority on membership and permissions; everything here is UX only.

import { ApiError } from "@/types/api/common";
import {
  listOrganizations,
  switchOrganizationApi,
} from "@/lib/api/organizations";
import { resolveOrgPermissions } from "@/lib/rbac/backend-permissions";
import type { OrganizationMembershipDto } from "@/types/api/organization";

export type OrgStatus = "active" | "suspended" | "archived" | "inactive";
export type MembershipStatus = "active" | "pending";
export type OrgRoleKey =
  "owner" | "admin" | "sales_manager" | "sales_executive" | "viewer";

/** Permission strings follow the backend naming used across the specs. */
export type OrgPermission =
  | "audit_logs.read" //                own activity
  | "audit_logs.read.organization" //   organization-wide audit logs
  | "audit_logs.export"
  | "ai.activity.read"
  | "ai.activity.read.organization"
  | "ai.activity.approve"
  | "automation.activity.read"
  | "automation.activity.read.organization"
  | "automation.retry"
  | "automation.configure"
  | "ai.configure"
  | "organization.settings";

export interface OrganizationMembership {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  status: OrgStatus;
  membershipStatus: MembershipStatus;
  role: { key: OrgRoleKey; label: string };
  /** Org-scoped settings that the UI must follow after a switch. */
  currency: string;
  timezone: string;
  /** Permissions the backend resolved for (user, organization, role). */
  permissions: OrgPermission[];
  /** Only present for pending invitations. */
  invitationToken?: string;
  /** Raw backend role ("OWNER" | "MANAGER" | "EXECUTIVE") and permission codes: the source of truth. */
  backendRole: string;
  backendPermissions: string[];
}

const ROLE_MAP: Record<string, { key: OrgRoleKey; label: string }> = {
  OWNER: { key: "owner", label: "Owner" },
  MANAGER: { key: "admin", label: "Manager" },
  EXECUTIVE: { key: "sales_executive", label: "Executive" },
};

/** Backend DTO -> the shape the UI already consumes. */
export function toMembership(
  dto: OrganizationMembershipDto,
): OrganizationMembership {
  const role = ROLE_MAP[dto.role.key] ?? {
    key: "viewer" as OrgRoleKey,
    label: dto.role.label,
  };
  return {
    id: dto.id,
    name: dto.name,
    slug: dto.slug,
    logoUrl: dto.logoUrl,
    status: dto.status,
    membershipStatus: "active",
    role,
    // Display defaults only until the business profile sets them (onboarding).
    currency: dto.currency ?? "INR",
    timezone: dto.timezone ?? "Asia/Kolkata",
    permissions: resolveOrgPermissions(dto.permissions),
    backendRole: dto.role.key,
    backendPermissions: dto.permissions,
  };
}

export class OrgSwitchError extends Error {
  code: "not_a_member" | "suspended" | "unavailable";
  constructor(code: OrgSwitchError["code"]) {
    super(code);
    this.code = code;
  }
}

/** GET /api/v1/organizations — active memberships of the authenticated user. */
export async function fetchOrganizations(): Promise<OrganizationMembership[]> {
  return (await listOrganizations()).map(toMembership);
}

/** POST /api/v1/organizations/{id}/switch — the backend validates membership. */
export async function switchOrganization(
  orgId: string,
): Promise<OrganizationMembership> {
  try {
    return toMembership(await switchOrganizationApi(orgId));
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 403) {
        throw new OrgSwitchError(
          err.details?.["reason"] === "organization_unavailable"
            ? "suspended"
            : "not_a_member",
        );
      }
    }
    throw new OrgSwitchError("unavailable");
  }
}

export function orgInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
