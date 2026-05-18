import { useState, useEffect, useCallback } from 'react';
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
  canAccess: (feature: string) => boolean;
  getLimit: (feature: string) => number | boolean;
  confirmPayment: (plan: PlanName, period: string, paymentRef: string, priceInRp: number, expiresAt: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useSubscription(userId: number | undefined): SubscriptionState {
  const [plan, setPlan] = useState<PlanName>('gratis');
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('subscription_plan, subscription_expires_at')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data) {
        setPlan((data.subscription_plan as PlanName) ?? 'gratis');
        setExpiresAt(data.subscription_expires_at ?? null);
      }
    } catch (err) {
      console.error('Failed to fetch subscription:', err);
    }
    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [userId, refresh]);

  const confirmPayment = useCallback(
    async (
      newPlan: PlanName,
      period: string,
      paymentRef: string,
      priceInRp: number,
      newExpiresAt: string
    ) => {
      if (!userId) throw new Error('User not authenticated');

      const res = await fetch(
        `/api/subscription?action=confirm&userId=${userId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            plan: newPlan,
            period,
            paymentRef,
            priceInRp,
            expiresAt: newExpiresAt,
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Payment confirmation failed');
      }

      await refresh();
    },
    [userId, refresh]
  );

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

  return { plan, expiresAt, isLoading, canAccess, getLimit, confirmPayment, refresh };
}
