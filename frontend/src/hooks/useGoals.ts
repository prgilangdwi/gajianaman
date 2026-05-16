import { useEffect, useState, useCallback } from 'react';
import { supabase, type Goal } from '@/lib/supabase';
import { useAuth } from './useAuth';

export function useGoals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    const { data } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.userId)
      .order('created_at', { ascending: false });
    setGoals(data ?? []);
    setIsLoading(false);
  }, [user]);

  useEffect(() => { fetch(); }, [fetch]);

  return { goals, isLoading, refetch: fetch };
}

export async function addGoal(
  userId: number,
  name: string,
  targetAmount: number,
  deadline?: string,
) {
  return supabase.from('goals').insert({
    user_id: userId,
    name,
    target_amount: targetAmount,
    saved_amount: 0,
    deadline: deadline || null,
  });
}

export async function updateGoalSaved(goalId: number, savedAmount: number) {
  return supabase.from('goals').update({ saved_amount: savedAmount }).eq('id', goalId);
}
