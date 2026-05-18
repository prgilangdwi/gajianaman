import { useMemo } from 'react';
import type { Transaction, RecurringTransaction } from '@/lib/supabase';

export function useRecurringTransactions(transactions: Transaction[]): RecurringTransaction[] {
  return useMemo(() => {
    // Group transactions by category and amount
    const transactionGroups: Record<string, Transaction[]> = {};

    transactions
      .filter((t) => t.type === 'expense')
      .forEach((tx) => {
        // Round to nearest 5k for fuzzy matching (handles slight amount variations)
        const roundedAmount = Math.round(Number(tx.amount) / 5000) * 5000;
        const key = `${tx.category}|${roundedAmount}`;
        if (!transactionGroups[key]) {
          transactionGroups[key] = [];
        }
        transactionGroups[key].push(tx);
      });

    // Detect recurring patterns
    const recurring: RecurringTransaction[] = [];

    Object.entries(transactionGroups).forEach(([key, txs]) => {
      if (txs.length < 2) return; // Need at least 2 transactions

      // Sort by date
      const sorted = txs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Calculate day of month
      const daysOfMonth: number[] = [];
      sorted.forEach((tx) => {
        const d = new Date(tx.date);
        daysOfMonth.push(d.getDate());
      });

      // Check for monthly pattern (same day each month)
      const isMonthly = checkMonthlyPattern(sorted);
      const isWeekly = checkWeeklyPattern(sorted);
      const isBiweekly = checkBiweeklyPattern(sorted);

      if (isMonthly || isWeekly || isBiweekly) {
        const [category, amountStr] = key.split('|');
        const amount = parseInt(amountStr);
        const lastTx = sorted[sorted.length - 1];
        const lastDate = new Date(lastTx.date);

        let frequency: 'monthly' | 'weekly' | 'biweekly' | 'yearly' = 'monthly';
        let nextExpected = new Date(lastDate);

        if (isMonthly) {
          nextExpected.setMonth(nextExpected.getMonth() + 1);
          frequency = 'monthly';
        } else if (isWeekly) {
          nextExpected.setDate(nextExpected.getDate() + 7);
          frequency = 'weekly';
        } else if (isBiweekly) {
          nextExpected.setDate(nextExpected.getDate() + 14);
          frequency = 'biweekly';
        }

        // Confidence based on consistency
        let confidence: 'high' | 'medium' | 'low' = 'high';
        if (txs.length < 3) confidence = 'medium';
        if (txs.length < 2) confidence = 'low';

        recurring.push({
          id: `${category}|${amount}`,
          category,
          amount,
          dayOfMonth: lastDate.getDate(),
          frequency,
          confidence,
          transactionCount: txs.length,
          lastOccurrence: lastTx.date,
          nextExpected: nextExpected.toISOString().split('T')[0],
          isConfirmed: false,
          note: lastTx.note,
        });
      }
    });

    return recurring.sort((a, b) => b.transactionCount - a.transactionCount);
  }, [transactions]);
}

function checkMonthlyPattern(txs: Transaction[]): boolean {
  if (txs.length < 2) return false;

  const daysOfMonth = txs.map((t) => new Date(t.date).getDate());

  // Check if most transactions occur on the same day of month
  const dayFreq: Record<number, number> = {};
  daysOfMonth.forEach((day) => {
    dayFreq[day] = (dayFreq[day] || 0) + 1;
  });

  const maxDay = Math.max(...Object.values(dayFreq));
  const mostCommonDay = Object.keys(dayFreq).find((day) => dayFreq[parseInt(day)] === maxDay);

  if (!mostCommonDay) return false;

  const expectedDay = parseInt(mostCommonDay);
  const onDay = daysOfMonth.filter((d) => d === expectedDay).length;

  // At least 60% of transactions on same day
  return onDay / txs.length >= 0.6;
}

function checkWeeklyPattern(txs: Transaction[]): boolean {
  if (txs.length < 3) return false;

  const dates = txs.map((t) => new Date(t.date));
  const gaps: number[] = [];

  for (let i = 1; i < dates.length; i++) {
    const gap = Math.floor((dates[i].getTime() - dates[i - 1].getTime()) / (1000 * 60 * 60 * 24));
    gaps.push(gap);
  }

  // Check if gaps are mostly ~7 days (±2 days tolerance)
  const weeklyGaps = gaps.filter((g) => g >= 5 && g <= 9).length;
  return weeklyGaps / gaps.length >= 0.7;
}

function checkBiweeklyPattern(txs: Transaction[]): boolean {
  if (txs.length < 3) return false;

  const dates = txs.map((t) => new Date(t.date));
  const gaps: number[] = [];

  for (let i = 1; i < dates.length; i++) {
    const gap = Math.floor((dates[i].getTime() - dates[i - 1].getTime()) / (1000 * 60 * 60 * 24));
    gaps.push(gap);
  }

  // Check if gaps are mostly ~14 days (±3 days tolerance)
  const biweeklyGaps = gaps.filter((g) => g >= 11 && g <= 17).length;
  return biweeklyGaps / gaps.length >= 0.7;
}
