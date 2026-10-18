// Admin-screen action permissions (Organization / Team Members / User detail) — UX only.
// Route/nav access lives in lib/rbac/catalog.ts + lib/rbac/navigation.ts; this file only
// decides which *actions* inside the admin screens (invite, deactivate, edit…) are shown.
// Backend authorization is authoritative.
import { useCurrentUser, type AppRole } from "@/lib/current-user";

export type PermissionKey =
  | "organization.view" | "organization.update" | "organization.status.update"
  | "team.view" | "team.invite" | "team.update" | "team.role.update" | "team.deactivate" | "team.permissions.view"
  | "users.view" | "users.edit" | "users.manage_roles" | "users.manage_status" | "security.manage";

const VIEW: PermissionKey[] = ["organization.view", "team.view", "users.view"];
const MGR: PermissionKey[] = [...VIEW, "team.invite", "team.update", "team.permissions.view", "users.edit"];
const ALL: PermissionKey[] = [
  ...MGR, "organization.update", "organization.status.update", "team.role.update",
  "team.deactivate", "users.manage_roles", "users.manage_status", "security.manage",
];

const MAP: Record<AppRole, PermissionKey[]> = { owner: ALL, manager: MGR, "sales-executive": VIEW };

export function usePermissions() {
  const { currentUser } = useCurrentUser();
  const granted = MAP[currentUser.role];
  return { can: (p: PermissionKey) => granted.includes(p), currentUser };
}
