"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useSnackbar } from "@/components/providers/snackbar-provider";
import {
  forceVerifyUser,
  getUser,
  listUsers,
  mergeUsers,
  reactivateUser,
  resetUserPassword,
  suspendUser,
} from "@/lib/api/users";
import { errorMessage } from "@/lib/error-message";
import { queryKeys } from "@/lib/query-keys";
import type { UsersListParams } from "@/types";

export const suspendSchema = z.object({
  reason: z.string().min(5, "Provide a reason (at least 5 characters)"),
});

export const mergeSchema = z.object({
  targetUserId: z.string().min(1, "Target user ID is required"),
  reason: z.string().min(5, "Provide a merge reason"),
});

export type SuspendFormValues = z.infer<typeof suspendSchema>;
export type MergeFormValues = z.infer<typeof mergeSchema>;

const defaultParams: UsersListParams = {
  page: 1,
  pageSize: 20,
  query: "",
  bloodType: "",
  status: "",
  role: "",
  location: "",
};

export function useUsers({
  detailUserId = "",
  onActionSuccess,
}: {
  detailUserId?: string;
  onActionSuccess?: () => void;
} = {}) {
  const queryClient = useQueryClient();
  const { toast } = useSnackbar();
  const [params, setParams] = useState<UsersListParams>(defaultParams);
  const [draftQuery, setDraftQuery] = useState("");
  const [draftLocation, setDraftLocation] = useState("");

  const listQuery = useQuery({
    queryKey: queryKeys.users.list(params),
    queryFn: () => listUsers(params),
  });

  const detailQuery = useQuery({
    queryKey: queryKeys.users.detail(detailUserId),
    queryFn: () => getUser(detailUserId),
    enabled: Boolean(detailUserId),
  });

  const suspendForm = useForm<SuspendFormValues>({
    resolver: zodResolver(suspendSchema),
    defaultValues: { reason: "" },
  });
  const mergeForm = useForm<MergeFormValues>({
    resolver: zodResolver(mergeSchema),
    defaultValues: { targetUserId: "", reason: "" },
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
  };

  const suspendMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      suspendUser(id, { reason }),
    onSuccess: async () => {
      suspendForm.reset();
      onActionSuccess?.();
      await invalidate();
      toast({ title: "User suspended", tone: "success" });
    },
    onError: (error) => {
      toast({
        title: "Couldn’t suspend user",
        description: errorMessage(error),
        tone: "error",
      });
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: reactivateUser,
    onSuccess: async () => {
      await invalidate();
      toast({ title: "User reactivated", tone: "success" });
    },
    onError: (error) => {
      toast({
        title: "Couldn’t reactivate user",
        description: errorMessage(error),
        tone: "error",
      });
    },
  });

  const verifyMutation = useMutation({
    mutationFn: forceVerifyUser,
    onSuccess: async () => {
      await invalidate();
      toast({ title: "User verified", tone: "success" });
    },
    onError: (error) => {
      toast({
        title: "Couldn’t verify user",
        description: errorMessage(error),
        tone: "error",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: resetUserPassword,
    onSuccess: () => {
      toast({
        title: "Password reset queued",
        description: "A reset email will be sent if the account exists.",
        tone: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Couldn’t reset password",
        description: errorMessage(error),
        tone: "error",
      });
    },
  });

  const mergeMutation = useMutation({
    mutationFn: ({
      sourceId,
      values,
    }: {
      sourceId: string;
      values: MergeFormValues;
    }) => mergeUsers(sourceId, values),
    onSuccess: async () => {
      mergeForm.reset();
      onActionSuccess?.();
      await invalidate();
      toast({ title: "Accounts merged", tone: "success" });
    },
    onError: (error) => {
      toast({
        title: "Couldn’t merge accounts",
        description: errorMessage(error),
        tone: "error",
      });
    },
  });

  const applyFilters = () =>
    setParams((prev) => ({
      ...prev,
      query: draftQuery,
      location: draftLocation,
      page: 1,
    }));

  return {
    params,
    setParams,
    draftQuery,
    setDraftQuery,
    draftLocation,
    setDraftLocation,
    applyFilters,
    listQuery,
    detailQuery,
    suspendForm,
    mergeForm,
    suspendMutation,
    reactivateMutation,
    verifyMutation,
    resetPasswordMutation,
    mergeMutation,
  };
}
