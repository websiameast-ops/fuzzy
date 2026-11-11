import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Building2, ChevronLeft, Eye, EyeOff, Lock, Mail, Moon, Sun } from 'lucide-react';
import { Logo, LanguageSelector } from '@/components/common';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useLang } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/contexts/ToastContext';
import { assetsFor } from '@/data/mockAssets';
import { mockRequests } from '@/data/mockRequests';
import { mockPM } from '@/data/mockPM';

export function LoginPage() {
  const { lang, setLang, t } = useLang();
  const { theme, toggleTheme } = useTheme();
  const { user, login } = useAuth();
  const { companies, setCompanyCode } = useCompany();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/portal';

  const [step, setStep] = useState<'credentials' | 'company'>('credentials');
  const [email, setEmail] = useState('raiwin.nat@siameastsolutions.com');
  const [password, setPassword] = useState('demo123');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError(t('Please enter your email and password.', 'กรุณากรอกอีเมลและรหัสผ่าน'));
      return;
    }
    const res = login(email, password);
    if (res.ok) {
      setError('');
      setCompanyCode('210WWCUTIX');
      navigate(from, { replace: true });
    } else {
      setError(
        t(
          'Email or password is incorrect. For this demo, use raiwin.nat@siameastsolutions.com / demo123.',
          'อีเมลหรือรหัสผ่านไม่ถูกต้อง สำหรับเดโมนี้ใช้ raiwin.nat@siameastsolutions.com / demo123',
        ),
      );
    }
  };

  const chooseCompany = (code: string) => {
    setCompanyCode(code);
    navigate(from, { replace: true });
  };

  return (
    <div className="login-layout">
      <div className="login-visual" style={{ background: 'radial-gradient(1000px 600px at 15% 15%, rgba(18, 48, 86, 0.5), transparent 65%), linear-gradient(165deg, #0f1c2c 0%, #08111a 100%)' }}>
        <div className="grid-deco" aria-hidden />
        <div style={{ position: 'relative' }}>
          <Link
            to="/"
            aria-label={t('SE Connex — back to home', 'SE Connex — กลับหน้าแรก')}
            className="login-logo-link"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}
          >
            <div style={{ width: 28, height: 28, borderRadius: 6, background: '#0a0f1d', border: '1px solid rgba(255,255,255,0.18)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 8, height: 8, background: '#dc2626', borderRadius: 2 }} />
            </div>
            <span style={{ color: '#ffffff', fontWeight: 800, fontSize: 16, letterSpacing: '0.04em' }}>
              SE <span style={{ color: '#ffffff' }}>CONNEX</span>
            </span>
          </Link>
        </div>
        <div style={{ position: 'relative', maxWidth: 460 }}>
          <h1 style={{ fontSize: 32, fontWeight: 700, lineHeight: 1.25, margin: '0 0 16px', color: '#2b3f56', whiteSpace: 'pre-line' }}>
            {t('Every asset, every service job,\none portal.', 'ทุกอุปกรณ์ ทุกงานบริการ ในพอร์ทัลเดียว')}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: 14.5, lineHeight: 1.6, margin: 0, whiteSpace: 'pre-line' }}>
            {t(
              'SE Connex gives your team live visibility of equipment,\nwarranties, service requests, PM plans and energy performance\n— backed by SiamEast Solutions engineers.',
              'SE Connex ให้ทีมของคุณเห็นสถานะอุปกรณ์ การรับประกัน คำขอบริการ แผน PM และประสิทธิภาพพลังงานแบบเรียลไทม์ โดยทีมวิศวกรสยามอีสท์ โซลูชั่น',
            )}
          </p>
        </div>
        <div style={{ position: 'relative', color: 'rgba(255,255,255,0.45)', fontSize: 12.5 }}>
          SiamEast Solutions PCL - Customer Portal
        </div>
      </div>

      <div className="login-form-side" style={{ background: 'var(--se-background)' }}>
        <div className="login-card">
          <div className="between" style={{ marginBottom: 32, justifyContent: 'flex-end', display: 'flex', gap: 8 }}>
            <LanguageSelector />
            <button
              className="icon-btn"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? t('Switch to light mode', 'สลับเป็นโหมดสว่าง') : t('Switch to dark mode', 'สลับเป็นโหมดมืด')}
              title={theme === 'dark' ? t('Light mode', 'โหมดสว่าง') : t('Dark mode', 'โหมดมืด')}
              style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid var(--se-border)', background: 'var(--se-surface)' }}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>

          {step === 'credentials' && (
            <>
              <h2 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 700, color: 'var(--se-text)' }}>
                {t('Sign in to SE Connex', 'เข้าสู่ระบบ SE Connex')}
              </h2>
              <p className="muted" style={{ margin: '0 0 24px', fontSize: 13.5 }}>
                {t('Use the account provided by your SE administrator.', 'ใช้บัญชีที่ผู้ดูแลระบบของ SE จัดเตรียมให้')}
              </p>

              {error && (
                <div className="alert-item a-red" role="alert" style={{ marginBottom: 14 }}>
                  <AlertTriangle size={17} aria-hidden className="alert-icon" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={submit} noValidate>
                <div className="field" style={{ marginBottom: 16 }}>
                  <label htmlFor="login-email" style={{ fontSize: 13, fontWeight: 600, color: 'var(--se-text)', display: 'block', marginBottom: 6 }}>
                    {t('Email', 'อีเมล')}
                  </label>
                  <div className="input-icon" style={{ background: '#edf3f8', borderRadius: 8, border: '1px solid #dce4ee', paddingLeft: 12 }}>
                    <Mail size={16} aria-hidden style={{ color: '#64748b' }} />
                    <input
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="raiwin.nat@siameastsolutions.com"
                      autoComplete="username"
                      style={{ background: 'transparent', border: 'none', padding: '11px 12px 11px 0', fontSize: 14, width: '100%' }}
                    />
                  </div>
                </div>

                <div className="field" style={{ marginBottom: 16 }}>
                  <label htmlFor="login-pw" style={{ fontSize: 13, fontWeight: 600, color: 'var(--se-text)', display: 'block', marginBottom: 6 }}>
                    {t('Password', 'รหัสผ่าน')}
                  </label>
                  <div className="input-icon" style={{ background: '#edf3f8', borderRadius: 8, border: '1px solid #dce4ee', paddingLeft: 12 }}>
                    <Lock size={16} aria-hidden style={{ color: '#64748b' }} />
                    <input
                      id="login-pw"
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      style={{ background: 'transparent', border: 'none', padding: '11px 12px 11px 0', fontSize: 14, width: '100%' }}
                    />
                    <button
                      type="button"
                      className="icon-btn tiny"
                      onClick={() => setShowPw((s) => !s)}
                      aria-label={showPw ? t('Hide password', 'ซ่อนรหัสผ่าน') : t('Show password', 'แสดงรหัสผ่าน')}
                      style={{ marginRight: 6 }}
                    >
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="between" style={{ margin: '4px 0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label className="checkbox-row" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--se-text-secondary)' }}>
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      style={{ accentColor: '#4f80b0', width: 16, height: 16 }}
                    />
                    <span>{t('Remember me', 'จดจำการเข้าสู่ระบบ')}</span>
                  </label>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: 13, color: '#64748b', padding: '2px 4px' }}
                    onClick={() =>
                      showToast(
                        t('A password-reset link was sent to your email (demo).', 'ส่งลิงก์รีเซ็ตรหัสผ่านไปที่อีเมลแล้ว (เดโม)'),
                        'info',
                      )
                    }
                  >
                    {t('Forgot password?', 'ลืมรหัสผ่าน?')}
                  </button>
                </div>

                <button
                  type="submit"
                  className="btn btn-block"
                  style={{
                    background: '#638fae',
                    color: '#ffffff',
                    borderRadius: 8,
                    padding: '12px 16px',
                    fontSize: 14,
                    fontWeight: 600,
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    width: '100%',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#547f9e')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#638fae')}
                >
                  {t('Sign in', 'เข้าสู่ระบบ')}
                  <ArrowRight size={16} aria-hidden />
                </button>
              </form>
            </>
          )}

          {step === 'company' && (
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => setStep('credentials')} style={{ marginBottom: 8, marginLeft: -8 }}>
                <ChevronLeft size={16} aria-hidden />
                {t('Back', 'ย้อนกลับ')}
              </button>
              <h2 style={{ margin: '0 0 6px' }}>{t('Choose a company', 'เลือกบริษัท')}</h2>
              <p className="muted" style={{ margin: '0 0 18px' }}>
                {t('Your account has access to more than one company. You can switch later from the top bar.', 'บัญชีของคุณเข้าถึงได้มากกว่าหนึ่งบริษัท และสามารถสลับได้ภายหลังจากแถบด้านบน')}
              </p>
              <div style={{ display: 'grid', gap: 12 }}>
                {companies.map((c) => {
                  const assets = assetsFor(c.customerCode);
                  const open = mockRequests.filter(
                    (r) => r.customerCode === c.customerCode && !['completed', 'closed', 'cancelled'].includes(r.status),
                  ).length;
                  const upcoming = mockPM.filter(
                    (v) => v.customerCode === c.customerCode && v.status !== 'completed' && v.date >= '2026-07-14',
                  ).length;
                  return (
                    <button key={c.customerCode} className="company-select-card" onClick={() => chooseCompany(c.customerCode)}>
                      <div className="flex" style={{ gap: 12 }}>
                        <span className="avatar" aria-hidden style={{ background: 'var(--se-charcoal)' }}>
                          <Building2 size={18} />
                        </span>
                        <div style={{ minWidth: 0 }}>
                          <div className="fw-600">{lang === 'th' ? c.nameTh : c.name}</div>
                          <div className="muted small">{c.customerCode} · {c.industry}</div>
                        </div>
                      </div>
                      <div className="flex" style={{ gap: 14, flexWrap: 'wrap' }}>
                        <span className="small"><strong>{assets.length}</strong> {t('assets', 'อุปกรณ์')}</span>
                        <span className="small"><strong>{c.sites.length}</strong> {t('sites', 'ไซต์งาน')}</span>
                        <span className="small"><strong>{open}</strong> {t('open requests', 'คำขอค้าง')}</span>
                        <span className="small"><strong>{upcoming}</strong> {t('upcoming PM', 'งาน PM ถัดไป')}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function LogoutRoute() {
  const { logout } = useAuth();
  const { clearSelection } = useCompany();
  useEffect(() => {
    logout();
    clearSelection();
  }, [logout, clearSelection]);
  return <Navigate to="/login" replace />;
}
