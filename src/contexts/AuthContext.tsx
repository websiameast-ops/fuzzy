import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

export interface SessionUser {
  name: string;
  email: string;
  phone: string;
  jobTitle: string;
  /** customer codes this login can access */
  companyCodes: string[];
}

const DEMO_USER: SessionUser = {
  name: 'Raiwin Nathathai',
  email: 'raiwin.nat@siameastsolutions.com',
  phone: '063-3935090',
  jobTitle: 'Maintenance Engineer',
  companyCodes: ['210WWCUTIX', 'CUS-00128', 'CUS-00241'],
};

interface AuthCtx {
  user: SessionUser | null;
  login: (email: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(() => {
    try {
      const saved = localStorage.getItem('se_user_session');
      return saved ? JSON.parse(saved) : DEMO_USER;
    } catch {
      return DEMO_USER;
    }
  });

  const login = useCallback((email: string, password: string) => {
    const e = email.trim().toLowerCase();
    if (
      (e === 'raiwin.nat@siameastsolutions.com' || e === 'demo@seconnex.co.th') &&
      (password === 'demo123' || password.length >= 4)
    ) {
      setUser(DEMO_USER);
      try {
        localStorage.setItem('se_user_session', JSON.stringify(DEMO_USER));
      } catch {
        // ignore storage quota errors if any
      }
      return { ok: true };
    }
    return { ok: false, error: 'invalid' };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    try {
      localStorage.removeItem('se_user_session');
    } catch {
      // ignore
    }
  }, []);

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
