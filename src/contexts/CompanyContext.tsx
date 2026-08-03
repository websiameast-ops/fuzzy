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

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [customerCode, setCustomerCode] = useState<string>('CUS-00128');
  const [companySelected, setCompanySelected] = useState(false);
  const [siteId, setSiteId] = useState<string>('');

  const setCompanyCode = useCallback((code: string) => {
    setCustomerCode(code);
    setCompanySelected(true);
    setSiteId('');
  }, []);

  const clearSelection = useCallback(() => setCompanySelected(false), []);

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
