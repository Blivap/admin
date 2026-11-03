"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  assignDonor,
  escalateRequest,
  getMatches,
  getRequest,
  listRequests,
  rebroadcastRequest,
  rematchRequest,
  updateRequestStatus,
} from "@/lib/api/requests";
import { queryKeys } from "@/lib/query-keys";
import type { BloodRequestStatus, RequestsListParams } from "@/types";

import { toPositiveInt, useUrlParams } from "./use-url-params";

export const assignSchema = z.object({
  donorId: z.string().min(1, "Donor ID is required"),
  note: z.string().optional(),
});

export const escalateSchema = z.object({
  reason: z.string().optional(),
  radiusKm: z.coerce.number().min(1).max(200).optional(),
});

export const rebroadcastSchema = z
  .object({
    mode: z.enum(["same", "wider_radius", "force_donor"]),
    radiusKm: z.coerce.number().min(1).max(200).optional(),
    donorId: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    if (values.mode === "force_donor" && !values.donorId?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Donor ID is required for force-notify",
        path: ["donorId"],
      });
    }
  });

/** Admin write targets — labels map to derived UI statuses stored on the domain. */
export const statusSchema = z.object({
  status: z.enum(["active", "matched", "fulfilled", "expired", "cancelled"]),
  reason: z.string().optional(),
});

export const rematchSchema = z.object({
  note: z.string().optional(),
});

export type AssignFormValues = z.infer<typeof assignSchema>;
export type EscalateFormValues = z.infer<typeof escalateSchema>;
export type RebroadcastFormValues = z.infer<typeof rebroadcastSchema>;
export type StatusFormValues = z.infer<typeof statusSchema>;
export type RematchFormValues = z.infer<typeof rematchSchema>;

/** Ops interventions are for open needs — not terminal outcomes. */
export function canIntervene(status: BloodRequestStatus) {
  return status === "active" || status === "matched";
}

export const STATUS_WRITE_OPTIONS: {
  value: BloodRequestStatus;
  label: string;
  hint: string;
}[] = [
  {
    value: "active",
    label: "Reopen (open)",
    hint: "Writes stored status open",
  },
  {
    value: "matched",
    label: "Mark matched",
    hint: "Writes stored status matched",
  },
  {
    value: "fulfilled",
    label: "Fulfill (closed)",
    hint: "Writes stored status closed",
  },
  {
    value: "expired",
    label: "Expire",
    hint: "Force-expire the need",
  },
  {
    value: "cancelled",
    label: "Cancel",
    hint: "Cancel the need",
  },
];

const urlDefaults = {
  page: "1",
  pageSize: "20",
  query: "",
  bloodType: "",
  status: "",
  urgency: "",
  region: "",
  requestId: "",
  view: "",
};

export function useRequests({
  onActionSuccess,
}: {
  onActionSuccess?: () => void;
} = {}) {
  const queryClient = useQueryClient();
  const [url, setUrl] = useUrlParams(urlDefaults);

  const params: RequestsListParams = {
    page: toPositiveInt(url.page, 1),
    pageSize: toPositiveInt(url.pageSize, 20),
    query: url.query,
    bloodType: url.bloodType as RequestsListParams["bloodType"],
    status: url.status as RequestsListParams["status"],
    urgency: url.urgency as RequestsListParams["urgency"],
    region: url.region,
  };

  const requestId = url.requestId;
  const view = url.view;
  const detailRequestId = requestId && view !== "matches" ? requestId : "";
  const matchesRequestId = requestId && view === "matches" ? requestId : "";

  const [draftQuery, setDraftQuery] = useState(url.query);
  const [draftRegion, setDraftRegion] = useState(url.region);

  useEffect(() => {
    setDraftQuery(url.query);
    setDraftRegion(url.region);
  }, [url.query, url.region]);

  const setParams = (
    patch:
      | Partial<RequestsListParams>
      | ((prev: RequestsListParams) => RequestsListParams),
  ) => {
    const next =
      typeof patch === "function" ? patch(params) : { ...params, ...patch };
    setUrl({
      page: String(next.page ?? 1),
      pageSize: String(next.pageSize ?? 20),
      query: next.query ?? "",
      bloodType: (next.bloodType as string) ?? "",
      status: (next.status as string) ?? "",
      urgency: (next.urgency as string) ?? "",
      region: next.region ?? "",
      requestId: url.requestId,
      view: url.view,
    });
  };

  const openRequest = (id: string, nextView: "" | "matches" = "") =>
    setUrl({ requestId: id, view: nextView });
  const clearRequest = () => setUrl({ requestId: "", view: "" });

  const listQuery = useQuery({
    queryKey: queryKeys.requests.list(params),
    queryFn: () => listRequests(params),
  });

  const detailQuery = useQuery({
    queryKey: queryKeys.requests.detail(detailRequestId),
    queryFn: () => getRequest(detailRequestId),
    enabled: Boolean(detailRequestId),
  });

  const matchesQuery = useQuery({
    queryKey: queryKeys.requests.matches(matchesRequestId),
    queryFn: () => getMatches(matchesRequestId),
    enabled: Boolean(matchesRequestId),
  });

  const assignForm = useForm<AssignFormValues>({
    resolver: zodResolver(assignSchema),
    defaultValues: { donorId: "", note: "" },
  });
  const escalateForm = useForm<EscalateFormValues>({
    resolver: zodResolver(escalateSchema),
    defaultValues: { reason: "", radiusKm: undefined },
  });
  const rebroadcastForm = useForm<RebroadcastFormValues>({
    resolver: zodResolver(rebroadcastSchema),
    defaultValues: { mode: "same", donorId: "", radiusKm: undefined },
  });
  const statusForm = useForm<StatusFormValues>({
    resolver: zodResolver(statusSchema),
    defaultValues: { status: "cancelled", reason: "" },
  });
  const rematchForm = useForm<RematchFormValues>({
    resolver: zodResolver(rematchSchema),
    defaultValues: { note: "" },
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.requests.all });
  };

  const assignMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: AssignFormValues }) =>
      assignDonor(id, values),
    onSuccess: async () => {
      onActionSuccess?.();
      await invalidate();
    },
  });

  const escalateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: EscalateFormValues }) =>
      escalateRequest(id, values),
    onSuccess: async () => {
      onActionSuccess?.();
      await invalidate();
    },
  });

  const rematchMutation = useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string;
      values?: RematchFormValues;
    }) => rematchRequest(id, { note: values?.note }),
    onSuccess: async () => {
      rematchForm.reset({ note: "" });
      onActionSuccess?.();
      await invalidate();
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({
      id,
      status,
      reason,
    }: {
      id: string;
      status: BloodRequestStatus;
      reason?: string;
    }) => updateRequestStatus(id, { status, reason }),
    onSuccess: async () => {
      statusForm.reset({ status: "cancelled", reason: "" });
      onActionSuccess?.();
      await invalidate();
    },
  });

  const rebroadcastMutation = useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string;
      values: RebroadcastFormValues;
    }) => rebroadcastRequest(id, values),
    onSuccess: async () => {
      onActionSuccess?.();
      await invalidate();
    },
  });

  const applyFilters = () =>
    setUrl({
      query: draftQuery,
      region: draftRegion,
      page: "1",
    });

  return {
    params,
    setParams,
    draftQuery,
    setDraftQuery,
    draftRegion,
    setDraftRegion,
    applyFilters,
    requestId,
    view,
    openRequest,
    clearRequest,
    listQuery,
    detailQuery,
    matchesQuery,
    assignForm,
    escalateForm,
    rebroadcastForm,
    statusForm,
    rematchForm,
    assignMutation,
    escalateMutation,
    rematchMutation,
    statusMutation,
    rebroadcastMutation,
  };
}
