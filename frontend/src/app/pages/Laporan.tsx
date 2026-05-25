import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { Button } from '../components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../components/ui/collapsible';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle, Zap, Target, Download, Loader2, Sparkles, ChevronDown, Award, Calendar, BarChart3, Wallet } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from 'recharts';
import { useAuth } from '@/hooks/useAuth';
import { useLaporanData } from '@/hooks/data/useLaporanData';
import { useTransactions } from '@/hooks/useTransactions';
import { useInsights } from '@/hooks/data/useInsights';
import { useFinancialHealth } from '@/hooks/data/useFinancialHealth';
import { useBudgets } from '@/hooks/useBudgets';
import { useWallets } from '@/hooks/useWallets';
import { useMonthFilter } from '@/hooks/useMonthFilter';
import { formatRupiah, bgColorVar, textColorVar, borderColorVar, colorVar } from '@/lib/utils';
import { createCompactAxisFormatter } from '@/lib/chartFormatters';
import { exportLaporanToPDF } from '@/lib/pdfExport';
import { ConfidenceTooltip } from '@/components/ConfidenceTooltip';
import { SpendingComparison } from '@/components/SpendingComparison';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { TrendBadge } from '@/components/ui/TrendBadge';
import { MetricCard } from '@/components/ui/MetricCard';
import type { MonthlyPoint, CategoryTrendPoint } from '@/hooks/data/useLaporanData';

interface HealthScore {
  score: number;
  savingsRate: number;
  status: 'excellent' | 'good' | 'fair' | 'needs-work';
}

const TOP_CAT_COLORS = [
  'var(--color-sentiment-warning)',
  'var(--color-brand-primary)',
  'var(--color-sentiment-positive)',
  'var(--color-sentiment-secondary)',
];

function calculateHealthScore(monthlyData: MonthlyPoint[]): HealthScore {
  if (monthlyData.length === 0) return { score: 0, savingsRate: 0, status: 'fair' };

  const totalIncome = monthlyData.reduce((s, m) => s + m.income, 0);
  const totalExpenses = monthlyData.reduce((s, m) => s + m.expenses, 0);
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

  let score = 50;
  if (savingsRate >= 30) score += 30;
  else if (savingsRate >= 20) score += 20;
  else if (savingsRate >= 10) score += 10;

  let status: 'excellent' | 'good' | 'fair' | 'needs-work' = 'fair';
  if (score >= 80) status = 'excellent';
  else if (score >= 60) status = 'good';
  else if (score >= 40) status = 'fair';
  else status = 'needs-work';

  return { score: Math.min(100, score), savingsRate, status };
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className={`${bgColorVar('bg-card')} ${borderColorVar('border-neutral')} rounded-xl p-3 shadow-md text-sm space-y-1`}>
      <p className={`font-semibold ${textColorVar('content-primary')}`}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {formatRupiah(p.value)}
        </p>
      ))}
    </div>
  );
}

function LaporanContent() {
  const { user } = useAuth();
  const { month, year } = useMonthFilter();
  const { monthlyData, categoryTrend, topCategories, isLoading } = useLaporanData(user?.userId);
  const { transactions, isLoading: txLoading } = useTransactions(month, year);
  const { budgets, isLoading: budgetLoading } = useBudgets(month, year);
  const { wallets = [], isLoading: walletsLoading } = useWallets(user?.userId);
  const { patterns, budgetRecommendations, forecast, hasEnoughData } = useInsights(
    transactions,
    month,
    year,
  );
  const health = useFinancialHealth(transactions, budgets, month, year);
  const [exporting, setExporting] = useState(false);
  const [monthlyReportOpen, setMonthlyReportOpen] = useState(false);

  const monthName = useMemo(
    () => new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(new Date(year, month - 1)),
    [year, month],
  );

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      await exportLaporanToPDF('laporan-content', {
        filename: `Laporan-Keuangan-${monthName}.pdf`,
        title: `Laporan Keuangan — ${monthName}`,
      });
      toast.success('Laporan berhasil didownload');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal export laporan');
    } finally {
      setExporting(false);
    }
  };

  const summary = useMemo(() => {
    if (monthlyData.length === 0) return null;
    const maxExpMonth = [...monthlyData].sort((a, b) => b.expenses - a.expenses)[0];
    const avgSpend = monthlyData.reduce((s, m) => s + m.expenses, 0) / monthlyData.length;
    return { maxExpMonth, avgSpend };
  }, [monthlyData]);

  const healthScore = useMemo(() => calculateHealthScore(monthlyData), [monthlyData]);

  const ringkasanCepat = useMemo(() => {
    const monthTransactions = transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() === month - 1 && d.getFullYear() === year && t.type === 'expense';
    });

    if (monthTransactions.length === 0) {
      return {
        avgDailySpending: 0,
        busiestDay: '—',
        totalTransactions: 0,
        daysWithoutSpending: 30,
        spendingConsistency: 0,
        topWallet: '—',
      };
    }

    // Daily spending totals
    const dailySpending: Record<string, { total: number; date: string }> = {};
    monthTransactions.forEach((t) => {
      const dateStr = new Date(t.date).toISOString().split('T')[0];
      if (!dailySpending[dateStr]) {
        dailySpending[dateStr] = { total: 0, date: dateStr };
      }
      dailySpending[dateStr].total += Number(t.amount);
    });

    const dailyValues = Object.values(dailySpending);
    const totalSpending = dailyValues.reduce((sum, d) => sum + d.total, 0);
    const avgDailySpending = totalSpending / 30; // Assume 30-day month

    // Busiest day
    const busiestDayData = dailyValues.reduce((max, curr) =>
      curr.total > max.total ? curr : max
    );
    const busiestDayName = new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(
      new Date(busiestDayData.date)
    );

    // Days without spending
    const daysWithSpending = new Set(dailyValues.map(d => d.date.split('-')[2]));
    const daysWithoutSpending = 30 - daysWithSpending.size;

    // Spending consistency (lower coefficient of variation = more consistent)
    const mean = dailyValues.reduce((sum, d) => sum + d.total, 0) / dailyValues.length;
    const variance = dailyValues.reduce((sum, d) => sum + Math.pow(d.total - mean, 2), 0) / dailyValues.length;
    const stdDev = Math.sqrt(variance);
    const cv = mean > 0 ? stdDev / mean : 0;
    const spendingConsistency = Math.max(0, 100 - cv * 50);

    // Top wallet
    const walletSpending: Record<string, number> = {};
    monthTransactions.forEach((t) => {
      if (t.wallet_id) {
        const wallet = wallets.find(w => w.id === t.wallet_id);
        const walletName = wallet?.name || 'Unknown';
        walletSpending[walletName] = (walletSpending[walletName] || 0) + Number(t.amount);
      }
    });
    const topWallet = Object.entries(walletSpending).length > 0
      ? Object.entries(walletSpending).sort((a, b) => b[1] - a[1])[0][0]
      : '—';

    return {
      avgDailySpending,
      busiestDay: busiestDayName,
      totalTransactions: monthTransactions.length,
      daysWithoutSpending,
      spendingConsistency: Math.round(spendingConsistency),
      topWallet,
    };
  }, [transactions, month, year, wallets]);

  const getHealthStatus = (score: number): 'safe' | 'warning' | 'over' | 'none' => {
    if (score >= 70) return 'safe';
    if (score >= 50) return 'warning';
    return 'over';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[0, 1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="h-48 bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">📊 Analytics & Insights</h1>
            <p className={`text-sm mt-1 ${textColorVar('content-tertiary')}`}>Analisis mendalam untuk pemahaman finansial yang lebih baik</p>
          </div>
          <Button
            onClick={handleExportPDF}
            disabled={exporting}
            variant="outline"
            size="sm"
            className="gap-2 flex-shrink-0"
          >
            {exporting ? (
 <Loader2 className="size-4 animate-spin" />
            ) : (
 <Download className="size-4 " />
            )}
            {exporting ? 'Mengunduh…' : 'Unduh PDF'}
          </Button>
        </div>
        <Badge variant="secondary" className="text-xs font-medium">
          {monthName}
        </Badge>
      </div>

      {/* Content wrapper for PDF export */}
      <div id="laporan-content" className="space-y-6">
      {/* KEY INSIGHTS SECTION — POSITIONED FIRST (Principle 04) */}
      {hasEnoughData && (
        <Card className={`border-l-4 ${borderColorVar('brand-primary')} ${bgColorVar('bg-elevated')}`}>
          <CardHeader className="pb-3">
            <CardTitle className={`text-base flex items-center gap-2 ${textColorVar('content-primary')}`}>
 <Sparkles className="size-5 " /> Key Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {patterns.length > 0 && (
              <div className={`p-3 rounded-lg ${bgColorVar('bg-card')} ${borderColorVar('border-neutral')}`}>
                <p className={`text-sm font-medium mb-1 ${textColorVar('content-primary')}`}>📈 Tren Pengeluaran</p>
                <p className={`text-sm ${textColorVar('content-secondary')}`}>
                  {patterns[0].trend === 'up'
                    ? `${patterns[0].category} naik ${Math.abs(patterns[0].changePercent)}% — cek apakah ini perlu dioptimalkan.`
                    : patterns[0].trend === 'down'
                    ? `Pengeluaran ${patterns[0].category} menurun ${Math.abs(patterns[0].changePercent)}% 🎉 — pertahankan momentum!`
                    : `Pengeluaran ${patterns[0].category} stabil — monitor terus.`
                  }
                </p>
              </div>
            )}
            <div className={`p-3 rounded-lg ${bgColorVar('bg-card')} ${borderColorVar('border-neutral')}`}>
              <p className={`text-sm font-medium mb-1 ${textColorVar('content-primary')}`}>💰 Kesehatan Finansial</p>
              <p className={`text-sm ${textColorVar('content-secondary')}`}>
                {healthScore.savingsRate >= 30
                  ? `Tabungan Anda ${healthScore.savingsRate.toFixed(1)}% — excellent! Pertahankan disiplin ini.`
                  : healthScore.savingsRate >= 20
                  ? `Tabungan Anda ${healthScore.savingsRate.toFixed(1)}% — bagus, coba tingkatkan jadi 25%+.`
                  : `Tabungan Anda ${healthScore.savingsRate.toFixed(1)}% — target minimum 10% untuk keamanan finansial.`
                }
              </p>
            </div>
            {forecast && (
              <div className={`p-3 rounded-lg ${bgColorVar('bg-card')} ${borderColorVar('border-neutral')}`}>
                <p className={`text-sm font-medium mb-1 ${textColorVar('content-primary')}`}>🎯 Proyeksi Bulan</p>
                <p className={`text-sm ${textColorVar('content-secondary')}`}>
                  Dengan kecepatan pengeluaran {formatRupiah(forecast.dailyAverage)}/hari, bulan ini kemungkinan akan habis {formatRupiah(forecast.projectedMonthEnd)}.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* HEALTH SCORE — LINEAR BAR (replaced gauge) */}
      <Card className={bgColorVar('bg-card')}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className={`text-lg ${textColorVar('content-primary')}`}>💚 Skor Kesehatan Finansial</CardTitle>
              <p className={`text-xs mt-1 ${textColorVar('content-tertiary')}`}>
                {healthScore.score >= 80 ? 'Sangat Baik! 🎉' : healthScore.score >= 60 ? 'Baik 👍' : healthScore.score >= 40 ? 'Cukup ⚠️' : 'Perlu Perbaikan 📈'}
              </p>
            </div>
            <div className={`text-right`}>
              <div className={`text-5xl font-bold ${textColorVar('content-primary')}`}>{Math.round(healthScore.score)}</div>
              <p className={`text-xs ${textColorVar('content-tertiary')}`}>/100</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Linear Progress Bar */}
          <ProgressBar
            progress={Math.min(100, healthScore.score)}
            status={getHealthStatus(healthScore.score)}
            label="Progres Kesehatan"
            showPercentage
          />

          {/* Key Metrics */}
          <div className={`grid grid-cols-2 gap-4 pt-2 border-t ${borderColorVar('border-neutral')}`}>
            <div>
              <p className={`text-xs mb-1 ${textColorVar('content-tertiary')}`}>Tingkat Tabungan</p>
              <p className={`text-2xl font-bold ${textColorVar('content-primary')}`}>{healthScore.savingsRate.toFixed(1)}%</p>
              <p className={`text-xs ${textColorVar('content-tertiary')}`}>dari pemasukan</p>
            </div>
            <div className="text-right">
              <p className={`text-xs mb-1 ${textColorVar('content-tertiary')}`}>Rekomendasi</p>
              <p className={`text-sm font-medium ${textColorVar('content-primary')}`}>
                {healthScore.savingsRate >= 30 ? '✅ Optimal' : healthScore.savingsRate >= 20 ? '👍 Bagus' : healthScore.savingsRate >= 10 ? '⚠️ Tingkat' : '📈 Target'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Summary KPIs using MetricCard */}
      <div className="space-y-3">
        <h2 className={`text-lg font-semibold ${textColorVar('content-primary')}`}>⚡ Ringkasan Cepat</h2>
        <p className={`text-xs ${textColorVar('content-tertiary')}`}>Snapshot kinerja finansial Anda bulan ini</p>
      </div>

      {ringkasanCepat && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <MetricCard
            label="Rata-rata per hari"
            value={formatRupiah(Math.round(ringkasanCepat.avgDailySpending))}
            icon="📊"
            subtext={`dari ${ringkasanCepat.totalTransactions} transaksi`}
            variant="default"
          />
          <MetricCard
            label="Hari terboros"
            value={ringkasanCepat.busiestDay}
            icon="🔥"
            subtext="Paling banyak pengeluaran"
            variant="warning"
          />
          <MetricCard
            label="Total transaksi"
            value={ringkasanCepat.totalTransactions.toString()}
            icon="💳"
            subtext="transaksi bulan ini"
            variant="default"
          />
          <MetricCard
            label="Hari tanpa pengeluaran"
            value={ringkasanCepat.daysWithoutSpending.toString()}
            icon="✨"
            subtext="dari 30 hari"
            variant="success"
          />
          <MetricCard
            label="Konsistensi pengeluaran"
            value={`${ringkasanCepat.spendingConsistency}%`}
            icon="📈"
            subtext="Semakin tinggi, semakin konsisten"
            variant="default"
          />
          <MetricCard
            label="Dompet utama"
            value={ringkasanCepat.topWallet}
            icon="👛"
            subtext="Pengeluaran terbanyak"
            variant="default"
          />
        </div>
      )}

      {/* Summary KPIs — Premium Style */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Highest Expense Month */}
          <Card className={`border-l-4 ${borderColorVar('sentiment-negative')}`}>
            <CardHeader className="pb-2">
              <CardTitle className={`text-xs font-semibold ${textColorVar('content-tertiary')} uppercase tracking-wide`}>
                Pengeluaran Puncak
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className={`text-2xl font-bold ${textColorVar('content-primary')}`}>{summary.maxExpMonth.month}</div>
              <div className={`font-['DM_Mono'] text-lg font-semibold ${textColorVar('sentiment-negative')}`}>
                {formatRupiah(summary.maxExpMonth.expenses)}
              </div>
              <p className={`text-xs ${textColorVar('content-tertiary')}`}>Bulan dengan pengeluaran tertinggi</p>
            </CardContent>
          </Card>

          {/* Average Spending */}
          <Card className={`border-l-4 ${borderColorVar('sentiment-warning')}`}>
            <CardHeader className="pb-2">
              <CardTitle className={`text-xs font-semibold ${textColorVar('content-tertiary')} uppercase tracking-wide`}>
                Rata-Rata Bulanan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className={`font-['DM_Mono'] font-bold text-2xl ${textColorVar('sentiment-warning')}`}>
                {formatRupiah(Math.round(summary.avgSpend))}
              </div>
              <p className={`text-xs ${textColorVar('content-tertiary')}`}>Rata-rata 6 bulan terakhir</p>
            </CardContent>
          </Card>

          {/* Top Category */}
          <Card className={`border-l-4 ${borderColorVar('brand-primary')}`}>
            <CardHeader className="pb-2">
              <CardTitle className={`text-xs font-semibold ${textColorVar('content-tertiary')} uppercase tracking-wide`}>
                Kategori Dominan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className={`text-2xl font-bold truncate ${textColorVar('brand-primary')}`}>
                {topCategories[0] ?? '—'}
              </div>
              <p className={`text-xs ${textColorVar('content-tertiary')}`}>3 bulan terakhir</p>
            </CardContent>
          </Card>
        </div>
      )}


      {/* Section Divider */}
      <div className="pt-2">
        <h2 className={`text-lg font-semibold ${textColorVar('content-primary')}`}>📈 Tren & Analisis Terperinci</h2>
        <p className={`text-xs ${textColorVar('content-tertiary')}`}>Pemahaman mendalam tentang pola keuangan Anda</p>
      </div>

      {/* Income vs Expenses Line Chart (6 months) */}
      <Card className={bgColorVar('bg-card')}>
        <CardHeader className="pb-3">
          <div>
            <CardTitle className={`text-base sm:text-lg ${textColorVar('content-primary')}`}>Pemasukan vs Pengeluaran</CardTitle>
            <p className={`text-xs mt-1 ${textColorVar('content-tertiary')}`}>Tren 6 bulan terakhir untuk melihat pola earnings dan spending</p>
          </div>
        </CardHeader>
        <CardContent>
          {monthlyData.every((m) => m.income === 0 && m.expenses === 0) ? (
            <p className={`text-sm text-center py-12 ${textColorVar('content-tertiary')}`}>
              Belum ada data transaksi
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={200} role="img" aria-label="Tren pemasukan vs pengeluaran selama 6 bulan terakhir">
              <LineChart data={monthlyData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={colorVar('border-neutral')} />
                <XAxis dataKey="month" stroke={colorVar('content-tertiary')} fontSize={12} />
                <YAxis
                  stroke={colorVar('content-tertiary')}
                  fontSize={11}
                  tickFormatter={createCompactAxisFormatter()}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="income"
                  name="Pemasukan"
                  stroke={colorVar('sentiment-positive')}
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  name="Pengeluaran"
                  stroke={colorVar('sentiment-negative')}
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Spending Comparison */}
      {monthlyData.length >= 2 && (
        <SpendingComparison
          currentMonth={monthlyData[0]?.expenses || 0}
          previousMonth={monthlyData[1]?.expenses || 0}
          monthLabel={monthlyData[0]?.month || '—'}
        />
      )}

      {/* Category Breakdown Bar Chart (3 months) — Collapsible */}
      <Collapsible defaultOpen className="space-y-4">
        <Card className={bgColorVar('bg-card')}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between px-6 py-4 h-auto hover:bg-muted"
            >
              <div className={`flex items-center gap-2 text-base font-semibold ${textColorVar('content-primary')}`}>
 <BarChart3 className="size-5 " />
                Distribusi Pengeluaran per Kategori
              </div>
 <ChevronDown className="size-5 transition-transform" />
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="space-y-4 pt-6 border-t">
              {topCategories.length === 0 ? (
                <p className={`text-sm text-center py-12 ${textColorVar('content-tertiary')}`}>
                  Belum ada data pengeluaran
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={250} role="img" aria-label="Distribusi pengeluaran berdasarkan kategori utama dalam 3 bulan terakhir">
                  <BarChart
                    data={categoryTrend}
                    margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={colorVar('border-neutral')} />
                    <XAxis dataKey="month" stroke={colorVar('content-tertiary')} fontSize={12} />
                    <YAxis
                      stroke={colorVar('content-tertiary')}
                      fontSize={11}
                      tickFormatter={createCompactAxisFormatter()}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    {topCategories.map((cat, i) => (
                      <Bar
                        key={cat}
                        dataKey={cat}
                        name={cat}
                        fill={TOP_CAT_COLORS[i]}
                        radius={[3, 3, 0, 0]}
                        stackId="a"
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Spending Patterns — 3-month trend analysis — Collapsible */}
      {hasEnoughData && patterns.length > 0 && (
        <Collapsible defaultOpen={false}>
          <Card className={bgColorVar('bg-card')}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between px-6 py-4 h-auto hover:bg-muted"
              >
                <div className={`flex items-center gap-2 text-base font-semibold ${textColorVar('content-primary')}`}>
 <TrendingUp className="size-5 " />
                  Tren Pengeluaran per Kategori
                </div>
 <ChevronDown className="size-5 transition-transform" />
              </Button>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <CardContent className="space-y-3 pt-6 border-t">
                {patterns.slice(0, 5).map((pattern) => (
                  <div key={pattern.category} className={`flex items-start justify-between p-3 rounded-lg ${bgColorVar('bg-neutral')} ${borderColorVar('border-neutral')}`}>
                    <div className="flex-1">
                      <p className={`font-medium text-sm ${textColorVar('content-primary')}`}>{pattern.category}</p>
                      <p className={`text-xs mt-0.5 ${textColorVar('content-tertiary')}`}>
                        Rata-rata: {formatRupiah(pattern.avgMonthly)}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-semibold flex items-center gap-1 justify-end ${
                        pattern.trend === 'up' ? textColorVar('sentiment-negative') : pattern.trend === 'down' ? textColorVar('sentiment-positive') : textColorVar('sentiment-warning')
                      }`}>
 {pattern.trend === 'up' ? <TrendingUp className="size-4 " /> : pattern.trend === 'down' ? <TrendingDown className="size-4 " /> : <AlertCircle className="size-4 " />}
                        {Math.abs(pattern.changePercent)}%
                      </div>
                      <p className={`text-xs mt-0.5 ${textColorVar('content-tertiary')}`}>
                        vs rata-rata
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Budget Recommendations — AI-powered with confidence — Collapsible */}
      {hasEnoughData && budgetRecommendations.length > 0 && (
        <Collapsible defaultOpen={false}>
          <Card className={bgColorVar('bg-card')}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between px-6 py-4 h-auto hover:bg-muted"
              >
                <div className={`flex items-center gap-2 text-base font-semibold ${textColorVar('content-primary')}`}>
 <Zap className="size-5 " />
                  Saran Budget Optimal
                </div>
 <ChevronDown className="size-5 transition-transform" />
              </Button>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <CardContent className="space-y-3 pt-6 border-t">
                {budgetRecommendations.map((rec) => (
                  <div key={rec.category} className={`flex items-start justify-between p-3 rounded-lg ${borderColorVar('border-neutral')}`}>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className={`font-medium text-sm ${textColorVar('content-primary')}`}>{rec.category}</p>
                        <ConfidenceTooltip level={rec.confidence} transactionCount={rec.transactionCount} />
                      </div>
                      <p className={`text-xs ${textColorVar('content-tertiary')}`}>
                        Pengeluaran rata-rata: {formatRupiah(rec.avgSpending)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold text-sm ${textColorVar('content-primary')}`}>{formatRupiah(rec.recommendedAmount)}</p>
                      <p className={`text-xs ${textColorVar('content-tertiary')}`}>Anggaran yang disarankan</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Spending Forecast — projected month-end — Collapsible */}
      {hasEnoughData && (
        <Collapsible defaultOpen={false}>
          <Card className={bgColorVar('bg-card')}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between px-6 py-4 h-auto hover:bg-muted"
              >
                <div className={`flex items-center gap-2 text-base font-semibold ${textColorVar('content-primary')}`}>
 <Target className="size-5 " />
                  Proyeksi Pengeluaran Akhir Bulan
                </div>
 <ChevronDown className="size-5 transition-transform" />
              </Button>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <CardContent className="pt-6 border-t">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  <div className={`p-3 rounded-lg ${bgColorVar('bg-neutral')} ${borderColorVar('border-neutral')}`}>
                    <p className={`text-xs mb-1 ${textColorVar('content-tertiary')}`}>Sudah keluar</p>
                    <p className={`font-semibold text-sm ${textColorVar('content-primary')}`}>{formatRupiah(forecast.currentSpent)}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${bgColorVar('bg-neutral')} ${borderColorVar('border-neutral')}`}>
                    <p className={`text-xs mb-1 ${textColorVar('content-tertiary')}`}>Rata-rata/hari</p>
                    <p className={`font-semibold text-sm ${textColorVar('content-primary')}`}>{formatRupiah(forecast.dailyAverage)}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${bgColorVar('bg-neutral')} ${borderColorVar('border-neutral')}`}>
                    <p className={`text-xs mb-1 ${textColorVar('content-tertiary')}`}>Hari sisa</p>
                    <p className={`font-semibold text-sm ${textColorVar('content-primary')}`}>{forecast.daysRemaining} hari</p>
                  </div>
                  <div className={`p-3 rounded-lg border-2 ${bgColorVar('bg-brand-primary')} ${borderColorVar('brand-primary')}`}>
                    <p className={`text-xs mb-1 ${textColorVar('content-tertiary')}`}>Proyeksi akhir</p>
                    <p className={`font-bold text-sm ${textColorVar('content-primary')}`}>{formatRupiah(forecast.projectedMonthEnd)}</p>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Empty state when not enough data */}
      {!hasEnoughData && (
        <Card className={bgColorVar('bg-card')}>
          <CardContent className="py-12 text-center space-y-3">
 <AlertCircle className="size-12 mx-auto" />
            <p className={textColorVar('content-secondary')}>Belum cukup data untuk analisis mendalam</p>
            <p className={`text-xs ${textColorVar('content-tertiary')}`}>Mulai catat transaksi Anda agar kami bisa memberikan rekomendasi yang lebih akurat.</p>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
}

export default function Laporan() {
  return (
    <ErrorBoundary>
      <LaporanContent />
    </ErrorBoundary>
  );
}
