import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ContactWidget } from '@/components/landing/ContactWidget';
import { CookieConsentBanner } from '@/components/landing/CookieConsentBanner';
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

const HUB_NODES = [
  { key: 'centralize', label: 'Centralize', sub: 'All your asset data always updated in real-time', color: '#1a73e8', bg: '#e8f0fe', icon: PATHS.db, x: 22, y: 24 },
  { key: 'collaborate', label: 'Collaborate', sub: 'Assign and manage tasks across your team', color: '#f2871f', bg: '#fff3e6', icon: PATHS.users, x: 78, y: 24 },
  { key: 'track', label: 'Track', sub: 'Monitor asset health and performance metrics', color: '#34a853', bg: 'rgba(52,168,83,.12)', icon: PATHS.bar, x: 22, y: 76 },
  { key: 'resolve', label: 'Resolve', sub: 'Automated alerts and instant problem resolution', color: '#7c3aed', bg: 'rgba(139,92,246,.12)', icon: PATHS.zap, x: 78, y: 76 },
];
const VW = 500, VH = 380, CX = 250, CY = 190;
function toSVG(xPct: number, yPct: number) { return { x: (xPct / 100) * VW, y: (yPct / 100) * VH }; }

const STARTS_WITH_TABS = [
  { id: 'pump-systems', label: 'Pump Systems', titleLine1: 'Connect Every Pump', titleLine2: 'Optimize Performance', desc: 'Monitor health, pressure, and vibration of industrial pumps in real-time to eliminate unexpected downtime and extend equipment life.', image: '/assets/connect_every_pump_xn.webp', points: ['Real-time vibration & temperature telemetry', 'Predictive cavitation & mechanical seal warnings', 'Automated flow rate & pressure optimization', 'Direct SiamEast service ticket dispatch', 'Complete maintenance history & warranty logs'] },
  { id: 'solar-energy', label: 'Solar & Energy', titleLine1: 'Smarter Energy', titleLine2: 'Clean Power Control', desc: 'Track solar generation, energy storage battery systems (BESS), and grid efficiency through one unified intelligent dashboard.', image: '/assets/smartet_energy_xn.webp', points: ['Live solar inverter & panel output monitoring', 'Battery storage (BESS) charge status tracking', 'Peak shaving & energy cost optimization', 'Carbon reduction & ESG compliance reporting', 'Grid failover & microgrid load management'] },
  { id: 'metering', label: 'Metering', titleLine1: 'Smart Metering', titleLine2: 'Precision Data', desc: 'Centralize electric, water, gas, and flow meter readings to track consumption patterns and detect anomalies or leaks instantly.', image: '/assets/easy_meter_xn.webp', points: ['High-precision electric (kWh) & power monitoring', 'Digital water & fluid flow meter integration', 'Gas pressure & consumption tracking', 'Automated utility billing & audit readiness', 'Instant leak & overload alert notifications'] },
  { id: 'iot-device', label: 'IoT Device', titleLine1: 'Connect Sensors', titleLine2: 'Unlock Insights', desc: 'Integrate PLCs, sensors and industrial IoT devices to automate data collection and improve operational awareness.', image: '/assets/iot_device_xn.webp', points: ['Wide range of device compatibility', 'Industrial protocols support', 'Real-time data acquisition', 'Edge processing & filtering', 'Secure data transmission'] },
  { id: 'service-management', label: 'Service Management', titleLine1: 'Manage Services', titleLine2: 'Maximize Reliability', desc: 'Streamline the entire service lifecycle from requests to sign-off and track every activity for full visibility and compliance.', image: '/assets/manage_services_xn.webp', points: ['Service request management', 'Contracts & maintenance agreements', 'PM schedule planning & tracking', 'Digital sign-off & approvals', 'Complete service history'] },
];

function PlatformShowcase() {
  const [activeTabId, setActiveTabId] = useState('pump-systems');
  const activeTab = STARTS_WITH_TABS.find((t) => t.id === activeTabId) || STARTS_WITH_TABS[0];
  return (
    <section className="ph-showcase-section" id="showcase">
      <div className="wrap">
        <div className="ph-header rv">
          <div className="eyebrow"><span className="eyebrow-spark">✦</span> Connected Ecosystem</div>
          <h2>Everything Starts with <span className="h-accent">Connex</span></h2>
          <p className="ph-sub">Connect your industrial assets, energy systems and IoT devices through one intelligent platform.</p>
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
  const [hovered, setHovered] = useState<string | null>(null);
  return (
    <section className="ph-section" id="platform">
      <div className="wrap">
        <div className="ph-header rv">
          <div className="eyebrow"><span className="eyebrow-spark">✦</span> Hub Architecture</div>
          <h2>One Platform.<br /><span className="h-accent">All Operations.</span></h2>
          <p className="ph-sub">Keep every asset connected, every engineer informed, and every team aligned.</p>
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
              <img src="/assets/logo-connex.svg" alt="SE Connex" style={{ width: 52, marginBottom: 8, borderRadius: 8, display: 'block' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
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

  return (
    <div ref={root} className="se-landing">

      {/* ── NAV ── */}
      <header className="nav">
        <div className="nav-inner">
          <a className="logo" href="#top">
            <img src="/assets/logo-connex.svg" alt="SE Connex" className="logo-img" />
          </a>
          <nav className="nav-links">
            <a href="#features">Features</a>
            <a href="#platform">Solutions</a>
            <a href="#impact">Impact</a>
            <a href={SE.about} target="_blank" rel="noopener">About</a>
          </nav>
          <div className="nav-actions">
            <button className="btn btn-nav-signin btn-sm" onClick={goLogin}>Sign In</button>
          </div>
          <button className="nav-hamburger" aria-label="Toggle menu" onClick={() => setMobileMenuOpen((o) => !o)}>
            <span /><span /><span />
          </button>
        </div>
      </header>

      {/* ── MOBILE MENU ── */}
      <div className={`nav-mobile-menu${mobileMenuOpen ? ' open' : ''}`} role="navigation">
        <a href="#features" onClick={() => setMobileMenuOpen(false)}>Features</a>
        <a href="#platform" onClick={() => setMobileMenuOpen(false)}>Solutions</a>
        <a href="#impact" onClick={() => setMobileMenuOpen(false)}>Impact</a>
        <a href={SE.about} target="_blank" rel="noopener" onClick={() => setMobileMenuOpen(false)}>About</a>
        <div className="nav-mobile-divider" />
        <div className="nav-mobile-actions">
          <button className="btn btn-nav-signin btn-sm" onClick={() => { goLogin(); setMobileMenuOpen(false); }}>Sign In</button>
        </div>
      </div>

      {/* ── HERO ── */}
      <span id="top" />
      <section className="hero">
        <div className="wrap">
          <div className="hero-grid">
            <div className="hero-copy rv">
              <h1>Everything<br />Connected.<br /><span className="h1-accent">Work Simplified.</span></h1>
              <p className="hero-sub">
                SE Connex is the exclusive platform for customers who purchase
                with SiamEast Solutions PCL. Manage your SE assets, access
                value-added services, and stay connected — anytime, anywhere.
              </p>
              <div className="hero-btns">
                <button className="btn btn-primary btn-lg" onClick={goLogin}>
                  Get Started Free <Ic d={PATHS.arrow} size={17} />
                </button>
                <button className="btn btn-ghost btn-lg" onClick={() => setVideoModalOpen(true)}>
                  <Ic d={PATHS.play} size={17} /> Watch Video
                </button>
              </div>
              <div className="hero-list">
                {([
                  [PATHS.send, 'Easy to Report'],
                  [PATHS.activity, 'Real-time Monitoring'],
                  [PATHS.clipboard, 'PM/CM Management'],
                  [PATHS.layers, 'All Information In One Place'],
                ] as [string, string][]).map(([d, t]) => (
                  <div className="hlist-item" key={t}>
                    <span className="hlist-ic"><Ic d={d} size={18} /></span>
                    <span>{t}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="hero-devices rv" id="hero-mockup">
              <div className="devices-stage">
                <img src="/assets/DEVICE.png" className="dev-img dev-img-single" alt="SE Connex devices" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
            </div>
          </div>
          <div className="sec-card-hero rv">
            <div className="sec-icon"><Ic d={PATHS.shield} size={28} /></div>
            <div className="sec-text">
              <strong>Build for Security. Backed by SE.</strong><br />
              <span><small>Your data and assets are protected with enterprise-grade security and trusted by SiamEast Solutions PCL.</small></span>
            </div>
            <button className="btn btn-sec-learn btn-sm" onClick={goLogin}>Learn Security</button>
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
              <h2 className="bop-h2">Better Operations.<br /><span className="bop-accent">Stronger Results.</span></h2>
            </div>
            <div className="bop-right">
              <div className="btd-label">BUILD TO DELIVER IMPACT</div>
              <p className="btd-desc">SE Connex empowers teams to minimize downtime, increase efficiency, and drive overall plant performance.</p>
            </div>
          </div>
          <div className="bop-cards rv">
            <div className="bcard">
              <div className="bcard-ic" style={{ background: '#e8f0fe', color: '#1a73e8' }}><Ic d={PATHS.layers} size={22} /></div>
              <div className="bcard-num">400</div>
              <div className="bcard-title">Assets Managed</div>
              <p>All your SE equipment fully covered — from utility to heavy processes.</p>
            </div>
            <div className="bcard">
              <div className="bcard-ic" style={{ background: '#fff3e6', color: '#f2871f' }}><Ic d={PATHS.bar} size={22} /></div>
              <div className="bcard-num">30%</div>
              <div className="bcard-title">Expected Efficiency Gain</div>
              <p>Work order processing speed and proactive maintenance response times.</p>
            </div>
            <div className="bcard bcard-live">
              <div className="bcard-badge">NEW</div>
              <div className="bcard-ic" style={{ background: 'rgba(52,168,83,.12)', color: '#34a853' }}><Ic d={PATHS.activity} size={22} /></div>
              <div className="bcard-num">Live <span className="bcard-num-sub">Monitoring</span></div>
              <div className="bcard-title">&amp; Energy Tracking</div>
              <p>Track energy usage so your time leads to more informed decisions.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── EXCLUSIVELY FOR CUSTOMERS ── */}
      <section className="excl-section">
        <div className="wrap">
          <div className="excl-head rv">
            <h2>Exclusively for <span className="excl-cust">Customers</span><br />Who Purchase with <span className="excl-se">SE</span></h2>
            <p>SE Connex is available only to customers who purchase products and solutions from SiamEast Solutions PCL.</p>
          </div>
          <div className="excl-cards rv">
            {[
              [PATHS.shield, 'Verified SE Assets Only', 'Access is limited to your verified SE assets.'],
              [PATHS.zap, 'Value-Added Services', 'Enjoy exclusive benefits and priority support.'],
              [PATHS.users, 'Free for SE Customers', 'A thank you from SE for choosing us.'],
              [PATHS.activity, 'Ongoing Innovation', 'Continuous improvements to serve you better.'],
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
            <div className="eyebrow-sm">EXPLORE THE PLATFORM</div>
            <h2 className="eyn-h2">Everything You Need.<br />In One Place.</h2>
          </div>
          <div className="eyn-cards rv">
            {[
              [PATHS.layers, 'Asset Management', 'All your equipment registry and state in one place.'],
              [PATHS.send, 'Issue Reporting', 'Report issues directly to the engineering support team.'],
              [PATHS.clipboard, 'PM/CM Management', 'Track schedule and confirm preventive and corrective maintenance.'],
              [PATHS.shield, 'Service & Support', 'Direct channel to engineering support for fast response.'],
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
              <img src="/assets/logo-connex.svg" alt="SE Connex" style={{ width: 52, height: 52, borderRadius: 10, marginBottom: 10, display: 'block' }} />
              <span className="lo-brand"><span className="lo-se">SE</span> CONNEX</span>
              <span className="lo-tag">SiamEast Solutions PCL</span>
              <p>Helping modern industrial plants work smarter, stay connected, and maximize efficiency.</p>
            </div>
            <div className="foot-col">
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="#platform">Solutions</a>
              <a href="#impact">Impact</a>
              <button className="btn-link" onClick={goLogin}>Portal Sign In</button>
            </div>
            <div className="foot-col">
              <h4>Resources</h4>
              <a href={SE.products} target="_blank" rel="noopener">Products Catalog</a>
              <a href={SE.esg} target="_blank" rel="noopener">ESG &amp; Sustainability</a>
              <a href={SE.ir} target="_blank" rel="noopener">Investor Relations</a>
            </div>
            <div className="foot-col">
              <h4>Company</h4>
              <a href={SE.about} target="_blank" rel="noopener">About SiamEast</a>
              <a href={SE.contact} target="_blank" rel="noopener">Contact Us</a>
              <a href="tel:+66633935088">+66 63 393 5088</a>
            </div>
          </div>
          <div className="foot-bot">
            <p>© {new Date().getFullYear()} SiamEast Solutions PCL. All rights reserved.</p>
            <div className="foot-legal">
              <a href={SE.privacy} target="_blank" rel="noopener">Privacy Policy</a>
              <a href={SE.terms} target="_blank" rel="noopener">Terms of Service</a>
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
              <video src="/assets/0_coming_sooon_txt.mp4" controls autoPlay playsInline loop className="video-modal-real-mp4" />
            </div>
          </div>
        </div>
      )}

      <ContactWidget phone={SE.phone} email={SE.email} />
      <CookieConsentBanner privacyUrl={SE.privacy} />
    </div>
  );
}
