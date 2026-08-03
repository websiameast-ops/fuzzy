import { NavLink, Link } from 'react-router-dom';
import { LifeBuoy, LogOut } from 'lucide-react';
import { Logo } from '@/components/common';
import { NAV_ITEMS } from '@/utils/nav';
import { useLang } from '@/contexts/LanguageContext';
import { useCompany } from '@/contexts/CompanyContext';

export function Sidebar({
  collapsed,
  mobileOpen,
  onCloseMobile,
  onOpenSupport,
}: {
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenSupport: () => void;
}) {
  const { lang, t } = useLang();
  const { company } = useCompany();

  return (
    <>
      {mobileOpen && <div className="sidebar-backdrop" onClick={onCloseMobile} role="presentation" />}
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`} aria-label={t('Main navigation', 'เมนูหลัก')}>
        <div className="sidebar-header">
          <Link to="/portal" aria-label={t('SE Connex home', 'หน้าหลัก SE Connex')} onClick={onCloseMobile}>
            <Logo height={collapsed ? 26 : 32} />
          </Link>
          <div className="company-chip">
            <div className="fw-600 small" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {lang === 'th' ? company.nameTh : company.name}
            </div>
            <div className="muted small">{company.customerCode}</div>
          </div>
        </div>

        <nav className="nav-scroll">
          <div className="nav-section-title">{t('Portal', 'พอร์ทัล')}</div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={onCloseMobile}
                title={lang === 'th' ? item.th : item.en}
              >
                <Icon size={19} className="nav-icon" aria-hidden />
                <span className="nav-label">
                  {lang === 'th' ? item.th : item.en}
                  <span className="th-sub">{lang === 'th' ? item.en : item.th}</span>
                </span>
                {item.isNew && (
                  <span className="badge t-brand" style={{ fontSize: 10, padding: '1px 7px' }}>
                    NEW
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item" onClick={onOpenSupport} style={{ width: '100%' }}>
            <LifeBuoy size={19} className="nav-icon" aria-hidden />
            <span className="nav-label">{t('Support', 'ฝ่ายสนับสนุน')}</span>
          </button>
          <Link to="/logout" className="nav-item" onClick={onCloseMobile}>
            <LogOut size={19} className="nav-icon" aria-hidden />
            <span className="nav-label">{t('Sign out', 'ออกจากระบบ')}</span>
          </Link>
          <div className="version-label">Customer Portal v2 Preview</div>
        </div>
      </aside>
    </>
  );
}
