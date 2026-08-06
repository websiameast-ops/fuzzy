export type Lang = 'en' | 'th';

export interface Site {
  id: string;
  name: string;
  nameTh: string;
}

export interface ContactPerson {
  name: string;
  role: string;
  roleTh: string;
  phone: string;
  email: string;
  line?: string;
}

export interface Company {
  customerCode: string;
  name: string;
  nameTh: string;
  industry: string;
  sites: Site[];
  accountManager: ContactPerson;
  serviceCoordinator: ContactPerson;
}

export type WarrantyStatus = 'active' | 'expiring' | 'expired' | 'none';
export type OperatingStatus =
  | 'running'
  | 'online'
  | 'operating'
  | 'maintenance'
  | 'stopped'
  | 'offline';

export interface MeterPhase {
  voltageV: number;
  currentA: number;
}

export interface AssetMeterReading {
  phases: { l1: MeterPhase; l2: MeterPhase; l3: MeterPhase };
  activePowerKw: number;
  reactivePowerKvar: number;
  apparentPowerKva: number;
  powerFactor: number;
  frequencyHz: number;
}

export interface AssetProcessReading {
  pressureBar?: number;
  flowM3h?: number;
  temperatureC?: number;
}

export interface AssetAlarm {
  time: string;
  message: string;
  severity: 'critical' | 'warning' | 'info';
  active: boolean;
}

export interface AssetTimelineEvent {
  date: string;
  type:
    | 'sale'
    | 'delivery'
    | 'installation'
    | 'commissioning'
    | 'pm'
    | 'cm'
    | 'inspection'
    | 'parts'
    | 'condition';
  title: string;
  detail: string;
  reportId?: string;
}

export interface AssetDocument {
  name: string;
  type: 'datasheet' | 'warranty' | 'installation' | 'commissioning' | 'service' | 'manual' | 'contract';
  date: string;
  size: string;
}

export interface Asset {
  id: string;
  customerCode: string;
  name: string;
  category: string;
  brand: string;
  model: string;
  serial: string;
  customerRef: string;
  siteId: string;
  location: string;
  status: OperatingStatus;
  warranty: WarrantyStatus;
  warrantyStart: string;
  warrantyEnd: string;
  installDate: string;
  commissionDate: string;
  lastService: string;
  lastInspection: string;
  nextPM?: string;
  contractId?: string;
  connected: boolean;
  installYear: number;
  supplier: string;
  division: string;
  condition: string;
  image?: string;
  specs: { label: string; value: string }[];
  documents: AssetDocument[];
  events: AssetTimelineEvent[];
  iot?: {
    online: boolean;
    lastComm: string;
    runtimeHrs: number;
    powerKw: number;
    energyMonthKwh: number;
    alarms: AssetAlarm[];
    running?: boolean;
    meter?: AssetMeterReading;
    process?: AssetProcessReading;
  };
}

export type RequestStatus =
  | 'draft'
  | 'submitted'
  | 'reviewing'
  | 'scheduled'
  | 'assigned'
  | 'in_progress'
  | 'waiting_parts'
  | 'waiting_customer'
  | 'completed'
  | 'closed'
  | 'cancelled';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface TimelineStep {
  date: string;
  label: string;
  labelTh: string;
  done: boolean;
  current?: boolean;
}

export interface RequestComment {
  author: string;
  from: 'customer' | 'se';
  date: string;
  text: string;
}

export interface ServiceRequest {
  ticketNo: string;
  customerCode: string;
  title: string;
  assetId?: string;
  siteId: string;
  category: string;
  description: string;
  condition?: string;
  priority: Priority;
  status: RequestStatus;
  created: string;
  updated: string;
  team: string;
  contactPerson: string;
  contactMethod?: string;
  preferredDate?: string;
  appointment?: { date: string; time: string; engineer: string };
  timeline: TimelineStep[];
  comments: RequestComment[];
  attachments: string[];
  reportId?: string;
  signoffJobNo?: string;
}

export type ContractStatus = 'active' | 'expiring' | 'expired' | 'renewal';

export interface Contract {
  id: string;
  customerCode: string;
  type: string;
  typeTh: string;
  siteIds: string[];
  assetIds: string[];
  start: string;
  end: string;
  visitsTotal: number;
  visitsUsed: number;
  status: ContractStatus;
  sla: string;
  responseTime: string;
  coverage: string[];
  exclusions: string[];
  documents: string[];
  contact: string;
  renewalStatus?: string;
}

export interface ServiceReportDetail {
  reportedProblem: string;
  findings: string;
  rootCause: string;
  workPerformed: string[];
  parts: { name: string; qty: number }[];
  testResults: string;
  recommendations: string;
  beforePhotos: string[];
  afterPhotos: string[];
  acknowledgment: string;
}

export interface ServiceRecord {
  id: string;
  reportId: string;
  jobNo: string;
  customerCode: string;
  date: string;
  assetId: string;
  siteId: string;
  type: string;
  issue: string;
  work: string;
  engineer: string;
  result: string;
  approval: 'approved' | 'pending' | 'na';
  contractId?: string;
  report: ServiceReportDetail;
}

export type PMStatus = 'confirmed' | 'unconfirmed' | 'completed' | 'reschedule_requested';

export interface PMVisit {
  id: string;
  customerCode: string;
  date: string;
  time: string;
  siteId: string;
  assetIds: string[];
  scope: string;
  team: string;
  contact: string;
  status: PMStatus;
  reportId?: string;
  checklist: { label: string; done: boolean }[];
}

export interface ServiceRating {
  overall: number;
  speed: number;
  quality: number;
  communication: number;
  professionalism: number;
  cleanliness: number;
  firstTimeFix: 'yes' | 'partial' | 'no';
  comments: string;
  allowContact: boolean;
}

export interface SignoffJob {
  jobNo: string;
  customerCode: string;
  completedDate: string;
  assetId: string;
  siteId: string;
  engineer: string;
  summary: string;
  reportId: string;
  ticketNo?: string;
  status: 'pending' | 'signed';
  signedBy?: string;
  signedTitle?: string;
  signedDate?: string;
  signComment?: string;
  rating?: ServiceRating;
}

export type NewsCategory = 'company' | 'products' | 'promotions' | 'tips' | 'sustainability';

export interface NewsArticle {
  id: string;
  category: NewsCategory;
  title: string;
  titleTh: string;
  summary: string;
  date: string;
  readMins: number;
  featured?: boolean;
  imageUrl?: string;
  content: string[];
}

export type NotificationCategory =
  | 'serviceUpdates'
  | 'appointmentReminders'
  | 'warrantyExpiry'
  | 'contractExpiry'
  | 'pmConfirmation'
  | 'signoffPending'
  | 'equipmentAlarms'
  | 'newsPromotions';

export interface AppNotification {
  id: string;
  customerCode: string;
  category: NotificationCategory;
  title: string;
  body: string;
  time: string;
  read: boolean;
  link?: string;
  ref?: string;
}

export type PortalRole =
  | 'Company administrator'
  | 'Maintenance manager'
  | 'Engineer'
  | 'Procurement'
  | 'Finance'
  | 'Viewer';

export interface PortalUser {
  id: string;
  customerCode: string;
  name: string;
  email: string;
  phone: string;
  jobTitle: string;
  role: PortalRole;
  siteIds: string[];
  lastActive: string;
  status: 'active' | 'disabled' | 'invited';
}

export interface CarbonData {
  customerCode: string;
  connectedAssets: number;
  totalAssets: number;
  monthlyKwh: number;
  savedKwh: number;
  co2AvoidedTons: number;
  coveragePct: number;
  bySite: { site: string; kwh: number; label: 'measured' | 'estimated' }[];
  byCategory: { category: string; kwh: number }[];
  trend: { month: string; kwh: number; baseline: number }[];
  incompleteAssets: { assetId: string; name: string; issue: string }[];
}

export interface NotifChannelPrefs {
  inapp: boolean;
  email: boolean;
  line: boolean;
  sms: boolean;
}

export type NotificationPrefs = Record<NotificationCategory, NotifChannelPrefs>;