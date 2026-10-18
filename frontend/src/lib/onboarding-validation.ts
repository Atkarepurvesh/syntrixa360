// Shared validation + policy helpers for Part 1 (Account Signup & Verification).
// Frontend validation here is a UX convenience only — the mock backend in
// onboarding-api.ts re-validates everything independently, matching the
// "never trust frontend values" rule from the spec.

export interface Country {
  code: string; // ISO-ish label
  name: string;
  dialCode: string; // e.g. "+91"
  minLength: number;
  maxLength: number;
}

// Small curated list — enough to demonstrate a country-aware selector without
// pulling in a heavy i18n phone-number dependency.
export const COUNTRIES: Country[] = [
  { code: "IN", name: "India", dialCode: "+91", minLength: 10, maxLength: 10 },
  { code: "US", name: "United States", dialCode: "+1", minLength: 10, maxLength: 10 },
  { code: "GB", name: "United Kingdom", dialCode: "+44", minLength: 10, maxLength: 10 },
  { code: "AE", name: "United Arab Emirates", dialCode: "+971", minLength: 8, maxLength: 9 },
  { code: "AU", name: "Australia", dialCode: "+61", minLength: 9, maxLength: 9 },
  { code: "SG", name: "Singapore", dialCode: "+65", minLength: 8, maxLength: 8 },
  { code: "CA", name: "Canada", dialCode: "+1", minLength: 10, maxLength: 10 },
  { code: "DE", name: "Germany", dialCode: "+49", minLength: 10, maxLength: 11 },
];

export const DEFAULT_COUNTRY: Country = COUNTRIES[0]!;

/** Dial-code options for the phone selector — one entry per unique dial code
 *  (US and Canada both use +1, which previously produced duplicate Select values). */
export const DIAL_CODE_OPTIONS: { dialCode: string; label: string }[] = Object.values(
  COUNTRIES.reduce<Record<string, { dialCode: string; codes: string[] }>>((acc, c) => {
    const entry = (acc[c.dialCode] ??= { dialCode: c.dialCode, codes: [] });
    entry.codes.push(c.code);
    return acc;
  }, {}),
).map((e) => ({ dialCode: e.dialCode, label: `${e.dialCode} ${e.codes.join("/")}` }));

export function findCountry(dialCode: string): Country {
  return COUNTRIES.find((c) => c.dialCode === dialCode) ?? DEFAULT_COUNTRY;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateFullName(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "Please enter your full name.";
  if (trimmed.length < 2) return "Please enter your full name.";
  if (trimmed.length > 80) return "Full name is too long.";
  if (!/^[\p{L}\s.'-]+$/u.test(trimmed)) {
    return "Please enter your full name.";
  }
  return null;
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function validateEmail(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "Please enter a valid business email address.";
  if (!EMAIL_RE.test(trimmed)) return "Please enter a valid business email address.";
  return null;
}

export function validatePhone(digits: string, country: Country): string | null {
  const cleaned = digits.replace(/\D/g, "");
  if (!cleaned) return "Please enter a valid mobile number.";
  if (cleaned.length < country.minLength || cleaned.length > country.maxLength) {
    return "Please enter a valid mobile number.";
  }
  return null;
}

export interface PasswordRequirement {
  id: string;
  label: string;
  met: boolean;
}

export type PasswordStrength = "empty" | "weak" | "medium" | "strong";

export function getPasswordRequirements(password: string): PasswordRequirement[] {
  return [
    { id: "length", label: "At least 8 characters", met: password.length >= 8 },
    { id: "upper", label: "One uppercase letter", met: /[A-Z]/.test(password) },
    { id: "lower", label: "One lowercase letter", met: /[a-z]/.test(password) },
    { id: "number", label: "One number", met: /[0-9]/.test(password) },
    { id: "special", label: "One special character", met: /[^A-Za-z0-9]/.test(password) },
  ];
}

export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return "empty";
  const requirements = getPasswordRequirements(password);
  const metCount = requirements.filter((r) => r.met).length;
  if (metCount <= 2) return "weak";
  if (metCount <= 4) return "medium";
  return "strong";
}

export function isPasswordAcceptable(password: string): boolean {
  // Do not allow obviously weak passwords — require every policy requirement.
  return getPasswordRequirements(password).every((r) => r.met);
}

export function validatePassword(password: string): string | null {
  if (!password) return "Please create a password.";
  if (!isPasswordAcceptable(password)) {
    return "Your password doesn't meet the minimum security requirements.";
  }
  return null;
}

export function validateConfirmPassword(password: string, confirm: string): string | null {
  if (!confirm) return "Please re-enter your password.";
  if (password !== confirm) return "Passwords do not match.";
  return null;
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain || !local) return email;
  const visible = local.slice(0, 1);
  return `${visible}${"*".repeat(Math.max(local.length - 1, 3))}@${domain}`;
}

export function maskPhone(dialCode: string, phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  const last4 = cleaned.slice(-4);
  return `${dialCode} ${"*".repeat(Math.max(cleaned.length - 4, 2))}${last4}`;
}
