// Syntrixa 360 — Payment Follow-up module data layer (Part 6)
//
// Business flow this module powers:
// Order -> Payment Due -> Payment Follow-up -> Payment Received -> Repeat Order
//
// Scoped to the logged-in Sales Executive: every record's `owner` matches
// the executive viewing the page, and every `customerSlug` resolves to a
// real record in `customerRows` (customers-data.ts) so "View Customer 360"
// opens the actual, already-built Customer 360 page — not a stub.

import { getCustomerRowBySlug } from "@/lib/customers-data";

export type PaymentStatus = "Paid" | "Partial" | "Pending" | "Overdue";

export type PaymentFollowUpStatus =
  | "Not Contacted"
  | "Contacted"
  | "Promised Payment"
  | "Follow-up Required"
  | "Payment Received"
  | "Escalated";

export type PaymentTimelineEvent = {
  id: string;
  date: string;
  label: string;
  note?: string;
};

export type PaymentInstallment = {
  id: string;
  date: string;
  label: string;
  amount: number;
};

export type PaymentFollowUp = {
  id: string;
  orderId: string;
  orderNumber: string;
  orderDate: string;
  expectedDelivery: string;
  orderStatus: "Processing" | "Shipped" | "Delivered";
  customerId: string;
  customerSlug: string;
  customerName: string;
  contact: string;
  phone: string;
  email: string;
  city: string;
  country: string;
  productSummary: string;
  salespersonId: string;
  salespersonName: string;
  orderTotal: number;
  paidAmount: number;
  dueDate: string;
  paymentStatus: PaymentStatus;
  followUpStatus: PaymentFollowUpStatus;
  lastFollowUpDate: string | null;
  nextFollowUpDate: string | null;
  promisedPaymentDate: string | null;
  paymentTermsLabel: string;
  advancePercent: number;
  notes: string;
  installments: PaymentInstallment[];
  timeline: PaymentTimelineEvent[];
};

export const currentSalesExecutive = "Rahul Verma";

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function formatINR(amount: number): string {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

/** Compact lakh/crore label for KPI headline numbers, e.g. ₹18.6L */
export function formatINRCompact(amount: number): string {
  if (amount >= 1_00_00_000) return `₹${round2(amount / 1_00_00_000)}Cr`;
  if (amount >= 1_00_000) return `₹${round2(amount / 1_00_000)}L`;
  if (amount >= 1_000) return `₹${round2(amount / 1_000)}K`;
  return `₹${Math.round(amount)}`;
}

type RawPayment = Omit<PaymentFollowUp, "customerId" | "city" | "country">;

// customerSlug points at real customerRows entries owned by Rahul Verma:
// shreeji-traders, sai-traders, bright-steel-pvt-ltd, emirates-traders-llc,
// royal-traders-fzc.
const rawPayments: RawPayment[] = [
  {
    id: "PAY-1024",
    orderId: "ORD-2026-0024",
    orderNumber: "SO-1024",
    orderDate: "01 Sep 2026",
    expectedDelivery: "20 Sep 2026",
    orderStatus: "Processing",
    customerSlug: "shreeji-traders",
    customerName: "Shreeji Traders",
    contact: "Ramesh Patel",
    phone: "+91 98765 43210",
    email: "shreejitraders@gmail.com",
    productSummary: "Semi-Husked Coconut — 12 MT",
    salespersonId: "SP-01",
    salespersonName: "Rahul Verma",
    orderTotal: 850000,
    paidAmount: 500000,
    dueDate: "15 Sep 2026",
    paymentStatus: "Partial",
    followUpStatus: "Promised Payment",
    lastFollowUpDate: "12 Sep",
    nextFollowUpDate: "18 Sep",
    promisedPaymentDate: "18 Sep 2026",
    paymentTermsLabel: "30% Advance / 70% Before Shipment",
    advancePercent: 30,
    notes: "Customer confirmed balance will clear once container is booked.",
    installments: [
      { id: "i1", date: "05 Sep", label: "Advance", amount: 250000 },
      { id: "i2", date: "08 Sep", label: "Second Payment", amount: 250000 },
    ],
    timeline: [
      { id: "t1", date: "10 Sep", label: "Payment Due" },
      { id: "t2", date: "12 Sep", label: "Reminder Sent" },
      { id: "t3", date: "13 Sep", label: "Customer Contacted" },
      { id: "t4", date: "13 Sep", label: "Customer Promised Payment", note: "Promised 18 Sep" },
    ],
  },
  {
    id: "PAY-1018",
    orderId: "ORD-2026-0018",
    orderNumber: "SO-1018",
    orderDate: "22 Aug 2026",
    expectedDelivery: "10 Sep 2026",
    orderStatus: "Shipped",
    customerSlug: "shreeji-traders",
    customerName: "Shreeji Traders",
    contact: "Ramesh Patel",
    phone: "+91 98765 43210",
    email: "shreejitraders@gmail.com",
    productSummary: "Semi-Husked Coconut — 8 MT",
    salespersonId: "SP-01",
    salespersonName: "Rahul Verma",
    orderTotal: 480000,
    paidAmount: 180000,
    dueDate: "01 Sep 2026",
    paymentStatus: "Overdue",
    followUpStatus: "Follow-up Required",
    lastFollowUpDate: "28 Aug",
    nextFollowUpDate: "07 Sep",
    promisedPaymentDate: null,
    paymentTermsLabel: "40% Advance / 60% Before Shipment",
    advancePercent: 40,
    notes: "Second reminder sent, no response yet on the remaining balance.",
    installments: [{ id: "i1", date: "20 Aug", label: "Advance", amount: 180000 }],
    timeline: [
      { id: "t1", date: "01 Sep", label: "Payment Due" },
      { id: "t2", date: "03 Sep", label: "Reminder Sent" },
      { id: "t3", date: "28 Aug", label: "Customer Contacted", note: "No commitment given" },
    ],
  },
  {
    id: "PAY-1009",
    orderId: "ORD-2026-0009",
    orderNumber: "SO-1009",
    orderDate: "02 Aug 2026",
    expectedDelivery: "18 Aug 2026",
    orderStatus: "Delivered",
    customerSlug: "shreeji-traders",
    customerName: "Shreeji Traders",
    contact: "Ramesh Patel",
    phone: "+91 98765 43210",
    email: "shreejitraders@gmail.com",
    productSummary: "Semi-Husked Coconut — 10 MT",
    salespersonId: "SP-01",
    salespersonName: "Rahul Verma",
    orderTotal: 600000,
    paidAmount: 600000,
    dueDate: "16 Aug 2026",
    paymentStatus: "Paid",
    followUpStatus: "Payment Received",
    lastFollowUpDate: "16 Aug",
    nextFollowUpDate: null,
    promisedPaymentDate: null,
    paymentTermsLabel: "100% Before Shipment",
    advancePercent: 100,
    notes: "Cleared on time, good repeat customer.",
    installments: [{ id: "i1", date: "16 Aug", label: "Full Payment", amount: 600000 }],
    timeline: [
      { id: "t1", date: "16 Aug", label: "Payment Due" },
      { id: "t2", date: "16 Aug", label: "Payment Received" },
    ],
  },
  {
    id: "PAY-1031",
    orderId: "ORD-2026-0031",
    orderNumber: "SO-1031",
    orderDate: "03 Sep 2026",
    expectedDelivery: "22 Sep 2026",
    orderStatus: "Processing",
    customerSlug: "sai-traders",
    customerName: "Sai Traders",
    contact: "Nilesh Shah",
    phone: "+91 98865 22110",
    email: "nilesh@saitraders.in",
    productSummary: "Spare Parts Kit — 40 SET",
    salespersonId: "SP-01",
    salespersonName: "Rahul Verma",
    orderTotal: 168000,
    paidAmount: 0,
    dueDate: "06 Sep 2026",
    paymentStatus: "Pending",
    followUpStatus: "Not Contacted",
    lastFollowUpDate: null,
    nextFollowUpDate: "06 Sep",
    promisedPaymentDate: null,
    paymentTermsLabel: "100% Before Dispatch",
    advancePercent: 100,
    notes: "New order — payment link shared, awaiting confirmation.",
    installments: [],
    timeline: [{ id: "t1", date: "06 Sep", label: "Payment Due" }],
  },
  {
    id: "PAY-1015",
    orderId: "ORD-2026-0015",
    orderNumber: "SO-1015",
    orderDate: "15 Aug 2026",
    expectedDelivery: "29 Aug 2026",
    orderStatus: "Delivered",
    customerSlug: "sai-traders",
    customerName: "Sai Traders",
    contact: "Nilesh Shah",
    phone: "+91 98865 22110",
    email: "nilesh@saitraders.in",
    productSummary: "Spare Parts Kit — 25 SET",
    salespersonId: "SP-01",
    salespersonName: "Rahul Verma",
    orderTotal: 105000,
    paidAmount: 60000,
    dueDate: "29 Aug 2026",
    paymentStatus: "Overdue",
    followUpStatus: "Contacted",
    lastFollowUpDate: "02 Sep",
    nextFollowUpDate: "09 Sep",
    promisedPaymentDate: null,
    paymentTermsLabel: "Net 15",
    advancePercent: 0,
    notes: "Spoke to accounts team, cheque said to be couriered.",
    installments: [{ id: "i1", date: "18 Aug", label: "Partial Payment", amount: 60000 }],
    timeline: [
      { id: "t1", date: "29 Aug", label: "Payment Due" },
      { id: "t2", date: "31 Aug", label: "Reminder Sent" },
      {
        id: "t3",
        date: "02 Sep",
        label: "Customer Contacted",
        note: "Cheque said to be in transit",
      },
    ],
  },
  {
    id: "PAY-1022",
    orderId: "ORD-2026-0022",
    orderNumber: "SO-1022",
    orderDate: "28 Aug 2026",
    expectedDelivery: "12 Sep 2026",
    orderStatus: "Processing",
    customerSlug: "bright-steel-pvt-ltd",
    customerName: "Bright Steel Pvt. Ltd.",
    contact: "Rakesh Jain",
    phone: "+91 98765 21001",
    email: "rakesh.jain@brightsteel.in",
    productSummary: "Industrial Pump — 5HP × 6",
    salespersonId: "SP-01",
    salespersonName: "Rahul Verma",
    orderTotal: 111000,
    paidAmount: 111000,
    dueDate: "05 Sep 2026",
    paymentStatus: "Paid",
    followUpStatus: "Payment Received",
    lastFollowUpDate: "05 Sep",
    nextFollowUpDate: null,
    promisedPaymentDate: null,
    paymentTermsLabel: "50% Advance / 50% Before Shipment",
    advancePercent: 50,
    notes: "Paid in full ahead of schedule.",
    installments: [
      { id: "i1", date: "29 Aug", label: "Advance", amount: 55500 },
      { id: "i2", date: "05 Sep", label: "Balance Payment", amount: 55500 },
    ],
    timeline: [
      { id: "t1", date: "05 Sep", label: "Payment Due" },
      { id: "t2", date: "05 Sep", label: "Payment Received" },
    ],
  },
  {
    id: "PAY-1006",
    orderId: "ORD-2026-0006",
    orderNumber: "SO-1006",
    orderDate: "10 Jul 2026",
    expectedDelivery: "25 Jul 2026",
    orderStatus: "Delivered",
    customerSlug: "bright-steel-pvt-ltd",
    customerName: "Bright Steel Pvt. Ltd.",
    contact: "Rakesh Jain",
    phone: "+91 98765 21001",
    email: "rakesh.jain@brightsteel.in",
    productSummary: "Control Panel — Standard × 4",
    salespersonId: "SP-01",
    salespersonName: "Rahul Verma",
    orderTotal: 89600,
    paidAmount: 20000,
    dueDate: "24 Jul 2026",
    paymentStatus: "Overdue",
    followUpStatus: "Escalated",
    lastFollowUpDate: "30 Aug",
    nextFollowUpDate: "08 Sep",
    promisedPaymentDate: null,
    paymentTermsLabel: "Net 15",
    advancePercent: 0,
    notes: "43+ days overdue, escalated to Sales Manager for credit hold review.",
    installments: [{ id: "i1", date: "15 Jul", label: "Partial Payment", amount: 20000 }],
    timeline: [
      { id: "t1", date: "24 Jul", label: "Payment Due" },
      { id: "t2", date: "01 Aug", label: "Reminder Sent" },
      { id: "t3", date: "15 Aug", label: "Reminder Sent" },
      { id: "t4", date: "30 Aug", label: "Escalated", note: "Flagged to Sales Manager" },
    ],
  },
  {
    id: "PAY-1029",
    orderId: "ORD-2026-0029",
    orderNumber: "SO-1029",
    orderDate: "30 Aug 2026",
    expectedDelivery: "18 Sep 2026",
    orderStatus: "Processing",
    customerSlug: "emirates-traders-llc",
    customerName: "Emirates Traders LLC",
    contact: "Yusuf Ahmed",
    phone: "+971 50 123 4567",
    email: "yusuf@emiratestraders.ae",
    productSummary: "Semi-Husked Coconut — 20 MT",
    salespersonId: "SP-01",
    salespersonName: "Rahul Verma",
    orderTotal: 1200000,
    paidAmount: 360000,
    dueDate: "18 Sep 2026",
    paymentStatus: "Partial",
    followUpStatus: "Contacted",
    lastFollowUpDate: "02 Sep",
    nextFollowUpDate: "15 Sep",
    promisedPaymentDate: null,
    paymentTermsLabel: "30% Advance / 70% Against LC",
    advancePercent: 30,
    notes: "LC under process at customer's bank, expected within a week.",
    installments: [{ id: "i1", date: "01 Sep", label: "Advance", amount: 360000 }],
    timeline: [
      { id: "t1", date: "01 Sep", label: "Advance Received" },
      { id: "t2", date: "02 Sep", label: "Customer Contacted", note: "LC in process" },
    ],
  },
  {
    id: "PAY-1002",
    orderId: "ORD-2026-0002",
    orderNumber: "SO-1002",
    orderDate: "05 Jun 2026",
    expectedDelivery: "25 Jun 2026",
    orderStatus: "Delivered",
    customerSlug: "emirates-traders-llc",
    customerName: "Emirates Traders LLC",
    contact: "Yusuf Ahmed",
    phone: "+971 50 123 4567",
    email: "yusuf@emiratestraders.ae",
    productSummary: "Semi-Husked Coconut — 18 MT",
    salespersonId: "SP-01",
    salespersonName: "Rahul Verma",
    orderTotal: 1080000,
    paidAmount: 1080000,
    dueDate: "22 Jun 2026",
    paymentStatus: "Paid",
    followUpStatus: "Payment Received",
    lastFollowUpDate: "22 Jun",
    nextFollowUpDate: null,
    promisedPaymentDate: null,
    paymentTermsLabel: "30% Advance / 70% Against LC",
    advancePercent: 30,
    notes: "Cleared on schedule.",
    installments: [
      { id: "i1", date: "08 Jun", label: "Advance", amount: 324000 },
      { id: "i2", date: "22 Jun", label: "LC Settlement", amount: 756000 },
    ],
    timeline: [
      { id: "t1", date: "22 Jun", label: "Payment Due" },
      { id: "t2", date: "22 Jun", label: "Payment Received" },
    ],
  },
  {
    id: "PAY-1026",
    orderId: "ORD-2026-0026",
    orderNumber: "SO-1026",
    orderDate: "29 Aug 2026",
    expectedDelivery: "16 Sep 2026",
    orderStatus: "Processing",
    customerSlug: "royal-traders-fzc",
    customerName: "Royal Traders FZC",
    contact: "Imran Qureshi",
    phone: "+971 55 987 6543",
    email: "imran@royaltradersfzc.ae",
    productSummary: "Annual Service Contract — 2 Units",
    salespersonId: "SP-01",
    salespersonName: "Rahul Verma",
    orderTotal: 130000,
    paidAmount: 65000,
    dueDate: "20 Sep 2026",
    paymentStatus: "Partial",
    followUpStatus: "Not Contacted",
    lastFollowUpDate: null,
    nextFollowUpDate: "12 Sep",
    promisedPaymentDate: null,
    paymentTermsLabel: "50% Advance / 50% On Completion",
    advancePercent: 50,
    notes: "Balance due on service completion, not yet followed up.",
    installments: [{ id: "i1", date: "29 Aug", label: "Advance", amount: 65000 }],
    timeline: [{ id: "t1", date: "29 Aug", label: "Advance Received" }],
  },
  {
    id: "PAY-1011",
    orderId: "ORD-2026-0011",
    orderNumber: "SO-1011",
    orderDate: "12 Jul 2026",
    expectedDelivery: "28 Jul 2026",
    orderStatus: "Delivered",
    customerSlug: "royal-traders-fzc",
    customerName: "Royal Traders FZC",
    contact: "Imran Qureshi",
    phone: "+971 55 987 6543",
    email: "imran@royaltradersfzc.ae",
    productSummary: "Industrial Pump — 5HP × 3",
    salespersonId: "SP-01",
    salespersonName: "Rahul Verma",
    orderTotal: 55500,
    paidAmount: 15000,
    dueDate: "05 Aug 2026",
    paymentStatus: "Overdue",
    followUpStatus: "Promised Payment",
    lastFollowUpDate: "29 Aug",
    nextFollowUpDate: "10 Sep",
    promisedPaymentDate: "10 Sep 2026",
    paymentTermsLabel: "Net 15",
    advancePercent: 0,
    notes: "Promised payment after their own customer clears invoice.",
    installments: [{ id: "i1", date: "20 Jul", label: "Partial Payment", amount: 15000 }],
    timeline: [
      { id: "t1", date: "05 Aug", label: "Payment Due" },
      { id: "t2", date: "15 Aug", label: "Reminder Sent" },
      { id: "t3", date: "29 Aug", label: "Customer Promised Payment", note: "Promised 10 Sep" },
    ],
  },
  {
    id: "PAY-1033",
    orderId: "ORD-2026-0033",
    orderNumber: "SO-1033",
    orderDate: "04 Sep 2026",
    expectedDelivery: "24 Sep 2026",
    orderStatus: "Processing",
    customerSlug: "sai-traders",
    customerName: "Sai Traders",
    contact: "Nilesh Shah",
    phone: "+91 98865 22110",
    email: "nilesh@saitraders.in",
    productSummary: "Annual Service Contract — 1 Unit",
    salespersonId: "SP-01",
    salespersonName: "Rahul Verma",
    orderTotal: 65000,
    paidAmount: 65000,
    dueDate: "04 Sep 2026",
    paymentStatus: "Paid",
    followUpStatus: "Payment Received",
    lastFollowUpDate: "04 Sep",
    nextFollowUpDate: null,
    promisedPaymentDate: null,
    paymentTermsLabel: "100% Advance",
    advancePercent: 100,
    notes: "Paid upfront with the order.",
    installments: [{ id: "i1", date: "04 Sep", label: "Full Payment", amount: 65000 }],
    timeline: [
      { id: "t1", date: "04 Sep", label: "Payment Due" },
      { id: "t2", date: "04 Sep", label: "Payment Received" },
    ],
  },
  {
    id: "PAY-1013",
    orderId: "ORD-2026-0013",
    orderNumber: "SO-1013",
    orderDate: "20 Jul 2026",
    expectedDelivery: "05 Aug 2026",
    orderStatus: "Delivered",
    customerSlug: "shreeji-traders",
    customerName: "Shreeji Traders",
    contact: "Ramesh Patel",
    phone: "+91 98765 43210",
    email: "shreejitraders@gmail.com",
    productSummary: "Semi-Husked Coconut — 6 MT",
    salespersonId: "SP-01",
    salespersonName: "Rahul Verma",
    orderTotal: 360000,
    paidAmount: 360000,
    dueDate: "03 Aug 2026",
    paymentStatus: "Paid",
    followUpStatus: "Payment Received",
    lastFollowUpDate: "03 Aug",
    nextFollowUpDate: null,
    promisedPaymentDate: null,
    paymentTermsLabel: "30% Advance / 70% Before Shipment",
    advancePercent: 30,
    notes: "No issues, paid two days early.",
    installments: [
      { id: "i1", date: "22 Jul", label: "Advance", amount: 108000 },
      { id: "i2", date: "01 Aug", label: "Balance Payment", amount: 252000 },
    ],
    timeline: [
      { id: "t1", date: "03 Aug", label: "Payment Due" },
      { id: "t2", date: "01 Aug", label: "Payment Received" },
    ],
  },
  {
    id: "PAY-1005",
    orderId: "ORD-2026-0005",
    orderNumber: "SO-1005",
    orderDate: "18 Jun 2026",
    expectedDelivery: "03 Jul 2026",
    orderStatus: "Delivered",
    customerSlug: "bright-steel-pvt-ltd",
    customerName: "Bright Steel Pvt. Ltd.",
    contact: "Rakesh Jain",
    phone: "+91 98765 21001",
    email: "rakesh.jain@brightsteel.in",
    productSummary: "Spare Parts Kit — 15 SET",
    salespersonId: "SP-01",
    salespersonName: "Rahul Verma",
    orderTotal: 63000,
    paidAmount: 63000,
    dueDate: "01 Jul 2026",
    paymentStatus: "Paid",
    followUpStatus: "Payment Received",
    lastFollowUpDate: "01 Jul",
    nextFollowUpDate: null,
    promisedPaymentDate: null,
    paymentTermsLabel: "Net 15",
    advancePercent: 0,
    notes: "Cleared on due date.",
    installments: [{ id: "i1", date: "01 Jul", label: "Full Payment", amount: 63000 }],
    timeline: [
      { id: "t1", date: "01 Jul", label: "Payment Due" },
      { id: "t2", date: "01 Jul", label: "Payment Received" },
    ],
  },
];

export const paymentFollowUps: PaymentFollowUp[] = rawPayments.map((p) => {
  const row = getCustomerRowBySlug(p.customerSlug);
  const [city, country] = row ? row.location.split(",").map((s) => s.trim()) : ["—", "—"];
  return { ...p, customerId: row?.id ?? "—", city: city ?? "—", country: country ?? "India" };
});

export function pendingAmount(p: PaymentFollowUp): number {
  return Math.max(p.orderTotal - p.paidAmount, 0);
}

export function paymentDueDateValue(p: PaymentFollowUp): number {
  // Mock records use "DD Mon YYYY"; parse loosely for sorting/aging only.
  const parsed = Date.parse(p.dueDate.replace(/(\d+) (\w+) (\d+)/, "$2 $1, $3"));
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function paymentKpis(rows: PaymentFollowUp[]) {
  const outstanding = rows.reduce((sum, p) => sum + pendingAmount(p), 0);
  const dueToday = rows
    .filter((p) => p.paymentStatus !== "Paid" && p.dueDate === "06 Sep 2026")
    .reduce((sum, p) => sum + pendingAmount(p), 0);
  const overdue = rows
    .filter((p) => p.paymentStatus === "Overdue")
    .reduce((sum, p) => sum + pendingAmount(p), 0);
  const partial = rows
    .filter((p) => p.paymentStatus === "Partial")
    .reduce((sum, p) => sum + pendingAmount(p), 0);
  const paidThisMonth = rows
    .filter((p) => p.paymentStatus === "Paid")
    .reduce((sum, p) => sum + p.paidAmount, 0);
  const customersToFollowUp = new Set(
    rows
      .filter((p) => p.paymentStatus !== "Paid" && p.followUpStatus !== "Payment Received")
      .map((p) => p.customerSlug),
  ).size;

  return { outstanding, dueToday, overdue, partial, paidThisMonth, customersToFollowUp };
}

export type AgingBucket = { label: string; amount: number };

export function paymentAgingBuckets(rows: PaymentFollowUp[]): AgingBucket[] {
  // Days-overdue relative to the mock "today" used across this module (06 Sep 2026).
  const today = Date.parse("2026-09-06");
  const totals = {
    dueToday: 0,
    d1to7: 0,
    d8to15: 0,
    d16to30: 0,
    d30plus: 0,
  };

  for (const p of rows) {
    if (p.paymentStatus === "Paid") continue;
    const due = paymentDueDateValue(p);
    const daysDiff = Math.round((today - due) / 86400000);
    const amt = pendingAmount(p);
    if (daysDiff <= 0) totals.dueToday += amt;
    else if (daysDiff <= 7) totals.d1to7 += amt;
    else if (daysDiff <= 15) totals.d8to15 += amt;
    else if (daysDiff <= 30) totals.d16to30 += amt;
    else totals.d30plus += amt;
  }

  return [
    { label: "Due Today", amount: totals.dueToday },
    { label: "1–7 Days Overdue", amount: totals.d1to7 },
    { label: "8–15 Days Overdue", amount: totals.d8to15 },
    { label: "16–30 Days Overdue", amount: totals.d16to30 },
    { label: "30+ Days Overdue", amount: totals.d30plus },
  ];
}

export const paymentFollowUpStatuses: PaymentFollowUpStatus[] = [
  "Not Contacted",
  "Contacted",
  "Promised Payment",
  "Follow-up Required",
  "Payment Received",
  "Escalated",
];
