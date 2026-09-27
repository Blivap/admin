export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="px-4 py-16 text-center">
      <p className="text-sm font-medium text-[var(--ink)]">{title}</p>
      {description ? (
        <p className="mt-1 text-sm text-[var(--ink-muted)]">{description}</p>
      ) : null}
    </div>
  );
}
