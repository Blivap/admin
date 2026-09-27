import {
  FormSkeleton,
  PageHeaderSkeleton,
} from "@/components/ui/skeletons";

export default function SettingsLoading() {
  return (
    <div>
      <PageHeaderSkeleton />
      <FormSkeleton />
    </div>
  );
}
