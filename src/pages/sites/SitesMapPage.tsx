import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import L from 'leaflet';
import { AlertTriangle, ArrowLeft, ClipboardList, Gauge, Leaf, MapPin, Package, Wrench, Zap } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useData } from '@/contexts/DataContext';
import { EmptyState, SearchBox, StatusBadge } from '@/components/common';
import { assetsFor } from '@/data/mockAssets';
import { computeSiteHealth, SITE_STATUS_LABEL, type SiteHealth } from '@/utils/siteHealth';
import { num } from '@/utils/format';
import type { Site } from '@/types';

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

/** Same basename the router uses, so popup links survive sub-path deploys. */
const APP_BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

function healthColor(status: SiteHealth['status']) {
  if (status === 'alarm') return 'var(--se-danger)';
  if (status === 'warning') return 'var(--se-warning)';
  return 'var(--se-success)';
}

function Site360Panel({ site, health, onClose }: { site: Site; health: SiteHealth; onClose: () => void }) {
  const { lang, t } = useLang();
  const statusMeta = SITE_STATUS_LABEL[health.status];

  return (
    <div className="card" style={{ padding: 18 }}>
      <div className="between" style={{ alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div className="fw-600" style={{ fontSize: 16 }}>{lang === 'th' ? site.nameTh : site.name}</div>
          <div className="muted small">{site.id}</div>
        </div>
        <div className="flex" style={{ gap: 8 }}>
          <StatusBadge label={lang === 'th' ? statusMeta.th : statusMeta.en} tone={statusMeta.tone} />
          <button className="icon-btn tiny" onClick={onClose} aria-label={t('Close panel', 'ปิดแผง')}>✕</button>
        </div>
      </div>

      <div className="grid-4" style={{ gap: 8, marginBottom: 12 }}>
        <div className="stat-tile"><div className="v">{health.health}%</div><div className="k">{t('Health', 'สุขภาพระบบ')}</div></div>
        <div className="stat-tile"><div className="v">{health.assetsCount}</div><div className="k">{t('Assets', 'อุปกรณ์')}</div></div>
        <div className="stat-tile"><div className="v">{health.openTickets}</div><div className="k">{t('Open tickets', 'คำขอค้าง')}</div></div>
        <div className="stat-tile"><div className="v">{health.openJobs}</div><div className="k">{t('Open jobs', 'งานค้าง')}</div></div>
      </div>

      {health.criticalAlarms > 0 && (
        <div className="alert-item a-red" style={{ marginBottom: 12 }}>
          <AlertTriangle size={16} aria-hidden />
          <span className="small">{t(`${health.criticalAlarms} critical alarm(s) active at this site.`, `มีสัญญาณเตือนร้ายแรง ${health.criticalAlarms} รายการที่ไซต์นี้`)}</span>
        </div>
      )}

      <div className="stat-line"><span className="k">{t('Connected assets', 'อุปกรณ์ที่เชื่อมต่อ')}</span><span className="v">{health.connectedCount} / {health.assetsCount}</span></div>
      <div className="stat-line"><span className="k">{t('Active alarms', 'สัญญาณเตือนที่มีผล')}</span><span className="v">{health.openAlarms}</span></div>
      <div className="stat-line"><span className="k">{t('Energy today (est.)', 'พลังงานวันนี้ (ประมาณ)')}</span><span className="v">{num(health.energyTodayKwh)} kWh</span></div>
      <div className="stat-line"><span className="k">{t('CO₂ avoided today (est.)', 'CO₂ ที่หลีกเลี่ยงได้วันนี้ (ประมาณ)')}</span><span className="v">{num(health.co2TodayKg)} kg</span></div>

      <div className="flex" style={{ gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
        <Link to={`/portal/map/${site.id}`} className="btn btn-primary btn-sm">{t('View full site detail', 'ดูรายละเอียดไซต์ทั้งหมด')}</Link>
        <Link to={`/portal/equipment?site=${site.id}`} className="btn btn-outline btn-sm">{t('Equipment at this site', 'อุปกรณ์ในไซต์นี้')}</Link>
      </div>
    </div>
  );
}

export function SitesMapPage() {
  const { lang, t } = useLang();
  const { customerCode, company } = useCompany();
  const { requests, pmVisits } = useData();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState('');

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
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
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
        html: `<div class="site-marker${selected ? ' selected' : ''}" style="--pin:${color}" aria-hidden="true"><span></span></div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        tooltipAnchor: [0, -16],
      });

      const marker = L.marker(coord, { icon, title: name, riseOnHover: true });
      marker
        .bindTooltip(
          `<strong>${name}</strong><div class="map-tip-sub">${label}</div>`,
          { direction: 'top', offset: [0, -14], opacity: 1, permanent: false },
        )
        .bindPopup(
          `<div class="map-popup">
             <div class="map-popup-title">${name}</div>
             <div class="map-popup-sub">${s.id} · ${health ? SITE_STATUS_LABEL[health.status].en : '—'}</div>
             <div class="map-popup-health">${health ? `${health.health}% · ${health.assetsCount} assets` : '—'}</div>
             <a class="map-popup-btn" href="${APP_BASE}/portal/map/${s.id}">${lang === 'th' ? 'ดูรายละเอียดไซต์' : 'View full site detail'}</a>
           </div>`,
          { closeButton: true, offset: [0, -10] },
        )
        .on('click', () => selectSite(s.id));
      marker.addTo(map);
      markersRef.current[s.id] = marker;
      bounds.extend(coord);
    });

    if (bounds.isValid()) {
      // Focus on Thailand first, then frame the installation zone (eastern seaboard).
      map.setView(THAILAND_CENTER, THAILAND_ZOOM);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 10, animate: true });
    }
    setTimeout(() => map.invalidateSize(), 0);
  }, [company.sites, healths, lang, selectedId, selectSite]);

  // Re-open the panel + popup when a site is targeted from the table/search.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (selectedId && markersRef.current[selectedId]) {
      markersRef.current[selectedId].openPopup();
    }
  }, [selectedId]);

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
        <div ref={mapElRef} className="map-leaflet" role="region" aria-label={t('Interactive site map', 'แผนที่ไซต์แบบโต้ตอบ')} />
      </div>

      {selectedSite && selectedHealth && (
        <div style={{ marginTop: 16 }}>
          <Site360Panel site={selectedSite} health={selectedHealth} onClose={clearSelection} />
        </div>
      )}

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

  return (
    <div>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/portal/map')} style={{ marginBottom: 12, marginLeft: -8 }}>
        <ArrowLeft size={16} aria-hidden />
        {t('All sites', 'ไซต์ทั้งหมด')}
      </button>

      <div className="page-header">
        <div>
          <h1 className="page-title">{lang === 'th' ? site.nameTh : site.name}</h1>
          <p className="page-sub">{site.id} · {lang === 'th' ? company.nameTh : company.name}</p>
          <div className="flex" style={{ gap: 6, marginTop: 8 }}>
            <StatusBadge label={lang === 'th' ? statusMeta.th : statusMeta.en} tone={statusMeta.tone} />
          </div>
        </div>
        <div className="page-actions">
          <Link to={`/portal/equipment?site=${site.id}`} className="btn btn-outline">
            <Package size={16} aria-hidden />
            {t('Equipment here', 'อุปกรณ์ในไซต์นี้')}
          </Link>
          <Link to={`/portal/requests/new?site=${site.id}`} className="btn btn-primary">
            {t('Report a problem', 'แจ้งปัญหา')}
          </Link>
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom: 16 }}>
        <div className="card" style={{ padding: 16 }}>
          <div className="flex" style={{ gap: 8 }}><Gauge size={16} className="muted" aria-hidden /><span className="muted small">{t('Health', 'สุขภาพระบบ')}</span></div>
          <div className="kpi-value" style={{ fontSize: 20 }}>{health.health}%</div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div className="flex" style={{ gap: 8 }}><Package size={16} className="muted" aria-hidden /><span className="muted small">{t('Assets', 'อุปกรณ์')}</span></div>
          <div className="kpi-value" style={{ fontSize: 20 }}>{health.assetsCount}</div>
          <div className="muted small">{t(`${health.connectedCount} connected`, `เชื่อมต่อ ${health.connectedCount}`)}</div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div className="flex" style={{ gap: 8 }}><Zap size={16} className="muted" aria-hidden /><span className="muted small">{t('Energy today (est.)', 'พลังงานวันนี้ (ประมาณ)')}</span></div>
          <div className="kpi-value" style={{ fontSize: 20 }}>{num(health.energyTodayKwh)} kWh</div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div className="flex" style={{ gap: 8 }}><Leaf size={16} className="muted" aria-hidden /><span className="muted small">{t('CO₂ avoided today (est.)', 'CO₂ ที่หลีกเลี่ยงได้วันนี้')}</span></div>
          <div className="kpi-value" style={{ fontSize: 20 }}>{num(health.co2TodayKg)} kg</div>
        </div>
      </div>

      {health.criticalAlarms > 0 && (
        <div className="alert-item a-red" style={{ marginBottom: 16 }}>
          <AlertTriangle size={17} aria-hidden />
          <span>{t(`${health.criticalAlarms} critical alarm(s) active — see Live Monitoring for detail.`, `มีสัญญาณเตือนร้ายแรง ${health.criticalAlarms} รายการ — ดูรายละเอียดที่หน้ามอนิเตอริ่ง`)}</span>
        </div>
      )}

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <div className="card" style={{ padding: 18 }}>
          <div className="between" style={{ marginBottom: 8 }}>
            <h3 style={{ margin: 0 }}><ClipboardList size={17} aria-hidden style={{ verticalAlign: -3 }} /> {t('Open tickets at this site', 'คำขอที่ค้างอยู่ในไซต์นี้')}</h3>
            <Link to="/portal/requests" className="card-link">{t('All requests', 'คำขอทั้งหมด')}</Link>
          </div>
          {siteRequests.length === 0 ? (
            <p className="muted small">{t('No open requests at this site.', 'ไม่มีคำขอค้างในไซต์นี้')}</p>
          ) : (
            siteRequests.map((r) => (
              <Link key={r.ticketNo} to={`/portal/requests/${r.ticketNo}`} className="between" style={{ padding: '8px 0', borderBottom: '1px dashed var(--se-border)', textDecoration: 'none', color: 'inherit' }}>
                <span className="small">{r.ticketNo} · {r.title}</span>
              </Link>
            ))
          )}
        </div>
        <div className="card" style={{ padding: 18 }}>
          <div className="between" style={{ marginBottom: 8 }}>
            <h3 style={{ margin: 0 }}><Wrench size={17} aria-hidden style={{ verticalAlign: -3 }} /> {t('Upcoming PM at this site', 'งาน PM ที่กำลังจะถึงในไซต์นี้')}</h3>
            <Link to="/portal/pm" className="card-link">{t('Full schedule', 'ดูแผนทั้งหมด')}</Link>
          </div>
          {sitePM.length === 0 ? (
            <p className="muted small">{t('No upcoming PM visits at this site.', 'ไม่มีนัดหมาย PM ในไซต์นี้')}</p>
          ) : (
            sitePM.map((v) => (
              <div key={v.id} className="small" style={{ padding: '8px 0', borderBottom: '1px dashed var(--se-border)' }}>
                {v.date} · {v.time} — {v.scope}
              </div>
            ))
          )}
        </div>
      </div>

      <h3 style={{ margin: '20px 0 10px' }}>{t('Equipment at this site', 'อุปกรณ์ในไซต์นี้')}</h3>
      <div className="grid-3">
        {siteAssets.map((a) => (
          <Link key={a.id} to={`/portal/equipment/${a.id}`} className="card" style={{ padding: 14, textDecoration: 'none', color: 'inherit' }}>
            <div className="fw-600 small">{a.name}</div>
            <div className="muted small">{a.id} · {a.category}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
