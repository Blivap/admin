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
import { listUsers, suspendUser, unsuspendUser } from "@/lib/api/users";
import { queryKeys } from "@/lib/query-keys";
import { formatDate, fullName } from "@/lib/utils";
import type {
  AdminUserListItem,
  BloodType,
  UserStatus,
  UsersListParams,
} from "@/types";

const BLOOD_TYPES: BloodType[] = [
  "O-",
  "O+",
  "A-",
  "A+",
  "B-",
  "B+",
  "AB-",
  "AB+",
];

const suspendSchema = z.object({
  reason: z.string().min(5, "Provide a reason (at least 5 characters)"),
});

type SuspendFormValues = z.infer<typeof suspendSchema>;

function statusTone(status: UserStatus) {
  switch (status) {
    case "active":
      return "success" as const;
    case "suspended":
      return "danger" as const;
    default:
      return "neutral" as const;
  }
}

export function UsersTable() {
  const queryClient = useQueryClient();
  const [params, setParams] = useState<UsersListParams>({
    page: 1,
    pageSize: 20,
    query: "",
    bloodType: "",
    status: "",
  });
  const [draftQuery, setDraftQuery] = useState("");
  const [suspendTarget, setSuspendTarget] = useState<AdminUserListItem | null>(
    null,
  );

  const listQuery = useQuery({
    queryKey: queryKeys.users.list(params),
    queryFn: () => listUsers(params),
  });

  const suspendForm = useForm<SuspendFormValues>({
    resolver: zodResolver(suspendSchema),
    defaultValues: { reason: "" },
  });

  const suspendMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      suspendUser(id, { reason }),
    onSuccess: async () => {
      setSuspendTarget(null);
      suspendForm.reset();
      await queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });

  const unsuspendMutation = useMutation({
    mutationFn: (id: string) => unsuspendUser(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });

  const columns = useMemo<ColumnDef<AdminUserListItem>[]>(
    () => [
      {
        id: "name",
        header: "Name",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">
              {fullName(row.original.firstname, row.original.lastname)}
            </p>
            <p className="text-xs text-[var(--ink-muted)]">
              {row.original.email}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "bloodType",
        header: "Blood",
        cell: ({ getValue }) => (getValue<string>() ? getValue<string>() : "—"),
      },
      {
        id: "roles",
        header: "Roles",
        cell: ({ row }) => row.original.roles.join(", "),
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
        id: "nin",
        header: "NIN",
        cell: ({ row }) => (
          <Badge tone={row.original.ninVerified ? "success" : "warning"}>
            {row.original.ninVerified ? "Verified" : "Unverified"}
          </Badge>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Joined",
        cell: ({ getValue }) => formatDate(getValue<string>()),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const user = row.original;
          if (user.status === "suspended") {
            return (
              <Button
                size="sm"
                variant="secondary"
                disabled={unsuspendMutation.isPending}
                onClick={() => unsuspendMutation.mutate(user.id)}
              >
                Unsuspend
              </Button>
            );
          }
          return (
            <Button
              size="sm"
              variant="danger"
              onClick={() => {
                setSuspendTarget(user);
                suspendForm.reset({ reason: "" });
              }}
            >
              Suspend
            </Button>
          );
        },
      },
    ],
    [suspendForm, unsuspendMutation],
  );

  const table = useReactTable({
    data: listQuery.data?.data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const meta = listQuery.data?.meta;
  const actionError =
    suspendMutation.error instanceof ApiRequestError
      ? suspendMutation.error.message
      : unsuspendMutation.error instanceof ApiRequestError
        ? unsuspendMutation.error.message
        : null;

  return (
    <>
      <TableShell
        toolbar={
          <>
            <div className="min-w-[200px] flex-1">
              <Label htmlFor="user-query">Search</Label>
              <Input
                id="user-query"
                placeholder="Name, email, phone…"
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
            <div className="w-full sm:w-36">
              <Label htmlFor="blood-type">Blood type</Label>
              <Select
                id="blood-type"
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
              <Label htmlFor="user-status">Status</Label>
              <Select
                id="user-status"
                value={params.status ?? ""}
                onChange={(e) =>
                  setParams((prev) => ({
                    ...prev,
                    status: e.target.value as UserStatus | "",
                    page: 1,
                  }))
                }
              >
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="deactivated">Deactivated</option>
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
          <EmptyState title="Loading users…" />
        ) : listQuery.isError ? (
          <EmptyState
            title="Couldn’t load users"
            description={
              listQuery.error instanceof ApiRequestError
                ? listQuery.error.message
                : "Something went wrong."
            }
          />
        ) : table.getRowModel().rows.length === 0 ? (
          <EmptyState
            title="No users found"
            description="Try adjusting search or filters."
          />
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

      {actionError && !suspendTarget ? (
        <p className="mt-3 text-sm text-[var(--danger)]">{actionError}</p>
      ) : null}

      {suspendTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg border border-[var(--border)] bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-[var(--ink)]">
              Suspend user
            </h2>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">
              {fullName(suspendTarget.firstname, suspendTarget.lastname)} (
              {suspendTarget.email}) will lose access until unsuspended. This
              action is audit-logged server-side.
            </p>
            <form
              className="mt-4 space-y-4"
              onSubmit={suspendForm.handleSubmit((values) =>
                suspendMutation.mutate({
                  id: suspendTarget.id,
                  reason: values.reason,
                }),
              )}
            >
              <div>
                <Label htmlFor="suspend-reason">Reason</Label>
                <Textarea
                  id="suspend-reason"
                  {...suspendForm.register("reason")}
                />
                {suspendForm.formState.errors.reason ? (
                  <p className="mt-1 text-xs text-[var(--danger)]">
                    {suspendForm.formState.errors.reason.message}
                  </p>
                ) : null}
              </div>
              {suspendMutation.error instanceof ApiRequestError ? (
                <p className="text-sm text-[var(--danger)]">
                  {suspendMutation.error.message}
                </p>
              ) : null}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setSuspendTarget(null);
                    suspendForm.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="danger"
                  disabled={suspendMutation.isPending}
                >
                  {suspendMutation.isPending ? "Suspending…" : "Confirm suspend"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
