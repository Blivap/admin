import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { Suspense } from "react";

import { PageHeader } from "@/components/ui/page-header";
import { TableSkeleton } from "@/components/ui/skeletons";
import { listVerifications } from "@/lib/api/verifications";
import { queryKeys } from "@/lib/query-keys";

import { VerificationsTable } from "./verifications-table";

const defaultParams = { page: 1, pageSize: 20, status: "pending" as const };

export default async function VerificationsPage() {
  const queryClient = new QueryClient();
  try {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.verifications.list(defaultParams),
      queryFn: () => listVerifications(defaultParams),
    });
  } catch {
    // Client retries.
  }

  return (
    <>
      <PageHeader
        title="Verification Queue"
        description="Approve, reject (with reason), or flag suspicious donor/requester verification submissions."
      />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<TableSkeleton columns={6} rows={8} />}>
          <VerificationsTable />
        </Suspense>
      </HydrationBoundary>
    </>
  );
}
