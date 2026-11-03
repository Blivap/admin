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

/** Platform user roles (donors / requesters). Distinct from admin roles. */
export type PlatformUserRole = "donor" | "requester" | "both";

/**
 * Admin RBAC roles on `admin_users`. Designed for growth —
 * do not assume a single super-admin in the data model.
 */
export type AdminRole = "super_admin" | "admin" | "support" | "readonly";

export type UserStatus = "active" | "suspended" | "deactivated";

export type BloodRequestStatus =
  | "active"
  | "matched"
  | "fulfilled"
  | "expired"
  | "cancelled";

export type UrgencyLevel = "normal" | "urgent" | "critical";

export type VerificationStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "flagged";

export type NotificationKind =
  | "urgent_broadcast"
  | "system_announcement"
  | "segmented_campaign"
  | "direct_message"
  | "reengagement"
  | "rebroadcast";

export type NotificationDeliveryStatus =
  | "queued"
  | "sending"
  | "sent"
  | "delivered"
  | "failed"
  | "partial";

export type AuditActionType =
  | "user.suspend"
  | "user.reactivate"
  | "user.verify"
  | "user.reset_password"
  | "user.merge"
  | "user.update"
  | "request.assign_donor"
  | "request.escalate"
  | "request.status_change"
  | "request.rematch"
  | "request.rebroadcast"
  | "notification.broadcast"
  | "notification.direct"
  | "verification.approve"
  | "verification.reject"
  | "verification.flag"
  | "settings.update"
  | "cms.update"
  | "auth.login"
  | "auth.logout";

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

/* ── Auth (Bearer JWT from login response) ────────────────────────── */

/** Roles returned by the platform login payload. */
export type AuthRole = AdminRole | "user";

export interface AdminUser {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  /** One or more roles — schema supports multi-admin growth. */
  roles: AuthRole[];
}

export interface LoginPayload {
  email: string;
  password: string;
}

/** Raw Nest login body (message + data envelope). */
export interface LoginApiResponse {
  message: string;
  data: {
    user: AdminUser;
    accessToken: string;
    accessTokenExpires: string;
  };
}

export interface LoginResponse {
  user: AdminUser;
  accessToken: string;
  accessTokenExpires: string;
}

/* ── Overview ─────────────────────────────────────────────────────── */

export interface OverviewStats {
  activeDonors: number;
  pendingRequests: number;
  matchesToday: number;
  avgMatchTimeMinutes: number;
}

export interface OverviewTimePoint {
  date: string;
  requests: number;
}

export interface UnmatchedAlert {
  requestId: string;
  requesterName: string;
  bloodType: BloodType;
  urgency: UrgencyLevel;
  region?: string | null;
  unmatchedMinutes: number;
  createdAt: string;
}

export interface OverviewDashboard {
  stats: OverviewStats;
  requestsLast30Days: OverviewTimePoint[];
  unmatchedAlerts: UnmatchedAlert[];
  alertThresholdMinutes: number;
}

/* ── Users ────────────────────────────────────────────────────────── */

export interface PushToken {
  id: string;
  token: string;
  platform?: string | null;
  lastUsedAt?: string | null;
}

export interface DonationHistoryItem {
  id: string;
  requestId?: string | null;
  bloodType: BloodType;
  donatedAt: string;
  facilityName?: string | null;
  status: string;
}

export interface AdminUserListItem {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  phonenumber?: string | null;
  bloodType?: BloodType | null;
  /** Platform donor/requester role; `none` when neither flag is set. */
  role: PlatformUserRole | "none";
  status: UserStatus;
  city?: string | null;
  state?: string | null;
  region?: string | null;
  emailVerified: boolean;
  ninVerified: boolean;
  createdAt: string;
  lastActiveAt?: string | null;
  profileImage?: string | null;
  dateOfBirth?: string | null;
  roles?: AuthRole[];
  isSuspended?: boolean;
  suspendedAt?: string | null;
  suspendedReason?: string | null;
}

export interface AdminUserDetail extends AdminUserListItem {
  eligibilityStatus?: string | null;
  donationCount: number;
  requestCount: number;
  suspendedAt?: string | null;
  suspendedReason?: string | null;
  donationHistory: DonationHistoryItem[];
  pushTokens: PushToken[];
  verificationStatus?: VerificationStatus | null;
}

export interface UsersListParams extends ListParams {
  bloodType?: BloodType | "";
  status?: UserStatus | "";
  role?: PlatformUserRole | "";
  location?: string;
}

/** Matches Nest `UpdateAdminUserDto` — profile fields only. */
export interface UpdateUserPayload {
  firstname?: string;
  lastname?: string;
  phonenumber?: string;
  profileImage?: string | null;
  dateOfBirth?: string | null;
}

/** Force-verify email and/or NIN. Empty body defaults to NIN on the API. */
export interface ForceVerifyUserPayload {
  emailVerified?: boolean;
  nationalIdentificationNumberVerified?: boolean;
}

export interface SuspendUserPayload {
  reason: string;
}

export interface MergeUsersPayload {
  targetId: string;
  reason: string;
}

export interface GrantDonorRetryResult {
  userId: string;
  eligibilityStatus: string;
}

/* ── Blood Requests ───────────────────────────────────────────────── */

/**
 * Admin UI status is *derived* from stored domain status + linked bookings.
 * Stored: open → matched → closed | cancelled | expired
 * UI:     active | matched | fulfilled | expired | cancelled
 *
 * Examples: open + pending booking → matched; open + ~7d no live booking →
 * expired (soft, no DB write); completed booking → fulfilled without auto-closing.
 */
export interface AdminBloodRequestListItem {
  id: string;
  requesterId: string;
  requesterName: string;
  neededBloodType: BloodType;
  status: BloodRequestStatus;
  urgency: UrgencyLevel;
  /** State (backend aliases region ← state). */
  region?: string | null;
  city?: string | null;
  state?: string | null;
  matchedDonorId?: string | null;
  matchedDonorName?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface AdminBloodRequestDetail extends AdminBloodRequestListItem {
  notes?: string | null;
  requesterEmail?: string | null;
  requesterPhone?: string | null;
  escalatedAt?: string | null;
  escalatedReason?: string | null;
  currentRadiusKm?: number | null;
}

/**
 * Booking linked to a request via bloodRequestId (not raw geo candidates).
 * `channel` is always `"booking"` from the admin matches endpoint.
 */
export type MatchBookingResponse =
  | "pending"
  | "accepted"
  | "declined"
  | "cancelled"
  | "expired"
  | "completed"
  | "no_show"
  | "awaiting_welfare_funding"
  | "voided";

export interface MatchLogEntry {
  id: string;
  requestId: string;
  donorId: string;
  donorName: string;
  /** Booking createdAt. */
  notifiedAt: string;
  response?: MatchBookingResponse | string | null;
  respondedAt?: string | null;
  responseTimeSeconds?: number | null;
  distanceKm?: number | null;
  channel?: string | null;
}

export interface RequestsListParams extends ListParams {
  bloodType?: BloodType | "";
  status?: BloodRequestStatus | "";
  urgency?: UrgencyLevel | "";
  region?: string;
}

/** Creates a booking and sets stored matched + matchedDonorId. */
export interface AssignDonorPayload {
  donorId: string;
  note?: string;
}

/** Sets critical urgency, widens radius, re-runs discovery (no booking). */
export interface EscalateRequestPayload {
  reason?: string;
  radiusKm?: number;
}

/**
 * Admin write of UI status → stored:
 * active→open, matched→matched, fulfilled→closed, expired→expired, cancelled→cancelled.
 */
export interface UpdateRequestStatusPayload {
  status: BloodRequestStatus;
  reason?: string;
}

export interface RematchPayload {
  note?: string;
}

export interface RebroadcastPayload {
  mode: "same" | "wider_radius" | "force_donor";
  radiusKm?: number;
  donorId?: string;
}

/* ── Notifications ────────────────────────────────────────────────── */

export interface NotificationTargetFilter {
  bloodType?: BloodType | BloodType[];
  region?: string;
  role?: PlatformUserRole;
  lastDonationFrom?: string;
  lastDonationTo?: string;
  inactiveDays?: number;
}

export interface AdminNotificationListItem {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  status: NotificationDeliveryStatus;
  priority?: "normal" | "high" | "urgent";
  requestId?: string | null;
  targetSummary?: string | null;
  recipientCount: number;
  sentCount: number;
  deliveredCount: number;
  openedCount: number;
  failedCount: number;
  createdAt: string;
  scheduledAt?: string | null;
  sentAt?: string | null;
}

export interface NotificationDeliveryStats {
  sent: number;
  delivered: number;
  opened: number;
  failed: number;
  byPlatform?: Record<string, number>;
}

export interface NotificationsListParams extends ListParams {
  kind?: NotificationKind | "";
  status?: NotificationDeliveryStatus | "";
}

export interface BroadcastPayload {
  title: string;
  body: string;
  targetFilter: NotificationTargetFilter;
  scheduleAt?: string | null;
  priority?: "normal" | "high" | "urgent";
}

export interface DirectMessagePayload {
  title: string;
  body: string;
  deepLink?: string;
}

/** Queues a platform-wide system-update email campaign. */
export interface SystemUpdateBroadcastPayload {
  subject: string;
  title: string;
  body: string;
  actionUrl?: string;
  actionLabel?: string;
}

export interface SystemUpdateBroadcastResult {
  queued: number;
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
  flagged?: boolean;
}

export interface AdminVerificationDetail extends AdminVerificationListItem {
  documentUrl?: string | null;
  notes?: string | null;
  rejectionReason?: string | null;
}

export interface VerificationsListParams extends ListParams {
  status?: VerificationStatus | "";
}

export interface RejectVerificationPayload {
  reason: string;
}

export interface FlagVerificationPayload {
  reason: string;
}

/* ── CMS ──────────────────────────────────────────────────────────── */

export interface CmsLandingSection {
  id: string;
  key: string;
  title: string;
  body: string;
  sortOrder: number;
}

export interface CmsFaqEntry {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
  published: boolean;
}

export interface CmsTestimonial {
  id: string;
  authorName: string;
  quote: string;
  role?: string | null;
  sortOrder: number;
  published: boolean;
}

export interface CmsContent {
  landingSections: CmsLandingSection[];
  faqs: CmsFaqEntry[];
  testimonials: CmsTestimonial[];
  updatedAt?: string;
}

export interface UpdateCmsPayload {
  landingSections: CmsLandingSection[];
  faqs: CmsFaqEntry[];
  testimonials: CmsTestimonial[];
}

/* ── Analytics ────────────────────────────────────────────────────── */

export interface AnalyticsOverview {
  donorsRegistered: number;
  fulfilledRate: number;
  unfulfilledRate: number;
  avgMatchTimeMinutes: number;
  activeRequests: number;
}

export interface AnalyticsGroupPoint {
  key: string;
  count: number;
}

export interface AnalyticsTimePoint {
  date: string;
  value: number;
}

export interface DonorsAnalytics {
  groupBy: "region" | "bloodType" | "time";
  points: AnalyticsGroupPoint[] | AnalyticsTimePoint[];
}

export interface RequestsAnalytics {
  fulfilled: number;
  unfulfilled: number;
  expired: number;
  cancelled: number;
  avgMatchTimeTrend: AnalyticsTimePoint[];
  requestsOverTime: AnalyticsTimePoint[];
}

export interface AnalyticsParams {
  from?: string;
  to?: string;
  groupBy?: "region" | "bloodType" | "time";
}

/* ── Settings ─────────────────────────────────────────────────────── */

/** Distance band for welfare trip allowance (amounts in kobo). */
export interface WelfareDistanceBand {
  /** Inclusive upper bound in km for this band. */
  maxKm: number;
  /** Allowance in kobo for trips within this band. */
  amountKobo: number;
}

export interface WelfareTariff {
  distanceBands: WelfareDistanceBand[];
  refreshmentKobo: number;
  otherEligibleKobo: number;
  /** Maximum total welfare amount in kobo for one booking. */
  capKobo: number;
}

export interface AdminSettings {
  eligibilityIntervalDays: number;
  matchingRadiusKm: number;
  maxDonorsNotifiedPerRequest: number;
  escalationTimeoutMinutes: number;
  unmatchedAlertThresholdMinutes: number;
  maintenanceMode: boolean;
  /** When false, booking screens keep today’s (non-welfare) flow. */
  welfareReimbursementEnabled?: boolean;
  welfareTariff?: WelfareTariff | null;
  updatedAt?: string;
  updatedByName?: string | null;
}

export type UpdateSettingsPayload = Partial<
  Omit<AdminSettings, "updatedAt" | "updatedByName">
>;

/* ── Welfare packages ─────────────────────────────────────────────── */

/** Care item donors can arrange. Amounts are kobo. */
export interface WelfarePackage {
  id: string;
  code: string;
  title: string;
  detail: string;
  amountKobo: number;
  sortOrder: number;
  active: boolean;
}

export interface CreateWelfarePackagePayload {
  title: string;
  detail: string;
  amountKobo: number;
  sortOrder?: number;
  active?: boolean;
}

export type UpdateWelfarePackagePayload = Partial<CreateWelfarePackagePayload>;

/* ── Hospitals ────────────────────────────────────────────────────── */

export interface AdminHospitalListItem {
  id: string;
  name: string;
  city?: string | null;
  state?: string | null;
  region?: string | null;
  address?: string | null;
  authorizedBloodCollection: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface HospitalsListParams extends ListParams {
  query?: string;
  authorizedBloodCollection?: boolean | "";
}

/** GeoJSON Point — coordinates are [longitude, latitude]. */
export interface GeoPointPayload {
  type: "Point";
  coordinates: [number, number];
}

export interface CreateHospitalPayload {
  name: string;
  addressLine?: string;
  city?: string;
  state?: string;
  location: GeoPointPayload;
  authorizedBloodCollection?: boolean;
}

export interface UpdateBloodCollectionAuthorizationPayload {
  authorizedBloodCollection: boolean;
}

/* ── Audit Log ────────────────────────────────────────────────────── */

export interface AuditLogEntry {
  id: string;
  action: AuditActionType | string;
  adminId?: string | null;
  adminEmail?: string | null;
  adminName?: string | null;
  resourceType?: string | null;
  resourceId?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface AuditLogsListParams extends ListParams {
  action?: string;
  from?: string;
  to?: string;
}
