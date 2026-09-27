export default function UsersLoading() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-40 animate-pulse rounded bg-[var(--surface-muted)]" />
      <div className="h-4 w-80 animate-pulse rounded bg-[var(--surface-muted)]" />
      <div className="h-72 animate-pulse rounded-lg border border-[var(--border)] bg-white" />
    </div>
  );
}
