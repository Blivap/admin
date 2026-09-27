"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
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

export const assignSchema = z.object({
  donorId: z.string().min(1, "Donor ID is required"),
  note: z.string().optional(),
});

export const escalateSchema = z.object({
  reason: z.string().optional(),
  radiusKm: z.coerce.number().min(1).max(200).optional(),
});

export const rebroadcastSchema = z.object({
  mode: z.enum(["same", "wider_radius", "force_donor"]),
  radiusKm: z.coerce.number().min(1).max(200).optional(),
  donorId: z.string().optional(),
});

export type AssignFormValues = z.infer<typeof assignSchema>;
export type EscalateFormValues = z.infer<typeof escalateSchema>;
export type RebroadcastFormValues = z.infer<typeof rebroadcastSchema>;

const defaultParams: RequestsListParams = {
  page: 1,
  pageSize: 20,
  query: "",
  bloodType: "",
  status: "",
  urgency: "",
  region: "",
};

export function useRequests({
  detailRequestId = "",
  matchesRequestId = "",
  onActionSuccess,
}: {
  detailRequestId?: string;
  matchesRequestId?: string;
  onActionSuccess?: () => void;
} = {}) {
  const queryClient = useQueryClient();
  const [params, setParams] = useState<RequestsListParams>(defaultParams);
  const [draftQuery, setDraftQuery] = useState("");
  const [draftRegion, setDraftRegion] = useState("");

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
    defaultValues: { mode: "same" },
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
    mutationFn: (id: string) => rematchRequest(id),
    onSuccess: invalidate,
  });

  const statusMutation = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: BloodRequestStatus;
    }) => updateRequestStatus(id, { status }),
    onSuccess: invalidate,
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
    setParams((prev) => ({
      ...prev,
      query: draftQuery,
      region: draftRegion,
      page: 1,
    }));

  return {
    params,
    setParams,
    draftQuery,
    setDraftQuery,
    draftRegion,
    setDraftRegion,
    applyFilters,
    listQuery,
    detailQuery,
    matchesQuery,
    assignForm,
    escalateForm,
    rebroadcastForm,
    assignMutation,
    escalateMutation,
    rematchMutation,
    statusMutation,
    rebroadcastMutation,
  };
}
