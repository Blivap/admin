import {
  PageHeaderSkeleton,
  TableSkeleton,
} from "@/components/ui/skeletons";

export default function NotificationsLoading() {
  return (
    <div>
      <PageHeaderSkeleton />
      <TableSkeleton columns={6} />
    </div>
  );
}
