import { useMemo } from 'react';
import type { Transaction } from '@/lib/supabase';

export interface DailyPattern {
  day: number; // 1-31
  dayName: string; // Monday, Tuesday, etc.
  spending: number;
  transactionCount: number;
  percentOfMonth: number;
}

export interface WeeklyPattern {
  week: number; // 1-5
  spending: number;
  avgDaily: number;
  transactionCount: number;
  trend: 'up' | 'down' | 'stable';
}

export interface SpendingPatternAnalysis {
  dailyPatterns: DailyPattern[];
  weeklyPatterns: WeeklyPattern[];
  peakDay: string; // name of highest spending day
  peakDayAmount: number;
  averageDailySpend: number;
  highestWeek: number;
  lowestWeek: number;
  mostActiveDay: string; // day of week with most transactions
  insights: string[];
}

export function useSpendingPatterns(
  transactions: Transaction[],
  month: number,
  year: number,
): SpendingPatternAnalysis {
  return useMemo(() => {
    const expenses = transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() === month - 1 && d.getFullYear() === year && t.type === 'expense';
    });

    // Get days in month
    const daysInMonth = new Date(year, month, 0).getDate();

    // Calculate daily patterns
    const dailyData: Record<number, { spending: number; count: number }> = {};
    const dayOfWeekData: Record<string, number> = {
      Monday: 0,
      Tuesday: 0,
      Wednesday: 0,
      Thursday: 0,
      Friday: 0,
      Saturday: 0,
      Sunday: 0,
    };
    const dayOfWeekCount: Record<string, number> = {
      Monday: 0,
      Tuesday: 0,
      Wednesday: 0,
      Thursday: 0,
      Friday: 0,
      Saturday: 0,
      Sunday: 0,
    };

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    expenses.forEach((tx) => {
      const d = new Date(tx.date);
      const dayOfMonth = d.getDate();
      const dayOfWeek = dayNames[d.getDay()];

      // Daily
      if (!dailyData[dayOfMonth]) {
        dailyData[dayOfMonth] = { spending: 0, count: 0 };
      }
      dailyData[dayOfMonth].spending += Number(tx.amount);
      dailyData[dayOfMonth].count += 1;

      // Day of week
      dayOfWeekData[dayOfWeek] += Number(tx.amount);
      dayOfWeekCount[dayOfWeek] += 1;
    });

    const totalSpending = expenses.reduce((sum, t) => sum + Number(t.amount), 0);

    // Build daily patterns
    const dailyPatterns: DailyPattern[] = [];
    let peakAmount = 0;
    let peakDay = '';

    for (let day = 1; day <= daysInMonth; day++) {
      const data = dailyData[day] || { spending: 0, count: 0 };
      const dayDate = new Date(year, month - 1, day);
      const dayName = dayNames[dayDate.getDay()];

      dailyPatterns.push({
        day,
        dayName,
        spending: Math.round(data.spending),
        transactionCount: data.count,
        percentOfMonth:
          totalSpending > 0 ? Math.round((data.spending / totalSpending) * 100) : 0,
      });

      if (data.spending > peakAmount) {
        peakAmount = data.spending;
        peakDay = `${dayName}, ${day}`;
      }
    }

    // Build weekly patterns
    const weeklyPatterns: WeeklyPattern[] = [];
    let highestWeekAmount = 0;
    let lowestWeekAmount = Infinity;
    let highestWeekNum = 1;
    let lowestWeekNum = 1;

    for (let week = 1; week <= 5; week++) {
      const startDay = (week - 1) * 7 + 1;
      const endDay = Math.min(week * 7, daysInMonth);

      let weekSpending = 0;
      let weekCount = 0;

      for (let day = startDay; day <= endDay; day++) {
        const data = dailyData[day] || { spending: 0, count: 0 };
        weekSpending += data.spending;
        weekCount += data.count;
      }

      const daysInWeek = endDay - startDay + 1;
      const avgDaily = daysInWeek > 0 ? weekSpending / daysInWeek : 0;

      // Determine trend (compare to previous week if exists)
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (week > 1) {
        const prevWeekStart = (week - 2) * 7 + 1;
        const prevWeekEnd = Math.min((week - 1) * 7, daysInMonth);
        let prevWeekSpending = 0;
        for (let day = prevWeekStart; day <= prevWeekEnd; day++) {
          const data = dailyData[day] || { spending: 0, count: 0 };
          prevWeekSpending += data.spending;
        }
        if (weekSpending > prevWeekSpending * 1.1) trend = 'up';
        else if (weekSpending < prevWeekSpending * 0.9) trend = 'down';
      }

      if (weekSpending > highestWeekAmount) {
        highestWeekAmount = weekSpending;
        highestWeekNum = week;
      }
      if (weekSpending < lowestWeekAmount && weekSpending > 0) {
        lowestWeekAmount = weekSpending;
        lowestWeekNum = week;
      }

      weeklyPatterns.push({
        week,
        spending: Math.round(weekSpending),
        avgDaily: Math.round(avgDaily),
        transactionCount: weekCount,
        trend,
      });
    }

    // Find most active day of week
    let mostActiveDay = 'Monday';
    let maxTransactions = 0;
    Object.entries(dayOfWeekCount).forEach(([day, count]) => {
      if (count > maxTransactions) {
        maxTransactions = count;
        mostActiveDay = day;
      }
    });

    // Generate insights
    const insights: string[] = [];

    const avgDailySpend = expenses.length > 0 ? Math.round(totalSpending / daysInMonth) : 0;

    if (peakAmount > avgDailySpend * 1.5) {
      insights.push(`💥 ${peakDay} adalah hari pengeluaran tertinggi (${Math.round(
        (peakAmount / avgDailySpend - 1) * 100,
      )}% di atas rata-rata)`);
    }

    const highestWeekSpend = weeklyPatterns[highestWeekNum - 1]?.spending || 0;
    const lowestWeekSpend = weeklyPatterns[lowestWeekNum - 1]?.spending || 0;

    if (highestWeekSpend > lowestWeekSpend * 1.3) {
      insights.push(`📈 Minggu ${highestWeekNum} jauh lebih tinggi dari minggu lainnya`);
    }

    const mondaySpend = dayOfWeekData['Monday'];
    const fridaySpend = dayOfWeekData['Friday'];
    if (mondaySpend > fridaySpend * 1.5) {
      insights.push('📅 Pengeluaran terkonsentrasi di awal minggu');
    } else if (fridaySpend > mondaySpend * 1.5) {
      insights.push('🎉 Pengeluaran meningkat menjelang akhir pekan');
    }

    if (dayOfWeekCount[mostActiveDay] >= 5) {
      insights.push(`🔄 ${mostActiveDay} adalah hari paling aktif untuk transaksi`);
    }

    return {
      dailyPatterns,
      weeklyPatterns,
      peakDay,
      peakDayAmount: Math.round(peakAmount),
      averageDailySpend: avgDailySpend,
      highestWeek: highestWeekNum,
      lowestWeek: lowestWeekNum,
      mostActiveDay,
      insights,
    };
  }, [transactions, month, year]);
}
