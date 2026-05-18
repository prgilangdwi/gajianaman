import { LineChart, Line, BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useState } from 'react';
import { useMonthFilter } from '@/hooks/useMonthFilter';
import { useExpenseForecastingWithHistory } from '@/hooks/data/useExpenseForecastingWithHistory';
import { useWeeklyForecasting } from '@/hooks/data/useWeeklyForecasting';
import { useBudgets } from '@/hooks/useBudgets';
import { formatRupiah } from '@/lib/utils';
import { createCompactAxisFormatter } from '@/lib/chartFormatters';
import { Progress } from '../components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import type { CSSProperties } from 'react';

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
  const { month, year } = useMonthFilter();
  const { budgets = [] } = useBudgets(month, year);
  const { forecast, isLoading: forecastLoading } = useExpenseForecastingWithHistory(month, year);
  const [forecastMode, setForecastMode] = useState<'monthly' | 'weekly'>('monthly');
  const [selectedWeek, setSelectedWeek] = useState(1);
  const { forecast: weeklyForecast, isLoading: weeklyLoading } = useWeeklyForecasting(selectedWeek, month, year);

  if (forecastMode === 'monthly' && (forecastLoading || !forecast)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin">⏳</div>
      </div>
    );
  }

  if (forecastMode === 'weekly' && (weeklyLoading || !weeklyForecast)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin">⏳</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <Tabs value={forecastMode} onValueChange={(value) => setForecastMode(value as 'monthly' | 'weekly')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="monthly">Bulanan</TabsTrigger>
          <TabsTrigger value="weekly">Mingguan</TabsTrigger>
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
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((week) => (
                  <button
                    key={week}
                    onClick={() => setSelectedWeek(week)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      selectedWeek === week
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    Minggu {week}
                  </button>
                ))}
              </div>

              {renderWeeklyView(weeklyForecast, budgets)}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function renderMonthlyView(forecast: any, budgets: any[]) {
  // Calculate last month total from first category's historical[0]
  const lastMonthTotal = forecast.categoryForecasts.reduce((sum: any, cat: any) => sum + cat.historical[0], 0);
  const selisih = forecast.nextMonthForecast - lastMonthTotal;
  const selisihPercent = lastMonthTotal > 0 ? (selisih / lastMonthTotal) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Summary Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Total Prakiraan Bulan Ini</p>
              <p className="text-2xl font-bold font-['DM_Mono'] mt-2">{formatRupiah(forecast.nextMonthForecast)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Bulan Lalu</p>
              <p className="text-2xl font-bold font-['DM_Mono'] mt-2">{formatRupiah(lastMonthTotal)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Selisih</p>
              <p className={`text-2xl font-bold font-['DM_Mono'] mt-2 flex items-center gap-2 ${selisih > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {selisih > 0 ? '+' : ''}{formatRupiah(Math.abs(selisih))}
                {selisih > 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{selisihPercent > 0 ? '+' : ''}{Math.round(selisihPercent)}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

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
            volatility === 'Low' ? 'bg-green-50 border-green-200 text-green-700' :
            volatility === 'Medium' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
            'bg-red-50 border-red-200 text-red-700';

          return (
            <Card key={cat.category}>
              <CardContent className="pt-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getCategoryEmoji(cat.category)}</span>
                    <span className="font-semibold">{cat.category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-xs ${volatilityColor}`}>
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
                    <p className="text-xs text-muted-foreground font-medium">Bulan Lalu</p>
                    <p className="text-lg font-bold font-['DM_Mono']">{formatRupiah(cat.historical[0])}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Rata-rata 3 Bln</p>
                    <p className="text-lg font-bold font-['DM_Mono']">{formatRupiah(Math.round(avgHistorical))}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Prakiraan Bln Ini</p>
                    <p className="text-lg font-bold font-['DM_Mono']">{formatRupiah(cat.predicted)}</p>
                  </div>
                </div>

                {/* Budget Progress Bar */}
                {budgetForCategory && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Budget Progress</span>
                      <span className="text-xs font-medium">{Math.round(budgetPercent)}% dari budget</span>
                    </div>
                    <Progress value={Math.min(budgetPercent, 100)} className="h-2" />
                  </div>
                )}

                {/* Sparkline Chart */}
                <div className="mt-4 pt-4 border-t">
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
                        stroke="#8884d8"
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
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-700">
            <strong>💡 Tips:</strong> Prakiraan ini berdasarkan pola 3 bulan terakhir menggunakan weighted average.
            Badge volatilitas menunjukkan konsistensi pengeluaran kategori ini. Semakin konsisten, semakin akurat prakiraan.
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
      {/* Summary Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Prakiraan Minggu Ini</p>
              <p className="text-2xl font-bold font-['DM_Mono'] mt-2">{formatRupiah(forecast.predictedTotal)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Minggu Lalu</p>
              <p className="text-2xl font-bold font-['DM_Mono'] mt-2">{formatRupiah(forecast.lastWeekTotal)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Selisih</p>
              <p className={`text-2xl font-bold font-['DM_Mono'] mt-2 flex items-center gap-2 ${variance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {variance > 0 ? '+' : ''}{formatRupiah(Math.abs(variance))}
                {variance > 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{variancePercent > 0 ? '+' : ''}{Math.round(variancePercent)}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daily Breakdown Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Pengeluaran per Hari</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={forecast.dailyBreakdown}>
              <XAxis dataKey="day" />
              <YAxis tickFormatter={createCompactAxisFormatter()} />
              <Bar dataKey="total" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <div className="grid gap-4">
        {forecast.categoryForecasts.map((cat: any) => (
          <Card key={cat.category}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getCategoryEmoji(cat.category)}</span>
                  <span className="font-semibold">{cat.category}</span>
                </div>
                <div className={`flex items-center gap-1 ${
                  cat.trend === 'up' ? 'text-red-500' :
                  cat.trend === 'down' ? 'text-green-500' :
                  'text-gray-500'
                }`}>
                  {cat.trend === 'up' && <TrendingUp className="w-4 h-4" />}
                  {cat.trend === 'down' && <TrendingDown className="w-4 h-4" />}
                  {cat.trend === 'stable' && <Minus className="w-4 h-4" />}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Minggu Lalu</p>
                  <p className="text-lg font-bold font-['DM_Mono']">{formatRupiah(cat.lastWeekAvg)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Prakiraan Minggu Ini</p>
                  <p className="text-lg font-bold font-['DM_Mono']">{formatRupiah(cat.predicted)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Insights */}
      {forecast.insights.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="space-y-2">
              {forecast.insights.map((insight: string, idx: number) => (
                <p key={idx} className="text-sm text-blue-700">
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
