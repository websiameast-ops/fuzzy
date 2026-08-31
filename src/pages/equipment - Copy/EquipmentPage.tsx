import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CalendarDays, Camera, Filter, LayoutGrid, MapPin, Package, Plus, QrCode, Rows3, ShieldCheck, SlidersHorizontal, Wifi, WifiOff, X } from 'lucide-react';
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
  const [showAdvanced, setShowAdvanced] = useState(false);

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

  const healthy = all.filter((a) => ['running', 'online', 'operating'].includes(a.status)).length;
  const needsAttention = all.filter((a) => ['maintenance', 'stopped', 'offline'].includes(a.status)).length;
  const connectedCount = all.filter((a) => a.connected).length;
  const warrantyAttention = all.filter((a) => a.warranty === 'expiring' || a.warranty === 'expired').length;

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

  const advancedCount = [category, brand, connected, year].filter(Boolean).length;
  const hasFilters = q || site || category || brand || warranty || status || connected || year;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('My Equipment', 'อุปกรณ์ของฉัน')}</h1>
          <p className="page-sub">
            {t('Your registered assets, health and warranty at a glance.', 'ภาพรวมอุปกรณ์ที่ลงทะเบียน สถานะการทำงาน และการรับประกันของคุณ')}
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

      {/* Engineer Asset Telemetry Bar */}
      <section className="eq-telemetry-bar" aria-label={t('Asset status telemetry', 'สถานะอุปกรณ์')}>
        <div className="eq-telemetry-main">
          <div className="eq-telemetry-badge">
            <Package size={22} strokeWidth={1.75} />
          </div>
          <div>
            <div className="eq-telemetry-title">
              <span className="eq-telemetry-count">{all.length}</span>
              <span className="eq-telemetry-unit">{t('ASSETS', 'อุปกรณ์')}</span>
            </div>
            <div className="eq-telemetry-sub">
              {t(`Across ${company.sites.length} sites`, `ครอบคลุม ${company.sites.length} ไซต์งาน`)}
            </div>
          </div>
        </div>

        <button
          type="button"
          className={`eq-telemetry-item item-healthy ${status === 'running' ? 'active' : ''}`}
          onClick={() => setStatus(status === 'running' ? '' : 'running')}
          title={t('Click to filter running assets', 'คลิกเพื่อกรองเฉพาะอุปกรณ์ที่ทำงานปกติ')}
        >
          <div className="eq-item-head">
            <span className="status-indicator status-green" aria-hidden />
            <span className="eq-item-label">{t('Healthy / Running', 'ทำงานปกติ')}</span>
          </div>
          <div className="eq-item-val">{healthy}</div>
        </button>

        <button
          type="button"
          className={`eq-telemetry-item item-attention ${status === 'maintenance' || status === 'stopped' ? 'active' : ''}`}
          onClick={() => setStatus(status === 'maintenance' ? '' : 'maintenance')}
          title={t('Click to filter assets needing maintenance', 'คลิกเพื่อกรองอุปกรณ์ที่ต้องดูแล')}
        >
          <div className="eq-item-head">
            <span className="status-indicator status-amber" aria-hidden />
            <span className="eq-item-label">{t('Needs Attention', 'ต้องดูแล / ซ่อมบำรุง')}</span>
          </div>
          <div className="eq-item-val">{needsAttention}</div>
        </button>

        <button
          type="button"
          className={`eq-telemetry-item item-connected ${connected === 'yes' ? 'active' : ''}`}
          onClick={() => setConnected(connected === 'yes' ? '' : 'yes')}
          title={t('Click to filter IoT connected assets', 'คลิกเพื่อกรองอุปกรณ์ที่เชื่อมต่อ IoT')}
        >
          <div className="eq-item-head">
            <span className="status-indicator status-blue" aria-hidden />
            <span className="eq-item-label">{t('IoT Live Telemetry', 'เชื่อมต่อ (IoT Telemetry)')}</span>
          </div>
          <div className="eq-item-val">{connectedCount}</div>
        </button>

        <button
          type="button"
          className={`eq-telemetry-item item-warranty ${warranty === 'expiring' || warranty === 'expired' ? 'active' : ''}`}
          onClick={() => setWarranty(warranty ? '' : 'expiring')}
          title={t('Click to filter expiring/expired warranty', 'คลิกเพื่อกรองประกันใกล้หมด/หมด')}
        >
          <div className="eq-item-head">
            <span className="status-indicator status-red" aria-hidden />
            <span className="eq-item-label">{t('Warranty Alert', 'แจ้งเตือนการรับประกัน')}</span>
          </div>
          <div className="eq-item-val">{warrantyAttention}</div>
        </button>
      </section>

      {/* Engineer Filter & Toolbar Container */}
      <div className="eq-filter-container">
        {/* Single Line Toolbar: Search -> Site -> Status -> More Filters -> Sort -> View Mode */}
        <div className="eq-toolbar-single">
          <div className="eq-search-wrapper">
            <SearchBox value={q} onChange={setQ} placeholder={t('Search name, model, serial, tag…', 'ค้นหาชื่อ รุ่น ซีเรียล แท็ก…')} />
          </div>

          <select value={site} onChange={(e) => setSite(e.target.value)} aria-label={t('Filter by site', 'กรองตามไซต์')} className="eq-select eq-site-select">
            <option value="">{t('All Sites', 'ทุกไซต์')}</option>
            {company.sites.map((s) => (
              <option key={s.id} value={s.id}>{lang === 'th' ? s.nameTh : s.name}</option>
            ))}
          </select>

          <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label={t('Filter by operating status', 'กรองตามสถานะ')} className="eq-select eq-status-select">
            <option value="">{t('All Operating States', 'ทุกสถานะการทำงาน')}</option>
            {Object.entries(OPERATING_STATUS).map(([k, v]) => (
              <option key={k} value={k}>{lang === 'th' ? v.th : v.en}</option>
            ))}
          </select>

          <button
            type="button"
            className={`btn btn-outline btn-filter-toggle ${showAdvanced || advancedCount > 0 ? 'active' : ''}`}
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <SlidersHorizontal size={15} aria-hidden />
            <span>{t('More Filters', 'ตัวกรองเพิ่มเติม')}</span>
            {advancedCount > 0 && <span className="filter-count-badge">{advancedCount}</span>}
          </button>

          <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label={t('Sort', 'จัดเรียง')} className="eq-select eq-sort-select">
            <option value="name">{t('Sort: Name A–Z', 'เรียง: ชื่อ ก–ฮ')}</option>
            <option value="newest">{t('Sort: Newest Install', 'เรียง: ติดตั้งใหม่สุด')}</option>
            <option value="oldest">{t('Sort: Oldest Install', 'เรียง: ติดตั้งเก่าสุด')}</option>
            <option value="warranty">{t('Sort: Warranty End', 'เรียง: วันหมดประกัน')}</option>
          </select>

          <div className="seg eq-view-seg" role="group" aria-label={t('View mode', 'รูปแบบการแสดงผล')}>
            <button className={view === 'cards' ? 'active' : ''} onClick={() => setView('cards')} aria-pressed={view === 'cards'} aria-label={t('Card view', 'มุมมองการ์ด')}>
              <LayoutGrid size={15} aria-hidden />
            </button>
            <button className={view === 'table' ? 'active' : ''} onClick={() => setView('table')} aria-pressed={view === 'table'} aria-label={t('Table view', 'มุมมองตาราง')}>
              <Rows3 size={15} aria-hidden />
            </button>
          </div>
        </div>

        {/* Collapsible Advanced Filters Drawer */}
        {(showAdvanced || advancedCount > 0) && (
          <div className="eq-advanced-panel">
            <div className="eq-advanced-grid">
              <div className="eq-field">
                <label className="eq-field-label">{t('Category', 'หมวดหมู่อุปกรณ์')}</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="eq-select">
                  <option value="">{t('All categories', 'ทุกหมวดหมู่')}</option>
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="eq-field">
                <label className="eq-field-label">{t('Brand / Manufacturer', 'แบรนด์ / ผู้ผลิต')}</label>
                <select value={brand} onChange={(e) => setBrand(e.target.value)} className="eq-select">
                  <option value="">{t('All brands', 'ทุกแบรนด์')}</option>
                  {brands.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <div className="eq-field">
                <label className="eq-field-label">{t('IoT Monitoring', 'การเชื่อมต่อ IoT')}</label>
                <select value={connected} onChange={(e) => setConnected(e.target.value)} className="eq-select">
                  <option value="">{t('All Connection States', 'ทุกสถานะการเชื่อมต่อ')}</option>
                  <option value="yes">{t('Connected (IoT)', 'เชื่อมต่อ (IoT)')}</option>
                  <option value="no">{t('Not Connected', 'ไม่เชื่อมต่อ')}</option>
                </select>
              </div>

              <div className="eq-field">
                <label className="eq-field-label">{t('Installation Year', 'ปีที่ติดตั้ง')}</label>
                <select value={year} onChange={(e) => setYear(e.target.value)} className="eq-select">
                  <option value="">{t('All Install Years', 'ทุกปีติดตั้ง')}</option>
                  {years.map((y) => <option key={y} value={String(y)}>{y}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Quick Filter Strip & Summary Bar */}
        <div className="eq-filter-strip">
          <div className="chip-row">
            <span className="chip-strip-label">{t('Warranty Status:', 'สถานะประกัน:')}</span>
            <button className={`chip ${warranty === '' ? 'active' : ''}`} onClick={() => setWarranty('')} aria-pressed={warranty === ''}>
              {t('All Warranty States', 'ทุกสถานะประกัน')}
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

          <div className="eq-status-summary">
            <span className="muted small">
              {t(`${filtered.length} of ${all.length} assets listed`, `แสดง ${filtered.length} จาก ${all.length} รายการ`)}
            </span>
            {hasFilters && (
              <button className="btn btn-ghost btn-sm btn-clear-filters" onClick={clearAll}>
                <X size={14} aria-hidden />
                {t('Clear filters', 'ล้างตัวกรอง')}
              </button>
            )}
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
              <div key={a.id} className="card asset-card-new">
                {a.image && (
                  <Link to={`/portal/equipment/${a.id}`} className="ac-photo" tabIndex={-1} aria-hidden>
                    <img src={a.image} alt="" loading="lazy" />
                    <span className={`ac-photo-pill t-${op.tone}`}>
                      <Camera size={11} aria-hidden /> {t('Photo', 'รูป')}
                    </span>
                  </Link>
                )}
                <div className="ac-body">
                  <div className="ac-head">
                    <div className={`ac-icon ic-${op.tone}`} aria-hidden>
                      <Package size={22} strokeWidth={1.5} />
                    </div>
                    <div className="ac-title">
                      <Link to={`/portal/equipment/${a.id}`} className="ac-name">{a.name}</Link>
                      <div className="ac-meta">{a.id} · {a.brand} {a.model}</div>
                    </div>
                  </div>

                  <div className="ac-badges">
                    <StatusBadge label={lang === 'th' ? op.th : op.en} tone={op.tone} dot />
                    <StatusBadge label={lang === 'th' ? wa.th : wa.en} tone={wa.tone} dot />
                  </div>

                  <div className="ac-rows">
                    <div className="ac-row">
                      <MapPin size={14} aria-hidden />
                      <span className="ac-row-text">{siteName(customerCode, a.siteId, lang) || a.location ? `${siteName(customerCode, a.siteId, lang)} · ${a.location}` : '—'}</span>
                    </div>
                    <div className="ac-row">
                      <CalendarDays size={14} aria-hidden />
                      <span>{t('Next PM', 'PM ถัดไป')}: {a.nextPM ? fmtDate(a.nextPM, lang) : '—'}</span>
                    </div>
                    <div className="ac-row">
                      <ShieldCheck size={14} aria-hidden />
                      <span>{t('Warranty until', 'ประกันถึง')} {a.warrantyEnd && a.warranty !== 'none' ? fmtDate(a.warrantyEnd, lang) : '—'}</span>
                    </div>
                  </div>

                  <div className="ac-foot">
                    <span className={`badge ${a.connected ? 't-blue' : 't-grey'}`}>
                      {a.connected ? <Wifi size={13} aria-hidden /> : <WifiOff size={13} aria-hidden />}
                      {a.connected ? t('Connected', 'เชื่อมต่อ') : t('Not connected', 'ไม่เชื่อมต่อ')}
                    </span>
                    <div className="ac-actions">
                      <Link to={`/portal/equipment/${a.id}`} className="btn btn-outline btn-sm">
                        {t('View', 'ดู')}
                      </Link>
                      <Link to={`/portal/requests/new?asset=${a.id}`} className="btn btn-soft btn-sm">
                        <Plus size={14} aria-hidden />
                        {t('Report', 'แจ้ง')}
                      </Link>
                    </div>
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
