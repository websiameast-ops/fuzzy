import { useEffect, useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Building2, ChevronLeft, Eye, EyeOff, Lock, Mail, Moon, Sun } from 'lucide-react';
import { Logo, LanguageSelector } from '@/components/common';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useLang } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { apiGetCompany, apiResendVerification } from '@/lib/apiClient';
import type { CompanyResponse } from '@/lib/apiClient';
import { tokenStore } from '@/lib/tokenStore';
import { companyDisplayName } from '@/utils/format';
import { useAppVersion } from '@/hooks/useAppVersion';

export function LoginPage() {
  const { t } = useLang();
  const { theme, toggleTheme } = useTheme();
  const version = useAppVersion();
  const { user, login } = useAuth();
  const { companies, setCompanyCode } = useCompany();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/portal';

  const [step, setStep] = useState<'credentials' | 'company'>(user ? 'company' : 'credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // Set when login fails with 403 (account not yet verified — see
  // authenticate_portal's Invited-status check) so the form can offer a
  // resend instead of the generic wrong-password message.
  const [notVerified, setNotVerified] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [companyStats, setCompanyStats] = useState<CompanyResponse | null>(null);
  const [companyLoading, setCompanyLoading] = useState(false);
  const [companyError, setCompanyError] = useState(false);

  useEffect(() => {
    if (step !== 'company') return;
    const accessToken = tokenStore.read()?.accessToken;
    if (!accessToken) return;
    setCompanyLoading(true);
    setCompanyError(false);
    apiGetCompany(accessToken)
      .then(setCompanyStats)
      .catch(() => setCompanyError(true))
      .finally(() => setCompanyLoading(false));
  }, [step]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError(t('Please enter your email and password.', 'กรุณากรอกอีเมลและรหัสผ่าน'));
      return;
    }
    setSubmitting(true);
    setNotVerified(false);
    setResent(false);
    const res = await login(email, password, remember);
    setSubmitting(false);
    if (res.ok) {
      setError('');
      setStep('company');
    } else {
      // status 0 = the request never reached the server (offline, wrong API base
      // URL, or blocked by CORS) — a completely different problem from a wrong
      // password, and worth telling apart rather than always blaming the password
      // (see deviceId.ts's secure-context note for one way this used to happen).
      if (res.status === 0) {
        setError(
          t(
            'Cannot reach the server. Check your connection and try again.',
            'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่อแล้วลองใหม่อีกครั้ง',
          ),
        );
      } else if (res.status === 401) {
        setError(t('Email or password is incorrect.', 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'));
      } else if (res.status === 403) {
        // Account exists but hasn't verified its email yet (see
        // authenticate_portal's Invited-status check). The backend's message
        // is Thai-only, so ignore it and show a locale-aware message instead
        // (matches the 401/409 branches below); offer a resend alongside it.
        setError(
          t(
            'Your account has not verified its email yet. Please check your inbox.',
            'บัญชียังไม่ได้ยืนยันอีเมล กรุณาตรวจสอบกล่องอีเมลของคุณ',
          ),
        );
        setNotVerified(true);
      } else if (res.status === 409 && res.code === 'CONFLICT') {
        setError(
          t(
            'This account is already signed in on another device. Please sign out there first.',
            'บัญชีนี้กำลังเข้าสู่ระบบอยู่บนอุปกรณ์อื่น กรุณาออกจากระบบอุปกรณ์นั้นก่อน',
          ),
        );
      } else {
        setError(t('Something went wrong. Please try again.', 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'));
      }
    }
  };

  const resendVerification = async () => {
    if (!email) return;
    setResending(true);
    try {
      await apiResendVerification(email);
    } catch {
      // Enumeration-safe backend response either way — nothing to branch on.
    } finally {
      setResending(false);
      setResent(true);
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
          <button
            type="button"
            onClick={() => navigate('/')}
            className="login-visual-logo-btn"
            style={{ display: 'inline-flex', padding: '8px 12px', borderRadius: 10, border: 'none', cursor: 'pointer' }}
            aria-label={t('Go to landing page', 'ไปที่หน้าแรก')}
          >
            <Logo height={30} />
          </button>
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
          SiamEast Solutions PCL · {t('Customer Portal', 'พอร์ทัลลูกค้า')} {version ? `v${version}` : ''}
        </div>
      </div>

      <div className="login-form-side">
        <div className="login-card">
          <div className="between" style={{ marginBottom: 22 }}>
            <button
              type="button"
              className="only-mobile"
              onClick={() => navigate('/')}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
              aria-label={t('Go to landing page', 'ไปที่หน้าแรก')}
            >
              <Logo height={28} />
            </button>
            <span aria-hidden className="hide-mobile" />
            <div className="flex" style={{ gap: 10, alignItems: 'center' }}>
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
            </div>
          </div>

          {step === 'credentials' && (
            <>
              <h2 style={{ margin: '0 0 6px' }}>{t('Sign in to SE Connex', 'เข้าสู่ระบบ SE Connex')}</h2>
              <p className="muted" style={{ margin: '0 0 20px' }}>
                {t('Use the account provided by your SE administrator.', 'ใช้บัญชีที่ผู้ดูแลระบบของ SE จัดเตรียมให้')}
              </p>

              {error && (
                <div className="alert-item a-red" role="alert" style={{ marginBottom: notVerified ? 8 : 14, alignItems: 'flex-start' }}>
                  <AlertTriangle size={17} aria-hidden style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>{error}</span>
                </div>
              )}

              {notVerified && (
                <div style={{ marginBottom: 14 }}>
                  {resent ? (
                    <span className="muted small">
                      {t('If that account exists, a new link is on its way.', 'หากมีบัญชีนี้อยู่ในระบบ ลิงก์ใหม่กำลังถูกส่งไปให้')}
                    </span>
                  ) : (
                    <button type="button" className="btn btn-outline btn-sm" onClick={resendVerification} disabled={resending}>
                      {resending ? t('Sending…', 'กำลังส่ง…') : t('Resend verification email', 'ส่งอีเมลยืนยันอีกครั้ง')}
                    </button>
                  )}
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
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate('/forgot-password')}>
                    {t('Forgot password?', 'ลืมรหัสผ่าน?')}
                  </button>
                </div>

                <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={submitting}>
                  {submitting ? t('Signing in…', 'กำลังเข้าสู่ระบบ…') : t('Sign in', 'เข้าสู่ระบบ')}
                  <ArrowRight size={17} aria-hidden />
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
                {companyLoading ? (
                  [0].map((i) => (
                    <div key={i} className="company-select-card" style={{ cursor: 'default' }} aria-hidden>
                      <div className="flex" style={{ gap: 12 }}>
                        <span className="skeleton" style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }} />
                        <div style={{ minWidth: 0, flex: 1, display: 'grid', gap: 6 }}>
                          <span className="skeleton" style={{ width: '55%', height: 14 }} />
                          <span className="skeleton" style={{ width: '35%', height: 12 }} />
                        </div>
                      </div>
                      <div className="flex" style={{ gap: 14, flexWrap: 'wrap' }}>
                        {[0, 1, 2, 3].map((j) => (
                          <span key={j} className="skeleton" style={{ width: 64, height: 12 }} />
                        ))}
                      </div>
                    </div>
                  ))
                ) : companyStats ? (
                  // Real backend model is 1 user → 1 company (AppUser.customer_code), so once
                  // /api/company resolves we show that single real company rather than trying
                  // to match its customerCode into the fictional mock roster below.
                  <button
                    key={companyStats.customerCode}
                    className="company-select-card"
                    // Select the mock company that backs the rest of the (still mock-driven)
                    // app — the real customerCode from the API has no matching mock records,
                    // so passing it here would blank out Dashboard/Equipment/etc. after login.
                    onClick={() => chooseCompany(companies.find((c) => c.customerCode === companyStats.customerCode)?.customerCode ?? companies[0]?.customerCode ?? 'CUS-00128')}
                  >
                    <div className="flex" style={{ gap: 12 }}>
                      <span className="avatar" aria-hidden style={{ background: 'var(--se-charcoal)' }}>
                        <Building2 size={18} />
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div className="fw-600">
                          {companyDisplayName(companyStats.preName, companyStats.customerName, companyStats.customerName)}
                        </div>
                        <div className="muted small">{companyStats.customerCode}</div>
                      </div>
                    </div>
                    <div className="flex" style={{ gap: 14, flexWrap: 'wrap' }}>
                      <span className="small"><strong>{companyStats.totalUnits}</strong> {t('assets', 'อุปกรณ์')}</span>
                      <span className="small"><strong>{companyStats.totalSites}</strong> {t('sites', 'ไซต์งาน')}</span>
                      <span className="small"><strong>{companyStats.assignedTickets}</strong> {t('open requests', 'คำขอค้าง')}</span>
                      <span className="small"><strong>{companyStats.upcomingPmCount}</strong> {t('upcoming PM', 'งาน PM ถัดไป')}</span>
                    </div>
                  </button>
                ) : (
                  <div className="empty-state">
                    <div className="es-icon" aria-hidden>
                      <AlertTriangle size={22} />
                    </div>
                    <div className="fw-600">
                      {companyError
                        ? t('Unable to load company information.', 'ไม่สามารถโหลดข้อมูลบริษัทได้')
                        : t('No company found for this account.', 'ไม่พบบริษัทสำหรับบัญชีนี้')}
                    </div>
                    <p className="muted small" style={{ margin: 0 }}>
                      {t('Please try signing in again.', 'กรุณาลองเข้าสู่ระบบใหม่อีกครั้ง')}
                    </p>
                  </div>
                )}
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
