import { useMemo } from 'react';
import { motion } from 'motion/react';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, AlertCircle, ArrowUp, ArrowDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { formatRupiah, cn, bgColorVar, textColorVar, borderColorVar } from '@/lib/utils';
import { createCompactAxisFormatter } from '@/lib/chartFormatters';
import { useMonthFilter } from '@/hooks/useMonthFilter';
import { useAuth } from '@/hooks/useAuth';
import { useLaporanData } from '@/hooks/data/useLaporanData';
import { pageEnter, fadeUp, useReducedMotion } from '@/lib/transitions';
import type { MonthlyPoint } from '@/hooks/data/useLaporanData';

export default function Tren() {
  const { user } = useAuth();
  const { month, year } = useMonthFilter();
  const { monthlyData, categoryTrend, isLoading } = useLaporanData(user?.userId);
  const prefersReduced = useReducedMotion();

  const trendData = useMemo(() => {
    if (!monthlyData || monthlyData.length === 0) return null;

    const incomeVsExpense = monthlyData.map((d: MonthlyPoint) => ({
      month: d.month,
      income: d.income,
      expense: d.expenses,
    }));

    const savingsGrowth = monthlyData.map((d: MonthlyPoint, idx: number) => {
      const savings = d.income - d.expenses;
      const cumulative = monthlyData
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
  }, [monthlyData, categoryTrend]);

  if (isLoading || !trendData) {
    return (
      <motion.div
        initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="space-y-6"
      >
        {[0, 1, 2].map((i) => (
          <Card key={i} className="bg-[var(--color-bg-card)] border-[var(--color-border-neutral)]">
            <CardContent className="pt-6">
              <div className="h-64 bg-[var(--color-bg-neutral)] rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </motion.div>
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
        <h1 className="text-3xl font-bold flex items-center gap-2 text-[var(--color-content-primary)]">
          <TrendingUp className="w-8 h-8" />
          Analisis Tren
        </h1>
        <p className="text-[var(--color-content-tertiary)] mt-1">Lihat pola keuangan Anda dalam 6 bulan terakhir</p>
      </motion.div>

      {/* Income vs Expense Trend */}
      <motion.div
        initial={prefersReduced ? { opacity: 0 } : fadeUp.initial}
        animate={prefersReduced ? { opacity: 1 } : fadeUp.animate}
        transition={fadeUp.transition}
      >
        <Card className="bg-[var(--color-bg-card)] border-[var(--color-border-neutral)]">
          <CardHeader>
            <CardTitle className="text-[var(--color-content-primary)]">Pemasukan vs Pengeluaran</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData.incomeVsExpense}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-neutral)" />
                <XAxis dataKey="month" stroke="var(--color-content-tertiary)" fontSize={11} />
                <YAxis tickFormatter={createCompactAxisFormatter()} stroke="var(--color-content-tertiary)" fontSize={11} />
                <Tooltip
                  formatter={(value: number) => [formatRupiah(value), '']}
                  contentStyle={{
                    backgroundColor: 'var(--color-bg-elevated)',
                    border: '1px solid var(--color-border-neutral)',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="income" stroke="var(--color-sentiment-positive)" strokeWidth={2} name="Pemasukan" isAnimationActive={!prefersReduced} />
                <Line type="monotone" dataKey="expense" stroke="var(--color-sentiment-negative)" strokeWidth={2} name="Pengeluaran" isAnimationActive={!prefersReduced} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Category Trend */}
      {trendData.categoryTrendChart.length > 0 && (
        <motion.div
          initial={prefersReduced ? { opacity: 0 } : fadeUp.initial}
          animate={prefersReduced ? { opacity: 1 } : fadeUp.animate}
          transition={fadeUp.transition}
        >
          <Card className="bg-[var(--color-bg-card)] border-[var(--color-border-neutral)]">
            <CardHeader>
              <CardTitle className="text-[var(--color-content-primary)]">Tren Kategori (3 Bulan)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={trendData.categoryTrendChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-neutral)" />
                  <XAxis dataKey="month" stroke="var(--color-content-tertiary)" fontSize={11} />
                  <YAxis tickFormatter={createCompactAxisFormatter()} stroke="var(--color-content-tertiary)" fontSize={11} />
                  <Tooltip
                    formatter={(value: number) => [formatRupiah(value), '']}
                    contentStyle={{
                      backgroundColor: 'var(--color-bg-elevated)',
                      border: '1px solid var(--color-border-neutral)',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  {trendData.categoryTrendChart.length > 0 &&
                    Object.keys(trendData.categoryTrendChart[0])
                      .filter((key) => key !== 'month')
                      .map((category, idx) => (
                        <Area
                          key={category}
                          type="monotone"
                          dataKey={category}
                          stackId="1"
                          stroke={['var(--color-sentiment-positive)', 'var(--color-sentiment-warning)', 'var(--color-sentiment-negative)'][idx % 3]}
                          fill={['var(--color-sentiment-positive)', 'var(--color-sentiment-warning)', 'var(--color-sentiment-negative)'][idx % 3]}
                          opacity={0.6}
                          name={category}
                          isAnimationActive={!prefersReduced}
                        />
                      ))}
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
        <Card className="bg-[var(--color-bg-card)] border-[var(--color-border-neutral)]">
          <CardHeader>
            <CardTitle className="text-[var(--color-content-primary)]">Pertumbuhan Tabungan</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trendData.savingsGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-neutral)" />
                <XAxis dataKey="month" stroke="var(--color-content-tertiary)" fontSize={11} />
                <YAxis tickFormatter={createCompactAxisFormatter()} stroke="var(--color-content-tertiary)" fontSize={11} />
                <Tooltip
                  formatter={(value: number) => [formatRupiah(value), '']}
                  contentStyle={{
                    backgroundColor: 'var(--color-bg-elevated)',
                    border: '1px solid var(--color-border-neutral)',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar dataKey="savings" fill="var(--color-sentiment-positive)" name="Tabungan Bulan Ini" isAnimationActive={!prefersReduced} />
                <Bar dataKey="cumulative" fill="var(--color-brand-primary)" name="Tabungan Kumulatif" isAnimationActive={!prefersReduced} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
