import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Lang } from '@/types';

interface LanguageCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  /** Returns the string for the current language: t('English', 'ไทย') */
  t: (en: string, th: string) => string;
}

const Ctx = createContext<LanguageCtx | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('en');
  const t = useCallback((en: string, th: string) => (lang === 'th' ? th : en), [lang]);
  const value = useMemo(() => ({ lang, setLang, t }), [lang, t]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLang(): LanguageCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useLang must be used within LanguageProvider');
  return ctx;
}
