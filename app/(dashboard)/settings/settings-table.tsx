"use client";

import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ReloadButton } from "@/components/ui/reload-button";
import { useSettings } from "@/hooks/use-settings";
import { ApiRequestError } from "@/lib/api/client";
import { formatDate } from "@/lib/utils";

export function SettingsTable() {
  const { settingsQuery, form, distanceBands, updateMutation } = useSettings();

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
    <div className="max-w-2xl space-y-6">
      <div className="flex justify-end">
        <ReloadButton
          onReload={() => settingsQuery.refetch()}
          loading={settingsQuery.isFetching}
        />
      </div>

      <form
        className="space-y-6"
        onSubmit={form.handleSubmit((values) => updateMutation.mutate(values))}
      >
        <section className="space-y-5 rounded-lg border border-(--border) bg-white p-4 sm:p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-(--ink-muted)">
            Matching & ops
          </h2>
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
            error={
              form.formState.errors.unmatchedAlertThresholdMinutes?.message
            }
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
        </section>

        <section className="space-y-5 rounded-lg border border-(--border) bg-white p-4 sm:p-6">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-(--ink-muted)">
              Welfare reimbursement
            </h2>
            <p className="mt-1 text-sm text-(--ink-muted)">
              Configure the tariff before enabling. When off, apps keep the
              existing booking screens. When on, bookings follow facility
              authorization and this tariff (amounts in naira; stored as kobo).
            </p>
          </div>

          <div className="flex items-start gap-3 rounded-md border border-(--border) bg-(--surface) p-3">
            <input
              id="welfareReimbursementEnabled"
              type="checkbox"
              className="mt-1"
              {...form.register("welfareReimbursementEnabled")}
            />
            <div>
              <Label htmlFor="welfareReimbursementEnabled" className="mb-0">
                Enable welfare reimbursement
              </Label>
              <p className="text-xs text-(--ink-muted)">
                Only authorized blood-collection facilities can complete welfare
                bookings. Trips over 50 km are rejected.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <Label className="mb-0">Distance bands</Label>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() =>
                  distanceBands.append({
                    maxKm: 50,
                    amountNaira: 0,
                  })
                }
              >
                <Plus className="h-3.5 w-3.5" />
                Add band
              </Button>
            </div>
            <p className="text-xs text-(--ink-muted)">
              Each band is the allowance for trips up to that distance (max 50
              km).
            </p>
            <div className="space-y-2">
              {distanceBands.fields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid gap-2 rounded-md border border-(--border) bg-(--surface) p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
                >
                  <Field
                    id={`band-km-${index}`}
                    label="Up to (km)"
                    type="number"
                    step="0.1"
                    error={
                      form.formState.errors.welfareTariff?.distanceBands?.[
                        index
                      ]?.maxKm?.message
                    }
                    {...form.register(
                      `welfareTariff.distanceBands.${index}.maxKm`,
                    )}
                  />
                  <Field
                    id={`band-amount-${index}`}
                    label="Amount (₦)"
                    type="number"
                    step="1"
                    error={
                      form.formState.errors.welfareTariff?.distanceBands?.[
                        index
                      ]?.amountNaira?.message
                    }
                    {...form.register(
                      `welfareTariff.distanceBands.${index}.amountNaira`,
                    )}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="danger"
                    className="sm:mb-0.5"
                    disabled={distanceBands.fields.length <= 1}
                    onClick={() => distanceBands.remove(index)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field
              id="refreshmentNaira"
              label="Refreshment (₦)"
              type="number"
              step="1"
              error={
                form.formState.errors.welfareTariff?.refreshmentNaira?.message
              }
              {...form.register("welfareTariff.refreshmentNaira")}
            />
            <Field
              id="otherEligibleNaira"
              label="Other eligible line (₦)"
              type="number"
              step="1"
              error={
                form.formState.errors.welfareTariff?.otherEligibleNaira?.message
              }
              {...form.register("welfareTariff.otherEligibleNaira")}
            />
            <Field
              id="capNaira"
              label="Cap (₦)"
              hint="Max total for one booking."
              type="number"
              step="1"
              error={form.formState.errors.welfareTariff?.capNaira?.message}
              {...form.register("welfareTariff.capNaira")}
            />
          </div>
        </section>

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
