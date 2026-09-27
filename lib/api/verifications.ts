import { apiClient } from "@/lib/api/client";
import { buildQueryString } from "@/lib/utils";
import type {
  AdminVerificationDetail,
  AdminVerificationListItem,
  FlagVerificationPayload,
  PaginatedResponse,
  RejectVerificationPayload,
  VerificationsListParams,
} from "@/types";

export function listVerifications(params: VerificationsListParams = {}) {
  return apiClient<PaginatedResponse<AdminVerificationListItem>>(
    `/admin/verifications${buildQueryString(params)}`,
  );
}

export function getVerification(id: string) {
  return apiClient<AdminVerificationDetail>(`/admin/verifications/${id}`);
}

export function approveVerification(id: string) {
  return apiClient<AdminVerificationDetail>(
    `/admin/verifications/${id}/approve`,
    { method: "POST" },
  );
}

export function rejectVerification(
  id: string,
  payload: RejectVerificationPayload,
) {
  return apiClient<AdminVerificationDetail>(
    `/admin/verifications/${id}/reject`,
    { method: "POST", body: payload },
  );
}

export function flagVerification(id: string, payload: FlagVerificationPayload) {
  return apiClient<AdminVerificationDetail>(
    `/admin/verifications/${id}/flag`,
    { method: "POST", body: payload },
  );
}
