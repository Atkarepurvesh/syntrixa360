// Customer module mock data — mirrors the shape/conventions of crm-data.ts
// so the Customers pages feel like part of the same product, not a bolt-on.

// ---- Slug / identity helpers -----------------------------------------
// Every other module (Follow Ups, Pipeline, Tasks) references a customer
// by company name. These helpers are the single source of truth for turning
// a company name into the same `slug` used by the Customer module's own
// routes (/app/customers/$id), so a follow-up's customer link always lands
// on a real Customer Detail record instead of a dead/mismatched id.
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export type CustomerHealth = "Healthy" | "At Risk" | "Inactive";
export type CustomerStatusTab = "all" | "active" | "new" | "repeat" | "at-risk" | "inactive";

// ---- Derived-metric helpers ---------------------------------------------
// These are shared by the Customer List (role-scoped KPI cards) and will
// also back the Customer 360 Overview/Reorder cards later. Kept here so
// there's a single definition of "high value" / "reorder due" etc. instead
// of each page inventing its own thresholds.

/** Fictional "today" for this mock dataset — the most recent order/activity
 * dates in customerRows/customerDetails sit just before this, and relative
 * labels ("Tomorrow", "Overdue by N days") were written against it. There is
 * no real clock to derive this from since all data is static mock data. */
export const CRM_REFERENCE_DATE = new Date("2026-08-26T00:00:00");

const MONTHS: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

/** Parses the "DD Mon YYYY" strings used throughout customers-data.ts
 * (e.g. "18 Aug 2026"). Returns null for anything else (e.g. "—",
 * "No follow-up scheduled") rather than throwing. */
export function parseCustomerDate(value: string): Date | null {
  const match = /^(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})$/.exec(value.trim());
  if (!match) return null;
  const day = match[1];
  const monRaw = match[2];
  const year = match[3];
  if (!day || !monRaw || !year) return null;
  const month = MONTHS[monRaw.slice(0, 3).toLowerCase()];
  if (month === undefined) return null;
  return new Date(Number(year), month, Number(day));
}

export function daysSince(dateStr: string, reference: Date = CRM_REFERENCE_DATE): number | null {
  const parsed = parseCustomerDate(dateStr);
  if (!parsed) return null;
  return Math.round((reference.getTime() - parsed.getTime()) / (1000 * 60 * 60 * 24));
}

/** Parses revenue strings like "₹48.6 Lakh" / "₹1.20 Cr" into a lakh value
 * so amounts can be compared/thresholded. Returns 0 if unparseable. */
export function parseRevenueToLakh(value: string): number {
  const match = /₹\s*([\d.,]+)\s*(Lakh|Cr)/i.exec(value);
  if (!match) return 0;
  const numPart = match[1];
  const unitPart = match[2];
  if (!numPart || !unitPart) return 0;
  const num = Number(numPart.replace(/,/g, ""));
  if (Number.isNaN(num)) return 0;
  return unitPart.toLowerCase() === "cr" ? num * 100 : num;
}

export const HIGH_VALUE_THRESHOLD_LAKH = 20;

export function isHighValueCustomer(row: Pick<CustomerRow, "revenue">): boolean {
  return parseRevenueToLakh(row.revenue) >= HIGH_VALUE_THRESHOLD_LAKH;
}

export const DEFAULT_REORDER_CYCLE_DAYS = 60;

export type ReorderStatus = "not-due" | "upcoming" | "due" | "unknown";

/** Mock/rule-based reorder heuristic (Part 47): lastOrder + assumed cycle =
 * expected reorder date. Real per-customer averageReorderCycle can replace
 * DEFAULT_REORDER_CYCLE_DAYS once that data exists. */
export function getReorderStatus(
  row: Pick<CustomerRow, "lastOrder" | "health">,
  cycleDays: number = DEFAULT_REORDER_CYCLE_DAYS,
): ReorderStatus {
  if (row.health === "Inactive") return "unknown";
  const elapsed = daysSince(row.lastOrder);
  if (elapsed === null) return "unknown";
  if (elapsed >= cycleDays) return "due";
  if (elapsed >= cycleDays - 14) return "upcoming";
  return "not-due";
}

export const customerKpis = [
  {
    id: "total",
    label: "Total Customers",
    value: "1,876",
    trend: { value: "8.4%", positive: true, note: "vs last month" },
    icon: "users",
    tone: "info" as const,
  },
  {
    id: "active",
    label: "Active Customers",
    value: "1,542",
    trend: { value: "82.2% of total", positive: true, note: "customers" },
    icon: "user-check",
    tone: "success" as const,
  },
  {
    id: "new",
    label: "New Customers",
    value: "86",
    trend: { value: "This month", positive: true, note: "" },
    icon: "user-plus",
    tone: "primary" as const,
  },
  {
    id: "revenue",
    label: "Customer Revenue",
    value: "₹1.20 Cr",
    trend: { value: "18.6%", positive: true, note: "vs last month" },
    icon: "rupee",
    tone: "warning" as const,
  },
  {
    id: "repeat-rate",
    label: "Repeat Order Rate",
    value: "68.4%",
    trend: { value: "5.2%", positive: true, note: "vs last month" },
    icon: "repeat",
    tone: "success" as const,
  },
];

export const customerTabs: { id: CustomerStatusTab; label: string; count: number }[] = [
  { id: "all", label: "All Customers", count: 1876 },
  { id: "active", label: "Active", count: 1542 },
  { id: "new", label: "New", count: 86 },
  { id: "repeat", label: "Repeat Buyers", count: 1184 },
  { id: "at-risk", label: "At Risk", count: 74 },
  { id: "inactive", label: "Inactive", count: 260 },
];

export type CustomerRow = {
  id: string;
  slug: string;
  company: string;
  location: string;
  contact: string;
  owner: string;
  type: string;
  revenue: string;
  orders: number;
  lastOrder: string;
  nextFollowUp: string;
  health: CustomerHealth;
  statusTabs: CustomerStatusTab[];
  phone: string;
  email: string;
};

export const customerRows: CustomerRow[] = [
  {
    id: "CUST-1001",
    slug: "shreeji-traders",
    company: "Shreeji Traders",
    location: "Ahmedabad, Gujarat",
    contact: "Ramesh Patel",
    owner: "Rahul Verma",
    type: "Wholesale Distributor",
    revenue: "₹48.6 Lakh",
    orders: 26,
    lastOrder: "18 Aug 2026",
    nextFollowUp: "Tomorrow, 10:30 AM",
    health: "Healthy",
    statusTabs: ["all", "active", "repeat"],
    phone: "+91 98765 43210",
    email: "shreejitraders@gmail.com",
  },
  {
    id: "CUST-1002",
    slug: "global-exports-ltd",
    company: "Global Exports Ltd.",
    location: "Mumbai, Maharashtra",
    contact: "Amit Shah",
    owner: "Neha Singh",
    type: "Export Buyer",
    revenue: "₹36.2 Lakh",
    orders: 18,
    lastOrder: "20 Aug 2026",
    nextFollowUp: "22 Aug, 03:00 PM",
    health: "Healthy",
    statusTabs: ["all", "active", "repeat"],
    phone: "+91 98200 11234",
    email: "amit.shah@globalexports.in",
  },
  {
    id: "CUST-1003",
    slug: "maharashtra-distributors",
    company: "Maharashtra Distributors",
    location: "Pune, Maharashtra",
    contact: "Ajay Kulkarni",
    owner: "Arjun Mehta",
    type: "Distributor",
    revenue: "₹28.4 Lakh",
    orders: 14,
    lastOrder: "02 Aug 2026",
    nextFollowUp: "Overdue by 3 days",
    health: "At Risk",
    statusTabs: ["all", "active", "at-risk"],
    phone: "+91 90210 55678",
    email: "ajay.k@mahadist.com",
  },
  {
    id: "CUST-1004",
    slug: "kisan-agro-pvt-ltd",
    company: "Kisan Agro Pvt. Ltd.",
    location: "Nashik, Maharashtra",
    contact: "Sushil Patil",
    owner: "Pooja Patel",
    type: "Manufacturer",
    revenue: "₹22.9 Lakh",
    orders: 22,
    lastOrder: "23 Aug 2026",
    nextFollowUp: "25 Aug, 11:00 AM",
    health: "Healthy",
    statusTabs: ["all", "active", "repeat"],
    phone: "+91 98765 11223",
    email: "sushil@kisanagro.in",
  },
  {
    id: "CUST-1005",
    slug: "agro-fresh-supplies",
    company: "Agro Fresh Supplies",
    location: "Rajkot, Gujarat",
    contact: "Devang Mehta",
    owner: "Sandeep Yadav",
    type: "Retailer",
    revenue: "₹6.4 Lakh",
    orders: 8,
    lastOrder: "12 Jun 2026",
    nextFollowUp: "No follow-up scheduled",
    health: "Inactive",
    statusTabs: ["all", "inactive"],
    phone: "+91 99250 88990",
    email: "devang@agrofresh.co.in",
  },
  {
    id: "CUST-1006",
    slug: "vardhman-brothers",
    company: "Vardhman Brothers",
    location: "Indore, Madhya Pradesh",
    contact: "Vikram Sharma",
    owner: "Arjun Mehta",
    type: "Wholesaler",
    revenue: "₹15.6 Lakh",
    orders: 16,
    lastOrder: "21 Aug 2026",
    nextFollowUp: "24 Aug, 02:00 PM",
    health: "Healthy",
    statusTabs: ["all", "active", "repeat"],
    phone: "+91 97123 44556",
    email: "vikram@vardhmanbros.com",
  },
  {
    id: "CUST-1007",
    slug: "sahyadri-agencies",
    company: "Sahyadri Agencies",
    location: "Kolhapur, Maharashtra",
    contact: "Sneha Rao",
    owner: "Pooja Patel",
    type: "Distributor",
    revenue: "₹9.8 Lakh",
    orders: 6,
    lastOrder: "22 Aug 2026",
    nextFollowUp: "26 Aug, 10:00 AM",
    health: "Healthy",
    statusTabs: ["all", "active", "new"],
    phone: "+91 96190 33445",
    email: "sneha.rao@sahyadriagencies.in",
  },
  {
    id: "CUST-1008",
    slug: "pioneer-imports",
    company: "Pioneer Imports",
    location: "Surat, Gujarat",
    contact: "Meera Iyer",
    owner: "Neha Singh",
    type: "Importer",
    revenue: "₹19.4 Lakh",
    orders: 20,
    lastOrder: "21 Aug 2026",
    nextFollowUp: "23 Aug, 04:30 PM",
    health: "Healthy",
    statusTabs: ["all", "active", "repeat"],
    phone: "+91 90040 77889",
    email: "meera@pioneerimports.com",
  },
  {
    id: "CUST-1009",
    slug: "rk-enterprises",
    company: "R.K. Enterprises",
    location: "Nagpur, Maharashtra",
    contact: "Rohit Jain",
    owner: "Sandeep Yadav",
    type: "Retailer",
    revenue: "₹2.1 Lakh",
    orders: 4,
    lastOrder: "05 Mar 2026",
    nextFollowUp: "No follow-up scheduled",
    health: "Inactive",
    statusTabs: ["all", "inactive"],
    phone: "+91 94220 66778",
    email: "rohit.jain@rkenterprises.in",
  },
  {
    id: "CUST-1010",
    slug: "sai-traders",
    company: "Sai Traders",
    location: "Coimbatore, Tamil Nadu",
    contact: "Nilesh Shah",
    owner: "Rahul Verma",
    type: "Distributor",
    revenue: "₹7.6 Lakh",
    orders: 5,
    lastOrder: "19 Aug 2026",
    nextFollowUp: "27 Aug, 12:00 PM",
    health: "Healthy",
    statusTabs: ["all", "active", "new"],
    phone: "+91 98865 22110",
    email: "nilesh@saitraders.in",
  },
  // ---- The rows below back customers that Follow Ups already refers to
  // but that did not previously have a Customer record — added so every
  // Follow Up can resolve to a real, existing Customer Detail page.
  {
    id: "CUST-1011",
    slug: "bright-steel-pvt-ltd",
    company: "Bright Steel Pvt. Ltd.",
    location: "Ludhiana, Punjab",
    contact: "Rakesh Jain",
    owner: "Rahul Verma",
    type: "Manufacturer",
    revenue: "₹11.2 Lakh",
    orders: 9,
    lastOrder: "22 Aug 2026",
    nextFollowUp: "Overdue by 8 days",
    health: "At Risk",
    statusTabs: ["all", "active", "at-risk"],
    phone: "+91 98765 21001",
    email: "rakesh.jain@brightsteel.in",
  },
  {
    id: "CUST-1012",
    slug: "kuber-traders",
    company: "Kuber Traders",
    location: "Jaipur, Rajasthan",
    contact: "Deepak Kuber",
    owner: "Sandeep Yadav",
    type: "Distributor",
    revenue: "₹8.6 Lakh",
    orders: 7,
    lastOrder: "21 Aug 2026",
    nextFollowUp: "Overdue by 9 days",
    health: "At Risk",
    statusTabs: ["all", "active", "at-risk"],
    phone: "+91 97654 88120",
    email: "deepak@kubertraders.in",
  },
  {
    id: "CUST-1013",
    slug: "sharma-industries",
    company: "Sharma Industries",
    location: "Faridabad, Haryana",
    contact: "Vinod Sharma",
    owner: "Arjun Mehta",
    type: "Manufacturer",
    revenue: "₹14.4 Lakh",
    orders: 10,
    lastOrder: "20 Aug 2026",
    nextFollowUp: "Overdue by 10 days",
    health: "At Risk",
    statusTabs: ["all", "active", "at-risk"],
    phone: "+91 90210 44567",
    email: "vinod@sharmaindustries.in",
  },
  {
    id: "CUST-1014",
    slug: "nirmal-textiles",
    company: "Nirmal Textiles",
    location: "Surat, Gujarat",
    contact: "Meena Nirmal",
    owner: "Pooja Patel",
    type: "Manufacturer",
    revenue: "₹6.8 Lakh",
    orders: 5,
    lastOrder: "19 Aug 2026",
    nextFollowUp: "Overdue by 11 days",
    health: "At Risk",
    statusTabs: ["all", "active", "at-risk"],
    phone: "+91 91234 76543",
    email: "meena@nirmaltextiles.in",
  },
  {
    id: "CUST-1015",
    slug: "anand-agro",
    company: "Anand Agro",
    location: "Nashik, Maharashtra",
    contact: "Suresh Anand",
    owner: "Pooja Patel",
    type: "Manufacturer",
    revenue: "₹4.2 Lakh",
    orders: 4,
    lastOrder: "29 Aug 2026",
    nextFollowUp: "02 Sep, 12:00 PM",
    health: "Healthy",
    statusTabs: ["all", "active", "new"],
    phone: "+91 96543 22109",
    email: "suresh@anandagro.in",
  },
  {
    id: "CUST-1016",
    slug: "sahara-exporters",
    company: "Sahara Exporters",
    location: "Kandla, Gujarat",
    contact: "Farhan Sheikh",
    owner: "Neha Singh",
    type: "Export Buyer",
    revenue: "₹9.4 Lakh",
    orders: 6,
    lastOrder: "28 Aug 2026",
    nextFollowUp: "03 Sep, 11:00 AM",
    health: "Healthy",
    statusTabs: ["all", "active", "new"],
    phone: "+91 93456 12309",
    email: "farhan@saharaexporters.com",
  },
  {
    id: "CUST-1017",
    slug: "emirates-traders-llc",
    company: "Emirates Traders LLC",
    location: "Dubai, UAE",
    contact: "Yusuf Ahmed",
    owner: "Rahul Verma",
    type: "Export Buyer",
    revenue: "₹18.6 Lakh",
    orders: 11,
    lastOrder: "26 Aug 2026",
    nextFollowUp: "05 Sep, 10:00 AM",
    health: "Healthy",
    statusTabs: ["all", "active", "repeat"],
    phone: "+971 50 123 4567",
    email: "yusuf@emiratestraders.ae",
  },
  {
    id: "CUST-1018",
    slug: "royal-traders-fzc",
    company: "Royal Traders FZC",
    location: "Sharjah, UAE",
    contact: "Imran Qureshi",
    owner: "Rahul Verma",
    type: "Export Buyer",
    revenue: "₹13.1 Lakh",
    orders: 8,
    lastOrder: "18 Aug 2026",
    nextFollowUp: "No follow-up scheduled",
    health: "Healthy",
    statusTabs: ["all", "active", "repeat"],
    phone: "+971 55 987 6543",
    email: "imran@royaltradersfzc.ae",
  },
  {
    id: "CUST-1019",
    slug: "sunrise-global",
    company: "Sunrise Global",
    location: "Kanpur, Uttar Pradesh",
    contact: "Priya Kapoor",
    owner: "Ankit Patel",
    type: "Wholesaler",
    revenue: "₹5.9 Lakh",
    orders: 5,
    lastOrder: "15 Aug 2026",
    nextFollowUp: "No follow-up scheduled",
    health: "Healthy",
    statusTabs: ["all", "active"],
    phone: "+91 99887 65432",
    email: "priya@sunriseglobal.in",
  },
  {
    id: "CUST-1020",
    slug: "green-valley-traders",
    company: "Green Valley Traders",
    location: "Amritsar, Punjab",
    contact: "Harpreet Bajwa",
    owner: "Ankit Patel",
    type: "Distributor",
    revenue: "₹7.3 Lakh",
    orders: 6,
    lastOrder: "12 Aug 2026",
    nextFollowUp: "No follow-up scheduled",
    health: "Healthy",
    statusTabs: ["all", "active"],
    phone: "+91 98123 45009",
    email: "harpreet@greenvalleytraders.in",
  },
];

// slug -> row, for O(1) lookups from every module that links to a customer.
const customerRowBySlug: Record<string, CustomerRow> = Object.fromEntries(
  customerRows.map((row) => [row.slug, row]),
);

// company name (lowercased) -> slug, used to resolve names coming from
// other modules (Follow Ups, Pipeline, Tasks) that don't carry a real slug.
const slugByCompanyName: Record<string, string> = Object.fromEntries(
  customerRows.map((row) => [row.company.trim().toLowerCase(), row.slug]),
);

/**
 * Resolves any free-text company/customer name to the Customer module's
 * canonical slug. If the company already exists as a Customer, its real
 * slug is returned; otherwise a deterministic slug is generated so the
 * same name always resolves to the same (stable) URL.
 */
export function resolveCustomerSlug(companyName: string): string {
  const key = companyName.trim().toLowerCase();
  return slugByCompanyName[key] ?? slugify(companyName);
}

export function getCustomerRowBySlug(slug: string): CustomerRow | undefined {
  return customerRowBySlug[slug];
}

export function getCustomerRowByCompany(companyName: string): CustomerRow | undefined {
  return customerRowBySlug[resolveCustomerSlug(companyName)];
}

// ---- Customer Details (deep record for the profile screen) ----

export type CustomerDetail = {
  slug: string;
  id: string;
  company: string;
  location: string;
  status: "Active" | "At Risk" | "Inactive";
  info: {
    name: string;
    contact: string;
    phone: string;
    email: string;
    industry: string;
    location: string;
    since: string;
    owner: string;
    type: string;
  };
  kpis: {
    lifetimeRevenue: string;
    totalOrders: number;
    avgOrderValue: string;
    lastOrder: string;
    outstanding: string;
  };
  revenueTrend: { month: string; revenue: number }[];
  recentOrders: {
    id: string;
    date: string;
    products: string;
    amount: string;
    status: "Delivered" | "Processing" | "Shipped" | "Cancelled";
    payment: "Paid" | "Pending" | "Partial";
  }[];
  purchaseHistory: { product: string; orders: number; value: string }[];
  nextFollowUp: {
    type: string;
    due: string;
    assignedTo: string;
    reason: string;
  };
  activity: {
    icon: "order" | "whatsapp" | "followup" | "quotation" | "call" | "email";
    title: string;
    description: string;
    date: string;
    by: string;
  }[];
  notes: { author: string; date: string; text: string }[];
  tags: string[];
  quotations: {
    id: string;
    date: string;
    validUntil: string;
    products: string;
    value: string;
    status: "Draft" | "Sent" | "Negotiation" | "Accepted" | "Rejected" | "Expired";
    owner: string;
  }[];
  invoices: {
    id: string;
    date: string;
    dueDate: string;
    amount: string;
    balance: string;
    status: "Paid" | "Unpaid" | "Overdue" | "Partial";
  }[];
  followUpHistory: {
    id: string;
    type: "Call" | "WhatsApp" | "Email" | "Meeting";
    date: string;
    assignedTo: string;
    status: "Completed" | "Missed" | "Scheduled" | "Overdue";
    notes: string;
  }[];
  products: {
    name: string;
    category: string;
    totalOrders: number;
    totalValue: string;
    lastOrdered: string;
    avgQty: string;
    unitPrice: string;
  }[];
  documents: {
    name: string;
    type: "PDF" | "Image" | "Sheet" | "Doc";
    uploadedBy: string;
    date: string;
    size: string;
  }[];
  insights: {
    lifetimeValue: string;
    avgOrderValue: string;
    purchaseFrequency: string;
    lastPurchase: string;
    daysSinceLastOrder: number;
    repeatProbability: string;
    outstanding: string;
    creditLimit: string;
    mostPurchased: string;
  };
  aiInsight: {
    message: string;
    action: string;
  };
  convertedFrom: {
    leadName: string;
    source: string;
    created: string;
    converted: string;
  };
};

export const customerDetails: Record<string, CustomerDetail> = {
  "shreeji-traders": {
    slug: "shreeji-traders",
    id: "CUST-1001",
    company: "Shreeji Traders",
    location: "Ahmedabad, Gujarat, India",
    status: "Active",
    info: {
      name: "Shreeji Traders",
      contact: "Ramesh Patel",
      phone: "+91 98765 43210",
      email: "shreejitraders@gmail.com",
      industry: "Wholesale Distribution",
      location: "Ahmedabad, Gujarat",
      since: "12 Jan 2025",
      owner: "Rahul Verma",
      type: "Wholesale Distributor",
    },
    kpis: {
      lifetimeRevenue: "₹48.6 Lakh",
      totalOrders: 26,
      avgOrderValue: "₹1.87 Lakh",
      lastOrder: "18 Aug 2026",
      outstanding: "₹2.45 Lakh",
    },
    revenueTrend: [
      { month: "Jan", revenue: 3.2 },
      { month: "Feb", revenue: 3.8 },
      { month: "Mar", revenue: 4.1 },
      { month: "Apr", revenue: 3.6 },
      { month: "May", revenue: 4.9 },
      { month: "Jun", revenue: 5.4 },
      { month: "Jul", revenue: 6.2 },
      { month: "Aug", revenue: 5.8 },
    ],
    recentOrders: [
      {
        id: "ORD-10452",
        date: "18 Aug 2026",
        products: "Agro Fertilizer",
        amount: "₹2.85 Lakh",
        status: "Delivered",
        payment: "Paid",
      },
      {
        id: "ORD-10398",
        date: "02 Aug 2026",
        products: "Organic Products",
        amount: "₹1.65 Lakh",
        status: "Delivered",
        payment: "Pending",
      },
      {
        id: "ORD-10341",
        date: "19 Jul 2026",
        products: "Agro Fertilizer, Seeds",
        amount: "₹3.10 Lakh",
        status: "Delivered",
        payment: "Paid",
      },
      {
        id: "ORD-10287",
        date: "05 Jul 2026",
        products: "Organic Pesticides",
        amount: "₹1.20 Lakh",
        status: "Delivered",
        payment: "Partial",
      },
    ],
    purchaseHistory: [
      { product: "Agro Fertilizer", orders: 18, value: "₹24.6 Lakh" },
      { product: "Organic Pesticides", orders: 12, value: "₹14.8 Lakh" },
      { product: "Seeds", orders: 8, value: "₹9.2 Lakh" },
    ],
    nextFollowUp: {
      type: "Follow-up Call",
      due: "Tomorrow, 10:30 AM",
      assignedTo: "Rahul Verma",
      reason: "Discuss repeat order for Agro Products",
    },
    activity: [
      {
        icon: "order",
        title: "Order Completed",
        description: "Order #ORD-10452 delivered.",
        date: "18 Aug 2026",
        by: "System",
      },
      {
        icon: "whatsapp",
        title: "WhatsApp Conversation",
        description: "Customer asked about new pricing.",
        date: "16 Aug 2026",
        by: "Rahul Verma",
      },
      {
        icon: "followup",
        title: "Follow-up Completed",
        description: "Discussed next month's requirement.",
        date: "12 Aug 2026",
        by: "Rahul Verma",
      },
      {
        icon: "quotation",
        title: "Quotation Sent",
        description: "Quotation #QT-2034 sent.",
        date: "10 Aug 2026",
        by: "Rahul Verma",
      },
    ],
    notes: [
      {
        author: "Rahul Verma",
        date: "16 Aug 2026",
        text: "Customer generally places bulk orders every 25–30 days. Interested in better pricing for larger quantities.",
      },
    ],
    tags: ["Bulk Buyer", "Repeat Customer", "Agro Products", "High Value"],
    quotations: [
      {
        id: "QT-2034",
        date: "10 Aug 2026",
        validUntil: "24 Aug 2026",
        products: "Agro Fertilizer (Bulk) + Organic Pesticides",
        value: "₹2.95 Lakh",
        status: "Accepted",
        owner: "Rahul Verma",
      },
      {
        id: "QT-1998",
        date: "22 Jul 2026",
        validUntil: "05 Aug 2026",
        products: "Seeds — Mixed Variety",
        value: "₹1.10 Lakh",
        status: "Accepted",
        owner: "Rahul Verma",
      },
      {
        id: "QT-1952",
        date: "28 Jun 2026",
        validUntil: "12 Jul 2026",
        products: "Organic Pesticides (Trial Batch)",
        value: "₹0.65 Lakh",
        status: "Rejected",
        owner: "Rahul Verma",
      },
      {
        id: "QT-2071",
        date: "24 Aug 2026",
        validUntil: "07 Sep 2026",
        products: "Agro Fertilizer — Next Bulk Cycle",
        value: "₹3.20 Lakh",
        status: "Sent",
        owner: "Rahul Verma",
      },
    ],
    invoices: [
      {
        id: "INV-8821",
        date: "18 Aug 2026",
        dueDate: "02 Sep 2026",
        amount: "₹2.85 Lakh",
        balance: "₹0.00",
        status: "Paid",
      },
      {
        id: "INV-8790",
        date: "02 Aug 2026",
        dueDate: "17 Aug 2026",
        amount: "₹1.65 Lakh",
        balance: "₹1.65 Lakh",
        status: "Overdue",
      },
      {
        id: "INV-8744",
        date: "19 Jul 2026",
        dueDate: "03 Aug 2026",
        amount: "₹3.10 Lakh",
        balance: "₹0.00",
        status: "Paid",
      },
      {
        id: "INV-8701",
        date: "05 Jul 2026",
        dueDate: "20 Jul 2026",
        amount: "₹1.20 Lakh",
        balance: "₹0.80 Lakh",
        status: "Partial",
      },
    ],
    followUpHistory: [
      {
        id: "FU-3312",
        type: "Call",
        date: "Tomorrow, 10:30 AM",
        assignedTo: "Rahul Verma",
        status: "Scheduled",
        notes: "Discuss repeat order for Agro Products.",
      },
      {
        id: "FU-3288",
        type: "WhatsApp",
        date: "16 Aug 2026",
        assignedTo: "Rahul Verma",
        status: "Completed",
        notes: "Customer asked about new pricing for bulk fertilizer.",
      },
      {
        id: "FU-3254",
        type: "Call",
        date: "12 Aug 2026",
        assignedTo: "Rahul Verma",
        status: "Completed",
        notes: "Discussed next month's requirement and confirmed quantity.",
      },
      {
        id: "FU-3201",
        type: "Meeting",
        date: "28 Jul 2026",
        assignedTo: "Rahul Verma",
        status: "Completed",
        notes: "In-person visit to warehouse, reviewed storage capacity.",
      },
      {
        id: "FU-3167",
        type: "Email",
        date: "14 Jul 2026",
        assignedTo: "Rahul Verma",
        status: "Missed",
        notes: "Customer did not respond to follow-up email on pricing.",
      },
    ],
    products: [
      {
        name: "Agro Fertilizer",
        category: "Fertilizers",
        totalOrders: 18,
        totalValue: "₹24.6 Lakh",
        lastOrdered: "18 Aug 2026",
        avgQty: "2.4 Tonnes / order",
        unitPrice: "₹57,000 / Tonne",
      },
      {
        name: "Organic Pesticides",
        category: "Pesticides",
        totalOrders: 12,
        totalValue: "₹14.8 Lakh",
        lastOrdered: "05 Jul 2026",
        avgQty: "180 Litres / order",
        unitPrice: "₹685 / Litre",
      },
      {
        name: "Seeds — Mixed Variety",
        category: "Seeds",
        totalOrders: 8,
        totalValue: "₹9.2 Lakh",
        lastOrdered: "19 Jul 2026",
        avgQty: "40 Bags / order",
        unitPrice: "₹2,875 / Bag",
      },
    ],
    documents: [
      {
        name: "GST Certificate — Shreeji Traders.pdf",
        type: "PDF",
        uploadedBy: "Rahul Verma",
        date: "12 Jan 2025",
        size: "1.2 MB",
      },
      {
        name: "Signed Agreement 2025.pdf",
        type: "PDF",
        uploadedBy: "Rahul Verma",
        date: "18 Jan 2025",
        size: "2.4 MB",
      },
      {
        name: "Quotation QT-2034.pdf",
        type: "PDF",
        uploadedBy: "System",
        date: "10 Aug 2026",
        size: "480 KB",
      },
      {
        name: "Warehouse Visit Photos.zip",
        type: "Image",
        uploadedBy: "Rahul Verma",
        date: "28 Jul 2026",
        size: "6.8 MB",
      },
    ],
    insights: {
      lifetimeValue: "₹48.6 Lakh",
      avgOrderValue: "₹1.87 Lakh",
      purchaseFrequency: "Every 28 days",
      lastPurchase: "18 Aug 2026",
      daysSinceLastOrder: 8,
      repeatProbability: "High (86%)",
      outstanding: "₹2.45 Lakh",
      creditLimit: "₹5.00 Lakh",
      mostPurchased: "Agro Fertilizer",
    },
    aiInsight: {
      message:
        "Shreeji Traders usually places a repeat order every 28 days. The customer is now 6 days past the expected purchase cycle.",
      action: "Contact customer today about the next bulk order.",
    },
    convertedFrom: {
      leadName: "Shreeji Traders",
      source: "WhatsApp",
      created: "12 Jan 2025",
      converted: "18 Jan 2025",
    },
  },

  "global-exports-ltd": {
    slug: "global-exports-ltd",
    id: "CUST-1002",
    company: "Global Exports Ltd.",
    location: "Mumbai, Maharashtra, India",
    status: "Active",
    info: {
      name: "Global Exports Ltd.",
      contact: "Amit Shah",
      phone: "+91 98200 11234",
      email: "amit.shah@globalexports.in",
      industry: "Export Trading",
      location: "Mumbai, Maharashtra",
      since: "04 Mar 2025",
      owner: "Neha Singh",
      type: "Export Buyer",
    },
    kpis: {
      lifetimeRevenue: "₹36.2 Lakh",
      totalOrders: 18,
      avgOrderValue: "₹2.01 Lakh",
      lastOrder: "20 Aug 2026",
      outstanding: "₹0.00",
    },
    revenueTrend: [
      { month: "Jan", revenue: 2.1 },
      { month: "Feb", revenue: 2.6 },
      { month: "Mar", revenue: 3.0 },
      { month: "Apr", revenue: 3.4 },
      { month: "May", revenue: 4.0 },
      { month: "Jun", revenue: 4.6 },
      { month: "Jul", revenue: 5.1 },
      { month: "Aug", revenue: 4.8 },
    ],
    recentOrders: [
      {
        id: "ORD-10461",
        date: "20 Aug 2026",
        products: "Industrial Pumps",
        amount: "₹3.40 Lakh",
        status: "Shipped",
        payment: "Paid",
      },
      {
        id: "ORD-10405",
        date: "01 Aug 2026",
        products: "Spare Parts",
        amount: "₹1.20 Lakh",
        status: "Delivered",
        payment: "Paid",
      },
    ],
    purchaseHistory: [
      { product: "Industrial Pumps", orders: 10, value: "₹22.4 Lakh" },
      { product: "Spare Parts", orders: 8, value: "₹13.8 Lakh" },
    ],
    nextFollowUp: {
      type: "Client Call",
      due: "22 Aug, 03:00 PM",
      assignedTo: "Neha Singh",
      reason: "Confirm shipment schedule for next export order",
    },
    activity: [
      {
        icon: "order",
        title: "Order Shipped",
        description: "Order #ORD-10461 shipped from Mumbai port.",
        date: "20 Aug 2026",
        by: "System",
      },
      {
        icon: "email",
        title: "Email Sent",
        description: "Shared updated export pricing sheet.",
        date: "15 Aug 2026",
        by: "Neha Singh",
      },
    ],
    notes: [
      {
        author: "Neha Singh",
        date: "15 Aug 2026",
        text: "Prefers email communication over WhatsApp. Always confirm Incoterms before quoting.",
      },
    ],
    tags: ["Export Buyer", "High Value", "Repeat Customer"],
    quotations: [
      {
        id: "QT-2065",
        date: "12 Aug 2026",
        validUntil: "26 Aug 2026",
        products: "Industrial Pumps — Export Grade",
        value: "₹3.60 Lakh",
        status: "Accepted",
        owner: "Neha Singh",
      },
      {
        id: "QT-1987",
        date: "18 Jul 2026",
        validUntil: "01 Aug 2026",
        products: "Spare Parts Kit — Bulk",
        value: "₹1.35 Lakh",
        status: "Accepted",
        owner: "Neha Singh",
      },
      {
        id: "QT-2079",
        date: "23 Aug 2026",
        validUntil: "06 Sep 2026",
        products: "Industrial Pumps — Next Export Batch",
        value: "₹4.10 Lakh",
        status: "Negotiation",
        owner: "Neha Singh",
      },
    ],
    invoices: [
      {
        id: "INV-8830",
        date: "20 Aug 2026",
        dueDate: "04 Sep 2026",
        amount: "₹3.40 Lakh",
        balance: "₹0.00",
        status: "Paid",
      },
      {
        id: "INV-8762",
        date: "01 Aug 2026",
        dueDate: "16 Aug 2026",
        amount: "₹1.20 Lakh",
        balance: "₹0.00",
        status: "Paid",
      },
      {
        id: "INV-8698",
        date: "10 Jul 2026",
        dueDate: "25 Jul 2026",
        amount: "₹2.10 Lakh",
        balance: "₹0.00",
        status: "Paid",
      },
    ],
    followUpHistory: [
      {
        id: "FU-3319",
        type: "Call",
        date: "22 Aug, 03:00 PM",
        assignedTo: "Neha Singh",
        status: "Scheduled",
        notes: "Confirm shipment schedule for next export order.",
      },
      {
        id: "FU-3277",
        type: "Email",
        date: "15 Aug 2026",
        assignedTo: "Neha Singh",
        status: "Completed",
        notes: "Shared updated export pricing sheet.",
      },
      {
        id: "FU-3221",
        type: "Call",
        date: "29 Jul 2026",
        assignedTo: "Neha Singh",
        status: "Completed",
        notes: "Discussed Incoterms for the next shipment.",
      },
    ],
    products: [
      {
        name: "Industrial Pumps",
        category: "Industrial Equipment",
        totalOrders: 10,
        totalValue: "₹22.4 Lakh",
        lastOrdered: "20 Aug 2026",
        avgQty: "6 Units / order",
        unitPrice: "₹37,500 / Unit",
      },
      {
        name: "Spare Parts",
        category: "Components",
        totalOrders: 8,
        totalValue: "₹13.8 Lakh",
        lastOrdered: "01 Aug 2026",
        avgQty: "1 Kit / order",
        unitPrice: "₹1.72 Lakh / Kit",
      },
    ],
    documents: [
      {
        name: "Export License.pdf",
        type: "PDF",
        uploadedBy: "Neha Singh",
        date: "04 Mar 2025",
        size: "980 KB",
      },
      {
        name: "Incoterms Agreement.pdf",
        type: "PDF",
        uploadedBy: "Neha Singh",
        date: "10 Mar 2025",
        size: "1.1 MB",
      },
      {
        name: "Shipment Photos — ORD-10461.zip",
        type: "Image",
        uploadedBy: "System",
        date: "20 Aug 2026",
        size: "4.3 MB",
      },
    ],
    insights: {
      lifetimeValue: "₹36.2 Lakh",
      avgOrderValue: "₹2.01 Lakh",
      purchaseFrequency: "Every 35 days",
      lastPurchase: "20 Aug 2026",
      daysSinceLastOrder: 6,
      repeatProbability: "High (78%)",
      outstanding: "₹0.00",
      creditLimit: "₹8.00 Lakh",
      mostPurchased: "Industrial Pumps",
    },
    aiInsight: {
      message:
        "Global Exports Ltd. typically reorders spare parts within 6 weeks of the last shipment.",
      action: "Send a proactive spare-parts quote before the next cycle begins.",
    },
    convertedFrom: {
      leadName: "Global Exports Ltd.",
      source: "Email",
      created: "20 Feb 2025",
      converted: "04 Mar 2025",
    },
  },

  "maharashtra-distributors": {
    slug: "maharashtra-distributors",
    id: "CUST-1003",
    company: "Maharashtra Distributors",
    location: "Pune, Maharashtra, India",
    status: "At Risk",
    info: {
      name: "Maharashtra Distributors",
      contact: "Ajay Kulkarni",
      phone: "+91 90210 55678",
      email: "ajay.k@mahadist.com",
      industry: "General Distribution",
      location: "Pune, Maharashtra",
      since: "28 Apr 2024",
      owner: "Arjun Mehta",
      type: "Distributor",
    },
    kpis: {
      lifetimeRevenue: "₹28.4 Lakh",
      totalOrders: 14,
      avgOrderValue: "₹2.03 Lakh",
      lastOrder: "02 Aug 2026",
      outstanding: "₹4.10 Lakh",
    },
    revenueTrend: [
      { month: "Jan", revenue: 3.4 },
      { month: "Feb", revenue: 2.9 },
      { month: "Mar", revenue: 2.5 },
      { month: "Apr", revenue: 2.2 },
      { month: "May", revenue: 1.8 },
      { month: "Jun", revenue: 1.4 },
      { month: "Jul", revenue: 1.1 },
      { month: "Aug", revenue: 0.6 },
    ],
    recentOrders: [
      {
        id: "ORD-10310",
        date: "02 Aug 2026",
        products: "Control Panels",
        amount: "₹1.40 Lakh",
        status: "Delivered",
        payment: "Partial",
      },
      {
        id: "ORD-10201",
        date: "22 Jun 2026",
        products: "Accessories",
        amount: "₹0.85 Lakh",
        status: "Delivered",
        payment: "Pending",
      },
    ],
    purchaseHistory: [
      { product: "Control Panels", orders: 9, value: "₹18.2 Lakh" },
      { product: "Accessories", orders: 5, value: "₹10.2 Lakh" },
    ],
    nextFollowUp: {
      type: "Recovery Call",
      due: "Overdue by 3 days",
      assignedTo: "Arjun Mehta",
      reason: "Order frequency has dropped — check in and collect pending payment",
    },
    activity: [
      {
        icon: "order",
        title: "Order Delivered",
        description: "Order #ORD-10310 delivered, payment partially received.",
        date: "02 Aug 2026",
        by: "System",
      },
      {
        icon: "call",
        title: "Call Attempted",
        description: "No response on 2 consecutive calls.",
        date: "14 Aug 2026",
        by: "Arjun Mehta",
      },
    ],
    notes: [
      {
        author: "Arjun Mehta",
        date: "14 Aug 2026",
        text: "Orders have slowed down significantly over the last 2 months. Need to understand if they've shifted to another vendor.",
      },
    ],
    tags: ["Distributor", "At Risk", "Outstanding Payment"],
    quotations: [
      {
        id: "QT-1901",
        date: "18 Jun 2026",
        validUntil: "02 Jul 2026",
        products: "Control Panels — Restock",
        value: "₹1.55 Lakh",
        status: "Accepted",
        owner: "Arjun Mehta",
      },
      {
        id: "QT-2058",
        date: "08 Aug 2026",
        validUntil: "22 Aug 2026",
        products: "Control Panels + Accessories",
        value: "₹1.90 Lakh",
        status: "Expired",
        owner: "Arjun Mehta",
      },
    ],
    invoices: [
      {
        id: "INV-8705",
        date: "02 Aug 2026",
        dueDate: "17 Aug 2026",
        amount: "₹1.40 Lakh",
        balance: "₹0.70 Lakh",
        status: "Partial",
      },
      {
        id: "INV-8590",
        date: "22 Jun 2026",
        dueDate: "07 Jul 2026",
        amount: "₹0.85 Lakh",
        balance: "₹0.85 Lakh",
        status: "Overdue",
      },
      {
        id: "INV-8471",
        date: "30 Apr 2026",
        dueDate: "15 May 2026",
        amount: "₹2.55 Lakh",
        balance: "₹2.55 Lakh",
        status: "Overdue",
      },
    ],
    followUpHistory: [
      {
        id: "FU-3301",
        type: "Call",
        date: "Overdue by 3 days",
        assignedTo: "Arjun Mehta",
        status: "Overdue",
        notes: "Order frequency has dropped — check in and collect pending payment.",
      },
      {
        id: "FU-3260",
        type: "Call",
        date: "14 Aug 2026",
        assignedTo: "Arjun Mehta",
        status: "Missed",
        notes: "No response on 2 consecutive calls.",
      },
      {
        id: "FU-3190",
        type: "WhatsApp",
        date: "25 Jul 2026",
        assignedTo: "Arjun Mehta",
        status: "Completed",
        notes: "Customer said next order would be delayed due to internal restocking.",
      },
    ],
    products: [
      {
        name: "Control Panels",
        category: "Industrial Equipment",
        totalOrders: 9,
        totalValue: "₹18.2 Lakh",
        lastOrdered: "02 Aug 2026",
        avgQty: "3 Units / order",
        unitPrice: "₹67,400 / Unit",
      },
      {
        name: "Accessories",
        category: "Components",
        totalOrders: 5,
        totalValue: "₹10.2 Lakh",
        lastOrdered: "22 Jun 2026",
        avgQty: "12 Units / order",
        unitPrice: "₹17,000 / Unit",
      },
    ],
    documents: [
      {
        name: "Distributor Agreement.pdf",
        type: "PDF",
        uploadedBy: "Arjun Mehta",
        date: "28 Apr 2024",
        size: "1.4 MB",
      },
      {
        name: "Outstanding Payment Reminder.pdf",
        type: "PDF",
        uploadedBy: "System",
        date: "16 Aug 2026",
        size: "210 KB",
      },
    ],
    insights: {
      lifetimeValue: "₹28.4 Lakh",
      avgOrderValue: "₹2.03 Lakh",
      purchaseFrequency: "Was every 30 days, now 60+ days",
      lastPurchase: "02 Aug 2026",
      daysSinceLastOrder: 24,
      repeatProbability: "Low (32%)",
      outstanding: "₹4.10 Lakh",
      creditLimit: "₹5.00 Lakh",
      mostPurchased: "Control Panels",
    },
    aiInsight: {
      message:
        "Maharashtra Distributors has gone 24 days without an order, nearly double their usual 30-day cycle, and has ₹4.10 Lakh outstanding.",
      action: "Prioritize a recovery call today before this customer churns.",
    },
    convertedFrom: {
      leadName: "Maharashtra Distributors",
      source: "Referral",
      created: "10 Apr 2024",
      converted: "28 Apr 2024",
    },
  },
};

const statusFromHealth: Record<CustomerHealth, CustomerDetail["status"]> = {
  Healthy: "Active",
  "At Risk": "At Risk",
  Inactive: "Inactive",
};

/**
 * Builds a fully-shaped CustomerDetail from just a CustomerRow summary, for
 * customers that don't (yet) have a hand-curated deep profile. Every section
 * of the existing Customer Detail UI can render this safely — sub-lists are
 * simply empty until real orders/quotations/invoices exist for them, and the
 * Follow-ups tab is populated live from the Follow Ups module (see the
 * customer detail route loader).
 */
function buildFallbackCustomerDetail(row: CustomerRow): CustomerDetail {
  return {
    slug: row.slug,
    id: row.id,
    company: row.company,
    location: row.location + ", " + (row.location.includes("UAE") ? "UAE" : "India"),
    status: statusFromHealth[row.health],
    info: {
      name: row.company,
      contact: row.contact,
      phone: row.phone,
      email: row.email,
      industry: row.type,
      location: row.location,
      since: "—",
      owner: row.owner,
      type: row.type,
    },
    kpis: {
      lifetimeRevenue: row.revenue,
      totalOrders: row.orders,
      avgOrderValue: row.orders > 0 ? row.revenue : "₹0",
      lastOrder: row.lastOrder,
      outstanding: "₹0",
    },
    revenueTrend: [],
    recentOrders: [],
    purchaseHistory: [],
    nextFollowUp: {
      type: "Follow-up",
      due: row.nextFollowUp,
      assignedTo: row.owner,
      reason: "Synced from this customer's Follow Ups.",
    },
    activity: [],
    notes: [],
    tags: [row.type, row.health],
    quotations: [],
    invoices: [],
    followUpHistory: [],
    products: [],
    documents: [],
    insights: {
      lifetimeValue: row.revenue,
      avgOrderValue: row.orders > 0 ? row.revenue : "₹0",
      purchaseFrequency: "—",
      lastPurchase: row.lastOrder,
      daysSinceLastOrder: 0,
      repeatProbability: "—",
      outstanding: "₹0",
      creditLimit: "—",
      mostPurchased: "—",
    },
    aiInsight: {
      message: `No AI insight is available yet for ${row.company} — check back once there is more order history.`,
      action: "Review the Follow-ups tab for the next scheduled touchpoint.",
    },
    convertedFrom: {
      leadName: row.company,
      source: "—",
      created: "—",
      converted: "—",
    },
  };
}

export function getCustomerBySlug(slug: string): CustomerDetail | undefined {
  if (customerDetails[slug]) return customerDetails[slug];
  const row = getCustomerRowBySlug(slug);
  if (row) return buildFallbackCustomerDetail(row);
  return undefined;
}
