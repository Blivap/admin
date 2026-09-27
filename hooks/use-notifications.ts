"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  getDeliveryStats,
  listNotificationHistory,
  sendBroadcast,
  sendDirectMessage,
} from "@/lib/api/notifications";
import { queryKeys } from "@/lib/query-keys";
import type { BloodType, NotificationsListParams } from "@/types";

export const broadcastSchema = z.object({
  title: z.string().min(3, "Title is required"),
  body: z.string().min(10, "Body must be at least 10 characters"),
  priority: z.enum(["normal", "high", "urgent"]),
  scheduleAt: z.string().optional(),
  bloodType: z.string().optional(),
  region: z.string().optional(),
  role: z.enum(["", "donor", "requester", "both"]).optional(),
  lastDonationFrom: z.string().optional(),
  lastDonationTo: z.string().optional(),
  inactiveDays: z.union([z.coerce.number().min(1), z.literal("")]).optional(),
});

export const dmSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  title: z.string().min(3),
  body: z.string().min(5),
  deepLink: z.string().optional(),
});

export type BroadcastFormValues = z.infer<typeof broadcastSchema>;
export type DmFormValues = z.infer<typeof dmSchema>;

const defaultParams: NotificationsListParams = {
  page: 1,
  pageSize: 20,
  query: "",
  kind: "",
  status: "",
};

export function useNotifications({
  statsNotificationId = "",
  onActionSuccess,
}: {
  statsNotificationId?: string;
  onActionSuccess?: () => void;
} = {}) {
  const queryClient = useQueryClient();
  const [params, setParams] = useState<NotificationsListParams>(defaultParams);

  const listQuery = useQuery({
    queryKey: queryKeys.notifications.history(params),
    queryFn: () => listNotificationHistory(params),
  });

  const statsQuery = useQuery({
    queryKey: queryKeys.notifications.stats(statsNotificationId),
    queryFn: () => getDeliveryStats(statsNotificationId),
    enabled: Boolean(statsNotificationId),
  });

  const broadcastForm = useForm<BroadcastFormValues>({
    resolver: zodResolver(broadcastSchema),
    defaultValues: {
      title: "",
      body: "",
      priority: "normal",
      bloodType: "",
      region: "",
      role: "",
    },
  });

  const dmForm = useForm<DmFormValues>({
    resolver: zodResolver(dmSchema),
    defaultValues: { userId: "", title: "", body: "", deepLink: "" },
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({
      queryKey: queryKeys.notifications.all,
    });
  };

  const broadcastMutation = useMutation({
    mutationFn: (values: BroadcastFormValues) =>
      sendBroadcast({
        title: values.title,
        body: values.body,
        priority: values.priority,
        scheduleAt: values.scheduleAt || null,
        targetFilter: {
          bloodType: (values.bloodType || undefined) as BloodType | undefined,
          region: values.region || undefined,
          role: values.role || undefined,
          lastDonationFrom: values.lastDonationFrom || undefined,
          lastDonationTo: values.lastDonationTo || undefined,
          inactiveDays:
            typeof values.inactiveDays === "number"
              ? values.inactiveDays
              : undefined,
        },
      }),
    onSuccess: async () => {
      broadcastForm.reset();
      onActionSuccess?.();
      await invalidate();
    },
  });

  const dmMutation = useMutation({
    mutationFn: (values: DmFormValues) =>
      sendDirectMessage(values.userId, {
        title: values.title,
        body: values.body,
        deepLink: values.deepLink,
      }),
    onSuccess: async () => {
      dmForm.reset();
      onActionSuccess?.();
      await invalidate();
    },
  });

  return {
    params,
    setParams,
    listQuery,
    statsQuery,
    broadcastForm,
    dmForm,
    broadcastMutation,
    dmMutation,
  };
}
