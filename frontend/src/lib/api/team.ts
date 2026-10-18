import { api } from "./client";
import type {
  InvitationCreateInput,
  InvitationDto,
  MemberDto,
  MemberUpdateInput,
  OrganizationMembershipDto,
  RoleDto,
} from "@/types/api/organization";

// All routes except acceptInvitation need X-Organization-ID (set by OrganizationProvider).
export const listMembers = () => api.get<MemberDto[]>("/team/members");

export const updateMember = (memberId: string, input: MemberUpdateInput) =>
  api.patch<MemberDto>(`/team/members/${encodeURIComponent(memberId)}`, input);

export const removeMember = (memberId: string) =>
  api.delete<void>(`/team/members/${encodeURIComponent(memberId)}`);

export const listRoles = () => api.get<RoleDto[]>("/team/roles");

export const listInvitations = () =>
  api.get<InvitationDto[]>("/team/invitations");

export const createInvitation = (input: InvitationCreateInput) =>
  api.post<InvitationDto>("/team/invitations", input);

/** Rotates the emailed token (old link stops working) and extends expiry. Pending invitations only. */
export const resendInvitation = (invitationId: string) =>
  api.post<InvitationDto>(`/team/invitations/${encodeURIComponent(invitationId)}/resend`);

export const revokeInvitation = (invitationId: string) =>
  api.delete<void>(`/team/invitations/${encodeURIComponent(invitationId)}`);

/** Needs only authentication. The signed-in user's verified email must match the invitation. */
export const acceptInvitation = (token: string) =>
  api.post<OrganizationMembershipDto>("/team/invitations/accept", { token });
