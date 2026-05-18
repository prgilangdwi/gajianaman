import { useEffect, useState } from 'react';
import { useAuth } from '../useAuth';
import { supabase } from '@/lib/supabase';
import type { Transaction } from '@/lib/supabase';
import type { ExpenseForecast, CategoryForecast } from './useExpenseForecasting';

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

/**
 * Hook for expense forecasting that fetches its own historical data
 * Solves the issue where useExpenseForecasting relied on passed transactions
 * that only contained the current month's data
 */
export function useExpenseForecastingWithHistory(
  month: number,
  year: number,
): { forecast: ExpenseForecast | null; isLoading: boolean } {
  const { user } = useAuth();
  const [forecast, setForecast] = useState<ExpenseForecast | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch 4 months of transaction data (3 historical + 1 current)
        const dateRanges = [
          { month: month - 3, year: year },
          { month: month - 2, year: year },
          { month: month - 1, year: year },
          { month: month, year: year },
        ].map((d) => {
          const m = d.month < 1 ? 12 + d.month : d.month;
          const y = d.month < 1 ? d.year - 1 : d.year;
          return { month: m, year: y };
        });

        // Fetch all 4 months
        const allTransactions: Transaction[] = [];

        for (const dateRange of dateRanges) {
          const startDate = new Date(dateRange.year, dateRange.month - 1, 1);
          const endDate = new Date(dateRange.year, dateRange.month, 0);

          const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', user.user_id)
            .gte('date', startDate.toISOString().split('T')[0])
            .lte('date', endDate.toISOString().split('T')[0]);

          if (error) throw error;
          if (data) allTransactions.push(...(data as Transaction[]));
        }

        // Now calculate forecast using all 4 months of data
        const daysInCurrentMonth = new Date(year, month, 0).getDate();
        const currentDay = new Date().getDate();

        const currentMonthExpenses = allTransactions.filter((t) => {
          const d = new Date(t.date);
          return (
            d.getMonth() === month - 1 &&
            d.getFullYear() === year &&
            t.type === 'expense'
          );
        });

        // Collect 3-month history
        const monthlyData: Record<string, number[]> = {};
        const categoryMonthlyTotals: Record<
          string,
          { totals: number[]; counts: number[] }
        > = {};

        for (let i = 0; i < 3; i++) {
          const histMonth = (month - i - 1 + 12) % 12 + 1;
          const histYear = year - (month - i - 1 < 0 ? 1 : 0);

          const monthExpenses = allTransactions.filter((t) => {
            const d = new Date(t.date);
            return (
              d.getMonth() === histMonth - 1 &&
              d.getFullYear() === histYear &&
              t.type === 'expense'
            );
          });

          monthlyData[`month_${i}`] = monthExpenses.map((t) =>
            Number(t.amount),
          );

          // Aggregate by category
          monthExpenses.forEach((tx) => {
            const cat = tx.category;
            if (!categoryMonthlyTotals[cat]) {
              categoryMonthlyTotals[cat] = { totals: [0, 0, 0], counts: [0, 0, 0] };
            }
            categoryMonthlyTotals[cat].totals[i] += Number(tx.amount);
            categoryMonthlyTotals[cat].counts[i] += 1;
          });
        }

        // Calculate total spending for each of the 3 months
        const monthlyTotals = [0, 1, 2].map((i) =>
          monthlyData[`month_${i}`].reduce((a, b) => a + b, 0),
        );

        // Linear regression for overall trend
        const { slope, intercept } = linearRegression(monthlyTotals);

        // Project next month
        const nextMonthForecast = Math.max(0, intercept + slope * 3);

        // Current month total
        const currentMonthTotal = currentMonthExpenses.reduce(
          (sum, t) => sum + Number(t.amount),
          0,
        );

        // Calculate category forecasts
        const categoryForecasts: CategoryForecast[] = Object.entries(
          categoryMonthlyTotals,
        ).map(([category, data]) => {
          const { totals, counts } = data;
          const avgCount = counts.reduce((a, b) => a + b, 0) / 3;

          // Check consistency (coefficient of variation)
          const mean = totals.reduce((a, b) => a + b, 0) / 3;
          const variance =
            totals.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / 3;
          const stdDev = Math.sqrt(variance);
          const cv = mean > 0 ? stdDev / mean : 0;

          // Determine confidence based on consistency
          let confidence: 'high' | 'medium' | 'low';
          if (cv < 0.2 && avgCount >= 2) {
            confidence = 'high';
          } else if (cv < 0.4 && avgCount >= 1) {
            confidence = 'medium';
          } else {
            confidence = 'low';
          }

          // Calculate trend
          const { slope: catSlope } = linearRegression(totals);
          let trend: 'up' | 'down' | 'stable';
          if (catSlope > mean * 0.05) {
            trend = 'up';
          } else if (catSlope < -mean * 0.05) {
            trend = 'down';
          } else {
            trend = 'stable';
          }

          // Project next month for this category
          const { intercept: catIntercept } = linearRegression(totals);
          const predicted = Math.max(0, catIntercept + catSlope * 3);

          return {
            category,
            predicted: Math.round(predicted),
            historical: totals.map((t) => Math.round(t)),
            trend,
            confidence,
          };
        });

        // Sort by predicted amount (descending)
        categoryForecasts.sort((a, b) => b.predicted - a.predicted);

        // Calculate pacing
        const percentMonthComplete = (currentDay / daysInCurrentMonth) * 100;
        const dailyBudget = nextMonthForecast / daysInCurrentMonth;
        const currentDailyRate =
          currentMonthTotal > 0 ? currentMonthTotal / currentDay : 0;
        const projectedMonthTotal =
          (currentMonthTotal / currentDay) * daysInCurrentMonth;
        const variance = projectedMonthTotal - nextMonthForecast;
        const variancePercent =
          nextMonthForecast > 0 ? (variance / nextMonthForecast) * 100 : 0;

        const onTrack = Math.abs(variance) < nextMonthForecast * 0.1;

        // Generate insights
        const insights: string[] = [];

        if (variance > nextMonthForecast * 0.2) {
          const percentOver = Math.round((variance / nextMonthForecast) * 100);
          insights.push(
            `⚠️ Pengeluaran bulan ini diprediksi ${percentOver}% LEBIH TINGGI dari rata-rata`,
          );
        } else if (variance < -nextMonthForecast * 0.2) {
          const percentUnder = Math.round((Math.abs(variance) / nextMonthForecast) * 100);
          insights.push(
            `✅ Pengeluaran bulan ini diprediksi ${percentUnder}% LEBIH RENDAH dari rata-rata`,
          );
        }

        // Find increasing categories
        const increasingCats = categoryForecasts.filter((c) => c.trend === 'up');
        if (increasingCats.length > 0) {
          const topCat = increasingCats[0];
          const increase = (
            ((topCat.predicted - topCat.historical[0]) / topCat.historical[0]) *
            100
          ).toFixed(0);
          insights.push(`📈 ${topCat.category} naik ~${increase}% vs bulan lalu`);
        }

        // Check if on pace
        if (!onTrack && variance > 0) {
          const overspendPerDay = variance / (daysInCurrentMonth - currentDay);
          insights.push(
            `💰 Kurangi ~${Math.round(overspendPerDay)}/hari untuk kembali sesuai target`,
          );
        }

        // Highest confidence forecast
        const highConfidenceForecasts = categoryForecasts.filter(
          (c) => c.confidence === 'high',
        );
        if (highConfidenceForecasts.length > 0) {
          const total = highConfidenceForecasts
            .slice(0, 3)
            .reduce((sum, c) => sum + c.predicted, 0);
          insights.push(
            `📊 3 kategori terbesar (high confidence) = ${Math.round(total)}/bln`,
          );
        }

        setForecast({
          nextMonthForecast: Math.round(nextMonthForecast),
          categoryForecasts,
          currentVsProjected: {
            currentMonthTotal: Math.round(currentMonthTotal),
            projectedMonthTotal: Math.round(projectedMonthTotal),
            variance: Math.round(variance),
            variancePercent: Math.round(variancePercent),
          },
          currentPacing: {
            daysPassed: currentDay,
            daysInMonth: daysInCurrentMonth,
            percentMonthComplete: Math.round(percentMonthComplete),
            dailyBudget: Math.round(dailyBudget),
            currentDailyRate: Math.round(currentDailyRate),
            onTrack,
          },
          insights,
        });
      } catch (error) {
        console.error('Error fetching forecast data:', error);
        setForecast(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, month, year]);

  return { forecast, isLoading };
}
