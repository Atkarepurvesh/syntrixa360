import { salesExecutives } from "@/lib/pipeline-data";
import { getCustomerRowByCompany, resolveCustomerSlug } from "@/lib/customers-data";

export type FollowUpChannel = "Call" | "WhatsApp" | "Email" | "Meeting";
export type FollowUpStatus = "today" | "overdue" | "upcoming" | "completed";

export type FollowUpActivity = {
  id: string;
  date: string;
  title: string;
};

export type FollowUp = {
  id: string;
  company: string;
  /** @deprecated legacy free-text id kept for backward compatibility; use customerId/customerSlug for navigation. */
  companyId: string;
  /** Real Customer module id this follow-up is linked to, e.g. "CUST-1001" (follow_up.customer_id = customer.id). */
  customerId: string;
  /** Slug used to route to the existing Customer Detail page (/app/customers/$id). */
  customerSlug: string;
  contact: string;
  phone: string;
  type: FollowUpChannel;
  due: string;
  dueTime: string; // for today's schedule sort, "HH:mm" 24h or "" if not time-based
  status: FollowUpStatus;
  daysOverdue?: number;
  owner: string;
  dealId?: string;
  dealValue?: string;
  product?: string;
  notes: string;
  lastActivity: string;
  timeline: FollowUpActivity[];
};

export { salesExecutives };

export const followUpChannels: FollowUpChannel[] = ["Call", "WhatsApp", "Email", "Meeting"];

// Raw fixtures — `company` is the single source of truth here. `customerId`
// and `customerSlug` are derived below via the Customer module's own
// resolver, so every follow-up links to a real Customer record instead of
// a hand-typed, unconnected id.
type RawFollowUp = Omit<FollowUp, "customerId" | "customerSlug">;

const rawFollowUpList: RawFollowUp[] = [
  {
    id: "F-501",
    company: "Shreeji Traders",
    companyId: "C-118",
    contact: "Manoj Shah",
    phone: "+91 98200 11223",
    type: "Call",
    due: "Today, 11:00 AM",
    dueTime: "11:00",
    status: "today",
    owner: "Rahul Verma",
    dealId: "D-2214",
    dealValue: "₹4,20,000",
    product: "Semi-Husked Coconut",
    notes: "Confirm quantity revision before sending updated quotation.",
    lastActivity: "2 days ago",
    timeline: [
      { id: "t1", date: "24 Aug 2026", title: "Quotation Q-2041 sent" },
      { id: "t2", date: "22 Aug 2026", title: "Discovery call completed" },
    ],
  },
  {
    id: "F-502",
    company: "Global Exports Ltd.",
    companyId: "C-241",
    contact: "Neeraj Kulkarni",
    phone: "+91 90040 55210",
    type: "WhatsApp",
    due: "Today, 12:30 PM",
    dueTime: "12:30",
    status: "today",
    owner: "Neha Singh",
    dealId: "D-2201",
    dealValue: "₹12,50,000",
    product: "Semi-Husked Coconut",
    notes: "Share container loading schedule and payment terms.",
    lastActivity: "1 day ago",
    timeline: [{ id: "t1", date: "26 Aug 2026", title: "Price negotiation started" }],
  },
  {
    id: "F-503",
    company: "Kisan Agro Pvt. Ltd.",
    companyId: "C-256",
    contact: "Sunita Rao",
    phone: "+91 88888 44210",
    type: "Email",
    due: "Today, 03:00 PM",
    dueTime: "15:00",
    status: "today",
    owner: "Pooja Patel",
    dealId: "D-2225",
    dealValue: "₹2,10,000",
    product: "Desiccated Coconut",
    notes: "Send revised catalog with export packaging details.",
    lastActivity: "4 hours ago",
    timeline: [{ id: "t1", date: "29 Aug 2026", title: "Requested product catalog" }],
  },
  {
    id: "F-504",
    company: "Maharashtra Distributors",
    companyId: "C-262",
    contact: "Ajay Deshmukh",
    phone: "+91 99870 33421",
    type: "Meeting",
    due: "Today, 05:00 PM",
    dueTime: "17:00",
    status: "today",
    owner: "Arjun Mehta",
    dealId: "D-2238",
    dealValue: "₹9,10,000",
    product: "Fresh Coconut",
    notes: "Onsite meeting to finalise distribution terms for Q4.",
    lastActivity: "3 days ago",
    timeline: [{ id: "t1", date: "25 Aug 2026", title: "Site visit scheduled" }],
  },
  {
    id: "F-489",
    company: "Bright Steel Pvt. Ltd.",
    companyId: "C-140",
    contact: "Rakesh Jain",
    phone: "+91 98765 21001",
    type: "Call",
    due: "22 Aug 2026",
    dueTime: "",
    status: "overdue",
    daysOverdue: 8,
    owner: "Rahul Verma",
    dealId: "D-2190",
    dealValue: "₹3,60,000",
    notes: "No response to last two calls, try alternate contact.",
    lastActivity: "8 days ago",
    timeline: [{ id: "t1", date: "20 Aug 2026", title: "First follow-up attempted" }],
  },
  {
    id: "F-486",
    company: "Kuber Traders",
    companyId: "C-165",
    contact: "Deepak Kuber",
    phone: "+91 97654 88120",
    type: "WhatsApp",
    due: "21 Aug 2026",
    dueTime: "",
    status: "overdue",
    daysOverdue: 9,
    owner: "Sandeep Yadav",
    notes: "Portal onboarding pending confirmation.",
    lastActivity: "9 days ago",
    timeline: [{ id: "t1", date: "19 Aug 2026", title: "Onboarding link shared" }],
  },
  {
    id: "F-482",
    company: "Sharma Industries",
    companyId: "C-178",
    contact: "Vinod Sharma",
    phone: "+91 90210 44567",
    type: "Email",
    due: "20 Aug 2026",
    dueTime: "",
    status: "overdue",
    daysOverdue: 10,
    owner: "Arjun Mehta",
    dealId: "D-2199",
    dealValue: "₹5,40,000",
    notes: "Quotation Q-2030 was rejected, needs a revised offer.",
    lastActivity: "10 days ago",
    timeline: [{ id: "t1", date: "18 Aug 2026", title: "Quotation rejected" }],
  },
  {
    id: "F-478",
    company: "Nirmal Textiles",
    companyId: "C-183",
    contact: "Meena Nirmal",
    phone: "+91 91234 76543",
    type: "Meeting",
    due: "19 Aug 2026",
    dueTime: "",
    status: "overdue",
    daysOverdue: 11,
    owner: "Pooja Patel",
    notes: "Meeting was rescheduled twice, confirm final slot.",
    lastActivity: "11 days ago",
    timeline: [{ id: "t1", date: "17 Aug 2026", title: "Meeting rescheduled" }],
  },
  {
    id: "F-520",
    company: "Anand Agro",
    companyId: "C-201",
    contact: "Suresh Anand",
    phone: "+91 96543 22109",
    type: "Call",
    due: "02 Sep 2026",
    dueTime: "",
    status: "upcoming",
    owner: "Pooja Patel",
    dealId: "D-2244",
    dealValue: "₹1,75,000",
    product: "Fresh Coconut",
    notes: "Check on trial order feedback.",
    lastActivity: "Today",
    timeline: [{ id: "t1", date: "29 Aug 2026", title: "Trial order delivered" }],
  },
  {
    id: "F-522",
    company: "Sahara Exporters",
    companyId: "C-207",
    contact: "Farhan Sheikh",
    phone: "+91 93456 12309",
    type: "Email",
    due: "03 Sep 2026",
    dueTime: "",
    status: "upcoming",
    owner: "Neha Singh",
    dealId: "D-2251",
    dealValue: "₹3,10,000",
    notes: "Quotation pending customer confirmation.",
    lastActivity: "1 day ago",
    timeline: [{ id: "t1", date: "28 Aug 2026", title: "Quotation shared" }],
  },
  {
    id: "F-525",
    company: "Emirates Traders LLC",
    companyId: "C-214",
    contact: "Yusuf Ahmed",
    phone: "+971 50 123 4567",
    type: "WhatsApp",
    due: "05 Sep 2026",
    dueTime: "",
    status: "upcoming",
    owner: "Rahul Verma",
    dealId: "D-2260",
    dealValue: "₹12,00,000",
    notes: "Post-delivery check-in for repeat order interest.",
    lastActivity: "Today",
    timeline: [{ id: "t1", date: "26 Aug 2026", title: "Order delivered" }],
  },
  {
    id: "F-470",
    company: "Royal Traders FZC",
    companyId: "C-121",
    contact: "Imran Qureshi",
    phone: "+971 55 987 6543",
    type: "Call",
    due: "18 Aug 2026",
    dueTime: "",
    status: "completed",
    owner: "Rahul Verma",
    notes: "Referral discussion closed, moved to qualified.",
    lastActivity: "12 days ago",
    timeline: [{ id: "t1", date: "18 Aug 2026", title: "Call completed" }],
  },
  {
    id: "F-465",
    company: "Sunrise Global",
    companyId: "C-132",
    contact: "Priya Kapoor",
    phone: "+91 99887 65432",
    type: "Email",
    due: "15 Aug 2026",
    dueTime: "",
    status: "completed",
    owner: "Ankit Patel",
    notes: "Sent introductory brochure, positive response.",
    lastActivity: "15 days ago",
    timeline: [{ id: "t1", date: "15 Aug 2026", title: "Email sent and opened" }],
  },
  {
    id: "F-460",
    company: "Green Valley Traders",
    companyId: "C-145",
    contact: "Harpreet Bajwa",
    phone: "+91 98123 45009",
    type: "Meeting",
    due: "12 Aug 2026",
    dueTime: "",
    status: "completed",
    owner: "Ankit Patel",
    notes: "Site visit done, samples approved.",
    lastActivity: "18 days ago",
    timeline: [{ id: "t1", date: "12 Aug 2026", title: "Site visit completed" }],
  },
];

export const followUpList: FollowUp[] = rawFollowUpList.map((f) => {
  const customerRow = getCustomerRowByCompany(f.company);
  return {
    ...f,
    customerId: customerRow?.id ?? f.companyId,
    customerSlug: resolveCustomerSlug(f.company),
  };
});

export function computeFollowUpKpis(rows: FollowUp[] = followUpList) {
  const count = (status: FollowUpStatus) => rows.filter((f) => f.status === status).length;
  const byStatus = count;
  return [
    {
      id: "total",
      label: "Total Follow-ups",
      value: rows.length.toString(),
      change: "+9.2% vs last month",
      icon: "list",
      tone: "primary",
    },
    {
      id: "today",
      label: "Due Today",
      value: byStatus("today").toString(),
      change: "On track",
      icon: "calendar",
      tone: "info",
    },
    {
      id: "overdue",
      label: "Overdue",
      value: byStatus("overdue").toString(),
      change: "-2 vs yesterday",
      icon: "alert",
      tone: "danger",
    },
    {
      id: "upcoming",
      label: "Upcoming (7 days)",
      value: byStatus("upcoming").toString(),
      change: "+3 new",
      icon: "clock",
      tone: "warning",
    },
    {
      id: "completed",
      label: "Completed This Week",
      value: byStatus("completed").toString(),
      change: "+14.6% vs last week",
      icon: "check",
      tone: "success",
    },
    {
      id: "no-response",
      label: "No Response 3+ Days",
      value: rows
        .filter((f) => f.status === "overdue" && (f.daysOverdue ?? 0) >= 3)
        .length.toString(),
      change: "Needs attention",
      icon: "warning",
      tone: "danger",
    },
  ] as const;
}

export const followUpKpis = computeFollowUpKpis(followUpList);

const typeColors: Record<FollowUpChannel, string> = {
  Call: "var(--chart-1, #6366f1)",
  WhatsApp: "var(--chart-2, #22c55e)",
  Email: "var(--chart-3, #f59e0b)",
  Meeting: "var(--chart-4, #ec4899)",
};

export function computeFollowUpByType(rows: FollowUp[] = followUpList) {
  return followUpChannels.map((type) => {
    const items = rows.filter((f) => f.type === type);
    return {
      name: type,
      slug: type.toLowerCase(),
      value: items.length,
      color: typeColors[type],
    };
  });
}

export const followUpByType = computeFollowUpByType(followUpList);

const count = (status: FollowUpStatus) => followUpList.filter((f) => f.status === status).length;

export function computeFollowUpOverview(rows: FollowUp[] = followUpList) {
  const byStatus = (status: FollowUpStatus) => rows.filter((f) => f.status === status).length;
  return [
    { name: "Today", slug: "today", value: byStatus("today"), color: "var(--chart-1, #6366f1)" },
    {
      name: "Overdue",
      slug: "overdue",
      value: byStatus("overdue"),
      color: "var(--destructive, #ef4444)",
    },
    {
      name: "Upcoming",
      slug: "upcoming",
      value: byStatus("upcoming"),
      color: "var(--chart-4, #f59e0b)",
    },
    {
      name: "Completed",
      slug: "completed",
      value: byStatus("completed"),
      color: "var(--chart-2, #22c55e)",
    },
  ];
}

export const followUpOverview = computeFollowUpOverview(followUpList);

export const todaysSchedule = followUpList
  .filter((f) => f.status === "today")
  .sort((a, b) => a.dueTime.localeCompare(b.dueTime));

export const overdueFollowUps = followUpList
  .filter((f) => f.status === "overdue")
  .sort((a, b) => (b.daysOverdue ?? 0) - (a.daysOverdue ?? 0));
