"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useAnalytics } from "@/hooks/use-analytics";
import { ApiRequestError } from "@/lib/api/client";
import type { AnalyticsParams } from "@/types";

export function AnalyticsDashboard({
  initialParams,
}: {
  initialParams: AnalyticsParams;
}) {
  const {
    draftFrom,
    setDraftFrom,
    draftTo,
    setDraftTo,
    groupBy,
    setGroupBy,
    applyFilters,
    overviewQuery,
    requestsQuery,
    exportMutation,
    donorChart,
    matchTrend,
    requestsOverTime,
    anyLoading,
    anyError,
  } = useAnalytics(initialParams);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-lg border border-[var(--border)] bg-white p-4 sm:flex-row sm:items-end">
        <div>
          <Label htmlFor="from">From</Label>
          <Input
            id="from"
            type="date"
            value={draftFrom}
            onChange={(e) => setDraftFrom(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="to">To</Label>
          <Input
            id="to"
            type="date"
            value={draftTo}
            onChange={(e) => setDraftTo(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="groupby">Donors group by</Label>
          <Select
            id="groupby"
            value={groupBy}
            onChange={(e) =>
              setGroupBy(e.target.value as "region" | "bloodType" | "time")
            }
          >
            <option value="bloodType">Blood type</option>
            <option value="region">Region</option>
            <option value="time">Time</option>
          </Select>
        </div>
        <Button variant="secondary" onClick={applyFilters}>
          Apply
        </Button>
        <Button
          className="sm:ml-auto"
          onClick={() => exportMutation.mutate()}
          disabled={exportMutation.isPending}
        >
          {exportMutation.isPending ? "Exporting…" : "Export CSV"}
        </Button>
      </div>

      {exportMutation.error instanceof ApiRequestError ? (
        <p className="text-sm text-[var(--danger)]">
          {exportMutation.error.message}
        </p>
      ) : null}

      {anyLoading ? (
        <EmptyState title="Loading analytics…" />
      ) : anyError ? (
        <EmptyState
          title="Couldn’t load analytics"
          description="One or more analytics endpoints failed. Check the API and retry."
        />
      ) : (
        <>
          {overviewQuery.data ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <Metric
                label="Donors registered"
                value={overviewQuery.data.donorsRegistered}
              />
              <Metric
                label="Fulfilled rate"
                value={`${(overviewQuery.data.fulfilledRate * 100).toFixed(1)}%`}
              />
              <Metric
                label="Unfulfilled rate"
                value={`${(overviewQuery.data.unfulfilledRate * 100).toFixed(1)}%`}
              />
              <Metric
                label="Avg match time"
                value={`${Math.round(overviewQuery.data.avgMatchTimeMinutes)}m`}
              />
              <Metric
                label="Active requests"
                value={overviewQuery.data.activeRequests}
              />
            </div>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title={`Donors by ${groupBy}`}>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={donorChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e6eb" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#b42318" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Avg match time trend">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={matchTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e6eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="value"
                    name="minutes"
                    stroke="#067647"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Requests over time">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={requestsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e6eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="value"
                    name="requests"
                    stroke="#b42318"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            {requestsQuery.data ? (
              <ChartCard title="Request outcomes">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={[
                      {
                        label: "Fulfilled",
                        count: requestsQuery.data.fulfilled,
                      },
                      {
                        label: "Unfulfilled",
                        count: requestsQuery.data.unfulfilled,
                      },
                      { label: "Expired", count: requestsQuery.data.expired },
                      {
                        label: "Cancelled",
                        count: requestsQuery.data.cancelled,
                      },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e6eb" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#175cd3" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-white px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--ink-muted)]">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-white p-4">
      <h2 className="mb-4 text-sm font-semibold">{title}</h2>
      {children}
    </div>
  );
}
