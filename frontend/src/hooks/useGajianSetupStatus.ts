import { useMemo } from 'react';
import { useAuth } from './useAuth';

export interface GajianSetupStatus {
  isSetupComplete: boolean;
  missingFields: string[];
  setupPercentage: number;
}

export function useGajianSetupStatus(): GajianSetupStatus {
  const { user } = useAuth();

  return useMemo(() => {
    const missing: string[] = [];

    if (!user?.payday_date) {
      missing.push('Payday date');
    }

    if (!user?.gajian_wallet_id) {
      missing.push('Gajian wallet');
    }

    if (!user?.gajian_salary) {
      missing.push('Salary amount');
    }

    const setupPercentage = Math.round(((3 - missing.length) / 3) * 100);

    return {
      isSetupComplete: missing.length === 0,
      missingFields: missing,
      setupPercentage,
    };
  }, [user?.payday_date, user?.gajian_wallet_id, user?.gajian_salary]);
}
