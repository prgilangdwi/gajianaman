import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Minus, AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useMonthFilter } from '@/hooks/useMonthFilter';
import { useAuth } from '@/hooks/useAuth';
import { useExpenseForecastingWithHistory } from '@/hooks/data/useExpenseForecastingWithHistory';
import { useWeeklyForecasting } from '@/hooks/data/useWeeklyForecasting';
import { useBudgets } from '@/hooks/useBudgets';
import { useTransactions } from '@/hooks/useTransactions';
import ChartInsight from '../components/ChartInsight';
import { cn, formatRupiah, bgColorVar, textColorVar, borderColorVar, colorVar } from '@/lib/utils';
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

function getTrendArrow(trend: 'up' | 'down' | 'stable'): { icon: React.ReactNode; colorClass: string; label: string } {
  switch (trend) {
    case 'up':
 return { icon: <TrendingUp className="size-4 " />, colorClass: textColorVar('sentiment-negative'), label: '↑' };
    case 'down':
 return { icon: <TrendingDown className="size-4 " />, colorClass: textColorVar('sentiment-positive'), label: '↓' };
    case 'stable':
 return { icon: <Minus className="size-4 " />, colorClass: textColorVar('content-tertiary'), label: '→' };
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
  const { transactions = [] } = useTransactions(month, year);
  const [forecastInsight, setForecastInsight] = useState<string>('');
  const [insightLoading, setInsightLoading] = useState(true);

  useEffect(() => {
    if (transactions.length === 0) {
      setInsightLoading(false);
      return;
    }
    const totalExpense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    const avgMonthly = Math.round(totalExpense / 3);

    const fetchInsight = async () => {
      try {
        const response = await fetch('/api/ask-assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: `Pengguna memiliki rata-rata pengeluaran sekitar Rp ${avgMonthly.toLocaleString('id-ID')}/bulan. Berdasarkan tren ini, berikan analisis singkat dan 1-2 saran praktis untuk mengoptimalkan keuangan bulan depan. Jawab dalam 2-3 kalimat dalam Bahasa Indonesia.`,
            transactions: transactions.map(t => ({
              amount: t.amount,
              type: t.type,
              category: t.category,
              date: t.date,
            })),
            month,
            year,
          }),
          signal: AbortSignal.timeout(5000),
        });
        const data = await response.json();
        setForecastInsight(data.response ?? '');
      } catch {
        setForecastInsight('');
      } finally {
        setInsightLoading(false);
      }
    };
    fetchInsight();
  }, [transactions, month, year]);

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
          <Card key={i} className={`${bgColorVar('bg-card')} ${borderColorVar('border-neutral')}`}>
            <CardContent className="pt-6">
              <div className={`h-32 rounded animate-pulse ${bgColorVar('bg-neutral')}`} />
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
 <AlertCircle className={`size-12 ${textColorVar('sentiment-warning')}`} />
        <div className="text-center space-y-2">
          <p className={`text-lg font-semibold ${textColorVar('content-primary')}`}>Data tidak cukup</p>
          <p className={`text-sm ${textColorVar('content-tertiary')} max-w-xs`}>
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
        <TabsList className={`grid w-full grid-cols-2 ${bgColorVar('bg-neutral')}`}>
          <TabsTrigger value="monthly" className={`data-[state=active]:${bgColorVar('bg-brand-primary')}`}>Bulanan</TabsTrigger>
          <TabsTrigger value="weekly" className={`data-[state=active]:${bgColorVar('bg-brand-primary')}`}>Mingguan</TabsTrigger>
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
                    type="button"
                    key={week}
                    onClick={() => setSelectedWeek(week)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      selectedWeek === week
                        ? `${bgColorVar('bg-brand-primary')} text-white`
                        : `${bgColorVar('bg-neutral')} ${textColorVar('content-secondary')} hover:${borderColorVar('border-neutral')}`
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

      <ChartInsight
        insight={forecastInsight}
        icon="🔮"
        loading={insightLoading}
        error={!insightLoading && !forecastInsight}
      />
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
      {/* Methodology Explanation */}
      <Card className={`${bgColorVar('bg-elevated')} ${borderColorVar('border-neutral')} border-l-4 border-l-brand-primary`}>
        <CardContent className="pt-6">
          <p className={`text-sm font-semibold ${textColorVar('content-primary')} mb-2`}>💡 Cara Kerja Prakiraan</p>
          <p className={`text-xs ${textColorVar('content-secondary')} mb-2`}>
            Prakiraan ini menganalisis pola pengeluaran Anda dari 3 bulan terakhir menggunakan rata-rata bergerak (moving average) dan trend analysis. Semakin konsisten pola pengeluaran, semakin akurat prakiraan.
          </p>
          <p className={`text-xs ${textColorVar('content-tertiary')}`}>
            <strong>Badge Volatilitas:</strong> Menunjukkan seberapa stabil pengeluaran kategori — Low (stabil) memberikan prakiraan yang lebih dapat diandalkan.
          </p>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className={`${bgColorVar('bg-card')} ${borderColorVar('border-neutral')}`}>
          <CardContent className="pt-6">
            <p className={`text-xs ${textColorVar('content-tertiary')} font-medium`}>Total Prakiraan Bulan Ini</p>
            <p className={`text-2xl font-bold font-mono ${textColorVar('content-primary')} mt-2`}>{formatRupiah(forecast.nextMonthForecast)}</p>
          </CardContent>
        </Card>
        <Card className={`${bgColorVar('bg-card')} ${borderColorVar('border-neutral')}`}>
          <CardContent className="pt-6">
            <p className={`text-xs ${textColorVar('content-tertiary')} font-medium`}>Bulan Lalu</p>
            <p className={`text-2xl font-bold font-mono ${textColorVar('content-primary')} mt-2`}>{formatRupiah(lastMonthTotal)}</p>
          </CardContent>
        </Card>
        <Card className={`${bgColorVar('bg-card')} ${borderColorVar('border-neutral')}`}>
          <CardContent className="pt-6">
            <p className={`text-xs ${textColorVar('content-tertiary')} font-medium`}>Selisih</p>
            <p className={`text-2xl font-bold font-mono mt-2 flex items-center gap-2 ${selisih > 0 ? textColorVar('sentiment-negative') : textColorVar('sentiment-positive')}`}>
              {selisih > 0 ? '+' : ''}{formatRupiah(Math.abs(selisih))}
 {selisih > 0 ? <TrendingUp className="size-5 " /> : <TrendingDown className="size-5 " />}
            </p>
            <p className={`text-xs ${textColorVar('content-tertiary')} mt-1`}>{selisihPercent > 0 ? '+' : ''}{Math.round(selisihPercent)}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Current Pacing Indicator + Budget Alert */}
      {currentPacing && (
        <Card className={`${bgColorVar('bg-card')} ${borderColorVar('border-neutral')} ${currentPacing.onTrack ? '' : 'border-l-4 border-l-sentiment-warning'}`}>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className={`text-sm font-medium ${textColorVar('content-primary')}`}>Pacing Bulan Ini</p>
                <p className={`text-xs font-mono ${textColorVar('content-tertiary')}`}>{currentPacing.daysPassed}/{currentPacing.daysInMonth} hari ({Math.round(burnRatePercent)}%)</p>
              </div>
              <Progress value={Math.min(burnRatePercent, 100)} className="h-2" />
              <div className="flex items-center justify-between text-xs">
                <span className={textColorVar('content-tertiary')}>Rate: {formatRupiah(Math.round(currentPacing.currentDailyRate))}/hari</span>
                <span className={currentPacing.onTrack ? textColorVar('sentiment-positive') : textColorVar('sentiment-warning')}>
                  {currentPacing.onTrack ? '✅ On Track' : '⚠️ Ahead of pace'}
                </span>
              </div>
              {!currentPacing.onTrack && (
                <div className={`p-2 rounded-lg ${bgColorVar('bg-screen')} border ${borderColorVar('border-neutral')}`}>
                  <p className={`text-xs ${textColorVar('content-secondary')}`}>
 <AlertTriangle className="size-3 inline mr-1" />
                    Pengeluaran Anda mencapai {Math.round(burnRatePercent)}% dari anggaran bulanan. Pertimbangkan untuk mengurangi pengeluaran jika ingin tetap sesuai target.
                  </p>
                </div>
              )}
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
            volatility === 'Low' ? `${bgColorVar('sentiment-positive')} text-white` :
            volatility === 'Medium' ? `${bgColorVar('sentiment-warning')} text-white` :
            `${bgColorVar('sentiment-negative')} text-white`;

          return (
            <Card key={cat.category} className={`${bgColorVar('bg-card')} ${borderColorVar('border-neutral')}`}>
              <CardContent className="pt-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getCategoryEmoji(cat.category)}</span>
                    <div>
                      <span className={`font-semibold ${textColorVar('content-primary')} block`}>{cat.category}</span>
                      <p className={`text-xs ${textColorVar('content-tertiary')} mt-0.5`}>
                        {volatility === 'Low' ? 'Pengeluaran sangat konsisten' : volatility === 'Medium' ? 'Pengeluaran cukup variabel' : 'Pengeluaran sangat berfluktuasi'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs ${volatilityColor}`}>
                      {volatility}
                    </Badge>
                    <div className={`flex items-center gap-1 ${trend.colorClass}`}>
                      {trend.icon}
                    </div>
                  </div>
                </div>

                {/* Three Data Points */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className={`text-xs ${textColorVar('content-tertiary')} font-medium`}>Bulan Lalu</p>
                    <p className={`text-lg font-bold font-mono ${textColorVar('content-primary')} mt-1`}>{formatRupiah(cat.historical[0])}</p>
                  </div>
                  <div>
                    <p className={`text-xs ${textColorVar('content-tertiary')} font-medium`}>Rata-rata 3 Bln</p>
                    <p className={`text-lg font-bold font-mono ${textColorVar('content-primary')} mt-1`}>{formatRupiah(Math.round(avgHistorical))}</p>
                  </div>
                  <div>
                    <p className={`text-xs ${textColorVar('content-tertiary')} font-medium`}>Prakiraan Bln Ini</p>
                    <p className={`text-lg font-bold font-mono ${textColorVar('content-primary')} mt-1`}>{formatRupiah(cat.predicted)}</p>
                  </div>
                </div>

                {/* Budget Alert */}
                {budgetForCategory && budgetPercent > 100 && (
                  <div className={`p-3 rounded-lg mb-4 ${bgColorVar('bg-screen')} border ${borderColorVar('border-neutral')}`}>
                    <p className={`text-xs font-semibold ${textColorVar('sentiment-negative')} flex items-center gap-1`}>
 <AlertTriangle className="size-3 " /> Prakiraan melampaui budget sebesar {Math.round(budgetPercent - 100)}%
                    </p>
                  </div>
                )}

                {/* Budget Progress Bar */}
                {budgetForCategory && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs ${textColorVar('content-tertiary')}`}>Budget Progress</span>
                      <span className={`text-xs font-medium ${budgetPercent > 100 ? textColorVar('sentiment-negative') : textColorVar('content-secondary')}`}>{Math.round(budgetPercent)}% dari budget</span>
                    </div>
                    <Progress value={Math.min(budgetPercent, 100)} className="h-2" />
                  </div>
                )}

                {/* Sparkline Chart with Accessibility */}
                <div className={`mt-4 pt-4 border-t ${borderColorVar('border-neutral')}`}>
                  <div role="img" aria-label={`Trend historis 3 bulan untuk ${cat.category}: dari ${formatRupiah(cat.historical[2])} menjadi prakiraan ${formatRupiah(cat.predicted)}`}>
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
                        stroke={colorVar('brand-primary')}
                        dot={false}
                        strokeWidth={2}
                      />
                    </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Info Box */}
      <Card className={cn(bgColorVar('bg-elevated'), borderColorVar('border-neutral'))}>
        <CardContent className="pt-6">
          <p className={cn('text-sm', textColorVar('content-secondary'))}>
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
        <Card className={cn(bgColorVar('bg-card'), borderColorVar('border-neutral'))}>
          <CardContent className="pt-6">
            <p className={cn('text-xs font-medium', textColorVar('content-tertiary'))}>Prakiraan Minggu Ini</p>
            <p className={cn('text-2xl font-bold font-mono mt-2', textColorVar('content-primary'))}>{formatRupiah(forecast.predictedTotal)}</p>
          </CardContent>
        </Card>
        <Card className={cn(bgColorVar('bg-card'), borderColorVar('border-neutral'))}>
          <CardContent className="pt-6">
            <p className={cn('text-xs font-medium', textColorVar('content-tertiary'))}>Minggu Lalu</p>
            <p className={cn('text-2xl font-bold font-mono mt-2', textColorVar('content-primary'))}>{formatRupiah(forecast.lastWeekTotal)}</p>
          </CardContent>
        </Card>
        <Card className={cn(bgColorVar('bg-card'), borderColorVar('border-neutral'))}>
          <CardContent className="pt-6">
            <p className={cn('text-xs font-medium', textColorVar('content-tertiary'))}>Selisih</p>
            <p className={cn('text-2xl font-bold font-mono mt-2 flex items-center gap-2', variance > 0 ? textColorVar('sentiment-negative') : textColorVar('sentiment-positive'))}>
              {variance > 0 ? '+' : ''}{formatRupiah(Math.abs(variance))}
 {variance > 0 ? <TrendingUp className="size-5 " /> : <TrendingDown className="size-5 " />}
            </p>
            <p className={cn('text-xs mt-1', textColorVar('content-tertiary'))}>{variancePercent > 0 ? '+' : ''}{Math.round(variancePercent)}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Breakdown Chart */}
      <Card className={cn(bgColorVar('bg-card'), borderColorVar('border-neutral'))}>
        <CardHeader>
          <CardTitle className={textColorVar('content-primary')}>Pengeluaran per Hari</CardTitle>
        </CardHeader>
        <CardContent>
          <div role="img" aria-label="Prakiraan pengeluaran harian minggu ini">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={forecast.dailyBreakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke={colorVar('border-neutral')} />
              <XAxis dataKey="day" stroke={colorVar('content-tertiary')} fontSize={11} />
              <YAxis tickFormatter={createCompactAxisFormatter()} stroke={colorVar('content-tertiary')} fontSize={11} />
              <Tooltip
                formatter={(value: number) => [formatRupiah(value), '']}
                contentStyle={{
                  backgroundColor: colorVar('bg-elevated'),
                  border: `1px solid ${colorVar('border-neutral')}`,
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="total" fill={colorVar('sentiment-negative')} />
            </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <div className="grid gap-4">
        {forecast.categoryForecasts.map((cat: any) => (
          <Card key={cat.category} className={cn(bgColorVar('bg-card'), borderColorVar('border-neutral'))}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getCategoryEmoji(cat.category)}</span>
                  <span className={cn('font-semibold', textColorVar('content-primary'))}>{cat.category}</span>
                </div>
                <div className={cn('flex items-center gap-1',
                  cat.trend === 'up' ? textColorVar('sentiment-negative') :
                  cat.trend === 'down' ? textColorVar('sentiment-positive') :
                  textColorVar('content-tertiary')
                )}>
 {cat.trend === 'up' && <TrendingUp className="size-4 " />}
 {cat.trend === 'down' && <TrendingDown className="size-4 " />}
 {cat.trend === 'stable' && <Minus className="size-4 " />}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className={cn('text-xs font-medium', textColorVar('content-tertiary'))}>Minggu Lalu</p>
                  <p className={cn('text-lg font-bold font-mono mt-1', textColorVar('content-primary'))}>{formatRupiah(cat.lastWeekAvg)}</p>
                </div>
                <div>
                  <p className={cn('text-xs font-medium', textColorVar('content-tertiary'))}>Prakiraan Minggu Ini</p>
                  <p className={cn('text-lg font-bold font-mono mt-1', textColorVar('content-primary'))}>{formatRupiah(cat.predicted)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Insights */}
      {forecast.insights.length > 0 && (
        <Card className={cn(bgColorVar('bg-elevated'), borderColorVar('border-neutral'))}>
          <CardContent className="pt-6">
            <div className="space-y-2">
              {forecast.insights.map((insight: string, idx: number) => (
                <p key={idx} className={cn('text-sm', textColorVar('content-secondary'))}>
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
