"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { formatISO, subDays } from "date-fns";
import { useState } from "react";

import {
  exportAnalyticsCsv,
  getAnalyticsOverview,
  getDonorsAnalytics,
  getRequestsAnalytics,
} from "@/lib/api/analytics";
import { queryKeys } from "@/lib/query-keys";
import type { AnalyticsParams } from "@/types";

export function useAnalytics(initialParams: AnalyticsParams) {
  const [params, setParams] = useState<AnalyticsParams>(initialParams);
  const [draftFrom, setDraftFrom] = useState(
    params.from ??
      formatISO(subDays(new Date(), 30), { representation: "date" }),
  );
  const [draftTo, setDraftTo] = useState(
    params.to ?? formatISO(new Date(), { representation: "date" }),
  );
  const [groupBy, setGroupBy] = useState<"region" | "bloodType" | "time">(
    "bloodType",
  );

  const overviewQuery = useQuery({
    queryKey: queryKeys.analytics.overview(params),
    queryFn: () => getAnalyticsOverview(params),
  });

  const donorsQuery = useQuery({
    queryKey: queryKeys.analytics.donors({ ...params, groupBy }),
    queryFn: () => getDonorsAnalytics({ ...params, groupBy }),
  });

  const requestsQuery = useQuery({
    queryKey: queryKeys.analytics.requests(params),
    queryFn: () => getRequestsAnalytics(params),
  });

  const exportMutation = useMutation({
    mutationFn: () => exportAnalyticsCsv(params),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `blivap-analytics-${params.from}-${params.to}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    },
  });

  const donorChart =
    donorsQuery.data?.points.map((p) => {
      if ("key" in p) return { label: p.key, count: p.count };
      return { label: p.date, count: p.value };
    }) ?? [];

  const matchTrend = requestsQuery.data?.avgMatchTimeTrend ?? [];
  const requestsOverTime = requestsQuery.data?.requestsOverTime ?? [];

  const anyLoading =
    overviewQuery.isLoading || donorsQuery.isLoading || requestsQuery.isLoading;
  const anyError =
    overviewQuery.isError || donorsQuery.isError || requestsQuery.isError;

  const applyFilters = () => setParams({ from: draftFrom, to: draftTo });

  return {
    params,
    draftFrom,
    setDraftFrom,
    draftTo,
    setDraftTo,
    groupBy,
    setGroupBy,
    applyFilters,
    overviewQuery,
    donorsQuery,
    requestsQuery,
    exportMutation,
    donorChart,
    matchTrend,
    requestsOverTime,
    anyLoading,
    anyError,
  };
}
