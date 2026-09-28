import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { Suspense } from "react";

import { PageHeader } from "@/components/ui/page-header";
import { TableSkeleton } from "@/components/ui/skeletons";
import { listUsers } from "@/lib/api/users";
import { queryKeys } from "@/lib/query-keys";

import { UsersTable } from "./users-table";

const defaultParams = { page: 1, pageSize: 20 };

export default async function UsersPage() {
  const queryClient = new QueryClient();
  try {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.users.list(defaultParams),
      queryFn: () => listUsers(defaultParams),
    });
  } catch {
    // Client retries.
  }

  return (
    <>
      <PageHeader
        title="User Management"
        description="Filter donors and requesters, open profiles, and run suspend / verify / merge actions."
      />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<TableSkeleton columns={8} rows={8} />}>
          <UsersTable />
        </Suspense>
      </HydrationBoundary>
    </>
  );
}
