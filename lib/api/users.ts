import { apiClient } from "@/lib/api/client";
import { buildQueryString } from "@/lib/utils";
import type {
  AdminUserDetail,
  AdminUserListItem,
  AuthRole,
  BloodType,
  ForceVerifyUserPayload,
  GrantDonorRetryResult,
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
  emailVerified?: boolean;
  dateOfBirth?: string | null;
  createdAt: string;
  updatedAt?: string;
  isDeleted?: boolean;
}

interface ApiUserLocation {
  country?: string | null;
  state?: string | null;
  city?: string | null;
  area?: string | null;
}

/** One row in GET /admin/users. */
interface ApiAdminUserRow {
  user: ApiPlatformUser;
  status: UserStatus;
  bloodType?: BloodType | null;
  location?: ApiUserLocation | string | null;
  isDonor?: boolean;
  isRequester?: boolean;
}

/** Nested detail from GET /admin/users/:id. */
interface ApiAdminUserDetail {
  user: ApiPlatformUser;
  status: UserStatus;
  contact?: {
    email?: string;
    phonenumber?: string | null;
  };
  verification?: {
    emailVerified?: boolean;
    nationalIdentificationNumberVerified?: boolean;
  };
  donor?: {
    bloodType?: BloodType | string | null;
    areaLocation?: ApiUserLocation | null;
    eligibilityStatus?: string | null;
    isActiveDonor?: boolean;
    lastDonationAt?: string | null;
  } | null;
  isDonor?: boolean;
  isRequester?: boolean;
  donationHistory?: Array<{
    id: string;
    role?: string;
    status: string;
    donationType?: string;
    scheduledAt?: string;
    hospitalId?: string;
    bloodRequestId?: string | null;
  }>;
  pushTokens?: Array<{
    id: string;
    kind?: string;
    fcmToken?: string | null;
    endpoint?: string | null;
    userAgent?: string | null;
    createdAt?: string;
  }>;
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

interface ApiEnvelope<T> {
  message?: string;
  data: T;
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

function mapLocation(location: ApiUserLocation | string | null | undefined): {
  city: string | null;
  state: string | null;
  region: string | null;
} {
  if (!location) {
    return { city: null, state: null, region: null };
  }

  if (typeof location === "string") {
    return { city: null, state: null, region: location };
  }

  const city = location.city?.trim() || location.area?.trim() || null;
  const state = location.state?.trim() || null;
  const region =
    location.country?.trim() ||
    (location.area?.trim() && location.area.trim() !== city
      ? location.area.trim()
      : null);

  return { city, state, region };
}

function resolveUserId(user: ApiPlatformUser): string {
  if (user.id) return user.id;
  const raw = user as ApiPlatformUser & { _id?: string };
  return raw._id ?? "";
}

function mapAdminUserRow(row: ApiAdminUserRow): AdminUserListItem {
  const { user } = row;
  const location = mapLocation(row.location);
  return {
    id: resolveUserId(user),
    firstname: user.firstname,
    lastname: user.lastname,
    email: user.email,
    phonenumber: user.phonenumber ?? null,
    bloodType: (row.bloodType as BloodType) ?? null,
    role: mapPlatformRole(row.isDonor, row.isRequester),
    status: row.status,
    city: location.city,
    state: location.state,
    region: location.region,
    emailVerified: Boolean(user.emailVerified),
    ninVerified: Boolean(user.nationalIdentificationNumberVerified),
    createdAt: user.createdAt,
    lastActiveAt: user.lastActive ?? null,
    profileImage: user.profileImage ?? null,
    dateOfBirth: user.dateOfBirth ?? null,
    roles: user.roles,
    isSuspended: user.isSuspended,
    suspendedAt: user.suspendedAt ?? null,
    suspendedReason: user.suspendedReason ?? null,
  };
}

/** Detail responses include verification/donor/history; list rows do not. */
function isApiAdminUserDetail(value: unknown): value is ApiAdminUserDetail {
  if (!value || typeof value !== "object" || !("user" in value)) return false;
  const row = value as Record<string, unknown>;
  return (
    "verification" in row ||
    "contact" in row ||
    "donationHistory" in row ||
    "pushTokens" in row ||
    "donor" in row
  );
}

function isApiAdminUserRow(value: unknown): value is ApiAdminUserRow {
  return (
    typeof value === "object" &&
    value !== null &&
    "user" in value &&
    !isApiAdminUserDetail(value)
  );
}

/**
 * Detail nests blood type + area under `donor`, while the list puts them on
 * the row. Always prefer donor.*, then fall back to list-shaped top-level fields.
 */
function mapAdminUserDetail(detail: ApiAdminUserDetail): AdminUserDetail {
  const { user } = detail;
  const listShaped = detail as ApiAdminUserDetail & {
    bloodType?: BloodType | null;
    location?: ApiUserLocation | string | null;
  };

  const location = mapLocation(
    detail.donor?.areaLocation ?? listShaped.location ?? null,
  );
  const bloodType =
    (detail.donor?.bloodType as BloodType | undefined) ??
    listShaped.bloodType ??
    null;

  const emailVerified =
    detail.verification?.emailVerified ?? Boolean(user.emailVerified);
  const ninVerified =
    detail.verification?.nationalIdentificationNumberVerified ??
    Boolean(user.nationalIdentificationNumberVerified);

  const donationHistory = (detail.donationHistory ?? []).map((d) => ({
    id: d.id,
    requestId: d.bloodRequestId ?? null,
    bloodType: bloodType ?? ("O+" as BloodType),
    donatedAt: d.scheduledAt ?? "",
    facilityName: d.hospitalId ?? null,
    status: d.status,
  }));

  const pushTokens = (detail.pushTokens ?? []).map((t) => ({
    id: t.id,
    token: t.fcmToken || t.endpoint || t.id,
    platform: t.kind ?? null,
    lastUsedAt: t.createdAt ?? null,
  }));

  return {
    id: resolveUserId(user),
    firstname: user.firstname,
    lastname: user.lastname,
    email: detail.contact?.email ?? user.email,
    phonenumber: detail.contact?.phonenumber ?? user.phonenumber ?? null,
    bloodType,
    role: mapPlatformRole(detail.isDonor, detail.isRequester),
    status: detail.status,
    city: location.city,
    state: location.state,
    region: location.region,
    emailVerified,
    ninVerified,
    createdAt: user.createdAt,
    lastActiveAt: user.lastActive ?? null,
    profileImage: user.profileImage ?? null,
    dateOfBirth: user.dateOfBirth ?? null,
    roles: user.roles,
    isSuspended: user.isSuspended,
    suspendedAt: user.suspendedAt ?? null,
    suspendedReason: user.suspendedReason ?? null,
    eligibilityStatus: detail.donor?.eligibilityStatus ?? null,
    donationHistory,
    pushTokens,
    donationCount: donationHistory.length,
    requestCount: 0,
  };
}

function toListQuery(params: UsersListParams) {
  const { pageSize, query, ...rest } = params;
  return {
    ...rest,
    // Nest ListAdminUsersQueryDto uses `search`, not `query`.
    search: query,
    limit: pageSize,
  };
}

function unwrapData<T>(raw: unknown): T {
  if (raw && typeof raw === "object" && "data" in raw) {
    return (raw as ApiEnvelope<T>).data;
  }
  return raw as T;
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
  const raw = await apiClient<ApiEnvelope<unknown> | unknown>(
    `/admin/users/${id}`,
  );
  const payload = unwrapData<unknown>(raw);

  if (isApiAdminUserDetail(payload)) {
    return mapAdminUserDetail(payload);
  }

  if (isApiAdminUserRow(payload)) {
    const base = mapAdminUserRow(payload);
    return {
      ...base,
      donationHistory: [],
      pushTokens: [],
      donationCount: 0,
      requestCount: 0,
    };
  }

  const flat = payload as AdminUserDetail;
  return {
    ...flat,
    emailVerified: Boolean(flat.emailVerified),
    ninVerified: Boolean(flat.ninVerified),
    donationHistory: flat.donationHistory ?? [],
    pushTokens: flat.pushTokens ?? [],
    donationCount: flat.donationCount ?? 0,
    requestCount: flat.requestCount ?? 0,
  };
}

export async function updateUser(id: string, payload: UpdateUserPayload) {
  const raw = await apiClient<ApiEnvelope<unknown> | unknown>(
    `/admin/users/${id}`,
    { method: "PATCH", body: payload },
  );
  return getUserFromPayload(unwrapData(raw));
}

export async function suspendUser(id: string, payload: SuspendUserPayload) {
  const raw = await apiClient<ApiEnvelope<unknown> | unknown>(
    `/admin/users/${id}/suspend`,
    { method: "PATCH", body: payload },
  );
  return getUserFromPayload(unwrapData(raw));
}

export async function reactivateUser(id: string) {
  const raw = await apiClient<ApiEnvelope<unknown> | unknown>(
    `/admin/users/${id}/reactivate`,
    { method: "PATCH" },
  );
  return getUserFromPayload(unwrapData(raw));
}

export async function forceVerifyUser(
  id: string,
  payload: ForceVerifyUserPayload = {},
) {
  const raw = await apiClient<ApiEnvelope<unknown> | unknown>(
    `/admin/users/${id}/verify`,
    { method: "POST", body: payload },
  );
  return getUserFromPayload(unwrapData(raw));
}

export function resetUserPassword(id: string) {
  return apiClient<{ message: string }>(`/admin/users/${id}/reset-password`, {
    method: "POST",
  });
}

export async function grantDonorRetry(id: string) {
  const raw = await apiClient<ApiEnvelope<GrantDonorRetryResult> | GrantDonorRetryResult>(
    `/admin/users/${id}/donor-retry`,
    { method: "POST" },
  );
  return unwrapData<GrantDonorRetryResult>(raw);
}

export async function mergeUsers(sourceId: string, payload: MergeUsersPayload) {
  const raw = await apiClient<ApiEnvelope<unknown> | unknown>(
    `/admin/users/${sourceId}/merge`,
    { method: "POST", body: payload },
  );
  return unwrapData(raw);
}

function getUserFromPayload(payload: unknown): AdminUserDetail {
  if (isApiAdminUserDetail(payload)) {
    return mapAdminUserDetail(payload);
  }
  if (isApiAdminUserRow(payload)) {
    const base = mapAdminUserRow(payload);
    return {
      ...base,
      donationHistory: [],
      pushTokens: [],
      donationCount: 0,
      requestCount: 0,
    };
  }
  return payload as AdminUserDetail;
}
