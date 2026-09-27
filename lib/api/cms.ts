import { apiClient } from "@/lib/api/client";
import type { CmsContent, UpdateCmsPayload } from "@/types";

export function getCmsContent() {
  return apiClient<CmsContent>("/admin/cms");
}

export function updateCmsContent(payload: UpdateCmsPayload) {
  return apiClient<CmsContent>("/admin/cms", {
    method: "PUT",
    body: payload,
  });
}
