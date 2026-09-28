import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { Suspense } from "react";

import { PageHeader } from "@/components/ui/page-header";
import { TableSkeleton } from "@/components/ui/skeletons";
import { listAuditLogs } from "@/lib/api/audit";
import { queryKeys } from "@/lib/query-keys";

import { AuditTable } from "./audit-table";

const defaultParams = { page: 1, pageSize: 25 };

export default async function AuditPage() {
  const queryClient = new QueryClient();
  try {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.audit.list(defaultParams),
      queryFn: () => listAuditLogs(defaultParams),
    });
  } catch {
    // Client retries.
  }

  return (
    <>
      <PageHeader
        title="Audit Log"
        description="Read-only trail of admin actions. Mutations are logged server-side by AuditInterceptor — this UI never writes logs."
      />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<TableSkeleton columns={5} rows={8} />}>
          <AuditTable />
        </Suspense>
      </HydrationBoundary>
    </>
  );
}
