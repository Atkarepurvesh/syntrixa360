// Key-case conversion between the frontend (camelCase) and the FastAPI backend (snake_case).
// Only object KEYS are converted, never values. Applied once, in client.ts.

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" &&
  v !== null &&
  Object.getPrototypeOf(v) === Object.prototype;

const toSnakeKey = (k: string) =>
  k.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
const toCamelKey = (k: string) =>
  k.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());

function convert(value: unknown, fn: (k: string) => string): unknown {
  if (Array.isArray(value)) return value.map((v) => convert(v, fn));
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[fn(k)] = convert(v, fn);
    return out;
  }
  return value;
}

export const toSnake = <T = unknown>(v: unknown): T =>
  convert(v, toSnakeKey) as T;
export const toCamel = <T = unknown>(v: unknown): T =>
  convert(v, toCamelKey) as T;
