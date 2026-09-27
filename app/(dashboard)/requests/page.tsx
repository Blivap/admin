import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";

import { PageHeader } from "@/components/ui/page-header";
import { listRequests } from "@/lib/api/requests";
import { queryKeys } from "@/lib/query-keys";

import { RequestsTable } from "./requests-table";

const defaultParams = { page: 1, pageSize: 20 };

export default async function RequestsPage() {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: queryKeys.requests.list(defaultParams),
    queryFn: () => listRequests(defaultParams),
  });

  return (
    <>
      <PageHeader
        title="Blood Requests"
        description="Monitor open requests, assign donors manually, escalate stuck matches, and inspect matching logs."
      />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <RequestsTable />
      </HydrationBoundary>
    </>
  );
}
