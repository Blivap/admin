"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { getSettings, updateSettings } from "@/lib/api/settings";
import { queryKeys } from "@/lib/query-keys";

export const settingsSchema = z.object({
  eligibilityIntervalDays: z.coerce.number().int().min(1).max(365),
  matchingRadiusKm: z.coerce.number().min(1).max(200),
  maxDonorsNotifiedPerRequest: z.coerce.number().int().min(1).max(500),
  escalationTimeoutMinutes: z.coerce.number().int().min(1).max(1440),
  unmatchedAlertThresholdMinutes: z.coerce.number().int().min(1).max(1440),
  maintenanceMode: z.boolean(),
});

export type SettingsFormValues = z.infer<typeof settingsSchema>;

export function useSettings() {
  const queryClient = useQueryClient();
  const settingsQuery = useQuery({
    queryKey: queryKeys.settings.all,
    queryFn: getSettings,
  });

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      eligibilityIntervalDays: 90,
      matchingRadiusKm: 25,
      maxDonorsNotifiedPerRequest: 50,
      escalationTimeoutMinutes: 30,
      unmatchedAlertThresholdMinutes: 15,
      maintenanceMode: false,
    },
  });

  useEffect(() => {
    if (settingsQuery.data) {
      form.reset({
        eligibilityIntervalDays: settingsQuery.data.eligibilityIntervalDays,
        matchingRadiusKm: settingsQuery.data.matchingRadiusKm,
        maxDonorsNotifiedPerRequest:
          settingsQuery.data.maxDonorsNotifiedPerRequest,
        escalationTimeoutMinutes: settingsQuery.data.escalationTimeoutMinutes,
        unmatchedAlertThresholdMinutes:
          settingsQuery.data.unmatchedAlertThresholdMinutes,
        maintenanceMode: settingsQuery.data.maintenanceMode,
      });
    }
  }, [settingsQuery.data, form]);

  const updateMutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.settings.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.overview.all });
    },
  });

  return {
    settingsQuery,
    form,
    updateMutation,
  };
}
