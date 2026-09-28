"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
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

import { toPositiveInt, useUrlParams } from "./use-url-params";

export const reasonSchema = z.object({
  reason: z.string().min(5, "Reason is required (min 5 characters)"),
});

export type ReasonFormValues = z.infer<typeof reasonSchema>;

/** URL uses "all" for empty API status so it is distinguishable from default pending. */
const urlDefaults = {
  page: "1",
  pageSize: "20",
  query: "",
  status: "pending",
};

function statusFromUrl(raw: string): VerificationsListParams["status"] {
  if (raw === "all" || raw === "") return "";
  return raw as VerificationsListParams["status"];
}

function statusToUrl(status: VerificationsListParams["status"] | undefined) {
  if (!status) return "all";
  return status;
}

export function useVerifications({
  onActionSuccess,
}: {
  onActionSuccess?: () => void;
} = {}) {
  const queryClient = useQueryClient();
  const [url, setUrl] = useUrlParams(urlDefaults);

  const params: VerificationsListParams = {
    page: toPositiveInt(url.page, 1),
    pageSize: toPositiveInt(url.pageSize, 20),
    query: url.query,
    status: statusFromUrl(url.status),
  };

  const [draftQuery, setDraftQuery] = useState(url.query);

  useEffect(() => {
    setDraftQuery(url.query);
  }, [url.query]);

  const setParams = (
    patch:
      | Partial<VerificationsListParams>
      | ((prev: VerificationsListParams) => VerificationsListParams),
  ) => {
    const next = typeof patch === "function" ? patch(params) : { ...params, ...patch };
    setUrl({
      page: String(next.page ?? 1),
      pageSize: String(next.pageSize ?? 20),
      query: next.query ?? "",
      status: statusToUrl(next.status),
    });
  };

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
    setUrl({
      query: draftQuery,
      page: "1",
    });

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
