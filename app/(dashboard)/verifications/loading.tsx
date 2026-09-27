import {
  PageHeaderSkeleton,
  TableSkeleton,
} from "@/components/ui/skeletons";

export default function VerificationsLoading() {
  return (
    <div>
      <PageHeaderSkeleton />
      <TableSkeleton columns={5} />
    </div>
  );
}
