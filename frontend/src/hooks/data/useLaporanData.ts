import { useState, useEffect } from 'react';
import { subMonths, format, startOfMonth, endOfMonth } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { supabase, type Transaction } from '@/lib/supabase';

export interface MonthlyPoint {
  month: string;
  income: number;
  expenses: number;
}

export interface CategoryTrendPoint {
  month: string;
  [category: string]: number | string;
}

export interface LaporanData {
  monthlyData: MonthlyPoint[];
  categoryTrend: CategoryTrendPoint[];
  topCategories: string[];
}

export function useLaporanData(userId: number | undefined) {
  const [data, setData] = useState<LaporanData>({
    monthlyData: [],
    categoryTrend: [],
    topCategories: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    async function loadTrends() {
      setIsLoading(true);
      setError(null);
      try {
        const now = new Date();
        const months6 = Array.from({ length: 6 }, (_, i) => subMonths(now, 5 - i));
        const months3 = months6.slice(3);

        const rangeStart = format(startOfMonth(months6[0]), 'yyyy-MM-dd');
        const rangeEnd = format(endOfMonth(months6[5]), 'yyyy-MM-dd');

        const { data: txAll, error: fetchError } = await supabase
          .from('transactions')
          .select('amount, type, category, date')
          .eq('user_id', userId)
          .gte('date', rangeStart)
          .lte('date', rangeEnd);

        if (fetchError) throw fetchError;

        const txList: Pick<Transaction, 'amount' | 'type' | 'category' | 'date'>[] = txAll ?? [];

        // Calculate monthly income/expense
        const monthlyData: MonthlyPoint[] = months6.map((d) => {
          const label = format(d, 'MMM', { locale: idLocale });
          const mStr = format(d, 'yyyy-MM');
          const relevant = txList.filter((t) => t.date.startsWith(mStr));
          const income = relevant
            .filter((t) => t.type === 'income')
            .reduce((s, t) => s + Number(t.amount), 0);
          const expenses = relevant
            .filter((t) => t.type === 'expense')
            .reduce((s, t) => s + Number(t.amount), 0);
          return { month: label, income, expenses };
        });

        // Calculate top 4 expense categories (3 months)
        const catTotals: Record<string, number> = {};
        months3.forEach((d) => {
          const mStr = format(d, 'yyyy-MM');
          txList
            .filter((t) => t.type === 'expense' && t.date.startsWith(mStr))
            .forEach((t) => {
              catTotals[t.category] = (catTotals[t.category] ?? 0) + Number(t.amount);
            });
        });
        const topCategories = Object.entries(catTotals)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 4)
          .map(([cat]) => cat);

        // Build category trend for 3 months
        const categoryTrend: CategoryTrendPoint[] = months3.map((d) => {
          const label = format(d, 'MMM', { locale: idLocale });
          const mStr = format(d, 'yyyy-MM');
          const row: CategoryTrendPoint = { month: label };
          topCategories.forEach((cat) => {
            row[cat] = txList
              .filter((t) => t.type === 'expense' && t.date.startsWith(mStr) && t.category === cat)
              .reduce((s, t) => s + Number(t.amount), 0);
          });
          return row;
        });

        setData({
          monthlyData,
          categoryTrend,
          topCategories,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load trends');
        setData({
          monthlyData: [],
          categoryTrend: [],
          topCategories: [],
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadTrends();
  }, [userId]);

  return { ...data, isLoading, error };
}
