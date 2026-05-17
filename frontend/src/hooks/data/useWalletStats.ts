import { useMemo } from 'react';
import type { Transaction } from '@/lib/supabase';
import { getCategoryMeta } from '@/lib/categoryMetadata';

export interface CategoryStat {
  name: string;
  spent: number;
  emoji: string;
  color: string;
}

export interface WalletStatsResult {
  totalExpenses: number;
  totalIncome: number;
  categoryData: CategoryStat[];
  maxSpent: number;
}

export function useWalletStats(transactions: Transaction[]): WalletStatsResult {
  return useMemo(() => {
    // Calculate totals by type
    const totalExpenses = transactions
      .filter((t) => t.type === 'expense')
      .reduce((s, t) => s + Number(t.amount), 0);

    const totalIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((s, t) => s + Number(t.amount), 0);

    // Aggregate expenses by category
    const categoryMap: Record<string, number> = {};
    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        categoryMap[t.category] = (categoryMap[t.category] ?? 0) + Number(t.amount);
      });

    // Build category stats array
    const categoryData = Object.entries(categoryMap)
      .map(([name, spent]) => ({
        name,
        spent,
        ...getCategoryMeta(name),
      }))
      .sort((a, b) => b.spent - a.spent);

    const maxSpent = categoryData[0]?.spent ?? 1;

    return {
      totalExpenses,
      totalIncome,
      categoryData,
      maxSpent,
    };
  }, [transactions]);
}
