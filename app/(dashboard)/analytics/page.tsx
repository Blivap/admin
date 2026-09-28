import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { formatISO, subDays } from "date-fns";
import { Suspense } from "react";

import { PageHeader } from "@/components/ui/page-header";
import {
  getAnalyticsOverview,
  getDonorsAnalytics,
  getRequestsAnalytics,
} from "@/lib/api/analytics";
import { queryKeys } from "@/lib/query-keys";

import { AnalyticsDashboard } from "./analytics-table";

const defaultParams = {
  from: formatISO(subDays(new Date(), 30), { representation: "date" }),
  to: formatISO(new Date(), { representation: "date" }),
};

function AnalyticsFallback() {
  return (
    <div className="h-64 animate-pulse rounded-lg border border-(--border) bg-(--surface)" />
  );
}

export default async function AnalyticsPage() {
  const queryClient = new QueryClient();
  try {
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: queryKeys.analytics.overview(defaultParams),
        queryFn: () => getAnalyticsOverview(defaultParams),
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.analytics.donors({
          ...defaultParams,
          groupBy: "bloodType",
        }),
        queryFn: () =>
          getDonorsAnalytics({ ...defaultParams, groupBy: "bloodType" }),
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.analytics.requests(defaultParams),
        queryFn: () => getRequestsAnalytics(defaultParams),
      }),
    ]);
  } catch {
    // Client retries.
  }

  return (
    <>
      <PageHeader
        title="Analytics & Reports"
        description="Donor growth, fulfillment rates, match-time trends, and CSV export."
      />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<AnalyticsFallback />}>
          <AnalyticsDashboard initialParams={defaultParams} />
        </Suspense>
      </HydrationBoundary>
    </>
  );
}
