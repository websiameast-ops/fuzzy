import type { ContractStatus, OperatingStatus, PMStatus, PMType, Priority, RequestStatus, WarrantyStatus } from '@/types';

export type Tone = 'green' | 'amber' | 'red' | 'blue' | 'grey' | 'brand';

interface StatusMeta {
  en: string;
  th: string;
  tone: Tone;
}

export const REQUEST_STATUS: Record<RequestStatus, StatusMeta> = {
  draft: { en: 'Draft', th: 'ฉบับร่าง', tone: 'grey' },
  submitted: { en: 'Submitted', th: 'ส่งคำขอแล้ว', tone: 'blue' },
  reviewing: { en: 'Reviewing', th: 'กำลังตรวจสอบ', tone: 'blue' },
  scheduled: { en: 'Appointment scheduled', th: 'นัดหมายแล้ว', tone: 'blue' },
  assigned: { en: 'Engineer assigned', th: 'มอบหมายวิศวกรแล้ว', tone: 'blue' },
  in_progress: { en: 'In progress', th: 'กำลังดำเนินการ', tone: 'blue' },
  waiting_parts: { en: 'Waiting for parts', th: 'รออะไหล่', tone: 'amber' },
  waiting_customer: { en: 'Waiting for customer', th: 'รอข้อมูลจากลูกค้า', tone: 'amber' },
  completed: { en: 'Completed', th: 'เสร็จสิ้น', tone: 'green' },
  closed: { en: 'Closed', th: 'ปิดงาน', tone: 'grey' },
  cancelled: { en: 'Cancelled', th: 'ยกเลิก', tone: 'grey' },
};

export const WARRANTY_STATUS: Record<WarrantyStatus, StatusMeta> = {
  active: { en: 'Under warranty', th: 'อยู่ในประกัน', tone: 'green' },
  expiring: { en: 'Expiring soon', th: 'ใกล้หมดประกัน', tone: 'amber' },
  expired: { en: 'Expired', th: 'หมดประกัน', tone: 'red' },
  none: { en: 'No warranty info', th: 'ไม่มีข้อมูลประกัน', tone: 'grey' },
};

export const OPERATING_STATUS: Record<OperatingStatus, StatusMeta> = {
  Active: { en: 'Active', th: 'ใช้งานปกติ', tone: 'green' },
  UnderRepair: { en: 'Under repair', th: 'อยู่ระหว่างซ่อม', tone: 'amber' },
  Decommissioned: { en: 'Decommissioned', th: 'ปลดระวางแล้ว', tone: 'grey' },
};

export const CONTRACT_STATUS: Record<ContractStatus, StatusMeta> = {
  active: { en: 'Active', th: 'ใช้งานอยู่', tone: 'green' },
  expiring: { en: 'Expiring soon', th: 'ใกล้หมดอายุ', tone: 'amber' },
  expired: { en: 'Expired', th: 'หมดอายุ', tone: 'red' },
  renewal: { en: 'Awaiting renewal', th: 'รอต่ออายุ', tone: 'amber' },
};

export const PM_STATUS: Record<PMStatus, StatusMeta> = {
  confirmed: { en: 'Confirmed', th: 'ยืนยันแล้ว', tone: 'green' },
  unconfirmed: { en: 'Awaiting confirmation', th: 'รอการยืนยัน', tone: 'amber' },
  completed: { en: 'Completed', th: 'เสร็จสิ้น', tone: 'grey' },
  reschedule_requested: { en: 'Reschedule requested', th: 'ขอเลื่อนนัด', tone: 'amber' },
};

export const PM_TYPE: Record<PMType, StatusMeta> = {
  routine: { en: 'Routine', th: 'บำรุงรักษาตามวงรอบ', tone: 'blue' },
  inspection: { en: 'Inspection', th: 'ตรวจสอบ', tone: 'grey' },
  lubrication: { en: 'Lubrication', th: 'หล่อลื่น', tone: 'green' },
  calibration: { en: 'Calibration', th: 'สอบเทียบ', tone: 'amber' },
  overhaul: { en: 'Overhaul', th: 'ยกเครื่อง', tone: 'red' },
};

export const PRIORITY: Record<Priority, StatusMeta> = {
  low: { en: 'Low', th: 'ต่ำ', tone: 'grey' },
  medium: { en: 'Medium', th: 'ปานกลาง', tone: 'blue' },
  high: { en: 'High', th: 'สูง', tone: 'amber' },
  urgent: { en: 'Urgent', th: 'เร่งด่วน', tone: 'red' },
};

export const APPROVAL_STATUS: Record<'approved' | 'pending' | 'na', StatusMeta> = {
  approved: { en: 'Approved', th: 'อนุมัติแล้ว', tone: 'green' },
  pending: { en: 'Awaiting approval', th: 'รอการอนุมัติ', tone: 'amber' },
  na: { en: 'No approval required', th: 'ไม่ต้องอนุมัติ', tone: 'grey' },
};

// Backend `Ticket` vocab (see backend/app/core/vocab.py) — distinct from the
// mock `Priority`/`RequestStatus` domains above, used for API-sourced ticket lists.
export type TicketPriorityValue = 'Critical' | 'High' | 'Medium' | 'Low';
export type TicketStatusValue = 'Open' | 'Assigned' | 'InProgress' | 'OnHold' | 'Resolved' | 'Closed';

export const TICKET_PRIORITY: Record<TicketPriorityValue, StatusMeta> = {
  Critical: { en: 'Critical', th: 'วิกฤต', tone: 'red' },
  High: { en: 'High', th: 'สูง', tone: 'amber' },
  Medium: { en: 'Medium', th: 'ปานกลาง', tone: 'blue' },
  Low: { en: 'Low', th: 'ต่ำ', tone: 'grey' },
};

export const TICKET_STATUS: Record<TicketStatusValue, StatusMeta> = {
  Open: { en: 'Open', th: 'เปิดงาน', tone: 'blue' },
  Assigned: { en: 'Assigned', th: 'มอบหมายแล้ว', tone: 'blue' },
  InProgress: { en: 'In progress', th: 'กำลังดำเนินการ', tone: 'blue' },
  OnHold: { en: 'On hold', th: 'พักงาน', tone: 'amber' },
  Resolved: { en: 'Resolved', th: 'แก้ไขแล้ว', tone: 'green' },
  Closed: { en: 'Closed', th: 'ปิดงาน', tone: 'grey' },
};

// Backend `TicketStatus` values that count as "open" (see vocab.py's
// TICKET_OPEN — Resolved/Closed are the only closed states).
export const OPEN_TICKET_STATUSES: TicketStatusValue[] = ['Open', 'Assigned', 'InProgress', 'OnHold'];

// Backend `SlaState` vocab (see backend/app/core/vocab.py) — computed from
// Job.due_at/completed_at, not a stored column. Used for the real ticket
// history/detail API.
export type SlaStatusValue = 'met' | 'approaching' | 'breached';

export const SLA_STATUS: Record<SlaStatusValue, StatusMeta> = {
  met: { en: 'On track', th: 'เป็นไปตามแผน', tone: 'green' },
  approaching: { en: 'Approaching SLA', th: 'ใกล้ครบกำหนด', tone: 'amber' },
  breached: { en: 'SLA breached', th: 'เกินกำหนด SLA', tone: 'red' },
};

// Backend `PmState` vocab (see backend/app/core/vocab.py) — computed from
// PMSchedule.next_due vs today, not a stored column. Used for the real
// PM schedule API (GET /pm/schedule), distinct from the mock `PMStatus` above.
export type PmScheduleStateValue = 'overdue' | 'due-soon' | 'scheduled';

export const PM_SCHEDULE_STATE: Record<PmScheduleStateValue, StatusMeta> = {
  overdue: { en: 'Overdue', th: 'เลยกำหนด', tone: 'red' },
  'due-soon': { en: 'Due soon', th: 'ใกล้ถึงกำหนด', tone: 'amber' },
  scheduled: { en: 'Scheduled', th: 'มีกำหนดการ', tone: 'blue' },
};
