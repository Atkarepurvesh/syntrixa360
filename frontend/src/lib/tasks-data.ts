import { salesExecutives } from "@/lib/pipeline-data";

export type TaskType =
  | "Call"
  | "Email"
  | "WhatsApp"
  | "Meeting"
  | "Task"
  | "Follow-up"
  | "Quotation"
  | "Order"
  | "Invoice"
  | "Other";

export type TaskPriority = "High" | "Medium" | "Low";

export type TaskStatus = "Pending" | "In Progress" | "Completed" | "Overdue" | "Cancelled";

export type TaskReminder =
  | "No Reminder"
  | "15 minutes before"
  | "30 minutes before"
  | "1 hour before"
  | "1 day before"
  | "Custom";

export type RelatedKind = "Lead" | "Customer" | "Deal" | "Product" | "None";

export type TaskActivity = {
  id: string;
  date: string;
  title: string;
};

export type Task = {
  id: string;
  title: string;
  description: string;
  relatedKind: RelatedKind;
  relatedName: string;
  companyId?: string;
  leadId?: string;
  dealId?: string;
  dealValue?: string;
  product?: string;
  taskType: TaskType;
  priority: TaskPriority;
  dueDateISO: string; // yyyy-mm-dd, used for overdue calculation
  dueTime: string; // "HH:mm" 24h, "" if none
  due: string; // display label, e.g. "Today, 11:00 AM"
  assignedTo: string;
  createdBy: string;
  status: TaskStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  completionComment?: string;
  reminder: TaskReminder;
  timeline: TaskActivity[];
};

export { salesExecutives };

export const taskTypes: TaskType[] = [
  "Call",
  "Email",
  "WhatsApp",
  "Meeting",
  "Task",
  "Follow-up",
  "Quotation",
  "Order",
  "Invoice",
  "Other",
];

export const taskPriorities: TaskPriority[] = ["High", "Medium", "Low"];

export const taskReminders: TaskReminder[] = [
  "No Reminder",
  "15 minutes before",
  "30 minutes before",
  "1 hour before",
  "1 day before",
  "Custom",
];

// "Today" in this dataset — kept fixed so status derivation is deterministic.
export const TODAY_ISO = "2026-08-30";

const rawTasks: Task[] = [
  {
    id: "T-2101",
    title: "Call with Eastern Exports LLC",
    description: "Discuss revised container quantity and confirm Incoterms before quotation.",
    relatedKind: "Lead",
    relatedName: "Eastern Exports LLC",
    leadId: "L-8742",
    taskType: "Call",
    priority: "High",
    dueDateISO: "2026-08-30",
    dueTime: "11:00",
    due: "Today, 11:00 AM",
    assignedTo: "Rahul Verma",
    createdBy: "Amit Sharma",
    status: "Pending",
    notes: "Customer prefers calls in the morning IST.",
    createdAt: "28 Aug 2026",
    updatedAt: "29 Aug 2026",
    reminder: "15 minutes before",
    timeline: [
      { id: "a1", date: "28 Aug", title: "Task created" },
      { id: "a2", date: "28 Aug", title: "Assigned to Rahul Sharma" },
      { id: "a3", date: "29 Aug", title: "Reminder scheduled" },
    ],
  },
  {
    id: "T-2102",
    title: "Email to Royal Traders FZC",
    description: "Send updated price list with new packaging specs.",
    relatedKind: "Customer",
    relatedName: "Royal Traders FZC",
    companyId: "C-121",
    taskType: "Email",
    priority: "Medium",
    dueDateISO: "2026-08-30",
    dueTime: "14:00",
    due: "Today, 02:00 PM",
    assignedTo: "Neha Singh",
    createdBy: "Amit Sharma",
    status: "Pending",
    notes: "Attach latest catalog PDF.",
    createdAt: "27 Aug 2026",
    updatedAt: "27 Aug 2026",
    reminder: "30 minutes before",
    timeline: [
      { id: "a1", date: "27 Aug", title: "Task created" },
      { id: "a2", date: "27 Aug", title: "Assigned to Neha Singh" },
    ],
  },
  {
    id: "T-2103",
    title: "WhatsApp with ABC International Pvt Ltd",
    description: "Share dispatch schedule and confirm delivery address.",
    relatedKind: "Customer",
    relatedName: "ABC International Pvt Ltd",
    companyId: "C-241",
    taskType: "WhatsApp",
    priority: "Medium",
    dueDateISO: "2026-08-30",
    dueTime: "16:00",
    due: "Today, 04:00 PM",
    assignedTo: "Arjun Mehta",
    createdBy: "Amit Sharma",
    status: "Pending",
    notes: "",
    createdAt: "29 Aug 2026",
    updatedAt: "29 Aug 2026",
    reminder: "No Reminder",
    timeline: [{ id: "a1", date: "29 Aug", title: "Task created" }],
  },
  {
    id: "T-2104",
    title: "Meeting with Global Foods LLC",
    description: "Onsite meeting to finalize Q4 distribution terms.",
    relatedKind: "Deal",
    relatedName: "Global Foods LLC",
    dealId: "D-2238",
    dealValue: "₹9,10,000",
    product: "Fresh Coconut",
    taskType: "Meeting",
    priority: "High",
    dueDateISO: "2026-08-30",
    dueTime: "17:30",
    due: "Today, 05:30 PM",
    assignedTo: "Pooja Patel",
    createdBy: "Amit Sharma",
    status: "Pending",
    notes: "Bring signed sample agreement.",
    createdAt: "25 Aug 2026",
    updatedAt: "28 Aug 2026",
    reminder: "1 hour before",
    timeline: [
      { id: "a1", date: "25 Aug", title: "Task created" },
      { id: "a2", date: "25 Aug", title: "Assigned to Pooja Patel" },
      { id: "a3", date: "28 Aug", title: "Reminder scheduled" },
    ],
  },
  {
    id: "T-2088",
    title: "Send Quotation to Best Deal Exports",
    description: "Prepare and send quotation for the revised order quantity.",
    relatedKind: "Lead",
    relatedName: "Best Deal Exports",
    leadId: "L-8739",
    taskType: "Quotation",
    priority: "High",
    dueDateISO: "2026-08-28",
    dueTime: "12:00",
    due: "28 Aug 2026",
    assignedTo: "Rahul Verma",
    createdBy: "Amit Sharma",
    status: "Overdue",
    notes: "Customer has followed up twice already.",
    createdAt: "24 Aug 2026",
    updatedAt: "28 Aug 2026",
    reminder: "1 day before",
    timeline: [
      { id: "a1", date: "24 Aug", title: "Task created" },
      { id: "a2", date: "26 Aug", title: "Task rescheduled" },
    ],
  },
  {
    id: "T-2079",
    title: "WhatsApp: Sahara Exports",
    description: "Follow up on pending payment confirmation.",
    relatedKind: "Customer",
    relatedName: "Sahara Exports",
    companyId: "C-207",
    taskType: "WhatsApp",
    priority: "Medium",
    dueDateISO: "2026-08-29",
    dueTime: "10:00",
    due: "29 Aug 2026",
    assignedTo: "Sandeep Yadav",
    createdBy: "Amit Sharma",
    status: "Overdue",
    notes: "",
    createdAt: "26 Aug 2026",
    updatedAt: "29 Aug 2026",
    reminder: "No Reminder",
    timeline: [{ id: "a1", date: "26 Aug", title: "Task created" }],
  },
  {
    id: "T-2071",
    title: "Prepare Invoice: United Trading Co.",
    description: "Prepare final invoice after order confirmation.",
    relatedKind: "Deal",
    relatedName: "United Trading Co.",
    dealId: "D-2199",
    dealValue: "₹5,40,000",
    taskType: "Invoice",
    priority: "High",
    dueDateISO: "2026-08-27",
    dueTime: "18:00",
    due: "27 Aug 2026",
    assignedTo: "Arjun Mehta",
    createdBy: "Amit Sharma",
    status: "Overdue",
    notes: "Waiting on final quantity from warehouse.",
    createdAt: "23 Aug 2026",
    updatedAt: "27 Aug 2026",
    reminder: "1 hour before",
    timeline: [
      { id: "a1", date: "23 Aug", title: "Task created" },
      { id: "a2", date: "23 Aug", title: "Assigned to Ankit Patel" },
    ],
  },
  {
    id: "T-2065",
    title: "Confirm order quantity — Kuber Traders",
    description: "Verify final container quantity before proforma is issued.",
    relatedKind: "Deal",
    relatedName: "Kuber Traders",
    dealId: "D-2176",
    dealValue: "₹1,80,000",
    taskType: "Order",
    priority: "Medium",
    dueDateISO: "2026-09-02",
    dueTime: "11:00",
    due: "02 Sep 2026",
    assignedTo: "Sandeep Yadav",
    createdBy: "Amit Sharma",
    status: "Pending",
    notes: "",
    createdAt: "28 Aug 2026",
    updatedAt: "28 Aug 2026",
    reminder: "1 day before",
    timeline: [{ id: "a1", date: "28 Aug", title: "Task created" }],
  },
  {
    id: "T-2058",
    title: "Follow-up quotation — Sharma Industries",
    description: "Check if the revised quotation Q-2030 has been reviewed.",
    relatedKind: "Lead",
    relatedName: "Sharma Industries",
    leadId: "L-8736",
    taskType: "Follow-up",
    priority: "Medium",
    dueDateISO: "2026-09-03",
    dueTime: "",
    due: "03 Sep 2026",
    assignedTo: "Arjun Mehta",
    createdBy: "Amit Sharma",
    status: "Pending",
    notes: "",
    createdAt: "29 Aug 2026",
    updatedAt: "29 Aug 2026",
    reminder: "No Reminder",
    timeline: [{ id: "a1", date: "29 Aug", title: "Task created" }],
  },
  {
    id: "T-2041",
    title: "Onboard Kuber Traders on portal",
    description: "Walk the customer through the self-service ordering portal.",
    relatedKind: "Customer",
    relatedName: "Kuber Traders",
    companyId: "C-214",
    taskType: "Task",
    priority: "Low",
    dueDateISO: "2026-08-24",
    dueTime: "",
    due: "24 Aug 2026",
    assignedTo: "Sandeep Yadav",
    createdBy: "Amit Sharma",
    status: "Completed",
    notes: "Portal walkthrough completed successfully.",
    createdAt: "20 Aug 2026",
    updatedAt: "24 Aug 2026",
    completedAt: "24 Aug 2026, 04:12 PM",
    completionComment: "Customer onboarded, first test order placed.",
    reminder: "No Reminder",
    timeline: [
      { id: "a1", date: "20 Aug", title: "Task created" },
      { id: "a2", date: "24 Aug", title: "Task completed" },
    ],
  },
  {
    id: "T-2035",
    title: "Update CRM notes for Nashik region",
    description: "Log region-wise visit notes from the field trip.",
    relatedKind: "None",
    relatedName: "—",
    taskType: "Task",
    priority: "Low",
    dueDateISO: "2026-08-22",
    dueTime: "",
    due: "22 Aug 2026",
    assignedTo: "Pooja Patel",
    createdBy: "Amit Sharma",
    status: "Completed",
    notes: "",
    createdAt: "19 Aug 2026",
    updatedAt: "22 Aug 2026",
    completedAt: "22 Aug 2026, 11:40 AM",
    reminder: "No Reminder",
    timeline: [
      { id: "a1", date: "19 Aug", title: "Task created" },
      { id: "a2", date: "22 Aug", title: "Task completed" },
    ],
  },
  {
    id: "T-2028",
    title: "Monthly target review deck",
    description: "Prepare the team's monthly target vs achievement deck.",
    relatedKind: "None",
    relatedName: "—",
    taskType: "Task",
    priority: "High",
    dueDateISO: "2026-09-05",
    dueTime: "",
    due: "05 Sep 2026",
    assignedTo: "Karan Mehta",
    createdBy: "Amit Sharma",
    status: "In Progress",
    notes: "First draft shared with the owner for review.",
    createdAt: "24 Aug 2026",
    updatedAt: "29 Aug 2026",
    reminder: "1 day before",
    timeline: [
      { id: "a1", date: "24 Aug", title: "Task created" },
      { id: "a2", date: "29 Aug", title: "Marked in progress" },
    ],
  },
  {
    id: "T-2019",
    title: "Schedule negotiation meeting — ABC International",
    description: "Coordinate calendars for the negotiation session next week.",
    relatedKind: "Deal",
    relatedName: "ABC International Pvt Ltd",
    dealId: "D-2214",
    dealValue: "₹12,50,000",
    taskType: "Meeting",
    priority: "High",
    dueDateISO: "2026-09-04",
    dueTime: "15:00",
    due: "04 Sep 2026",
    assignedTo: "Rahul Verma",
    createdBy: "Amit Sharma",
    status: "Pending",
    notes: "",
    createdAt: "27 Aug 2026",
    updatedAt: "27 Aug 2026",
    reminder: "1 hour before",
    timeline: [{ id: "a1", date: "27 Aug", title: "Task created" }],
  },
  {
    id: "T-2011",
    title: "Payment follow-up — Nirmal Textiles",
    description: "Confirm pending payment for invoice INV-3311.",
    relatedKind: "Customer",
    relatedName: "Nirmal Textiles",
    companyId: "C-183",
    taskType: "Follow-up",
    priority: "Medium",
    dueDateISO: "2026-08-31",
    dueTime: "10:30",
    due: "31 Aug 2026",
    assignedTo: "Karan Mehta",
    createdBy: "Amit Sharma",
    status: "Pending",
    notes: "",
    createdAt: "28 Aug 2026",
    updatedAt: "28 Aug 2026",
    reminder: "30 minutes before",
    timeline: [{ id: "a1", date: "28 Aug", title: "Task created" }],
  },
  {
    id: "T-1998",
    title: "Cancel duplicate WhatsApp task — Anand Agro",
    description: "Duplicate of T-2001, safe to cancel.",
    relatedKind: "Lead",
    relatedName: "Anand Agro",
    leadId: "L-8735",
    taskType: "WhatsApp",
    priority: "Low",
    dueDateISO: "2026-08-25",
    dueTime: "",
    due: "25 Aug 2026",
    assignedTo: "Pooja Patel",
    createdBy: "Amit Sharma",
    status: "Cancelled",
    notes: "Cancelled — duplicate task.",
    createdAt: "24 Aug 2026",
    updatedAt: "25 Aug 2026",
    reminder: "No Reminder",
    timeline: [
      { id: "a1", date: "24 Aug", title: "Task created" },
      { id: "a2", date: "25 Aug", title: "Task cancelled" },
    ],
  },
];

// Derive status live from due date/time against TODAY_ISO, unless Completed/Cancelled.
function deriveStatus(t: Task): TaskStatus {
  if (t.status === "Completed" || t.status === "Cancelled") return t.status;
  if (t.dueDateISO < TODAY_ISO) return "Overdue";
  if (t.dueDateISO === TODAY_ISO && t.dueTime) {
    // still same-day — keep whatever pending/in-progress state was set
    return t.status === "In Progress" ? "In Progress" : "Pending";
  }
  return t.status === "In Progress" ? "In Progress" : "Pending";
}

export const taskList: Task[] = rawTasks.map((t) => ({ ...t, status: deriveStatus(t) }));

// ---------- Derived views ----------

export function daysOverdue(t: Task): number {
  const due = new Date(t.dueDateISO);
  const today = new Date(TODAY_ISO);
  const diff = Math.round((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(diff, 0);
}

export const overdueTasks = taskList
  .filter((t) => t.status === "Overdue")
  .sort((a, b) => daysOverdue(b) - daysOverdue(a));

export const todaysSchedule = taskList
  .filter((t) => t.dueDateISO === TODAY_ISO && t.status !== "Cancelled" && t.status !== "Completed")
  .sort((a, b) => a.dueTime.localeCompare(b.dueTime));

function count(pred: (t: Task) => boolean) {
  return taskList.filter(pred).length;
}

export function computeTaskKpis(rows: Task[] = taskList) {
  const total = rows.length;
  const completed = rows.filter((t) => t.status === "Completed").length;
  const pending = rows.filter((t) => t.status === "Pending" || t.status === "In Progress").length;
  const overdue = rows.filter((t) => t.status === "Overdue").length;
  const highPriority = rows.filter((t) => t.priority === "High" && t.status !== "Completed" && t.status !== "Cancelled").length;
  const completionRate = total > 0 ? Math.round((completed / total) * 1000) / 10 : 0;
  return { total, completed, pending, overdue, highPriority, completionRate };
}

export const taskKpiMeta = [
  { id: "total", label: "Total Tasks", icon: "list", tone: "primary" },
  { id: "completed", label: "Completed", icon: "check", tone: "success" },
  { id: "pending", label: "Pending", icon: "clock", tone: "info" },
  { id: "overdue", label: "Overdue", icon: "alert", tone: "danger" },
  { id: "highPriority", label: "High Priority", icon: "warning", tone: "warning" },
  { id: "completionRate", label: "Completion Rate", icon: "check", tone: "success" },
] as const;

const statusColors: Record<"Pending" | "Completed" | "Overdue", string> = {
  Pending: "var(--chart-1, #6366f1)",
  Completed: "var(--chart-2, #22c55e)",
  Overdue: "var(--destructive, #ef4444)",
};

export function computeTaskOverview(rows: Task[] = taskList) {
  return [
    {
      name: "Pending",
      slug: "pending",
      value: rows.filter((t) => t.status === "Pending" || t.status === "In Progress").length,
      color: statusColors.Pending,
    },
    {
      name: "Completed",
      slug: "completed",
      value: rows.filter((t) => t.status === "Completed").length,
      color: statusColors.Completed,
    },
    {
      name: "Overdue",
      slug: "overdue",
      value: rows.filter((t) => t.status === "Overdue").length,
      color: statusColors.Overdue,
    },
  ];
}

const typeColors: Partial<Record<TaskType, string>> = {
  Call: "var(--chart-1, #6366f1)",
  Email: "var(--chart-3, #f59e0b)",
  WhatsApp: "var(--chart-2, #22c55e)",
  Task: "var(--chart-4, #ec4899)",
  Meeting: "var(--chart-5, #8b5cf6)",
  "Follow-up": "#0ea5a4",
};

const byTypeVisible: TaskType[] = ["Call", "Email", "WhatsApp", "Task", "Meeting", "Follow-up"];

export function computeTaskByType(rows: Task[] = taskList) {
  return byTypeVisible.map((type) => ({
    name: type,
    slug: type.toLowerCase().replace(/\s+/g, "-"),
    value: rows.filter((t) => t.taskType === type).length,
    color: typeColors[type] ?? "#94a3b8",
  }));
}

export function computeExecutivePerformance(rows: Task[] = taskList) {
  return salesExecutives.map((name) => {
    const mine = rows.filter((t) => t.assignedTo === name);
    const total = mine.length;
    const completed = mine.filter((t) => t.status === "Completed").length;
    const pending = mine.filter((t) => t.status === "Pending" || t.status === "In Progress").length;
    const overdue = mine.filter((t) => t.status === "Overdue").length;
    const completionRate = total > 0 ? Math.round((completed / total) * 1000) / 10 : 0;
    return { name, total, completed, pending, overdue, completionRate };
  });
}
