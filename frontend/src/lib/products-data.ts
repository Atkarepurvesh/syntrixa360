// Syntrixa 360 — Products module data layer
//
// The Product Catalog is organisation-wide and read-only for the Sales
// Executive. It feeds two flows:
//   1. Browse → View → "Add to Quotation" (reuses the existing Quotation
//      wizard from src/lib/quotations-data.ts — this file does NOT duplicate
//      quotation logic, only product/catalog data).
//   2. Browse → "Create Requirement" (captures what the customer actually
//      wants, see src/lib/requirements-data.ts).
//
// Note: src/lib/quotations-data.ts already ships a lightweight
// `productCatalog` (6 items) used purely for quick line-item lookup inside
// the quotation wizard. This file is the richer, executive-facing catalog
// (specs, documents, availability, MOQ, packaging) that the Products page
// renders. IDs are namespaced "PRD-" so the two never collide, and the
// "Add to Quotation" flow below maps a Product straight onto a
// QuotationItem shape so no second quotation system is introduced.

export type ProductCategory =
  | "Honey"
  | "Fruit Powder"
  | "Spices"
  | "Nutraceutical"
  | "Dry Fruits"
  | "Other";

export type ProductAvailability = "Available" | "Limited" | "Out of Stock";

export type PackagingOption = "Bulk" | "Retail" | "Custom";

export type MoqTier = "Low" | "Medium" | "High";

export type ProductDocument = {
  id: string;
  name: string;
  type: "Specification Sheet" | "Product Brochure" | "Certificate" | "Product Document";
  size: string;
};

export type ProductSpecification = {
  grade: string;
  origin: string;
  quality: string;
  size: string;
  specification: string;
  certification?: string;
};

export type Product = {
  id: string;
  name: string;
  sku: string;
  code: string;
  category: ProductCategory;
  subcategory: string;
  description: string;
  unit: string;
  price: number;
  currency: "USD" | "INR";
  tax: number;
  moq: number;
  moqUnit: string;
  moqTier: MoqTier;
  packaging: PackagingOption[];
  availability: ProductAvailability;
  market: string;
  spec: ProductSpecification;
  documents: ProductDocument[];
  images: string[];
  createdAt: string;
};

export const productCategories: ProductCategory[] = [
  "Honey",
  "Fruit Powder",
  "Spices",
  "Nutraceutical",
  "Dry Fruits",
  "Other",
];

export const productAvailabilityOptions: ProductAvailability[] = [
  "Available",
  "Limited",
  "Out of Stock",
];

export const packagingOptions: PackagingOption[] = ["Bulk", "Retail", "Custom"];

export const moqTiers: MoqTier[] = ["Low", "Medium", "High"];

function moqTierFor(qty: number): MoqTier {
  if (qty <= 250) return "Low";
  if (qty <= 1000) return "Medium";
  return "High";
}

export const products: Product[] = [
  {
    id: "PRD-101",
    name: "Indian Honey",
    sku: "HNY-001",
    code: "HNY-001",
    category: "Honey",
    subcategory: "Raw & Natural",
    description: "Unprocessed multi-flora honey sourced from Western Ghats apiaries.",
    unit: "KG",
    price: 4.2,
    currency: "USD",
    tax: 5,
    moq: 500,
    moqUnit: "KG",
    moqTier: moqTierFor(500),
    packaging: ["Bulk", "Custom"],
    availability: "Available",
    market: "UAE, EU, USA",
    spec: {
      grade: "Grade A",
      origin: "Western Ghats, India",
      quality: "Export Quality — NMR Tested",
      size: "20 KG / 250 KG Drum",
      specification: "Moisture < 18% · No added sugar · HMF < 40mg/kg",
      certification: "FSSAI, APEDA, ISO 22000",
    },
    documents: [
      { id: "d1", name: "Indian Honey — Spec Sheet.pdf", type: "Specification Sheet", size: "412 KB" },
      { id: "d2", name: "Honey Export Brochure.pdf", type: "Product Brochure", size: "1.1 MB" },
      { id: "d3", name: "NMR Test Certificate.pdf", type: "Certificate", size: "268 KB" },
    ],
    images: [],
    createdAt: "12 Jan 2026",
  },
  {
    id: "PRD-102",
    name: "Acacia Honey",
    sku: "HNY-002",
    code: "HNY-002",
    category: "Honey",
    subcategory: "Raw & Natural",
    description: "Light, mild-flavoured single-origin acacia honey.",
    unit: "KG",
    price: 5.6,
    currency: "USD",
    tax: 5,
    moq: 250,
    moqUnit: "KG",
    moqTier: moqTierFor(250),
    packaging: ["Bulk", "Retail"],
    availability: "Limited",
    market: "EU",
    spec: {
      grade: "Premium",
      origin: "Himachal Pradesh, India",
      quality: "Export Quality",
      size: "500g Jar / 25 KG Bucket",
      specification: "Moisture < 17% · Slow crystallising",
      certification: "FSSAI, ISO 22000",
    },
    documents: [
      { id: "d1", name: "Acacia Honey — Spec Sheet.pdf", type: "Specification Sheet", size: "388 KB" },
    ],
    images: [],
    createdAt: "18 Jan 2026",
  },
  {
    id: "PRD-103",
    name: "Organic Wildflower Honey",
    sku: "HNY-003",
    code: "HNY-003",
    category: "Honey",
    subcategory: "Organic",
    description: "Certified organic wildflower honey, cold-extracted.",
    unit: "KG",
    price: 6.1,
    currency: "USD",
    tax: 5,
    moq: 300,
    moqUnit: "KG",
    moqTier: moqTierFor(300),
    packaging: ["Bulk", "Retail", "Custom"],
    availability: "Available",
    market: "USA, EU",
    spec: {
      grade: "Organic Grade A",
      origin: "Uttarakhand, India",
      quality: "Cold Extracted, Unheated",
      size: "1 KG Jar / 200 KG Drum",
      specification: "Moisture < 18% · Certified organic",
      certification: "USDA Organic, FSSAI",
    },
    documents: [
      { id: "d1", name: "Wildflower Honey Spec.pdf", type: "Specification Sheet", size: "402 KB" },
      { id: "d2", name: "USDA Organic Certificate.pdf", type: "Certificate", size: "301 KB" },
    ],
    images: [],
    createdAt: "22 Jan 2026",
  },
  {
    id: "PRD-201",
    name: "Mango Fruit Powder",
    sku: "FRP-001",
    code: "FRP-001",
    category: "Fruit Powder",
    subcategory: "Spray Dried",
    description: "Spray-dried Alphonso mango powder for beverages and bakery use.",
    unit: "KG",
    price: 8.4,
    currency: "USD",
    tax: 5,
    moq: 200,
    moqUnit: "KG",
    moqTier: moqTierFor(200),
    packaging: ["Bulk", "Custom"],
    availability: "Available",
    market: "UAE, Singapore",
    spec: {
      grade: "Food Grade",
      origin: "Ratnagiri, Maharashtra",
      quality: "Spray Dried, 100% Natural",
      size: "20 KG Bag (foil-lined)",
      specification: "Moisture < 5% · No preservatives · Mesh 80",
      certification: "FSSAI, HACCP",
    },
    documents: [
      { id: "d1", name: "Mango Powder Spec Sheet.pdf", type: "Specification Sheet", size: "356 KB" },
    ],
    images: [],
    createdAt: "02 Feb 2026",
  },
  {
    id: "PRD-202",
    name: "Amla (Indian Gooseberry) Powder",
    sku: "FRP-002",
    code: "FRP-002",
    category: "Fruit Powder",
    subcategory: "Freeze Dried",
    description: "Freeze-dried amla powder, rich in natural Vitamin C.",
    unit: "KG",
    price: 7.2,
    currency: "USD",
    tax: 5,
    moq: 150,
    moqUnit: "KG",
    moqTier: moqTierFor(150),
    packaging: ["Bulk", "Retail"],
    availability: "Available",
    market: "USA, EU, UAE",
    spec: {
      grade: "Food Grade",
      origin: "Pratapgarh, Uttar Pradesh",
      quality: "Freeze Dried",
      size: "25 KG Bag",
      specification: "Moisture < 6% · Vitamin C > 400mg/100g",
      certification: "FSSAI, ISO 22000",
    },
    documents: [
      { id: "d1", name: "Amla Powder Spec Sheet.pdf", type: "Specification Sheet", size: "298 KB" },
      { id: "d2", name: "Lab Assay Report.pdf", type: "Certificate", size: "220 KB" },
    ],
    images: [],
    createdAt: "05 Feb 2026",
  },
  {
    id: "PRD-203",
    name: "Beetroot Powder",
    sku: "FRP-003",
    code: "FRP-003",
    category: "Fruit Powder",
    subcategory: "Spray Dried",
    description: "Natural red beetroot powder for colour and nutrition applications.",
    unit: "KG",
    price: 6.8,
    currency: "USD",
    tax: 5,
    moq: 100,
    moqUnit: "KG",
    moqTier: moqTierFor(100),
    packaging: ["Bulk", "Retail", "Custom"],
    availability: "Limited",
    market: "EU",
    spec: {
      grade: "Food Grade",
      origin: "Nashik, Maharashtra",
      quality: "Spray Dried",
      size: "20 KG Bag",
      specification: "Moisture < 6% · Natural colour, no additives",
      certification: "FSSAI",
    },
    documents: [],
    images: [],
    createdAt: "10 Feb 2026",
  },
  {
    id: "PRD-301",
    name: "Whole Black Pepper",
    sku: "SPC-001",
    code: "SPC-001",
    category: "Spices",
    subcategory: "Whole Spices",
    description: "Malabar black pepper, hand-picked and sun-dried.",
    unit: "KG",
    price: 9.5,
    currency: "USD",
    tax: 5,
    moq: 1000,
    moqUnit: "KG",
    moqTier: moqTierFor(1000),
    packaging: ["Bulk"],
    availability: "Available",
    market: "EU, USA, Middle East",
    spec: {
      grade: "MG1",
      origin: "Wayanad, Kerala",
      quality: "Export Grade, Bold",
      size: "50 KG PP Bag",
      specification: "Moisture < 12% · Bulk density 500-560 g/L",
      certification: "FSSAI, Spices Board of India",
    },
    documents: [
      { id: "d1", name: "Black Pepper Spec Sheet.pdf", type: "Specification Sheet", size: "310 KB" },
      { id: "d2", name: "Phytosanitary Certificate.pdf", type: "Certificate", size: "245 KB" },
    ],
    images: [],
    createdAt: "14 Feb 2026",
  },
  {
    id: "SPC-002",
    name: "Turmeric Finger (Whole)",
    sku: "SPC-002",
    code: "SPC-002",
    category: "Spices",
    subcategory: "Whole Spices",
    description: "High-curcumin turmeric fingers, sun-dried and polished.",
    unit: "KG",
    price: 3.1,
    currency: "USD",
    tax: 5,
    moq: 2000,
    moqUnit: "KG",
    moqTier: moqTierFor(2000),
    packaging: ["Bulk", "Custom"],
    availability: "Available",
    market: "UAE, Bangladesh",
    spec: {
      grade: "Grade A",
      origin: "Erode, Tamil Nadu",
      quality: "Curcumin 3.5%+",
      size: "50 KG Jute Bag",
      specification: "Moisture < 10% · Curcumin content 3.5%–5%",
      certification: "FSSAI, Spices Board of India",
    },
    documents: [
      { id: "d1", name: "Turmeric Spec Sheet.pdf", type: "Specification Sheet", size: "289 KB" },
    ],
    images: [],
    createdAt: "16 Feb 2026",
  },
  {
    id: "SPC-003",
    name: "Green Cardamom (8mm+)",
    sku: "SPC-003",
    code: "SPC-003",
    category: "Spices",
    subcategory: "Whole Spices",
    description: "Bold green cardamom pods, premium export grade.",
    unit: "KG",
    price: 28.0,
    currency: "USD",
    tax: 5,
    moq: 100,
    moqUnit: "KG",
    moqTier: moqTierFor(100),
    packaging: ["Bulk", "Retail"],
    availability: "Out of Stock",
    market: "Middle East, EU",
    spec: {
      grade: "8mm Bold",
      origin: "Idukki, Kerala",
      quality: "Hand Picked, Machine Cleaned",
      size: "5 KG / 25 KG Box",
      specification: "Moisture < 10% · Volatile oil > 4%",
      certification: "Spices Board of India",
    },
    documents: [],
    images: [],
    createdAt: "20 Feb 2026",
  },
  {
    id: "SPC-004",
    name: "Coriander Seeds",
    sku: "SPC-004",
    code: "SPC-004",
    category: "Spices",
    subcategory: "Whole Spices",
    description: "Eagle-grade coriander seeds, machine cleaned.",
    unit: "KG",
    price: 1.8,
    currency: "USD",
    tax: 5,
    moq: 3000,
    moqUnit: "KG",
    moqTier: moqTierFor(3000),
    packaging: ["Bulk"],
    availability: "Available",
    market: "UAE, Europe",
    spec: {
      grade: "Eagle No. 1",
      origin: "Gujarat, India",
      quality: "Machine Cleaned, Sortex",
      size: "50 KG Jute Bag",
      specification: "Purity 99% · Moisture < 10%",
      certification: "FSSAI, Spices Board of India",
    },
    documents: [],
    images: [],
    createdAt: "22 Feb 2026",
  },
  {
    id: "NUT-401",
    name: "Ashwagandha Root Extract",
    sku: "NUT-001",
    code: "NUT-001",
    category: "Nutraceutical",
    subcategory: "Herbal Extracts",
    description: "Standardised ashwagandha root extract, 5% withanolides.",
    unit: "KG",
    price: 42.0,
    currency: "USD",
    tax: 12,
    moq: 25,
    moqUnit: "KG",
    moqTier: moqTierFor(25),
    packaging: ["Bulk", "Custom"],
    availability: "Available",
    market: "USA, EU",
    spec: {
      grade: "Pharma Grade",
      origin: "Madhya Pradesh, India",
      quality: "Standardised Extract",
      size: "1 KG Foil Pouch / 25 KG Drum",
      specification: "Withanolides 5% (HPLC) · Heavy metal tested",
      certification: "FSSAI, GMP, ISO 9001",
    },
    documents: [
      { id: "d1", name: "Ashwagandha COA.pdf", type: "Certificate", size: "215 KB" },
      { id: "d2", name: "Ashwagandha Spec Sheet.pdf", type: "Specification Sheet", size: "334 KB" },
    ],
    images: [],
    createdAt: "01 Mar 2026",
  },
  {
    id: "NUT-402",
    name: "Curcumin 95% Extract",
    sku: "NUT-002",
    code: "NUT-002",
    category: "Nutraceutical",
    subcategory: "Herbal Extracts",
    description: "High-purity curcumin extract for supplement manufacturing.",
    unit: "KG",
    price: 68.0,
    currency: "USD",
    tax: 12,
    moq: 10,
    moqUnit: "KG",
    moqTier: moqTierFor(10),
    packaging: ["Custom"],
    availability: "Limited",
    market: "USA, EU, Japan",
    spec: {
      grade: "Pharma Grade",
      origin: "Erode, Tamil Nadu",
      quality: "95% Curcuminoids (HPLC)",
      size: "1 KG / 5 KG Foil Pouch",
      specification: "Curcuminoids ≥ 95% · Residual solvent tested",
      certification: "GMP, ISO 9001, Kosher",
    },
    documents: [
      { id: "d1", name: "Curcumin 95% COA.pdf", type: "Certificate", size: "198 KB" },
    ],
    images: [],
    createdAt: "04 Mar 2026",
  },
  {
    id: "NUT-403",
    name: "Moringa Leaf Powder (Capsule Grade)",
    sku: "NUT-003",
    code: "NUT-003",
    category: "Nutraceutical",
    subcategory: "Superfoods",
    description: "Shade-dried moringa leaf powder for capsule/tablet formulation.",
    unit: "KG",
    price: 11.5,
    currency: "USD",
    tax: 12,
    moq: 50,
    moqUnit: "KG",
    moqTier: moqTierFor(50),
    packaging: ["Bulk", "Retail"],
    availability: "Available",
    market: "USA, UAE",
    spec: {
      grade: "Food/Pharma Grade",
      origin: "Tamil Nadu, India",
      quality: "Shade Dried, Micronised",
      size: "25 KG Bag",
      specification: "Moisture < 7% · Mesh 100",
      certification: "FSSAI, GMP",
    },
    documents: [],
    images: [],
    createdAt: "06 Mar 2026",
  },
  {
    id: "DRF-501",
    name: "California Almonds (Premium)",
    sku: "DRF-001",
    code: "DRF-001",
    category: "Dry Fruits",
    subcategory: "Nuts",
    description: "Premium graded California almonds, hand-sorted.",
    unit: "KG",
    price: 7.9,
    currency: "USD",
    tax: 5,
    moq: 500,
    moqUnit: "KG",
    moqTier: moqTierFor(500),
    packaging: ["Bulk", "Retail"],
    availability: "Available",
    market: "UAE, India",
    spec: {
      grade: "Premium (23/25)",
      origin: "California, USA (repacked India)",
      quality: "Hand Sorted, Unblemished",
      size: "25 KG Carton",
      specification: "Moisture < 6% · Foreign matter nil",
      certification: "FSSAI",
    },
    documents: [
      { id: "d1", name: "Almonds Spec Sheet.pdf", type: "Specification Sheet", size: "276 KB" },
    ],
    images: [],
    createdAt: "09 Mar 2026",
  },
  {
    id: "DRF-502",
    name: "Cashew Nuts W240",
    sku: "DRF-002",
    code: "DRF-002",
    category: "Dry Fruits",
    subcategory: "Nuts",
    description: "W240 grade whole cashew kernels, vacuum packed.",
    unit: "KG",
    price: 9.2,
    currency: "USD",
    tax: 5,
    moq: 300,
    moqUnit: "KG",
    moqTier: moqTierFor(300),
    packaging: ["Bulk", "Custom"],
    availability: "Available",
    market: "USA, EU, Middle East",
    spec: {
      grade: "W240",
      origin: "Kollam, Kerala",
      quality: "Whole, Vacuum Packed",
      size: "10 KG Vacuum Tin",
      specification: "Moisture < 5% · Broken < 2%",
      certification: "FSSAI, HACCP",
    },
    documents: [
      { id: "d1", name: "Cashew W240 Spec Sheet.pdf", type: "Specification Sheet", size: "302 KB" },
    ],
    images: [],
    createdAt: "11 Mar 2026",
  },
  {
    id: "DRF-503",
    name: "Medjool Dates",
    sku: "DRF-003",
    code: "DRF-003",
    category: "Dry Fruits",
    subcategory: "Dates",
    description: "Jumbo Medjool dates, soft and naturally sweet.",
    unit: "KG",
    price: 6.4,
    currency: "USD",
    tax: 5,
    moq: 200,
    moqUnit: "KG",
    moqTier: moqTierFor(200),
    packaging: ["Retail", "Custom"],
    availability: "Limited",
    market: "EU, UAE",
    spec: {
      grade: "Jumbo",
      origin: "Al Ain (repacked India)",
      quality: "Soft, Naturally Sweet",
      size: "5 KG Box",
      specification: "Moisture 20-24% · No added sugar",
      certification: "FSSAI",
    },
    documents: [],
    images: [],
    createdAt: "13 Mar 2026",
  },
  {
    id: "DRF-504",
    name: "Golden Raisins",
    sku: "DRF-004",
    code: "DRF-004",
    category: "Dry Fruits",
    subcategory: "Raisins",
    description: "Seedless golden raisins, sun-dried and sulphur treated.",
    unit: "KG",
    price: 3.6,
    currency: "USD",
    tax: 5,
    moq: 500,
    moqUnit: "KG",
    moqTier: moqTierFor(500),
    packaging: ["Bulk", "Retail"],
    availability: "Available",
    market: "India, UAE",
    spec: {
      grade: "Grade A",
      origin: "Sangli, Maharashtra",
      quality: "Seedless, Sun Dried",
      size: "10 KG Carton",
      specification: "Moisture < 18% · Sulphur within FSSAI limits",
      certification: "FSSAI",
    },
    documents: [],
    images: [],
    createdAt: "15 Mar 2026",
  },
  {
    id: "OTH-601",
    name: "Cold-Pressed Coconut Oil",
    sku: "OTH-001",
    code: "OTH-001",
    category: "Other",
    subcategory: "Edible Oils",
    description: "Virgin, cold-pressed coconut oil in export-ready packs.",
    unit: "LITRE",
    price: 4.9,
    currency: "USD",
    tax: 5,
    moq: 1000,
    moqUnit: "LITRE",
    moqTier: moqTierFor(1000),
    packaging: ["Bulk", "Retail", "Custom"],
    availability: "Available",
    market: "UAE, USA",
    spec: {
      grade: "Virgin",
      origin: "Kerala, India",
      quality: "Cold Pressed, Unrefined",
      size: "1L Bottle / 200L Drum",
      specification: "Free fatty acid < 0.2% · No trans fat",
      certification: "FSSAI, USDA Organic (on request)",
    },
    documents: [
      { id: "d1", name: "Coconut Oil Spec Sheet.pdf", type: "Specification Sheet", size: "290 KB" },
    ],
    images: [],
    createdAt: "18 Mar 2026",
  },
  {
    id: "OTH-602",
    name: "Private Label Herbal Tea Blend",
    sku: "OTH-002",
    code: "OTH-002",
    category: "Other",
    subcategory: "Beverages",
    description: "Custom herbal tea blends available under private label.",
    unit: "KG",
    price: 14.0,
    currency: "USD",
    tax: 12,
    moq: 100,
    moqUnit: "KG",
    moqTier: moqTierFor(100),
    packaging: ["Custom"],
    availability: "Available",
    market: "EU, UAE",
    spec: {
      grade: "Food Grade",
      origin: "Blended in India",
      quality: "Custom Formulation",
      size: "Custom pouch/box per brief",
      specification: "Formulated to customer brief · Private label ready",
      certification: "FSSAI",
    },
    documents: [],
    images: [],
    createdAt: "20 Mar 2026",
  },
];

// ---------------------------------------------------------------------------
// KPIs, search & filter helpers
// ---------------------------------------------------------------------------

export function productsKpis() {
  return {
    total: products.length,
    available: products.filter((p) => p.availability === "Available").length,
    categories: new Set(products.map((p) => p.category)).size,
  };
}

export type ProductFilterState = {
  category: string;
  availability: string;
  packaging: string;
  moqTier: string;
  priceMin: string;
  priceMax: string;
};

export function matchesProductSearch(p: Product, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    p.name.toLowerCase().includes(q) ||
    p.sku.toLowerCase().includes(q) ||
    p.code.toLowerCase().includes(q) ||
    p.category.toLowerCase().includes(q) ||
    p.subcategory.toLowerCase().includes(q) ||
    p.description.toLowerCase().includes(q)
  );
}

export function formatProductPrice(p: Product): string {
  const symbol = p.currency === "USD" ? "$" : "₹";
  return `${symbol}${p.price.toFixed(2)} / ${p.unit}`;
}

export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}
