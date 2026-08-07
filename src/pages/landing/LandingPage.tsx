import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe } from 'lucide-react';
import { ContactWidget } from '@/components/landing/ContactWidget';
import { CookieConsentBanner } from '@/components/landing/CookieConsentBanner';
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

// ponytail: flat object per lang, add react-i18next if locale count grows > 2
const T = {
  en: {
    navFeatures: 'Features', navSolutions: 'Solutions', navImpact: 'Impact', navAbout: 'About',
    signIn: 'Sign In',
    h1a: 'Everything', h1b: 'Connected.', h1c: 'Work Simplified.',
    heroSub: 'SE Connex is the exclusive platform for customers who purchase with SiamEast Solutions PCL. Manage your SE assets, access value-added services, and stay connected — anytime, anywhere.',
    getStarted: 'Get Started Free', watchVideo: 'Watch Video',
    feat1: 'Easy to Report', feat2: 'Real-time Monitoring', feat3: 'PM/CM Management', feat4: 'All Information In One Place',
    secCard: 'Build for Security. Backed by SE.',
    secCardSub: 'Your data and assets are protected with enterprise-grade security and trusted by SiamEast Solutions PCL.',
    learnSecurity: 'Learn Security',
    ecosystemEye: 'Connected Ecosystem', ecosystemH2a: 'Everything Starts with', ecosystemSub: 'Connect your industrial assets, energy systems and IoT devices through one intelligent platform.',
    hubEye: 'Hub Architecture', hubH2a: 'One Platform.', hubH2b: 'All Operations.', hubSub: 'Keep every asset connected, every engineer informed, and every team aligned.',
    bopH2a: 'Better Operations.', bopH2b: 'Stronger Results.',
    bopLabel: 'BUILD TO DELIVER IMPACT',
    bopDesc: 'SE Connex empowers teams to minimize downtime, increase efficiency, and drive overall plant performance.',
    bcard1Num: '400', bcard1Title: 'Assets Managed', bcard1Desc: 'All your SE equipment fully covered — from utility to heavy processes.',
    bcard2Num: '30%', bcard2Title: 'Expected Efficiency Gain', bcard2Desc: 'Work order processing speed and proactive maintenance response times.',
    bcard3Num: 'Live', bcard3NumSub: 'Monitoring', bcard3Title: '& Energy Tracking', bcard3Desc: 'Track energy usage so your time leads to more informed decisions.',
    exclH2a: 'Exclusively for', exclCust: 'Customers', exclH2b: 'Who Purchase with', exclSE: 'SE',
    exclSub: 'SE Connex is available only to customers who purchase products and solutions from SiamEast Solutions PCL.',
    excl1Title: 'Verified SE Assets Only', excl1Desc: 'Access is limited to your verified SE assets.',
    excl2Title: 'Value-Added Services', excl2Desc: 'Enjoy exclusive benefits and priority support.',
    excl3Title: 'Free for SE Customers', excl3Desc: 'A thank you from SE for choosing us.',
    excl4Title: 'Ongoing Innovation', excl4Desc: 'Continuous improvements to serve you better.',
    eynEye: 'EXPLORE THE PLATFORM', eynH2a: 'Everything You Need.', eynH2b: 'In One Place.',
    eyn1Title: 'Asset Management', eyn1Desc: 'All your equipment registry and state in one place.',
    eyn2Title: 'Issue Reporting', eyn2Desc: 'Report issues directly to the engineering support team.',
    eyn3Title: 'PM/CM Management', eyn3Desc: 'Track schedule and confirm preventive and corrective maintenance.',
    eyn4Title: 'Service & Support', eyn4Desc: 'Direct channel to engineering support for fast response.',
    footBrand: 'Helping modern industrial plants work smarter, stay connected, and maximize efficiency.',
    footProduct: 'Product', footPortal: 'Portal Sign In',
    footResources: 'Resources', footCatalog: 'Products Catalog', footESG: 'ESG & Sustainability', footIR: 'Investor Relations',
    footCompany: 'Company', footAbout: 'About SiamEast', footContact: 'Contact Us',
    footRights: 'All rights reserved.', footPrivacy: 'Privacy Policy', footTerms: 'Terms of Service',
    hubCentralize: 'Centralize', hubCentralizeSub: 'All your asset data always updated in real-time',
    hubCollaborate: 'Collaborate', hubCollaborateSub: 'Assign and manage tasks across your team',
    hubTrack: 'Track', hubTrackSub: 'Monitor asset health and performance metrics',
    hubResolve: 'Resolve', hubResolveSub: 'Automated alerts and instant problem resolution',
    tabPump: 'Pump Systems', tabSolar: 'Solar & Energy', tabMeter: 'Metering', tabIoT: 'IoT Device', tabService: 'Service Management',
  },
  th: {
    navFeatures: 'ฟีเจอร์', navSolutions: 'โซลูชัน', navImpact: 'ผลลัพธ์', navAbout: 'เกี่ยวกับเรา',
    signIn: 'เข้าสู่ระบบ',
    h1a: 'ทุกอย่าง', h1b: 'เชื่อมต่อกัน', h1c: 'งานง่ายขึ้น.',
    heroSub: 'SE Connex คือแพลตฟอร์มสำหรับลูกค้า SiamEast Solutions PCL โดยเฉพาะ จัดการสินทรัพย์ SE เข้าถึงบริการมูลค่าเพิ่ม และติดตามสถานะได้ทุกที่ทุกเวลา',
    getStarted: 'เริ่มต้นใช้งานฟรี', watchVideo: 'ดูวิดีโอ',
    feat1: 'รายงานง่าย', feat2: 'ติดตามแบบเรียลไทม์', feat3: 'จัดการ PM/CM', feat4: 'ข้อมูลครบในที่เดียว',
    secCard: 'ออกแบบมาเพื่อความปลอดภัย รับรองโดย SE',
    secCardSub: 'ข้อมูลและสินทรัพย์ของคุณได้รับการคุ้มครองด้วยความปลอดภัยระดับองค์กร โดย SiamEast Solutions PCL',
    learnSecurity: 'เรียนรู้เรื่องความปลอดภัย',
    ecosystemEye: 'ระบบนิเวศที่เชื่อมต่อกัน', ecosystemH2a: 'ทุกอย่างเริ่มต้นที่', ecosystemSub: 'เชื่อมต่อสินทรัพย์อุตสาหกรรม ระบบพลังงาน และอุปกรณ์ IoT ผ่านแพลตฟอร์มอัจฉริยะเดียว',
    hubEye: 'สถาปัตยกรรม Hub', hubH2a: 'แพลตฟอร์มเดียว', hubH2b: 'ครบทุกการดำเนินงาน', hubSub: 'เชื่อมสินทรัพย์ทุกชิ้น แจ้งวิศวกรทุกคน และประสานทุกทีม',
    bopH2a: 'การดำเนินงานที่ดีขึ้น', bopH2b: 'ผลลัพธ์ที่แข็งแกร่งกว่า',
    bopLabel: 'สร้างมาเพื่อส่งมอบผลลัพธ์',
    bopDesc: 'SE Connex ช่วยให้ทีมลดการหยุดทำงาน เพิ่มประสิทธิภาพ และขับเคลื่อนผลการดำเนินงานโรงงาน',
    bcard1Num: '400', bcard1Title: 'สินทรัพย์ที่จัดการ', bcard1Desc: 'ครอบคลุมอุปกรณ์ SE ของคุณทั้งหมด ตั้งแต่สาธารณูปโภคถึงกระบวนการหนัก',
    bcard2Num: '30%', bcard2Title: 'ประสิทธิภาพที่คาดหวัง', bcard2Desc: 'ความเร็วในการประมวลผลใบสั่งงานและเวลาตอบสนองการบำรุงรักษาเชิงรุก',
    bcard3Num: 'Live', bcard3NumSub: 'ติดตาม', bcard3Title: 'และการติดตามพลังงาน', bcard3Desc: 'ติดตามการใช้พลังงานเพื่อการตัดสินใจที่ชาญฉลาดยิ่งขึ้น',
    exclH2a: 'สำหรับ', exclCust: 'ลูกค้า', exclH2b: 'ที่ซื้อสินค้ากับ', exclSE: 'SE',
    exclSub: 'SE Connex พร้อมใช้งานสำหรับลูกค้าที่ซื้อผลิตภัณฑ์และโซลูชันจาก SiamEast Solutions PCL เท่านั้น',
    excl1Title: 'เฉพาะสินทรัพย์ SE ที่ยืนยันแล้ว', excl1Desc: 'การเข้าถึงจำกัดเฉพาะสินทรัพย์ SE ที่ยืนยันของคุณ',
    excl2Title: 'บริการมูลค่าเพิ่ม', excl2Desc: 'รับสิทธิประโยชน์พิเศษและการสนับสนุนลำดับความสำคัญ',
    excl3Title: 'ฟรีสำหรับลูกค้า SE', excl3Desc: 'คำขอบคุณจาก SE ที่เลือกใช้เรา',
    excl4Title: 'นวัตกรรมต่อเนื่อง', excl4Desc: 'การปรับปรุงอย่างต่อเนื่องเพื่อให้บริการคุณได้ดียิ่งขึ้น',
    eynEye: 'สำรวจแพลตฟอร์ม', eynH2a: 'ทุกสิ่งที่คุณต้องการ', eynH2b: 'ในที่เดียว',
    eyn1Title: 'การจัดการสินทรัพย์', eyn1Desc: 'ทะเบียนอุปกรณ์และสถานะทั้งหมดในที่เดียว',
    eyn2Title: 'รายงานปัญหา', eyn2Desc: 'รายงานปัญหาโดยตรงถึงทีมสนับสนุนวิศวกรรม',
    eyn3Title: 'จัดการ PM/CM', eyn3Desc: 'ติดตามตารางและยืนยันการบำรุงรักษาเชิงป้องกันและแก้ไข',
    eyn4Title: 'บริการและสนับสนุน', eyn4Desc: 'ช่องทางตรงถึงทีมสนับสนุนวิศวกรรมสำหรับการตอบสนองที่รวดเร็ว',
    footBrand: 'ช่วยให้โรงงานอุตสาหกรรมสมัยใหม่ทำงานอัจฉริยะขึ้น เชื่อมต่อกัน และเพิ่มประสิทธิภาพสูงสุด',
    footProduct: 'ผลิตภัณฑ์', footPortal: 'เข้าสู่ระบบพอร์ทัล',
    footResources: 'ทรัพยากร', footCatalog: 'แคตาล็อกผลิตภัณฑ์', footESG: 'ESG และความยั่งยืน', footIR: 'นักลงทุนสัมพันธ์',
    footCompany: 'บริษัท', footAbout: 'เกี่ยวกับ SiamEast', footContact: 'ติดต่อเรา',
    footRights: 'สงวนลิขสิทธิ์', footPrivacy: 'นโยบายความเป็นส่วนตัว', footTerms: 'เงื่อนไขการใช้บริการ',
    hubCentralize: 'รวมศูนย์ข้อมูล', hubCentralizeSub: 'ข้อมูลสินทรัพย์ทั้งหมดอัปเดตแบบเรียลไทม์เสมอ',
    hubCollaborate: 'ทำงานร่วมกัน', hubCollaborateSub: 'มอบหมายและจัดการงานทั่วทั้งทีม',
    hubTrack: 'ติดตาม', hubTrackSub: 'ตรวจสอบสุขภาพและตัวชี้วัดประสิทธิภาพของสินทรัพย์',
    hubResolve: 'แก้ไขปัญหา', hubResolveSub: 'แจ้งเตือนอัตโนมัติและแก้ไขปัญหาทันที',
    tabPump: 'ระบบปั๊ม', tabSolar: 'พลังงานแสงอาทิตย์', tabMeter: 'มิเตอร์', tabIoT: 'อุปกรณ์ IoT', tabService: 'การจัดการบริการ',
  },
} as const;
type Lang = keyof typeof T;
type Tx = Record<keyof typeof T['en'], string>;

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
  useEffect(() => {
    if (!ref.current) return;
    const els = ref.current.querySelectorAll('.rv');
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => { if (e.isIntersecting) e.target.classList.add('in'); }),
      { threshold: 0.05 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return ref;
}

function getHubNodes(t: Tx) {
  return [
    { key: 'centralize', label: t.hubCentralize, sub: t.hubCentralizeSub, color: '#1a73e8', bg: '#e8f0fe', icon: PATHS.db, x: 22, y: 24 },
    { key: 'collaborate', label: t.hubCollaborate, sub: t.hubCollaborateSub, color: '#f2871f', bg: '#fff3e6', icon: PATHS.users, x: 78, y: 24 },
    { key: 'track', label: t.hubTrack, sub: t.hubTrackSub, color: '#34a853', bg: 'rgba(52,168,83,.12)', icon: PATHS.bar, x: 22, y: 76 },
    { key: 'resolve', label: t.hubResolve, sub: t.hubResolveSub, color: '#7c3aed', bg: 'rgba(139,92,246,.12)', icon: PATHS.zap, x: 78, y: 76 },
  ];
}
const VW = 500, VH = 380, CX = 250, CY = 190;
function toSVG(xPct: number, yPct: number) { return { x: (xPct / 100) * VW, y: (yPct / 100) * VH }; }

function getStartsWithTabs(t: Tx) {
  return [
    { id: 'pump-systems', label: t.tabPump, titleLine1: 'Connect Every Pump', titleLine2: 'Optimize Performance', desc: 'Monitor health, pressure, and vibration of industrial pumps in real-time to eliminate unexpected downtime and extend equipment life.', image: getAssetUrl('assets/connect_every_pump_xn.webp'), points: ['Real-time vibration & temperature telemetry', 'Predictive cavitation & mechanical seal warnings', 'Automated flow rate & pressure optimization', 'Direct SiamEast service ticket dispatch', 'Complete maintenance history & warranty logs'] },
    { id: 'solar-energy', label: t.tabSolar, titleLine1: 'Smarter Energy', titleLine2: 'Clean Power Control', desc: 'Track solar generation, energy storage battery systems (BESS), and grid efficiency through one unified intelligent dashboard.', image: getAssetUrl('assets/smartet_energy_xn.webp'), points: ['Live solar inverter & panel output monitoring', 'Battery storage (BESS) charge status tracking', 'Peak shaving & energy cost optimization', 'Carbon reduction & ESG compliance reporting', 'Grid failover & microgrid load management'] },
    { id: 'metering', label: t.tabMeter, titleLine1: 'Smart Metering', titleLine2: 'Precision Data', desc: 'Centralize electric, water, gas, and flow meter readings to track consumption patterns and detect anomalies or leaks instantly.', image: getAssetUrl('assets/easy_meter_xn.webp'), points: ['High-precision electric (kWh) & power monitoring', 'Digital water & fluid flow meter integration', 'Gas pressure & consumption tracking', 'Automated utility billing & audit readiness', 'Instant leak & overload alert notifications'] },
    { id: 'iot-device', label: t.tabIoT, titleLine1: 'Connect Sensors', titleLine2: 'Unlock Insights', desc: 'Integrate PLCs, sensors and industrial IoT devices to automate data collection and improve operational awareness.', image: getAssetUrl('assets/iot_device_xn.webp'), points: ['Wide range of device compatibility', 'Industrial protocols support', 'Real-time data acquisition', 'Edge processing & filtering', 'Secure data transmission'] },
    { id: 'service-management', label: t.tabService, titleLine1: 'Manage Services', titleLine2: 'Maximize Reliability', desc: 'Streamline the entire service lifecycle from requests to sign-off and track every activity for full visibility and compliance.', image: getAssetUrl('assets/manage_services_xn.webp'), points: ['Service request management', 'Contracts & maintenance agreements', 'PM schedule planning & tracking', 'Digital sign-off & approvals', 'Complete service history'] },
  ];
}

function PlatformShowcase({ t }: { t: Tx }) {
  const tabs = getStartsWithTabs(t);
  const [activeTabId, setActiveTabId] = useState('pump-systems');
  const activeTab = tabs.find((tab) => tab.id === activeTabId) || tabs[0];
  return (
    <section className="ph-showcase-section" id="showcase">
      <div className="wrap">
        <div className="ph-header rv">
          <div className="eyebrow"><span className="eyebrow-spark">✦</span> {t.ecosystemEye}</div>
          <h2>{t.ecosystemH2a} <span className="h-accent">Connex</span></h2>
          <p className="ph-sub">{t.ecosystemSub}</p>
          <div className="ph-tabs-pills">
            {tabs.map((tab) => (
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

function PlatformHub({ t }: { t: Tx }) {
  const hubNodes = getHubNodes(t);
  const [hovered, setHovered] = useState<string | null>(null);
  return (
    <section className="ph-section" id="platform">
      <div className="wrap">
        <div className="ph-header rv">
          <div className="eyebrow"><span className="eyebrow-spark">✦</span> {t.hubEye}</div>
          <h2>{t.hubH2a}<br /><span className="h-accent">{t.hubH2b}</span></h2>
          <p className="ph-sub">{t.hubSub}</p>
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
            {hubNodes.map((n) => {
              const p = toSVG(n.x, n.y);
              const isActive = hovered === n.key;
              return <line key={n.key} x1={p.x} y1={p.y} x2={CX} y2={CY} stroke={isActive ? n.color : '#d0d5dd'} strokeWidth={isActive ? 2 : 1.5} strokeDasharray="6 4" style={{ transition: 'stroke .25s, stroke-width .25s' }} />;
            })}
            {hubNodes.map((n, i) => {
              const p = toSVG(n.x, n.y);
              return (
                <circle key={n.key} r="4.5" fill={n.color} opacity="0.85">
                  <animateMotion dur={`${2.2 + i * 0.4}s`} repeatCount="indefinite" begin={`${i * 0.55}s`}>
                    <mpath href={`#ph-path-${n.key}`} />
                  </animateMotion>
                </circle>
              );
            })}
            {hubNodes.map((n) => {
              const p = toSVG(n.x, n.y);
              return <path key={n.key} id={`ph-path-${n.key}`} d={`M${p.x},${p.y} L${CX},${CY}`} fill="none" />;
            })}
          </svg>
          {hubNodes.map((n) => (
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
              <img src={getAssetUrl('assets/logo-connex.svg')} alt="SE Connex" style={{ width: 52, marginBottom: 8, borderRadius: 8, display: 'block' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              <span className="lo-brand" style={{ color: '#fff', fontSize: 13, fontWeight: 800, letterSpacing: '.04em' }}>
                <span style={{ color: 'var(--red)' }}>SE</span> CONNEX
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function LandingPage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [lang, setLang] = useState<Lang>('th');
  const t = T[lang];
  const root = useReveal([]);

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

  const goLogin = () => navigate('/login');
  const toggleLang = () => setLang((l) => l === 'en' ? 'th' : 'en');

  return (
    <div ref={root} className="se-landing">

      {/* ── NAV ── */}
      <header className="nav">
        <div className="nav-inner">
          <a className="logo" href="#top">
            <img src={getAssetUrl('assets/logo-connex.svg')} alt="SE Connex" className="logo-img" />
          </a>
          <nav className="nav-links">
            <a href="#features">{t.navFeatures}</a>
            <a href="#platform">{t.navSolutions}</a>
            <a href="#impact">{t.navImpact}</a>
            <a href={SE.about} target="_blank" rel="noopener">{t.navAbout}</a>
          </nav>
          <div className="nav-actions">
            <button
              type="button"
              className={`wg-lang-flip ${lang === 'en' ? 'is-en' : 'is-th'}`}
              onClick={toggleLang}
              aria-label={lang === 'th' ? 'Switch to English' : 'เปลี่ยนเป็นภาษาไทย'}
            >
              <Globe size={15} strokeWidth={2} className="wg-lang-globe" />
              <div className="wg-lang-track">
                <span className="wg-lang-text wg-lang-th">TH</span>
                <span className="wg-lang-text wg-lang-en">EN</span>
              </div>
            </button>
            <button className="btn btn-nav-signin btn-sm" onClick={goLogin}>{t.signIn}</button>
          </div>
          <button className="nav-hamburger" aria-label="Toggle menu" onClick={() => setMobileMenuOpen((o) => !o)}>
            <span /><span /><span />
          </button>
        </div>
      </header>

      {/* ── MOBILE MENU ── */}
      <div className={`nav-mobile-menu${mobileMenuOpen ? ' open' : ''}`} role="navigation">
        <a href="#features" onClick={() => setMobileMenuOpen(false)}>{t.navFeatures}</a>
        <a href="#platform" onClick={() => setMobileMenuOpen(false)}>{t.navSolutions}</a>
        <a href="#impact" onClick={() => setMobileMenuOpen(false)}>{t.navImpact}</a>
        <a href={SE.about} target="_blank" rel="noopener" onClick={() => setMobileMenuOpen(false)}>{t.navAbout}</a>
        <div className="nav-mobile-divider" />
        <div className="nav-mobile-actions">
          <button
            type="button"
            className={`wg-lang-flip ${lang === 'en' ? 'is-en' : 'is-th'}`}
            onClick={() => { toggleLang(); setMobileMenuOpen(false); }}
            aria-label={lang === 'th' ? 'Switch to English' : 'เปลี่ยนเป็นภาษาไทย'}
          >
            <Globe size={15} strokeWidth={2} className="wg-lang-globe" />
            <div className="wg-lang-track">
              <span className="wg-lang-text wg-lang-th">TH</span>
              <span className="wg-lang-text wg-lang-en">EN</span>
            </div>
          </button>
          <button className="btn btn-nav-signin btn-sm" onClick={() => { goLogin(); setMobileMenuOpen(false); }}>{t.signIn}</button>
        </div>
      </div>

      {/* ── HERO ── */}
      <span id="top" />
      <section className="hero">
        <div className="wrap">
          <div className="hero-grid">
            <div className="hero-copy rv">
              <h1>{t.h1a}<br />{t.h1b}<br /><span className="h1-accent">{t.h1c}</span></h1>
              <p className="hero-sub">{t.heroSub}</p>
              <div className="hero-btns">
                <button className="btn btn-primary btn-lg" onClick={goLogin}>
                  {t.getStarted} <Ic d={PATHS.arrow} size={17} />
                </button>
                <button className="btn btn-ghost btn-lg" onClick={() => setVideoModalOpen(true)}>
                  <Ic d={PATHS.play} size={17} /> {t.watchVideo}
                </button>
              </div>
              <div className="hero-list">
                {([
                  [PATHS.send, t.feat1],
                  [PATHS.activity, t.feat2],
                  [PATHS.clipboard, t.feat3],
                  [PATHS.layers, t.feat4],
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
              <strong>{t.secCard}</strong><br />
              <span><small>{t.secCardSub}</small></span>
            </div>
            <button className="btn btn-sec-learn btn-sm" onClick={goLogin}>{t.learnSecurity}</button>
          </div>
        </div>
      </section>

      <PlatformShowcase t={t} />
      <PlatformHub t={t} />

      {/* ── BETTER OPERATIONS ── */}
      <section className="bop-section" id="features">
        <div className="wrap">
          <div className="bop-layout rv">
            <div className="bop-left">
              <h2 className="bop-h2">{t.bopH2a}<br /><span className="bop-accent">{t.bopH2b}</span></h2>
            </div>
            <div className="bop-right">
              <div className="btd-label">{t.bopLabel}</div>
              <p className="btd-desc">{t.bopDesc}</p>
            </div>
          </div>
          <div className="bop-cards rv">
            <div className="bcard">
              <div className="bcard-ic" style={{ background: '#e8f0fe', color: '#1a73e8' }}><Ic d={PATHS.layers} size={22} /></div>
              <div className="bcard-num">{t.bcard1Num}</div>
              <div className="bcard-title">{t.bcard1Title}</div>
              <p>{t.bcard1Desc}</p>
            </div>
            <div className="bcard">
              <div className="bcard-ic" style={{ background: '#fff3e6', color: '#f2871f' }}><Ic d={PATHS.bar} size={22} /></div>
              <div className="bcard-num">{t.bcard2Num}</div>
              <div className="bcard-title">{t.bcard2Title}</div>
              <p>{t.bcard2Desc}</p>
            </div>
            <div className="bcard bcard-live">
              <div className="bcard-badge">NEW</div>
              <div className="bcard-ic" style={{ background: 'rgba(52,168,83,.12)', color: '#34a853' }}><Ic d={PATHS.activity} size={22} /></div>
              <div className="bcard-num">{t.bcard3Num} <span className="bcard-num-sub">{t.bcard3NumSub}</span></div>
              <div className="bcard-title">{t.bcard3Title}</div>
              <p>{t.bcard3Desc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── EXCLUSIVELY FOR CUSTOMERS ── */}
      <section className="excl-section">
        <div className="wrap">
          <div className="excl-head rv">
            <h2>{t.exclH2a} <span className="excl-cust">{t.exclCust}</span><br />{t.exclH2b} <span className="excl-se">{t.exclSE}</span></h2>
            <p>{t.exclSub}</p>
          </div>
          <div className="excl-cards rv">
            {[
              [PATHS.shield, t.excl1Title, t.excl1Desc],
              [PATHS.zap, t.excl2Title, t.excl2Desc],
              [PATHS.users, t.excl3Title, t.excl3Desc],
              [PATHS.activity, t.excl4Title, t.excl4Desc],
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
            <div className="eyebrow-sm">{t.eynEye}</div>
            <h2 className="eyn-h2">{t.eynH2a}<br />{t.eynH2b}</h2>
          </div>
          <div className="eyn-cards rv">
            {[
              [PATHS.layers, t.eyn1Title, t.eyn1Desc],
              [PATHS.send, t.eyn2Title, t.eyn2Desc],
              [PATHS.clipboard, t.eyn3Title, t.eyn3Desc],
              [PATHS.shield, t.eyn4Title, t.eyn4Desc],
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
              <p>{t.footBrand}</p>
            </div>
            <div className="foot-col">
              <h4>{t.footProduct}</h4>
              <a href="#features">{t.navFeatures}</a>
              <a href="#platform">{t.navSolutions}</a>
              <a href="#impact">{t.navImpact}</a>
              <button className="btn-link" onClick={goLogin}>{t.footPortal}</button>
            </div>
            <div className="foot-col">
              <h4>{t.footResources}</h4>
              <a href={SE.products} target="_blank" rel="noopener">{t.footCatalog}</a>
              <a href={SE.esg} target="_blank" rel="noopener">{t.footESG}</a>
              <a href={SE.ir} target="_blank" rel="noopener">{t.footIR}</a>
            </div>
            <div className="foot-col">
              <h4>{t.footCompany}</h4>
              <a href={SE.about} target="_blank" rel="noopener">{t.footAbout}</a>
              <a href={SE.contact} target="_blank" rel="noopener">{t.footContact}</a>
              <a href="tel:+66633935088">+66 63 393 5088</a>
            </div>
          </div>
          <div className="foot-bot">
            <p>© {new Date().getFullYear()} SiamEast Solutions PCL. {t.footRights}</p>
            <div className="foot-legal">
              <a href={SE.privacy} target="_blank" rel="noopener">{t.footPrivacy}</a>
              <a href={SE.terms} target="_blank" rel="noopener">{t.footTerms}</a>
            </div>
          </div>
        </div>
      </footer>

      {/* ── VIDEO MODAL ── */}
      {videoModalOpen && (
        <div className="video-modal-overlay" onClick={() => setVideoModalOpen(false)}>
          <div className="video-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="video-modal-close" onClick={() => setVideoModalOpen(false)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <div className="video-modal-player">
              <video src={getAssetUrl('assets/0_coming_sooon_txt.mp4')} controls autoPlay playsInline loop className="video-modal-real-mp4" />
            </div>
          </div>
        </div>
      )}

      <ContactWidget phone={SE.phone} email={SE.email} />
      <CookieConsentBanner privacyUrl={SE.privacy} />
    </div>
  );
}

