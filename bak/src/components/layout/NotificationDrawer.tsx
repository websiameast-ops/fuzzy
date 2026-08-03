import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, CheckCheck, BellOff } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { relTime } from '@/utils/format';
import type { NotificationCategory } from '@/types';

type TabKey = 'all' | 'service' | 'warranty' | 'contract' | 'alarms';

const TAB_CATEGORIES: Record<Exclude<TabKey, 'all'>, NotificationCategory[]> = {
  service: ['serviceUpdates', 'appointmentReminders', 'pmConfirmation', 'signoffPending'],
  warranty: ['warrantyExpiry'],
  contract: ['contractExpiry'],
  alarms: ['equipmentAlarms'],
};

export function NotificationDrawer() {
  const { lang, t } = useLang();
  const { notifications, unreadCount, markRead, markAllRead, drawerOpen, setDrawerOpen } = useNotifications();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabKey>('all');

  useEffect(() => {
    if (!drawerOpen) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  }, [drawerOpen, setDrawerOpen]);

  if (!drawerOpen) return null;

  const visible = tab === 'all' ? notifications : notifications.filter((n) => TAB_CATEGORIES[tab].includes(n.category));

  const TABS: { key: TabKey; en: string; th: string }[] = [
    { key: 'all', en: 'All', th: 'ทั้งหมด' },
    { key: 'service', en: 'Service', th: 'บริการ' },
    { key: 'warranty', en: 'Warranty', th: 'ประกัน' },
    { key: 'contract', en: 'Contract', th: 'สัญญา' },
    { key: 'alarms', en: 'Equipment alerts', th: 'แจ้งเตือนอุปกรณ์' },
  ];

  return (
    <>
      <div className="drawer-overlay" onClick={() => setDrawerOpen(false)} role="presentation" />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={t('Notifications', 'การแจ้งเตือน')}>
        <div className="drawer-header">
          <div className="between">
            <h3 style={{ margin: 0 }}>{t('Notifications', 'การแจ้งเตือน')}</h3>
            <div className="flex" style={{ gap: 6 }}>
              {unreadCount > 0 && (
                <button className="btn btn-ghost btn-sm" onClick={markAllRead}>
                  <CheckCheck size={15} aria-hidden />
                  {t('Mark all read', 'อ่านทั้งหมด')}
                </button>
              )}
              <button className="icon-btn" onClick={() => setDrawerOpen(false)} aria-label={t('Close notifications', 'ปิดการแจ้งเตือน')}>
                <X size={18} />
              </button>
            </div>
          </div>
          <div className="tabs" style={{ marginTop: 8 }}>
            {TABS.map((tb) => (
              <button key={tb.key} className={`tab ${tab === tb.key ? 'active' : ''}`} onClick={() => setTab(tb.key)}>
                {lang === 'th' ? tb.th : tb.en}
              </button>
            ))}
          </div>
        </div>
        <div className="drawer-body">
          {visible.length === 0 && (
            <div className="empty-state">
              <div className="es-icon" aria-hidden>
                <BellOff size={24} />
              </div>
              <h3>{t('Nothing here', 'ไม่มีการแจ้งเตือน')}</h3>
              <p className="muted small">
                {t('New notifications in this category will appear here. You can adjust which alerts you receive in notification settings.', 'การแจ้งเตือนใหม่ในหมวดนี้จะแสดงที่นี่ ปรับประเภทการแจ้งเตือนได้ในหน้าตั้งค่า')}
              </p>
            </div>
          )}
          {visible.map((n) => (
            <button
              key={n.id}
              className={`notif-item ${n.read ? '' : 'unread'}`}
              onClick={() => {
                markRead(n.id);
                setDrawerOpen(false);
                if (n.link) navigate(n.link);
              }}
            >
              <span className="notif-dot" aria-hidden />
              <span style={{ minWidth: 0 }}>
                <span className="fw-600" style={{ display: 'block' }}>{n.title}</span>
                <span className="muted small" style={{ display: 'block', marginTop: 2 }}>{n.body}</span>
                <span className="muted small" style={{ display: 'block', marginTop: 4 }}>{relTime(n.time, lang)}</span>
              </span>
            </button>
          ))}
        </div>
      </aside>
    </>
  );
}
