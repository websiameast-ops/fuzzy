import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { CompanyProvider } from '@/contexts/CompanyContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { DataProvider } from '@/contexts/DataContext';

import { AppShell, RequireAuth } from '@/components/layout/AppShell';
import { LoginPage, LogoutRoute } from '@/pages/auth/LoginPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { NewsPage, NewsDetailPage } from '@/pages/news/NewsPage';
import { EquipmentPage } from '@/pages/equipment/EquipmentPage';
import { AssetDetailPage } from '@/pages/equipment/AssetDetailPage';
import { SitesMapPage, SiteDetailPage } from '@/pages/sites/SitesMapPage';
import { IoTMonitoringPage } from '@/pages/iot/IoTMonitoringPage';
import { DigitalTwinPage } from '@/pages/digitaltwin/DigitalTwinPage';
import { HistoryPage } from '@/pages/history/HistoryPage';
import { RequestsPage } from '@/pages/requests/RequestsPage';
import { NewRequestPage } from '@/pages/requests/NewRequestPage';
import { TicketDetailPage } from '@/pages/requests/TicketDetailPage';
import { ContractsPage, ContractDetailPage } from '@/pages/contracts/ContractsPage';
import { PMPage } from '@/pages/pm/PMPage';
import { SignOffPage, SignOffDetailPage } from '@/pages/signoff/SignOffPage';
import { CarbonPage } from '@/pages/carbon/CarbonPage';
import { MaterialsPage } from '@/pages/materials/MaterialsPage';
import { PartsPage } from '@/pages/parts/PartsPage';
import { ProfilePage, UsersPage, NotificationsPage } from '@/pages/profile/ProfilePage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { LandingPage } from '@/pages/landing/LandingPage';

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
    <LanguageProvider>
      <ToastProvider>
        <AuthProvider>
          <CompanyProvider>
            <NotificationProvider>
              <DataProvider>{children}</DataProvider>
            </NotificationProvider>
          </CompanyProvider>
        </AuthProvider>
      </ToastProvider>
    </LanguageProvider>
    </ThemeProvider>
  );
}

export function App() {
  return (
    <Providers>
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/logout" element={<LogoutRoute />} />

          <Route
            path="/portal"
            element={
              <RequireAuth>
                <AppShell />
              </RequireAuth>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="news" element={<NewsPage />} />
            <Route path="news/:id" element={<NewsDetailPage />} />
            <Route path="equipment" element={<EquipmentPage />} />
            <Route path="equipment/:assetId" element={<AssetDetailPage />} />
            <Route path="map" element={<SitesMapPage />} />
            <Route path="map/:siteId" element={<SiteDetailPage />} />
            <Route path="iot" element={<IoTMonitoringPage />} />
            <Route path="digital-twin" element={<DigitalTwinPage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="requests" element={<RequestsPage />} />
            <Route path="requests/new" element={<NewRequestPage />} />
            <Route path="requests/:ticketNo" element={<TicketDetailPage />} />
            <Route path="contracts" element={<ContractsPage />} />
            <Route path="contracts/:contractId" element={<ContractDetailPage />} />
            <Route path="pm" element={<PMPage />} />
            <Route path="sign-off" element={<SignOffPage />} />
            <Route path="sign-off/:jobNo" element={<SignOffDetailPage />} />
            <Route path="carbon" element={<CarbonPage />} />
            <Route path="materials" element={<MaterialsPage />} />
            <Route path="parts" element={<PartsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="profile/users" element={<UsersPage />} />
            <Route path="profile/notifications" element={<NotificationsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </Providers>
  );
}
