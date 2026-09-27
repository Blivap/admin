import {
  CmsSkeleton,
  PageHeaderSkeleton,
} from "@/components/ui/skeletons";

export default function CmsLoading() {
  return (
    <div>
      <PageHeaderSkeleton />
      <CmsSkeleton />
    </div>
  );
}
