import {
  PageHeaderSkeleton,
  TableSkeleton,
} from "@/components/ui/skeletons";

export default function ModuleLoading() {
  return (
    <div>
      <PageHeaderSkeleton />
      <TableSkeleton />
    </div>
  );
}
