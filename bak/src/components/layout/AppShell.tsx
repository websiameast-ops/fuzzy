import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopHeader, HelpModal } from './TopHeader';
import { NotificationDrawer } from './NotificationDrawer';
import { MobileBottomNav } from './MobileBottomNav';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useLang } from '@/contexts/LanguageContext';

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { companySelected } = useCompany();
  const location = useLocation();
  if (!user || !companySelected) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  return <>{children}</>;
}

export function AppShell() {
  const { t } = useLang();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const toggleSidebar = () => {
    if (window.innerWidth <= 1024) setMobileOpen((o) => !o);
    else setCollapsed((c) => !c);
  };

  return (
    <div className="app-shell">
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onOpenSupport={() => {
          setMobileOpen(false);
          setSupportOpen(true);
        }}
      />
      <div className={`main-area ${collapsed ? 'sidebar-collapsed' : ''}`}>
        <TopHeader collapsed={collapsed} onToggleSidebar={toggleSidebar} />
        <main className="content" id="main">
          <Outlet />
        </main>
        <footer className="app-footer">
          {t(
            'SE Connex — Customer Portal v2 Preview. All companies, assets, tickets and figures shown are demonstration data.',
            'SE Connex — พอร์ทัลลูกค้า v2 (พรีวิว) ข้อมูลบริษัท อุปกรณ์ คำขอ และตัวเลขทั้งหมดเป็นข้อมูลสาธิต',
          )}
        </footer>
      </div>
      <MobileBottomNav />
      <NotificationDrawer />
      <HelpModal open={supportOpen} onClose={() => setSupportOpen(false)} />
    </div>
  );
}
