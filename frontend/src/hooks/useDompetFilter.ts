import { useEffect, useState } from 'react';

const DOMPET_KEY = 'gajian_aman_dompet';

export function useDompetFilter() {
  const [selectedDompet, setSelectedDompetState] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Initialize dompet preference on mount
  useEffect(() => {
    const stored = localStorage.getItem(DOMPET_KEY);
    const parsed = stored ? JSON.parse(stored) : null;
    setSelectedDompetState(parsed);
    setMounted(true);
  }, []);

  const setDompet = (walletId: string | null) => {
    setSelectedDompetState(walletId);
    if (walletId === null) {
      localStorage.removeItem(DOMPET_KEY);
    } else {
      localStorage.setItem(DOMPET_KEY, JSON.stringify(walletId));
    }
  };

  return {
    selectedDompet,
    setDompet,
    mounted,
    clearDompet: () => setDompet(null),
  };
}
