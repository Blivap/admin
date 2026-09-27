import { apiClient } from "@/lib/api/client";
import { buildQueryString } from "@/lib/utils";
import type {
  AdminBloodRequestDetail,
  AdminBloodRequestListItem,
  AssignDonorPayload,
  EscalateRequestPayload,
  MatchingLogEntry,
  PaginatedResponse,
  RequestsListParams,
} from "@/types";

export function listRequests(params: RequestsListParams = {}) {
  return apiClient<PaginatedResponse<AdminBloodRequestListItem>>(
    `/admin/requests${buildQueryString(params)}`,
  );
}

export function getRequest(id: string) {
  return apiClient<AdminBloodRequestDetail>(`/admin/requests/${id}`);
}

export function getMatchingLog(id: string) {
  return apiClient<MatchingLogEntry[]>(`/admin/requests/${id}/matching-log`);
}

export function assignDonor(id: string, payload: AssignDonorPayload) {
  return apiClient<AdminBloodRequestDetail>(`/admin/requests/${id}/assign-donor`, {
    method: "POST",
    body: payload,
  });
}

export function escalateRequest(id: string, payload: EscalateRequestPayload) {
  return apiClient<AdminBloodRequestDetail>(`/admin/requests/${id}/escalate`, {
    method: "POST",
    body: payload,
  });
}

export function closeRequest(id: string) {
  return apiClient<AdminBloodRequestDetail>(`/admin/requests/${id}/close`, {
    method: "POST",
  });
}
