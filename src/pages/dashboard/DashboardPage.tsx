import { useEffect, useMemo, useRef, useState } from 'react';
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
import { useData } from '@/contexts/DataContext';
import { ContactSECard, KpiCard, QRScannerMock, StatusBadge } from '@/components/common';
import { newsDisplayDate } from '@/pages/news/NewsPage';
import { assetsFor } from '@/data/mockAssets';
import { siteName } from '@/data/mockCompanies';
import { contractsFor } from '@/data/mockContracts';
import { fmtDate, fmtDateLong, daysUntil, greeting, companyDisplayName } from '@/utils/format';
import { WARRANTY_STATUS, TICKET_PRIORITY, TICKET_STATUS } from '@/utils/status';
import {
  apiGetDashboardMaintenance,
  apiGetDashboardSummary,
  apiGetDashboardTickets,
  apiGetNewsFeed,
  apiGetSEContacts,
  type DashboardMaintenanceItemResponse,
  type DashboardSummaryResponse,
  type DashboardTicketResponse,
  type NewsFeedItemResponse,
  type SEContactResponse,
} from '@/lib/apiClient';
import { tokenStore } from '@/lib/tokenStore';

const WARRANTY_COLORS: Record<string, string> = {
  active: 'var(--se-success)',
  expiring: 'var(--se-warning)',
  expired: 'var(--se-danger)',
  none: '#b0b9c4',
};

export function DashboardPage() {
  const { lang, t } = useLang();
  const { customerCode, company } = useCompany();
  const { signoffs } = useData();
  const navigate = useNavigate();
  const [scanOpen, setScanOpen] = useState(false);
  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null);
  const [tickets, setTickets] = useState<DashboardTicketResponse[] | null>(null);
  const [maintenance, setMaintenance] = useState<DashboardMaintenanceItemResponse[] | null>(null);
  const [seContacts, setSeContacts] = useState<SEContactResponse[] | null>(null);
  const [newsFeed, setNewsFeed] = useState<NewsFeedItemResponse[] | null>(null);
  const [confirmedPm, setConfirmedPm] = useState<Set<string>>(new Set());

  // "Your SE team" follows Warranty overview's rendered height — Warranty is
  // the reference card, SE team never grows past it and scrolls internally
  // for any contacts beyond that.
  const warrantyCardRef = useRef<HTMLDivElement>(null);
  const [warrantyHeight, setWarrantyHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    const el = warrantyCardRef.current;
    if (!el) return;
    // offsetHeight (border-box) so it matches the SE-team card's own
    // border-box exactly — contentRect would be 2px short (the 1px border).
    const ro = new ResizeObserver(([entry]) => setWarrantyHeight((entry.target as HTMLElement).offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // "Upcoming maintenance" follows Latest service requests' rendered height —
  // same pattern as SE team/Warranty above. Requests is the reference card;
  // maintenance never grows past it and scrolls internally instead.
  const requestsCardRef = useRef<HTMLDivElement>(null);
  const [requestsHeight, setRequestsHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    const el = requestsCardRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setRequestsHeight((entry.target as HTMLElement).offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const accessToken = tokenStore.read()?.accessToken;
    if (!accessToken) return;
    apiGetDashboardSummary(accessToken).then(setSummary).catch(() => {});
  }, []);

  useEffect(() => {
    const accessToken = tokenStore.read()?.accessToken;
    if (!accessToken) return;
    apiGetDashboardTickets(accessToken).then(setTickets).catch(() => {});
  }, []);

  useEffect(() => {
    const accessToken = tokenStore.read()?.accessToken;
    if (!accessToken) return;
    apiGetDashboardMaintenance(accessToken).then(setMaintenance).catch(() => {});
  }, []);

  useEffect(() => {
    const accessToken = tokenStore.read()?.accessToken;
    if (!accessToken) return;
    apiGetSEContacts(accessToken).then(setSeContacts).catch(() => {});
  }, []);

  useEffect(() => {
    const accessToken = tokenStore.read()?.accessToken;
    if (!accessToken) return;
    apiGetNewsFeed(accessToken).then(setNewsFeed).catch(() => {});
  }, []);

  const assets = useMemo(() => assetsFor(customerCode), [customerCode]);
  const pendingSignoffs = signoffs.filter((s) => s.customerCode === customerCode && s.status === 'pending');
  const contracts = contractsFor(customerCode);
  const expiringContracts = contracts.filter((c) => c.status === 'expiring');

  const wCounts = {
    active: summary?.unitsInWarranty ?? 0,
    expiring: summary?.unitsWarrantyExpiringSoon ?? 0,
    expired: summary?.unitsWarrantyExpired ?? 0,
    none: summary?.unitsNoWarranty ?? 0,
  };
  const donutData = [
    { key: 'active', name: lang === 'th' ? WARRANTY_STATUS.active.th : WARRANTY_STATUS.active.en, value: wCounts.active },
    { key: 'expiring', name: lang === 'th' ? WARRANTY_STATUS.expiring.th : WARRANTY_STATUS.expiring.en, value: wCounts.expiring },
    { key: 'expired', name: lang === 'th' ? WARRANTY_STATUS.expired.th : WARRANTY_STATUS.expired.en, value: wCounts.expired },
    { key: 'none', name: t('No warranty', 'ไม่มีประกัน'), value: wCounts.none },
  ];

  const alarmedAssets = assets.filter((a) => a.iot?.alarms.some((al) => al.active && al.severity === 'critical'));
  const news = (newsFeed ?? []).slice(0, 3);

  const quickActions = [
    { to: '/portal/requests/new', icon: Plus, en: 'Report a problem', th: 'แจ้งปัญหา', tone: 'brand' },
    { to: '/portal/equipment', icon: Package, en: 'Browse equipment', th: 'ดูอุปกรณ์', tone: '' },
    { to: '/portal/map', icon: MapPin, en: 'My Sites — Map', th: 'ไซต์ของฉัน — แผนที่', tone: '' },
    // { to: '/portal/iot', icon: Wifi, en: 'Live Monitoring', th: 'มอนิเตอริ่งแบบเรียลไทม์', tone: '' },
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
            {greeting(lang)}
          </h1>
          <p className="page-sub">
            {companyDisplayName(summary?.preName, summary?.customerName, lang === 'th' ? company.nameTh : company.name)} · {summary?.customerCode ?? company.customerCode} · {fmtDateLong(new Date().toISOString(), lang)}
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
          value={summary?.totalUnits ?? 0}
          label={t('Registered equipment', 'อุปกรณ์ที่ลงทะเบียน')}
          sub={t(`${summary?.totalSites ?? 0} sites`, `${summary?.totalSites ?? 0} ไซต์งาน`)}
          to="/portal/equipment"
        />
        <KpiCard
          icon={<ShieldCheck size={22} />}
          value={summary?.unitsInWarranty ?? 0}
          label={t('Under warranty', 'อยู่ในประกัน')}
          sub={t(`${wCounts.expiring} expiring soon`, `${wCounts.expiring} ใกล้หมดอายุ`)}
          to="/portal/equipment/list?warranty=active"
          tone="green"
        />
        <KpiCard
          icon={<ClipboardList size={22} />}
          value={summary?.assignedTickets ?? 0}
          label={t('Open service requests', 'คำขอบริการที่ค้างอยู่')}
          sub={t(
            `${summary?.criticalTickets ?? 0} urgent`,
            `เร่งด่วน ${summary?.criticalTickets ?? 0}`,
          )}
          to="/portal/requests"
          tone="blue"
        />
        <KpiCard
          icon={<CalendarCheck size={22} />}
          value={summary?.upcomingPmCount ?? 0}
          label={t('Upcoming PM visits', 'งาน PM ที่กำลังจะถึง')}
          sub={summary?.nextPmDue ? fmtDate(summary.nextPmDue, lang) : undefined}
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
        {/* {alarmedAssets.map((a) => (
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
        ))} */}
        {/* {pendingSignoffs.map((s) => (
          <Link key={s.jobNo} to={`/portal/sign-off/${s.jobNo}`} className="alert-item a-blue">
            <FileSignature size={17} aria-hidden />
            <span>
              <strong>{t('Awaiting your approval', 'รอการยืนยันจากคุณ')}:</strong>{' '}
              {t(`service report for job ${s.jobNo} is ready to sign.`, `รายงานบริการงาน ${s.jobNo} พร้อมให้ยืนยัน`)}
            </span>
            <ArrowRight size={15} aria-hidden style={{ marginLeft: 'auto', flex: '0 0 auto' }} />
          </Link>
        ))} */}
        {/* {expiringContracts.map((c) => (
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
        ))} */}
        {wCounts.expiring > 0 && (
          <Link to="/portal/equipment/list?warranty=expiring" className="alert-item a-amber">
            <ShieldCheck size={17} aria-hidden />
            <span>
              <strong>{t('Warranty', 'การรับประกัน')}:</strong>{' '}
              {t(`${wCounts.expiring} assets leave warranty within 60 days.`, `อุปกรณ์ ${wCounts.expiring} รายการจะหมดประกันภายใน 60 วัน`)}
            </span>
            <ArrowRight size={15} aria-hidden style={{ marginLeft: 'auto', flex: '0 0 auto' }} />
          </Link>
        )}
      </div>

      <div className="grid-2" style={{ alignItems: 'start', marginBottom: 16 }}>
        {/* D. Warranty donut — the reference card. "Your SE team" reads this
            card's rendered height via ResizeObserver (warrantyHeight) and
            matches it exactly, scrolling its own contact list internally
            instead of growing taller when there are many contacts. */}
        <div className="card" ref={warrantyCardRef}>
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
                `${wCounts.active} of ${wCounts.active + wCounts.expired + wCounts.none} assets are covered; ${wCounts.expiring} need attention within 60 days.`,
                `${wCounts.active} จาก ${wCounts.active + wCounts.expired + wCounts.none} รายการยังอยู่ในประกัน โดย ${wCounts.expiring} รายการต้องพิจารณาภายใน 60 วัน`,
              )}
            </p>
          </div>
        </div>

        {/* J. SE contacts */}
        <div
          className="card"
          style={{ display: 'flex', flexDirection: 'column', minHeight: 0, height: warrantyHeight }}
        >
          <div className="card-header">
            <h3 style={{ margin: 0 }}>{t('Your SE team', 'ทีม SE ของคุณ')}</h3>
          </div>
          <div style={{ padding: 14, display: 'grid', gap: 10, flex: 1, minHeight: 0, overflowY: 'auto' }}>
            {seContacts && seContacts.length === 0 ? (
              <p className="muted small" style={{ margin: 0 }}>
                {t('No SE contacts yet.', 'ยังไม่มีข้อมูลผู้ติดต่อ SE')}
              </p>
            ) : (
              (seContacts ?? []).map((c) => (
                <ContactSECard
                  key={c.id}
                  name={c.salePerson
                    ? `${(lang === 'th' ? c.salePerson.nameTh : c.salePerson.nameEn) ?? ''} ${(lang === 'th' ? c.salePerson.lastNameTh : c.salePerson.lastNameEn) ?? ''}`.trim()
                    : t('Unknown contact', 'ไม่ทราบชื่อผู้ติดต่อ')}
                  position={(lang === 'th' ? c.salePerson?.positionTh : c.salePerson?.positionEn) ?? ''}
                  phone={c.salePerson?.phone ?? ''}
                  email={c.salePerson?.email ?? ''}
                  processes={c.processes.map((p) => (lang === 'th' ? p.labelTh : p.labelEn))}
                  style={{ border: 'none', padding: 4 }}
                />
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: 'start', marginBottom: 16 }}>
        {/* F. Latest requests — reference card that Upcoming maintenance's
            height follows via ResizeObserver (requestsHeight). */}
        <div className="card" ref={requestsCardRef}>
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
                {(tickets ?? []).map((tk) => {
                  const pr = TICKET_PRIORITY[tk.priority];
                  const st = TICKET_STATUS[tk.status];
                  return (
                    <tr key={tk.ticket_no} className="row-link" onClick={() => navigate(`/portal/requests/${tk.ticket_no}`)}>
                      <td data-label={t('Ticket', 'เลขที่')}>
                        <Link to={`/portal/requests/${tk.ticket_no}`} onClick={(e) => e.stopPropagation()}>{tk.ticket_no}</Link>
                      </td>
                      <td data-label={t('Subject', 'เรื่อง')}>{tk.description}</td>
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

        {/* G. Upcoming PM — matches Latest service requests' rendered height
            via ResizeObserver (requestsHeight) and scrolls its own list
            internally instead of growing taller when there are many items. */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: 0, height: requestsHeight }}>
          <div className="card-header">
            <h3 style={{ margin: 0 }}>{t('Upcoming maintenance', 'งานบำรุงรักษาที่กำลังจะถึง')}</h3>
            <Link to="/portal/pm" className="card-link">{t('Full schedule', 'ดูแผนทั้งหมด')}</Link>
          </div>
          <div style={{ padding: '6px 18px 14px', flex: 1, minHeight: 0, overflowY: 'auto' }}>
            {(maintenance ?? []).map((v) => {
              const isConfirmed = confirmedPm.has(v.pmId);
              return (
                <div key={v.pmId} style={{ padding: '12px 0', borderBottom: '1px dashed var(--se-border)' }}>
                  <div className="between" style={{ alignItems: 'flex-start' }}>
                    <div>
                      <div className="fw-600">{fmtDate(v.nextDue, lang)}</div>
                      <div className="muted small">
                        {t('Site TBD', 'ไซต์ยังไม่ระบุ')} · {v.totalUnits} {t('asset(s)', 'อุปกรณ์')}
                      </div>
                      <div className="small" style={{ marginTop: 4 }}>{v.description}</div>
                    </div>
                    {isConfirmed && <StatusBadge label={t('Confirmed', 'ยืนยันแล้ว')} tone="green" />}
                  </div>
                  {/* {!isConfirmed && (
                    <div className="flex" style={{ gap: 8, marginTop: 8 }}>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => setConfirmedPm((prev) => new Set(prev).add(v.pmId))}
                      >
                        {t('Confirm', 'ยืนยันนัด')}
                      </button>
                      <Link to="/portal/pm" className="btn btn-outline btn-sm">
                        {t('Reschedule', 'ขอเลื่อนนัด')}
                      </Link>
                    </div>
                  )} */}
                </div>
              );
            })}
            {(maintenance ?? []).length === 0 && <p className="muted">{t('No upcoming visits scheduled.', 'ยังไม่มีนัดหมายที่กำลังจะถึง')}</p>}
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
                <span className="muted small">
                  {fmtDate(newsDisplayDate(n), lang)}
                </span>
              </div>
              <div className="fw-600">{lang === 'th' ? n.titleTh : n.titleEn}</div>
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
