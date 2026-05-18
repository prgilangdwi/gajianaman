import { useMemo } from 'react';
import type { Transaction, Budget } from '@/lib/supabase';

export interface HealthScore {
  score: number;
  level: 'excellent' | 'good' | 'fair' | 'needs-work';
  breakdown: {
    savingsRatio: number;
    budgetDiscipline: number;
    emergencyRunway: number;
    debtRatio: number;
    cashflowConsistency: number;
  };
}

export function useFinancialHealthScore(
  transactions: Transaction[],
  budgets: Budget[],
  month: number,
  year: number
) {
  return useMemo(() => {
    const income = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expenses = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // 1. Savings Ratio (30%) - (Income - Expenses) / Income
    const savingsRatio = income > 0 ? Math.max(0, (income - expenses) / income) : 0;
    const savingsScore = Math.min(100, savingsRatio * 100);

    // 2. Budget Discipline (25%) - Average budget adherence across categories
    let budgetDisciplineScore = 100;
    if (budgets.length > 0) {
      const adherenceRates = budgets.map((budget) => {
        const spent = transactions
          .filter((t) => t.type === 'expense' && t.category === budget.category)
          .reduce((sum, t) => sum + Number(t.amount), 0);

        if (spent > budget.amount) {
          return Math.max(0, 100 - ((spent - budget.amount) / budget.amount) * 50);
        }
        return 100;
      });

      budgetDisciplineScore = adherenceRates.reduce((a, b) => a + b, 0) / adherenceRates.length;
    }

    // 3. Emergency Runway (20%) - Months of emergency fund
    const savingsTransactions = transactions.filter(
      (t) => t.type === 'income' && t.category === 'Savings'
    );
    const totalSavings = savingsTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const avgDailyExpense = expenses > 0 ? expenses / 30 : 0;
    const emergencyRunway = avgDailyExpense > 0 ? totalSavings / avgDailyExpense : 0;
    const emergencyScore = Math.min(100, (emergencyRunway / 90) * 100); // 3 months = max score

    // 4. Debt Ratio (15%) - Assume no debt data, default to 100
    const debtScore = 100;

    // 5. Cashflow Consistency (10%) - Low variance in daily spending
    const dailySpending: Record<string, number> = {};
    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        dailySpending[t.date] = (dailySpending[t.date] || 0) + Number(t.amount);
      });

    const spendingValues = Object.values(dailySpending);
    let consistencyScore = 100;
    if (spendingValues.length > 1) {
      const mean = spendingValues.reduce((a, b) => a + b) / spendingValues.length;
      const variance = spendingValues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / spendingValues.length;
      const stdDev = Math.sqrt(variance);
      const coefficientOfVariation = mean > 0 ? stdDev / mean : 0;
      // Lower CV = more consistent (closer to 100)
      consistencyScore = Math.max(0, 100 - coefficientOfVariation * 50);
    }

    // Weighted score
    const totalScore =
      (savingsScore * 0.3 +
        budgetDisciplineScore * 0.25 +
        emergencyScore * 0.2 +
        debtScore * 0.15 +
        consistencyScore * 0.1) /
      1;

    // Determine level
    let level: 'excellent' | 'good' | 'fair' | 'needs-work';
    if (totalScore >= 80) level = 'excellent';
    else if (totalScore >= 60) level = 'good';
    else if (totalScore >= 40) level = 'fair';
    else level = 'needs-work';

    return {
      score: Math.round(totalScore),
      level,
      breakdown: {
        savingsRatio: Math.round(savingsScore),
        budgetDiscipline: Math.round(budgetDisciplineScore),
        emergencyRunway: Math.round(emergencyScore),
        debtRatio: Math.round(debtScore),
        cashflowConsistency: Math.round(consistencyScore),
      },
    };
  }, [transactions, budgets, month, year]);
}
