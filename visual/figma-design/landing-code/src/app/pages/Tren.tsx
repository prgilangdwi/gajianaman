import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, Award, DollarSign } from 'lucide-react';

const monthlyData = [
  { month: 'Des', income: 14500000, expenses: 9200000 },
  { month: 'Jan', income: 15200000, expenses: 8900000 },
  { month: 'Feb', income: 14800000, expenses: 9500000 },
  { month: 'Mar', income: 16000000, expenses: 8700000 },
  { month: 'Apr', income: 15500000, expenses: 9100000 },
  { month: 'Mei', income: 15000000, expenses: 8750000 },
];

const categoryTrendData = [
  { month: 'Des', food: 2400000, transport: 1300000, groceries: 1900000, shopping: 1100000 },
  { month: 'Jan', food: 2200000, transport: 1400000, groceries: 1850000, shopping: 1300000 },
  { month: 'Feb', food: 2600000, transport: 1250000, groceries: 2100000, shopping: 1200000 },
  { month: 'Mar', food: 2300000, transport: 1350000, groceries: 1800000, shopping: 1000000 },
  { month: 'Apr', food: 2450000, transport: 1200000, groceries: 1950000, shopping: 1400000 },
  { month: 'Mei', food: 2500000, transport: 1200000, groceries: 1800000, shopping: 1500000 },
];

export default function Tren() {
  const bestMonth = monthlyData.reduce((best, current) => {
    const currentSaving = current.income - current.expenses;
    const bestSaving = best.income - best.expenses;
    return currentSaving > bestSaving ? current : best;
  });

  const biggestSaving = bestMonth.income - bestMonth.expenses;

  const avgExpenses = monthlyData.reduce((sum, m) => sum + m.expenses, 0) / monthlyData.length;
  const currentMonthExpenses = monthlyData[monthlyData.length - 1].expenses;
  const topSpendingCategory = { name: 'Food', amount: 2500000 };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Best Month</CardTitle>
            <Award className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{bestMonth.month} 2026</div>
            <p className="text-xs text-muted-foreground mt-2">
              Saved{' '}
              <span className="font-['DM_Mono'] font-semibold text-success">
                Rp {(biggestSaving / 1000000).toFixed(1)}M
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Biggest Saving</CardTitle>
            <DollarSign className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="font-['DM_Mono'] font-bold text-2xl">
              Rp {(biggestSaving / 1000000).toFixed(1)}M
            </div>
            <p className="text-xs text-muted-foreground mt-2">In {bestMonth.month} 2026</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Top Spending</CardTitle>
            <TrendingUp className="h-4 w-4 text-danger" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{topSpendingCategory.name}</div>
            <p className="text-xs text-muted-foreground mt-2">
              <span className="font-['DM_Mono'] font-semibold">
                Rp {(topSpendingCategory.amount / 1000000).toFixed(1)}M
              </span>{' '}
              this month
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Income vs Expenses</CardTitle>
            <div className="flex gap-2">
              <Badge className="bg-success text-success-foreground">Income</Badge>
              <Badge className="bg-danger text-danger-foreground">Expenses</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(val) => `${val / 1000000}M`} />
              <Tooltip
                formatter={(value: number) => [`Rp ${value.toLocaleString('id-ID')}`, '']}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
              />
              <Legend />
              <Bar dataKey="income" fill="#10b981" name="Income" radius={[8, 8, 0, 0]} />
              <Bar dataKey="expenses" fill="#ef4444" name="Expenses" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Category Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={categoryTrendData}>
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(val) => `${val / 1000}K`} />
              <Tooltip
                formatter={(value: number) => [`Rp ${value.toLocaleString('id-ID')}`, '']}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="food"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Food"
              />
              <Line
                type="monotone"
                dataKey="transport"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Transport"
              />
              <Line
                type="monotone"
                dataKey="groceries"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Groceries"
              />
              <Line
                type="monotone"
                dataKey="shopping"
                stroke="#ec4899"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Shopping"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-primary/10 via-success/5 to-transparent border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-4 rounded-lg bg-card border">
            <h4 className="font-semibold mb-1">Pengeluaran Stabil</h4>
            <p className="text-sm text-muted-foreground">
              Pengeluaran bulan ini{' '}
              <span className="font-['DM_Mono'] font-semibold">
                Rp {(currentMonthExpenses / 1000000).toFixed(1)}M
              </span>{' '}
              lebih rendah dari rata-rata 6 bulan terakhir{' '}
              <span className="font-['DM_Mono'] font-semibold">Rp {(avgExpenses / 1000000).toFixed(1)}M</span>
            </p>
          </div>

          <div className="p-4 rounded-lg bg-card border">
            <h4 className="font-semibold mb-1">Best Saving Period</h4>
            <p className="text-sm text-muted-foreground">
              Bulan {bestMonth.month} 2026 adalah bulan terbaik dengan saving{' '}
              <span className="font-['DM_Mono'] font-semibold text-success">
                Rp {(biggestSaving / 1000000).toFixed(1)}M
              </span>
              . Pertahankan pola pengeluaran yang sama!
            </p>
          </div>

          <div className="p-4 rounded-lg bg-card border">
            <h4 className="font-semibold mb-1">Focus Area</h4>
            <p className="text-sm text-muted-foreground">
              Kategori <span className="font-semibold">{topSpendingCategory.name}</span> adalah pengeluaran
              terbesar bulan ini. Pertimbangkan untuk mengurangi pengeluaran di kategori ini.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
