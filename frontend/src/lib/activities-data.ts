// Syntrixa 360 — Activity Management Module data layer
//
// Principle: EVERY SALES CONVERSATION MUST HAVE A CLEAR NEXT ACTION.
// Activities are the single place Call/Meeting/Task/Follow-up/etc. actions
// live, and they can be linked to Customer, Contact, Company, Lead, Deal,
// Quotation and (when opened from Inbox) a Conversation — never entered
// twice, always pulled from the record the activity was created against.

import { customerRows } from "@/lib/customers-data";
import { leads } from "@/lib/leads-data";
import { dealsLite, quotationsData } from "@/lib/quotations-data";

export type ActivityType =
  | "Call"
  | "Meeting"
  | "Task"
  | "Follow-up"
  | "Email"
  | "WhatsApp Follow-up"
  | "Site Visit"
  | "Demo"
  | "Quotation Follow-up"
  | "Payment Follow-up"
  | "Order Follow-up"
  | "Delivery Follow-up"
  | "Reminder"
  | "Note"
  | "Other";

export const activityTypes: ActivityType[] = [
  "Call",
  "Meeting",
  "Task",
  "Follow-up",
  "Email",
  "WhatsApp Follow-up",
  "Site Visit",
  "Demo",
  "Quotation Follow-up",
  "Payment Follow-up",
  "Order Follow-up",
  "Delivery Follow-up",
  "Reminder",
  "Note",
  "Other",
];

export type ActivityPriority = "High" | "Medium" | "Low";
export const activityPriorities: ActivityPriority[] = ["High", "Medium", "Low"];

export type ActivityStatus = "Pending" | "Completed" | "Overdue" | "Rescheduled" | "Cancelled";

export type ActivityReminder =
  | "No Reminder"
  | "15 minutes before"
  | "30 minutes before"
  | "1 hour before"
  | "1 day before"
  | "Custom";

export const activityReminders: ActivityReminder[] = [
  "No Reminder",
  "15 minutes before",
  "30 minutes before",
  "1 hour before",
  "1 day before",
  "Custom",
];

export type ActivitySource =
  | "Inbox"
  | "Customer"
  | "Contact"
  | "Company"
  | "Lead"
  | "Deal"
  | "Quotation"
  | "Sales Dashboard"
  | "Calendar"
  | "Activity Module";

export type ActivityTimelineEntry = {
  id: string;
  date: string;
  time: string;
  title: string;
  user: string;
};

export type Activity = {
  id: string;
  type: ActivityType;
  title: string;
  description: string;

  // Relational links — every field optional, but at least the ones the
  // activity was created from should be filled in automatically.
  customerId?: string;
  customerName?: string;
  contactName?: string;
  companyId?: string;
  companyName?: string;
  leadId?: string;
  leadName?: string;
  dealId?: string;
  dealName?: string;
  quotationId?: string;
  quotationName?: string;
  /** Only ever set when the activity is created *from* an Inbox conversation — never a manual field. */
  conversationId?: string;
  conversationLabel?: string;

  assignedTo: string;
  createdBy: string;
  priority: ActivityPriority;
  dueDateISO: string;
  dueTime: string;
  durationMinutes?: number;
  reminder: ActivityReminder;
  status: ActivityStatus;
  source: ActivitySource;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  completionNote?: string;
  timeline: ActivityTimelineEntry[];
};

export { salesExecutives as activityAssignees } from "@/lib/quotations-data";

// "Today" kept fixed so overdue/upcoming derivation stays deterministic across the demo dataset.
export const ACTIVITY_TODAY_ISO = "2026-09-01";

// The signed-in user for "My Activities" — mirrors the demo user used elsewhere in the app.
export const CURRENT_USER = "Rahul Verma";

// ---------------------------------------------------------------------------
// Lightweight cross-module lookups for the Create Activity form so a
// Customer/Lead/Deal/Quotation selection can auto-fill everything else.
// ---------------------------------------------------------------------------

export const customersLookup = customerRows.map((c) => ({
  id: c.id,
  company: c.company,
  contact: c.contact,
  phone: c.phone,
  email: c.email,
}));

export const leadsLookup = leads.slice(0, 12).map((l) => ({
  id: l.id,
  name: l.name,
  company: l.company,
  contact: l.contactPerson,
}));

export const dealsLookup = dealsLite;

export const quotationsLookup = quotationsData.map((q) => ({
  id: q.id,
  label: `${q.id} — ${q.company}`,
  customerId: q.customerId,
  company: q.company,
}));

function entry(
  id: string,
  date: string,
  time: string,
  title: string,
  user: string,
): ActivityTimelineEntry {
  return { id, date, time, title, user };
}

const rawActivities: Activity[] = [
  {
    id: "ACT-2026-0041",
    type: "Call",
    title: "Call ABC Trading regarding revised quotation",
    description:
      "Discuss revised CIF Dubai quotation for 100 MT coconut and confirm expected order date.",
    customerId: "CUST-1006",
    customerName: "ABC Trading LLC",
    contactName: "John Smith",
    dealId: "D-2201",
    dealName: "Dubai Coconut Supply",
    quotationId: "QT-2026-0012",
    quotationName: "QT-2026-0012 — ABC Trading LLC",
    assignedTo: "Rahul Verma",
    createdBy: "Amit Sharma",
    priority: "High",
    dueDateISO: "2026-09-01",
    dueTime: "11:00",
    durationMinutes: 20,
    reminder: "15 minutes before",
    status: "Pending",
    source: "Quotation",
    createdAt: "31 Aug 2026",
    updatedAt: "31 Aug 2026",
    timeline: [
      entry("t1", "31 Aug", "10:05 AM", "Activity created from Quotation QT-2026-0012", "Rahul Verma"),
      entry("t2", "31 Aug", "10:05 AM", "Assigned to Rahul Verma", "Rahul Verma"),
    ],
  },
  {
    id: "ACT-2026-0040",
    type: "WhatsApp Follow-up",
    title: "WhatsApp follow-up — Global Exports Ltd.",
    description: "Share dispatch schedule and confirm delivery address before shipment.",
    customerId: "CUST-1002",
    customerName: "Global Exports Ltd.",
    contactName: "Meera Iyer",
    dealId: "D-2198",
    dealName: "Global Exports — Pump Order",
    quotationId: "QT-2026-0011",
    quotationName: "QT-2026-0011 — Global Exports Ltd.",
    conversationId: "CONV-8842",
    conversationLabel: "WhatsApp — Meera Iyer",
    assignedTo: "Neha Singh",
    createdBy: "Neha Singh",
    priority: "Medium",
    dueDateISO: "2026-09-01",
    dueTime: "14:00",
    reminder: "30 minutes before",
    status: "Pending",
    source: "Inbox",
    createdAt: "31 Aug 2026",
    updatedAt: "31 Aug 2026",
    timeline: [entry("t1", "31 Aug", "3:10 PM", "Activity created from Inbox conversation", "Neha Singh")],
  },
  {
    id: "ACT-2026-0039",
    type: "Meeting",
    title: "Onsite meeting — Bright Steel control panel rollout",
    description: "Finalize installation schedule and confirm on-site support window.",
    customerId: "CUST-1003",
    customerName: "Bright Steel Pvt. Ltd.",
    contactName: "Rohit Jain",
    dealId: "D-2170",
    dealName: "Bright Steel — Control Panels",
    quotationId: "QT-2026-0010",
    quotationName: "QT-2026-0010 — Bright Steel Pvt. Ltd.",
    assignedTo: "Rahul Verma",
    createdBy: "Amit Sharma",
    priority: "High",
    dueDateISO: "2026-09-01",
    dueTime: "17:30",
    durationMinutes: 45,
    reminder: "1 hour before",
    status: "Pending",
    source: "Deal",
    createdAt: "28 Aug 2026",
    updatedAt: "30 Aug 2026",
    timeline: [
      entry("t1", "28 Aug", "9:00 AM", "Activity created from Deal", "Amit Sharma"),
      entry("t2", "30 Aug", "4:20 PM", "Reminder scheduled", "Rahul Verma"),
    ],
  },
  {
    id: "ACT-2026-0038",
    type: "Quotation Follow-up",
    title: "Follow up on Pending Approval — Shreeji Traders",
    description: "Check with Owner on approval status for the 12% discount request.",
    customerId: "CUST-1001",
    customerName: "Shreeji Traders",
    contactName: "Nilesh Shah",
    dealId: "D-2078",
    dealName: "Shreeji Traders — Pump Enquiry",
    quotationId: "QT-2026-0006",
    quotationName: "QT-2026-0006 — Shreeji Traders",
    assignedTo: "Rahul Verma",
    createdBy: "Rahul Verma",
    priority: "High",
    dueDateISO: "2026-08-29",
    dueTime: "12:00",
    reminder: "1 day before",
    status: "Overdue",
    source: "Quotation",
    createdAt: "18 Aug 2026",
    updatedAt: "27 Aug 2026",
    timeline: [
      entry("t1", "18 Aug", "11:45 AM", "Activity created from Quotation QT-2026-0006", "Rahul Verma"),
      entry("t2", "27 Aug", "5:00 PM", "Reminder sent", "System"),
    ],
  },
  {
    id: "ACT-2026-0037",
    type: "Payment Follow-up",
    title: "Payment follow-up — Sharma Industries",
    description: "Confirm advance payment receipt for QT-2026-0009 before dispatch.",
    customerId: "CUST-1010",
    customerName: "Sharma Industries",
    contactName: "Vikram Sharma",
    dealId: "D-2140",
    dealName: "Sharma Industries — Spares",
    quotationId: "QT-2026-0009",
    quotationName: "QT-2026-0009 — Sharma Industries",
    assignedTo: "Arjun Mehta",
    createdBy: "Amit Sharma",
    priority: "Medium",
    dueDateISO: "2026-08-30",
    dueTime: "10:30",
    reminder: "30 minutes before",
    status: "Overdue",
    source: "Customer",
    createdAt: "24 Aug 2026",
    updatedAt: "29 Aug 2026",
    timeline: [entry("t1", "24 Aug", "9:00 AM", "Activity created from Customer profile", "Amit Sharma")],
  },
  {
    id: "ACT-2026-0036",
    type: "Site Visit",
    title: "Site visit — Kisan Agro processing unit",
    description: "Inspect packaging line before confirming desiccated coconut order volumes.",
    customerId: "CUST-1005",
    customerName: "Kisan Agro Pvt. Ltd.",
    contactName: "Sushil Patil",
    leadId: "L-8742",
    leadName: "Kisan Agro — Coconut Inquiry",
    assignedTo: "Pooja Patel",
    createdBy: "Amit Sharma",
    priority: "Medium",
    dueDateISO: "2026-09-03",
    dueTime: "10:00",
    durationMinutes: 90,
    reminder: "1 day before",
    status: "Pending",
    source: "Lead",
    createdAt: "29 Aug 2026",
    updatedAt: "29 Aug 2026",
    timeline: [entry("t1", "29 Aug", "2:00 PM", "Activity created from Lead", "Amit Sharma")],
  },
  {
    id: "ACT-2026-0035",
    type: "Demo",
    title: "Product demo — Industrial Pump 5HP",
    description: "Live demo for the plant engineering team ahead of order confirmation.",
    leadId: "L-8739",
    leadName: "Eastern Exports LLC",
    assignedTo: "Sandeep Yadav",
    createdBy: "Amit Sharma",
    priority: "Medium",
    dueDateISO: "2026-09-04",
    dueTime: "15:00",
    durationMinutes: 60,
    reminder: "1 hour before",
    status: "Pending",
    source: "Lead",
    createdAt: "27 Aug 2026",
    updatedAt: "27 Aug 2026",
    timeline: [entry("t1", "27 Aug", "11:00 AM", "Activity created from Lead", "Amit Sharma")],
  },
  {
    id: "ACT-2026-0034",
    type: "Order Follow-up",
    title: "Confirm final container quantity — Kuber Traders",
    description: "Verify final container quantity before proforma invoice is issued.",
    customerId: "CUST-1008",
    customerName: "Kuber Traders",
    contactName: "Deepak Kuber",
    dealId: "D-2088",
    dealName: "Maharashtra Distributors — AMC",
    assignedTo: "Sandeep Yadav",
    createdBy: "Amit Sharma",
    priority: "Medium",
    dueDateISO: "2026-09-02",
    dueTime: "11:00",
    reminder: "1 day before",
    status: "Pending",
    source: "Deal",
    createdAt: "28 Aug 2026",
    updatedAt: "28 Aug 2026",
    timeline: [entry("t1", "28 Aug", "10:15 AM", "Activity created from Deal", "Amit Sharma")],
  },
  {
    id: "ACT-2026-0033",
    type: "Delivery Follow-up",
    title: "Delivery follow-up — Nirmal Textiles",
    description: "Confirm delivery received and request signed goods receipt note.",
    customerId: "CUST-1004",
    customerName: "Nirmal Textiles",
    contactName: "Sneha Rao",
    quotationId: "QT-2026-0005",
    quotationName: "QT-2026-0005 — Nirmal Textiles",
    assignedTo: "Pooja Patel",
    createdBy: "Pooja Patel",
    priority: "Low",
    dueDateISO: "2026-08-26",
    dueTime: "",
    reminder: "No Reminder",
    status: "Completed",
    source: "Quotation",
    createdAt: "20 Aug 2026",
    updatedAt: "26 Aug 2026",
    completedAt: "26 Aug 2026, 4:10 PM",
    completionNote: "Goods receipt note received and filed.",
    timeline: [
      entry("t1", "20 Aug", "9:30 AM", "Activity created from Quotation QT-2026-0005", "Pooja Patel"),
      entry("t2", "26 Aug", "4:10 PM", "Activity completed", "Pooja Patel"),
    ],
  },
  {
    id: "ACT-2026-0032",
    type: "Email",
    title: "Send updated price list — Royal Traders FZC",
    description: "Send updated price list with new packaging specs for Q3.",
    customerId: "CUST-1007",
    customerName: "Royal Traders FZC",
    contactName: "Ahmed Khalil",
    assignedTo: "Neha Singh",
    createdBy: "Amit Sharma",
    priority: "Medium",
    dueDateISO: "2026-08-30",
    dueTime: "14:00",
    reminder: "30 minutes before",
    status: "Completed",
    source: "Customer",
    createdAt: "27 Aug 2026",
    updatedAt: "30 Aug 2026",
    completedAt: "30 Aug 2026, 2:20 PM",
    timeline: [
      entry("t1", "27 Aug", "3:00 PM", "Activity created from Customer profile", "Amit Sharma"),
      entry("t2", "30 Aug", "2:20 PM", "Activity completed", "Neha Singh"),
    ],
  },
  {
    id: "ACT-2026-0031",
    type: "Note",
    title: "Field visit notes — Nashik region",
    description: "Log region-wise visit notes from the field trip for the monthly review.",
    assignedTo: "Pooja Patel",
    createdBy: "Pooja Patel",
    priority: "Low",
    dueDateISO: "2026-08-22",
    dueTime: "",
    reminder: "No Reminder",
    status: "Completed",
    source: "Activity Module",
    createdAt: "19 Aug 2026",
    updatedAt: "22 Aug 2026",
    completedAt: "22 Aug 2026, 11:40 AM",
    timeline: [
      entry("t1", "19 Aug", "9:00 AM", "Activity created", "Pooja Patel"),
      entry("t2", "22 Aug", "11:40 AM", "Activity completed", "Pooja Patel"),
    ],
  },
  {
    id: "ACT-2026-0030",
    type: "Reminder",
    title: "Monthly target review deck reminder",
    description: "Prepare the team's monthly target vs achievement deck.",
    assignedTo: "",
    createdBy: "Amit Sharma",
    priority: "High",
    dueDateISO: "2026-09-05",
    dueTime: "",
    reminder: "1 day before",
    status: "Pending",
    source: "Sales Dashboard",
    createdAt: "24 Aug 2026",
    updatedAt: "24 Aug 2026",
    timeline: [entry("t1", "24 Aug", "10:00 AM", "Activity created from Dashboard", "Amit Sharma")],
  },
  {
    id: "ACT-2026-0029",
    type: "Follow-up",
    title: "Follow-up call — Anand Agro",
    description: "Duplicate of an earlier WhatsApp task, safe to review and cancel if resolved.",
    leadId: "L-8735",
    leadName: "Anand Agro — Coconut Inquiry",
    assignedTo: "Pooja Patel",
    createdBy: "Amit Sharma",
    priority: "Low",
    dueDateISO: "2026-08-25",
    dueTime: "",
    reminder: "No Reminder",
    status: "Cancelled",
    source: "Lead",
    createdAt: "24 Aug 2026",
    updatedAt: "25 Aug 2026",
    timeline: [
      entry("t1", "24 Aug", "9:00 AM", "Activity created from Lead", "Amit Sharma"),
      entry("t2", "25 Aug", "10:00 AM", "Activity cancelled — duplicate", "Pooja Patel"),
    ],
  },
  {
    id: "ACT-2026-0028",
    type: "Task",
    title: "Onboard Kuber Traders on self-service portal",
    description: "Walk the customer through the self-service ordering portal.",
    customerId: "CUST-1008",
    customerName: "Kuber Traders",
    contactName: "Deepak Kuber",
    assignedTo: "Sandeep Yadav",
    createdBy: "Amit Sharma",
    priority: "Low",
    dueDateISO: "2026-09-06",
    dueTime: "",
    reminder: "No Reminder",
    status: "Rescheduled",
    source: "Customer",
    createdAt: "20 Aug 2026",
    updatedAt: "31 Aug 2026",
    timeline: [
      entry("t1", "20 Aug", "9:00 AM", "Activity created from Customer profile", "Amit Sharma"),
      entry("t2", "31 Aug", "4:00 PM", "Rescheduled — customer requested next week", "Sandeep Yadav"),
    ],
  },
];

function deriveStatus(a: Activity): ActivityStatus {
  if (a.status === "Completed" || a.status === "Cancelled") return a.status;
  if (a.dueDateISO < ACTIVITY_TODAY_ISO) return "Overdue";
  return a.status === "Rescheduled" ? "Rescheduled" : "Pending";
}

export const activitiesList: Activity[] = rawActivities.map((a) => ({ ...a, status: deriveStatus(a) }));

// ---------------------------------------------------------------------------
// Derived views
// ---------------------------------------------------------------------------

export function daysOverdue(a: Activity): number {
  const due = new Date(a.dueDateISO);
  const today = new Date(ACTIVITY_TODAY_ISO);
  const diff = Math.round((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(diff, 0);
}

export function computeActivityKpis(rows: Activity[] = activitiesList) {
  const mine = rows.filter((a) => a.assignedTo === CURRENT_USER).length;
  const today = rows.filter(
    (a) => a.dueDateISO === ACTIVITY_TODAY_ISO && a.status !== "Cancelled" && a.status !== "Completed",
  ).length;
  const upcoming = rows.filter(
    (a) => a.dueDateISO > ACTIVITY_TODAY_ISO && a.status !== "Cancelled" && a.status !== "Completed",
  ).length;
  const overdue = rows.filter((a) => a.status === "Overdue").length;
  const completed = rows.filter((a) => a.status === "Completed").length;
  const highPriority = rows.filter(
    (a) => a.priority === "High" && a.status !== "Completed" && a.status !== "Cancelled",
  ).length;
  const unassigned = rows.filter((a) => !a.assignedTo).length;
  return { mine, today, upcoming, overdue, completed, highPriority, unassigned };
}

export const relatedToOptions = ["Customer", "Contact", "Lead", "Deal", "Quotation", "None"] as const;
export type RelatedToOption = (typeof relatedToOptions)[number];

export function activityRelatedKind(a: Activity): RelatedToOption {
  if (a.customerId) return "Customer";
  if (a.leadId) return "Lead";
  if (a.dealId) return "Deal";
  if (a.quotationId) return "Quotation";
  return "None";
}

export function activityPrimaryRelatedLabel(a: Activity): string {
  return a.customerName ?? a.leadName ?? a.dealName ?? a.quotationName ?? "—";
}

export function newActivityId(): string {
  const year = new Date().getFullYear();
  const numbers = activitiesList
    .filter((a) => a.id.startsWith(`ACT-${year}-`))
    .map((a) => Number(a.id.split("-")[2]));
  const next = (numbers.length ? Math.max(...numbers) : 0) + 1;
  return `ACT-${year}-${String(next).padStart(4, "0")}`;
}
