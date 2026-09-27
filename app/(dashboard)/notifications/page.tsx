import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";

import { PageHeader } from "@/components/ui/page-header";
import { listNotificationHistory } from "@/lib/api/notifications";
import { queryKeys } from "@/lib/query-keys";

import { NotificationsTable } from "./notifications-table";

const defaultParams = { page: 1, pageSize: 20 };

export default async function NotificationsPage() {
  const queryClient = new QueryClient();
  try {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.notifications.history(defaultParams),
      queryFn: () => listNotificationHistory(defaultParams),
    });
  } catch {
    // Client retries.
  }

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Monitor auto urgent broadcasts and compose system announcements, campaigns, DMs, and re-engagement nudges."
      />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <NotificationsTable />
      </HydrationBoundary>
    </>
  );
}
