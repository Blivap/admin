"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  createWelfarePackage,
  deleteWelfarePackage,
  listWelfarePackages,
  updateWelfarePackage,
} from "@/lib/api/welfare";
import { queryKeys } from "@/lib/query-keys";
import { nairaToKobo } from "@/lib/utils";
import type { UpdateWelfarePackagePayload } from "@/types";

const BANNED_WELFARE_COPY =
  /pay donor|compensation|reward|blood donation payment|donor gets/i;

const welfareCopy = (label: string) =>
  z
    .string()
    .trim()
    .min(3, `${label} must be at least 3 characters`)
    .max(label === "Name" ? 80 : 240, `${label} is too long`)
    .refine((value) => !BANNED_WELFARE_COPY.test(value), {
      message: "Welfare labels must describe expense reimbursement",
    });

export const welfarePackageSchema = z.object({
  title: welfareCopy("Name"),
  detail: welfareCopy("Description"),
  amountNaira: z.coerce
    .number({ invalid_type_error: "Enter an amount" })
    .min(0, "Amount can’t be negative"),
  active: z.boolean(),
});

export type WelfareFormValues = z.infer<typeof welfarePackageSchema>;

function toPayload(values: WelfareFormValues): UpdateWelfarePackagePayload {
  return {
    title: values.title.trim(),
    detail: values.detail.trim(),
    amountKobo: nairaToKobo(values.amountNaira),
    active: values.active,
  };
}

export function useWelfarePackages() {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: queryKeys.welfare.all,
    queryFn: listWelfarePackages,
  });

  const form = useForm<WelfareFormValues>({
    resolver: zodResolver(welfarePackageSchema),
    defaultValues: {
      title: "",
      detail: "",
      amountNaira: 0,
      active: true,
    },
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.welfare.all });
  };

  const createMutation = useMutation({
    mutationFn: (values: WelfareFormValues) =>
      createWelfarePackage({
        title: values.title.trim(),
        detail: values.detail.trim(),
        amountKobo: nairaToKobo(values.amountNaira),
        active: values.active,
      }),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string;
      values: WelfareFormValues;
    }) => updateWelfarePackage(id, toPayload(values)),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteWelfarePackage,
    onSuccess: invalidate,
  });

  return {
    listQuery,
    form,
    createMutation,
    updateMutation,
    deleteMutation,
  };
}
