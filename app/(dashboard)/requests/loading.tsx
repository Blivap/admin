import {
  PageHeaderSkeleton,
  TableSkeleton,
} from "@/components/ui/skeletons";

export default function RequestsLoading() {
  return (
    <div>
      <PageHeaderSkeleton />
      <TableSkeleton columns={8} />
    </div>
  );
}
