"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { Building2, Plus } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Suspense } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal, ModalActions } from "@/components/ui/modal";
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
  const [creating, setCreating] = useState(false);
  const closeCreate = useCallback(() => setCreating(false), []);

  const {
    params,
    setParams,
    draftQuery,
    setDraftQuery,
    applyFilters,
    listQuery,
    createForm,
    createMutation,
    authMutation,
  } = useHospitals({ onActionSuccess: closeCreate });

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
      <div className="mb-4">
        <Button
          onClick={() => {
            createMutation.reset();
            createForm.reset({
              name: "",
              addressLine: "",
              city: "",
              state: "",
              latitude: undefined,
              longitude: undefined,
              authorizedBloodCollection: false,
            });
            setCreating(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Add facility
        </Button>
      </div>

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

      {creating ? (
        <Modal title="Create facility" onClose={closeCreate} wide>
          <form
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={createForm.handleSubmit((values) =>
              createMutation.mutate(values),
            )}
          >
            <div className="sm:col-span-2">
              <Label htmlFor="h-name">Name</Label>
              <Input id="h-name" {...createForm.register("name")} />
              {createForm.formState.errors.name ? (
                <p className="mt-1 text-xs text-(--danger)">
                  {createForm.formState.errors.name.message}
                </p>
              ) : null}
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="h-address">Address</Label>
              <Input id="h-address" {...createForm.register("addressLine")} />
            </div>
            <div>
              <Label htmlFor="h-city">City</Label>
              <Input id="h-city" {...createForm.register("city")} />
            </div>
            <div>
              <Label htmlFor="h-state">State</Label>
              <Input id="h-state" {...createForm.register("state")} />
            </div>
            <div>
              <Label htmlFor="h-lat">Latitude</Label>
              <Input
                id="h-lat"
                type="number"
                step="any"
                {...createForm.register("latitude")}
              />
              {createForm.formState.errors.latitude ? (
                <p className="mt-1 text-xs text-(--danger)">
                  {createForm.formState.errors.latitude.message}
                </p>
              ) : null}
            </div>
            <div>
              <Label htmlFor="h-lng">Longitude</Label>
              <Input
                id="h-lng"
                type="number"
                step="any"
                {...createForm.register("longitude")}
              />
              {createForm.formState.errors.longitude ? (
                <p className="mt-1 text-xs text-(--danger)">
                  {createForm.formState.errors.longitude.message}
                </p>
              ) : null}
            </div>
            <div className="sm:col-span-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="rounded border-(--border)"
                  checked={createForm.watch("authorizedBloodCollection")}
                  onChange={(e) =>
                    createForm.setValue(
                      "authorizedBloodCollection",
                      e.target.checked,
                    )
                  }
                />
                Authorize blood collection now
              </label>
            </div>
            {createMutation.error instanceof ApiRequestError ? (
              <p className="sm:col-span-2 text-sm text-(--danger)">
                {createMutation.error.message}
              </p>
            ) : null}
            <div className="sm:col-span-2">
              <ModalActions
                onCancel={closeCreate}
                pending={createMutation.isPending}
                label="Create"
              />
            </div>
          </form>
        </Modal>
      ) : null}
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
