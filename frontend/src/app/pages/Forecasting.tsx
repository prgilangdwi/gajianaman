import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'motion/react';
import { useMonthFilter } from '@/hooks/useMonthFilter';
import { useAuth } from '@/hooks/useAuth';
import { useExpenseForecastingWithHistory } from '@/hooks/data/useExpenseForecastingWithHistory';
import { useWeeklyForecasting } from '@/hooks/data/useWeeklyForecasting';
import { useBudgets } from '@/hooks/useBudgets';
import { formatRupiah } from '@/lib/utils';
import { createCompactAxisFormatter } from '@/lib/chartFormatters';
import { Progress } from '../components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { pageEnter, fadeUp, useReducedMotion } from '@/lib/transitions';

const categoryEmojis: Record<string, string> = {
  'Food & Dining': '🍔',
  'Transport': '🚗',
  'Groceries': '🛒',
  'Shopping': '🛍️',
  'Bills & Utilities': '📱',
  'Health': '🏥',
  'Entertainment': '🎬',
  'Education': '📚',
};

function getCategoryEmoji(name: string) {
  return categoryEmojis[name] || '📦';
}

function calculateVolatility(values: number[]): 'Low' | 'Medium' | 'High' {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  const cv = mean > 0 ? stdDev / mean : 0;

  if (cv < 0.15) return 'Low';
  if (cv < 0.35) return 'Medium';
  return 'High';
}

function getTrendArrow(trend: 'up' | 'down' | 'stable'): { icon: React.ReactNode; color: string; label: string } {
  switch (trend) {
    case 'up':
      return { icon: <TrendingUp className="w-4 h-4" />, color: 'text-red-500', label: '↑' };
    case 'down':
      return { icon: <TrendingDown className="w-4 h-4" />, color: 'text-green-500', label: '↓' };
    case 'stable':
      return { icon: <Minus className="w-4 h-4" />, color: 'text-gray-500', label: '→' };
  }
}

export default function Forecasting() {
  const { user } = useAuth();
  const { month, year } = useMonthFilter();
  const { budgets = [] } = useBudgets(month, year);
  const { forecast, isLoading: forecastLoading } = useExpenseForecastingWithHistory(month, year);
  const [forecastMode, setForecastMode] = useState<'monthly' | 'weekly'>('monthly');
  const [selectedWeek, setSelectedWeek] = useState(1);
  const { forecast: weeklyForecast, isLoading: weeklyLoading } = useWeeklyForecasting(selectedWeek, month, year);
  const prefersReduced = useReducedMotion();

  const isLoading = forecastMode === 'monthly' ? forecastLoading : weeklyLoading;
  const hasData = forecastMode === 'monthly' ? forecast : weeklyForecast;

  if (isLoading) {
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
              <div className="h-32 bg-[var(--color-bg-neutral)] rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </motion.div>
    );
  }

  if (!hasData) {
    return (
      <motion.div
        initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex flex-col items-center justify-center py-20 gap-4"
      >
        <AlertCircle className="w-12 h-12 text-[var(--color-sentiment-warning)]" />
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold text-[var(--color-content-primary)]">Data tidak cukup</p>
          <p className="text-sm text-[var(--color-content-tertiary)] max-w-xs">
            Prakiraan memerlukan minimal 3 bulan data historis. Terus catat pengeluaran untuk mendapatkan prakiraan yang akurat.
          </p>
        </div>
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
      {/* Tab Switcher */}
      <Tabs value={forecastMode} onValueChange={(value) => setForecastMode(value as 'monthly' | 'weekly')}>
        <TabsList className="grid w-full grid-cols-2 bg-[var(--color-bg-neutral)]">
          <TabsTrigger value="monthly" className="data-[state=active]:bg-[var(--color-brand-primary)]">Bulanan</TabsTrigger>
          <TabsTrigger value="weekly" className="data-[state=active]:bg-[var(--color-brand-primary)]">Mingguan</TabsTrigger>
        </TabsList>

        {/* Monthly View */}
        <TabsContent value="monthly" className="space-y-6">
          {forecast && renderMonthlyView(forecast, budgets)}
        </TabsContent>

        {/* Weekly View */}
        <TabsContent value="weekly" className="space-y-6">
          {weeklyForecast && (
            <>
              {/* Week Selector */}
              <motion.div
                initial={prefersReduced ? { opacity: 0 } : fadeUp.initial}
                animate={prefersReduced ? { opacity: 1 } : fadeUp.animate}
                transition={fadeUp.transition}
                className="flex gap-2"
              >
                {[1, 2, 3, 4].map((week) => (
                  <button
                    key={week}
                    onClick={() => setSelectedWeek(week)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      selectedWeek === week
                        ? 'bg-[var(--color-brand-primary)] text-[var(--color-brand-primary-fg)]'
                        : 'bg-[var(--color-bg-neutral)] text-[var(--color-content-secondary)] hover:bg-[var(--color-border-neutral)]'
                    }`}
                  >
                    Minggu {week}
                  </button>
                ))}
              </motion.div>

              {renderWeeklyView(weeklyForecast, budgets)}
            </>
          )}
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

function renderMonthlyView(forecast: any, budgets: any[]) {
  const lastMonthTotal = forecast.categoryForecasts.reduce((sum: any, cat: any) => sum + cat.historical[0], 0);
  const selisih = forecast.nextMonthForecast - lastMonthTotal;
  const selisihPercent = lastMonthTotal > 0 ? (selisih / lastMonthTotal) * 100 : 0;

  const currentPacing = forecast.currentPacing;
  const burnRatePercent = currentPacing ? (currentPacing.percentMonthComplete) : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-[var(--color-bg-card)] border-[var(--color-border-neutral)]">
          <CardContent className="pt-6">
            <p className="text-xs text-[var(--color-content-tertiary)] font-medium">Total Prakiraan Bulan Ini</p>
            <p className="text-2xl font-bold font-mono text-[var(--color-content-primary)] mt-2">{formatRupiah(forecast.nextMonthForecast)}</p>
          </CardContent>
        </Card>
        <Card className="bg-[var(--color-bg-card)] border-[var(--color-border-neutral)]">
          <CardContent className="pt-6">
            <p className="text-xs text-[var(--color-content-tertiary)] font-medium">Bulan Lalu</p>
            <p className="text-2xl font-bold font-mono text-[var(--color-content-primary)] mt-2">{formatRupiah(lastMonthTotal)}</p>
          </CardContent>
        </Card>
        <Card className="bg-[var(--color-bg-card)] border-[var(--color-border-neutral)]">
          <CardContent className="pt-6">
            <p className="text-xs text-[var(--color-content-tertiary)] font-medium">Selisih</p>
            <p className={`text-2xl font-bold font-mono mt-2 flex items-center gap-2 ${selisih > 0 ? 'text-[var(--color-sentiment-negative)]' : 'text-[var(--color-sentiment-positive)]'}`}>
              {selisih > 0 ? '+' : ''}{formatRupiah(Math.abs(selisih))}
              {selisih > 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            </p>
            <p className="text-xs text-[var(--color-content-tertiary)] mt-1">{selisihPercent > 0 ? '+' : ''}{Math.round(selisihPercent)}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Current Pacing Indicator */}
      {currentPacing && (
        <Card className="bg-[var(--color-bg-card)] border-[var(--color-border-neutral)]">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-[var(--color-content-primary)]">Pacing Bulan Ini</p>
                <p className="text-xs font-mono text-[var(--color-content-tertiary)]">{currentPacing.daysPassed}/{currentPacing.daysInMonth} hari ({Math.round(burnRatePercent)}%)</p>
              </div>
              <Progress value={Math.min(burnRatePercent, 100)} className="h-2" />
              <div className="flex items-center justify-between text-xs text-[var(--color-content-tertiary)]">
                <span>Rate: {formatRupiah(Math.round(currentPacing.currentDailyRate))}/hari</span>
                <span>{currentPacing.onTrack ? '✅ On Track' : '⚠️ Ahead of pace'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Cards */}
      <div className="grid gap-4">
        {forecast.categoryForecasts.map((cat) => {
          const volatility = calculateVolatility(cat.historical);
          const trend = getTrendArrow(cat.trend);
          const avgHistorical = cat.historical.reduce((a, b) => a + b, 0) / cat.historical.length;
          const budgetForCategory = budgets.find((b) => b.category === cat.category);
          const budgetAmount = budgetForCategory?.amount || 0;
          const budgetPercent = budgetAmount > 0 ? (cat.predicted / budgetAmount) * 100 : 0;

          const volatilityColor =
            volatility === 'Low' ? 'bg-[var(--color-sentiment-positive)] text-white' :
            volatility === 'Medium' ? 'bg-[var(--color-sentiment-warning)] text-white' :
            'bg-[var(--color-sentiment-negative)] text-white';

          return (
            <Card key={cat.category} className="bg-[var(--color-bg-card)] border-[var(--color-border-neutral)]">
              <CardContent className="pt-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getCategoryEmoji(cat.category)}</span>
                    <span className="font-semibold text-[var(--color-content-primary)]">{cat.category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs ${volatilityColor}`}>
                      {volatility}
                    </Badge>
                    <div className={`flex items-center gap-1 ${trend.color}`}>
                      {trend.icon}
                    </div>
                  </div>
                </div>

                {/* Three Data Points */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-[var(--color-content-tertiary)] font-medium">Bulan Lalu</p>
                    <p className="text-lg font-bold font-mono text-[var(--color-content-primary)] mt-1">{formatRupiah(cat.historical[0])}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-content-tertiary)] font-medium">Rata-rata 3 Bln</p>
                    <p className="text-lg font-bold font-mono text-[var(--color-content-primary)] mt-1">{formatRupiah(Math.round(avgHistorical))}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-content-tertiary)] font-medium">Prakiraan Bln Ini</p>
                    <p className="text-lg font-bold font-mono text-[var(--color-content-primary)] mt-1">{formatRupiah(cat.predicted)}</p>
                  </div>
                </div>

                {/* Budget Progress Bar */}
                {budgetForCategory && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--color-content-tertiary)]">Budget Progress</span>
                      <span className="text-xs font-medium text-[var(--color-content-secondary)]">{Math.round(budgetPercent)}% dari budget</span>
                    </div>
                    <Progress value={Math.min(budgetPercent, 100)} className="h-2" />
                  </div>
                )}

                {/* Sparkline Chart */}
                <div className="mt-4 pt-4 border-t border-[var(--color-border-neutral)]">
                  <ResponsiveContainer width="100%" height={50}>
                    <LineChart data={[
                      { name: '3 bln lalu', value: cat.historical[2] },
                      { name: '2 bln lalu', value: cat.historical[1] },
                      { name: '1 bln lalu', value: cat.historical[0] },
                      { name: 'Prakiraan', value: cat.predicted },
                    ]}>
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="var(--color-brand-primary)"
                        dot={false}
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Info Box */}
      <Card className="bg-[var(--color-bg-elevated)] border-[var(--color-border-neutral)]">
        <CardContent className="pt-6">
          <p className="text-sm text-[var(--color-content-secondary)]">
            <strong>💡 Tips:</strong> Prakiraan ini berdasarkan pola 3 bulan terakhir. Badge volatilitas menunjukkan konsistensi pengeluaran. Semakin konsisten, semakin akurat prakiraan.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function renderWeeklyView(forecast: any, budgets: any[]) {
  const variance = forecast.predictedTotal - forecast.lastWeekTotal;
  const variancePercent = forecast.lastWeekTotal > 0 ? (variance / forecast.lastWeekTotal) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-[var(--color-bg-card)] border-[var(--color-border-neutral)]">
          <CardContent className="pt-6">
            <p className="text-xs text-[var(--color-content-tertiary)] font-medium">Prakiraan Minggu Ini</p>
            <p className="text-2xl font-bold font-mono text-[var(--color-content-primary)] mt-2">{formatRupiah(forecast.predictedTotal)}</p>
          </CardContent>
        </Card>
        <Card className="bg-[var(--color-bg-card)] border-[var(--color-border-neutral)]">
          <CardContent className="pt-6">
            <p className="text-xs text-[var(--color-content-tertiary)] font-medium">Minggu Lalu</p>
            <p className="text-2xl font-bold font-mono text-[var(--color-content-primary)] mt-2">{formatRupiah(forecast.lastWeekTotal)}</p>
          </CardContent>
        </Card>
        <Card className="bg-[var(--color-bg-card)] border-[var(--color-border-neutral)]">
          <CardContent className="pt-6">
            <p className="text-xs text-[var(--color-content-tertiary)] font-medium">Selisih</p>
            <p className={`text-2xl font-bold font-mono mt-2 flex items-center gap-2 ${variance > 0 ? 'text-[var(--color-sentiment-negative)]' : 'text-[var(--color-sentiment-positive)]'}`}>
              {variance > 0 ? '+' : ''}{formatRupiah(Math.abs(variance))}
              {variance > 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            </p>
            <p className="text-xs text-[var(--color-content-tertiary)] mt-1">{variancePercent > 0 ? '+' : ''}{Math.round(variancePercent)}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Breakdown Chart */}
      <Card className="bg-[var(--color-bg-card)] border-[var(--color-border-neutral)]">
        <CardHeader>
          <CardTitle className="text-[var(--color-content-primary)]">Pengeluaran per Hari</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={forecast.dailyBreakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-neutral)" />
              <XAxis dataKey="day" stroke="var(--color-content-tertiary)" fontSize={11} />
              <YAxis tickFormatter={createCompactAxisFormatter()} stroke="var(--color-content-tertiary)" fontSize={11} />
              <Tooltip
                formatter={(value: number) => [formatRupiah(value), '']}
                contentStyle={{
                  backgroundColor: 'var(--color-bg-elevated)',
                  border: '1px solid var(--color-border-neutral)',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="total" fill="var(--color-sentiment-negative)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <div className="grid gap-4">
        {forecast.categoryForecasts.map((cat: any) => (
          <Card key={cat.category} className="bg-[var(--color-bg-card)] border-[var(--color-border-neutral)]">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getCategoryEmoji(cat.category)}</span>
                  <span className="font-semibold text-[var(--color-content-primary)]">{cat.category}</span>
                </div>
                <div className={`flex items-center gap-1 ${
                  cat.trend === 'up' ? 'text-[var(--color-sentiment-negative)]' :
                  cat.trend === 'down' ? 'text-[var(--color-sentiment-positive)]' :
                  'text-[var(--color-content-tertiary)]'
                }`}>
                  {cat.trend === 'up' && <TrendingUp className="w-4 h-4" />}
                  {cat.trend === 'down' && <TrendingDown className="w-4 h-4" />}
                  {cat.trend === 'stable' && <Minus className="w-4 h-4" />}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-[var(--color-content-tertiary)] font-medium">Minggu Lalu</p>
                  <p className="text-lg font-bold font-mono text-[var(--color-content-primary)] mt-1">{formatRupiah(cat.lastWeekAvg)}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--color-content-tertiary)] font-medium">Prakiraan Minggu Ini</p>
                  <p className="text-lg font-bold font-mono text-[var(--color-content-primary)] mt-1">{formatRupiah(cat.predicted)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Insights */}
      {forecast.insights.length > 0 && (
        <Card className="bg-[var(--color-bg-elevated)] border-[var(--color-border-neutral)]">
          <CardContent className="pt-6">
            <div className="space-y-2">
              {forecast.insights.map((insight: string, idx: number) => (
                <p key={idx} className="text-sm text-[var(--color-content-secondary)]">
                  {insight}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
