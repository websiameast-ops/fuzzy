import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet.markercluster';
import { AlertTriangle, ArrowLeft, ArrowRight, ClipboardList, MapPin, Package, Phone, Wrench } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { ContactSECard, EmptyState, SearchBox, StatusBadge } from '@/components/common';
import { OPERATING_STATUS, TICKET_STATUS } from '@/utils/status';
import type { OperatingStatus } from '@/types';
import {
  apiGetMapSites,
  apiGetSEContacts,
  apiGetTicketHistory,
  type MapSiteResponse,
  type SEContactResponse,
  type ServiceHistoryResponse,
} from '@/lib/apiClient';
import { tokenStore } from '@/lib/tokenStore';

/**
 * Thailand focus — the initial camera frame (whole country) before fitBounds
 * zooms into the customer's installation zone.
 */
const THAILAND_CENTER: [number, number] = [14.15, 100.75];
const THAILAND_ZOOM = 6;

/**
 * AssetUnit-grain GPS points have no per-site master colour, so pins are
 * colour-coded by hashing the (raw, free-text) site label into a fixed
 * palette — good enough to tell "same site" apart at a glance, per the
 * product call ("any colour works, just show which site it belongs to").
 */
const SITE_PALETTE = ['#2f6fed', '#e0a72e', '#2fb380', '#e2574c', '#8c5ce0', '#0fa3b1', '#d6478c', '#5b8c00'];

function siteColor(site: string) {
  let hash = 0;
  for (let i = 0; i < site.length; i += 1) hash = (hash * 31 + site.charCodeAt(i)) >>> 0;
  return SITE_PALETTE[hash % SITE_PALETTE.length];
}

/** Per-pin data the cluster icon needs (read back via `getAllChildMarkers()`). */
type SiteMarker = L.Marker & { meta: { site: string; count: number } };

export function SitesMapPage() {
  const { lang, t } = useLang();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState('');
  const [panTick, setPanTick] = useState(0);
  const [mapSites, setMapSites] = useState<MapSiteResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const mapElRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);

  useEffect(() => {
    const accessToken = tokenStore.read()?.accessToken;
    if (!accessToken) return;
    setLoading(true);
    setLoadError(false);
    apiGetMapSites(accessToken)
      .then(setMapSites)
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, []);

  // One entry per AssetUnit GPS point, tagged with its parent site — the
  // backend returns points nested under sites, but markers/search work
  // over the flattened list.
  const allPoints = useMemo(
    () => mapSites.flatMap((s) => s.points.map((p) => ({ ...p, site: s.site }))),
    [mapSites],
  );

  // Many AssetUnits share the exact same gps_location (one building, many
  // units) — one pin per exact coordinate is enough; the pin's badge shows
  // how many units it represents instead of spreading them into separate,
  // visually noisy pins. The group key includes `site`, not just the
  // coordinate — two different (mistyped-vs-correct) site names can
  // coincidentally share a coordinate, and merging those would silently
  // misattribute one site's count onto the other's pin.
  const visualPoints = useMemo(() => {
    const groups = new Map<string, typeof allPoints>();
    allPoints.forEach((p) => {
      const key = `${p.site}|${p.lat.toFixed(6)},${p.lng.toFixed(6)}`;
      const group = groups.get(key);
      if (group) group.push(p);
      else groups.set(key, [p]);
    });

    return Array.from(groups.values(), (group) => ({ ...group[0], count: group.length }));
  }, [allPoints]);

  const searchResults = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return [];
    return allPoints.filter((p) => `${p.nameEn} ${p.nameTh} ${p.assetId} ${p.site}`.toLowerCase().includes(query));
  }, [allPoints, q]);

  const selectedSiteId = params.get('site');
  const selectedSite = selectedSiteId ? mapSites.find((s) => s.site === selectedSiteId) : undefined;

  const selectSite = useCallback((site: string) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('site', site);
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
      clusterRef.current = null;
    };
  }, []);

  // Sync one marker per AssetUnit GPS point, coloured by parent site, then
  // fit the whole zone (or the selected site's points, see effect below).
  // Nearby pins collapse into numbered cluster circles. The cluster group is
  // rebuilt on every run (like the markers always were) so its icon factory
  // closes over the current selection instead of a stale one.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    clusterRef.current?.remove();
    const cluster = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      iconCreateFunction: (c) => {
        const children = c.getAllChildMarkers() as SiteMarker[];
        const sites = new Set(children.map((m) => m.meta.site));
        // Same unit as the single-pin badge: equipment count, not pin count.
        const equipment = children.reduce((sum, m) => sum + m.meta.count, 0);
        const size = children.length < 10 ? 'sm' : children.length < 50 ? 'md' : 'lg';
        const px = { sm: 38, md: 46, lg: 54 }[size];
        const color = sites.size === 1 ? siteColor(children[0].meta.site) : 'var(--se-primary)';
        const dimmed = !!selectedSiteId && !sites.has(selectedSiteId);
        return L.divIcon({
          className: '',
          html: `<div class="site-cluster site-cluster-${size}${dimmed ? ' dimmed' : ''}" style="--pin:${color}" aria-hidden="true"><span>${equipment}</span></div>`,
          iconSize: [px, px],
        });
      },
    });
    const markers: SiteMarker[] = [];

    const bounds = L.latLngBounds([]);
    visualPoints.forEach((p) => {
      const color = siteColor(p.site);
      const dimmed = Boolean(selectedSiteId) && p.site !== selectedSiteId;
      const name = lang === 'th' ? p.nameTh : p.nameEn;
      const tooltipTitle = p.count > 1
        ? t(`${p.count} equipment`, `${p.count} รายการอุปกรณ์`)
        : name;

      const icon = L.divIcon({
        className: '',
        html: `<div class="site-marker${dimmed ? ' dimmed' : ''}${!dimmed && selectedSiteId ? ' selected' : ''}" aria-hidden="true">
                 <span class="site-marker-pin" style="--pin:${color}"></span>
                 <span class="site-marker-badge">${p.count}</span>
               </div>`,
        iconSize: [40, 46],
        iconAnchor: [20, 38],
        tooltipAnchor: [0, -40],
      });

      const marker = L.marker([p.lat, p.lng], { icon, title: tooltipTitle, riseOnHover: true }) as SiteMarker;
      marker.meta = { site: p.site, count: p.count };
      marker
        .bindTooltip(
          `<strong>${tooltipTitle}</strong><div class="map-tip-sub">${p.site}</div>`,
          { direction: 'top', offset: [0, -6], opacity: 1, permanent: false },
        )
        .on('click', () => {
          selectSite(p.site);
          setPanTick((n) => n + 1);
        });
      marker.setZIndexOffset(dimmed ? 0 : 1000);
      markers.push(marker);
      if (!dimmed) bounds.extend([p.lat, p.lng]);
    });
    cluster.addLayers(markers);
    map.addLayer(cluster);
    clusterRef.current = cluster;

    // Only auto-frame the whole zone when nothing is selected — the
    // fly-to-bounds effect below handles framing the selected site.
    if (!selectedSiteId && bounds.isValid()) {
      map.setView(THAILAND_CENTER, THAILAND_ZOOM);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 10, animate: true });
    }
    setTimeout(() => map.invalidateSize(), 0);
  }, [visualPoints, lang, selectedSiteId, selectSite]);

  // When a site is selected (pin click / table row / search result), fly
  // the map to frame every GPS point that belongs to it — not just one pin.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedSiteId) return;
    const sitePoints = visualPoints.filter((p) => p.site === selectedSiteId);
    if (!sitePoints.length) return;
    const bounds = L.latLngBounds(sitePoints.map((p) => [p.lat, p.lng] as [number, number]));
    map.flyToBounds(bounds, { padding: [80, 80], maxZoom: 18, duration: 0.7 });
  }, [selectedSiteId, visualPoints, panTick]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('My Sites — Map', 'ไซต์ของฉัน — แผนที่')}</h1>
          <p className="page-sub">
            {t('Your equipment locations on a live OpenStreetMap, grouped by site.', 'ตำแหน่งอุปกรณ์ของคุณบนแผนที่ OpenStreetMap แบบสด จัดกลุ่มตามไซต์')}
          </p>
        </div>
        <div className="page-actions">
          <SearchBox value={q} onChange={setQ} placeholder={t('Search by equipment name, code, or site…', 'ค้นหาตามชื่ออุปกรณ์ รหัส หรือไซต์…')} />
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
                {searchResults.map((p) => (
                  <button
                    key={p.unitId}
                    className="between"
                    style={{ padding: '8px 10px', border: '1px solid var(--se-border)', borderRadius: 8, textAlign: 'left', background: 'none', cursor: 'pointer' }}
                    onClick={() => {
                      selectSite(p.site);
                      setQ('');
                    }}
                  >
                    <span>
                      <span className="fw-600 small">{lang === 'th' ? p.nameTh : p.nameEn}</span>
                      <span className="muted small" style={{ display: 'block' }}>
                        {p.assetId} · {p.site}
                      </span>
                    </span>
                    <Link to={`/portal/equipment/${encodeURIComponent(p.assetId)}?unitId=${encodeURIComponent(p.unitId)}`} className="btn btn-outline btn-sm" onClick={(e) => e.stopPropagation()}>
                      {t('View asset', 'ดูอุปกรณ์')}
                    </Link>
                  </button>
                ))}
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
              {t('Equipment locations', 'ตำแหน่งอุปกรณ์')}
            </span>
          </span>
          <span className="legend-sep" aria-hidden />
          <span className="small muted">
            {t('Pin colour = site grouping · nearby pins merge into a numbered circle, click to zoom in · click a pin or a site row to focus it', 'สีของหมุด = การจัดกลุ่มตามไซต์ · หมุดที่อยู่ใกล้กันรวมเป็นวงกลมตัวเลข คลิกเพื่อซูมเข้า · คลิกหมุดหรือแถวไซต์เพื่อโฟกัส')}
          </span>
        </div>
        <div className="map-wrap">
          <div ref={mapElRef} className="map-leaflet" role="region" aria-label={t('Interactive site map', 'แผนที่ไซต์แบบโต้ตอบ')} />

          {loading && (
            <div className="map-info-card" style={{ padding: 16 }}>
              <p className="muted small" style={{ margin: 0 }}>{t('Loading sites…', 'กำลังโหลดไซต์…')}</p>
            </div>
          )}
          {!loading && loadError && (
            <div className="map-info-card" style={{ padding: 16 }}>
              <p className="muted small" style={{ margin: 0 }}>{t('Could not load site data.', 'โหลดข้อมูลไซต์ไม่สำเร็จ')}</p>
            </div>
          )}

          {selectedSite && (() => {
            const accent = selectedSite.pendingRequests > 0 ? 'var(--se-warning)' : 'var(--se-success)';
            return (
              <div className="map-info-card map-info-card-v2" style={{ '--info-accent': accent } as CSSProperties}>
                <div className="map-info-ambient-glow" aria-hidden />
                <button type="button" className="map-info-close" onClick={clearSelection} aria-label={t('Close site card', 'ปิดการ์ดไซต์')}>✕</button>

                <div className="map-info-header">
                  <div className="map-info-top-tags">
                    <div className="map-info-status">
                      <span className="map-info-dot-pulse" style={{ '--dot-color': accent } as CSSProperties} aria-hidden />
                      <StatusBadge
                        label={selectedSite.pendingRequests > 0 ? t('Pending requests', 'มีคำขอค้าง') : t('No pending requests', 'ไม่มีคำขอค้าง')}
                        tone={selectedSite.pendingRequests > 0 ? 'amber' : 'green'}
                      />
                    </div>
                  </div>
                  <div className="map-info-title" title={selectedSite.site}>
                    {selectedSite.site}
                  </div>
                </div>

                <div className="map-info-gauge-row">
                  <div className="map-info-ring-wrap" aria-hidden>
                    <svg viewBox="0 0 36 36" className="map-info-ring-svg">
                      <path
                        className="map-info-ring-bg"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <span className="map-info-ring-pct muted">—</span>
                  </div>
                  <div className="map-info-gauge-meta">
                    <span className="map-info-health-label">{t('System Health', 'สุขภาพระบบโดยรวม')}</span>
                    <span className="map-info-conn-chip muted">
                      {t('No connectivity data yet', 'ยังไม่มีข้อมูลการเชื่อมต่อ')}
                    </span>
                  </div>
                </div>

                <div className="map-info-kpis">
                  <div className="map-info-kpi">
                    <div className="map-info-kpi-head"><Package size={13} className="muted" /><span>{t('Assets', 'อุปกรณ์')}</span></div>
                    <b>{selectedSite.equipmentCount}</b>
                  </div>
                  <div className="map-info-kpi">
                    <div className="map-info-kpi-head"><ClipboardList size={13} className="muted" /><span>{t('Tickets', 'คำขอค้าง')}</span></div>
                    <b>{selectedSite.pendingRequests}</b>
                  </div>
                  <div className="map-info-kpi">
                    <div className="map-info-kpi-head"><Wrench size={13} className="muted" /><span>{t('Jobs', 'งานค้าง')}</span></div>
                    <b className="muted">—</b>
                  </div>
                  <div className="map-info-kpi">
                    <div className="map-info-kpi-head"><AlertTriangle size={13} className="muted" /><span>{t('Alarms', 'เตือน')}</span></div>
                    <b className="muted">—</b>
                  </div>
                </div>

                {/* Reserved alert slot — no alarm data source yet, kept empty so the
                    card height matches the original design once alarms are wired up. */}
                <div className="map-info-alarm" aria-live="polite" />

                <div className="map-info-actions">
                  <Link to={`/portal/map/${encodeURIComponent(selectedSite.site)}`} className="btn btn-primary btn-sm map-info-btn-primary">
                    {t('View full site detail', 'ดูรายละเอียดไซต์ทั้งหมด')}
                    <ArrowRight size={15} aria-hidden />
                  </Link>
                  <Link to={`/portal/equipment?site=${encodeURIComponent(selectedSite.site)}`} className="map-info-link">
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
              <th>{t('Mapped points', 'จุดที่ปักหมุด')}</th>
              <th aria-label={t('Actions', 'การทำงาน')} />
            </tr>
          </thead>
          <tbody>
            {mapSites.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <p className="muted small" style={{ margin: '12px 0' }}>
                    {loading ? t('Loading…', 'กำลังโหลด…') : t('No sites found.', 'ไม่พบไซต์')}
                  </p>
                </td>
              </tr>
            ) : (
              mapSites.map((s) => (
                <tr key={s.site} className="row-link" onClick={() => selectSite(s.site)}>
                  <td data-label={t('Site', 'ไซต์')}>
                    <div className="fw-600">{s.site}</div>
                    {s.assetCodes.length > 0 && (
                      <div className="flex" style={{ gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                        {s.assetCodes.map((ac) => (
                          <span key={ac.assetCode} className="badge t-grey" style={{ fontSize: 11, padding: '2px 7px' }}>
                            {ac.assetCode} ×{ac.count}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td data-label={t('Health', 'สุขภาพระบบ')}>
                    <span className="muted">—</span>
                  </td>
                  <td data-label={t('Assets', 'อุปกรณ์')}>{s.equipmentCount}</td>
                  <td data-label={t('Open tickets', 'คำขอค้าง')}>{s.pendingRequests}</td>
                  <td data-label={t('Active alarms', 'สัญญาณเตือน')}>
                    <span className="muted">—</span>
                  </td>
                  <td data-label={t('Mapped points', 'จุดที่ปักหมุด')}>{s.points.length}</td>
                  <td data-label={t('Actions', 'การทำงาน')}>
                    <Link to={`/portal/equipment?site=${encodeURIComponent(s.site)}`} className="btn btn-outline btn-sm" onClick={(e) => e.stopPropagation()}>
                      {t('View', 'ดู')}
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function SiteDetailPage() {
  const { siteId: rawSiteId } = useParams();
  const siteId = rawSiteId ? decodeURIComponent(rawSiteId) : undefined;
  const { lang, t } = useLang();
  const navigate = useNavigate();

  const [mapSites, setMapSites] = useState<MapSiteResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<ServiceHistoryResponse[]>([]);
  const [seContacts, setSeContacts] = useState<SEContactResponse[] | null>(null);

  useEffect(() => {
    const accessToken = tokenStore.read()?.accessToken;
    if (!accessToken) return;
    setLoading(true);
    apiGetMapSites(accessToken).then(setMapSites).finally(() => setLoading(false));
    apiGetSEContacts(accessToken).then(setSeContacts).catch(() => {});
  }, []);

  const site = siteId ? mapSites.find((s) => s.site === siteId) : undefined;

  useEffect(() => {
    const accessToken = tokenStore.read()?.accessToken;
    if (!accessToken || !site) return;
    let ignore = false;
    apiGetTicketHistory(accessToken, { site: site.site, status: 'open', size: 6 })
      .then((res) => {
        if (!ignore) setTickets(res.items);
      })
      .catch(() => {});
    return () => {
      ignore = true;
    };
  }, [site?.site]);

  if (loading) {
    return <p className="muted small">{t('Loading site…', 'กำลังโหลดไซต์…')}</p>;
  }

  if (!site) {
    return (
      <EmptyState
        icon={<MapPin size={24} />}
        title={t('Site not found', 'ไม่พบไซต์')}
        body={t('This site may belong to another company profile.', 'ไซต์นี้อาจอยู่ในบริษัทอื่น')}
        action={<Link to="/portal/map" className="btn btn-primary btn-sm">{t('All sites', 'ไซต์ทั้งหมด')}</Link>}
      />
    );
  }

  const accent = site.pendingRequests > 0 ? 'var(--se-warning)' : 'var(--se-success)';

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
            <StatusBadge
              label={site.pendingRequests > 0 ? t('Pending requests', 'มีคำขอค้าง') : t('No pending requests', 'ไม่มีคำขอค้าง')}
              tone={site.pendingRequests > 0 ? 'amber' : 'green'}
            />
            <h1 className="site-detail-hero-name">{site.site}</h1>
            {site.assetCodes.length > 0 && (
              <div className="flex" style={{ gap: 4, flexWrap: 'wrap', marginTop: 8 }}>
                {site.assetCodes.map((ac) => (
                  <span key={ac.assetCode} className="badge t-grey" style={{ fontSize: 11, padding: '2px 7px' }}>
                    {ac.assetCode} ×{ac.count}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="site-detail-hero-actions">
            <Link to={`/portal/equipment?site=${encodeURIComponent(site.site)}`} className="btn btn-outline btn-sm">
              <Package size={15} aria-hidden />
              {t('Equipment here', 'อุปกรณ์ในไซต์นี้')}
            </Link>
          </div>
        </div>

        <div className="site-detail-stats">
          <div className="site-detail-stat">
            <div className="site-detail-stat-v">{site.equipmentCount}</div>
            <div className="site-detail-stat-k">{t('Assets', 'อุปกรณ์')}</div>
          </div>
          <div className="site-detail-stat">
            <div className="site-detail-stat-v" style={{ color: site.pendingRequests > 0 ? accent : undefined }}>{site.pendingRequests}</div>
            <div className="site-detail-stat-k">{t('Open tickets', 'คำขอค้าง')}</div>
          </div>
          <div className="site-detail-stat">
            <div className="site-detail-stat-v">{site.points.length}</div>
            <div className="site-detail-stat-k">{t('Mapped points', 'จุดที่ปักหมุด')}</div>
          </div>
        </div>
      </section>

      {/* ── Tickets / Contact ── */}
      <div className="grid-2 site-detail-columns">
        <div className="card site-detail-col">
          <div className="between site-detail-col-head">
            <h3 className="site-detail-h3">
              <span className="col-head-icon col-head-blue"><ClipboardList size={16} aria-hidden /></span>
              {t('Open tickets', 'คำขอค้าง')}
            </h3>
            <Link to="/portal/requests" className="card-link">{t('All requests', 'คำขอทั้งหมด')}</Link>
          </div>
          {tickets.length === 0 ? (
            <div className="site-detail-empty-col">
              <p className="muted small">{t('No open tickets at this site.', 'ไม่มีคำขอค้างในไซต์นี้')}</p>
            </div>
          ) : (
            <div className="site-detail-list">
              {tickets.map((r) => {
                const st = TICKET_STATUS[r.status];
                return (
                  <Link key={r.ticketNo} to={`/portal/requests/${encodeURIComponent(r.ticketNo)}`} className="site-detail-row">
                    <div className="row-main">
                      <div className="fw-600 small">{r.ticketNo}</div>
                      <div className="muted small line">{r.description}</div>
                    </div>
                    <StatusBadge label={lang === 'th' ? st.th : st.en} tone={st.tone} />
                  </Link>
                );
              })}
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
            {seContacts && seContacts.length === 0 ? (
              <p className="muted small" style={{ margin: 0 }}>{t('No SE contacts yet.', 'ยังไม่มีข้อมูลผู้ติดต่อ SE')}</p>
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
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Equipment ── */}
      <div className="between" style={{ margin: '24px 0 12px' }}>
        <h3 className="site-detail-h3" style={{ margin: 0 }}>
          <Package size={17} aria-hidden /> {t('Equipment at this site', 'อุปกรณ์ในไซต์นี้')}
          <span className="muted small"> ({site.points.length})</span>
        </h3>
        <Link to={`/portal/equipment?site=${encodeURIComponent(site.site)}`} className="card-link">{t('Browse all', 'ดูทั้งหมด')}</Link>
      </div>

      {site.points.length === 0 ? (
        <p className="muted small">{t('No mapped equipment at this site.', 'ยังไม่มีอุปกรณ์ที่ปักหมุดในไซต์นี้')}</p>
      ) : (
        <div className="grid-3 site-detail-assets-grid">
          {site.points.map((p) => {
            const op = OPERATING_STATUS[p.status as OperatingStatus] ?? { en: p.status, th: p.status, tone: 'grey' as const };
            const name = lang === 'th' ? p.nameTh : p.nameEn;
            return (
              <Link key={p.unitId} to={`/portal/equipment/${encodeURIComponent(p.assetId)}?unitId=${encodeURIComponent(p.unitId)}`} className="card site-detail-asset">
                <div className="between" style={{ marginBottom: 8 }}>
                  <span className={`status-indicator status-${op.tone === 'red' ? 'red' : op.tone === 'amber' ? 'amber' : 'green'}`} aria-hidden />
                </div>
                <div className="fw-600 small">{name}</div>
                <div className="muted small">
                  {p.assetId}
                  {p.serialNo ? ` · ${p.serialNo}` : ''}
                  {p.position ? ` · ${p.position}` : ''}
                </div>
                <div className="flex" style={{ gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                  <StatusBadge label={lang === 'th' ? op.th : op.en} tone={op.tone} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
