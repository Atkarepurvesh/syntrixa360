export type CrmSearch = {
  filter?: string;
  stage?: string;
  period?: string;
  source?: string;
  thread?: string;
  activity?: string;
  tab?: string;
  create?: string;
  q?: string;
  type?: string;
  /** Where navigation into this page came from, e.g. "follow-ups" — used to show a contextual back link. */
  from?: string;
  /** A specific record id to deep-link to and auto-open, e.g. a deal id on the Pipeline page. */
  deal?: string;
  /** A specific quotation id to deep-link to and auto-open on the Quotations page. */
  quotation?: string;
  /** A specific product id to deep-link to and auto-open on the Products page. */
  product?: string;
  /** A specific requirement id to deep-link to and auto-open on the Requirements page. */
  requirement?: string;
  /** A specific customer id, e.g. to pre-select in a "New Requirement" flow reached via navigation. */
  customer?: string;
  /** A specific payment follow-up id to deep-link to and auto-open on the Payment Follow-up page. */
  payment?: string;
  /** A specific repeat-order opportunity id to deep-link to and auto-open on the Repeat Orders page. */
  reorder?: string;
  /** A specific order id to deep-link to on the My Orders page. */
  order?: string;
};

const str = (v: unknown) => (typeof v === "string" && v.length > 0 ? v : undefined);

const KEYS = [
  "filter",
  "stage",
  "period",
  "source",
  "thread",
  "activity",
  "tab",
  "create",
  "q",
  "type",
  "from",
  "deal",
  "quotation",
  "product",
  "requirement",
  "customer",
  "payment",
  "reorder",
  "order",
] as const;

export const validateCrmSearch = (search: Record<string, unknown>): CrmSearch => {
  const result: CrmSearch = {};
  for (const key of KEYS) {
    const value = str(search[key]);
    if (value !== undefined) result[key] = value;
  }
  return result;
};
