import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react';
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
import { formatRupiah } from '@/lib/utils';
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
  const { monthlyData, categoryTrend, topCategories, isLoading } = useLaporanData(user?.userId);

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
    </div>
  );
}
