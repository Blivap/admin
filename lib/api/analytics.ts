import { apiClient } from "@/lib/api/client";
import { buildQueryString } from "@/lib/utils";
import type {
  AnalyticsDashboard,
  AnalyticsExportParams,
  AnalyticsParams,
} from "@/types";

export function getAnalytics(params: AnalyticsParams = {}) {
  return apiClient<AnalyticsDashboard>(
    `/admin/analytics${buildQueryString(params)}`,
  );
}

export function exportAnalyticsCsv(params: AnalyticsExportParams) {
  return apiClient<Blob>(
    `/admin/analytics/export${buildQueryString(params)}`,
    { blob: true },
  );
}
