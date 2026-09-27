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

  await queryClient.prefetchQuery({
    queryKey: queryKeys.verifications.list(defaultParams),
    queryFn: () => listVerifications(defaultParams),
  });

  return (
    <>
      <PageHeader
        title="Verifications"
        description="Review identity verification submissions and approve or reject from the queue."
      />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <VerificationsTable />
      </HydrationBoundary>
    </>
  );
}
