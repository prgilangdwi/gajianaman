import { useEffect, useState, useCallback } from 'react';
import { supabase, type Budget } from '@/lib/supabase';
import { useAuth } from './useAuth';

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
