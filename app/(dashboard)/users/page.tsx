import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";

import { PageHeader } from "@/components/ui/page-header";
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
    // Client table retries via useQuery.
  }

  return (
    <>
      <PageHeader
        title="Users"
        description="Search donors and requesters, review status, and suspend accounts when needed."
      />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <UsersTable />
      </HydrationBoundary>
    </>
  );
}
