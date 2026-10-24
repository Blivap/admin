"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import {
  listHospitals,
  updateBloodCollectionAuthorization,
} from "@/lib/api/hospitals";
import { queryKeys } from "@/lib/query-keys";
import type { HospitalsListParams } from "@/types";

import { toPositiveInt, useUrlParams } from "./use-url-params";

const urlDefaults = {
  page: "1",
  pageSize: "20",
  query: "",
  authorized: "",
};

export function useHospitals() {
  const queryClient = useQueryClient();
  const [url, setUrl] = useUrlParams(urlDefaults);

  const params: HospitalsListParams = {
    page: toPositiveInt(url.page, 1),
    pageSize: toPositiveInt(url.pageSize, 20),
    query: url.query,
    authorizedBloodCollection:
      url.authorized === "true"
        ? true
        : url.authorized === "false"
          ? false
          : "",
  };

  const [draftQuery, setDraftQuery] = useState(url.query);

  useEffect(() => {
    setDraftQuery(url.query);
  }, [url.query]);

  const setParams = (
    patch:
      | Partial<HospitalsListParams>
      | ((prev: HospitalsListParams) => HospitalsListParams),
  ) => {
    const next =
      typeof patch === "function" ? patch(params) : { ...params, ...patch };
    setUrl({
      page: String(next.page ?? 1),
      pageSize: String(next.pageSize ?? 20),
      query: next.query ?? "",
      authorized:
        next.authorizedBloodCollection === true
          ? "true"
          : next.authorizedBloodCollection === false
            ? "false"
            : "",
    });
  };

  const listQuery = useQuery({
    queryKey: queryKeys.hospitals.list(params),
    queryFn: () => listHospitals(params),
  });

  const authMutation = useMutation({
    mutationFn: ({
      id,
      authorizedBloodCollection,
    }: {
      id: string;
      authorizedBloodCollection: boolean;
    }) =>
      updateBloodCollectionAuthorization(id, { authorizedBloodCollection }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.hospitals.all,
      });
    },
  });

  const applyFilters = () =>
    setUrl({
      query: draftQuery,
      page: "1",
    });

  return {
    params,
    setParams,
    draftQuery,
    setDraftQuery,
    applyFilters,
    listQuery,
    authMutation,
  };
}
