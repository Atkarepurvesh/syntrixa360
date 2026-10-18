import { api, clearTokens, getRefreshToken, setTokens } from "./client";
import type {
  AuthUser,
  LoginResponse,
  RegisterInput,
  RegisteredUser,
} from "@/types/api/auth";

export async function register(input: RegisterInput): Promise<RegisteredUser> {
  return api.post<RegisteredUser>("/auth/register", input, { skipAuth: true });
}

export async function login(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const res = await api.post<LoginResponse>(
    "/auth/login",
    { email, password },
    { skipAuth: true },
  );
  setTokens(res);
  return res;
}

/** Backend requires the refresh token in the body; local tokens are always cleared. */
export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken();
  try {
    if (refreshToken) await api.post<void>("/auth/logout", { refreshToken });
  } finally {
    clearTokens();
  }
}

/** Uses the shared single-flight refresh in client.ts. */
export { refreshSession as refreshToken } from "./client";

export function getCurrentUser(): Promise<AuthUser> {
  return api.get<AuthUser>("/auth/me");
}

export function verifyEmail(token: string): Promise<void> {
  return api.post<void>("/auth/verify-email", { token }, { skipAuth: true });
}

export function resendVerification(email: string): Promise<void> {
  return api.post<void>(
    "/auth/resend-verification",
    { email },
    { skipAuth: true },
  );
}

export function forgotPassword(email: string): Promise<void> {
  return api.post<void>("/auth/forgot-password", { email }, { skipAuth: true });
}

/** Backend field is `new_password` (newPassword here, snake-cased by the client). */
export function resetPassword(
  token: string,
  newPassword: string,
): Promise<void> {
  return api.post<void>(
    "/auth/reset-password",
    { token, newPassword },
    { skipAuth: true },
  );
}
