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
import { Modal, ModalActions } from "@/components/ui/modal";
import { Pagination } from "@/components/ui/pagination";
import { ReloadButton } from "@/components/ui/reload-button";
import { Select } from "@/components/ui/select";
import { TableShell } from "@/components/ui/table-shell";
import { Textarea } from "@/components/ui/textarea";
import { TruncatedText } from "@/components/ui/truncated-text";
import {
  canIntervene,
  STATUS_WRITE_OPTIONS,
  useRequests,
} from "@/hooks/use-requests";
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
  | { type: "rematch"; request: AdminBloodRequestListItem }
  | { type: "status"; request: AdminBloodRequestListItem }
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

function urgencyTone(urgency: UrgencyLevel) {
  switch (urgency) {
    case "critical":
      return "danger" as const;
    case "urgent":
      return "warning" as const;
    default:
      return "neutral" as const;
  }
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-(--ink-muted)">{label}</p>
      <p className="font-medium text-(--ink)">{value}</p>
    </div>
  );
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
    statusForm,
    rematchForm,
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
            className="max-w-[12rem] text-left"
            onClick={() => openRequest(row.original.id)}
          >
            <TruncatedText
              text={row.original.requesterName}
              className="font-medium text-(--brand) hover:underline"
              maxWidthClass="max-w-[12rem]"
            />
            <p className="text-xs text-(--ink-muted)">
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
          <Badge tone={urgencyTone(row.original.urgency)}>
            {row.original.urgency}
          </Badge>
        ),
      },
      {
        id: "region",
        header: "Region",
        cell: ({ row }) => (
          <TruncatedText
            text={
              [row.original.city, row.original.state || row.original.region]
                .filter(Boolean)
                .join(", ") || "—"
            }
            maxWidthClass="max-w-[10rem]"
          />
        ),
      },
      {
        id: "matched",
        header: "Donor",
        cell: ({ row }) => (
          <TruncatedText
            text={row.original.matchedDonorName ?? "—"}
            maxWidthClass="max-w-[10rem]"
          />
        ),
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
          const open = canIntervene(request.status);
          return (
            <div className="flex flex-nowrap gap-1">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => openRequest(request.id, "matches")}
              >
                Bookings
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  statusForm.reset({
                    status: request.status,
                    reason: "",
                  });
                  setPanel({ type: "status", request });
                }}
              >
                Status
              </Button>
              {open ? (
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
                      escalateForm.reset({ reason: "", radiusKm: undefined });
                      setPanel({ type: "escalate", request });
                    }}
                  >
                    Escalate
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      rematchForm.reset({ note: "" });
                      setPanel({ type: "rematch", request });
                    }}
                  >
                    Rematch
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      rebroadcastForm.reset({
                        mode: "same",
                        donorId: "",
                        radiusKm: undefined,
                      });
                      setPanel({ type: "rebroadcast", request });
                    }}
                  >
                    Rebroadcast
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
      rematchForm,
      statusForm,
    ],
  );

  const table = useReactTable({
    data: listQuery.data?.data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const meta = listQuery.data?.meta;
  const detail = detailQuery.data;

  return (
    <>
      <TableShell
        toolbar={
          <>
            <div className="w-full min-w-0 flex-1 sm:min-w-[160px]">
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
                placeholder="State / region"
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
          !listQuery.isLoading && !listQuery.isError ? (
            <Pagination
              page={meta?.page ?? params.page ?? 1}
              totalPages={meta?.totalPages ?? 1}
              total={meta?.total}
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
          ) : detail ? (
            <div className="space-y-5 text-sm">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Requester" value={detail.requesterName} />
                <Field label="Email" value={detail.requesterEmail || "—"} />
                <Field label="Phone" value={detail.requesterPhone || "—"} />
                <Field label="Blood" value={detail.neededBloodType} />
                <Field label="Status (derived)" value={detail.status} />
                <Field label="Urgency" value={detail.urgency} />
                <Field
                  label="Location"
                  value={
                    [detail.city, detail.state || detail.region]
                      .filter(Boolean)
                      .join(", ") || "—"
                  }
                />
                <Field
                  label="Matched donor"
                  value={
                    detail.matchedDonorName
                      ? `${detail.matchedDonorName}${
                          detail.matchedDonorId
                            ? ` (${detail.matchedDonorId.slice(0, 8)}…)`
                            : ""
                        }`
                      : "—"
                  }
                />
                <Field
                  label="Search radius"
                  value={
                    detail.currentRadiusKm != null
                      ? `${detail.currentRadiusKm} km`
                      : "—"
                  }
                />
                <Field label="Created" value={formatDate(detail.createdAt)} />
                <Field
                  label="Updated"
                  value={formatDate(detail.updatedAt)}
                />
                <Field
                  label="Escalated"
                  value={
                    detail.escalatedAt
                      ? `${formatDate(detail.escalatedAt)}${
                          detail.escalatedReason
                            ? ` · ${detail.escalatedReason}`
                            : ""
                        }`
                      : "—"
                  }
                />
              </div>
              <div>
                <p className="text-xs text-(--ink-muted)">Notes</p>
                <p className="mt-1 whitespace-pre-wrap">
                  {detail.notes || "—"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 border-t border-(--border) pt-4">
                <Button
                  variant="secondary"
                  className="w-full sm:w-auto"
                  onClick={() => openRequest(detail.id, "matches")}
                >
                  View bookings
                </Button>
                <Button
                  variant="secondary"
                  className="w-full sm:w-auto"
                  onClick={clearRequest}
                >
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
        <Modal title="Linked bookings" onClose={clearRequest} wide>
          <p className="mb-3 text-sm text-(--ink-muted)">
            Bookings tied to this need via bloodRequestId — not raw geo match
            candidates. Escalate / rematch / rebroadcast only appear here after
            someone books.
          </p>
          {matchesQuery.isLoading ? (
            <EmptyState title="Loading bookings…" />
          ) : matchesQuery.isError ? (
            <EmptyState
              title="Couldn’t load bookings"
              description={
                matchesQuery.error instanceof ApiRequestError
                  ? matchesQuery.error.message
                  : undefined
              }
            />
          ) : (matchesQuery.data?.length ?? 0) === 0 ? (
            <EmptyState
              title="No bookings yet"
              description="Assign a donor to create a booking, or wait for the requester to book from matching results."
            />
          ) : (
            <div className="max-h-96 overflow-x-auto overflow-y-auto">
              <table>
                <thead>
                  <tr>
                    <th>Donor</th>
                    <th>Booked</th>
                    <th>Booking status</th>
                    <th>Response time</th>
                    <th>Distance</th>
                  </tr>
                </thead>
                <tbody>
                  {matchesQuery.data?.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <div>
                          <p className="font-medium">{m.donorName}</p>
                          <p className="text-xs text-(--ink-muted)">
                            {m.donorId.slice(0, 8)}…
                          </p>
                        </div>
                      </td>
                      <td>{formatDate(m.notifiedAt)}</td>
                      <td>{m.response?.replace(/_/g, " ") ?? "—"}</td>
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
          <div className="mt-4 border-t border-(--border) pt-4">
            <Button
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={clearRequest}
            >
              Close
            </Button>
          </div>
        </Modal>
      ) : null}

      {panel?.type === "assign" ? (
        <Modal title="Assign donor" onClose={closeActionPanel}>
          <p className="mb-3 text-sm text-(--ink-muted)">
            Creates a booking for this need and sets the request to matched.
          </p>
          <form
            className="space-y-4"
            onSubmit={assignForm.handleSubmit((values) =>
              assignMutation.mutate({ id: panel.request.id, values }),
            )}
          >
            <div>
              <Label htmlFor="donor-id">Donor user ID</Label>
              <Input id="donor-id" {...assignForm.register("donorId")} />
              {assignForm.formState.errors.donorId ? (
                <p className="mt-1 text-xs text-(--danger)">
                  {assignForm.formState.errors.donorId.message}
                </p>
              ) : null}
            </div>
            <div>
              <Label htmlFor="assign-note">Note (optional)</Label>
              <Textarea id="assign-note" {...assignForm.register("note")} />
            </div>
            {assignMutation.error instanceof ApiRequestError ? (
              <p className="text-sm text-(--danger)">
                {assignMutation.error.message}
              </p>
            ) : null}
            <ModalActions
              onCancel={closeActionPanel}
              pending={assignMutation.isPending}
              label="Assign & book"
            />
          </form>
        </Modal>
      ) : null}

      {panel?.type === "escalate" ? (
        <Modal title="Escalate" onClose={closeActionPanel}>
          <p className="mb-3 text-sm text-(--ink-muted)">
            Sets urgency to critical, widens search radius, and re-runs donor
            discovery. Does not create a booking.
          </p>
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
              <p className="text-sm text-(--danger)">
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

      {panel?.type === "rematch" ? (
        <Modal title="Rematch" onClose={closeActionPanel}>
          <p className="mb-3 text-sm text-(--ink-muted)">
            Re-runs discovery at the current radius. Does not create a booking.
          </p>
          <form
            className="space-y-4"
            onSubmit={rematchForm.handleSubmit((values) =>
              rematchMutation.mutate({ id: panel.request.id, values }),
            )}
          >
            <div>
              <Label htmlFor="rematch-note">Note (optional)</Label>
              <Textarea id="rematch-note" {...rematchForm.register("note")} />
            </div>
            {rematchMutation.error instanceof ApiRequestError ? (
              <p className="text-sm text-(--danger)">
                {rematchMutation.error.message}
              </p>
            ) : null}
            <ModalActions
              onCancel={closeActionPanel}
              pending={rematchMutation.isPending}
              label="Rematch"
            />
          </form>
        </Modal>
      ) : null}

      {panel?.type === "rebroadcast" ? (
        <Modal title="Rebroadcast" onClose={closeActionPanel}>
          <p className="mb-3 text-sm text-(--ink-muted)">
            Notify again at the same radius, a wider radius, or force a specific
            donor. Does not create a booking unless someone books afterward.
          </p>
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
                <option value="same">Same radius</option>
                <option value="wider_radius">Wider radius</option>
                <option value="force_donor">Force specific donor</option>
              </Select>
            </div>
            {rebroadcastForm.watch("mode") === "wider_radius" ? (
              <div>
                <Label htmlFor="rb-radius">Radius (km)</Label>
                <Input
                  id="rb-radius"
                  type="number"
                  {...rebroadcastForm.register("radiusKm")}
                />
              </div>
            ) : null}
            {rebroadcastForm.watch("mode") === "force_donor" ? (
              <div>
                <Label htmlFor="rb-donor">Donor user ID</Label>
                <Input
                  id="rb-donor"
                  {...rebroadcastForm.register("donorId")}
                />
                {rebroadcastForm.formState.errors.donorId ? (
                  <p className="mt-1 text-xs text-(--danger)">
                    {rebroadcastForm.formState.errors.donorId.message}
                  </p>
                ) : null}
              </div>
            ) : null}
            {rebroadcastMutation.error instanceof ApiRequestError ? (
              <p className="text-sm text-(--danger)">
                {rebroadcastMutation.error.message}
              </p>
            ) : null}
            <ModalActions
              onCancel={closeActionPanel}
              pending={rebroadcastMutation.isPending}
              label="Rebroadcast"
            />
          </form>
        </Modal>
      ) : null}

      {panel?.type === "status" ? (
        <Modal title="Update status" onClose={closeActionPanel}>
          <p className="mb-3 text-sm text-(--ink-muted)">
            Force the stored domain status to catch up. List status is often
            derived from bookings — use this when ops need to reopen, fulfill,
            expire, or cancel.
          </p>
          <form
            className="space-y-4"
            onSubmit={statusForm.handleSubmit((values) =>
              statusMutation.mutate({
                id: panel.request.id,
                status: values.status,
                reason: values.reason,
              }),
            )}
          >
            <div>
              <Label htmlFor="req-status-change">Write status</Label>
              <Select
                id="req-status-change"
                value={statusForm.watch("status")}
                onChange={(e) =>
                  statusForm.setValue(
                    "status",
                    e.target.value as BloodRequestStatus,
                  )
                }
              >
                {STATUS_WRITE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
              <p className="mt-1 text-xs text-(--ink-muted)">
                {
                  STATUS_WRITE_OPTIONS.find(
                    (o) => o.value === statusForm.watch("status"),
                  )?.hint
                }
              </p>
            </div>
            <div>
              <Label htmlFor="status-reason">Reason (optional)</Label>
              <Textarea
                id="status-reason"
                {...statusForm.register("reason")}
              />
            </div>
            {statusMutation.error instanceof ApiRequestError ? (
              <p className="text-sm text-(--danger)">
                {statusMutation.error.message}
              </p>
            ) : null}
            <ModalActions
              onCancel={closeActionPanel}
              pending={statusMutation.isPending}
              label="Save status"
            />
          </form>
        </Modal>
      ) : null}
    </>
  );
}
