import { useEffect, useState } from 'react';
import { useAuth } from '../useAuth';
import { supabase } from '@/lib/supabase';
import type { Transaction } from '@/lib/supabase';

interface WeeklyCategoryForecast {
  category: string;
  lastWeekAvg: number;
  predicted: number;
  trend: 'up' | 'down' | 'stable';
}

export interface WeeklyForecast {
  week: number;
  weekStart: string;
  weekEnd: string;
  lastWeekTotal: number;
  predictedTotal: number;
  categoryForecasts: WeeklyCategoryForecast[];
  dailyBreakdown: Array<{ day: string; date: string; total: number }>;
  insights: string[];
}

function linearRegression(values: number[]): { slope: number; intercept: number } {
  if (values.length < 2) {
    return { slope: 0, intercept: values[0] || 0 };
  }

  const n = values.length;
  const xValues = Array.from({ length: n }, (_, i) => i);
  const sumX = xValues.reduce((a, b) => a + b, 0);
  const sumY = values.reduce((a, b) => a + b, 0);
  const sumXY = xValues.reduce((sum, x, i) => sum + x * values[i], 0);
  const sumX2 = xValues.reduce((sum, x) => sum + x * x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}

export function useWeeklyForecasting(
  weekOfMonth: number,
  month: number,
  year: number,
): { forecast: WeeklyForecast | null; isLoading: boolean } {
  const { user } = useAuth();
  const [forecast, setForecast] = useState<WeeklyForecast | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Calculate week date range (Mon-Sun)
        const firstDayOfMonth = new Date(year, month - 1, 1);
        const weekStartDate = new Date(firstDayOfMonth);
        weekStartDate.setDate(1 + (weekOfMonth - 1) * 7);

        // Adjust to Monday if not already
        while (weekStartDate.getDay() !== 1) {
          weekStartDate.setDate(weekStartDate.getDate() - 1);
        }

        const weekEndDate = new Date(weekStartDate);
        weekEndDate.setDate(weekStartDate.getDate() + 6);

        // Fetch 4 weeks of data (3 historical + 1 current)
        const fourWeeksAgo = new Date(weekStartDate);
        fourWeeksAgo.setDate(weekStartDate.getDate() - 21);

        const { data: transactions, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.user_id)
          .gte('date', fourWeeksAgo.toISOString().split('T')[0])
          .lte('date', weekEndDate.toISOString().split('T')[0]);

        if (error) throw error;

        const allTransactions = (transactions || []) as Transaction[];

        // Helper function to get week boundaries
        const getWeekBoundaries = (startDate: Date, weekOffset: number) => {
          const start = new Date(startDate);
          start.setDate(start.getDate() + weekOffset * 7);
          const end = new Date(start);
          end.setDate(start.getDate() + 6);
          return { start, end };
        };

        // Collect 4 weeks of data
        const weeklyTotals: number[] = [];
        const categoryWeeklyTotals: Record<string, { totals: number[]; counts: number[] }> = {};

        for (let i = 0; i < 4; i++) {
          const { start, end } = getWeekBoundaries(fourWeeksAgo, i);
          const weekExpenses = allTransactions.filter((t) => {
            const d = new Date(t.date);
            return d >= start && d <= end && t.type === 'expense';
          });

          const weekTotal = weekExpenses.reduce((sum, t) => sum + Number(t.amount), 0);
          weeklyTotals.push(weekTotal);

          weekExpenses.forEach((tx) => {
            const cat = tx.category;
            const weekIdx = 3 - i; // 3=last, 0=current
            if (!categoryWeeklyTotals[cat]) {
              categoryWeeklyTotals[cat] = { totals: [0, 0, 0, 0], counts: [0, 0, 0, 0] };
            }
            categoryWeeklyTotals[cat].totals[weekIdx] += Number(tx.amount);
            categoryWeeklyTotals[cat].counts[weekIdx] += 1;
          });
        }

        // Linear regression for next week forecast
        const last3Weeks = weeklyTotals.slice(0, 3);
        const { slope, intercept } = linearRegression(last3Weeks);
        const predictedTotal = Math.max(0, intercept + slope * 3);

        // Daily breakdown for current week
        const dailyBreakdown = [];
        for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
          const dayDate = new Date(weekStartDate);
          dayDate.setDate(weekStartDate.getDate() + dayOffset);
          const dayExpenses = allTransactions.filter((t) => {
            const d = new Date(t.date);
            return (
              d.getFullYear() === dayDate.getFullYear() &&
              d.getMonth() === dayDate.getMonth() &&
              d.getDate() === dayDate.getDate() &&
              t.type === 'expense'
            );
          });
          const dayTotal = dayExpenses.reduce((sum, t) => sum + Number(t.amount), 0);
          dailyBreakdown.push({
            day: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'][dayOffset],
            date: dayDate.toISOString().split('T')[0],
            total: dayTotal,
          });
        }

        // Category forecasts
        const categoryForecasts: WeeklyCategoryForecast[] = Object.entries(categoryWeeklyTotals).map(
          ([category, data]) => {
            const { totals, counts } = data;
            const last3 = totals.slice(0, 3);
            const avgCount = counts.slice(0, 3).reduce((a, b) => a + b, 0) / 3;

            const { slope: catSlope, intercept: catIntercept } = linearRegression(last3);
            const mean = last3.reduce((a, b) => a + b, 0) / 3;
            let trend: 'up' | 'down' | 'stable';
            if (catSlope > mean * 0.05) {
              trend = 'up';
            } else if (catSlope < -mean * 0.05) {
              trend = 'down';
            } else {
              trend = 'stable';
            }

            return {
              category,
              lastWeekAvg: Math.round(last3[0]),
              predicted: Math.max(0, Math.round(catIntercept + catSlope * 3)),
              trend,
            };
          },
        );

        categoryForecasts.sort((a, b) => b.predicted - a.predicted);

        // Generate insights
        const insights: string[] = [];
        const lastWeekTotal = weeklyTotals[3];
        if (predictedTotal > lastWeekTotal * 1.1) {
          const increase = Math.round(((predictedTotal - lastWeekTotal) / lastWeekTotal) * 100);
          insights.push(`📈 Prakiraan minggu ini ${increase}% LEBIH TINGGI dari minggu lalu`);
        } else if (predictedTotal < lastWeekTotal * 0.9) {
          const decrease = Math.round(((lastWeekTotal - predictedTotal) / lastWeekTotal) * 100);
          insights.push(`✅ Prakiraan minggu ini ${decrease}% LEBIH RENDAH dari minggu lalu`);
        }

        const increasingCats = categoryForecasts.filter((c) => c.trend === 'up');
        if (increasingCats.length > 0) {
          const topCat = increasingCats[0];
          const increase = (((topCat.predicted - topCat.lastWeekAvg) / topCat.lastWeekAvg) * 100).toFixed(0);
          insights.push(`📊 ${topCat.category} naik ~${increase}% vs minggu lalu`);
        }

        const highDays = dailyBreakdown.filter((d) => d.total > predictedTotal / 7 * 1.5);
        if (highDays.length > 0) {
          insights.push(`💰 Hari terboros minggu ini: ${highDays[0].day} (Rp${Math.round(highDays[0].total)})`);
        }

        setForecast({
          week: weekOfMonth,
          weekStart: weekStartDate.toISOString().split('T')[0],
          weekEnd: weekEndDate.toISOString().split('T')[0],
          lastWeekTotal: Math.round(lastWeekTotal),
          predictedTotal: Math.round(predictedTotal),
          categoryForecasts,
          dailyBreakdown,
          insights,
        });
      } catch (error) {
        console.error('Error fetching weekly forecast data:', error);
        setForecast(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, weekOfMonth, month, year]);

  return { forecast, isLoading };
}
