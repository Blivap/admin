import {
  PageHeaderSkeleton,
  TableSkeleton,
} from "@/components/ui/skeletons";

export default function SupportLoading() {
  return (
    <div>
      <PageHeaderSkeleton />
      <TableSkeleton columns={6} />
    </div>
  );
}
