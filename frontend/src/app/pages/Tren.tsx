import { useMemo } from 'react';
import { motion } from 'motion/react';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, AlertCircle, ArrowUp, ArrowDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { formatRupiah, cn, bgColorVar, textColorVar, borderColorVar, colorVar } from '@/lib/utils';
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
          <Card key={i} className={cn(bgColorVar('bg-card'), borderColorVar('border-neutral'))}>
            <CardContent className="pt-6">
              <div className={cn('h-64 rounded animate-pulse', bgColorVar('bg-neutral'))} />
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
        <h1 className={cn('text-3xl font-bold flex items-center gap-2', textColorVar('content-primary'))}>
          <TrendingUp className="w-8 h-8" />
          Analisis Tren
        </h1>
        <p className={cn('mt-1', textColorVar('content-tertiary'))}>Lihat pola keuangan Anda dalam 6 bulan terakhir</p>
      </motion.div>

      {/* Income vs Expense Trend */}
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
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData.incomeVsExpense}>
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
                <Line type="monotone" dataKey="income" stroke={colorVar('sentiment-positive')} strokeWidth={2} name="Pemasukan" isAnimationActive={!prefersReduced} />
                <Line type="monotone" dataKey="expense" stroke={colorVar('sentiment-negative')} strokeWidth={2} name="Pengeluaran" isAnimationActive={!prefersReduced} />
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
          <Card className={cn(bgColorVar('bg-card'), borderColorVar('border-neutral'))}>
            <CardHeader>
              <CardTitle className={textColorVar('content-primary')}>Tren Kategori (3 Bulan)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
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
            <ResponsiveContainer width="100%" height={300}>
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
