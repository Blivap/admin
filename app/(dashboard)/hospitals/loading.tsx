import { TableSkeleton } from "@/components/ui/skeletons";

export default function HospitalsLoading() {
  return <TableSkeleton columns={4} rows={8} />;
}
