"use client";

import { useQuery } from "@tanstack/react-query";

import { getMe } from "@/lib/api/auth";
import { queryKeys } from "@/lib/query-keys";

export function useMe() {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: getMe,
    staleTime: 60_000,
    retry: 1,
  });
}
