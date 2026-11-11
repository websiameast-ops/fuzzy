/**
 * In-memory stand-in for the SE Connex backend. `lib/apiClient.ts` routes every GET through
 * `mockGet(path)`, which answers with data built from the static mock datasets in this folder,
 * so every page behaves as it does against the real API without any server.
 */
import type {
  CompanyResponse,
  DashboardMaintenanceItemResponse,
  DashboardSummaryResponse,
  DashboardTicketResponse,
  EquipmentCategorySummaryResponse,
  EquipmentDatasheetResponse,
  EquipmentUnitDetailResponse,
  EquipmentUnitDocumentResponse,
  EquipmentUnitResponse,
  MapSiteResponse,
  NewsFeedItemResponse,
  PMCompletedVisitResponse,
  PMScheduleItemResponse,
  ProfileResponse,
  SEContactResponse,
  ServiceHistoryResponse,
  ServiceHistorySummaryResponse,
  ServiceReportResponse,
} from '@/lib/apiClient';
import type { PmScheduleStateValue, TicketPriorityValue, TicketStatusValue } from '@/utils/status';
import { OPEN_TICKET_STATUSES } from '@/utils/status';
import type { Priority, RequestStatus } from '@/types';
import { getAssetUrl } from '@/utils/assets';
import { TODAY } from '@/utils/format';
import { mockCompanies } from './mockCompanies';
import { mockHistory } from './mockHistory';
import { mockNews } from './mockNews';
import { mockPM } from './mockPM';
import { mockRequests } from './mockRequests';
import { assetsFor } from './mockAssets';
import { mockUnits } from './mockUnits';
import type { MockUnit } from './mockUnits';
import { tokenStore } from '@/lib/tokenStore';
import { mockUsers } from './mockUsers';

/* ------------------------------------------------------------------ helpers */

const SELECTED_COMPANY_KEY = 'se_selected_company';
const DEFAULT_COMPANY = 'CUS-00128';

/** Demo accounts → the company each one belongs to (the real backend is 1 user → 1 company). */
export const MOCK_ACCOUNTS: Record<string, string> = {
  'demo@seconnex.co.th': 'CUS-00128',
  'raiwin.nat@siameastsolutions.com': '210WWCUTIX',
};

const ACCOUNT_PROFILES: Record<string, { name: string; phone: string; department: string }> = {
  'demo@seconnex.co.th': { name: 'Anan Ruangkit', phone: '+66 86 111 2233', department: 'Facility Engineer' },
  'raiwin.nat@siameastsolutions.com': { name: 'Raiwin Nathathai', phone: '063-3935090', department: 'Maintenance Engineer' },
};

function accountEmail(): string {
  return tokenStore.read()?.email.trim().toLowerCase() ?? 'demo@seconnex.co.th';
}

/** Company in use: the one picked at login, else the signed-in account's own company. */
function currentCode(): string {
  try {
    const picked = localStorage.getItem(SELECTED_COMPANY_KEY);
    if (picked) return picked;
  } catch {
    /* storage unavailable */
  }
  return MOCK_ACCOUNTS[accountEmail()] ?? DEFAULT_COMPANY;
}

function currentCompany() {
  const code = currentCode();
  return mockCompanies.find((c) => c.customerCode === code) ?? mockCompanies[0]!;
}

function siteNameOf(siteId: string): string {
  for (const c of mockCompanies) {
    const s = c.sites.find((x) => x.id === siteId);
    if (s) return s.name;
  }
  return siteId;
}

function siteIdOf(siteName: string): string | undefined {
  for (const c of mockCompanies) {
    const s = c.sites.find((x) => x.name === siteName);
    if (s) return s.id;
  }
  return undefined;
}

const isoDay = (d: Date) => d.toISOString().slice(0, 10);

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return isoDay(d);
}

const TODAY_ISO = isoDay(TODAY);

const STATUS_FROM_ASSET: Record<string, MockUnit['status']> = {
  Active: 'running',
  UnderRepair: 'maintenance',
  Decommissioned: 'offline',
};

/** Companies whose equipment lives in mockAssets (generated demo fleets) rather than mockUnits. */
const ASSET_BACKED_COMPANIES = ['210WWCUTIX'];

const assetBackedUnits: MockUnit[] = ASSET_BACKED_COMPANIES.flatMap((code) =>
  assetsFor(code).map((a): MockUnit => ({
    id: a.id,
    customerCode: a.customerCode,
    name: a.name,
    category: (['Pump', 'Mixer', 'Service', 'Spare Part', 'Other'].includes(a.category) ? a.category : 'Other') as MockUnit['category'],
    brand: a.brand,
    model: a.model,
    serial: a.serial,
    customerRef: a.customerRef,
    siteId: a.siteId,
    location: a.location,
    status: STATUS_FROM_ASSET[a.status] ?? 'running',
    warranty: a.warranty === 'none' ? 'expired' : a.warranty,
    warrantyEnd: a.warrantyEnd,
    purchaseDate: a.purchaseDate,
    installDate: a.installDate,
    nextPM: a.nextPM,
    installYear: a.installYear,
  })),
);

const allUnits: MockUnit[] = [...mockUnits, ...assetBackedUnits];

function unitsOf(code: string): MockUnit[] {
  return allUnits.filter((u) => u.customerCode === code);
}

const unitKey = (u: MockUnit) => `U-${u.id.replace(/^AST-/, '')}`;

const CATEGORY_ORDER = ['Pump', 'Mixer', 'Service', 'Spare Part', 'Other'] as const;
const CATEGORY_TH: Record<string, string> = {
  Pump: 'ปั๊ม',
  Mixer: 'เครื่องกวน / ผสม',
  Service: 'ระบบควบคุมและบริการ',
  'Spare Part': 'อะไหล่',
  Other: 'อื่น ๆ',
};
const CATEGORY_IMAGE: Record<string, string> = {
  Pump: 'assets/Pump.webp',
  Mixer: 'assets/Mixer.webp',
  Service: 'assets/Service.webp',
  'Spare Part': 'assets/Sparepart.webp',
  Other: 'assets/Other.webp',
};

type OperatingStatus = EquipmentUnitResponse['status'];
type WarrantyState = EquipmentUnitResponse['warrantyState'];

const toOperating = (s: MockUnit['status']): OperatingStatus =>
  s === 'maintenance' || s === 'stopped' || s === 'offline' ? 'UnderRepair' : 'Active';

const toWarrantyState = (w: MockUnit['warranty']): WarrantyState =>
  w === 'expiring' ? 'expiringSoon' : w;

const purchaseDateOf = (u: MockUnit) => u.purchaseDate ?? addDays(u.installDate, -60);

function toUnit(u: MockUnit): EquipmentUnitResponse {
  const hasDatasheet = u.category === 'Pump' || u.category === 'Mixer';
  return {
    id: u.id,
    assetCode: u.customerRef,
    unitId: unitKey(u),
    nameEn: u.name,
    nameTh: u.name,
    description: `${u.model} — ${u.location}`,
    serialNo: u.serial,
    brandEn: u.brand,
    brandTh: u.brand,
    categoryEn: u.category,
    categoryTh: CATEGORY_TH[u.category] ?? u.category,
    site: siteNameOf(u.siteId),
    status: toOperating(u.status),
    warrantyUntil: u.warrantyEnd,
    warrantyState: toWarrantyState(u.warranty),
    purchaseDate: purchaseDateOf(u),
    nextDue: u.nextPM ?? null,
    installDate: u.installDate,
    installYear: u.installYear,
    datasheetCount: hasDatasheet ? 2 : 0,
  };
}

function findUnit(unitId: string): MockUnit | undefined {
  return allUnits.find((u) => unitKey(u) === unitId || u.id === unitId);
}

/* ------------------------------------------------------------------ tickets */

const PRIORITY_MAP: Record<Priority, TicketPriorityValue> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Critical',
};

const STATUS_MAP: Record<RequestStatus, TicketStatusValue> = {
  draft: 'Open',
  submitted: 'Open',
  reviewing: 'Open',
  scheduled: 'Assigned',
  assigned: 'Assigned',
  in_progress: 'InProgress',
  waiting_parts: 'OnHold',
  waiting_customer: 'OnHold',
  completed: 'Resolved',
  closed: 'Closed',
  cancelled: 'Closed',
};

const requestType = (category: string) =>
  category === 'Preventive maintenance request'
    ? 'Preventive maintenance'
    : category === 'Inspection request'
      ? 'Inspection'
      : 'Corrective maintenance';

function assetCodeOf(assetId?: string): string {
  if (!assetId) return '—';
  return allUnits.find((u) => u.id === assetId)?.customerRef ?? assetId;
}

function ticketsOf(code: string): ServiceHistoryResponse[] {
  const closed: ServiceHistoryResponse[] = mockHistory
    .filter((h) => h.customerCode === code && h.ticketNo)
    .map((h) => ({
      reportedAt: `${h.date}T09:00:00+07:00`,
      ticketNo: h.ticketNo!,
      type: h.type,
      priority: h.type === 'Corrective maintenance' ? 'High' : 'Medium',
      assetCode: assetCodeOf(h.assetId),
      site: siteNameOf(h.siteId),
      description: h.issue,
      status: 'Closed',
      jobNo: h.jobNo,
      slaStatus: 'met',
      slaDueAt: `${addDays(h.date, 5)}T17:00:00+07:00`,
      slaCompletedAt: `${h.date}T16:00:00+07:00`,
    }));
  const closedNos = new Set(closed.map((c) => c.ticketNo));

  const open: ServiceHistoryResponse[] = mockRequests
    .filter((r) => r.customerCode === code && !closedNos.has(r.ticketNo))
    .map((r) => {
      const status = STATUS_MAP[r.status];
      const isOpen = OPEN_TICKET_STATUSES.includes(status);
      const dueAt = `${addDays(r.created, r.priority === 'urgent' ? 3 : 7)}T17:00:00+07:00`;
      const breached = isOpen && dueAt.slice(0, 10) < TODAY_ISO;
      const approaching = isOpen && !breached && addDays(dueAt, -2) <= TODAY_ISO;
      return {
        reportedAt: r.created,
        ticketNo: r.ticketNo,
        type: requestType(r.category),
        priority: PRIORITY_MAP[r.priority],
        assetCode: assetCodeOf(r.assetId),
        site: siteNameOf(r.siteId),
        description: r.title,
        status,
        jobNo: r.signoffJobNo ?? null,
        slaStatus: breached ? 'breached' : approaching ? 'approaching' : 'met',
        slaDueAt: dueAt,
        slaCompletedAt: isOpen ? null : r.updated,
      } satisfies ServiceHistoryResponse;
    });

  return [...closed, ...open].sort((a, b) => (a.reportedAt < b.reportedAt ? 1 : -1));
}

function ticketHistory(params: URLSearchParams) {
  const code = currentCode();
  const all = ticketsOf(code);
  const statusParam = params.get('status') ?? '';
  const scoped = all.filter((t) => {
    if (!statusParam) return true;
    if (statusParam === 'open') return OPEN_TICKET_STATUSES.includes(t.status);
    if (statusParam === 'closed') return t.status === 'Resolved' || t.status === 'Closed';
    return t.status === statusParam;
  });

  const q = (params.get('q') ?? '').toLowerCase();
  const site = params.get('site');
  const type = params.get('type');
  const assetCode = params.get('assetCode');
  const filtered = scoped.filter(
    (t) =>
      (!site || t.site === site) &&
      (!type || t.type === type) &&
      (!assetCode || t.assetCode === assetCode) &&
      (!q ||
        `${t.ticketNo} ${t.description} ${t.assetCode} ${t.jobNo ?? ''} ${t.site ?? ''}`.toLowerCase().includes(q)),
  );

  const page = Math.max(1, Number(params.get('page') ?? 1));
  const size = Math.max(1, Number(params.get('size') ?? 20));

  const counts = new Map<TicketStatusValue, number>();
  for (const t of scoped) counts.set(t.status, (counts.get(t.status) ?? 0) + 1);
  const summary: ServiceHistorySummaryResponse = {
    total: scoped.length,
    statusCounts: [...counts.entries()].map(([status, count]) => ({ status, count })),
    slaOverdueCount: scoped.filter((t) => t.slaStatus === 'breached').length,
    sites: [...new Set(scoped.map((t) => t.site).filter((s): s is string => !!s))].sort(),
    assetCodes: [...new Set(scoped.map((t) => t.assetCode))].sort(),
  };

  return {
    data: filtered.slice((page - 1) * size, page * size),
    meta: { total: filtered.length },
    summary,
  };
}

const SAMPLE_PHOTO = () => getAssetUrl('assets/connect_every_pump_xn.webp');

function ticketReport(ticketNo: string): ServiceReportResponse {
  const hist = mockHistory.find((h) => h.ticketNo === ticketNo);
  const req = mockRequests.find((r) => r.ticketNo === ticketNo);
  const company = currentCompany();
  const unit = allUnits.find((u) => u.id === (hist?.assetId ?? req?.assetId));

  const base = {
    ticketNo,
    customerName: company.name,
    assetCode: assetCodeOf(hist?.assetId ?? req?.assetId),
    serialNo: unit?.serial ?? null,
    site: siteNameOf(hist?.siteId ?? req?.siteId ?? ''),
    signatureUrl: null,
  };

  if (!hist) {
    return {
      ...base,
      type: req ? requestType(req.category) : 'Corrective maintenance',
      description: req?.description ?? null,
      jobNo: req?.signoffJobNo ?? null,
      startedAt: req?.appointment ? `${req.appointment.date}T09:00:00+07:00` : null,
      engineerName: req?.appointment?.engineer ?? null,
      workSummary: null,
      rootCause: null,
      resolution: null,
      notes: [],
      phases: [],
    };
  }

  const r = hist.report;
  const photo = (i: number, label: string, when: string) => ({
    attachmentId: `${ticketNo}-${when}-${i}`,
    url: SAMPLE_PHOTO(),
    fileName: `${when}-${i + 1}.webp`,
    uploadedAt: `${hist.date}T10:00:00+07:00`,
    labelTh: label,
  });
  return {
    ...base,
    type: hist.type,
    description: hist.issue,
    jobNo: hist.jobNo,
    startedAt: `${hist.date}T09:00:00+07:00`,
    engineerName: hist.engineer,
    workSummary: hist.work,
    rootCause: r.rootCause,
    resolution: hist.result,
    notes: [r.findings, r.recommendations].filter(Boolean),
    phases: [
      {
        phaseId: `${ticketNo}-P1`,
        seq: 1,
        nameTh: 'ก่อนดำเนินการ',
        nameEn: 'Before work',
        photos: r.beforePhotos.map((l, i) => photo(i, l, 'before')),
        readings: [],
        status: 'done',
      },
      {
        phaseId: `${ticketNo}-P2`,
        seq: 2,
        nameTh: 'ผลการทดสอบ',
        nameEn: 'Test results',
        photos: [],
        readings: [{ itemId: `${ticketNo}-R1`, labelTh: 'ผลการทดสอบ', labelEn: 'Test results', unit: null, value: null, valueText: r.testResults }],
        status: 'done',
      },
      {
        phaseId: `${ticketNo}-P3`,
        seq: 3,
        nameTh: 'หลังดำเนินการ',
        nameEn: 'After work',
        photos: r.afterPhotos.map((l, i) => photo(i, l, 'after')),
        readings: [],
        status: 'done',
      },
    ],
  };
}

/* ------------------------------------------------------------------ equipment */

function equipmentCategories(params: URLSearchParams): EquipmentCategorySummaryResponse[] {
  const site = params.get('site');
  const q = (params.get('q') ?? '').toLowerCase();
  const units = unitsOf(currentCode()).filter(
    (u) =>
      (!site || siteNameOf(u.siteId) === site) &&
      (!q || `${u.name} ${u.brand} ${u.model} ${u.serial} ${u.category} ${u.customerRef}`.toLowerCase().includes(q)),
  );
  return CATEGORY_ORDER.flatMap((cat) => {
    const inCat = units.filter((u) => u.category === cat);
    if (inCat.length === 0) return [];
    return [
      {
        id: cat.toLowerCase().replace(/\s+/g, '-'),
        labelEn: cat,
        labelTh: CATEGORY_TH[cat] ?? cat,
        imageUrl: getAssetUrl(CATEGORY_IMAGE[cat]!),
        unitCount: inCat.length,
        workingCount: inCat.filter((u) => toOperating(u.status) === 'Active').length,
        warranty: {
          active: inCat.filter((u) => u.warranty === 'active').length,
          expiringSoon: inCat.filter((u) => u.warranty === 'expiring').length,
          expired: inCat.filter((u) => u.warranty === 'expired').length,
          unknown: 0,
        },
      },
    ];
  });
}

function equipmentUnits(params: URLSearchParams): EquipmentUnitResponse[] {
  const category = params.get('category');
  const site = params.get('site');
  const brand = params.get('brand');
  const status = params.get('status');
  const warranty = params.get('warranty');
  const year = params.get('year');
  const q = (params.get('q') ?? '').toLowerCase();
  const sort = params.get('sort') ?? 'name';

  const rows = unitsOf(currentCode())
    .filter(
      (u) =>
        (!category || u.category === category) &&
        (!site || siteNameOf(u.siteId) === site) &&
        (!brand || u.brand === brand) &&
        (!status || toOperating(u.status) === status) &&
        (!warranty || toWarrantyState(u.warranty) === warranty) &&
        (!year || purchaseDateOf(u).startsWith(year)) &&
        (!q || `${u.name} ${u.brand} ${u.model} ${u.serial} ${u.category} ${u.customerRef} ${u.id}`.toLowerCase().includes(q)),
    )
    .map(toUnit);

  const by = (fn: (r: EquipmentUnitResponse) => string, dir = 1) => (a: EquipmentUnitResponse, b: EquipmentUnitResponse) =>
    fn(a).localeCompare(fn(b)) * dir;
  if (sort === 'newest') rows.sort(by((r) => r.installDate ?? '', -1));
  else if (sort === 'oldest') rows.sort(by((r) => r.installDate ?? ''));
  else if (sort === 'warranty') rows.sort(by((r) => r.warrantyUntil ?? '9999'));
  else rows.sort(by((r) => r.nameEn));
  return rows;
}

function unitDetail(unitId: string): EquipmentUnitDetailResponse | null {
  const u = findUnit(unitId);
  if (!u) return null;
  const r = toUnit(u);
  return {
    id: r.id,
    assetCode: r.assetCode,
    unitId: r.unitId,
    serialNo: r.serialNo,
    description: r.description,
    brandEn: r.brandEn,
    brandTh: r.brandTh,
    categoryEn: r.categoryEn,
    categoryTh: r.categoryTh,
    installDate: r.installDate,
    site: r.site,
    status: r.status,
    warrantyUntil: r.warrantyUntil,
    warrantyState: r.warrantyState,
    purchaseDate: r.purchaseDate,
    nextDue: r.nextDue,
  };
}

const SAMPLE_PDF = () => getAssetUrl('assets/sample-document.pdf');

function datasheets(unitId: string): EquipmentDatasheetResponse[] {
  const u = findUnit(unitId);
  if (!u || (u.category !== 'Pump' && u.category !== 'Mixer')) return [];
  return [
    { attachmentId: `${u.id}-DS1`, fileName: `${u.brand} ${u.model} — Datasheet.pdf`, mimeType: 'application/pdf', sizeBytes: 1_258_291, uploadedAt: '2023-11-02T09:00:00+07:00', url: SAMPLE_PDF() },
    { attachmentId: `${u.id}-DS2`, fileName: `${u.brand} ${u.model} — Performance curve.pdf`, mimeType: 'application/pdf', sizeBytes: 534_288, uploadedAt: '2023-11-02T09:05:00+07:00', url: SAMPLE_PDF() },
  ];
}

function documents(unitId: string): EquipmentUnitDocumentResponse[] {
  const u = findUnit(unitId);
  if (!u) return [];
  const doc = (n: number, fileName: string, size: number, date: string, category: string): EquipmentUnitDocumentResponse => ({
    attachmentId: `${u.id}-DOC${n}`,
    fileName,
    mimeType: 'application/pdf',
    sizeBytes: size,
    uploadedAt: `${date}T09:00:00+07:00`,
    url: SAMPLE_PDF(),
    category,
  });
  return [
    doc(1, `${u.name} — Warranty certificate.pdf`, 348_160, u.installDate, 'Warranty'),
    doc(2, `${u.name} — Installation report.pdf`, 2_516_582, u.installDate, 'Installation'),
    doc(3, `${u.name} — Product manual.pdf`, 5_872_025, addDays(u.installDate, -90), 'Manual'),
  ];
}

/* ------------------------------------------------------------------ map */

const SITE_COORDS: Record<string, [number, number]> = {
  'S-RY': [12.7003, 101.1474],
  'S-BN': [13.6672, 100.6042],
  'S-CB': [13.3611, 100.9847],
  'S-CS': [13.6904, 101.0779],
  'S-MTP': [12.7185, 101.1539],
  'S-01': [13.6904, 101.0779],
  'S-02': [13.8133, 100.7355],
  'S-03': [13.5236, 100.7117],
  'S-04': [13.3611, 100.9847],
  'S-05': [12.7003, 101.1474],
  'S-06': [12.7185, 101.1539],
  'S-07': [13.7208, 100.5287],
};

function mapSites(): MapSiteResponse[] {
  const company = currentCompany();
  const units = unitsOf(company.customerCode);
  const tickets = ticketsOf(company.customerCode).filter((t) => OPEN_TICKET_STATUSES.includes(t.status));
  return company.sites.map((s) => {
    const inSite = units.filter((u) => u.siteId === s.id);
    const [lat, lng] = SITE_COORDS[s.id] ?? [13.7, 100.6];
    const counts = new Map<string, number>();
    for (const u of inSite) counts.set(u.category, (counts.get(u.category) ?? 0) + 1);
    return {
      site: s.name,
      equipmentCount: inSite.length,
      assetCodes: [...counts.entries()].map(([assetCode, count]) => ({ assetCode, count })),
      pendingRequests: tickets.filter((t) => t.site === s.name).length,
      points: inSite.map((u, i) => {
        const angle = (i / Math.max(inSite.length, 1)) * Math.PI * 2;
        return {
          unitId: unitKey(u),
          assetId: u.id,
          nameEn: u.name,
          nameTh: u.name,
          lat: lat + Math.sin(angle) * 0.0015 * (1 + (i % 3)),
          lng: lng + Math.cos(angle) * 0.0015 * (1 + (i % 3)),
          status: toOperating(u.status),
          serialNo: u.serial,
          aliasCode: u.customerRef,
          position: u.location,
        };
      }),
    };
  });
}

/* ------------------------------------------------------------------ dashboard / PM */

const PM_TYPE_LABEL: Record<string, string> = {
  routine: 'Routine PM',
  inspection: 'Inspection',
  lubrication: 'Lubrication',
  calibration: 'Calibration',
  overhaul: 'Overhaul',
};

function pmState(date: string): PmScheduleStateValue {
  if (date < TODAY_ISO) return 'overdue';
  return date <= addDays(TODAY_ISO, 30) ? 'due-soon' : 'scheduled';
}

function pmSchedule(params: URLSearchParams): PMScheduleItemResponse[] {
  const code = currentCode();
  const site = params.get('site');
  const type = params.get('pmType');
  const fromVisits = mockPM
    .filter((v) => v.customerCode === code && v.status !== 'completed' && (!site || siteNameOf(v.siteId) === site))
    .flatMap((v) =>
      v.assetIds.map((a) => ({
        nextDue: v.date,
        assetCode: assetCodeOf(a),
        pmType: PM_TYPE_LABEL[v.pmType] ?? v.pmType,
        pmState: pmState(v.date),
      })),
    );
  const fromUnits = unitsOf(code)
    .filter((u) => u.nextPM && (!site || siteNameOf(u.siteId) === site))
    .filter((u) => !fromVisits.some((f) => f.assetCode === u.customerRef))
    .map((u) => ({ nextDue: u.nextPM!, assetCode: u.customerRef, pmType: 'Routine PM', pmState: pmState(u.nextPM!) }));
  return [...fromVisits, ...fromUnits]
    .filter((s) => !type || s.pmType === type)
    .sort((a, b) => (a.nextDue > b.nextDue ? 1 : -1));
}

function completedPmVisits(params: URLSearchParams) {
  const code = currentCode();
  const site = params.get('site');
  const type = params.get('pmType');
  const page = Math.max(1, Number(params.get('page') ?? 1));
  const size = Math.max(1, Number(params.get('size') ?? 10));
  const all: PMCompletedVisitResponse[] = mockHistory
    .filter((h) => h.customerCode === code && h.type === 'Preventive maintenance')
    .filter((h) => !site || siteNameOf(h.siteId) === site)
    .filter(() => !type || type === 'Routine PM')
    .map((h) => ({
      ticketNo: h.ticketNo ?? h.reportId,
      jobNo: h.jobNo,
      completedAt: `${h.date}T16:00:00+07:00`,
      assetCode: assetCodeOf(h.assetId),
      site: siteNameOf(h.siteId),
      pmType: 'Routine PM',
      description: h.work,
      engineerName: h.engineer,
    }))
    .sort((a, b) => ((a.completedAt ?? '') < (b.completedAt ?? '') ? 1 : -1));
  return { data: all.slice((page - 1) * size, page * size), meta: { total: all.length } };
}

function dashboardSummary(): DashboardSummaryResponse {
  const company = currentCompany();
  const units = unitsOf(company.customerCode);
  const open = ticketsOf(company.customerCode).filter((t) => OPEN_TICKET_STATUSES.includes(t.status));
  const upcoming = mockPM
    .filter((v) => v.customerCode === company.customerCode && v.status !== 'completed' && v.date >= TODAY_ISO)
    .map((v) => ({ nextDue: v.date }))
    .sort((a, b) => (a.nextDue > b.nextDue ? 1 : -1));
  return {
    preName: null,
    customerName: company.name,
    customerCode: company.customerCode,
    totalUnits: units.length,
    totalSites: company.sites.length,
    unitsInWarranty: units.filter((u) => u.warranty === 'active').length,
    unitsWarrantyExpiringSoon: units.filter((u) => u.warranty === 'expiring').length,
    unitsWarrantyExpired: units.filter((u) => u.warranty === 'expired').length,
    unitsNoWarranty: 0,
    assignedTickets: open.length,
    criticalTickets: open.filter((t) => t.priority === 'Critical').length,
    upcomingPmCount: upcoming.length,
    nextPmDue: upcoming[0]?.nextDue ?? null,
  };
}

function dashboardTickets(): DashboardTicketResponse[] {
  return ticketsOf(currentCode())
    .filter((t) => OPEN_TICKET_STATUSES.includes(t.status))
    .slice(0, 6)
    .map((t) => ({ ticket_no: t.ticketNo, description: t.description, priority: t.priority, status: t.status }));
}

function dashboardMaintenance(): DashboardMaintenanceItemResponse[] {
  return mockPM
    .filter((v) => v.customerCode === currentCode() && v.status !== 'completed' && v.date >= TODAY_ISO)
    .sort((a, b) => (a.date > b.date ? 1 : -1))
    .slice(0, 5)
    .map((v) => ({
      pmId: v.id,
      nextDue: v.date,
      pmType: PM_TYPE_LABEL[v.pmType] ?? v.pmType,
      description: v.scope,
      totalUnits: v.assetIds.length,
    }));
}

/* ------------------------------------------------------------------ company / profile */

function seContacts(): SEContactResponse[] {
  const company = currentCompany();
  const people = [
    { c: company.accountManager, id: 1, th: ['ผู้จัดการฝ่ายขาย', 'Account Manager'], proc: ['Pump', 'ปั๊ม'] },
    { c: company.serviceCoordinator, id: 2, th: ['ผู้ประสานงานบริการ', 'Service Coordinator'], proc: ['Service', 'งานบริการ'] },
  ];
  return people.map(({ c, id, proc }) => {
    const [first = '', ...rest] = c.name.split(' ');
    const process = { id: `proc-${id}`, labelEn: proc[0]!, labelTh: proc[1]!, status: 'Active' };
    return {
      id: `SEC-${company.customerCode}-${id}`,
      customerCode: company.customerCode,
      kpiSalePersonId: id,
      salePerson: {
        id,
        appCode: `SP-${id}`,
        prefixTh: null,
        prefixEn: null,
        nameTh: first,
        nameEn: first,
        lastNameTh: rest.join(' '),
        lastNameEn: rest.join(' '),
        nickNameTh: first,
        nickNameEn: first,
        positionTh: c.roleTh,
        positionEn: c.role,
        hrDepartment: 'Sales',
        phone: c.phone,
        email: c.email,
      },
      processId: process.id,
      process,
      processes: [process],
    };
  });
}

function profile(): ProfileResponse {
  const co = currentCompany();
  const email = accountEmail();
  const account = ACCOUNT_PROFILES[email] ?? ACCOUNT_PROFILES['demo@seconnex.co.th']!;
  return {
    preName: null,
    customerName: co.name,
    customerCode: co.customerCode,
    siteList: co.sites.map((x) => x.name).join(', '),
    name: account.name,
    email,
    role: 'Company administrator',
    phone: account.phone,
    department: account.department,
    accountExpiresAt: '2027-12-31T00:00:00+07:00',
  };
}

function company(): CompanyResponse {
  const s = dashboardSummary();
  return {
    preName: s.preName,
    customerName: s.customerName,
    customerCode: s.customerCode,
    totalUnits: s.totalUnits,
    totalSites: s.totalSites,
    unitsInWarranty: s.unitsInWarranty,
    unitsWarrantyExpiringSoon: s.unitsWarrantyExpiringSoon,
    assignedTickets: s.assignedTickets,
    criticalTickets: s.criticalTickets,
    upcomingPmCount: s.upcomingPmCount,
    nextPmDue: s.nextPmDue,
  };
}

/* ------------------------------------------------------------------ news */

const NEWS_CATEGORY: Record<string, [string, string]> = {
  tips: ['Tips & Know-how', 'เคล็ดลับและความรู้'],
  promotions: ['Promotions', 'โปรโมชั่น'],
  products: ['Products', 'ผลิตภัณฑ์'],
  sustainability: ['Sustainability', 'ความยั่งยืน'],
  company: ['Company News', 'ข่าวบริษัท'],
  service: ['Service', 'บริการ'],
};

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function newsFeed(): NewsFeedItemResponse[] {
  let sidebarLeft = 3;
  return [...mockNews]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .map((n) => {
      const [labelEn, labelTh] = NEWS_CATEGORY[n.category] ?? [n.category, n.category];
      const html = n.content.map((p) => `<p>${escapeHtml(p)}</p>`).join('');
      const sidebar = !n.featured && sidebarLeft > 0;
      if (sidebar) sidebarLeft -= 1;
      const stamp = `${n.date}T09:00:00+07:00`;
      return {
        id: n.id,
        category: n.category,
        categoryLabelEn: labelEn,
        categoryLabelTh: labelTh,
        tags: [],
        titleEn: n.title,
        titleTh: n.titleTh,
        contentEn: html,
        contentTh: html,
        imageUrl: n.imageUrl ? getAssetUrl(n.imageUrl) : null,
        isBanner: Boolean(n.featured),
        isSidebar: sidebar,
        publishedAt: stamp,
        startsAt: stamp,
        createdAt: stamp,
      };
    });
}

/* ------------------------------------------------------------------ router */

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

/** Resolves a backend GET path (e.g. `/equipment/units?site=…`) to the mock payload. */
export function mockGet(path: string): unknown {
  const [pathname = '', query = ''] = path.split('?');
  const params = new URLSearchParams(query);
  const code = currentCode();

  switch (pathname) {
    case '/profile':
      return profile();
    case '/company':
      return company();
    case '/company/se-contacts':
      return seContacts();
    case '/company/sites':
      return currentCompany().sites.map((s) => ({ site: s.name }));
    case '/company/install-years':
      return unique(unitsOf(code).map((u) => u.installYear)).sort((a, b) => b - a).map((installYear) => ({ installYear }));
    case '/company/purchase-years':
      return unique(unitsOf(code).map((u) => Number(purchaseDateOf(u).slice(0, 4))))
        .sort((a, b) => b - a)
        .map((purchaseYear) => ({ purchaseYear }));
    case '/map/sites':
      return mapSites();
    case '/equipment':
      return equipmentCategories(params);
    case '/equipment/units':
      return equipmentUnits(params);
    case '/dashboard/summary':
      return dashboardSummary();
    case '/dashboard/tickets':
      return dashboardTickets();
    case '/dashboard/maintenance':
      return dashboardMaintenance();
    case '/pm/schedule':
      return pmSchedule(params);
    case '/pm/types':
      return unique(pmSchedule(new URLSearchParams()).map((s) => s.pmType)).map((pmType) => ({ pmType }));
    case '/pm/visits/completed':
      return completedPmVisits(params);
    case '/tickets/types':
      return unique(ticketsOf(code).map((t) => t.type)).sort().map((type) => ({ type }));
    case '/tickets/history':
      return ticketHistory(params);
    case '/news/feed':
      return newsFeed();
    case '/portal/auth/session':
      return undefined;
    default:
      break;
  }

  let m = pathname.match(/^\/equipment\/units\/([^/]+)\/datasheets$/);
  if (m) return datasheets(decodeURIComponent(m[1]!));
  m = pathname.match(/^\/equipment\/units\/([^/]+)\/documents$/);
  if (m) return documents(decodeURIComponent(m[1]!));
  m = pathname.match(/^\/equipment\/units\/([^/]+)$/);
  if (m) {
    const detail = unitDetail(decodeURIComponent(m[1]!));
    if (!detail) throw Object.assign(new Error('Equipment not found'), { status: 404, code: 'NOT_FOUND' });
    return detail;
  }
  m = pathname.match(/^\/tickets\/([^/]+)\/report$/);
  if (m) return ticketReport(decodeURIComponent(m[1]!));

  throw Object.assign(new Error(`No mock route for ${pathname}`), { status: 404, code: 'NOT_FOUND' });
}
