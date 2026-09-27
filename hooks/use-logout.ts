"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { logout } from "@/lib/api/auth";
import { clearSessionToken } from "@/lib/auth/session";

export function useLogout() {
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: logout,
    onSettled: () => {
      clearSessionToken();
      router.replace("/login");
      router.refresh();
    },
  });

  return { mutation };
}
