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
import { QueryError } from "@/components/ui/query-error";
import { ReloadButton } from "@/components/ui/reload-button";
import { Select } from "@/components/ui/select";
import {
  DetailPanelSkeleton,
  TableSkeleton,
} from "@/components/ui/skeletons";
import { TableShell } from "@/components/ui/table-shell";
import { Textarea } from "@/components/ui/textarea";
import { useUsers } from "@/hooks/use-users";
import { ApiRequestError } from "@/lib/api/client";
import { BLOOD_TYPES } from "@/lib/constants";
import { formatDate, fullName } from "@/lib/utils";
import { Users } from "lucide-react";
import type {
  AdminUserListItem,
  BloodType,
  PlatformUserRole,
  UserStatus,
} from "@/types";

type Panel =
  | { type: "suspend"; user: AdminUserListItem }
  | { type: "merge"; user: AdminUserListItem }
  | null;

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
  const [panel, setPanel] = useState<Panel>(null);
  const closeActionPanel = useCallback(() => setPanel(null), []);

  const {
    params,
    setParams,
    draftQuery,
    setDraftQuery,
    draftLocation,
    setDraftLocation,
    applyFilters,
    detailUserId,
    openUser,
    clearUser,
    listQuery,
    detailQuery,
    suspendForm,
    mergeForm,
    suspendMutation,
    reactivateMutation,
    verifyMutation,
    resetPasswordMutation,
    mergeMutation,
  } = useUsers({ onActionSuccess: closeActionPanel });

  const columns = useMemo<ColumnDef<AdminUserListItem>[]>(
    () => [
      {
        id: "name",
        header: "Name",
        cell: ({ row }) => (
          <button
            type="button"
            className="text-left"
            onClick={() => openUser(row.original.id)}
          >
            <p className="font-medium text-[var(--brand)] hover:underline">
              {fullName(row.original.firstname, row.original.lastname)}
            </p>
            <p className="text-xs text-[var(--ink-muted)]">
              {row.original.email}
            </p>
          </button>
        ),
      },
      {
        accessorKey: "bloodType",
        header: "Blood",
        cell: ({ getValue }) => getValue<string>() || "—",
      },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ getValue }) => {
          const role = getValue<string>();
          return role && role !== "none" ? role : "—";
        },
      },
      {
        id: "location",
        header: "Location",
        cell: ({ row }) =>
          [row.original.city, row.original.state, row.original.region]
            .filter(Boolean)
            .join(", ") || "—",
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
        header: "Verified",
        cell: ({ row }) => (
          <Badge tone={row.original.ninVerified ? "success" : "warning"}>
            {row.original.ninVerified ? "Yes" : "No"}
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
          return (
            <div className="flex flex-wrap gap-1">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => openUser(user.id)}
              >
                View
              </Button>
              {user.status === "suspended" ? (
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={reactivateMutation.isPending}
                  onClick={() => reactivateMutation.mutate(user.id)}
                >
                  Reactivate
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => {
                    suspendForm.reset({ reason: "" });
                    setPanel({ type: "suspend", user });
                  }}
                >
                  Suspend
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [openUser, reactivateMutation, suspendForm],
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
              <Label htmlFor="user-query">Search</Label>
              <Input
                id="user-query"
                placeholder="Name, email, phone…"
                value={draftQuery}
                onChange={(e) => setDraftQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applyFilters()}
              />
            </div>
            <div className="w-full sm:w-28">
              <Label htmlFor="blood-type">Blood</Label>
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
            <div className="w-full sm:w-32">
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
            <div className="w-full sm:w-32">
              <Label htmlFor="user-role">Role</Label>
              <Select
                id="user-role"
                value={params.role ?? ""}
                onChange={(e) =>
                  setParams((prev) => ({
                    ...prev,
                    role: e.target.value as PlatformUserRole | "",
                    page: 1,
                  }))
                }
              >
                <option value="">All</option>
                <option value="donor">Donor</option>
                <option value="requester">Requester</option>
                <option value="both">Both</option>
              </Select>
            </div>
            <div className="w-full sm:w-36">
              <Label htmlFor="user-location">Location</Label>
              <Input
                id="user-location"
                placeholder="City / region"
                value={draftLocation}
                onChange={(e) => setDraftLocation(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applyFilters()}
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
          <TableSkeleton columns={8} rows={8} withToolbar={false} />
        ) : listQuery.isError ? (
          <QueryError
            title="Couldn’t load users"
            error={listQuery.error}
            onRetry={() => listQuery.refetch()}
          />
        ) : table.getRowModel().rows.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No users found"
            description="Try adjusting filters, or check back once more people join the platform."
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

      {detailUserId ? (
        <Modal title="User detail" onClose={clearUser} wide>
          {detailQuery.isLoading ? (
            <DetailPanelSkeleton />
          ) : detailQuery.isError ? (
            <QueryError
              title="Couldn’t load user"
              error={detailQuery.error}
              onRetry={() => detailQuery.refetch()}
            />
          ) : detailQuery.data ? (
            <div className="space-y-5 text-sm">
              {(() => {
                const user = detailQuery.data;
                const donationHistory = user.donationHistory ?? [];
                const pushTokens = user.pushTokens ?? [];
                return (
                  <>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label="Name"
                  value={fullName(user.firstname, user.lastname)}
                />
                <Field label="Email" value={user.email} />
                <Field label="Phone" value={user.phonenumber || "—"} />
                <Field label="Blood type" value={user.bloodType || "—"} />
                <Field
                  label="Role"
                  value={user.role && user.role !== "none" ? user.role : "—"}
                />
                <Field label="Status" value={user.status} />
                <Field
                  label="Location"
                  value={
                    [user.city, user.state, user.region]
                      .filter(Boolean)
                      .join(", ") || "—"
                  }
                />
                <Field
                  label="Verification"
                  value={
                    user.ninVerified
                      ? "NIN verified"
                      : user.verificationStatus || "Unverified"
                  }
                />
              </div>

              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
                  Donation history
                </h3>
                {donationHistory.length === 0 ? (
                  <p className="text-[var(--ink-muted)]">No donations yet.</p>
                ) : (
                  <div className="overflow-x-auto rounded border border-[var(--border)]">
                    <table>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Blood</th>
                          <th>Facility</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {donationHistory.map((d) => (
                          <tr key={d.id}>
                            <td>{formatDate(d.donatedAt)}</td>
                            <td>{d.bloodType}</td>
                            <td>{d.facilityName || "—"}</td>
                            <td>{d.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
                  Push tokens
                </h3>
                {pushTokens.length === 0 ? (
                  <p className="text-[var(--ink-muted)]">No linked tokens.</p>
                ) : (
                  <ul className="space-y-1">
                    {pushTokens.map((t) => (
                      <li
                        key={t.id}
                        className="rounded border border-[var(--border)] bg-[var(--surface)] px-3 py-2 font-mono text-xs"
                      >
                        {t.platform ? `${t.platform}: ` : ""}
                        {t.token.slice(0, 24)}…
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex flex-wrap gap-2 border-t border-[var(--border)] pt-4">
                {!user.ninVerified ? (
                  <Button
                    size="sm"
                    disabled={verifyMutation.isPending}
                    onClick={() => verifyMutation.mutate(user.id)}
                  >
                    Force verify
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={resetPasswordMutation.isPending}
                  onClick={() => resetPasswordMutation.mutate(user.id)}
                >
                  {resetPasswordMutation.isPending
                    ? "Sending…"
                    : "Reset password"}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    mergeForm.reset({ targetUserId: "", reason: "" });
                    setPanel({
                      type: "merge",
                      user: user as unknown as AdminUserListItem,
                    });
                  }}
                >
                  Merge duplicate
                </Button>
                {user.status === "suspended" ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={reactivateMutation.isPending}
                    onClick={() => reactivateMutation.mutate(user.id)}
                  >
                    Reactivate
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => {
                      suspendForm.reset({ reason: "" });
                      setPanel({
                        type: "suspend",
                        user: user as unknown as AdminUserListItem,
                      });
                    }}
                  >
                    Suspend
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="ml-auto"
                  onClick={closeActionPanel}
                >
                  Close
                </Button>
              </div>
              {resetPasswordMutation.isSuccess ? (
                <p className="text-sm text-emerald-700">
                  Password reset email queued.
                </p>
              ) : null}
              {resetPasswordMutation.error instanceof ApiRequestError ? (
                <p className="text-sm text-[var(--danger)]">
                  {resetPasswordMutation.error.message}
                </p>
              ) : null}
                  </>
                );
              })()}
            </div>
          ) : null}
        </Modal>
      ) : null}

      {panel?.type === "suspend" ? (
        <Modal title="Suspend user" onClose={closeActionPanel}>
          <p className="text-sm text-[var(--ink-muted)]">
            {fullName(panel.user.firstname, panel.user.lastname)} (
            {panel.user.email})
          </p>
          <form
            className="mt-4 space-y-4"
            onSubmit={suspendForm.handleSubmit((values) =>
              suspendMutation.mutate({
                id: panel.user.id,
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
              <Button type="button" variant="secondary" onClick={closeActionPanel}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="danger"
                disabled={suspendMutation.isPending}
              >
                {suspendMutation.isPending ? "Suspending…" : "Confirm"}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}

      {panel?.type === "merge" ? (
        <Modal title="Merge duplicate accounts" onClose={closeActionPanel}>
          <p className="text-sm text-[var(--ink-muted)]">
            Merge{" "}
            <strong>
              {fullName(panel.user.firstname, panel.user.lastname)}
            </strong>{" "}
            into another account. Source account will be deactivated.
          </p>
          <form
            className="mt-4 space-y-4"
            onSubmit={mergeForm.handleSubmit((values) =>
              mergeMutation.mutate({
                sourceId: panel.user.id,
                values,
              }),
            )}
          >
            <div>
              <Label htmlFor="target-id">Target user ID</Label>
              <Input id="target-id" {...mergeForm.register("targetUserId")} />
              {mergeForm.formState.errors.targetUserId ? (
                <p className="mt-1 text-xs text-[var(--danger)]">
                  {mergeForm.formState.errors.targetUserId.message}
                </p>
              ) : null}
            </div>
            <div>
              <Label htmlFor="merge-reason">Reason</Label>
              <Textarea id="merge-reason" {...mergeForm.register("reason")} />
              {mergeForm.formState.errors.reason ? (
                <p className="mt-1 text-xs text-[var(--danger)]">
                  {mergeForm.formState.errors.reason.message}
                </p>
              ) : null}
            </div>
            {mergeMutation.error instanceof ApiRequestError ? (
              <p className="text-sm text-[var(--danger)]">
                {mergeMutation.error.message}
              </p>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={closeActionPanel}>
                Cancel
              </Button>
              <Button type="submit" disabled={mergeMutation.isPending}>
                {mergeMutation.isPending ? "Merging…" : "Merge"}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-[var(--ink-muted)]">{label}</p>
      <p className="font-medium text-[var(--ink)]">{value}</p>
    </div>
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
        <h2 className="text-lg font-semibold text-[var(--ink)]">{title}</h2>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
