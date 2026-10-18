// Syntrixa 360 — Quotation Module data layer
//
// Quotation is the commercial bridge between Deal and Order:
// Lead -> Deal -> Quotation (Draft -> Approval -> Sent -> Negotiation -> Revision -> Accepted) -> Order
//
// This file owns the domain types, mock records, and the pure calculation
// helpers (subtotal / discount / tax / grand total) that both the create
// wizard and the detail drawer rely on so numbers never drift between them.

export type QuotationStatus =
  | "Draft"
  | "Pending Approval"
  | "Approved"
  | "Sent"
  | "Viewed"
  | "Negotiation"
  | "Accepted"
  | "Rejected"
  | "Expired"
  | "Cancelled"
  | "Converted";

export type DiscountType = "percent" | "fixed";

export type Currency = "INR" | "USD" | "EUR" | "AED" | "GBP";

export const currencySymbols: Record<Currency, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  AED: "AED ",
  GBP: "£",
};

export const currencies: Currency[] = ["INR", "USD", "EUR", "AED", "GBP"];

export const quotationUnits = ["MT", "KG", "PCS", "BOX", "LITRE", "SET", "CONTAINER"];

export type ProductCatalogItem = {
  id: string;
  name: string;
  sku: string;
  description: string;
  unit: string;
  defaultPrice: number;
  defaultTaxRate: number;
};

export const productCatalog: ProductCatalogItem[] = [
  {
    id: "P-001",
    name: "Semi-Husked Coconut",
    sku: "COCO-SH-01",
    description: "Grade A semi-husked coconut, export packing.",
    unit: "MT",
    defaultPrice: 600,
    defaultTaxRate: 5,
  },
  {
    id: "P-002",
    name: "Industrial Pump — 5HP",
    sku: "PUMP-5HP",
    description: "Cast-iron industrial centrifugal pump, 5HP.",
    unit: "PCS",
    defaultPrice: 18500,
    defaultTaxRate: 18,
  },
  {
    id: "P-003",
    name: "Control Panel — Standard",
    sku: "CTRL-STD",
    description: "Standard motor control panel with overload protection.",
    unit: "PCS",
    defaultPrice: 22400,
    defaultTaxRate: 18,
  },
  {
    id: "P-004",
    name: "Spare Parts Kit",
    sku: "SPARE-KIT",
    description: "Assorted spare parts kit for maintenance.",
    unit: "SET",
    defaultPrice: 4200,
    defaultTaxRate: 18,
  },
  {
    id: "P-005",
    name: "Annual Service Contract",
    sku: "SVC-AMC",
    description: "12-month on-site annual maintenance contract.",
    unit: "PCS",
    defaultPrice: 65000,
    defaultTaxRate: 18,
  },
  {
    id: "P-006",
    name: "Desiccated Coconut Powder",
    sku: "COCO-DP-02",
    description: "Fine grade desiccated coconut powder, 25kg bags.",
    unit: "KG",
    defaultPrice: 145,
    defaultTaxRate: 5,
  },
];

export const paymentTermsTemplates = [
  "100% Advance",
  "30% Advance / 70% Before Shipment",
  "50% Advance / 50% Against Delivery",
  "Net 30",
  "Net 60",
  "Custom",
];

export const deliveryTermsTemplates = ["EXW", "FOB", "CIF", "CFR", "DAP", "DDP", "Custom"];

export const termsTemplates = [
  { id: "default", label: "Default Terms" },
  { id: "export", label: "Export Terms" },
  { id: "domestic", label: "Domestic Terms" },
  { id: "wholesale", label: "Wholesale Terms" },
];

export const rejectionReasons = [
  "Price too high",
  "Delivery issue",
  "Payment terms",
  "Not required",
  "Competitor selected",
  "Other",
];

export const salesExecutives = [
  "Rahul Verma",
  "Neha Singh",
  "Pooja Patel",
  "Arjun Mehta",
  "Sandeep Yadav",
];

// Lightweight customer/deal lookups for the Create Quotation wizard so
// selecting a customer or deal can auto-fill contact details, matching the
// "no duplicate manual entry" requirement from the product spec.
export type CustomerLite = {
  id: string;
  company: string;
  contact: string;
  email: string;
  /** Links this lite record to the canonical customerRows.id used by Customer 360 / Requirements. */
  customerId?: string;
};

export const customersLite: CustomerLite[] = [
  {
    id: "C-241",
    company: "Shreeji Traders",
    contact: "Nilesh Shah",
    email: "nilesh@shreejitraders.in",
    customerId: "CUST-1001",
  },
  {
    id: "C-238",
    company: "Global Exports Ltd.",
    contact: "Meera Iyer",
    email: "meera.iyer@globalexports.in",
    customerId: "CUST-1002",
  },
  {
    id: "C-233",
    company: "Maharashtra Distributors",
    contact: "Ajay Kulkarni",
    email: "ajay@mahadist.in",
    customerId: "CUST-1003",
  },
  {
    id: "C-229",
    company: "Kisan Agro Pvt. Ltd.",
    contact: "Sushil Patil",
    email: "sushil@kisanagro.in",
    customerId: "CUST-1004",
  },
  {
    id: "C-221",
    company: "Bright Steel Pvt. Ltd.",
    contact: "Rohit Jain",
    email: "rohit.jain@brightsteel.in",
    customerId: "CUST-1011",
  },
  {
    id: "C-241B",
    company: "ABC Trading LLC",
    contact: "John Smith",
    email: "john.smith@abctrading.com",
  },
  // The four below extend the lite list (not duplicate it) so every customer used by the
  // Customer Requirements module also resolves inside the existing Quotation wizard.
  {
    id: "C-246",
    company: "Vardhman Brothers",
    contact: "Vikram Sharma",
    email: "vikram@vardhmanbros.com",
    customerId: "CUST-1006",
  },
  {
    id: "C-247",
    company: "Sahyadri Agencies",
    contact: "Sneha Rao",
    email: "sneha.rao@sahyadriagencies.in",
    customerId: "CUST-1007",
  },
  {
    id: "C-248",
    company: "Pioneer Imports",
    contact: "Meera Iyer",
    email: "meera@pioneerimports.com",
    customerId: "CUST-1008",
  },
  {
    id: "C-249",
    company: "Sai Traders",
    contact: "Nilesh Shah",
    email: "nilesh@saitraders.in",
    customerId: "CUST-1010",
  },
];

/** Resolve a canonical customerRows.id (e.g. "CUST-1002") to its quotation-wizard lite id. */
export function liteCustomerIdFor(customerRowsId: string): string | undefined {
  return customersLite.find((c) => c.customerId === customerRowsId)?.id;
}

export const dealsLite = [
  { id: "D-2201", name: "Dubai Coconut Supply", customerId: "C-241B" },
  { id: "D-2198", name: "Global Exports — Pump Order", customerId: "C-238" },
  { id: "D-2170", name: "Bright Steel — Control Panels", customerId: "C-221" },
  { id: "D-2088", name: "Maharashtra Distributors — AMC", customerId: "C-233" },
  { id: "D-2101", name: "Kisan Agro — Desiccated Coconut", customerId: "C-229" },
  { id: "D-2078", name: "Shreeji Traders — Pump Enquiry", customerId: "C-241" },
];

// ---------------------------------------------------------------------------
// Line items + totals
// ---------------------------------------------------------------------------

export type QuotationItem = {
  id: string;
  productId: string | null; // null = custom line item
  name: string;
  sku: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discountType: DiscountType;
  discountValue: number;
  taxRate: number;
};

export type ItemTotals = {
  lineSubtotal: number;
  lineDiscount: number;
  lineTaxable: number;
  lineTax: number;
  lineTotal: number;
};

/** Deterministic, server-mirrored line calculation — never trust the frontend alone in production. */
export function computeItemTotals(item: QuotationItem): ItemTotals {
  const lineSubtotal = round2(item.quantity * item.unitPrice);
  const lineDiscount = round2(
    item.discountType === "percent"
      ? (lineSubtotal * item.discountValue) / 100
      : Math.min(item.discountValue, lineSubtotal),
  );
  const lineTaxable = round2(lineSubtotal - lineDiscount);
  const lineTax = round2((lineTaxable * item.taxRate) / 100);
  const lineTotal = round2(lineTaxable + lineTax);
  return { lineSubtotal, lineDiscount, lineTaxable, lineTax, lineTotal };
}

export type QuotationTotals = {
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  shippingTotal: number;
  otherCharges: number;
  grandTotal: number;
};

export function computeQuotationTotals(
  items: QuotationItem[],
  shippingTotal = 0,
  otherCharges = 0,
): QuotationTotals {
  let subtotal = 0;
  let discountTotal = 0;
  let taxTotal = 0;
  for (const item of items) {
    const t = computeItemTotals(item);
    subtotal += t.lineSubtotal;
    discountTotal += t.lineDiscount;
    taxTotal += t.lineTax;
  }
  const grandTotal = round2(subtotal - discountTotal + taxTotal + shippingTotal + otherCharges);
  return {
    subtotal: round2(subtotal),
    discountTotal: round2(discountTotal),
    taxTotal: round2(taxTotal),
    shippingTotal: round2(shippingTotal),
    otherCharges: round2(otherCharges),
    grandTotal,
  };
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function formatMoney(amount: number, currency: Currency): string {
  const symbol = currencySymbols[currency];
  const formatted =
    currency === "INR"
      ? amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })
      : amount.toLocaleString("en-US", { maximumFractionDigits: 2 });
  return `${symbol}${formatted}`;
}

/** Overall discount % across the quotation — used for approval-threshold checks. */
export function effectiveDiscountPercent(items: QuotationItem[]): number {
  const totals = computeQuotationTotals(items);
  if (totals.subtotal <= 0) return 0;
  return round2((totals.discountTotal / totals.subtotal) * 100);
}

// ---------------------------------------------------------------------------
// Approval rules (organization-configurable in Settings; hard-coded default here)
// ---------------------------------------------------------------------------

export const approvalRules = {
  discountThresholdPercent: 5,
  valueThreshold: 500000, // in organization base currency (INR)
};

// ---------------------------------------------------------------------------
// Events / timeline / versions / approval
// ---------------------------------------------------------------------------

export type QuotationEventType =
  | "Created"
  | "Submitted for Approval"
  | "Approved"
  | "Rejected by Approver"
  | "Sent"
  | "Viewed"
  | "Negotiation"
  | "Revised"
  | "Accepted"
  | "Rejected"
  | "Expired"
  | "Cancelled"
  | "Converted"
  | "Follow-up Scheduled"
  | "Extended Validity";

export type QuotationEvent = {
  id: string;
  type: QuotationEventType;
  date: string;
  time: string;
  user: string;
  note?: string;
};

export type QuotationVersionSnapshot = {
  version: number;
  createdAt: string;
  createdBy: string;
  reason: string;
  grandTotal: number;
  quantitySummary: string;
  discountPercent: number;
};

export type QuotationApproval = {
  requestedBy: string;
  requestedAt: string;
  approverId: string;
  status: "Pending" | "Approved" | "Rejected";
  requestedDiscountPercent: number;
  decidedAt?: string;
  comments?: string;
};

export type Quotation = {
  id: string; // e.g. QT-2026-0012
  version: number;
  customer: string;
  customerId: string;
  company: string;
  contact: string;
  email: string;
  phone: string;
  dealId: string;
  dealName: string;
  owner: string;
  currency: Currency;
  issueDate: string;
  validUntil: string;
  items: QuotationItem[];
  shippingTotal: number;
  otherCharges: number;
  paymentTerms: string;
  deliveryTerms: string;
  deliveryLocation: string;
  notes: string;
  internalNotes: string;
  status: QuotationStatus;
  source: string;
  template: string;
  approval: QuotationApproval | null;
  sentAt: string | null;
  viewedAt: string | null;
  viewCount: number;
  acceptedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  convertedOrderId: string | null;
  events: QuotationEvent[];
  versions: QuotationVersionSnapshot[];
};

function item(
  id: string,
  productId: string | null,
  name: string,
  sku: string,
  description: string,
  quantity: number,
  unit: string,
  unitPrice: number,
  discountType: DiscountType,
  discountValue: number,
  taxRate: number,
): QuotationItem {
  return {
    id,
    productId,
    name,
    sku,
    description,
    quantity,
    unit,
    unitPrice,
    discountType,
    discountValue,
    taxRate,
  };
}

export const quotationsData: Quotation[] = [
  {
    id: "QT-2026-0012",
    version: 2,
    customer: "ABC Trading LLC",
    customerId: "C-241",
    company: "ABC Trading LLC",
    contact: "John Smith",
    email: "john.smith@abctrading.com",
    phone: "+971 50 123 4567",
    dealId: "D-2201",
    dealName: "Dubai Coconut Supply",
    owner: "Rahul Verma",
    currency: "USD",
    issueDate: "31 Aug 2026",
    validUntil: "10 Sep 2026",
    items: [
      item(
        "QI-1",
        "P-001",
        "Semi-Husked Coconut",
        "COCO-SH-01",
        "Grade A semi-husked coconut, export packing.",
        100,
        "MT",
        580,
        "percent",
        5,
        5,
      ),
    ],
    shippingTotal: 2500,
    otherCharges: 0,
    paymentTerms: "30% Advance / 70% Before Shipment",
    deliveryTerms: "CIF",
    deliveryLocation: "Jebel Ali Port, Dubai",
    notes: "Prices are based on current freight rates and are subject to confirmation.",
    internalNotes: "Customer is highly price sensitive. Maximum approved discount = 5%.",
    status: "Negotiation",
    source: "Deal",
    template: "Export Terms",
    approval: {
      requestedBy: "Rahul Verma",
      requestedAt: "31 Aug 2026, 10:15 AM",
      approverId: "Owner",
      status: "Approved",
      requestedDiscountPercent: 5,
      decidedAt: "31 Aug 2026, 10:20 AM",
      comments: "Approved due to strategic customer.",
    },
    sentAt: "31 Aug 2026, 10:30 AM",
    viewedAt: "31 Aug 2026, 11:05 AM",
    viewCount: 3,
    acceptedAt: null,
    rejectedAt: null,
    rejectionReason: null,
    convertedOrderId: null,
    events: [
      { id: "e1", type: "Created", date: "31 Aug 2026", time: "10:00 AM", user: "Rahul Verma" },
      {
        id: "e2",
        type: "Submitted for Approval",
        date: "31 Aug 2026",
        time: "10:15 AM",
        user: "Rahul Verma",
      },
      {
        id: "e3",
        type: "Approved",
        date: "31 Aug 2026",
        time: "10:20 AM",
        user: "Owner",
        note: "Approved due to strategic customer.",
      },
      { id: "e4", type: "Sent", date: "31 Aug 2026", time: "10:30 AM", user: "Rahul Verma" },
      { id: "e5", type: "Viewed", date: "31 Aug 2026", time: "11:05 AM", user: "ABC Trading LLC" },
      {
        id: "e6",
        type: "Negotiation",
        date: "31 Aug 2026",
        time: "2:00 PM",
        user: "ABC Trading LLC",
        note: "Customer requested a lower price.",
      },
      {
        id: "e7",
        type: "Revised",
        date: "31 Aug 2026",
        time: "2:15 PM",
        user: "Rahul Verma",
        note: "Version 2 created — price reduced to $580/MT.",
      },
    ],
    versions: [
      {
        version: 1,
        createdAt: "31 Aug 2026, 10:00 AM",
        createdBy: "Rahul Verma",
        reason: "Initial quotation",
        grandTotal: 62350,
        quantitySummary: "100 MT @ $600",
        discountPercent: 3,
      },
      {
        version: 2,
        createdAt: "31 Aug 2026, 2:15 PM",
        createdBy: "Rahul Verma",
        reason: "Customer requested lower price",
        grandTotal: 58620,
        quantitySummary: "100 MT @ $580",
        discountPercent: 5,
      },
    ],
  },
  {
    id: "QT-2026-0011",
    version: 1,
    customer: "Global Exports Ltd.",
    customerId: "C-238",
    company: "Global Exports Ltd.",
    contact: "Meera Iyer",
    email: "meera.iyer@globalexports.in",
    phone: "+91 98200 11223",
    dealId: "D-2198",
    dealName: "Global Exports — Pump Order",
    owner: "Neha Singh",
    currency: "INR",
    issueDate: "29 Aug 2026",
    validUntil: "08 Sep 2026",
    items: [
      item(
        "QI-1",
        "P-002",
        "Industrial Pump — 5HP",
        "PUMP-5HP",
        "Cast-iron industrial centrifugal pump, 5HP.",
        40,
        "PCS",
        17000,
        "percent",
        2,
        18,
      ),
    ],
    shippingTotal: 12000,
    otherCharges: 0,
    paymentTerms: "Net 30",
    deliveryTerms: "FOB",
    deliveryLocation: "Nhava Sheva Port, Mumbai",
    notes: "Standard 12-month warranty applies to all pump units.",
    internalNotes: "Repeat customer, low negotiation risk.",
    status: "Sent",
    source: "Deal",
    template: "Domestic Terms",
    approval: null,
    sentAt: "29 Aug 2026, 4:10 PM",
    viewedAt: null,
    viewCount: 0,
    acceptedAt: null,
    rejectedAt: null,
    rejectionReason: null,
    convertedOrderId: null,
    events: [
      { id: "e1", type: "Created", date: "29 Aug 2026", time: "3:40 PM", user: "Neha Singh" },
      { id: "e2", type: "Sent", date: "29 Aug 2026", time: "4:10 PM", user: "Neha Singh" },
    ],
    versions: [
      {
        version: 1,
        createdAt: "29 Aug 2026, 3:40 PM",
        createdBy: "Neha Singh",
        reason: "Initial quotation",
        grandTotal: 793640,
        quantitySummary: "40 PCS @ ₹17,000",
        discountPercent: 2,
      },
    ],
  },
  {
    id: "QT-2026-0010",
    version: 1,
    customer: "Bright Steel Pvt. Ltd.",
    customerId: "C-221",
    company: "Bright Steel Pvt. Ltd.",
    contact: "Rohit Jain",
    email: "rohit.jain@brightsteel.in",
    phone: "+91 98765 43210",
    dealId: "D-2170",
    dealName: "Bright Steel — Control Panels",
    owner: "Rahul Verma",
    currency: "INR",
    issueDate: "26 Aug 2026",
    validUntil: "05 Sep 2026",
    items: [
      item(
        "QI-1",
        "P-003",
        "Control Panel — Standard",
        "CTRL-STD",
        "Standard motor control panel with overload protection.",
        16,
        "PCS",
        22400,
        "percent",
        0,
        18,
      ),
    ],
    shippingTotal: 3200,
    otherCharges: 0,
    paymentTerms: "50% Advance / 50% Against Delivery",
    deliveryTerms: "DAP",
    deliveryLocation: "Nagpur",
    notes: "Includes on-site installation support for the first month.",
    internalNotes: "",
    status: "Accepted",
    source: "Deal",
    template: "Default Terms",
    approval: null,
    sentAt: "26 Aug 2026, 11:00 AM",
    viewedAt: "26 Aug 2026, 1:20 PM",
    viewCount: 5,
    acceptedAt: "28 Aug 2026, 10:05 AM",
    rejectedAt: null,
    rejectionReason: null,
    convertedOrderId: null,
    events: [
      { id: "e1", type: "Created", date: "26 Aug 2026", time: "10:30 AM", user: "Rahul Verma" },
      { id: "e2", type: "Sent", date: "26 Aug 2026", time: "11:00 AM", user: "Rahul Verma" },
      {
        id: "e3",
        type: "Viewed",
        date: "26 Aug 2026",
        time: "1:20 PM",
        user: "Bright Steel Pvt. Ltd.",
      },
      {
        id: "e4",
        type: "Accepted",
        date: "28 Aug 2026",
        time: "10:05 AM",
        user: "Bright Steel Pvt. Ltd.",
      },
    ],
    versions: [
      {
        version: 1,
        createdAt: "26 Aug 2026, 10:30 AM",
        createdBy: "Rahul Verma",
        reason: "Initial quotation",
        grandTotal: 426752,
        quantitySummary: "16 PCS @ ₹22,400",
        discountPercent: 0,
      },
    ],
  },
  {
    id: "QT-2026-0009",
    version: 1,
    customer: "Sharma Industries",
    customerId: "C-1002",
    company: "Sharma Industries",
    contact: "Vikram Sharma",
    email: "vikram@sharmaindustries.in",
    phone: "+91 90000 12345",
    dealId: "D-2140",
    dealName: "Sharma Industries — Spares",
    owner: "Arjun Mehta",
    currency: "INR",
    issueDate: "20 Aug 2026",
    validUntil: "30 Aug 2026",
    items: [
      item(
        "QI-1",
        "P-004",
        "Spare Parts Kit",
        "SPARE-KIT",
        "Assorted spare parts kit for maintenance.",
        25,
        "SET",
        4200,
        "fixed",
        1000,
        18,
      ),
    ],
    shippingTotal: 800,
    otherCharges: 0,
    paymentTerms: "100% Advance",
    deliveryTerms: "EXW",
    deliveryLocation: "Indore",
    notes: "",
    internalNotes: "Customer went with a competitor on pricing.",
    status: "Rejected",
    source: "Deal",
    template: "Default Terms",
    approval: null,
    sentAt: "20 Aug 2026, 2:00 PM",
    viewedAt: "20 Aug 2026, 5:40 PM",
    viewCount: 2,
    acceptedAt: null,
    rejectedAt: "22 Aug 2026, 9:15 AM",
    rejectionReason: "Competitor selected",
    convertedOrderId: null,
    events: [
      { id: "e1", type: "Created", date: "20 Aug 2026", time: "1:30 PM", user: "Arjun Mehta" },
      { id: "e2", type: "Sent", date: "20 Aug 2026", time: "2:00 PM", user: "Arjun Mehta" },
      { id: "e3", type: "Viewed", date: "20 Aug 2026", time: "5:40 PM", user: "Sharma Industries" },
      {
        id: "e4",
        type: "Rejected",
        date: "22 Aug 2026",
        time: "9:15 AM",
        user: "Sharma Industries",
        note: "Competitor selected",
      },
    ],
    versions: [
      {
        version: 1,
        createdAt: "20 Aug 2026, 1:30 PM",
        createdBy: "Arjun Mehta",
        reason: "Initial quotation",
        grandTotal: 121580,
        quantitySummary: "25 SET @ ₹4,200",
        discountPercent: 1,
      },
    ],
  },
  {
    id: "QT-2026-0008",
    version: 1,
    customer: "Kisan Agro Pvt. Ltd.",
    customerId: "C-229",
    company: "Kisan Agro Pvt. Ltd.",
    contact: "Sushil Patil",
    email: "sushil@kisanagro.in",
    phone: "+91 91234 56789",
    dealId: "D-2101",
    dealName: "Kisan Agro — Desiccated Coconut",
    owner: "Pooja Patel",
    currency: "INR",
    issueDate: "12 Aug 2026",
    validUntil: "22 Aug 2026",
    items: [
      item(
        "QI-1",
        "P-006",
        "Desiccated Coconut Powder",
        "COCO-DP-02",
        "Fine grade desiccated coconut powder, 25kg bags.",
        2000,
        "KG",
        145,
        "percent",
        3,
        5,
      ),
    ],
    shippingTotal: 4500,
    otherCharges: 0,
    paymentTerms: "Net 30",
    deliveryTerms: "FOB",
    deliveryLocation: "Nashik",
    notes: "",
    internalNotes: "",
    status: "Expired",
    source: "Deal",
    template: "Wholesale Terms",
    approval: null,
    sentAt: "12 Aug 2026, 10:00 AM",
    viewedAt: null,
    viewCount: 0,
    acceptedAt: null,
    rejectedAt: null,
    rejectionReason: null,
    convertedOrderId: null,
    events: [
      { id: "e1", type: "Created", date: "12 Aug 2026", time: "9:30 AM", user: "Pooja Patel" },
      { id: "e2", type: "Sent", date: "12 Aug 2026", time: "10:00 AM", user: "Pooja Patel" },
      { id: "e3", type: "Expired", date: "23 Aug 2026", time: "12:00 AM", user: "System" },
    ],
    versions: [
      {
        version: 1,
        createdAt: "12 Aug 2026, 9:30 AM",
        createdBy: "Pooja Patel",
        reason: "Initial quotation",
        grandTotal: 300055,
        quantitySummary: "2000 KG @ ₹145",
        discountPercent: 3,
      },
    ],
  },
  {
    id: "QT-2026-0007",
    version: 1,
    customer: "Maharashtra Distributors",
    customerId: "C-233",
    company: "Maharashtra Distributors",
    contact: "Ajay Kulkarni",
    email: "ajay@mahadist.in",
    phone: "+91 90909 80808",
    dealId: "D-2088",
    dealName: "Maharashtra Distributors — AMC",
    owner: "Arjun Mehta",
    currency: "INR",
    issueDate: "31 Aug 2026",
    validUntil: "10 Sep 2026",
    items: [
      item(
        "QI-1",
        "P-005",
        "Annual Service Contract",
        "SVC-AMC",
        "12-month on-site annual maintenance contract.",
        1,
        "PCS",
        65000,
        "percent",
        0,
        18,
      ),
    ],
    shippingTotal: 0,
    otherCharges: 0,
    paymentTerms: "Net 30",
    deliveryTerms: "Custom",
    deliveryLocation: "Pune",
    notes: "",
    internalNotes: "",
    status: "Draft",
    source: "Inbox",
    template: "Default Terms",
    approval: null,
    sentAt: null,
    viewedAt: null,
    viewCount: 0,
    acceptedAt: null,
    rejectedAt: null,
    rejectionReason: null,
    convertedOrderId: null,
    events: [
      { id: "e1", type: "Created", date: "31 Aug 2026", time: "9:05 AM", user: "Arjun Mehta" },
    ],
    versions: [
      {
        version: 1,
        createdAt: "31 Aug 2026, 9:05 AM",
        createdBy: "Arjun Mehta",
        reason: "Initial quotation",
        grandTotal: 76700,
        quantitySummary: "1 PCS @ ₹65,000",
        discountPercent: 0,
      },
    ],
  },
  {
    id: "QT-2026-0006",
    version: 1,
    customer: "Shreeji Traders",
    customerId: "C-1240",
    company: "Shreeji Traders",
    contact: "Nilesh Shah",
    email: "nilesh@shreejitraders.in",
    phone: "+91 98989 12121",
    dealId: "D-2078",
    dealName: "Shreeji Traders — Pump Enquiry",
    owner: "Rahul Verma",
    currency: "INR",
    issueDate: "18 Aug 2026",
    validUntil: "28 Aug 2026",
    items: [
      item(
        "QI-1",
        "P-002",
        "Industrial Pump — 5HP",
        "PUMP-5HP",
        "Cast-iron industrial centrifugal pump, 5HP.",
        60,
        "PCS",
        18500,
        "percent",
        12,
        18,
      ),
    ],
    shippingTotal: 9000,
    otherCharges: 0,
    paymentTerms: "Net 60",
    deliveryTerms: "FOB",
    deliveryLocation: "Surat",
    notes: "",
    internalNotes: "Discount above 5% threshold — awaiting Owner sign-off.",
    status: "Pending Approval",
    source: "Deal",
    template: "Domestic Terms",
    approval: {
      requestedBy: "Rahul Verma",
      requestedAt: "18 Aug 2026, 11:40 AM",
      approverId: "Owner",
      status: "Pending",
      requestedDiscountPercent: 12,
    },
    sentAt: null,
    viewedAt: null,
    viewCount: 0,
    acceptedAt: null,
    rejectedAt: null,
    rejectionReason: null,
    convertedOrderId: null,
    events: [
      { id: "e1", type: "Created", date: "18 Aug 2026", time: "11:20 AM", user: "Rahul Verma" },
      {
        id: "e2",
        type: "Submitted for Approval",
        date: "18 Aug 2026",
        time: "11:40 AM",
        user: "Rahul Verma",
        note: "Requested discount 12% — above 5% threshold.",
      },
    ],
    versions: [
      {
        version: 1,
        createdAt: "18 Aug 2026, 11:20 AM",
        createdBy: "Rahul Verma",
        reason: "Initial quotation",
        grandTotal: 1153560,
        quantitySummary: "60 PCS @ ₹18,500",
        discountPercent: 12,
      },
    ],
  },
  {
    id: "QT-2026-0005",
    version: 1,
    customer: "Nirmal Textiles",
    customerId: "C-1310",
    company: "Nirmal Textiles",
    contact: "Sneha Rao",
    email: "sneha@nirmaltextiles.in",
    phone: "+91 87878 32323",
    dealId: "D-2050",
    dealName: "Nirmal Textiles — Control Panel",
    owner: "Pooja Patel",
    currency: "INR",
    issueDate: "10 Aug 2026",
    validUntil: "20 Aug 2026",
    items: [
      item(
        "QI-1",
        "P-003",
        "Control Panel — Standard",
        "CTRL-STD",
        "Standard motor control panel with overload protection.",
        6,
        "PCS",
        22400,
        "percent",
        0,
        18,
      ),
    ],
    shippingTotal: 1500,
    otherCharges: 0,
    paymentTerms: "100% Advance",
    deliveryTerms: "EXW",
    deliveryLocation: "Coimbatore",
    notes: "",
    internalNotes: "",
    status: "Converted",
    source: "Deal",
    template: "Default Terms",
    approval: null,
    sentAt: "10 Aug 2026, 3:00 PM",
    viewedAt: "10 Aug 2026, 4:10 PM",
    viewCount: 4,
    acceptedAt: "12 Aug 2026, 9:30 AM",
    rejectedAt: null,
    rejectionReason: null,
    convertedOrderId: "ORD-2026-0025",
    events: [
      { id: "e1", type: "Created", date: "10 Aug 2026", time: "2:30 PM", user: "Pooja Patel" },
      { id: "e2", type: "Sent", date: "10 Aug 2026", time: "3:00 PM", user: "Pooja Patel" },
      { id: "e3", type: "Viewed", date: "10 Aug 2026", time: "4:10 PM", user: "Nirmal Textiles" },
      { id: "e4", type: "Accepted", date: "12 Aug 2026", time: "9:30 AM", user: "Nirmal Textiles" },
      { id: "e5", type: "Converted", date: "12 Aug 2026", time: "9:45 AM", user: "Pooja Patel" },
    ],
    versions: [
      {
        version: 1,
        createdAt: "10 Aug 2026, 2:30 PM",
        createdBy: "Pooja Patel",
        reason: "Initial quotation",
        grandTotal: 160152,
        quantitySummary: "6 PCS @ ₹22,400",
        discountPercent: 0,
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Derived helpers used across the module
// ---------------------------------------------------------------------------

export function quotationGrandTotal(q: Quotation): number {
  return computeQuotationTotals(q.items, q.shippingTotal, q.otherCharges).grandTotal;
}

export function quotationGrandTotalLabel(q: Quotation): string {
  return formatMoney(quotationGrandTotal(q), q.currency);
}

export const openStatuses: QuotationStatus[] = [
  "Draft",
  "Pending Approval",
  "Approved",
  "Sent",
  "Viewed",
  "Negotiation",
];

export const decidedStatuses: QuotationStatus[] = [
  "Accepted",
  "Rejected",
  "Expired",
  "Cancelled",
  "Converted",
];

export function quotationsKpis(rows: Quotation[] = quotationsData) {
  const total = rows.length;
  const byStatus = (s: QuotationStatus) => rows.filter((q) => q.status === s).length;

  const totalValue = rows
    .filter((q) => q.status !== "Cancelled" && q.status !== "Rejected" && q.status !== "Expired")
    .reduce((sum, q) => sum + toInr(quotationGrandTotal(q), q.currency), 0);

  const acceptedValue = rows
    .filter((q) => q.status === "Accepted" || q.status === "Converted")
    .reduce((sum, q) => sum + toInr(quotationGrandTotal(q), q.currency), 0);

  const pendingValue = rows
    .filter((q) => openStatuses.includes(q.status))
    .reduce((sum, q) => sum + toInr(quotationGrandTotal(q), q.currency), 0);

  const convertedValue = rows
    .filter((q) => q.status === "Converted")
    .reduce((sum, q) => sum + toInr(quotationGrandTotal(q), q.currency), 0);

  return {
    total,
    draft: byStatus("Draft"),
    pendingApproval: byStatus("Pending Approval"),
    sent: byStatus("Sent") + byStatus("Viewed"),
    negotiation: byStatus("Negotiation"),
    accepted: byStatus("Accepted"),
    rejected: byStatus("Rejected"),
    expired: byStatus("Expired"),
    converted: byStatus("Converted"),
    totalValue,
    acceptedValue,
    pendingValue,
    convertedValue,
  };
}

// Rough fixed conversion just to roll multi-currency quotations into one
// organization-currency (INR) summary figure for KPI cards.
const fxToInr: Record<Currency, number> = { INR: 1, USD: 83, EUR: 90, AED: 22.6, GBP: 105 };
function toInr(amount: number, currency: Currency): number {
  return amount * fxToInr[currency];
}

export function acceptanceRate(): number {
  const decided = quotationsData.filter((q) => decidedStatuses.includes(q.status));
  if (decided.length === 0) return 0;
  const accepted = decided.filter(
    (q) => q.status === "Accepted" || q.status === "Converted",
  ).length;
  return round2((accepted / decided.length) * 100);
}

export function quoteToOrderRate(): number {
  const eligible = quotationsData.filter(
    (q) => q.status === "Accepted" || q.status === "Converted",
  );
  if (eligible.length === 0) return 0;
  const converted = eligible.filter((q) => q.status === "Converted").length;
  return round2((converted / eligible.length) * 100);
}

export function executivePerformance() {
  return salesExecutives
    .map((name) => {
      const rows = quotationsData.filter((q) => q.owner === name);
      const sent = rows.filter((q) =>
        ["Sent", "Viewed", "Negotiation", "Accepted", "Rejected", "Converted", "Expired"].includes(
          q.status,
        ),
      ).length;
      const accepted = rows.filter(
        (q) => q.status === "Accepted" || q.status === "Converted",
      ).length;
      const rejected = rows.filter((q) => q.status === "Rejected").length;
      const converted = rows.filter((q) => q.status === "Converted").length;
      const value = rows.reduce((sum, q) => sum + toInr(quotationGrandTotal(q), q.currency), 0);
      const convertedValue = rows
        .filter((q) => q.status === "Converted")
        .reduce((sum, q) => sum + toInr(quotationGrandTotal(q), q.currency), 0);
      const decided = rows.filter((q) => decidedStatuses.includes(q.status)).length;
      return {
        name,
        quotations: rows.length,
        sent,
        accepted,
        rejected,
        converted,
        value,
        convertedValue,
        acceptanceRate: decided > 0 ? round2((accepted / decided) * 100) : 0,
      };
    })
    .filter((row) => row.quotations > 0)
    .sort((a, b) => b.value - a.value);
}

export function productAnalytics() {
  const map = new Map<
    string,
    { name: string; quoted: number; value: number; accepted: number; rejected: number }
  >();
  for (const q of quotationsData) {
    for (const it of q.items) {
      const key = it.name;
      const entry = map.get(key) ?? { name: key, quoted: 0, value: 0, accepted: 0, rejected: 0 };
      const t = computeItemTotals(it);
      entry.quoted += 1;
      entry.value += toInr(t.lineTotal, q.currency);
      if (q.status === "Accepted" || q.status === "Converted") entry.accepted += 1;
      if (q.status === "Rejected") entry.rejected += 1;
      map.set(key, entry);
    }
  }
  return Array.from(map.values()).sort((a, b) => b.value - a.value);
}

export function newQuotationNumber(): string {
  const year = new Date().getFullYear();
  const numbers = quotationsData
    .filter((q) => q.id.startsWith(`QT-${year}-`))
    .map((q) => Number(q.id.split("-")[2]));
  const next = (numbers.length ? Math.max(...numbers) : 0) + 1;
  return `QT-${year}-${String(next).padStart(4, "0")}`;
}
