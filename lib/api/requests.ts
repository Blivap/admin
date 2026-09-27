import { apiClient } from "@/lib/api/client";
import { buildQueryString } from "@/lib/utils";
import type {
  AdminBloodRequestDetail,
  AdminBloodRequestListItem,
  AssignDonorPayload,
  EscalateRequestPayload,
  MatchLogEntry,
  PaginatedResponse,
  RematchPayload,
  RebroadcastPayload,
  RequestsListParams,
  UpdateRequestStatusPayload,
} from "@/types";

export function listRequests(params: RequestsListParams = {}) {
  return apiClient<PaginatedResponse<AdminBloodRequestListItem>>(
    `/admin/requests${buildQueryString(params)}`,
  );
}

export function getRequest(id: string) {
  return apiClient<AdminBloodRequestDetail>(`/admin/requests/${id}`);
}

export function updateRequestStatus(
  id: string,
  payload: UpdateRequestStatusPayload,
) {
  return apiClient<AdminBloodRequestDetail>(`/admin/requests/${id}/status`, {
    method: "PATCH",
    body: payload,
  });
}

export function assignDonor(id: string, payload: AssignDonorPayload) {
  return apiClient<AdminBloodRequestDetail>(
    `/admin/requests/${id}/assign-donor`,
    { method: "POST", body: payload },
  );
}

export function escalateRequest(id: string, payload: EscalateRequestPayload) {
  return apiClient<AdminBloodRequestDetail>(`/admin/requests/${id}/escalate`, {
    method: "POST",
    body: payload,
  });
}

export function rematchRequest(id: string, payload: RematchPayload = {}) {
  return apiClient<AdminBloodRequestDetail>(`/admin/requests/${id}/rematch`, {
    method: "POST",
    body: payload,
  });
}

export function rebroadcastRequest(id: string, payload: RebroadcastPayload) {
  return apiClient<{ message: string }>(`/admin/requests/${id}/rebroadcast`, {
    method: "POST",
    body: payload,
  });
}

export function getMatches(requestId: string) {
  return apiClient<MatchLogEntry[]>(
    `/admin/matches${buildQueryString({ requestId })}`,
  );
}
