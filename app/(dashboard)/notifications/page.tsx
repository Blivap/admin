import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";

import { PageHeader } from "@/components/ui/page-header";
import { listNotifications } from "@/lib/api/notifications";
import { queryKeys } from "@/lib/query-keys";

import { NotificationsTable } from "./notifications-table";

const defaultParams = { page: 1, pageSize: 20 };

export default async function NotificationsPage() {
  const queryClient = new QueryClient();

  try {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.notifications.list(defaultParams),
      queryFn: () => listNotifications(defaultParams),
    });
  } catch {
    // Client table retries via useQuery.
  }

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Compose broadcasts, inspect delivery stats, and review individual messages."
      />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <NotificationsTable />
      </HydrationBoundary>
    </>
  );
}
