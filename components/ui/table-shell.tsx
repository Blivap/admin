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
    <div className="rounded-lg border border-[var(--border)] bg-white">
      {toolbar ? (
        <div className="relative z-10 flex flex-col gap-3 overflow-visible border-b border-[var(--border)] bg-[var(--surface)] p-4 sm:flex-row sm:items-end">
          {toolbar}
        </div>
      ) : null}
      <div className="overflow-x-auto">{children}</div>
      {footer}
    </div>
  );
}
