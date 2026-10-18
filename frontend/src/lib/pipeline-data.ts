export type DealStage = "New" | "Qualified" | "Quotation" | "Negotiation" | "Won";
export type DealHealth = "Healthy" | "Needs Attention" | "At Risk" | "Won" | "Lost";
export type FollowUpState = "pending" | "overdue" | "none";

export type DealActivity = {
  id: string;
  date: string;
  title: string;
};

export type PipelineDeal = {
  id: string;
  customer: string;
  customerId: string;
  product: string;
  quantity: string;
  value: number; // in rupees, full value
  valueLabel: string;
  stage: DealStage;
  health: DealHealth;
  probability: number;
  owner: string;
  closeDate: string;
  closeDateSort: number; // days from "today" (25 May 2025), negative = overdue
  source: string;
  lastActivity: string;
  followUp: FollowUpState;
  notes: string;
  timeline: DealActivity[];
};

export const salesExecutives = [
  "Rahul Verma",
  "Neha Singh",
  "Pooja Patel",
  "Arjun Mehta",
  "Sandeep Yadav",
];

export const pipelineProducts = [
  "Semi-Husked Coconut",
  "Industrial Pumps",
  "Control Panels",
  "Spare Parts",
  "Service Contracts",
  "Accessories",
];

export const pipelineLeadSources = [
  "Website",
  "WhatsApp",
  "Email",
  "IndiaMART",
  "Referral",
  "Campaign",
];

export const lostReasons = [
  "Price",
  "Competitor",
  "No Response",
  "Payment Terms",
  "Delivery",
  "Product Availability",
  "Customer Cancelled",
] as const;

export const pipelineDeals: PipelineDeal[] = [
  {
    id: "D-2201",
    customer: "ABC International Pvt Ltd",
    customerId: "C-241",
    product: "Semi-Husked Coconut",
    quantity: "12 containers",
    value: 1250000,
    valueLabel: "₹12,50,000",
    stage: "Negotiation",
    health: "At Risk",
    probability: 70,
    owner: "Rahul Verma",
    closeDate: "05 Sep 2026",
    closeDateSort: 6,
    source: "IndiaMART",
    lastActivity: "2 days ago",
    followUp: "overdue",
    notes: "Customer requested revised payment terms; awaiting management approval.",
    timeline: [
      { id: "t1", date: "30 Aug", title: "Quotation sent" },
      { id: "t2", date: "28 Aug", title: "Customer replied" },
      { id: "t3", date: "27 Aug", title: "Price negotiation" },
      { id: "t4", date: "25 Aug", title: "Meeting completed" },
      { id: "t5", date: "22 Aug", title: "Lead qualified" },
      { id: "t6", date: "20 Aug", title: "Lead created" },
    ],
  },
  {
    id: "D-2198",
    customer: "Global Exports Ltd.",
    customerId: "C-238",
    product: "Industrial Pumps",
    quantity: "40 units",
    value: 680000,
    valueLabel: "₹6,80,000",
    stage: "Quotation",
    health: "Healthy",
    probability: 55,
    owner: "Neha Singh",
    closeDate: "31 Aug 2026",
    closeDateSort: 1,
    source: "Email",
    lastActivity: "6 hours ago",
    followUp: "pending",
    notes: "Awaiting purchase order confirmation from procurement team.",
    timeline: [
      { id: "t1", date: "29 Aug", title: "Quotation sent" },
      { id: "t2", date: "26 Aug", title: "Requirements finalised" },
      { id: "t3", date: "24 Aug", title: "Lead qualified" },
    ],
  },
  {
    id: "D-2190",
    customer: "Maharashtra Distributors",
    customerId: "C-233",
    product: "Control Panels",
    quantity: "18 units",
    value: 910000,
    valueLabel: "₹9,10,000",
    stage: "Negotiation",
    health: "At Risk",
    probability: 45,
    owner: "Arjun Mehta",
    closeDate: "27 Aug 2026",
    closeDateSort: -3,
    source: "Referral",
    lastActivity: "9 days ago",
    followUp: "overdue",
    notes: "No response after last price revision. Needs escalation.",
    timeline: [
      { id: "t1", date: "21 Aug", title: "Price negotiation" },
      { id: "t2", date: "17 Aug", title: "Quotation sent" },
      { id: "t3", date: "12 Aug", title: "Lead qualified" },
    ],
  },
  {
    id: "D-2187",
    customer: "Kisan Agro Pvt. Ltd.",
    customerId: "C-229",
    product: "Spare Parts",
    quantity: "6 sets",
    value: 240000,
    valueLabel: "₹2,40,000",
    stage: "Qualified",
    health: "Healthy",
    probability: 30,
    owner: "Pooja Patel",
    closeDate: "04 Sep 2026",
    closeDateSort: 5,
    source: "Website",
    lastActivity: "1 day ago",
    followUp: "pending",
    notes: "Customer comparing with two other vendors.",
    timeline: [
      { id: "t1", date: "29 Aug", title: "Lead qualified" },
      { id: "t2", date: "27 Aug", title: "Discovery call completed" },
    ],
  },
  {
    id: "D-2180",
    customer: "Bright Steel Pvt. Ltd.",
    customerId: "C-221",
    product: "Service Contracts",
    quantity: "1 annual contract",
    value: 360000,
    valueLabel: "₹3,60,000",
    stage: "Won",
    health: "Won",
    probability: 100,
    owner: "Rahul Verma",
    closeDate: "18 Aug 2026",
    closeDateSort: -12,
    source: "WhatsApp",
    lastActivity: "12 days ago",
    followUp: "none",
    notes: "Contract signed and onboarding completed.",
    timeline: [
      { id: "t1", date: "18 Aug", title: "Deal marked Won" },
      { id: "t2", date: "15 Aug", title: "Contract signed" },
      { id: "t3", date: "10 Aug", title: "Final negotiation" },
    ],
  },
  {
    id: "D-2176",
    customer: "Kuber Traders",
    customerId: "C-214",
    product: "Accessories",
    quantity: "300 units",
    value: 180000,
    valueLabel: "₹1,80,000",
    stage: "Won",
    health: "Won",
    probability: 100,
    owner: "Sandeep Yadav",
    closeDate: "15 Aug 2026",
    closeDateSort: -15,
    source: "Website",
    lastActivity: "15 days ago",
    followUp: "none",
    notes: "Repeat order, fast close.",
    timeline: [
      { id: "t1", date: "15 Aug", title: "Deal marked Won" },
      { id: "t2", date: "13 Aug", title: "Quotation accepted" },
    ],
  },
  {
    id: "D-2165",
    customer: "Nirmal Textiles",
    customerId: "C-207",
    product: "Semi-Husked Coconut",
    quantity: "8 containers",
    value: 290000,
    valueLabel: "₹2,90,000",
    stage: "New",
    health: "Needs Attention",
    probability: 15,
    owner: "Pooja Patel",
    closeDate: "06 Sep 2026",
    closeDateSort: 7,
    source: "Referral",
    lastActivity: "3 days ago",
    followUp: "pending",
    notes: "Initial requirement shared, awaiting detailed spec.",
    timeline: [{ id: "t1", date: "27 Aug", title: "Lead created" }],
  },
  {
    id: "D-2160",
    customer: "Anand Agro",
    customerId: "C-198",
    product: "Spare Parts",
    quantity: "10 sets",
    value: 120000,
    valueLabel: "₹1,20,000",
    stage: "New",
    health: "Healthy",
    probability: 10,
    owner: "Pooja Patel",
    closeDate: "12 Sep 2026",
    closeDateSort: 13,
    source: "Campaign",
    lastActivity: "Today",
    followUp: "pending",
    notes: "New inbound enquiry from campaign landing page.",
    timeline: [{ id: "t1", date: "30 Aug", title: "Lead created" }],
  },
  {
    id: "D-2155",
    customer: "Vikas Enterprises",
    customerId: "C-192",
    product: "Industrial Pumps",
    quantity: "22 units",
    value: 310000,
    valueLabel: "₹3,10,000",
    stage: "Negotiation",
    health: "At Risk",
    probability: 50,
    owner: "Sandeep Yadav",
    closeDate: "02 Sep 2026",
    closeDateSort: 3,
    source: "IndiaMART",
    lastActivity: "5 days ago",
    followUp: "overdue",
    notes: "Requested extended delivery timeline.",
    timeline: [
      { id: "t1", date: "25 Aug", title: "Price negotiation" },
      { id: "t2", date: "20 Aug", title: "Quotation sent" },
    ],
  },
  {
    id: "D-2149",
    customer: "Royal Traders",
    customerId: "C-185",
    product: "Control Panels",
    quantity: "9 units",
    value: 850000,
    valueLabel: "₹8,50,000",
    stage: "Negotiation",
    health: "Healthy",
    probability: 80,
    owner: "Rahul Verma",
    closeDate: "03 Sep 2026",
    closeDateSort: 4,
    source: "IndiaMART",
    lastActivity: "Today",
    followUp: "pending",
    notes: "Verbal confirmation received, PO expected this week.",
    timeline: [
      { id: "t1", date: "30 Aug", title: "Verbal confirmation" },
      { id: "t2", date: "26 Aug", title: "Final quotation sent" },
    ],
  },
  {
    id: "D-2144",
    customer: "Shreeji Traders",
    customerId: "C-241",
    product: "Semi-Husked Coconut",
    quantity: "14 containers",
    value: 420000,
    valueLabel: "₹4,20,000",
    stage: "Quotation",
    health: "Healthy",
    probability: 40,
    owner: "Rahul Verma",
    closeDate: "29 Aug 2026",
    closeDateSort: -1,
    source: "WhatsApp",
    lastActivity: "1 day ago",
    followUp: "pending",
    notes: "Quotation shared, follow-up call scheduled.",
    timeline: [{ id: "t1", date: "28 Aug", title: "Quotation sent" }],
  },
  {
    id: "D-2140",
    customer: "Sharma Industries",
    customerId: "C-176",
    product: "Spare Parts",
    quantity: "5 sets",
    value: 540000,
    valueLabel: "₹5,40,000",
    stage: "Won",
    health: "Lost",
    probability: 0,
    owner: "Arjun Mehta",
    closeDate: "10 Aug 2026",
    closeDateSort: -20,
    source: "Email",
    lastActivity: "20 days ago",
    followUp: "none",
    notes: "Customer went with a competitor offering lower price.",
    timeline: [
      { id: "t1", date: "10 Aug", title: "Deal marked Lost" },
      { id: "t2", date: "05 Aug", title: "Final negotiation" },
    ],
  },
];

// Lost deals (separate list with a required reason) — includes D-2140 plus a few more.
export const lostDeals = [
  {
    id: "D-2140",
    customer: "Sharma Industries",
    product: "Spare Parts",
    value: "₹5,40,000",
    owner: "Arjun Mehta",
    lostDate: "10 Aug 2026",
    reason: "Price" as const,
  },
  {
    id: "D-2098",
    customer: "Patel Hardware",
    product: "Accessories",
    value: "₹1,10,000",
    owner: "Sandeep Yadav",
    lostDate: "02 Aug 2026",
    reason: "Competitor" as const,
  },
  {
    id: "D-2081",
    customer: "Om Enterprises",
    product: "Control Panels",
    value: "₹6,20,000",
    owner: "Neha Singh",
    lostDate: "28 Jul 2026",
    reason: "No Response" as const,
  },
  {
    id: "D-2065",
    customer: "Deccan Traders",
    product: "Industrial Pumps",
    value: "₹3,80,000",
    owner: "Pooja Patel",
    lostDate: "21 Jul 2026",
    reason: "Payment Terms" as const,
  },
];

export function computePipelineKpis(rows: PipelineDeal[] = pipelineDeals) {
  const formatCr = (amount: number) => `₹${Math.round(amount).toLocaleString("en-IN")}`;
  const active = rows.filter((d) => d.health !== "Won" && d.health !== "Lost");
  const won = rows.filter((d) => d.stage === "Won" || d.health === "Won");
  const negotiation = rows.filter((d) => d.stage === "Negotiation");
  const quotation = rows.filter((d) => d.stage === "Quotation");
  const atRisk = rows.filter((d) => d.health === "At Risk");

  const sum = (list: PipelineDeal[]) => list.reduce((s, d) => s + d.value, 0);

  return [
    {
      id: "total-pipeline",
      label: "Total Pipeline",
      value: formatCr(sum(active) + sum(won)),
      icon: "target",
      tone: "primary" as const,
    },
    {
      id: "active-deals",
      label: "Active Deals",
      value: String(active.length),
      icon: "briefcase",
      tone: "info" as const,
    },
    {
      id: "won",
      label: "Won",
      value: formatCr(sum(won)),
      icon: "trophy",
      tone: "success" as const,
    },
    {
      id: "negotiation",
      label: "Negotiation",
      value: formatCr(sum(negotiation)),
      icon: "handshake",
      tone: "warning" as const,
    },
    {
      id: "quotation",
      label: "Quotation",
      value: formatCr(sum(quotation)),
      icon: "file",
      tone: "info" as const,
    },
    {
      id: "at-risk",
      label: "At Risk",
      value: String(atRisk.length),
      icon: "alert",
      tone: "danger" as const,
    },
  ];
}

export const pipelineKpis = [
  {
    id: "total-pipeline",
    label: "Total Pipeline",
    value: "₹1,84,50,000",
    icon: "target",
    tone: "primary" as const,
  },
  {
    id: "active-deals",
    label: "Active Deals",
    value: "42",
    icon: "briefcase",
    tone: "info" as const,
  },
  { id: "won", label: "Won", value: "₹48,50,000", icon: "trophy", tone: "success" as const },
  {
    id: "negotiation",
    label: "Negotiation",
    value: "₹62,00,000",
    icon: "handshake",
    tone: "warning" as const,
  },
  { id: "quotation", label: "Quotation", value: "₹45,00,000", icon: "file", tone: "info" as const },
  { id: "at-risk", label: "At Risk", value: "8", icon: "alert", tone: "danger" as const },
];

export const pipelineFunnel: { stage: DealStage; deals: number; value: string; color: string }[] = [
  { stage: "New", deals: 12, value: "₹28,00,000", color: "#3b82f6" },
  { stage: "Qualified", deals: 9, value: "₹36,00,000", color: "#f5b014" },
  { stage: "Quotation", deals: 10, value: "₹45,00,000", color: "#f97316" },
  { stage: "Negotiation", deals: 7, value: "₹62,00,000", color: "#ef4444" },
  { stage: "Won", deals: 4, value: "₹48,50,000", color: "#22c55e" },
];

export const pipelineConversion = [
  { stage: "New", count: 12, conversion: 100, revenue: "₹28,00,000" },
  { stage: "Qualified", count: 9, conversion: 75, revenue: "₹36,00,000" },
  { stage: "Quotation", count: 10, conversion: 55, revenue: "₹45,00,000" },
  { stage: "Negotiation", count: 7, conversion: 33, revenue: "₹62,00,000" },
  { stage: "Won", count: 4, conversion: 19, revenue: "₹48,50,000" },
];

export const pipelineForecast = {
  conservative: "₹72,00,000",
  expected: "₹96,00,000",
  optimistic: "₹1,24,00,000",
};

export const needsAttentionItems = [
  {
    id: "stuck-high-value",
    title: "3 High Value Deals Stuck",
    detail: "₹32,00,000 Total",
    note: "No movement for 7+ days",
    to: "/app/pipeline",
    search: { filter: "stuck" },
  },
  {
    id: "closing-soon",
    title: "5 Deals Closing Soon",
    detail: "Expected within 7 days",
    note: "",
    to: "/app/pipeline",
    search: { filter: "closing-soon" },
  },
  {
    id: "overdue-followups",
    title: "8 Overdue Follow Ups",
    detail: "Assigned to Sales Executives",
    note: "",
    to: "/app/follow-ups",
    search: { filter: "overdue" },
  },
  {
    id: "quotations-at-risk",
    title: "2 Quotations At Risk",
    detail: "No response after quotation",
    note: "",
    to: "/app/pipeline",
    search: { filter: "at-risk" },
  },
];

export const pipelineAiInsight = {
  title: "AI Pipeline Insight",
  body: "7 negotiation deals have had no activity for more than 5 days.",
  combinedValue: "₹24,00,000",
  recommendation: "Prioritize these deals and review the assigned Sales Executives.",
  to: "/app/pipeline",
  search: { stage: "negotiation", filter: "at-risk" },
};

export const pipelineHealth = {
  score: 78,
  max: 100,
  label: "Good",
  factors: [
    { label: "Deal Activity", value: 82 },
    { label: "Stage Conversion", value: 74 },
    { label: "Follow-Up Completion", value: 68 },
    { label: "Expected Closures", value: 85 },
    { label: "At-Risk Deals", value: 71 },
  ],
};

export const teamPipeline = [
  {
    name: "Rahul Sharma",
    owner: "Rahul Verma",
    deals: 16,
    pipeline: "₹72L",
    won: "₹22L",
    atRisk: 3,
  },
  { name: "Ankit Patel", owner: "Neha Singh", deals: 14, pipeline: "₹61L", won: "₹16L", atRisk: 2 },
  {
    name: "Karan Mehta",
    owner: "Pooja Patel",
    deals: 12,
    pipeline: "₹51L",
    won: "₹10.5L",
    atRisk: 3,
  },
];

export const closingSoonDeals = [
  {
    id: "D-2149",
    customer: "Royal Traders",
    value: "₹8,50,000",
    closeDate: "03 Sep 2026",
    probability: 80,
    owner: "Rahul Verma",
  },
  {
    id: "D-2201",
    customer: "ABC International Pvt Ltd",
    value: "₹12,50,000",
    closeDate: "05 Sep 2026",
    probability: 70,
    owner: "Rahul Verma",
  },
  {
    id: "D-2155",
    customer: "Vikas Enterprises",
    value: "₹3,10,000",
    closeDate: "02 Sep 2026",
    probability: 50,
    owner: "Sandeep Yadav",
  },
  {
    id: "D-2187",
    customer: "Kisan Agro Pvt. Ltd.",
    value: "₹2,40,000",
    closeDate: "04 Sep 2026",
    probability: 30,
    owner: "Pooja Patel",
  },
];

export const overdueDeals = [
  {
    id: "D-2190",
    customer: "Maharashtra Distributors",
    value: "₹9,10,000",
    closeDate: "27 Aug 2026",
    owner: "Arjun Mehta",
    daysOverdue: 3,
    status: "At Risk" as const,
  },
  {
    id: "D-2144",
    customer: "Shreeji Traders",
    value: "₹4,20,000",
    closeDate: "29 Aug 2026",
    owner: "Rahul Verma",
    daysOverdue: 1,
    status: "Needs Attention" as const,
  },
];

export const stageOrder: DealStage[] = ["New", "Qualified", "Quotation", "Negotiation", "Won"];
