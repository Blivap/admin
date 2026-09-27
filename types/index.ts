/** Shared domain types for the Blivap admin dashboard. */

export type BloodType =
  | "O-"
  | "O+"
  | "A-"
  | "A+"
  | "B-"
  | "B+"
  | "AB-"
  | "AB+";

export type UserRole = "user" | "donor" | "admin";

export type UserStatus = "active" | "suspended" | "deactivated";

export type BloodRequestStatus = "open" | "matched" | "closed" | "cancelled";

export type VerificationStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "needs_review";

export type NotificationDeliveryStatus =
  | "queued"
  | "sending"
  | "sent"
  | "failed"
  | "partial";

export type NotificationAudience =
  | "all"
  | "donors"
  | "requesters"
  | "admins"
  | "segment";

export type NotificationChannel = "push" | "email" | "sms" | "in_app";

export interface PaginatedMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginatedMeta;
}

export interface ListParams {
  query?: string;
  page?: number;
  pageSize?: number;
}

/* ── Auth ─────────────────────────────────────────────────────────── */

export interface AdminUser {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  roles: UserRole[];
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  admin: AdminUser;
}

/* ── Users ────────────────────────────────────────────────────────── */

export interface AdminUserListItem {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  phonenumber?: string | null;
  bloodType?: BloodType | null;
  roles: UserRole[];
  status: UserStatus;
  isDonor: boolean;
  ninVerified: boolean;
  createdAt: string;
  lastActiveAt?: string | null;
}

export interface AdminUserDetail extends AdminUserListItem {
  city?: string | null;
  state?: string | null;
  eligibilityStatus?: string | null;
  donationCount: number;
  requestCount: number;
  suspendedAt?: string | null;
  suspendedReason?: string | null;
}

export interface UsersListParams extends ListParams {
  bloodType?: BloodType | "";
  status?: UserStatus | "";
  role?: UserRole | "";
}

export interface SuspendUserPayload {
  reason: string;
}

/* ── Blood Requests ───────────────────────────────────────────────── */

export interface AdminBloodRequestListItem {
  id: string;
  requesterId: string;
  requesterName: string;
  neededBloodType: BloodType;
  status: BloodRequestStatus;
  urgent: boolean;
  city?: string | null;
  state?: string | null;
  matchedDonorId?: string | null;
  matchedDonorName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminBloodRequestDetail extends AdminBloodRequestListItem {
  notes?: string | null;
  requesterEmail?: string | null;
  requesterPhone?: string | null;
  escalatedAt?: string | null;
  escalatedReason?: string | null;
}

export interface MatchingLogEntry {
  id: string;
  requestId: string;
  event: string;
  donorId?: string | null;
  donorName?: string | null;
  distanceKm?: number | null;
  score?: number | null;
  message: string;
  createdAt: string;
}

export interface RequestsListParams extends ListParams {
  bloodType?: BloodType | "";
  status?: BloodRequestStatus | "";
  urgent?: "true" | "false" | "";
}

export interface AssignDonorPayload {
  donorId: string;
  note?: string;
}

export interface EscalateRequestPayload {
  reason: string;
}

/* ── Notifications ────────────────────────────────────────────────── */

export interface AdminNotificationListItem {
  id: string;
  subject: string;
  title: string;
  audience: NotificationAudience;
  channels: NotificationChannel[];
  status: NotificationDeliveryStatus;
  recipientCount: number;
  deliveredCount: number;
  failedCount: number;
  createdAt: string;
  sentAt?: string | null;
}

export interface AdminNotificationDetail extends AdminNotificationListItem {
  body: string;
  createdById: string;
  createdByName: string;
}

export interface NotificationDeliveryStats {
  queued: number;
  sent: number;
  delivered: number;
  failed: number;
  opened?: number;
  byChannel: Partial<Record<NotificationChannel, number>>;
}

export interface NotificationsListParams extends ListParams {
  status?: NotificationDeliveryStatus | "";
  audience?: NotificationAudience | "";
}

export interface BroadcastPayload {
  subject: string;
  title: string;
  body: string;
  audience: NotificationAudience;
  channels: NotificationChannel[];
}

/* ── Verifications ────────────────────────────────────────────────── */

export interface AdminVerificationListItem {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: VerificationStatus;
  documentType: string;
  submittedAt: string;
  reviewedAt?: string | null;
  reviewedByName?: string | null;
}

export interface AdminVerificationDetail extends AdminVerificationListItem {
  documentUrl?: string | null;
  notes?: string | null;
  rejectionReason?: string | null;
  identityMatchScore?: number | null;
}

export interface VerificationsListParams extends ListParams {
  status?: VerificationStatus | "";
}

export interface RejectVerificationPayload {
  reason: string;
}

/* ── Analytics ────────────────────────────────────────────────────── */

export interface AnalyticsOverview {
  totalUsers: number;
  totalDonors: number;
  activeRequests: number;
  matchedToday: number;
  donationsThisMonth: number;
  verificationPending: number;
}

export interface AnalyticsTimePoint {
  date: string;
  value: number;
}

export interface AnalyticsSeries {
  label: string;
  points: AnalyticsTimePoint[];
}

export interface AnalyticsDashboard {
  overview: AnalyticsOverview;
  requestsOverTime: AnalyticsSeries;
  donationsOverTime: AnalyticsSeries;
  matchesOverTime: AnalyticsSeries;
  bloodTypeDistribution: { bloodType: BloodType; count: number }[];
}

export interface AnalyticsParams {
  from?: string;
  to?: string;
}

export type AnalyticsExportType =
  | "overview"
  | "requests"
  | "donations"
  | "users";

export interface AnalyticsExportParams extends AnalyticsParams {
  type: AnalyticsExportType;
}

/* ── Settings ─────────────────────────────────────────────────────── */

export interface AdminSettings {
  matchingRadiusKm: number;
  eligibilityIntervalDays: number;
  maintenanceMode: boolean;
  updatedAt?: string;
  updatedByName?: string | null;
}

export interface UpdateSettingsPayload {
  matchingRadiusKm: number;
  eligibilityIntervalDays: number;
  maintenanceMode: boolean;
}
