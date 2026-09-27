import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";

import { PageHeader } from "@/components/ui/page-header";
import { getSettings } from "@/lib/api/settings";
import { queryKeys } from "@/lib/query-keys";

import { SettingsTable } from "./settings-table";

export default async function SettingsPage() {
  const queryClient = new QueryClient();

  try {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.settings.all,
      queryFn: getSettings,
    });
  } catch {
    // Client form retries via useQuery.
  }

  return (
    <>
      <PageHeader
        title="Settings"
        description="Matching radius, eligibility interval, and maintenance mode — changes are audit-logged by the API."
      />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <SettingsTable />
      </HydrationBoundary>
    </>
  );
}
