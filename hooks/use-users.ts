"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useSnackbar } from "@/components/providers/snackbar-provider";
import {
  forceVerifyUser,
  getUser,
  grantDonorRetry,
  listUsers,
  mergeUsers,
  reactivateUser,
  resetUserPassword,
  suspendUser,
  updateUser,
} from "@/lib/api/users";
import { errorMessage } from "@/lib/error-message";
import { queryKeys } from "@/lib/query-keys";
import type { ForceVerifyUserPayload, UsersListParams } from "@/types";

import { toPositiveInt, useUrlParams } from "./use-url-params";

export const suspendSchema = z.object({
  reason: z.string().min(5, "Provide a reason (at least 5 characters)"),
});

export const mergeSchema = z.object({
  targetId: z.string().min(1, "Target user ID is required"),
  reason: z.string().min(5, "Provide a merge reason"),
});

export const updateUserSchema = z.object({
  firstname: z.string().min(1, "First name is required"),
  lastname: z.string().min(1, "Last name is required"),
  phonenumber: z.string().optional(),
  dateOfBirth: z.string().optional(),
});

export type SuspendFormValues = z.infer<typeof suspendSchema>;
export type MergeFormValues = z.infer<typeof mergeSchema>;
export type UpdateUserFormValues = z.infer<typeof updateUserSchema>;

const urlDefaults = {
  page: "1",
  pageSize: "20",
  query: "",
  bloodType: "",
  status: "",
  role: "",
  location: "",
  userId: "",
};

export function useUsers({
  onActionSuccess,
}: {
  onActionSuccess?: () => void;
} = {}) {
  const queryClient = useQueryClient();
  const { toast } = useSnackbar();
  const [url, setUrl] = useUrlParams(urlDefaults);

  const params: UsersListParams = {
    page: toPositiveInt(url.page, 1),
    pageSize: toPositiveInt(url.pageSize, 20),
    query: url.query,
    bloodType: url.bloodType as UsersListParams["bloodType"],
    status: url.status as UsersListParams["status"],
    role: url.role as UsersListParams["role"],
    location: url.location,
  };

  const detailUserId = url.userId;
  const [draftQuery, setDraftQuery] = useState(url.query);
  const [draftLocation, setDraftLocation] = useState(url.location);

  useEffect(() => {
    setDraftQuery(url.query);
    setDraftLocation(url.location);
  }, [url.query, url.location]);

  const setParams = (
    patch:
      | Partial<UsersListParams>
      | ((prev: UsersListParams) => UsersListParams),
  ) => {
    const next = typeof patch === "function" ? patch(params) : { ...params, ...patch };
    setUrl({
      page: String(next.page ?? 1),
      pageSize: String(next.pageSize ?? 20),
      query: next.query ?? "",
      bloodType: (next.bloodType as string) ?? "",
      status: (next.status as string) ?? "",
      role: (next.role as string) ?? "",
      location: next.location ?? "",
      userId: url.userId,
    });
  };

  const openUser = (userId: string) => setUrl({ userId });
  const clearUser = () => setUrl({ userId: "" });

  const listQuery = useQuery({
    queryKey: queryKeys.users.list(params),
    queryFn: () => listUsers(params),
  });

  const listItem = listQuery.data?.data.find((u) => u.id === detailUserId);

  const detailQuery = useQuery({
    queryKey: queryKeys.users.detail(detailUserId),
    queryFn: () => getUser(detailUserId),
    enabled: Boolean(detailUserId),
    // Seed from the table row so blood type / location show immediately.
    // Detail response nests those under `donor` and used to drop them.
    placeholderData: listItem
      ? {
          ...listItem,
          donationHistory: [],
          pushTokens: [],
          donationCount: 0,
          requestCount: 0,
          eligibilityStatus: null,
        }
      : undefined,
  });

  /** Prefer detail fields; fall back to list row when detail omits donor data. */
  const detailUser = detailQuery.data
    ? {
        ...detailQuery.data,
        bloodType: detailQuery.data.bloodType ?? listItem?.bloodType ?? null,
        city: detailQuery.data.city ?? listItem?.city ?? null,
        state: detailQuery.data.state ?? listItem?.state ?? null,
        region: detailQuery.data.region ?? listItem?.region ?? null,
        emailVerified:
          detailQuery.data.emailVerified || Boolean(listItem?.emailVerified),
        ninVerified:
          detailQuery.data.ninVerified || Boolean(listItem?.ninVerified),
      }
    : undefined;

  const suspendForm = useForm<SuspendFormValues>({
    resolver: zodResolver(suspendSchema),
    defaultValues: { reason: "" },
  });
  const mergeForm = useForm<MergeFormValues>({
    resolver: zodResolver(mergeSchema),
    defaultValues: { targetId: "", reason: "" },
  });
  const updateForm = useForm<UpdateUserFormValues>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      firstname: "",
      lastname: "",
      phonenumber: "",
      dateOfBirth: "",
    },
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
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: ForceVerifyUserPayload;
    }) => forceVerifyUser(id, payload),
    onSuccess: async () => {
      await invalidate();
      toast({ title: "Verification updated", tone: "success" });
    },
    onError: (error) => {
      toast({
        title: "Couldn’t verify user",
        description: errorMessage(error),
        tone: "error",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string;
      values: UpdateUserFormValues;
    }) =>
      updateUser(id, {
        firstname: values.firstname.trim(),
        lastname: values.lastname.trim(),
        phonenumber: values.phonenumber?.trim() || undefined,
        dateOfBirth: values.dateOfBirth?.trim() || undefined,
      }),
    onSuccess: async () => {
      onActionSuccess?.();
      await invalidate();
      toast({ title: "Profile updated", tone: "success" });
    },
    onError: (error) => {
      toast({
        title: "Couldn’t update profile",
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

  const grantRetryMutation = useMutation({
    mutationFn: grantDonorRetry,
    onSuccess: async () => {
      await invalidate();
      toast({
        title: "Donor activation retry granted",
        description: "The donor can try the questionnaire again.",
        tone: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Couldn’t grant activation attempt",
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
    setUrl({
      query: draftQuery,
      location: draftLocation,
      page: "1",
    });

  return {
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
    detailUser,
    suspendForm,
    mergeForm,
    updateForm,
    suspendMutation,
    reactivateMutation,
    verifyMutation,
    updateMutation,
    resetPasswordMutation,
    grantRetryMutation,
    mergeMutation,
  };
}
