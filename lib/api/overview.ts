import { apiClient } from "@/lib/api/client";
import type { OverviewDashboard } from "@/types";

interface OverviewApiResponse {
  message?: string;
  data?: OverviewDashboard;
}

function isOverviewDashboard(value: unknown): value is OverviewDashboard {
  return (
    typeof value === "object" &&
    value !== null &&
    "stats" in value &&
    "requestsLast30Days" in value
  );
}

/** GET /admin/overview — supports raw dashboard or `{ message, data }` envelope. */
export async function getOverview(): Promise<OverviewDashboard> {
  const raw = await apiClient<OverviewApiResponse | OverviewDashboard>(
    "/admin/overview",
  );

  if (isOverviewDashboard(raw)) {
    return normalizeOverview(raw);
  }

  if (raw && typeof raw === "object" && isOverviewDashboard(raw.data)) {
    return normalizeOverview(raw.data);
  }

  return {
    stats: {
      activeDonors: 0,
      pendingRequests: 0,
      matchesToday: 0,
      avgMatchTimeMinutes: 0,
    },
    requestsLast30Days: [],
    unmatchedAlerts: [],
    alertThresholdMinutes: 15,
  };
}

function normalizeOverview(data: OverviewDashboard): OverviewDashboard {
  return {
    stats: {
      activeDonors: data.stats?.activeDonors ?? 0,
      pendingRequests: data.stats?.pendingRequests ?? 0,
      matchesToday: data.stats?.matchesToday ?? 0,
      avgMatchTimeMinutes: data.stats?.avgMatchTimeMinutes ?? 0,
    },
    requestsLast30Days: data.requestsLast30Days ?? [],
    unmatchedAlerts: data.unmatchedAlerts ?? [],
    alertThresholdMinutes: data.alertThresholdMinutes ?? 15,
  };
}
