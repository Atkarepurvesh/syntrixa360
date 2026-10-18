// Shared "who is logged in" context for the whole app.
//
// There is no real auth system in this project yet — every page previously
// imported the hardcoded `owner` object from `crm-data.ts`. This file
// replaces that single hardcoded object with a small role-aware context so
// Owner / Manager / Sales Executive views can all be built and tested from
// the same codebase, without a backend.
//
// IMPORTANT: `crm-data.ts` still exports `owner` for backwards compat (other
// pages may still read it) — this file does not touch that export. Pages
// should migrate to `useCurrentUser()` as they're upgraded, module by module.

import { createContext, useContext } from "react";
import { team } from "@/lib/crm-data";

export type AppRole = "owner" | "manager" | "sales-executive";

export type CurrentUser = {
  id: string;
  name: string;
  role: AppRole;
  /** Human-readable role label shown in header/sidebar (matches existing crm-data "role" strings) */
  roleLabel: string;
  initials: string;
};

function initialsOf(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

// ---- Mock identities ----------------------------------------------------
// The Owner identity mirrors the previous hardcoded `owner` export from
// crm-data.ts so nothing visually changes for the default/owner view.
export const OWNER_USER: CurrentUser = {
  id: "amit-sharma",
  name: "Amit Sharma",
  role: "owner",
  roleLabel: "Owner",
  initials: "AS",
};

export const MANAGER_USER: CurrentUser = {
  id: "manager-priya",
  name: "Priya Nair",
  role: "manager",
  roleLabel: "Sales Manager",
  initials: initialsOf("Priya Nair"),
};

// Sales Executive identities are derived from the existing `team` list in
// crm-data.ts so `customerRows.owner === currentUser.name` keeps working
// with zero changes to existing mock data.
export const SALES_EXECUTIVE_USERS: CurrentUser[] = team
  .filter((member) => member.role === "Sales Executive" || member.role === "Senior Sales Executive")
  .map((member) => ({
    id: member.id,
    name: member.name,
    role: "sales-executive" as const,
    roleLabel: member.role,
    initials: initialsOf(member.name),
  }));

export const ALL_MOCK_USERS: CurrentUser[] = [OWNER_USER, MANAGER_USER, ...SALES_EXECUTIVE_USERS];

// Default logged-in user for this dev build: the first Sales Executive
// (Rahul Verma), so the Sales Executive experience is what you see by
// default while it's being built/reviewed. Switch anytime via the header
// role-switcher (dev-only control, see app-shell.tsx).
export const DEFAULT_CURRENT_USER: CurrentUser = SALES_EXECUTIVE_USERS[0] ?? OWNER_USER;

// ---- Context -------------------------------------------------------------
type CurrentUserContextValue = {
  currentUser: CurrentUser;
  setCurrentUser: (user: CurrentUser) => void;
};

export const CurrentUserContext = createContext<CurrentUserContextValue | null>(null);

export function useCurrentUser(): CurrentUserContextValue {
  const ctx = useContext(CurrentUserContext);
  if (!ctx) {
    // Safe fallback so any page that hasn't been wrapped yet doesn't crash —
    // behaves like the old hardcoded `owner` export.
    return { currentUser: OWNER_USER, setCurrentUser: () => {} };
  }
  return ctx;
}
