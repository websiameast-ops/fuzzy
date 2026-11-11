/** Persists the access/refresh token pair for the session. "Remember me" picks
 * localStorage (survives browser restarts) vs sessionStorage (cleared on tab close).
 * The backend has no /users/me endpoint yet, so the email is stored alongside the
 * tokens purely for display — it's never sent back except at login. */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

const ACCESS_KEY = 'se_access_token';
const REFRESH_KEY = 'se_refresh_token';
const EMAIL_KEY = 'se_auth_email';

function activeStorage(): Storage {
  return localStorage.getItem(REFRESH_KEY) ? localStorage : sessionStorage;
}

export const tokenStore = {
  save(tokens: TokenPair, email: string, remember: boolean): void {
    tokenStore.clear();
    const store = remember ? localStorage : sessionStorage;
    store.setItem(ACCESS_KEY, tokens.accessToken);
    store.setItem(REFRESH_KEY, tokens.refreshToken);
    store.setItem(EMAIL_KEY, email);
  },

  /** Rewrite the rotated pair into whichever storage currently holds the session. */
  update(tokens: TokenPair): void {
    const store = activeStorage();
    store.setItem(ACCESS_KEY, tokens.accessToken);
    store.setItem(REFRESH_KEY, tokens.refreshToken);
  },

  read(): (TokenPair & { email: string }) | null {
    const store = activeStorage();
    const accessToken = store.getItem(ACCESS_KEY);
    const refreshToken = store.getItem(REFRESH_KEY);
    const email = store.getItem(EMAIL_KEY);
    if (!accessToken || !refreshToken || !email) return null;
    return { accessToken, refreshToken, email };
  },

  clear(): void {
    for (const store of [localStorage, sessionStorage]) {
      store.removeItem(ACCESS_KEY);
      store.removeItem(REFRESH_KEY);
      store.removeItem(EMAIL_KEY);
    }
  },
};
