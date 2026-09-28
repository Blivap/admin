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
import { ReloadButton } from "@/components/ui/reload-button";
import { Select } from "@/components/ui/select";
import { TableShell } from "@/components/ui/table-shell";
import { AUDIT_ACTION_OPTIONS, useAudit } from "@/hooks/use-audit";
import { ApiRequestError } from "@/lib/api/client";
import { formatDate } from "@/lib/utils";
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
        cell: ({ getValue }) => formatDate(getValue<string>()),
      },
      {
        accessorKey: "action",
        header: "Action",
        cell: ({ getValue }) => (
          <code className="rounded bg-(--surface-muted) px-1.5 py-0.5 text-xs">
            {getValue<string>()}
          </code>
        ),
      },
      {
        id: "admin",
        header: "Admin",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">
              {row.original.adminName || row.original.adminEmail}
            </p>
            <p className="text-xs text-(--ink-muted)">
              {row.original.adminId.slice(0, 8)}…
            </p>
          </div>
        ),
      },
      {
        id: "resource",
        header: "Resource",
        cell: ({ row }) =>
          row.original.resourceType
            ? `${row.original.resourceType}${row.original.resourceId ? `:${row.original.resourceId.slice(0, 8)}…` : ""}`
            : "—",
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
        <EmptyState
          title="Couldn’t load audit logs"
          description={
            listQuery.error instanceof ApiRequestError
              ? listQuery.error.message
              : undefined
          }
        />
      ) : table.getRowModel().rows.length === 0 ? (
        <EmptyState title="No audit entries" />
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
