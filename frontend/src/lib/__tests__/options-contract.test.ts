import { describe, expect, it } from "vitest";

import backend from "./backend-options.json";
import * as fe from "../onboarding-options";

// Frontend <select> values must be accepted by the backend (app/schemas/onboarding_options.py).
// Regenerate backend-options.json with `python scripts/export_onboarding_options.py` when the backend changes.
const pairs: Array<[string, readonly { value: string }[] | readonly string[], string[]]> = [
  ["BUSINESS_TYPES", fe.BUSINESS_TYPES, backend.BUSINESS_TYPES],
  ["INDUSTRIES", fe.INDUSTRIES, backend.INDUSTRIES],
  ["BUSINESS_MODELS", fe.BUSINESS_MODELS, backend.BUSINESS_MODELS],
  ["TURNOVER_RANGES", fe.TURNOVER_RANGES, backend.TURNOVER_RANGES],
  ["EMPLOYEE_RANGES", fe.EMPLOYEE_RANGES, backend.EMPLOYEE_RANGES],
  ["SALES_TEAM_SIZES", fe.SALES_TEAM_SIZES, backend.SALES_TEAM_SIZES],
  ["SALES_MARKETS", fe.SALES_MARKETS, backend.SALES_MARKETS],
  ["SALES_REGIONS", fe.SALES_REGIONS, backend.SALES_REGIONS],
  ["SALES_PROCESS_TYPES", fe.SALES_PROCESS_TYPES, backend.SALES_PROCESS_TYPES],
  ["CURRENCIES", fe.CURRENCIES, backend.CURRENCIES],
  ["TIMEZONES", fe.TIMEZONES, backend.TIMEZONES],
  ["LANGUAGES", fe.LANGUAGES, backend.LANGUAGES],
  ["DATE_FORMATS", fe.DATE_FORMATS, backend.DATE_FORMATS],
];

describe("option values match the backend", () => {
  it.each(pairs)("%s", (_name, frontend, accepted) => {
    const values = frontend.map((o) => (typeof o === "string" ? o : o.value));
    expect(values.filter((v) => !accepted.includes(v))).toEqual([]);
  });
});
