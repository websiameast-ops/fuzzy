import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeCtx {
  theme: Theme;
  toggleTheme: () => void;
}

const Ctx = createContext<ThemeCtx | null>(null);

function initialTheme(): Theme {
  try {
    const saved = window.localStorage.getItem('se-theme');
    if (saved === 'dark' || saved === 'light') return saved;
    if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'dark';
  } catch {
    /* storage unavailable — fall through */
  }
  return 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(initialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      window.localStorage.setItem('se-theme', theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const toggleTheme = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), []);
  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme(): ThemeCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
