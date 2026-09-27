"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { TableShell } from "@/components/ui/table-shell";
import { Textarea } from "@/components/ui/textarea";
import { ApiRequestError } from "@/lib/api/client";
import {
  assignDonor,
  closeRequest,
  escalateRequest,
  getMatchingLog,
  listRequests,
} from "@/lib/api/requests";
import { BLOOD_TYPES } from "@/lib/constants";
import { queryKeys } from "@/lib/query-keys";
import { formatDate } from "@/lib/utils";
import type {
  AdminBloodRequestListItem,
  BloodRequestStatus,
  BloodType,
  RequestsListParams,
} from "@/types";

const assignSchema = z.object({
  donorId: z.string().min(1, "Donor ID is required"),
  note: z.string().optional(),
});

const escalateSchema = z.object({
  reason: z.string().min(5, "Provide a reason (at least 5 characters)"),
});

type AssignFormValues = z.infer<typeof assignSchema>;
type EscalateFormValues = z.infer<typeof escalateSchema>;

type Panel =
  | { type: "assign"; request: AdminBloodRequestListItem }
  | { type: "escalate"; request: AdminBloodRequestListItem }
  | { type: "log"; request: AdminBloodRequestListItem }
  | null;

function statusTone(status: BloodRequestStatus) {
  switch (status) {
    case "open":
      return "info" as const;
    case "matched":
      return "success" as const;
    case "cancelled":
      return "danger" as const;
    default:
      return "neutral" as const;
  }
}

export function RequestsTable() {
  const queryClient = useQueryClient();
  const [params, setParams] = useState<RequestsListParams>({
    page: 1,
    pageSize: 20,
    query: "",
    bloodType: "",
    status: "",
    urgent: "",
  });
  const [draftQuery, setDraftQuery] = useState("");
  const [panel, setPanel] = useState<Panel>(null);

  const listQuery = useQuery({
    queryKey: queryKeys.requests.list(params),
    queryFn: () => listRequests(params),
  });

  const matchingLogRequestId =
    panel?.type === "log" ? panel.request.id : "";

  const matchingLogQuery = useQuery({
    queryKey: queryKeys.requests.matchingLog(matchingLogRequestId),
    queryFn: () => getMatchingLog(matchingLogRequestId),
    enabled: Boolean(matchingLogRequestId),
  });
  const assignForm = useForm<AssignFormValues>({
    resolver: zodResolver(assignSchema),
    defaultValues: { donorId: "", note: "" },
  });

  const escalateForm = useForm<EscalateFormValues>({
    resolver: zodResolver(escalateSchema),
    defaultValues: { reason: "" },
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.requests.all });
  };

  const assignMutation = useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string;
      values: AssignFormValues;
    }) => assignDonor(id, values),
    onSuccess: async () => {
      setPanel(null);
      assignForm.reset();
      await invalidate();
    },
  });

  const escalateMutation = useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string;
      values: EscalateFormValues;
    }) => escalateRequest(id, values),
    onSuccess: async () => {
      setPanel(null);
      escalateForm.reset();
      await invalidate();
    },
  });

  const closeMutation = useMutation({
    mutationFn: (id: string) => closeRequest(id),
    onSuccess: invalidate,
  });

  const columns = useMemo<ColumnDef<AdminBloodRequestListItem>[]>(
    () => [
      {
        id: "request",
        header: "Request",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.requesterName}</p>
            <p className="text-xs text-[var(--ink-muted)]">
              {row.original.id.slice(0, 8)}…
            </p>
          </div>
        ),
      },
      {
        accessorKey: "neededBloodType",
        header: "Blood",
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Badge tone={statusTone(row.original.status)}>
              {row.original.status}
            </Badge>
            {row.original.urgent ? <Badge tone="danger">Urgent</Badge> : null}
          </div>
        ),
      },
      {
        id: "location",
        header: "Location",
        cell: ({ row }) =>
          [row.original.city, row.original.state].filter(Boolean).join(", ") ||
          "—",
      },
      {
        id: "matched",
        header: "Matched donor",
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
            <div className="flex flex-wrap gap-1.5">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setPanel({ type: "log", request });
                }}
              >
                Log
              </Button>
              {request.status === "open" ? (
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
                      escalateForm.reset({ reason: "" });
                      setPanel({ type: "escalate", request });
                    }}
                  >
                    Escalate
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    disabled={closeMutation.isPending}
                    onClick={() => closeMutation.mutate(request.id)}
                  >
                    Close
                  </Button>
                </>
              ) : null}
            </div>
          );
        },
      },
    ],
    [assignForm, closeMutation, escalateForm],
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
            <div className="min-w-[200px] flex-1">
              <Label htmlFor="request-query">Search</Label>
              <Input
                id="request-query"
                placeholder="Requester, ID…"
                value={draftQuery}
                onChange={(e) => setDraftQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setParams((prev) => ({
                      ...prev,
                      query: draftQuery,
                      page: 1,
                    }));
                  }
                }}
              />
            </div>
            <div className="w-full sm:w-32">
              <Label htmlFor="req-blood">Blood type</Label>
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
                {BLOOD_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </Select>
            </div>
            <div className="w-full sm:w-36">
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
                <option value="open">Open</option>
                <option value="matched">Matched</option>
                <option value="closed">Closed</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            </div>
            <div className="w-full sm:w-32">
              <Label htmlFor="req-urgent">Urgent</Label>
              <Select
                id="req-urgent"
                value={params.urgent ?? ""}
                onChange={(e) =>
                  setParams((prev) => ({
                    ...prev,
                    urgent: e.target.value as "" | "true" | "false",
                    page: 1,
                  }))
                }
              >
                <option value="">All</option>
                <option value="true">Urgent only</option>
                <option value="false">Non-urgent</option>
              </Select>
            </div>
            <Button
              variant="secondary"
              onClick={() =>
                setParams((prev) => ({
                  ...prev,
                  query: draftQuery,
                  page: 1,
                }))
              }
            >
              Apply
            </Button>
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
                : "Something went wrong."
            }
          />
        ) : table.getRowModel().rows.length === 0 ? (
          <EmptyState title="No requests found" />
        ) : (
          <table>
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
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
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </TableShell>

      {panel?.type === "assign" ? (
        <Modal
          title="Assign donor"
          description={`Manually match a donor to request ${panel.request.id.slice(0, 8)}…`}
          onClose={() => setPanel(null)}
        >
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
              <Label htmlFor="assign-note">Note (optional)</Label>
              <Textarea id="assign-note" {...assignForm.register("note")} />
            </div>
            {assignMutation.error instanceof ApiRequestError ? (
              <p className="text-sm text-[var(--danger)]">
                {assignMutation.error.message}
              </p>
            ) : null}
            <ModalActions
              onCancel={() => setPanel(null)}
              pending={assignMutation.isPending}
              submitLabel="Assign donor"
            />
          </form>
        </Modal>
      ) : null}

      {panel?.type === "escalate" ? (
        <Modal
          title="Escalate request"
          description="Flag this request for priority ops follow-up. Audit logged server-side."
          onClose={() => setPanel(null)}
        >
          <form
            className="space-y-4"
            onSubmit={escalateForm.handleSubmit((values) =>
              escalateMutation.mutate({ id: panel.request.id, values }),
            )}
          >
            <div>
              <Label htmlFor="escalate-reason">Reason</Label>
              <Textarea
                id="escalate-reason"
                {...escalateForm.register("reason")}
              />
              {escalateForm.formState.errors.reason ? (
                <p className="mt-1 text-xs text-[var(--danger)]">
                  {escalateForm.formState.errors.reason.message}
                </p>
              ) : null}
            </div>
            {escalateMutation.error instanceof ApiRequestError ? (
              <p className="text-sm text-[var(--danger)]">
                {escalateMutation.error.message}
              </p>
            ) : null}
            <ModalActions
              onCancel={() => setPanel(null)}
              pending={escalateMutation.isPending}
              submitLabel="Escalate"
              danger
            />
          </form>
        </Modal>
      ) : null}

      {panel?.type === "log" ? (
        <Modal
          title="Matching log"
          description={`Events for request ${panel.request.id.slice(0, 8)}…`}
          onClose={() => setPanel(null)}
          wide
        >
          {matchingLogQuery.isLoading ? (
            <EmptyState title="Loading matching log…" />
          ) : matchingLogQuery.isError ? (
            <EmptyState
              title="Couldn’t load matching log"
              description={
                matchingLogQuery.error instanceof ApiRequestError
                  ? matchingLogQuery.error.message
                  : undefined
              }
            />
          ) : (matchingLogQuery.data?.length ?? 0) === 0 ? (
            <EmptyState title="No matching events yet" />
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <table>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Event</th>
                    <th>Donor</th>
                    <th>Distance</th>
                    <th>Message</th>
                  </tr>
                </thead>
                <tbody>
                  {matchingLogQuery.data?.map((entry) => (
                    <tr key={entry.id}>
                      <td className="whitespace-nowrap">
                        {formatDate(entry.createdAt)}
                      </td>
                      <td>{entry.event}</td>
                      <td>{entry.donorName ?? entry.donorId ?? "—"}</td>
                      <td>
                        {entry.distanceKm != null
                          ? `${entry.distanceKm.toFixed(1)} km`
                          : "—"}
                      </td>
                      <td>{entry.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-4 flex justify-end">
            <Button variant="secondary" onClick={() => setPanel(null)}>
              Close
            </Button>
          </div>
        </Modal>
      ) : null}
    </>
  );
}

function Modal({
  title,
  description,
  onClose,
  children,
  wide,
}: {
  title: string;
  description: string;
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
        className={`w-full rounded-lg border border-[var(--border)] bg-white p-6 shadow-xl ${wide ? "max-w-3xl" : "max-w-md"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-[var(--ink)]">{title}</h2>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">{description}</p>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

function ModalActions({
  onCancel,
  pending,
  submitLabel,
  danger,
}: {
  onCancel: () => void;
  pending: boolean;
  submitLabel: string;
  danger?: boolean;
}) {
  return (
    <div className="flex justify-end gap-2">
      <Button type="button" variant="secondary" onClick={onCancel}>
        Cancel
      </Button>
      <Button
        type="submit"
        variant={danger ? "danger" : "primary"}
        disabled={pending}
      >
        {pending ? "Saving…" : submitLabel}
      </Button>
    </div>
  );
}
