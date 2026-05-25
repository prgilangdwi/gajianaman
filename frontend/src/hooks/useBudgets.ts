import { useEffect, useState, useCallback } from 'react';
import { supabase, type Budget } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { type BudgetItem } from './useBudgetRecommendation';

export function useBudgets(month: number, year: number) {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    const { data } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', user.userId)
      .eq('month', month)
      .eq('year', year);
    setBudgets(data ?? []);
    setIsLoading(false);
  }, [user, month, year]);

  useEffect(() => { fetch(); }, [fetch]);

  return { budgets, isLoading, refetch: fetch };
}

export async function upsertBudget(
  userId: number,
  category: string,
  amount: number,
  month: number,
  year: number,
) {
  return supabase
    .from('budgets')
    .upsert({ user_id: userId, category, amount, month, year, period: 'monthly' }, {
      onConflict: 'user_id,category,month,year',
    });
}

export async function saveBudgets(userId: number, items: BudgetItem[]): Promise<void> {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const inserts = items.map((item) => ({
    user_id: userId,
    category: item.category,
    amount: item.amount,
    period: 'monthly' as const,
    month,
    year,
  }));

  const { error } = await supabase
    .from('budgets')
    .upsert(inserts, { onConflict: 'user_id,category,month,year' });

  if (error) throw new Error(error.message);
}

export async function setGajianSetupComplete(userId: number): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({ gajian_setup_complete: true })
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}
