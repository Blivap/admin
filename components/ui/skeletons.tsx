import { Skeleton } from "@/components/ui/skeleton";
import { TableShell } from "@/components/ui/table-shell";

export function PageHeaderSkeleton() {
  return (
    <div className="mb-6 space-y-2">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-80 max-w-full" />
    </div>
  );
}

export function TableSkeleton({
  columns = 6,
  rows = 8,
  withToolbar = true,
}: {
  columns?: number;
  rows?: number;
  withToolbar?: boolean;
}) {
  return (
    <TableShell
      toolbar={
        withToolbar ? (
          <>
            <Skeleton className="h-9 min-w-[160px] flex-1" />
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-24" />
          </>
        ) : undefined
      }
      footer={
        <div className="flex items-center justify-between border-t border-[var(--border)] px-4 py-3">
          <Skeleton className="h-4 w-28" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      }
    >
      <table>
        <thead>
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i}>
                <Skeleton className="h-3 w-16" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, row) => (
            <tr key={row}>
              {Array.from({ length: columns }).map((_, col) => (
                <td key={col}>
                  <Skeleton
                    className={
                      col === 0 ? "h-4 w-36" : col === columns - 1 ? "h-8 w-20" : "h-4 w-20"
                    }
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </TableShell>
  );
}

export function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-[var(--border)] bg-white px-4 py-3"
          >
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-3 h-8 w-16" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="rounded-lg border border-[var(--border)] bg-white p-4 lg:col-span-3">
          <Skeleton className="mb-4 h-4 w-40" />
          <Skeleton className="h-[260px] w-full" />
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-white lg:col-span-2">
          <div className="border-b border-[var(--border)] px-4 py-3">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="mt-2 h-3 w-32" />
          </div>
          <div className="divide-y divide-[var(--border)]">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex justify-between gap-2 px-4 py-3">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-36" />
                </div>
                <Skeleton className="h-5 w-14" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function FormSkeleton({ fields = 6 }: { fields?: number }) {
  return (
    <div className="max-w-xl space-y-5 rounded-lg border border-[var(--border)] bg-white p-6">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-9 w-full" />
        </div>
      ))}
      <Skeleton className="h-10 w-32" />
    </div>
  );
}

export function CmsSkeleton() {
  return (
    <div className="space-y-8">
      {Array.from({ length: 3 }).map((_, section) => (
        <section key={section} className="space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-8 w-16" />
          </div>
          {Array.from({ length: 2 }).map((_, card) => (
            <div
              key={card}
              className="space-y-3 rounded-lg border border-[var(--border)] bg-white p-4"
            >
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </section>
      ))}
      <Skeleton className="h-10 w-40" />
    </div>
  );
}

export function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-lg border border-[var(--border)] bg-white p-4 sm:flex-row sm:items-end">
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-28 sm:ml-auto" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-[var(--border)] bg-white px-4 py-3"
          >
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-3 h-8 w-16" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-[var(--border)] bg-white p-4"
          >
            <Skeleton className="mb-4 h-4 w-40" />
            <Skeleton className="h-[260px] w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DetailPanelSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>
      <Skeleton className="h-4 w-36" />
      <Skeleton className="h-28 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-8 w-32" />
      </div>
    </div>
  );
}
