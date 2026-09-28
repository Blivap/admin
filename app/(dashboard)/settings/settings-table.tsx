"use client";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ReloadButton } from "@/components/ui/reload-button";
import { useSettings } from "@/hooks/use-settings";
import { ApiRequestError } from "@/lib/api/client";
import { formatDate } from "@/lib/utils";

export function SettingsTable() {
  const { settingsQuery, form, updateMutation } = useSettings();

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
    <div className="max-w-xl rounded-lg border border-(--border) bg-white p-4 sm:p-6">
      <div className="mb-5 flex justify-end">
        <ReloadButton
          onReload={() => settingsQuery.refetch()}
          loading={settingsQuery.isFetching}
        />
      </div>
      <form
        className="space-y-5"
        onSubmit={form.handleSubmit((values) => updateMutation.mutate(values))}
      >
        <Field
          id="eligibilityIntervalDays"
          label="Donation eligibility interval (days)"
          hint="Default 90 days between donations."
          type="number"
          error={form.formState.errors.eligibilityIntervalDays?.message}
          {...form.register("eligibilityIntervalDays")}
        />
        <Field
          id="matchingRadiusKm"
          label="Matching radius default (km)"
          type="number"
          step="0.1"
          error={form.formState.errors.matchingRadiusKm?.message}
          {...form.register("matchingRadiusKm")}
        />
        <Field
          id="maxDonorsNotifiedPerRequest"
          label="Max donors notified per request"
          type="number"
          error={form.formState.errors.maxDonorsNotifiedPerRequest?.message}
          {...form.register("maxDonorsNotifiedPerRequest")}
        />
        <Field
          id="escalationTimeoutMinutes"
          label="Escalation timeout (minutes)"
          type="number"
          error={form.formState.errors.escalationTimeoutMinutes?.message}
          {...form.register("escalationTimeoutMinutes")}
        />
        <Field
          id="unmatchedAlertThresholdMinutes"
          label="Unmatched-request alert threshold (minutes)"
          hint="Used by Overview urgent alerts."
          type="number"
          error={form.formState.errors.unmatchedAlertThresholdMinutes?.message}
          {...form.register("unmatchedAlertThresholdMinutes")}
        />

        <div className="flex items-start gap-3 rounded-md border border-(--border) bg-(--surface) p-3">
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
            <p className="text-xs text-(--ink-muted)">
              Blocks new mobile requests and shows a maintenance screen.
            </p>
          </div>
        </div>

        {settingsQuery.data?.updatedAt ? (
          <p className="text-xs text-(--ink-muted)">
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

function Field({
  id,
  label,
  hint,
  error,
  ...props
}: React.ComponentProps<typeof Input> & {
  label: string;
  hint?: string;
  error?: string;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} {...props} />
      {hint ? (
        <p className="mt-1 text-xs text-(--ink-muted)">{hint}</p>
      ) : null}
      {error ? <p className="mt-1 text-xs text-(--danger)">{error}</p> : null}
    </div>
  );
}
