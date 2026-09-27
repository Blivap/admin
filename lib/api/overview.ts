import { apiClient } from "@/lib/api/client";
import type { OverviewDashboard } from "@/types";

export function getOverview() {
  return apiClient<OverviewDashboard>("/admin/overview");
}
