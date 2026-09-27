import {
  PageHeaderSkeleton,
  TableSkeleton,
} from "@/components/ui/skeletons";

export default function AuditLoading() {
  return (
    <div>
      <PageHeaderSkeleton />
      <TableSkeleton columns={4} rows={10} />
    </div>
  );
}
