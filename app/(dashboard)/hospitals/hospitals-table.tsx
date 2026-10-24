"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { Building2 } from "lucide-react";
import { useMemo } from "react";
import { Suspense } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pagination } from "@/components/ui/pagination";
import { QueryError } from "@/components/ui/query-error";
import { ReloadButton } from "@/components/ui/reload-button";
import { Select } from "@/components/ui/select";
import { TableShell } from "@/components/ui/table-shell";
import { TruncatedText } from "@/components/ui/truncated-text";
import { useHospitals } from "@/hooks/use-hospitals";
import { ApiRequestError } from "@/lib/api/client";
import type { AdminHospitalListItem } from "@/types";

function HospitalsTableInner() {
  const {
    params,
    setParams,
    draftQuery,
    setDraftQuery,
    applyFilters,
    listQuery,
    authMutation,
  } = useHospitals();

  const columns = useMemo<ColumnDef<AdminHospitalListItem>[]>(
    () => [
      {
        id: "name",
        header: "Facility",
        cell: ({ row }) => (
          <div className="max-w-[16rem]">
            <TruncatedText
              text={row.original.name}
              className="font-medium"
              maxWidthClass="max-w-[16rem]"
            />
            {row.original.address ? (
              <TruncatedText
                text={row.original.address}
                className="text-xs text-(--ink-muted)"
                maxWidthClass="max-w-[16rem]"
              />
            ) : null}
          </div>
        ),
      },
      {
        id: "location",
        header: "Location",
        cell: ({ row }) => (
          <TruncatedText
            text={
              [row.original.city, row.original.state, row.original.region]
                .filter(Boolean)
                .join(", ") || "—"
            }
            maxWidthClass="max-w-[12rem]"
          />
        ),
      },
      {
        id: "authorized",
        header: "Blood collection",
        cell: ({ row }) => (
          <Badge
            tone={
              row.original.authorizedBloodCollection ? "success" : "neutral"
            }
          >
            {row.original.authorizedBloodCollection
              ? "Authorized"
              : "Not authorized"}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const hospital = row.original;
          const authorized = hospital.authorizedBloodCollection;
          const pending =
            authMutation.isPending &&
            authMutation.variables?.id === hospital.id;

          return (
            <Button
              size="sm"
              variant={authorized ? "secondary" : "primary"}
              disabled={pending}
              onClick={() =>
                authMutation.mutate({
                  id: hospital.id,
                  authorizedBloodCollection: !authorized,
                })
              }
            >
              {pending
                ? "Saving…"
                : authorized
                  ? "Revoke authorization"
                  : "Authorize collection"}
            </Button>
          );
        },
      },
    ],
    [authMutation],
  );

  const table = useReactTable({
    data: listQuery.data?.data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const meta = listQuery.data?.meta;

  return (
    <>
      {authMutation.isError ? (
        <p className="mb-3 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {authMutation.error instanceof ApiRequestError
            ? authMutation.error.message
            : "Couldn’t update blood-collection authorization."}
        </p>
      ) : null}

      <TableShell
        toolbar={
          <>
            <div className="w-full min-w-0 flex-1 sm:min-w-40">
              <Label htmlFor="hospital-query">Search</Label>
              <Input
                id="hospital-query"
                placeholder="Facility name…"
                value={draftQuery}
                onChange={(e) => setDraftQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applyFilters()}
              />
            </div>
            <div className="w-full sm:w-44">
              <Label htmlFor="hospital-auth">Authorization</Label>
              <Select
                id="hospital-auth"
                value={
                  params.authorizedBloodCollection === true
                    ? "true"
                    : params.authorizedBloodCollection === false
                      ? "false"
                      : ""
                }
                onChange={(e) =>
                  setParams((prev) => ({
                    ...prev,
                    authorizedBloodCollection:
                      e.target.value === "true"
                        ? true
                        : e.target.value === "false"
                          ? false
                          : "",
                    page: 1,
                  }))
                }
              >
                <option value="">All</option>
                <option value="true">Authorized</option>
                <option value="false">Not authorized</option>
              </Select>
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
          <EmptyState title="Loading facilities…" />
        ) : listQuery.isError ? (
          <QueryError
            title="Couldn’t load facilities"
            error={listQuery.error}
            onRetry={() => listQuery.refetch()}
          />
        ) : table.getRowModel().rows.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No facilities found"
            description="Welfare bookings only work at authorized blood-collection facilities."
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
    </>
  );
}

export function HospitalsTable() {
  return (
    <Suspense fallback={<EmptyState title="Loading facilities…" />}>
      <HospitalsTableInner />
    </Suspense>
  );
}
