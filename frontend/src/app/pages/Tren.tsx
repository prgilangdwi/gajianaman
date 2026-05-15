import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
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
import { formatRupiah } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { subMonths, format, startOfMonth, endOfMonth } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface MonthlyPoint {
  month: string;
  income: number;
  expenses: number;
}

interface CategoryTrendPoint {
  month: string;
  [category: string]: number | string;
}

const TOP_CAT_COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ec4899'];

export default function Tren() {
  const { user } = useAuth();
  const [monthlyData, setMonthlyData] = useState<MonthlyPoint[]>([]);
  const [categoryTrend, setCategoryTrend] = useState<CategoryTrendPoint[]>([]);
  const [topCategories, setTopCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const userId = user.userId;

    async function loadTrends() {
      setIsLoading(true);
      const now = new Date();
      const months6 = Array.from({ length: 6 }, (_, i) => subMonths(now, 5 - i));
      const months3 = months6.slice(3);

      // Fetch 6 months of transactions in one query
      const rangeStart = format(startOfMonth(months6[0]), 'yyyy-MM-dd');
      const rangeEnd = format(endOfMonth(months6[5]), 'yyyy-MM-dd');

      const { data: txAll } = await supabase
        .from('transactions')
        .select('amount, type, category, date')
        .eq('user_id', userId)
        .gte('date', rangeStart)
        .lte('date', rangeEnd);

      const txList = txAll ?? [];

      // Build monthly income/expense totals
      const monthly: MonthlyPoint[] = months6.map((d) => {
        const label = format(d, 'MMM', { locale: idLocale });
        const mStr = format(d, 'yyyy-MM');
        const relevant = txList.filter((t) => t.date.startsWith(mStr));
        const income = relevant
          .filter((t) => t.type === 'income')
          .reduce((s, t) => s + Number(t.amount), 0);
        const expenses = relevant
          .filter((t) => t.type === 'expense')
          .reduce((s, t) => s + Number(t.amount), 0);
        return { month: label, income, expenses };
      });

      // Top 4 expense categories across last 3 months
      const catTotals: Record<string, number> = {};
      months3.forEach((d) => {
        const mStr = format(d, 'yyyy-MM');
        txList
          .filter((t) => t.type === 'expense' && t.date.startsWith(mStr))
          .forEach((t) => {
            catTotals[t.category] = (catTotals[t.category] ?? 0) + Number(t.amount);
          });
      });
      const top4 = Object.entries(catTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([cat]) => cat);

      // Build category trend for last 3 months
      const catTrend: CategoryTrendPoint[] = months3.map((d) => {
        const label = format(d, 'MMM', { locale: idLocale });
        const mStr = format(d, 'yyyy-MM');
        const row: CategoryTrendPoint = { month: label };
        top4.forEach((cat) => {
          row[cat] = txList
            .filter((t) => t.type === 'expense' && t.date.startsWith(mStr) && t.category === cat)
            .reduce((s, t) => s + Number(t.amount), 0);
        });
        return row;
      });

      setMonthlyData(monthly);
      setCategoryTrend(catTrend);
      setTopCategories(top4);
      setIsLoading(false);
    }

    loadTrends();
  }, [user]);

  const summary = useMemo(() => {
    if (monthlyData.length === 0) return null;
    const maxExpMonth = [...monthlyData].sort((a, b) => b.expenses - a.expenses)[0];
    const avgSpend =
      monthlyData.reduce((s, m) => s + m.expenses, 0) / monthlyData.length;
    return { maxExpMonth, avgSpend };
  }, [monthlyData]);

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

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[0, 1, 2].map((i) => (
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
      {/* Summary KPIs */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
        <CardHeader>
          <CardTitle>Income vs Pengeluaran — 6 Bulan</CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyData.every((m) => m.income === 0 && m.expenses === 0) ? (
            <p className="text-sm text-muted-foreground text-center py-12">
              Belum ada data transaksi
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={monthlyData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
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
        <CardHeader>
          <CardTitle>Breakdown Kategori — 3 Bulan Terakhir</CardTitle>
        </CardHeader>
        <CardContent>
          {topCategories.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">
              Belum ada data pengeluaran
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={categoryTrend}
                margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
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
