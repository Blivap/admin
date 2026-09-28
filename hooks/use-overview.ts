"use client";

import { useQuery } from "@tanstack/react-query";

import { getOverview } from "@/lib/api/overview";
import { queryKeys } from "@/lib/query-keys";

export function useOverview() {
  const overviewQuery = useQuery({
    queryKey: queryKeys.overview.all,
    queryFn: getOverview,
    refetchInterval: 60_000,
    refetchOnMount: "always",
  });

  return { overviewQuery };
}
