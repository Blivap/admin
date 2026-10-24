import { apiClient } from "@/lib/api/client";
import { buildQueryString } from "@/lib/utils";
import type {
  AdminHospitalListItem,
  HospitalsListParams,
  PaginatedResponse,
  UpdateBloodCollectionAuthorizationPayload,
} from "@/types";

function toListQuery(params: HospitalsListParams) {
  const { pageSize, authorizedBloodCollection, ...rest } = params;
  return {
    ...rest,
    limit: pageSize,
    ...(authorizedBloodCollection === true || authorizedBloodCollection === false
      ? { authorizedBloodCollection }
      : {}),
  };
}

export function listHospitals(params: HospitalsListParams = {}) {
  return apiClient<PaginatedResponse<AdminHospitalListItem>>(
    `/admin/hospitals${buildQueryString(toListQuery(params))}`,
  );
}

export function updateBloodCollectionAuthorization(
  id: string,
  payload: UpdateBloodCollectionAuthorizationPayload,
) {
  return apiClient<AdminHospitalListItem>(
    `/admin/hospitals/${id}/blood-collection-authorization`,
    { method: "PATCH", body: payload },
  );
}
