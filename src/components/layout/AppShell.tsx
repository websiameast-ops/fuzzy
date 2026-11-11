import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopHeader, HelpModal } from './TopHeader';
import { NotificationDrawer } from './NotificationDrawer';
import { MobileBottomNav } from './MobileBottomNav';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useLang } from '@/contexts/LanguageContext';
import { useAppVersion } from '@/hooks/useAppVersion';
import { setNewsLastPath } from '@/utils/nav';

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, initializing } = useAuth();
  const { companySelected } = useCompany();
  const location = useLocation();
  // Wait for the silent session-restore (storage → refresh token) to settle before
  // deciding to redirect — otherwise every page reload bounces to /login for the
  // instant it takes that request to resolve, even with a valid stored session.
  if (initializing) {
    return null;
  }
  if (!user || !companySelected) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  return <>{children}</>;
}

export function AppShell() {
  const { t } = useLang();
  const version = useAppVersion();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
    window.scrollTo(0, 0);
    if (/^\/portal\/news(\/|$)/.test(location.pathname)) {
      setNewsLastPath(location.pathname);
    }
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
            `SE Connex — Customer Portal${version ? ` v${version}` : ''}. All companies, assets, tickets and figures shown are demonstration data.`,
            `SE Connex — พอร์ทัลลูกค้า${version ? ` v${version}` : ''} ข้อมูลบริษัท อุปกรณ์ คำขอ และตัวเลขทั้งหมดเป็นข้อมูลสาธิต`,
          )}
        </footer>
      </div>
      <MobileBottomNav />
      <NotificationDrawer />
      <HelpModal open={supportOpen} onClose={() => setSupportOpen(false)} />
    </div>
  );
}
