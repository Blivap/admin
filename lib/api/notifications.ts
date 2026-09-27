import { apiClient } from "@/lib/api/client";
import { buildQueryString } from "@/lib/utils";
import type {
  AdminNotificationDetail,
  AdminNotificationListItem,
  BroadcastPayload,
  NotificationDeliveryStats,
  NotificationsListParams,
  PaginatedResponse,
} from "@/types";

export function listNotifications(params: NotificationsListParams = {}) {
  return apiClient<PaginatedResponse<AdminNotificationListItem>>(
    `/admin/notifications${buildQueryString(params)}`,
  );
}

export function getNotification(id: string) {
  return apiClient<AdminNotificationDetail>(`/admin/notifications/${id}`);
}

export function getNotificationStats(id: string) {
  return apiClient<NotificationDeliveryStats>(
    `/admin/notifications/${id}/stats`,
  );
}

export function sendBroadcast(payload: BroadcastPayload) {
  return apiClient<AdminNotificationDetail>("/admin/notifications/broadcast", {
    method: "POST",
    body: payload,
  });
}
