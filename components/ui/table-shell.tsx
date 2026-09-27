export function TableShell({
  children,
  toolbar,
  footer,
}: {
  children: React.ReactNode;
  toolbar?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-white">
      {toolbar ? (
        <div className="flex flex-col gap-3 border-b border-[var(--border)] bg-[var(--surface)] p-4 sm:flex-row sm:items-end">
          {toolbar}
        </div>
      ) : null}
      <div className="overflow-x-auto">{children}</div>
      {footer}
    </div>
  );
}
