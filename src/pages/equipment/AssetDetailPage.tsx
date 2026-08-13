import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  Camera,
  Download,
  FileText,
  Gauge,
  MapPin,
  Package,
  Plus,
  QrCode,
  ShieldCheck,
  Wifi,
  WifiOff,
  Zap,
} from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/contexts/ToastContext';
import { EmptyState, StatusBadge } from '@/components/common';
import { ServiceReportModal } from '@/components/service/ServiceReportModal';
import { getAsset } from '@/data/mockAssets';
import { siteName } from '@/data/mockCompanies';
import { getContract } from '@/data/mockContracts';
import { getReport } from '@/data/mockHistory';
import { fmtDate, num } from '@/utils/format';
import { OPERATING_STATUS, REQUEST_STATUS, WARRANTY_STATUS } from '@/utils/status';
import type { ServiceRecord } from '@/types';

type TabKey = 'overview' | 'timeline' | 'documents' | 'requests' | 'iot';

const EVENT_LABEL: Record<string, { en: string; th: string }> = {
  sale: { en: 'Sale', th: 'การขาย' },
  delivery: { en: 'Delivery', th: 'การส่งมอบ' },
  installation: { en: 'Installation', th: 'การติดตั้ง' },
  commissioning: { en: 'Commissioning', th: 'การทดสอบเดินเครื่อง' },
  pm: { en: 'Preventive maintenance', th: 'บำรุงรักษาเชิงป้องกัน' },
  cm: { en: 'Corrective maintenance', th: 'งานซ่อมแก้ไข' },
  inspection: { en: 'Inspection', th: 'การตรวจสอบ' },
  parts: { en: 'Parts replacement', th: 'เปลี่ยนอะไหล่' },
  condition: { en: 'Condition update', th: 'อัปเดตสภาพ' },
};

export function AssetDetailPage() {
  const { assetId } = useParams();
  const { lang, t } = useLang();
  const { customerCode } = useCompany();
  const { requests } = useData();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabKey>('overview');
  const [openReport, setOpenReport] = useState<ServiceRecord | null>(null);

  const asset = assetId ? getAsset(assetId) : undefined;

  const related = useMemo(
    () => requests.filter((r) => r.assetId === assetId),
    [requests, assetId],
  );

  if (!asset) {
    return (
      <EmptyState
        icon={<Package size={24} />}
        title={t('Equipment not found', 'ไม่พบอุปกรณ์')}
        body={t('This asset may belong to another company profile, or the link is out of date.', 'อุปกรณ์นี้อาจอยู่ในบริษัทอื่น หรือลิงก์อาจไม่ถูกต้อง')}
        action={<Link to="/portal/equipment" className="btn btn-primary btn-sm">{t('Back to equipment', 'กลับไปหน้าอุปกรณ์')}</Link>}
      />
    );
  }

  const op = OPERATING_STATUS[asset.status];
  const wa = WARRANTY_STATUS[asset.warranty];
  const contract = asset.contractId ? getContract(asset.contractId) : undefined;
  const activeAlarms = asset.iot?.alarms.filter((a) => a.active) ?? [];

  const TABS: { key: TabKey; en: string; th: string }[] = [
    { key: 'overview', en: 'Overview', th: 'ภาพรวม' },
    { key: 'timeline', en: 'Service timeline', th: 'ไทม์ไลน์การบริการ' },
    { key: 'documents', en: 'Documents', th: 'เอกสาร' },
    { key: 'requests', en: 'Related requests', th: 'คำขอที่เกี่ยวข้อง' },
    { key: 'iot', en: 'Energy & IoT', th: 'พลังงานและ IoT' },
  ];

  return (
    <div>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/portal/equipment')} style={{ marginBottom: 12, marginLeft: -8 }}>
        <ArrowLeft size={16} aria-hidden />
        {t('All equipment', 'อุปกรณ์ทั้งหมด')}
      </button>

      {/* Header card with clean grid and integrated ac-rows grey detail box */}
      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        <div className="asset-head" style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          {asset.image ? (
            <div className="asset-thumb-photo" style={{ width: 140, height: 130, borderRadius: 12, flexShrink: 0, overflow: 'hidden' }} aria-hidden>
              <img src={asset.image} alt={asset.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ) : (
            <div className="asset-thumb light" style={{ width: 140, height: 130, borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--se-background)' }} aria-hidden>
              <Package size={40} strokeWidth={1.2} style={{ color: 'var(--se-text-muted)' }} />
            </div>
          )}

          {/* Core identity info */}
          <div style={{ minWidth: 220, flex: '1 1 240px' }}>
            <h1 className="page-title" style={{ fontSize: 22, fontWeight: 700, margin: '0 0 6px' }}>{asset.name}</h1>
            <div className="muted small" style={{ fontSize: 13, marginBottom: 12, lineHeight: 1.4 }}>
              {asset.id} · {asset.brand} {asset.model} · S/N {asset.serial} {asset.customerRef ? `· ${t('Your tag', 'แท็กของคุณ')}: ${asset.customerRef}` : ''}
            </div>
            <div className="flex" style={{ gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <StatusBadge label={lang === 'th' ? op.th : op.en} tone={op.tone} dot />
              <StatusBadge label={lang === 'th' ? wa.th : wa.en} tone={wa.tone} dot />
              <span className={`badge ${asset.connected ? 't-blue' : 't-grey'}`}>
                {asset.connected ? <Wifi size={12} aria-hidden /> : <WifiOff size={12} aria-hidden />}
                {asset.connected ? t('Monitoring connected', 'เชื่อมต่อมอนิเตอริ่ง') : t('Not connected', 'ไม่เชื่อมต่อ')}
              </span>
              {contract && (
                <Link to={`/portal/contracts/${contract.id}`} className="badge t-brand" style={{ textDecoration: 'none' }}>
                  <FileText size={12} aria-hidden /> {contract.id}
                </Link>
              )}
            </div>
          </div>

          {/* Matched ac-rows grey detail box */}
          <div className="ac-rows" style={{ flex: '1 1 300px', width: 'auto', minWidth: 280, height: 'auto', gap: 8, padding: '12px 14px' }}>
            <div className="ac-row">
              <MapPin size={15} aria-hidden />
              <span className="ac-row-text" style={{ fontSize: 13, fontWeight: 500 }}>
                {siteName(customerCode, asset.siteId, lang) || asset.location ? `${siteName(customerCode, asset.siteId, lang)} · ${asset.location}` : '—'}
              </span>
            </div>
            <div className="ac-row">
              <CalendarDays size={15} aria-hidden />
              <span style={{ fontSize: 13, fontWeight: 500 }}>
                {t('Next PM', 'PM ถัดไป')}: {asset.nextPM ? fmtDate(asset.nextPM, lang) : '—'}
              </span>
            </div>
            <div className="ac-row">
              <ShieldCheck size={15} aria-hidden />
              <span style={{ fontSize: 13, fontWeight: 500 }}>
                {t('Warranty until', 'ประกันถึง')} {asset.warrantyEnd && asset.warranty !== 'none' ? fmtDate(asset.warrantyEnd, lang) : '—'}
              </span>
            </div>
          </div>

          {/* Prominent QR Code Badge & Quick Action */}
          <div className="asset-head-right" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, flexShrink: 0, marginLeft: 'auto' }}>
            <div
              className="qr-card"
              title={t('QR label on this asset', 'ป้าย QR บนอุปกรณ์นี้')}
              style={{
                padding: '10px 14px',
                borderRadius: 12,
                border: '1px solid var(--se-border)',
                background: '#ffffff',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                cursor: 'pointer',
              }}
            >
              <QrCode size={56} strokeWidth={1.3} style={{ color: 'var(--se-text)' }} />
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', color: 'var(--se-text-secondary)' }}>{asset.id}</span>
            </div>

            <Link to={`/portal/requests/new?asset=${asset.id}`} className="btn btn-soft btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
              <Plus size={14} aria-hidden />
              {t('Report', 'แจ้งปัญหา')}
            </Link>
          </div>
        </div>
      </div>

      {activeAlarms.length > 0 && (
        <div className="alert-item a-red" style={{ marginBottom: 16 }} role="alert">
          <AlertTriangle size={17} aria-hidden />
          <span>
            <strong>{t('Active alarm', 'สัญญาณเตือน')}:</strong> {activeAlarms[0]!.message}
          </span>
        </div>
      )}

      <div className="tabs" style={{ marginBottom: 16 }}>
        {TABS.map((tb) => (
          <button key={tb.key} className={`tab ${tab === tb.key ? 'active' : ''}`} onClick={() => setTab(tb.key)}>
            {lang === 'th' ? tb.th : tb.en}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid-2" style={{ alignItems: 'start' }}>
          <div className="card" style={{ padding: 18 }}>
            <h3 style={{ marginTop: 0 }}>{t('Key information', 'ข้อมูลสำคัญ')}</h3>
            <div className="stat-line"><span className="k">{t('Category', 'หมวด')}</span><span className="v">{asset.category}</span></div>
            <div className="stat-line"><span className="k">{t('SE division', 'ฝ่ายที่ดูแล')}</span><span className="v">{asset.division}</span></div>
            <div className="stat-line"><span className="k">{t('Installed', 'ติดตั้งเมื่อ')}</span><span className="v">{fmtDate(asset.installDate, lang)}</span></div>
            <div className="stat-line"><span className="k">{t('Commissioned', 'ทดสอบเดินเครื่อง')}</span><span className="v">{fmtDate(asset.commissionDate, lang)}</span></div>
            <div className="stat-line">
              <span className="k">{t('Warranty', 'การรับประกัน')}</span>
              <span className="v">
                {asset.warranty === 'none'
                  ? t('No active warranty', 'ไม่มีประกันที่มีผล')
                  : `${fmtDate(asset.warrantyStart, lang)} – ${fmtDate(asset.warrantyEnd, lang)}`}
              </span>
            </div>
            <div className="stat-line"><span className="k">{t('Last service', 'บริการล่าสุด')}</span><span className="v">{fmtDate(asset.lastService, lang)}</span></div>
            <div className="stat-line"><span className="k">{t('Last inspection', 'ตรวจสอบล่าสุด')}</span><span className="v">{fmtDate(asset.lastInspection, lang)}</span></div>
            <div className="stat-line"><span className="k">{t('Next PM', 'PM ถัดไป')}</span><span className="v">{asset.nextPM ? fmtDate(asset.nextPM, lang) : t('Not scheduled', 'ยังไม่กำหนด')}</span></div>
            <div className="stat-line"><span className="k">{t('Condition', 'สภาพ')}</span><span className="v">{asset.condition}</span></div>
            <div className="stat-line"><span className="k">{t('Supplied by', 'จัดหาโดย')}</span><span className="v">{asset.supplier}</span></div>
          </div>
          <div className="card" style={{ padding: 18 }}>
            <h3 style={{ marginTop: 0 }}>{t('Technical specifications', 'ข้อมูลทางเทคนิค')}</h3>
            {asset.specs.map((s) => (
              <div key={s.label} className="stat-line"><span className="k">{s.label}</span><span className="v">{s.value}</span></div>
            ))}
          </div>
        </div>
      )}

      {tab === 'timeline' && (
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ marginTop: 0 }}>{t('Lifecycle & service timeline', 'ไทม์ไลน์ตลอดอายุการใช้งาน')}</h3>
          <ul className="timeline">
            {[...asset.events].sort((a, b) => (a.date < b.date ? 1 : -1)).map((ev, i) => {
              const lbl = EVENT_LABEL[ev.type] ?? { en: ev.type, th: ev.type };
              const rec = ev.reportId ? getReport(ev.reportId) : undefined;
              return (
                <li key={i} className="done">
                  <span className="t-dot" aria-hidden />
                  <div className="between" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: 6 }}>
                    <div>
                      <div className="fw-600">{ev.title}</div>
                      <div className="muted small">{fmtDate(ev.date, lang)} · {lang === 'th' ? lbl.th : lbl.en}</div>
                      <div className="small" style={{ marginTop: 3 }}>{ev.detail}</div>
                    </div>
                    {rec && (
                      <button className="btn btn-outline btn-sm" onClick={() => setOpenReport(rec)}>
                        {t('View report', 'ดูรายงาน')} {ev.reportId}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {tab === 'documents' && (
        <div className="card table-to-cards" style={{ overflow: 'hidden' }}>
          <table className="se-table">
            <thead>
              <tr>
                <th>{t('Document', 'เอกสาร')}</th>
                <th>{t('Type', 'ประเภท')}</th>
                <th>{t('Date', 'วันที่')}</th>
                <th>{t('Size', 'ขนาด')}</th>
                <th aria-label={t('Download', 'ดาวน์โหลด')} />
              </tr>
            </thead>
            <tbody>
              {asset.documents.map((d) => (
                <tr key={d.name}>
                  <td data-label={t('Document', 'เอกสาร')} className="fw-600">{d.name}</td>
                  <td data-label={t('Type', 'ประเภท')} style={{ textTransform: 'capitalize' }}>{d.type}</td>
                  <td data-label={t('Date', 'วันที่')}>{fmtDate(d.date, lang)}</td>
                  <td data-label={t('Size', 'ขนาด')}>{d.size}</td>
                  <td data-label={t('Download', 'ดาวน์โหลด')}>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => showToast(t('Download started (demo).', 'เริ่มดาวน์โหลดแล้ว (เดโม)'), 'info')}
                    >
                      <Download size={15} aria-hidden />
                      {t('Download', 'ดาวน์โหลด')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'requests' && (
        <>
          {related.length === 0 ? (
            <EmptyState
              icon={<FileText size={24} />}
              title={t('No requests for this asset yet', 'ยังไม่มีคำขอสำหรับอุปกรณ์นี้')}
              body={t('If something looks wrong with this equipment, report it and SE will take it from there.', 'หากอุปกรณ์นี้มีความผิดปกติ แจ้งปัญหาได้เลย แล้ว SE จะดูแลต่อให้')}
              action={
                <Link to={`/portal/requests/new?asset=${asset.id}`} className="btn btn-primary btn-sm">
                  <Plus size={14} aria-hidden />
                  {t('Report a problem', 'แจ้งปัญหา')}
                </Link>
              }
            />
          ) : (
            <div className="card table-to-cards" style={{ overflow: 'hidden' }}>
              <table className="se-table">
                <thead>
                  <tr>
                    <th>{t('Ticket', 'เลขที่')}</th>
                    <th>{t('Subject', 'เรื่อง')}</th>
                    <th>{t('Created', 'สร้างเมื่อ')}</th>
                    <th>{t('Status', 'สถานะ')}</th>
                  </tr>
                </thead>
                <tbody>
                  {related.map((r) => {
                    const st = REQUEST_STATUS[r.status];
                    return (
                      <tr key={r.ticketNo} className="row-link" onClick={() => navigate(`/portal/requests/${r.ticketNo}`)}>
                        <td data-label={t('Ticket', 'เลขที่')}>
                          <Link to={`/portal/requests/${r.ticketNo}`} onClick={(e) => e.stopPropagation()}>{r.ticketNo}</Link>
                        </td>
                        <td data-label={t('Subject', 'เรื่อง')}>{r.title}</td>
                        <td data-label={t('Created', 'สร้างเมื่อ')}>{fmtDate(r.created, lang)}</td>
                        <td data-label={t('Status', 'สถานะ')}><StatusBadge label={lang === 'th' ? st.th : st.en} tone={st.tone} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === 'iot' && (
        <>
          {!asset.connected || !asset.iot ? (
            <EmptyState
              icon={<Wifi size={24} />}
              title={t('Monitoring is not currently enabled for this equipment', 'อุปกรณ์นี้ยังไม่ได้เปิดใช้งานระบบมอนิเตอริ่ง')}
              body={t(
                'With an SE monitoring gateway, this page would show live status, energy use, runtime and alarms — with alerts to your team the moment something goes abnormal.',
                'หากติดตั้งเกตเวย์มอนิเตอริ่งของ SE หน้านี้จะแสดงสถานะสด การใช้พลังงาน ชั่วโมงทำงาน และสัญญาณเตือน พร้อมแจ้งทีมของคุณทันทีเมื่อพบความผิดปกติ',
              )}
              action={
                <Link
                  to={`/portal/requests/new?asset=${asset.id}&topic=monitoring`}
                  className="btn btn-primary btn-sm"
                >
                  {t('Ask SE about equipment monitoring', 'สอบถาม SE เรื่องระบบมอนิเตอริ่ง')}
                </Link>
              }
            />
          ) : (
            <div style={{ display: 'grid', gap: 16 }}>
              <div className="grid-4">
                <div className="card" style={{ padding: 16 }}>
                  <div className="flex" style={{ gap: 8 }}>
                    <Wifi size={17} className={asset.iot.online ? '' : 'muted'} style={{ color: asset.iot.online ? 'var(--se-success)' : undefined }} aria-hidden />
                    <span className="muted small">{t('Gateway status', 'สถานะเกตเวย์')}</span>
                  </div>
                  <div className="kpi-value" style={{ fontSize: 20 }}>
                    {asset.iot.online ? t('Online', 'ออนไลน์') : t('Offline', 'ออฟไลน์')}
                  </div>
                  <div className="muted small">{t('Last data', 'ข้อมูลล่าสุด')}: {asset.iot.lastComm}</div>
                </div>
                <div className="card" style={{ padding: 16 }}>
                  <div className="flex" style={{ gap: 8 }}>
                    <Activity size={17} aria-hidden className="muted" />
                    <span className="muted small">{t('Runtime hours', 'ชั่วโมงทำงานสะสม')}</span>
                  </div>
                  <div className="kpi-value" style={{ fontSize: 20 }}>{num(asset.iot.runtimeHrs)} h</div>
                </div>
                <div className="card" style={{ padding: 16 }}>
                  <div className="flex" style={{ gap: 8 }}>
                    <Gauge size={17} aria-hidden className="muted" />
                    <span className="muted small">{t('Power now', 'กำลังไฟฟ้าปัจจุบัน')}</span>
                  </div>
                  <div className="kpi-value" style={{ fontSize: 20 }}>{asset.iot.powerKw} kW</div>
                </div>
                <div className="card" style={{ padding: 16 }}>
                  <div className="flex" style={{ gap: 8 }}>
                    <Zap size={17} aria-hidden className="muted" />
                    <span className="muted small">{t('Energy this month', 'พลังงานเดือนนี้')}</span>
                  </div>
                  <div className="kpi-value" style={{ fontSize: 20 }}>{num(asset.iot.energyMonthKwh)} kWh</div>
                </div>
              </div>

              <div className="card" style={{ padding: 18 }}>
                <h3 style={{ marginTop: 0 }}>{t('Alarms & events', 'สัญญาณเตือนและเหตุการณ์')}</h3>
                {asset.iot.alarms.length === 0 && <p className="muted">{t('No alarms recorded in the last 90 days.', 'ไม่มีสัญญาณเตือนใน 90 วันที่ผ่านมา')}</p>}
                {asset.iot.alarms.map((al, i) => (
                  <div key={i} className={`alert-item ${al.severity === 'critical' ? 'a-red' : al.severity === 'warning' ? 'a-amber' : 'a-blue'}`} style={{ marginBottom: 8 }}>
                    <AlertTriangle size={16} aria-hidden />
                    <span>
                      <strong>{al.time}</strong> — {al.message}{' '}
                      {al.active
                        ? <StatusBadge label={t('Active', 'ยังมีผล')} tone="red" />
                        : <StatusBadge label={t('Cleared', 'เคลียร์แล้ว')} tone="grey" />}
                    </span>
                  </div>
                ))}
                <p className="muted small" style={{ marginBottom: 0 }}>
                  {t('Alert routing follows your notification preferences.', 'การส่งการแจ้งเตือนเป็นไปตามการตั้งค่าของคุณ')}{' '}
                  <Link to="/portal/profile/notifications">{t('Manage notification settings', 'จัดการการตั้งค่าแจ้งเตือน')}</Link>
                </p>
              </div>
            </div>
          )}
        </>
      )}

      <ServiceReportModal record={openReport} open={openReport !== null} onClose={() => setOpenReport(null)} />
    </div>
  );
}
