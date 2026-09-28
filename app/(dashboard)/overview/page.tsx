import { PageHeader } from "@/components/ui/page-header";

import { OverviewPanel } from "./overview-panel";

export default function OverviewPage() {
  return (
    <>
      <PageHeader
        title="Overview"
        description="Live ops snapshot — donors, pending requests, match speed, and unmatched urgent alerts."
      />
      <OverviewPanel />
    </>
  );
}
