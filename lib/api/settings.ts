import { apiClient } from "@/lib/api/client";
import type { AdminSettings, UpdateSettingsPayload } from "@/types";

export function getSettings() {
  return apiClient<AdminSettings>("/admin/settings");
}

export function updateSettings(payload: UpdateSettingsPayload) {
  return apiClient<AdminSettings>("/admin/settings", {
    method: "PATCH",
    body: payload,
  });
}
