import { useMemo } from 'react';
import type { Transaction, Budget } from '@/lib/supabase';

export interface HealthMetrics {
  score: number; // 0-100
  scoreGrade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  budgetAdherence: number; // % of budgets met
  savingsRate: number; // % of income saved
  spendingConsistency: number; // 0-100, higher = more consistent
  goalProgress: number; // % toward goals
  anomalyCount: number;
  overBudgetCategories: string[];
  underBudgetCategories: string[];
  insights: string[];
}

export function useFinancialHealth(
  transactions: Transaction[],
  budgets: Budget[],
  month: number,
  year: number,
): HealthMetrics {
  return useMemo(() => {
    // Get current month transactions
    const currentMonthTxs = transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() === month - 1 && d.getFullYear() === year;
    });

    const expenses = currentMonthTxs.filter((t) => t.type === 'expense');
    const income = currentMonthTxs
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpense = expenses.reduce((sum, t) => sum + Number(t.amount), 0);

    // Get last 3 months for consistency analysis
    const pastMonthsData: number[][] = [[], [], []];
    for (let i = 0; i < 3; i++) {
      const m = (month - i - 1 + 12) % 12 + 1;
      const y = year - (month - i - 1 < 0 ? 1 : 0);

      const monthTxs = transactions.filter((t) => {
        const d = new Date(t.date);
        return d.getMonth() === m - 1 && d.getFullYear() === y && t.type === 'expense';
      });

      pastMonthsData[i] = [monthTxs.reduce((sum, t) => sum + Number(t.amount), 0)];
    }

    // Calculate spending consistency (coefficient of variation)
    const allExpenses = pastMonthsData.flat();
    const avgExpense = allExpenses.reduce((a, b) => a + b, 0) / allExpenses.length;
    const variance =
      allExpenses.reduce((sum, v) => sum + Math.pow(v - avgExpense, 2), 0) / allExpenses.length;
    const stdDev = Math.sqrt(variance);
    const cv = avgExpense > 0 ? stdDev / avgExpense : 0;
    const spendingConsistency = Math.max(0, Math.min(100, 100 - cv * 100));

    // Calculate budget adherence
    let budgetsMet = 0;
    let totalBudgets = 0;
    const overBudgetCats: string[] = [];
    const underBudgetCats: string[] = [];

    budgets
      .filter((b) => b.month === month && b.year === year)
      .forEach((budget) => {
        totalBudgets++;
        const categorySpent = expenses
          .filter((t) => t.category === budget.category)
          .reduce((sum, t) => sum + Number(t.amount), 0);

        if (categorySpent <= budget.amount) {
          budgetsMet++;
          underBudgetCats.push(budget.category);
        } else {
          overBudgetCats.push(budget.category);
        }
      });

    const budgetAdherence = totalBudgets > 0 ? (budgetsMet / totalBudgets) * 100 : 50;

    // Calculate savings rate
    const savingsRate = income > 0 ? Math.max(0, ((income - totalExpense) / income) * 100) : 0;

    // Count anomalies (spending 30%+ above average for category)
    let anomalyCount = 0;
    const categoryMonthlyAvg: Record<string, number> = {};

    for (let i = 1; i < 3; i++) {
      transactions
        .filter((t) => {
          const d = new Date(t.date);
          const m = (month - i - 1 + 12) % 12 + 1;
          const y = year - (month - i - 1 < 0 ? 1 : 0);
          return d.getMonth() === m - 1 && d.getFullYear() === y && t.type === 'expense';
        })
        .forEach((t) => {
          const cat = t.category || 'Other';
          if (!categoryMonthlyAvg[cat]) {
            categoryMonthlyAvg[cat] = 0;
          }
          categoryMonthlyAvg[cat] += Number(t.amount);
        });
    }

    expenses.forEach((t) => {
      const cat = t.category || 'Other';
      const avg = (categoryMonthlyAvg[cat] || 0) / 2;
      if (avg > 0 && Number(t.amount) > avg * 1.3) {
        anomalyCount++;
      }
    });

    // Generate insights
    const insights: string[] = [];

    if (budgetAdherence >= 80) {
      insights.push('✅ Anda sangat disiplin dalam mengikuti budget');
    } else if (budgetAdherence >= 60) {
      insights.push('⚠️ Beberapa kategori melebihi budget');
    } else {
      insights.push('🔴 Banyak kategori yang melebihi budget');
    }

    if (savingsRate >= 20) {
      insights.push('🎉 Excellent savings rate! Terus pertahankan');
    } else if (savingsRate >= 10) {
      insights.push('💪 Good savings habit berkembang');
    } else if (savingsRate < 0) {
      insights.push('⚠️ Pengeluaran melebihi pemasukan');
    }

    if (spendingConsistency >= 80) {
      insights.push('📊 Pola pengeluaran sangat konsisten');
    } else if (spendingConsistency < 50) {
      insights.push('📈 Pengeluaran berfluktuasi banyak - stabilkan');
    }

    if (anomalyCount === 0) {
      insights.push('✅ Tidak ada pengeluaran anomali terdeteksi');
    } else if (anomalyCount > 3) {
      insights.push('⚠️ Beberapa pengeluaran luar biasa - cek smart alerts');
    }

    // Calculate overall score
    let score = 50; // Start at baseline
    score += (budgetAdherence / 100) * 20; // 20 points for budget
    score += Math.min((savingsRate / 30) * 20, 20); // 20 points for savings
    score += (spendingConsistency / 100) * 15; // 15 points for consistency
    score += Math.max(0, (100 - anomalyCount * 5) / 100) * 15; // 15 points for no anomalies
    score = Math.round(Math.min(100, score));

    // Determine grade
    let scoreGrade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' = 'F';
    if (score >= 95) scoreGrade = 'A+';
    else if (score >= 85) scoreGrade = 'A';
    else if (score >= 75) scoreGrade = 'B';
    else if (score >= 65) scoreGrade = 'C';
    else if (score >= 50) scoreGrade = 'D';

    return {
      score,
      scoreGrade,
      budgetAdherence: Math.round(budgetAdherence),
      savingsRate: Math.round(savingsRate),
      spendingConsistency: Math.round(spendingConsistency),
      goalProgress: 0, // Placeholder for goal progress
      anomalyCount,
      overBudgetCategories: overBudgetCats,
      underBudgetCategories: underBudgetCats,
      insights,
    };
  }, [transactions, budgets, month, year]);
}
