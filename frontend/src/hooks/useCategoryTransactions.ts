import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/lib/supabase';
import type { Transaction } from '@/lib/supabase';

interface CategoryTransactionStats {
  category: string;
  total: number;
  count: number;
  average: number;
  percentageOfTotal: number;
  transactions: Transaction[];
}

export function useCategoryTransactions(
  category: string,
  month: number,
  year: number,
  totalSpending: number
) {
  const { user } = useAuth();
  const [stats, setStats] = useState<CategoryTransactionStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !category) {
      setIsLoading(false);
      return;
    }

    const fetchCategoryTransactions = async () => {
      try {
        setIsLoading(true);
        const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
        const endDate = new Date(year, month, 0).toISOString().split('T')[0];

        const { data, error: fetchError } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user?.userId)
          .eq('category', category)
          .eq('type', 'expense')
          .gte('date', startDate)
          .lte('date', endDate)
          .order('date', { ascending: false });

        if (fetchError) throw fetchError;

        const transactions = data || [];
        const total = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
        const count = transactions.length;
        const average = count > 0 ? total / count : 0;
        const percentage = totalSpending > 0 ? (total / totalSpending) * 100 : 0;

        setStats({
          category,
          total,
          count,
          average,
          percentageOfTotal: percentage,
          transactions,
        });

        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch category transactions');
        setStats(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategoryTransactions();
  }, [user, category, month, year, totalSpending]);

  return { stats, isLoading, error };
}
