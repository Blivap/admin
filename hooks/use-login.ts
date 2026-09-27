"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { login } from "@/lib/api/auth";
import { ApiRequestError } from "@/lib/api/client";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export function useLogin() {
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/overview";

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: () => {
      // Full navigation so middleware sees the freshly set session cookie.
      const target = from.startsWith("/") ? from : "/overview";
      window.location.assign(target === "/" ? "/overview" : target);
    },
  });

  const errorMessage =
    mutation.error instanceof ApiRequestError
      ? mutation.error.message
      : mutation.error
        ? "Unable to sign in. Try again."
        : null;

  return {
    form,
    mutation,
    errorMessage,
    onSubmit: form.handleSubmit((values) => mutation.mutate(values)),
  };
}
