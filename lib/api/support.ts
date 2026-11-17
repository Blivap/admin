import { apiClient } from "@/lib/api/client";
import { buildQueryString } from "@/lib/utils";
import type {
  AdminSupportTicket,
  PaginatedResponse,
  SupportTicketMessage,
  SupportTicketPriority,
  SupportTicketStatus,
  SupportTicketsListParams,
  UpdateSupportTicketStatusPayload,
} from "@/types";

/**
 * Nest `/admin/support/tickets*` returns `{ message, data, meta }`.
 * Tickets are stored in Blivap. The chatbot calls POST /support/escalate to open them.
 */
interface ApiEnvelope<T> {
  success?: boolean;
  message?: string;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    conversationId?: string;
  };
}

function asIso(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function normalizePriority(value: unknown): SupportTicketPriority {
  if (value === "medium") return "normal";
  if (
    value === "low" ||
    value === "normal" ||
    value === "high" ||
    value === "urgent"
  ) {
    return value;
  }
  return "normal";
}

function normalizeStatus(value: unknown): SupportTicketStatus {
  // Legacy status value before waiting_on_user rename.
  if (value === "waiting_for_user") return "waiting_on_user";
  if (
    value === "open" ||
    value === "assigned" ||
    value === "in_progress" ||
    value === "waiting_on_user" ||
    value === "waiting_on_internal" ||
    value === "escalated" ||
    value === "resolved" ||
    value === "closed" ||
    value === "cancelled"
  ) {
    return value;
  }
  return "open";
}

/** Map one support ticket into admin types. */
export function mapSupportTicket(raw: unknown): AdminSupportTicket {
  const row = (raw ?? {}) as Record<string, unknown>;
  return {
    id: String(row.id ?? ""),
    ticketNumber: String(row.ticketNumber ?? ""),
    conversationId: String(row.conversationId ?? ""),
    userId: row.userId != null ? String(row.userId) : null,
    category: String(row.category ?? ""),
    subject: String(row.subject ?? ""),
    description: String(row.description ?? ""),
    priority: normalizePriority(row.priority),
    status: normalizeStatus(row.status),
    source: row.source != null ? String(row.source) : null,
    assignedAgentId:
      row.assignedAgentId != null ? String(row.assignedAgentId) : null,
    resolution: (row.resolution as string | null) ?? null,
    escalationReason: (row.escalationReason as string | null) ?? null,
    cancelReason: (row.cancelReason as string | null) ?? null,
    statusChangedAt: asIso(row.statusChangedAt),
    waitingSince: asIso(row.waitingSince),
    firstResponseAt: asIso(row.firstResponseAt),
    breachedAt: asIso(row.breachedAt),
    resolvedAt: asIso(row.resolvedAt),
    closedAt: asIso(row.closedAt),
    cancelledAt: asIso(row.cancelledAt),
    reopenedAt: asIso(row.reopenedAt),
    reopenCount: Number(row.reopenCount ?? 0),
    waitingDurationMs: Number(row.waitingDurationMs ?? 0),
    createdAt: asIso(row.createdAt),
    updatedAt: asIso(row.updatedAt),
  };
}

function mapMessage(raw: unknown): SupportTicketMessage {
  const row = (raw ?? {}) as Record<string, unknown>;
  return {
    id: String(row.id ?? ""),
    senderType: String(row.senderType ?? "system"),
    content: String(row.content ?? ""),
    messageType: row.messageType != null ? String(row.messageType) : "text",
    createdAt: asIso(row.createdAt),
    metadata:
      row.metadata && typeof row.metadata === "object"
        ? (row.metadata as Record<string, unknown>)
        : undefined,
  };
}

function unwrapData<T>(raw: unknown): T {
  if (raw && typeof raw === "object" && "data" in raw) {
    return (raw as ApiEnvelope<T>).data as T;
  }
  return raw as T;
}

function unwrapList(
  raw: unknown,
  params: SupportTicketsListParams,
): PaginatedResponse<AdminSupportTicket> {
  const envelope = (raw ?? {}) as ApiEnvelope<unknown[]>;
  const rows = Array.isArray(envelope.data)
    ? envelope.data
    : Array.isArray(raw)
      ? (raw as unknown[])
      : [];
  const meta = envelope.meta;
  return {
    data: rows.map(mapSupportTicket),
    meta: {
      page: meta?.page ?? params.page ?? 1,
      pageSize: meta?.limit ?? params.pageSize ?? 20,
      total: meta?.total ?? rows.length,
      totalPages: meta?.totalPages ?? 1,
    },
  };
}

function toListQuery(params: SupportTicketsListParams) {
  return {
    page: params.page,
    limit: params.pageSize,
    status: params.status || undefined,
  };
}

/** GET /admin/support/tickets */
export async function listSupportTickets(
  params: SupportTicketsListParams = {},
) {
  const raw = await apiClient<unknown>(
    `/admin/support/tickets${buildQueryString(toListQuery(params))}`,
  );
  return unwrapList(raw, params);
}

/** GET /admin/support/tickets/:id */
export async function getSupportTicket(id: string) {
  const raw = await apiClient<unknown>(`/admin/support/tickets/${id}`);
  return mapSupportTicket(unwrapData<unknown>(raw));
}

/**
 * GET /admin/support/tickets/:id/messages
 * Transcript stored on the ticket when the chatbot created it (newest-first).
 */
export async function listSupportTicketMessages(
  id: string,
  params: { page?: number; pageSize?: number } = {},
) {
  const raw = await apiClient<unknown>(
    `/admin/support/tickets/${id}/messages${buildQueryString({
      page: params.page,
      limit: params.pageSize ?? 50,
    })}`,
  );
  const envelope = (raw ?? {}) as ApiEnvelope<unknown[]>;
  const rows = Array.isArray(envelope.data)
    ? envelope.data
    : Array.isArray(raw)
      ? (raw as unknown[])
      : [];
  // API returns newest-first; reverse for chat-style oldest→newest.
  const chronological = [...rows].reverse().map(mapMessage);
  return {
    data: chronological,
    meta: {
      page: envelope.meta?.page ?? params.page ?? 1,
      pageSize: envelope.meta?.limit ?? params.pageSize ?? 50,
      total: envelope.meta?.total ?? rows.length,
      totalPages: envelope.meta?.totalPages ?? 1,
    },
    conversationId:
      envelope.meta?.conversationId != null
        ? String(envelope.meta.conversationId)
        : null,
  };
}

/** POST claim — open/assigned/escalated → in_progress, assigned to this admin. */
export async function claimSupportTicket(id: string) {
  const raw = await apiClient<unknown>(`/admin/support/tickets/${id}/claim`, {
    method: "POST",
  });
  return mapSupportTicket(unwrapData<unknown>(raw));
}

/** PATCH status — must follow the allowed ticket transitions. */
export async function updateSupportTicketStatus(
  id: string,
  payload: UpdateSupportTicketStatusPayload,
) {
  const raw = await apiClient<unknown>(`/admin/support/tickets/${id}/status`, {
    method: "PATCH",
    body: payload,
  });
  return mapSupportTicket(unwrapData<unknown>(raw));
}
