"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { formatISO, subDays } from "date-fns";
import { useState } from "react";
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
import { ApiRequestError } from "@/lib/api/client";
import { exportAnalyticsCsv, getAnalytics } from "@/lib/api/analytics";
import { queryKeys } from "@/lib/query-keys";
import type { AnalyticsExportType, AnalyticsParams } from "@/types";

export function AnalyticsDashboard({
  initialParams,
}: {
  initialParams: AnalyticsParams;
}) {
  const [params, setParams] = useState<AnalyticsParams>(initialParams);
  const [draftFrom, setDraftFrom] = useState(
    params.from ??
      formatISO(subDays(new Date(), 30), { representation: "date" }),
  );
  const [draftTo, setDraftTo] = useState(
    params.to ?? formatISO(new Date(), { representation: "date" }),
  );
  const [exportType, setExportType] =
    useState<AnalyticsExportType>("overview");

  const analyticsQuery = useQuery({
    queryKey: queryKeys.analytics.dashboard(params),
    queryFn: () => getAnalytics(params),
  });

  const exportMutation = useMutation({
    mutationFn: () =>
      exportAnalyticsCsv({
        ...params,
        type: exportType,
      }),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `blivap-analytics-${exportType}-${params.from ?? "all"}-${params.to ?? "now"}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
    },
  });

  const data = analyticsQuery.data;

  const requestChart =
    data?.requestsOverTime.points.map((p) => ({
      date: p.date,
      requests: p.value,
      matches:
        data.matchesOverTime.points.find((m) => m.date === p.date)?.value ?? 0,
      donations:
        data.donationsOverTime.points.find((d) => d.date === p.date)?.value ??
        0,
    })) ?? [];

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
        <Button
          variant="secondary"
          onClick={() => setParams({ from: draftFrom, to: draftTo })}
        >
          Apply range
        </Button>
        <div className="sm:ml-auto flex items-end gap-2">
          <div>
            <Label htmlFor="export-type">CSV export</Label>
            <Select
              id="export-type"
              value={exportType}
              onChange={(e) =>
                setExportType(e.target.value as AnalyticsExportType)
              }
            >
              <option value="overview">Overview</option>
              <option value="requests">Requests</option>
              <option value="donations">Donations</option>
              <option value="users">Users</option>
            </Select>
          </div>
          <Button
            onClick={() => exportMutation.mutate()}
            disabled={exportMutation.isPending}
          >
            {exportMutation.isPending ? "Exporting…" : "Export CSV"}
          </Button>
        </div>
      </div>

      {exportMutation.error instanceof ApiRequestError ? (
        <p className="text-sm text-[var(--danger)]">
          {exportMutation.error.message}
        </p>
      ) : null}

      {analyticsQuery.isLoading ? (
        <EmptyState title="Loading analytics…" />
      ) : analyticsQuery.isError ? (
        <EmptyState
          title="Couldn’t load analytics"
          description={
            analyticsQuery.error instanceof ApiRequestError
              ? analyticsQuery.error.message
              : undefined
          }
        />
      ) : data ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Metric
              label="Total users"
              value={data.overview.totalUsers}
            />
            <Metric
              label="Total donors"
              value={data.overview.totalDonors}
            />
            <Metric
              label="Active requests"
              value={data.overview.activeRequests}
            />
            <Metric
              label="Matched today"
              value={data.overview.matchedToday}
            />
            <Metric
              label="Donations this month"
              value={data.overview.donationsThisMonth}
            />
            <Metric
              label="Pending verifications"
              value={data.overview.verificationPending}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Requests, matches & donations">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={requestChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e6eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="requests"
                    stroke="#b42318"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="matches"
                    stroke="#067647"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="donations"
                    stroke="#175cd3"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Blood type distribution">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.bloodTypeDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e6eb" />
                  <XAxis dataKey="bloodType" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#b42318" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </>
      ) : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-white px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--ink-muted)]">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-[var(--ink)]">
        {value.toLocaleString()}
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
      <h2 className="mb-4 text-sm font-semibold text-[var(--ink)]">{title}</h2>
      {children}
    </div>
  );
}
