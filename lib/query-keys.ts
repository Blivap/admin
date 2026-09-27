import type {
  AnalyticsParams,
  NotificationsListParams,
  RequestsListParams,
  UsersListParams,
  VerificationsListParams,
} from "@/types";

export const queryKeys = {
  me: ["auth", "me"] as const,
  users: {
    all: ["users"] as const,
    list: (params: UsersListParams) => ["users", "list", params] as const,
    detail: (id: string) => ["users", "detail", id] as const,
  },
  requests: {
    all: ["requests"] as const,
    list: (params: RequestsListParams) => ["requests", "list", params] as const,
    detail: (id: string) => ["requests", "detail", id] as const,
    matchingLog: (id: string) => ["requests", "matching-log", id] as const,
  },
  notifications: {
    all: ["notifications"] as const,
    list: (params: NotificationsListParams) =>
      ["notifications", "list", params] as const,
    detail: (id: string) => ["notifications", "detail", id] as const,
    stats: (id: string) => ["notifications", "stats", id] as const,
  },
  verifications: {
    all: ["verifications"] as const,
    list: (params: VerificationsListParams) =>
      ["verifications", "list", params] as const,
    detail: (id: string) => ["verifications", "detail", id] as const,
  },
  analytics: {
    all: ["analytics"] as const,
    dashboard: (params: AnalyticsParams) =>
      ["analytics", "dashboard", params] as const,
  },
  settings: {
    all: ["settings"] as const,
  },
};
