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

function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const els = ref.current?.querySelectorAll('.rv') ?? [];
    const io = new IntersectionObserver(
      es => es.forEach(e => e.isIntersecting && e.target.classList.add('in')),
      { threshold: 0.08 }
    );
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
  return ref;
}

const Btn = ({ href = LOGIN_URL, cls = '', children }) => (
  <a className={`btn ${cls}`} href={href}>{children}</a>
);

export default function App() {
  const root = useReveal();
  const [activeIdx, setActiveIdx] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setActiveIdx(p => (p + 1) % FEATURES_LIST.length), 5500);
    return () => clearInterval(t);
  }, [playing]);

  return (
    <div ref={root} className="se-landing">

      {/* ── NAV ── */}
      <header className="nav">
        <div className="wrap nav-inner">
          <a className="logo" href="#top">
            <span className="logo-dots">
              <b className="d d-b" /><b className="d d-r" /><b className="d d-y" /><b className="d d-g" />
            </span>
            <span className="logo-text">
              <span className="lo-brand"><span className="lo-se">SE</span> CONNEX</span>
              <span className="lo-tag">SiamEast Solutions PCL</span>
            </span>
          </a>
          <nav className="nav-links">
            <a href="#features">Features</a>
            <a href="#platform">Solutions</a>
            <a href="#impact">Impact</a>
            <a href={SE.about} target="_blank" rel="noopener">About</a>
          </nav>
          <div className="nav-actions">

            <Btn cls="btn-primary btn-sm" href={LOGIN_URL}>Sign In</Btn>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <span id="top" />
      <section className="hero">
        <div className="wrap hero-grid">

          {/* Left copy */}
          <div className="hero-copy rv">
            <div className="eyebrow"><span className="eyebrow-spark">✦</span> Next-Gen Industrial Operations Suite</div>
            <h1>Everything<br />Connected.<br /><span className="h1-accent">Work Simplified.</span></h1>
            <p className="hero-sub">
              SE Connex is SiamEast Solutions' industrial operation suite — delivering
              multi-device visibility, real-time energy tracking, and seamless maintenance workflows.
            </p>
            <div className="hero-btns">
              <Btn cls="btn-primary btn-lg">Get Started Free <Ic d={PATHS.arrow} size={17} /></Btn>
              <Btn cls="btn-ghost btn-lg" href="#features">Explore Features</Btn>
            </div>
            <div className="hero-pills">
              {[[PATHS.send, 'Easy Reporting'], [PATHS.activity, 'Real-Time Monitoring'], [PATHS.clipboard, 'PM/CM Workflows'], [PATHS.layers, 'Unified Assets']].map(([d, t]) => (
                <div className="pill" key={t}><span className="pill-ic"><Ic d={d} size={14} /></span>{t}</div>
              ))}
            </div>
          </div>

          {/* Right 3 devices */}
          <div className="hero-devices rv" id="hero-mockup">
            <div className="devices-stage">
              <div className="scene-glow" />

              {/* Phone — far left, tilted */}
              <div className="dev dev-phone">
                <div className="phone-frame">
                  <div className="phone-island" />
                  <div className="phone-screen">
                    <img src="./assets/mobile-dashboard.png" alt="SE Connex mobile" />
                  </div>
                  <div className="phone-bar" />
                </div>
              </div>

              {/* Laptop — center main */}
              <div className="dev dev-laptop">
                <div className="laptop-lid">
                  <div className="laptop-cam" />
                  <div className="laptop-screen">
                    <img src="./assets/dashboard-light.png" alt="SE Connex desktop" />
                  </div>
                </div>
                <div className="laptop-base"><div className="laptop-notch" /></div>
              </div>

              {/* Tablet — far right, tilted */}
              <div className="dev dev-tablet">
                <div className="tablet-frame">
                  <div className="tablet-cam" />
                  <div className="tablet-screen">
                    <img src="./assets/equipment.png" alt="SE Connex tablet" />
                  </div>
                </div>
              </div>
            </div>

            <div className="device-labels">
              <span className="dl"><span className="dl-dot dl-m" />Mobile</span>
              <span className="dl"><span className="dl-dot dl-d" />Desktop</span>
              <span className="dl"><span className="dl-dot dl-t" />iPad</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECURITY BAR ── */}
      <section className="sec-bar">
        <div className="wrap">
          <div className="sec-card rv">
            <div className="sec-icon"><Ic d={PATHS.shield} size={26} /></div>
            <div className="sec-text">
              <strong>Enterprise Security. Built by SiamEast Solutions.</strong>
              <span>Encrypted data channels, multi-tenant isolation, and continuous cloud backup for all industrial telemetry.</span>
            </div>
            <Btn cls="btn-ghost btn-sm" href={LOGIN_URL}>Learn Security</Btn>
          </div>
        </div>
      </section>

      {/* ── FEATURE CAROUSEL ── */}
      <section className="feat-section" id="features">
        <div className="wrap">
          <div className="feat-head rv">
            <div className="eyebrow"><span className="eyebrow-spark">✦</span> Interactive Feature Showcase</div>
            <h2>See SE Connex Platform<br />in Action</h2>
            <p>Slide through our interactive feature showcase to see how digital twins, real-time IoT, and PM/CM workflows transform operations.</p>
          </div>

          {/* Tab nav — numbered horizontal strip */}
          <div className="feat-tabs rv">
            {FEATURES_LIST.map((f, i) => (
              <button key={f.id} className={`ftab${activeIdx === i ? ' active' : ''}`}
                onClick={() => setActiveIdx(i)}>
                <span className="ftab-num">0{i + 1}</span>
                <span className="ftab-label">{f.badge}</span>
              </button>
            ))}
          </div>

          {/* Slide stage */}
          <div className="feat-stage rv">
            {FEATURES_LIST.map((f, i) => (
              <div key={f.id} className={`fslide${activeIdx === i ? ' active' : ''}`}>

                {/* Mock browser window — left column, full bleed */}
                <div className="fmock">
                  <div className="fmock-bar">
                    <span className="fmock-dots">
                      <b className="fw fw-r" /><b className="fw fw-y" /><b className="fw fw-g" />
                    </span>
                    <span className="fmock-url">
                      <span className="fmock-lock">🔒</span> connex.siameastsolutions.com / {f.id}
                    </span>
                    <span className="fmock-badge">SE CONNEX v5</span>
                  </div>
                  <div className="fmock-img">
                    <img src={f.img} alt={f.title} loading="lazy" />
                  </div>
                </div>

                {/* Content panel — right column */}
                <div className="fcontent">
                  <span className="ftag">{f.badge}</span>
                  <h2>{f.title}</h2>
                  <p className="fsub-th">{f.subtitle}</p>
                  <p className="fdesc">{f.desc}</p>
                  <div className="fpoints">
                    {f.points.map(pt => (
                      <div className="fpt" key={pt}>
                        <span className="fpt-check">✓</span>
                        <span>{pt}</span>
                      </div>
                    ))}
                  </div>
                  <div className="ffoot">
                    <div className="fstat">
                      <span className="fstat-val">{f.stat}</span>
                      <span className="fstat-lbl">{f.statLabel}</span>
                    </div>
                    <Btn cls="btn-primary btn-sm" href={LOGIN_URL}>
                      Access Feature <Ic d={PATHS.arrow} size={15} />
                    </Btn>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Controls — outside card, centred below */}
          <div className="fctrl">
            <button className="fctrl-btn"
              onClick={() => setActiveIdx(p => (p - 1 + FEATURES_LIST.length) % FEATURES_LIST.length)}>
              <Ic d={PATHS.chevL} size={18} />
            </button>
            <button className="fctrl-btn fctrl-play" onClick={() => setPlaying(!playing)}>
              <Ic d={playing ? PATHS.pause : PATHS.play} size={16} />
              <span>{playing ? 'Pause' : 'Play'}</span>
            </button>
            <div className="fdots">
              {FEATURES_LIST.map((_, i) => (
                <button key={i} className={`fdot${activeIdx === i ? ' active' : ''}`}
                  onClick={() => setActiveIdx(i)} />
              ))}
            </div>
            <button className="fctrl-btn"
              onClick={() => setActiveIdx(p => (p + 1) % FEATURES_LIST.length)}>
              <Ic d={PATHS.chevR} size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* ── ONE PLATFORM / PILLARS ── */}
      <section className="pillars" id="platform">
        <div className="wrap">
          <div className="pillars-grid">
            <div className="pillars-intro rv">
              <h2>One Platform.<br /><span className="h-accent">All Operations.</span></h2>
              <p>Keep every asset connected, every engineer informed, and every team aligned.</p>
            </div>
            {[
              [PATHS.db, 'Centralize', 'All your asset telemetry & service history in one unified view.'],
              [PATHS.users, 'Collaborate', 'Seamless work order assignment across field engineers & managers.'],
              [PATHS.bar, 'Track', 'Live plant power consumption & energy heatmaps 24/7.'],
              [PATHS.zap, 'Resolve', 'Automated anomaly detection & instant push notifications.'],
            ].map(([d, h, p]) => (
              <div className="pcard rv" key={h}>
                <div className="pcard-ic"><Ic d={d} size={26} /></div>
                <h3>{h}</h3>
                <p>{p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── IMPACT ── */}
      <section className="impact" id="impact">
        <div className="wrap">
          <div className="impact-layout">
            <div className="impact-head rv">
              <span className="eyebrow-sm">Impact Metrics</span>
              <h2>Proven Efficiency.<br />Measurable Value.</h2>
              <p>Designed for SiamEast Solutions clients to minimize unplanned downtime and optimize energy efficiency.</p>
            </div>
            <div className="impact-cards rv">
              <div className="icard">
                <div className="icard-num">400+</div>
                <div className="icard-title">Assets Monitored</div>
                <p>Industrial pumps, valves, and systems under continuous telemetry.</p>
              </div>
              <div className="icard">
                <div className="icard-num">30%</div>
                <div className="icard-title">Efficiency Gain</div>
                <p>Reduced turnaround time for preventive maintenance work orders.</p>
              </div>
              <div className="icard icard-accent">
                <div className="icard-badge">NEW</div>
                <div className="icard-num">Soon</div>
                <div className="icard-title">Carbon CO₂ Reduction</div>
                <p>Automated carbon footprint analytics & ESG sustainability audit.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="cta-section">
        <div className="wrap">
          <div className="cta-card rv">
            <div className="cta-copy">
              <h2>Ready to Elevate Your Plant Operations?</h2>
              <p>Access SE Connex today — available exclusively for SiamEast Solutions PCL clients.</p>
            </div>
            <div className="cta-btns">
              <Btn cls="btn-light btn-lg" href={LOGIN_URL}>Get Started Now</Btn>
              {/* <Btn cls="btn-outline-light btn-lg" href={SE.contact}>Contact Sales</Btn> */}
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="footer">
        <div className="wrap">
          <div className="foot-grid">
            <div className="foot-brand">
              <span className="lo-brand"><span className="lo-se">SE</span> CONNEX</span>
              <span className="lo-tag">SiamEast Solutions PCL</span>
              <p>Helping modern industrial plants work smarter, stay connected, and maximize efficiency.</p>
            </div>
            <div className="foot-col">
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="#platform">Solutions</a>
              <a href={SE.shop} target="_blank" rel="noopener">SE Shop</a>
              <a href={LOGIN_URL}>Portal Sign In</a>
            </div>
            <div className="foot-col">
              <h4>Resources</h4>
              <a href={SE.products} target="_blank" rel="noopener">Products Catalog</a>
              <a href={SE.esg} target="_blank" rel="noopener">ESG & Sustainability</a>
              <a href={SE.ir} target="_blank" rel="noopener">Investor Relations</a>
            </div>
            <div className="foot-col">
              <h4>Company</h4>
              <a href={SE.about} target="_blank" rel="noopener">About SiamEast</a>
              <a href={SE.contact} target="_blank" rel="noopener">Contact Us</a>
              <a href={`mailto:${SE.email}`}>{SE.email}</a>
              <a href={`tel:${SE.phone}`}>+66 63 393 5088</a>
            </div>
          </div>
          <div className="foot-sub">
            <span>© 2026 SiamEast Solutions PCL · SET: SE · All rights reserved.</span>
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
