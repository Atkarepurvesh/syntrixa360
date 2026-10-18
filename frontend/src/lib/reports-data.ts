// Mock data for the Reports & Business Intelligence module.
// Extends crm-data.ts with datasets that don't naturally belong to any single
// operational module (orders, payments, products, regions, export/domestic split,
// retention/risk, lost sales, response time, activity completion, targets).
// Replace with real aggregation queries when wiring up the backend — see
// syntrixa360-reports-module-detailed.md, Section 36 & Appendix.

export const orderSummary = {
  total: 612,
  new: 84,
  confirmed: 158,
  processing: 96,
  completed: 238,
  cancelled: 24,
  returned: 12,
  grossValue: 186.4, // Lakh
  netValue: 172.1,
  avgOrderValue: 3.04,
  highest: 18.6,
  lowest: 0.12,
};

export const orderTrend = [
  { label: "Jan", orders: 78 },
  { label: "Feb", orders: 85 },
  { label: "Mar", orders: 96 },
  { label: "Apr", orders: 108 },
  { label: "May", orders: 122 },
];

export const paymentSummary = {
  totalInvoiced: 186.4,
  totalReceived: 148.2,
  pending: 38.2,
  partiallyPaid: 14.6,
  fullyPaid: 133.6,
  overdue: 21.4,
  outstanding: 38.2,
  aging: [
    { bucket: "0–30 Days", amount: 16.8, count: 42, risk: "low" as const },
    { bucket: "31–60 Days", amount: 11.2, count: 19, risk: "medium" as const },
    { bucket: "61–90 Days", amount: 6.4, count: 9, risk: "high" as const },
    { bucket: "90+ Days", amount: 3.8, count: 5, risk: "critical" as const },
  ],
};

export const productPerformance = [
  {
    id: "industrial-pumps",
    name: "Industrial Pumps",
    orders: 148,
    quantity: 1250,
    revenue: 14.2,
    repeatRate: 62,
  },
  {
    id: "control-panels",
    name: "Control Panels",
    orders: 112,
    quantity: 640,
    revenue: 11.6,
    repeatRate: 48,
  },
  {
    id: "spare-parts",
    name: "Spare Parts",
    orders: 96,
    quantity: 3400,
    revenue: 8.4,
    repeatRate: 71,
  },
  {
    id: "service-contracts",
    name: "Service Contracts",
    orders: 54,
    quantity: 54,
    revenue: 5.1,
    repeatRate: 84,
  },
  {
    id: "accessories",
    name: "Accessories",
    orders: 38,
    quantity: 980,
    revenue: 3.5,
    repeatRate: 39,
  },
];

export const regionPerformance = [
  {
    id: "maharashtra",
    name: "Maharashtra",
    level: "State",
    customers: 84,
    leads: 612,
    orders: 168,
    revenue: 42.1,
    conversion: 27.4,
  },
  {
    id: "gujarat",
    name: "Gujarat",
    level: "State",
    customers: 61,
    leads: 448,
    orders: 121,
    revenue: 31.6,
    conversion: 27.0,
  },
  {
    id: "tamil-nadu",
    name: "Tamil Nadu",
    level: "State",
    customers: 38,
    leads: 260,
    orders: 74,
    revenue: 18.9,
    conversion: 28.5,
  },
  {
    id: "madhya-pradesh",
    name: "Madhya Pradesh",
    level: "State",
    customers: 29,
    leads: 210,
    orders: 52,
    revenue: 12.4,
    conversion: 24.8,
  },
  {
    id: "rajasthan",
    name: "Rajasthan",
    level: "State",
    customers: 22,
    leads: 168,
    orders: 38,
    revenue: 8.7,
    conversion: 22.6,
  },
];

export const exportDomesticSplit = {
  export: {
    leads: 1240,
    customers: 96,
    orders: 148,
    revenue: 68.4,
    currency: "USD",
    topMarkets: [
      { country: "UAE", revenue: 22.4 },
      { country: "Saudi Arabia", revenue: 14.8 },
      { country: "Bangladesh", revenue: 9.6 },
      { country: "Kenya", revenue: 7.2 },
      { country: "Vietnam", revenue: 5.1 },
    ],
    repeatCustomers: 41,
  },
  domestic: {
    leads: 7502,
    customers: 486,
    orders: 464,
    revenue: 118.0,
    byState: [
      { state: "Maharashtra", revenue: 42.1 },
      { state: "Gujarat", revenue: 31.6 },
      { state: "Tamil Nadu", revenue: 18.9 },
      { state: "Madhya Pradesh", revenue: 12.4 },
      { state: "Rajasthan", revenue: 8.7 },
    ],
    distributorRevenue: 54.2,
    wholesalerRevenue: 38.6,
    retailerRevenue: 25.2,
    repeatCustomers: 214,
  },
};

export const customerRetention = {
  repeatPurchaseRate: 58.4,
  newCustomerRevenue: 62.1,
  existingCustomerRevenue: 124.3,
  retentionRate: 71.2,
  churnRate: 8.6,
  avgOrderFrequency: "Every 38 days",
  avgCustomerValue: 4.8,
  dueForReorder: 32,
};

export const customerRisk = [
  {
    id: "sharma-industries",
    company: "Sharma Industries",
    level: "Critical" as const,
    reason: "No activity for 21 days, pending payment",
    owner: "Arjun Mehta",
  },
  {
    id: "maharashtra-distributors",
    company: "Maharashtra Distributors",
    level: "High" as const,
    reason: "Deal idle 6 days, reduced order value",
    owner: "Arjun Mehta",
  },
  {
    id: "nirmal-textiles",
    company: "Nirmal Textiles",
    level: "Medium" as const,
    reason: "Unanswered conversation for 3 days",
    owner: "Pooja Patel",
  },
  {
    id: "kuber-traders",
    company: "Kuber Traders",
    level: "Medium" as const,
    reason: "Order frequency dropped 40%",
    owner: "Sandeep Yadav",
  },
  {
    id: "vikas-enterprises",
    company: "Vikas Enterprises",
    level: "Low" as const,
    reason: "One overdue follow-up",
    owner: "Sandeep Yadav",
  },
];

export const lostSales = [
  {
    id: "D-1170",
    company: "Sharma Industries",
    executive: "Arjun Mehta",
    value: 5.4,
    lostDate: "10 May 2025",
    reason: "Price",
    stage: "Negotiation",
  },
  {
    id: "D-1142",
    company: "Om Enterprises",
    executive: "Neha Singh",
    value: 3.1,
    lostDate: "03 May 2025",
    reason: "No Response",
    stage: "Quotation",
  },
  {
    id: "D-1128",
    company: "Patel Traders",
    executive: "Sandeep Yadav",
    value: 2.4,
    lostDate: "27 Apr 2025",
    reason: "Competitor",
    stage: "Negotiation",
  },
  {
    id: "D-1109",
    company: "Raj Overseas",
    executive: "Rahul Verma",
    value: 6.8,
    lostDate: "19 Apr 2025",
    reason: "Timing",
    stage: "Qualified",
  },
  {
    id: "D-1091",
    company: "Anand Steel Works",
    executive: "Pooja Patel",
    value: 1.9,
    lostDate: "12 Apr 2025",
    reason: "Payment Issue",
    stage: "Quotation",
  },
];

export const responseTimeReport = {
  avgFirstResponse: "14 min",
  fastest: "2 min",
  slowest: "3 hr 40 min",
  unansweredLeads: 9,
  unansweredConversations: 14,
  byExecutive: [
    { id: "rahul-verma", name: "Rahul Verma", avgResponse: "8 min", unanswered: 1, leads: 412 },
    { id: "neha-singh", name: "Neha Singh", avgResponse: "11 min", unanswered: 2, leads: 356 },
    { id: "arjun-mehta", name: "Arjun Mehta", avgResponse: "19 min", unanswered: 3, leads: 298 },
    { id: "pooja-patel", name: "Pooja Patel", avgResponse: "16 min", unanswered: 2, leads: 254 },
    {
      id: "sandeep-yadav",
      name: "Sandeep Yadav",
      avgResponse: "26 min",
      unanswered: 6,
      leads: 187,
    },
  ],
};

export const inboxSummary = {
  incoming: 1842,
  outgoing: 1610,
  unanswered: 14,
  closed: 1204,
  pending: 224,
  customerReplies: 968,
  firstResponse: "14 min",
  avgResponse: "38 min",
  byChannel: [
    { channel: "WhatsApp", count: 1128, color: "#22c55e" },
    { channel: "Email", count: 462, color: "#3b82f6" },
    { channel: "Website", count: 168, color: "#f5b014" },
    { channel: "Instagram", count: 84, color: "#7c3aed" },
  ],
};

export const activitySummary = {
  total: 2184,
  completed: 1862,
  pending: 198,
  overdue: 96,
  cancelled: 18,
  rescheduled: 10,
  completionRate: 85.3,
  overdueRate: 4.4,
  avgCompletionTime: "3.2 hr",
  byType: [
    { type: "Calls", count: 812 },
    { type: "WhatsApp", count: 624 },
    { type: "Email", count: 318 },
    { type: "Meetings", count: 214 },
    { type: "Visits", count: 96 },
    { type: "Tasks", count: 120 },
  ],
};

export const targetAchievement = {
  target: 100,
  actual: 72,
  achievementPct: 72,
  remaining: 28,
  byExecutive: [
    { id: "rahul-verma", name: "Rahul Verma", target: 13.5, actual: 12.4, pct: 92 },
    { id: "neha-singh", name: "Neha Singh", target: 11.8, actual: 8.7, pct: 74 },
    { id: "arjun-mehta", name: "Arjun Mehta", target: 11.6, actual: 7.1, pct: 61 },
    { id: "pooja-patel", name: "Pooja Patel", target: 11.7, actual: 5.6, pct: 48 },
    { id: "sandeep-yadav", name: "Sandeep Yadav", target: 10.0, actual: 3.2, pct: 32 },
  ],
};

export const quotationFunnel = {
  total: 186,
  draft: 22,
  sent: 84,
  viewed: 61,
  accepted: 58,
  rejected: 21,
  expired: 14,
  pending: 71,
  totalValue: 92.4,
  acceptedValue: 41.2,
  rejectedValue: 12.6,
  pendingValue: 38.6,
  quotationToOrderRate: 46.8,
};
