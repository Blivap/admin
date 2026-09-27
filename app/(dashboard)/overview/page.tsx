import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";

import { PageHeader } from "@/components/ui/page-header";
import { getOverview } from "@/lib/api/overview";
import { queryKeys } from "@/lib/query-keys";

import { OverviewPanel } from "./overview-panel";

export default async function OverviewPage() {
  const queryClient = new QueryClient();
  try {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.overview.all,
      queryFn: getOverview,
    });
  } catch {
    // Client retries via useQuery.
  }

  return (
    <>
      <PageHeader
        title="Overview"
        description="Live ops snapshot — donors, pending requests, match speed, and unmatched urgent alerts."
      />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <OverviewPanel />
      </HydrationBoundary>
    </>
  );
}
