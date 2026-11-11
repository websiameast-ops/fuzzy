import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CalendarCheck,
  ClipboardList,
  FileSignature,
  FileText,
  Leaf,
  Mail,
  MapPin,
  Newspaper,
  Package,
  Phone,
  Plus,
  QrCode,
  ShieldCheck,
  Wifi,
  History as HistoryIcon,
  Boxes,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useLang } from '@/contexts/LanguageContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { KpiCard, QRScannerMock, StatusBadge } from '@/components/common';
import { assetsFor } from '@/data/mockAssets';
import { siteName } from '@/data/mockCompanies';
import { mockNews } from '@/data/mockNews';
import { contractsFor } from '@/data/mockContracts';
import { fmtDate, fmtDateLong, daysUntil, greeting } from '@/utils/format';
import { REQUEST_STATUS, PRIORITY, WARRANTY_STATUS } from '@/utils/status';

const WARRANTY_COLORS: Record<string, string> = {
  active: 'var(--se-success)',
  expiring: 'var(--se-warning)',
  expired: 'var(--se-danger)',
  none: '#b0b9c4',
};

export function DashboardPage() {
  const { lang, t } = useLang();
  const { customerCode, company } = useCompany();
  const { user } = useAuth();
  const { requests, pmVisits, confirmPM, signoffs } = useData();
  const navigate = useNavigate();
  const [scanOpen, setScanOpen] = useState(false);

  const assets = useMemo(() => assetsFor(customerCode), [customerCode]);
  const myRequests = requests.filter((r) => r.customerCode === customerCode);
  const openRequests = myRequests.filter((r) => !['completed', 'closed', 'cancelled'].includes(r.status));
  const upcomingPM = pmVisits
    .filter((v) => v.customerCode === customerCode && v.status !== 'completed' && v.date >= '2026-07-14')
    .sort((a, b) => (a.date > b.date ? 1 : -1));
  const pendingSignoffs = signoffs.filter((s) => s.customerCode === customerCode && s.status === 'pending');
  const contracts = contractsFor(customerCode);
  const expiringContracts = contracts.filter((c) => c.status === 'expiring');

  const wCounts = {
    active: assets.filter((a) => a.warranty === 'active').length,
    expiring: assets.filter((a) => a.warranty === 'expiring').length,
    expired: assets.filter((a) => a.warranty === 'expired').length,
    none: assets.filter((a) => a.warranty === 'none').length,
  };
  const donutData = [
    { key: 'active', name: lang === 'th' ? WARRANTY_STATUS.active.th : WARRANTY_STATUS.active.en, value: wCounts.active },
    { key: 'expiring', name: lang === 'th' ? WARRANTY_STATUS.expiring.th : WARRANTY_STATUS.expiring.en, value: wCounts.expiring },
    { key: 'expired', name: lang === 'th' ? WARRANTY_STATUS.expired.th : WARRANTY_STATUS.expired.en, value: wCounts.expired },
    { key: 'none', name: t('No warranty', 'ไม่มีประกัน'), value: wCounts.none },
  ].filter((d) => d.value > 0);

  const alarmedAssets = assets.filter((a) => a.iot?.alarms.some((al) => al.active && al.severity === 'critical'));
  const latestRequests = [...myRequests].sort((a, b) => (a.updated < b.updated ? 1 : -1)).slice(0, 4);
  const news = mockNews.slice(0, 3);

  const quickActions = [
    { to: '/portal/requests/new', icon: Plus, en: 'Report a problem', th: 'แจ้งปัญหา', tone: 'brand' },
    { to: '/portal/equipment', icon: Package, en: 'Browse equipment', th: 'ดูอุปกรณ์', tone: '' },
    { to: '/portal/map', icon: MapPin, en: 'My Sites — Map', th: 'ไซต์ของฉัน — แผนที่', tone: '' },
    { to: '/portal/iot', icon: Wifi, en: 'Live Monitoring', th: 'มอนิเตอริ่งแบบเรียลไทม์', tone: '' },
    // { to: '/portal/digital-twin', icon: Activity, en: 'Factory Digital Twin', th: 'ฝาแฝดดิจิทัลโรงงาน', tone: '' },
    { to: '/portal/pm', icon: CalendarCheck, en: 'PM schedule', th: 'แผน PM', tone: '' },
    { to: '/portal/history', icon: HistoryIcon, en: 'Service history', th: 'ประวัติบริการ', tone: '' },
    { to: '/portal/contracts', icon: FileText, en: 'Contracts', th: 'สัญญาบริการ', tone: '' },
    // { to: '/portal/carbon', icon: Leaf, en: 'Energy & carbon', th: 'พลังงานและคาร์บอน', tone: '' },
    // { to: '/portal/materials', icon: Boxes, en: 'Reorder materials', th: 'สั่งวัสดุซ้ำ', tone: '' },
  ];

  return (
    <div>
      {/* A. Greeting */}
      <div className="page-header" style={{ marginBottom: 18 }}>
        <div>
          <h1 className="page-title" style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>
            {greeting(lang)}
          </h1>
          <p className="page-sub" style={{ margin: '4px 0 0', color: 'var(--se-text-secondary)', fontSize: 13.5 }}>
            {lang === 'th' ? company.nameTh : company.name} · {company.customerCode} · Wednesday, 11 November 2026
          </p>
        </div>
        <div className="page-actions" style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-outline" onClick={() => setScanOpen(true)} style={{ borderRadius: 8, padding: '8px 14px', fontWeight: 600 }}>
            <QrCode size={16} aria-hidden />
            {t('Scan QR', 'สแกน QR')}
          </button>
          <Link to="/portal/requests/new" className="btn btn-primary" style={{ borderRadius: 8, padding: '8px 16px', fontWeight: 600, background: '#17599c', borderColor: '#17599c' }}>
            <Plus size={16} aria-hidden />
            {t('Report a problem', 'แจ้งปัญหา')}
          </Link>
        </div>
      </div>

      {/* B. KPI Cards (4 columns) */}
      <div className="grid-4" style={{ marginBottom: 16 }}>
        <KpiCard
          icon={<Package size={22} />}
          value={assets.length}
          label={t('Registered equipment', 'อุปกรณ์ที่ลงทะเบียน')}
          sub={t('7 sites', '7 ไซต์งาน')}
          to="/portal/equipment"
        />
        <KpiCard
          icon={<ShieldCheck size={22} />}
          value={8}
          label={t('Under warranty', 'อยู่ในประกัน')}
          sub={t('1 expiring soon', '1 ใกล้หมดอายุ')}
          to="/portal/equipment?warranty=active"
          tone="green"
        />
        <KpiCard
          icon={<ClipboardList size={22} />}
          value={6}
          label={t('Open service requests', 'คำขอบริการที่ค้างอยู่')}
          sub={t('0 urgent', '0 เร่งด่วน')}
          to="/portal/requests"
          tone="blue"
        />
        <KpiCard
          icon={<CalendarCheck size={22} />}
          value={0}
          label={t('Upcoming PM visits', 'งาน PM ที่กำลังจะถึง')}
          to="/portal/pm"
          tone="amber"
        />
      </div>

      {/* C. Full Width Alert Banner */}
      <div style={{ marginBottom: 16 }}>
        <Link
          to="/portal/equipment?warranty=expiring"
          className="alert-item"
          style={{
            background: '#fff9ec',
            border: '1px solid #fde5be',
            borderRadius: 10,
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            textDecoration: 'none',
            color: '#854d0e',
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          <ShieldCheck size={18} style={{ color: '#d97706', flexShrink: 0 }} aria-hidden />
          <span style={{ flex: 1 }}>
            <strong style={{ fontWeight: 600 }}>{t('Warranty', 'การรับประกัน')}:</strong>{' '}
            {t('1 assets leave warranty within 60 days.', 'อุปกรณ์ 1 รายการจะหมดประกันภายใน 60 วัน')}
          </span>
          <ArrowRight size={16} style={{ color: '#d97706', flexShrink: 0 }} aria-hidden />
        </Link>
      </div>

      {/* D. Main Grid (3 columns for row 1, 2 columns + 1 column for row 2) */}
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1.15fr 1.15fr', gap: 16, alignItems: 'start', marginBottom: 16 }}>
        {/* Col 1: Quick Actions */}
        <aside className="card" aria-label={t('Quick actions', 'ทางลัด')} style={{ borderRadius: 12 }}>
          <div className="card-header" style={{ padding: '14px 16px', borderBottom: '1px solid var(--se-border)' }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{t('Quick actions', 'ทางลัด')}</h3>
          </div>
          <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {quickActions.map((q) => {
              const Icon = q.icon;
              return (
                <Link
                  key={q.to + q.en}
                  to={q.to}
                  className={`dash-rail-item ${q.tone === 'brand' ? 'brand' : ''}`}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    fontSize: 13.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    textDecoration: 'none',
                    fontWeight: 500,
                  }}
                >
                  <Icon size={16} aria-hidden />
                  <span>{t(q.en, q.th)}</span>
                </Link>
              );
            })}
          </div>
        </aside>

        {/* Col 2: Warranty Overview Donut */}
        <div className="card" style={{ borderRadius: 12 }}>
          <div className="card-header" style={{ padding: '14px 18px', borderBottom: '1px solid var(--se-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{t('Warranty overview', 'ภาพรวมการรับประกัน')}</h3>
            <Link to="/portal/equipment" className="card-link" style={{ fontSize: 13, color: 'var(--se-primary)', textDecoration: 'none' }}>
              {t('View all', 'ดูทั้งหมด')}
            </Link>
          </div>
          <div style={{ padding: '14px 18px 16px' }}>
            <div style={{ height: 180 }} aria-hidden>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={donutData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={76} paddingAngle={2}>
                    <Cell fill="#10b981" />
                    <Cell fill="#f59e0b" />
                    <Cell fill="#ef4444" />
                    <Cell fill="#94a3b8" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 6, marginTop: 10 }}>
              <div className="flex between small">
                <span className="flex" style={{ gap: 8, alignItems: 'center' }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: '#10b981', display: 'inline-block' }} aria-hidden />
                  {t('Under warranty', 'อยู่ในประกัน')}
                </span>
                <strong>8</strong>
              </div>
              <div className="flex between small">
                <span className="flex" style={{ gap: 8, alignItems: 'center' }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: '#f59e0b', display: 'inline-block' }} aria-hidden />
                  {t('Expiring soon', 'ใกล้หมดประกัน')}
                </span>
                <strong>1</strong>
              </div>
              <div className="flex between small">
                <span className="flex" style={{ gap: 8, alignItems: 'center' }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: '#ef4444', display: 'inline-block' }} aria-hidden />
                  {t('Expired', 'หมดประกัน')}
                </span>
                <strong>98</strong>
              </div>
              <div className="flex between small">
                <span className="flex" style={{ gap: 8, alignItems: 'center' }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: '#94a3b8', display: 'inline-block' }} aria-hidden />
                  {t('No warranty', 'ไม่มีประกัน')}
                </span>
                <strong>0</strong>
              </div>
            </div>
            <p className="muted small" style={{ margin: '12px 0 0', fontSize: 12.5 }}>
              {t('8 of 106 assets are covered; 1 need attention within 60 days.', '8 จาก 106 รายการยังอยู่ในประกัน โดย 1 รายการต้องพิจารณาภายใน 60 วัน')}
            </p>
          </div>
        </div>

        {/* Col 3: Your SE Team */}
        <div className="card" style={{ borderRadius: 12 }}>
          <div className="card-header" style={{ padding: '14px 18px', borderBottom: '1px solid var(--se-border)' }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{t('Your SE team', 'ทีม SE ของคุณ')}</h3>
          </div>
          <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Contact 1 */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#1e293b', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                IA
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--se-text)' }}>Irada Apiwong</div>
                <div style={{ fontSize: 12.5, color: 'var(--se-text-muted)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  Sales Engineer
                </div>
                <div style={{ marginTop: 4 }}>
                  <span style={{ fontSize: 11, background: '#e0f2fe', color: '#0369a1', padding: '1px 8px', borderRadius: 4, fontWeight: 600 }}>Pump</span>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 8, fontSize: 12, flexWrap: 'wrap' }}>
                  <a href="tel:0633935208" style={{ color: 'var(--se-text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Phone size={12} aria-hidden /> 063-3935208
                  </a>
                  <a href="mailto:irada.api@siameastsolutions.com" style={{ color: 'var(--se-text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Mail size={12} aria-hidden /> irada.api@siameastsolutions.com
                  </a>
                </div>
              </div>
            </div>

            {/* Contact 2 */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', borderTop: '1px solid var(--se-border)', paddingTop: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#1e293b', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                NB
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--se-text)' }}>Nathathai Boonwan</div>
                <div style={{ fontSize: 12.5, color: 'var(--se-text-muted)', marginTop: 2 }}>
                  Sales Engineer
                </div>
                <div style={{ marginTop: 4 }}>
                  <span style={{ fontSize: 11, background: '#e0f2fe', color: '#0369a1', padding: '1px 8px', borderRadius: 4, fontWeight: 600 }}>Pump</span>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 8, fontSize: 12, flexWrap: 'wrap' }}>
                  <a href="tel:0633935090" style={{ color: 'var(--se-text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Phone size={12} aria-hidden /> 063-3935090
                  </a>
                  <a href="mailto:nathathai.boo@siameastsolutions.com" style={{ color: 'var(--se-text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Mail size={12} aria-hidden /> nathathai.boo@siameastsolutions.com
                  </a>
                </div>
              </div>
            </div>

            {/* Contact 3 */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', borderTop: '1px solid var(--se-border)', paddingTop: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#1e293b', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                SP
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--se-text)' }}>Suchittra Phokaew</div>
                <div style={{ fontSize: 12.5, color: 'var(--se-text-muted)', marginTop: 2 }}>
                  Area Service Manager
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Col 1 & 2 (span 2) -> Latest Service Requests */}
        <div className="card" style={{ gridColumn: 'span 2', borderRadius: 12 }}>
          <div className="card-header" style={{ padding: '14px 18px', borderBottom: '1px solid var(--se-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{t('Latest service requests', 'คำขอบริการล่าสุด')}</h3>
            <Link to="/portal/requests" className="card-link" style={{ fontSize: 13, color: 'var(--se-primary)', textDecoration: 'none' }}>
              {t('View all', 'ดูทั้งหมด')}
            </Link>
          </div>
          <div style={{ padding: '0 8px' }}>
            <table className="se-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--se-text-muted)', padding: '10px 12px' }}>{t('Ticket', 'เลขที่')}</th>
                  <th style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--se-text-muted)', padding: '10px 12px' }}>{t('Subject', 'เรื่อง')}</th>
                  <th style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--se-text-muted)', padding: '10px 12px' }}>{t('Priority', 'ความเร่งด่วน')}</th>
                  <th style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--se-text-muted)', padding: '10px 12px' }}>{t('Status', 'สถานะ')}</th>
                </tr>
              </thead>
              <tbody>
                <tr className="row-link" onClick={() => navigate('/portal/requests/TK-2026-00052')}>
                  <td style={{ padding: '12px', fontSize: 13.5, color: '#0284c7', fontWeight: 600 }}>TK-2026-00052</td>
                  <td style={{ padding: '12px', fontSize: 13.5 }}>ตัวเครื่อง S/N 0: 12...</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#ef4444', background: '#fef2f2', padding: '2px 8px', borderRadius: 12 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444' }} />
                      Critical
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#0284c7', background: '#f0f9ff', padding: '2px 8px', borderRadius: 12 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#0284c7' }} />
                      Open
                    </span>
                  </td>
                </tr>
                <tr className="row-link" onClick={() => navigate('/portal/requests/TK-2026-00051')}>
                  <td style={{ padding: '12px', fontSize: 13.5, color: '#0284c7', fontWeight: 600 }}>TK-2026-00051</td>
                  <td style={{ padding: '12px', fontSize: 13.5 }}>ตัวเครื่อง S/N : AZX...</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#06b6d4', background: '#ecfeff', padding: '2px 8px', borderRadius: 12 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#06b6d4' }} />
                      Medium
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#0284c7', background: '#f0f9ff', padding: '2px 8px', borderRadius: 12 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#0284c7' }} />
                      Assigned
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Row 2: Col 3 (span 1) -> Upcoming Maintenance */}
        <div className="card" style={{ borderRadius: 12 }}>
          <div className="card-header" style={{ padding: '14px 18px', borderBottom: '1px solid var(--se-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{t('Upcoming maintenance', 'งานบำรุงรักษาที่กำลังจะถึง')}</h3>
            <Link to="/portal/pm" className="card-link" style={{ fontSize: 13, color: 'var(--se-primary)', textDecoration: 'none' }}>
              {t('Full schedule', 'ดูแผนทั้งหมด')}
            </Link>
          </div>
          <div style={{ padding: '24px 18px' }}>
            <p className="muted" style={{ margin: 0, fontSize: 13.5 }}>
              {t('No upcoming visits scheduled.', 'ยังไม่มีนัดหมายที่กำลังจะถึง')}
            </p>
          </div>
        </div>
      </div>

      <QRScannerMock
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        onResult={(assetId) => {
          setScanOpen(false);
          navigate(`/portal/equipment/${assetId}`);
        }}
      />
    </div>
  );
}
