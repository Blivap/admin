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
  approveVerification,
  listVerifications,
  rejectVerification,
} from "@/lib/api/verifications";
import { queryKeys } from "@/lib/query-keys";
import { formatDate } from "@/lib/utils";
import type {
  AdminVerificationListItem,
  VerificationStatus,
  VerificationsListParams,
} from "@/types";

const rejectSchema = z.object({
  reason: z.string().min(5, "Provide a rejection reason"),
});

type RejectFormValues = z.infer<typeof rejectSchema>;

function statusTone(status: VerificationStatus) {
  switch (status) {
    case "approved":
      return "success" as const;
    case "rejected":
      return "danger" as const;
    case "needs_review":
      return "warning" as const;
    default:
      return "info" as const;
  }
}

export function VerificationsTable() {
  const queryClient = useQueryClient();
  const [params, setParams] = useState<VerificationsListParams>({
    page: 1,
    pageSize: 20,
    query: "",
    status: "pending",
  });
  const [draftQuery, setDraftQuery] = useState("");
  const [rejectTarget, setRejectTarget] =
    useState<AdminVerificationListItem | null>(null);

  const listQuery = useQuery({
    queryKey: queryKeys.verifications.list(params),
    queryFn: () => listVerifications(params),
  });

  const rejectForm = useForm<RejectFormValues>({
    resolver: zodResolver(rejectSchema),
    defaultValues: { reason: "" },
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({
      queryKey: queryKeys.verifications.all,
    });
  };

  const approveMutation = useMutation({
    mutationFn: (id: string) => approveVerification(id),
    onSuccess: invalidate,
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      rejectVerification(id, { reason }),
    onSuccess: async () => {
      setRejectTarget(null);
      rejectForm.reset();
      await invalidate();
    },
  });

  const columns = useMemo<ColumnDef<AdminVerificationListItem>[]>(
    () => [
      {
        id: "user",
        header: "User",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.userName}</p>
            <p className="text-xs text-[var(--ink-muted)]">
              {row.original.userEmail}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "documentType",
        header: "Document",
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge tone={statusTone(row.original.status)}>
            {row.original.status.replace("_", " ")}
          </Badge>
        ),
      },
      {
        accessorKey: "submittedAt",
        header: "Submitted",
        cell: ({ getValue }) => formatDate(getValue<string>()),
      },
      {
        id: "reviewer",
        header: "Reviewed by",
        cell: ({ row }) => row.original.reviewedByName ?? "—",
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const item = row.original;
          if (item.status !== "pending" && item.status !== "needs_review") {
            return <span className="text-xs text-[var(--ink-subtle)]">—</span>;
          }
          return (
            <div className="flex gap-1.5">
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
                  rejectForm.reset({ reason: "" });
                  setRejectTarget(item);
                }}
              >
                Reject
              </Button>
            </div>
          );
        },
      },
    ],
    [approveMutation, rejectForm],
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
              <Label htmlFor="ver-query">Search</Label>
              <Input
                id="ver-query"
                placeholder="Name, email…"
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
                <option value="needs_review">Needs review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
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
          <EmptyState title="Loading verifications…" />
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
          <EmptyState title="Queue is empty" description="No items match filters." />
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

      {rejectTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg border border-[var(--border)] bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold">Reject verification</h2>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">
              {rejectTarget.userName} — {rejectTarget.documentType}
            </p>
            <form
              className="mt-4 space-y-4"
              onSubmit={rejectForm.handleSubmit((values) =>
                rejectMutation.mutate({
                  id: rejectTarget.id,
                  reason: values.reason,
                }),
              )}
            >
              <div>
                <Label htmlFor="reject-reason">Reason</Label>
                <Textarea
                  id="reject-reason"
                  {...rejectForm.register("reason")}
                />
                {rejectForm.formState.errors.reason ? (
                  <p className="mt-1 text-xs text-[var(--danger)]">
                    {rejectForm.formState.errors.reason.message}
                  </p>
                ) : null}
              </div>
              {rejectMutation.error instanceof ApiRequestError ? (
                <p className="text-sm text-[var(--danger)]">
                  {rejectMutation.error.message}
                </p>
              ) : null}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setRejectTarget(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="danger"
                  disabled={rejectMutation.isPending}
                >
                  {rejectMutation.isPending ? "Rejecting…" : "Reject"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
