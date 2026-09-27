import {
  PageHeaderSkeleton,
  TableSkeleton,
} from "@/components/ui/skeletons";

export default function UsersLoading() {
  return (
    <div>
      <PageHeaderSkeleton />
      <TableSkeleton columns={8} />
    </div>
  );
}
