import { apiClient, ApiRequestError } from "@/lib/api/client";
import {
  clearSessionToken,
  setSessionToken,
} from "@/lib/auth/session";
import type {
  AdminUser,
  LoginApiResponse,
  LoginPayload,
  LoginResponse,
} from "@/types";

const ADMIN_ROLES = new Set(["admin", "super_admin", "support", "readonly"]);

function assertAdminAccess(user: AdminUser) {
  const allowed = user.roles?.some((role) => ADMIN_ROLES.has(role));
  if (!allowed) {
    throw new ApiRequestError(
      403,
      "This account does not have admin access.",
    );
  }
}

/** Login returns Bearer JWT in the body — persist it for middleware + API calls. */
export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const raw = await apiClient<LoginApiResponse>("/admin/auth/login", {
    method: "POST",
    body: payload,
    skipAuthRedirect: true,
  });

  const data = raw?.data;
  if (!data?.accessToken || !data.user) {
    throw new ApiRequestError(500, "Login response was missing a token.");
  }

  assertAdminAccess(data.user);
  setSessionToken(data.accessToken, data.accessTokenExpires);

  return {
    user: data.user,
    accessToken: data.accessToken,
    accessTokenExpires: data.accessTokenExpires,
  };
}

export async function logout() {
  try {
    await apiClient<void>("/admin/auth/logout", {
      method: "POST",
      skipAuthRedirect: true,
    });
  } finally {
    clearSessionToken();
  }
}

export function getMe() {
  return apiClient<AdminUser>("/admin/auth/me");
}
