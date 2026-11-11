import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowDown, ArrowUp, ArrowUpDown, Package, QrCode, SlidersHorizontal, X } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { EmptyState, ExportButton, QRScannerMock, SearchBox, StatusBadge } from '@/components/common';
import { fmtDate, daysSince } from '@/utils/format';
import { OPERATING_STATUS, WARRANTY_STATUS } from '@/utils/status';
import type { WarrantyStatus } from '@/types';
import {
  apiGetEquipmentUnits,
  apiGetPurchaseYears,
  apiGetSites,
  type EquipmentUnitResponse,
  type PurchaseYearResponse,
  type SiteResponse,
} from '@/lib/apiClient';
import { tokenStore } from '@/lib/tokenStore';

// Backend returns vocab.WarrantyState tokens; the shared WARRANTY_STATUS
// badge map (used across the portal) keys on the frontend's own
// WarrantyStatus tokens — translate both ways at this page's boundary
// rather than touching that shared file.
const STATE_TO_WARRANTY: Record<EquipmentUnitResponse['warrantyState'], WarrantyStatus> = {
  active: 'active',
  expiringSoon: 'expiring',
  expired: 'expired',
  unknown: 'none',
};
const WARRANTY_TO_STATE: Record<Exclude<WarrantyStatus, ''>, EquipmentUnitResponse['warrantyState']> = {
  active: 'active',
  expiring: 'expiringSoon',
  expired: 'expired',
  none: 'unknown',
};

type SortKey = 'asset' | 'site' | 'category' | 'purchaseDate' | 'status' | 'warranty' | 'nextPm';
type ColSort = { key: SortKey; dir: 'asc' | 'desc' };

const STATUS_ORDER: Record<EquipmentUnitResponse['status'], number> = {
  Active: 0,
  UnderRepair: 1,
  Decommissioned: 2,
};

// Value a column sorts on; null/empty sorts last in both directions.
function sortValue(r: EquipmentUnitResponse, key: SortKey, lang: string): string | number | null {
  switch (key) {
    case 'asset': return (lang === 'th' ? r.nameTh : r.nameEn) || null;
    case 'site': return r.site || null;
    case 'category': return (lang === 'th' ? r.categoryTh : r.categoryEn) || null;
    case 'purchaseDate': return r.purchaseDate ? Date.parse(r.purchaseDate) : null;
    case 'status': return STATUS_ORDER[r.status];
    case 'warranty': return r.warrantyUntil ? Date.parse(r.warrantyUntil) : null;
    case 'nextPm': return r.nextDue ? Date.parse(r.nextDue) : null;
  }
}

export function EquipmentPage() {
  const { lang, t } = useLang();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const [q, setQ] = useState(() => params.get('q') ?? '');
  const [qDebounced, setQDebounced] = useState(q);
  const [site, setSite] = useState(() => params.get('site') ?? '');
  const [category, setCategory] = useState(() => params.get('category') ?? '');
  const [brand, setBrand] = useState('');
  const [status, setStatus] = useState('');
  // "connected" (IoT) has no backing column anywhere in the DB — the
  // dropdown/toggle stays in the UI per product decision, but it is never
  // sent to the API and never filters real rows.
  const [connected, setConnected] = useState('');
  const [year, setYear] = useState('');
  const [sort, setSort] = useState('name');
  // Column-header sort, applied client-side over the fetched rows; null keeps
  // the server order chosen by the Sort dropdown.
  const [colSort, setColSort] = useState<ColSort | null>(null);
  const [scanOpen, setScanOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [sites, setSites] = useState<SiteResponse[] | null>(null);
  const [purchaseYears, setPurchaseYears] = useState<PurchaseYearResponse[] | null>(null);

  // Rows fetched with every filter EXCEPT warranty — the warranty chips and
  // the Warranty Alert tile count from these, so selecting one chip doesn't
  // zero out the others. `rows` (below) is this list narrowed by warranty.
  const [baseRows, setBaseRows] = useState<EquipmentUnitResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const accessToken = tokenStore.read()?.accessToken;
    if (!accessToken) return;
    apiGetSites(accessToken).then(setSites).catch(() => {});
    apiGetPurchaseYears(accessToken).then(setPurchaseYears).catch(() => {});
  }, []);

  // Debounce the search box before it hits the API.
  useEffect(() => {
    const id = setTimeout(() => setQDebounced(q), 300);
    return () => clearTimeout(id);
  }, [q]);

  const warranty = (params.get('warranty') ?? '') as WarrantyStatus | '';
  const setWarranty = (w: string) => {
    const next = new URLSearchParams(params);
    if (w) next.set('warranty', w);
    else next.delete('warranty');
    setParams(next, { replace: true });
  };

  useEffect(() => {
    const accessToken = tokenStore.read()?.accessToken;
    if (!accessToken) return;
    setLoading(true);
    setLoadError(false);
    apiGetEquipmentUnits(accessToken, {
      category: category || undefined,
      site: site || undefined,
      brand: brand || undefined,
      status: status || undefined,
      year: year ? Number(year) : undefined,
      q: qDebounced || undefined,
      sort: sort || undefined,
    })
      .then(setBaseRows)
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, [category, site, brand, status, year, qDebounced, sort]);

  const rows = useMemo(
    () => (warranty ? baseRows.filter((r) => r.warrantyState === WARRANTY_TO_STATE[warranty]) : baseRows),
    [baseRows, warranty],
  );

  const sortedRows = useMemo(() => {
    if (!colSort) return rows;
    const sign = colSort.dir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = sortValue(a, colSort.key, lang);
      const bv = sortValue(b, colSort.key, lang);
      if (av === null && bv === null) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;
      if (typeof av === 'string' && typeof bv === 'string') return sign * av.localeCompare(bv, lang);
      return sign * ((av as number) - (bv as number));
    });
  }, [rows, colSort, lang]);

  // asc -> desc -> back to server order.
  const toggleColSort = (key: SortKey) =>
    setColSort((cur) => {
      if (cur?.key !== key) return { key, dir: 'asc' };
      return cur.dir === 'asc' ? { key, dir: 'desc' } : null;
    });

  const sortTh = (key: SortKey, label: string) => {
    const active = colSort?.key === key ? colSort.dir : null;
    const Icon = active === 'asc' ? ArrowUp : active === 'desc' ? ArrowDown : ArrowUpDown;
    return (
      <th aria-sort={active === 'asc' ? 'ascending' : active === 'desc' ? 'descending' : 'none'}>
        <button type="button" className={`th-sort ${active ? 'active' : ''}`} onClick={() => toggleColSort(key)}>
          {label}
          <Icon size={13} aria-hidden />
        </button>
      </th>
    );
  };

  // Category/brand dropdown options come from the currently-fetched rows
  // (same pattern the page used against mock data) — no dedicated
  // "distinct categories/brands" endpoint exists.
  const categories = useMemo(
    () => [...new Set(rows.map((r) => r.categoryEn).filter((c): c is string => !!c))].sort(),
    [rows],
  );
  const brands = useMemo(
    () => [...new Set(rows.map((r) => r.brandEn).filter((b): b is string => !!b))].sort(),
    [rows],
  );
  const years = (purchaseYears ?? []).map((y) => y.purchaseYear);

  // Telemetry counts reflect the currently-filtered rows (same design as
  // the /portal/equipment ribbon).
  const healthy = rows.filter((r) => r.status === 'Active').length;
  const needsAttention = rows.filter((r) => r.status === 'UnderRepair' || r.status === 'Decommissioned').length;
  const connectedCount = 0; // no IoT data backing this yet
  const warrantyAttention = baseRows.filter((r) => r.warrantyState === 'expiringSoon' || r.warrantyState === 'expired').length;

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
              <span className="eq-telemetry-count">{rows.length}</span>
              <span className="eq-telemetry-unit">{t('ASSETS', 'อุปกรณ์')}</span>
            </div>
            <div className="eq-telemetry-sub">
              {t(`Across ${(sites ?? []).length} sites`, `ครอบคลุม ${(sites ?? []).length} ไซต์งาน`)}
            </div>
          </div>
        </div>

        <button
          type="button"
          className={`eq-telemetry-item item-healthy ${status === 'Active' ? 'active' : ''}`}
          onClick={() => setStatus(status === 'Active' ? '' : 'Active')}
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
          className={`eq-telemetry-item item-attention ${status === 'UnderRepair' ? 'active' : ''}`}
          onClick={() => setStatus(status === 'UnderRepair' ? '' : 'UnderRepair')}
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
        {/* Single Line Toolbar: Search -> Site -> Status -> More Filters -> Sort */}
        <div className="eq-toolbar-single">
          <div className="eq-search-wrapper">
            <SearchBox value={q} onChange={setQ} placeholder={t('Search name, model, serial, tag…', 'ค้นหาชื่อ รุ่น ซีเรียล แท็ก…')} />
          </div>

          <select value={site} onChange={(e) => setSite(e.target.value)} aria-label={t('Filter by site', 'กรองตามไซต์')} className="eq-select eq-site-select">
            <option value="">{t('All Sites', 'ทุกไซต์')}</option>
            {(sites ?? []).map((s) => (
              <option key={s.site} value={s.site}>{s.site}</option>
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

          <select value={sort} onChange={(e) => { setSort(e.target.value); setColSort(null); }} aria-label={t('Sort', 'จัดเรียง')} className="eq-select eq-sort-select">
            <option value="name">{t('Sort: Name A–Z', 'เรียง: ชื่อ ก–ฮ')}</option>
            <option value="newest">{t('Sort: Newest Install', 'เรียง: ติดตั้งใหม่สุด')}</option>
            <option value="oldest">{t('Sort: Oldest Install', 'เรียง: ติดตั้งเก่าสุด')}</option>
            <option value="warranty">{t('Sort: Warranty End', 'เรียง: วันหมดประกัน')}</option>
          </select>
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
                <label className="eq-field-label">{t('Purchase Year', 'ปีที่ซื้อ')}</label>
                <select value={year} onChange={(e) => setYear(e.target.value)} className="eq-select">
                  <option value="">{t('All Purchase Years', 'ทุกปีที่ซื้อ')}</option>
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
              const count = baseRows.filter((r) => r.warrantyState === WARRANTY_TO_STATE[w]).length;
              return (
                <button key={w} className={`chip ${warranty === w ? 'active' : ''}`} onClick={() => setWarranty(w)} aria-pressed={warranty === w}>
                  {lang === 'th' ? meta.th : meta.en} ({count})
                </button>
              );
            })}
          </div>

          <div className="eq-status-summary">
            <span className="muted small">
              {loading
                ? t('Loading…', 'กำลังโหลด…')
                : t(`${rows.length} assets listed`, `แสดง ${rows.length} รายการ`)}
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

      {loadError && (
        <EmptyState
          icon={<Package size={24} />}
          title={t('Could not load equipment', 'โหลดข้อมูลอุปกรณ์ไม่สำเร็จ')}
          body={t('Please try again in a moment.', 'กรุณาลองใหม่อีกครั้งในภายหลัง')}
        />
      )}

      {!loadError && !loading && rows.length === 0 && (
        <EmptyState
          icon={<Package size={24} />}
          title={t('No equipment matches these filters', 'ไม่พบอุปกรณ์ตามตัวกรองนี้')}
          body={t('Try removing a filter, or ask SE to register additional assets to your account.', 'ลองลดตัวกรอง หรือแจ้ง SE เพื่อลงทะเบียนอุปกรณ์เพิ่มเติม')}
          action={<button className="btn btn-primary btn-sm" onClick={clearAll}>{t('Clear all filters', 'ล้างตัวกรองทั้งหมด')}</button>}
        />
      )}

      {!loadError && rows.length > 0 && (
        <div className="card table-to-cards" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="se-table">
              <thead>
                <tr>
                  {sortTh('asset', t('Asset', 'อุปกรณ์'))}
                  {sortTh('site', t('Site', 'ไซต์'))}
                  {sortTh('category', t('Category', 'หมวด'))}
                  {sortTh('purchaseDate', t('Purchase Date', 'วันที่ซื้อ'))}
                  {sortTh('status', t('Status', 'สถานะ'))}
                  {sortTh('warranty', t('Warranty', 'การรับประกัน'))}
                  {sortTh('nextPm', t('Next PM', 'PM ถัดไป'))}
                  <th aria-label={t('Actions', 'การทำงาน')} />
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((r) => {
                  const op = OPERATING_STATUS[r.status];
                  const warrantyToken = STATE_TO_WARRANTY[r.warrantyState];
                  const wa = WARRANTY_STATUS[warrantyToken];
                  const days = r.purchaseDate ? Math.max(1, daysSince(r.purchaseDate)) : null;
                  return (
                    <tr key={r.unitId} className="row-link" onClick={() => navigate(`/portal/equipment/${r.id}?unitId=${encodeURIComponent(r.unitId)}`)}>
                      <td data-label={t('Asset', 'อุปกรณ์')}>
                        <div className="fw-600">{lang === 'th' ? r.nameTh : r.nameEn}</div>
                        {r.assetCode && <div className="muted small">{t('Asset Code', 'รหัสทรัพย์สิน')}: {r.assetCode}</div>}
                        <div className="muted small">{t('Item Code', 'รหัสสินค้า')}: {r.id}</div>
                        {r.serialNo && <div className="muted small">{t('Serial No.', 'หมายเลขเครื่อง')}: {r.serialNo}</div>}
                        {r.description && <div className="muted small">{t('Description', 'รายละเอียด')}: {r.description}</div>}
                      </td>
                      <td data-label={t('Site', 'ไซต์')}>{r.site ?? '—'}</td>
                      <td data-label={t('Category', 'หมวด')}>{(lang === 'th' ? r.categoryTh : r.categoryEn) ?? '—'}</td>
                      <td data-label={t('Purchase Date', 'วันที่ซื้อ')}>
                        {r.purchaseDate ? (
                          <>
                            <div className="fw-500">{fmtDate(r.purchaseDate, lang)}</div>
                            <div className="muted small" style={{ color: 'var(--se-text-secondary)' }}>
                              {t(`Total ${days} days`, `รวม ${days} วัน`)}
                            </div>
                          </>
                        ) : (
                          <span className="muted small">—</span>
                        )}
                      </td>
                      <td data-label={t('Status', 'สถานะ')}><StatusBadge label={lang === 'th' ? op.th : op.en} tone={op.tone} /></td>
                      <td data-label={t('Warranty', 'การรับประกัน')}>
                        {warrantyToken === 'none' ? (
                          <span className="muted small">{t('No warranty', 'ไม่มีประกัน')}</span>
                        ) : (
                          <div>
                            <StatusBadge label={lang === 'th' ? wa.th : wa.en} tone={wa.tone} />
                            <div className="muted small" style={{ marginTop: 3 }}>
                              {t('Expires:', 'หมดอายุ:')} {r.warrantyUntil ? fmtDate(r.warrantyUntil, lang) : '—'}
                            </div>
                          </div>
                        )}
                      </td>
                      <td data-label={t('Next PM', 'PM ถัดไป')}>{r.nextDue ? fmtDate(r.nextDue, lang) : '—'}</td>
                      <td data-label={t('Actions', 'การทำงาน')}>
                        <Link to={`/portal/requests/new?asset=${r.id}`} className="btn btn-soft btn-sm" onClick={(e) => e.stopPropagation()}>
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
