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
import { DatePicker } from "@/components/ui/date-picker";
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
import { useNotifications } from "@/hooks/use-notifications";
import { ApiRequestError } from "@/lib/api/client";
import { BLOOD_TYPES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import type {
  AdminNotificationListItem,
  NotificationDeliveryStatus,
  NotificationKind,
} from "@/types";

type Panel = { type: "compose" } | { type: "dm" } | null;

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

  const {
    params,
    setParams,
    statsNotificationId,
    openStats,
    clearStats,
    listQuery,
    statsQuery,
    broadcastForm,
    dmForm,
    broadcastMutation,
    dmMutation,
  } = useNotifications({
    onActionSuccess: closePanel,
  });

  const statsTitle =
    listQuery.data?.data.find((n) => n.id === statsNotificationId)?.title ??
    "Notification";

  const columns = useMemo<ColumnDef<AdminNotificationListItem>[]>(
    () => [
      {
        id: "message",
        header: "Message",
        cell: ({ row }) => (
          <div className="max-w-[18rem]">
            <TruncatedText
              text={row.original.title}
              className="font-medium"
              maxWidthClass="max-w-[18rem]"
            />
            <TruncatedText
              text={row.original.body}
              className="text-xs text-(--ink-muted)"
              maxWidthClass="max-w-[18rem]"
            />
          </div>
        ),
      },
      {
        accessorKey: "kind",
        header: "Kind",
        cell: ({ getValue }) => (
          <TruncatedText
            text={getValue<string>().replace(/_/g, " ")}
            className="text-xs"
            maxWidthClass="max-w-[9rem]"
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
            onClick={() => openStats(row.original.id)}
          >
            Delivery stats
          </Button>
        ),
      },
    ],
    [openStats],
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
          Broadcast
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

      {panel?.type === "compose" ? (
        <Modal title="Compose notification" onClose={closePanel} wide>
          <p className="mb-3 text-sm text-(--ink-muted)">
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
                <p className="mt-1 text-xs text-(--danger)">
                  {broadcastForm.formState.errors.title.message}
                </p>
              ) : null}
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="bc-body">Body</Label>
              <Textarea id="bc-body" {...broadcastForm.register("body")} />
              {broadcastForm.formState.errors.body ? (
                <p className="mt-1 text-xs text-(--danger)">
                  {broadcastForm.formState.errors.body.message}
                </p>
              ) : null}
            </div>
            <div>
              <Label htmlFor="bc-priority">Priority</Label>
              <Select
                id="bc-priority"
                value={broadcastForm.watch("priority")}
                onChange={(e) =>
                  broadcastForm.setValue(
                    "priority",
                    e.target.value as "normal" | "high" | "urgent",
                  )
                }
              >
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="bc-schedule">Schedule at (optional)</Label>
              <DatePicker
                id="bc-schedule"
                includeTime
                value={broadcastForm.watch("scheduleAt") ?? ""}
                onChange={(e) =>
                  broadcastForm.setValue("scheduleAt", e.target.value)
                }
              />
            </div>
            <div>
              <Label htmlFor="bc-blood">Blood type filter</Label>
              <Select
                id="bc-blood"
                value={broadcastForm.watch("bloodType") ?? ""}
                onChange={(e) =>
                  broadcastForm.setValue("bloodType", e.target.value)
                }
              >
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
              <Select
                id="bc-role"
                value={broadcastForm.watch("role") ?? ""}
                onChange={(e) =>
                  broadcastForm.setValue(
                    "role",
                    e.target.value as "" | "donor" | "requester" | "both",
                  )
                }
              >
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
              <DatePicker
                id="bc-from"
                value={broadcastForm.watch("lastDonationFrom") ?? ""}
                onChange={(e) =>
                  broadcastForm.setValue("lastDonationFrom", e.target.value)
                }
              />
            </div>
            <div>
              <Label htmlFor="bc-to">Last donation to</Label>
              <DatePicker
                id="bc-to"
                value={broadcastForm.watch("lastDonationTo") ?? ""}
                onChange={(e) =>
                  broadcastForm.setValue("lastDonationTo", e.target.value)
                }
              />
            </div>
            {broadcastMutation.error instanceof ApiRequestError ? (
              <p className="sm:col-span-2 text-sm text-(--danger)">
                {broadcastMutation.error.message}
              </p>
            ) : null}
            <div className="flex flex-col-reverse gap-2 border-t border-(--border) pt-4 sm:col-span-2 sm:flex-row sm:justify-end">
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
                disabled={broadcastMutation.isPending}
              >
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
                <p className="mt-1 text-xs text-(--danger)">
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
              <p className="text-sm text-(--danger)">
                {dmMutation.error.message}
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
                disabled={dmMutation.isPending}
              >
                {dmMutation.isPending ? "Sending…" : "Send DM"}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}

      {statsNotificationId ? (
        <Modal title="Delivery stats" onClose={clearStats}>
          <p className="text-sm text-(--ink-muted)">{statsTitle}</p>
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
          <div className="mt-4 border-t border-(--border) pt-4">
            <Button
              variant="secondary"
              className="w-full sm:ml-auto sm:flex sm:w-auto"
              onClick={clearStats}
            >
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
    <div className="rounded-md border border-(--border) bg-(--surface) px-3 py-2">
      <dt className="text-xs text-(--ink-muted)">{label}</dt>
      <dd className="text-lg font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
