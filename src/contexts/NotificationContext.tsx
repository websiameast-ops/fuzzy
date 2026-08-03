import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { AppNotification, NotificationCategory, NotificationPrefs } from '@/types';
import { mockNotifications } from '@/data/mockNotifications';
import { useCompany } from './CompanyContext';

export const NOTIF_CATEGORIES: { key: NotificationCategory; en: string; th: string }[] = [
  { key: 'serviceUpdates', en: 'Service-request updates', th: 'ความคืบหน้าคำขอบริการ' },
  { key: 'appointmentReminders', en: 'Appointment reminders', th: 'เตือนนัดหมาย' },
  { key: 'warrantyExpiry', en: 'Warranty expiry', th: 'การหมดประกัน' },
  { key: 'contractExpiry', en: 'Contract expiry', th: 'สัญญาใกล้หมดอายุ' },
  { key: 'pmConfirmation', en: 'Preventive-maintenance confirmation', th: 'การยืนยันงาน PM' },
  { key: 'signoffPending', en: 'Work awaiting sign-off', th: 'งานรอการยืนยัน' },
  { key: 'equipmentAlarms', en: 'Equipment alarms', th: 'สัญญาณเตือนอุปกรณ์' },
  { key: 'newsPromotions', en: 'News and promotions', th: 'ข่าวสารและโปรโมชั่น' },
];

function defaultPrefs(): NotificationPrefs {
  const prefs = {} as NotificationPrefs;
  for (const c of NOTIF_CATEGORIES) {
    prefs[c.key] = {
      inapp: true,
      email: c.key !== 'newsPromotions',
      line: c.key === 'equipmentAlarms' || c.key === 'appointmentReminders' || c.key === 'serviceUpdates',
      sms: false,
    };
  }
  return prefs;
}

interface NotificationCtx {
  /** all notifications for the selected company, filtered by in-app preferences */
  notifications: AppNotification[];
  unreadCount: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
  prefs: NotificationPrefs;
  setPrefs: (p: NotificationPrefs) => void;
  resetPrefs: () => void;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
}

const Ctx = createContext<NotificationCtx | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { customerCode } = useCompany();
  const [all, setAll] = useState<AppNotification[]>(mockNotifications);
  const [prefs, setPrefs] = useState<NotificationPrefs>(defaultPrefs);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const notifications = useMemo(
    () =>
      all
        .filter((n) => n.customerCode === customerCode && prefs[n.category]?.inapp)
        .sort((a, b) => (a.time < b.time ? 1 : -1)),
    [all, customerCode, prefs],
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markRead = useCallback((id: string) => {
    setAll((list) => list.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllRead = useCallback(() => {
    setAll((list) => list.map((n) => ({ ...n, read: true })));
  }, []);

  const resetPrefs = useCallback(() => setPrefs(defaultPrefs()), []);

  const value = useMemo(
    () => ({ notifications, unreadCount, markRead, markAllRead, prefs, setPrefs, resetPrefs, drawerOpen, setDrawerOpen }),
    [notifications, unreadCount, markRead, markAllRead, prefs, resetPrefs, drawerOpen],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useNotifications(): NotificationCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
