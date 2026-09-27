import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { formatISO, subDays } from "date-fns";

import { PageHeader } from "@/components/ui/page-header";
import { getAnalytics } from "@/lib/api/analytics";
import { queryKeys } from "@/lib/query-keys";

import { AnalyticsDashboard } from "./analytics-table";

const defaultParams = {
  from: formatISO(subDays(new Date(), 30), { representation: "date" }),
  to: formatISO(new Date(), { representation: "date" }),
};

export default async function AnalyticsPage() {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: queryKeys.analytics.dashboard(defaultParams),
    queryFn: () => getAnalytics(defaultParams),
  });

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Operational trends across requests, matches, and donations — with CSV export."
      />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <AnalyticsDashboard initialParams={defaultParams} />
      </HydrationBoundary>
    </>
  );
}
