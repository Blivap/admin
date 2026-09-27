import { apiClient } from "@/lib/api/client";
import { buildQueryString } from "@/lib/utils";
import type {
  AdminUserDetail,
  AdminUserListItem,
  AuthRole,
  BloodType,
  MergeUsersPayload,
  PaginatedResponse,
  PlatformUserRole,
  SuspendUserPayload,
  UpdateUserPayload,
  UserStatus,
  UsersListParams,
} from "@/types";

/** Nested user document from Nest admin users API. */
interface ApiPlatformUser {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  phonenumber?: string | null;
  roles?: AuthRole[];
  profileImage?: string | null;
  lastActive?: string | null;
  isSuspended?: boolean;
  suspendedAt?: string | null;
  suspendedReason?: string | null;
  nationalIdentificationNumberVerified?: boolean;
  createdAt: string;
  updatedAt?: string;
  isDeleted?: boolean;
  emailVerified?: boolean;
  dateOfBirth?: string | null;
}

/** One row in GET /admin/users. */
interface ApiAdminUserRow {
  user: ApiPlatformUser;
  status: UserStatus;
  bloodType?: BloodType | null;
  location?: string | null;
  isDonor?: boolean;
  isRequester?: boolean;
}

interface ApiUsersListResponse {
  message?: string;
  data: ApiAdminUserRow[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage?: boolean;
    hasPreviousPage?: boolean;
  };
}

interface ApiUserDetailResponse {
  message?: string;
  data: ApiAdminUserRow | AdminUserDetail;
}

function mapPlatformRole(
  isDonor?: boolean,
  isRequester?: boolean,
): PlatformUserRole | "none" {
  if (isDonor && isRequester) return "both";
  if (isDonor) return "donor";
  if (isRequester) return "requester";
  return "none";
}

function mapAdminUserRow(row: ApiAdminUserRow): AdminUserListItem {
  const { user } = row;
  return {
    id: user.id,
    firstname: user.firstname,
    lastname: user.lastname,
    email: user.email,
    phonenumber: user.phonenumber ?? null,
    bloodType: row.bloodType ?? null,
    role: mapPlatformRole(row.isDonor, row.isRequester),
    status: row.status,
    city: null,
    state: null,
    region: row.location ?? null,
    ninVerified: Boolean(user.nationalIdentificationNumberVerified),
    createdAt: user.createdAt,
    lastActiveAt: user.lastActive ?? null,
    profileImage: user.profileImage ?? null,
    roles: user.roles,
    isSuspended: user.isSuspended,
    suspendedAt: user.suspendedAt ?? null,
    suspendedReason: user.suspendedReason ?? null,
  };
}

function isApiAdminUserRow(value: unknown): value is ApiAdminUserRow {
  return (
    typeof value === "object" &&
    value !== null &&
    "user" in value &&
    typeof (value as ApiAdminUserRow).user === "object"
  );
}

function toListQuery(params: UsersListParams) {
  const { pageSize, ...rest } = params;
  return {
    ...rest,
    limit: pageSize,
  };
}

export async function listUsers(
  params: UsersListParams = {},
): Promise<PaginatedResponse<AdminUserListItem>> {
  const raw = await apiClient<ApiUsersListResponse>(
    `/admin/users${buildQueryString(toListQuery(params))}`,
  );

  const rows = Array.isArray(raw?.data) ? raw.data : [];
  const meta = raw?.meta;

  return {
    data: rows.map(mapAdminUserRow),
    meta: {
      page: meta?.page ?? params.page ?? 1,
      pageSize: meta?.limit ?? params.pageSize ?? 20,
      total: meta?.total ?? rows.length,
      totalPages: meta?.totalPages ?? 1,
    },
  };
}

export async function getUser(id: string): Promise<AdminUserDetail> {
  const raw = await apiClient<ApiUserDetailResponse | AdminUserDetail>(
    `/admin/users/${id}`,
  );

  const payload =
    raw && typeof raw === "object" && "data" in raw
      ? (raw as ApiUserDetailResponse).data
      : (raw as AdminUserDetail);

  if (isApiAdminUserRow(payload)) {
    const base = mapAdminUserRow(payload);
    return {
      ...base,
      donationHistory: [],
      pushTokens: [],
      donationCount: 0,
      requestCount: 0,
      suspendedAt: payload.user.suspendedAt ?? null,
      suspendedReason: payload.user.suspendedReason ?? null,
    };
  }

  return {
    ...payload,
    donationHistory: payload.donationHistory ?? [],
    pushTokens: payload.pushTokens ?? [],
    donationCount: payload.donationCount ?? 0,
    requestCount: payload.requestCount ?? 0,
  };
}

export function updateUser(id: string, payload: UpdateUserPayload) {
  return apiClient<AdminUserDetail>(`/admin/users/${id}`, {
    method: "PATCH",
    body: payload,
  });
}

export function suspendUser(id: string, payload: SuspendUserPayload) {
  return apiClient<AdminUserDetail>(`/admin/users/${id}/suspend`, {
    method: "PATCH",
    body: payload,
  });
}

export function reactivateUser(id: string) {
  return apiClient<AdminUserDetail>(`/admin/users/${id}/reactivate`, {
    method: "PATCH",
  });
}

export function forceVerifyUser(id: string) {
  return apiClient<AdminUserDetail>(`/admin/users/${id}/verify`, {
    method: "POST",
  });
}

export function resetUserPassword(id: string) {
  return apiClient<{ message: string }>(`/admin/users/${id}/reset-password`, {
    method: "POST",
  });
}

export function mergeUsers(sourceId: string, payload: MergeUsersPayload) {
  return apiClient<AdminUserDetail>(`/admin/users/${sourceId}/merge`, {
    method: "POST",
    body: payload,
  });
}
