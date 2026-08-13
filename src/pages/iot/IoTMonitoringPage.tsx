import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Activity, AlertTriangle, Droplets, Eye, Gauge, Lightbulb,
  Power, Radio, Thermometer, Wifi, WifiOff, Zap,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useLang } from '@/contexts/LanguageContext';
import { useCompany } from '@/contexts/CompanyContext';
import { EmptyState, Modal, StatusBadge } from '@/components/common';
import { assetsFor } from '@/data/mockAssets';
import { siteName } from '@/data/mockCompanies';
import { fmtDate, num } from '@/utils/format';
import { getAssetRecommendations } from '@/utils/recommendations';
import type { Asset } from '@/types';

const DEVICE_TABS = ['all', 'Pump', 'Valve', 'Solar & Energy', 'Metering & Instrumentation', 'Monitoring & IoT'] as const;
type DeviceTab = (typeof DEVICE_TABS)[number];

const TAB_LABEL: Record<DeviceTab, { en: string; th: string }> = {
  all: { en: 'All Devices', th: 'อุปกรณ์ทั้งหมด' },
  Pump: { en: 'Pumps', th: 'ปั๊ม' },
  Valve: { en: 'Valves', th: 'วาล์ว' },
  'Solar & Energy': { en: 'Solar', th: 'โซลาร์' },
  'Metering & Instrumentation': { en: 'Metering', th: 'มิเตอร์' },
  'Monitoring & IoT': { en: 'IoT', th: 'IoT' },
};

function seedFrom(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

function telemetrySeries(asset: Asset) {
  const base = asset.iot?.powerKw ?? 0;
  const seed = seedFrom(asset.id);
  const points = [];
  for (let hour = 0; hour < 24; hour += 2) {
    const wobble = ((seed >> (hour % 16)) % 9) - 4;
    const value = Math.max(0, +(base + base * (wobble / 20)).toFixed(1));
    points.push({ time: `${String(hour).padStart(2, '0')}:00`, kw: value });
  }
  return points;
}

function confidenceFor(assetId: string, index: number): number {
  return 82 + (seedFrom(assetId + index) % 17);
}

function DeviceQuickStats({ asset }: { asset: Asset }) {
  const iot = asset.iot!;
  if (iot.meter) {
    return (
      <span className="flex" style={{ gap: 12, color: 'var(--se-text-muted)', fontSize: 12 }}>
        <span><Zap size={12} aria-hidden style={{ verticalAlign: -1 }} /> {iot.meter.activePowerKw} kW</span>
        <span><Gauge size={12} aria-hidden style={{ verticalAlign: -1 }} /> PF {iot.meter.powerFactor.toFixed(2)}</span>
      </span>
    );
  }
  if (iot.process) {
    return (
      <span className="flex" style={{ gap: 12, color: 'var(--se-text-muted)', fontSize: 12 }}>
        <span><Droplets size={12} aria-hidden style={{ verticalAlign: -1 }} /> {iot.process.flowM3h ?? 0} m³/h</span>
        <span><Thermometer size={12} aria-hidden style={{ verticalAlign: -1 }} /> {iot.process.temperatureC ?? 0}°C</span>
        <span><Power size={12} aria-hidden style={{ verticalAlign: -1 }} /> {iot.running ? 'ON' : 'OFF'}</span>
      </span>
    );
  }
  return (
    <span className="flex" style={{ gap: 12, color: 'var(--se-text-muted)', fontSize: 12 }}>
      <span><Gauge size={12} aria-hidden style={{ verticalAlign: -1 }} /> {iot.powerKw} kW</span>
      <span><Activity size={12} aria-hidden style={{ verticalAlign: -1 }} /> {num(iot.runtimeHrs)} h</span>
    </span>
  );
}

function LiveReadings({ asset, t }: { asset: Asset; t: (en: string, th: string) => string }) {
  const iot = asset.iot!;

  if (iot.meter) {
    const m = iot.meter;
    return (
      <div style={{ marginBottom: 16 }}>
        <div className="fw-600 small" style={{ marginBottom: 8, color: 'var(--se-text-muted)' }}>
          {t('Smart Meter Live Telemetry', 'ค่าที่วัดได้จากมิเตอร์อัจฉริยะ')}
        </div>
        <div className="grid-4" style={{ gap: 8, marginBottom: 12 }}>
          <div className="stat-tile"><div className="v">{m.activePowerKw}</div><div className="k">Active kW</div></div>
          <div className="stat-tile"><div className="v">{m.reactivePowerKvar}</div><div className="k">kVAr</div></div>
          <div className="stat-tile"><div className="v">{m.apparentPowerKva}</div><div className="k">kVA</div></div>
          <div className="stat-tile"><div className="v">{m.powerFactor.toFixed(2)}</div><div className="k">PF</div></div>
        </div>
        <div className="stat-line"><span className="k">Frequency</span><span className="v">{m.frequencyHz.toFixed(2)} Hz</span></div>
      </div>
    );
  }

  if (iot.process) {
    const p = iot.process;
    return (
      <div style={{ marginBottom: 16 }}>
        <div className="fw-600 small" style={{ marginBottom: 8, color: 'var(--se-text-muted)' }}>
          {t('Process Live Telemetry', 'ค่ากระบวนการทำงานแบบเรียลไทม์')}
        </div>
        <div className="grid-4" style={{ gap: 8, marginBottom: 12 }}>
          <div className="stat-tile"><div className="v">{p.pressureBar ?? '—'}</div><div className="k">Pressure (bar)</div></div>
          <div className="stat-tile"><div className="v">{p.flowM3h ?? '—'}</div><div className="k">Flow (m³/h)</div></div>
          <div className="stat-tile"><div className="v">{p.temperatureC ?? '—'}</div><div className="k">Temp (°C)</div></div>
          <div className="stat-tile"><div className="v">{iot.running ? 'ON' : 'OFF'}</div><div className="k">Status</div></div>
        </div>
        <div className="stat-line"><span className="k">{t('Runtime Hours', 'ชั่วโมงทำงานสะสม')}</span><span className="v">{num(iot.runtimeHrs)} h</span></div>
      </div>
    );
  }

  return null;
}

export function IoTMonitoringPage() {
  const { lang, t } = useLang();
  const { customerCode } = useCompany();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const [tab, setTab] = useState<DeviceTab>('all');
  const [rightTab, setRightTab] = useState<'detail' | 'alarms'>('detail');

  const allAssets = useMemo(() => assetsFor(customerCode), [customerCode]);
  const connected = useMemo(() => allAssets.filter((a) => a.connected && a.iot), [allAssets]);
  const filtered = tab === 'all' ? connected : connected.filter((a) => a.category === tab);

  const deviceId = params.get('device') || (connected.length > 0 ? connected[0].id : null);
  const selectedDevice = deviceId ? connected.find((a) => a.id === deviceId) : undefined;

  const alarmKey = params.get('alarm');
  const alarmEntry = useMemo(() => {
    if (!alarmKey) return null;
    const [assetId, idxStr] = alarmKey.split('::');
    const asset = connected.find((a) => a.id === assetId);
    const idx = Number(idxStr);
    const alarm = asset?.iot?.alarms[idx];
    return asset && alarm ? { asset, alarm, idx } : null;
  }, [alarmKey, connected]);

  const selectDevice = (id: string) => {
    const next = new URLSearchParams(params);
    next.set('device', id);
    setParams(next, { replace: true });
  };

  const openAlarm = (assetId: string, idx: number) => {
    const next = new URLSearchParams(params);
    next.set('alarm', `${assetId}::${idx}`);
    setParams(next);
  };
  const closeAlarm = () => {
    const next = new URLSearchParams(params);
    next.delete('alarm');
    setParams(next);
  };

  const allAlarms = connected
    .flatMap((a) => (a.iot?.alarms ?? []).map((al, idx) => ({ asset: a, alarm: al, idx })))
    .sort((a, b) => (a.alarm.time < b.alarm.time ? 1 : -1));

  const activeAlarms = allAlarms.filter((x) => x.alarm.active);
  const onlineCount = connected.filter((a) => a.iot!.online).length;
  const baseTotalPower = connected.reduce((s, a) => s + (a.iot?.powerKw ?? 0), 0);

  const recommendations = selectedDevice ? getAssetRecommendations(selectedDevice) : [];

  // Live tick engine
  const [tick, setTick] = useState(0);
  const [dataPoints, setDataPoints] = useState(() => 18420 + connected.length * 240);
  useEffect(() => {
    const id = window.setInterval(() => {
      setTick((n) => n + 1);
      setDataPoints((n) => n + connected.length);
    }, 2000);
    return () => window.clearInterval(id);
  }, [connected.length]);

  const jitter = (Math.sin(tick * 1.3) + Math.sin(tick * 0.7)) / 2;
  const livePower = Math.max(0, baseTotalPower * (1 + jitter * 0.012));
  const throughput = (connected.length * 0.5 + (jitter + 1) * 1.4).toFixed(1);

  const flashRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = flashRef.current;
    if (!el) return;
    el.classList.remove('tick-flash');
    void el.offsetWidth;
    el.classList.add('tick-flash');
  }, [tick]);

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <div className="flex" style={{ gap: 10, marginBottom: 2 }}>
            <h1 className="page-title" style={{ margin: 0 }}>{t('Live Monitoring', 'มอนิเตอริ่งแบบเรียลไทม์')}</h1>
            {connected.length > 0 && (
              <span className="live-badge" aria-label={t('Live feed active', 'ฟีดสดกำลังทำงาน')}>
                <span className="live-dot" />
                {t('LIVE', 'สด')}
              </span>
            )}
          </div>
          <p className="page-sub" style={{ margin: 0 }}>
            {t('Read-only telemetry for your connected equipment.', 'ข้อมูลเทเลเมทรีแบบอ่านอย่างเดียวสำหรับอุปกรณ์ที่เชื่อมต่อ')}
          </p>
        </div>
      </div>

      {/* Telemetry Bar */}
      <section className="eq-telemetry-bar" style={{ marginBottom: 20 }} ref={flashRef}>
        <div className="eq-telemetry-main">
          <div className="eq-telemetry-badge">
            <Activity size={22} strokeWidth={1.75} />
          </div>
          <div>
            <div className="eq-telemetry-title">
              <span className="eq-telemetry-count">{livePower.toFixed(1)}</span>
              <span className="eq-telemetry-unit">kW</span>
            </div>
            <div className="eq-telemetry-sub">
              {t('Total power draw now', 'กำลังไฟฟ้ารวมตอนนี้')}
            </div>
          </div>
        </div>

        <div className="eq-telemetry-item item-healthy">
          <div className="eq-item-head">
            <span className="status-indicator status-green" aria-hidden />
            <span className="eq-item-label">{t('Online Devices', 'อุปกรณ์ออนไลน์')}</span>
          </div>
          <div className="eq-item-val">{onlineCount} <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--se-text-muted)' }}>/ {connected.length}</span></div>
        </div>

        <div className="eq-telemetry-item">
          <div className="eq-item-head">
            <span className="status-indicator status-amber" aria-hidden />
            <span className="eq-item-label">{t('Active Alarms', 'สัญญาณเตือนที่มีผล')}</span>
          </div>
          <div className="eq-item-val" style={{ color: activeAlarms.length > 0 ? 'var(--se-danger)' : 'inherit' }}>{activeAlarms.length}</div>
        </div>

        <div className="eq-telemetry-item">
          <div className="eq-item-head">
            <Radio size={13} style={{ color: 'var(--se-text-muted)' }} aria-hidden />
            <span className="eq-item-label">{t('Data Ingested', 'ข้อมูลที่รับ')}</span>
          </div>
          <div className="eq-item-val">{num(dataPoints)} <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--se-text-muted)' }}>· {throughput}/s</span></div>
        </div>

        <div className="eq-telemetry-item" title={t('Sites with connected equipment', 'ไซต์ที่มีอุปกรณ์เชื่อมต่อ')}>
          <div className="eq-item-head">
            <Wifi size={13} style={{ color: 'var(--se-text-muted)' }} aria-hidden />
            <span className="eq-item-label">{t('Connected Sites', 'ไซต์ที่เชื่อมต่อ')}</span>
          </div>
          <div className="eq-item-val">{new Set(connected.map((a) => a.siteId)).size}</div>
        </div>
      </section>

      {connected.length === 0 ? (
        <EmptyState
          icon={<WifiOff size={24} />}
          title={t('No connected equipment yet', 'ยังไม่มีอุปกรณ์ที่เชื่อมต่อ')}
          body={t('Ask SE about adding an IoT gateway to see live telemetry here.', 'สอบถาม SE เรื่องการเพิ่มเกตเวย์ IoT เพื่อดูข้อมูลเรียลไทม์ที่นี่')}
          action={<Link to="/portal/requests/new" className="btn btn-primary btn-sm">{t('Ask SE about monitoring', 'สอบถาม SE เรื่องมอนิเตอริ่ง')}</Link>}
        />
      ) : (
        /* Clean 2-Column Grid Layout (58% / 42%) */
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1fr)', gap: 16, alignItems: 'start' }}>
          
          {/* LEFT: Clean Device Table / List */}
          <div>
            <div className="chip-row" style={{ marginBottom: 12 }}>
              {DEVICE_TABS.map((tb) => (
                <button
                  key={tb}
                  className={`chip ${tab === tb ? 'active' : ''}`}
                  onClick={() => setTab(tb)}
                  aria-pressed={tab === tb}
                >
                  {lang === 'th' ? TAB_LABEL[tb].th : TAB_LABEL[tb].en}
                </button>
              ))}
            </div>

            <div className="ticket-list">
              {filtered.map((a) => {
                const hasAlarm = a.iot!.alarms.some((al) => al.active);
                const isSelected = selectedDevice?.id === a.id;
                return (
                  <div
                    key={a.id}
                    className="ticket-card-clean"
                    style={{
                      cursor: 'pointer',
                      borderColor: isSelected ? 'var(--se-primary)' : undefined,
                      background: isSelected ? 'color-mix(in srgb, var(--se-primary) 3%, var(--se-surface))' : undefined,
                    }}
                    onClick={() => selectDevice(a.id)}
                  >
                    <div className="between">
                      <div className="flex" style={{ gap: 8 }}>
                        {hasAlarm && <span className="dm-alarm-dot" style={{ marginTop: 6 }} aria-label="Active alarm" />}
                        <div>
                          <div className="fw-600" style={{ fontSize: 14, color: 'var(--se-text)' }}>{a.name}</div>
                          <div className="muted small">{a.id} · {siteName(customerCode, a.siteId, lang)}</div>
                        </div>
                      </div>
                      <span className={`badge ${a.iot!.online ? 't-green' : 't-grey'}`}>
                        {a.iot!.online ? <Wifi size={11} aria-hidden /> : <WifiOff size={11} aria-hidden />}
                        {a.iot!.online ? t('Online', 'ออนไลน์') : t('Offline', 'ออฟไลน์')}
                      </span>
                    </div>

                    <div className="between" style={{ marginTop: 4, paddingTop: 8, borderTop: '1px solid var(--se-border)' }}>
                      <DeviceQuickStats asset={a} />
                      {hasAlarm && <StatusBadge label={t('Alarm active', 'มีสัญญาณเตือน')} tone="red" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT: Single Clean Detail & Alarm Panel */}
          <div className="card" style={{ padding: 20 }}>
            {/* Panel Tabs */}
            <div className="flex" style={{ gap: 12, marginBottom: 16, borderBottom: '1px solid var(--se-border)', paddingBottom: 10 }}>
              <button
                className="btn btn-sm"
                style={{
                  background: rightTab === 'detail' ? 'var(--se-grey-soft)' : 'transparent',
                  fontWeight: rightTab === 'detail' ? 600 : 400,
                  border: 'none',
                }}
                onClick={() => setRightTab('detail')}
              >
                {t('Device Telemetry', 'ข้อมูลอุปกรณ์')}
              </button>
              <button
                className="btn btn-sm"
                style={{
                  background: rightTab === 'alarms' ? 'var(--se-grey-soft)' : 'transparent',
                  fontWeight: rightTab === 'alarms' ? 600 : 400,
                  border: 'none',
                }}
                onClick={() => setRightTab('alarms')}
              >
                {t('System Alarms', 'สัญญาณเตือนทั้งหมด')} ({activeAlarms.length})
              </button>
            </div>

            {rightTab === 'detail' ? (
              selectedDevice ? (
                <>
                  <div className="between" style={{ marginBottom: 4 }}>
                    <h3 style={{ margin: 0, fontSize: 16 }}>{selectedDevice.name}</h3>
                    <Link to={`/portal/equipment/${selectedDevice.id}`} className="btn btn-outline btn-sm">
                      {t('Asset detail', 'รายละเอียด')} →
                    </Link>
                  </div>
                  <p className="muted small" style={{ marginTop: 0, marginBottom: 16 }}>
                    {selectedDevice.id} · {siteName(customerCode, selectedDevice.siteId, lang)}
                  </p>

                  <LiveReadings asset={selectedDevice} t={t} />

                  <div style={{ height: 170, marginBottom: 10 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={telemetrySeries(selectedDevice)} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--se-border)" />
                        <XAxis dataKey="time" fontSize={10} />
                        <YAxis fontSize={10} />
                        <Tooltip formatter={(v: number) => `${v} kW`} />
                        <Line type="monotone" dataKey="kw" name="kW" stroke="var(--se-primary)" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="stat-line"><span className="k">{t('Last data', 'ข้อมูลล่าสุด')}</span><span className="v">{selectedDevice.iot!.lastComm}</span></div>
                  <div className="stat-line"><span className="k">{t('Energy this month', 'พลังงานเดือนนี้')}</span><span className="v">{num(selectedDevice.iot!.energyMonthKwh)} kWh</span></div>

                  {recommendations.length > 0 && (
                    <div style={{ marginTop: 16 }}>
                      <div className="fw-600 small" style={{ marginBottom: 8, color: 'var(--se-text-muted)' }}>
                        <Lightbulb size={13} aria-hidden style={{ verticalAlign: -2 }} /> {t('Recommendations', 'ข้อเสนอแนะ')}
                      </div>
                      <div style={{ display: 'grid', gap: 6 }}>
                        {recommendations.map((r, i) => (
                          <div key={i} className={`alert-item ${r.tone === 'red' ? 'a-red' : r.tone === 'amber' ? 'a-amber' : 'a-blue'}`}>
                            <Lightbulb size={13} aria-hidden />
                            <span className="small">{lang === 'th' ? r.th : r.en}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <EmptyState
                  icon={<Eye size={22} />}
                  title={t('Select a device', 'เลือกอุปกรณ์')}
                  body={t('Choose a device from the list to see telemetry.', 'เลือกอุปกรณ์จากรายการเพื่อดูข้อมูล')}
                />
              )
            ) : (
              /* System Alarms Tab View */
              <div>
                {allAlarms.length === 0 ? (
                  <p className="muted small">{t('No alarms recorded.', 'ไม่มีสัญญาณเตือน')}</p>
                ) : (
                  <div style={{ display: 'grid', gap: 8 }}>
                    {allAlarms.map(({ asset, alarm, idx }) => (
                      <div
                        key={`${asset.id}-${idx}`}
                        className={`alert-item ${alarm.severity === 'critical' ? 'a-red' : alarm.severity === 'warning' ? 'a-amber' : 'a-blue'}`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => openAlarm(asset.id, idx)}
                      >
                        <AlertTriangle size={14} aria-hidden />
                        <span className="small">
                          <strong>{fmtDate(alarm.time.slice(0, 10), lang)}</strong> · {asset.name} — {alarm.message}{' '}
                          {alarm.active
                            ? <StatusBadge label={t('Active', 'ยังมีผล')} tone="red" />
                            : <StatusBadge label={t('Cleared', 'เคลียร์แล้ว')} tone="grey" />}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Alarm detail modal */}
      <Modal
        open={alarmEntry !== null}
        onClose={closeAlarm}
        title={t('Alarm detail', 'รายละเอียดสัญญาณเตือน')}
        footer={
          alarmEntry ? (
            <>
              <button className="btn btn-outline" onClick={closeAlarm}>{t('Close', 'ปิด')}</button>
              <button
                className="btn btn-primary"
                onClick={() => navigate(`/portal/requests/new?asset=${alarmEntry.asset.id}&topic=alarm`)}
              >
                {t('Open a request about this', 'สร้างคำขอเกี่ยวกับเรื่องนี้')}
              </button>
            </>
          ) : undefined
        }
      >
        {alarmEntry && (
          <>
            <div className="stat-line"><span className="k">{t('Equipment', 'อุปกรณ์')}</span><span className="v"><Link to={`/portal/equipment/${alarmEntry.asset.id}`}>{alarmEntry.asset.name}</Link></span></div>
            <div className="stat-line"><span className="k">{t('Site', 'ไซต์')}</span><span className="v">{siteName(customerCode, alarmEntry.asset.siteId, lang)}</span></div>
            <div className="stat-line"><span className="k">{t('Severity', 'ระดับความรุนแรง')}</span><span className="v" style={{ textTransform: 'capitalize' }}>{alarmEntry.alarm.severity}</span></div>
            <div className="stat-line"><span className="k">{t('Time', 'เวลา')}</span><span className="v">{alarmEntry.alarm.time}</span></div>
            <div className="stat-line"><span className="k">{t('Detection confidence', 'ความเชื่อมั่นในการตรวจจับ')}</span><span className="v">{confidenceFor(alarmEntry.asset.id, alarmEntry.idx)}%</span></div>
            <div className="stat-line"><span className="k">{t('Status', 'สถานะ')}</span><span className="v">{alarmEntry.alarm.active ? t('Active', 'ยังมีผล') : t('Cleared', 'เคลียร์แล้ว')}</span></div>
            <p style={{ marginTop: 12 }}>{alarmEntry.alarm.message}</p>
          </>
        )}
      </Modal>
    </div>
  );
}
