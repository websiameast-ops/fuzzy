import { useState, useEffect, useRef } from 'react';

const LOGIN_URL = 'https://connex.siameastsolutions.com/login';
const SE = {
  site: 'https://siameastsolutions.com/',
  about: 'https://siameastsolutions.com/about-se-3/',
  products: 'https://siameastsolutions.com/product/',
  shop: 'https://shop.siameastsolutions.com/',
  ir: 'https://siameastsolutions.com/ir/',
  esg: 'https://siameastsolutions.com/se-esg/',
  contact: 'https://siameastsolutions.com/contact-us/',
  privacy: 'https://siameastsolutions.com/privacy-policy/',
  terms: 'https://siameastsolutions.com/terms-and-conditions/',
  email: 'info@siameastsolutions.com',
  phone: '+66633935088',
};

const FEATURES_LIST = [
  {
    id: 'equipment',
    badge: 'My Equipment',
    title: 'My Equipment & Asset Inventory',
    subtitle: 'ระบบจัดการและติดตามทะเบียนเครื่องจักร อุปกรณ์ SiamEast ทั้งหมดในที่เดียว',
    desc: 'Access your complete asset registry across all factory sites. Monitor operational states, warranty timelines, and initiate service requests instantly for any equipment.',
    img: './assets/equipment.png',
    points: ['Centralized equipment catalog & warranty tracking', 'Filter by site, operating state, and brand categories', '1-Tap direct problem reporting per machine'],
    stat: '100%', statLabel: 'Asset Transparency',
  },
  {
    id: 'sites-map',
    badge: 'My Sites — Map',
    title: 'My Sites — Interactive Location Map',
    subtitle: 'แผนที่รวมที่ตั้งสาขา โรงงาน และสถานะสุขภาพเครื่องจักรรวมแบบเรียลไทม์',
    desc: 'Schematic map view of all your industrial plant sites. Colour-coded live health indicators give instant visibility into site alarms, open tickets, and active assets.',
    img: './assets/factory-map.png',
    points: ['Schematic geographic view with health color-coding', 'Instant drill-down into site open tickets & active alarms', 'Multi-site overview for plant managers and executives'],
    stat: 'Live', statLabel: 'Site Health Status',
  },
  {
    id: 'requests',
    badge: 'Requests',
    title: 'Service Requests & Ticket Tracker',
    subtitle: 'ระบบแจ้งซ่อมและติดตามสถานะงานบริการ SiamEast แบบเรียลไทม์',
    desc: 'Submit new service tickets, track technician resolution progress, monitor priority levels, and compare completion timelines against planned schedules.',
    img: './assets/live-monitoring-dark.png',
    points: ['Real-time service ticket lifecycle status tracking', 'Urgency and priority categorization for fast response', 'Direct channel to SiamEast specialized engineering support'],
    stat: '< 24h', statLabel: 'Avg Response Time',
  },
  {
    id: 'contracts',
    badge: 'Contracts & MA',
    title: 'Contracts & Maintenance Agreements',
    subtitle: 'บริหารจัดการสัญญาบริการ MA, O&M และสิทธิ์รับประกันเครื่องจักร',
    desc: 'Complete overview of active Maintenance Agreements, Operation & Maintenance, and equipment monitoring coverage with automated expiration alerts.',
    img: './assets/materials.png',
    points: ['Clear tracking of terms, remaining days, and visit counts', 'Automated proactive renewal alerts before expiration', 'Full coverage map of protected assets & equipment'],
    stat: 'Active', statLabel: 'SLA Protection',
  },
  {
    id: 'pm-schedule',
    badge: 'PM Schedule',
    title: 'PM Schedule & Preventive Maintenance',
    subtitle: 'ปฏิทินวางแผนเข้าบำรุงรักษาเชิงป้องกันและการยืนยันนัดหมาย',
    desc: 'Interactive calendar for upcoming PM visits by SiamEast engineer teams. Review scope of work, confirm appointments, and access completed service inspection reports.',
    img: './assets/dashboard-dark.png',
    points: ['Interactive monthly calendar & upcoming visit timeline', 'Preparation checklists & engineer team details', 'Instant access to digital service reports & sign-offs'],
    stat: 'Zero', statLabel: 'Unplanned Downtime',
  },
];

const PATHS = {
  arrow: 'M5 12h14M13 6l6 6-6 6',
  shield: 'M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6l7-3zM9 12l2 2 4-4',
  chevL: 'M15 18l-6-6 6-6',
  chevR: 'M9 18l6-6-6-6',
  pause: 'M6 4h4v16H6zm8 0h4v16h-4z',
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

function Ic({ d, size = 24, sw = 1.8 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

function useReveal(deps = []) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    const els = ref.current.querySelectorAll('.rv');
    const io = new IntersectionObserver(
      es => es.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
        }
      }),
      { threshold: 0.05 }
    );
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, deps);
  return ref;
}

import Login from './components/Login';

/* ── PLATFORM HUB ── hub-and-spoke circular diagram */
const HUB_NODES = [
  {
    key: 'centralize',
    label: 'Centralize',
    sub: 'All your asset data always updated in real-time',
    color: '#1a73e8',
    bg: '#e8f0fe',
    icon: PATHS.db,
    // position as % of container: top-left
    x: 22, y: 24,
  },
  {
    key: 'collaborate',
    label: 'Collaborate',
    sub: 'Assign and manage tasks across your team',
    color: '#f2871f',
    bg: '#fff3e6',
    icon: PATHS.users,
    // top-right
    x: 78, y: 24,
  },
  {
    key: 'track',
    label: 'Track',
    sub: 'Monitor asset health and performance metrics',
    color: '#34a853',
    bg: 'rgba(52,168,83,.12)',
    icon: PATHS.bar,
    // bottom-left
    x: 22, y: 76,
  },
  {
    key: 'resolve',
    label: 'Resolve',
    sub: 'Automated alerts and instant problem resolution',
    color: '#7c3aed',
    bg: 'rgba(139,92,246,.12)',
    icon: PATHS.zap,
    // bottom-right
    x: 78, y: 76,
  },
];

// SVG viewBox is 500 x 380, center = (250, 190)
const VW = 500, VH = 380, CX = 250, CY = 190;
function toSVG(xPct, yPct) {
  return { x: (xPct / 100) * VW, y: (yPct / 100) * VH };
}

function PlatformHub() {
  const [hovered, setHovered] = useState(null);

  return (
    <section className="ph-section" id="platform">
      <div className="wrap">
        <div className="ph-header rv">
          <div className="eyebrow"><span className="eyebrow-spark">✦</span> One Platform</div>
          <h2>One Platform.<br /><span className="h-accent">All Operations.</span></h2>
          <p className="ph-sub">Keep every asset connected, every engineer informed, and every team aligned.</p>
        </div>

        <div className="ph-diagram rv">
          {/* SVG layer — lines + animated dots */}
          <svg
            className="ph-svg"
            viewBox={`0 0 ${VW} ${VH}`}
            preserveAspectRatio="xMidYMid meet"
            aria-hidden
          >
            <defs>
              <radialGradient id="glow-center" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#1a73e8" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#1a73e8" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Glow behind center */}
            <circle cx={CX} cy={CY} r="80" fill="url(#glow-center)" />

            {/* Lines */}
            {HUB_NODES.map((n) => {
              const p = toSVG(n.x, n.y);
              const isActive = hovered === n.key;
              return (
                <line
                  key={n.key}
                  x1={p.x} y1={p.y}
                  x2={CX} y2={CY}
                  stroke={isActive ? n.color : '#d0d5dd'}
                  strokeWidth={isActive ? 2 : 1.5}
                  strokeDasharray="6 4"
                  style={{ transition: 'stroke .25s, stroke-width .25s' }}
                />
              );
            })}

            {/* Animated dots — one per line */}
            {HUB_NODES.map((n, i) => {
              const p = toSVG(n.x, n.y);
              return (
                <circle key={n.key} r="4.5" fill={n.color} opacity="0.85">
                  <animateMotion
                    dur={`${2.2 + i * 0.4}s`}
                    repeatCount="indefinite"
                    begin={`${i * 0.55}s`}
                  >
                    <mpath href={`#ph-path-${n.key}`} />
                  </animateMotion>
                </circle>
              );
            })}

            {/* Hidden paths for animateMotion */}
            {HUB_NODES.map((n) => {
              const p = toSVG(n.x, n.y);
              return (
                <path
                  key={n.key}
                  id={`ph-path-${n.key}`}
                  d={`M${p.x},${p.y} L${CX},${CY}`}
                  fill="none"
                />
              );
            })}
          </svg>

          {/* Outer circular nodes */}
          {HUB_NODES.map((n) => (
            <div
              key={n.key}
              className={`ph-node${hovered === n.key ? ' ph-node--active' : ''}`}
              style={{ left: `${n.x}%`, top: `${n.y}%` }}
              onMouseEnter={() => setHovered(n.key)}
              onMouseLeave={() => setHovered(null)}
            >
              <div
                className="ph-circle"
                style={{
                  borderColor: hovered === n.key ? n.color : undefined,
                  boxShadow: hovered === n.key
                    ? `0 0 0 4px ${n.color}20, 0 12px 32px rgba(16,24,40,.14)`
                    : undefined,
                }}
              >
                <div className="ph-icon" style={{ background: n.bg, color: n.color }}>
                  <Ic d={n.icon} size={24} sw={2.2} />
                </div>
                <span className="ph-label">{n.label}</span>
              </div>
              <p className="ph-sub-text">{n.sub}</p>
            </div>
          ))}

          {/* Center hub */}
          <div className="ph-center">
            <div className="ph-center-ring ph-center-ring--2" />
            <div className="ph-center-ring ph-center-ring--1" />
            <div className="ph-center-circle">
              <img src="./assets/logo-connex.svg" alt="SE Connex" style={{ width: 52, marginBottom: 8, borderRadius: 8, display: 'block' }} onError={(e) => { e.target.style.display = 'none'; }} />
              <span className="lo-brand" style={{ color: '#fff', fontSize: 13, fontWeight: 800, letterSpacing: '.04em' }}>
                <span style={{ color: '#f2871f' }}>SE</span> CONNEX
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const Btn = ({ href = LOGIN_URL, cls = '', onClick, children }) => (
  <a className={`btn ${cls}`} href={href} onClick={onClick}>{children}</a>
);

export default function App() {
  const [currentView, setCurrentView] = useState(
    () => localStorage.getItem('se_view') || 'landing'
  );
  const root = useReveal([currentView]);

  const navigate = (view) => {
    localStorage.setItem('se_view', view);
    setCurrentView(view);
  };

  if (currentView === 'login') {
    return <Login onBackToLanding={() => navigate('landing')} />;
  }

  return (
    <div ref={root} className="se-landing">

      {/* ── NAV ── */}
      <header className="nav">
        <div className="nav-inner">
          <a className="logo" href="#top">
            <img src="./assets/logo-connex.svg" alt="SE Connex" className="logo-img" />
          </a>
          <nav className="nav-links">
            <a href="#features">Features</a>
            <a href="#platform">Solutions</a>
            <a href="#impact">Impact</a>
            <a href={SE.about} target="_blank" rel="noopener">About</a>
          </nav>
          <div className="nav-actions">
            <button className="btn btn-nav-signin btn-sm" onClick={() => navigate('login')}>Sign In</button>
            <button className="btn btn-nav-start btn-sm" onClick={() => navigate('login')}>Get Started</button>
          </div>
        </div>
      </header>

      {/* ── HERO SECTION WITH INTEGRATED SECURITY CARD ── */}
      <span id="top" />
      <section className="hero">
        <div className="wrap">
          <div className="hero-grid">

            {/* Left Copy Column */}
            <div className="hero-copy rv">
              <h1>Everything<br />Connected.<br /><span className="h1-accent">Work Simplified.</span></h1>
              <p className="hero-sub">
                SE Connex is the exclusive platform for customers who purchase
                with SiamEast Solutions PCL. Manage your SE assets, access
                value-added services, and stay connected — anytime, anywhere.
              </p>

              <div className="hero-btns">
                <button className="btn btn-primary btn-lg" onClick={() => navigate('login')}>
                  Get Started Free <Ic d={PATHS.arrow} size={17} />
                </button>
                <Btn cls="btn-ghost btn-lg" href="#features">Explore Features</Btn>
              </div>

              <div className="hero-list">
                {[
                  [PATHS.send, 'Easy to Report'],
                  [PATHS.activity, 'Real-time Monitoring'],
                  [PATHS.clipboard, 'PM/CM Management'],
                  [PATHS.layers, 'All Information In One Place']
                ].map(([d, t]) => (
                  <div className="hlist-item" key={t}>
                    <span className="hlist-ic"><Ic d={d} size={18} /></span>
                    <span>{t}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Frameless device composition matching image */}
            <div className="hero-devices rv" id="hero-mockup">
              <div className="devices-stage">
                <img src="./assets/tablet_xn.webp" className="dev-img dev-img-tablet" alt="SE Connex tablet" onError={(e) => { e.target.style.display = 'none'; }} />
                <img src="./assets/Notebook_xn.webp" className="dev-img dev-img-laptop" alt="SE Connex desktop" onError={(e) => { e.target.style.display = 'none'; }} />
                <img src="./assets/mobile_xn.webp" className="dev-img dev-img-phone" alt="SE Connex mobile" onError={(e) => { e.target.style.display = 'none'; }} />
              </div>
            </div>

          </div>

          {/* ── INTEGRATED SECURITY CARD AT BOTTOM OF HERO ── */}
          <div className="sec-card-hero rv">
            <div className="sec-icon"><Ic d={PATHS.shield} size={28} /></div>
            <div className="sec-text">
              <strong>Build for Security. Backed by SE.</strong><br />
              <span><small>Your data and assets are protected with enterprise-grade security and trusted by SiamEast Solutions PCL.</small></span>
            </div>
            <a className="btn btn-sec-learn btn-sm" href={LOGIN_URL} target="_blank" rel="noopener noreferrer">Learn Security</a>
          </div>

        </div>
      </section>

      {/* ── ONE PLATFORM / HUB ── */}
      <PlatformHub />

      {/* ── BETTER OPERATIONS SECTION ── */}
      <section className="bop-section" id="features">
        <div className="wrap">
          <div className="bop-layout rv">
            {/* Left headline */}
            <div className="bop-left">
              <h2 className="bop-h2">Better Operations.<br /><span className="bop-accent">Stronger Results.</span></h2>
            </div>
            {/* Right build-to-deliver */}
            <div className="bop-right">
              <div className="btd-label">BUILD TO DELIVER IMPACT</div>
              <p className="btd-desc">SE Connex empowers teams to minimize downtime, increase efficiency, and drive overall plant performance.</p>
            </div>
          </div>

          {/* Impact cards row */}
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
            <div className="excl-card">
              <div className="excl-ic"><Ic d={PATHS.shield} size={24} /></div>
              <div className="excl-text-wrap">
                <h4>Verified SE Assets Only</h4>
                <p>Access is limited to your verified SE assets.</p>
              </div>
            </div>
            <div className="excl-card">
              <div className="excl-ic"><Ic d={PATHS.zap} size={24} /></div>
              <div className="excl-text-wrap">
                <h4>Value-Added Services</h4>
                <p>Enjoy exclusive benefits and priority support.</p>
              </div>
            </div>
            <div className="excl-card">
              <div className="excl-ic"><Ic d={PATHS.users} size={24} /></div>
              <div className="excl-text-wrap">
                <h4>Free for SE Customers</h4>
                <p>A thank you from SE for choosing us.</p>
              </div>
            </div>
            <div className="excl-card">
              <div className="excl-ic"><Ic d={PATHS.activity} size={24} /></div>
              <div className="excl-text-wrap">
                <h4>Ongoing Innovation</h4>
                <p>Continuous improvements to serve you better.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── EVERYTHING YOU NEED ── */}
      <section className="eyn-section">
        <div className="wrap">
          <div className="eyn-head rv">
            <div className="eyebrow-sm">EXPLORE THE PLATFORM</div>
            <h2 className="eyn-h2">Everything You Need.<br />In One Place.</h2>
          </div>
          <div className="eyn-cards rv">
            <div className="eyn-card">
              <div className="eyn-ic"><Ic d={PATHS.layers} size={28} /></div>
              <h4>Asset Management</h4>
              <p>All your equipment registry and state in one place.</p>
            </div>
            <div className="eyn-card">
              <div className="eyn-ic"><Ic d={PATHS.send} size={28} /></div>
              <h4>Issue Reporting</h4>
              <p>Report issues directly to the engineering support team.</p>
            </div>
            <div className="eyn-card">
              <div className="eyn-ic"><Ic d={PATHS.clipboard} size={28} /></div>
              <h4>PM/CM Management</h4>
              <p>Track schedule and confirm preventive and corrective maintenance.</p>
            </div>
            <div className="eyn-card">
              <div className="eyn-ic"><Ic d={PATHS.shield} size={28} /></div>
              <h4>Service &amp; Support</h4>
              <p>Direct channel to engineering support for fast response.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="footer">
        <div className="wrap">
          <div className="foot-grid">
            <div className="foot-brand">
              <img src="./assets/logo-connex.svg" alt="SE Connex" style={{ width: 52, height: 52, borderRadius: 10, marginBottom: 10, display: 'block' }} />
              <span className="lo-brand"><span className="lo-se">SE</span> CONNEX</span>
              <span className="lo-tag">SiamEast Solutions PCL</span>
              <p>Helping modern industrial plants work smarter, stay connected, and maximize efficiency.</p>
            </div>
            <div className="foot-col">
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="#platform">Solutions</a>
              <a href="#impact">Impact</a>
              <a href={LOGIN_URL}>Portal Sign In</a>
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
    </div>
  );
}
