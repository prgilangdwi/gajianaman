import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
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
import { formatRupiah } from '@/lib/utils';
import { createCompactAxisFormatter } from '@/lib/chartFormatters';
import { exportLaporanToPDF } from '@/lib/pdfExport';
import { ConfidenceTooltip } from '@/components/ConfidenceTooltip';
import { SpendingComparison } from '@/components/SpendingComparison';
import { FinancialHealthGauge } from '@/app/components/FinancialHealthGauge';
import type { MonthlyPoint, CategoryTrendPoint } from '@/hooks/data/useLaporanData';

interface HealthScore {
  score: number;
  savingsRate: number;
  status: 'excellent' | 'good' | 'fair' | 'needs-work';
}

const TOP_CAT_COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ec4899'];

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

export default function Laporan() {
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

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: { name: string; value: number; color: string }[];
    label?: string;
  }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-card border rounded-xl p-3 shadow-md text-sm space-y-1">
        <p className="font-semibold text-foreground">{label}</p>
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.color }}>
            {p.name}: {formatRupiah(p.value)}
          </p>
        ))}
      </div>
    );
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-50 border-green-200 text-green-900';
      case 'good': return 'bg-blue-50 border-blue-200 text-blue-900';
      case 'fair': return 'bg-yellow-50 border-yellow-200 text-yellow-900';
      default: return 'bg-red-50 border-red-200 text-red-900';
    }
  };

  const getHealthLabel = (status: string) => {
    switch (status) {
      case 'excellent': return 'Sangat Baik! 🎉';
      case 'good': return 'Baik 👍';
      case 'fair': return 'Cukup ⚠️';
      default: return 'Perlu Perbaikan 📈';
    }
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
      {/* Premium Header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">📊 Analytics & Insights</h1>
            <p className="text-sm text-muted-foreground mt-1">Analisis mendalam untuk pemahaman finansial yang lebih baik</p>
          </div>
          <Button
            onClick={handleExportPDF}
            disabled={exporting}
            variant="outline"
            size="sm"
            className="gap-2 flex-shrink-0"
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {exporting ? 'Mengunduh…' : 'Unduh PDF'}
          </Button>
        </div>
        {/* Period Badge */}
        <div className="inline-block">
          <Badge variant="secondary" className="text-xs font-medium">
            {monthName}
          </Badge>
        </div>
      </div>

      {/* Content wrapper for PDF export */}
      <div id="laporan-content" className="space-y-6">
      {/* Ringkasan Cepat (Quick Summary) */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground/80">⚡ Ringkasan Cepat</h2>
        <p className="text-xs text-muted-foreground">Snapshot kinerja finansial Anda bulan ini</p>
      </div>

      {ringkasanCepat && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Average Daily Spending */}
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground mb-2">Rata-rata per hari</p>
              <p className="font-['DM_Mono'] font-bold text-xl text-blue-600">
                {formatRupiah(Math.round(ringkasanCepat.avgDailySpending))}
              </p>
              <p className="text-xs text-muted-foreground mt-1">dari {ringkasanCepat.totalTransactions} transaksi</p>
            </CardContent>
          </Card>

          {/* Busiest Day */}
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground mb-2">Hari terboros</p>
              <p className="font-semibold text-xl text-red-600 capitalize">
                {ringkasanCepat.busiestDay}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Paling banyak pengeluaran</p>
            </CardContent>
          </Card>

          {/* Total Transactions */}
          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground mb-2">Total transaksi</p>
              <p className="font-bold text-2xl text-purple-600">
                {ringkasanCepat.totalTransactions}
              </p>
              <p className="text-xs text-muted-foreground mt-1">transaksi bulan ini</p>
            </CardContent>
          </Card>

          {/* Days Without Spending */}
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground mb-2">Hari tanpa pengeluaran</p>
              <p className="font-bold text-2xl text-green-600">
                {ringkasanCepat.daysWithoutSpending}
              </p>
              <p className="text-xs text-muted-foreground mt-1">dari 30 hari</p>
            </CardContent>
          </Card>

          {/* Spending Consistency */}
          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground mb-2">Konsistensi pengeluaran</p>
              <p className="font-bold text-xl text-amber-600">
                {ringkasanCepat.spendingConsistency}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">Semakin tinggi, semakin konsisten</p>
            </CardContent>
          </Card>

          {/* Top Wallet */}
          <Card className="border-l-4 border-l-indigo-500">
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground mb-2">Dompet utama</p>
              <p className="font-semibold text-lg text-indigo-600 truncate">
                {ringkasanCepat.topWallet}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Pengeluaran terbanyak</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Financial Health Gauge */}
      <div className="space-y-3 pt-2">
        <h2 className="text-lg font-semibold text-foreground/80">💚 Skor Kesehatan Finansial</h2>
        <p className="text-xs text-muted-foreground">Penilaian komprehensif terhadap kesehatan keuangan Anda</p>
      </div>

      <FinancialHealthGauge score={healthScore} />

      {/* Premium Health Score Card */}
      <Card className={`border-l-4 ${
        healthScore.status === 'excellent' ? 'border-l-green-500 bg-gradient-to-br from-green-50/50' :
        healthScore.status === 'good' ? 'border-l-blue-500 bg-gradient-to-br from-blue-50/50' :
        healthScore.status === 'fair' ? 'border-l-yellow-500 bg-gradient-to-br from-yellow-50/50' :
        'border-l-red-500 bg-gradient-to-br from-red-50/50'
      }`}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">💚 Skor Kesehatan Finansial</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">{getHealthLabel(healthScore.status)}</p>
            </div>
            <div className="text-right">
              <div className="text-5xl font-bold">{Math.round(healthScore.score)}</div>
              <p className="text-xs text-muted-foreground">/100</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progres</span>
              <span className="font-semibold">{healthScore.score.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all duration-500 ${
                  healthScore.status === 'excellent' ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
                  healthScore.status === 'good' ? 'bg-gradient-to-r from-blue-500 to-cyan-600' :
                  healthScore.status === 'fair' ? 'bg-gradient-to-r from-yellow-500 to-amber-600' :
                  'bg-gradient-to-r from-red-500 to-rose-600'
                }`}
                style={{ width: `${healthScore.score}%` }}
              />
            </div>
          </div>

          {/* Key Metric */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Tingkat Tabungan</p>
              <p className="text-2xl font-bold">{healthScore.savingsRate.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">dari pemasukan</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground mb-1">Rekomendasi</p>
              <p className="text-sm font-medium">
                {healthScore.savingsRate >= 30 ? '✅ Optimal' : healthScore.savingsRate >= 20 ? '👍 Bagus' : healthScore.savingsRate >= 10 ? '⚠️ Perlu ditingkatkan' : '📈 Target minimal 10%'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary KPIs — Premium Style */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Highest Expense Month */}
          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Pengeluaran Puncak
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="text-2xl font-bold">{summary.maxExpMonth.month}</div>
              <div className="font-['DM_Mono'] text-lg font-semibold text-red-600">
                {formatRupiah(summary.maxExpMonth.expenses)}
              </div>
              <p className="text-xs text-muted-foreground">Bulan dengan pengeluaran tertinggi</p>
            </CardContent>
          </Card>

          {/* Average Spending */}
          <Card className="border-l-4 border-l-amber-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Rata-Rata Bulanan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="font-['DM_Mono'] font-bold text-2xl text-amber-600">
                {formatRupiah(Math.round(summary.avgSpend))}
              </div>
              <p className="text-xs text-muted-foreground">Rata-rata 6 bulan terakhir</p>
            </CardContent>
          </Card>

          {/* Top Category */}
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Kategori Dominan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="text-2xl font-bold truncate text-purple-600">
                {topCategories[0] ?? '—'}
              </div>
              <p className="text-xs text-muted-foreground">3 bulan terakhir</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Insights — AI-Powered Summary */}
      {hasEnoughData && (
        <Card className="border-l-4 border-l-cyan-500 bg-gradient-to-br from-cyan-50/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-600" /> Insight Cepat
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {patterns.length > 0 && (
              <div className="p-3 rounded-lg bg-white/60 border border-cyan-200/50">
                <p className="text-sm font-medium mb-1">📈 Tren Pengeluaran</p>
                <p className="text-sm text-muted-foreground">
                  {patterns[0].trend === 'up'
                    ? `${patterns[0].category} naik ${Math.abs(patterns[0].changePercent)}% — cek apakah ini perlu dioptimalkan.`
                    : patterns[0].trend === 'down'
                    ? `Pengeluaran ${patterns[0].category} menurun ${Math.abs(patterns[0].changePercent)}% 🎉 — pertahankan momentum!`
                    : `Pengeluaran ${patterns[0].category} stabil — monitor terus.`
                  }
                </p>
              </div>
            )}
            <div className="p-3 rounded-lg bg-white/60 border border-cyan-200/50">
              <p className="text-sm font-medium mb-1">💰 Kesehatan Finansial</p>
              <p className="text-sm text-muted-foreground">
                {healthScore.savingsRate >= 30
                  ? `Tabungan Anda ${healthScore.savingsRate.toFixed(1)}% — excellent! Pertahankan disiplin ini.`
                  : healthScore.savingsRate >= 20
                  ? `Tabungan Anda ${healthScore.savingsRate.toFixed(1)}% — bagus, coba tingkatkan jadi 25%+.`
                  : `Tabungan Anda ${healthScore.savingsRate.toFixed(1)}% — target minimum 10% untuk keamanan finansial.`
                }
              </p>
            </div>
            {forecast && (
              <div className="p-3 rounded-lg bg-white/60 border border-cyan-200/50">
                <p className="text-sm font-medium mb-1">🎯 Proyeksi Bulan</p>
                <p className="text-sm text-muted-foreground">
                  Dengan kecepatan pengeluaran {formatRupiah(forecast.dailyAverage)}/hari, bulan ini kemungkinan akan habis {formatRupiah(forecast.projectedMonthEnd)}.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Section Divider */}
      <div className="pt-2">
        <h2 className="text-lg font-semibold text-foreground/70">📈 Tren & Analisis Terperinci</h2>
        <p className="text-xs text-muted-foreground">Pemahaman mendalam tentang pola keuangan Anda</p>
      </div>

      {/* Income vs Expenses Line Chart (6 months) */}
      <Card>
        <CardHeader className="pb-3">
          <div>
            <CardTitle className="text-base sm:text-lg">Pemasukan vs Pengeluaran</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Tren 6 bulan terakhir untuk melihat pola earnings dan spending</p>
          </div>
        </CardHeader>
        <CardContent>
          {monthlyData.every((m) => m.income === 0 && m.expenses === 0) ? (
            <p className="text-sm text-muted-foreground text-center py-12">
              Belum ada data transaksi
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={monthlyData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickFormatter={createCompactAxisFormatter()}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="income"
                  name="Pemasukan"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  name="Pengeluaran"
                  stroke="#ef4444"
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

      {/* Category Breakdown Bar Chart (3 months) */}
      <Card>
        <CardHeader className="pb-3">
          <div>
            <CardTitle className="text-base sm:text-lg">Distribusi Pengeluaran per Kategori</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Identifikasi kategori mana yang paling menggerus budget Anda</p>
          </div>
        </CardHeader>
        <CardContent>
          {topCategories.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">
              Belum ada data pengeluaran
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={categoryTrend}
                margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                <YAxis
                  stroke="#94a3b8"
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
      </Card>

      {/* Spending Patterns — 3-month trend analysis */}
      {hasEnoughData && patterns.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div>
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5" /> Tren Pengeluaran per Kategori
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Kategori mana yang naik atau turun dalam 3 bulan terakhir?</p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {patterns.slice(0, 5).map((pattern) => (
                <div key={pattern.category} className="flex items-start justify-between p-3 rounded-lg bg-muted/40 border border-border/50">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{pattern.category}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Rata-rata: {formatRupiah(pattern.avgMonthly)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-semibold flex items-center gap-1 justify-end ${
                      pattern.trend === 'up' ? 'text-red-600' : pattern.trend === 'down' ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {pattern.trend === 'up' ? <TrendingUp className="w-4 h-4" /> : pattern.trend === 'down' ? <TrendingDown className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                      {Math.abs(pattern.changePercent)}%
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      vs rata-rata
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Budget Recommendations — AI-powered with confidence */}
      {hasEnoughData && budgetRecommendations.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div>
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" /> Saran Budget Optimal
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Berdasarkan data historis + buffer keamanan 15% untuk fluctuasi</p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {budgetRecommendations.map((rec) => (
                <div key={rec.category} className="flex items-start justify-between p-3 rounded-lg border border-border/50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm">{rec.category}</p>
                      <ConfidenceTooltip level={rec.confidence} transactionCount={rec.transactionCount} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Pengeluaran rata-rata: {formatRupiah(rec.avgSpending)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">{formatRupiah(rec.recommendedAmount)}</p>
                    <p className="text-xs text-muted-foreground">Anggaran yang disarankan</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Spending Forecast — projected month-end */}
      {hasEnoughData && (
        <Card>
          <CardHeader className="pb-3">
            <div>
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-500" /> Proyeksi Pengeluaran Akhir Bulan
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Estimasi berapa banyak Anda akan mengeluarkan sampai akhir bulan</p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="p-3 rounded-lg bg-muted/40 border border-border/50">
                <p className="text-xs text-muted-foreground mb-1">Sudah keluar</p>
                <p className="font-semibold text-sm">{formatRupiah(forecast.currentSpent)}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/40 border border-border/50">
                <p className="text-xs text-muted-foreground mb-1">Rata-rata/hari</p>
                <p className="font-semibold text-sm">{formatRupiah(forecast.dailyAverage)}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/40 border border-border/50">
                <p className="text-xs text-muted-foreground mb-1">Hari sisa</p>
                <p className="font-semibold text-sm">{forecast.daysRemaining} hari</p>
              </div>
              <div className="p-3 rounded-lg bg-primary/10 border-2 border-primary">
                <p className="text-xs text-muted-foreground mb-1">Proyeksi akhir</p>
                <p className="font-bold text-sm text-primary">{formatRupiah(forecast.projectedMonthEnd)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state when not enough data */}
      {!hasEnoughData && (
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">Belum cukup data untuk analisis mendalam</p>
            <p className="text-xs text-muted-foreground">Mulai catat transaksi Anda agar kami bisa memberikan rekomendasi yang lebih akurat.</p>
          </CardContent>
        </Card>
      )}

      {/* Laporan Bulanan Section (merged from MonthlyReport) */}
      {!txLoading && !budgetLoading && (
        <Collapsible open={monthlyReportOpen} onOpenChange={setMonthlyReportOpen} className="space-y-4">
          <Card>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between px-6 py-4 h-auto hover:bg-muted"
              >
                <div className="flex items-center gap-2 text-base font-semibold">
                  <Award className="w-5 h-5" />
                  Laporan Bulanan
                </div>
                <ChevronDown
                  className={`w-5 h-5 transition-transform ${monthlyReportOpen ? 'rotate-180' : ''}`}
                />
              </Button>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <CardContent className="space-y-6 pt-6 border-t">
                {/* Health Score Summary */}
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Award className="w-5 h-5" /> Skor Kesehatan Finansial
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-3xl font-bold text-blue-900">{Math.round(health.score)}</p>
                        <p className="text-sm text-blue-700 mt-1">{health.scoreGrade}</p>
                      </div>
                      <div className="space-y-2 text-sm">
                        <p><span className="text-muted-foreground">Tabungan:</span> <span className="font-semibold">{health.savingsRate.toFixed(1)}%</span></p>
                        <p><span className="text-muted-foreground">Konsistensi:</span> <span className="font-semibold">{health.spendingConsistency}%</span></p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-semibold text-muted-foreground">Pemasukan</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-lg font-bold text-green-600">
                        {formatRupiah(
                          transactions
                            .filter((t) => {
                              const d = new Date(t.date);
                              return d.getMonth() === month - 1 && d.getFullYear() === year && t.type === 'income';
                            })
                            .reduce((sum, t) => sum + Number(t.amount), 0)
                        )}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-semibold text-muted-foreground">Pengeluaran</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-lg font-bold text-red-600">
                        {formatRupiah(
                          transactions
                            .filter((t) => {
                              const d = new Date(t.date);
                              return d.getMonth() === month - 1 && d.getFullYear() === year && t.type === 'expense';
                            })
                            .reduce((sum, t) => sum + Number(t.amount), 0)
                        )}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-semibold text-muted-foreground">Kepatuhan Budget</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-lg font-bold text-blue-600">{health.budgetAdherence}%</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Over/Under Budget Categories */}
                {(health.overBudgetCategories.length > 0 || health.underBudgetCategories.length > 0) && (
                  <div className="space-y-3">
                    {health.overBudgetCategories.length > 0 && (
                      <Card className="bg-orange-50 border-orange-200">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2 text-orange-900">
                            <AlertCircle className="w-4 h-4" /> Kategori Melebihi Budget
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-1 text-sm">
                            {health.overBudgetCategories.map((cat) => (
                              <li key={cat} className="text-orange-800">• {cat}</li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}

                    {health.underBudgetCategories.length > 0 && (
                      <Card className="bg-green-50 border-green-200">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2 text-green-900">
                            <CheckCircle className="w-4 h-4" /> Kategori Terjaga Budget
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-1 text-sm">
                            {health.underBudgetCategories.map((cat) => (
                              <li key={cat} className="text-green-800">✓ {cat}</li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}
      </div>
    </div>
  );
}
