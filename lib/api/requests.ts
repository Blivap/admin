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

interface ApiEnvelope<T> {
  message?: string;
  data?: T;
  meta?: {
    page?: number;
    pageSize?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

function toListQuery(params: RequestsListParams) {
  const { pageSize, ...rest } = params;
  return {
    ...rest,
    pageSize,
    // Nest accepts `limit` as an alias for page size.
    limit: pageSize,
  };
}

function unwrapList(
  raw: unknown,
  params: RequestsListParams,
): PaginatedResponse<AdminBloodRequestListItem> {
  const envelope = (raw ?? {}) as ApiEnvelope<AdminBloodRequestListItem[]>;
  const rows = Array.isArray(envelope.data)
    ? envelope.data
    : Array.isArray(raw)
      ? (raw as AdminBloodRequestListItem[])
      : [];

  const meta = envelope.meta;
  const page = meta?.page ?? params.page ?? 1;
  const pageSize = meta?.pageSize ?? meta?.limit ?? params.pageSize ?? 20;
  const total = meta?.total ?? rows.length;
  const totalPages =
    meta?.totalPages ??
    (total === 0 ? 0 : Math.max(1, Math.ceil(total / pageSize)));

  return {
    data: rows,
    meta: { page, pageSize, total, totalPages },
  };
}

function unwrapOne<T>(raw: unknown): T {
  if (raw && typeof raw === "object" && "data" in raw) {
    return (raw as ApiEnvelope<T>).data as T;
  }
  return raw as T;
}

export async function listRequests(
  params: RequestsListParams = {},
): Promise<PaginatedResponse<AdminBloodRequestListItem>> {
  const raw = await apiClient<unknown>(
    `/admin/requests${buildQueryString(toListQuery(params))}`,
  );
  return unwrapList(raw, params);
}

export async function getRequest(id: string) {
  const raw = await apiClient<unknown>(`/admin/requests/${id}`);
  return unwrapOne<AdminBloodRequestDetail>(raw);
}

export async function updateRequestStatus(
  id: string,
  payload: UpdateRequestStatusPayload,
) {
  const raw = await apiClient<unknown>(`/admin/requests/${id}/status`, {
    method: "PATCH",
    body: payload,
  });
  return unwrapOne<AdminBloodRequestDetail>(raw);
}

export async function assignDonor(id: string, payload: AssignDonorPayload) {
  const raw = await apiClient<unknown>(`/admin/requests/${id}/assign-donor`, {
    method: "POST",
    body: payload,
  });
  return unwrapOne<AdminBloodRequestDetail>(raw);
}

export async function escalateRequest(
  id: string,
  payload: EscalateRequestPayload,
) {
  const raw = await apiClient<unknown>(`/admin/requests/${id}/escalate`, {
    method: "POST",
    body: payload,
  });
  return unwrapOne<AdminBloodRequestDetail>(raw);
}

export async function rematchRequest(id: string, payload: RematchPayload = {}) {
  const raw = await apiClient<unknown>(`/admin/requests/${id}/rematch`, {
    method: "POST",
    body: payload,
  });
  return unwrapOne<AdminBloodRequestDetail>(raw);
}

export async function rebroadcastRequest(
  id: string,
  payload: RebroadcastPayload,
) {
  const raw = await apiClient<unknown>(`/admin/requests/${id}/rebroadcast`, {
    method: "POST",
    body: payload,
  });
  return unwrapOne<AdminBloodRequestDetail>(raw);
}

export async function getMatches(requestId: string) {
  const raw = await apiClient<unknown>(
    `/admin/matches${buildQueryString({ requestId })}`,
  );
  if (Array.isArray(raw)) return raw as MatchLogEntry[];
  if (raw && typeof raw === "object" && "data" in raw) {
    const data = (raw as ApiEnvelope<MatchLogEntry[]>).data;
    return Array.isArray(data) ? data : [];
  }
  return [];
}
