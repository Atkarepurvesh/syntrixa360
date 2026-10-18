// Syntrixa 360 — Customer Requirements module data layer
//
// A Requirement captures what a customer actually wants, and is the bridge
// between a Customer and a Product on the way to an Opportunity, a
// Quotation, and eventually an Order:
//
//   Customer -> Requirement -> Product -> Opportunity -> Quotation -> Order
//
// This file intentionally reuses identifiers from the existing modules
// instead of inventing parallel data:
//   - customerId/customerSlug come from src/lib/customers-data.ts (customerRows)
//   - productId/sku come from src/lib/products-data.ts (products)
//   - opportunityId comes from src/lib/pipeline-data.ts (pipelineDeals)
//   - quotationId comes from src/lib/quotations-data.ts (quotationsData)
// so every "View Customer 360" / "View Opportunity" / linked quotation
// reference in the UI resolves to a real existing record.

export type RequirementStatus =
  | "New"
  | "Qualified"
  | "Requirement Confirmed"
  | "Quotation Ready"
  | "Quoted"
  | "Converted"
  | "Closed";

export type RequirementPriority = "Low" | "Medium" | "High" | "Urgent";

export type RequirementTimelineEvent = {
  id: string;
  date: string;
  title: string;
};

export type RequirementActivity = {
  id: string;
  type: "Call" | "Email" | "WhatsApp" | "Meeting" | "Note" | "Update";
  description: string;
  user: string;
  date: string;
  time: string;
};

export type RequirementAttachment = {
  id: string;
  name: string;
  type: "Specification Sheet" | "Customer Document" | "Reference Image" | "Technical Requirement";
  size: string;
};

export type Requirement = {
  id: string;
  requirementNumber: string;
  customerId: string; // customerRows.id
  customerSlug: string; // customerRows.slug — used for /app/customers/$id
  customerName: string;
  productId: string; // products-data.ts id
  productName: string;
  sku: string;
  quantity: number;
  unit: string;
  packaging: string;
  destination: { country: string; city: string; port?: string };
  requiredDate: string; // display date
  requiredDateISO: string; // yyyy-mm-dd for overdue/due-soon math
  specification: string;
  priority: RequirementPriority;
  status: RequirementStatus;
  salespersonId: string;
  salespersonName: string;
  opportunityId?: string; // pipelineDeals.id
  opportunityName?: string;
  opportunityValue?: string;
  quotationId?: string; // quotationsData.id
  notes?: string;
  attachments: RequirementAttachment[];
  timeline: RequirementTimelineEvent[];
  activities: RequirementActivity[];
  createdAt: string;
  updatedAt: string;
};

export const requirementStatuses: RequirementStatus[] = [
  "New",
  "Qualified",
  "Requirement Confirmed",
  "Quotation Ready",
  "Quoted",
  "Converted",
  "Closed",
];

export const requirementPriorities: RequirementPriority[] = ["Low", "Medium", "High", "Urgent"];

export const packagingChoices = ["25 KG Bag", "50 KG Bag", "Drum", "Carton", "Jar", "Custom"];

export const requirements: Requirement[] = [
  {
    id: "REQ-1024",
    requirementNumber: "REQ-1024",
    customerId: "CUST-1002",
    customerSlug: "global-exports-ltd",
    customerName: "Global Exports Ltd.",
    productId: "PRD-101",
    productName: "Indian Honey",
    sku: "HNY-001",
    quantity: 5000,
    unit: "KG",
    packaging: "25 KG Bag",
    destination: { country: "UAE", city: "Dubai", port: "Jebel Ali" },
    requiredDate: "20 Sep 2026",
    requiredDateISO: "2026-09-20",
    specification: "Premium Grade\nMoisture < 18%\nExport Quality\nRequired certification attached",
    priority: "High",
    status: "Quotation Ready",
    salespersonId: "SE-01",
    salespersonName: "Neha Singh",
    opportunityId: "D-2198",
    opportunityName: "Global Exports — Honey Export Deal",
    opportunityValue: "₹8.5L",
    quotationId: "QT-2026-0011",
    notes: "Customer wants private-label jars for retail sub-order.",
    attachments: [
      { id: "a1", name: "Customer PO Draft.pdf", type: "Customer Document", size: "180 KB" },
    ],
    timeline: [
      { id: "t1", date: "05 Sep", title: "Requirement Created" },
      { id: "t2", date: "05 Sep", title: "Customer Requirement Confirmed" },
      { id: "t3", date: "06 Sep", title: "Product Selected" },
      { id: "t4", date: "07 Sep", title: "Quotation Preparation Started" },
    ],
    activities: [
      {
        id: "act1",
        type: "Call",
        description: "Discussed quantity and packaging preferences.",
        user: "Neha Singh",
        date: "05 Sep 2026",
        time: "11:20 AM",
      },
      {
        id: "act2",
        type: "Email",
        description: "Sent product specification sheet for Indian Honey.",
        user: "Neha Singh",
        date: "06 Sep 2026",
        time: "03:40 PM",
      },
    ],
    createdAt: "05 Sep 2026",
    updatedAt: "07 Sep 2026",
  },
  {
    id: "REQ-1023",
    requirementNumber: "REQ-1023",
    customerId: "CUST-1004",
    customerSlug: "kisan-agro-pvt-ltd",
    customerName: "Kisan Agro Pvt. Ltd.",
    productId: "NUT-402",
    productName: "Curcumin 95% Extract",
    sku: "NUT-002",
    quantity: 40,
    unit: "KG",
    packaging: "Custom",
    destination: { country: "USA", city: "New Jersey" },
    requiredDate: "15 Sep 2026",
    requiredDateISO: "2026-09-15",
    specification:
      "Curcuminoids ≥ 95% (HPLC)\nResidual solvent within USP limits\nKosher certification required",
    priority: "Urgent",
    status: "Quoted",
    salespersonId: "SE-02",
    salespersonName: "Pooja Patel",
    opportunityId: "D-2187",
    opportunityName: "Kisan Agro — Desiccated Coconut",
    opportunityValue: "₹2.4L",
    quotationId: "QT-2026-0008",
    attachments: [],
    timeline: [
      { id: "t1", date: "01 Sep", title: "Requirement Created" },
      { id: "t2", date: "02 Sep", title: "Product Selected" },
      { id: "t3", date: "03 Sep", title: "Quotation Created" },
      { id: "t4", date: "04 Sep", title: "Quotation Sent" },
    ],
    activities: [
      {
        id: "act1",
        type: "WhatsApp",
        description: "Shared COA sample for Curcumin 95% batch.",
        user: "Pooja Patel",
        date: "02 Sep 2026",
        time: "10:05 AM",
      },
    ],
    createdAt: "01 Sep 2026",
    updatedAt: "04 Sep 2026",
  },
  {
    id: "REQ-1022",
    requirementNumber: "REQ-1022",
    customerId: "CUST-1003",
    customerSlug: "maharashtra-distributors",
    customerName: "Maharashtra Distributors",
    productId: "SPC-002",
    productName: "Turmeric Finger (Whole)",
    sku: "SPC-002",
    quantity: 8000,
    unit: "KG",
    packaging: "50 KG Bag",
    destination: { country: "Bangladesh", city: "Dhaka" },
    requiredDate: "28 Sep 2026",
    requiredDateISO: "2026-09-28",
    specification: "Curcumin content 3.5%–5%\nMoisture below 10%\nJute bag packaging",
    priority: "Medium",
    status: "Requirement Confirmed",
    salespersonId: "SE-03",
    salespersonName: "Arjun Mehta",
    opportunityId: "D-2190",
    opportunityName: "Maharashtra Distributors — AMC",
    opportunityValue: "₹9.1L",
    attachments: [
      { id: "a1", name: "Turmeric Reference Photo.jpg", type: "Reference Image", size: "1.4 MB" },
    ],
    timeline: [
      { id: "t1", date: "28 Aug", title: "Requirement Created" },
      { id: "t2", date: "30 Aug", title: "Customer Requirement Confirmed" },
    ],
    activities: [],
    createdAt: "28 Aug 2026",
    updatedAt: "30 Aug 2026",
  },
  {
    id: "REQ-1021",
    requirementNumber: "REQ-1021",
    customerId: "CUST-1001",
    customerSlug: "shreeji-traders",
    customerName: "Shreeji Traders",
    productId: "PRD-103",
    productName: "Organic Wildflower Honey",
    sku: "HNY-003",
    quantity: 1200,
    unit: "KG",
    packaging: "Drum",
    destination: { country: "India", city: "Ahmedabad" },
    requiredDate: "10 Sep 2026",
    requiredDateISO: "2026-09-10",
    specification: "Certified organic\n1 KG retail jars for domestic distribution",
    priority: "Medium",
    status: "Converted",
    salespersonId: "SE-04",
    salespersonName: "Rahul Verma",
    opportunityId: "D-2144",
    opportunityName: "Shreeji Traders — Pump Enquiry",
    opportunityValue: "₹4.2L",
    quotationId: "QT-2026-0006",
    attachments: [],
    timeline: [
      { id: "t1", date: "18 Aug", title: "Requirement Created" },
      { id: "t2", date: "19 Aug", title: "Product Selected" },
      { id: "t3", date: "21 Aug", title: "Quotation Created" },
      { id: "t4", date: "25 Aug", title: "Quotation Accepted" },
      { id: "t5", date: "26 Aug", title: "Converted to Order" },
    ],
    activities: [],
    createdAt: "18 Aug 2026",
    updatedAt: "26 Aug 2026",
  },
  {
    id: "REQ-1020",
    requirementNumber: "REQ-1020",
    customerId: "CUST-1006",
    customerSlug: "vardhman-brothers",
    customerName: "Vardhman Brothers",
    productId: "DRF-502",
    productName: "Cashew Nuts W240",
    sku: "DRF-002",
    quantity: 600,
    unit: "KG",
    packaging: "Carton",
    destination: { country: "India", city: "Indore" },
    requiredDate: "12 Sep 2026",
    requiredDateISO: "2026-09-12",
    specification: "Whole kernels, vacuum packed\nBroken percentage under 2%",
    priority: "Low",
    status: "New",
    salespersonId: "SE-05",
    salespersonName: "Arjun Mehta",
    attachments: [],
    timeline: [{ id: "t1", date: "03 Sep", title: "Requirement Created" }],
    activities: [],
    createdAt: "03 Sep 2026",
    updatedAt: "03 Sep 2026",
  },
  {
    id: "REQ-1019",
    requirementNumber: "REQ-1019",
    customerId: "CUST-1007",
    customerSlug: "sahyadri-agencies",
    customerName: "Sahyadri Agencies",
    productId: "PRD-201",
    productName: "Mango Fruit Powder",
    sku: "FRP-001",
    quantity: 350,
    unit: "KG",
    packaging: "25 KG Bag",
    destination: { country: "Singapore", city: "Singapore" },
    requiredDate: "18 Sep 2026",
    requiredDateISO: "2026-09-18",
    specification: "Spray dried, food grade\nFoil-lined bags for humidity protection",
    priority: "Medium",
    status: "Qualified",
    salespersonId: "SE-02",
    salespersonName: "Pooja Patel",
    attachments: [],
    timeline: [
      { id: "t1", date: "01 Sep", title: "Requirement Created" },
      { id: "t2", date: "02 Sep", title: "Requirement Qualified" },
    ],
    activities: [
      {
        id: "act1",
        type: "Call",
        description: "Confirmed target moisture and packaging format.",
        user: "Pooja Patel",
        date: "02 Sep 2026",
        time: "09:15 AM",
      },
    ],
    createdAt: "01 Sep 2026",
    updatedAt: "02 Sep 2026",
  },
  {
    id: "REQ-1018",
    requirementNumber: "REQ-1018",
    customerId: "CUST-1008",
    customerSlug: "pioneer-imports",
    customerName: "Pioneer Imports",
    productId: "SPC-003",
    productName: "Green Cardamom (8mm+)",
    sku: "SPC-003",
    quantity: 150,
    unit: "KG",
    packaging: "Custom",
    destination: { country: "UAE", city: "Sharjah" },
    requiredDate: "30 Aug 2026",
    requiredDateISO: "2026-08-30",
    specification: "8mm bold, hand picked\nVolatile oil above 4%",
    priority: "High",
    status: "Closed",
    salespersonId: "SE-01",
    salespersonName: "Neha Singh",
    attachments: [],
    timeline: [
      { id: "t1", date: "15 Aug", title: "Requirement Created" },
      { id: "t2", date: "20 Aug", title: "Product Out of Stock" },
      { id: "t3", date: "22 Aug", title: "Requirement Closed" },
    ],
    activities: [
      {
        id: "act1",
        type: "Note",
        description:
          "Cardamom went out of stock before quotation could be prepared; closed and revisit next harvest.",
        user: "Neha Singh",
        date: "22 Aug 2026",
        time: "05:30 PM",
      },
    ],
    createdAt: "15 Aug 2026",
    updatedAt: "22 Aug 2026",
  },
  {
    id: "REQ-1017",
    requirementNumber: "REQ-1017",
    customerId: "CUST-1010",
    customerSlug: "sai-traders",
    customerName: "Sai Traders",
    productId: "NUT-403",
    productName: "Moringa Leaf Powder (Capsule Grade)",
    sku: "NUT-003",
    quantity: 80,
    unit: "KG",
    packaging: "25 KG Bag",
    destination: { country: "UAE", city: "Dubai" },
    requiredDate: "25 Sep 2026",
    requiredDateISO: "2026-09-25",
    specification: "Capsule grade, mesh 100\nShade dried only",
    priority: "Medium",
    status: "Requirement Confirmed",
    salespersonId: "SE-04",
    salespersonName: "Rahul Verma",
    attachments: [],
    timeline: [
      { id: "t1", date: "29 Aug", title: "Requirement Created" },
      { id: "t2", date: "31 Aug", title: "Customer Requirement Confirmed" },
    ],
    activities: [],
    createdAt: "29 Aug 2026",
    updatedAt: "31 Aug 2026",
  },
  {
    id: "REQ-1016",
    requirementNumber: "REQ-1016",
    customerId: "CUST-1002",
    customerSlug: "global-exports-ltd",
    customerName: "Global Exports Ltd.",
    productId: "DRF-503",
    productName: "Medjool Dates",
    sku: "DRF-003",
    quantity: 900,
    unit: "KG",
    packaging: "Carton",
    destination: { country: "Germany", city: "Hamburg" },
    requiredDate: "08 Sep 2026",
    requiredDateISO: "2026-09-08",
    specification: "Jumbo size, soft texture\nNo added sugar",
    priority: "Low",
    status: "Qualified",
    salespersonId: "SE-01",
    salespersonName: "Neha Singh",
    attachments: [],
    timeline: [
      { id: "t1", date: "25 Aug", title: "Requirement Created" },
      { id: "t2", date: "27 Aug", title: "Requirement Qualified" },
    ],
    activities: [],
    createdAt: "25 Aug 2026",
    updatedAt: "27 Aug 2026",
  },
  {
    id: "REQ-1015",
    requirementNumber: "REQ-1015",
    customerId: "CUST-1004",
    customerSlug: "kisan-agro-pvt-ltd",
    customerName: "Kisan Agro Pvt. Ltd.",
    productId: "PRD-202",
    productName: "Amla (Indian Gooseberry) Powder",
    sku: "FRP-002",
    quantity: 220,
    unit: "KG",
    packaging: "25 KG Bag",
    destination: { country: "USA", city: "Chicago" },
    requiredDate: "02 Sep 2026",
    requiredDateISO: "2026-09-02",
    specification: "Freeze dried, Vitamin C > 400mg/100g",
    priority: "High",
    status: "New",
    salespersonId: "SE-02",
    salespersonName: "Pooja Patel",
    attachments: [],
    timeline: [{ id: "t1", date: "30 Aug", title: "Requirement Created" }],
    activities: [],
    createdAt: "30 Aug 2026",
    updatedAt: "30 Aug 2026",
  },
  {
    id: "REQ-1014",
    requirementNumber: "REQ-1014",
    customerId: "CUST-1006",
    customerSlug: "vardhman-brothers",
    customerName: "Vardhman Brothers",
    productId: "OTH-601",
    productName: "Cold-Pressed Coconut Oil",
    sku: "OTH-001",
    quantity: 2000,
    unit: "LITRE",
    packaging: "Drum",
    destination: { country: "India", city: "Indore" },
    requiredDate: "05 Sep 2026",
    requiredDateISO: "2026-09-05",
    specification: "Virgin, cold pressed\nFree fatty acid below 0.2%",
    priority: "Medium",
    status: "Quotation Ready",
    salespersonId: "SE-05",
    salespersonName: "Arjun Mehta",
    attachments: [],
    timeline: [
      { id: "t1", date: "26 Aug", title: "Requirement Created" },
      { id: "t2", date: "28 Aug", title: "Product Selected" },
      { id: "t3", date: "29 Aug", title: "Quotation Preparation Started" },
    ],
    activities: [],
    createdAt: "26 Aug 2026",
    updatedAt: "29 Aug 2026",
  },
  {
    id: "REQ-1013",
    requirementNumber: "REQ-1013",
    customerId: "CUST-1008",
    customerSlug: "pioneer-imports",
    customerName: "Pioneer Imports",
    productId: "PRD-102",
    productName: "Acacia Honey",
    sku: "HNY-002",
    quantity: 300,
    unit: "KG",
    packaging: "Jar",
    destination: { country: "France", city: "Paris" },
    requiredDate: "14 Sep 2026",
    requiredDateISO: "2026-09-14",
    specification: "500g retail jars, private label artwork to follow",
    priority: "Urgent",
    status: "Quoted",
    salespersonId: "SE-01",
    salespersonName: "Neha Singh",
    quotationId: "QT-2026-0011",
    attachments: [
      {
        id: "a1",
        name: "Private Label Artwork Brief.pdf",
        type: "Technical Requirement",
        size: "612 KB",
      },
    ],
    timeline: [
      { id: "t1", date: "20 Aug", title: "Requirement Created" },
      { id: "t2", date: "22 Aug", title: "Quotation Created" },
      { id: "t3", date: "23 Aug", title: "Quotation Sent" },
    ],
    activities: [],
    createdAt: "20 Aug 2026",
    updatedAt: "23 Aug 2026",
  },
  {
    id: "REQ-1012",
    requirementNumber: "REQ-1012",
    customerId: "CUST-1001",
    customerSlug: "shreeji-traders",
    customerName: "Shreeji Traders",
    productId: "SPC-004",
    productName: "Coriander Seeds",
    sku: "SPC-004",
    quantity: 6000,
    unit: "KG",
    packaging: "50 KG Bag",
    destination: { country: "Netherlands", city: "Rotterdam" },
    requiredDate: "22 Sep 2026",
    requiredDateISO: "2026-09-22",
    specification: "Sortex cleaned, purity 99%",
    priority: "Medium",
    status: "New",
    salespersonId: "SE-04",
    salespersonName: "Rahul Verma",
    attachments: [],
    timeline: [{ id: "t1", date: "04 Sep", title: "Requirement Created" }],
    activities: [],
    createdAt: "04 Sep 2026",
    updatedAt: "04 Sep 2026",
  },
];

// ---------------------------------------------------------------------------
// KPIs, date helpers & search
// ---------------------------------------------------------------------------

export function requirementsKpis(rows: Requirement[] = requirements) {
  return {
    total: rows.length,
    new: rows.filter((r) => r.status === "New").length,
    inProgress: rows.filter((r) => ["Qualified", "Requirement Confirmed"].includes(r.status))
      .length,
    quotationReady: rows.filter((r) => r.status === "Quotation Ready").length,
    converted: rows.filter((r) => r.status === "Converted").length,
  };
}

export type DueState = "overdue" | "due-soon" | "upcoming";

export function requirementDueState(
  requiredDateISO: string,
  today = new Date("2026-09-06"),
): DueState {
  const due = new Date(requiredDateISO);
  const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "overdue";
  if (diffDays <= 5) return "due-soon";
  return "upcoming";
}

export function matchesRequirementSearch(r: Requirement, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    r.id.toLowerCase().includes(q) ||
    r.customerName.toLowerCase().includes(q) ||
    r.productName.toLowerCase().includes(q) ||
    r.destination.city.toLowerCase().includes(q) ||
    r.destination.country.toLowerCase().includes(q) ||
    r.specification.toLowerCase().includes(q)
  );
}

export function getRequirementById(id: string): Requirement | undefined {
  return requirements.find((r) => r.id === id);
}

let reqSeq = requirements.length;
export function newRequirementNumber(): string {
  reqSeq += 1;
  return `REQ-${1024 + reqSeq - requirements.length}`;
}
