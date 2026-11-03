import { apiClient } from "@/lib/api/client";
import { buildQueryString } from "@/lib/utils";
import type {
  AdminHospitalListItem,
  CreateHospitalPayload,
  HospitalsListParams,
  PaginatedResponse,
  UpdateBloodCollectionAuthorizationPayload,
} from "@/types";

interface ApiHospitalRow {
  id?: string;
  _id?: string;
  name: string;
  addressLine?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  authorizedBloodCollection?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface ApiEnvelope<T> {
  message?: string;
  data?: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

function mapHospital(row: ApiHospitalRow): AdminHospitalListItem {
  return {
    id: row.id ?? row._id ?? "",
    name: row.name,
    address: row.addressLine ?? row.address ?? null,
    city: row.city ?? null,
    state: row.state ?? null,
    region: null,
    authorizedBloodCollection: Boolean(row.authorizedBloodCollection),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toListQuery(params: HospitalsListParams) {
  // Nest ListHospitalsQueryDto: page, limit, query|search, city, state.
  // Authorization filter is applied client-side after fetch.
  return {
    page: params.page,
    query: params.query,
    limit: params.pageSize,
  };
}

function unwrapList(
  raw: unknown,
  params: HospitalsListParams,
): PaginatedResponse<AdminHospitalListItem> {
  const envelope = (raw ?? {}) as ApiEnvelope<ApiHospitalRow[]>;
  const rows = Array.isArray(envelope.data)
    ? envelope.data
    : Array.isArray(raw)
      ? (raw as ApiHospitalRow[])
      : [];

  let mapped = rows.map(mapHospital).filter((h) => h.id && h.name);
  if (params.authorizedBloodCollection === true) {
    mapped = mapped.filter((h) => h.authorizedBloodCollection);
  } else if (params.authorizedBloodCollection === false) {
    mapped = mapped.filter((h) => !h.authorizedBloodCollection);
  }

  const meta = envelope.meta;
  const filteringAuth =
    params.authorizedBloodCollection === true ||
    params.authorizedBloodCollection === false;

  return {
    data: mapped,
    meta: {
      page: meta?.page ?? params.page ?? 1,
      pageSize: meta?.limit ?? params.pageSize ?? 20,
      total: filteringAuth ? mapped.length : (meta?.total ?? mapped.length),
      totalPages: filteringAuth ? 1 : (meta?.totalPages ?? 1),
    },
  };
}

function unwrapOne(raw: unknown): AdminHospitalListItem {
  if (raw && typeof raw === "object" && "data" in raw) {
    return mapHospital(
      (raw as ApiEnvelope<ApiHospitalRow>).data as ApiHospitalRow,
    );
  }
  return mapHospital(raw as ApiHospitalRow);
}

/**
 * List facilities from Nest `GET /hospitals` (JWT).
 * Browser uses `/api/hospitals` (rewrite) so it does not collide with the
 * Facilities page at `/hospitals`. Server prefetch hits Nest directly.
 */
export async function listHospitals(params: HospitalsListParams = {}) {
  const qs = buildQueryString(toListQuery(params));
  const path =
    typeof window === "undefined" ? `/hospitals${qs}` : `/api/hospitals${qs}`;
  const raw = await apiClient<unknown>(path);
  return unwrapList(raw, params);
}

export async function createHospital(payload: CreateHospitalPayload) {
  const raw = await apiClient<unknown>("/admin/hospitals", {
    method: "POST",
    body: payload,
  });
  return unwrapOne(raw);
}

export async function updateBloodCollectionAuthorization(
  id: string,
  payload: UpdateBloodCollectionAuthorizationPayload,
) {
  const raw = await apiClient<unknown>(
    `/admin/hospitals/${id}/blood-collection-authorization`,
    { method: "PATCH", body: payload },
  );
  return unwrapOne(raw);
}
