import React, { createContext, useContext } from 'react';
import { useLicense } from '@/hooks/useLicense';

type LicenseContextType = ReturnType<typeof useLicense>;

const LicenseContext = createContext<LicenseContextType | null>(null);

export const LicenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const license = useLicense();
  return <LicenseContext.Provider value={license}>{children}</LicenseContext.Provider>;
};

export function useLicenseContext(): LicenseContextType {
  const ctx = useContext(LicenseContext);
  if (!ctx) throw new Error('useLicenseContext must be used inside LicenseProvider');
  return ctx;
}
