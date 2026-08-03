import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Info, Leaf, Wifi, Zap } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useLang } from '@/contexts/LanguageContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useToast } from '@/contexts/ToastContext';
import { ExportButton, KpiCard, StatusBadge } from '@/components/common';
import { carbonFor } from '@/data/mockCarbon';
import { num } from '@/utils/format';

const DISCLAIMER =
  'Energy and carbon figures shown in this prototype are illustrative estimates. Formal carbon-credit issuance requires an approved methodology, verified data and applicable third-party validation.';

export function CarbonPage() {
  const { lang, t } = useLang();
  const { customerCode, company } = useCompany();
  const { showToast } = useToast();
  const [period, setPeriod] = useState('12m');
  const [site, setSite] = useState('');

  const data = useMemo(() => carbonFor(customerCode), [customerCode]);
  const latest = data.trend[data.trend.length - 1]!;
  const savedVsBaseline = Math.round(((latest.baseline - latest.kwh) / latest.baseline) * 100);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('Energy & Carbon', 'พลังงานและคาร์บอน')}</h1>
          <p className="page-sub">
            {t(
              'Estimated energy performance across your connected equipment, and progress toward carbon-credit readiness.',
              'ประสิทธิภาพพลังงานโดยประมาณของอุปกรณ์ที่เชื่อมต่อ และความพร้อมสู่คาร์บอนเครดิต',
            )}
          </p>
        </div>
        <div className="page-actions">
          <select value={period} onChange={(e) => setPeriod(e.target.value)} aria-label={t('Period', 'ช่วงเวลา')}>
            <option value="12m">{t('Last 12 months', '12 เดือนล่าสุด')}</option>
            <option value="6m">{t('Last 6 months (demo view)', '6 เดือนล่าสุด (มุมมองเดโม)')}</option>
          </select>
          <select value={site} onChange={(e) => setSite(e.target.value)} aria-label={t('Site', 'ไซต์')}>
            <option value="">{t('All sites', 'ทุกไซต์')}</option>
            {company.sites.map((s) => (
              <option key={s.id} value={s.id}>{lang === 'th' ? s.nameTh : s.name}</option>
            ))}
          </select>
          <ExportButton label={t('Export data', 'ส่งออกข้อมูล')} />
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid-4" style={{ marginBottom: 16 }}>
        <KpiCard
          icon={<Wifi size={22} />}
          value={`${data.connectedAssets}/${data.totalAssets}`}
          label={t('Assets with monitoring', 'อุปกรณ์ที่เชื่อมต่อ')}
          sub={t(`${data.coveragePct}% data coverage`, `ครอบคลุมข้อมูล ${data.coveragePct}%`)}
          to="/portal/equipment"
          tone="blue"
        />
        <KpiCard
          icon={<Zap size={22} />}
          value={`${num(data.monthlyKwh)} kWh`}
          label={t('Energy this month (est.)', 'พลังงานเดือนนี้ (ประมาณ)')}
          sub={t(`${savedVsBaseline}% below baseline`, `ต่ำกว่าเส้นฐาน ${savedVsBaseline}%`)}
          to="/portal/equipment?warranty=active"
        />
        <KpiCard
          icon={<Leaf size={22} />}
          value={`${num(data.savedKwh)} kWh`}
          label={t('Energy saved YTD (est.)', 'พลังงานที่ประหยัดปีนี้ (ประมาณ)')}
          sub={t('vs. pre-upgrade baseline', 'เทียบกับเส้นฐานก่อนปรับปรุง')}
          to="/portal/carbon"
          tone="green"
        />
        <KpiCard
          icon={<Leaf size={22} />}
          value={`${data.co2AvoidedTons} tCO₂e`}
          label={t('CO₂ avoided YTD (est.)', 'CO₂ ที่หลีกเลี่ยงได้ปีนี้ (ประมาณ)')}
          sub={t('grid emission factor applied', 'ใช้ค่าสัมประสิทธิ์การปล่อยของกริด')}
          to="/portal/carbon"
          tone="green"
        />
      </div>

      {/* Trend chart */}
      <div className="card" style={{ padding: 18, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>{t('Monthly energy vs. baseline', 'พลังงานรายเดือนเทียบเส้นฐาน')}</h3>
        <div style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.trend} margin={{ top: 6, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--se-border)" />
              <XAxis dataKey="month" fontSize={12} />
              <YAxis fontSize={12} tickFormatter={(v: number) => `${Math.round(v / 1000)}k`} />
              <Tooltip formatter={(v: number) => `${num(v)} kWh`} />
              <Legend />
              <Line type="monotone" dataKey="baseline" name={t('Baseline', 'เส้นฐาน')} stroke="#b0b9c4" strokeDasharray="6 4" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="kwh" name={t('Measured + estimated', 'วัดจริง + ประมาณ')} stroke="var(--se-primary)" dot={false} strokeWidth={2.5} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="muted small" style={{ marginBottom: 0 }}>
          {t(
            `Summary: consumption has stayed below the baseline every month for the past year; in ${latest.month} it was ${num(latest.kwh)} kWh against a ${num(latest.baseline)} kWh baseline (${savedVsBaseline}% lower), driven mainly by the pump upgrades and solar generation at your connected sites.`,
            `สรุป: การใช้พลังงานต่ำกว่าเส้นฐานทุกเดือนตลอดปีที่ผ่านมา ล่าสุดเดือน ${latest.month} ใช้ ${num(latest.kwh)} kWh เทียบกับเส้นฐาน ${num(latest.baseline)} kWh (ต่ำกว่า ${savedVsBaseline}%) ผลหลักมาจากการอัปเกรดปั๊มและโซลาร์ที่ไซต์ที่เชื่อมต่อ`,
          )}
        </p>
      </div>

      <div className="grid-2" style={{ alignItems: 'start', marginBottom: 16 }}>
        {/* By site */}
        <div className="card" style={{ padding: 18 }}>
          <h3 style={{ marginTop: 0 }}>{t('Energy by site (this month)', 'พลังงานตามไซต์ (เดือนนี้)')}</h3>
          <div style={{ height: 210 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.bySite} margin={{ top: 6, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--se-border)" />
                <XAxis dataKey="site" fontSize={12} />
                <YAxis fontSize={12} tickFormatter={(v: number) => `${Math.round(v / 1000)}k`} />
                <Tooltip formatter={(v: number) => `${num(v)} kWh`} />
                <Bar dataKey="kwh" name="kWh" fill="var(--se-primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'grid', gap: 6, marginTop: 8 }}>
            {data.bySite.map((s) => (
              <div key={s.site} className="between small">
                <span>{s.site}</span>
                <span className="flex" style={{ gap: 8 }}>
                  <strong>{num(s.kwh)} kWh</strong>
                  <StatusBadge
                    label={s.label === 'measured' ? t('Measured', 'วัดจริง') : t('Estimated', 'ประมาณ')}
                    tone={s.label === 'measured' ? 'blue' : 'grey'}
                  />
                </span>
              </div>
            ))}
          </div>
          <p className="muted small" style={{ marginBottom: 0 }}>
            {t(
              'Summary: sites with SE monitoring gateways report measured values; the rest are engineering estimates from nameplate data and runtime assumptions.',
              'สรุป: ไซต์ที่มีเกตเวย์มอนิเตอริ่งของ SE เป็นค่าวัดจริง ส่วนที่เหลือเป็นค่าประมาณทางวิศวกรรมจากข้อมูลเนมเพลตและชั่วโมงทำงาน',
            )}
          </p>
        </div>

        {/* By category + coverage */}
        <div style={{ display: 'grid', gap: 16 }}>
          <div className="card" style={{ padding: 18 }}>
            <h3 style={{ marginTop: 0 }}>{t('Energy by equipment category', 'พลังงานตามหมวดอุปกรณ์')}</h3>
            {data.byCategory.map((c) => {
              const total = data.byCategory.reduce((s, x) => s + x.kwh, 0);
              const pct = Math.round((c.kwh / total) * 100);
              return (
                <div key={c.category} style={{ marginBottom: 10 }}>
                  <div className="between small" style={{ marginBottom: 3 }}>
                    <span>{c.category}</span>
                    <strong>{num(c.kwh)} kWh · {pct}%</strong>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: 'var(--se-grey-soft)' }} aria-hidden>
                    <div style={{ width: `${pct}%`, height: '100%', borderRadius: 4, background: 'var(--se-primary)' }} />
                  </div>
                </div>
              );
            })}
            <p className="muted small" style={{ marginBottom: 0 }}>
              {t('Summary: pumping systems remain the largest consumer, which is why they lead the savings program.', 'สรุป: ระบบปั๊มยังคงใช้พลังงานมากที่สุด จึงเป็นเป้าหมายหลักของโปรแกรมประหยัดพลังงาน')}
            </p>
          </div>

          <div className="card" style={{ padding: 18 }}>
            <h3 style={{ marginTop: 0 }}>{t('Improve data coverage', 'เพิ่มความครอบคลุมของข้อมูล')}</h3>
            <p className="muted small" style={{ marginTop: 0 }}>
              {t(
                `${data.coveragePct}% of estimated consumption is backed by measured data. These assets currently reduce data quality:`,
                `ข้อมูลวัดจริงครอบคลุม ${data.coveragePct}% ของการใช้พลังงานโดยประมาณ อุปกรณ์ต่อไปนี้ยังลดคุณภาพข้อมูล:`,
              )}
            </p>
            {data.incompleteAssets.map((a) => (
              <div key={a.assetId} className="between small" style={{ padding: '8px 0', borderBottom: '1px dashed var(--se-border)', gap: 8 }}>
                <div>
                  <Link to={`/portal/equipment/${a.assetId}`} className="fw-600">{a.name}</Link>
                  <div className="muted small">{a.issue}</div>
                </div>
                <StatusBadge label={t('Incomplete', 'ข้อมูลไม่ครบ')} tone="amber" />
              </div>
            ))}
            <Link to="/portal/requests/new" className="btn btn-outline btn-sm" style={{ marginTop: 12 }}>
              {t('Ask SE about adding monitoring', 'สอบถาม SE เรื่องเพิ่มมอนิเตอริ่ง')}
            </Link>
          </div>
        </div>
      </div>

      {/* Sensor accuracy / evidence status */}
      <div className="grid-2" style={{ alignItems: 'start', marginBottom: 16 }}>
        <div className="card" style={{ padding: 18 }}>
          <h3 style={{ marginTop: 0 }}>{t('Sensor accuracy / uncertainty', 'ความแม่นยำ / ความไม่แน่นอนของเซนเซอร์')}</h3>
          {[
            { meter: t('Power meters', 'มิเตอร์กำลังไฟฟ้า'), pct: '± 1.5%' },
            { meter: t('Flow meters', 'มิเตอร์อัตราการไหล'), pct: '± 2.0%' },
            { meter: t('Pressure sensors', 'เซนเซอร์ความดัน'), pct: '± 1.0%' },
            { meter: t('Temperature sensors', 'เซนเซอร์อุณหภูมิ'), pct: '± 0.5 °C' },
            { meter: t('Vibration (trend-based)', 'การสั่นสะเทือน (อิงแนวโน้ม)'), pct: t('Qualitative', 'เชิงคุณภาพ') },
          ].map((row) => (
            <div key={row.meter} className="stat-line"><span className="k">{row.meter}</span><span className="v">{row.pct}</span></div>
          ))}
          <p className="muted small" style={{ marginBottom: 0 }}>
            {t('This is what makes the carbon figures above defensible for external review.', 'นี่คือสิ่งที่ทำให้ตัวเลขคาร์บอนข้างต้นสามารถตรวจสอบโดยหน่วยงานภายนอกได้')}
          </p>
        </div>
        <div className="card" style={{ padding: 18 }}>
          <h3 style={{ marginTop: 0 }}>{t('Carbon evidence status', 'สถานะหลักฐานคาร์บอน')}</h3>
          <div className="stat-line"><span className="k">{t('Metered & verified', 'วัดและตรวจสอบแล้ว')}</span><span className="v"><StatusBadge label="Q1 2026" tone="green" /></span></div>
          <div className="stat-line"><span className="k">{t('Sensor calibration', 'การสอบเทียบเซนเซอร์')}</span><span className="v"><StatusBadge label={t('Valid', 'ยังไม่หมดอายุ')} tone="green" /></span></div>
          <div className="stat-line"><span className="k">{t('Evidence pack', 'ชุดหลักฐาน')}</span><span className="v"><StatusBadge label={t('Ready to export', 'พร้อมส่งออก')} tone="blue" /></span></div>
          <div className="stat-line"><span className="k">{t('Third-party audit', 'การตรวจสอบโดยบุคคลที่สาม')}</span><span className="v"><StatusBadge label={t('Scheduled Q3 2026', 'กำหนดการ Q3 2026')} tone="amber" /></span></div>
          <p className="muted small" style={{ marginBottom: 0 }}>
            {t('Formal carbon-credit issuance still requires an approved methodology and third-party validation — see the disclaimer below.', 'การออกคาร์บอนเครดิตอย่างเป็นทางการยังต้องใช้วิธีการที่ได้รับอนุมัติและการตรวจสอบโดยบุคคลที่สาม — ดูคำชี้แจงด้านล่าง')}
          </p>
        </div>
      </div>

      {/* Methodology */}
      <div className="card" style={{ padding: 18, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}><Info size={17} aria-hidden style={{ verticalAlign: -3 }} /> {t('How these numbers are calculated', 'วิธีคำนวณตัวเลขเหล่านี้')}</h3>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          <li style={{ marginBottom: 6 }}>
            {t('Measured values come from SE IoT gateways sampling power at 1-minute intervals, aggregated to monthly kWh.', 'ค่าวัดจริงมาจากเกตเวย์ IoT ของ SE ที่เก็บค่ากำลังไฟฟ้าทุก 1 นาที และรวมเป็น kWh รายเดือน')}
          </li>
          <li style={{ marginBottom: 6 }}>
            {t('Estimated values use nameplate power, load factors and operating-hour assumptions agreed with your maintenance team.', 'ค่าประมาณคำนวณจากกำลังไฟฟ้าเนมเพลต ตัวประกอบโหลด และสมมติฐานชั่วโมงทำงานที่ตกลงกับทีมซ่อมบำรุงของคุณ')}
          </li>
          <li style={{ marginBottom: 6 }}>
            {t('The baseline is the 2024 pre-upgrade consumption profile, weather-normalised.', 'เส้นฐานคือการใช้พลังงานปี 2024 ก่อนการปรับปรุง ปรับตามสภาพอากาศแล้ว')}
          </li>
          <li>
            {t('CO₂ avoided applies Thailand grid emission factor 0.4999 kgCO₂e/kWh to estimated savings.', 'CO₂ ที่หลีกเลี่ยงได้ใช้ค่าสัมประสิทธิ์การปล่อยของกริดไทย 0.4999 kgCO₂e/kWh คูณกับพลังงานที่ประหยัดได้')}
          </li>
        </ul>
        <div className="flex" style={{ gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
          <button className="btn btn-outline btn-sm" onClick={() => showToast(t('Methodology note download started (demo).', 'เริ่มดาวน์โหลดเอกสารวิธีคำนวณแล้ว (เดโม)'), 'info')}>
            <Download size={15} aria-hidden />
            {t('Methodology note (PDF)', 'เอกสารวิธีคำนวณ (PDF)')}
          </button>
          <Link to="/portal/requests/new" className="btn btn-outline btn-sm">
            {t('Talk to SE about carbon-credit readiness', 'ปรึกษา SE เรื่องความพร้อมคาร์บอนเครดิต')}
          </Link>
        </div>
      </div>

      {/* Mandatory disclaimer */}
      <div className="alert-item a-amber" role="note">
        <Info size={17} aria-hidden />
        <span className="small">{DISCLAIMER}</span>
      </div>
    </div>
  );
}
