"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

import { getSettings, updateSettings } from "@/lib/api/settings";
import { koboToNaira, nairaToKobo } from "@/lib/utils";
import { queryKeys } from "@/lib/query-keys";
import type { AdminSettings, UpdateSettingsPayload } from "@/types";

const distanceBandSchema = z.object({
  maxKm: z.coerce.number().min(0.1).max(50),
  /** Naira in the form; converted to kobo on save. */
  amountNaira: z.coerce.number().min(0),
});

export const settingsSchema = z.object({
  eligibilityIntervalDays: z.coerce.number().int().min(1).max(365),
  matchingRadiusKm: z.coerce.number().min(1).max(200),
  maxDonorsNotifiedPerRequest: z.coerce.number().int().min(1).max(500),
  escalationTimeoutMinutes: z.coerce.number().int().min(1).max(1440),
  unmatchedAlertThresholdMinutes: z.coerce.number().int().min(1).max(1440),
  maintenanceMode: z.boolean(),
  welfareReimbursementEnabled: z.boolean(),
  welfareTariff: z.object({
    distanceBands: z.array(distanceBandSchema).min(1),
    refreshmentNaira: z.coerce.number().min(0),
    otherEligibleNaira: z.coerce.number().min(0),
    capNaira: z.coerce.number().min(0),
  }),
});

export type SettingsFormValues = z.infer<typeof settingsSchema>;

const defaultTariff = {
  distanceBands: [
    { maxKm: 10, amountNaira: 2000 },
    { maxKm: 25, amountNaira: 3500 },
    { maxKm: 50, amountNaira: 5000 },
  ],
  refreshmentNaira: 1500,
  otherEligibleNaira: 0,
  capNaira: 10000,
};

function toFormValues(data: AdminSettings): SettingsFormValues {
  const tariff = data.welfareTariff;
  return {
    eligibilityIntervalDays: data.eligibilityIntervalDays,
    matchingRadiusKm: data.matchingRadiusKm,
    maxDonorsNotifiedPerRequest: data.maxDonorsNotifiedPerRequest,
    escalationTimeoutMinutes: data.escalationTimeoutMinutes,
    unmatchedAlertThresholdMinutes: data.unmatchedAlertThresholdMinutes,
    maintenanceMode: data.maintenanceMode,
    welfareReimbursementEnabled: Boolean(data.welfareReimbursementEnabled),
    welfareTariff:
      tariff?.distanceBands?.length
        ? {
            distanceBands: tariff.distanceBands.map((band) => ({
              maxKm: band.maxKm,
              amountNaira: koboToNaira(band.amountKobo),
            })),
            refreshmentNaira: koboToNaira(tariff.refreshmentKobo ?? 0),
            otherEligibleNaira: koboToNaira(tariff.otherEligibleKobo ?? 0),
            capNaira: koboToNaira(tariff.capKobo ?? 0),
          }
        : defaultTariff,
  };
}

function toPayload(values: SettingsFormValues): UpdateSettingsPayload {
  return {
    eligibilityIntervalDays: values.eligibilityIntervalDays,
    matchingRadiusKm: values.matchingRadiusKm,
    maxDonorsNotifiedPerRequest: values.maxDonorsNotifiedPerRequest,
    escalationTimeoutMinutes: values.escalationTimeoutMinutes,
    unmatchedAlertThresholdMinutes: values.unmatchedAlertThresholdMinutes,
    maintenanceMode: values.maintenanceMode,
    welfareReimbursementEnabled: values.welfareReimbursementEnabled,
    welfareTariff: {
      distanceBands: values.welfareTariff.distanceBands.map((band) => ({
        maxKm: band.maxKm,
        amountKobo: nairaToKobo(band.amountNaira),
      })),
      refreshmentKobo: nairaToKobo(values.welfareTariff.refreshmentNaira),
      otherEligibleKobo: nairaToKobo(values.welfareTariff.otherEligibleNaira),
      capKobo: nairaToKobo(values.welfareTariff.capNaira),
    },
  };
}

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
      welfareReimbursementEnabled: false,
      welfareTariff: defaultTariff,
    },
  });

  const distanceBands = useFieldArray({
    control: form.control,
    name: "welfareTariff.distanceBands",
  });

  useEffect(() => {
    if (settingsQuery.data) {
      form.reset(toFormValues(settingsQuery.data));
    }
  }, [settingsQuery.data, form]);

  const updateMutation = useMutation({
    mutationFn: (values: SettingsFormValues) =>
      updateSettings(toPayload(values)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.settings.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.overview.all });
    },
  });

  return {
    settingsQuery,
    form,
    distanceBands,
    updateMutation,
  };
}
