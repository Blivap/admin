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
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Pagination } from "@/components/ui/pagination";
import { ReloadButton } from "@/components/ui/reload-button";
import { Select } from "@/components/ui/select";
import { TableShell } from "@/components/ui/table-shell";
import { Textarea } from "@/components/ui/textarea";
import { TruncatedText } from "@/components/ui/truncated-text";
import {
  SUPPORT_TICKET_STATUSES,
  canClaimTicket,
  nextTicketStatuses,
  useSupport,
} from "@/hooks/use-support";
import { ApiRequestError } from "@/lib/api/client";
import { formatDate } from "@/lib/utils";
import type {
  AdminSupportTicket,
  SupportTicketPriority,
  SupportTicketStatus,
} from "@/types";

type Panel = { type: "status"; ticket: AdminSupportTicket } | null;

function statusTone(status: SupportTicketStatus) {
  switch (status) {
    case "resolved":
    case "closed":
      return "success" as const;
    case "cancelled":
      return "danger" as const;
    case "escalated":
    case "waiting_on_user":
    case "waiting_on_internal":
      return "warning" as const;
    case "in_progress":
    case "assigned":
      return "info" as const;
    default:
      return "neutral" as const;
  }
}

function priorityTone(priority: SupportTicketPriority) {
  switch (priority) {
    case "urgent":
      return "danger" as const;
    case "high":
      return "warning" as const;
    case "low":
      return "neutral" as const;
    default:
      return "info" as const;
  }
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-(--ink-muted)">{label}</p>
      <p className="font-medium text-(--ink)">{value || "—"}</p>
    </div>
  );
}

/** Human labels for ticket source values. */
function sourceLabel(source?: string | null) {
  if (!source) return "—";
  const labels: Record<string, string> = {
    human_requested: "Human requested",
    low_confidence: "Low confidence",
    no_knowledge: "No knowledge",
    knowledge_requires_human: "Needs human",
    security_report: "Security report",
    unauthorized_charge: "Unauthorized charge",
    complaint: "Complaint",
    emergency: "Emergency",
    medical_emergency: "Medical emergency",
    action_failed: "Action failed",
    tool_loop_limit: "Tool loop limit",
    prompt_injection: "Prompt injection",
    follow_up_unresolved: "Follow-up unresolved",
    repeated_question: "Repeated question",
    frustrated_unresolved: "Frustrated / unresolved",
    repeated_failure: "Repeated failure",
    admin_created: "Admin created",
    other: "Other",
  };
  return labels[source] ?? source.replaceAll("_", " ");
}

function senderLabel(senderType: string) {
  switch (senderType) {
    case "user":
      return "User";
    case "agent":
      return "Agent";
    case "bot":
      return "Bot";
    case "system":
      return "System";
    default:
      return senderType;
  }
}

export function SupportTicketsTable() {
  const [panel, setPanel] = useState<Panel>(null);
  const closePanel = useCallback(() => setPanel(null), []);

  const {
    setParams,
    draftStatus,
    setDraftStatus,
    applyFilters,
    ticketId,
    openTicket,
    clearTicket,
    listQuery,
    detailQuery,
    messagesQuery,
    statusForm,
    claimMutation,
    statusMutation,
  } = useSupport({ onActionSuccess: closePanel });

  const columns = useMemo<ColumnDef<AdminSupportTicket>[]>(
    () => [
      {
        id: "ticket",
        header: "Ticket",
        cell: ({ row }) => (
          <button
            type="button"
            className="max-w-[14rem] text-left"
            onClick={() => openTicket(row.original.id)}
          >
            <TruncatedText
              text={row.original.subject || row.original.ticketNumber}
              className="font-medium text-(--brand) hover:underline"
              maxWidthClass="max-w-[14rem]"
            />
            <p className="text-xs text-(--ink-muted)">
              {row.original.ticketNumber}
            </p>
          </button>
        ),
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ getValue }) => (
          <TruncatedText
            text={getValue<string>() || "—"}
            maxWidthClass="max-w-[8rem]"
          />
        ),
      },
      {
        accessorKey: "priority",
        header: "Priority",
        cell: ({ row }) => (
          <Badge tone={priorityTone(row.original.priority)}>
            {row.original.priority}
          </Badge>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <div className="flex flex-wrap items-center gap-1">
            <Badge tone={statusTone(row.original.status)}>
              {row.original.status}
            </Badge>
            {row.original.breachedAt ? (
              <Badge tone="danger">SLA</Badge>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: "source",
        header: "Source",
        cell: ({ row }) => (
          <TruncatedText
            text={sourceLabel(row.original.source)}
            maxWidthClass="max-w-[9rem]"
          />
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Opened",
        cell: ({ getValue }) => formatDate(getValue<string>()),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const item = row.original;
          const next = nextTicketStatuses(item.status);
          return (
            <div className="flex flex-nowrap gap-1">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => openTicket(item.id)}
              >
                View
              </Button>
              {canClaimTicket(item.status) ? (
                <Button
                  size="sm"
                  disabled={claimMutation.isPending}
                  onClick={() => claimMutation.mutate(item.id)}
                >
                  Claim
                </Button>
              ) : null}
              {next.length > 0 ? (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    statusForm.reset({
                      status: next[0],
                      resolution: "",
                      cancelReason: "",
                      note: "",
                    });
                    setPanel({ type: "status", ticket: item });
                  }}
                >
                  Status
                </Button>
              ) : null}
            </div>
          );
        },
      },
    ],
    [claimMutation, openTicket, statusForm],
  );

  const table = useReactTable({
    data: listQuery.data?.data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const meta = listQuery.data?.meta;
  const detail = detailQuery.data;
  const detailNext = detail ? nextTicketStatuses(detail.status) : [];

  return (
    <>
      <TableShell
        toolbar={
          <>
            <div className="w-full sm:w-48">
              <Label htmlFor="support-status">Status</Label>
              <Select
                id="support-status"
                value={draftStatus === "all" ? "" : draftStatus}
                onChange={(e) => setDraftStatus(e.target.value || "all")}
              >
                <option value="">All</option>
                {SUPPORT_TICKET_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </Select>
            </div>
            <Button
              variant="secondary"
              onClick={() => {
                applyFilters();
              }}
            >
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
          <EmptyState title="Loading tickets…" />
        ) : listQuery.isError ? (
          <EmptyState
            title="Couldn’t load support tickets"
            description={
              listQuery.error instanceof ApiRequestError
                ? listQuery.error.message
                : undefined
            }
          />
        ) : table.getRowModel().rows.length === 0 ? (
          <EmptyState title="No tickets in this filter" />
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

      {ticketId ? (
        <Modal title="Support ticket" onClose={clearTicket} wide>
          {detailQuery.isLoading ? (
            <EmptyState title="Loading ticket…" />
          ) : detailQuery.isError ? (
            <EmptyState
              title="Couldn’t load ticket"
              description={
                detailQuery.error instanceof ApiRequestError
                  ? detailQuery.error.message
                  : undefined
              }
            />
          ) : detail ? (
            <div className="space-y-4 text-sm">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Ticket #" value={detail.ticketNumber} />
                <div>
                  <p className="text-xs text-(--ink-muted)">Status</p>
                  <div className="flex flex-wrap items-center gap-1">
                    <Badge tone={statusTone(detail.status)}>
                      {detail.status}
                    </Badge>
                    {detail.breachedAt ? (
                      <Badge tone="danger">SLA breached</Badge>
                    ) : null}
                  </div>
                </div>
                <Field label="Subject" value={detail.subject} />
                <Field label="Category" value={detail.category} />
                <div>
                  <p className="text-xs text-(--ink-muted)">Priority</p>
                  <Badge tone={priorityTone(detail.priority)}>
                    {detail.priority}
                  </Badge>
                </div>
                <Field label="Source" value={sourceLabel(detail.source)} />
                <Field label="Opened" value={formatDate(detail.createdAt)} />
                <Field
                  label="Status changed"
                  value={formatDate(detail.statusChangedAt)}
                />
                <Field
                  label="First response"
                  value={formatDate(detail.firstResponseAt)}
                />
                <Field
                  label="Resolved"
                  value={formatDate(detail.resolvedAt)}
                />
                <Field
                  label="Assigned agent"
                  value={detail.assignedAgentId ?? "—"}
                />
                <Field label="User ID" value={detail.userId ?? "—"} />
                <Field
                  label="Conversation"
                  value={detail.conversationId || "—"}
                />
              </div>

              {detail.description ? (
                <div>
                  <p className="mb-1 text-xs text-(--ink-muted)">Description</p>
                  <p className="whitespace-pre-wrap text-(--ink)">
                    {detail.description}
                  </p>
                </div>
              ) : null}

              {detail.resolution ? (
                <div>
                  <p className="mb-1 text-xs text-(--ink-muted)">Resolution</p>
                  <p>{detail.resolution}</p>
                </div>
              ) : null}

              {detail.escalationReason ? (
                <div>
                  <p className="mb-1 text-xs text-(--ink-muted)">
                    Escalation reason
                  </p>
                  <p>{detail.escalationReason}</p>
                </div>
              ) : null}

              {detail.cancelReason ? (
                <div>
                  <p className="mb-1 text-xs text-(--ink-muted)">Cancel reason</p>
                  <p>{detail.cancelReason}</p>
                </div>
              ) : null}

              <div className="border-t border-(--border) pt-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-(--ink-muted)">
                  Chat transcript
                  {messagesQuery.data?.conversationId
                    ? ` · ${messagesQuery.data.conversationId.slice(0, 8)}…`
                    : ""}
                </p>
                {messagesQuery.isLoading ? (
                  <EmptyState title="Loading messages…" />
                ) : messagesQuery.isError ? (
                  <EmptyState
                    title="Couldn’t load messages"
                    description={
                      messagesQuery.error instanceof ApiRequestError
                        ? messagesQuery.error.message
                        : undefined
                    }
                  />
                ) : (messagesQuery.data?.data.length ?? 0) === 0 ? (
                  <EmptyState title="No messages yet" />
                ) : (
                  <ul className="max-h-72 space-y-3 overflow-y-auto rounded-md border border-(--border) p-3">
                    {messagesQuery.data!.data.map((msg) => (
                      <li key={msg.id} className="text-sm">
                        <div className="mb-0.5 flex flex-wrap items-baseline gap-2">
                          <span className="font-medium text-(--ink)">
                            {senderLabel(String(msg.senderType))}
                          </span>
                          {msg.messageType && msg.messageType !== "text" ? (
                            <Badge tone="neutral">{msg.messageType}</Badge>
                          ) : null}
                          <span className="text-xs text-(--ink-muted)">
                            {formatDate(msg.createdAt)}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap text-(--ink)">
                          {msg.content}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex flex-wrap gap-2 border-t border-(--border) pt-4">
                {canClaimTicket(detail.status) ? (
                  <Button
                    size="sm"
                    disabled={claimMutation.isPending}
                    onClick={() => claimMutation.mutate(detail.id)}
                  >
                    Claim
                  </Button>
                ) : null}
                {detailNext.length > 0 ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      statusForm.reset({
                        status: detailNext[0],
                        resolution: "",
                        cancelReason: "",
                        note: "",
                      });
                      setPanel({ type: "status", ticket: detail });
                    }}
                  >
                    Update status
                  </Button>
                ) : null}
                <Button
                  variant="secondary"
                  className="w-full sm:ml-auto sm:w-auto"
                  onClick={clearTicket}
                >
                  Close
                </Button>
              </div>

              {claimMutation.error instanceof ApiRequestError ? (
                <p className="text-sm text-(--danger)">
                  {claimMutation.error.message}
                </p>
              ) : null}
            </div>
          ) : (
            <EmptyState title="Not found" />
          )}
        </Modal>
      ) : null}

      {panel?.type === "status" ? (
        <Modal title="Update ticket status" onClose={closePanel}>
          <p className="mb-4 text-sm text-(--ink-muted)">
            {panel.ticket.ticketNumber} — {panel.ticket.subject}
          </p>
          <form
            className="space-y-4"
            onSubmit={statusForm.handleSubmit((values) => {
              statusMutation.mutate({
                id: panel.ticket.id,
                payload: {
                  status: values.status,
                  resolution: values.resolution?.trim() || undefined,
                  cancelReason: values.cancelReason?.trim() || undefined,
                  note: values.note?.trim() || undefined,
                },
              });
            })}
          >
            <div>
              <Label htmlFor="ticket-status">New status</Label>
              <Select
                id="ticket-status"
                value={statusForm.watch("status")}
                onChange={(e) =>
                  statusForm.setValue(
                    "status",
                    e.target.value as SupportTicketStatus,
                    { shouldValidate: true },
                  )
                }
              >
                {nextTicketStatuses(panel.ticket.status).map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </Select>
            </div>

            {statusForm.watch("status") === "resolved" ? (
              <div>
                <Label htmlFor="resolution">Resolution</Label>
                <Textarea
                  id="resolution"
                  {...statusForm.register("resolution")}
                />
                {statusForm.formState.errors.resolution ? (
                  <p className="mt-1 text-xs text-(--danger)">
                    {statusForm.formState.errors.resolution.message}
                  </p>
                ) : null}
              </div>
            ) : null}

            {statusForm.watch("status") === "cancelled" ? (
              <div>
                <Label htmlFor="cancelReason">Cancel reason</Label>
                <Textarea
                  id="cancelReason"
                  {...statusForm.register("cancelReason")}
                />
                {statusForm.formState.errors.cancelReason ? (
                  <p className="mt-1 text-xs text-(--danger)">
                    {statusForm.formState.errors.cancelReason.message}
                  </p>
                ) : null}
              </div>
            ) : null}

            <div>
              <Label htmlFor="note">
                {statusForm.watch("status") === "escalated"
                  ? "Escalation note"
                  : "Note (optional)"}
              </Label>
              <Textarea id="note" {...statusForm.register("note")} />
              {statusForm.formState.errors.note ? (
                <p className="mt-1 text-xs text-(--danger)">
                  {statusForm.formState.errors.note.message}
                </p>
              ) : null}
            </div>

            {statusMutation.error instanceof ApiRequestError ? (
              <p className="text-sm text-(--danger)">
                {statusMutation.error.message}
              </p>
            ) : null}

            <div className="flex flex-col-reverse gap-2 border-t border-(--border) pt-4 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                className="w-full sm:w-auto"
                onClick={closePanel}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="w-full sm:w-auto"
                disabled={statusMutation.isPending}
              >
                Save status
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}
    </>
  );
}
