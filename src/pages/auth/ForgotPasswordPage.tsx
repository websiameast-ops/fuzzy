import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Moon, Sun } from 'lucide-react';
import { Logo, LanguageSelector } from '@/components/common';
import { useLang } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { apiForgotPassword } from '@/lib/apiClient';

/** Replaces the old demo toast behind LoginPage's "Forgot password?" button —
 * real self-service reset, wired to POST /portal/auth/forgot-password. */
export function ForgotPasswordPage() {
  const { t } = useLang();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    try {
      await apiForgotPassword(email);
    } finally {
      setSubmitting(false);
      // Enumeration-safe backend response — the same generic confirmation is
      // shown whether or not the email belongs to an account.
      setSent(true);
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

        <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate('/login')} style={{ marginBottom: 8, marginLeft: -8 }}>
          <ArrowLeft size={16} aria-hidden />
          {t('Back to sign in', 'กลับไปหน้าเข้าสู่ระบบ')}
        </button>

        <h2 style={{ margin: '0 0 6px' }}>{t('Forgot your password?', 'ลืมรหัสผ่าน?')}</h2>

        {sent ? (
          <div className="alert-item a-blue" role="status">
            <span>
              {t(
                'If that email is registered, a reset link is on its way — check your inbox.',
                'หากอีเมลนี้อยู่ในระบบ ลิงก์รีเซ็ตรหัสผ่านกำลังถูกส่งไปให้ — กรุณาตรวจสอบอีเมลของคุณ',
              )}
            </span>
          </div>
        ) : (
          <>
            <p className="muted" style={{ margin: '0 0 20px' }}>
              {t('Enter your account email and we’ll send you a reset link.', 'กรอกอีเมลของบัญชีคุณ แล้วเราจะส่งลิงก์รีเซ็ตรหัสผ่านให้')}
            </p>
            <form onSubmit={submit} noValidate>
              <div className="field">
                <label htmlFor="fp-email">{t('Email', 'อีเมล')}</label>
                <div className="input-icon">
                  <Mail size={16} aria-hidden />
                  <input
                    id="fp-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.co.th"
                    autoComplete="email"
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={submitting}>
                {submitting ? t('Sending…', 'กำลังส่ง…') : t('Send reset link', 'ส่งลิงก์รีเซ็ตรหัสผ่าน')}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
