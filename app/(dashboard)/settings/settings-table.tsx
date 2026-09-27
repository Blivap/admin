"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiRequestError } from "@/lib/api/client";
import { getSettings, updateSettings } from "@/lib/api/settings";
import { queryKeys } from "@/lib/query-keys";
import { formatDate } from "@/lib/utils";

const settingsSchema = z.object({
  matchingRadiusKm: z.coerce
    .number()
    .min(1, "Minimum 1 km")
    .max(200, "Maximum 200 km"),
  eligibilityIntervalDays: z.coerce
    .number()
    .int("Must be a whole number")
    .min(1, "Minimum 1 day")
    .max(365, "Maximum 365 days"),
  maintenanceMode: z.boolean(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export function SettingsTable() {
  const queryClient = useQueryClient();

  const settingsQuery = useQuery({
    queryKey: queryKeys.settings.all,
    queryFn: getSettings,
  });

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      matchingRadiusKm: 25,
      eligibilityIntervalDays: 90,
      maintenanceMode: false,
    },
  });

  useEffect(() => {
    if (settingsQuery.data) {
      form.reset({
        matchingRadiusKm: settingsQuery.data.matchingRadiusKm,
        eligibilityIntervalDays: settingsQuery.data.eligibilityIntervalDays,
        maintenanceMode: settingsQuery.data.maintenanceMode,
      });
    }
  }, [settingsQuery.data, form]);

  const updateMutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.settings.all });
    },
  });

  if (settingsQuery.isLoading) {
    return <EmptyState title="Loading settings…" />;
  }

  if (settingsQuery.isError) {
    return (
      <EmptyState
        title="Couldn’t load settings"
        description={
          settingsQuery.error instanceof ApiRequestError
            ? settingsQuery.error.message
            : undefined
        }
      />
    );
  }

  return (
    <div className="max-w-xl rounded-lg border border-[var(--border)] bg-white p-6">
      <form
        className="space-y-5"
        onSubmit={form.handleSubmit((values) => updateMutation.mutate(values))}
      >
        <div>
          <Label htmlFor="matchingRadiusKm">Matching radius (km)</Label>
          <Input
            id="matchingRadiusKm"
            type="number"
            step="0.1"
            {...form.register("matchingRadiusKm")}
          />
          {form.formState.errors.matchingRadiusKm ? (
            <p className="mt-1 text-xs text-[var(--danger)]">
              {form.formState.errors.matchingRadiusKm.message}
            </p>
          ) : null}
          <p className="mt-1 text-xs text-[var(--ink-muted)]">
            Maximum distance used when suggesting donors for a blood request.
          </p>
        </div>

        <div>
          <Label htmlFor="eligibilityIntervalDays">
            Eligibility interval (days)
          </Label>
          <Input
            id="eligibilityIntervalDays"
            type="number"
            {...form.register("eligibilityIntervalDays")}
          />
          {form.formState.errors.eligibilityIntervalDays ? (
            <p className="mt-1 text-xs text-[var(--danger)]">
              {form.formState.errors.eligibilityIntervalDays.message}
            </p>
          ) : null}
          <p className="mt-1 text-xs text-[var(--ink-muted)]">
            Minimum days between donations before a donor is marked eligible
            again.
          </p>
        </div>

        <div className="flex items-start gap-3 rounded-md border border-[var(--border)] bg-[var(--surface)] p-3">
          <input
            id="maintenanceMode"
            type="checkbox"
            className="mt-1"
            {...form.register("maintenanceMode")}
          />
          <div>
            <Label htmlFor="maintenanceMode" className="mb-0">
              Maintenance mode
            </Label>
            <p className="text-xs text-[var(--ink-muted)]">
              When enabled, the mobile app shows a maintenance screen and blocks
              new requests.
            </p>
          </div>
        </div>

        {settingsQuery.data?.updatedAt ? (
          <p className="text-xs text-[var(--ink-muted)]">
            Last updated {formatDate(settingsQuery.data.updatedAt)}
            {settingsQuery.data.updatedByName
              ? ` by ${settingsQuery.data.updatedByName}`
              : ""}
          </p>
        ) : null}

        {updateMutation.isSuccess ? (
          <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            Settings saved.
          </p>
        ) : null}

        {updateMutation.error instanceof ApiRequestError ? (
          <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {updateMutation.error.message}
          </p>
        ) : null}

        <Button type="submit" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? "Saving…" : "Save settings"}
        </Button>
      </form>
    </div>
  );
}
