"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
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
  getNotification,
  getNotificationStats,
  listNotifications,
  sendBroadcast,
} from "@/lib/api/notifications";
import { queryKeys } from "@/lib/query-keys";
import { formatDate } from "@/lib/utils";
import type {
  AdminNotificationListItem,
  NotificationAudience,
  NotificationChannel,
  NotificationDeliveryStatus,
  NotificationsListParams,
} from "@/types";

const CHANNELS: NotificationChannel[] = ["push", "email", "sms", "in_app"];

const broadcastSchema = z.object({
  subject: z.string().min(3, "Subject is required"),
  title: z.string().min(3, "Title is required"),
  body: z.string().min(10, "Body must be at least 10 characters"),
  audience: z.enum(["all", "donors", "requesters", "admins", "segment"]),
  channels: z
    .array(z.enum(["push", "email", "sms", "in_app"]))
    .min(1, "Select at least one channel"),
});

type BroadcastFormValues = z.infer<typeof broadcastSchema>;

type Panel =
  | { type: "compose" }
  | { type: "detail"; notification: AdminNotificationListItem }
  | { type: "stats"; notification: AdminNotificationListItem }
  | null;

function deliveryTone(status: NotificationDeliveryStatus) {
  switch (status) {
    case "sent":
      return "success" as const;
    case "failed":
      return "danger" as const;
    case "partial":
      return "warning" as const;
    case "sending":
    case "queued":
      return "info" as const;
    default:
      return "neutral" as const;
  }
}

export function NotificationsTable() {
  const queryClient = useQueryClient();
  const [params, setParams] = useState<NotificationsListParams>({
    page: 1,
    pageSize: 20,
    query: "",
    status: "",
    audience: "",
  });
  const [draftQuery, setDraftQuery] = useState("");
  const [panel, setPanel] = useState<Panel>(null);

  const listQuery = useQuery({
    queryKey: queryKeys.notifications.list(params),
    queryFn: () => listNotifications(params),
  });

  const detailId = panel?.type === "detail" ? panel.notification.id : "";
  const statsId = panel?.type === "stats" ? panel.notification.id : "";

  const detailQuery = useQuery({
    queryKey: queryKeys.notifications.detail(detailId),
    queryFn: () => getNotification(detailId),
    enabled: Boolean(detailId),
  });

  const statsQuery = useQuery({
    queryKey: queryKeys.notifications.stats(statsId),
    queryFn: () => getNotificationStats(statsId),
    enabled: Boolean(statsId),
  });
  const broadcastForm = useForm<BroadcastFormValues>({
    resolver: zodResolver(broadcastSchema),
    defaultValues: {
      subject: "",
      title: "",
      body: "",
      audience: "all",
      channels: ["push"],
    },
  });

  const broadcastMutation = useMutation({
    mutationFn: sendBroadcast,
    onSuccess: async () => {
      setPanel(null);
      broadcastForm.reset();
      await queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.all,
      });
    },
  });

  const columns = useMemo<ColumnDef<AdminNotificationListItem>[]>(
    () => [
      {
        id: "message",
        header: "Message",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.title}</p>
            <p className="text-xs text-[var(--ink-muted)]">
              {row.original.subject}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "audience",
        header: "Audience",
      },
      {
        id: "channels",
        header: "Channels",
        cell: ({ row }) => row.original.channels.join(", "),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge tone={deliveryTone(row.original.status)}>
            {row.original.status}
          </Badge>
        ),
      },
      {
        id: "delivery",
        header: "Delivery",
        cell: ({ row }) =>
          `${row.original.deliveredCount}/${row.original.recipientCount}`,
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
          <div className="flex gap-1.5">
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                setPanel({ type: "detail", notification: row.original })
              }
            >
              View
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                setPanel({ type: "stats", notification: row.original })
              }
            >
              Stats
            </Button>
          </div>
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
      <div className="mb-4 flex justify-end">
        <Button
          onClick={() => {
            broadcastForm.reset({
              subject: "",
              title: "",
              body: "",
              audience: "all",
              channels: ["push"],
            });
            setPanel({ type: "compose" });
          }}
        >
          Compose broadcast
        </Button>
      </div>

      <TableShell
        toolbar={
          <>
            <div className="min-w-[200px] flex-1">
              <Label htmlFor="notif-query">Search</Label>
              <Input
                id="notif-query"
                placeholder="Subject, title…"
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
              <Label htmlFor="notif-status">Status</Label>
              <Select
                id="notif-status"
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
                <option value="sending">Sending</option>
                <option value="sent">Sent</option>
                <option value="partial">Partial</option>
                <option value="failed">Failed</option>
              </Select>
            </div>
            <div className="w-full sm:w-36">
              <Label htmlFor="notif-audience">Audience</Label>
              <Select
                id="notif-audience"
                value={params.audience ?? ""}
                onChange={(e) =>
                  setParams((prev) => ({
                    ...prev,
                    audience: e.target.value as NotificationAudience | "",
                    page: 1,
                  }))
                }
              >
                <option value="">All</option>
                <option value="all">All users</option>
                <option value="donors">Donors</option>
                <option value="requesters">Requesters</option>
                <option value="admins">Admins</option>
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
          <EmptyState title="Loading notifications…" />
        ) : listQuery.isError ? (
          <EmptyState
            title="Couldn’t load notifications"
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

      {panel?.type === "compose" ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-lg border border-[var(--border)] bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold">Compose broadcast</h2>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">
              Delivery is handled by the API; this dashboard never logs the
              action separately.
            </p>
            <form
              className="mt-4 space-y-4"
              onSubmit={broadcastForm.handleSubmit((values) =>
                broadcastMutation.mutate(values),
              )}
            >
              <div>
                <Label htmlFor="bc-subject">Subject</Label>
                <Input id="bc-subject" {...broadcastForm.register("subject")} />
                {broadcastForm.formState.errors.subject ? (
                  <p className="mt-1 text-xs text-[var(--danger)]">
                    {broadcastForm.formState.errors.subject.message}
                  </p>
                ) : null}
              </div>
              <div>
                <Label htmlFor="bc-title">Title</Label>
                <Input id="bc-title" {...broadcastForm.register("title")} />
                {broadcastForm.formState.errors.title ? (
                  <p className="mt-1 text-xs text-[var(--danger)]">
                    {broadcastForm.formState.errors.title.message}
                  </p>
                ) : null}
              </div>
              <div>
                <Label htmlFor="bc-body">Body</Label>
                <Textarea id="bc-body" {...broadcastForm.register("body")} />
                {broadcastForm.formState.errors.body ? (
                  <p className="mt-1 text-xs text-[var(--danger)]">
                    {broadcastForm.formState.errors.body.message}
                  </p>
                ) : null}
              </div>
              <div>
                <Label htmlFor="bc-audience">Audience</Label>
                <Select
                  id="bc-audience"
                  {...broadcastForm.register("audience")}
                >
                  <option value="all">All users</option>
                  <option value="donors">Donors</option>
                  <option value="requesters">Requesters</option>
                  <option value="admins">Admins</option>
                  <option value="segment">Segment</option>
                </Select>
              </div>
              <div>
                <Label>Channels</Label>
                <Controller
                  control={broadcastForm.control}
                  name="channels"
                  render={({ field }) => (
                    <div className="mt-1 flex flex-wrap gap-3">
                      {CHANNELS.map((channel) => {
                        const checked = field.value.includes(channel);
                        return (
                          <label
                            key={channel}
                            className="flex items-center gap-2 text-sm text-[var(--ink)]"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  field.onChange([...field.value, channel]);
                                } else {
                                  field.onChange(
                                    field.value.filter((c) => c !== channel),
                                  );
                                }
                              }}
                            />
                            {channel}
                          </label>
                        );
                      })}
                    </div>
                  )}
                />
                {broadcastForm.formState.errors.channels ? (
                  <p className="mt-1 text-xs text-[var(--danger)]">
                    {broadcastForm.formState.errors.channels.message}
                  </p>
                ) : null}
              </div>
              {broadcastMutation.error instanceof ApiRequestError ? (
                <p className="text-sm text-[var(--danger)]">
                  {broadcastMutation.error.message}
                </p>
              ) : null}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setPanel(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={broadcastMutation.isPending}>
                  {broadcastMutation.isPending ? "Sending…" : "Send broadcast"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {panel?.type === "detail" ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-lg border border-[var(--border)] bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold">Message detail</h2>
            {detailQuery.isLoading ? (
              <EmptyState title="Loading…" />
            ) : detailQuery.isError ? (
              <EmptyState
                title="Couldn’t load message"
                description={
                  detailQuery.error instanceof ApiRequestError
                    ? detailQuery.error.message
                    : undefined
                }
              />
            ) : detailQuery.data ? (
              <div className="mt-4 space-y-3 text-sm">
                <p>
                  <span className="text-[var(--ink-muted)]">Title:</span>{" "}
                  {detailQuery.data.title}
                </p>
                <p>
                  <span className="text-[var(--ink-muted)]">Subject:</span>{" "}
                  {detailQuery.data.subject}
                </p>
                <p>
                  <span className="text-[var(--ink-muted)]">Audience:</span>{" "}
                  {detailQuery.data.audience}
                </p>
                <p>
                  <span className="text-[var(--ink-muted)]">Channels:</span>{" "}
                  {detailQuery.data.channels.join(", ")}
                </p>
                <p>
                  <span className="text-[var(--ink-muted)]">Created by:</span>{" "}
                  {detailQuery.data.createdByName}
                </p>
                <div className="rounded-md bg-[var(--surface)] p-3 whitespace-pre-wrap">
                  {detailQuery.data.body}
                </div>
              </div>
            ) : null}
            <div className="mt-4 flex justify-end">
              <Button variant="secondary" onClick={() => setPanel(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {panel?.type === "stats" ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg border border-[var(--border)] bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold">Delivery stats</h2>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">
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
                <Stat label="Queued" value={statsQuery.data.queued} />
                <Stat label="Sent" value={statsQuery.data.sent} />
                <Stat label="Delivered" value={statsQuery.data.delivered} />
                <Stat label="Failed" value={statsQuery.data.failed} />
                {Object.entries(statsQuery.data.byChannel).map(
                  ([channel, count]) => (
                    <Stat
                      key={channel}
                      label={`${channel}`}
                      value={count ?? 0}
                    />
                  ),
                )}
              </dl>
            ) : null}
            <div className="mt-4 flex justify-end">
              <Button variant="secondary" onClick={() => setPanel(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
      <dt className="text-xs text-[var(--ink-muted)]">{label}</dt>
      <dd className="mt-0.5 text-lg font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
