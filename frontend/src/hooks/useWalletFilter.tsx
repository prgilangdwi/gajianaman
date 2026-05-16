import { createContext, useContext, useState, type ReactNode } from 'react';

interface WalletFilterContextValue {
  walletId: 'all' | string;
  setWalletId: (id: 'all' | string) => void;
}

const WalletFilterContext = createContext<WalletFilterContextValue | null>(null);

export function WalletFilterProvider({ children }: { children: ReactNode }) {
  const [walletId, setWalletId] = useState<'all' | string>('all');

  return (
    <WalletFilterContext.Provider value={{ walletId, setWalletId }}>
      {children}
    </WalletFilterContext.Provider>
  );
}

export function useWalletFilter() {
  const ctx = useContext(WalletFilterContext);
  if (!ctx) throw new Error('useWalletFilter must be used inside WalletFilterProvider');
  return ctx;
}
