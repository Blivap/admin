import {
  PageHeaderSkeleton,
  OverviewSkeleton,
} from "@/components/ui/skeletons";

export default function OverviewLoading() {
  return (
    <div>
      <PageHeaderSkeleton />
      <OverviewSkeleton />
    </div>
  );
}
