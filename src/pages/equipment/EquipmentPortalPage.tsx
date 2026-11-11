import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Activity,
  Layers,
  ListFilter,
  MapPin,
  Package,
  QrCode,
  Search,
  Wrench,
  X,
} from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { ExportButton, QRScannerMock } from '@/components/common';
import { apiGetEquipment, apiGetSites, type EquipmentCategorySummaryResponse, type SiteResponse } from '@/lib/apiClient';
import { tokenStore } from '@/lib/tokenStore';
import { getAssetUrl } from '@/utils/assets';
import { CategoryPortalCard, type CategorySummary } from './CategoryPortalCard';

const FALLBACK_IMAGE = getAssetUrl('assets/connect_every_pump_xn.webp');

export function EquipmentPortalPage() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [q, setQ] = useState(() => params.get('q') ?? '');
  const [qDebounced, setQDebounced] = useState(() => params.get('q') ?? '');
  const [site, setSite] = useState(() => params.get('site') ?? '');
  const [selectedCatTab, setSelectedCatTab] = useState<string>('all');
  const [filterPreset, setFilterPreset] = useState<'all' | 'active' | 'attention' | 'expiring'>('all');
  const [scanOpen, setScanOpen] = useState(false);

  const [sites, setSites] = useState<SiteResponse[]>([]);
  const [equipment, setEquipment] = useState<EquipmentCategorySummaryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  // Debounce the search box before it hits the API.
  useEffect(() => {
    const id = setTimeout(() => setQDebounced(q), 300);
    return () => clearTimeout(id);
  }, [q]);

  useEffect(() => {
    const accessToken = tokenStore.read()?.accessToken;
    if (!accessToken) return;
    apiGetSites(accessToken).then(setSites).catch(() => {});
  }, []);

  useEffect(() => {
    const accessToken = tokenStore.read()?.accessToken;
    if (!accessToken) return;
    setLoading(true);
    setLoadError(false);
    apiGetEquipment(accessToken, { site: site || undefined, q: qDebounced || undefined })
      .then(setEquipment)
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, [site, qDebounced]);

  // Map API rows -> the shape CategoryPortalCard renders. `category` uses
  // labelEn as the stable identity (tab selection, nav filter, React key),
  // matching the previous mock-driven design.
  const categorySummaries = useMemo<CategorySummary[]>(() => {
    return equipment.map((row) => ({
      category: row.labelEn,
      imageUrl: row.imageUrl || FALLBACK_IMAGE,
      total: row.unitCount,
      active: row.workingCount,
      inactive: row.unitCount - row.workingCount,
      underWarranty: row.warranty.active,
      expiringSoon: row.warranty.expiringSoon,
      expired: row.warranty.expired,
    }));
  }, [equipment]);

  // Final category cards according to preset filters
  const displayedCategories = useMemo(() => {
    return categorySummaries.filter((cat) => {
      if (selectedCatTab !== 'all' && cat.category !== selectedCatTab) return false;
      if (filterPreset === 'active' && cat.active === 0) return false;
      if (filterPreset === 'attention' && cat.inactive === 0) return false;
      if (filterPreset === 'expiring' && (cat.expiringSoon === 0 && cat.expired === 0)) return false;
      return true;
    });
  }, [categorySummaries, selectedCatTab, filterPreset]);

  // Tab counts for filter presets — counted in units (AssetUnit), matching the
  // telemetry ribbon above, not in categories.
  const tabCounts = useMemo(() => {
    const all = categorySummaries.reduce((sum, c) => sum + c.total, 0);
    const operational = categorySummaries.reduce((sum, c) => sum + c.active, 0);
    const attention = categorySummaries.reduce((sum, c) => sum + c.inactive, 0);
    const alert = categorySummaries.reduce((sum, c) => sum + c.expiringSoon + c.expired, 0);
    return { all, operational, attention, alert };
  }, [categorySummaries]);

  // Total metrics
  const totalEquipment = categorySummaries.reduce((sum, c) => sum + c.total, 0);
  const totalCategories = categorySummaries.length;
  const totalActive = categorySummaries.reduce((sum, c) => sum + c.active, 0);
  const totalExpiring = categorySummaries.reduce((sum, c) => sum + c.expiringSoon, 0);
  const totalExpired = categorySummaries.reduce((sum, c) => sum + c.expired, 0);
  const totalWarrantyAlerts = totalExpiring + totalExpired;

  // List view URL preserving active search & site
  const listViewUrl = useMemo(() => {
    const p = new URLSearchParams();
    if (site) p.set('site', site);
    if (q) p.set('q', q);
    if (filterPreset === 'expiring') p.set('warranty', 'expiring');
    const qs = p.toString();
    return `/portal/equipment/list${qs ? `?${qs}` : ''}`;
  }, [site, q, filterPreset]);

  const activePercent = totalEquipment > 0 ? Math.round((totalActive / totalEquipment) * 100) : 0;

  return (
    <div className="equipment-portal-container">
      {/* 1. Page Header */}
      <div className="portal-header-wrapper">
        <div>
          <div className="portal-breadcrumb-tag">
            <span className="portal-pulse-live" />
            <Layers size={13} aria-hidden />
            <span>{t('Equipment Category Portal', 'พอร์ทัลหมวดหมู่อุปกรณ์')}</span>
          </div>
          <h1 className="page-title">{t('My Equipment', 'อุปกรณ์ของฉัน')}</h1>
          <p className="page-sub">
            {t(
              'Explore equipment groups, view live operational telemetry, and monitor warranty health.',
              'ดูภาพรวมกลุ่มอุปกรณ์ จำแนกตามหมวดหมู่ สถานะการทำงาน และความครอบคลุมของการรับประกัน'
            )}
          </p>
        </div>

        <div className="page-actions" style={{ marginTop: 4 }}>
          <Link to={listViewUrl} className="btn btn-primary">
            <ListFilter size={15} aria-hidden />
            {t('All Assets Table', 'ดูรายการทั้งหมด (ตาราง)')}
          </Link>
          <button className="btn btn-outline" onClick={() => setScanOpen(true)}>
            <QrCode size={15} aria-hidden />
            {t('Scan QR', 'สแกน QR')}
          </button>
          <ExportButton label={t('Export report', 'ส่งออกรายงาน')} />
        </div>
      </div>

      {/* 2. Overview Telemetry Cards (Interactive) */}
      <section className="portal-summary-ribbon" aria-label={t('Portal Summary', 'สรุปภาพรวม')}>
        {/* Total Categories */}
        <div
          className={`portal-ribbon-card ${filterPreset === 'all' && selectedCatTab === 'all' ? 'is-active-card' : ''}`}
          onClick={() => {
            setFilterPreset('all');
            setSelectedCatTab('all');
          }}
          role="button"
          tabIndex={0}
        >
          <div className="portal-ribbon-icon ic-primary">
            <Layers size={20} strokeWidth={1.8} />
          </div>
          <div className="portal-ribbon-body">
            <span className="ribbon-label">{t('Total Categories', 'จำนวนกลุ่มสินค้า')}</span>
            <div className="ribbon-main-row">
              <span className="ribbon-num">{totalCategories}</span>
            </div>
            <span className="ribbon-sub">{t('Product families', 'กลุ่มผลิตภัณฑ์')}</span>
          </div>
        </div>

        {/* Total Equipment */}
        <div
          className="portal-ribbon-card"
          onClick={() => navigate(listViewUrl)}
          role="button"
          tabIndex={0}
          title={t('Click to open equipment table', 'คลิกเพื่อดูตารางอุปกรณ์ทั้งหมด')}
        >
          <div className="portal-ribbon-icon ic-info">
            <Package size={20} strokeWidth={1.8} />
          </div>
          <div className="portal-ribbon-body">
            <span className="ribbon-label">{t('Total Equipment', 'อุปกรณ์ทั้งหมด')}</span>
            <div className="ribbon-main-row">
              <span className="ribbon-num">{totalEquipment}</span>
              <span className="ribbon-total">{t('units', 'เครื่อง')}</span>
            </div>
            <span className="ribbon-sub">
              {t(`Across ${sites.length} sites`, `ใน ${sites.length} ไซต์งาน`)}
            </span>
          </div>
        </div>

        {/* Operating Active */}
        <div
          className={`portal-ribbon-card ${filterPreset === 'active' ? 'is-active-card' : ''}`}
          onClick={() => setFilterPreset((p) => (p === 'active' ? 'all' : 'active'))}
          role="button"
          tabIndex={0}
          title={t('Filter active operational equipment', 'กรองเฉพาะหมวดหมู่ที่กำลังทำงาน')}
        >
          <div className="portal-ribbon-icon ic-success">
            <Activity size={20} strokeWidth={1.8} />
          </div>
          <div className="portal-ribbon-body">
            <span className="ribbon-label">{t('Operating Active', 'กำลังทำงาน')}</span>
            <div className="ribbon-main-row">
              <span className="ribbon-num">{totalActive}</span>
              {totalEquipment > 0 && <span className="ribbon-total">/{totalEquipment}</span>}
            </div>
            <span className="ribbon-sub">
              {totalEquipment > 0 ? `${activePercent}% uptime` : '—'}
            </span>
          </div>
        </div>

        {/* Warranty Alert */}
        <div
          className={`portal-ribbon-card ${filterPreset === 'expiring' ? 'is-active-card' : ''}`}
          onClick={() => setFilterPreset((p) => (p === 'expiring' ? 'all' : 'expiring'))}
          role="button"
          tabIndex={0}
          title={t('Filter warranty expiring or expired', 'กรองหมวดหมู่ที่มีประกันใกล้หมดหรือหมดอายุ')}
        >
          <div className="portal-ribbon-icon ic-warning">
            <Wrench size={20} strokeWidth={1.8} />
          </div>
          <div className="portal-ribbon-body">
            <span className="ribbon-label">{t('Warranty Attention', 'แจ้งเตือนประกัน')}</span>
            <div className="ribbon-main-row">
              <span className={`ribbon-num ${totalWarrantyAlerts > 0 ? 'highlight-soon' : ''}`}>
                {totalWarrantyAlerts}
              </span>
            </div>
            <span className="ribbon-sub">
              {totalExpiring > 0
                ? t(`${totalExpiring} expiring soon · ${totalExpired} expired`, `ใกล้หมด ${totalExpiring} · หมดแล้ว ${totalExpired}`)
                : t('All warranty in good standing', 'การรับประกันอยู่ในเกณฑ์ปกติ')}
            </span>
          </div>
        </div>
      </section>

      {/* 3. Search & Site Filter Toolbar (Refined TailAdmin Enterprise Structure) */}
      <div className="portal-control-bar">
        <div className="portal-control-left">
          {/* Search Box */}
          <div className="portal-custom-search">
            <i className="fa-solid fa-magnifying-glass portal-search-icon" aria-hidden="true" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('Search category, equipment, model…', 'ค้นหาหมวดหมู่, ชื่ออุปกรณ์, รุ่น…')}
              className="portal-search-input"
            />
            {q && (
              <button
                type="button"
                className="portal-search-clear"
                onClick={() => setQ('')}
                aria-label="Clear search"
              >
                <i className="fa-solid fa-xmark" aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Site Filter Dropdown */}
          <div className="portal-site-selector-wrap">
            <i className="fa-solid fa-location-dot portal-site-icon" aria-hidden="true" />
            <select
              value={site}
              onChange={(e) => setSite(e.target.value)}
              aria-label={t('Filter by site', 'กรองตามไซต์')}
              className="portal-site-select"
            >
              <option value="">
                {t('All Sites', 'ทุกไซต์งาน')} ({sites.length})
              </option>
              {sites.map((s) => (
                <option key={s.site} value={s.site}>
                  {s.site}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right side: Clean TailAdmin Filter Tabs & Structured Counter */}
        <div className="portal-control-right">
          <div className="portal-filter-segment" role="tablist">
            <button
              type="button"
              className={`portal-segment-tab ${filterPreset === 'all' ? 'active' : ''}`}
              onClick={() => setFilterPreset('all')}
            >
              {t('All', 'ทั้งหมด')} <span className="tab-num">({tabCounts.all})</span>
            </button>
            <button
              type="button"
              className={`portal-segment-tab ${filterPreset === 'active' ? 'active' : ''}`}
              onClick={() => setFilterPreset('active')}
            >
              {t('Operational', 'ทำงานปกติ')} <span className="tab-num">({tabCounts.operational})</span>
            </button>
            <button
              type="button"
              className={`portal-segment-tab ${filterPreset === 'attention' ? 'active' : ''}`}
              onClick={() => setFilterPreset('attention')}
            >
              {t('Needs Attention', 'ต้องดูแล')} {tabCounts.attention > 0 && <span className="tab-num num-warn">({tabCounts.attention})</span>}
            </button>
            <button
              type="button"
              className={`portal-segment-tab ${filterPreset === 'expiring' ? 'active' : ''}`}
              onClick={() => setFilterPreset('expiring')}
            >
              {t('Warranty Alert', 'แจ้งเตือนประกัน')} {tabCounts.alert > 0 && <span className="tab-num num-alert">({tabCounts.alert})</span>}
            </button>
          </div>

          {(q || site || filterPreset !== 'all' || selectedCatTab !== 'all') && (
            <button
              type="button"
              className="portal-clear-btn"
              onClick={() => {
                setQ('');
                setSite('');
                setFilterPreset('all');
                setSelectedCatTab('all');
              }}
              title={t('Reset filters', 'รีเซ็ตตัวกรอง')}
            >
              <i className="fa-solid fa-arrow-rotate-left" style={{ fontSize: '11px' }} aria-hidden="true" />
              <span>{t('Reset', 'รีเซ็ต')}</span>
            </button>
          )}

          <div className="portal-count-badge">
            <i className="fa-solid fa-layer-group" style={{ fontSize: '11px', opacity: 0.7 }} aria-hidden="true" />
            <span>
              {displayedCategories.length} {t('Categories', 'หมวดหมู่')} · {totalEquipment} {t('Assets', 'รายการ')}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Category Grid Section */}
      {loading ? (
        <div className="card text-center" style={{ padding: '60px 20px' }}>
          <p className="muted">{t('Loading equipment…', 'กำลังโหลดข้อมูลอุปกรณ์…')}</p>
        </div>
      ) : loadError ? (
        <div className="card text-center" style={{ padding: '60px 20px' }}>
          <Package size={40} className="muted" style={{ margin: '0 auto 12px' }} />
          <h3>{t('Could not load equipment', 'โหลดข้อมูลอุปกรณ์ไม่สำเร็จ')}</h3>
          <p className="muted">
            {t('Please try again in a moment.', 'กรุณาลองใหม่อีกครั้งในภายหลัง')}
          </p>
        </div>
      ) : displayedCategories.length === 0 ? (
        <div className="card text-center" style={{ padding: '60px 20px' }}>
          <Package size={40} className="muted" style={{ margin: '0 auto 12px' }} />
          <h3>{t('No categories match the filter', 'ไม่พบกลุ่มสินค้าที่ตรงกับเงื่อนไข')}</h3>
          <p className="muted">
            {t(
              'Try clearing search keywords or selecting a different preset filter.',
              'ลองล้างคำค้นหาหรือเลือกตัวกรองใหม่อีกครั้ง'
            )}
          </p>
          <button
            type="button"
            className="btn btn-primary"
            style={{ marginTop: 16 }}
            onClick={() => {
              setQ('');
              setSite('');
              setFilterPreset('all');
              setSelectedCatTab('all');
            }}
          >
            {t('Reset all filters', 'รีเซ็ตตัวกรองทั้งหมด')}
          </button>
        </div>
      ) : (
        <div className="cat-portal-grid">
          {displayedCategories.map((catData) => (
            <CategoryPortalCard
              key={catData.category}
              data={catData}
              currentSite={site}
              currentQ={q}
            />
          ))}
        </div>
      )}

      {/* QR Scanner Mock Modal */}
      {scanOpen && (
        <QRScannerMock
          open={scanOpen}
          onClose={() => setScanOpen(false)}
          onResult={(assetId: string) => {
            setScanOpen(false);
            navigate(`/portal/equipment/${assetId}`);
          }}
        />
      )}
    </div>
  );
}
