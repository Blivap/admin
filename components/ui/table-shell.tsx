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
    <div className="rounded-lg border border-(--border) bg-white">
      {toolbar ? (
        <div className="relative z-10 flex flex-col gap-3 overflow-visible border-b border-(--border) bg-(--surface) p-3 sm:flex-row sm:flex-wrap sm:items-end sm:p-4">
          {toolbar}
        </div>
      ) : null}
      <div className="-mx-px overflow-x-auto overscroll-x-contain [scrollbar-gutter:stable]">
        {children}
      </div>
      {footer}
    </div>
  );
}
