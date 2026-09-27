import { apiClient } from "@/lib/api/client";
import { buildQueryString } from "@/lib/utils";
import type {
  AdminUserDetail,
  AdminUserListItem,
  PaginatedResponse,
  SuspendUserPayload,
  UsersListParams,
} from "@/types";

export function listUsers(params: UsersListParams = {}) {
  return apiClient<PaginatedResponse<AdminUserListItem>>(
    `/admin/users${buildQueryString(params)}`,
  );
}

export function getUser(id: string) {
  return apiClient<AdminUserDetail>(`/admin/users/${id}`);
}

export function suspendUser(id: string, payload: SuspendUserPayload) {
  return apiClient<AdminUserDetail>(`/admin/users/${id}/suspend`, {
    method: "POST",
    body: payload,
  });
}

export function unsuspendUser(id: string) {
  return apiClient<AdminUserDetail>(`/admin/users/${id}/unsuspend`, {
    method: "POST",
  });
}
