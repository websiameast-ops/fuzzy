import { useState } from 'react';

interface Props {
  privacyUrl: string;
}

interface CookiePrefs {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

export function CookieConsentBanner({ privacyUrl }: Props) {
  const [cookieAccepted, setCookieAccepted] = useState(
    () => localStorage.getItem('se_cookie_accepted') === 'true'
  );
  const [cookieSettingsOpen, setCookieSettingsOpen] = useState(false);
  const [cookiePreferences, setCookiePreferences] = useState<CookiePrefs>({
    necessary: true,
    analytics: true,
    marketing: true,
  });

  const logCookieConsent = (actionType: string, categories: Partial<CookiePrefs> = {}) => {
    let sessionId = localStorage.getItem('se_session_id');
    if (!sessionId) {
      sessionId = 'sess_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
      localStorage.setItem('se_session_id', sessionId);
    }
    const fullLogEntry = {
      session_id: sessionId,
      timestamp: new Date().toISOString(),
      user_agent: navigator.userAgent || 'Unknown Browser',
      ip_address: '127.0.0.1 (Client-side)',
      consent_action: actionType,
      categories: actionType === 'closed_without_action'
        ? { necessary: true, analytics: false, marketing: false }
        : categories,
      consent_version: 'v1.2.0',
      domain: window.location.hostname || 'connex.siameastsolutions.com',
      language: navigator.language || 'th-TH',
      screen_resolution: `${window.screen.width}x${window.screen.height}`,
      referrer: document.referrer || 'direct',
    };
    const currentLogs = JSON.parse(localStorage.getItem('cookie_audit_logs') || '[]');
    currentLogs.push(fullLogEntry);
    localStorage.setItem('cookie_audit_logs', JSON.stringify(currentLogs, null, 2));
  };

  if (cookieAccepted) return null;

  return (
    <>
      <div className="cookie-consent-bar">
        <div className="cookie-consent-container">
          <div className="cookie-text-content">
            <span className="cookie-icon">🍪</span>
            <p>
              <strong>การเก็บข้อมูลและใช้คุกกี้ (Cookie Policy):</strong> เราใช้คุกกี้เพื่อจำเป็นต่อการทำงานของระบบ วิเคราะห์และปรับปรุงประสิทธิภาพเพื่อประสบการณ์ที่ดีในการใช้งาน รวมถึงการนำเสนอข้อมูลการตลาดเฉพาะบุคคล
              อ่านเพิ่มเติมได้ที่ <a href={privacyUrl} target="_blank" rel="noopener noreferrer">นโยบายความเป็นส่วนตัว (Privacy Policy)</a>
            </p>
          </div>
          <div className="cookie-actions">
            <button className="btn btn-cookie-settings" onClick={() => setCookieSettingsOpen(true)}>
              ตั้งค่าคุกกี้ (Customize)
            </button>
            <button
              className="btn btn-cookie-accept"
              onClick={() => {
                const allPref = { necessary: true, analytics: true, marketing: true };
                localStorage.setItem('se_cookie_accepted', 'true');
                localStorage.setItem('se_cookie_preferences', JSON.stringify(allPref));
                logCookieConsent('accept_all', allPref);
                setCookieAccepted(true);
              }}
            >
              ยอมรับทั้งหมด (Accept All)
            </button>
            <button
              className="cookie-close-icon-btn"
              title="ปิดหน้าต่างโดยไม่กดเลือก"
              onClick={() => {
                logCookieConsent('closed_without_action', { necessary: true });
                setCookieAccepted(true);
              }}
            >✕</button>
          </div>
        </div>
      </div>

      {cookieSettingsOpen && (
        <div className="cookie-modal-overlay" onClick={() => setCookieSettingsOpen(false)}>
          <div className="cookie-settings-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cookie-settings-header">
              <h3>⚙️ ศูนย์ตั้งค่าความเป็นส่วนตัวของคุกกี้ (Cookie Settings)</h3>
              <button className="popover-close" onClick={() => setCookieSettingsOpen(false)}>×</button>
            </div>
            <div className="cookie-settings-body">
              <p className="cookie-settings-intro">
                คุณสามารถเลือกตั้งค่าการยินยอมใช้คุกกี้ในแต่ละประเภทได้ตามวัตถุประสงค์:
              </p>
              <div className="cookie-cat-item">
                <div className="cookie-cat-header">
                  <div>
                    <strong>1. คุกกี้ที่จำเป็นอย่างยิ่ง (Strictly Necessary Cookies)</strong>
                    <span className="badge-required">จำเป็น (Always Active)</span>
                  </div>
                  <input type="checkbox" checked disabled readOnly />
                </div>
                <p className="cookie-cat-desc">คุกกี้ประเภทนี้มีความจำเป็นต่อการทำงานของเว็บไซต์ เพื่อให้คุณสามารถใช้งานฟังก์ชันพื้นฐาน การเข้าสู่ระบบ และการรักษาความปลอดภัยได้อย่างปลอดภัย</p>
              </div>
              <div className="cookie-cat-item">
                <div className="cookie-cat-header">
                  <div><strong>2. คุกกี้เพื่อการวัดผลและปรับปรุงระบบ (Analytics & Performance Cookies)</strong></div>
                  <input type="checkbox" checked={cookiePreferences.analytics}
                    onChange={(e) => setCookiePreferences({ ...cookiePreferences, analytics: e.target.checked })} />
                </div>
                <p className="cookie-cat-desc">ใช้ในการเก็บข้อมูลเชิงสถิติแบบไม่ระบุตัวตนเกี่ยวกับการใช้งานเว็บไซต์</p>
              </div>
              <div className="cookie-cat-item">
                <div className="cookie-cat-header">
                  <div><strong>3. คุกกี้เพื่อการตลาดและประชาสัมพันธ์ (Marketing & Targeting Cookies)</strong></div>
                  <input type="checkbox" checked={cookiePreferences.marketing}
                    onChange={(e) => setCookiePreferences({ ...cookiePreferences, marketing: e.target.checked })} />
                </div>
                <p className="cookie-cat-desc">ใช้เพื่อนำเสนอข้อมูลข่าวสาร โปรโมชัน และสิทธิประโยชน์ที่ตรงกับความสนใจของคุณ</p>
              </div>
            </div>
            <div className="cookie-settings-footer">
              <button
                className="btn btn-cookie-save"
                onClick={() => {
                  localStorage.setItem('se_cookie_accepted', 'true');
                  localStorage.setItem('se_cookie_preferences', JSON.stringify(cookiePreferences));
                  logCookieConsent('accept_selected', cookiePreferences);
                  setCookieSettingsOpen(false);
                  setCookieAccepted(true);
                }}
              >บันทึกตัวเลือก (Save Preferences)</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
