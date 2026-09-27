"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

import { getCmsContent, updateCmsContent } from "@/lib/api/cms";
import { queryKeys } from "@/lib/query-keys";

export const cmsSchema = z.object({
  landingSections: z.array(
    z.object({
      id: z.string(),
      key: z.string().min(1),
      title: z.string().min(1),
      body: z.string().min(1),
      sortOrder: z.coerce.number(),
    }),
  ),
  faqs: z.array(
    z.object({
      id: z.string(),
      question: z.string().min(1),
      answer: z.string().min(1),
      sortOrder: z.coerce.number(),
      published: z.boolean(),
    }),
  ),
  testimonials: z.array(
    z.object({
      id: z.string(),
      authorName: z.string().min(1),
      quote: z.string().min(1),
      role: z.string().optional().nullable(),
      sortOrder: z.coerce.number(),
      published: z.boolean(),
    }),
  ),
});

export type CmsFormValues = z.infer<typeof cmsSchema>;

export function newCmsId() {
  return `tmp_${Math.random().toString(36).slice(2, 10)}`;
}

export function useCms() {
  const queryClient = useQueryClient();
  const cmsQuery = useQuery({
    queryKey: queryKeys.cms.all,
    queryFn: getCmsContent,
  });

  const form = useForm<CmsFormValues>({
    resolver: zodResolver(cmsSchema),
    defaultValues: { landingSections: [], faqs: [], testimonials: [] },
  });

  const sections = useFieldArray({
    control: form.control,
    name: "landingSections",
  });
  const faqs = useFieldArray({ control: form.control, name: "faqs" });
  const testimonials = useFieldArray({
    control: form.control,
    name: "testimonials",
  });

  useEffect(() => {
    if (cmsQuery.data) {
      form.reset({
        landingSections: cmsQuery.data.landingSections,
        faqs: cmsQuery.data.faqs,
        testimonials: cmsQuery.data.testimonials,
      });
    }
  }, [cmsQuery.data, form]);

  const saveMutation = useMutation({
    mutationFn: updateCmsContent,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.cms.all });
    },
  });

  return {
    cmsQuery,
    form,
    sections,
    faqs,
    testimonials,
    saveMutation,
  };
}
