import { apiClient } from "@/lib/api/client";
import { buildQueryString } from "@/lib/utils";
import type {
  AuditLogEntry,
  AuditLogsListParams,
  PaginatedResponse,
} from "@/types";

interface ApiAuditLogRow {
  id?: string;
  _id?: string;
  action?: string;
  adminId?: string | null;
  adminEmail?: string | null;
  adminName?: string | null;
  admin?: {
    id?: string | null;
    email?: string | null;
    name?: string | null;
    firstname?: string | null;
    lastname?: string | null;
  } | null;
  resourceType?: string | null;
  resourceId?: string | null;
  resource?: {
    type?: string | null;
    id?: string | null;
  } | null;
  metadata?: Record<string, unknown> | null;
  createdAt?: string | null;
  timestamp?: string | null;
}

interface ApiAuditListResponse {
  message?: string;
  data?: ApiAuditLogRow[] | null;
  meta?: {
    page?: number;
    limit?: number;
    pageSize?: number;
    total?: number;
    totalPages?: number;
  } | null;
}

function mapAuditRow(row: ApiAuditLogRow, index: number): AuditLogEntry {
  const adminName =
    row.adminName ||
    [row.admin?.firstname, row.admin?.lastname].filter(Boolean).join(" ").trim() ||
    row.admin?.name ||
    null;

  return {
    id: row.id || row._id || `audit-${index}`,
    action: row.action || "unknown",
    adminId: row.adminId ?? row.admin?.id ?? null,
    adminEmail: row.adminEmail ?? row.admin?.email ?? null,
    adminName: adminName || null,
    resourceType: row.resourceType ?? row.resource?.type ?? null,
    resourceId: row.resourceId ?? row.resource?.id ?? null,
    metadata: row.metadata ?? null,
    createdAt: row.createdAt || row.timestamp || "",
  };
}

function toListQuery(params: AuditLogsListParams) {
  const { pageSize, ...rest } = params;
  return {
    ...rest,
    limit: pageSize,
  };
}

/** Read-only. Mutations are audited by NestJS AuditInterceptor automatically. */
export async function listAuditLogs(
  params: AuditLogsListParams = {},
): Promise<PaginatedResponse<AuditLogEntry>> {
  const raw = await apiClient<ApiAuditListResponse | AuditLogEntry[]>(
    `/admin/audit-logs${buildQueryString(toListQuery(params))}`,
  );

  const rows = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.data)
      ? raw.data
      : [];

  const meta = Array.isArray(raw) ? undefined : raw?.meta;

  return {
    data: rows.filter(Boolean).map(mapAuditRow),
    meta: {
      page: meta?.page ?? params.page ?? 1,
      pageSize: meta?.limit ?? meta?.pageSize ?? params.pageSize ?? 25,
      total: meta?.total ?? rows.length,
      totalPages: meta?.totalPages ?? 1,
    },
  };
}
