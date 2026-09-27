import { apiClient } from "@/lib/api/client";
import { buildQueryString } from "@/lib/utils";
import type {
  AnalyticsOverview,
  AnalyticsParams,
  DonorsAnalytics,
  RequestsAnalytics,
} from "@/types";

export function getAnalyticsOverview(params: AnalyticsParams = {}) {
  return apiClient<AnalyticsOverview>(
    `/admin/analytics/overview${buildQueryString(params)}`,
  );
}

export function getDonorsAnalytics(params: AnalyticsParams = {}) {
  return apiClient<DonorsAnalytics>(
    `/admin/analytics/donors${buildQueryString(params)}`,
  );
}

export function getRequestsAnalytics(params: AnalyticsParams = {}) {
  return apiClient<RequestsAnalytics>(
    `/admin/analytics/requests${buildQueryString(params)}`,
  );
}

export function exportAnalyticsCsv(params: AnalyticsParams = {}) {
  return apiClient<Blob>(
    `/admin/analytics/export${buildQueryString({ ...params, type: "csv" })}`,
    { blob: true },
  );
}
