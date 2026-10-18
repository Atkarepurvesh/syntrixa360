// Tiny in-memory store so list, drawer and profile pages stay in sync (demo only;
// replace with API queries/mutations — backend validates every change).
import { useSyncExternalStore } from "react";
import { INVITATIONS, MEMBERS, type ActivityItem, type Invitation, type Member, type Source } from "@/lib/admin-data";

type State = { members: Member[]; invitations: Invitation[]; audit: (ActivityItem & { memberId: string })[] };
let state: State = { members: MEMBERS, invitations: INVITATIONS, audit: [] };
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());
const set = (p: Partial<State>) => { state = { ...state, ...p }; emit(); };

export const useAdminStore = () => useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, () => state, () => state);

export function logAudit(memberId: string, title: string, description: string, source: Source = "User") {
  set({ audit: [{ id: crypto.randomUUID(), memberId, title, description, when: "Just now", module: "Administration", source }, ...state.audit] });
}
export function updateMember(id: string, patch: Partial<Member>, audit?: [string, string]) {
  set({ members: state.members.map((m) => (m.id === id ? { ...m, ...patch } : m)) });
  if (audit) logAudit(id, audit[0], audit[1]);
}
export function addInvitation(i: Omit<Invitation, "id" | "status" | "invitedAt" | "expires">) {
  const d = (n: number) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
  set({ invitations: [{ ...i, id: crypto.randomUUID(), status: "Pending", invitedAt: d(0), expires: d(7) }, ...state.invitations] });
}
export function updateInvitation(id: string, patch: Partial<Invitation>) {
  set({ invitations: state.invitations.map((i) => (i.id === id ? { ...i, ...patch } : i)) });
}
