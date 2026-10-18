// Shared DEV fixtures for the Audit Logs and AI & Automation Activity modules.
//
// There is no backend in this project yet. These pools let the adapters in
// `audit-logs-data.ts` and `ai-activity-data.ts` return realistic,
// tenant-separated records. Nothing here is imported by UI components — only
// by the adapters, which are the single swap point for the real API.

export type OrgPool = {
  customers: string[];
  leads: string[];
  products: string[];
  users: { id: string; name: string; email: string; role: string }[];
};

export const ORG_POOLS: Record<string, OrgPool> = {
  "org-velmora": {
    customers: [
      "Shreeji Traders",
      "Global Exports Ltd.",
      "Kisan Agro Pvt. Ltd.",
      "ABC Pharma Pvt Ltd",
      "Sunrise Organics",
      "Bharat Herbal Exports",
    ],
    leads: [
      "Greenleaf Agro",
      "Mahadev Enterprises",
      "Orbit Foods",
      "Patel Spices",
      "Ravi Herbals",
    ],
    products: [
      "Ashwagandha Extract",
      "Turmeric Powder",
      "Moringa Capsules",
      "Basmati Rice",
    ],
    users: [
      {
        id: "rahul-verma",
        name: "Rahul Verma",
        email: "rahul@velmora.in",
        role: "Admin",
      },
      {
        id: "manager-priya",
        name: "Priya Nair",
        email: "priya@velmora.in",
        role: "Sales Manager",
      },
      {
        id: "neha-singh",
        name: "Neha Singh",
        email: "neha@velmora.in",
        role: "Sales Executive",
      },
      {
        id: "amit-sharma",
        name: "Amit Sharma",
        email: "amit@velmora.in",
        role: "Owner",
      },
    ],
  },
  "org-eustoma": {
    customers: [
      "Medicare Distributors",
      "Zenith Pharma Pvt Ltd",
      "LifeLine Chemists",
      "XYZ Pharma",
      "Apex Healthcare",
    ],
    leads: [
      "Curewell Pharmacy",
      "Nova Health Mart",
      "Sanjeevani Stores",
      "Trident Labs",
    ],
    products: ["Paracetamol 500mg", "ORS Sachets", "Vitamin D3 Tablets"],
    users: [
      {
        id: "rahul-verma",
        name: "Rahul Verma",
        email: "rahul@eustoma.in",
        role: "Sales Manager",
      },
      {
        id: "ananya-rao",
        name: "Ananya Rao",
        email: "ananya@eustoma.in",
        role: "Admin",
      },
      {
        id: "vikram-desai",
        name: "Vikram Desai",
        email: "vikram@eustoma.in",
        role: "Sales Executive",
      },
    ],
  },
  "org-abc": {
    customers: [
      "Al Noor Trading",
      "Gulf Star Foods",
      "Horizon Retail LLC",
      "Delta Wholesale",
    ],
    leads: ["Marina Mart", "Palm Grocers", "Skyline Supplies"],
    products: ["Olive Oil 5L", "Dates Premium 1kg", "Basmati Rice 10kg"],
    users: [
      {
        id: "rahul-verma",
        name: "Rahul Verma",
        email: "rahul@abc-dist.com",
        role: "Sales Executive",
      },
      {
        id: "omar-khan",
        name: "Omar Khan",
        email: "omar@abc-dist.com",
        role: "Owner",
      },
      {
        id: "sara-thomas",
        name: "Sara Thomas",
        email: "sara@abc-dist.com",
        role: "Sales Manager",
      },
    ],
  },
};

export const ORG_NAMES: Record<string, string> = {
  "org-velmora": "Velmora Exports",
  "org-eustoma": "Eustoma Pharma",
  "org-abc": "ABC Distribution",
};

/** Small deterministic PRNG so fixtures are stable between renders. */
export function makeRng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let s = h >>> 0;
  const next = () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
  return {
    next,
    int: (min: number, max: number) =>
      Math.floor(next() * (max - min + 1)) + min,
    pick: <T>(arr: readonly T[]): T =>
      arr[Math.floor(next() * arr.length)] as T,
    hex: (len: number) =>
      Array.from({ length: len }, () =>
        Math.floor(next() * 16).toString(16),
      ).join(""),
  };
}

export const isoMinutesAgo = (minutes: number) =>
  new Date(Date.now() - minutes * 60_000).toISOString();

/** Pagination envelope used by both list endpoints. */
export type Paginated<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export function paginate<T>(
  rows: T[],
  page: number,
  pageSize: number,
): Paginated<T> {
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  return {
    items: rows.slice((safePage - 1) * pageSize, safePage * pageSize),
    page: safePage,
    pageSize,
    total,
    totalPages,
  };
}

export class ForbiddenError extends Error {
  constructor() {
    super("forbidden");
  }
}

/** yyyy-MM-dd bounds → epoch ms (local day start / end). */
export function dayBounds(start?: string, end?: string) {
  const s = start ? new Date(`${start}T00:00:00`).getTime() : -Infinity;
  const e = end ? new Date(`${end}T23:59:59.999`).getTime() : Infinity;
  return { s, e };
}

export const delay = (ms = 220) => new Promise((r) => setTimeout(r, ms));
