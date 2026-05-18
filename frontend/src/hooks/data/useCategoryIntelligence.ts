import { useMemo } from 'react';
import type { Transaction, Budget } from '@/lib/supabase';

export interface Merchant {
  name: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface CategoryAnalysis {
  category: string;
  spending: number;
  budget?: number;
  variance: number;
  variancePercent: number;
  trend: 'up' | 'down' | 'stable';
  projectedTotal: number;
  monthlyHistory: number[];
  dailyRate: number;
  daysRemaining: number;
  amountRemaining: number;
  topMerchants: Merchant[];
  transactionCount: number;
  avgTransaction: number;
  confidence: 'high' | 'medium' | 'low';
  insights: string[];
}

export interface CategoryIntelligenceData {
  categories: CategoryAnalysis[];
  totalSpending: number;
  totalBudget: number;
  budgetAdherence: number;
  categoryCount: number;
}

function extractMerchantName(note: string): string {
  if (!note) return 'Unknown';
  // Remove common prefixes and patterns
  const cleaned = note
    .replace(/^(Paid to|From|To|Transfer|Payment|Topup|Refill|Purchase at|Bought from)\s*:?\s*/i, '')
    .replace(/(\d{4}-\d{2}-\d{2}|\d{2}:\d{2}|ID:|Ref:).*$/i, '')
    .trim();

  return cleaned.length > 0 ? cleaned : 'Unknown';
}

export function useCategoryIntelligence(
  transactions: Transaction[],
  budgets: Budget[],
  month: number,
  year: number,
): CategoryIntelligenceData {
  return useMemo(() => {
    const now = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    const currentDay = new Date().getDate();

    // Filter current month expenses
    const currentExpenses = transactions.filter((t) => {
      const d = new Date(t.date);
      return (
        d.getMonth() === month - 1 &&
        d.getFullYear() === year &&
        t.type === 'expense'
      );
    });

    // Get 3-month history for each category
    const categoryHistory: Record<string, number[]> = {};
    const categoryData: Record<
      string,
      {
        spending: number;
        transactions: Transaction[];
        count: number;
      }
    > = {};

    // Aggregate current month by category
    currentExpenses.forEach((tx) => {
      const cat = tx.category;
      if (!categoryData[cat]) {
        categoryData[cat] = { spending: 0, transactions: [], count: 0 };
      }
      categoryData[cat].spending += Number(tx.amount);
      categoryData[cat].transactions.push(tx);
      categoryData[cat].count += 1;
    });

    // Collect 3-month history
    for (let i = 0; i < 3; i++) {
      const histMonth = (month - i - 1 + 12) % 12 + 1;
      const histYear = year - (month - i - 1 < 0 ? 1 : 0);

      const monthExpenses = transactions.filter((t) => {
        const d = new Date(t.date);
        return (
          d.getMonth() === histMonth - 1 &&
          d.getFullYear() === histYear &&
          t.type === 'expense'
        );
      });

      monthExpenses.forEach((tx) => {
        const cat = tx.category;
        if (!categoryHistory[cat]) {
          categoryHistory[cat] = [0, 0, 0];
        }
        categoryHistory[cat][i] += Number(tx.amount);
      });
    }

    // Build category analyses
    const categoryAnalyses: CategoryAnalysis[] = Object.entries(categoryData).map(
      ([category, data]) => {
        const budget = budgets.find(
          (b) => b.category === category && b.month === month && b.year === year,
        );
        const budgetAmount = budget ? Number(budget.amount) : undefined;

        const monthlyHistory = categoryHistory[category] || [0, 0, 0];
        const avgMonthly = monthlyHistory.reduce((a, b) => a + b, 0) / 3;

        // Trend detection
        let trend: 'up' | 'down' | 'stable' = 'stable';
        if (monthlyHistory[2] > avgMonthly * 1.1) {
          trend = 'up';
        } else if (monthlyHistory[2] < avgMonthly * 0.9) {
          trend = 'down';
        }

        // Projection
        const dailyRate = data.spending / currentDay;
        const projectedTotal = dailyRate * daysInMonth;

        // Variance
        const variance = budgetAmount ? data.spending - budgetAmount : 0;
        const variancePercent =
          budgetAmount && budgetAmount > 0
            ? (variance / budgetAmount) * 100
            : 0;

        // Confidence: high if consistent, medium if variable, low if sparse
        const consistency =
          monthlyHistory.length > 1
            ? Math.sqrt(
                monthlyHistory.reduce((sum, val) => sum + Math.pow(val - avgMonthly, 2), 0) /
                  monthlyHistory.length,
              ) / avgMonthly
            : 0;

        let confidence: 'high' | 'medium' | 'low';
        if (consistency < 0.2 && data.count >= 3) {
          confidence = 'high';
        } else if (consistency < 0.5 && data.count >= 2) {
          confidence = 'medium';
        } else {
          confidence = 'low';
        }

        // Top merchants
        const merchantTotals: Record<string, { amount: number; count: number }> = {};
        data.transactions.forEach((tx) => {
          const merchant = extractMerchantName(tx.note);
          if (!merchantTotals[merchant]) {
            merchantTotals[merchant] = { amount: 0, count: 0 };
          }
          merchantTotals[merchant].amount += Number(tx.amount);
          merchantTotals[merchant].count += 1;
        });

        const topMerchants: Merchant[] = Object.entries(merchantTotals)
          .map(([name, totals]) => ({
            name,
            amount: totals.amount,
            count: totals.count,
            percentage: (totals.amount / data.spending) * 100,
          }))
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 5);

        // Generate insights
        const insights: string[] = [];

        if (budgetAmount && variance > 0) {
          const pctOver = ((variance / budgetAmount) * 100).toFixed(0);
          insights.push(`⚠️ Sudah ${pctOver}% melebihi budget untuk kategori ini`);
        }

        if (trend === 'up') {
          insights.push(`📈 Pengeluaran kategori ini naik dibanding rata-rata`);
        } else if (trend === 'down') {
          insights.push(`📉 Pengeluaran kategori ini lebih rendah dari biasanya`);
        }

        if (topMerchants.length > 0 && topMerchants[0].percentage > 40) {
          insights.push(
            `🎯 ${topMerchants[0].name} adalah penyumbang terbesar (${topMerchants[0].percentage.toFixed(0)}%)`,
          );
        }

        const avgTx = data.spending / data.count;
        if (avgTx > 500000) {
          insights.push(`💰 Rata-rata transaksi Rp${Math.round(avgTx / 1000)}k cukup tinggi`);
        }

        if (budgetAmount) {
          const remainingDays = daysInMonth - currentDay;
          const remainingBudget = budgetAmount - data.spending;
          if (remainingBudget > 0 && remainingDays > 0) {
            const dailyBudget = remainingBudget / remainingDays;
            insights.push(
              `💡 Budget harian sisa: Rp${Math.round(dailyBudget / 1000)}k untuk ${remainingDays} hari`,
            );
          }
        }

        return {
          category,
          spending: Math.round(data.spending),
          budget: budgetAmount ? Math.round(budgetAmount) : undefined,
          variance: Math.round(variance),
          variancePercent: Math.round(variancePercent),
          trend,
          projectedTotal: Math.round(projectedTotal),
          monthlyHistory: monthlyHistory.map((v) => Math.round(v)),
          dailyRate: Math.round(dailyRate),
          daysRemaining: daysInMonth - currentDay,
          amountRemaining: budgetAmount
            ? Math.round(budgetAmount - data.spending)
            : 0,
          topMerchants,
          transactionCount: data.count,
          avgTransaction: Math.round(data.spending / data.count),
          confidence,
          insights,
        };
      },
    );

    // Sort by spending descending
    categoryAnalyses.sort((a, b) => b.spending - a.spending);

    const totalSpending = categoryAnalyses.reduce((sum, c) => sum + c.spending, 0);
    const totalBudget = categoryAnalyses.reduce((sum, c) => sum + (c.budget || 0), 0);
    const budgetAdherence =
      totalBudget > 0
        ? Math.round(((totalBudget - totalSpending) / totalBudget) * 100)
        : 0;

    return {
      categories: categoryAnalyses,
      totalSpending: Math.round(totalSpending),
      totalBudget: Math.round(totalBudget),
      budgetAdherence,
      categoryCount: categoryAnalyses.length,
    };
  }, [transactions, budgets, month, year]);
}
