import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { Suspense } from "react";

import { PageHeader } from "@/components/ui/page-header";
import { TableSkeleton } from "@/components/ui/skeletons";
import { listRequests } from "@/lib/api/requests";
import { queryKeys } from "@/lib/query-keys";

import { RequestsTable } from "./requests-table";

const defaultParams = { page: 1, pageSize: 20 };

export default async function RequestsPage() {
  const queryClient = new QueryClient();
  try {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.requests.list(defaultParams),
      queryFn: () => listRequests(defaultParams),
    });
  } catch {
    // Client retries.
  }

  return (
    <>
      <PageHeader
        title="Blood Request Management"
        description="Supervise needs — not the happy path. Status is derived from the request + bookings. Assign creates a booking; escalate / rematch / rebroadcast re-run discovery."
      />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<TableSkeleton columns={8} rows={8} />}>
          <RequestsTable />
        </Suspense>
      </HydrationBoundary>
    </>
  );
}
