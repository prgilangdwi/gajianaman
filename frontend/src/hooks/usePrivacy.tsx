import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface PrivacyContextValue {
  isHidden: boolean;
  toggle: () => void;
}

const PrivacyContext = createContext<PrivacyContextValue | null>(null);

const STORAGE_KEY = 'gajian_aman_privacy';

export function PrivacyProvider({ children }: { children: ReactNode }) {
  const [isHidden, setIsHidden] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(isHidden));
  }, [isHidden]);

  const toggle = () => setIsHidden((prev) => !prev);

  return (
    <PrivacyContext.Provider value={{ isHidden, toggle }}>
      {children}
    </PrivacyContext.Provider>
  );
}

export function usePrivacy() {
  const ctx = useContext(PrivacyContext);
  if (!ctx) throw new Error('usePrivacy must be used inside PrivacyProvider');
  return ctx;
}
