import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import { PrivacyAmount } from '../components/PrivacyAmount';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { useTransactions, useRecentTransactions } from '@/hooks/useTransactions';
import { useBudgets } from '@/hooks/useBudgets';
import { useGoals } from '@/hooks/useGoals';
import { useMonthFilter } from '@/hooks/useMonthFilter';
import { useWalletFilter } from '@/hooks/useWalletFilter';
import { useWallets } from '@/hooks/useWallets';
import { useAuth } from '@/hooks/useAuth';
import { formatRupiah } from '@/lib/utils';
import { format, subDays } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

const CATEGORY_META: Record<string, { emoji: string; color: string }> = {
  'Food & Dining': { emoji: '🍔', color: '#f59e0b' },
  'Food': { emoji: '🍔', color: '#f59e0b' },
  'Transport': { emoji: '🚗', color: '#3b82f6' },
  'Groceries': { emoji: '🛒', color: '#10b981' },
  'Shopping': { emoji: '🛍️', color: '#ec4899' },
  'Bills & Utilities': { emoji: '📱', color: '#8b5cf6' },
  'Bills': { emoji: '📱', color: '#8b5cf6' },
  'Health': { emoji: '🏥', color: '#ef4444' },
  'Entertainment': { emoji: '🎬', color: '#f97316' },
  'Education': { emoji: '📚', color: '#06b6d4' },
};

function getCatMeta(category: string) {
  return CATEGORY_META[category] ?? { emoji: '💰', color: '#94a3b8' };
}

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

export default function Overview() {
  const { user } = useAuth();
  const { month, year } = useMonthFilter();
  const { walletId, setWalletId } = useWalletFilter();
  const { wallets } = useWallets(user?.userId);
  const { transactions, income, expenses, isLoading } = useTransactions(month, year);
  const { transactions: recentTx } = useRecentTransactions(6);
  const { budgets } = useBudgets(month, year);
  const { goals } = useGoals();

  const filteredTransactions = walletId === 'all'
    ? transactions
    : transactions.filter((t) => t.wallet_id === walletId);

  const filteredIncome = filteredTransactions.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const filteredExpenses = filteredTransactions.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);

  const netBalance = (walletId === 'all' ? income : filteredIncome) - (walletId === 'all' ? expenses : filteredExpenses);

  // Spending by category this month
  const categorySpending = useMemo(() => {
    const map: Record<string, number> = {};
    filteredTransactions.filter((t) => t.type === 'expense').forEach((t) => {
      map[t.category] = (map[t.category] ?? 0) + Number(t.amount);
    });
    return Object.entries(map)
      .map(([name, spent]) => {
        const budget = budgets.find((b) => b.category === name)?.amount ?? 0;
        return { name, spent, budget, ...getCatMeta(name) };
      })
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 6);
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

  const kpiData = [
    { title: 'Total Income', value: formatRupiah(displayIncome), change: null, trend: 'up' as const, icon: TrendingUp, isAmount: true },
    { title: 'Total Expenses', value: formatRupiah(displayExpenses), change: null, trend: 'down' as const, icon: TrendingDown, isAmount: true },
    { title: 'Net Balance', value: formatRupiah(netBalance), change: null, trend: netBalance >= 0 ? 'up' as const : 'down' as const, icon: netBalance >= 0 ? TrendingUp : TrendingDown, isAmount: true },
    { title: 'Transactions', value: String(filteredTransactions.length), change: null, trend: 'up' as const, icon: ArrowUpRight, isAmount: false },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Wallet Filter */}
      <div className="flex flex-wrap items-center gap-3">
        <WalletFilterBar wallets={wallets} walletId={walletId} setWalletId={setWalletId} />
        {walletId !== 'all' && (() => {
          const wallet = wallets.find((w) => w.id === walletId);
          if (!wallet) return null;
          const bal = Number(wallet.initial_balance) + filteredIncome - filteredExpenses;
          return (
            <div className="text-sm text-muted-foreground">
              Estimasi saldo {wallet.name}: <PrivacyAmount value={formatRupiah(bal)} className="font-semibold text-foreground" />
            </div>
          );
        })()}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiData.map((kpi) => {
          const Icon = kpi.icon;
          const TrendIcon = kpi.trend === 'up' ? ArrowUpRight : ArrowDownRight;
          return (
            <Card key={kpi.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground">{kpi.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="font-['DM_Mono'] font-bold text-2xl">
                  {kpi.isAmount ? <PrivacyAmount value={kpi.value} /> : kpi.value}
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <TrendIcon className={`h-3 w-3 ${kpi.trend === 'up' ? 'text-success' : 'text-danger'}`} />
                  <span className="text-xs text-muted-foreground">bulan ini</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Budget Alert */}
      {overBudgetCategories.length > 0 && (
        <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-warning" />
          </div>
          <div>
            <h4 className="font-semibold text-warning-foreground">Budget Alert</h4>
            <p className="text-sm text-muted-foreground mt-1">
              {overBudgetCategories.map((c) => c.name).join(', ')} melebihi budget bulan ini.
            </p>
          </div>
        </div>
      )}

      {/* Category Progress & Donut Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Category Spending</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {categorySpending.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Belum ada pengeluaran bulan ini</p>
            ) : (
              categorySpending.map((category) => {
                const percentage = category.budget > 0 ? (category.spent / category.budget) * 100 : 0;
                const isOverBudget = category.budget > 0 && percentage > 100;
                return (
                  <div key={category.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{category.emoji}</span>
                        <span className="text-sm font-semibold">{category.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-['DM_Mono'] font-bold">
                          Rp {(category.spent / 1000).toFixed(0)}K
                        </p>
                        {category.budget > 0 && (
                          <p className="text-xs text-muted-foreground">/ Rp {(category.budget / 1000).toFixed(0)}K</p>
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
                          <div className="absolute -top-1 right-0">
                            <Badge variant="destructive" className="text-[10px] h-5">Lewat</Badge>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Donut Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Expense Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {categorySpending.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-16">Belum ada data</p>
            ) : (
              <div className="relative h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categorySpending.map((c) => ({ name: c.name, value: c.spent, color: c.color }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {categorySpending.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatRupiah(value)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="font-['DM_Mono'] font-bold text-xl">
                      <PrivacyAmount value={formatRupiah(displayExpenses)} />
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 7-Day Area Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Last 7 Days Spending</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={weeklyData}>
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(val) => `${val / 1000}K`} />
              <Tooltip
                formatter={(value: number) => [formatRupiah(value), 'Spent']}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
              />
              <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2} fill="url(#colorAmount)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Transactions & Savings Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTx.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Belum ada transaksi</p>
              ) : (
                recentTx.map((tx) => {
                  const meta = getCatMeta(tx.category);
                  return (
                    <div key={tx.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xl">
                          {meta.emoji}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{tx.note || tx.category}</p>
                          <p className="text-xs text-muted-foreground">{tx.date}</p>
                        </div>
                      </div>
                      <p className={`font-['DM_Mono'] font-bold text-sm ${tx.type === 'income' ? 'text-success' : 'text-foreground'}`}>
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
            <CardTitle>Savings Goals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {goals.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Belum ada goals. Tambahkan di halaman Goals!</p>
              ) : (
                goals.slice(0, 4).map((goal, idx) => {
                  const colors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'];
                  const color = colors[idx % colors.length];
                  const percentage = (Number(goal.saved_amount) / Number(goal.target_amount)) * 100;
                  return (
                    <div key={goal.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold">{goal.name}</h4>
                        <p className="text-sm font-semibold" style={{ color }}>
                          {Math.min(percentage, 100).toFixed(0)}%
                        </p>
                      </div>
                      <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                        <div className="absolute inset-y-0 left-0 rounded-full transition-all" style={{ width: `${Math.min(percentage, 100)}%`, backgroundColor: color }} />
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-['DM_Mono'] text-muted-foreground"><PrivacyAmount value={formatRupiah(Number(goal.saved_amount))} /></p>
                        <p className="text-xs font-['DM_Mono'] text-muted-foreground"><PrivacyAmount value={formatRupiah(Number(goal.target_amount))} /></p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Income Allocation */}
      {displayIncome > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Income Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex gap-1 h-8 rounded-full overflow-hidden">
                <div
                  className="flex items-center justify-center text-xs font-semibold text-white"
                  style={{ width: `${Math.min((displayExpenses / displayIncome) * 100, 100)}%`, backgroundColor: '#ef4444', minWidth: displayExpenses > 0 ? '2rem' : '0' }}
                >
                  {((displayExpenses / displayIncome) * 100).toFixed(0)}%
                </div>
                <div
                  className="flex items-center justify-center text-xs font-semibold text-white bg-muted-foreground/30 flex-1"
                >
                  {(((displayIncome - displayExpenses) / displayIncome) * 100).toFixed(0)}%
                </div>
              </div>
              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#ef4444]" />
                  <span className="text-xs text-muted-foreground">Expenses</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
                  <span className="text-xs text-muted-foreground">Remaining</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
