import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import { Logo, LanguageSelector } from '@/components/common';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLang } from '@/contexts/LanguageContext';
import { ContactWidget } from '@/components/landing/ContactWidget';
import { CookieConsentBanner } from '@/components/landing/CookieConsentBanner';
import { apiGetLandingVideo, type LandingVideoResponse } from '@/lib/apiClient';
import { resolveVideoEmbed } from '@/lib/videoEmbed';
import { getAssetUrl } from '@/utils/assets';
import '@/styles/landing.css';

const SE = {
  site: 'https://siameastsolutions.com/',
  about: 'https://siameastsolutions.com/about-se-3/',
  products: 'https://siameastsolutions.com/product/',
  ir: 'https://siameastsolutions.com/ir/',
  esg: 'https://siameastsolutions.com/se-esg/',
  contact: 'https://siameastsolutions.com/contact-us/',
  privacy: 'https://siameastsolutions.com/privacy-policy/',
  terms: 'https://siameastsolutions.com/terms-and-conditions/',
  email: 'info@siameastsolutions.com',
  phone: '+66633935088',
};

const PATHS = {
  arrow: 'M5 12h14M13 6l6 6-6 6',
  shield: 'M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6l7-3zM9 12l2 2 4-4',
  play: 'M6 4l14 8-14 8V4z',
  send: 'M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z',
  activity: 'M22 12h-4l-3 9L9 3l-3 9H2',
  clipboard: 'M9 2h6a1 1 0 011 1v1h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2V3a1 1 0 011-1zM9 14l2 2 4-4',
  layers: 'M12 2l9 5-9 5-9-5 9-5zM3 12l9 5 9-5M3 17l9 5 9-5',
  db: 'M12 3c4.4 0 8 1.3 8 3s-3.6 3-8 3-8-1.3-8-3 3.6-3 8-3zM4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3',
  users: 'M17 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9.5 11a4 4 0 100-8 4 4 0 000 8zM22 21v-2a4 4 0 00-3-3.9M16 3.1a4 4 0 010 7.8',
  bar: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  zap: 'M13 2L4 14h7l-1 8 9-12h-7l1-8z',
};

function Ic({ d, size = 24, sw = 1.8 }: { d: string; size?: number; sw?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

function useReveal(deps: unknown[] = []) {
  const ref = useRef<HTMLDivElement>(null);
  const revealed = useRef<Set<Element>>(new Set());

  useEffect(() => {
    if (!ref.current) return;
    const els = ref.current.querySelectorAll('.rv');
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => {
        if (e.isIntersecting) {
          revealed.current.add(e.target);
          e.target.classList.add('in');
        }
      }),
      { threshold: 0.05 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  // React re-renders (e.g. once useAuth's initializing/user state settles)
  // reset each element's class attribute to whatever's in JSX, which would
  // wipe the imperatively-added "in" class right back off mid-transition.
  // Re-assert it after every render, before paint, so already-revealed
  // elements never flash back to invisible.
  useLayoutEffect(() => {
    revealed.current.forEach((el) => el.classList.add('in'));
  });

  return ref;
}

const VW = 500, VH = 380, CX = 250, CY = 190;
function toSVG(xPct: number, yPct: number) { return { x: (xPct / 100) * VW, y: (yPct / 100) * VH }; }

function PlatformShowcase() {
  const { t } = useLang();
  const STARTS_WITH_TABS = [
    { id: 'pump-systems', label: t('Pump Systems', 'ระบบปั๊ม'), titleLine1: t('Connect Every Pump', 'เชื่อมต่อทุกปั๊ม'), titleLine2: t('Optimize Performance', 'เพิ่มประสิทธิภาพสูงสุด'), desc: t('Monitor health, pressure, and vibration of industrial pumps in real-time to eliminate unexpected downtime and extend equipment life.', 'ตรวจสอบสุขภาพ แรงดัน และการสั่นสะเทือนของปั๊มอุตสาหกรรมแบบเรียลไทม์ เพื่อขจัดการหยุดทำงานที่ไม่คาดคิดและยืดอายุการใช้งานของอุปกรณ์'), image: getAssetUrl('assets/connect_every_pump_xn.webp'), points: [t('Real-time vibration & temperature telemetry', 'เทเลเมทรีการสั่นสะเทือนและอุณหภูมิแบบเรียลไทม์'), t('Predictive cavitation & mechanical seal warnings', 'คำเตือนคาวิเทชันและซีลเชิงกลเชิงคาดการณ์'), t('Automated flow rate & pressure optimization', 'การปรับอัตราการไหลและแรงดันอัตโนมัติ'), t('Direct SiamEast service ticket dispatch', 'ส่งใบแจ้งงานบริการ SiamEast โดยตรง'), t('Complete maintenance history & warranty logs', 'ประวัติการบำรุงรักษาครบถ้วนและบันทึกการรับประกัน')] },
    { id: 'solar-energy', label: t('Solar & Energy', 'พลังงานแสงอาทิตย์'), titleLine1: t('Smarter Energy', 'พลังงานอัจฉริยะ'), titleLine2: t('Clean Power Control', 'ควบคุมพลังงานสะอาด'), desc: t('Track solar generation, energy storage battery systems (BESS), and grid efficiency through one unified intelligent dashboard.', 'ติดตามการผลิตพลังงานแสงอาทิตย์ ระบบแบตเตอรี่เก็บพลังงาน (BESS) และประสิทธิภาพของระบบไฟฟ้าผ่านแดชบอร์ดอัจฉริยะเดียว'), image: getAssetUrl('assets/smartet_energy_xn.webp'), points: [t('Live solar inverter & panel output monitoring', 'ตรวจสอบการผลิตของอินเวอร์เตอร์และแผงโซลาร์แบบเรียลไทม์'), t('Battery storage (BESS) charge status tracking', 'ติดตามสถานะการชาร์จของแบตเตอรี่ (BESS)'), t('Peak shaving & energy cost optimization', 'การลดการใช้พลังงานช่วงพีคและปรับต้นทุนพลังงานให้เหมาะสม'), t('Carbon reduction & ESG compliance reporting', 'รายงานการลดคาร์บอนและการปฏิบัติตาม ESG'), t('Grid failover & microgrid load management', 'การสลับกริดและการจัดการโหลดไมโครกริด')] },
    { id: 'metering', label: t('Metering', 'มิเตอร์'), titleLine1: t('Smart Metering', 'มิเตอร์อัจฉริยะ'), titleLine2: t('Precision Data', 'ข้อมูลแม่นยำ'), desc: t('Centralize electric, water, gas, and flow meter readings to track consumption patterns and detect anomalies or leaks instantly.', 'รวมค่ามิเตอร์ไฟฟ้า น้ำ ก๊าซ และการไหลไว้ในที่เดียว เพื่อติดตามรูปแบบการใช้งานและตรวจจับความผิดปกติหรือการรั่วไหลได้ทันที'), image: getAssetUrl('assets/easy_meter_xn.webp'), points: [t('High-precision electric (kWh) & power monitoring', 'ตรวจสอบไฟฟ้า (kWh) และกำลังไฟฟ้าความแม่นยำสูง'), t('Digital water & fluid flow meter integration', 'เชื่อมต่อมิเตอร์น้ำและการไหลแบบดิจิทัล'), t('Gas pressure & consumption tracking', 'ติดตามแรงดันและการใช้ก๊าซ'), t('Automated utility billing & audit readiness', 'การเรียกเก็บค่าสาธารณูปโภคอัตโนมัติและพร้อมตรวจสอบ'), t('Instant leak & overload alert notifications', 'แจ้งเตือนการรั่วไหลและการโหลดเกินทันที')] },
    { id: 'iot-device', label: t('IoT Device', 'อุปกรณ์ IoT'), titleLine1: t('Connect Sensors', 'เชื่อมต่อเซนเซอร์'), titleLine2: t('Unlock Insights', 'ปลดล็อกข้อมูลเชิงลึก'), desc: t('Integrate PLCs, sensors and industrial IoT devices to automate data collection and improve operational awareness.', 'เชื่อมต่อ PLC เซนเซอร์ และอุปกรณ์ IoT อุตสาหกรรม เพื่อเก็บข้อมูลอัตโนมัติและเพิ่มความตระหนักในการดำเนินงาน'), image: getAssetUrl('assets/iot_device_xn.webp'), points: [t('Wide range of device compatibility', 'รองรับอุปกรณ์หลากหลายประเภท'), t('Industrial protocols support', 'รองรับโปรโตคอลอุตสาหกรรม'), t('Real-time data acquisition', 'การเก็บข้อมูลแบบเรียลไทม์'), t('Edge processing & filtering', 'การประมวลผลและกรองข้อมูลที่ Edge'), t('Secure data transmission', 'การส่งข้อมูลอย่างปลอดภัย')] },
    { id: 'service-management', label: t('Service Management', 'การจัดการบริการ'), titleLine1: t('Manage Services', 'จัดการบริการ'), titleLine2: t('Maximize Reliability', 'เพิ่มความน่าเชื่อถือสูงสุด'), desc: t('Streamline the entire service lifecycle from requests to sign-off and track every activity for full visibility and compliance.', 'จัดการวงจรบริการทั้งหมดตั้งแต่คำขอจนถึงการลงนาม และติดตามทุกกิจกรรมเพื่อความโปร่งใสและการปฏิบัติตามข้อกำหนด'), image: getAssetUrl('assets/manage_services_xn.webp'), points: [t('Service request management', 'การจัดการคำขอบริการ'), t('Contracts & maintenance agreements', 'สัญญาและข้อตกลงการบำรุงรักษา'), t('PM schedule planning & tracking', 'การวางแผนและติดตามตาราง PM'), t('Digital sign-off & approvals', 'การลงนามและอนุมัติแบบดิจิทัล'), t('Complete service history', 'ประวัติบริการครบถ้วน')] },
  ];
  const [activeTabId, setActiveTabId] = useState('pump-systems');
  const activeTab = STARTS_WITH_TABS.find((tab) => tab.id === activeTabId) || STARTS_WITH_TABS[0];
  return (
    <section className="ph-showcase-section" id="showcase">
      <div className="wrap">
        <div className="ph-header rv">
          <div className="eyebrow"><span className="eyebrow-spark">✦</span> {t('Connected Ecosystem', 'ระบบนิเวศที่เชื่อมต่อกัน')}</div>
          <h2>{t('Everything Starts with', 'ทุกอย่างเริ่มต้นที่')} <span className="h-accent">Connex</span></h2>
          <p className="ph-sub">{t('Connect your industrial assets, energy systems and IoT devices through one intelligent platform.', 'เชื่อมต่อสินทรัพย์อุตสาหกรรม ระบบพลังงาน และอุปกรณ์ IoT ผ่านแพลตฟอร์มอัจฉริยะเดียว')}</p>
          <div className="ph-tabs-pills">
            {STARTS_WITH_TABS.map((tab) => (
              <button key={tab.id} className={`ph-pill-btn ${activeTabId === tab.id ? 'active' : ''}`} onClick={() => setActiveTabId(tab.id)}>{tab.label}</button>
            ))}
          </div>
        </div>
        <div className="starts-card rv">
          <div className="starts-card-left">
            <h3 className="starts-title">{activeTab.titleLine1}<br /><span className="starts-title-sub">{activeTab.titleLine2}</span></h3>
            <p className="starts-desc">{activeTab.desc}</p>
            <ul className="starts-points">
              {activeTab.points.map((pt, idx) => (
                <li key={idx} className="starts-point-item"><span className="starts-check-icon">✓</span><span>{pt}</span></li>
              ))}
            </ul>
          </div>
          <div className="starts-card-right">
            <div className="starts-img-wrap">
              <img src={activeTab.image} alt={activeTab.label} className="starts-img" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PlatformHub() {
  const { t } = useLang();
  const HUB_NODES = [
    { key: 'centralize', label: t('Centralize', 'รวมศูนย์ข้อมูล'), sub: t('All your asset data always updated in real-time', 'ข้อมูลสินทรัพย์ทั้งหมดอัปเดตแบบเรียลไทม์เสมอ'), color: '#1a73e8', bg: '#e8f0fe', icon: PATHS.db, x: 22, y: 24 },
    { key: 'collaborate', label: t('Collaborate', 'ทำงานร่วมกัน'), sub: t('Assign and manage tasks across your team', 'มอบหมายและจัดการงานทั่วทั้งทีม'), color: '#f2871f', bg: '#fff3e6', icon: PATHS.users, x: 78, y: 24 },
    { key: 'track', label: t('Track', 'ติดตาม'), sub: t('Monitor asset health and performance metrics', 'ตรวจสอบสุขภาพและตัวชี้วัดประสิทธิภาพของสินทรัพย์'), color: '#34a853', bg: 'rgba(52,168,83,.12)', icon: PATHS.bar, x: 22, y: 76 },
    { key: 'resolve', label: t('Resolve', 'แก้ไขปัญหา'), sub: t('Automated alerts and instant problem resolution', 'แจ้งเตือนอัตโนมัติและแก้ไขปัญหาทันที'), color: '#7c3aed', bg: 'rgba(139,92,246,.12)', icon: PATHS.zap, x: 78, y: 76 },
  ];
  const [hovered, setHovered] = useState<string | null>(null);
  return (
    <section className="ph-section" id="platform">
      <div className="wrap">
        <div className="ph-header rv">
          <div className="eyebrow"><span className="eyebrow-spark">✦</span> {t('Hub Architecture', 'สถาปัตยกรรม Hub')}</div>
          <h2>{t('One Platform.', 'แพลตฟอร์มเดียว')}<br /><span className="h-accent">{t('All Operations.', 'ครบทุกการดำเนินงาน')}</span></h2>
          <p className="ph-sub">{t('Keep every asset connected, every engineer informed, and every team aligned.', 'เชื่อมสินทรัพย์ทุกชิ้น แจ้งวิศวกรทุกคน และประสานทุกทีม')}</p>
        </div>
        <div className="ph-diagram rv">
          <svg className="ph-svg" viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="xMidYMid meet" aria-hidden>
            <defs>
              <radialGradient id="glow-center" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#1a73e8" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#1a73e8" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx={CX} cy={CY} r="80" fill="url(#glow-center)" />
            {HUB_NODES.map((n) => {
              const p = toSVG(n.x, n.y);
              const isActive = hovered === n.key;
              return <line key={n.key} x1={p.x} y1={p.y} x2={CX} y2={CY} stroke={isActive ? n.color : '#d0d5dd'} strokeWidth={isActive ? 2 : 1.5} strokeDasharray="6 4" style={{ transition: 'stroke .25s, stroke-width .25s' }} />;
            })}
            {HUB_NODES.map((n, i) => {
              const p = toSVG(n.x, n.y);
              return (
                <circle key={n.key} r="4.5" fill={n.color} opacity="0.85">
                  <animateMotion dur={`${2.2 + i * 0.4}s`} repeatCount="indefinite" begin={`${i * 0.55}s`}>
                    <mpath href={`#ph-path-${n.key}`} />
                  </animateMotion>
                </circle>
              );
            })}
            {HUB_NODES.map((n) => {
              const p = toSVG(n.x, n.y);
              return <path key={n.key} id={`ph-path-${n.key}`} d={`M${p.x},${p.y} L${CX},${CY}`} fill="none" />;
            })}
          </svg>
          {HUB_NODES.map((n) => (
            <div key={n.key} className={`ph-node${hovered === n.key ? ' ph-node--active' : ''}`} style={{ left: `${n.x}%`, top: `${n.y}%` }} onMouseEnter={() => setHovered(n.key)} onMouseLeave={() => setHovered(null)}>
              <div className="ph-circle" style={{ borderColor: hovered === n.key ? n.color : undefined, boxShadow: hovered === n.key ? `0 0 0 4px ${n.color}20, 0 12px 32px rgba(16,24,40,.14)` : undefined }}>
                <div className="ph-icon" style={{ background: n.bg, color: n.color }}><Ic d={n.icon} size={24} sw={2.2} /></div>
                <span className="ph-label">{n.label}</span>
              </div>
              <p className="ph-sub-text">{n.sub}</p>
            </div>
          ))}
          <div className="ph-center">
            <div className="ph-center-ring ph-center-ring--2" />
            <div className="ph-center-ring ph-center-ring--1" />
            <div className="ph-center-circle">
              <div style={{ background: '#fff', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center' }}>
                <Logo height={22} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function LandingPage() {
  const navigate = useNavigate();
  const { user, initializing } = useAuth();
  const { companySelected } = useCompany();
  const { theme, toggleTheme } = useTheme();
  const { t } = useLang();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [landingVideo, setLandingVideo] = useState<LandingVideoResponse | null>(null);

  // Admin-managed (frontend-admin's Settings > Landing Video) — swallow errors
  // so a flaky/offline call never breaks the public landing page, it just
  // leaves the Watch Video button hidden (same as the disabled-by-default state).
  useEffect(() => {
    apiGetLandingVideo().then(setLandingVideo).catch(() => {});
  }, []);
  // `initializing` gates the first real paint (see the early return below):
  // on the very first render this component returns null, so `root` never
  // attaches to a DOM node and the reveal observer has nothing to watch.
  // Re-running the effect once `initializing` flips to false lets it observe
  // the real content on the render where it actually exists.
  const root = useReveal([initializing]);

  useEffect(() => {
    if (videoModalOpen) {
      document.body.style.overflow = 'hidden';
      const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setVideoModalOpen(false); };
      window.addEventListener('keydown', handleKey);
      return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', handleKey); };
    } else {
      document.body.style.overflow = '';
    }
  }, [videoModalOpen]);

  if (initializing) return null;
  if (user && companySelected) return <Navigate to="/portal" replace />;

  const goLogin = () => navigate('/login');

  return (
    <div ref={root} className="se-landing">

      {/* ── NAV ── */}
      <header className="nav">
        <div className="nav-inner">
          <a className="logo" href="#top">
            <Logo height={36} />
          </a>
          <nav className="nav-links">
            <a href="#features">{t('Features', 'ฟีเจอร์')}</a>
            <a href="#platform">{t('Solutions', 'โซลูชัน')}</a>
            <a href="#impact">{t('Impact', 'ผลลัพธ์')}</a>
            <a href={SE.about} target="_blank" rel="noopener">{t('About', 'เกี่ยวกับเรา')}</a>
          </nav>
          <div className="nav-actions">
            <LanguageSelector />
            <button
              type="button"
              className="icon-btn"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? t('Switch to light mode', 'สลับเป็นโหมดสว่าง') : t('Switch to dark mode', 'สลับเป็นโหมดมืด')}
              title={theme === 'dark' ? t('Light mode', 'โหมดสว่าง') : t('Dark mode', 'โหมดมืด')}
            >
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <button className="btn btn-nav-signin btn-sm" onClick={goLogin}>{t('Sign In', 'เข้าสู่ระบบ')}</button>
          </div>
          <button className="nav-hamburger" aria-label="Toggle menu" onClick={() => setMobileMenuOpen((o) => !o)}>
            <span /><span /><span />
          </button>
        </div>
      </header>

      {/* ── MOBILE MENU ── */}
      <div className={`nav-mobile-menu${mobileMenuOpen ? ' open' : ''}`} role="navigation">
        <a href="#features" onClick={() => setMobileMenuOpen(false)}>{t('Features', 'ฟีเจอร์')}</a>
        <a href="#platform" onClick={() => setMobileMenuOpen(false)}>{t('Solutions', 'โซลูชัน')}</a>
        <a href="#impact" onClick={() => setMobileMenuOpen(false)}>{t('Impact', 'ผลลัพธ์')}</a>
        <a href={SE.about} target="_blank" rel="noopener" onClick={() => setMobileMenuOpen(false)}>{t('About', 'เกี่ยวกับเรา')}</a>
        <div className="nav-mobile-divider" />
        <div className="nav-mobile-actions">
          <LanguageSelector onSelect={() => setMobileMenuOpen(false)} />
          <button
            type="button"
            className="icon-btn"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? t('Switch to light mode', 'สลับเป็นโหมดสว่าง') : t('Switch to dark mode', 'สลับเป็นโหมดมืด')}
            title={theme === 'dark' ? t('Light mode', 'โหมดสว่าง') : t('Dark mode', 'โหมดมืด')}
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button className="btn btn-nav-signin btn-sm" onClick={() => { goLogin(); setMobileMenuOpen(false); }}>{t('Sign In', 'เข้าสู่ระบบ')}</button>
        </div>
      </div>

      {/* ── HERO ── */}
      <span id="top" />
      <section className="hero">
        <div className="wrap">
          <div className="hero-grid">
            <div className="hero-copy rv">
              <h1>{t('Everything', 'ทุกอย่าง')}<br />{t('Connected.', 'เชื่อมต่อกัน')}<br /><span className="h1-accent">{t('Work Simplified.', 'งานง่ายขึ้น.')}</span></h1>
              <p className="hero-sub">
                {t(
                  'SE Connex is the exclusive platform for customers who purchase with SiamEast Solutions PCL. Manage your SE assets, access value-added services, and stay connected — anytime, anywhere.',
                  'SE Connex คือแพลตฟอร์มสำหรับลูกค้า SiamEast Solutions PCL โดยเฉพาะ จัดการสินทรัพย์ SE เข้าถึงบริการมูลค่าเพิ่ม และติดตามสถานะได้ทุกที่ทุกเวลา'
                )}
              </p>
              <div className="hero-btns">
                <button className="btn btn-primary btn-lg" onClick={goLogin}>
                  {t('Get Started Free', 'เริ่มต้นใช้งานฟรี')} <Ic d={PATHS.arrow} size={17} />
                </button>
                {landingVideo?.enabled && landingVideo.videoUrl && (
                  <button className="btn btn-ghost btn-lg" onClick={() => setVideoModalOpen(true)}>
                    <Ic d={PATHS.play} size={17} /> {t('Watch Video', 'ดูวิดีโอ')}
                  </button>
                )}
              </div>
              <div className="hero-list">
                {([
                  [PATHS.send, t('Easy to Report', 'รายงานง่าย')],
                  [PATHS.activity, t('Real-time Monitoring', 'ติดตามแบบเรียลไทม์')],
                  [PATHS.clipboard, t('PM/CM Management', 'จัดการ PM/CM')],
                  [PATHS.layers, t('All Information In One Place', 'ข้อมูลครบในที่เดียว')],
                ] as [string, string][]).map(([d, label]) => (
                  <div className="hlist-item" key={label}>
                    <span className="hlist-ic"><Ic d={d} size={18} /></span>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="hero-devices rv" id="hero-mockup">
              <div className="devices-stage">
                <img src={getAssetUrl('assets/DEVICE.png')} className="dev-img dev-img-single" alt="SE Connex devices" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
            </div>
          </div>
          <div className="sec-card-hero rv">
            <div className="sec-icon"><Ic d={PATHS.shield} size={28} /></div>
            <div className="sec-text">
              <strong>{t('Built for Security. Backed by SE.', 'ออกแบบมาเพื่อความปลอดภัย รับรองโดย SE')}</strong><br />
              <span><small>{t('Your data and assets are protected with enterprise-grade security and trusted by SiamEast Solutions PCL.', 'ข้อมูลและสินทรัพย์ของคุณได้รับการคุ้มครองด้วยความปลอดภัยระดับองค์กร โดย SiamEast Solutions PCL')}</small></span>
            </div>
            <button className="btn btn-sec-learn btn-sm" onClick={goLogin}>{t('Learn Security', 'เรียนรู้เรื่องความปลอดภัย')}</button>
          </div>
        </div>
      </section>

      <PlatformShowcase />
      <PlatformHub />

      {/* ── BETTER OPERATIONS ── */}
      <section className="bop-section" id="features">
        <div className="wrap">
          <div className="bop-layout rv">
            <div className="bop-left">
              <h2 className="bop-h2">{t('Better Operations.', 'การดำเนินงานที่ดีขึ้น')}<br /><span className="bop-accent">{t('Stronger Results.', 'ผลลัพธ์ที่แข็งแกร่งกว่า')}</span></h2>
            </div>
            <div className="bop-right">
              <div className="btd-label">{t('BUILD TO DELIVER IMPACT', 'สร้างมาเพื่อส่งมอบผลลัพธ์')}</div>
              <p className="btd-desc">{t('SE Connex empowers teams to minimize downtime, increase efficiency, and drive overall plant performance.', 'SE Connex ช่วยให้ทีมลดการหยุดทำงาน เพิ่มประสิทธิภาพ และขับเคลื่อนผลการดำเนินงานโรงงาน')}</p>
            </div>
          </div>
          <div className="bop-cards rv">
            <div className="bcard">
              <div className="bcard-ic" style={{ background: '#e8f0fe', color: '#1a73e8' }}><Ic d={PATHS.layers} size={22} /></div>
              <div className="bcard-num">400</div>
              <div className="bcard-title">{t('Assets Managed', 'สินทรัพย์ที่จัดการ')}</div>
              <p>{t('All your SE equipment fully covered — from utility to heavy processes.', 'ครอบคลุมอุปกรณ์ SE ของคุณทั้งหมด ตั้งแต่สาธารณูปโภคถึงกระบวนการหนัก')}</p>
            </div>
            <div className="bcard">
              <div className="bcard-ic" style={{ background: '#fff3e6', color: '#f2871f' }}><Ic d={PATHS.bar} size={22} /></div>
              <div className="bcard-num">30%</div>
              <div className="bcard-title">{t('Expected Efficiency Gain', 'ประสิทธิภาพที่คาดหวัง')}</div>
              <p>{t('Work order processing speed and proactive maintenance response times.', 'ความเร็วในการประมวลผลใบสั่งงานและเวลาตอบสนองการบำรุงรักษาเชิงรุก')}</p>
            </div>
            <div className="bcard bcard-live">
              <div className="bcard-badge">NEW</div>
              <div className="bcard-ic" style={{ background: 'rgba(52,168,83,.12)', color: '#34a853' }}><Ic d={PATHS.activity} size={22} /></div>
              <div className="bcard-num">Live <span className="bcard-num-sub">{t('Monitoring', 'ติดตาม')}</span></div>
              <div className="bcard-title">{t('& Energy Tracking', 'และการติดตามพลังงาน')}</div>
              <p>{t('Track energy usage so your time leads to more informed decisions.', 'ติดตามการใช้พลังงานเพื่อการตัดสินใจที่ชาญฉลาดยิ่งขึ้น')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── EXCLUSIVELY FOR CUSTOMERS ── */}
      <section className="excl-section">
        <div className="wrap">
          <div className="excl-head rv">
            <h2>{t('Exclusively for', 'สำหรับ')} <span className="excl-cust">{t('Customers', 'ลูกค้า')}</span><br />{t('Who Purchase with', 'ที่ซื้อสินค้ากับ')} <span className="excl-se">SE</span></h2>
            <p>{t('SE Connex is available only to customers who purchase products and solutions from SiamEast Solutions PCL.', 'SE Connex พร้อมใช้งานสำหรับลูกค้าที่ซื้อผลิตภัณฑ์และโซลูชันจาก SiamEast Solutions PCL เท่านั้น')}</p>
          </div>
          <div className="excl-cards rv">
            {[
              [PATHS.shield, t('Verified SE Assets Only', 'เฉพาะสินทรัพย์ SE ที่ยืนยันแล้ว'), t('Access is limited to your verified SE assets.', 'การเข้าถึงจำกัดเฉพาะสินทรัพย์ SE ที่ยืนยันของคุณ')],
              [PATHS.zap, t('Value-Added Services', 'บริการมูลค่าเพิ่ม'), t('Enjoy exclusive benefits and priority support.', 'รับสิทธิประโยชน์พิเศษและการสนับสนุนลำดับความสำคัญ')],
              [PATHS.users, t('Free for SE Customers', 'ฟรีสำหรับลูกค้า SE'), t('A thank you from SE for choosing us.', 'คำขอบคุณจาก SE ที่เลือกใช้เรา')],
              [PATHS.activity, t('Ongoing Innovation', 'นวัตกรรมต่อเนื่อง'), t('Continuous improvements to serve you better.', 'การปรับปรุงอย่างต่อเนื่องเพื่อให้บริการคุณได้ดียิ่งขึ้น')],
            ].map(([d, title, desc]) => (
              <div className="excl-card" key={title as string}>
                <div className="excl-ic"><Ic d={d as string} size={24} /></div>
                <div className="excl-text-wrap">
                  <h4>{title as string}</h4>
                  <p>{desc as string}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EVERYTHING YOU NEED ── */}
      <section className="eyn-section" id="impact">
        <div className="wrap">
          <div className="eyn-head rv">
            <div className="eyebrow-sm">{t('EXPLORE THE PLATFORM', 'สำรวจแพลตฟอร์ม')}</div>
            <h2 className="eyn-h2">{t('Everything You Need.', 'ทุกสิ่งที่คุณต้องการ')}<br />{t('In One Place.', 'ในที่เดียว')}</h2>
          </div>
          <div className="eyn-cards rv">
            {[
              [PATHS.layers, t('Asset Management', 'การจัดการสินทรัพย์'), t('All your equipment registry and state in one place.', 'ทะเบียนอุปกรณ์และสถานะทั้งหมดในที่เดียว')],
              [PATHS.send, t('Issue Reporting', 'รายงานปัญหา'), t('Report issues directly to the engineering support team.', 'รายงานปัญหาโดยตรงถึงทีมสนับสนุนวิศวกรรม')],
              [PATHS.clipboard, t('PM/CM Management', 'จัดการ PM/CM'), t('Track schedule and confirm preventive and corrective maintenance.', 'ติดตามตารางและยืนยันการบำรุงรักษาเชิงป้องกันและแก้ไข')],
              [PATHS.shield, t('Service & Support', 'บริการและสนับสนุน'), t('Direct channel to engineering support for fast response.', 'ช่องทางตรงถึงทีมสนับสนุนวิศวกรรมสำหรับการตอบสนองที่รวดเร็ว')],
            ].map(([d, title, desc]) => (
              <div className="eyn-card" key={title as string}>
                <div className="eyn-ic"><Ic d={d as string} size={28} /></div>
                <h4>{title as string}</h4>
                <p>{desc as string}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="footer">
        <div className="wrap">
          <div className="foot-grid">
            <div className="foot-brand">
              <img src={getAssetUrl('assets/logo-connex.svg')} alt="SE Connex" style={{ width: 52, height: 52, borderRadius: 10, marginBottom: 10, display: 'block' }} />
              <span className="lo-brand"><span className="lo-se">SE</span> CONNEX</span>
              <span className="lo-tag">SiamEast Solutions PCL</span>
              <p>{t('Helping modern industrial plants work smarter, stay connected, and maximize efficiency.', 'ช่วยให้โรงงานอุตสาหกรรมสมัยใหม่ทำงานอัจฉริยะขึ้น เชื่อมต่อกัน และเพิ่มประสิทธิภาพสูงสุด')}</p>
            </div>
            <div className="foot-col">
              <h4>{t('Product', 'ผลิตภัณฑ์')}</h4>
              <a href="#features">{t('Features', 'ฟีเจอร์')}</a>
              <a href="#platform">{t('Solutions', 'โซลูชัน')}</a>
              <a href="#impact">{t('Impact', 'ผลลัพธ์')}</a>
              <button className="btn-link" onClick={goLogin}>{t('Portal Sign In', 'เข้าสู่ระบบพอร์ทัล')}</button>
            </div>
            <div className="foot-col">
              <h4>{t('Resources', 'ทรัพยากร')}</h4>
              <a href={SE.products} target="_blank" rel="noopener">{t('Products Catalog', 'แคตาล็อกผลิตภัณฑ์')}</a>
              <a href={SE.esg} target="_blank" rel="noopener">{t('ESG & Sustainability', 'ESG และความยั่งยืน')}</a>
              <a href={SE.ir} target="_blank" rel="noopener">{t('Investor Relations', 'นักลงทุนสัมพันธ์')}</a>
            </div>
            <div className="foot-col">
              <h4>{t('Company', 'บริษัท')}</h4>
              <a href={SE.about} target="_blank" rel="noopener">{t('About SiamEast', 'เกี่ยวกับ SiamEast')}</a>
              <a href={SE.contact} target="_blank" rel="noopener">{t('Contact Us', 'ติดต่อเรา')}</a>
              <a href="tel:+66633935088">+66 63 393 5088</a>
            </div>
          </div>
          <div className="foot-bot">
            <p>© {new Date().getFullYear()} SiamEast Solutions PCL. {t('All rights reserved.', 'สงวนลิขสิทธิ์')}</p>
            <div className="foot-legal">
              <a href={SE.privacy} target="_blank" rel="noopener">{t('Privacy Policy', 'นโยบายความเป็นส่วนตัว')}</a>
              <a href={SE.terms} target="_blank" rel="noopener">{t('Terms of Service', 'เงื่อนไขการใช้บริการ')}</a>
            </div>
          </div>
        </div>
      </footer>

      {/* ── VIDEO MODAL ── */}
      {videoModalOpen && landingVideo?.videoUrl && (
        <div className="video-modal-overlay" onClick={() => setVideoModalOpen(false)}>
          <div className="video-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="video-modal-close" onClick={() => setVideoModalOpen(false)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <div className="video-modal-player">
              {(() => {
                const embed = resolveVideoEmbed(landingVideo.videoUrl);
                return embed.kind === 'file' ? (
                  <video src={embed.embedSrc} controls autoPlay playsInline loop className="video-modal-real-mp4" />
                ) : (
                  <iframe
                    src={embed.embedSrc}
                    className="video-modal-real-mp4"
                    style={{ border: 0 }}
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                  />
                );
              })()}
            </div>
          </div>
        </div>
      )}

      <ContactWidget phone={SE.phone} email={SE.email} />
      <CookieConsentBanner privacyUrl={SE.privacy} />
    </div>
  );
}
