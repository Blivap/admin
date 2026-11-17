import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { Suspense } from "react";

import { PageHeader } from "@/components/ui/page-header";
import { TableSkeleton } from "@/components/ui/skeletons";
import { listSupportTickets } from "@/lib/api/support";
import { queryKeys } from "@/lib/query-keys";

import { SupportTicketsTable } from "./support-tickets-table";

const defaultParams = { page: 1, pageSize: 20, status: "open" as const };

export default async function SupportPage() {
  const queryClient = new QueryClient();
  try {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.support.list(defaultParams),
      queryFn: () => listSupportTickets(defaultParams),
    });
  } catch {
    // Client retries.
  }

  return (
    <>
      <PageHeader
        title="Support Tickets"
        description="Claim, update status, and read chat transcripts via blivap-backend /admin/support."
      />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<TableSkeleton columns={6} rows={8} />}>
          <SupportTicketsTable />
        </Suspense>
      </HydrationBoundary>
    </>
  );
}
