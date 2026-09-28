"use client";

import Link from "next/link";
import { BellOff } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { QueryError } from "@/components/ui/query-error";
import { ReloadButton } from "@/components/ui/reload-button";
import { OverviewSkeleton } from "@/components/ui/skeletons";
import { useOverview } from "@/hooks/use-overview";
import { formatDate } from "@/lib/utils";

export function OverviewPanel() {
  const { overviewQuery } = useOverview();

  if (overviewQuery.isLoading) {
    return <OverviewSkeleton />;
  }

  if (overviewQuery.isError) {
    return (
      <QueryError
        title="Couldn’t load overview"
        error={overviewQuery.error}
        onRetry={() => overviewQuery.refetch()}
      />
    );
  }

  const data = overviewQuery.data!;
  const { stats } = data;
  const chartData = data.requestsLast30Days ?? [];
  const alerts = data.unmatchedAlerts ?? [];

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <ReloadButton
          onReload={() => overviewQuery.refetch()}
          loading={overviewQuery.isFetching}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active donors" value={stats?.activeDonors ?? 0} />
        <StatCard label="Pending requests" value={stats?.pendingRequests ?? 0} />
        <StatCard label="Matches today" value={stats?.matchesToday ?? 0} />
        <StatCard
          label="Avg match time"
          value={`${Math.round(stats?.avgMatchTimeMinutes ?? 0)}m`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="rounded-lg border border-(--border) bg-white p-4 lg:col-span-3">
          <h2 className="mb-4 text-sm font-semibold text-(--ink)">
            Requests — last 30 days
          </h2>
          {chartData.length === 0 ? (
            <EmptyState
              className="py-12"
              title="No request activity yet"
              description="Once blood requests start coming in, the 30-day trend will appear here."
            />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e6eb" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="requests"
                  stroke="#b42318"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-lg border border-(--border) bg-white lg:col-span-2">
          <div className="border-b border-(--border) px-4 py-3">
            <h2 className="text-sm font-semibold text-(--ink)">
              Unmatched urgent alerts
            </h2>
            <p className="text-xs text-(--ink-muted)">
              Past {data.alertThresholdMinutes ?? 15} minutes (from settings)
            </p>
          </div>
          {alerts.length === 0 ? (
            <EmptyState
              className="py-12"
              icon={BellOff}
              title="All clear"
              description="No urgent requests have crossed the unmatched threshold."
            />
          ) : (
            <ul className="divide-y divide-(--border)">
              {alerts.map((alert) => (
                <li key={alert.requestId} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link
                        href={`/requests?highlight=${alert.requestId}`}
                        className="text-sm font-medium text-(--brand) hover:underline"
                      >
                        {alert.requesterName}
                      </Link>
                      <p className="mt-0.5 text-xs text-(--ink-muted)">
                        {alert.bloodType}
                        {alert.region ? ` · ${alert.region}` : ""} ·{" "}
                        {formatDate(alert.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge tone="danger">{alert.urgency}</Badge>
                      <p className="mt-1 text-xs tabular-nums text-(--danger)">
                        {alert.unmatchedMinutes}m unmatched
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg border border-(--border) bg-white px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-(--ink-muted)">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-(--ink)">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
    </div>
  );
}
