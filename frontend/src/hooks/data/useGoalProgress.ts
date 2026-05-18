import { useMemo } from 'react';
import type { Goal, Transaction } from '@/lib/supabase';

export interface Milestone {
  percent: number;
  amount: number;
  targetMonth: string;
  achieved: boolean;
  achievedDate?: string;
}

export interface GoalProgressAnalysis {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  progressPercent: number;
  deadline: string;
  monthsRemaining: number;
  monthlyRate: number;
  monthlyHistory: number[];
  projectedDate: string;
  projectedDateFormatted: string;
  daysUntilDeadline: number;
  daysUntilProjected: number;
  status: 'on-track' | 'at-risk' | 'delayed';
  accelerationNeeded: number;
  accelerationPercent: number;
  milestones: Milestone[];
  insights: string[];
}

export interface GoalProgressData {
  goals: GoalProgressAnalysis[];
  totalSavingsTarget: number;
  totalSaved: number;
  totalProgress: number;
  avgMonthlyRate: number;
  goalsOnTrack: number;
  goalsAtRisk: number;
  goalsDelayed: number;
}

function getMonthString(date: Date): string {
  return date.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

function daysUntil(targetDate: Date): number {
  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function useGoalProgress(
  goals: Goal[],
  transactions: Transaction[],
  month: number,
  year: number,
): GoalProgressData {
  return useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Get savings transactions for last 3 months
    const monthlyContributions: Record<string, number> = {};

    for (let i = 0; i < 3; i++) {
      const histMonth = (month - i - 1 + 12) % 12 + 1;
      const histYear = year - (month - i - 1 < 0 ? 1 : 0);

      const monthKey = `${histYear}-${String(histMonth).padStart(2, '0')}`;

      const monthSavings = transactions
        .filter((t) => {
          const d = new Date(t.date);
          return (
            d.getMonth() + 1 === histMonth &&
            d.getFullYear() === histYear &&
            (t.type === 'expense' || t.type === 'saving') &&
            (t.category === 'Savings' || t.category === 'Investment')
          );
        })
        .reduce((sum, t) => sum + Number(t.amount), 0);

      monthlyContributions[monthKey] = monthSavings;
    }

    const recentMonths = [
      `${year}-${String(month).padStart(2, '0')}`,
      `${year}-${String(month - 1 > 0 ? month - 1 : 12).padStart(2, '0')}`,
      `${year - (month - 1 <= 0 ? 1 : 0)}-${String(month - 2 > 0 ? month - 2 : month + 10).padStart(2, '0')}`,
    ].reverse();

    const monthlyHistory = recentMonths.map(
      (key) => monthlyContributions[key] || 0,
    );
    const avgMonthlyRate =
      monthlyHistory.length > 0
        ? Math.round(monthlyHistory.reduce((a, b) => a + b, 0) / monthlyHistory.length)
        : 0;

    // Analyze each goal
    const goalAnalyses: GoalProgressAnalysis[] = goals.map((goal) => {
      const savedAmount = Number(goal.saved_amount || 0);
      const targetAmount = Number(goal.target_amount);
      const progressPercent = (savedAmount / targetAmount) * 100;

      const deadline = new Date(goal.deadline);
      const monthsRemaining = Math.max(0, Math.ceil(
        (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30),
      ));
      const daysUntilDeadlineVal = daysUntil(deadline);

      // Calculate projected completion date
      const remainingAmount = Math.max(0, targetAmount - savedAmount);
      let projectedDate = new Date(now);
      if (avgMonthlyRate > 0) {
        const monthsNeeded = Math.ceil(remainingAmount / avgMonthlyRate);
        projectedDate = addMonths(now, monthsNeeded);
      }
      const projectedDateFormatted = getMonthString(projectedDate);
      const daysUntilProjectedVal = daysUntil(projectedDate);

      // Status determination
      let status: 'on-track' | 'at-risk' | 'delayed';
      if (projectedDate <= deadline && progressPercent < 100) {
        status = 'on-track';
      } else if (
        projectedDate > deadline &&
        progressPercent < 100
      ) {
        status = 'at-risk';
      } else if (
        progressPercent >= 100
      ) {
        status = 'on-track'; // Completed
      } else {
        status = 'delayed';
      }

      // Acceleration needed
      const monthsToDeadline = Math.max(1, monthsRemaining);
      const requiredMonthlyRate = remainingAmount / monthsToDeadline;
      const accelerationNeeded = Math.max(
        0,
        Math.round(requiredMonthlyRate - avgMonthlyRate),
      );
      const accelerationPercent =
        avgMonthlyRate > 0
          ? Math.round(((requiredMonthlyRate - avgMonthlyRate) / avgMonthlyRate) * 100)
          : 0;

      // Generate milestones
      const milestones: Milestone[] = [25, 50, 75, 100].map((percent) => {
        const amount = (targetAmount * percent) / 100;
        const achieved = savedAmount >= amount;

        // Estimate target month for milestone
        const amountNeededForMilestone = Math.max(0, amount - savedAmount);
        const monthsUntilMilestone = Math.ceil(
          amountNeededForMilestone / Math.max(1, avgMonthlyRate),
        );
        const targetMonthDate = addMonths(now, monthsUntilMilestone);
        const targetMonth = getMonthString(targetMonthDate);

        return {
          percent,
          amount: Math.round(amount),
          targetMonth,
          achieved,
        };
      });

      // Generate insights
      const insights: string[] = [];

      if (progressPercent >= 100) {
        insights.push(`🎉 Goal tercapai! Total tabungan: Rp${Math.round(savedAmount).toLocaleString('id-ID')}`);
      }

      if (status === 'on-track' && progressPercent < 100) {
        const remainingPct = (100 - progressPercent).toFixed(0);
        insights.push(`✅ Tepat waktu: ${remainingPct}% lagi menuju target`);
      }

      if (status === 'at-risk' && progressPercent < 100) {
        const monthsLate = Math.round((projectedDate.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24 * 30));
        insights.push(`⚠️ Berisiko terlambat ${monthsLate} bulan dengan pace saat ini`);
      }

      if (accelerationNeeded > 0 && progressPercent < 100) {
        insights.push(
          `💪 Butuh +Rp${accelerationNeeded.toLocaleString('id-ID')}/bulan untuk tepat waktu`,
        );
      }

      const nextMilestone = milestones.find((m) => !m.achieved);
      if (nextMilestone) {
        const daysToMilestone = daysUntil(
          addMonths(now, Math.ceil((nextMilestone.amount - savedAmount) / Math.max(1, avgMonthlyRate))),
        );
        insights.push(
          `🎯 Milestone ${nextMilestone.percent}% dalam ~${daysToMilestone} hari`,
        );
      }

      if (avgMonthlyRate === 0 && progressPercent < 100) {
        insights.push(`📝 Mulai menyimpan untuk goal ini`);
      }

      return {
        id: goal.id,
        name: goal.name,
        targetAmount: Math.round(targetAmount),
        savedAmount: Math.round(savedAmount),
        progressPercent: Math.round(progressPercent),
        deadline: deadline.toISOString().split('T')[0],
        monthsRemaining,
        monthlyRate: avgMonthlyRate,
        monthlyHistory,
        projectedDate: projectedDate.toISOString().split('T')[0],
        projectedDateFormatted,
        daysUntilDeadline: daysUntilDeadlineVal,
        daysUntilProjected: daysUntilProjectedVal,
        status,
        accelerationNeeded,
        accelerationPercent,
        milestones,
        insights,
      };
    });

    // Calculate aggregate stats
    const totalSavingsTarget = goalAnalyses.reduce((sum, g) => sum + g.targetAmount, 0);
    const totalSaved = goalAnalyses.reduce((sum, g) => sum + g.savedAmount, 0);
    const totalProgress =
      totalSavingsTarget > 0 ? Math.round((totalSaved / totalSavingsTarget) * 100) : 0;
    const goalsOnTrack = goalAnalyses.filter((g) => g.status === 'on-track').length;
    const goalsAtRisk = goalAnalyses.filter((g) => g.status === 'at-risk').length;
    const goalsDelayed = goalAnalyses.filter((g) => g.status === 'delayed').length;

    return {
      goals: goalAnalyses,
      totalSavingsTarget,
      totalSaved: Math.round(totalSaved),
      totalProgress,
      avgMonthlyRate,
      goalsOnTrack,
      goalsAtRisk,
      goalsDelayed,
    };
  }, [goals, transactions, month, year]);
}
