import { salesExecutives } from "@/lib/pipeline-data";

export { salesExecutives };

export type EventType =
  "Meeting" | "Follow-up" | "Call" | "Task" | "Activity" | "Reminder" | "Customer Visit" | "Demo";

export const eventTypes: EventType[] = [
  "Meeting",
  "Follow-up",
  "Call",
  "Task",
  "Activity",
  "Reminder",
  "Customer Visit",
  "Demo",
];

export type EventStatus = "Planned" | "In Progress" | "Completed" | "Overdue" | "Cancelled";

export type EventPriority = "High" | "Medium" | "Low";

export type EventReminder =
  | "No Reminder"
  | "5 minutes before"
  | "10 minutes before"
  | "15 minutes before"
  | "30 minutes before"
  | "1 hour before"
  | "1 day before"
  | "Custom";

export type CalendarHistoryEntry = {
  id: string;
  date: string;
  title: string;
};

export type CalendarEvent = {
  id: string;
  title: string;
  eventType: EventType;
  dateISO: string; // yyyy-mm-dd
  startTime: string; // "HH:mm" 24h
  endTime?: string | undefined; // "HH:mm" 24h
  timeLabel: string; // display, e.g. "11:00 AM"
  customer?: string | undefined;
  company?: string | undefined;
  contact?: string | undefined;
  dealId?: string | undefined;
  deal?: string | undefined;
  quotationId?: string | undefined;
  quotation?: string | undefined;
  assignedTo: string;
  status: EventStatus;
  priority: EventPriority;
  location?: string | undefined;
  meetingLink?: string | undefined;
  notes?: string | undefined;
  nextAction?: string | undefined;
  outcome?: string | undefined;
  reminder: EventReminder;
  originalDateISO?: string | undefined;
  originalTimeLabel?: string | undefined;
  history: CalendarHistoryEntry[];
};

// Aligned with the mock "today" used across the app's Tasks module.
export const TODAY_ISO = "2026-08-30";

function label(dateISO: string) {
  const d = new Date(`${dateISO}T00:00:00`);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const dayNamesLong = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function addDays(dateISO: string, days: number) {
  const d = new Date(`${dateISO}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function startOfWeek(dateISO: string) {
  const d = new Date(`${dateISO}T00:00:00`);
  const day = d.getDay();
  return addDays(dateISO, -day);
}

export function formatDateLabel(dateISO: string) {
  return label(dateISO);
}

export function formatDayHeading(dateISO: string) {
  const d = new Date(`${dateISO}T00:00:00`);
  return `${dayNamesLong[d.getDay()]}, ${label(dateISO)}`;
}

export function monthGrid(dateISO: string) {
  const d = new Date(`${dateISO}T00:00:00`);
  const firstOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
  const start = addDays(firstOfMonth.toISOString().slice(0, 10), -firstOfMonth.getDay());
  const weeks: string[][] = [];
  let cursor = start;
  for (let w = 0; w < 6; w++) {
    const week: string[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(cursor);
      cursor = addDays(cursor, 1);
    }
    weeks.push(week);
  }
  return weeks;
}

export function monthLabel(dateISO: string) {
  const d = new Date(`${dateISO}T00:00:00`);
  return d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

export function isSameMonth(dateISO: string, refISO: string) {
  return dateISO.slice(0, 7) === refISO.slice(0, 7);
}

/** Live status: derives Overdue from date/time vs TODAY_ISO unless already Completed/Cancelled. */
export function liveStatus(e: CalendarEvent): EventStatus {
  if (e.status === "Completed" || e.status === "Cancelled") return e.status;
  if (e.dateISO < TODAY_ISO) return "Overdue";
  if (e.dateISO === TODAY_ISO && e.startTime) {
    const now = "12:00"; // fixed reference "current time" for the mock
    if (e.startTime < now && e.status === "Planned") return "Overdue";
  }
  return e.status;
}

const t = (h: number, m: number) => `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
const tl = (h: number, m: number) => {
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
};

const seed: Omit<CalendarEvent, "history">[] = [
  {
    id: "EV-3001",
    title: "Price Negotiation Call",
    eventType: "Call",
    dateISO: addDays(TODAY_ISO, -2),
    startTime: t(11, 0),
    timeLabel: tl(11, 0),
    customer: "Bright Steel Pvt. Ltd.",
    company: "Bright Steel Pvt. Ltd.",
    contact: "Rohit Jain",
    dealId: "D-1180",
    deal: "Bright Steel — Renewal",
    quotationId: "Q-2034",
    quotation: "Q-2034",
    assignedTo: "Rahul Verma",
    status: "Planned",
    priority: "High",
    notes: "Customer asked for a lower price on the revised quotation.",
    nextAction: "Send revised quotation",
    reminder: "30 minutes before",
  },
  {
    id: "EV-3002",
    title: "Quotation Follow-up",
    eventType: "Follow-up",
    dateISO: addDays(TODAY_ISO, -1),
    startTime: t(16, 0),
    timeLabel: tl(16, 0),
    customer: "Sharma Industries",
    company: "Sharma Industries",
    contact: "Vikram Sharma",
    dealId: "D-1170",
    deal: "Sharma Industries — Retrofit",
    quotationId: "Q-2030",
    quotation: "Q-2030",
    assignedTo: "Arjun Mehta",
    status: "Planned",
    priority: "Medium",
    notes: "Follow up after quotation was rejected — understand the reason.",
    reminder: "15 minutes before",
  },
  {
    id: "EV-3003",
    title: "Payment Follow-up",
    eventType: "Follow-up",
    dateISO: addDays(TODAY_ISO, -3),
    startTime: t(10, 0),
    timeLabel: tl(10, 0),
    customer: "Kuber Traders",
    company: "Kuber Traders",
    contact: "Devang Mehta",
    dealId: "D-1176",
    deal: "Kuber Traders — Order",
    assignedTo: "Sandeep Yadav",
    status: "Planned",
    priority: "High",
    notes: "Outstanding balance pending since last order.",
    reminder: "1 hour before",
  },
  {
    id: "EV-3004",
    title: "Call — ABC Trading",
    eventType: "Call",
    dateISO: TODAY_ISO,
    startTime: t(9, 30),
    timeLabel: tl(9, 30),
    customer: "Shreeji Traders",
    company: "Shreeji Traders",
    contact: "Nilesh Shah",
    dealId: "D-1204",
    deal: "Shreeji Traders — Negotiation",
    assignedTo: "Rahul Verma",
    status: "Planned",
    priority: "High",
    notes: "Confirm quotation and discuss delivery timeline.",
    reminder: "10 minutes before",
  },
  {
    id: "EV-3005",
    title: "Follow-up — Global Exports",
    eventType: "Follow-up",
    dateISO: TODAY_ISO,
    startTime: t(10, 30),
    timeLabel: tl(10, 30),
    customer: "Global Exports Ltd.",
    company: "Global Exports Ltd.",
    contact: "Meera Iyer",
    dealId: "D-1198",
    deal: "Global Exports — Quotation",
    quotationId: "Q-2043",
    quotation: "Q-2043",
    assignedTo: "Neha Singh",
    status: "Planned",
    priority: "High",
    notes: "Quotation shared, awaiting confirmation.",
    reminder: "15 minutes before",
  },
  {
    id: "EV-3006",
    title: "Quotation Discussion — Maharashtra Distributors",
    eventType: "Meeting",
    dateISO: TODAY_ISO,
    startTime: t(12, 0),
    endTime: t(13, 0),
    timeLabel: tl(12, 0),
    customer: "Maharashtra Distributors",
    company: "Maharashtra Distributors",
    contact: "Ajay Kulkarni",
    dealId: "D-1190",
    deal: "Maharashtra Distributors — Negotiation",
    quotationId: "Q-2038",
    quotation: "Q-2038",
    assignedTo: "Arjun Mehta",
    status: "Planned",
    priority: "High",
    location: "Client Office, Pune",
    notes: "Discuss revised terms and close the negotiation.",
    reminder: "1 hour before",
  },
  {
    id: "EV-3007",
    title: "Product Demo — Kisan Agro",
    eventType: "Demo",
    dateISO: TODAY_ISO,
    startTime: t(15, 0),
    endTime: t(15, 45),
    timeLabel: tl(15, 0),
    customer: "Kisan Agro Pvt. Ltd.",
    company: "Kisan Agro Pvt. Ltd.",
    contact: "Sushil Patil",
    dealId: "D-1187",
    deal: "Kisan Agro — Qualified",
    assignedTo: "Pooja Patel",
    status: "Planned",
    priority: "Medium",
    meetingLink: "https://meet.syntrixa360.com/kisan-agro-demo",
    notes: "Demo of the industrial pump range.",
    reminder: "30 minutes before",
  },
  {
    id: "EV-3008",
    title: "Payment Follow-up — Bright Steel",
    eventType: "Follow-up",
    dateISO: TODAY_ISO,
    startTime: t(16, 30),
    timeLabel: tl(16, 30),
    customer: "Bright Steel Pvt. Ltd.",
    company: "Bright Steel Pvt. Ltd.",
    contact: "Rohit Jain",
    dealId: "D-1180",
    deal: "Bright Steel — Renewal",
    assignedTo: "Rahul Verma",
    status: "Planned",
    priority: "Medium",
    notes: "Confirm payment receipt for the last order.",
    reminder: "15 minutes before",
  },
  {
    id: "EV-3009",
    title: "Onboarding Task — Kuber Traders",
    eventType: "Task",
    dateISO: TODAY_ISO,
    startTime: t(17, 0),
    timeLabel: tl(17, 0),
    customer: "Kuber Traders",
    company: "Kuber Traders",
    assignedTo: "Sandeep Yadav",
    status: "Planned",
    priority: "Low",
    notes: "Complete portal onboarding checklist.",
    reminder: "No Reminder",
  },
  {
    id: "EV-3010",
    title: "Weekly Sales Review",
    eventType: "Meeting",
    dateISO: addDays(TODAY_ISO, 1),
    startTime: t(10, 0),
    endTime: t(11, 0),
    timeLabel: tl(10, 0),
    assignedTo: "Amit Sharma",
    status: "Planned",
    priority: "Medium",
    location: "Conference Room",
    notes: "Weekly review of pipeline and team performance.",
    reminder: "1 day before",
  },
  {
    id: "EV-3011",
    title: "Follow up on revised quotation",
    eventType: "Follow-up",
    dateISO: addDays(TODAY_ISO, 3),
    startTime: t(11, 0),
    timeLabel: tl(11, 0),
    customer: "Shreeji Traders",
    company: "Shreeji Traders",
    contact: "Nilesh Shah",
    dealId: "D-1204",
    deal: "Shreeji Traders — Negotiation",
    quotationId: "Q-2041",
    quotation: "Q-2041",
    assignedTo: "Rahul Verma",
    status: "Planned",
    priority: "High",
    notes: "Follow up on the revised quotation after price discussion.",
    reminder: "30 minutes before",
  },
  {
    id: "EV-3012",
    title: "Customer Visit — Nirmal Textiles",
    eventType: "Customer Visit",
    dateISO: addDays(TODAY_ISO, 2),
    startTime: t(14, 0),
    endTime: t(15, 0),
    timeLabel: tl(14, 0),
    customer: "Nirmal Textiles",
    company: "Nirmal Textiles",
    contact: "Sneha Rao",
    dealId: "D-1165",
    deal: "Nirmal Textiles — Contacted",
    assignedTo: "Pooja Patel",
    status: "Planned",
    priority: "Medium",
    location: "Coimbatore",
    notes: "First on-site visit to understand requirements.",
    reminder: "1 hour before",
  },
  {
    id: "EV-3013",
    title: "Call — Vikas Enterprises",
    eventType: "Call",
    dateISO: addDays(TODAY_ISO, 1),
    startTime: t(9, 0),
    timeLabel: tl(9, 0),
    customer: "Vikas Enterprises",
    company: "Vikas Enterprises",
    dealId: "D-1155",
    deal: "Vikas Enterprises — Negotiation",
    assignedTo: "Sandeep Yadav",
    status: "Planned",
    priority: "High",
    notes: "Discuss discount approval for the deal.",
    reminder: "10 minutes before",
  },
  {
    id: "EV-3014",
    title: "Task — Update CRM notes",
    eventType: "Task",
    dateISO: addDays(TODAY_ISO, 4),
    startTime: t(9, 0),
    timeLabel: tl(9, 0),
    assignedTo: "Pooja Patel",
    status: "Planned",
    priority: "Low",
    notes: "Update CRM notes for the Nashik region accounts.",
    reminder: "No Reminder",
  },
  {
    id: "EV-3015",
    title: "Quotation Follow-up — Anand Agro",
    eventType: "Follow-up",
    dateISO: addDays(TODAY_ISO, 5),
    startTime: t(11, 30),
    timeLabel: tl(11, 30),
    customer: "Anand Agro",
    company: "Anand Agro",
    dealId: "D-1160",
    deal: "Anand Agro — New Lead",
    assignedTo: "Pooja Patel",
    status: "Planned",
    priority: "Low",
    notes: "First follow-up after lead qualification.",
    reminder: "15 minutes before",
  },
  {
    id: "EV-3016",
    title: "Reminder — Renew AMC",
    eventType: "Reminder",
    dateISO: addDays(TODAY_ISO, 6),
    startTime: t(9, 0),
    timeLabel: tl(9, 0),
    customer: "Global Exports Ltd.",
    company: "Global Exports Ltd.",
    assignedTo: "Neha Singh",
    status: "Planned",
    priority: "Medium",
    notes: "AMC contract renewal reminder.",
    reminder: "1 day before",
  },
  {
    id: "EV-3017",
    title: "Demo — Sharma Industries",
    eventType: "Demo",
    dateISO: addDays(TODAY_ISO, -5),
    startTime: t(11, 0),
    timeLabel: tl(11, 0),
    customer: "Sharma Industries",
    company: "Sharma Industries",
    assignedTo: "Arjun Mehta",
    status: "Completed",
    priority: "Medium",
    outcome: "Requirement Received",
    notes: "Demo went well, customer requested a quotation.",
    reminder: "30 minutes before",
  },
  {
    id: "EV-3018",
    title: "Meeting — DEF Manufacturing",
    eventType: "Meeting",
    dateISO: addDays(TODAY_ISO, -4),
    startTime: t(12, 0),
    endTime: t(12, 45),
    timeLabel: tl(12, 0),
    customer: "Maharashtra Distributors",
    company: "Maharashtra Distributors",
    assignedTo: "Arjun Mehta",
    status: "Completed",
    priority: "Medium",
    outcome: "Negotiation",
    notes: "Discussed pricing structure.",
    reminder: "15 minutes before",
  },
];

export const eventList: CalendarEvent[] = seed.map((e) => ({
  ...e,
  history: [{ id: `${e.id}-h1`, date: label(TODAY_ISO), title: `${e.eventType} scheduled` }],
}));

export const eventTypeCounts = (rows: CalendarEvent[]) => {
  const counts: Record<string, number> = {};
  for (const r of rows) counts[r.eventType] = (counts[r.eventType] ?? 0) + 1;
  return counts;
};

/**
 * Converts "HH:mm" into minutes-since-midnight for easy range comparison.
 */
function toMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/**
 * Section 24 (Conflict Detection): for a given assignee + date + time window,
 * return every other Planned/In Progress event that overlaps it.
 *
 * - Only Planned / In Progress events count as conflicts — Completed/Cancelled/
 *   Overdue events never block a new booking.
 * - `excludeEventId` lets a reschedule/edit ignore the event's own current slot.
 * - Events with no `endTime` are treated as a 30-minute block for overlap purposes,
 *   which is a reasonable default for calls/quick check-ins.
 */
export function findConflicts(
  events: CalendarEvent[],
  assignedTo: string,
  dateISO: string,
  startTime: string,
  endTime: string | undefined,
  excludeEventId?: string,
): CalendarEvent[] {
  const newStart = toMinutes(startTime);
  const newEnd = endTime ? toMinutes(endTime) : newStart + 30;

  return events.filter((e) => {
    if (e.id === excludeEventId) return false;
    if (e.assignedTo !== assignedTo) return false;
    if (e.dateISO !== dateISO) return false;
    const status = liveStatus(e);
    if (status !== "Planned" && status !== "In Progress") return false;

    const existingStart = toMinutes(e.startTime);
    const existingEnd = e.endTime ? toMinutes(e.endTime) : existingStart + 30;

    // Standard interval overlap check.
    return newStart < existingEnd && existingStart < newEnd;
  });
}

/**
 * Section 15 (Drag-and-Drop Reschedule) + Section 20 (Event History):
 * pure function that returns a new CalendarEvent with the date/time updated,
 * the original slot preserved (only on the *first* reschedule), and a history
 * entry appended. Never mutates the input event.
 */
export function applyReschedule(
  event: CalendarEvent,
  newDateISO: string,
  newStartTime: string,
  reasonLabel?: string,
): CalendarEvent {
  const start = new Date(`2000-01-01T${newStartTime}:00`);
  const timeLabel = start.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  // Preserve duration when the event has an explicit endTime.
  let newEndTime = event.endTime;
  if (event.endTime) {
    const durationMin = toMinutes(event.endTime) - toMinutes(event.startTime);
    const endTotal = toMinutes(newStartTime) + Math.max(durationMin, 0);
    const eh = Math.floor(endTotal / 60) % 24;
    const em = endTotal % 60;
    newEndTime = `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`;
  }

  return {
    ...event,
    originalDateISO: event.originalDateISO ?? event.dateISO,
    originalTimeLabel: event.originalTimeLabel ?? event.timeLabel,
    dateISO: newDateISO,
    startTime: newStartTime,
    endTime: newEndTime,
    timeLabel,
    status: "Planned",
    history: [
      ...event.history,
      {
        id: `h-${Date.now()}`,
        date: "Just now",
        title: reasonLabel ?? `Rescheduled to ${formatDateLabel(newDateISO)}, ${timeLabel}`,
      },
    ],
  };
}

/** An event can be dragged/rescheduled only while it's still an open commitment. */
export function isReschedulable(event: CalendarEvent): boolean {
  const status = liveStatus(event);
  return status !== "Completed" && status !== "Cancelled";
}
