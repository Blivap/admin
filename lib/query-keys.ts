import type {
  AnalyticsParams,
  AuditLogsListParams,
  NotificationsListParams,
  RequestsListParams,
  UsersListParams,
  VerificationsListParams,
} from "@/types";

export const queryKeys = {
  me: ["auth", "me"] as const,
  overview: {
    all: ["overview"] as const,
  },
  users: {
    all: ["users"] as const,
    list: (params: UsersListParams) => ["users", "list", params] as const,
    detail: (id: string) => ["users", "detail", id] as const,
  },
  requests: {
    all: ["requests"] as const,
    list: (params: RequestsListParams) => ["requests", "list", params] as const,
    detail: (id: string) => ["requests", "detail", id] as const,
    matches: (requestId: string) => ["requests", "matches", requestId] as const,
  },
  notifications: {
    all: ["notifications"] as const,
    history: (params: NotificationsListParams) =>
      ["notifications", "history", params] as const,
    stats: (id: string) => ["notifications", "stats", id] as const,
  },
  verifications: {
    all: ["verifications"] as const,
    list: (params: VerificationsListParams) =>
      ["verifications", "list", params] as const,
    detail: (id: string) => ["verifications", "detail", id] as const,
  },
  cms: {
    all: ["cms"] as const,
  },
  analytics: {
    all: ["analytics"] as const,
    overview: (params: AnalyticsParams) =>
      ["analytics", "overview", params] as const,
    donors: (params: AnalyticsParams) =>
      ["analytics", "donors", params] as const,
    requests: (params: AnalyticsParams) =>
      ["analytics", "requests", params] as const,
  },
  settings: {
    all: ["settings"] as const,
  },
  audit: {
    all: ["audit"] as const,
    list: (params: AuditLogsListParams) => ["audit", "list", params] as const,
  },
};
