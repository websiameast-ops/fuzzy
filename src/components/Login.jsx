import { useState } from 'react';

const PATHS = {
  arrow: 'M5 12h14M13 6l6 6-6 6',
  eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  mail: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6',
  lock: 'M19 11H5c-1.1 0-2 .9-2 2v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7c0-1.1-.9-2-2-2z M7 11V7a5 5 0 0 1 10 0v4',
};

function Ic({ d, size = 20, sw = 1.8 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

export default function Login({ onBackToLanding }) {
  const [language, setLanguage] = useState('EN');
  const [email, setEmail] = useState('demo@seconnex.co.th');
  const [password, setPassword] = useState('demo123');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    console.log('Login attempt:', { email, password, rememberMe });
    window.location.href = 'https://connex.siameastsolutions.com/login';
  };

  const t = {
    EN: {
      signIn: 'Sign in to SE Connex',
      instruction: 'Use the account provided by your SE administrator.',
      email: 'Email',
      password: 'Password',
      rememberMe: 'Remember me',
      forgotPassword: 'Forgot password?',
      signInBtn: 'Sign in',
      demoAccess: 'Demo access:',
      demoEmail: 'demo@seconnex.co.th',
      demoPass: 'password demo123',
      tagline: 'Every asset, every service job, one portal.',
      description: 'SE Connex gives your team live visibility of equipment, warranties, service requests, PM plans and energy performance — backed by SiamEast Solutions engineers.',
      footerTag: 'SiamEast Solutions PCL · Customer Portal Preview',
    },
    TH: {
      signIn: 'เข้าสู่ระบบ SE Connex',
      instruction: 'ใช้บัญชีที่ได้รับแจ้งจากผู้ดูแลระบบ SE ของคุณ',
      email: 'อีเมล',
      password: 'รหัสผ่าน',
      rememberMe: 'จำฉันไว้ในระบบ',
      forgotPassword: 'ลืมรหัสผ่าน?',
      signInBtn: 'เข้าสู่ระบบ',
      demoAccess: 'บัญชีทดสอบ:',
      demoEmail: 'demo@seconnex.co.th',
      demoPass: 'รหัสผ่าน demo123',
      tagline: 'ทุกสินทรัพย์ ทุกงานบริการ รวมในพอร์ทัลเดียว',
      description: 'SE Connex ช่วยให้ทีมของคุณเห็นสถานะอุปกรณ์ การรับประกัน คำขอบริการ แผนบำรุงรักษา และประสิทธิภาพพลังงานแบบเรียลไทม์ — สนับสนุนโดยวิศวกร SiamEast Solutions',
      footerTag: 'SiamEast Solutions PCL · Customer Portal v2 Preview',
    },
  };

  const currentLang = t[language];

  return (
    <div className="login-split-page">
      {/* Top right language toggle */}
      <div className="login-lang-switch">
        <button
          className={`lang-chip ${language === 'TH' ? 'active' : ''}`}
          onClick={() => setLanguage('TH')}
        >
          TH
        </button>
        <button
          className={`lang-chip ${language === 'EN' ? 'active' : ''}`}
          onClick={() => setLanguage('EN')}
        >
          EN
        </button>
      </div>

      {/* LEFT SIDE — Dark Grid & Banner */}
      <div className="split-left">
        <div className="split-left-grid-pattern" />
        <div className="split-left-content">
          {/* Logo Pill */}
          <div className="brand-logo-pill" onClick={onBackToLanding} title="Back to Home">
            <img src="./assets/logo-connex.svg" alt="SE Connex" style={{ height: 40, width: 40, borderRadius: 8, display: 'block', flexShrink: 0 }} />
            <div className="pill-text">
              <span className="brand-name"><span className="lo-se">SE</span> Connex</span>
              <span className="brand-sub">SIAMEAST SOLUTIONS PCL</span>
            </div>
          </div>

          {/* Headline & Description */}
          <div className="hero-text-block">
            <h1 className="split-headline">{currentLang.tagline}</h1>
            <p className="split-desc">{currentLang.description}</p>
          </div>

          {/* System Notices & Promotions Widget */}
          <div className="login-notices-container">
            {/* System Maintenance Alert */}
            <div className="notice-card alert-notice">
              <div className="notice-badge alert-badge">
                <span className="badge-dot pulse" /> System Notice
              </div>
              <div className="notice-body">
                <h4>{language === 'TH' ? 'แจ้งปิดปรับปรุงระบบประจำสัปดาห์' : 'Scheduled System Maintenance'}</h4>
                <p>
                  {language === 'TH'
                    ? 'ระบบจะปิดปรับปรุงชั่วคราวในวันอาทิตย์ที่ 26 ก.ค. เวลา 01:00 - 04:00 น.'
                    : 'System maintenance on Sun 26 Jul, 01:00 - 04:00 AM (UTC+7).'}
                </p>
              </div>
            </div>

            {/* Special Offer / Promotion Card */}
            <div className="notice-card promo-notice">
              <div className="notice-badge promo-badge">
                ✦ {language === 'TH' ? 'โปรโมชั่นพิเศษ' : 'Special Offer'}
              </div>
              <div className="notice-body">
                <h4>{language === 'TH' ? 'แพ็กเกจตรวจเช็กปั๊มอุตสาหกรรม ฟรี!' : 'Free Industrial Pump Health Check'}</h4>
                <p>
                  {language === 'TH'
                    ? 'สิทธิพิเศษสำหรับลูกค้า SE Connex รับบริการตรวจวัด Vibration & Thermal ฟรี 1 ครั้ง'
                    : 'Exclusive for SE Connex users: Free 1-time Vibration & Thermal inspection.'}
                </p>
              </div>
            </div>
          </div>

          {/* Footer watermark */}
          <div className="split-left-footer">
            <span>{currentLang.footerTag}</span>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE — Light Clean Form */}
      <div className="split-right">
        <div className="split-form-card">
          <div className="form-head">
            <h2>{currentLang.signIn}</h2>
            <p>{currentLang.instruction}</p>
          </div>

          <form onSubmit={handleLogin} className="clean-login-form">
            {/* Email Field */}
            <div className="field-group">
              <label htmlFor="email-input">{currentLang.email}</label>
              <div className="field-input-box filled-yellow">
                <span className="field-ic"><Ic d={PATHS.mail} size={17} /></span>
                <input
                  id="email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.co.th"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="field-group">
              <label htmlFor="pass-input">{currentLang.password}</label>
              <div className="field-input-box filled-yellow">
                <span className="field-ic"><Ic d={PATHS.lock} size={17} /></span>
                <input
                  id="pass-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="field-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  <Ic d={PATHS.eye} size={17} />
                </button>
              </div>
            </div>

            {/* Remember me & Forgot Password */}
            <div className="form-action-row">
              <label className="checkbox-wrap">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="chk-custom" />
                <span>{currentLang.rememberMe}</span>
              </label>

              <a href="https://connex.siameastsolutions.com/login" target="_blank" rel="noreferrer" className="forgot-btn">
                {currentLang.forgotPassword}
              </a>
            </div>

            {/* Submit Button */}
            <button type="submit" className="submit-login-btn">
              <span>{currentLang.signInBtn}</span>
              <Ic d={PATHS.arrow} size={17} />
            </button>
          </form>

          {/* Demo access pill */}
          <div className="demo-blue-pill">
            <span className="demo-title">{currentLang.demoAccess}</span>
            <span className="demo-val">{currentLang.demoEmail} · {currentLang.demoPass}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
