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
  MapPin,
  Newspaper,
  Package,
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
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {greeting(lang)}, {user?.name.split(' ')[0]}
          </h1>
          <p className="page-sub">
            {lang === 'th' ? company.nameTh : company.name} · {company.customerCode} · {fmtDateLong('2026-07-14', lang)}
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline" onClick={() => setScanOpen(true)}>
            <QrCode size={17} aria-hidden />
            {t('Scan QR', 'สแกน QR')}
          </button>
          <Link to="/portal/requests/new" className="btn btn-primary">
            <Plus size={17} aria-hidden />
            {t('Report a problem', 'แจ้งปัญหา')}
          </Link>
        </div>
      </div>

      {/* B. KPI cards */}
      <div className="grid-4" style={{ marginBottom: 16 }}>
        <KpiCard
          icon={<Package size={22} />}
          value={assets.length}
          label={t('Registered equipment', 'อุปกรณ์ที่ลงทะเบียน')}
          sub={t(`${company.sites.length} sites`, `${company.sites.length} ไซต์งาน`)}
          to="/portal/equipment"
        />
        <KpiCard
          icon={<ShieldCheck size={22} />}
          value={wCounts.active + wCounts.expiring}
          label={t('Under warranty', 'อยู่ในประกัน')}
          sub={wCounts.expiring > 0 ? t(`${wCounts.expiring} expiring soon`, `${wCounts.expiring} ใกล้หมดอายุ`) : undefined}
          to="/portal/equipment?warranty=active"
          tone="green"
        />
        <KpiCard
          icon={<ClipboardList size={22} />}
          value={openRequests.length}
          label={t('Open service requests', 'คำขอบริการที่ค้างอยู่')}
          sub={t(
            `${openRequests.filter((r) => r.priority === 'urgent').length} urgent`,
            `เร่งด่วน ${openRequests.filter((r) => r.priority === 'urgent').length}`,
          )}
          to="/portal/requests"
          tone="blue"
        />
        <KpiCard
          icon={<CalendarCheck size={22} />}
          value={upcomingPM.length}
          label={t('Upcoming PM visits', 'งาน PM ที่กำลังจะถึง')}
          sub={upcomingPM[0] ? fmtDate(upcomingPM[0].date, lang) : undefined}
          to="/portal/pm"
          tone="amber"
        />
      </div>

      <div className="dash-cols">
        <aside className="dash-rail card" aria-label={t('Quick actions', 'ทางลัด')}>
          <div className="card-header"><h3 style={{ margin: 0 }}>{t('Quick actions', 'ทางลัด')}</h3></div>
          <div className="dash-rail-list">
            {quickActions.map((q) => {
              const Icon = q.icon;
              return (
                <Link key={q.to + q.en} to={q.to} className={`dash-rail-item ${q.tone === 'brand' ? 'brand' : ''}`}>
                  <Icon size={17} aria-hidden />
                  <span>{t(q.en, q.th)}</span>
                </Link>
              );
            })}
          </div>
        </aside>
        <div className="dash-main">
      {/* C. Alert strip */}
      <div style={{ display: 'grid', gap: 8, marginBottom: 18 }}>
        {alarmedAssets.map((a) => (
          <Link key={a.id} to={`/portal/equipment/${a.id}`} className="alert-item a-red">
            <AlertTriangle size={17} aria-hidden />
            <span>
              <strong>{t('Active alarm', 'สัญญาณเตือน')}:</strong>{' '}
              {t(
                `${a.name} at ${siteName(customerCode, a.siteId, lang)} is stopped with a critical alarm.`,
                `${a.name} ที่${siteName(customerCode, a.siteId, 'th')} หยุดทำงานพร้อมสัญญาณเตือนร้ายแรง`,
              )}
            </span>
            <ArrowRight size={15} aria-hidden style={{ marginLeft: 'auto', flex: '0 0 auto' }} />
          </Link>
        ))}
        {pendingSignoffs.map((s) => (
          <Link key={s.jobNo} to={`/portal/sign-off/${s.jobNo}`} className="alert-item a-blue">
            <FileSignature size={17} aria-hidden />
            <span>
              <strong>{t('Awaiting your approval', 'รอการยืนยันจากคุณ')}:</strong>{' '}
              {t(`service report for job ${s.jobNo} is ready to sign.`, `รายงานบริการงาน ${s.jobNo} พร้อมให้ยืนยัน`)}
            </span>
            <ArrowRight size={15} aria-hidden style={{ marginLeft: 'auto', flex: '0 0 auto' }} />
          </Link>
        ))}
        {expiringContracts.map((c) => (
          <Link key={c.id} to={`/portal/contracts/${c.id}`} className="alert-item a-amber">
            <FileText size={17} aria-hidden />
            <span>
              <strong>{t('Contract expiring', 'สัญญาใกล้หมดอายุ')}:</strong>{' '}
              {t(
                `${c.id} expires in ${daysUntil(c.end)} days (${fmtDate(c.end, lang)}).`,
                `${c.id} จะหมดอายุในอีก ${daysUntil(c.end)} วัน (${fmtDate(c.end, 'th')})`,
              )}
            </span>
            <ArrowRight size={15} aria-hidden style={{ marginLeft: 'auto', flex: '0 0 auto' }} />
          </Link>
        ))}
        {wCounts.expiring > 0 && (
          <Link to="/portal/equipment?warranty=expiring" className="alert-item a-amber">
            <ShieldCheck size={17} aria-hidden />
            <span>
              <strong>{t('Warranty', 'การรับประกัน')}:</strong>{' '}
              {t(`${wCounts.expiring} assets leave warranty within 90 days.`, `อุปกรณ์ ${wCounts.expiring} รายการจะหมดประกันภายใน 90 วัน`)}
            </span>
            <ArrowRight size={15} aria-hidden style={{ marginLeft: 'auto', flex: '0 0 auto' }} />
          </Link>
        )}
      </div>

      <div className="grid-2" style={{ alignItems: 'start', marginBottom: 16 }}>
        {/* D. Warranty donut */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ margin: 0 }}>{t('Warranty overview', 'ภาพรวมการรับประกัน')}</h3>
            <Link to="/portal/equipment" className="card-link">{t('View all', 'ดูทั้งหมด')}</Link>
          </div>
          <div style={{ padding: '10px 18px 16px' }}>
            <div style={{ height: 170 }} aria-hidden>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={donutData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={72} paddingAngle={2}>
                    {donutData.map((d) => (
                      <Cell key={d.key} fill={WARRANTY_COLORS[d.key]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'grid', gap: 6 }}>
              {donutData.map((d) => (
                <div key={d.key} className="flex between small">
                  <span className="flex" style={{ gap: 8 }}>
                    <span className="legend-dot" style={{ background: WARRANTY_COLORS[d.key] }} aria-hidden />
                    {d.name}
                  </span>
                  <strong>{d.value}</strong>
                </div>
              ))}
            </div>
            <p className="muted small" style={{ marginBottom: 0 }}>
              {t(
                `${wCounts.active + wCounts.expiring} of ${assets.length} assets are covered; ${wCounts.expiring} need attention within 90 days.`,
                `${wCounts.active + wCounts.expiring} จาก ${assets.length} รายการยังอยู่ในประกัน โดย ${wCounts.expiring} รายการต้องพิจารณาภายใน 90 วัน`,
              )}
            </p>
          </div>
        </div>

        {/* J. SE contacts */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ margin: 0 }}>{t('Your SE team', 'ทีม SE ของคุณ')}</h3>
          </div>
          <div style={{ padding: 14, display: 'grid', gap: 10 }}>
            {[
              { p: company.accountManager, role: t('Account Manager', 'ผู้จัดการฝ่ายลูกค้า') },
              { p: company.serviceCoordinator, role: t('Service Coordinator', 'ผู้ประสานงานบริการ') },
            ].map(({ p, role }) => (
              <div key={p.name} className="contact-card" style={{ border: 'none', padding: 4 }}>
                <span className="avatar" aria-hidden>{p.name.split(' ').map((x) => x[0]).slice(0, 2).join('')}</span>
                <div style={{ minWidth: 0 }}>
                  <div className="fw-600">{p.name}</div>
                  <div className="muted small">{role}</div>
                  <div className="contact-links">
                    <a href={`tel:${p.phone.replace(/\s/g, '')}`} className="chip">{p.phone}</a>
                    <a href={`mailto:${p.email}`} className="chip">{t('Email', 'อีเมล')}</a>
                    {p.line && <span className="chip">LINE {p.line}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: 'start', marginBottom: 16 }}>
        {/* F. Latest requests */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ margin: 0 }}>{t('Latest service requests', 'คำขอบริการล่าสุด')}</h3>
            <Link to="/portal/requests" className="card-link">{t('View all', 'ดูทั้งหมด')}</Link>
          </div>
          <div className="table-to-cards" style={{ padding: '0 6px' }}>
            <table className="se-table">
              <thead>
                <tr>
                  <th>{t('Ticket', 'เลขที่')}</th>
                  <th>{t('Subject', 'เรื่อง')}</th>
                  <th>{t('Priority', 'ความเร่งด่วน')}</th>
                  <th>{t('Status', 'สถานะ')}</th>
                </tr>
              </thead>
              <tbody>
                {latestRequests.map((r) => {
                  const st = REQUEST_STATUS[r.status];
                  const pr = PRIORITY[r.priority];
                  return (
                    <tr key={r.ticketNo} className="row-link" onClick={() => navigate(`/portal/requests/${r.ticketNo}`)}>
                      <td data-label={t('Ticket', 'เลขที่')}>
                        <Link to={`/portal/requests/${r.ticketNo}`} onClick={(e) => e.stopPropagation()}>{r.ticketNo}</Link>
                      </td>
                      <td data-label={t('Subject', 'เรื่อง')}>{r.title}</td>
                      <td data-label={t('Priority', 'ความเร่งด่วน')}>
                        <StatusBadge label={lang === 'th' ? pr.th : pr.en} tone={pr.tone} />
                      </td>
                      <td data-label={t('Status', 'สถานะ')}>
                        <StatusBadge label={lang === 'th' ? st.th : st.en} tone={st.tone} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* G. Upcoming PM */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ margin: 0 }}>{t('Upcoming maintenance', 'งานบำรุงรักษาที่กำลังจะถึง')}</h3>
            <Link to="/portal/pm" className="card-link">{t('Full schedule', 'ดูแผนทั้งหมด')}</Link>
          </div>
          <div style={{ padding: '6px 18px 14px' }}>
            {upcomingPM.slice(0, 3).map((v) => (
              <div key={v.id} style={{ padding: '12px 0', borderBottom: '1px dashed var(--se-border)' }}>
                <div className="between" style={{ alignItems: 'flex-start' }}>
                  <div>
                    <div className="fw-600">{fmtDate(v.date, lang)} · {v.time}</div>
                    <div className="muted small">
                      {siteName(customerCode, v.siteId, lang)} · {v.assetIds.length} {t('asset(s)', 'อุปกรณ์')}
                    </div>
                    <div className="small" style={{ marginTop: 4 }}>{v.scope}</div>
                  </div>
                  {v.status === 'confirmed' && <StatusBadge label={t('Confirmed', 'ยืนยันแล้ว')} tone="green" />}
                  {v.status === 'reschedule_requested' && <StatusBadge label={t('Reschedule requested', 'ขอเลื่อนนัด')} tone="amber" />}
                </div>
                {v.status === 'unconfirmed' && (
                  <div className="flex" style={{ gap: 8, marginTop: 8 }}>
                    <button className="btn btn-primary btn-sm" onClick={() => confirmPM(v.id)}>
                      {t('Confirm', 'ยืนยันนัด')}
                    </button>
                    <Link to="/portal/pm" className="btn btn-outline btn-sm">
                      {t('Reschedule', 'ขอเลื่อนนัด')}
                    </Link>
                  </div>
                )}
              </div>
            ))}
            {upcomingPM.length === 0 && <p className="muted">{t('No upcoming visits scheduled.', 'ยังไม่มีนัดหมายที่กำลังจะถึง')}</p>}
          </div>
        </div>
      </div>

      {/* I. News */}
      <div className="card" style={{ marginBottom: 4 }}>
        <div className="card-header">
          <h3 style={{ margin: 0 }}>{t('News & offers from SE', 'ข่าวสารและข้อเสนอจาก SE')}</h3>
          <Link to="/portal/news" className="card-link">{t('All news', 'ข่าวทั้งหมด')}</Link>
        </div>
        <div className="grid-3" style={{ padding: 16 }}>
          {news.map((n) => (
            <Link key={n.id} to={`/portal/news/${n.id}`} className="card" style={{ padding: 14, textDecoration: 'none', color: 'inherit' }}>
              <div className="flex" style={{ gap: 8, marginBottom: 6 }}>
                <Newspaper size={16} className="muted" aria-hidden />
                <span className="muted small">{fmtDate(n.date, lang)} · {n.readMins} {t('min read', 'นาที')}</span>
              </div>
              <div className="fw-600" style={{ marginBottom: 4 }}>{lang === 'th' ? n.titleTh : n.title}</div>
              <div className="muted small" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {n.summary}
              </div>
            </Link>
          ))}
        </div>
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
