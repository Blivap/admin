import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";

import { PageHeader } from "@/components/ui/page-header";
import { getCmsContent } from "@/lib/api/cms";
import { queryKeys } from "@/lib/query-keys";

import { CmsEditor } from "./cms-table";

export default async function CmsPage() {
  const queryClient = new QueryClient();
  try {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.cms.all,
      queryFn: getCmsContent,
    });
  } catch {
    // Client retries.
  }

  return (
    <>
      <PageHeader
        title="Content / CMS"
        description="Edit landing copy, FAQs, and testimonials shown on public surfaces."
      />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <CmsEditor />
      </HydrationBoundary>
    </>
  );
}
