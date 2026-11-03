"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useSnackbar } from "@/components/providers/snackbar-provider";
import {
  createHospital,
  listHospitals,
  updateBloodCollectionAuthorization,
} from "@/lib/api/hospitals";
import { errorMessage } from "@/lib/error-message";
import { queryKeys } from "@/lib/query-keys";
import type { HospitalsListParams } from "@/types";

import { toPositiveInt, useUrlParams } from "./use-url-params";

export const createHospitalSchema = z.object({
  name: z.string().min(2, "Facility name is required"),
  addressLine: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  latitude: z.coerce
    .number({ invalid_type_error: "Latitude is required" })
    .min(-90)
    .max(90),
  longitude: z.coerce
    .number({ invalid_type_error: "Longitude is required" })
    .min(-180)
    .max(180),
  authorizedBloodCollection: z.boolean(),
});

export type CreateHospitalFormValues = z.infer<typeof createHospitalSchema>;

const urlDefaults = {
  page: "1",
  pageSize: "20",
  query: "",
  authorized: "",
};

export function useHospitals({
  onActionSuccess,
}: {
  onActionSuccess?: () => void;
} = {}) {
  const queryClient = useQueryClient();
  const { toast } = useSnackbar();
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

  const createForm = useForm<CreateHospitalFormValues>({
    resolver: zodResolver(createHospitalSchema),
    defaultValues: {
      name: "",
      addressLine: "",
      city: "",
      state: "",
      latitude: undefined,
      longitude: undefined,
      authorizedBloodCollection: false,
    },
  });

  const listQuery = useQuery({
    queryKey: queryKeys.hospitals.list(params),
    queryFn: () => listHospitals(params),
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({
      queryKey: queryKeys.hospitals.all,
    });
  };

  const createMutation = useMutation({
    mutationFn: (values: CreateHospitalFormValues) =>
      createHospital({
        name: values.name.trim(),
        addressLine: values.addressLine?.trim() || undefined,
        city: values.city?.trim() || undefined,
        state: values.state?.trim() || undefined,
        location: {
          type: "Point",
          coordinates: [values.longitude, values.latitude],
        },
        authorizedBloodCollection: values.authorizedBloodCollection,
      }),
    onSuccess: async () => {
      createForm.reset({
        name: "",
        addressLine: "",
        city: "",
        state: "",
        latitude: undefined,
        longitude: undefined,
        authorizedBloodCollection: false,
      });
      onActionSuccess?.();
      await invalidate();
      toast({ title: "Facility created", tone: "success" });
    },
    onError: (error) => {
      toast({
        title: "Couldn’t create facility",
        description: errorMessage(error),
        tone: "error",
      });
    },
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
      await invalidate();
      toast({ title: "Authorization updated", tone: "success" });
    },
    onError: (error) => {
      toast({
        title: "Couldn’t update authorization",
        description: errorMessage(error),
        tone: "error",
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
    createForm,
    createMutation,
    authMutation,
  };
}
