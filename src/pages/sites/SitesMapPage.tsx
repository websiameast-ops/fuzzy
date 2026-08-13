import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import L from 'leaflet';
import { AlertTriangle, ArrowLeft, ArrowRight, CalendarDays, ClipboardList, Leaf, Mail, MapPin, Package, Phone, ShieldCheck, User, Wrench, Zap } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useData } from '@/contexts/DataContext';
import { EmptyState, SearchBox, StatusBadge } from '@/components/common';
import { assetsFor } from '@/data/mockAssets';
import { computeSiteHealth, SITE_STATUS_LABEL, type SiteHealth } from '@/utils/siteHealth';
import { num } from '@/utils/format';
import { OPERATING_STATUS, REQUEST_STATUS, WARRANTY_STATUS } from '@/utils/status';

/**
 * Real-ish coordinates (lat, lng) on a free, keyless OpenStreetMap base map.
 * All sample sites sit in the eastern seaboard / EEC zone of Thailand
 * (Bangkok–Chachoengsao–Chonburi–Rayong), so the map auto-fits that zone
 * rather than a schematic scatter.
 */
const SITE_COORDS: Record<string, [number, number]> = {
  'S-RY': [12.6819, 101.1488], // Rayong Factory — อ.เมืองระยอง
  'S-BN': [13.6609, 100.6267], // Bangna Warehouse — ถ.บางนา-ตราด กม.4
  'S-CB': [13.3611, 100.9847], // Chonburi Utility Building — อ.เมืองชลบุรี
  'S-CS': [13.6904, 101.0780], // Chachoengsao Pump Station — อ.เมืองฉะเชิงเทรา
  'S-MTP': [12.6647, 101.1430], // Map Ta Phut Utility Site — นิคมมาบตาพุด
};

/**
 * Thailand focus — the initial camera frame (whole country) before fitBounds
 * zooms into the customer's installation zone.
 */
const THAILAND_CENTER: [number, number] = [14.15, 100.75];
const THAILAND_ZOOM = 6;

function healthColor(status: SiteHealth['status']) {
  if (status === 'alarm') return 'var(--se-danger)';
  if (status === 'warning') return 'var(--se-warning)';
  return 'var(--se-success)';
}

export function SitesMapPage() {
  const { lang, t } = useLang();
  const { customerCode, company } = useCompany();
  const { requests, pmVisits } = useData();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState('');
  const [panTick, setPanTick] = useState(0);

  const mapElRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});

  const assets = useMemo(() => assetsFor(customerCode), [customerCode]);
  const healths = useMemo(
    () => company.sites.map((s) => computeSiteHealth(s.id, assets, requests, pmVisits)),
    [company.sites, assets, requests, pmVisits],
  );

  const searchResults = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return [];
    return assets.filter((a) => {
      const hay = `${a.name} ${a.id} ${a.category} ${a.brand} ${a.model} ${a.location} ${a.customerRef}`.toLowerCase();
      return hay.includes(query);
    });
  }, [assets, q]);

  const selectedId = params.get('site');
  const selectedSite = selectedId ? company.sites.find((s) => s.id === selectedId) : undefined;
  const selectedHealth = selectedSite ? healths.find((h) => h.siteId === selectedSite.id) : undefined;

  const selectSite = useCallback((id: string) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('site', id);
        return next;
      },
      { replace: true },
    );
  }, [setParams]);
  const clearSelection = useCallback(() => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('site');
        return next;
      },
      { replace: true },
    );
  }, [setParams]);

  // Initialise the free OpenStreetMap (Leaflet) map once.
  useEffect(() => {
    if (!mapElRef.current || mapRef.current) return;
    const map = L.map(mapElRef.current, {
      center: THAILAND_CENTER,
      zoom: THAILAND_ZOOM,
      minZoom: 6,
      maxZoom: 18,
      zoomControl: true,
      scrollWheelZoom: true,
      // "Leaflet" prefix is optional (BSD); OpenStreetMap attribution stays (required).
      attributionControl: false,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
    L.control.attribution({ prefix: false }).addTo(map);
    // Keep the SPA panel above the map controls.
    map.setView(THAILAND_CENTER, THAILAND_ZOOM);
    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 0);
    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = {};
    };
  }, []);

  // Sync site markers + health styling, then fit the customer's zone.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !company.sites.length) return;

    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};

    const bounds = L.latLngBounds([]);
    company.sites.forEach((s) => {
      const coord = SITE_COORDS[s.id];
      if (!coord) return;
      const health = healths.find((h) => h.siteId === s.id);
      const color = health ? healthColor(health.status) : 'var(--se-muted)';
      const name = lang === 'th' ? s.nameTh : s.name;
      const label = `${s.id} · ${health ? `${health.health}%` : '—'}`;
      const selected = selectedId === s.id;

      const icon = L.divIcon({
        className: '',
        html: `<div class="site-marker${selected ? ' selected' : ''}" aria-hidden="true">
                 <span class="site-marker-pin" style="--pin:${color}"></span>
                 <span class="site-marker-badge">${health ? health.health : ''}</span>
               </div>`,
        iconSize: [40, 46],
        iconAnchor: [20, 38],
        tooltipAnchor: [0, -40],
      });

      const marker = L.marker(coord, { icon, title: name, riseOnHover: true });
      marker
        .bindTooltip(
          `<strong>${name}</strong><div class="map-tip-sub">${label}</div>`,
          { direction: 'top', offset: [0, -6], opacity: 1, permanent: false },
        )
        .on('click', () => {
          selectSite(s.id);
          setPanTick((n) => n + 1);
        });
      marker.addTo(map);
      marker.setZIndexOffset(selected ? 1000 : 0);
      markersRef.current[s.id] = marker;
      bounds.extend(coord);
    });

    if (bounds.isValid() && !(selectedId && SITE_COORDS[selectedId])) {
      // Focus on Thailand first, then frame the installation zone (eastern seaboard).
      map.setView(THAILAND_CENTER, THAILAND_ZOOM);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 10, animate: true });
    }
    setTimeout(() => map.invalidateSize(), 0);
  }, [company.sites, healths, lang, selectedId, selectSite]);

  // When a site is selected (pin click / table row / search result),
  // fly the map to focus on that pin instead of showing the whole zone.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedId) return;
    const coord = SITE_COORDS[selectedId];
    if (!coord) return;
    map.flyTo(coord, Math.max(map.getZoom(), 11), { duration: 0.7 });
  }, [selectedId, panTick]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('My Sites — Map', 'ไซต์ของฉัน — แผนที่')}</h1>
          <p className="page-sub">
            {t('Your installations on a live OpenStreetMap, colour-coded by health across the eastern Thailand zone.', 'ไซต์ติดตั้งของคุณบนแผนที่ OpenStreetMap แบบสด ระบายสีตามสถานะสุขภาพในโซนภาคตะวันออกของไทย')}
          </p>
        </div>
        <div className="page-actions">
          <SearchBox value={q} onChange={setQ} placeholder={t('Search by asset type, code, or location…', 'ค้นหาตามประเภท รหัส หรือตำแหน่งอุปกรณ์…')} />
        </div>
      </div>

      {q.trim() && (
        <div className="card" style={{ padding: 14, marginBottom: 16 }}>
          {searchResults.length === 0 ? (
            <p className="muted small" style={{ margin: 0 }}>
              {t('No equipment matches your search.', 'ไม่พบอุปกรณ์ที่ตรงกับการค้นหา')}
            </p>
          ) : (
            <>
              <p className="muted small" style={{ marginTop: 0 }}>
                {t(`${searchResults.length} match(es)`, `พบ ${searchResults.length} รายการ`)}
              </p>
              <div style={{ display: 'grid', gap: 6 }}>
                {searchResults.map((a) => {
                  const site = company.sites.find((s) => s.id === a.siteId);
                  return (
                    <button
                      key={a.id}
                      className="between"
                      style={{ padding: '8px 10px', border: '1px solid var(--se-border)', borderRadius: 8, textAlign: 'left', background: 'none', cursor: 'pointer' }}
                      onClick={() => {
                        selectSite(a.siteId);
                        setQ('');
                      }}
                    >
                      <span>
                        <span className="fw-600 small">{a.name}</span>
                        <span className="muted small" style={{ display: 'block' }}>
                          {a.id} · {a.category} · {site ? (lang === 'th' ? site.nameTh : site.name) : a.siteId} · {a.location}
                        </span>
                      </span>
                      <Link to={`/portal/equipment/${a.id}`} className="btn btn-outline btn-sm" onClick={(e) => e.stopPropagation()}>
                        {t('View asset', 'ดูอุปกรณ์')}
                      </Link>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      <div className="card map-card" style={{ padding: 0 }}>
        <div className="map-legend">
          <span className="flex" style={{ gap: 6 }}>
            <MapPin size={15} className="muted" aria-hidden />
            <span className="small fw-600">
              {t('Installation zone — eastern Thailand', 'โซนการติดตั้ง — ภาคตะวันออกของไทย')}
            </span>
          </span>
          <span className="legend-sep" aria-hidden />
          {(['normal', 'warning', 'alarm'] as const).map((s) => (
            <span key={s} className="flex" style={{ gap: 6 }}>
              <span className="legend-dot" style={{ background: healthColor(s) }} aria-hidden />
              <span className="small">{lang === 'th' ? SITE_STATUS_LABEL[s].th : SITE_STATUS_LABEL[s].en}</span>
            </span>
          ))}
        </div>
        <div className="map-wrap">
          <div ref={mapElRef} className="map-leaflet" role="region" aria-label={t('Interactive site map', 'แผนที่ไซต์แบบโต้ตอบ')} />

          {selectedSite && selectedHealth && (() => {
            const meta = SITE_STATUS_LABEL[selectedHealth.status];
            const accent = healthColor(selectedHealth.status);
            return (
              <div className="map-info-card map-info-card-v2" style={{ '--info-accent': accent } as CSSProperties}>
                <div className="map-info-ambient-glow" aria-hidden />
                <button type="button" className="map-info-close" onClick={clearSelection} aria-label={t('Close site card', 'ปิดการ์ดไซต์')}>✕</button>

                <div className="map-info-header">
                  <div className="map-info-top-tags">
                    <div className="map-info-status">
                      <span className="map-info-dot-pulse" style={{ '--dot-color': accent } as CSSProperties} aria-hidden />
                      <StatusBadge label={lang === 'th' ? meta.th : meta.en} tone={meta.tone} />
                    </div>
                    <span className="map-info-id-badge">{selectedSite.id}</span>
                  </div>
                  <div className="map-info-title" title={lang === 'th' ? selectedSite.nameTh : selectedSite.name}>
                    {lang === 'th' ? selectedSite.nameTh : selectedSite.name}
                  </div>
                </div>

                <div className="map-info-gauge-row">
                  <div className="map-info-ring-wrap" aria-hidden>
                    <svg viewBox="0 0 36 36" className="map-info-ring-svg">
                      <path
                        className="map-info-ring-bg"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="map-info-ring-fill"
                        style={{
                          stroke: accent,
                          strokeDasharray: `${(selectedHealth.health * 100) / 100}, 100`,
                        }}
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <span className="map-info-ring-pct" style={{ color: accent }}>{selectedHealth.health}%</span>
                  </div>
                  <div className="map-info-gauge-meta">
                    <span className="map-info-health-label">{t('System Health', 'สุขภาพระบบโดยรวม')}</span>
                    <span className="map-info-conn-chip">
                      {t(`${selectedHealth.connectedCount}/${selectedHealth.assetsCount} Connected`, `เชื่อมต่อ ${selectedHealth.connectedCount}/${selectedHealth.assetsCount} เครื่อง`)}
                    </span>
                  </div>
                </div>

                <div className="map-info-kpis">
                  <div className="map-info-kpi">
                    <div className="map-info-kpi-head"><Package size={13} className="muted" /><span>{t('Assets', 'อุปกรณ์')}</span></div>
                    <b>{selectedHealth.assetsCount}</b>
                  </div>
                  <div className="map-info-kpi">
                    <div className="map-info-kpi-head"><ClipboardList size={13} className="muted" /><span>{t('Tickets', 'คำขอค้าง')}</span></div>
                    <b>{selectedHealth.openTickets}</b>
                  </div>
                  <div className="map-info-kpi">
                    <div className="map-info-kpi-head"><Wrench size={13} className="muted" /><span>{t('Jobs', 'งานค้าง')}</span></div>
                    <b>{selectedHealth.openJobs}</b>
                  </div>
                  <div className="map-info-kpi">
                    <div className="map-info-kpi-head"><AlertTriangle size={13} style={{ color: selectedHealth.criticalAlarms > 0 ? 'var(--se-danger)' : undefined }} /><span>{t('Alarms', 'เตือน')}</span></div>
                    <b style={{ color: selectedHealth.criticalAlarms > 0 ? 'var(--se-danger)' : undefined }}>{selectedHealth.criticalAlarms}</b>
                  </div>
                </div>

                <div className={`map-info-alarm${selectedHealth.criticalAlarms > 0 ? ' has-alarm' : ''}`} aria-live="polite">
                  {selectedHealth.criticalAlarms > 0 && (
                    <>
                      <AlertTriangle size={14} aria-hidden />
                      <span>{t('Critical alarm active in site', 'มีสัญญาณเตือนร้ายแรงเกิดขึ้น')}</span>
                    </>
                  )}
                </div>

                <div className="map-info-actions">
                  <Link to={`/portal/map/${selectedSite.id}`} className="btn btn-primary btn-sm map-info-btn-primary">
                    {t('View full site detail', 'ดูรายละเอียดไซต์ทั้งหมด')}
                    <ArrowRight size={15} aria-hidden />
                  </Link>
                  <Link to={`/portal/equipment?site=${selectedSite.id}`} className="map-info-link">
                    <Package size={15} aria-hidden />
                    {t('Equipment at this site', 'อุปกรณ์ในไซต์นี้')}
                  </Link>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      <h3 style={{ margin: '20px 0 10px' }}>{t('All sites', 'ไซต์ทั้งหมด')}</h3>
      <div className="card table-to-cards" style={{ overflow: 'hidden' }}>
        <table className="se-table">
          <thead>
            <tr>
              <th>{t('Site', 'ไซต์')}</th>
              <th>{t('Health', 'สุขภาพระบบ')}</th>
              <th>{t('Assets', 'อุปกรณ์')}</th>
              <th>{t('Open tickets', 'คำขอค้าง')}</th>
              <th>{t('Active alarms', 'สัญญาณเตือน')}</th>
              <th aria-label={t('Actions', 'การทำงาน')} />
            </tr>
          </thead>
          <tbody>
            {company.sites.map((s) => {
              const h = healths.find((x) => x.siteId === s.id)!;
              const statusMeta = SITE_STATUS_LABEL[h.status];
              return (
                <tr key={s.id} className="row-link" onClick={() => selectSite(s.id)}>
                  <td data-label={t('Site', 'ไซต์')}>
                    <div className="fw-600">{lang === 'th' ? s.nameTh : s.name}</div>
                    <div className="muted small">{s.id}</div>
                  </td>
                  <td data-label={t('Health', 'สุขภาพระบบ')}>
                    <StatusBadge label={`${h.health}% · ${lang === 'th' ? statusMeta.th : statusMeta.en}`} tone={statusMeta.tone} />
                  </td>
                  <td data-label={t('Assets', 'อุปกรณ์')}>{h.assetsCount}</td>
                  <td data-label={t('Open tickets', 'คำขอค้าง')}>{h.openTickets}</td>
                  <td data-label={t('Active alarms', 'สัญญาณเตือน')}>{h.openAlarms}</td>
                  <td data-label={t('Actions', 'การทำงาน')}>
                    <Link to={`/portal/map/${s.id}`} className="btn btn-outline btn-sm" onClick={(e) => e.stopPropagation()}>
                      {t('View', 'ดู')}
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function SiteDetailPage() {
  const { siteId } = useParams();
  const { lang, t } = useLang();
  const { customerCode, company } = useCompany();
  const { requests, pmVisits } = useData();
  const navigate = useNavigate();

  const site = company.sites.find((s) => s.id === siteId);
  const assets = useMemo(() => assetsFor(customerCode), [customerCode]);
  const health = site ? computeSiteHealth(site.id, assets, requests, pmVisits) : undefined;

  if (!site || !health) {
    return (
      <EmptyState
        icon={<MapPin size={24} />}
        title={t('Site not found', 'ไม่พบไซต์')}
        body={t('This site may belong to another company profile.', 'ไซต์นี้อาจอยู่ในบริษัทอื่น')}
        action={<Link to="/portal/map" className="btn btn-primary btn-sm">{t('All sites', 'ไซต์ทั้งหมด')}</Link>}
      />
    );
  }

  const siteAssets = assets.filter((a) => a.siteId === site.id);
  const siteRequests = requests
    .filter((r) => r.siteId === site.id && !['completed', 'closed', 'cancelled'].includes(r.status))
    .slice(0, 6);
  const sitePM = pmVisits.filter((v) => v.siteId === site.id && v.status !== 'completed').slice(0, 6);
  const statusMeta = SITE_STATUS_LABEL[health.status];
  const accent = healthColor(health.status);
  const am = company.accountManager;
  const sc = company.serviceCoordinator;

  return (
    <div className="site-detail-container">
      <button className="btn btn-ghost btn-sm site-detail-back-btn" onClick={() => navigate('/portal/map')}>
        <ArrowLeft size={16} aria-hidden />
        {t('All sites', 'ไซต์ทั้งหมด')}
      </button>

      {/* ── Hero / overview ── */}
      <section className="site-detail-hero" style={{ '--hero-accent': accent } as CSSProperties}>
        <div className="site-detail-hero-ambient" aria-hidden />
        <div className="site-detail-hero-top">
          <div className="site-detail-hero-title">
            <div className="flex" style={{ gap: 8, alignItems: 'center' }}>
              <StatusBadge label={lang === 'th' ? statusMeta.th : statusMeta.en} tone={statusMeta.tone} />
              <span className="site-detail-id-chip">{site.id}</span>
            </div>
            <h1 className="site-detail-hero-name">{lang === 'th' ? site.nameTh : site.name}</h1>
            <div className="site-detail-hero-sub">
              {lang === 'th' ? company.nameTh : company.name}
              {company.industry ? ` · ${company.industry}` : ''}
            </div>
          </div>
          <div className="site-detail-hero-actions">
            <Link to={`/portal/equipment?site=${site.id}`} className="btn btn-outline btn-sm">
              <Package size={15} aria-hidden />
              {t('Equipment here', 'อุปกรณ์ในไซต์นี้')}
            </Link>
            <Link to={`/portal/requests/new?site=${site.id}`} className="btn btn-primary btn-sm">
              {t('Report a problem', 'แจ้งปัญหา')}
            </Link>
          </div>
        </div>

        <div className="site-detail-stats">
          <div className="site-detail-stat">
            <div className="site-detail-stat-v" style={{ color: accent }}>{health.health}%</div>
            <div className="site-detail-stat-k">{t('Health', 'สุขภาพระบบ')}</div>
          </div>
          <div className="site-detail-stat">
            <div className="site-detail-stat-v">{health.assetsCount}</div>
            <div className="site-detail-stat-k">{t('Assets', 'อุปกรณ์')} · {t(`${health.connectedCount} connected`, `เชื่อมต่อ ${health.connectedCount} ตัว`)}</div>
          </div>
          <div className="site-detail-stat">
            <div className="site-detail-stat-v">{health.openTickets}</div>
            <div className="site-detail-stat-k">{t('Open tickets', 'คำขอค้าง')}</div>
          </div>
          <div className="site-detail-stat">
            <div className="site-detail-stat-v" style={{ color: health.criticalAlarms > 0 ? 'var(--se-danger)' : undefined }}>
              {health.criticalAlarms}
            </div>
            <div className="site-detail-stat-k">{t('Critical alarms', 'สัญญาณเตือนร้ายแรง')}</div>
          </div>
          <div className="site-detail-stat">
            <div className="site-detail-stat-v">{health.openJobs}</div>
            <div className="site-detail-stat-k">{t('Open PM jobs', 'งาน PM เปิดอยู่')}</div>
          </div>
        </div>
      </section>

      {health.criticalAlarms > 0 && (
        <div className="alert-item a-red site-detail-alarm-banner">
          <AlertTriangle size={17} aria-hidden />
          <span>{t(`${health.criticalAlarms} critical alarm(s) active — see Live Monitoring for detail.`, `มีสัญญาณเตือนร้ายแรง ${health.criticalAlarms} รายการ — ดูรายละเอียดที่หน้ามอนิเตอริ่ง`)}</span>
        </div>
      )}

      {/* ── Energy & sustainability ── */}
      <div className="grid-2 site-detail-energy-grid">
        <div className="card site-detail-energy-card">
          <div className="site-detail-energy-icon energy-zap-icon">
            <Zap size={20} />
          </div>
          <div className="site-detail-energy-info">
            <span className="muted small">{t('Energy today (est.)', 'พลังงานวันนี้ (ประมาณ)')}</span>
            <div className="kpi-value">{num(health.energyTodayKwh)} <span className="muted small">kWh</span></div>
          </div>
        </div>
        <div className="card site-detail-energy-card">
          <div className="site-detail-energy-icon energy-leaf-icon">
            <Leaf size={20} />
          </div>
          <div className="site-detail-energy-info">
            <span className="muted small">{t('CO₂ avoided today (est.)', 'CO₂ ที่หลีกเลี่ยงได้วันนี้')}</span>
            <div className="kpi-value">{num(health.co2TodayKg)} <span className="muted small">kg</span></div>
          </div>
        </div>
      </div>

      {/* ── Tickets / PM / Contact ── */}
      <div className="grid-3 site-detail-columns">
        <div className="card site-detail-col">
          <div className="between site-detail-col-head">
            <h3 className="site-detail-h3">
              <span className="col-head-icon col-head-blue"><ClipboardList size={16} aria-hidden /></span>
              {t('Open tickets', 'คำขอค้าง')}
            </h3>
            <Link to="/portal/requests" className="card-link">{t('All requests', 'คำขอทั้งหมด')}</Link>
          </div>
          {siteRequests.length === 0 ? (
            <div className="site-detail-empty-col">
              <p className="muted small">{t('No open requests at this site.', 'ไม่มีคำขอค้างในไซต์นี้')}</p>
            </div>
          ) : (
            <div className="site-detail-list">
              {siteRequests.map((r) => {
                const st = REQUEST_STATUS[r.status];
                return (
                  <Link key={r.ticketNo} to={`/portal/requests/${r.ticketNo}`} className="site-detail-row">
                    <div className="row-main">
                      <div className="fw-600 small">{r.ticketNo}</div>
                      <div className="muted small line">{r.title}</div>
                    </div>
                    <StatusBadge label={lang === 'th' ? st.th : st.en} tone={st.tone} />
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="card site-detail-col">
          <div className="between site-detail-col-head">
            <h3 className="site-detail-h3">
              <span className="col-head-icon col-head-amber"><Wrench size={16} aria-hidden /></span>
              {t('Upcoming PM', 'งาน PM ที่จะถึง')}
            </h3>
            <Link to="/portal/pm" className="card-link">{t('Full schedule', 'ดูแผนทั้งหมด')}</Link>
          </div>
          {sitePM.length === 0 ? (
            <div className="site-detail-empty-col">
              <p className="muted small">{t('No upcoming PM visits at this site.', 'ไม่มีนัดหมาย PM ในไซต์นี้')}</p>
            </div>
          ) : (
            <div className="site-detail-list">
              {sitePM.map((v) => (
                <div key={v.id} className="site-detail-row">
                  <div className="row-main">
                    <div className="flex" style={{ gap: 6, alignItems: 'center' }}>
                      <span className="site-detail-date"><CalendarDays size={12} aria-hidden /> {v.date}</span>
                      <span className="muted small">{v.time}</span>
                    </div>
                    <div className="muted small line">{v.scope}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card site-detail-col">
          <div className="site-detail-col-head">
            <h3 className="site-detail-h3">
              <span className="col-head-icon col-head-green"><Phone size={16} aria-hidden /></span>
              {t('Contact & support', 'ติดต่อและดูแล')}
            </h3>
          </div>
          <div className="site-detail-contact-wrap">
            <div className="site-detail-contact-card">
              <div className="contact-card-header">
                <div className="contact-avatar-chip">
                  <ShieldCheck size={15} />
                </div>
                <div>
                  <div className="contact-role-label">{t('Account manager', 'ผู้จัดการฝ่ายลูกค้า')}</div>
                  <div className="contact-name">{am.name}</div>
                  <div className="contact-sub">{lang === 'th' && am.roleTh ? am.roleTh : am.role}</div>
                </div>
              </div>
              <div className="site-detail-contact-links">
                <a href={`tel:${am.phone}`} className="contact-btn-link"><Phone size={12} aria-hidden /> {am.phone}</a>
                <a href={`mailto:${am.email}`} className="contact-btn-link"><Mail size={12} aria-hidden /> {am.email}</a>
              </div>
            </div>

            <div className="site-detail-contact-card">
              <div className="contact-card-header">
                <div className="contact-avatar-chip">
                  <User size={15} />
                </div>
                <div>
                  <div className="contact-role-label">{t('Service coordinator', 'ผู้ประสานงานบริการ')}</div>
                  <div className="contact-name">{sc.name}</div>
                </div>
              </div>
              <div className="site-detail-contact-links">
                <a href={`tel:${sc.phone}`} className="contact-btn-link"><Phone size={12} aria-hidden /> {sc.phone}</a>
                <a href={`mailto:${sc.email}`} className="contact-btn-link"><Mail size={12} aria-hidden /> {sc.email}</a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Equipment ── */}
      <div className="between" style={{ margin: '24px 0 12px' }}>
        <h3 className="site-detail-h3" style={{ margin: 0 }}>
          <Package size={17} aria-hidden /> {t('Equipment at this site', 'อุปกรณ์ในไซต์นี้')}
          <span className="muted small"> ({siteAssets.length})</span>
        </h3>
        <Link to={`/portal/equipment?site=${site.id}`} className="card-link">{t('Browse all', 'ดูทั้งหมด')}</Link>
      </div>

      {siteAssets.length === 0 ? (
        <p className="muted small">{t('No equipment registered at this site.', 'ยังไม่มีอุปกรณ์ที่ลงทะเบียนในไซต์นี้')}</p>
      ) : (
        <div className="grid-3 site-detail-assets-grid">
          {siteAssets.map((a) => {
            const op = OPERATING_STATUS[a.status];
            const w = WARRANTY_STATUS[a.warranty];
            return (
              <Link key={a.id} to={`/portal/equipment/${a.id}`} className="card site-detail-asset">
                <div className="between" style={{ marginBottom: 8 }}>
                  <span className={`status-indicator status-${op.tone === 'red' ? 'red' : op.tone === 'amber' ? 'amber' : 'green'}`} aria-hidden />
                  {a.connected && <span className="badge t-blue">{t('IoT', 'IoT')}</span>}
                </div>
                <div className="fw-600 small">{a.name}</div>
                <div className="muted small">{a.id} · {a.category} · {a.brand}</div>
                <div className="flex" style={{ gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                  <StatusBadge label={lang === 'th' ? op.th : op.en} tone={op.tone} />
                  {a.warranty !== 'active' && <StatusBadge label={lang === 'th' ? w.th : w.en} tone={w.tone} />}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
