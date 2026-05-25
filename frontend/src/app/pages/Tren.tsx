import { useMemo, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ErrorState, EmptyState, LoadingState } from '../components/ScreenStates';
import ChartInsight from '@/app/components/ChartInsight';
import { formatRupiah, cn, bgColorVar, textColorVar, borderColorVar, colorVar } from '@/lib/utils';
import { createCompactAxisFormatter } from '@/lib/chartFormatters';
import { useMonthFilter } from '@/hooks/useMonthFilter';
import { useAuth } from '@/hooks/useAuth';
import { useLaporanData } from '@/hooks/data/useLaporanData';
import { useTransactions } from '@/hooks/useTransactions';
import { pageEnter, fadeUp, useReducedMotion } from '@/lib/transitions';
import { useScreenState } from '@/hooks/useScreenState';
import type { MonthlyPoint } from '@/hooks/data/useLaporanData';

export default function Tren() {
  const { user } = useAuth();
  const { month, year } = useMonthFilter();
  const { monthlyData, categoryTrend, isLoading, error } = useLaporanData(user?.userId);
  const { transactions } = useTransactions();
  const prefersReduced = useReducedMotion();
  const [timePeriod, setTimePeriod] = useState<'3' | '6' | '12'>('6');
  const [trendInsight, setTrendInsight] = useState<string | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);

  // Screen state: loading, error, empty, or loaded
  const screenState = useScreenState({
    isLoading,
    error: error ? new Error(error) : null,
    isEmpty: !monthlyData || monthlyData.length === 0,
  });

  const trendData = useMemo(() => {
    if (!monthlyData || monthlyData.length === 0) return null;

    const periodMonths = parseInt(timePeriod);
    const slicedData = monthlyData.slice(0, periodMonths);

    const incomeVsExpense = slicedData.map((d: MonthlyPoint) => ({
      month: d.month,
      income: d.income,
      expense: d.expenses,
    }));

    const savingsGrowth = slicedData.map((d: MonthlyPoint, idx: number) => {
      const savings = d.income - d.expenses;
      const cumulative = slicedData
        .slice(0, idx + 1)
        .reduce((sum: number, m: MonthlyPoint) => sum + (m.income - m.expenses), 0);
      return {
        month: d.month,
        savings: Math.max(0, savings),
        cumulative,
      };
    });

    return {
      incomeVsExpense,
      categoryTrendChart: categoryTrend || [],
      savingsGrowth,
    };
  }, [monthlyData, categoryTrend, timePeriod]);

  useEffect(() => {
    const generateTrendInsight = async () => {
      if (!transactions || transactions.length === 0) return;

      setInsightLoading(true);
      try {
        const response = await fetch('/api/ask-assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: `Analisis tren ${timePeriod} bulan terakhir saya. Jelaskan arah tren pengeluaran, tingkat pertumbuhan, dan proyeksi budget bulan depan berdasarkan pola historis.`,
            transactions,
            month,
            year,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          setTrendInsight(result.response);
        }
      } catch (error) {
        console.error('Failed to generate trend insight:', error);
      } finally {
        setInsightLoading(false);
      }
    };

    generateTrendInsight();
  }, [transactions, timePeriod, month, year]);

  // Show error state if fetch failed
  if (screenState.error) {
    return (
      <ErrorState
        title="Gagal memuat tren"
        message={screenState.error.message || 'Terjadi kesalahan saat mengambil data tren keuangan.'}
        onRetry={() => window.location.reload()}
      />
    );
  }

  // Show loading state while fetching data
  if (screenState.isLoading) {
    return <LoadingState count={3} type="chart" />;
  }

  // Show empty state if not enough data
  if (screenState.isEmpty) {
    return (
      <EmptyState
        title="Belum cukup data"
        message="Anda membutuhkan minimal 3 bulan data untuk melihat tren keuangan. Mulai dengan menambahkan transaksi."
        actionLabel="Tambah Transaksi"
        onAction={() => (window.location.href = '/add-transaction')}
      />
    );
  }

  return (
    <motion.div
      initial={prefersReduced ? { opacity: 0 } : pageEnter.initial}
      animate={prefersReduced ? { opacity: 1 } : pageEnter.animate}
      transition={pageEnter.transition}
      className="space-y-6"
    >
      {/* Header */}
      <motion.div
        initial={prefersReduced ? { opacity: 0 } : fadeUp.initial}
        animate={prefersReduced ? { opacity: 1 } : fadeUp.animate}
        transition={fadeUp.transition}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className={cn('text-3xl font-bold flex items-center gap-2', textColorVar('content-primary'))}>
 <TrendingUp className="size-8 " />
              Analisis Tren
            </h1>
            <p className={cn('mt-1', textColorVar('content-tertiary'))}>Pola keuangan Anda dalam periode waktu yang dipilih</p>
          </div>
        </div>
      </motion.div>

      {/* Time Period Toggle */}
      <motion.div
        initial={prefersReduced ? { opacity: 0 } : fadeUp.initial}
        animate={prefersReduced ? { opacity: 1 } : fadeUp.animate}
        transition={fadeUp.transition}
      >
        <div className="flex gap-2">
          {(['3', '6', '12'] as const).map((period) => (
            <Button
              key={period}
              variant={timePeriod === period ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimePeriod(period)}
              className="text-xs"
            >
              {period} Bulan
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Hero Income vs Expense Stacked Area Chart */}
      <motion.div
        initial={prefersReduced ? { opacity: 0 } : fadeUp.initial}
        animate={prefersReduced ? { opacity: 1 } : fadeUp.animate}
        transition={fadeUp.transition}
      >
        <Card className={cn(bgColorVar('bg-card'), borderColorVar('border-neutral'))}>
          <CardHeader>
            <CardTitle className={textColorVar('content-primary')}>Pemasukan vs Pengeluaran</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350} role="img" aria-label={`Tren pemasukan dan pengeluaran dalam ${timePeriod} bulan terakhir`}>
              <AreaChart data={trendData.incomeVsExpense}>
                <CartesianGrid strokeDasharray="3 3" stroke={colorVar('border-neutral')} />
                <XAxis dataKey="month" stroke={colorVar('content-tertiary')} fontSize={11} />
                <YAxis tickFormatter={createCompactAxisFormatter()} stroke={colorVar('content-tertiary')} fontSize={11} />
                <Tooltip
                  formatter={(value: number) => [formatRupiah(value), '']}
                  contentStyle={{
                    backgroundColor: colorVar('bg-elevated'),
                    border: `1px solid ${colorVar('border-neutral')}`,
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="income"
                  name="Pemasukan"
                  stroke={colorVar('sentiment-positive')}
                  fill={colorVar('sentiment-positive')}
                  stackId="1"
                  opacity={0.6}
                  isAnimationActive={!prefersReduced}
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  name="Pengeluaran"
                  stroke={colorVar('sentiment-negative')}
                  fill={colorVar('sentiment-negative')}
                  stackId="1"
                  opacity={0.6}
                  isAnimationActive={!prefersReduced}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Trend Insight */}
      <motion.div
        initial={prefersReduced ? { opacity: 0 } : fadeUp.initial}
        animate={prefersReduced ? { opacity: 1 } : fadeUp.animate}
        transition={fadeUp.transition}
      >
        <ChartInsight
          insight={trendInsight || undefined}
          icon="📈"
          loading={insightLoading}
          error={!insightLoading && !trendInsight}
        />
      </motion.div>

      {/* Category Trend */}
      {trendData.categoryTrendChart.length > 0 && (
        <motion.div
          initial={prefersReduced ? { opacity: 0 } : fadeUp.initial}
          animate={prefersReduced ? { opacity: 1 } : fadeUp.animate}
          transition={fadeUp.transition}
        >
          <Card className={cn(bgColorVar('bg-card'), borderColorVar('border-neutral'))}>
            <CardHeader>
              <CardTitle className={textColorVar('content-primary')}>Tren Kategori (3 Bulan)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300} role="img" aria-label="Tren pengeluaran berdasarkan kategori dalam 3 bulan terakhir">
                <AreaChart data={trendData.categoryTrendChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colorVar('border-neutral')} />
                  <XAxis dataKey="month" stroke={colorVar('content-tertiary')} fontSize={11} />
                  <YAxis tickFormatter={createCompactAxisFormatter()} stroke={colorVar('content-tertiary')} fontSize={11} />
                  <Tooltip
                    formatter={(value: number) => [formatRupiah(value), '']}
                    contentStyle={{
                      backgroundColor: colorVar('bg-elevated'),
                      border: `1px solid ${colorVar('border-neutral')}`,
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  {trendData.categoryTrendChart.length > 0 &&
                    Object.keys(trendData.categoryTrendChart[0])
                      .filter((key) => key !== 'month')
                      .map((category, idx) => {
                        const colors = [colorVar('sentiment-positive'), colorVar('sentiment-warning'), colorVar('sentiment-negative')];
                        return (
                          <Area
                            key={category}
                            type="monotone"
                            dataKey={category}
                            stackId="1"
                            stroke={colors[idx % 3]}
                            fill={colors[idx % 3]}
                            opacity={0.6}
                            name={category}
                            isAnimationActive={!prefersReduced}
                          />
                        );
                      })}
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Savings Growth Trend */}
      <motion.div
        initial={prefersReduced ? { opacity: 0 } : fadeUp.initial}
        animate={prefersReduced ? { opacity: 1 } : fadeUp.animate}
        transition={fadeUp.transition}
      >
        <Card className={cn(bgColorVar('bg-card'), borderColorVar('border-neutral'))}>
          <CardHeader>
            <CardTitle className={textColorVar('content-primary')}>Pertumbuhan Tabungan</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300} role="img" aria-label={`Pertumbuhan tabungan bulanan dan kumulatif dalam ${timePeriod} bulan terakhir`}>
              <BarChart data={trendData.savingsGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke={colorVar('border-neutral')} />
                <XAxis dataKey="month" stroke={colorVar('content-tertiary')} fontSize={11} />
                <YAxis tickFormatter={createCompactAxisFormatter()} stroke={colorVar('content-tertiary')} fontSize={11} />
                <Tooltip
                  formatter={(value: number) => [formatRupiah(value), '']}
                  contentStyle={{
                    backgroundColor: colorVar('bg-elevated'),
                    border: `1px solid ${colorVar('border-neutral')}`,
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar dataKey="savings" fill={colorVar('sentiment-positive')} name="Tabungan Bulan Ini" isAnimationActive={!prefersReduced} />
                <Bar dataKey="cumulative" fill={colorVar('brand-primary')} name="Tabungan Kumulatif" isAnimationActive={!prefersReduced} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
