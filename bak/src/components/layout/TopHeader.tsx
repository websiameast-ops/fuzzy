import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, Building2, ChevronDown, HelpCircle, Menu, Moon, PanelLeftClose, PanelLeftOpen, Sun, User, LogOut, Settings } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { pageMeta } from '@/utils/nav';
import { initials } from '@/utils/format';
import { Modal, ContactSECard } from '@/components/common';

function useOutsideClose(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', key);
    };
  }, [open, onClose]);
  return ref;
}

export function TopHeader({
  collapsed,
  onToggleSidebar,
}: {
  collapsed: boolean;
  onToggleSidebar: () => void;
}) {
  const { lang, setLang, t } = useLang();
  const { theme, toggleTheme } = useTheme();
  const { companies, company, setCompanyCode } = useCompany();
  const { user } = useAuth();
  const { unreadCount, setDrawerOpen } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();

  const [companyOpen, setCompanyOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const companyRef = useOutsideClose(companyOpen, () => setCompanyOpen(false));
  const avatarRef = useOutsideClose(avatarOpen, () => setAvatarOpen(false));

  const meta = pageMeta(location.pathname);
  const title = lang === 'th' ? meta.th : meta.en;

  return (
    <>
      <header className="topbar">
        <div className="flex" style={{ gap: 10, minWidth: 0 }}>
          <button className="icon-btn" onClick={onToggleSidebar} aria-label={t('Toggle navigation', 'เปิด/ปิดเมนู')}>
            <span className="hide-mobile">{collapsed ? <PanelLeftOpen size={19} /> : <PanelLeftClose size={19} />}</span>
            <span className="only-mobile"><Menu size={20} /></span>
          </button>
          <div style={{ minWidth: 0 }}>
            <nav className="crumbs" aria-label="Breadcrumb">
              <Link to="/portal">{t('Home', 'หน้าหลัก')}</Link>
              {location.pathname !== '/portal' && (
                <>
                  <span aria-hidden>/</span>
                  <span className="current">{title}</span>
                </>
              )}
            </nav>
            <div className="topbar-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
          </div>
        </div>

        <div className="flex" style={{ gap: 8 }}>
          {/* Company switcher */}
          <div style={{ position: 'relative' }} ref={companyRef}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setCompanyOpen((o) => !o)}
              aria-haspopup="listbox"
              aria-expanded={companyOpen}
            >
              <Building2 size={16} aria-hidden />
              <span className="hide-mobile">{company.customerCode}</span>
              <ChevronDown size={14} aria-hidden />
            </button>
            {companyOpen && (
              <div className="menu-pop" role="listbox" aria-label={t('Switch company', 'สลับบริษัท')}>
                <div className="muted small" style={{ padding: '8px 12px 4px', fontWeight: 700 }}>
                  {t('Switch company', 'สลับบริษัท')}
                </div>
                {companies.map((c) => (
                  <button
                    key={c.customerCode}
                    className={`menu-item ${c.customerCode === company.customerCode ? 'selected' : ''}`}
                    role="option"
                    aria-selected={c.customerCode === company.customerCode}
                    onClick={() => {
                      setCompanyCode(c.customerCode);
                      setCompanyOpen(false);
                      navigate('/portal');
                    }}
                  >
                    <div>
                      <div>{lang === 'th' ? c.nameTh : c.name}</div>
                      <div className="muted small">{c.customerCode}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Language */}
          <div className="seg" role="group" aria-label={t('Language', 'ภาษา')}>
            <button className={lang === 'th' ? 'active' : ''} onClick={() => setLang('th')} aria-pressed={lang === 'th'}>
              TH
            </button>
            <button className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')} aria-pressed={lang === 'en'}>
              EN
            </button>
          </div>

          {/* Notifications */}
          <button
            className="icon-btn"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? t('Switch to light mode', 'สลับเป็นโหมดสว่าง') : t('Switch to dark mode', 'สลับเป็นโหมดมืด')}
            title={theme === 'dark' ? t('Light mode', 'โหมดสว่าง') : t('Dark mode', 'โหมดมืด')}
          >
            {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
          </button>
          <button className="icon-btn" onClick={() => setDrawerOpen(true)} aria-label={t(`Notifications, ${unreadCount} unread`, `การแจ้งเตือน ยังไม่อ่าน ${unreadCount}`)}>
            <Bell size={19} />
            {unreadCount > 0 && <span className="count-dot">{unreadCount}</span>}
          </button>

          {/* Help */}
          <button className="icon-btn hide-mobile" onClick={() => setHelpOpen(true)} aria-label={t('Help and support', 'ช่วยเหลือ')}>
            <HelpCircle size={19} />
          </button>

          {/* Avatar */}
          <div style={{ position: 'relative' }} ref={avatarRef}>
            <button
              className="icon-btn"
              onClick={() => setAvatarOpen((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={avatarOpen}
              aria-label={t('Account menu', 'เมนูบัญชี')}
            >
              <span className="avatar">{initials(user?.name ?? 'SE')}</span>
            </button>
            {avatarOpen && (
              <div className="menu-pop" role="menu" style={{ right: 0, left: 'auto' }}>
                <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--se-border)' }}>
                  <div className="fw-600">{user?.name}</div>
                  <div className="muted small">{user?.email}</div>
                </div>
                <Link to="/portal/profile" className="menu-item" role="menuitem" onClick={() => setAvatarOpen(false)}>
                  <User size={16} aria-hidden /> {t('My profile', 'โปรไฟล์ของฉัน')}
                </Link>
                <Link to="/portal/profile/notifications" className="menu-item" role="menuitem" onClick={() => setAvatarOpen(false)}>
                  <Settings size={16} aria-hidden /> {t('Notification settings', 'ตั้งค่าการแจ้งเตือน')}
                </Link>
                <Link to="/logout" className="menu-item" role="menuitem" onClick={() => setAvatarOpen(false)}>
                  <LogOut size={16} aria-hidden /> {t('Sign out', 'ออกจากระบบ')}
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </>
  );
}

export function HelpModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useLang();
  const { company } = useCompany();
  return (
    <Modal open={open} onClose={onClose} title={t('Help & support', 'ช่วยเหลือและสนับสนุน')}>
      <p className="muted" style={{ marginTop: 0 }}>
        {t(
          'Your SE team is ready to help with anything in this portal — from reporting a problem to contract questions.',
          'ทีม SE พร้อมช่วยเหลือทุกเรื่องในพอร์ทัลนี้ ตั้งแต่การแจ้งปัญหาจนถึงคำถามเรื่องสัญญา',
        )}
      </p>
      <div className="grid-1" style={{ display: 'grid', gap: 10 }}>
        <ContactSECard
          name={company.accountManager.name}
          role={t('Account Manager', 'ผู้จัดการฝ่ายลูกค้า')}
          phone={company.accountManager.phone}
          email={company.accountManager.email}
          line={company.accountManager.line}
        />
        <ContactSECard
          name={company.serviceCoordinator.name}
          role={t('Service Coordinator', 'ผู้ประสานงานบริการ')}
          phone={company.serviceCoordinator.phone}
          email={company.serviceCoordinator.email}
          line={company.serviceCoordinator.line}
        />
      </div>
      <p className="muted small" style={{ marginBottom: 0 }}>
        {t('Service hotline: 02-000-1600 (Mon–Sat, 08:00–18:00) · Emergency 24/7 for O&M customers.', 'สายด่วนบริการ: 02-000-1600 (จ.–ส. 08:00–18:00) · ฉุกเฉิน 24 ชม. สำหรับลูกค้า O&M')}
      </p>
    </Modal>
  );
}
