import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";

import { PageHeader } from "@/components/ui/page-header";
import { listWelfarePackages } from "@/lib/api/welfare";
import { queryKeys } from "@/lib/query-keys";

import { WelfareTable } from "./welfare-table";

export default async function WelfarePage() {
  const queryClient = new QueryClient();

  try {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.welfare.all,
      queryFn: listWelfarePackages,
    });
  } catch {
    // Client retries via useQuery.
  }

  return (
    <>
      <PageHeader
        title="Welfare"
        description="Set the amount donors receive for each care item. Add new items and change prices whenever you need to."
      />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <WelfareTable />
      </HydrationBoundary>
    </>
  );
}
