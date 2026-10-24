import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { Suspense } from "react";

import { PageHeader } from "@/components/ui/page-header";
import { TableSkeleton } from "@/components/ui/skeletons";
import { listHospitals } from "@/lib/api/hospitals";
import { queryKeys } from "@/lib/query-keys";

import { HospitalsTable } from "./hospitals-table";

const defaultParams = { page: 1, pageSize: 20 };

export default async function HospitalsPage() {
  const queryClient = new QueryClient();
  try {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.hospitals.list(defaultParams),
      queryFn: () => listHospitals(defaultParams),
    });
  } catch {
    // Client retries.
  }

  return (
    <>
      <PageHeader
        title="Facilities"
        description="Authorize hospitals for blood collection. Welfare bookings are rejected at any facility that is not authorized."
      />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<TableSkeleton columns={4} rows={8} />}>
          <HospitalsTable />
        </Suspense>
      </HydrationBoundary>
    </>
  );
}
