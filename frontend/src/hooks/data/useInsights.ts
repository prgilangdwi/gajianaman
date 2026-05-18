import { useMemo } from 'react';
import type { Transaction, Budget } from '@/lib/supabase';

export interface SpendingPattern {
  category: string;
  avgMonthly: number;
  lastMonth: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
}

export interface BudgetRecommendation {
  category: string;
  recommendedAmount: number;
  avgSpending: number;
  daysOfHistory: number;
  confidence: 'high' | 'medium' | 'low';
  transactionCount: number;
}

export interface SpendingForecast {
  projectedMonthEnd: number;
  currentSpent: number;
  daysElapsed: number;
  daysRemaining: number;
  dailyAverage: number;
}

export interface BudgetVelocity {
  category: string;
  monthlyBudget: number;
  currentSpent: number;
  percentUsed: number;
  daysRemaining: number;
  projectedETA: number;
  riskLevel: 'critical' | 'warning' | 'safe';
}

export interface AnomalyScore {
  category: string;
  currentSpent: number;
  expectedSpend: number;
  deviation: number;
  deviationPercent: number;
  severity: 'critical' | 'warning' | 'none';
  reason: string;
}

export interface InsightsData {
  patterns: SpendingPattern[];
  budgetRecommendations: BudgetRecommendation[];
  forecast: SpendingForecast;
  velocities: BudgetVelocity[];
  anomalies: AnomalyScore[];
  hasEnoughData: boolean;
}

export function useInsights(
  transactions: Transaction[],
  currentMonth: number,
  currentYear: number,
): InsightsData {
  return useMemo(() => {
    const now = new Date();
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const dayOfMonth = now.getDate();

    // ─── Spending Patterns: Compare last 3 months ────────────────────────────
    const patterns: SpendingPattern[] = [];
    const categorySpending: Record<string, number[]> = {};

    // Collect spending for last 3 months
    for (let i = 0; i < 3; i++) {
      const m = (currentMonth - i - 1 + 12) % 12;
      const y = currentYear - (currentMonth - i - 1 < 0 ? 1 : 0);

      transactions
        .filter((t) => {
          const d = new Date(t.date);
          return d.getMonth() === m && d.getFullYear() === y && t.type === 'expense';
        })
        .forEach((t) => {
          if (!categorySpending[t.category]) {
            categorySpending[t.category] = [];
          }
          categorySpending[t.category][i] = (categorySpending[t.category][i] ?? 0) + Number(t.amount);
        });
    }

    // Calculate patterns
    Object.entries(categorySpending).forEach(([category, months]) => {
      const [lastMonth, month2, month3] = months;
      const validMonths = [lastMonth, month2, month3].filter((m) => m !== undefined);
      const avgMonthly = validMonths.length > 0
        ? validMonths.reduce((a, b) => a + b, 0) / validMonths.length
        : 0;
      const change = lastMonth - avgMonthly;
      const changePercent = avgMonthly > 0 ? (change / avgMonthly) * 100 : 0;

      patterns.push({
        category,
        avgMonthly: Math.round(avgMonthly),
        lastMonth: lastMonth ?? 0,
        change: Math.round(change),
        changePercent: Math.round(changePercent),
        trend: change > avgMonthly * 0.05 ? 'up' : change < -avgMonthly * 0.05 ? 'down' : 'stable',
      });
    });

    // ─── Budget Recommendations ────────────────────────────────────────────
    const budgetRecommendations: BudgetRecommendation[] = patterns
      .filter((p) => p.avgMonthly > 0)
      .map((p) => {
        const historyDays = 90;
        const txCount = transactions.filter(
          (t) => t.category === p.category && t.type === 'expense',
        ).length;
        const confidence: 'high' | 'medium' | 'low' = txCount >= 5 ? 'high' : 'medium';
        return {
          category: p.category,
          recommendedAmount: Math.round(p.avgMonthly * 1.15), // 15% buffer
          avgSpending: p.avgMonthly,
          daysOfHistory: historyDays,
          confidence,
          transactionCount: txCount,
        };
      })
      .sort((a, b) => b.avgSpending - a.avgSpending)
      .slice(0, 5); // Top 5

    // ─── Spending Forecast ────────────────────────────────────────────────
    const currentMonthExpenses = transactions
      .filter((t) => {
        const d = new Date(t.date);
        return (
          d.getMonth() === currentMonth &&
          d.getFullYear() === currentYear &&
          t.type === 'expense'
        );
      })
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const dailyAverage = dayOfMonth > 0 ? currentMonthExpenses / dayOfMonth : 0;
    const projectedMonthEnd = Math.round(dailyAverage * daysInMonth);
    const daysRemaining = daysInMonth - dayOfMonth;

    const forecast: SpendingForecast = {
      projectedMonthEnd,
      currentSpent: currentMonthExpenses,
      daysElapsed: dayOfMonth,
      daysRemaining,
      dailyAverage: Math.round(dailyAverage),
    };

    // ─── Budget Velocity: How fast through each budget ───────────────────────
    const velocities: BudgetVelocity[] = budgetRecommendations.map((rec) => {
      const budget = rec.recommendedAmount;
      const percentUsed = budget > 0 ? (rec.avgSpending / budget) * 100 : 0;
      const dailyBudgetRemaining = daysRemaining > 0 ? (budget - rec.avgSpending) / daysRemaining : 0;
      const projectedETA = Math.max(dayOfMonth, Math.ceil(budget / (dailyAverage || 1)));

      let riskLevel: 'critical' | 'warning' | 'safe' = 'safe';
      if (percentUsed > 90) riskLevel = 'critical';
      else if (percentUsed > 70) riskLevel = 'warning';

      return {
        category: rec.category,
        monthlyBudget: budget,
        currentSpent: rec.avgSpending,
        percentUsed: Math.round(percentUsed),
        daysRemaining,
        projectedETA,
        riskLevel,
      };
    });

    // ─── Anomaly Detection: Spending deviations ────────────────────────────
    const anomalies: AnomalyScore[] = patterns
      .map((pattern) => {
        const expectedDailySpend = pattern.avgMonthly / daysInMonth;
        const expectedToDate = expectedDailySpend * dayOfMonth;
        const actualToDate = transactions
          .filter((t) => {
            const d = new Date(t.date);
            return (
              d.getMonth() === currentMonth &&
              d.getFullYear() === currentYear &&
              t.category === pattern.category &&
              t.type === 'expense'
            );
          })
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const deviation = actualToDate - expectedToDate;
        const deviationPercent = expectedToDate > 0 ? (deviation / expectedToDate) * 100 : 0;

        let severity: 'critical' | 'warning' | 'none' = 'none';
        let reason = 'On track';
        if (deviationPercent > 30) {
          severity = 'critical';
          reason = 'Spending 30%+ above historical pace';
        } else if (deviationPercent > 15) {
          severity = 'warning';
          reason = 'Spending 15%+ above historical pace';
        }

        return {
          category: pattern.category,
          currentSpent: actualToDate,
          expectedSpend: Math.round(expectedToDate),
          deviation: Math.round(deviation),
          deviationPercent: Math.round(deviationPercent),
          severity,
          reason,
        };
      })
      .filter((a) => a.severity !== 'none')
      .sort((a, b) => b.deviationPercent - a.deviationPercent);

    return {
      patterns: patterns.sort((a, b) => b.lastMonth - a.lastMonth),
      budgetRecommendations,
      forecast,
      velocities,
      anomalies,
      hasEnoughData: transactions.filter((t) => t.type === 'expense').length >= 10,
    };
  }, [transactions, currentMonth, currentYear]);
}
