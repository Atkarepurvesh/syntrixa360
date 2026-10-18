// Shared permission utility — single source of truth for what each role can
// see/do across Customers (and later Pipeline/Quotations/etc). Keeping this
// in one file means every module checks the same rules instead of each page
// re-deciding what a Sales Executive is allowed to do.

import type { AppRole } from "@/lib/current-user";

export type Permission =
  | "view-all-customers" // Owner: sees every customer. Manager: team. Sales Exec: own only.
  | "change-customer-owner"
  | "view-full-finance"
  | "edit-payment-records"
  | "edit-product-master"
  | "manage-org-settings"
  | "manage-roles-permissions"
  | "usage.view" // Usage & Limits page
  | "subscription.view"
  | "subscription.manage" // upgrade / downgrade / cancel / resume
  | "billing.view" // billing history, payment method
  | "select-arbitrary-owner-on-create"; // pick any Sales Exec as owner when adding a customer

const ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
  owner: [
    "view-all-customers",
    "change-customer-owner",
    "view-full-finance",
    "edit-payment-records",
    "edit-product-master",
    "manage-org-settings",
    "manage-roles-permissions",
    "select-arbitrary-owner-on-create",
    "usage.view",
    "subscription.view",
    "subscription.manage",
    "billing.view",
  ],
  manager: [
    "view-all-customers", // scoped to team inside the page, not org-wide
    "change-customer-owner",
    "view-full-finance",
    "select-arbitrary-owner-on-create",
    "usage.view",
    "subscription.view",
  ],
  "sales-executive": [
    // Everything else (call/email/whatsapp/follow-up/task/note/requirement/
    // opportunity/quotation/view-orders/view-payment-status) is allowed by
    // default in the UI — this list only has to encode the RESTRICTIONS.
  ],
};

export function hasPermission(role: AppRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

/** Convenience flags for the common checks used in Customer pages. */
export function getCustomerPermissions(role: AppRole) {
  return {
    canViewAllCustomers: hasPermission(role, "view-all-customers") && role === "owner",
    canViewTeamCustomers: role === "owner" || role === "manager",
    canChangeOwner: hasPermission(role, "change-customer-owner"),
    canViewFullFinance: hasPermission(role, "view-full-finance"),
    canEditPaymentRecords: hasPermission(role, "edit-payment-records"),
    canPickOwnerOnCreate: hasPermission(role, "select-arbitrary-owner-on-create"),
  };
}
