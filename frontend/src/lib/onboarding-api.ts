// Mock onboarding backend for Part 1 (Account Signup & Verification).
//
// There is no real server/database wired up yet, so this module stands in
// for the API described in the spec (POST /auth/signup, /auth/email/*,
// /auth/phone/*, /onboarding/status, /onboarding/progress). It keeps the
// same request/response shapes and the same rules (rate limiting, OTP
// expiry + attempt limits, no plaintext passwords, no OTPs in responses)
// so swapping this out for real endpoints later is a drop-in change —
// only this file should need to change.
//
// State lives in memory and is mirrored into sessionStorage purely so a
// page refresh during onboarding doesn't lose progress in the demo. This is
// NOT persistence — it resets when the tab/session ends, and is not a
// substitute for a real backend.

export type AccountStatus =
  | "SIGNUP_STARTED"
  | "EMAIL_VERIFICATION_PENDING"
  | "PHONE_VERIFICATION_PENDING"
  | "VERIFIED"
  | "ACTIVE";

export type OnboardingStatus =
  | "ACCOUNT_PENDING"
  | "VERIFICATION_PENDING"
  | "BUSINESS_PENDING"
  | "CHANNEL_SETUP_PENDING"
  | "TEAM_SETUP_PENDING"
  | "COMPLETED";

export type OnboardingStep = "account" | "email-otp" | "mobile-otp" | "verified";

interface OtpRecord {
  code: string;
  expiresAt: number;
  attempts: number;
  maxAttempts: number;
  lastSentAt: number;
  resendCooldownMs: number;
}

interface UserRecord {
  userId: string;
  fullName: string;
  email: string;
  dialCode: string;
  phone: string;
  passwordHash: string;
  marketingConsent: boolean;
  status: AccountStatus;
  onboardingStatus: OnboardingStatus;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: number;
  updatedAt: number;
}

export class OnboardingApiError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

const OTP_TTL_MS = 10 * 60 * 1000; // item 25 — 10 minutes
const OTP_MAX_ATTEMPTS = 5; // item 27
const OTP_RESEND_COOLDOWN_MS = 30 * 1000; // item 24 / 35
const SIGNUP_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const SIGNUP_RATE_LIMIT_MAX = 5;

const STORAGE_KEY = "syntrixa_onboarding_mock_db_v1";
const SESSION_KEY = "syntrixa_onboarding_session_v1";

interface DbShape {
  usersByEmail: Record<string, UserRecord>;
  usersById: Record<string, UserRecord>;
  emailOtps: Record<string, OtpRecord>;
  phoneOtps: Record<string, OtpRecord>;
  signupAttempts: number[];
  auditLog: Array<{ event: string; userId: string | undefined; at: number }>;
}

function emptyDb(): DbShape {
  return {
    usersByEmail: {},
    usersById: {},
    emailOtps: {},
    phoneOtps: {},
    signupAttempts: [],
    auditLog: [],
  };
}

function loadDb(): DbShape {
  if (typeof window === "undefined") return emptyDb();
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyDb();
    return { ...emptyDb(), ...JSON.parse(raw) };
  } catch {
    return emptyDb();
  }
}

function persistDb() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    // sessionStorage unavailable (private mode etc.) — degrade gracefully,
    // onboarding still works for the current in-memory session.
  }
}

const db = loadDb();

function audit(event: string, userId?: string) {
  db.auditLog.push({ event, userId, at: Date.now() });
  // Never log passwords or OTP values — only the event name + userId.
}

function delay(ms = 500) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function generateId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// Not real cryptographic hashing — this is a mock backend. A real
// implementation must use a proper password hashing algorithm server-side.
function fakeHash(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    hash = (hash << 5) - hash + password.charCodeAt(i);
    hash |= 0;
  }
  return `mock$${hash}$${password.length}`;
}

export interface SignupInput {
  fullName: string;
  email: string;
  dialCode: string;
  phone: string;
  password: string;
  confirmPassword: string;
  agreedToTerms: boolean;
  marketingConsent: boolean;
}

export interface SafeUser {
  userId: string;
  fullName: string;
  email: string;
  dialCode: string;
  phone: string;
  status: AccountStatus;
  onboardingStatus: OnboardingStatus;
  emailVerified: boolean;
  phoneVerified: boolean;
}

function toSafeUser(user: UserRecord): SafeUser {
  return {
    userId: user.userId,
    fullName: user.fullName,
    email: user.email,
    dialCode: user.dialCode,
    phone: user.phone,
    status: user.status,
    onboardingStatus: user.onboardingStatus,
    emailVerified: user.emailVerified,
    phoneVerified: user.phoneVerified,
  };
}

function checkSignupRateLimit() {
  const now = Date.now();
  db.signupAttempts = db.signupAttempts.filter((t) => now - t < SIGNUP_RATE_LIMIT_WINDOW_MS);
  if (db.signupAttempts.length >= SIGNUP_RATE_LIMIT_MAX) {
    throw new OnboardingApiError(
      "RATE_LIMITED",
      "Too many attempts. Please wait a moment and try again.",
    );
  }
  db.signupAttempts.push(now);
}

// A toast fires with the generated code so the flow is actually testable
// without a connected email/SMS provider. Swap this for a real
// email/SMS send in production and drop the toast entirely.
export type DevOtpNotifier = (channel: "email" | "phone", code: string) => void;
let devOtpNotifier: DevOtpNotifier | null = null;
export function setDevOtpNotifier(fn: DevOtpNotifier | null) {
  devOtpNotifier = fn;
}

function issueOtp(store: Record<string, OtpRecord>, key: string, channel: "email" | "phone") {
  const existing = store[key];
  if (existing && Date.now() - existing.lastSentAt < OTP_RESEND_COOLDOWN_MS) {
    const waitMs = OTP_RESEND_COOLDOWN_MS - (Date.now() - existing.lastSentAt);
    throw new OnboardingApiError(
      "RESEND_COOLDOWN",
      `Please wait ${Math.ceil(waitMs / 1000)}s before requesting a new code.`,
    );
  }
  const code = generateOtp();
  store[key] = {
    code,
    expiresAt: Date.now() + OTP_TTL_MS,
    attempts: 0,
    maxAttempts: OTP_MAX_ATTEMPTS,
    lastSentAt: Date.now(),
    resendCooldownMs: OTP_RESEND_COOLDOWN_MS,
  };
  persistDb();
  devOtpNotifier?.(channel, code);
}

function requireUser(userId: string): UserRecord {
  const user = db.usersById[userId];
  if (!user) throw new OnboardingApiError("NOT_FOUND", "We couldn't find that account.");
  return user;
}

export async function checkEmailAvailable(email: string): Promise<boolean> {
  await delay(250);
  return !db.usersByEmail[email.toLowerCase()];
}

export async function signup(
  input: SignupInput,
): Promise<{ user: SafeUser; nextStep: OnboardingStep }> {
  await delay(700);

  // Backend re-validates everything — never trusts the frontend (item 17).
  const email = input.email.trim().toLowerCase();
  if (!input.fullName.trim() || input.fullName.trim().length < 2) {
    throw new OnboardingApiError("INVALID_NAME", "Please enter your full name.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new OnboardingApiError("INVALID_EMAIL", "Please enter a valid business email address.");
  }
  if (!input.phone || input.phone.replace(/\D/g, "").length < 6) {
    throw new OnboardingApiError("INVALID_PHONE", "Please enter a valid mobile number.");
  }
  if (input.password.length < 8) {
    throw new OnboardingApiError("WEAK_PASSWORD", "Your password doesn't meet the requirements.");
  }
  if (input.password !== input.confirmPassword) {
    throw new OnboardingApiError("PASSWORD_MISMATCH", "Passwords do not match.");
  }
  if (!input.agreedToTerms) {
    throw new OnboardingApiError("TERMS_REQUIRED", "Please accept the Terms of Service.");
  }

  checkSignupRateLimit();

  if (db.usersByEmail[email]) {
    throw new OnboardingApiError("ACCOUNT_EXISTS", "An account with this email already exists.");
  }

  const userId = generateId("usr");
  const now = Date.now();
  const user: UserRecord = {
    userId,
    fullName: input.fullName.trim(),
    email,
    dialCode: input.dialCode,
    phone: input.phone.replace(/\D/g, ""),
    passwordHash: fakeHash(input.password),
    marketingConsent: input.marketingConsent,
    status: "EMAIL_VERIFICATION_PENDING",
    onboardingStatus: "VERIFICATION_PENDING",
    emailVerified: false,
    phoneVerified: false,
    createdAt: now,
    updatedAt: now,
  };
  db.usersByEmail[email] = user;
  db.usersById[userId] = user;
  persistDb();
  audit("ACCOUNT_CREATED", userId);

  issueOtp(db.emailOtps, userId, "email");
  audit("EMAIL_OTP_SENT", userId);

  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify({ userId, step: "email-otp" }));
  }

  return { user: toSafeUser(user), nextStep: "email-otp" };
}

export async function resendEmailOtp(userId: string): Promise<{ cooldownSeconds: number }> {
  await delay(400);
  const user = requireUser(userId);
  issueOtp(db.emailOtps, userId, "email");
  audit("EMAIL_OTP_SENT", userId);
  void user;
  return { cooldownSeconds: OTP_RESEND_COOLDOWN_MS / 1000 };
}

export async function verifyEmailOtp(
  userId: string,
  code: string,
): Promise<{ user: SafeUser; nextStep: OnboardingStep }> {
  await delay(500);
  const user = requireUser(userId);
  const record = db.emailOtps[userId];

  if (!record) {
    throw new OnboardingApiError("NO_OTP", "Please request a new verification code.");
  }
  if (Date.now() > record.expiresAt) {
    throw new OnboardingApiError(
      "OTP_EXPIRED",
      "This code has expired. Please request a new verification code.",
    );
  }
  if (record.attempts >= record.maxAttempts) {
    throw new OnboardingApiError(
      "TOO_MANY_ATTEMPTS",
      "For your security, please request a new verification code.",
    );
  }
  if (record.code !== code) {
    record.attempts += 1;
    persistDb();
    if (record.attempts >= record.maxAttempts) {
      delete db.emailOtps[userId];
      persistDb();
      throw new OnboardingApiError(
        "TOO_MANY_ATTEMPTS",
        "For your security, please request a new verification code.",
      );
    }
    throw new OnboardingApiError("INVALID_OTP", "Invalid verification code.");
  }

  user.emailVerified = true;
  user.status = "PHONE_VERIFICATION_PENDING";
  user.updatedAt = Date.now();
  delete db.emailOtps[userId];
  persistDb();
  audit("EMAIL_VERIFIED", userId);

  issueOtp(db.phoneOtps, userId, "phone");
  audit("PHONE_OTP_SENT", userId);

  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify({ userId, step: "mobile-otp" }));
  }

  return { user: toSafeUser(user), nextStep: "mobile-otp" };
}

export async function resendMobileOtp(userId: string): Promise<{ cooldownSeconds: number }> {
  await delay(400);
  requireUser(userId);
  issueOtp(db.phoneOtps, userId, "phone");
  audit("PHONE_OTP_SENT", userId);
  return { cooldownSeconds: OTP_RESEND_COOLDOWN_MS / 1000 };
}

export async function verifyMobileOtp(
  userId: string,
  code: string,
): Promise<{ user: SafeUser; nextStep: OnboardingStep }> {
  await delay(500);
  const user = requireUser(userId);
  const record = db.phoneOtps[userId];

  if (!record) {
    throw new OnboardingApiError("NO_OTP", "Please request a new verification code.");
  }
  if (Date.now() > record.expiresAt) {
    throw new OnboardingApiError("OTP_EXPIRED", "This verification code has expired.");
  }
  if (record.attempts >= record.maxAttempts) {
    throw new OnboardingApiError(
      "TOO_MANY_ATTEMPTS",
      "Too many attempts. Please request a new code.",
    );
  }
  if (record.code !== code) {
    record.attempts += 1;
    persistDb();
    if (record.attempts >= record.maxAttempts) {
      delete db.phoneOtps[userId];
      persistDb();
      throw new OnboardingApiError(
        "TOO_MANY_ATTEMPTS",
        "Too many attempts. Please request a new code.",
      );
    }
    throw new OnboardingApiError("INVALID_OTP", "Invalid verification code.");
  }

  user.phoneVerified = true;
  user.status = "VERIFIED";
  user.onboardingStatus = "BUSINESS_PENDING";
  user.updatedAt = Date.now();
  delete db.phoneOtps[userId];
  persistDb();
  audit("PHONE_VERIFIED", userId);
  audit("VERIFICATION_COMPLETED", userId);

  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify({ userId, step: "verified" }));
  }

  return { user: toSafeUser(user), nextStep: "verified" };
}

export async function changeEmail(userId: string, newEmail: string): Promise<{ user: SafeUser }> {
  await delay(500);
  const user = requireUser(userId);
  const normalized = newEmail.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new OnboardingApiError("INVALID_EMAIL", "Please enter a valid business email address.");
  }
  if (db.usersByEmail[normalized] && db.usersByEmail[normalized].userId !== userId) {
    throw new OnboardingApiError("ACCOUNT_EXISTS", "An account with this email already exists.");
  }
  delete db.usersByEmail[user.email];
  user.email = normalized;
  user.emailVerified = false;
  db.usersByEmail[normalized] = user;
  delete db.emailOtps[userId]; // invalidate old pending code — item 30
  persistDb();
  audit("EMAIL_CHANGED", userId);

  issueOtp(db.emailOtps, userId, "email");
  audit("EMAIL_OTP_SENT", userId);

  return { user: toSafeUser(user) };
}

export async function changeMobile(
  userId: string,
  dialCode: string,
  phone: string,
): Promise<{ user: SafeUser }> {
  await delay(500);
  const user = requireUser(userId);
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length < 6) {
    throw new OnboardingApiError("INVALID_PHONE", "Please enter a valid mobile number.");
  }
  user.dialCode = dialCode;
  user.phone = cleaned;
  user.phoneVerified = false;
  delete db.phoneOtps[userId];
  persistDb();
  audit("PHONE_CHANGED", userId);

  issueOtp(db.phoneOtps, userId, "phone");
  audit("PHONE_OTP_SENT", userId);

  return { user: toSafeUser(user) };
}

export function getOtpMeta(userId: string, channel: "email" | "phone") {
  const record = channel === "email" ? db.emailOtps[userId] : db.phoneOtps[userId];
  if (!record) return null;
  return {
    expiresAt: record.expiresAt,
    attemptsLeft: record.maxAttempts - record.attempts,
    lastSentAt: record.lastSentAt,
    resendCooldownMs: record.resendCooldownMs,
  };
}

export async function getOnboardingStatus(userId: string): Promise<SafeUser | null> {
  await delay(200);
  const user = db.usersById[userId];
  return user ? toSafeUser(user) : null;
}

export function getResumableSession(): { userId: string; step: OnboardingStep } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!db.usersById[parsed.userId]) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearOnboardingSession() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(SESSION_KEY);
}
