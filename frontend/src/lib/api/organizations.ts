import { api } from "./client";
import type { OrganizationMembershipDto } from "@/types/api/organization";

/** GET /organizations: active memberships of the signed-in user (no X-Organization-ID needed). */
export const listOrganizations = () =>
  api.get<OrganizationMembershipDto[]>("/organizations");

/** GET /organizations/current: context of the org named by X-Organization-ID. */
export const getCurrentOrganization = () =>
  api.get<OrganizationMembershipDto>("/organizations/current");

/** POST /organizations/{id}/switch: backend validates membership; client then sends X-Organization-ID. */
export const switchOrganizationApi = (organizationId: string) =>
  api.post<OrganizationMembershipDto>(
    `/organizations/${encodeURIComponent(organizationId)}/switch`,
  );
