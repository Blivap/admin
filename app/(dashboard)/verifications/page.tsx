import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";

import { PageHeader } from "@/components/ui/page-header";
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
        <VerificationsTable />
      </HydrationBoundary>
    </>
  );
}
