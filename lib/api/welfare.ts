import { apiClient } from "@/lib/api/client";
import type {
  CreateWelfarePackagePayload,
  UpdateWelfarePackagePayload,
  WelfarePackage,
} from "@/types";

type ApiEnvelope<T> = {
  message?: string;
  data?: T;
};

function isWelfarePackage(value: unknown): value is WelfarePackage {
  if (!value || typeof value !== "object") return false;
  const row = value as Partial<WelfarePackage>;
  return (
    typeof row.id === "string" &&
    typeof row.title === "string" &&
    typeof row.detail === "string" &&
    typeof row.amountKobo === "number"
  );
}

function unwrapList(raw: unknown): WelfarePackage[] {
  if (Array.isArray(raw)) return raw.filter(isWelfarePackage);
  if (raw && typeof raw === "object" && "data" in raw) {
    const data = (raw as ApiEnvelope<unknown>).data;
    if (Array.isArray(data)) return data.filter(isWelfarePackage);
  }
  return [];
}

function unwrapOne(raw: unknown): WelfarePackage {
  if (isWelfarePackage(raw)) return raw;
  if (raw && typeof raw === "object" && "data" in raw) {
    const data = (raw as ApiEnvelope<unknown>).data;
    if (isWelfarePackage(data)) return data;
  }
  throw new Error("Unexpected welfare package response");
}

export async function listWelfarePackages() {
  const raw = await apiClient<unknown>("/admin/welfare-packages");
  return unwrapList(raw);
}

export async function createWelfarePackage(payload: CreateWelfarePackagePayload) {
  const raw = await apiClient<unknown>("/admin/welfare-packages", {
    method: "POST",
    body: payload,
  });
  return unwrapOne(raw);
}

export async function updateWelfarePackage(
  id: string,
  payload: UpdateWelfarePackagePayload,
) {
  const raw = await apiClient<unknown>(`/admin/welfare-packages/${id}`, {
    method: "PATCH",
    body: payload,
  });
  return unwrapOne(raw);
}

export async function deleteWelfarePackage(id: string) {
  const raw = await apiClient<unknown>(`/admin/welfare-packages/${id}`, {
    method: "DELETE",
  });
  return unwrapOne(raw);
}
