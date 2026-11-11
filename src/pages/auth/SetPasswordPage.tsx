import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Eye, EyeOff, Lock, Mail, Moon, Sun } from 'lucide-react';
import { Logo, LanguageSelector } from '@/components/common';
import { useLang } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/contexts/ToastContext';
import {
  apiForgotPassword,
  apiResendVerification,
  apiResetPassword,
  apiVerifyEmail,
  ApiError,
} from '@/lib/apiClient';

/** Shared shell for /verify-email and /reset-password — both spend a
 * ?token=... link by asking for a new password, differing only in which
 * endpoint they call and their copy (see services/email_tokens.py's shared
 * `consume()` on the backend). */
function SetPasswordForm({ purpose }: { purpose: 'activate' | 'reset' }) {
  const { t } = useLang();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [tokenDead, setTokenDead] = useState(!token);

  const [resendEmail, setResendEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      setError(t('Password must be at least 6 characters.', 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('Passwords do not match.', 'รหัสผ่านไม่ตรงกัน'));
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      if (purpose === 'activate') {
        await apiVerifyEmail(token, password, confirmPassword);
        showToast(t('Email verified — you can sign in now.', 'ยืนยันอีเมลสำเร็จ เข้าสู่ระบบได้เลย'), 'success');
      } else {
        await apiResetPassword(token, password, confirmPassword);
        showToast(t('Password updated — you can sign in now.', 'ตั้งรหัสผ่านใหม่สำเร็จ เข้าสู่ระบบได้เลย'), 'success');
      }
      navigate('/login', { replace: true });
    } catch (err) {
      if (err instanceof ApiError && (err.status === 422 || err.status === 400)) {
        // Invalid/expired/consumed link — the only way back in is a fresh
        // resend the user triggers themselves.
        setTokenDead(true);
      } else {
        setError(err instanceof ApiError ? err.message : t('Something went wrong. Please try again.', 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const resend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail) return;
    setResending(true);
    try {
      if (purpose === 'activate') await apiResendVerification(resendEmail);
      else await apiForgotPassword(resendEmail);
    } finally {
      setResending(false);
      // Enumeration-safe backend response — always show the same generic
      // confirmation regardless of what actually happened server-side.
      setResent(true);
    }
  };

  return (
    <div className="login-form-side" style={{ minHeight: '100vh' }}>
      <div className="login-card">
        <div className="between" style={{ marginBottom: 22 }}>
          <Logo height={28} />
          <div className="flex" style={{ gap: 10, alignItems: 'center' }}>
            <LanguageSelector />
            <button
              type="button"
              className="icon-btn"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? t('Switch to light mode', 'สลับเป็นโหมดสว่าง') : t('Switch to dark mode', 'สลับเป็นโหมดมืด')}
            >
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          </div>
        </div>

        {tokenDead ? (
          <>
            <h2 style={{ margin: '0 0 6px' }}>
              {t('Link expired or already used', 'ลิงก์หมดอายุหรือถูกใช้ไปแล้ว')}
            </h2>
            <p className="muted" style={{ margin: '0 0 20px' }}>
              {purpose === 'activate'
                ? t(
                    'Enter your email and we’ll send a new activation link.',
                    'กรอกอีเมลของคุณ แล้วเราจะส่งลิงก์ยืนยันใหม่ให้',
                  )
                : t(
                    'Enter your email and we’ll send a new reset link.',
                    'กรอกอีเมลของคุณ แล้วเราจะส่งลิงก์รีเซ็ตรหัสผ่านใหม่ให้',
                  )}
            </p>
            {resent ? (
              <div className="alert-item a-blue" role="status">
                <span>{t('If that account exists, a new link is on its way.', 'หากมีบัญชีนี้อยู่ในระบบ ลิงก์ใหม่กำลังถูกส่งไปให้')}</span>
              </div>
            ) : (
              <form onSubmit={resend} noValidate>
                <div className="field">
                  <label htmlFor="resend-email">{t('Email', 'อีเมล')}</label>
                  <div className="input-icon">
                    <Mail size={16} aria-hidden />
                    <input
                      id="resend-email"
                      type="email"
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      placeholder="name@company.co.th"
                      autoComplete="email"
                    />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={resending}>
                  {resending ? t('Sending…', 'กำลังส่ง…') : t('Send new link', 'ส่งลิงก์ใหม่')}
                </button>
              </form>
            )}
          </>
        ) : (
          <>
            <h2 style={{ margin: '0 0 6px' }}>
              {purpose === 'activate' ? t('Set your password', 'ตั้งรหัสผ่านของคุณ') : t('Choose a new password', 'ตั้งรหัสผ่านใหม่')}
            </h2>
            <p className="muted" style={{ margin: '0 0 20px' }}>
              {purpose === 'activate'
                ? t('One last step — set a password to activate your SE Connex account.', 'ขั้นตอนสุดท้าย — ตั้งรหัสผ่านเพื่อเริ่มใช้งานบัญชี SE Connex')
                : t('Enter a new password for your account.', 'กรอกรหัสผ่านใหม่สำหรับบัญชีของคุณ')}
            </p>

            {error && (
              <div className="alert-item a-red" role="alert" style={{ marginBottom: 14 }}>
                <AlertTriangle size={17} aria-hidden />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={submit} noValidate>
              <div className="field">
                <label htmlFor="sp-pw">{t('New password', 'รหัสผ่านใหม่')}</label>
                <div className="input-icon">
                  <Lock size={16} aria-hidden />
                  <input
                    id="sp-pw"
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
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
              <div className="field">
                <label htmlFor="sp-pw2">{t('Confirm password', 'ยืนยันรหัสผ่าน')}</label>
                <div className="input-icon">
                  <Lock size={16} aria-hidden />
                  <input
                    id="sp-pw2"
                    type={showPw ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={submitting} style={{ marginTop: 8 }}>
                {submitting ? t('Saving…', 'กำลังบันทึก…') : t('Save and sign in', 'บันทึกและเข้าสู่ระบบ')}
                <ArrowRight size={17} aria-hidden />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export function VerifyEmailPage() {
  return <SetPasswordForm purpose="activate" />;
}

export function ResetPasswordPage() {
  return <SetPasswordForm purpose="reset" />;
}
