import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle, Zap, Target, Download, Loader2 } from 'lucide-react';
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
import { useMonthFilter } from '@/hooks/useMonthFilter';
import { formatRupiah } from '@/lib/utils';
import { exportLaporanToPDF } from '@/lib/pdfExport';
import { ConfidenceTooltip } from '@/components/ConfidenceTooltip';
import { SpendingComparison } from '@/components/SpendingComparison';
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
  const { transactions } = useTransactions(month, year);
  const { patterns, budgetRecommendations, forecast, hasEnoughData } = useInsights(
    transactions,
    month,
    year,
  );
  const [exporting, setExporting] = useState(false);

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const monthName = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(
        new Date(year, month - 1),
      );
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
      {/* Header with Export Button */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Laporan Keuangan</h1>
        <Button
          onClick={handleExportPDF}
          disabled={exporting}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          {exporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {exporting ? 'Mengunduh…' : 'Unduh PDF'}
        </Button>
      </div>

      {/* Content wrapper for PDF export */}
      <div id="laporan-content" className="space-y-6">
      {/* Health Score Card */}
      <Card className={`border-2 ${getHealthColor(healthScore.status)}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg">Skor Kesehatan Finansial</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-3 sm:gap-4">
            <div>
              <div className="text-4xl sm:text-5xl font-bold">{Math.round(healthScore.score)}</div>
              <p className="text-xs sm:text-sm opacity-75">/100</p>
            </div>
            <div className="flex-1">
              <p className="text-xl font-semibold mb-2">{getHealthLabel(healthScore.status)}</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    healthScore.status === 'excellent' ? 'bg-green-500' :
                    healthScore.status === 'good' ? 'bg-blue-500' :
                    healthScore.status === 'fair' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${healthScore.score}%` }}
                />
              </div>
            </div>
          </div>
          <div className="text-xs sm:text-sm">
            <p>Tabungan: <span className="font-semibold">{healthScore.savingsRate.toFixed(1)}%</span> dari pemasukan</p>
          </div>
        </CardContent>
      </Card>

      {/* Summary KPIs */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-1">
                <TrendingDown className="w-4 h-4" /> Bulan Pengeluaran Terbesar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-bold text-xl">{summary.maxExpMonth.month}</div>
              <p className="font-['DM_Mono'] text-sm text-muted-foreground">
                {formatRupiah(summary.maxExpMonth.expenses)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-1">
                <TrendingUp className="w-4 h-4" /> Rata-rata Pengeluaran
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-['DM_Mono'] font-bold text-xl">
                {formatRupiah(Math.round(summary.avgSpend))}
              </div>
              <p className="text-xs text-muted-foreground">per bulan (6 bln)</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                Kategori Dominan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-bold text-xl truncate">
                {topCategories[0] ?? '—'}
              </div>
              <p className="text-xs text-muted-foreground">3 bulan terakhir</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Income vs Expenses Line Chart (6 months) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg">Income vs Pengeluaran — 6 Bulan</CardTitle>
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
                  tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`}
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
          <CardTitle className="text-base sm:text-lg">Breakdown Kategori — 3 Bulan</CardTitle>
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
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
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
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5" /> Tren Pengeluaran — 3 Bulan Terakhir
            </CardTitle>
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
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Zap className="w-5 h-5" /> Rekomendasi Anggaran
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-4">Berdasarkan data historis + buffer 15%</p>
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
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Target className="w-5 h-5" /> Proyeksi Akhir Bulan
            </CardTitle>
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
      </div>
    </div>
  );
}
