"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { EmptyState } from "@/components/ui/empty-state";
import { Label } from "@/components/ui/label";
import { Pagination } from "@/components/ui/pagination";
import { QueryError } from "@/components/ui/query-error";
import { ReloadButton } from "@/components/ui/reload-button";
import { Select } from "@/components/ui/select";
import { TableShell } from "@/components/ui/table-shell";
import { TruncatedText } from "@/components/ui/truncated-text";
import { AUDIT_ACTION_OPTIONS, useAudit } from "@/hooks/use-audit";
import { formatDate, shortId } from "@/lib/utils";
import type { AuditLogEntry } from "@/types";

export function AuditTable() {
  const {
    params,
    setParams,
    draftFrom,
    setDraftFrom,
    draftTo,
    setDraftTo,
    applyFilters,
    listQuery,
  } = useAudit();

  const columns = useMemo<ColumnDef<AuditLogEntry>[]>(
    () => [
      {
        accessorKey: "createdAt",
        header: "Timestamp",
        cell: ({ getValue }) => formatDate(getValue<string | null>()),
      },
      {
        accessorKey: "action",
        header: "Action",
        cell: ({ getValue }) => (
          <TruncatedText
            text={getValue<string>() || "—"}
            className="rounded bg-(--surface-muted) px-1.5 py-0.5 font-mono text-xs"
            maxWidthClass="max-w-[12rem]"
          />
        ),
      },
      {
        id: "admin",
        header: "Admin",
        cell: ({ row }) => {
          const name =
            row.original.adminName ||
            row.original.adminEmail ||
            shortId(row.original.adminId) ||
            "System / unknown";
          const subtitle =
            row.original.adminName && row.original.adminEmail
              ? row.original.adminEmail
              : shortId(row.original.adminId);

          return (
            <div className="max-w-[12rem]">
              <TruncatedText
                text={name}
                className="font-medium"
                maxWidthClass="max-w-[12rem]"
              />
              {subtitle ? (
                <TruncatedText
                  text={subtitle}
                  className="text-xs text-(--ink-muted)"
                  maxWidthClass="max-w-[12rem]"
                />
              ) : null}
            </div>
          );
        },
      },
      {
        id: "resource",
        header: "Resource",
        cell: ({ row }) => {
          const type = row.original.resourceType;
          const id = shortId(row.original.resourceId);
          const label =
            !type && !id
              ? "—"
              : type && id
                ? `${type}:${id}`
                : type || id || "—";
          return (
            <TruncatedText text={label} maxWidthClass="max-w-[12rem]" />
          );
        },
      },
    ],
    [],
  );

  const table = useReactTable({
    data: listQuery.data?.data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const meta = listQuery.data?.meta;

  return (
    <TableShell
      toolbar={
        <>
          <div className="w-full sm:w-48">
            <Label htmlFor="audit-action">Action type</Label>
            <Select
              id="audit-action"
              value={params.action ?? ""}
              onChange={(e) =>
                setParams((prev) => ({
                  ...prev,
                  action: e.target.value,
                  page: 1,
                }))
              }
            >
              <option value="">All</option>
              {AUDIT_ACTION_OPTIONS.filter(Boolean).map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="audit-from">From</Label>
            <DatePicker
              id="audit-from"
              value={draftFrom}
              onChange={(e) => setDraftFrom(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="audit-to">To</Label>
            <DatePicker
              id="audit-to"
              value={draftTo}
              onChange={(e) => setDraftTo(e.target.value)}
            />
          </div>
          <Button variant="secondary" onClick={applyFilters}>
            Apply
          </Button>
          <ReloadButton
            onReload={() => listQuery.refetch()}
            loading={listQuery.isFetching}
          />
        </>
      }
      footer={
        meta ? (
          <Pagination
            page={meta.page}
            totalPages={meta.totalPages}
            onPageChange={(page) => setParams((prev) => ({ ...prev, page }))}
          />
        ) : null
      }
    >
      {listQuery.isLoading ? (
        <EmptyState title="Loading audit logs…" />
      ) : listQuery.isError ? (
        <QueryError
          title="Couldn’t load audit logs"
          error={listQuery.error}
          onRetry={() => listQuery.refetch()}
        />
      ) : table.getRowModel().rows.length === 0 ? (
        <EmptyState
          title="No audit entries"
          description="Try a different action or date range."
        />
      ) : (
        <table>
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th key={h.id}>
                    {h.isPlaceholder
                      ? null
                      : flexRender(h.column.columnDef.header, h.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </TableShell>
  );
}
