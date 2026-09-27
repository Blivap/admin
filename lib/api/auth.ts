import { apiClient } from "@/lib/api/client";
import type { AdminUser, LoginPayload, LoginResponse } from "@/types";

export function login(payload: LoginPayload) {
  return apiClient<LoginResponse>("/admin/auth/login", {
    method: "POST",
    body: payload,
    skipAuthRedirect: true,
  });
}

export function logout() {
  return apiClient<void>("/admin/auth/logout", {
    method: "POST",
  });
}

export function getMe() {
  return apiClient<AdminUser>("/admin/auth/me");
}
