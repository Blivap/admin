"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { formatISO, subDays } from "date-fns";
import { useEffect, useState } from "react";

import {
  exportAnalyticsCsv,
  getAnalyticsOverview,
  getDonorsAnalytics,
  getRequestsAnalytics,
} from "@/lib/api/analytics";
import { queryKeys } from "@/lib/query-keys";
import type { AnalyticsParams } from "@/types";

import { useUrlParams } from "./use-url-params";

function defaultFrom() {
  return formatISO(subDays(new Date(), 30), { representation: "date" });
}

function defaultTo() {
  return formatISO(new Date(), { representation: "date" });
}

const urlDefaults = {
  from: "",
  to: "",
  groupBy: "bloodType",
};

export function useAnalytics(_initialParams?: AnalyticsParams) {
  const [url, setUrl] = useUrlParams(urlDefaults);

  const params: AnalyticsParams = {
    from: url.from || defaultFrom(),
    to: url.to || defaultTo(),
  };

  const groupBy = (url.groupBy || "bloodType") as
    | "region"
    | "bloodType"
    | "time";

  const [draftFrom, setDraftFrom] = useState(params.from!);
  const [draftTo, setDraftTo] = useState(params.to!);

  useEffect(() => {
    setDraftFrom(params.from!);
    setDraftTo(params.to!);
  }, [params.from, params.to]);

  const setGroupBy = (next: "region" | "bloodType" | "time") =>
    setUrl({ groupBy: next });

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
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `blivap-analytics-${params.from}-${params.to}.csv`;
      a.click();
      URL.revokeObjectURL(objectUrl);
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

  const applyFilters = () =>
    setUrl({ from: draftFrom, to: draftTo });

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
