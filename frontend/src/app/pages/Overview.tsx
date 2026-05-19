import { useMemo } from 'react';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { PrivacyAmount } from '../components/PrivacyAmount';
import { TrendingUp, TrendingDown, ArrowUpRight, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { useTransactions, useRecentTransactions } from '@/hooks/useTransactions';
import { useBudgets } from '@/hooks/useBudgets';
import { useMonthFilter } from '@/hooks/useMonthFilter';
import { useWalletFilter } from '@/hooks/useWalletFilter';
import { useWallets } from '@/hooks/useWallets';
import { useAuth } from '@/hooks/useAuth';
import { useRecurringBills } from '@/hooks/useRecurringBills';
import { UpcomingBillsWidget } from '../components/UpcomingBillsWidget';
import { TextPositive, TextNegative, TextLink } from '../components/Markup';
import { getCategoryMeta } from '@/lib/categoryMetadata';
import { formatRupiah, cn } from '@/lib/utils';
import { createCompactAxisFormatter } from '@/lib/chartFormatters';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { pageEnter, staggerChildren, fadeUp, useReducedMotion } from '@/lib/transitions';

function SkeletonCard() {
  return (
    <div className="h-24 bg-[var(--color-bg-neutral)] rounded-[var(--radius-xl)] animate-pulse" />
  );
}

function WalletChips({ wallets, walletId, setWalletId }: {
  wallets: import('@/lib/supabase').Wallet[];
  walletId: string;
  setWalletId: (id: string) => void;
}) {
  if (wallets.length === 0) return null;
  const chips = [
    { id: 'all', label: 'Semua' },
    ...wallets.map(w => ({ id: w.id, label: `${w.name}${w.is_primary ? ' ⭐' : ''}` }))
  ];

  return (
    <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
      <div className="flex gap-2 pb-2">
        {chips.map((chip) => (
          <button
            key={chip.id}
            onClick={() => setWalletId(chip.id)}
            className={cn(
              'whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors border',
              walletId === chip.id
                ? 'bg-[var(--color-brand-primary)] text-[var(--color-brand-primary-fg)] border-[var(--color-brand-primary)]'
                : 'border-[var(--color-border-neutral)] text-[var(--color-content-secondary)] hover:border-[var(--color-brand-primary)]'
            )}
          >
            {chip.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function TrendChip({ current, previous }: { current: number; previous: number }) {
  if (previous === 0) return null;
  const change = ((current - previous) / previous) * 100;
  const isPositive = change > 0;

  return (
    <div className={cn(
      'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
      isPositive
        ? 'bg-[var(--color-sentiment-positive-bg)]'
        : 'bg-[var(--color-sentiment-negative-bg)]'
    )}>
      {isPositive ? (
        <ArrowUpRight className="w-3 h-3" />
      ) : (
        <TrendingDown className="w-3 h-3" />
      )}
      <span className={isPositive ? 'text-[var(--color-sentiment-positive)]' : 'text-[var(--color-sentiment-negative)]'}>
        {Math.abs(change).toFixed(1)}%
      </span>
    </div>
  );
}

function generatePDF(month: number, year: number, displayIncome: number, displayExpenses: number) {
  const monthName = format(new Date(year, month - 1), 'MMMM yyyy', { locale: idLocale });
  const balance = displayIncome - displayExpenses;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Gajian Aman - ${monthName}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
          h1 { color: #4AE54A; margin-bottom: 10px; }
          .metrics { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin: 30px 0; }
          .metric-box { border: 1px solid #ddd; padding: 20px; border-radius: 8px; }
          .metric-label { color: #999; font-size: 12px; margin-bottom: 8px; }
          .metric-value { font-size: 24px; font-weight: bold; color: #4AE54A; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <h1>Gajian Aman</h1>
        <p>Monthly Report - ${monthName}</p>
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
            <div class="metric-label">Saldo</div>
            <div class="metric-value">Rp ${(balance / 1000000).toFixed(1)}jt</div>
          </div>
        </div>
        <div class="footer">
          <p>Generated by Gajian Aman on ${format(new Date(), 'dd MMMM yyyy', { locale: idLocale })}</p>
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
  const { recurringBills } = useRecurringBills();
  const prefersReduced = useReducedMotion();

  const filteredTransactions = walletId === 'all'
    ? transactions
    : transactions.filter((t) => t.wallet_id === walletId);

  const filteredIncome = filteredTransactions.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const filteredExpenses = filteredTransactions.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);

  const displayIncome = walletId === 'all' ? income : filteredIncome;
  const displayExpenses = walletId === 'all' ? expenses : filteredExpenses;
  const saldo = displayIncome - displayExpenses;

  // Previous month data for trend
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const { transactions: prevTransactions, income: prevIncome, expenses: prevExpenses } = useTransactions(prevMonth, prevYear);

  const prevFilteredIncome = walletId === 'all'
    ? prevIncome
    : prevTransactions.filter((t) => t.type === 'income' && t.wallet_id === walletId).reduce((s, t) => s + Number(t.amount), 0);

  // Monthly chart data (simplified - 4 weeks)
  const monthlyChartData = useMemo(() => {
    const weeks = Array.from({ length: 4 }, (_, weekIdx) => {
      const start = startOfMonth(new Date(year, month - 1));
      const weekStart = new Date(start);
      weekStart.setDate(start.getDate() + weekIdx * 7);

      let income = 0, expense = 0;
      for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);
        const dateStr = format(date, 'yyyy-MM-dd');

        const txs = filteredTransactions.filter((t) => t.date === dateStr);
        income += txs.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
        expense += txs.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
      }

      return {
        week: `W${weekIdx + 1}`,
        income,
        expense,
      };
    });
    return weeks;
  }, [filteredTransactions, month, year]);

  if (isLoading) {
    return (
      <motion.div
        initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => <SkeletonCard key={i} />)}
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-content-primary)]">Overview</h1>
          <p className="text-sm text-[var(--color-content-tertiary)] mt-1">
            {format(new Date(year, month - 1), 'MMMM yyyy', { locale: idLocale })}
          </p>
        </div>
        <Button
          type="button"
          onClick={() => generatePDF(month, year, displayIncome, displayExpenses)}
          className="gap-2 w-full sm:w-auto"
          variant="outline"
        >
          <Download className="w-4 h-4" />
          Export PDF
        </Button>
      </div>

      {/* Wallet Chips */}
      {wallets.length > 0 && (
        <WalletChips wallets={wallets} walletId={walletId} setWalletId={setWalletId} />
      )}

      {/* Summary Cards Grid - Desktop: 3 cols, Mobile: 1 col */}
      <motion.div
        initial={prefersReduced ? { opacity: 0 } : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ staggerChildren: prefersReduced ? 0 : 0.05, delay: prefersReduced ? 0 : 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {/* Saldo Card */}
        <motion.div
          initial={prefersReduced ? { opacity: 0 } : fadeUp.initial}
          animate={prefersReduced ? { opacity: 1 } : fadeUp.animate}
          transition={fadeUp.transition}
        >
          <Card className="bg-[var(--color-bg-card)] border-[var(--color-border-neutral)]">
            <CardContent className="pt-6">
              <p className="text-xs text-[var(--color-content-tertiary)] font-medium mb-2">Total Saldo</p>
              <div className="flex items-center justify-between mb-3">
                <div className="font-mono text-2xl md:text-3xl font-bold text-[var(--color-content-primary)]">
                  <PrivacyAmount value={formatRupiah(saldo)} />
                </div>
              </div>
              <TrendChip current={displayIncome} previous={prevFilteredIncome} />
            </CardContent>
          </Card>
        </motion.div>

        {/* Pemasukan Card */}
        <motion.div
          initial={prefersReduced ? { opacity: 0 } : fadeUp.initial}
          animate={prefersReduced ? { opacity: 1 } : fadeUp.animate}
          transition={fadeUp.transition}
        >
          <Card className="border-l-4 border-l-[var(--color-sentiment-positive)] bg-[var(--color-bg-card)]">
            <CardContent className="pt-6">
              <p className="text-xs text-[var(--color-content-tertiary)] font-medium mb-2">Pemasukan</p>
              <div className="font-mono text-2xl md:text-3xl font-bold">
                <TextPositive>
                  <PrivacyAmount value={formatRupiah(displayIncome)} />
                </TextPositive>
              </div>
              <TrendingUp className="w-5 h-5 text-[var(--color-sentiment-positive)] mt-2 opacity-40" />
            </CardContent>
          </Card>
        </motion.div>

        {/* Pengeluaran Card */}
        <motion.div
          initial={prefersReduced ? { opacity: 0 } : fadeUp.initial}
          animate={prefersReduced ? { opacity: 1 } : fadeUp.animate}
          transition={fadeUp.transition}
        >
          <Card className="border-l-4 border-l-[var(--color-sentiment-negative)] bg-[var(--color-bg-card)]">
            <CardContent className="pt-6">
              <p className="text-xs text-[var(--color-content-tertiary)] font-medium mb-2">Pengeluaran</p>
              <div className="font-mono text-2xl md:text-3xl font-bold">
                <TextNegative>
                  <PrivacyAmount value={formatRupiah(displayExpenses)} />
                </TextNegative>
              </div>
              <TrendingDown className="w-5 h-5 text-[var(--color-sentiment-negative)] mt-2 opacity-40" />
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Desktop: Chart + Upcoming Bills | Mobile: Full-width Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart - 2 columns on desktop, 1 on mobile */}
        <motion.div
          initial={prefersReduced ? { opacity: 0 } : fadeUp.initial}
          animate={prefersReduced ? { opacity: 1 } : fadeUp.animate}
          transition={fadeUp.transition}
          className="lg:col-span-2"
        >
          <Card className="bg-[var(--color-bg-card)] border-[var(--color-border-neutral)]">
            <CardHeader>
              <h3 className="text-base font-semibold text-[var(--color-content-primary)]">Income vs Expense</h3>
            </CardHeader>
            <CardContent>
              {monthlyChartData.some(d => d.income > 0 || d.expense > 0) ? (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={monthlyChartData}>
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-sentiment-positive)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--color-sentiment-positive)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-sentiment-negative)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--color-sentiment-negative)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="week" stroke="var(--color-content-tertiary)" fontSize={12} />
                    <YAxis stroke="var(--color-content-tertiary)" fontSize={12} tickFormatter={createCompactAxisFormatter()} />
                    <Tooltip
                      formatter={(value: number) => formatRupiah(value)}
                      contentStyle={{ backgroundColor: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-neutral)' }}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="income" stroke="var(--color-sentiment-positive)" strokeWidth={2} fill="url(#colorIncome)" name="Income" isAnimationActive={!prefersReduced} />
                    <Area type="monotone" dataKey="expense" stroke="var(--color-sentiment-negative)" strokeWidth={2} fill="url(#colorExpense)" name="Expense" isAnimationActive={!prefersReduced} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-[var(--color-content-tertiary)] text-center py-8">Belum ada data bulan ini</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Upcoming Bills - 1 column on desktop */}
        <motion.div
          initial={prefersReduced ? { opacity: 0 } : fadeUp.initial}
          animate={prefersReduced ? { opacity: 1 } : fadeUp.animate}
          transition={fadeUp.transition}
        >
          <UpcomingBillsWidget recurringBills={recurringBills} isLoading={false} />
        </motion.div>
      </div>

      {/* Recent Transactions */}
      <motion.div
        initial={prefersReduced ? { opacity: 0 } : fadeUp.initial}
        animate={prefersReduced ? { opacity: 1 } : fadeUp.animate}
        transition={fadeUp.transition}
      >
        <Card className="bg-[var(--color-bg-card)] border-[var(--color-border-neutral)]">
          <CardHeader>
            <h3 className="text-base font-semibold text-[var(--color-content-primary)]">Transaksi Terbaru</h3>
          </CardHeader>
          <CardContent>
            {recentTx.length === 0 ? (
              <p className="text-sm text-[var(--color-content-tertiary)] text-center py-6">Belum ada transaksi</p>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {recentTx.slice(0, 5).map((tx, idx) => {
                    const meta = getCategoryMeta(tx.category);
                    return (
                      <motion.div
                        key={tx.id}
                        initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
                        animate={prefersReduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
                        transition={{ delay: prefersReduced ? 0 : idx * 0.05 }}
                        className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-bg-screen)] border border-[var(--color-border-neutral)]"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="text-lg flex-shrink-0">{meta.emoji}</span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[var(--color-content-primary)] truncate">{tx.note || tx.category}</p>
                            <p className="text-xs text-[var(--color-content-tertiary)]">{format(new Date(tx.date), 'dd MMM', { locale: idLocale })}</p>
                          </div>
                        </div>
                        <div className="font-mono font-semibold text-sm flex-shrink-0 ml-2">
                          {tx.type === 'income' ? (
                            <TextPositive>
                              +<PrivacyAmount value={formatRupiah(Number(tx.amount))} />
                            </TextPositive>
                          ) : (
                            <TextNegative>
                              −<PrivacyAmount value={formatRupiah(Number(tx.amount))} />
                            </TextNegative>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
            {recentTx.length > 5 && (
              <div className="mt-4 text-center">
                <a href="/riwayat" className="text-sm">
                  <TextLink>Lihat semua →</TextLink>
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
