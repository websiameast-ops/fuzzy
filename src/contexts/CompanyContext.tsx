import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Company } from '@/types';
import { getCompany, mockCompanies } from '@/data/mockCompanies';

interface CompanyCtx {
  companies: Company[];
  customerCode: string;
  company: Company;
  /** '' means all sites */
  siteId: string;
  setCompanyCode: (code: string) => void;
  setSiteId: (siteId: string) => void;
  companySelected: boolean;
  clearSelection: () => void;
}

const Ctx = createContext<CompanyCtx | null>(null);

// Persists which company the user picked at login, so a page refresh doesn't lose the
// selection and bounce RequireAuth back to /login even though the session is still valid.
const SELECTED_COMPANY_KEY = 'se_selected_company';

export function CompanyProvider({ children }: { children: ReactNode }) {
  const storedCode = localStorage.getItem(SELECTED_COMPANY_KEY);
  const [customerCode, setCustomerCode] = useState<string>(storedCode ?? 'CUS-00128');
  const [companySelected, setCompanySelected] = useState(Boolean(storedCode));
  const [siteId, setSiteId] = useState<string>('');

  const setCompanyCode = useCallback((code: string) => {
    localStorage.setItem(SELECTED_COMPANY_KEY, code);
    setCustomerCode(code);
    setCompanySelected(true);
    setSiteId('');
  }, []);

  const clearSelection = useCallback(() => {
    localStorage.removeItem(SELECTED_COMPANY_KEY);
    setCompanySelected(false);
  }, []);

  const value = useMemo(
    () => ({
      companies: mockCompanies,
      customerCode,
      company: getCompany(customerCode),
      siteId,
      setCompanyCode,
      setSiteId,
      companySelected,
      clearSelection,
    }),
    [customerCode, siteId, setCompanyCode, companySelected, clearSelection],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCompany(): CompanyCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCompany must be used within CompanyProvider');
  return ctx;
}
