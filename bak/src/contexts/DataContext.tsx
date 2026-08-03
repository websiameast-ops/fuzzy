import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { PMVisit, PortalUser, ServiceRating, ServiceRequest, SignoffJob } from '@/types';
import { mockRequests } from '@/data/mockRequests';
import { mockPM } from '@/data/mockPM';
import { mockUsers } from '@/data/mockUsers';

const initialSignoffs: SignoffJob[] = [
  {
    jobNo: 'JB-2026-0312',
    customerCode: 'CUS-00128',
    completedDate: '2026-07-06',
    assetId: 'AST-SLR-001',
    siteId: 'S-CB',
    engineer: 'Pimchanok W.',
    summary: 'Corrective visit — replaced string 6 DC fuse, retested insulation and cleared inverter alarm 2032.',
    reportId: 'SR-2026-00131',
    ticketNo: 'TK-2026-0126',
    status: 'pending',
  },
  {
    jobNo: 'JB-2026-0298',
    customerCode: 'CUS-00241',
    completedDate: '2026-06-10',
    assetId: 'AST-PMP-101',
    siteId: 'S-CS',
    engineer: 'Somyot K.',
    summary: 'Semi-annual PM — bearing lubrication, packing gland adjustment and performance verification.',
    reportId: 'SR-2026-00204',
    ticketNo: 'TK-2026-0188',
    status: 'pending',
  },
];

export interface NewRequestInput {
  customerCode: string;
  siteId: string;
  assetId?: string;
  category: string;
  title: string;
  description: string;
  condition?: string;
  priority: ServiceRequest['priority'];
  contactPerson: string;
  contactMethod: string;
  preferredDate?: string;
  attachments: string[];
}

interface DataCtx {
  requests: ServiceRequest[];
  addRequest: (input: NewRequestInput) => string;
  cancelRequest: (ticketNo: string) => void;
  pmVisits: PMVisit[];
  confirmPM: (id: string) => void;
  requestReschedule: (id: string, preferredDate: string, reason: string) => void;
  signoffs: SignoffJob[];
  submitSignoff: (
    jobNo: string,
    payload: { signedBy: string; signedTitle: string; comment: string; rating: ServiceRating },
  ) => void;
  users: PortalUser[];
  inviteUser: (u: Omit<PortalUser, 'id' | 'lastActive' | 'status'>) => void;
  updateUser: (id: string, patch: Partial<PortalUser>) => void;
}

const Ctx = createContext<DataCtx | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [requests, setRequests] = useState<ServiceRequest[]>(mockRequests);
  const [pmVisits, setPMVisits] = useState<PMVisit[]>(mockPM);
  const [signoffs, setSignoffs] = useState<SignoffJob[]>(initialSignoffs);
  const [users, setUsers] = useState<PortalUser[]>(mockUsers);
  const ticketSeq = useRef(152);
  const userSeq = useRef(500);

  const addRequest = useCallback((input: NewRequestInput): string => {
    const ticketNo = `TK-2026-0${ticketSeq.current++}`;
    const now = '2026-07-14T09:30:00+07:00';
    const req: ServiceRequest = {
      ticketNo,
      customerCode: input.customerCode,
      title: input.title,
      assetId: input.assetId,
      siteId: input.siteId,
      category: input.category,
      description: input.description,
      condition: input.condition,
      priority: input.priority,
      status: 'submitted',
      created: now,
      updated: now,
      team: 'SE Service Desk — pending assignment',
      contactPerson: input.contactPerson,
      contactMethod: input.contactMethod,
      preferredDate: input.preferredDate,
      timeline: [
        { date: now, label: 'Request submitted', labelTh: 'ส่งคำขอแล้ว', done: true, current: true },
        { date: '', label: 'SE reviews the request', labelTh: 'SE ตรวจสอบคำขอ', done: false },
        { date: '', label: 'Engineer assigned', labelTh: 'มอบหมายวิศวกร', done: false },
        { date: '', label: 'Appointment proposed', labelTh: 'เสนอวันนัดหมาย', done: false },
        { date: '', label: 'Work completed', labelTh: 'งานเสร็จสิ้น', done: false },
      ],
      comments: [],
      attachments: input.attachments,
    };
    setRequests((r) => [req, ...r]);
    return ticketNo;
  }, []);

  const cancelRequest = useCallback((ticketNo: string) => {
    setRequests((list) =>
      list.map((r) =>
        r.ticketNo === ticketNo
          ? {
              ...r,
              status: 'cancelled',
              updated: '2026-07-14T09:30:00+07:00',
              timeline: [
                ...r.timeline.map((t) => ({ ...t, current: false })),
                { date: '2026-07-14T09:30:00+07:00', label: 'Request cancelled by customer', labelTh: 'ลูกค้ายกเลิกคำขอ', done: true, current: true },
              ],
            }
          : r,
      ),
    );
  }, []);

  const confirmPM = useCallback((id: string) => {
    setPMVisits((list) => list.map((v) => (v.id === id ? { ...v, status: 'confirmed' } : v)));
  }, []);

  const requestReschedule = useCallback((id: string, _preferredDate: string, _reason: string) => {
    setPMVisits((list) => list.map((v) => (v.id === id ? { ...v, status: 'reschedule_requested' } : v)));
  }, []);

  const submitSignoff = useCallback(
    (jobNo: string, payload: { signedBy: string; signedTitle: string; comment: string; rating: ServiceRating }) => {
      setSignoffs((list) =>
        list.map((j) =>
          j.jobNo === jobNo
            ? {
                ...j,
                status: 'signed',
                signedBy: payload.signedBy,
                signedTitle: payload.signedTitle,
                signedDate: '2026-07-14',
                signComment: payload.comment,
                rating: payload.rating,
              }
            : j,
        ),
      );
      setRequests((list) =>
        list.map((r) =>
          r.signoffJobNo === jobNo
            ? {
                ...r,
                status: 'closed',
                updated: '2026-07-14T09:30:00+07:00',
                timeline: [
                  ...r.timeline.map((t) => ({ ...t, current: false })),
                  { date: '2026-07-14T09:30:00+07:00', label: 'Signed off and closed', labelTh: 'ยืนยันงานและปิดคำขอแล้ว', done: true, current: true },
                ],
              }
            : r,
        ),
      );
    },
    [],
  );

  const inviteUser = useCallback((u: Omit<PortalUser, 'id' | 'lastActive' | 'status'>) => {
    setUsers((list) => [
      ...list,
      { ...u, id: `U-${userSeq.current++}`, lastActive: '', status: 'invited' },
    ]);
  }, []);

  const updateUser = useCallback((id: string, patch: Partial<PortalUser>) => {
    setUsers((list) => list.map((u) => (u.id === id ? { ...u, ...patch } : u)));
  }, []);

  const value = useMemo(
    () => ({
      requests,
      addRequest,
      cancelRequest,
      pmVisits,
      confirmPM,
      requestReschedule,
      signoffs,
      submitSignoff,
      users,
      inviteUser,
      updateUser,
    }),
    [requests, addRequest, cancelRequest, pmVisits, confirmPM, requestReschedule, signoffs, submitSignoff, users, inviteUser, updateUser],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useData(): DataCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
