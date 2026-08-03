import type { ContractStatus, OperatingStatus, PMStatus, Priority, RequestStatus, WarrantyStatus } from '@/types';

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
  running: { en: 'Running', th: 'ทำงานปกติ', tone: 'green' },
  online: { en: 'Online', th: 'ออนไลน์', tone: 'green' },
  operating: { en: 'Operating', th: 'ใช้งานอยู่', tone: 'green' },
  maintenance: { en: 'Maintenance required', th: 'ต้องบำรุงรักษา', tone: 'amber' },
  stopped: { en: 'Stopped', th: 'หยุดทำงาน', tone: 'red' },
  offline: { en: 'Offline', th: 'ออฟไลน์', tone: 'grey' },
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
