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
import { Modal } from "@/components/ui/modal";
import { Pagination } from "@/components/ui/pagination";
import { ReloadButton } from "@/components/ui/reload-button";
import { Select } from "@/components/ui/select";
import { TableShell } from "@/components/ui/table-shell";
import { Textarea } from "@/components/ui/textarea";
import { TruncatedText } from "@/components/ui/truncated-text";
import { useVerifications } from "@/hooks/use-verifications";
import { ApiRequestError } from "@/lib/api/client";
import { formatDate } from "@/lib/utils";
import type {
  AdminVerificationListItem,
  VerificationStatus,
} from "@/types";

type Panel =
  | { type: "reject"; item: AdminVerificationListItem }
  | { type: "flag"; item: AdminVerificationListItem }
  | null;

function statusTone(status: VerificationStatus) {
  switch (status) {
    case "approved":
      return "success" as const;
    case "rejected":
      return "danger" as const;
    case "flagged":
      return "warning" as const;
    default:
      return "info" as const;
  }
}

export function VerificationsTable() {
  const [panel, setPanel] = useState<Panel>(null);
  const closePanel = useCallback(() => setPanel(null), []);

  const {
    params,
    setParams,
    draftQuery,
    setDraftQuery,
    applyFilters,
    listQuery,
    reasonForm,
    approveMutation,
    rejectMutation,
    flagMutation,
  } = useVerifications({ onActionSuccess: closePanel });

  const columns = useMemo<ColumnDef<AdminVerificationListItem>[]>(
    () => [
      {
        id: "user",
        header: "User",
        cell: ({ row }) => (
          <div className="max-w-[14rem]">
            <TruncatedText
              text={row.original.userName}
              className="font-medium"
              maxWidthClass="max-w-[14rem]"
            />
            <TruncatedText
              text={row.original.userEmail}
              className="text-xs text-(--ink-muted)"
              maxWidthClass="max-w-[14rem]"
            />
          </div>
        ),
      },
      {
        accessorKey: "documentType",
        header: "Document",
        cell: ({ getValue }) => (
          <TruncatedText
            text={getValue<string>()}
            maxWidthClass="max-w-[8rem]"
          />
        ),
      },
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
        accessorKey: "submittedAt",
        header: "Submitted",
        cell: ({ getValue }) => formatDate(getValue<string>()),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const item = row.original;
          if (item.status !== "pending" && item.status !== "flagged") {
            return <span className="text-xs text-(--ink-subtle)">—</span>;
          }
          return (
            <div className="flex flex-nowrap gap-1">
              <Button
                size="sm"
                disabled={approveMutation.isPending}
                onClick={() => approveMutation.mutate(item.id)}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => {
                  reasonForm.reset({ reason: "" });
                  setPanel({ type: "reject", item });
                }}
              >
                Reject
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  reasonForm.reset({ reason: "" });
                  setPanel({ type: "flag", item });
                }}
              >
                Flag
              </Button>
            </div>
          );
        },
      },
    ],
    [approveMutation, reasonForm],
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
            <div className="w-full min-w-0 flex-1 sm:min-w-[180px]">
              <Label htmlFor="ver-query">Search</Label>
              <Input
                id="ver-query"
                value={draftQuery}
                onChange={(e) => setDraftQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") applyFilters();
                }}
                placeholder="Name, email…"
              />
            </div>
            <div className="w-full sm:w-40">
              <Label htmlFor="ver-status">Status</Label>
              <Select
                id="ver-status"
                value={params.status ?? ""}
                onChange={(e) =>
                  setParams((prev) => ({
                    ...prev,
                    status: e.target.value as VerificationStatus | "",
                    page: 1,
                  }))
                }
              >
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="flagged">Flagged</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
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
          <EmptyState title="Loading queue…" />
        ) : listQuery.isError ? (
          <EmptyState
            title="Couldn’t load verifications"
            description={
              listQuery.error instanceof ApiRequestError
                ? listQuery.error.message
                : undefined
            }
          />
        ) : table.getRowModel().rows.length === 0 ? (
          <EmptyState title="Queue is empty" />
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

      {panel ? (
        <Modal
          title={
            panel.type === "reject" ? "Reject verification" : "Flag account"
          }
          onClose={closePanel}
        >
          <p className="mb-4 text-sm text-(--ink-muted)">
            {panel.item.userName} — {panel.item.documentType}
          </p>
          <form
            className="space-y-4"
            onSubmit={reasonForm.handleSubmit((values) => {
              if (panel.type === "reject") {
                rejectMutation.mutate({
                  id: panel.item.id,
                  reason: values.reason,
                });
              } else {
                flagMutation.mutate({
                  id: panel.item.id,
                  reason: values.reason,
                });
              }
            })}
          >
            <div>
              <Label htmlFor="reason">Reason</Label>
              <Textarea id="reason" {...reasonForm.register("reason")} />
              {reasonForm.formState.errors.reason ? (
                <p className="mt-1 text-xs text-(--danger)">
                  {reasonForm.formState.errors.reason.message}
                </p>
              ) : null}
            </div>
            {(rejectMutation.error || flagMutation.error) instanceof
            ApiRequestError ? (
              <p className="text-sm text-(--danger)">
                {(rejectMutation.error || flagMutation.error)?.message}
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
                variant={panel.type === "reject" ? "danger" : "primary"}
                disabled={rejectMutation.isPending || flagMutation.isPending}
              >
                Confirm
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}
    </>
  );
}
