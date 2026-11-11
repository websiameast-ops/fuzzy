/*
 * MOCK API CLIENT — this build has no backend. Every export keeps the name and signature of
 * the real client so pages are untouched; the network layer below (`getJson`, `postJson`,
 * `postJsonAuth`) answers from in-memory mock data (see data/mockApi.ts) after a short delay.
 */
import type { TokenPair } from './tokenStore';
import type { PmScheduleStateValue, SlaStatusValue, TicketPriorityValue, TicketStatusValue } from '@/utils/status';
import { mockGet } from '@/data/mockApi';
import packageJson from '../../package.json';

/** Backend errors arrive as { code, message } (see app/core/errors.py). */
export class ApiError extends Error {
  code?: string;
  status: number;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const DEMO_EMAIL = 'demo@seconnex.co.th';
// Held in memory only, so a "changed" password resets on reload — there is no server to keep it.
let demoPassword = 'demo123';

/** Short artificial latency so skeleton/loading states appear like they do against a real server. */
function delay<T>(value: () => T, ms = 180): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    window.setTimeout(() => {
      try {
        resolve(value());
      } catch (err) {
        const e = err as { message?: string; status?: number; code?: string };
        reject(e instanceof ApiError ? e : new ApiError(e.message ?? 'Request failed', e.status ?? 500, e.code));
      }
    }, ms);
  });
}

const b64url = (obj: unknown) =>
  btoa(unescape(encodeURIComponent(JSON.stringify(obj)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

/** Unsigned stand-in JWT — the portal only decodes the claims (see lib/jwt.ts), never verifies them. */
function issueTokens(): TokenPair {
  const exp = Math.floor(Date.now() / 1000) + 8 * 60 * 60;
  const claims = { sub: 'U-001', role: 'Company administrator', exp };
  const sign = (kind: string) => `${b64url({ alg: 'none', typ: 'JWT' })}.${b64url({ ...claims, kind })}.mock`;
  return { accessToken: sign('access'), refreshToken: sign('refresh') };
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const b = (body ?? {}) as Record<string, string>;
  return delay(() => {
    switch (path) {
      case '/portal/auth/login':
        if (b.email?.trim().toLowerCase() !== DEMO_EMAIL || b.password !== demoPassword) {
          throw new ApiError('Invalid email or password.', 401, 'UNAUTHORIZED');
        }
        return issueTokens() as T;
      case '/portal/auth/refresh':
        if (!b.refreshToken) throw new ApiError('Session expired.', 401, 'UNAUTHORIZED');
        return issueTokens() as T;
      case '/portal/auth/verify-email':
      case '/portal/auth/reset-password':
        if (!b.token) throw new ApiError('This link is invalid or has expired.', 400, 'VALIDATION_ERROR');
        if (b.newPassword !== b.confirmPassword) throw new ApiError('Passwords do not match.', 400, 'VALIDATION_ERROR');
        demoPassword = b.newPassword;
        return undefined as T;
      default:
        // resend-verification / forgot-password: always succeed (enumeration-safe on the real backend too).
        return undefined as T;
    }
  });
}

export interface AppMetaResponse {
  version: string;
  service: string;
}

/** Public app metadata (no auth) — mirrors backend/VERSION (see app/main.py::meta). */
export async function apiGetMeta(): Promise<AppMetaResponse> {
  return delay(() => ({ version: (packageJson as { version: string }).version, service: 'se-connex-portal' }), 60);
}

export interface LandingVideoResponse {
  enabled: boolean;
  videoUrl: string | null;
}

/** Public landing-page video config (no auth) — see app/api/routers/landing_video.py.
 * Admin manages this from frontend-admin's Settings > Landing Video page. */
export async function apiGetLandingVideo(): Promise<LandingVideoResponse> {
  return delay(() => ({ enabled: false, videoUrl: null }), 60);
}

export function apiLogin(email: string, password: string): Promise<TokenPair> {
  return postJson<TokenPair>('/portal/auth/login', { email, password });
}

export function apiRefreshToken(refreshToken: string): Promise<TokenPair> {
  return postJson<TokenPair>('/portal/auth/refresh', { refreshToken });
}

/** Spends an admin-invite activation link (?token=... on /verify-email): sets
 * the user's own password and flips their account to Active. */
export function apiVerifyEmail(token: string, newPassword: string, confirmPassword: string): Promise<void> {
  return postJson<void>('/portal/auth/verify-email', { token, newPassword, confirmPassword });
}

/** Self-service re-send of an expired/lost activation link. Always resolves —
 * the backend answers the same regardless of whether the email exists or is
 * already verified, so there's nothing to branch on here. */
export function apiResendVerification(email: string): Promise<void> {
  return postJson<void>('/portal/auth/resend-verification', { email });
}

/** "Forgot password?" — issues a reset link for an Active account. Always
 * resolves (enumeration-safe backend response — see apiResendVerification). */
export function apiForgotPassword(email: string): Promise<void> {
  return postJson<void>('/portal/auth/forgot-password', { email });
}

/** Spends a forgot-password link (?token=... on /reset-password) and sets a
 * new password. */
export function apiResetPassword(token: string, newPassword: string, confirmPassword: string): Promise<void> {
  return postJson<void>('/portal/auth/reset-password', { token, newPassword, confirmPassword });
}

export interface ProfileResponse {
  preName: string | null;
  customerName: string | null;
  customerCode: string | null;
  siteList: string | null;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  department: string | null;
  accountExpiresAt: string | null;
}

async function getJson<T>(path: string, accessToken: string): Promise<T> {
  if (!accessToken) throw new ApiError('Not authenticated.', 401, 'UNAUTHORIZED');
  return delay(() => mockGet(path) as T);
}

export function apiGetProfile(accessToken: string): Promise<ProfileResponse> {
  return getJson<ProfileResponse>('/profile', accessToken);
}

async function postJsonAuth<T>(path: string, body: unknown, accessToken: string): Promise<T> {
  if (!accessToken) throw new ApiError('Not authenticated.', 401, 'UNAUTHORIZED');
  const b = (body ?? {}) as Record<string, string>;
  return delay(() => {
    if (path === '/portal/auth/change-password') {
      if (b.currentPassword !== demoPassword) {
        throw new ApiError('Current password is incorrect.', 400, 'VALIDATION_ERROR');
      }
      if (b.newPassword !== b.confirmPassword) throw new ApiError('Passwords do not match.', 400, 'VALIDATION_ERROR');
      demoPassword = b.newPassword;
    }
    return undefined as T;
  });
}

export function apiChangePassword(
  accessToken: string,
  currentPassword: string,
  newPassword: string,
  confirmPassword: string,
): Promise<void> {
  return postJsonAuth<void>(
    '/portal/auth/change-password',
    { currentPassword, newPassword, confirmPassword },
    accessToken,
  );
}

export function apiLogout(accessToken: string): Promise<void> {
  return postJsonAuth<void>('/portal/auth/logout', {}, accessToken);
}

/** Polled in the background so a revoked or idle-timed-out device gets logged
 * out automatically — rejects with ApiError(401) once the session is no longer valid. */
export function apiCheckSession(accessToken: string): Promise<void> {
  return getJson<void>('/portal/auth/session', accessToken);
}

export interface CompanyResponse {
  preName: string | null;
  customerName: string;
  customerCode: string;
  totalUnits: number;
  totalSites: number;
  unitsInWarranty: number;
  unitsWarrantyExpiringSoon: number;
  assignedTickets: number;
  criticalTickets: number;
  upcomingPmCount: number;
  nextPmDue: string | null;
}

export function apiGetCompany(accessToken: string): Promise<CompanyResponse> {
  return getJson<CompanyResponse>('/company', accessToken);
}

export interface SalePersonResponse {
  id: number;
  appCode: string;
  prefixTh: string | null;
  prefixEn: string | null;
  nameTh: string | null;
  nameEn: string | null;
  lastNameTh: string | null;
  lastNameEn: string | null;
  nickNameTh: string | null;
  nickNameEn: string | null;
  positionTh: string | null;
  positionEn: string | null;
  hrDepartment: string | null;
  phone: string | null;
  email: string | null;
}

export interface SEContactProcessResponse {
  id: string;
  labelEn: string;
  labelTh: string;
  status: string;
}

export interface SEContactResponse {
  id: string;
  customerCode: string;
  kpiSalePersonId: number;
  salePerson: SalePersonResponse | null;
  /** null for contacts created before Process existed. */
  processId: string | null;
  process: SEContactProcessResponse | null;
  /** Every process this salesperson serves the company under (one merged card per person). */
  processes: SEContactProcessResponse[];
}

export function apiGetSEContacts(accessToken: string): Promise<SEContactResponse[]> {
  return getJson<SEContactResponse[]>('/company/se-contacts', accessToken);
}

export interface SiteResponse {
  site: string;
}

export function apiGetSites(accessToken: string): Promise<SiteResponse[]> {
  return getJson<SiteResponse[]>('/company/sites', accessToken);
}

export interface MapPointResponse {
  unitId: string;
  assetId: string;
  nameEn: string;
  nameTh: string;
  lat: number;
  lng: number;
  status: string;
  serialNo: string | null;
  aliasCode: string | null;
  position: string | null;
}

export interface MapAssetCodeCount {
  assetCode: string;
  count: number;
}

export interface MapSiteResponse {
  site: string;
  equipmentCount: number;
  assetCodes: MapAssetCodeCount[];
  pendingRequests: number;
  points: MapPointResponse[];
}

/** GET /map/sites — per-site equipment/pending-request rollups and GPS
 * points for the caller's own company. Feeds the portal's /portal/map page. */
export function apiGetMapSites(accessToken: string): Promise<MapSiteResponse[]> {
  return getJson<MapSiteResponse[]>('/map/sites', accessToken);
}

export interface EquipmentWarrantyCounts {
  active: number;
  expiringSoon: number;
  expired: number;
  unknown: number;
}

export interface EquipmentCategorySummaryResponse {
  id: string;
  labelEn: string;
  labelTh: string;
  imageUrl: string | null;
  unitCount: number;
  workingCount: number;
  warranty: EquipmentWarrantyCounts;
}

export function apiGetEquipment(
  accessToken: string,
  params?: { site?: string; q?: string },
): Promise<EquipmentCategorySummaryResponse[]> {
  const qs = new URLSearchParams();
  if (params?.site) qs.set('site', params.site);
  if (params?.q) qs.set('q', params.q);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return getJson<EquipmentCategorySummaryResponse[]>(`/equipment${suffix}`, accessToken);
}

export interface EquipmentUnitResponse {
  id: string;
  assetCode: string | null;
  unitId: string;
  nameEn: string;
  nameTh: string;
  description: string | null;
  serialNo: string | null;
  brandEn: string | null;
  brandTh: string | null;
  categoryEn: string | null;
  categoryTh: string | null;
  site: string | null;
  status: 'Active' | 'UnderRepair' | 'Decommissioned';
  warrantyUntil: string | null;
  warrantyState: 'active' | 'expiringSoon' | 'expired' | 'unknown';
  purchaseDate: string | null;
  nextDue: string | null;
  installDate: string | null;
  installYear: number | null;
  datasheetCount: number;
}

export function apiGetEquipmentUnits(
  accessToken: string,
  params?: {
    category?: string; site?: string; brand?: string; status?: string;
    warranty?: string; year?: number; q?: string; sort?: string;
  },
): Promise<EquipmentUnitResponse[]> {
  const qs = new URLSearchParams();
  if (params?.category) qs.set('category', params.category);
  if (params?.site) qs.set('site', params.site);
  if (params?.brand) qs.set('brand', params.brand);
  if (params?.status) qs.set('status', params.status);
  if (params?.warranty) qs.set('warranty', params.warranty);
  if (params?.year) qs.set('year', String(params.year));
  if (params?.q) qs.set('q', params.q);
  if (params?.sort) qs.set('sort', params.sort);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return getJson<EquipmentUnitResponse[]>(`/equipment/units${suffix}`, accessToken);
}

export interface EquipmentUnitDetailResponse {
  id: string;
  assetCode: string | null;
  unitId: string;
  serialNo: string | null;
  description: string | null;
  brandEn: string | null;
  brandTh: string | null;
  categoryEn: string | null;
  categoryTh: string | null;
  installDate: string | null;
  site: string | null;
  status: 'Active' | 'UnderRepair' | 'Decommissioned';
  warrantyUntil: string | null;
  warrantyState: 'active' | 'expiringSoon' | 'expired' | 'unknown';
  purchaseDate: string | null;
  nextDue: string | null;
}

export function apiGetEquipmentUnit(accessToken: string, unitId: string): Promise<EquipmentUnitDetailResponse> {
  return getJson<EquipmentUnitDetailResponse>(`/equipment/units/${encodeURIComponent(unitId)}`, accessToken);
}

export interface EquipmentDatasheetResponse {
  attachmentId: string;
  fileName: string;
  mimeType: string | null;
  sizeBytes: number | null;
  uploadedAt: string | null;
  url: string;
}

export function apiGetEquipmentUnitDatasheets(accessToken: string, unitId: string): Promise<EquipmentDatasheetResponse[]> {
  return getJson<EquipmentDatasheetResponse[]>(`/equipment/units/${encodeURIComponent(unitId)}/datasheets`, accessToken);
}

export interface EquipmentUnitDocumentResponse {
  attachmentId: string;
  fileName: string;
  mimeType: string | null;
  sizeBytes: number | null;
  uploadedAt: string | null;
  url: string;
  category: string | null;
}

export function apiGetEquipmentUnitDocuments(accessToken: string, unitId: string): Promise<EquipmentUnitDocumentResponse[]> {
  return getJson<EquipmentUnitDocumentResponse[]>(`/equipment/units/${encodeURIComponent(unitId)}/documents`, accessToken);
}

export interface InstallYearResponse {
  installYear: number;
}

export function apiGetInstallYears(accessToken: string): Promise<InstallYearResponse[]> {
  return getJson<InstallYearResponse[]>('/company/install-years', accessToken);
}

export interface PurchaseYearResponse {
  purchaseYear: number;
}

export function apiGetPurchaseYears(accessToken: string): Promise<PurchaseYearResponse[]> {
  return getJson<PurchaseYearResponse[]>('/company/purchase-years', accessToken);
}

export interface DashboardSummaryResponse extends CompanyResponse {
  unitsWarrantyExpired: number;
  unitsNoWarranty: number;
}

export function apiGetDashboardSummary(accessToken: string): Promise<DashboardSummaryResponse> {
  return getJson<DashboardSummaryResponse>('/dashboard/summary', accessToken);
}

export interface DashboardTicketResponse {
  ticket_no: string;
  description: string;
  priority: TicketPriorityValue;
  status: TicketStatusValue;
}

export function apiGetDashboardTickets(accessToken: string): Promise<DashboardTicketResponse[]> {
  return getJson<DashboardTicketResponse[]>('/dashboard/tickets', accessToken);
}

export interface DashboardMaintenanceItemResponse {
  pmId: string;
  nextDue: string;
  pmType: string;
  description: string | null;
  totalUnits: number;
}

export function apiGetDashboardMaintenance(accessToken: string): Promise<DashboardMaintenanceItemResponse[]> {
  return getJson<DashboardMaintenanceItemResponse[]>('/dashboard/maintenance', accessToken);
}

export interface PMScheduleItemResponse {
  nextDue: string;
  assetCode: string;
  pmType: string;
  pmState: PmScheduleStateValue;
}

export function apiGetPMSchedule(
  accessToken: string,
  params?: { site?: string; pmType?: string },
): Promise<PMScheduleItemResponse[]> {
  const qs = new URLSearchParams();
  if (params?.site) qs.set('site', params.site);
  if (params?.pmType) qs.set('pmType', params.pmType);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return getJson<PMScheduleItemResponse[]>(`/pm/schedule${suffix}`, accessToken);
}

export interface PmTypeResponse {
  pmType: string;
}

export function apiGetPMTypes(accessToken: string): Promise<PmTypeResponse[]> {
  return getJson<PmTypeResponse[]>('/pm/types', accessToken);
}

export interface PMCompletedVisitResponse {
  ticketNo: string;
  jobNo: string | null;
  completedAt: string | null;
  assetCode: string;
  site: string | null;
  pmType: string | null;
  description: string;
  engineerName: string | null;
}

export async function apiGetCompletedPmVisits(
  accessToken: string,
  params?: { site?: string; pmType?: string; page?: number; size?: number },
): Promise<{ items: PMCompletedVisitResponse[]; total: number }> {
  const qs = new URLSearchParams();
  if (params?.site) qs.set('site', params.site);
  if (params?.pmType) qs.set('pmType', params.pmType);
  if (params?.page) qs.set('page', String(params.page));
  if (params?.size) qs.set('size', String(params.size));
  const suffix = qs.toString() ? `?${qs.toString()}` : '';

  if (!accessToken) throw new ApiError('Not authenticated.', 401, 'UNAUTHORIZED');
  const payload = await delay(() => mockGet(`/pm/visits/completed${suffix}`) as {
    data: PMCompletedVisitResponse[];
    meta?: { total?: number };
  });
  return {
    items: payload.data as PMCompletedVisitResponse[],
    total: payload.meta?.total ?? 0,
  };
}

export interface TicketTypeResponse {
  type: string;
}

export function apiGetTicketTypes(accessToken: string): Promise<TicketTypeResponse[]> {
  return getJson<TicketTypeResponse[]>('/tickets/types', accessToken);
}

export interface ServiceHistoryResponse {
  reportedAt: string;
  ticketNo: string;
  type: string;
  priority: TicketPriorityValue;
  assetCode: string;
  site: string | null;
  description: string;
  status: TicketStatusValue;
  jobNo: string | null;
  slaStatus: SlaStatusValue | null;
  slaDueAt: string | null;
  slaCompletedAt: string | null;
}

export interface ServiceHistoryStatusCount {
  status: TicketStatusValue;
  count: number;
}

export interface ServiceHistorySummaryResponse {
  total: number;
  statusCounts: ServiceHistoryStatusCount[];
  slaOverdueCount: number;
  sites: string[];
  assetCodes: string[];
}

export interface ServiceHistoryPage {
  items: ServiceHistoryResponse[];
  total: number;
  summary: ServiceHistorySummaryResponse;
}

export async function apiGetTicketHistory(
  accessToken: string,
  params?: {
    q?: string; status?: string; site?: string; type?: string; assetCode?: string;
    page?: number; size?: number;
  },
): Promise<ServiceHistoryPage> {
  const qs = new URLSearchParams();
  if (params?.q) qs.set('q', params.q);
  if (params?.status) qs.set('status', params.status);
  if (params?.site) qs.set('site', params.site);
  if (params?.type) qs.set('type', params.type);
  if (params?.assetCode) qs.set('assetCode', params.assetCode);
  if (params?.page) qs.set('page', String(params.page));
  if (params?.size) qs.set('size', String(params.size));
  const suffix = qs.toString() ? `?${qs.toString()}` : '';

  if (!accessToken) throw new ApiError('Not authenticated.', 401, 'UNAUTHORIZED');
  const payload = await delay(() => mockGet(`/tickets/history${suffix}`) as {
    data: ServiceHistoryResponse[];
    meta?: { total?: number };
    summary: ServiceHistorySummaryResponse;
  });
  return {
    items: payload.data as ServiceHistoryResponse[],
    total: payload.meta?.total ?? 0,
    summary: payload.summary as ServiceHistorySummaryResponse,
  };
}

export interface ServiceReportPhotoResponse {
  attachmentId: string;
  url: string;
  fileName: string;
  uploadedAt: string | null;
  /** The photo's own ChecklistItem label (e.g. "คัปปลิ้งและการ์ด") — used for
   * numbered captions under each thumbnail. */
  labelTh: string | null;
}

export interface ServiceReportReadingResponse {
  itemId: string;
  labelTh: string;
  labelEn: string | null;
  unit: string | null;
  /** Decimal — serialized as a JSON string by the backend (FastAPI's
   * jsonable_encoder), not a number, to preserve exact precision. */
  value: string | null;
  valueText: string | null;
}

export interface ServiceReportPhaseResponse {
  phaseId: string;
  seq: number;
  nameTh: string;
  nameEn: string | null;
  photos: ServiceReportPhotoResponse[];
  readings: ServiceReportReadingResponse[];
  /** PhaseProgress.status — 'done' | 'in_progress' | 'pending', or null if
   * the run never got a progress row for this phase. */
  status: string | null;
}

export interface ServiceReportResponse {
  ticketNo: string;
  type: string;
  description: string | null;
  jobNo: string | null;
  startedAt: string | null;
  customerName: string | null;
  assetCode: string;
  serialNo: string | null;
  site: string | null;
  engineerName: string | null;
  workSummary: string | null;
  rootCause: string | null;
  resolution: string | null;
  notes: string[];
  phases: ServiceReportPhaseResponse[];
  /** Latest job-level Attachment tagged category='signature' — null until a
   * real capture flow writes one (none exists yet, see ServiceReportModal's
   * "Customer signature" section). */
  signatureUrl: string | null;
}

export function apiGetTicketReport(accessToken: string, ticketNo: string): Promise<ServiceReportResponse> {
  return getJson<ServiceReportResponse>(`/tickets/${encodeURIComponent(ticketNo)}/report`, accessToken);
}

/** Embedded tag reference on a feed item — id + bilingual label, Active tags
 * only, joined server-side (see backend NewsRepository.public_feed). */
export interface NewsFeedTag {
  id: string;
  labelEn: string;
  labelTh: string;
}

/** GET /news/feed — published, not-expired articles, newest first. Category
 * slug + bilingual label, and each article's tags, are embedded per item
 * (joined server-side), so no separate categories/tags call is needed (those
 * routes are admin-only). */
export interface NewsFeedItemResponse {
  id: string;
  category: string;
  categoryLabelEn: string;
  categoryLabelTh: string;
  tags: NewsFeedTag[];
  titleEn: string;
  titleTh: string;
  contentEn: string;
  contentTh: string;
  imageUrl: string | null;
  isBanner: boolean;
  isSidebar: boolean;
  publishedAt: string | null;
  // The displayed "date" for an article is startsAt (an admin-chosen display
  // date, see NewsPage.tsx's newsDisplayDate) falling back to createdAt.
  // publishedAt is an internal ordering signal: the server returns the feed
  // published_at DESC, but NewsPage.tsx's useNewsFeed re-sorts client-side
  // by newsSortTime (startsAt, falling back to publishedAt) so "newest
  // first" matches the same startsAt-first rule used for display.
  startsAt: string | null;
  createdAt: string;
}

export function apiGetNewsFeed(accessToken: string): Promise<NewsFeedItemResponse[]> {
  return getJson<NewsFeedItemResponse[]>('/news/feed', accessToken);
}
