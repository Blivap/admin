import {
  AnalyticsSkeleton,
  PageHeaderSkeleton,
} from "@/components/ui/skeletons";

export default function AnalyticsLoading() {
  return (
    <div>
      <PageHeaderSkeleton />
      <AnalyticsSkeleton />
    </div>
  );
}
