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
import { Select } from "@/components/ui/select";
import { TableShell } from "@/components/ui/table-shell";
import { Textarea } from "@/components/ui/textarea";
import { useNotifications } from "@/hooks/use-notifications";
import { ApiRequestError } from "@/lib/api/client";
import { BLOOD_TYPES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import type {
  AdminNotificationListItem,
  NotificationDeliveryStatus,
  NotificationKind,
} from "@/types";

type Panel =
  | { type: "compose" }
  | { type: "dm" }
  | { type: "stats"; notification: AdminNotificationListItem }
  | null;

function statusTone(status: NotificationDeliveryStatus) {
  switch (status) {
    case "delivered":
    case "sent":
      return "success" as const;
    case "failed":
      return "danger" as const;
    case "partial":
      return "warning" as const;
    default:
      return "info" as const;
  }
}

export function NotificationsTable() {
  const [panel, setPanel] = useState<Panel>(null);
  const closePanel = useCallback(() => setPanel(null), []);

  const statsNotificationId =
    panel?.type === "stats" ? panel.notification.id : "";

  const {
    params,
    setParams,
    listQuery,
    statsQuery,
    broadcastForm,
    dmForm,
    broadcastMutation,
    dmMutation,
  } = useNotifications({
    statsNotificationId,
    onActionSuccess: closePanel,
  });

  const columns = useMemo<ColumnDef<AdminNotificationListItem>[]>(
    () => [
      {
        id: "message",
        header: "Message",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.title}</p>
            <p className="line-clamp-1 text-xs text-[var(--ink-muted)]">
              {row.original.body}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "kind",
        header: "Kind",
        cell: ({ getValue }) => (
          <span className="text-xs">{getValue<string>().replace(/_/g, " ")}</span>
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
        id: "delivery",
        header: "Sent / Del / Open",
        cell: ({ row }) =>
          `${row.original.sentCount}/${row.original.deliveredCount}/${row.original.openedCount}`,
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ getValue }) => formatDate(getValue<string>()),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <Button
            size="sm"
            variant="secondary"
            onClick={() =>
              setPanel({ type: "stats", notification: row.original })
            }
          >
            Delivery stats
          </Button>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: listQuery.data?.data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const meta = listQuery.data?.meta;

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">
        <Button
          onClick={() => {
            broadcastForm.reset({
              title: "",
              body: "",
              priority: "normal",
              bloodType: "",
              region: "",
              role: "",
            });
            setPanel({ type: "compose" });
          }}
        >
          Compose broadcast / campaign
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            dmForm.reset();
            setPanel({ type: "dm" });
          }}
        >
          Direct message
        </Button>
      </div>

      <TableShell
        toolbar={
          <>
            <div className="w-full sm:w-44">
              <Label htmlFor="n-kind">Kind</Label>
              <Select
                id="n-kind"
                value={params.kind ?? ""}
                onChange={(e) =>
                  setParams((prev) => ({
                    ...prev,
                    kind: e.target.value as NotificationKind | "",
                    page: 1,
                  }))
                }
              >
                <option value="">All</option>
                <option value="urgent_broadcast">Urgent broadcast</option>
                <option value="system_announcement">System announcement</option>
                <option value="segmented_campaign">Segmented campaign</option>
                <option value="direct_message">Direct message</option>
                <option value="reengagement">Re-engagement</option>
                <option value="rebroadcast">Rebroadcast</option>
              </Select>
            </div>
            <div className="w-full sm:w-36">
              <Label htmlFor="n-status">Status</Label>
              <Select
                id="n-status"
                value={params.status ?? ""}
                onChange={(e) =>
                  setParams((prev) => ({
                    ...prev,
                    status: e.target.value as NotificationDeliveryStatus | "",
                    page: 1,
                  }))
                }
              >
                <option value="">All</option>
                <option value="queued">Queued</option>
                <option value="sent">Sent</option>
                <option value="delivered">Delivered</option>
                <option value="partial">Partial</option>
                <option value="failed">Failed</option>
              </Select>
            </div>
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
          <EmptyState title="Loading notification history…" />
        ) : listQuery.isError ? (
          <EmptyState
            title="Couldn’t load history"
            description={
              listQuery.error instanceof ApiRequestError
                ? listQuery.error.message
                : undefined
            }
          />
        ) : table.getRowModel().rows.length === 0 ? (
          <EmptyState title="No notifications yet" />
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

      {panel?.type === "compose" ? (
        <Modal title="Compose notification" onClose={closePanel} wide>
          <p className="mb-3 text-sm text-[var(--ink-muted)]">
            Leave segment filters empty for a system-wide announcement. Set
            inactivity days for a re-engagement nudge.
          </p>
          <form
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={broadcastForm.handleSubmit((v) =>
              broadcastMutation.mutate(v),
            )}
          >
            <div className="sm:col-span-2">
              <Label htmlFor="bc-title">Title</Label>
              <Input id="bc-title" {...broadcastForm.register("title")} />
              {broadcastForm.formState.errors.title ? (
                <p className="mt-1 text-xs text-[var(--danger)]">
                  {broadcastForm.formState.errors.title.message}
                </p>
              ) : null}
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="bc-body">Body</Label>
              <Textarea id="bc-body" {...broadcastForm.register("body")} />
              {broadcastForm.formState.errors.body ? (
                <p className="mt-1 text-xs text-[var(--danger)]">
                  {broadcastForm.formState.errors.body.message}
                </p>
              ) : null}
            </div>
            <div>
              <Label htmlFor="bc-priority">Priority</Label>
              <Select id="bc-priority" {...broadcastForm.register("priority")}>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="bc-schedule">Schedule at (optional)</Label>
              <Input
                id="bc-schedule"
                type="datetime-local"
                {...broadcastForm.register("scheduleAt")}
              />
            </div>
            <div>
              <Label htmlFor="bc-blood">Blood type filter</Label>
              <Select id="bc-blood" {...broadcastForm.register("bloodType")}>
                <option value="">Any</option>
                {BLOOD_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="bc-region">Region</Label>
              <Input id="bc-region" {...broadcastForm.register("region")} />
            </div>
            <div>
              <Label htmlFor="bc-role">Role</Label>
              <Select id="bc-role" {...broadcastForm.register("role")}>
                <option value="">Any</option>
                <option value="donor">Donor</option>
                <option value="requester">Requester</option>
                <option value="both">Both</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="bc-inactive">Inactive days (re-engage)</Label>
              <Input
                id="bc-inactive"
                type="number"
                {...broadcastForm.register("inactiveDays")}
              />
            </div>
            <div>
              <Label htmlFor="bc-from">Last donation from</Label>
              <Input
                id="bc-from"
                type="date"
                {...broadcastForm.register("lastDonationFrom")}
              />
            </div>
            <div>
              <Label htmlFor="bc-to">Last donation to</Label>
              <Input
                id="bc-to"
                type="date"
                {...broadcastForm.register("lastDonationTo")}
              />
            </div>
            {broadcastMutation.error instanceof ApiRequestError ? (
              <p className="sm:col-span-2 text-sm text-[var(--danger)]">
                {broadcastMutation.error.message}
              </p>
            ) : null}
            <div className="flex justify-end gap-2 sm:col-span-2">
              <Button type="button" variant="secondary" onClick={closePanel}>
                Cancel
              </Button>
              <Button type="submit" disabled={broadcastMutation.isPending}>
                {broadcastMutation.isPending ? "Sending…" : "Send"}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}

      {panel?.type === "dm" ? (
        <Modal title="Direct message" onClose={closePanel}>
          <form
            className="space-y-4"
            onSubmit={dmForm.handleSubmit((v) => dmMutation.mutate(v))}
          >
            <div>
              <Label htmlFor="dm-user">User ID</Label>
              <Input id="dm-user" {...dmForm.register("userId")} />
              {dmForm.formState.errors.userId ? (
                <p className="mt-1 text-xs text-[var(--danger)]">
                  {dmForm.formState.errors.userId.message}
                </p>
              ) : null}
            </div>
            <div>
              <Label htmlFor="dm-title">Title</Label>
              <Input id="dm-title" {...dmForm.register("title")} />
            </div>
            <div>
              <Label htmlFor="dm-body">Body</Label>
              <Textarea id="dm-body" {...dmForm.register("body")} />
            </div>
            <div>
              <Label htmlFor="dm-link">Deep link (optional)</Label>
              <Input id="dm-link" {...dmForm.register("deepLink")} />
            </div>
            {dmMutation.error instanceof ApiRequestError ? (
              <p className="text-sm text-[var(--danger)]">
                {dmMutation.error.message}
              </p>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={closePanel}>
                Cancel
              </Button>
              <Button type="submit" disabled={dmMutation.isPending}>
                {dmMutation.isPending ? "Sending…" : "Send DM"}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}

      {panel?.type === "stats" ? (
        <Modal title="Delivery stats" onClose={closePanel}>
          <p className="text-sm text-[var(--ink-muted)]">
            {panel.notification.title}
          </p>
          {statsQuery.isLoading ? (
            <EmptyState title="Loading stats…" />
          ) : statsQuery.isError ? (
            <EmptyState
              title="Couldn’t load stats"
              description={
                statsQuery.error instanceof ApiRequestError
                  ? statsQuery.error.message
                  : undefined
              }
            />
          ) : statsQuery.data ? (
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <Stat label="Sent" value={statsQuery.data.sent} />
              <Stat label="Delivered" value={statsQuery.data.delivered} />
              <Stat label="Opened" value={statsQuery.data.opened} />
              <Stat label="Failed" value={statsQuery.data.failed} />
            </dl>
          ) : null}
          <div className="mt-4 flex justify-end">
            <Button variant="secondary" onClick={closePanel}>
              Close
            </Button>
          </div>
        </Modal>
      ) : null}
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
      <dt className="text-xs text-[var(--ink-muted)]">{label}</dt>
      <dd className="text-lg font-semibold tabular-nums">{value}</dd>
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
        className={`max-h-[90vh] w-full overflow-y-auto rounded-lg border border-[var(--border)] bg-white p-6 shadow-xl ${wide ? "max-w-2xl" : "max-w-md"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold">{title}</h2>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
