"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { useCallback, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pagination } from "@/components/ui/pagination";
import { ReloadButton } from "@/components/ui/reload-button";
import { Select } from "@/components/ui/select";
import { TableShell } from "@/components/ui/table-shell";
import { Textarea } from "@/components/ui/textarea";
import { useRequests } from "@/hooks/use-requests";
import { ApiRequestError } from "@/lib/api/client";
import { BLOOD_TYPES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import type {
  AdminBloodRequestListItem,
  BloodRequestStatus,
  BloodType,
  UrgencyLevel,
} from "@/types";

type Panel =
  | { type: "assign"; request: AdminBloodRequestListItem }
  | { type: "escalate"; request: AdminBloodRequestListItem }
  | { type: "rebroadcast"; request: AdminBloodRequestListItem }
  | null;

function statusTone(status: BloodRequestStatus) {
  switch (status) {
    case "active":
      return "info" as const;
    case "matched":
    case "fulfilled":
      return "success" as const;
    case "expired":
    case "cancelled":
      return "danger" as const;
    default:
      return "neutral" as const;
  }
}

export function RequestsTable() {
  const [panel, setPanel] = useState<Panel>(null);
  const closeActionPanel = useCallback(() => setPanel(null), []);

  const {
    params,
    setParams,
    draftQuery,
    setDraftQuery,
    draftRegion,
    setDraftRegion,
    applyFilters,
    requestId,
    view,
    openRequest,
    clearRequest,
    listQuery,
    detailQuery,
    matchesQuery,
    assignForm,
    escalateForm,
    rebroadcastForm,
    assignMutation,
    escalateMutation,
    rematchMutation,
    statusMutation,
    rebroadcastMutation,
  } = useRequests({
    onActionSuccess: closeActionPanel,
  });

  const showDetail = Boolean(requestId) && view !== "matches";
  const showMatches = Boolean(requestId) && view === "matches";

  const columns = useMemo<ColumnDef<AdminBloodRequestListItem>[]>(
    () => [
      {
        id: "request",
        header: "Request",
        cell: ({ row }) => (
          <button
            type="button"
            className="text-left"
            onClick={() => openRequest(row.original.id)}
          >
            <p className="font-medium text-[var(--brand)] hover:underline">
              {row.original.requesterName}
            </p>
            <p className="text-xs text-[var(--ink-muted)]">
              {row.original.id.slice(0, 8)}…
            </p>
          </button>
        ),
      },
      { accessorKey: "neededBloodType", header: "Blood" },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge tone={statusTone(row.original.status)}>
            {row.original.status}
          </Badge>
        ),
      },
      {
        accessorKey: "urgency",
        header: "Urgency",
        cell: ({ row }) => (
          <Badge
            tone={row.original.urgency === "normal" ? "neutral" : "danger"}
          >
            {row.original.urgency}
          </Badge>
        ),
      },
      {
        id: "region",
        header: "Region",
        cell: ({ row }) =>
          [row.original.city, row.original.region].filter(Boolean).join(", ") ||
          "—",
      },
      {
        id: "matched",
        header: "Donor",
        cell: ({ row }) => row.original.matchedDonorName ?? "—",
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ getValue }) => formatDate(getValue<string>()),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const request = row.original;
          return (
            <div className="flex flex-wrap gap-1">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => openRequest(request.id, "matches")}
              >
                Matches
              </Button>
              {request.status === "active" ? (
                <>
                  <Button
                    size="sm"
                    onClick={() => {
                      assignForm.reset({ donorId: "", note: "" });
                      setPanel({ type: "assign", request });
                    }}
                  >
                    Assign
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      escalateForm.reset({});
                      setPanel({ type: "escalate", request });
                    }}
                  >
                    Escalate
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={rematchMutation.isPending}
                    onClick={() => rematchMutation.mutate(request.id)}
                  >
                    Rematch
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      rebroadcastForm.reset({ mode: "same" });
                      setPanel({ type: "rebroadcast", request });
                    }}
                  >
                    Rebroadcast
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    disabled={statusMutation.isPending}
                    onClick={() =>
                      statusMutation.mutate({
                        id: request.id,
                        status: "cancelled",
                      })
                    }
                  >
                    Cancel
                  </Button>
                </>
              ) : null}
            </div>
          );
        },
      },
    ],
    [
      assignForm,
      escalateForm,
      openRequest,
      rebroadcastForm,
      rematchMutation,
      statusMutation,
    ],
  );

  const table = useReactTable({
    data: listQuery.data?.data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const meta = listQuery.data?.meta;

  return (
    <>
      <TableShell
        toolbar={
          <>
            <div className="min-w-[160px] flex-1">
              <Label htmlFor="req-query">Search</Label>
              <Input
                id="req-query"
                value={draftQuery}
                onChange={(e) => setDraftQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                placeholder="Requester, ID…"
              />
            </div>
            <div className="w-full sm:w-28">
              <Label htmlFor="req-blood">Blood</Label>
              <Select
                id="req-blood"
                value={params.bloodType ?? ""}
                onChange={(e) =>
                  setParams((prev) => ({
                    ...prev,
                    bloodType: e.target.value as BloodType | "",
                    page: 1,
                  }))
                }
              >
                <option value="">All</option>
                {BLOOD_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </div>
            <div className="w-full sm:w-32">
              <Label htmlFor="req-status">Status</Label>
              <Select
                id="req-status"
                value={params.status ?? ""}
                onChange={(e) =>
                  setParams((prev) => ({
                    ...prev,
                    status: e.target.value as BloodRequestStatus | "",
                    page: 1,
                  }))
                }
              >
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="matched">Matched</option>
                <option value="fulfilled">Fulfilled</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            </div>
            <div className="w-full sm:w-32">
              <Label htmlFor="req-urgency">Urgency</Label>
              <Select
                id="req-urgency"
                value={params.urgency ?? ""}
                onChange={(e) =>
                  setParams((prev) => ({
                    ...prev,
                    urgency: e.target.value as UrgencyLevel | "",
                    page: 1,
                  }))
                }
              >
                <option value="">All</option>
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
                <option value="critical">Critical</option>
              </Select>
            </div>
            <div className="w-full sm:w-32">
              <Label htmlFor="req-region">Region</Label>
              <Input
                id="req-region"
                value={draftRegion}
                onChange={(e) => setDraftRegion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                placeholder="Region"
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
          <EmptyState title="Loading requests…" />
        ) : listQuery.isError ? (
          <EmptyState
            title="Couldn’t load requests"
            description={
              listQuery.error instanceof ApiRequestError
                ? listQuery.error.message
                : undefined
            }
          />
        ) : table.getRowModel().rows.length === 0 ? (
          <EmptyState title="No requests found" />
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

      {showDetail ? (
        <Modal title="Request detail" onClose={clearRequest} wide>
          {detailQuery.isLoading ? (
            <EmptyState title="Loading…" />
          ) : detailQuery.data ? (
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-[var(--ink-muted)]">Requester:</span>{" "}
                {detailQuery.data.requesterName}
              </p>
              <p>
                <span className="text-[var(--ink-muted)]">Blood:</span>{" "}
                {detailQuery.data.neededBloodType}
              </p>
              <p>
                <span className="text-[var(--ink-muted)]">Status:</span>{" "}
                {detailQuery.data.status} · {detailQuery.data.urgency}
              </p>
              <p>
                <span className="text-[var(--ink-muted)]">Radius:</span>{" "}
                {detailQuery.data.currentRadiusKm != null
                  ? `${detailQuery.data.currentRadiusKm} km`
                  : "—"}
              </p>
              <p>
                <span className="text-[var(--ink-muted)]">Notes:</span>{" "}
                {detailQuery.data.notes || "—"}
              </p>
              <div className="flex justify-end pt-2">
                <Button variant="secondary" onClick={clearRequest}>
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <EmptyState title="Not found" />
          )}
        </Modal>
      ) : null}

      {showMatches ? (
        <Modal title="Matching log" onClose={clearRequest} wide>
          {matchesQuery.isLoading ? (
            <EmptyState title="Loading matches…" />
          ) : matchesQuery.isError ? (
            <EmptyState
              title="Couldn’t load matches"
              description={
                matchesQuery.error instanceof ApiRequestError
                  ? matchesQuery.error.message
                  : undefined
              }
            />
          ) : (matchesQuery.data?.length ?? 0) === 0 ? (
            <EmptyState title="No match events yet" />
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <table>
                <thead>
                  <tr>
                    <th>Donor</th>
                    <th>Notified</th>
                    <th>Response</th>
                    <th>Time</th>
                    <th>Distance</th>
                  </tr>
                </thead>
                <tbody>
                  {matchesQuery.data?.map((m) => (
                    <tr key={m.id}>
                      <td>{m.donorName}</td>
                      <td>{formatDate(m.notifiedAt)}</td>
                      <td>{m.response ?? "—"}</td>
                      <td>
                        {m.responseTimeSeconds != null
                          ? `${m.responseTimeSeconds}s`
                          : "—"}
                      </td>
                      <td>
                        {m.distanceKm != null
                          ? `${m.distanceKm.toFixed(1)} km`
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-4 flex justify-end">
            <Button variant="secondary" onClick={clearRequest}>
              Close
            </Button>
          </div>
        </Modal>
      ) : null}

      {panel?.type === "assign" ? (
        <Modal title="Assign donor" onClose={closeActionPanel}>
          <form
            className="space-y-4"
            onSubmit={assignForm.handleSubmit((values) =>
              assignMutation.mutate({ id: panel.request.id, values }),
            )}
          >
            <div>
              <Label htmlFor="donor-id">Donor ID</Label>
              <Input id="donor-id" {...assignForm.register("donorId")} />
              {assignForm.formState.errors.donorId ? (
                <p className="mt-1 text-xs text-[var(--danger)]">
                  {assignForm.formState.errors.donorId.message}
                </p>
              ) : null}
            </div>
            <div>
              <Label htmlFor="assign-note">Note</Label>
              <Textarea id="assign-note" {...assignForm.register("note")} />
            </div>
            {assignMutation.error instanceof ApiRequestError ? (
              <p className="text-sm text-[var(--danger)]">
                {assignMutation.error.message}
              </p>
            ) : null}
            <ModalActions
              onCancel={closeActionPanel}
              pending={assignMutation.isPending}
              label="Assign"
            />
          </form>
        </Modal>
      ) : null}

      {panel?.type === "escalate" ? (
        <Modal title="Escalate radius" onClose={closeActionPanel}>
          <form
            className="space-y-4"
            onSubmit={escalateForm.handleSubmit((values) =>
              escalateMutation.mutate({ id: panel.request.id, values }),
            )}
          >
            <div>
              <Label htmlFor="radius">Wider radius (km)</Label>
              <Input
                id="radius"
                type="number"
                {...escalateForm.register("radiusKm")}
              />
            </div>
            <div>
              <Label htmlFor="esc-reason">Reason</Label>
              <Textarea id="esc-reason" {...escalateForm.register("reason")} />
            </div>
            {escalateMutation.error instanceof ApiRequestError ? (
              <p className="text-sm text-[var(--danger)]">
                {escalateMutation.error.message}
              </p>
            ) : null}
            <ModalActions
              onCancel={closeActionPanel}
              pending={escalateMutation.isPending}
              label="Escalate"
            />
          </form>
        </Modal>
      ) : null}

      {panel?.type === "rebroadcast" ? (
        <Modal title="Rebroadcast / override" onClose={closeActionPanel}>
          <form
            className="space-y-4"
            onSubmit={rebroadcastForm.handleSubmit((values) =>
              rebroadcastMutation.mutate({ id: panel.request.id, values }),
            )}
          >
            <div>
              <Label htmlFor="rb-mode">Mode</Label>
              <Select
                id="rb-mode"
                value={rebroadcastForm.watch("mode")}
                onChange={(e) =>
                  rebroadcastForm.setValue(
                    "mode",
                    e.target.value as "same" | "wider_radius" | "force_donor",
                  )
                }
              >
                <option value="same">Re-broadcast same radius</option>
                <option value="wider_radius">Wider radius</option>
                <option value="force_donor">Force-notify specific donor</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="rb-radius">Radius (km)</Label>
              <Input
                id="rb-radius"
                type="number"
                {...rebroadcastForm.register("radiusKm")}
              />
            </div>
            <div>
              <Label htmlFor="rb-donor">Donor ID (force mode)</Label>
              <Input id="rb-donor" {...rebroadcastForm.register("donorId")} />
            </div>
            {rebroadcastMutation.error instanceof ApiRequestError ? (
              <p className="text-sm text-[var(--danger)]">
                {rebroadcastMutation.error.message}
              </p>
            ) : null}
            <ModalActions
              onCancel={closeActionPanel}
              pending={rebroadcastMutation.isPending}
              label="Send"
            />
          </form>
        </Modal>
      ) : null}
    </>
  );
}

function Modal({
  title,
  onClose,
  children,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className={`max-h-[90vh] w-full overflow-y-auto rounded-lg border border-[var(--border)] bg-white p-6 shadow-xl ${wide ? "max-w-3xl" : "max-w-md"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold">{title}</h2>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

function ModalActions({
  onCancel,
  pending,
  label,
}: {
  onCancel: () => void;
  pending: boolean;
  label: string;
}) {
  return (
    <div className="flex justify-end gap-2">
      <Button type="button" variant="secondary" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : label}
      </Button>
    </div>
  );
}
