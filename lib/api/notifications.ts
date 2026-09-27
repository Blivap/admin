import { apiClient } from "@/lib/api/client";
import { buildQueryString } from "@/lib/utils";
import type {
  AdminNotificationListItem,
  BroadcastPayload,
  DirectMessagePayload,
  NotificationDeliveryStats,
  NotificationsListParams,
  PaginatedResponse,
} from "@/types";

export function listNotificationHistory(params: NotificationsListParams = {}) {
  return apiClient<PaginatedResponse<AdminNotificationListItem>>(
    `/admin/notifications/history${buildQueryString(params)}`,
  );
}

export function getDeliveryStats(id: string) {
  return apiClient<NotificationDeliveryStats>(
    `/admin/notifications/${id}/delivery-stats`,
  );
}

export function sendBroadcast(payload: BroadcastPayload) {
  return apiClient<AdminNotificationListItem>("/admin/notifications/broadcast", {
    method: "POST",
    body: payload,
  });
}

export function sendDirectMessage(userId: string, payload: DirectMessagePayload) {
  return apiClient<AdminNotificationListItem>(
    `/admin/notifications/user/${userId}`,
    { method: "POST", body: payload },
  );
}
