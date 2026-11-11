import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Activity, AlertTriangle, Droplets, Eye, Gauge, Lightbulb, Power, Radio, Thermometer, Wifi, WifiOff, Zap } from 'lucide-react';
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
  all: { en: 'All devices', th: 'อุปกรณ์ทั้งหมด' },
  Pump: { en: 'Pumps', th: 'ปั๊ม' },
  Valve: { en: 'Valves', th: 'วาล์ว' },
  'Solar & Energy': { en: 'Solar & Energy', th: 'โซลาร์และพลังงาน' },
  'Metering & Instrumentation': { en: 'Metering', th: 'มิเตอร์' },
  'Monitoring & IoT': { en: 'Monitoring / IoT', th: 'มอนิเตอริ่ง / IoT' },
};

/** Deterministic pseudo-random hash so the same asset always renders the same chart/confidence. */
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
    const wobble = ((seed >> (hour % 16)) % 9) - 4; // -4..4
    const value = Math.max(0, +(base + base * (wobble / 20)).toFixed(1));
    points.push({ time: `${String(hour).padStart(2, '0')}:00`, kw: value });
  }
  return points;
}

function confidenceFor(assetId: string, index: number): number {
  return 82 + (seedFrom(assetId + index) % 17); // 82–98%
}

function DeviceQuickStats({ asset, lang }: { asset: Asset; lang: 'en' | 'th' }) {
  const iot = asset.iot!;
  if (iot.meter) {
    return (
      <span className="flex" style={{ gap: 14, flexWrap: 'wrap' }}>
        <span className="small"><Zap size={12} aria-hidden style={{ verticalAlign: -1 }} /> {iot.meter.activePowerKw} kW</span>
        <span className="small"><Gauge size={12} aria-hidden style={{ verticalAlign: -1 }} /> PF {iot.meter.powerFactor.toFixed(2)}</span>
      </span>
    );
  }
  if (iot.process) {
    return (
      <span className="flex" style={{ gap: 14, flexWrap: 'wrap' }}>
        <span className="small"><Droplets size={12} aria-hidden style={{ verticalAlign: -1 }} /> {iot.process.flowM3h ?? 0} m³/h</span>
        <span className="small"><Thermometer size={12} aria-hidden style={{ verticalAlign: -1 }} /> {iot.process.temperatureC ?? 0}°C</span>
        <span className="small"><Power size={12} aria-hidden style={{ verticalAlign: -1 }} /> {iot.running ? (lang === 'th' ? 'ทำงาน' : 'ON') : (lang === 'th' ? 'หยุด' : 'OFF')}</span>
      </span>
    );
  }
  return (
    <span className="flex" style={{ gap: 14, flexWrap: 'wrap' }}>
      <span className="small"><Gauge size={12} aria-hidden style={{ verticalAlign: -1 }} /> {iot.powerKw} kW</span>
      <span className="small"><Activity size={12} aria-hidden style={{ verticalAlign: -1 }} /> {num(iot.runtimeHrs)} h</span>
    </span>
  );
}

function LiveReadings({ asset, t }: { asset: Asset; t: (en: string, th: string) => string }) {
  const iot = asset.iot!;

  if (iot.meter) {
    const m = iot.meter;
    return (
      <div style={{ marginBottom: 14 }}>
        <div className="fw-600 small" style={{ marginBottom: 8 }}>{t('Smart energy meter — live readings', 'มิเตอร์อัจฉริยะ — ค่าที่วัดได้')}</div>
        <div className="card table-to-cards" style={{ overflow: 'hidden', marginBottom: 10 }}>
          <table className="se-table">
            <thead>
              <tr>
                <th>{t('Phase', 'เฟส')}</th>
                <th>{t('Voltage', 'แรงดันไฟฟ้า')}</th>
                <th>{t('Current', 'กระแสไฟฟ้า')}</th>
              </tr>
            </thead>
            <tbody>
              {(['l1', 'l2', 'l3'] as const).map((p) => (
                <tr key={p}>
                  <td data-label={t('Phase', 'เฟส')} className="fw-600">{p.toUpperCase()}</td>
                  <td data-label={t('Voltage', 'แรงดันไฟฟ้า')}>{m.phases[p].voltageV.toFixed(1)} V</td>
                  <td data-label={t('Current', 'กระแสไฟฟ้า')}>{m.phases[p].currentA.toFixed(1)} A</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="grid-4" style={{ gap: 8 }}>
          <div className="stat-tile"><div className="v">{m.activePowerKw}</div><div className="k">{t('Active kW', 'กำลังไฟฟ้าจริง kW')}</div></div>
          <div className="stat-tile"><div className="v">{m.reactivePowerKvar}</div><div className="k">{t('Reactive kVAr', 'กำลังรีแอกทีฟ kVAr')}</div></div>
          <div className="stat-tile"><div className="v">{m.apparentPowerKva}</div><div className="k">{t('Apparent kVA', 'กำลังปรากฏ kVA')}</div></div>
          <div className="stat-tile"><div className="v">{m.powerFactor.toFixed(2)}</div><div className="k">{t('Power factor', 'ตัวประกอบกำลัง')}</div></div>
        </div>
        <p className="muted small" style={{ margin: '8px 0 0' }}>{t('Frequency', 'ความถี่')}: {m.frequencyHz.toFixed(2)} Hz</p>
      </div>
    );
  }

  if (iot.process) {
    const p = iot.process;
    return (
      <div style={{ marginBottom: 14 }}>
        <div className="fw-600 small" style={{ marginBottom: 8 }}>{t('Process readings', 'ค่ากระบวนการทำงาน')}</div>
        <div className="grid-4" style={{ gap: 8 }}>
          <div className="stat-tile"><div className="v">{p.pressureBar ?? '—'}</div><div className="k">{t('Pressure (bar)', 'ความดัน (บาร์)')}</div></div>
          <div className="stat-tile"><div className="v">{p.flowM3h ?? '—'}</div><div className="k">{t('Flow (m³/h)', 'อัตราการไหล (m³/h)')}</div></div>
          <div className="stat-tile"><div className="v">{p.temperatureC ?? '—'}</div><div className="k">{t('Temp (°C)', 'อุณหภูมิ (°C)')}</div></div>
          <div className="stat-tile"><div className="v">{iot.running ? 'ON' : 'OFF'}</div><div className="k">{t('Run status', 'สถานะการทำงาน')}</div></div>
        </div>
        <p className="muted small" style={{ margin: '8px 0 0' }}>{t('Running hours (cumulative)', 'ชั่วโมงทำงานสะสม')}: {num(iot.runtimeHrs)} h</p>
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

  const allAssets = useMemo(() => assetsFor(customerCode), [customerCode]);
  const connected = useMemo(() => allAssets.filter((a) => a.connected && a.iot), [allAssets]);
  const filtered = tab === 'all' ? connected : connected.filter((a) => a.category === tab);

  const deviceId = params.get('device');
  const selectedDevice = deviceId ? connected.find((a) => a.id === deviceId) : undefined;

  const alarmKey = params.get('alarm'); // format: "{assetId}::{index}"
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

  const allAlarms = connected.flatMap((a) =>
    (a.iot?.alarms ?? []).map((al, idx) => ({ asset: a, alarm: al, idx })),
  ).sort((a, b) => (a.alarm.time < b.alarm.time ? 1 : -1));

  const onlineCount = connected.filter((a) => a.iot!.online).length;
  const baseTotalPower = connected.reduce((s, a) => s + (a.iot?.powerKw ?? 0), 0);
  const activeCount = allAlarms.filter((x) => x.alarm.active).length;

  const recommendations = selectedDevice ? getAssetRecommendations(selectedDevice) : [];

  // --- Live tick engine: re-render every 2s to simulate a streaming feed ---
  const [tick, setTick] = useState(0);
  const [dataPoints, setDataPoints] = useState(() => 18420 + connected.length * 240);
  useEffect(() => {
    const id = window.setInterval(() => {
      setTick((n) => n + 1);
      setDataPoints((n) => n + connected.length); // ~1 sample/device/tick
    }, 2000);
    return () => window.clearInterval(id);
  }, [connected.length]);

  // Deterministic per-tick jitter so the strip feels alive without lying about the baseline
  const jitter = (Math.sin(tick * 1.3) + Math.sin(tick * 0.7)) / 2; // -1..1-ish
  const livePower = Math.max(0, baseTotalPower * (1 + jitter * 0.012));
  const throughput = (connected.length * 0.5 + (jitter + 1) * 1.4).toFixed(1);

  // Ref-based flash: toggle a class each tick so the numbers pulse
  const flashRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = flashRef.current;
    if (!el) return;
    el.classList.remove('tick-flash');
    void el.offsetWidth; // reflow to restart the animation
    el.classList.add('tick-flash');
  }, [tick]);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="flex" style={{ gap: 10, marginBottom: 2 }}>
            <h1 className="page-title" style={{ margin: 0 }}>{t('Live Monitoring', 'มอนิเตอริ่งแบบเรียลไทม์')}</h1>
            {connected.length > 0 && (
              <span className="live-badge" aria-label={t('Live feed active', 'ฟีดสดกำลังทำงาน')}>
                <span className="live-dot" /> {t('LIVE', 'สด')}
              </span>
            )}
          </div>
          <p className="page-sub">
            {t('Read-only telemetry for your connected equipment. SE Operations dispatches from alarms on their side.', 'ข้อมูลเทเลเมทรีแบบอ่านอย่างเดียวสำหรับอุปกรณ์ที่เชื่อมต่อของคุณ ฝ่ายปฏิบัติการ SE เป็นผู้จ่ายงานจากสัญญาณเตือน')}
          </p>
        </div>
      </div>

      <div className="live-kpi-strip" ref={flashRef}>
        <div className="card live-kpi">
          <span className="l"><Gauge size={13} aria-hidden style={{ verticalAlign: -2 }} /> {t('Total power now', 'กำลังไฟฟ้ารวมตอนนี้')}</span>
          <span className="v" style={{ color: 'var(--se-primary)' }}>{livePower.toFixed(1)}<span style={{ fontSize: 13, fontWeight: 600 }}> kW</span></span>
        </div>
        <div className="card live-kpi">
          <span className="l"><Wifi size={13} aria-hidden style={{ verticalAlign: -2 }} /> {t('Devices online', 'อุปกรณ์ออนไลน์')}</span>
          <span className="v" style={{ color: onlineCount === connected.length ? 'var(--se-success)' : 'var(--se-warning)' }}>{onlineCount}<span style={{ fontSize: 13, fontWeight: 600 }}> / {connected.length}</span></span>
        </div>
        <div className="card live-kpi">
          <span className="l"><AlertTriangle size={13} aria-hidden style={{ verticalAlign: -2 }} /> {t('Active alarms', 'สัญญาณเตือนที่มีผล')}</span>
          <span className="v" style={{ color: activeCount > 0 ? 'var(--se-danger)' : 'var(--se-text)' }}>{activeCount}</span>
        </div>
        <div className="card live-kpi">
          <span className="l"><Radio size={13} aria-hidden style={{ verticalAlign: -2 }} /> {t('Data points ingested', 'จำนวนข้อมูลที่รับ')}</span>
          <span className="v">{num(dataPoints)}<span style={{ fontSize: 12, fontWeight: 600, color: 'var(--se-text-secondary)' }}> · {throughput}/s</span></span>
        </div>
      </div>

      {connected.length === 0 ? (
        <EmptyState
          icon={<WifiOff size={24} />}
          title={t('No connected equipment yet', 'ยังไม่มีอุปกรณ์ที่เชื่อมต่อ')}
          body={t('Ask SE about adding an IoT gateway to see live telemetry here.', 'สอบถาม SE เรื่องการเพิ่มเกตเวย์ IoT เพื่อดูข้อมูลเรียลไทม์ที่นี่')}
          action={<Link to="/portal/requests/new" className="btn btn-primary btn-sm">{t('Ask SE about monitoring', 'สอบถาม SE เรื่องมอนิเตอริ่ง')}</Link>}
        />
      ) : (
        <>
          <div className="chip-row" style={{ marginBottom: 14 }}>
            {DEVICE_TABS.map((tb) => (
              <button key={tb} className={`chip ${tab === tb ? 'active' : ''}`} onClick={() => setTab(tb)} aria-pressed={tab === tb}>
                {lang === 'th' ? TAB_LABEL[tb].th : TAB_LABEL[tb].en}
              </button>
            ))}
          </div>

          <div className="grid-2" style={{ alignItems: 'start', marginBottom: 20 }}>
            <div style={{ display: 'grid', gap: 10 }}>
              {filtered.map((a) => {
                const active = a.iot!.alarms.some((al) => al.active);
                return (
                  <button
                    key={a.id}
                    className={`card device-card ${selectedDevice?.id === a.id ? 'selected' : ''}`}
                    onClick={() => selectDevice(a.id)}
                  >
                    <div className="between">
                      <div>
                        <div className="fw-600 small">{a.name}</div>
                        <div className="muted small">{a.id} · {siteName(customerCode, a.siteId, lang)}</div>
                      </div>
                      <span className={`badge ${a.iot!.online ? 't-green' : 't-grey'}`}>
                        {a.iot!.online ? <Wifi size={12} aria-hidden /> : <WifiOff size={12} aria-hidden />}
                        {a.iot!.online ? t('Online', 'ออนไลน์') : t('Offline', 'ออฟไลน์')}
                      </span>
                    </div>
                    <div className="flex" style={{ gap: 14, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      <DeviceQuickStats asset={a} lang={lang} />
                      {active && <StatusBadge label={t('Alarm active', 'มีสัญญาณเตือน')} tone="red" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="card" style={{ padding: 18 }}>
              {selectedDevice ? (
                <>
                  <div className="between" style={{ marginBottom: 6 }}>
                    <h3 style={{ margin: 0 }}>{selectedDevice.name}</h3>
                    <Link to={`/portal/equipment/${selectedDevice.id}`} className="btn btn-outline btn-sm">{t('Asset detail', 'รายละเอียดอุปกรณ์')}</Link>
                  </div>
                  <p className="muted small" style={{ marginTop: 0 }}>{selectedDevice.id} · {siteName(customerCode, selectedDevice.siteId, lang)}</p>

                  <LiveReadings asset={selectedDevice} t={t} />

                  <div style={{ height: 190 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={telemetrySeries(selectedDevice)} margin={{ top: 6, right: 12, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--se-border)" />
                        <XAxis dataKey="time" fontSize={11} />
                        <YAxis fontSize={11} />
                        <Tooltip formatter={(v: number) => `${v} kW`} />
                        <Line type="monotone" dataKey="kw" name="kW" stroke="var(--se-primary)" strokeWidth={2.5} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="muted small">
                    {t(
                      `Illustrative 24-hour power draw for ${selectedDevice.name}, generated from its current reading — connect a live gateway for real history.`,
                      `กราฟกำลังไฟฟ้า 24 ชั่วโมงของ ${selectedDevice.name} (ตัวอย่างจากค่าปัจจุบัน) — เชื่อมต่อเกตเวย์จริงเพื่อดูประวัติจริง`,
                    )}
                  </p>
                  <div className="stat-line"><span className="k">{t('Last data', 'ข้อมูลล่าสุด')}</span><span className="v">{selectedDevice.iot!.lastComm}</span></div>
                  <div className="stat-line"><span className="k">{t('Energy this month', 'พลังงานเดือนนี้')}</span><span className="v">{num(selectedDevice.iot!.energyMonthKwh)} kWh</span></div>

                  <div style={{ marginTop: 14 }}>
                    <div className="fw-600 small" style={{ marginBottom: 8 }}>
                      <Lightbulb size={14} aria-hidden style={{ verticalAlign: -2 }} /> {t('Recommendations to optimize operation', 'ข้อเสนอแนะเพื่อเพิ่มประสิทธิภาพการทำงาน')}
                    </div>
                    <div style={{ display: 'grid', gap: 8 }}>
                      {recommendations.map((r, i) => (
                        <div key={i} className={`alert-item ${r.tone === 'red' ? 'a-red' : r.tone === 'amber' ? 'a-amber' : 'a-blue'}`}>
                          <Lightbulb size={15} aria-hidden />
                          <span className="small">{lang === 'th' ? r.th : r.en}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <EmptyState
                  icon={<Eye size={22} />}
                  title={t('Select a device', 'เลือกอุปกรณ์')}
                  body={t('Choose a device from the list to see its live telemetry, readings and recommendations.', 'เลือกอุปกรณ์จากรายการเพื่อดูข้อมูลเรียลไทม์ ค่าที่วัดได้ และข้อเสนอแนะ')}
                />
              )}
            </div>
          </div>
        </>
      )}

      <div className="card" style={{ padding: 18 }}>
        <h3 style={{ marginTop: 0 }}>{t('Alarm feed', 'รายการสัญญาณเตือน')}</h3>
        {allAlarms.length === 0 ? (
          <p className="muted">{t('No alarms recorded for your connected equipment.', 'ไม่มีสัญญาณเตือนสำหรับอุปกรณ์ที่เชื่อมต่อของคุณ')}</p>
        ) : (
          allAlarms.map(({ asset, alarm, idx }) => (
            <div
              key={`${asset.id}-${idx}`}
              className={`alert-item ${alarm.severity === 'critical' ? 'a-red' : alarm.severity === 'warning' ? 'a-amber' : 'a-blue'}`}
              style={{ marginBottom: 8, cursor: 'pointer' }}
              onClick={() => openAlarm(asset.id, idx)}
            >
              <AlertTriangle size={16} aria-hidden />
              <span>
                <strong>{fmtDate(alarm.time.slice(0, 10), lang)}</strong> · {asset.name} — {alarm.message}{' '}
                {alarm.active
                  ? <StatusBadge label={t('Active', 'ยังมีผล')} tone="red" />
                  : <StatusBadge label={t('Cleared', 'เคลียร์แล้ว')} tone="grey" />}
              </span>
            </div>
          ))
        )}
        <p className="muted small" style={{ marginBottom: 0 }}>
          {t('This is a read-only alarm view. Dispatch and work orders are managed by the SE Operations team.', 'มุมมองสัญญาณเตือนนี้เป็นแบบอ่านอย่างเดียว การจ่ายงานและใบสั่งงานบริหารจัดการโดยทีมปฏิบัติการ SE')}
        </p>
      </div>

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
