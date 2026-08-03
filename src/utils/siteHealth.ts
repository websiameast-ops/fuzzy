import type { Asset, PMVisit, ServiceRequest } from '@/types';

export type SiteStatus = 'normal' | 'warning' | 'alarm';

export interface SiteHealth {
  siteId: string;
  health: number;
  status: SiteStatus;
  assetsCount: number;
  connectedCount: number;
  openTickets: number;
  urgentTickets: number;
  openJobs: number;
  openAlarms: number;
  criticalAlarms: number;
  energyTodayKwh: number;
  co2TodayKg: number;
}

const GRID_EMISSION_FACTOR_KG_PER_KWH = 0.4999;
const OPEN_REQUEST_STATUSES = ['submitted', 'reviewing', 'scheduled', 'assigned', 'in_progress', 'waiting_parts', 'waiting_customer'];

export function computeSiteHealth(
  siteId: string,
  assets: Asset[],
  requests: ServiceRequest[],
  pmVisits: PMVisit[],
): SiteHealth {
  const siteAssets = assets.filter((a) => a.siteId === siteId);
  const connected = siteAssets.filter((a) => a.connected && a.iot);
  const activeAlarms = connected.flatMap((a) => a.iot!.alarms.filter((al) => al.active));
  const criticalAlarms = activeAlarms.filter((al) => al.severity === 'critical').length;
  const warningAlarms = activeAlarms.filter((al) => al.severity === 'warning').length;

  const siteRequests = requests.filter((r) => r.siteId === siteId && OPEN_REQUEST_STATUSES.includes(r.status));
  const urgentTickets = siteRequests.filter((r) => r.priority === 'urgent').length;
  const openJobs = pmVisits.filter((v) => v.siteId === siteId && v.status !== 'completed').length;

  const energyTodayKwh = Math.round(connected.reduce((sum, a) => sum + a.iot!.energyMonthKwh / 30, 0));
  const co2TodayKg = Math.round(energyTodayKwh * GRID_EMISSION_FACTOR_KG_PER_KWH);

  let health = 100 - criticalAlarms * 20 - warningAlarms * 8 - urgentTickets * 6 - Math.max(0, siteRequests.length - urgentTickets) * 2;
  health = Math.max(15, Math.min(100, health));

  const status: SiteStatus = criticalAlarms > 0 ? 'alarm' : health < 85 ? 'warning' : 'normal';

  return {
    siteId,
    health,
    status,
    assetsCount: siteAssets.length,
    connectedCount: connected.length,
    openTickets: siteRequests.length,
    urgentTickets,
    openJobs,
    openAlarms: activeAlarms.length,
    criticalAlarms,
    energyTodayKwh,
    co2TodayKg,
  };
}

export const SITE_STATUS_LABEL: Record<SiteStatus, { en: string; th: string; tone: 'green' | 'amber' | 'red' }> = {
  normal: { en: 'Normal', th: 'ปกติ', tone: 'green' },
  warning: { en: 'Warning', th: 'เฝ้าระวัง', tone: 'amber' },
  alarm: { en: 'Alarm', th: 'สัญญาณเตือน', tone: 'red' },
};
