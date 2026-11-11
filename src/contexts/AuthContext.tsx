import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { apiCheckSession, apiGetProfile, apiLogin, apiLogout, apiRefreshToken, ApiError } from '@/lib/apiClient';
import type { TokenPair } from '@/lib/tokenStore';
import { decodeJwt } from '@/lib/jwt';
import { tokenStore } from '@/lib/tokenStore';

export interface SessionUser {
  id: string;
  email: string;
  role: string;
  /** Email-derived stand-in until GET /api/profile resolves, then the real name. */
  name: string;
  preName: string | null;
  customerName: string | null;
  customerCode: string | null;
  siteList: string | null;
  phone: string | null;
  department: string | null;
  accountExpiresAt: string | null;
}

interface AccessTokenClaims {
  sub: string;
  role: string;
  exp: number;
}

// Refresh this long before actual expiry so an in-flight request never races a token
// that's about to be rejected by the server.
const REFRESH_SKEW_MS = 60_000;

// How often to poll GET /portal/auth/session while logged in — catches a device
// going idle-timed-out (single-device login policy) or force-logged-out server-side
// without waiting for the next real API call or the ~30min scheduled token refresh.
const SESSION_POLL_MS = 25_000;

function toSessionUser(accessToken: string, email: string): SessionUser {
  const { sub, role } = decodeJwt<AccessTokenClaims>(accessToken);
  return {
    id: sub,
    role,
    email,
    name: email.split('@')[0],
    preName: null,
    customerName: null,
    customerCode: null,
    siteList: null,
    phone: null,
    department: null,
    accountExpiresAt: null,
  };
}

interface AuthCtx {
  user: SessionUser | null;
  /** True until the initial silent-refresh (session restore from storage) has settled.
   * Consumers like RequireAuth must wait for this before deciding to redirect to /login,
   * otherwise a page refresh always bounces to login even with a valid stored session. */
  initializing: boolean;
  /** True while the real GET /api/profile fetch is in flight (initial load, login, or
   * after a silent token refresh). Consumers should show a loading state instead of
   * falling back to placeholder/mock data while this is true. */
  profileLoading: boolean;
  /** `status` mirrors ApiError.status so LoginPage can tell "wrong credentials" (401)
   * apart from "never reached the server" (0, network/CORS failure) apart from
   * "already signed in on another device" (409, single-device login policy) apart
   * from everything else — collapsing these into one message previously made a
   * broken connection look identical to a typo'd password. `code` mirrors
   * ApiError.code (e.g. "CONFLICT") so a 409 can be narrowed further if another
   * code is ever mapped to that same status. */
  login: (
    email: string,
    password: string,
    remember?: boolean,
  ) => Promise<{ ok: boolean; error?: string; status?: number; code?: string }>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const refreshTimer = useRef<number | undefined>(undefined);

  // Fetches the real profile in the background and merges it into the already-set
  // stand-in user. Guards against a slow response landing after logout/re-login by
  // checking the token that fetched it is still the active one before applying it.
  const applyProfile = useCallback((accessToken: string) => {
    setProfileLoading(true);
    apiGetProfile(accessToken)
      .then((p) => {
        setUser((current) =>
          current && tokenStore.read()?.accessToken === accessToken
            ? {
                ...current,
                name: p.name,
                preName: p.preName,
                customerName: p.customerName,
                customerCode: p.customerCode,
                siteList: p.siteList,
                phone: p.phone,
                department: p.department,
                accountExpiresAt: p.accountExpiresAt,
              }
            : current,
        );
      })
      .catch(() => {})
      .finally(() => setProfileLoading(false));
  }, []);

  const scheduleRefresh = useCallback((tokens: TokenPair, email: string) => {
    window.clearTimeout(refreshTimer.current);
    const { exp } = decodeJwt<{ exp: number }>(tokens.accessToken);
    const delay = Math.max(exp * 1000 - Date.now() - REFRESH_SKEW_MS, 0);
    refreshTimer.current = window.setTimeout(async () => {
      try {
        const next = await apiRefreshToken(tokens.refreshToken);
        tokenStore.update(next);
        setUser(toSessionUser(next.accessToken, email));
        applyProfile(next.accessToken);
        scheduleRefresh(next, email);
      } catch {
        tokenStore.clear();
        setUser(null);
      }
    }, delay);
  }, [applyProfile]);

  // On load, restore the session from whatever is in storage. If the stored access
  // token is still valid, use it immediately — no network round trip, so a page
  // refresh never bounces to /login while waiting on (or because of a hiccup in)
  // the server. Only hit the refresh endpoint when the access token has actually
  // gone stale, and only clear the session if that call comes back rejected.
  useEffect(() => {
    const saved = tokenStore.read();
    if (!saved) {
      setInitializing(false);
      setProfileLoading(false);
      return;
    }
    const { exp } = decodeJwt<{ exp: number }>(saved.accessToken);
    if (exp * 1000 - REFRESH_SKEW_MS > Date.now()) {
      setUser(toSessionUser(saved.accessToken, saved.email));
      applyProfile(saved.accessToken);
      scheduleRefresh(saved, saved.email);
      setInitializing(false);
      return () => window.clearTimeout(refreshTimer.current);
    }
    apiRefreshToken(saved.refreshToken)
      .then((tokens) => {
        tokenStore.update(tokens);
        setUser(toSessionUser(tokens.accessToken, saved.email));
        applyProfile(tokens.accessToken);
        scheduleRefresh(tokens, saved.email);
      })
      .catch(() => tokenStore.clear())
      .finally(() => setInitializing(false));
    return () => window.clearTimeout(refreshTimer.current);
  }, [scheduleRefresh, applyProfile]);

  // Background poll while logged in: GET /portal/auth/session fails with 401 once
  // this device's session is revoked (idle-timed-out, or force-logged-out). On 401,
  // try one silent refresh first — a merely-stale-but-unexpired access
  // token also 401s here and should just get refreshed, not treated as a real kick.
  // Only clear the session if the refresh (which re-validates the session) also fails.
  useEffect(() => {
    if (!user) return;
    const interval = window.setInterval(async () => {
      const saved = tokenStore.read();
      if (!saved) return;
      try {
        await apiCheckSession(saved.accessToken);
      } catch (err) {
        if (!(err instanceof ApiError) || err.status !== 401) return;
        try {
          const tokens = await apiRefreshToken(saved.refreshToken);
          tokenStore.update(tokens);
          setUser(toSessionUser(tokens.accessToken, saved.email));
          applyProfile(tokens.accessToken);
          scheduleRefresh(tokens, saved.email);
        } catch {
          window.clearTimeout(refreshTimer.current);
          tokenStore.clear();
          setUser(null);
        }
      }
    }, SESSION_POLL_MS);
    return () => window.clearInterval(interval);
  }, [user, applyProfile, scheduleRefresh]);

  const login = useCallback(
    async (email: string, password: string, remember = true) => {
      try {
        const tokens = await apiLogin(email, password);
        tokenStore.save(tokens, email, remember);
        setUser(toSessionUser(tokens.accessToken, email));
        applyProfile(tokens.accessToken);
        scheduleRefresh(tokens, email);
        return { ok: true };
      } catch (err) {
        return {
          ok: false,
          error: err instanceof ApiError ? err.message : 'invalid',
          status: err instanceof ApiError ? err.status : undefined,
          code: err instanceof ApiError ? err.code : undefined,
        };
      }
    },
    [scheduleRefresh, applyProfile],
  );

  const logout = useCallback(() => {
    window.clearTimeout(refreshTimer.current);
    const saved = tokenStore.read();
    if (saved) apiLogout(saved.accessToken).catch(() => {});
    tokenStore.clear();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, initializing, profileLoading, login, logout }),
    [user, initializing, profileLoading, login, logout],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
