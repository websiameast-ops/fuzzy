import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Droplet, Info, LayoutGrid, Leaf, Map as MapIcon, Package, Radio, Sun, Zap } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useLang } from '@/contexts/LanguageContext';
import { useCompany } from '@/contexts/CompanyContext';
import { EmptyState, StatusBadge } from '@/components/common';
import { assetsFor } from '@/data/mockAssets';
import { num } from '@/utils/format';
import type { Asset } from '@/types';

const CATEGORY_ICON: Record<string, typeof Sun> = {
  'Solar & Energy': Sun,
  Pump: Droplet,
  Valve: Package,
  'Metering & Instrumentation': Zap,
  'Monitoring & IoT': Radio,
};

const CATEGORY_COLOR: Record<string, string> = {
  'Solar & Energy': 'var(--se-accent)',
  Pump: 'var(--se-primary)',
  Valve: '#6b7a8d',
  'Metering & Instrumentation': 'var(--se-info)',
  'Monitoring & IoT': '#8a94a3',
};

function isGeneration(category: string) {
  return category === 'Solar & Energy';
}

export function DigitalTwinPage() {
  const { lang, t } = useLang();
  const { customerCode, company } = useCompany();

  const assets = useMemo(() => assetsFor(customerCode), [customerCode]);
  const connected = useMemo(() => assets.filter((a) => a.connected && a.iot), [assets]);

  const [view, setView] = useState<'overview' | 'map'>('overview');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const totalGenerationKwh = connected.filter((a) => isGeneration(a.category)).reduce((s, a) => s + a.iot!.energyMonthKwh, 0);
  // Direct equipment consumption — pumps and valves only, to avoid double-counting with upstream feeder meters.
  const totalConsumptionKwh = connected
    .filter((a) => a.category === 'Pump' || a.category === 'Valve')
    .reduce((s, a) => s + a.iot!.energyMonthKwh, 0);
  const netKwh = totalConsumptionKwh - totalGenerationKwh;
  const offsetPct = totalConsumptionKwh > 0 ? Math.round((totalGenerationKwh / totalConsumptionKwh) * 100) : 0;

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of connected) map.set(a.category, (map.get(a.category) ?? 0) + a.iot!.energyMonthKwh);
    return [...map.entries()].map(([category, kwh]) => ({ category, kwh })).sort((a, b) => b.kwh - a.kwh);
  }, [connected]);

  const bySite = useMemo(() => {
    return company.sites.map((s) => ({
      site: s,
      assets: connected.filter((a) => a.siteId === s.id),
    }));
  }, [company.sites, connected]);

  if (connected.length === 0) {
    return (
      <EmptyState
        icon={<Activity size={24} />}
        title={t('No connected equipment yet', 'ยังไม่มีอุปกรณ์ที่เชื่อมต่อ')}
        body={t('Once SE equipment is connected to monitoring, this page summarises energy consumption and generation by area.', 'เมื่ออุปกรณ์ของ SE เชื่อมต่อกับระบบมอนิเตอริ่งแล้ว หน้านี้จะสรุปการใช้และผลิตพลังงานแยกตามพื้นที่')}
        action={<Link to="/portal/requests/new" className="btn btn-primary btn-sm">{t('Ask SE about monitoring', 'สอบถาม SE เรื่องมอนิเตอริ่ง')}</Link>}
      />
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('Factory Digital Twin', 'ฝาแฝดดิจิทัลโรงงาน')}</h1>
          <p className="page-sub">
            {t(
              'A live summary of the SE-supplied equipment powering your factory — pumps, solar, metering and monitoring — grouped by area.',
              'สรุปข้อมูลแบบเรียลไทม์ของอุปกรณ์ที่ SE ติดตั้งให้กับโรงงานของคุณ — ปั๊ม โซลาร์ มิเตอร์ และระบบมอนิเตอริ่ง — แยกตามพื้นที่',
            )}
          </p>
        </div>
        <div className="page-actions">
          <div className="chip-row" role="tablist" aria-label={t('View', 'มุมมอง')}>
            <button className={`chip ${view === 'overview' ? 'active' : ''}`} onClick={() => setView('overview')} aria-pressed={view === 'overview'}>
              <LayoutGrid size={14} aria-hidden style={{ verticalAlign: -2, marginRight: 4 }} />
              {t('Overview', 'ภาพรวม')}
            </button>
            <button className={`chip ${view === 'map' ? 'active' : ''}`} onClick={() => setView('map')} aria-pressed={view === 'map'}>
              <MapIcon size={14} aria-hidden style={{ verticalAlign: -2, marginRight: 4 }} />
              {t('Factory map', 'แผนผังโรงงาน')}
            </button>
          </div>
        </div>
      </div>

      {view === 'map' ? (
        <FactoryMap
          connected={connected}
          selectedId={selectedId}
          onSelect={setSelectedId}
          lang={lang}
          t={t}
        />
      ) : (
      <>
      <div className="grid-4" style={{ marginBottom: 16 }}>
        <div className="card" style={{ padding: 16 }}>
          <div className="flex" style={{ gap: 8 }}><Zap size={16} className="muted" aria-hidden /><span className="muted small">{t('Equipment consumption', 'การใช้พลังงานของอุปกรณ์')}</span></div>
          <div className="kpi-value" style={{ fontSize: 20 }}>{num(totalConsumptionKwh)} kWh</div>
          <div className="muted small">{t('Pumps & valves this month', 'ปั๊มและวาล์วเดือนนี้')}</div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div className="flex" style={{ gap: 8 }}><Sun size={16} className="muted" aria-hidden /><span className="muted small">{t('Solar generation', 'พลังงานที่ผลิตจากโซลาร์')}</span></div>
          <div className="kpi-value" style={{ fontSize: 20 }}>{num(totalGenerationKwh)} kWh</div>
          <div className="muted small">{t(`Offsets ~${offsetPct}% of equipment load`, `ชดเชยได้ ~${offsetPct}% ของโหลดอุปกรณ์`)}</div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div className="flex" style={{ gap: 8 }}><Activity size={16} className="muted" aria-hidden /><span className="muted small">{t('Net (equipment − solar)', 'สุทธิ (อุปกรณ์ − โซลาร์)')}</span></div>
          <div className="kpi-value" style={{ fontSize: 20 }}>{num(Math.abs(netKwh))} kWh</div>
          <div className="muted small">{netKwh >= 0 ? t('Net draw from grid', 'ดึงพลังงานจากกริดสุทธิ') : t('Net export to grid', 'ส่งออกสู่กริดสุทธิ')}</div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div className="flex" style={{ gap: 8 }}><Leaf size={16} className="muted" aria-hidden /><span className="muted small">{t('SE products connected', 'ผลิตภัณฑ์ SE ที่เชื่อมต่อ')}</span></div>
          <div className="kpi-value" style={{ fontSize: 20 }}>{connected.length} / {assets.length}</div>
          <Link to="/portal/carbon" className="muted small">{t('See carbon impact →', 'ดูผลกระทบด้านคาร์บอน →')}</Link>
        </div>
      </div>

      {/* Digital twin — schematic per-area breakdown */}
      <h3 style={{ margin: '4px 0 10px' }}>{t('Energy by area', 'พลังงานแยกตามพื้นที่')}</h3>
      <div className="grid-3" style={{ marginBottom: 20 }}>
        {bySite.map(({ site, assets: siteAssets }) => {
          const areaTotal = siteAssets.reduce((s, a) => s + a.iot!.energyMonthKwh, 0);
          return (
            <div key={site.id} className="card" style={{ padding: 16 }}>
              <div className="fw-600">{lang === 'th' ? site.nameTh : site.name}</div>
              <div className="muted small" style={{ marginBottom: 10 }}>{site.id}</div>
              {siteAssets.length === 0 ? (
                <p className="muted small">{t('No connected equipment at this area yet.', 'ยังไม่มีอุปกรณ์ที่เชื่อมต่อในพื้นที่นี้')}</p>
              ) : (
                <div style={{ display: 'grid', gap: 8 }}>
                  {siteAssets.map((a) => {
                    const Icon = CATEGORY_ICON[a.category] ?? Package;
                    return (
                      <Link
                        key={a.id}
                        to={`/portal/equipment/${a.id}`}
                        className="between"
                        style={{ textDecoration: 'none', color: 'inherit', padding: '6px 0', borderBottom: '1px dashed var(--se-border)' }}
                      >
                        <span className="flex small" style={{ gap: 6 }}>
                          <Icon size={14} aria-hidden style={{ color: CATEGORY_COLOR[a.category] }} />
                          {a.name}
                        </span>
                        <span className="small fw-600">
                          {isGeneration(a.category) ? '+' : ''}{num(a.iot!.energyMonthKwh)} kWh
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
              <div className="between" style={{ marginTop: 10 }}>
                <span className="muted small">{t('Area total', 'รวมพื้นที่นี้')}</span>
                <StatusBadge label={`${num(areaTotal)} kWh`} tone="blue" />
              </div>
            </div>
          );
        })}
      </div>

      {/* By product category */}
      <div className="grid-2" style={{ alignItems: 'start', marginBottom: 20 }}>
        <div className="card" style={{ padding: 18 }}>
          <h3 style={{ marginTop: 0 }}>{t('Energy by SE product category', 'พลังงานแยกตามหมวดผลิตภัณฑ์ SE')}</h3>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byCategory} margin={{ top: 6, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--se-border)" />
                <XAxis dataKey="category" fontSize={10.5} interval={0} angle={-15} textAnchor="end" height={60} />
                <YAxis fontSize={11} />
                <Tooltip formatter={(v: number) => `${num(v)} kWh`} />
                <Bar dataKey="kwh" radius={[6, 6, 0, 0]}>
                  {byCategory.map((c) => (
                    <Cell key={c.category} fill={CATEGORY_COLOR[c.category] ?? 'var(--se-primary)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="muted small" style={{ marginBottom: 0 }}>
            {t(
              'Solar & Energy is generation (offsets load); Pump, Valve, Metering and Monitoring figures are consumption. Metering figures may overlap with downstream pump loads on the same feeder — see note below.',
              'โซลาร์และพลังงานคือการผลิต (ช่วยชดเชยโหลด) ส่วนปั๊ม วาล์ว มิเตอร์ และมอนิเตอริ่งคือการใช้พลังงาน ตัวเลขจากมิเตอร์อาจซ้อนทับกับโหลดปั๊มที่อยู่ปลายฟีดเดอร์เดียวกัน — ดูหมายเหตุด้านล่าง',
            )}
          </p>
        </div>

        <div className="card" style={{ padding: 18 }}>
          <h3 style={{ marginTop: 0 }}>{t('Connected equipment detail', 'รายละเอียดอุปกรณ์ที่เชื่อมต่อ')}</h3>
          <div style={{ display: 'grid', gap: 6 }}>
            {connected.map((a: Asset) => {
              const Icon = CATEGORY_ICON[a.category] ?? Package;
              return (
                <Link
                  key={a.id}
                  to={`/portal/equipment/${a.id}`}
                  className="between"
                  style={{ textDecoration: 'none', color: 'inherit', padding: '6px 0', borderBottom: '1px dashed var(--se-border)' }}
                >
                  <span className="flex small" style={{ gap: 6 }}>
                    <Icon size={14} aria-hidden style={{ color: CATEGORY_COLOR[a.category] }} />
                    {a.name}
                    <span className="muted">· {a.category}</span>
                  </span>
                  <span className="small fw-600">{isGeneration(a.category) ? '+' : ''}{num(a.iot!.energyMonthKwh)} kWh</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <div className="alert-item a-amber" role="note">
        <Info size={17} aria-hidden />
        <span className="small">
          {t(
            'Figures shown are illustrative estimates read from connected equipment telemetry, not a certified energy audit. Metering & Instrumentation devices measure whole-feeder load, which may already include the pumps listed separately above.',
            'ตัวเลขที่แสดงเป็นค่าประมาณจากข้อมูลเทเลเมทรีของอุปกรณ์ที่เชื่อมต่อ ไม่ใช่ผลการตรวจสอบพลังงานอย่างเป็นทางการ อุปกรณ์มิเตอร์วัดโหลดรวมของฟีดเดอร์ ซึ่งอาจรวมปั๊มที่แสดงแยกไว้ด้านบนแล้ว',
          )}
        </span>
      </div>
      </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------
   Factory map — a schematic floor plan of the Rayong site with energy
   hotspots. Hotspot radius & colour scale with each asset's monthly kWh,
   so you can see at a glance where SE-supplied equipment draws power.
------------------------------------------------------------------ */
function FactoryMap({
  connected,
  selectedId,
  onSelect,
  lang,
  t,
}: {
  connected: Asset[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  lang: 'en' | 'th';
  t: (en: string, th: string) => string;
}) {
  // Zones of the schematic plant (viewBox 0 0 900 520)
  const ZONES = [
    { id: 'production', x: 40, y: 60, w: 380, h: 250, en: 'Production Hall', th: 'อาคารการผลิต' },
    { id: 'utility', x: 440, y: 60, w: 240, h: 170, en: 'Utility Building', th: 'อาคารระบบสาธารณูปโภค' },
    { id: 'warehouse', x: 40, y: 330, w: 380, h: 150, en: 'Warehouse', th: 'คลังสินค้า' },
    { id: 'pumproom', x: 440, y: 250, w: 240, h: 230, en: 'Pump & Process Room', th: 'ห้องปั๊มและกระบวนการ' },
    { id: 'solar', x: 700, y: 60, w: 160, h: 420, en: 'Rooftop Solar Array', th: 'แผงโซลาร์บนหลังคา' },
  ];

  // Place each connected asset into a zone by category, spreading them within.
  const zoneFor = (a: Asset): string => {
    if (a.category === 'Solar & Energy') return 'solar';
    if (a.category === 'Pump' || a.category === 'Valve') return 'pumproom';
    if (a.category === 'Metering & Instrumentation') return 'utility';
    if (a.category === 'Monitoring & IoT') return 'production';
    return 'production';
  };

  const maxKwh = Math.max(...connected.map((a) => a.iot!.energyMonthKwh), 1);
  const placed = useMemo(() => {
    const counters: Record<string, number> = {};
    return connected.map((a) => {
      const z = ZONES.find((zz) => zz.id === zoneFor(a))!;
      const idx = counters[z.id] ?? 0;
      counters[z.id] = idx + 1;
      // simple grid layout inside each zone
      const perRow = z.w > 300 ? 3 : 2;
      const col = idx % perRow;
      const row = Math.floor(idx / perRow);
      const cx = z.x + 50 + col * ((z.w - 100) / Math.max(1, perRow - 1 || 1));
      const cy = z.y + 60 + row * 70;
      const share = a.iot!.energyMonthKwh / maxKwh;
      const r = 12 + share * 26; // 12..38px
      return { asset: a, cx, cy, r, zoneId: z.id };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, maxKwh]);

  const selected = placed.find((p) => p.asset.id === selectedId)?.asset ?? null;

  const heatColor = (share: number) =>
    share > 0.66 ? 'var(--se-danger)' : share > 0.33 ? 'var(--se-accent)' : 'var(--se-primary)';

  return (
    <div className="grid-2" style={{ alignItems: 'start', gap: 16 }}>
      <div className="card factory-map-wrap" style={{ padding: 12 }}>
        <svg className="factory-map-svg" viewBox="0 0 900 520" role="img"
          aria-label={t('Factory floor plan with energy hotspots', 'แผนผังโรงงานพร้อมจุดใช้พลังงาน')}>
          {/* zones */}
          {ZONES.map((z) => (
            <g key={z.id}>
              <rect className="fm-zone" x={z.x} y={z.y} width={z.w} height={z.h} rx={10}
                style={z.id === 'solar' ? { fill: 'var(--se-accent-soft)' } : undefined} />
              <text className="fm-zone-label" x={z.x + 12} y={z.y + 22}>
                {(lang === 'th' ? z.th : z.en).toUpperCase()}
              </text>
            </g>
          ))}
          {/* hotspots */}
          {placed.map(({ asset, cx, cy, r }) => {
            const share = asset.iot!.energyMonthKwh / maxKwh;
            const color = isGeneration(asset.category) ? 'var(--se-success)' : heatColor(share);
            const isSel = asset.id === selectedId;
            return (
              <g key={asset.id} className="fm-hotspot" onClick={() => onSelect(isSel ? null : asset.id)}>
                <circle className="halo" cx={cx} cy={cy} r={r + 8} fill={color} opacity={0.4} />
                <circle cx={cx} cy={cy} r={r} fill={color} opacity={isSel ? 0.95 : 0.72}
                  stroke={isSel ? 'var(--se-text)' : '#fff'} strokeWidth={isSel ? 3 : 1.5} />
                <text x={cx} y={cy + 4} textAnchor="middle" style={{ fill: '#fff', fontSize: 10, fontWeight: 700 }}>
                  {isGeneration(asset.category) ? '+' : ''}{Math.round(asset.iot!.energyMonthKwh / 100) / 10}k
                </text>
              </g>
            );
          })}
        </svg>
        <div className="fm-legend">
          <span className="flex" style={{ gap: 6 }}><span style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--se-primary)' }} /> {t('Lower draw', 'ใช้พลังงานต่ำ')}</span>
          <span className="flex" style={{ gap: 6 }}><span style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--se-accent)' }} /> {t('Medium', 'ปานกลาง')}</span>
          <span className="flex" style={{ gap: 6 }}><span style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--se-danger)' }} /> {t('Highest draw', 'ใช้พลังงานสูงสุด')}</span>
          <span className="flex" style={{ gap: 6 }}><span style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--se-success)' }} /> {t('Solar generation', 'ผลิตจากโซลาร์')}</span>
          <span className="muted">· {t('Bubble size = monthly kWh', 'ขนาดวงกลม = kWh ต่อเดือน')}</span>
        </div>
      </div>

      <div className="card" style={{ padding: 18, position: 'sticky', top: 'calc(var(--topbar-h) + 16px)' }}>
        {selected ? (
          <>
            <div className="flex between" style={{ marginBottom: 10 }}>
              <h3 style={{ margin: 0 }}>{selected.name}</h3>
              <StatusBadge
                label={isGeneration(selected.category) ? t('Generating', 'กำลังผลิต') : t('Consuming', 'กำลังใช้')}
                tone={isGeneration(selected.category) ? 'green' : 'blue'}
              />
            </div>
            <div className="muted small" style={{ marginBottom: 14 }}>{selected.id} · {selected.category}</div>
            <div className="grid-2" style={{ gap: 10 }}>
              <div className="stat-tile"><div className="v">{num(selected.iot!.energyMonthKwh)}</div><div className="k">{t('kWh this month', 'kWh เดือนนี้')}</div></div>
              <div className="stat-tile"><div className="v">{selected.iot!.online ? t('Online', 'ออนไลน์') : t('Offline', 'ออฟไลน์')}</div><div className="k">{t('Link status', 'สถานะการเชื่อมต่อ')}</div></div>
            </div>
            <Link to={`/portal/equipment/${selected.id}`} className="btn btn-outline btn-sm" style={{ marginTop: 14 }}>
              {t('Open equipment detail', 'ดูรายละเอียดอุปกรณ์')}
            </Link>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 8px' }}>
            <MapIcon size={26} className="muted" aria-hidden style={{ marginBottom: 8 }} />
            <div className="fw-600" style={{ marginBottom: 4 }}>{t('Tap a hotspot', 'แตะที่จุดพลังงาน')}</div>
            <p className="muted small" style={{ margin: 0 }}>
              {t('Each bubble is an SE-supplied asset. Bigger, hotter bubbles draw more energy — tap one to inspect it.', 'แต่ละวงคืออุปกรณ์ที่ SE ติดตั้ง วงที่ใหญ่และร้อนกว่าใช้พลังงานมากกว่า แตะเพื่อดูรายละเอียด')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
