import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { PrivacyAmount } from '../components/PrivacyAmount';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, AlertTriangle, Download } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, LineChart, Line } from 'recharts';
import { useTransactions, useRecentTransactions } from '@/hooks/useTransactions';
import { useBudgets } from '@/hooks/useBudgets';
import { useGoals } from '@/hooks/useGoals';
import { useMonthFilter } from '@/hooks/useMonthFilter';
import { useWalletFilter } from '@/hooks/useWalletFilter';
import { useWallets } from '@/hooks/useWallets';
import { useAuth } from '@/hooks/useAuth';
import { getCategoryMeta } from '@/lib/categoryMetadata';
import { formatRupiah } from '@/lib/utils';
import { format, subDays } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

function SkeletonCard() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="h-4 bg-muted rounded animate-pulse w-24 mb-3" />
        <div className="h-8 bg-muted rounded animate-pulse w-32" />
      </CardContent>
    </Card>
  );
}

function WalletFilterBar({ wallets, walletId, setWalletId }: {
  wallets: import('@/lib/supabase').Wallet[];
  walletId: string;
  setWalletId: (id: string) => void;
}) {
  if (wallets.length === 0) return null;
  return (
    <select
      value={walletId}
      onChange={(e) => setWalletId(e.target.value)}
      className="px-3 py-2 rounded-lg border bg-input text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
    >
      <option value="all">Semua Wallet</option>
      {wallets.map((w) => (
        <option key={w.id} value={w.id}>{w.name}{w.is_primary ? ' ⭐' : ''}</option>
      ))}
    </select>
  );
}

function generatePDF(month: number, year: number, displayIncome: number, displayExpenses: number, categorySpending: any[]) {
  const monthName = format(new Date(year, month - 1), 'MMMM yyyy', { locale: idLocale });
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Gajian Aman - ${monthName}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
          h1 { color: #22c55e; margin-bottom: 10px; }
          .subtitle { color: #666; margin-bottom: 30px; }
          .section { margin-bottom: 30px; page-break-inside: avoid; }
          .metrics { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 30px; }
          .metric-box { border: 1px solid #ddd; padding: 20px; border-radius: 8px; }
          .metric-label { color: #999; font-size: 12px; margin-bottom: 8px; }
          .metric-value { font-size: 24px; font-weight: bold; color: #22c55e; }
          .category-list { border-collapse: collapse; width: 100%; margin-top: 15px; }
          .category-list th { text-align: left; padding: 10px; border-bottom: 2px solid #ddd; }
          .category-list td { padding: 10px; border-bottom: 1px solid #eee; }
          .category-list tr:last-child td { border-bottom: none; }
          .total-row { font-weight: bold; background-color: #f5f5f5; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <h1>Gajian Aman</h1>
        <p class="subtitle">Monthly Report - ${monthName}</p>

        <div class="metrics">
          <div class="metric-box">
            <div class="metric-label">Pemasukan</div>
            <div class="metric-value">Rp ${(displayIncome / 1000000).toFixed(1)}jt</div>
          </div>
          <div class="metric-box">
            <div class="metric-label">Pengeluaran</div>
            <div class="metric-value">Rp ${(displayExpenses / 1000000).toFixed(1)}jt</div>
          </div>
          <div class="metric-box">
            <div class="metric-label">Sisa</div>
            <div class="metric-value">Rp ${((displayIncome - displayExpenses) / 1000000).toFixed(1)}jt</div>
          </div>
        </div>

        ${categorySpending.length > 0 ? `
          <div class="section">
            <h2>Pengeluaran per Kategori</h2>
            <table class="category-list">
              <thead>
                <tr>
                  <th>Kategori</th>
                  <th style="text-align: right;">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                ${categorySpending.map(cat => `
                  <tr>
                    <td>${cat.emoji} ${cat.name}</td>
                    <td style="text-align: right;">Rp ${(Number(cat.spent) / 1000000).toFixed(2)}jt</td>
                  </tr>
                `).join('')}
                <tr class="total-row">
                  <td>Total Pengeluaran</td>
                  <td style="text-align: right;">Rp ${(displayExpenses / 1000000).toFixed(2)}jt</td>
                </tr>
              </tbody>
            </table>
          </div>
        ` : ''}

        <div class="footer">
          <p>Generated by Gajian Aman on ${format(new Date(), 'dd MMMM yyyy', { locale: idLocale })}</p>
          <p>© 2025 Gajian Aman. Secure Finance Tracker</p>
        </div>
      </body>
    </html>
  `;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Gajian-Aman-${monthName.replace(' ', '-')}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function Overview() {
  const { user } = useAuth();
  const { month, year } = useMonthFilter();
  const { walletId, setWalletId } = useWalletFilter();
  const { wallets } = useWallets(user?.userId);
  const { transactions, income, expenses, isLoading } = useTransactions(month, year);
  const { transactions: recentTx } = useRecentTransactions(10);
  const { budgets } = useBudgets(month, year);
  const { goals } = useGoals();

  const filteredTransactions = walletId === 'all'
    ? transactions
    : transactions.filter((t) => t.wallet_id === walletId);

  const filteredIncome = filteredTransactions.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const filteredExpenses = filteredTransactions.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);

  const netBalance = (walletId === 'all' ? income : filteredIncome) - (walletId === 'all' ? expenses : filteredExpenses);

  // Top categories with budget
  const categorySpending = useMemo(() => {
    const map: Record<string, number> = {};
    filteredTransactions.filter((t) => t.type === 'expense').forEach((t) => {
      map[t.category] = (map[t.category] ?? 0) + Number(t.amount);
    });
    return Object.entries(map)
      .map(([name, spent]) => {
        const budget = budgets.find((b) => b.category === name)?.amount ?? 0;
        return { name, spent, budget, ...getCategoryMeta(name) };
      })
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 5);
  }, [filteredTransactions, budgets]);

  // 7-day spending chart
  const weeklyData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const amount = filteredTransactions
        .filter((t) => t.type === 'expense' && t.date === dateStr)
        .reduce((s, t) => s + Number(t.amount), 0);
      return { day: format(d, 'EEE', { locale: idLocale }), amount };
    });
  }, [filteredTransactions]);

  const overBudgetCategories = categorySpending.filter(
    (c) => c.budget > 0 && c.spent > c.budget,
  );

  const displayIncome = walletId === 'all' ? income : filteredIncome;
  const displayExpenses = walletId === 'all' ? expenses : filteredExpenses;

  // Quick insight
  const getQuickInsight = () => {
    if (displayIncome === 0) return 'Mulai log pemasukan Anda untuk melihat insight.';
    if (displayExpenses === 0) return 'Belum ada pengeluaran bulan ini. Mulai tracking pengeluaran!';
    const savingsRate = ((displayIncome - displayExpenses) / displayIncome) * 100;
    if (savingsRate >= 50) return `✨ Luar biasa! Anda menyimpan ${savingsRate.toFixed(0)}% dari income.`;
    if (savingsRate >= 30) return `👍 Bagus! Anda menyimpan ${savingsRate.toFixed(0)}% dari income.`;
    if (savingsRate >= 10) return `💡 Anda menyimpan ${savingsRate.toFixed(0)}% dari income. Coba tingkatkan lagi!`;
    return '⚠️ Pengeluaran melebihi pemasukan. Yuk optimalkan budget Anda!';
  };

  if (isLoading) {
    return (
      <div className="space-y-3 sm:space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
          {[0, 1, 2].map((i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with Export Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">Overview</h1>
          <p className="text-sm text-muted-foreground">
            {format(new Date(year, month - 1), 'MMMM yyyy', { locale: idLocale })}
          </p>
        </div>
        <Button
          onClick={() => generatePDF(month, year, displayIncome, displayExpenses, categorySpending)}
          className="gap-2 w-full sm:w-auto"
          variant="outline"
        >
          <Download className="w-4 h-4" />
          Export PDF
        </Button>
      </div>

      {/* Wallet Filter */}
      {wallets.length > 0 && (
        <WalletFilterBar wallets={wallets} walletId={walletId} setWalletId={setWalletId} />
      )}

      {/* Three Main KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card className="border-l-4 border-l-success">
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground mb-2">Pemasukan</p>
            <div className="flex items-center justify-between">
              <div className="font-['DM_Mono'] font-bold text-2xl text-success">
                <PrivacyAmount value={formatRupiah(displayIncome)} />
              </div>
              <TrendingUp className="w-5 h-5 text-success/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-danger">
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground mb-2">Pengeluaran</p>
            <div className="flex items-center justify-between">
              <div className="font-['DM_Mono'] font-bold text-2xl text-danger">
                <PrivacyAmount value={formatRupiah(displayExpenses)} />
              </div>
              <TrendingDown className="w-5 h-5 text-danger/50" />
            </div>
          </CardContent>
        </Card>

        <Card className={`border-l-4 ${netBalance >= 0 ? 'border-l-primary' : 'border-l-warning'}`}>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground mb-2">Saldo Netto</p>
            <div className="flex items-center justify-between">
              <div className={`font-['DM_Mono'] font-bold text-2xl ${netBalance >= 0 ? 'text-primary' : 'text-warning'}`}>
                <PrivacyAmount value={formatRupiah(netBalance)} />
              </div>
              {netBalance >= 0 ? (
                <ArrowUpRight className="w-5 h-5 text-primary/50" />
              ) : (
                <ArrowDownRight className="w-5 h-5 text-warning/50" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Insight */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="pt-6">
          <p className="text-sm leading-relaxed">{getQuickInsight()}</p>
        </CardContent>
      </Card>

      {/* Budget Alert */}
      {overBudgetCategories.length > 0 && (
        <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-warning/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <AlertTriangle className="w-4 h-4 text-warning" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-sm text-warning-foreground">Waspada Budget</h4>
            <p className="text-sm text-muted-foreground mt-1">
              {overBudgetCategories.map((c) => `${c.name}`).join(', ')} sudah melebihi budget bulan ini.
            </p>
          </div>
        </div>
      )}

      {/* Spending Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Trend Pengeluaran (7 Hari)</CardTitle>
        </CardHeader>
        <CardContent>
          {weeklyData.some(d => d.amount > 0) ? (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={weeklyData}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `${val / 1000}K`} />
                <Tooltip formatter={(value: number) => [formatRupiah(value), 'Pengeluaran']} />
                <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2} fill="url(#colorAmount)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Belum ada pengeluaran dalam 7 hari terakhir</p>
          )}
        </CardContent>
      </Card>

      {/* Top Categories by Spending */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pengeluaran per Kategori</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {categorySpending.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Belum ada pengeluaran bulan ini</p>
          ) : (
            categorySpending.map((category) => {
              const percentage = category.budget > 0 ? (category.spent / category.budget) * 100 : 0;
              const isOverBudget = category.budget > 0 && percentage > 100;
              return (
                <div key={category.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{category.emoji}</span>
                      <span className="text-sm font-medium">{category.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-['DM_Mono'] font-semibold">
                        <PrivacyAmount value={formatRupiah(Number(category.spent))} />
                      </p>
                      {category.budget > 0 && (
                        <p className="text-xs text-muted-foreground">
                          / <PrivacyAmount value={formatRupiah(category.budget)} />
                        </p>
                      )}
                    </div>
                  </div>
                  {category.budget > 0 && (
                    <div className="relative">
                      <Progress
                        value={Math.min(percentage, 100)}
                        className="h-2"
                        style={{ '--progress-background': category.color } as React.CSSProperties}
                      />
                      {isOverBudget && (
                        <Badge variant="destructive" className="absolute -top-1 right-0 text-[10px] h-5">Lewat</Badge>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Recent Transactions & Goals Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Transaksi Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentTx.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Belum ada transaksi</p>
              ) : (
                recentTx.slice(0, 5).map((tx) => {
                  const meta = getCategoryMeta(tx.category);
                  return (
                    <div key={tx.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{meta.emoji}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{tx.note || tx.category}</p>
                          <p className="text-xs text-muted-foreground">{tx.date}</p>
                        </div>
                      </div>
                      <p className={`font-['DM_Mono'] font-semibold text-sm flex-shrink-0 ml-2 ${tx.type === 'income' ? 'text-success' : 'text-foreground'}`}>
                        {tx.type === 'income' ? '+' : '-'}<PrivacyAmount value={formatRupiah(Number(tx.amount))} />
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Savings Goals */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Target Tabungan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {goals.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Belum ada target. Buat target di halaman Goals!</p>
            ) : (
              goals.slice(0, 4).map((goal, idx) => {
                const colors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'];
                const color = colors[idx % colors.length];
                const percentage = (Number(goal.saved_amount) / Number(goal.target_amount)) * 100;
                return (
                  <div key={goal.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium truncate">{goal.name}</h4>
                      <span className="text-sm font-semibold flex-shrink-0 ml-2" style={{ color }}>
                        {Math.min(percentage, 100).toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={Math.min(percentage, 100)} className="h-2" style={{ '--progress-background': color } as React.CSSProperties} />
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
