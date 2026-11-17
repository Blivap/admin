"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  claimSupportTicket,
  getSupportTicket,
  listSupportTicketMessages,
  listSupportTickets,
  updateSupportTicketStatus,
} from "@/lib/api/support";
import { queryKeys } from "@/lib/query-keys";
import type {
  SupportTicketStatus,
  SupportTicketsListParams,
  UpdateSupportTicketStatusPayload,
} from "@/types";

import { toPositiveInt, useUrlParams } from "./use-url-params";

/** Allowed next statuses (matches Nest/backend ticket transitions). */
export const TICKET_TRANSITIONS: Record<
  SupportTicketStatus,
  readonly SupportTicketStatus[]
> = {
  open: ["assigned", "in_progress", "escalated", "cancelled"],
  assigned: ["in_progress", "escalated", "cancelled"],
  in_progress: [
    "waiting_on_user",
    "waiting_on_internal",
    "escalated",
    "resolved",
    "cancelled",
  ],
  waiting_on_user: ["in_progress", "resolved", "escalated", "cancelled"],
  waiting_on_internal: ["in_progress", "escalated", "cancelled"],
  escalated: ["assigned", "in_progress", "cancelled"],
  resolved: ["open", "closed"],
  closed: [],
  cancelled: [],
};

export const SUPPORT_TICKET_STATUSES: SupportTicketStatus[] = [
  "open",
  "assigned",
  "in_progress",
  "waiting_on_user",
  "waiting_on_internal",
  "escalated",
  "resolved",
  "closed",
  "cancelled",
];

export function canClaimTicket(status: SupportTicketStatus) {
  return (
    status === "open" || status === "assigned" || status === "escalated"
  );
}

export function nextTicketStatuses(status: SupportTicketStatus) {
  return TICKET_TRANSITIONS[status] ?? [];
}

export const statusUpdateSchema = z
  .object({
    status: z.enum([
      "open",
      "assigned",
      "in_progress",
      "waiting_on_user",
      "waiting_on_internal",
      "escalated",
      "resolved",
      "closed",
      "cancelled",
    ]),
    resolution: z.string().max(2000).optional(),
    cancelReason: z.string().max(2000).optional(),
    note: z.string().max(500).optional(),
  })
  .superRefine((values, ctx) => {
    if (
      values.status === "resolved" &&
      !(values.resolution ?? "").trim()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["resolution"],
        message: "Resolution is required when resolving",
      });
    }
    if (
      values.status === "cancelled" &&
      !(values.cancelReason ?? "").trim()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["cancelReason"],
        message: "Cancel reason is required",
      });
    }
    // Backend stores escalationReason from `note` on escalate.
    if (values.status === "escalated" && !(values.note ?? "").trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["note"],
        message: "Escalation note is required",
      });
    }
  });

export type StatusUpdateFormValues = z.infer<typeof statusUpdateSchema>;

const urlDefaults = {
  page: "1",
  pageSize: "20",
  status: "open",
  ticketId: "",
};

function statusFromUrl(raw: string): SupportTicketsListParams["status"] {
  if (raw === "all" || raw === "") return "";
  return raw as SupportTicketStatus;
}

function statusToUrl(status: SupportTicketsListParams["status"] | undefined) {
  if (!status) return "all";
  return status;
}

export function useSupport({
  onActionSuccess,
}: {
  onActionSuccess?: () => void;
} = {}) {
  const queryClient = useQueryClient();
  const [url, setUrl] = useUrlParams(urlDefaults);

  const params: SupportTicketsListParams = {
    page: toPositiveInt(url.page, 1),
    pageSize: toPositiveInt(url.pageSize, 20),
    status: statusFromUrl(url.status),
  };

  const ticketId = url.ticketId;
  const [draftStatus, setDraftStatus] = useState(url.status);

  useEffect(() => {
    setDraftStatus(url.status);
  }, [url.status]);

  const setParams = (
    patch:
      | Partial<SupportTicketsListParams>
      | ((prev: SupportTicketsListParams) => SupportTicketsListParams),
  ) => {
    const next =
      typeof patch === "function" ? patch(params) : { ...params, ...patch };
    setUrl({
      page: String(next.page ?? 1),
      pageSize: String(next.pageSize ?? 20),
      status: statusToUrl(next.status),
      ticketId: url.ticketId,
    });
  };

  const openTicket = (id: string) => setUrl({ ticketId: id });
  const clearTicket = () => setUrl({ ticketId: "" });

  const listQuery = useQuery({
    queryKey: queryKeys.support.list(params),
    queryFn: () => listSupportTickets(params),
  });

  const detailQuery = useQuery({
    queryKey: queryKeys.support.detail(ticketId),
    queryFn: () => getSupportTicket(ticketId),
    enabled: Boolean(ticketId),
  });

  const messagesQuery = useQuery({
    queryKey: queryKeys.support.messages(ticketId),
    queryFn: () =>
      listSupportTicketMessages(ticketId, { page: 1, pageSize: 50 }),
    enabled: Boolean(ticketId),
  });

  const statusForm = useForm<StatusUpdateFormValues>({
    resolver: zodResolver(statusUpdateSchema),
    defaultValues: {
      status: "in_progress",
      resolution: "",
      cancelReason: "",
      note: "",
    },
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.support.all });
  };

  const claimMutation = useMutation({
    mutationFn: claimSupportTicket,
    onSuccess: async () => {
      onActionSuccess?.();
      await invalidate();
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateSupportTicketStatusPayload;
    }) => updateSupportTicketStatus(id, payload),
    onSuccess: async () => {
      statusForm.reset();
      onActionSuccess?.();
      await invalidate();
    },
  });

  const applyFilters = () =>
    setUrl({
      status: draftStatus || "all",
      page: "1",
    });

  return {
    params,
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
  };
}
