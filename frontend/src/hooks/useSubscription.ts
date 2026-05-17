import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// Mirror of Python PLAN_FEATURES — keep in sync with services/subscription.py
const PLAN_FEATURES: Record<string, Record<string, boolean | number>> = {
  gratis: {
    max_wallets: 0,
    split_bill_monthly: 0,
    ai_features: false,
    download_csv: false,
    budget_categories: 3,
    calendar: false,
  },
  starter: {
    max_wallets: 3,
    split_bill_monthly: 5,
    ai_features: true,
    download_csv: true,
    budget_categories: -1,
    calendar: true,
  },
  pro: {
    max_wallets: -1,
    split_bill_monthly: -1,
    ai_features: true,
    download_csv: true,
    budget_categories: -1,
    calendar: true,
  },
};

// Set to false when Midtrans is live and real gating should activate
const MVP_OVERRIDE = true;

export type PlanName = 'gratis' | 'starter' | 'pro';

export interface SubscriptionState {
  plan: PlanName;
  expiresAt: string | null;
  isLoading: boolean;
  /** Returns true if user can access this feature (always true while MVP_OVERRIDE) */
  canAccess: (feature: string) => boolean;
  /** Returns raw limit: -1 = unlimited, 0 = blocked, N = capped */
  getLimit: (feature: string) => number | boolean;
}

export function useSubscription(userId: number | undefined): SubscriptionState {
  const [plan, setPlan] = useState<PlanName>('gratis');
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setIsLoading(false); return; }
    supabase
      .from('users')
      .select('subscription_plan, subscription_expires_at')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setPlan((data.subscription_plan as PlanName) ?? 'gratis');
          setExpiresAt(data.subscription_expires_at ?? null);
        }
        setIsLoading(false);
      });
  }, [userId]);

  const canAccess = (feature: string): boolean => {
    if (MVP_OVERRIDE) return true;
    const features = PLAN_FEATURES[plan] ?? PLAN_FEATURES.gratis;
    const val = features[feature];
    if (typeof val === 'boolean') return val;
    if (typeof val === 'number') return val !== 0;
    return false;
  };

  const getLimit = (feature: string): number | boolean => {
    const features = PLAN_FEATURES[plan] ?? PLAN_FEATURES.gratis;
    return features[feature] ?? false;
  };

  return { plan, expiresAt, isLoading, canAccess, getLimit };
}
