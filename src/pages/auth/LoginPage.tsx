import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Building2, ChevronLeft, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { Logo } from '@/components/common';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useLang } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { assetsFor } from '@/data/mockAssets';
import { mockRequests } from '@/data/mockRequests';
import { mockPM } from '@/data/mockPM';

export function LoginPage() {
  const { lang, setLang, t } = useLang();
  const { user, login } = useAuth();
  const { companies, setCompanyCode } = useCompany();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/portal';

  const [step, setStep] = useState<'credentials' | 'company'>(user ? 'company' : 'credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      setStep('company');
    } else {
      setError(
        t(
          'Email or password is incorrect. For this demo, use demo@seconnex.co.th / demo123.',
          'อีเมลหรือรหัสผ่านไม่ถูกต้อง สำหรับเดโมนี้ใช้ demo@seconnex.co.th / demo123',
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
      <div className="login-visual">
        <div className="grid-deco" aria-hidden />
        <div style={{ position: 'relative' }}>
          <Link
            to="/"
            aria-label={t('SE Connex — back to home', 'SE Connex — กลับหน้าแรก')}
            className="login-logo-link"
          >
            <div style={{ background: '#fff', display: 'inline-flex', padding: '8px 12px', borderRadius: 10, cursor: 'pointer', transition: 'box-shadow 0.15s ease' }}>
              <Logo height={30} />
            </div>
          </Link>
        </div>
        <div style={{ position: 'relative', maxWidth: 460 }}>
          <h1 style={{ fontSize: 30, lineHeight: 1.2, margin: '0 0 12px' }}>
            {t('Every asset, every service job, one portal.', 'ทุกอุปกรณ์ ทุกงานบริการ ในพอร์ทัลเดียว')}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.78)', fontSize: 15, margin: 0 }}>
            {t(
              'SE Connex gives your team live visibility of equipment, warranties, service requests, PM plans and energy performance — backed by SiamEast Solutions engineers.',
              'SE Connex ให้ทีมของคุณเห็นสถานะอุปกรณ์ การรับประกัน คำขอบริการ แผน PM และประสิทธิภาพพลังงานแบบเรียลไทม์ โดยทีมวิศวกรสยามอีสท์ โซลูชั่น',
            )}
          </p>
        </div>
        <div style={{ position: 'relative', color: 'rgba(255,255,255,0.55)', fontSize: 12.5 }}>
          SiamEast Solutions PCL · Customer Portal v2 Preview
        </div>
      </div>

      <div className="login-form-side">
        <div className="login-card">
          <div className="between" style={{ marginBottom: 22 }}>
            <Link
              to="/"
              aria-label={t('SE Connex — back to home', 'SE Connex — กลับหน้าแรก')}
              className="login-logo-link only-mobile"
            >
              <Logo height={28} />
            </Link>
            <span aria-hidden className="hide-mobile" />
            <div className="seg" role="group" aria-label={t('Language', 'ภาษา')}>
              <button className={lang === 'th' ? 'active' : ''} onClick={() => setLang('th')} aria-pressed={lang === 'th'}>TH</button>
              <button className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')} aria-pressed={lang === 'en'}>EN</button>
            </div>
          </div>

          {step === 'credentials' && (
            <>
              <h2 style={{ margin: '0 0 6px' }}>{t('Sign in to SE Connex', 'เข้าสู่ระบบ SE Connex')}</h2>
              <p className="muted" style={{ margin: '0 0 20px' }}>
                {t('Use the account provided by your SE administrator.', 'ใช้บัญชีที่ผู้ดูแลระบบของ SE จัดเตรียมให้')}
              </p>

              {error && (
                <div className="alert-item a-red" role="alert" style={{ marginBottom: 14 }}>
                  <AlertTriangle size={17} aria-hidden className="alert-icon" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={submit} noValidate>
                <div className="field">
                  <label htmlFor="login-email">{t('Email', 'อีเมล')}</label>
                  <div className="input-icon">
                    <Mail size={16} aria-hidden />
                    <input
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.co.th"
                      autoComplete="username"
                    />
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="login-pw">{t('Password', 'รหัสผ่าน')}</label>
                  <div className="input-icon">
                    <Lock size={16} aria-hidden />
                    <input
                      id="login-pw"
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="icon-btn tiny"
                      onClick={() => setShowPw((s) => !s)}
                      aria-label={showPw ? t('Hide password', 'ซ่อนรหัสผ่าน') : t('Show password', 'แสดงรหัสผ่าน')}
                    >
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="between" style={{ margin: '4px 0 18px' }}>
                  <label className="checkbox-row">
                    <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                    <span>{t('Remember me', 'จดจำการเข้าสู่ระบบ')}</span>
                  </label>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
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

                <button type="submit" className="btn btn-primary btn-lg btn-block">
                  {t('Sign in', 'เข้าสู่ระบบ')}
                  <ArrowRight size={17} aria-hidden />
                </button>
              </form>

              <div className="card" style={{ marginTop: 18, padding: '12px 14px', background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.6)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', boxShadow: '0 8px 24px rgba(16,24,40,0.08)' }}>
                <div className="small">
                  <strong>{t('Demo access', 'บัญชีสำหรับเดโม')}:</strong> demo@seconnex.co.th · {t('password', 'รหัสผ่าน')} demo123
                </div>
              </div>
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
