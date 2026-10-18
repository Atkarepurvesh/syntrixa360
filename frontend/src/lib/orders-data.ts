// Syntrixa 360 — Orders module data layer
//
// Business flow this module powers:
// Quotation (Accepted) -> Order -> Payment Follow-up -> Repeat Order
//
// Orders were previously only implied — Payment Follow-ups already carried
// a full order record (orderId, orderNumber, orderStatus, orderTotal, ...)
// and Quotations already carried a `convertedOrderId` once accepted — but
// there was no page that actually listed or opened an order. This file does
// not invent a second, disconnected set of mock orders: it derives the
// canonical `Order` list from those same records so every id, customer and
// amount already visible on the Payment Follow-up and Quotation pages
// resolves to the same order here.

import { getCustomerRowBySlug } from "@/lib/customers-data";
import {
  currentSalesExecutive,
  formatINR,
  formatINRCompact,
  paymentFollowUps,
  type PaymentFollowUp,
  type PaymentStatus,
} from "@/lib/payments-data";

export type OrderStatus = "Processing" | "Shipped" | "Delivered" | "Cancelled";

export type OrderItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
};

export type OrderTimelineEvent = {
  id: string;
  date: string;
  label: string;
  note?: string;
};

export type Order = {
  id: string;
  orderNumber: string;
  customerId: string;
  customerSlug: string;
  customerName: string;
  contact: string;
  phone: string;
  email: string;
  city: string;
  country: string;
  salespersonName: string;
  orderDate: string;
  expectedDelivery: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  orderTotal: number;
  paidAmount: number;
  items: OrderItem[];
  /** The quotation this order was converted from, when known. */
  quotationId: string | null;
  /** The payment follow-up tracking this order's balance, when one exists. */
  paymentFollowUpId: string | null;
  notes: string;
  timeline: OrderTimelineEvent[];
};

function itemsFromSummary(summary: string, orderTotal: number): OrderItem[] {
  // Payment Follow-up / legacy records only carry a human summary like
  // "Semi-Husked Coconut — 12 MT", not a structured line-item breakdown.
  // Parse out a quantity + unit when present and fall back to a single
  // line so every order still has a real items table.
  const match = summary.match(/^(.*?)\s*—\s*([\d.]+)\s*([A-Za-z]+)$/);
  if (match && match[1] && match[2] && match[3]) {
    const name = match[1];
    const unit = match[3];
    const quantity = Number(match[2]) || 1;
    return [
      {
        id: "OI-1",
        name: name.trim(),
        quantity,
        unit,
        unitPrice: Math.round(orderTotal / quantity),
        total: orderTotal,
      },
    ];
  }
  return [
    {
      id: "OI-1",
      name: summary,
      quantity: 1,
      unit: "LOT",
      unitPrice: orderTotal,
      total: orderTotal,
    },
  ];
}

function orderFromPayment(p: PaymentFollowUp): Order {
  const row = getCustomerRowBySlug(p.customerSlug);
  const [city, country] = (row?.location ?? "").split(",").map((s) => s.trim());
  return {
    id: p.orderId,
    orderNumber: p.orderNumber,
    customerId: row?.id ?? p.customerSlug,
    customerSlug: p.customerSlug,
    customerName: p.customerName,
    contact: p.contact,
    phone: p.phone,
    email: p.email,
    city: city || "—",
    country: country || "India",
    salespersonName: p.salespersonName,
    orderDate: p.orderDate,
    expectedDelivery: p.expectedDelivery,
    status: p.orderStatus,
    paymentStatus: p.paymentStatus,
    orderTotal: p.orderTotal,
    paidAmount: p.paidAmount,
    items: itemsFromSummary(p.productSummary, p.orderTotal),
    quotationId: null,
    paymentFollowUpId: p.id,
    notes: p.notes,
    timeline: [
      { id: `${p.id}-created`, date: p.orderDate, label: "Order Created" },
      ...p.timeline.map((t) =>
        t.note
          ? { id: t.id, date: t.date, label: t.label, note: t.note }
          : { id: t.id, date: t.date, label: t.label },
      ),
    ],
  };
}

// One additional order that isn't tied to a Payment Follow-up record: the
// order a Quotation was converted into (see quotations-data.ts,
// QT-2026-0005 → convertedOrderId "ORD-2026-0025"). Included so the
// Quotation → Order connection is real, not just a dangling id.
const orderFromConvertedQuotation: Order = {
  id: "ORD-2026-0025",
  orderNumber: "SO-1025",
  customerId: "CUST-1014",
  customerSlug: "nirmal-textiles",
  customerName: "Nirmal Textiles",
  contact: "Meena Nirmal",
  phone: "+91 91234 76543",
  email: "meena@nirmaltextiles.in",
  city: "Surat",
  country: "India",
  salespersonName: "Pooja Patel",
  orderDate: "12 Aug 2026",
  expectedDelivery: "26 Aug 2026",
  status: "Delivered",
  paymentStatus: "Paid",
  orderTotal: 1153560,
  paidAmount: 1153560,
  items: [
    {
      id: "OI-1",
      name: "Control Panel — Standard",
      quantity: 6,
      unit: "PCS",
      unitPrice: 22400,
      total: 1153560,
    },
  ],
  quotationId: "QT-2026-0005",
  paymentFollowUpId: null,
  notes: "Converted from an accepted quotation; paid in full on delivery.",
  timeline: [
    {
      id: "o25-1",
      date: "12 Aug 2026",
      label: "Order Created",
      note: "Converted from QT-2026-0005",
    },
    { id: "o25-2", date: "18 Aug 2026", label: "Shipped" },
    { id: "o25-3", date: "26 Aug 2026", label: "Delivered" },
    { id: "o25-4", date: "26 Aug 2026", label: "Payment Received in Full" },
  ],
};

export const ordersData: Order[] = [
  ...paymentFollowUps.map(orderFromPayment),
  orderFromConvertedQuotation,
];

export function getOrderById(id: string): Order | undefined {
  return ordersData.find((o) => o.id === id);
}

export function getOrdersForCustomerSlug(slug: string): Order[] {
  return ordersData.filter((o) => o.customerSlug === slug);
}

export function orderKpis(rows: Order[]) {
  return {
    total: rows.length,
    processing: rows.filter((o) => o.status === "Processing").length,
    shipped: rows.filter((o) => o.status === "Shipped").length,
    delivered: rows.filter((o) => o.status === "Delivered").length,
    outstanding: rows.reduce((sum, o) => sum + Math.max(0, o.orderTotal - o.paidAmount), 0),
  };
}

export { currentSalesExecutive, formatINR, formatINRCompact };
