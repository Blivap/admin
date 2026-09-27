"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  approveVerification,
  flagVerification,
  listVerifications,
  rejectVerification,
} from "@/lib/api/verifications";
import { queryKeys } from "@/lib/query-keys";
import type { VerificationsListParams } from "@/types";

export const reasonSchema = z.object({
  reason: z.string().min(5, "Reason is required (min 5 characters)"),
});

export type ReasonFormValues = z.infer<typeof reasonSchema>;

const defaultParams: VerificationsListParams = {
  page: 1,
  pageSize: 20,
  query: "",
  status: "pending",
};

export function useVerifications({
  onActionSuccess,
}: {
  onActionSuccess?: () => void;
} = {}) {
  const queryClient = useQueryClient();
  const [params, setParams] = useState<VerificationsListParams>(defaultParams);
  const [draftQuery, setDraftQuery] = useState("");

  const listQuery = useQuery({
    queryKey: queryKeys.verifications.list(params),
    queryFn: () => listVerifications(params),
  });

  const reasonForm = useForm<ReasonFormValues>({
    resolver: zodResolver(reasonSchema),
    defaultValues: { reason: "" },
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({
      queryKey: queryKeys.verifications.all,
    });
  };

  const approveMutation = useMutation({
    mutationFn: approveVerification,
    onSuccess: invalidate,
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      rejectVerification(id, { reason }),
    onSuccess: async () => {
      reasonForm.reset();
      onActionSuccess?.();
      await invalidate();
    },
  });

  const flagMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      flagVerification(id, { reason }),
    onSuccess: async () => {
      reasonForm.reset();
      onActionSuccess?.();
      await invalidate();
    },
  });

  const applyFilters = () =>
    setParams((prev) => ({
      ...prev,
      query: draftQuery,
      page: 1,
    }));

  return {
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
  };
}
