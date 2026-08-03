import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { LayoutGrid, Package, Plus, QrCode, Rows3, Wifi, WifiOff } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { useCompany } from '@/contexts/CompanyContext';
import { EmptyState, ExportButton, QRScannerMock, SearchBox, StatusBadge } from '@/components/common';
import { assetsFor } from '@/data/mockAssets';
import { siteName } from '@/data/mockCompanies';
import { fmtDate } from '@/utils/format';
import { OPERATING_STATUS, WARRANTY_STATUS } from '@/utils/status';
import type { WarrantyStatus } from '@/types';

export function EquipmentPage() {
  const { lang, t } = useLang();
  const { customerCode } = useCompany();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const [q, setQ] = useState('');
  const [site, setSite] = useState(() => params.get('site') ?? '');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [status, setStatus] = useState('');
  const [connected, setConnected] = useState('');
  const [year, setYear] = useState('');
  const [sort, setSort] = useState('name');
  const [view, setView] = useState<'cards' | 'table'>('cards');
  const [scanOpen, setScanOpen] = useState(false);

  const warranty = (params.get('warranty') ?? '') as WarrantyStatus | '';
  const setWarranty = (w: string) => {
    const next = new URLSearchParams(params);
    if (w) next.set('warranty', w);
    else next.delete('warranty');
    setParams(next, { replace: true });
  };

  const all = useMemo(() => assetsFor(customerCode), [customerCode]);
  const { company } = useCompany();
  const categories = [...new Set(all.map((a) => a.category))].sort();
  const brands = [...new Set(all.map((a) => a.brand))].sort();
  const years = [...new Set(all.map((a) => a.installYear))].sort((a, b) => b - a);

  const filtered = useMemo(() => {
    const list = all.filter((a) => {
      if (q) {
        const hay = `${a.name} ${a.id} ${a.model} ${a.serial} ${a.customerRef} ${a.brand}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      if (site && a.siteId !== site) return false;
      if (category && a.category !== category) return false;
      if (brand && a.brand !== brand) return false;
      if (warranty && a.warranty !== warranty) return false;
      if (status && a.status !== status) return false;
      if (connected === 'yes' && !a.connected) return false;
      if (connected === 'no' && a.connected) return false;
      if (year && String(a.installYear) !== year) return false;
      return true;
    });
    return list.sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'newest') return b.installYear - a.installYear;
      if (sort === 'oldest') return a.installYear - b.installYear;
      if (sort === 'warranty') return a.warrantyEnd.localeCompare(b.warrantyEnd);
      return 0;
    });
  }, [all, q, site, category, brand, warranty, status, connected, year, sort]);

  const clearAll = () => {
    setQ(''); setSite(''); setCategory(''); setBrand(''); setStatus(''); setConnected(''); setYear('');
    setWarranty('');
  };

  const hasFilters = q || site || category || brand || warranty || status || connected || year;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('My Equipment', 'อุปกรณ์ของฉัน')}</h1>
          <p className="page-sub">
            {t(`${all.length} registered assets across ${company.sites.length} sites.`, `อุปกรณ์ที่ลงทะเบียน ${all.length} รายการใน ${company.sites.length} ไซต์งาน`)}
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline" onClick={() => setScanOpen(true)}>
            <QrCode size={16} aria-hidden />
            {t('Scan QR', 'สแกน QR')}
          </button>
          <ExportButton label={t('Export list', 'ส่งออกรายการ')} />
        </div>
      </div>

      {/* Warranty quick chips */}
      <div className="chip-row" style={{ marginBottom: 12 }}>
        <button className={`chip ${warranty === '' ? 'active' : ''}`} onClick={() => setWarranty('')} aria-pressed={warranty === ''}>
          {t('All warranty states', 'ทุกสถานะประกัน')}
        </button>
        {(['active', 'expiring', 'expired'] as const).map((w) => {
          const meta = WARRANTY_STATUS[w];
          const count = all.filter((a) => a.warranty === w).length;
          return (
            <button key={w} className={`chip ${warranty === w ? 'active' : ''}`} onClick={() => setWarranty(w)} aria-pressed={warranty === w}>
              {lang === 'th' ? meta.th : meta.en} ({count})
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: 14, marginBottom: 16 }}>
        <div className="filter-grid">
          <SearchBox value={q} onChange={setQ} placeholder={t('Search name, model, serial, tag…', 'ค้นหาชื่อ รุ่น ซีเรียล แท็ก…')} />
          <select value={site} onChange={(e) => setSite(e.target.value)} aria-label={t('Filter by site', 'กรองตามไซต์')}>
            <option value="">{t('All sites', 'ทุกไซต์')}</option>
            {company.sites.map((s) => (
              <option key={s.id} value={s.id}>{lang === 'th' ? s.nameTh : s.name}</option>
            ))}
          </select>
          <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label={t('Filter by category', 'กรองตามหมวด')}>
            <option value="">{t('All categories', 'ทุกหมวด')}</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={brand} onChange={(e) => setBrand(e.target.value)} aria-label={t('Filter by brand', 'กรองตามแบรนด์')}>
            <option value="">{t('All brands', 'ทุกแบรนด์')}</option>
            {brands.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label={t('Filter by operating status', 'กรองตามสถานะ')}>
            <option value="">{t('All operating states', 'ทุกสถานะการทำงาน')}</option>
            {Object.entries(OPERATING_STATUS).map(([k, v]) => (
              <option key={k} value={k}>{lang === 'th' ? v.th : v.en}</option>
            ))}
          </select>
          <select value={connected} onChange={(e) => setConnected(e.target.value)} aria-label={t('Filter by monitoring', 'กรองตามการเชื่อมต่อ')}>
            <option value="">{t('Connected & not connected', 'เชื่อมต่อและไม่เชื่อมต่อ')}</option>
            <option value="yes">{t('Connected (IoT)', 'เชื่อมต่อ (IoT)')}</option>
            <option value="no">{t('Not connected', 'ไม่เชื่อมต่อ')}</option>
          </select>
          <select value={year} onChange={(e) => setYear(e.target.value)} aria-label={t('Filter by install year', 'กรองตามปีติดตั้ง')}>
            <option value="">{t('All install years', 'ทุกปีติดตั้ง')}</option>
            {years.map((y) => <option key={y} value={String(y)}>{y}</option>)}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label={t('Sort', 'จัดเรียง')}>
            <option value="name">{t('Sort: name A–Z', 'เรียง: ชื่อ ก–ฮ')}</option>
            <option value="newest">{t('Sort: newest install', 'เรียง: ติดตั้งใหม่สุด')}</option>
            <option value="oldest">{t('Sort: oldest install', 'เรียง: ติดตั้งเก่าสุด')}</option>
            <option value="warranty">{t('Sort: warranty end', 'เรียง: วันหมดประกัน')}</option>
          </select>
        </div>
        <div className="between" style={{ marginTop: 10 }}>
          <span className="muted small">
            {t(`${filtered.length} of ${all.length} assets shown`, `แสดง ${filtered.length} จาก ${all.length} รายการ`)}
            {hasFilters && (
              <button className="btn btn-ghost btn-sm" onClick={clearAll} style={{ marginLeft: 8 }}>
                {t('Clear filters', 'ล้างตัวกรอง')}
              </button>
            )}
          </span>
          <div className="seg" role="group" aria-label={t('View mode', 'รูปแบบการแสดงผล')}>
            <button className={view === 'cards' ? 'active' : ''} onClick={() => setView('cards')} aria-pressed={view === 'cards'} aria-label={t('Card view', 'มุมมองการ์ด')}>
              <LayoutGrid size={15} aria-hidden />
            </button>
            <button className={view === 'table' ? 'active' : ''} onClick={() => setView('table')} aria-pressed={view === 'table'} aria-label={t('Table view', 'มุมมองตาราง')}>
              <Rows3 size={15} aria-hidden />
            </button>
          </div>
        </div>
      </div>

      {filtered.length === 0 && (
        <EmptyState
          icon={<Package size={24} />}
          title={t('No equipment matches these filters', 'ไม่พบอุปกรณ์ตามตัวกรองนี้')}
          body={t('Try removing a filter, or ask SE to register additional assets to your account.', 'ลองลดตัวกรอง หรือแจ้ง SE เพื่อลงทะเบียนอุปกรณ์เพิ่มเติม')}
          action={<button className="btn btn-primary btn-sm" onClick={clearAll}>{t('Clear all filters', 'ล้างตัวกรองทั้งหมด')}</button>}
        />
      )}

      {view === 'cards' && (
        <div className="grid-3">
          {filtered.map((a) => {
            const op = OPERATING_STATUS[a.status];
            const wa = WARRANTY_STATUS[a.warranty];
            return (
              <div key={a.id} className="card asset-card">
                <Link to={`/portal/equipment/${a.id}`} className="asset-thumb light" aria-hidden tabIndex={-1}>
                  <Package size={40} strokeWidth={1.2} />
                </Link>
                <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                  <div>
                    <Link to={`/portal/equipment/${a.id}`} className="fw-600" style={{ color: 'inherit' }}>{a.name}</Link>
                    <div className="muted small">{a.id} · {a.brand} {a.model}</div>
                    <div className="muted small">{siteName(customerCode, a.siteId, lang)} · {a.location}</div>
                  </div>
                  <div className="flex" style={{ gap: 6, flexWrap: 'wrap' }}>
                    <StatusBadge label={lang === 'th' ? op.th : op.en} tone={op.tone} />
                    <StatusBadge label={lang === 'th' ? wa.th : wa.en} tone={wa.tone} />
                    <span className={`badge ${a.connected ? 't-blue' : 't-grey'}`}>
                      {a.connected ? <Wifi size={12} aria-hidden /> : <WifiOff size={12} aria-hidden />}
                      {a.connected ? t('Connected', 'เชื่อมต่อ') : t('Not connected', 'ไม่เชื่อมต่อ')}
                    </span>
                  </div>
                  {a.warranty !== 'none' && (
                    <div className="muted small">{t('Warranty until', 'ประกันถึง')} {fmtDate(a.warrantyEnd, lang)}</div>
                  )}
                  <div className="flex" style={{ gap: 8, marginTop: 'auto' }}>
                    <Link to={`/portal/equipment/${a.id}`} className="btn btn-outline btn-sm" style={{ flex: 1 }}>
                      {t('View details', 'ดูรายละเอียด')}
                    </Link>
                    <Link to={`/portal/requests/new?asset=${a.id}`} className="btn btn-soft btn-sm" style={{ flex: 1 }}>
                      <Plus size={14} aria-hidden />
                      {t('Report problem', 'แจ้งปัญหา')}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view === 'table' && filtered.length > 0 && (
        <div className="card table-to-cards" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="se-table">
              <thead>
                <tr>
                  <th>{t('Asset', 'อุปกรณ์')}</th>
                  <th>{t('Site', 'ไซต์')}</th>
                  <th>{t('Category', 'หมวด')}</th>
                  <th>{t('Status', 'สถานะ')}</th>
                  <th>{t('Warranty', 'การรับประกัน')}</th>
                  <th>{t('Next PM', 'PM ถัดไป')}</th>
                  <th aria-label={t('Actions', 'การทำงาน')} />
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => {
                  const op = OPERATING_STATUS[a.status];
                  const wa = WARRANTY_STATUS[a.warranty];
                  return (
                    <tr key={a.id} className="row-link" onClick={() => navigate(`/portal/equipment/${a.id}`)}>
                      <td data-label={t('Asset', 'อุปกรณ์')}>
                        <div className="fw-600">{a.name}</div>
                        <div className="muted small">{a.id} · {a.brand} {a.model}</div>
                      </td>
                      <td data-label={t('Site', 'ไซต์')}>{siteName(customerCode, a.siteId, lang)}</td>
                      <td data-label={t('Category', 'หมวด')}>{a.category}</td>
                      <td data-label={t('Status', 'สถานะ')}><StatusBadge label={lang === 'th' ? op.th : op.en} tone={op.tone} /></td>
                      <td data-label={t('Warranty', 'การรับประกัน')}>
                        <StatusBadge label={lang === 'th' ? wa.th : wa.en} tone={wa.tone} />
                        {a.warranty !== 'none' && <div className="muted small">{fmtDate(a.warrantyEnd, lang)}</div>}
                      </td>
                      <td data-label={t('Next PM', 'PM ถัดไป')}>{a.nextPM ? fmtDate(a.nextPM, lang) : '—'}</td>
                      <td data-label={t('Actions', 'การทำงาน')}>
                        <Link to={`/portal/requests/new?asset=${a.id}`} className="btn btn-soft btn-sm" onClick={(e) => e.stopPropagation()}>
                          {t('Report', 'แจ้งปัญหา')}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
