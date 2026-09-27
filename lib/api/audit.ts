import { apiClient } from "@/lib/api/client";
import { buildQueryString } from "@/lib/utils";
import type {
  AuditLogEntry,
  AuditLogsListParams,
  PaginatedResponse,
} from "@/types";

/** Read-only. Mutations are audited by NestJS AuditInterceptor automatically. */
export function listAuditLogs(params: AuditLogsListParams = {}) {
  return apiClient<PaginatedResponse<AuditLogEntry>>(
    `/admin/audit-logs${buildQueryString(params)}`,
  );
}
