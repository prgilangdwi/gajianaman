import { useEffect, useState, useCallback } from 'react';
import { supabase, type Transaction } from '@/lib/supabase';
import { useAuth } from './useAuth';

export function useTransactions(monthArg?: number, yearArg?: number) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const now = new Date();
  const month = monthArg ?? now.getMonth() + 1;
  const year = yearArg ?? now.getFullYear();

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  const fetch = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    if (error) setError(error.message);
    else setTransactions(data ?? []);
    setIsLoading(false);
  }, [user, startDate, endDate]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const income = transactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + Number(t.amount), 0);
  const expenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + Number(t.amount), 0);

  return { transactions, income, expenses, isLoading, error, refetch: fetch };
}

export function useRecentTransactions(limit = 10) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.userId)
      .order('created_at', { ascending: false })
      .limit(limit)
      .then(({ data }: { data: Transaction[] | null }) => {
        setTransactions(data ?? []);
        setIsLoading(false);
      });
  }, [user, limit]);

  return { transactions, isLoading };
}
