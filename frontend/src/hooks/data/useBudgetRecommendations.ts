import { useMemo } from 'react';
import type { Transaction, Budget } from '@/lib/supabase';

export interface BudgetRecommendation {
  category: string;
  currentBudget: number | null;
  suggestedBudget: number;
  avgSpending: number;
  variance: number;
  reason: string;
  impact: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  isIncrease: boolean;
}

export function useBudgetRecommendations(
  transactions: Transaction[],
  budgets: Budget[],
  month: number,
  year: number,
): BudgetRecommendation[] {
  return useMemo(() => {
    // Get last 3 months of expense data
    const categorySpending: Record<string, number[]> = {};

    for (let i = 0; i < 3; i++) {
      const m = (month - i - 1 + 12) % 12 + 1;
      const y = year - (month - i - 1 < 0 ? 1 : 0);

      transactions
        .filter((t) => {
          const d = new Date(t.date);
          return d.getMonth() === m - 1 && d.getFullYear() === y && t.type === 'expense';
        })
        .forEach((t) => {
          if (!categorySpending[t.category]) {
            categorySpending[t.category] = [0, 0, 0];
          }
          categorySpending[t.category][i] += Number(t.amount);
        });
    }

    const recommendations: BudgetRecommendation[] = [];

    Object.entries(categorySpending).forEach(([category, monthlySpends]) => {
      const [current, prev1, prev2] = monthlySpends;
      const validMonths = [current, prev1, prev2].filter((m) => m > 0);

      if (validMonths.length === 0) return;

      const avgSpending = validMonths.reduce((a, b) => a + b, 0) / validMonths.length;
      const currentBudget = budgets.find(
        (b) => b.category === category && b.month === month && b.year === year,
      );

      const budgetAmount = currentBudget?.amount ?? null;

      // Calculate variance
      let variance = 0;
      if (budgetAmount) {
        variance = ((current - budgetAmount) / budgetAmount) * 100;
      } else {
        // Compare to average
        variance = ((current - avgSpending) / avgSpending) * 100;
      }

      // Determine recommendation
      const isOverspending = current > avgSpending * 1.15;
      const isUnderbudgeted = budgetAmount && current > budgetAmount;
      const hasRoom = budgetAmount && current < budgetAmount * 0.7;

      let recommendation: BudgetRecommendation | null = null;

      if (isOverspending && isUnderbudgeted) {
        // Category spending increased AND exceeds budget
        const suggestedBudget = Math.round(avgSpending * 1.2); // 20% buffer
        recommendation = {
          category,
          currentBudget: budgetAmount,
          suggestedBudget,
          avgSpending: Math.round(avgSpending),
          variance: Math.round(variance),
          reason: `Pengeluaran ${category} naik ${Math.round(variance)}% dari rata-rata dan melebihi budget`,
          impact: `Akan mengurangi budget overrun sebesar Rp${Math.round(budgetAmount - suggestedBudget).toLocaleString('id-ID')}`,
          priority: variance > 30 ? 'critical' : 'high',
          isIncrease: true,
        };
      } else if (!budgetAmount && avgSpending > 0) {
        // No budget set but has spending pattern
        const suggestedBudget = Math.round(avgSpending * 1.15);
        recommendation = {
          category,
          currentBudget: null,
          suggestedBudget,
          avgSpending: Math.round(avgSpending),
          variance: 0,
          reason: `Belum ada budget untuk ${category}, rata-rata pengeluaran Rp${Math.round(avgSpending).toLocaleString('id-ID')}/bulan`,
          impact: `Akan membantu melacak dan mengontrol pengeluaran di kategori ini`,
          priority: 'medium',
          isIncrease: true,
        };
      } else if (hasRoom && budgetAmount) {
        // Budget has significant room
        const suggestedBudget = Math.round(avgSpending * 1.1);
        const savings = budgetAmount - suggestedBudget;
        recommendation = {
          category,
          currentBudget: budgetAmount,
          suggestedBudget,
          avgSpending: Math.round(avgSpending),
          variance: Math.round(variance),
          reason: `Budget ${category} lebih tinggi dari pengeluaran rata-rata`,
          impact: `Dapat mengalokasikan Rp${Math.round(savings).toLocaleString('id-ID')} ke kategori lain`,
          priority: 'low',
          isIncrease: false,
        };
      }

      if (recommendation) {
        recommendations.push(recommendation);
      }
    });

    // Sort by priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  }, [transactions, budgets, month, year]);
}
