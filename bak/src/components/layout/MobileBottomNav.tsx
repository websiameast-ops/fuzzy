import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Home, Package, ClipboardList, MoreHorizontal, Plus, Newspaper, History, FileText, CalendarCheck, FileSignature, Leaf, UserCog, LogOut, X, MapPin, Wifi, Activity, Boxes, Wrench } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';

export function MobileBottomNav() {
  const { t } = useLang();
  const [sheetOpen, setSheetOpen] = useState(false);

  const MORE = [
    { to: '/portal/news', icon: Newspaper, en: 'News & Updates', th: 'ข่าวสาร' },
    { to: '/portal/map', icon: MapPin, en: 'My Sites — Map', th: 'ไซต์ของฉัน — แผนที่' },
    { to: '/portal/iot', icon: Wifi, en: 'Live Monitoring', th: 'มอนิเตอริ่งแบบเรียลไทม์' },
    { to: '/portal/digital-twin', icon: Activity, en: 'Factory Digital Twin', th: 'ฝาแฝดดิจิทัลโรงงาน' },
    { to: '/portal/history', icon: History, en: 'Service History', th: 'ประวัติการซ่อมบำรุง' },
    { to: '/portal/contracts', icon: FileText, en: 'Contracts', th: 'สัญญาบริการ' },
    { to: '/portal/pm', icon: CalendarCheck, en: 'PM Schedule', th: 'แผนบำรุงรักษา' },
    { to: '/portal/sign-off', icon: FileSignature, en: 'Work Sign-off', th: 'ยืนยันงาน' },
    { to: '/portal/carbon', icon: Leaf, en: 'Energy & Carbon', th: 'พลังงานและคาร์บอน' },
    { to: '/portal/materials', icon: Boxes, en: 'Materials & Consumables', th: 'วัสดุสิ้นเปลือง' },
    { to: '/portal/parts', icon: Wrench, en: 'Parts & Orders', th: 'อะไหล่และคำสั่งซื้อ' },
    { to: '/portal/profile', icon: UserCog, en: 'Profile & Settings', th: 'โปรไฟล์และตั้งค่า' },
  ];

  return (
    <>
      <nav className="bottom-nav" aria-label={t('Mobile navigation', 'เมนูมือถือ')}>
        <NavLink to="/portal" end className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
          <Home size={20} aria-hidden />
          {t('Home', 'หน้าหลัก')}
        </NavLink>
        <NavLink to="/portal/equipment" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
          <Package size={20} aria-hidden />
          {t('Equipment', 'อุปกรณ์')}
        </NavLink>
        <Link to="/portal/requests/new" className="report-fab" aria-label={t('Report a problem', 'แจ้งปัญหา')}>
          <span className="fab-circle" aria-hidden>
            <Plus size={26} />
          </span>
          {t('Report', 'แจ้งปัญหา')}
        </Link>
        <NavLink to="/portal/requests" end className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
          <ClipboardList size={20} aria-hidden />
          {t('Requests', 'คำขอ')}
        </NavLink>
        <button className="bottom-nav-item" onClick={() => setSheetOpen(true)} aria-haspopup="dialog">
          <MoreHorizontal size={20} aria-hidden />
          {t('More', 'เพิ่มเติม')}
        </button>
      </nav>

      {sheetOpen && (
        <div className="sheet-overlay" onClick={(e) => e.target === e.currentTarget && setSheetOpen(false)} role="presentation">
          <div className="sheet" role="dialog" aria-modal="true" aria-label={t('More sections', 'เมนูเพิ่มเติม')}>
            <div className="sheet-handle" aria-hidden />
            <div className="between" style={{ marginBottom: 4 }}>
              <span className="fw-600">{t('More sections', 'เมนูเพิ่มเติม')}</span>
              <button className="icon-btn" onClick={() => setSheetOpen(false)} aria-label={t('Close', 'ปิด')}>
                <X size={18} />
              </button>
            </div>
            {MORE.map((m) => {
              const Icon = m.icon;
              return (
                <NavLink key={m.to} to={m.to} className="nav-item" onClick={() => setSheetOpen(false)}>
                  <Icon size={19} className="nav-icon" aria-hidden />
                  <span className="nav-label">{t(m.en, m.th)}</span>
                </NavLink>
              );
            })}
            <Link to="/logout" className="nav-item" onClick={() => setSheetOpen(false)}>
              <LogOut size={19} className="nav-icon" aria-hidden />
              <span className="nav-label">{t('Sign out', 'ออกจากระบบ')}</span>
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
